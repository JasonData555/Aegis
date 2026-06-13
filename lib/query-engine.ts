import { loadWeightedData } from './data-loader';
import {
  weightedEffectiveN,
  weightedPercentile,
  weightedPercentileRank,
  weightedRate,
} from './recency-weights';
import {
  CONFIDENCE_THRESHOLDS,
  PROTECTION_DISPLAY_ORDER,
  PROTECTION_STATS,
} from './constants';
import { calcFSS, getFSSLabel } from './function-weights';
import {
  calcGovernanceCombination,
  calcRecordFSS,
  calcRecordSI,
  calcSI,
  calcTractionScore,
  classifyTractionZone,
} from './traction-engine';
import { matchPeers } from './anonymization';
import { generateNarrative } from './statement-generator';
import type {
  ConfidenceLevel,
  GovernanceElement,
  ProtectionKey,
  ScorecardParams,
  ScorecardResult,
  SuppressedResult,
  TractionResult,
  WeightedRecord,
} from './types';

// ---------------------------------------------------------------------------
// Scorecard query — dual pass:
//   1. benchmark pass: percentile bands across the matched peer set
//   2. profile pass: the contributor's submitted values positioned
//      within that peer distribution
// K=15 anonymity is enforced before any aggregate is computed.
// ---------------------------------------------------------------------------

function getConfidence(weightedN: number): ConfidenceLevel {
  if (weightedN >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (weightedN >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (weightedN >= CONFIDENCE_THRESHOLDS.LOW) return 'LOW';
  return 'INSUFFICIENT';
}

function totalComp(r: WeightedRecord): number {
  return (r.base_salary ?? 0) + (r.bonus ?? 0) + (r.equity ?? 0);
}

// Percentile of a submitted value among peers' non-null values for a field
function percentileAmongNonNull(
  value: number,
  peers: WeightedRecord[],
  pick: (r: WeightedRecord) => number | null,
): number | null {
  const valid = peers
    .map(r => ({ v: pick(r), w: r.recency_weight }))
    .filter((x): x is { v: number; w: number } => x.v != null);
  if (valid.length === 0) return null;
  return weightedPercentileRank(
    value,
    valid.map(x => x.v),
    valid.map(x => x.w),
  );
}

// ---------------------------------------------------------------------------
// Reporting line and board access prevalence
// ---------------------------------------------------------------------------

function normalizeReportingTitle(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (upper.includes('BOARD') || upper.includes('AUDIT COMMITTEE')) return 'Board of Directors';
  if (upper.includes('CEO') || upper.includes('CHIEF EXECUTIVE')) return 'CEO';
  if (upper.includes('COO') || upper.includes('CHIEF OPERATING') || upper.includes('PRESIDENT')) return 'COO / President';
  if (upper.includes('CTO') || upper.includes('CHIEF TECHNOLOGY')) return 'CTO';
  if (upper.includes('CFO') || upper.includes('CHIEF FINANCIAL')) return 'CFO';
  if (upper.includes('CHIEF RISK')) return 'Chief Risk Officer';
  if (upper.includes('CHIEF PRODUCT')) return 'Chief Product Officer';
  if (upper.includes('CIO') || upper.includes('CHIEF INFORMATION OFF')) return 'CIO';
  if (upper.includes('GENERAL COUNSEL') || upper.includes('CLO') || upper === 'GC') return 'General Counsel';
  if (upper.includes('VP') && upper.includes('ENGINEERING')) return 'VP Engineering';
  return 'Other';
}

// Board access frequency rank — higher = more frequent
function boardAccessRank(boardFrequency: string | null): number {
  if (!boardFrequency) return 0;
  const lower = boardFrequency.toLowerCase();
  if (lower.includes('quarterly')) return 4;
  if (lower.includes('semi')) return 3;
  if (lower.includes('annually')) return 2;
  if (lower.includes('per request')) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Traction result vs the matched peer set
// ---------------------------------------------------------------------------

function calcTractionResult(
  params: ScorecardParams,
  peers: WeightedRecord[],
): TractionResult {
  const fss = calcFSS(params.functions);
  const surface_index = calcSI(
    params.reporting_line,
    params.board_frequency,
    params.size_bucket,
    params.industry,
  );
  const traction_score = calcTractionScore(fss, surface_index);

  const weights = peers.map(r => r.recency_weight);
  const peerFSS = peers.map(calcRecordFSS);
  const peerSI = peers.map(calcRecordSI);
  const peerTraction = peers.map(
    (r, i) => peerFSS[i] * (0.5 + (peerSI[i] / 100) * 1.5),
  );

  const zone_peer_fss_median = weightedPercentile(peerFSS, weights, 50);
  const zone_peer_si_median = weightedPercentile(peerSI, weights, 50);

  const fssDist = {
    p25: weightedPercentile(peerFSS, weights, 25),
    p75: weightedPercentile(peerFSS, weights, 75),
    p90: weightedPercentile(peerFSS, weights, 90),
  };

  return {
    fss,
    fss_label: getFSSLabel(fss, fssDist),
    fss_percentile: weightedPercentileRank(fss, peerFSS, weights),
    surface_index,
    traction_score,
    traction_zone: classifyTractionZone(
      fss,
      surface_index.si_score,
      zone_peer_fss_median,
      zone_peer_si_median,
    ),
    traction_percentile: weightedPercentileRank(traction_score, peerTraction, weights),
    zone_peer_fss_median,
    zone_peer_si_median,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function executeScorecardQuery(
  params: ScorecardParams,
): Promise<ScorecardResult | SuppressedResult> {
  const allWeighted = await loadWeightedData();

  // K=15 enforcement happens before any aggregate is touched
  const match = matchPeers(allWeighted, params);
  if (match.suppressed) return match;

  const peers = match.records;
  const weights = peers.map(r => r.recency_weight);

  const peer_n = peers.length;
  const weighted_n = weightedEffectiveN(weights);
  const confidence = getConfidence(weighted_n);

  // --- Compensation ---------------------------------------------------------
  const total_comp_submitted =
    params.annual_base + (params.annual_bonus ?? 0) + (params.annual_equity ?? 0);
  const peerTCs = peers.map(totalComp);

  const base_percentile =
    percentileAmongNonNull(params.annual_base, peers, r => r.base_salary) ?? 50;
  const bonus_percentile =
    params.annual_bonus != null
      ? percentileAmongNonNull(params.annual_bonus, peers, r => r.bonus)
      : null;
  const equity_percentile =
    params.annual_equity != null
      ? percentileAmongNonNull(params.annual_equity, peers, r => r.equity)
      : null;
  const total_comp_percentile = weightedPercentileRank(
    total_comp_submitted,
    peerTCs,
    weights,
  );

  const comp_position =
    total_comp_percentile >= 60
      ? 'above_market'
      : total_comp_percentile >= 40
        ? 'at_market'
        : 'below_market';

  // --- Role structure --------------------------------------------------------
  const traction = calcTractionResult(params, peers);

  const teamSizes = peers
    .map(r => ({ v: r.team_size, w: r.recency_weight }))
    .filter((x): x is { v: number; w: number } => x.v != null);
  const tsValues = teamSizes.map(x => x.v);
  const tsWeights = teamSizes.map(x => x.w);
  const team_size_peer_median =
    tsValues.length > 0 ? weightedPercentile(tsValues, tsWeights, 50) : 0;
  const team_size_peer_range: [number, number] =
    tsValues.length > 0
      ? [
          weightedPercentile(tsValues, tsWeights, 25),
          weightedPercentile(tsValues, tsWeights, 75),
        ]
      : [0, 0];

  const reporting_line_prevalence = params.reporting_line
    ? Math.round(
        weightedRate(
          peers.map(
            r =>
              r.reporting_to != null &&
              normalizeReportingTitle(r.reporting_to) ===
                normalizeReportingTitle(params.reporting_line!),
          ),
          weights,
        ) * 100,
      )
    : 0;

  const contributorBoardRank = boardAccessRank(params.board_frequency);
  const board_access_prevalence = Math.round(
    weightedRate(
      peers.map(r => boardAccessRank(r.board_frequency) >= contributorBoardRank),
      weights,
    ) * 100,
  );

  // --- Governance / protections ----------------------------------------------
  const contributorHas: Record<ProtectionKey, boolean> = {
    do: params.has_do,
    indemnification: params.has_indemnification,
    severance: params.has_severance,
    accel_vest: params.has_accel_vest,
  };
  const protection_count = Object.values(contributorHas).filter(Boolean).length;

  const protectionCountOf = (r: WeightedRecord): number =>
    [r.has_do, r.has_indemnification, r.has_severance, r.has_accel_vest].filter(Boolean)
      .length;
  const protection_percentile = weightedPercentileRank(
    protection_count,
    peers.map(protectionCountOf),
    weights,
  );

  const elements: GovernanceElement[] = PROTECTION_DISPLAY_ORDER.map(key => {
    const stats = PROTECTION_STATS[key];
    const has = contributorHas[key];
    const peer_prevalence = Math.round(
      weightedRate(
        peers.map(r => r[stats.field as keyof WeightedRecord] as boolean),
        weights,
      ) * 100,
    );
    return {
      key,
      label: stats.label,
      contributor_has: has,
      peer_prevalence,
      market_premium: stats.market_premium,
      position: has ? 'has' : 'missing',
    };
  });

  const selectedProtections = (Object.keys(contributorHas) as ProtectionKey[]).filter(
    k => contributorHas[k],
  );
  let combination_premium: number | null = null;
  if (selectedProtections.length >= 2) {
    const combo = calcGovernanceCombination(peers, selectedProtections);
    combination_premium = combo.insufficient_data ? null : combo.delta;
  }

  const full_quad_distance = 4 - protection_count;

  // --- Narrative --------------------------------------------------------------
  const narrative = generateNarrative({
    total_comp_percentile,
    comp_position,
    peer_n,
    traction,
    protection_count,
    protection_percentile,
  });

  return {
    peer_n,
    weighted_n,
    confidence,
    suppressed: false,
    suppressed_attributes: match.suppressed_attributes,

    compensation: {
      base_percentile,
      bonus_percentile,
      equity_percentile,
      total_comp_percentile,
      total_comp_peer_p25: weightedPercentile(peerTCs, weights, 25),
      total_comp_peer_p50: weightedPercentile(peerTCs, weights, 50),
      total_comp_peer_p75: weightedPercentile(peerTCs, weights, 75),
      total_comp_peer_p90: weightedPercentile(peerTCs, weights, 90),
      total_comp_submitted,
      comp_position,
    },

    role_structure: {
      traction,
      team_size_peer_median,
      team_size_peer_range,
      reporting_line_prevalence,
      board_access_prevalence,
    },

    governance: {
      protection_count,
      protection_percentile,
      elements,
      combination_premium,
      full_quad_distance,
    },

    narrative,
  };
}
