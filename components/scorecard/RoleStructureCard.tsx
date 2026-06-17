'use client';

import { useEffect, useState } from 'react';
import CrossfadeText from '@/components/shared/CrossfadeText';
import ScopeGauge from '@/components/shared/ScopeGauge';
import TractionMatrix from '@/components/shared/TractionMatrix';
import { useCountUp } from '@/components/shared/useCountUp';
import {
  BOARD_OPTIONS,
  FieldLabel,
  FunctionsSelect,
  Helper,
  IndustrySelect,
  inputClass,
  PillSelect,
  REPORTING_OPTIONS,
  ROLE_LEVELS,
  SIZE_OPTIONS,
  STRUCTURE_OPTIONS,
} from '@/components/onboarding/contribution-inputs';
import { type EditableCardControls, EditFormShell, EditNote } from './card-editing';
import EditControls from './EditControls';
import { CardHeader, type CardEditState, ScorecardCard } from './ScorecardCard';
import { ZONE_COLORS } from '@/lib/constants';
import type { EditableProfile, ScorecardResult } from '@/lib/types';

// Card 2 — Is my role structured right?

// Multiplier shown with full precision up to 3 decimals (e.g. 1.625x)
export function formatMultiplier(m: number): string {
  return m.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function PrevalenceRow({
  text,
  pct,
}: {
  text: React.ReactNode;
  pct: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[13px] leading-[1.5] text-aegis-text-body">{text}</span>
      <div className="h-1 w-20 shrink-0 overflow-hidden rounded-full bg-aegis-bg-subtle">
        <div
          className="h-full rounded-full bg-aegis-brand"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function RoleStructureCard({
  result,
  reportingLine,
  teamSize,
  hasFunctions,
  profile,
  edit,
}: {
  result: ScorecardResult;
  reportingLine: string | null;
  teamSize: number | null;
  hasFunctions: boolean;
  profile?: EditableProfile;
  edit?: EditableCardControls;
}) {
  const rs = result.role_structure;
  const t = rs.traction;
  const [rangeP25, rangeP75] = rs.team_size_peer_range;

  // ---- Edit draft ----------------------------------------------------------
  const [roleTier, setRoleTier] = useState<string | null>(null);
  const [sizeBucket, setSizeBucket] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [companyStructure, setCompanyStructure] = useState<string | null>(null);
  const [reportingDraft, setReportingDraft] = useState<string | null>(null);
  const [boardFrequency, setBoardFrequency] = useState<string | null>(null);
  const [teamSizeRaw, setTeamSizeRaw] = useState('');
  const [functions, setFunctions] = useState<string[]>([]);

  useEffect(() => {
    if (edit?.editing && profile) {
      setRoleTier(profile.role_tier);
      setSizeBucket(profile.size_bucket);
      setIndustry(profile.industry);
      setCompanyStructure(profile.company_structure);
      setReportingDraft(profile.reporting_line);
      setBoardFrequency(profile.board_frequency);
      setTeamSizeRaw(profile.team_size != null ? String(profile.team_size) : '');
      setFunctions(profile.functions);
    }
  }, [edit?.editing, profile]);

  const saveDisabled =
    !roleTier || !sizeBucket || !industry || !companyStructure || !reportingDraft || !boardFrequency;

  function handleSave() {
    edit?.onSave({
      role_tier: roleTier!,
      size_bucket: sizeBucket,
      industry,
      company_structure: companyStructure,
      reporting_line: reportingDraft,
      board_frequency: boardFrequency,
      team_size: teamSizeRaw === '' ? null : Number(teamSizeRaw),
      functions,
    });
  }

  // ---- Animated display values --------------------------------------------
  const animatedTraction = useCountUp(t.traction_score, 500);

  const editState: CardEditState = !edit
    ? 'idle'
    : edit.editing
      ? 'editing'
      : edit.dimmed
        ? 'dimmed'
        : 'idle';

  return (
    <ScorecardCard editState={editState} recomputing={edit?.recomputing ?? false}>
      <CardHeader
        icon={
          <svg className="h-5 w-5 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="5" rx="1" />
            <rect x="3" y="16" width="6" height="5" rx="1" />
            <rect x="15" y="16" width="6" height="5" rx="1" />
            <path d="M12 8v4M6 16v-2a2 2 0 012-2h8a2 2 0 012 2v2" />
          </svg>
        }
        heading="Role Structure"
        sub="How your scope and surface compare"
        action={
          edit && (
            <EditControls
              editing={edit.editing}
              saving={edit.saving}
              saveDisabled={saveDisabled}
              onEdit={edit.onEdit}
              onCancel={edit.onCancel}
              onSave={handleSave}
            />
          )
        }
      />

      {/* Headline stat */}
      <div className="text-center">
        <div className="font-mono text-[36px] leading-tight text-aegis-text-primary">
          {animatedTraction.toFixed(1)}
        </div>
        <span
          key={t.traction_zone}
          className="animate-fade-in mt-2 inline-block rounded-[20px] px-3 py-1 text-[12px] font-medium text-white"
          style={{ backgroundColor: ZONE_COLORS[t.traction_zone] }}
        >
          {t.traction_zone}
        </span>
        <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
          <CrossfadeText text={result.narrative.traction_headline} />
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <TractionMatrix
          fss={t.fss}
          siScore={t.surface_index.si_score}
          peerFSSMedian={t.zone_peer_fss_median}
          peerSIMedian={t.zone_peer_si_median}
          tractionScore={t.traction_score}
          fssLabel={t.fss_label}
          surfaceLabel={t.surface_index.surface_label}
          activeZone={t.traction_zone}
        />
      </div>

      {/* Traction Score breakdown — the calculation, shown transparently */}
      <p
        data-testid="traction-breakdown"
        className="mt-4 text-center font-mono text-[13px] text-aegis-text-muted"
      >
        FSS {t.fss.toFixed(1)} × {formatMultiplier(t.surface_index.surface_multiplier)}x
        surface multiplier = Traction Score {t.traction_score.toFixed(1)}
      </p>

      {hasFunctions && (
        <div className="mt-6">
          <ScopeGauge
            fssLabel={t.fss_label}
            percentile={t.fss_percentile}
            zone={t.traction_zone}
          />
        </div>
      )}

      {/* Structure rows */}
      <div className="mt-6 divide-y divide-aegis-border border-t border-aegis-border">
        <PrevalenceRow
          text={
            <>
              <span className="font-mono">{rs.reporting_line_prevalence}%</span> of your
              peers report to {reportingLine ?? 'the same title'}
            </>
          }
          pct={rs.reporting_line_prevalence}
        />
        <PrevalenceRow
          text={
            <>
              <span className="font-mono">{rs.board_access_prevalence}%</span> of peers
              have the same or more frequent board access
            </>
          }
          pct={rs.board_access_prevalence}
        />
        <div className="py-2.5 text-[13px] leading-[1.5] text-aegis-text-body">
          You lead <span className="font-mono">{teamSize ?? '—'}</span> · Peer median:{' '}
          <span className="font-mono">{Math.round(rs.team_size_peer_median)}</span> ·
          Typical range: <span className="font-mono">{Math.round(rangeP25)}</span>–
          <span className="font-mono">{Math.round(rangeP75)}</span>
        </div>
      </div>

      <EditNote note={edit?.editNote ?? null} />

      {/* ---- Inline edit form -------------------------------------------- */}
      {edit?.editing && (
        <EditFormShell label="Update Role Structure">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel>Role Level</FieldLabel>
              <PillSelect options={ROLE_LEVELS} value={roleTier} onChange={setRoleTier} />
            </div>
            <div>
              <FieldLabel>Company Size</FieldLabel>
              <PillSelect options={SIZE_OPTIONS} value={sizeBucket} onChange={setSizeBucket} />
            </div>
            <div>
              <FieldLabel htmlFor="edit_industry">Industry</FieldLabel>
              <IndustrySelect value={industry} onChange={setIndustry} />
            </div>
            <div>
              <FieldLabel>Company Structure</FieldLabel>
              <PillSelect
                options={STRUCTURE_OPTIONS}
                value={companyStructure}
                onChange={setCompanyStructure}
              />
            </div>
            <div>
              <FieldLabel htmlFor="edit_reporting_line">Reports To</FieldLabel>
              <select
                id="edit_reporting_line"
                value={reportingDraft ?? ''}
                onChange={e => setReportingDraft(e.target.value || null)}
                className={`${inputClass} appearance-none ${reportingDraft ? '' : 'text-aegis-text-subtle'}`}
              >
                <option value="" disabled>
                  Select who you report to
                </option>
                {REPORTING_OPTIONS.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Board Access</FieldLabel>
              <PillSelect options={BOARD_OPTIONS} value={boardFrequency} onChange={setBoardFrequency} />
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel htmlFor="edit_team_size">Team Size</FieldLabel>
            <input
              id="edit_team_size"
              type="text"
              inputMode="numeric"
              value={teamSizeRaw}
              onChange={e => setTeamSizeRaw(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className={`${inputClass} font-mono text-[14px]`}
            />
            <Helper>People who report to you directly or indirectly</Helper>
          </div>

          <div className="mt-5">
            <FunctionsSelect selected={functions} onChange={setFunctions} />
          </div>
        </EditFormShell>
      )}
    </ScorecardCard>
  );
}
