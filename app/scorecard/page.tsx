import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ScorecardView from '@/components/scorecard/ScorecardView';
import { getContributionsByContributor } from '@/lib/contribution-store';
import { loadSurveyData } from '@/lib/data-loader';
import { executeScorecardQuery } from '@/lib/query-engine';
import type { ScorecardParams } from '@/lib/types';

// Main scorecard — authenticated. Loads the contributor's own contribution,
// runs the query server-side (no HTTP round trip), and renders the four cards.
// K=15 suppression returns the calm explanatory state instead of aggregates.

export default async function ScorecardPage() {
  const session = await auth();
  if (!session?.contributor_id) redirect('/'); // middleware is the primary guard

  const contributions = await getContributionsByContributor(session.contributor_id);
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

  const result = await executeScorecardQuery(params);

  if ('suppression_reason' in result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-aegis-bg-base px-6">
        <div className="max-w-[420px] rounded-2xl bg-aegis-bg-card p-8 text-center shadow-card">
          <h1 className="text-[22px] font-semibold text-aegis-text-primary">
            Your peer group is too small to display this safely.
          </h1>
          <p className="mt-3 text-[14px] leading-[1.7] text-aegis-text-body">
            {result.suggestion}
          </p>
        </div>
      </main>
    );
  }

  return (
    <ScorecardView
      result={result}
      params={params}
      roleTitle={latest.role_title}
      teamSize={latest.team_size}
      datasetN={(await loadSurveyData()).length}
    />
  );
}
