// ---------------------------------------------------------------------------
// Aegis types — Traction framework naming throughout.
//   fss              → Functional Scope Score (the tire — what you bring)
//   si / SurfaceIndex → Surface Index (the road — where you deploy it)
//   surface_multiplier → 0.50–2.00 multiplier derived from SI
//   traction_score   → fss × surface_multiplier
// ---------------------------------------------------------------------------

export type RoleTier =
  | 'CISO'
  | 'VP Security'
  | 'Director'
  | 'Manager'
  | 'Head of Security'
  | 'Deputy CISO';

export type RoleClassification = 'Security Program Leader' | 'NextGen Security Leader';
export type MetroTier = 'T1' | 'T2' | 'T3';
export type CompanyStructure =
  | 'Publicly Traded'
  | 'Privately Held'
  | 'PE-Backed'
  | 'Non-Profit'
  | 'Government';
export type SizeBucket = 'Small' | 'Mid-Market' | 'Large' | 'Enterprise';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
export type FSSLabel = 'Narrow' | 'Standard' | 'Broad' | 'Expansive';

// ---------------------------------------------------------------------------
// Shared survey dataset (read-only from ../Paragon/data/survey.json)
// ---------------------------------------------------------------------------

export interface SurveyRecord {
  id: string;
  survey_date: string;
  survey_year: number;
  email: string | null; // nulled at load time — never flows past data-loader
  title: string | null;
  role_tier: RoleTier;
  location: string | null;
  metro_tier: MetroTier | null;
  industry: string | null;
  company_structure: CompanyStructure | null;
  size_bucket: SizeBucket | null;
  reporting_to: string | null;
  team_size: number | null;
  base_salary: number | null;
  bonus: number | null;
  equity: number | null;
  board_frequency: string | null;
  functions: string[];
  has_do: boolean;
  has_indemnification: boolean;
  has_severance: boolean;
  has_accel_vest: boolean;
  has_signing: boolean;
  full_quad: boolean;
  zero_quad: boolean;
  zero_protection: boolean;
  elevated_reporting: boolean;
  board_quarterly: boolean;
  board_semi: boolean;
  board_regular: boolean;
  board_no_access: boolean;
  repeat_ciso: boolean;
  first_time_ciso: boolean;
  role_classification: RoleClassification;
}

export interface WeightedRecord extends SurveyRecord {
  age_months: number;
  recency_weight: number;
}

// ---------------------------------------------------------------------------
// Traction framework
// ---------------------------------------------------------------------------

export interface SurfaceIndex {
  si_reporting: number; // reporting line points
  si_board: number; // board access points
  si_size: number; // company size points
  si_industry: number; // industry points
  si_raw: number; // weighted sum before cap
  si_score: number; // capped at 100
  surface_multiplier: number; // 0.50 to 2.00
  surface_label: string; // "Lower surface" / "Moderate surface" / "High surface" / "Very high surface"
}

export type TractionZone =
  | 'Paragon Leader'
  | 'Specialist Surgeon'
  | 'Utility Player'
  | 'Generalist';

export interface TractionScore {
  fss: number;
  surface_multiplier: number;
  traction_score: number;
}

export interface TractionResult {
  fss: number;
  fss_label: FSSLabel; // Narrow/Standard/Broad/Expansive
  fss_percentile: number; // FSS position vs peer set (drives ScopeGauge)
  surface_index: SurfaceIndex;
  traction_score: number;
  traction_zone: TractionZone;
  traction_percentile: number;
  zone_peer_fss_median: number;
  zone_peer_si_median: number;
}

// ---------------------------------------------------------------------------
// Governance / protections
// ---------------------------------------------------------------------------

export type ProtectionKey = 'do' | 'indemnification' | 'severance' | 'accel_vest';

export interface GovernanceElement {
  key: ProtectionKey;
  label: string;
  contributor_has: boolean;
  peer_prevalence: number;
  market_premium: number;
  position: 'has' | 'missing';
}

export interface GovernanceCombinationResult {
  selected_protections: ProtectionKey[];
  n_with: number;
  n_without: number;
  median_tc_with: number | null;
  median_tc_without: number | null;
  delta: number | null;
  prevalence: number;
  insufficient_data: boolean;
}

// ---------------------------------------------------------------------------
// Scorecard query
// ---------------------------------------------------------------------------

export interface ScorecardParams {
  mode: 'current' | 'prospective';
  role_tier: string;
  industry: string | null;
  company_structure: string | null;
  size_bucket: string | null;
  metro_tier: string | null;
  reporting_line: string | null;
  board_frequency: string | null;
  functions: string[];
  annual_base: number;
  annual_bonus: number | null;
  annual_equity: number | null;
  has_do: boolean;
  has_indemnification: boolean;
  has_severance: boolean;
  has_accel_vest: boolean;
}

// Live, editable superset of ScorecardParams held by the scorecard page while
// inline card editing is active. Carries everything needed to both re-query the
// benchmark (via profileToParams) and persist the contribution (team_size,
// role_title), which ScorecardParams omits.
export interface EditableProfile {
  // Compensation
  annual_base: number;
  annual_bonus: number | null;
  annual_equity: number | null;
  // Role structure
  role_tier: string;
  industry: string | null;
  company_structure: string | null;
  size_bucket: string | null;
  reporting_line: string | null;
  board_frequency: string | null;
  functions: string[];
  team_size: number | null;
  role_title: string;
  // Protections
  has_do: boolean;
  has_indemnification: boolean;
  has_severance: boolean;
  has_accel_vest: boolean;
}

export interface ScorecardResult {
  peer_n: number;
  weighted_n: number;
  confidence: ConfidenceLevel;
  suppressed: boolean;
  suppressed_attributes: string[];

  compensation: {
    base_percentile: number;
    bonus_percentile: number | null;
    equity_percentile: number | null;
    total_comp_percentile: number;
    total_comp_peer_p25: number;
    total_comp_peer_p50: number;
    total_comp_peer_p75: number;
    total_comp_peer_p90: number;
    total_comp_submitted: number;
    comp_position: 'above_market' | 'at_market' | 'below_market';
  };

  role_structure: {
    traction: TractionResult;
    team_size_peer_median: number;
    team_size_peer_range: [number, number]; // P25, P75
    reporting_line_prevalence: number;
    board_access_prevalence: number;
  };

  governance: {
    protection_count: number;
    protection_percentile: number;
    elements: GovernanceElement[];
    combination_premium: number | null;
    full_quad_distance: number;
  };

  narrative: {
    compensation_headline: string;
    structure_headline: string;
    protection_headline: string;
    traction_headline: string;
  };
}

// Returned in place of any aggregate when the peer group is below K=15
export interface SuppressedResult {
  suppressed: true;
  suppression_reason: string;
  suggestion: string;
}

// Returned when the survey dataset failed to load (0 records reached the
// engine). This is a backend/data-availability problem, NOT a privacy
// suppression — surfacing it distinctly prevents a transient outage from
// masquerading as "your peer group is too small, change your industry".
export interface DataUnavailableResult {
  data_unavailable: true;
}

// ---------------------------------------------------------------------------
// Contributions (data/contributions.json — never contains an email address)
// ---------------------------------------------------------------------------

export interface ContributionRecord {
  contributor_id: string;
  submitted_at: string; // ISO datetime
  updated_at?: string; // ISO datetime — set when an inline scorecard edit revises the record
  survey_year: number;
  role_title: string;
  role_tier: string;
  size_bucket: string;
  industry: string;
  company_structure: string;
  reporting_line: string;
  board_frequency: string;
  annual_base: number;
  annual_bonus: number | null;
  annual_equity: number | null;
  has_do: boolean;
  has_indemnification: boolean;
  has_severance: boolean;
  has_accel_vest: boolean;
  has_signing: boolean;
  signing_amount: number | null;
  functions: string[];
  team_size: number | null;
  metro_tier: string | null;
  data_version: '1.0';
  contribution_confidence: number;
  equity_entry_confirmed: boolean;
  validation_flags: string[];
}
