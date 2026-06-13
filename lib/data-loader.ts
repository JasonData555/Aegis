import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { SurveyRecord, WeightedRecord } from './types';
import { calcAgeMonths, calcRecencyWeight } from './recency-weights';
import { RECENCY_MAX_MONTHS } from './constants';

// Module-level cache — parsed once per server process
let _cache: SurveyRecord[] | null = null;

function getSurveyPath(): string {
  const configured = process.env.PARAGON_DATA_PATH ?? '../Paragon/data/survey.json';
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
}

function parseRecords(raw: string): SurveyRecord[] {
  try {
    const parsed = JSON.parse(raw) as SurveyRecord[];
    // Null emails at load time — they never flow into any Aegis calculation,
    // response, or log, even though the hosted copy is already sanitized.
    return Array.isArray(parsed) ? parsed.map(r => ({ ...r, email: null })) : [];
  } catch {
    return [];
  }
}

/**
 * Reads the shared survey dataset (read-only from Aegis).
 *   Production: fetch the sanitized copy hosted in Vercel Blob (BLOB_SURVEY_URL).
 *   Local dev / scripts: read PARAGON_DATA_PATH from disk.
 * Email addresses are nulled at load time so they never flow into any Aegis
 * calculation, response, or log.
 */
export async function loadSurveyData(): Promise<SurveyRecord[]> {
  if (_cache) return _cache;

  const blobUrl = process.env.BLOB_SURVEY_URL;
  if (blobUrl) {
    try {
      const res = await fetch(blobUrl, { cache: 'no-store' });
      _cache = res.ok ? parseRecords(await res.text()) : [];
    } catch {
      _cache = [];
    }
    return _cache;
  }

  const filePath = getSurveyPath();
  if (!existsSync(filePath)) {
    _cache = [];
    return _cache;
  }
  _cache = parseRecords(readFileSync(filePath, 'utf-8'));
  return _cache;
}

/**
 * Clears the module cache; the next request re-reads from disk.
 */
export function invalidateCache(): void {
  _cache = null;
}

/**
 * Attach recency weight to every record and exclude expired ones (age > 24 months).
 */
export function applyRecencyWeights(records: SurveyRecord[], now?: Date): WeightedRecord[] {
  const today = now ?? new Date();
  return records
    .map(r => {
      const age_months = calcAgeMonths(r.survey_date, today);
      const recency_weight = calcRecencyWeight(age_months);
      return { ...r, age_months, recency_weight };
    })
    .filter(r => r.age_months <= RECENCY_MAX_MONTHS);
}

/**
 * Convenience: full weighted dataset in one call.
 */
export async function loadWeightedData(now?: Date): Promise<WeightedRecord[]> {
  return applyRecencyWeights(await loadSurveyData(), now);
}
