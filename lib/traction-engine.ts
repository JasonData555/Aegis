import { calcFSS } from './function-weights';
import {
  BOARD_POINTS,
  INDUSTRY_DEFAULT_POINTS,
  INDUSTRY_POINTS,
  REPORTING_POINTS,
  SIZE_POINTS,
  SI_WEIGHTS,
} from './constants';
import type {
  GovernanceCombinationResult,
  ProtectionKey,
  SurfaceIndex,
  TractionZone,
  WeightedRecord,
} from './types';

export { calcFSS };

// ---------------------------------------------------------------------------
// SI — Surface Index (0–100)
// The road surface: the organizational environment where scope is deployed.
// ---------------------------------------------------------------------------

function getReportingPts(reportingLine: string | undefined | null): number {
  if (!reportingLine) return 0;
  const lower = reportingLine.toLowerCase();
  // Check longer/more specific keys first
  const sorted = Object.entries(REPORTING_POINTS).sort((a, b) => b[0].length - a[0].length);
  for (const [key, pts] of sorted) {
    if (lower.includes(key.toLowerCase())) return pts;
  }
  return 0;
}

function getBoardPts(boardFrequency: string | undefined | null): number {
  if (!boardFrequency) return 0;
  return BOARD_POINTS[boardFrequency] ?? 0;
}

function getSizePts(sizeBucket: string | undefined | null): number {
  if (!sizeBucket) return 0;
  return SIZE_POINTS[sizeBucket] ?? 0;
}

function getIndustryPts(industry: string | undefined | null): number {
  if (!industry) return INDUSTRY_DEFAULT_POINTS;
  // Normalize "X/Y" → "X / Y" so dataset and UI spellings both match
  const normalized = industry.replace(/\s*\/\s*/g, ' / ').trim();
  return INDUSTRY_POINTS[normalized] ?? INDUSTRY_DEFAULT_POINTS;
}

export function getSurfaceLabel(siScore: number): string {
  if (siScore <= 30) return 'Lower surface';
  if (siScore <= 55) return 'Moderate surface';
  if (siScore <= 75) return 'High surface';
  return 'Very high surface';
}

export function calcSI(
  reportingLine: string | undefined | null,
  boardFreq: string | undefined | null,
  sizeBucket: string | undefined | null,
  industry: string | undefined | null,
): SurfaceIndex {
  const si_reporting = getReportingPts(reportingLine);
  const si_board = getBoardPts(boardFreq);
  const si_size = getSizePts(sizeBucket);
  const si_industry = getIndustryPts(industry);

  const si_raw =
    si_reporting * SI_WEIGHTS.reporting +
    si_board * SI_WEIGHTS.board +
    si_size * SI_WEIGHTS.size +
    si_industry * SI_WEIGHTS.industry;

  const si_score = Math.min(100, si_raw);
  const surface_multiplier = 0.5 + (si_score / 100) * 1.5;

  return {
    si_reporting,
    si_board,
    si_size,
    si_industry,
    si_raw,
    si_score,
    surface_multiplier,
    surface_label: getSurfaceLabel(si_score),
  };
}

// ---------------------------------------------------------------------------
// Traction Score — the combined force of FSS meeting SI.
// Low surface discounts scope (0.50x); very high surface amplifies it (2.00x).
// Validated correlation with total comp: r=0.306 (n=926).
// ---------------------------------------------------------------------------

export function calcTractionScore(fss: number, si: SurfaceIndex): number {
  return fss * si.surface_multiplier;
}

// ---------------------------------------------------------------------------
// Traction Zone classification (relative to matched peer medians)
// ---------------------------------------------------------------------------

export function classifyTractionZone(
  fss: number,
  si_score: number,
  peerFSSMedian: number,
  peerSIMedian: number,
): TractionZone {
  const highFSS = fss >= peerFSSMedian;
  const highSI = si_score >= peerSIMedian;
  if (highFSS && highSI) return 'Paragon Leader';
  if (highFSS && !highSI) return 'Utility Player';
  if (!highFSS && highSI) return 'Specialist Surgeon';
  return 'Generalist';
}

// ---------------------------------------------------------------------------
// Per-record helpers (peer medians for the Traction Matrix crosshairs)
// ---------------------------------------------------------------------------

export function calcRecordFSS(record: WeightedRecord): number {
  return calcFSS(record.functions);
}

export function calcRecordSI(record: WeightedRecord): number {
  const si = calcSI(record.reporting_to, record.board_frequency, record.size_bucket, record.industry);
  return si.si_score;
}

// ---------------------------------------------------------------------------
// Governance combination — peers with vs without a protection set
// ---------------------------------------------------------------------------

function protectionField(key: ProtectionKey): keyof WeightedRecord {
  const map: Record<ProtectionKey, keyof WeightedRecord> = {
    do: 'has_do',
    indemnification: 'has_indemnification',
    severance: 'has_severance',
    accel_vest: 'has_accel_vest',
  };
  return map[key];
}

function simpleMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function calcGovernanceCombination(
  records: WeightedRecord[],
  selectedProtections: ProtectionKey[],
): GovernanceCombinationResult {
  const fields = selectedProtections.map(protectionField);

  const withRecords = records.filter(r => fields.every(f => r[f] === true));
  const withoutRecords = records.filter(r => fields.every(f => r[f] === false));

  const n_with = withRecords.length;
  const n_without = withoutRecords.length;
  const insufficient_data = n_with < 5 || n_without < 5;

  const tcOf = (recs: WeightedRecord[]): number | null => {
    if (recs.length === 0) return null;
    const tcs = recs.map(r => (r.base_salary ?? 0) + (r.bonus ?? 0) + (r.equity ?? 0));
    return simpleMedian(tcs);
  };

  const median_tc_with = tcOf(withRecords);
  const median_tc_without = tcOf(withoutRecords);
  const delta =
    median_tc_with !== null && median_tc_without !== null
      ? median_tc_with - median_tc_without
      : null;

  return {
    selected_protections: selectedProtections,
    n_with,
    n_without,
    median_tc_with,
    median_tc_without,
    delta,
    prevalence: records.length > 0 ? n_with / records.length : 0,
    insufficient_data,
  };
}
