'use client';

import { useEffect, useState } from 'react';
import AegisHeader from '@/components/layout/AegisHeader';
import PageContainer from '@/components/layout/PageContainer';
import StickyStrip from '@/components/layout/StickyStrip';
import CompareView from './CompareView';
import CompensationCard from './CompensationCard';
import ModeToggle, { type ScorecardMode } from './ModeToggle';
import ProspectiveForm, {
  emptyProspective,
  prospectiveToParams,
  type ProspectiveInputs,
} from './ProspectiveForm';
import ProtectionCard from './ProtectionCard';
import RoleStructureCard from './RoleStructureCard';
import ScorecardFooter from './ScorecardFooter';
import ScorecardHeader from './ScorecardHeader';
import TractionCard from './TractionCard';
import type { ScorecardParams, ScorecardResult, SuppressedResult } from '@/lib/types';

// Client composition of the scorecard page. The server page computes the
// current-role ScorecardResult; prospective evaluation queries /api/query
// dynamically with a 300ms debounce as the form changes.

type QueryOutcome = ScorecardResult | SuppressedResult;

function FourCards({
  result,
  params,
  teamSize,
}: {
  result: ScorecardResult;
  params: ScorecardParams;
  teamSize: number | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <CompensationCard
        result={result}
        submittedBase={params.annual_base}
        submittedBonus={params.annual_bonus}
        submittedEquity={params.annual_equity}
      />
      <RoleStructureCard
        result={result}
        reportingLine={params.reporting_line}
        teamSize={teamSize}
        hasFunctions={params.functions.length > 0}
      />
      <ProtectionCard result={result} />
      <TractionCard result={result} />
    </div>
  );
}

export default function ScorecardView({
  result,
  params,
  roleTitle,
  teamSize,
  datasetN,
  initialMode = 'current',
}: {
  result: ScorecardResult;
  params: ScorecardParams;
  roleTitle: string;
  teamSize: number | null;
  datasetN: number;
  initialMode?: ScorecardMode;
}) {
  const [mode, setMode] = useState<ScorecardMode>(initialMode);
  const [prospectiveInputs, setProspectiveInputs] = useState<ProspectiveInputs>(() =>
    emptyProspective(params.role_tier),
  );
  const [prospectiveResult, setProspectiveResult] = useState<QueryOutcome | null>(null);
  const traction = result.role_structure.traction;

  // Debounced prospective query — fires 300ms after the last form change
  useEffect(() => {
    if (mode === 'current') return;
    const prospectiveParams = prospectiveToParams(prospectiveInputs);
    if (!prospectiveParams) {
      setProspectiveResult(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prospectiveParams),
        });
        if (res.ok) setProspectiveResult(await res.json());
      } catch {
        // leave previous result in place
      }
    }, 300);
    return () => clearTimeout(t);
  }, [prospectiveInputs, mode]);

  const prospectiveParams = prospectiveToParams(prospectiveInputs);
  const prospectiveReady =
    prospectiveResult != null && !('suppression_reason' in prospectiveResult);

  return (
    <main className="min-h-screen bg-aegis-bg-base">
      <AegisHeader />

      <PageContainer className="py-4">
        <ModeToggle mode={mode} onChange={setMode} />
      </PageContainer>

      <StickyStrip
        compPercentile={result.compensation.total_comp_percentile}
        zone={traction.traction_zone}
        protectionCount={result.governance.protection_count}
      />

      <PageContainer className="py-8">
        {mode === 'current' && (
          <>
            <ScorecardHeader
              roleTitle={roleTitle}
              roleTier={params.role_tier}
              industry={params.industry}
              sizeBucket={params.size_bucket}
              companyStructure={params.company_structure}
            />
            <div className="mt-6">
              <FourCards result={result} params={params} teamSize={teamSize} />
            </div>
            <ScorecardFooter datasetN={datasetN} />
          </>
        )}

        {mode === 'prospective' && (
          <>
            <ProspectiveForm value={prospectiveInputs} onChange={setProspectiveInputs} />
            <div className="mt-5">
              {prospectiveReady && prospectiveParams ? (
                <FourCards
                  result={prospectiveResult as ScorecardResult}
                  params={prospectiveParams}
                  teamSize={null}
                />
              ) : prospectiveResult && 'suppression_reason' in prospectiveResult ? (
                <div className="rounded-2xl bg-aegis-bg-card p-6 text-center shadow-card">
                  <p className="text-[14px] leading-[1.7] text-aegis-text-body">
                    Your prospective peer group is too small to display safely.{' '}
                    {prospectiveResult.suggestion}
                  </p>
                </div>
              ) : (
                <p className="text-center text-[14px] text-aegis-text-muted">
                  Enter at least a role level and base salary to see how the
                  prospective role benchmarks.
                </p>
              )}
            </div>
          </>
        )}

        {mode === 'compare' && (
          <>
            <ProspectiveForm value={prospectiveInputs} onChange={setProspectiveInputs} />
            <div className="mt-6">
              {prospectiveResult != null ? (
                <CompareView current={result} prospective={prospectiveResult} />
              ) : (
                <p className="text-center text-[14px] text-aegis-text-muted">
                  Describe the prospective role above to compare it against your
                  current role side by side.
                </p>
              )}
            </div>
          </>
        )}
      </PageContainer>
    </main>
  );
}
