import { randomUUID } from 'crypto';
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
const EMAILMAP_KEY = 'emailmap.json';

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
// Email map — data/emailmap.json: SHA-256(email) → contributor_id
// The hash is computed in auth.ts; only the hash ever reaches this file.
// ---------------------------------------------------------------------------

async function readEmailMap(): Promise<Record<string, string>> {
  const parsed = await readJson<Record<string, string>>(EMAILMAP_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export async function getContributorIdByHash(emailHash: string): Promise<string | null> {
  return (await readEmailMap())[emailHash] ?? null;
}

/**
 * Existing hash → returns the stored contributor_id.
 * New hash → generates a UUID contributor_id and stores the mapping.
 * Returns is_new so the verify route can pick the right redirect.
 */
export async function getOrCreateContributorId(emailHash: string): Promise<{
  contributor_id: string;
  is_new: boolean;
}> {
  const map = await readEmailMap();
  const existing = map[emailHash];
  if (existing) return { contributor_id: existing, is_new: false };

  assertWritesAllowed();
  const contributor_id = randomUUID();
  map[emailHash] = contributor_id;
  await writeJson(EMAILMAP_KEY, map);
  return { contributor_id, is_new: true };
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
  email_verified: boolean; // verified via magic link
  domain_plausible: boolean; // email domain plausibly matches claimed company size
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

  // Check 1 — work email domain
  if (options.email_verified) confidence += 0.1;
  if (options.domain_plausible) confidence += 0.05;

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
