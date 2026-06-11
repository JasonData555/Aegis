import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ScorecardView from '@/components/scorecard/ScorecardView';
import { SESSION_COOKIE_NAME, verifySessionValue } from '@/lib/auth';
import { getContributionsByContributor } from '@/lib/contribution-store';
import { loadSurveyData } from '@/lib/data-loader';
import { executeScorecardQuery } from '@/lib/query-engine';
import type { ScorecardParams } from '@/lib/types';

// Standalone entry point for side-by-side comparison — same view as the
// scorecard, opened directly in Compare mode.

export default function ComparePage() {
  const session = verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect('/');

  const contributions = getContributionsByContributor(session.contributor_id);
  if (contributions.length === 0) redirect('/onboarding/contribute');
  const latest = contributions[contributions.length - 1];

  const params: ScorecardParams = {
    mode: 'current',
    role_tier: latest.role_tier,
    industry: latest.industry,
    company_structure: latest.company_structure,
    size_bucket: latest.size_bucket,
    metro_tier: latest.metro_tier,
    reporting_line: latest.reporting_line,
    board_frequency: latest.board_frequency,
    functions: latest.functions,
    annual_base: latest.annual_base,
    annual_bonus: latest.annual_bonus,
    annual_equity: latest.annual_equity,
    has_do: latest.has_do,
    has_indemnification: latest.has_indemnification,
    has_severance: latest.has_severance,
    has_accel_vest: latest.has_accel_vest,
  };

  const result = executeScorecardQuery(params);

  if ('suppression_reason' in result) {
    redirect('/scorecard'); // scorecard shows the suppression state
  }

  return (
    <ScorecardView
      result={result}
      params={params}
      roleTitle={latest.role_title}
      teamSize={latest.team_size}
      datasetN={loadSurveyData().length}
      initialMode="compare"
    />
  );
}
