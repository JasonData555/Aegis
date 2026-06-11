import type { SizeBucket } from './types';

// ---------------------------------------------------------------------------
// Confidence thresholds (applied to weighted effective N)
// ---------------------------------------------------------------------------
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 30,
  MEDIUM: 15,
  LOW: 8,
} as const;

// ---------------------------------------------------------------------------
// Recency weighting
// ---------------------------------------------------------------------------
export const RECENCY_MAX_MONTHS = 24;
export const RECENCY_DECAY_FACTOR = 0.4;

// ---------------------------------------------------------------------------
// FSS algorithm parameters
// ---------------------------------------------------------------------------
export const FSS_DIMINISHING_RETURNS_THRESHOLD = 13;
export const FSS_DIMINISHING_RETURNS_FACTOR = 0.5;

// ---------------------------------------------------------------------------
// K-anonymity
// ---------------------------------------------------------------------------
export const K_ANONYMITY = 15;

// Suppression order when a filter combination narrows peers below K.
// role_tier and size_bucket are never suppressed.
export const SUPPRESSION_ORDER = [
  'metro_tier',
  'company_structure',
  'industry',
  'board_frequency',
] as const;

// ---------------------------------------------------------------------------
// SI — Surface Index scoring constants
// ---------------------------------------------------------------------------

// Reporting line points (case-insensitive contains match in traction-engine)
export const REPORTING_POINTS: Record<string, number> = {
  'Board of Directors': 30,
  'CEO': 25,
  'Chief Executive': 25,
  'COO': 20,
  'President': 20,
  'Chief Operating': 20,
  'Chief Technology Officer': 15,
  'CTO': 15,
  'Chief Financial Officer': 10,
  'CFO': 10,
  'General Counsel': 10,
  'CLO': 10,
  'Chief Risk Officer': 10,
  'Chief Product Officer': 8,
  'Chief Information Officer': 5,
  'CIO': 5,
  'VP Engineering': 5,
  'VP of Engineering': 5,
};

// Board access frequency points (exact match on board_frequency field values)
export const BOARD_POINTS: Record<string, number> = {
  'At least quarterly': 25,
  'At least semi-annually': 15,
  'Semi-annually': 15,
  'At least annually': 8,
  'Annually': 8,
  'Per request': 4,
  'I do not report to the Board': 0,
  'I do not report to the Board of Directors': 0,
  "I don't report to the Board": 0,
};

// Company size points
export const SIZE_POINTS: Record<string, number> = {
  'Enterprise': 25,
  'Large': 18,
  'Mid-Market': 10,
  'Small': 5,
};

// Industry SI points by tier (empirically derived from median TC analysis, n=926)
// Lookup normalizes "X/Y" → "X / Y" before matching; unknown or null → 8 (Tier H default)
export const INDUSTRY_POINTS: Record<string, number> = {
  // Tier A — 20 pts
  'Consumer Software': 20,
  'Internet': 20,
  'FinTech': 20,
  'Food & Beverage': 20,
  // Tier B — 18 pts
  'Enterprise Software': 18,
  // Tier C — 16 pts
  'Manufacturing': 16,
  // Tier D — 15 pts
  'Retail': 15,
  'Logistics / Transportation': 15,
  'Artificial Intelligence (AI)': 15,
  'Artificial Intelligence': 15,
  // Tier E — 14 pts
  'Insurance': 14,
  'EdTech': 14,
  // Tier F — 12 pts
  'Consumer Packaged Goods': 12,
  'Industrial / Manufacturing': 12,
  'Cloud Infrastructure': 12,
  'Healthcare': 12,
  'Leisure / Hospitality': 12,
  'Financial Services': 12,
  'Cloud Security': 12,
  'Banking / Financial Services': 12,
  'Telecommunications': 12,
  // Tier G — 10 pts
  'HealthTech': 10,
  // Tier H — 8 pts (also the default for unlisted/null industries)
  'Other': 8,
  'Entertainment': 8,
  'Aerospace & Defense': 8,
  'BioTech': 8,
  // Tier I — 7 pts
  'Professional Services': 7,
  'Professional Service': 7,
  'Legal': 7,
  // Tier J — 6 pts
  'Utilities': 6,
  // Tier K — 4 pts
  'Education': 4,
  // Tier L — 3 pts
  'Government': 3,
};

export const INDUSTRY_DEFAULT_POINTS = 8;

// SI component weights (empirically optimized, n=926)
export const SI_WEIGHTS = {
  reporting: 1.0,
  board: 1.5,
  size: 2.0,
  industry: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Traction Zones
// ---------------------------------------------------------------------------
export const ZONE_MEDIAN_TC = {
  'Paragon Leader': 700000,
  'Specialist Surgeon': 577000,
  'Utility Player': 403000,
  'Generalist': 380000,
} as const;

export const ZONE_COLORS = {
  'Paragon Leader': '#2D7A6B',    // aegis-brand
  'Specialist Surgeon': '#1D9E75',
  'Utility Player': '#C4784A',    // aegis-accent
  'Generalist': '#8A9E9C',        // aegis-neutral
} as const;

// ---------------------------------------------------------------------------
// Protection (governance) reference stats — published analytical values.
// Live prevalence is computed from the matched peer set in query-engine;
// market premiums are the fixed published deltas.
// ---------------------------------------------------------------------------
export const PROTECTION_STATS = {
  accel_vest: {
    key: 'accel_vest',
    field: 'has_accel_vest',
    label: 'Accelerated Vesting — Double Trigger',
    market_premium: 362000,
    reference_prevalence: 16,
  },
  severance: {
    key: 'severance',
    field: 'has_severance',
    label: 'Pre-Negotiated Severance',
    market_premium: 351000,
    reference_prevalence: 17,
  },
  indemnification: {
    key: 'indemnification',
    field: 'has_indemnification',
    label: 'Corporate Indemnification',
    market_premium: 211000,
    reference_prevalence: 22,
  },
  do: {
    key: 'do',
    field: 'has_do',
    label: 'Directors & Officers Insurance',
    market_premium: 250000,
    reference_prevalence: 50,
  },
} as const;

// Display order: strongest comp delta first
export const PROTECTION_DISPLAY_ORDER = [
  'accel_vest',
  'severance',
  'indemnification',
  'do',
] as const;

// ---------------------------------------------------------------------------
// Contribution validation
// ---------------------------------------------------------------------------
export const CONTRIBUTION_BASE_CONFIDENCE = 0.7;
export const CONTRIBUTION_CONFIDENCE_FLOOR = 0.2;
export const CONTRIBUTION_CONFIDENCE_CEILING = 1.0;

// Implied company headcount by size bucket (team size plausibility check)
export const IMPLIED_HEADCOUNT: Record<SizeBucket, number> = {
  'Small': 125,
  'Mid-Market': 625,
  'Large': 2500,
  'Enterprise': 7500,
};

// ---------------------------------------------------------------------------
// Canonical industry list (contribution form dropdown — 30 items)
// ---------------------------------------------------------------------------
export const INDUSTRY_LIST = [
  'Aerospace & Defense',
  'Artificial Intelligence (AI)',
  'Banking / Financial Services',
  'BioTech',
  'Cloud Infrastructure',
  'Cloud Security',
  'Consumer Packaged Goods',
  'Consumer Software',
  'EdTech',
  'Education',
  'Enterprise Software',
  'Entertainment',
  'Financial Services',
  'FinTech',
  'Food & Beverage',
  'Government',
  'Healthcare',
  'HealthTech',
  'Industrial / Manufacturing',
  'Insurance',
  'Internet',
  'Legal',
  'Leisure / Hospitality',
  'Logistics / Transportation',
  'Manufacturing',
  'Other',
  'Professional Services',
  'Retail',
  'Telecommunications',
  'Utilities',
] as const;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
export const SESSION_COOKIE_NAME = 'aegis_session';
