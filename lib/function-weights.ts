import { FSS_DIMINISHING_RETURNS_FACTOR, FSS_DIMINISHING_RETURNS_THRESHOLD } from './constants';
import type { FSSLabel } from './types';

// ---------------------------------------------------------------------------
// FSS — Functional Scope Score weight tiers (empirically derived)
// The dataset spells some functions with "and" while the Aegis UI uses "&";
// both spellings are keyed so records and form selections score identically.
// ---------------------------------------------------------------------------
export const FUNCTION_WEIGHTS: Record<string, number> = {
  // Tier 1 — weight 1.5
  'Product Security / AppSec': 1.5,
  'Cloud Security': 1.5,
  'Fraud': 1.5,
  'Security Operations': 1.5,

  // Tier 2 — weight 1.2
  'Corp IT Security / Enterprise Security': 1.2,
  'GRC': 1.2,
  'AI/ML Security Engineering': 1.2,
  'Incident Response': 1.2,
  'AI Threat Intelligence and Incident Response': 1.2,
  'Information Technology / BizApps': 1.2,
  'Post-Quantum Cryptography (PQC)': 1.2,
  'Identity and Access Management / IAM': 1.2,
  'Identity & Access Management / IAM': 1.2,

  // Tier 3 — weight 1.0
  'Third Party Risk Management (TPRM)': 1.0,
  'Infrastructure Engineering / Operations': 1.0,
  'Physical Security / Executive Protection': 1.0,
  'AI Safety and Reliability': 1.0,
  'AI Safety & Reliability': 1.0,
  'AI Security and Safety': 1.0,
  'AI Security & Safety': 1.0,
  'Trust and Safety': 1.0,
  'Trust & Safety': 1.0,

  // Flagged neutral — weight 1.0, no penalty, never surfaced as "missing"
  'Enterprise Risk': 1.0,
  'Privacy': 1.0,
  'AI Ethics and Responsible Use': 1.0,
  'AI Ethics & Responsible Use': 1.0,
  'AI Governance Risk Management and Policy': 1.0,
  'AI Governance, Risk Management & Policy': 1.0,
};

export const TIER1_FUNCTIONS = [
  'Product Security / AppSec',
  'Cloud Security',
  'Fraud',
  'Security Operations',
];

export const FLAGGED_NEUTRAL_FUNCTIONS = new Set([
  'Enterprise Risk',
  'Privacy',
  'AI Ethics and Responsible Use',
  'AI Ethics & Responsible Use',
  'AI Governance Risk Management and Policy',
  'AI Governance, Risk Management & Policy',
]);

// Contribution form layout (Part 7 — three-column functional scope selector)
export const UI_FUNCTIONS = {
  technical: [
    'Product Security / AppSec',
    'Cloud Security',
    'AI/ML Security Engineering',
    'Incident Response',
    'Identity & Access Management / IAM',
    'Post-Quantum Cryptography (PQC)',
    'Infrastructure Engineering / Operations',
    'Trust & Safety',
  ],
  risk: [
    'GRC',
    'AI Threat Intelligence and Incident Response',
    'Information Technology / BizApps',
    'Third Party Risk Management (TPRM)',
    'AI Safety & Reliability',
    'AI Security & Safety',
    'Enterprise Risk',
    'Privacy',
  ],
  operations: [
    'Security Operations',
    'Fraud',
    'Corp IT Security / Enterprise Security',
    'Physical Security / Executive Protection',
    'AI Ethics & Responsible Use',
    'AI Governance, Risk Management & Policy',
  ],
} as const;

/**
 * FSS — sum of weighted function scores, heaviest first,
 * with 50% diminishing returns after function 13.
 */
export function calcFSS(selectedFunctions: string[]): number {
  const weights = selectedFunctions
    .map(fn => FUNCTION_WEIGHTS[fn] ?? 1.0)
    .sort((a, b) => b - a);

  return weights.reduce((sum, weight, index) => {
    const effective =
      index < FSS_DIMINISHING_RETURNS_THRESHOLD
        ? weight
        : weight * FSS_DIMINISHING_RETURNS_FACTOR;
    return sum + effective;
  }, 0);
}

/**
 * FSS label relative to the matched peer distribution:
 * Narrow < P25, Standard P25–P75, Broad P75–P90, Expansive > P90.
 */
export function getFSSLabel(
  score: number,
  dist: { p25: number; p75: number; p90: number },
): FSSLabel {
  if (score < dist.p25) return 'Narrow';
  if (score <= dist.p75) return 'Standard';
  if (score <= dist.p90) return 'Broad';
  return 'Expansive';
}
