import type { ContributionRecord, EditableProfile, ScorecardParams } from './types';

// Conversions between the live EditableProfile (held by the scorecard page
// during inline editing), the stored ContributionRecord, and the ScorecardParams
// the query engine consumes. Keeping these in one place means recompute, the
// initial server render, and the cards all agree on the field mapping.

export function profileFromContribution(c: ContributionRecord): EditableProfile {
  return {
    annual_base: c.annual_base,
    annual_bonus: c.annual_bonus,
    annual_equity: c.annual_equity,
    role_tier: c.role_tier,
    industry: c.industry,
    company_structure: c.company_structure,
    size_bucket: c.size_bucket,
    reporting_line: c.reporting_line,
    board_frequency: c.board_frequency,
    functions: c.functions,
    team_size: c.team_size,
    role_title: c.role_title,
    has_do: c.has_do,
    has_indemnification: c.has_indemnification,
    has_severance: c.has_severance,
    has_accel_vest: c.has_accel_vest,
  };
}

export function profileToParams(p: EditableProfile): ScorecardParams {
  return {
    mode: 'current',
    role_tier: p.role_tier,
    industry: p.industry,
    company_structure: p.company_structure,
    size_bucket: p.size_bucket,
    metro_tier: null,
    reporting_line: p.reporting_line,
    board_frequency: p.board_frequency,
    functions: p.functions,
    annual_base: p.annual_base,
    annual_bonus: p.annual_bonus,
    annual_equity: p.annual_equity,
    has_do: p.has_do,
    has_indemnification: p.has_indemnification,
    has_severance: p.has_severance,
    has_accel_vest: p.has_accel_vest,
  };
}
