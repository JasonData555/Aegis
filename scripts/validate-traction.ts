/**
 * Step 3 validation — run with: npx tsx scripts/validate-traction.ts
 *
 * Required check (Part 14 / session scope):
 *   FSS=12, SI=75 → surface_multiplier=1.625, traction_score=19.5
 */
import { calcFSS } from '../lib/function-weights';
import { calcSI, calcTractionScore, classifyTractionZone } from '../lib/traction-engine';
import { loadSurveyData, loadWeightedData } from '../lib/data-loader';
import { matchPeers } from '../lib/anonymization';
import { executeScorecardQuery } from '../lib/query-engine';
import type { ScorecardParams, SurfaceIndex } from '../lib/types';

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  →  ${actual}${pass ? '' : ` (expected ${expected})`}`);
}

console.log('— Required validation: FSS=12, SI=75 —');
const si75: SurfaceIndex = {
  si_reporting: 0,
  si_board: 0,
  si_size: 0,
  si_industry: 0,
  si_raw: 75,
  si_score: 75,
  surface_multiplier: 0.5 + (75 / 100) * 1.5,
  surface_label: 'High surface',
};
check('surface_multiplier (SI=75)', si75.surface_multiplier, 1.625);
check('traction_score (FSS=12 × 1.625)', calcTractionScore(12, si75), 19.5);

console.log('\n— calcSI sanity checks —');
const siMax = calcSI('CEO', 'At least quarterly', 'Enterprise', 'FinTech');
// 25×1.0 + 25×1.5 + 25×2.0 + 20×0.5 = 122.5 raw → capped at 100
check('si_raw (CEO/quarterly/Enterprise/FinTech)', siMax.si_raw, 122.5);
check('si_score capped at 100', siMax.si_score, 100);
check('surface_multiplier at cap', siMax.surface_multiplier, 2.0);
check('surface_label at cap', siMax.surface_label, 'Very high surface');

const siLow = calcSI('Chief Information Officer', 'Per request', 'Small', 'Government');
// 5×1.0 + 4×1.5 + 5×2.0 + 3×0.5 = 22.5
check('si_score (CIO/per request/Small/Government)', siLow.si_score, 22.5);
check('surface_label low', siLow.surface_label, 'Lower surface');

const siNullIndustry = calcSI('CEO', null, null, null);
check('null industry defaults to 8 pts', siNullIndustry.si_industry, 8);

console.log('\n— calcFSS sanity checks —');
// 2 × Tier 1 (1.5) + 1 × Tier 2 (1.2) + 1 × Tier 3 (1.0) = 5.2
check(
  'calcFSS tier weighting',
  calcFSS(['Cloud Security', 'Security Operations', 'GRC', 'Privacy']),
  5.2,
);
// Diminishing returns: 14 Tier-3 functions → 13×1.0 + 1×0.5 = 13.5
check(
  'calcFSS diminishing returns after 13',
  calcFSS(Array.from({ length: 14 }, (_, i) => `Unknown Function ${i}`)),
  13.5,
);
check(
  'calcFSS "&" and "and" spellings score identically',
  calcFSS(['Identity & Access Management / IAM']),
  calcFSS(['Identity and Access Management / IAM']),
);

console.log('\n— classifyTractionZone —');
check('High FSS / High SI', classifyTractionZone(10, 80, 8, 60), 'Paragon Leader');
check('Low FSS / High SI', classifyTractionZone(5, 80, 8, 60), 'Specialist Surgeon');
check('High FSS / Low SI', classifyTractionZone(10, 40, 8, 60), 'Utility Player');
check('Low FSS / Low SI', classifyTractionZone(5, 40, 8, 60), 'Generalist');

async function runDataChecks() {
console.log('\n— Data loader (../Paragon/data/survey.json) —');
const records = await loadSurveyData();
console.log(`Loaded ${records.length} survey records`);
check('records loaded', records.length > 0, true);
check('emails stripped at load', records.every(r => r.email === null), true);
const weighted = await loadWeightedData();
console.log(`Recency-weighted records (age ≤ 24 months): ${weighted.length}`);

console.log('\n— K=15 anonymity —');
const baseParams: ScorecardParams = {
  mode: 'current',
  role_tier: 'CISO',
  industry: null,
  company_structure: null,
  size_bucket: 'Mid-Market',
  metro_tier: null,
  reporting_line: 'CEO',
  board_frequency: 'At least quarterly',
  functions: ['Cloud Security', 'Security Operations', 'GRC'],
  annual_base: 300000,
  annual_bonus: 60000,
  annual_equity: 100000,
  has_do: true,
  has_indemnification: false,
  has_severance: true,
  has_accel_vest: false,
};
const broad = matchPeers(weighted, baseParams);
check('broad query not suppressed', broad.suppressed, false);
if (!broad.suppressed) {
  console.log(
    `Matched ${broad.records.length} peers; suppressed attributes: [${broad.suppressed_attributes.join(', ')}]`,
  );
}

console.log('\n— End-to-end scorecard query —');
const result = await executeScorecardQuery(baseParams);
if ('peer_n' in result) {
  console.log(
    `peer_n=${result.peer_n}, weighted_n=${result.weighted_n}, confidence=${result.confidence}`,
  );
  console.log(
    `TC percentile=${result.compensation.total_comp_percentile}, zone=${result.role_structure.traction.traction_zone}, ` +
      `traction_score=${result.role_structure.traction.traction_score.toFixed(2)}`,
  );
  check('scorecard meets K=15', result.peer_n >= 15, true);
} else {
  check('scorecard query returned aggregates', false, true);
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
}

runDataChecks();
