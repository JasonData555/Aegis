import { readJson, writeJson } from './blob-store';
import {
  CONTRIBUTION_BASE_CONFIDENCE,
  CONTRIBUTION_CONFIDENCE_CEILING,
  CONTRIBUTION_CONFIDENCE_FLOOR,
  IMPLIED_HEADCOUNT,
} from './constants';
import type { ContributionRecord, SizeBucket, SurveyRecord } from './types';

// ---------------------------------------------------------------------------
// Contribution storage — data/contributions.json
// IDENTITY SEPARATION: no email address is ever written to this file.
// Stripping is enforced here at the write layer, not just at the API route.
// ---------------------------------------------------------------------------

const CONTRIBUTIONS_KEY = 'contributions.json';

function assertWritesAllowed(): void {
  if (process.env.ALLOW_WRITES !== 'true') {
    throw new Error('Writes are disabled (ALLOW_WRITES != true)');
  }
}

export async function readContributions(): Promise<ContributionRecord[]> {
  const parsed = await readJson<ContributionRecord[]>(CONTRIBUTIONS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

const FORBIDDEN_KEYS = ['email', 'email_address', 'emailAddress', 'work_email'];

/**
 * Append a contribution. Any email-bearing key is stripped before write,
 * and the serialized output is re-checked — an email key anywhere in the
 * record aborts the write entirely.
 */
export async function addContribution(record: ContributionRecord): Promise<void> {
  assertWritesAllowed();

  const sanitized = { ...(record as unknown as Record<string, unknown>) };
  for (const key of FORBIDDEN_KEYS) delete sanitized[key];

  const serialized = JSON.stringify(sanitized);
  if (/"email[^"]*"\s*:/i.test(serialized)) {
    throw new Error('Refusing to store contribution: record contains an email field');
  }

  const contributions = await readContributions();
  contributions.push(sanitized as unknown as ContributionRecord);
  await writeJson(CONTRIBUTIONS_KEY, contributions);
}

export async function getContributionsByContributor(
  contributorId: string,
): Promise<ContributionRecord[]> {
  return (await readContributions()).filter(c => c.contributor_id === contributorId);
}

// ---------------------------------------------------------------------------
// Validation and confidence scoring (Part 7)
// Submissions are never rejected — they are flagged and weighted.
// Base 0.70; floor 0.20; ceiling 1.00.
// ---------------------------------------------------------------------------

export interface ContributionScoringInput {
  size_bucket: string;
  company_structure: string;
  annual_base: number;
  annual_bonus: number | null;
  annual_equity: number | null;
  team_size: number | null;
  has_accel_vest: boolean;
  equity_entry_confirmed: boolean;
}

export interface ContributionScoringOptions {
  linkedin_verified: boolean; // identity verified via LinkedIn OAuth
  linkedin_verified_title: string | null; // from LinkedIn profile (null under OIDC scope)
  submitted_role_tier: string; // role_tier the contributor selected
  linkedin_tenure_months: number | null; // tenure at current role (null under OIDC scope)
}

// Maps a role_tier to substrings that should appear in a consistent LinkedIn
// title. Used only when a LinkedIn title is actually available (dormant under
// the current OIDC scope, which does not return headline/title).
const ROLE_TIER_TITLE_KEYWORDS: Record<string, string[]> = {
  CISO: ['ciso', 'chief information security', 'chief security', 'chief information security officer'],
  'Deputy CISO': ['deputy ciso', 'deputy chief information security', 'deputy security'],
  'VP Security': ['vp security', 'vice president, security', 'vice president of security', 'vp, security', 'head of security'],
  'Director Security': ['director', 'security director'],
};

/**
 * True when the LinkedIn title is plausibly consistent with the submitted tier.
 * Conservative: returns true only when we have a keyword table for the tier and
 * the title contains one of its keywords.
 */
function titleMatchesTier(title: string, roleTier: string): boolean {
  const keywords = ROLE_TIER_TITLE_KEYWORDS[roleTier];
  if (!keywords) return false;
  const t = title.toLowerCase();
  return keywords.some(k => t.includes(k));
}

export interface ContributionScore {
  contribution_confidence: number;
  validation_flags: string[];
}

function meanAndSD(values: number[]): { mean: number; sd: number } {
  if (values.length === 0) return { mean: 0, sd: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, sd: Math.sqrt(variance) };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Runs checks 1–7 against the peer group (role_tier + size_bucket peers
 * from the survey dataset) and returns the final confidence and flags.
 */
export function scoreContribution(
  input: ContributionScoringInput,
  peers: SurveyRecord[],
  options: ContributionScoringOptions,
): ContributionScore {
  let confidence = CONTRIBUTION_BASE_CONFIDENCE;
  const flags: string[] = [];

  // Check 1 — LinkedIn identity verification (replaces work-email domain).
  // LinkedIn auth is a stronger signal than a verified work email: +0.15.
  if (options.linkedin_verified) confidence += 0.15;

  // Title consistency: submitted role_tier vs the LinkedIn-verified title.
  // Dormant under the OIDC scope (title is null) → neutral; fires only when a
  // title is present.
  if (options.linkedin_verified_title) {
    if (titleMatchesTier(options.linkedin_verified_title, options.submitted_role_tier)) {
      confidence += 0.1;
    } else {
      flags.push('title_mismatch');
      confidence -= 0.1;
    }
  }

  // Tenure signal: longer tenure = more accurate comp knowledge. New hires
  // (<3mo) are neutral; null (unavailable under OIDC) is neutral.
  if (options.linkedin_tenure_months != null && options.linkedin_tenure_months >= 6) {
    confidence += 0.03;
  }

  // Check 2 — base salary range vs peer group median
  const peerBases = peers
    .map(p => p.base_salary)
    .filter((v): v is number => v != null);
  if (peerBases.length > 0) {
    const { sd } = meanAndSD(peerBases);
    const med = median(peerBases);
    const distance = sd > 0 ? Math.abs(input.annual_base - med) / sd : 0;
    if (distance <= 1.5) {
      confidence += 0.05;
    } else if (distance > 3) {
      flags.push('base_salary_outlier');
      confidence -= 0.1;
    }
  }

  // Check 3 — bonus reasonableness
  if (input.annual_bonus != null && input.annual_base > 0) {
    const ratio = input.annual_bonus / input.annual_base;
    if (ratio <= 1.0) {
      confidence += 0.03;
    } else if (ratio > 1.5) {
      flags.push('bonus_high');
      confidence -= 0.05;
    }
  }

  // Check 4 — equity annual value
  if (input.annual_equity != null && input.annual_base > 0) {
    const equity = input.annual_equity;
    const smallOrMid = input.size_bucket === 'Small' || input.size_bucket === 'Mid-Market';
    if (equity <= input.annual_base * 2) {
      confidence += 0.05;
    } else if (equity > input.annual_base * 5) {
      flags.push('equity_requires_review');
      confidence -= 0.15; // regardless of confirmation
    } else if (equity > input.annual_base * 3 && smallOrMid) {
      flags.push('equity_high_relative_to_base');
      if (input.equity_entry_confirmed) {
        // Informational only — contributor explicitly confirmed
        flags.push('equity_high_confirmed_by_contributor');
      } else {
        confidence -= 0.1;
      }
    }
  }

  // Check 5 — team size plausibility
  if (input.team_size != null) {
    const implied = IMPLIED_HEADCOUNT[input.size_bucket as SizeBucket];
    if (implied) {
      const ratio = input.team_size / implied;
      if (ratio < 0.25) {
        confidence += 0.03;
      } else if (ratio > 0.4) {
        flags.push('team_size_high');
        confidence -= 0.05;
      }
    }
  }

  // Check 6 — total comp consistency
  const allPresent =
    input.annual_base > 0 && input.annual_bonus != null && input.annual_equity != null;
  if (allPresent) confidence += 0.05;

  const totalComp =
    input.annual_base + (input.annual_bonus ?? 0) + (input.annual_equity ?? 0);
  const peerTCs = peers.map(
    p => (p.base_salary ?? 0) + (p.bonus ?? 0) + (p.equity ?? 0),
  );
  if (peerTCs.length > 0) {
    const { sd } = meanAndSD(peerTCs);
    const med = median(peerTCs);
    const distance = sd > 0 ? Math.abs(totalComp - med) / sd : 0;
    if (distance <= 2) {
      confidence += 0.05;
    } else if (distance > 3) {
      flags.push('total_comp_outlier');
      confidence -= 0.1;
    }
  }

  // Check 7 — governance structure consistency
  if (
    input.has_accel_vest &&
    (input.company_structure === 'Government' || input.company_structure === 'Non-Profit')
  ) {
    flags.push('governance_structure_mismatch');
    confidence -= 0.05;
  }

  confidence = Math.min(
    CONTRIBUTION_CONFIDENCE_CEILING,
    Math.max(CONTRIBUTION_CONFIDENCE_FLOOR, confidence),
  );

  return {
    contribution_confidence: Math.round(confidence * 100) / 100,
    validation_flags: flags,
  };
}
