'use client';

import { useEffect, useState } from 'react';
import AegisHeader from '@/components/layout/AegisHeader';
import PageContainer from '@/components/layout/PageContainer';
import StickyStrip from '@/components/layout/StickyStrip';
import { type EditableCardControls } from './card-editing';
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
import { profileToParams } from '@/lib/editable-profile';
import type {
  DataUnavailableResult,
  EditableProfile,
  ScorecardParams,
  ScorecardResult,
  SuppressedResult,
} from '@/lib/types';

// Client composition of the scorecard page. The server page computes the
// current-role ScorecardResult; the current role is then editable inline (each
// card has an Edit button that re-queries /api/query and recomputes all four
// cards), while prospective evaluation queries /api/query dynamically with a
// 300ms debounce as the form changes.

type QueryOutcome = ScorecardResult | SuppressedResult | DataUnavailableResult;
type EditCard = 'compensation' | 'role' | 'protection';

function FourCards({
  result,
  params,
  teamSize,
  profile,
  controlsFor,
  recomputing = false,
}: {
  result: ScorecardResult;
  params: ScorecardParams;
  teamSize: number | null;
  profile?: EditableProfile;
  controlsFor?: (card: EditCard) => EditableCardControls;
  recomputing?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <CompensationCard
        result={result}
        submittedBase={params.annual_base}
        submittedBonus={params.annual_bonus}
        submittedEquity={params.annual_equity}
        profile={profile}
        edit={controlsFor?.('compensation')}
      />
      <RoleStructureCard
        result={result}
        reportingLine={params.reporting_line}
        teamSize={teamSize}
        hasFunctions={params.functions.length > 0}
        profile={profile}
        edit={controlsFor?.('role')}
      />
      <ProtectionCard result={result} profile={profile} edit={controlsFor?.('protection')} />
      <TractionCard result={result} recomputing={recomputing} />
    </div>
  );
}

export default function ScorecardView({
  result,
  params,
  initialProfile,
  datasetN,
  initialMode = 'current',
}: {
  result: ScorecardResult;
  params: ScorecardParams;
  initialProfile: EditableProfile;
  datasetN: number;
  initialMode?: ScorecardMode;
}) {
  const [mode, setMode] = useState<ScorecardMode>(initialMode);

  // ---- Inline editing of the current role ----------------------------------
  const [editableProfile, setEditableProfile] = useState<EditableProfile>(initialProfile);
  const [currentResult, setCurrentResult] = useState<ScorecardResult>(result);
  const [editingCard, setEditingCard] = useState<EditCard | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [editNote, setEditNote] = useState<{ card: EditCard; message: string } | null>(null);

  // ---- Prospective evaluation ----------------------------------------------
  const [prospectiveInputs, setProspectiveInputs] = useState<ProspectiveInputs>(() =>
    emptyProspective(params.role_tier),
  );
  const [prospectiveResult, setProspectiveResult] = useState<QueryOutcome | null>(null);

  const traction = currentResult.role_structure.traction;

  // Persist a confirmed edit back to contributions.json in the background. No
  // spinner, no toast — the UI has already updated. Failures are swallowed.
  async function persistProfile(profile: EditableProfile) {
    try {
      await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'update',
          role_title: profile.role_title,
          role_tier: profile.role_tier,
          size_bucket: profile.size_bucket,
          industry: profile.industry,
          company_structure: profile.company_structure,
          reporting_line: profile.reporting_line,
          board_frequency: profile.board_frequency,
          annual_base: profile.annual_base,
          annual_bonus: profile.annual_bonus,
          annual_equity: profile.annual_equity,
          has_do: profile.has_do,
          has_indemnification: profile.has_indemnification,
          has_severance: profile.has_severance,
          has_accel_vest: profile.has_accel_vest,
          functions: profile.functions,
          team_size: profile.team_size,
          metro_tier: null,
          // The comp edit form gates save behind equity confirmation, so any
          // saved equity is treated as confirmed.
          equity_entry_confirmed: true,
        }),
      });
    } catch {
      // Background write — a failure must never disrupt the on-screen scorecard
    }
  }

  // Confirm an inline edit: recompute all four cards, then persist. If the new
  // peer group is below K=15 (suppressed) or the dataset is unavailable, revert
  // — keep the last valid scorecard and surface a calm note on the edited card.
  async function confirmEdit(card: EditCard, patch: Partial<EditableProfile>) {
    const merged = { ...editableProfile, ...patch };
    setEditingCard(null);
    setEditNote(null);
    setIsRecomputing(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToParams(merged)),
      });
      const outcome: QueryOutcome = await res.json();
      if (res.ok && !('suppression_reason' in outcome) && !('data_unavailable' in outcome)) {
        setEditableProfile(merged);
        setCurrentResult(outcome);
        setIsRecomputing(false);
        void persistProfile(merged);
      } else {
        setIsRecomputing(false);
        setEditNote({
          card,
          message:
            'suppression_reason' in outcome
              ? 'That combination has too few comparable peers to benchmark safely — your scorecard is unchanged. Try a different value.'
              : 'Benchmark data is temporarily unavailable, so your scorecard is unchanged. Please try again in a moment.',
        });
      }
    } catch {
      setIsRecomputing(false);
      setEditNote({
        card,
        message:
          'Something went wrong updating your scorecard. Your data is unchanged — please try again.',
      });
    }
  }

  function controlsFor(card: EditCard): EditableCardControls {
    return {
      editing: editingCard === card,
      dimmed: editingCard !== null && editingCard !== card,
      recomputing: isRecomputing,
      saving: isRecomputing,
      editNote: editNote?.card === card ? editNote.message : null,
      onEdit: () => {
        setEditNote(null);
        setEditingCard(card);
      },
      onCancel: () => setEditingCard(null),
      onSave: patch => confirmEdit(card, patch),
    };
  }

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
    prospectiveResult != null &&
    !('suppression_reason' in prospectiveResult) &&
    !('data_unavailable' in prospectiveResult);

  const currentParams = profileToParams(editableProfile);

  return (
    <main className="min-h-screen bg-aegis-bg-base">
      <AegisHeader />

      <PageContainer className="py-4">
        <ModeToggle mode={mode} onChange={setMode} />
      </PageContainer>

      {/* StickyStrip always shows the current-role numbers (the personal anchor) */}
      <StickyStrip
        compPercentile={currentResult.compensation.total_comp_percentile}
        zone={traction.traction_zone}
        protectionCount={currentResult.governance.protection_count}
        recomputing={isRecomputing && mode === 'current'}
      />

      <PageContainer className="py-8">
        {mode === 'current' && (
          <>
            <ScorecardHeader
              roleTitle={editableProfile.role_title}
              roleTier={editableProfile.role_tier}
              industry={editableProfile.industry}
              sizeBucket={editableProfile.size_bucket}
              companyStructure={editableProfile.company_structure}
            />
            <div className="mt-6">
              <FourCards
                result={currentResult}
                params={currentParams}
                teamSize={editableProfile.team_size}
                profile={editableProfile}
                controlsFor={controlsFor}
                recomputing={isRecomputing}
              />
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
              ) : prospectiveResult && 'data_unavailable' in prospectiveResult ? (
                <div className="rounded-2xl bg-aegis-bg-card p-6 text-center shadow-card">
                  <p className="text-[14px] leading-[1.7] text-aegis-text-body">
                    Benchmark data is temporarily unavailable. Please try again in a moment.
                  </p>
                </div>
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
                <CompareView current={currentResult} prospective={prospectiveResult} />
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
