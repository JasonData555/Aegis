'use client';

import { useEffect, useState } from 'react';
import ConfidenceNote from '@/components/shared/ConfidenceNote';
import CrossfadeText from '@/components/shared/CrossfadeText';
import PercentileBar from '@/components/shared/PercentileBar';
import { useCountUp } from '@/components/shared/useCountUp';
import {
  CurrencyInput,
  FieldLabel,
  Helper,
  parseCurrency,
  shouldConfirmEquity,
} from '@/components/onboarding/contribution-inputs';
import { type EditableCardControls, EditFormShell, EditNote } from './card-editing';
import EditControls from './EditControls';
import { CardHeader, type CardEditState, ScorecardCard } from './ScorecardCard';
import { formatDollars, formatDollarsK, ordinalSuffix } from '@/lib/format';
import type { EditableProfile, ScorecardResult } from '@/lib/types';

// Card 1 — Am I paid fairly?

function PercentilePill({ percentile }: { percentile: number | null }) {
  if (percentile == null) {
    return <span className="font-mono text-[12px] text-aegis-text-subtle">—</span>;
  }
  const cls =
    percentile >= 40
      ? 'bg-aegis-brand-soft text-aegis-brand'
      : percentile >= 25
        ? 'bg-aegis-accent-soft text-aegis-accent'
        : 'bg-aegis-danger/10 text-aegis-danger';
  return (
    <span
      key={percentile}
      className={`animate-fade-in rounded-[20px] px-2.5 py-0.5 font-mono text-[12px] ${cls}`}
    >
      P{percentile}
    </span>
  );
}

export default function CompensationCard({
  result,
  submittedBase,
  submittedBonus,
  submittedEquity,
  profile,
  edit,
}: {
  result: ScorecardResult;
  submittedBase: number;
  submittedBonus: number | null;
  submittedEquity: number | null;
  profile?: EditableProfile;
  edit?: EditableCardControls;
}) {
  const comp = result.compensation;

  // ---- Edit draft (digit-string raws, like the contribution form) ----------
  const [baseRaw, setBaseRaw] = useState('');
  const [bonusRaw, setBonusRaw] = useState('');
  const [equityRaw, setEquityRaw] = useState('');
  const [equityConfirmed, setEquityConfirmed] = useState(false);

  useEffect(() => {
    if (edit?.editing && profile) {
      setBaseRaw(String(profile.annual_base ?? ''));
      setBonusRaw(profile.annual_bonus != null ? String(profile.annual_bonus) : '');
      setEquityRaw(profile.annual_equity != null ? String(profile.annual_equity) : '');
      setEquityConfirmed(false);
    }
  }, [edit?.editing, profile]);

  const draftBase = parseCurrency(baseRaw);
  const draftBonus = parseCurrency(bonusRaw);
  const draftEquity = parseCurrency(equityRaw);
  const sizeBucket = profile?.size_bucket ?? null;
  const equityNeedsConfirmation = shouldConfirmEquity(draftEquity, draftBase, sizeBucket);
  const equityMultiple = draftBase && draftBase > 0 && draftEquity != null ? draftEquity / draftBase : 0;
  const saveDisabled =
    draftBase == null || draftBase <= 0 || (equityNeedsConfirmation && !equityConfirmed);

  function handleEquityChange(raw: string) {
    setEquityRaw(raw);
    setEquityConfirmed(false);
  }

  function handleSave() {
    edit?.onSave({
      annual_base: draftBase ?? 0,
      annual_bonus: draftBonus,
      annual_equity: draftEquity,
    });
  }

  // ---- Animated display values --------------------------------------------
  const animatedTotal = useCountUp(comp.total_comp_submitted, 500);
  const animatedPct = useCountUp(comp.total_comp_percentile, 500);
  const pctRounded = Math.round(animatedPct);

  const rows: Array<{ label: string; value: number | null; percentile: number | null }> = [
    { label: 'Base', value: submittedBase, percentile: comp.base_percentile },
    { label: 'Bonus', value: submittedBonus, percentile: comp.bonus_percentile },
    { label: 'Equity', value: submittedEquity, percentile: comp.equity_percentile },
  ];

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
            <path d="M12 2v20" />
            <path d="M16.5 7c0-1.7-2-3-4.5-3S7.5 5.3 7.5 7s2 3 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" />
          </svg>
        }
        heading="Compensation"
        sub={
          <>
            How your pay compares to{' '}
            <span className="font-mono">{result.peer_n}</span> verified peers
          </>
        }
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
        <div className="font-mono text-[36px] leading-tight text-aegis-brand">
          {formatDollars(Math.round(animatedTotal))}
        </div>
        <div className="mt-1 text-[20px] font-medium text-aegis-text-body">
          {pctRounded}
          {ordinalSuffix(pctRounded)} percentile
        </div>
        <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
          <CrossfadeText text={result.narrative.compensation_headline} />
        </p>
      </div>

      <PercentileBar
        percentile={comp.total_comp_percentile}
        p25={comp.total_comp_peer_p25}
        p50={comp.total_comp_peer_p50}
        p75={comp.total_comp_peer_p75}
        markerLabel={`You — ${formatDollarsK(comp.total_comp_submitted)}`}
      />

      {/* Base / Bonus / Equity rows */}
      <div className="mt-2 divide-y divide-aegis-border">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-3 items-center py-2.5">
            <span className="text-[13px] text-aegis-text-muted">{row.label}</span>
            <span className="text-center font-mono text-[14px] text-aegis-text-primary">
              {row.value != null ? formatDollars(row.value) : '—'}
            </span>
            <span className="text-right">
              <PercentilePill percentile={row.value != null ? row.percentile : null} />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <ConfidenceNote
          weightedN={result.weighted_n}
          rawN={result.peer_n}
          suppressedAttributes={result.suppressed_attributes}
        />
      </div>

      <EditNote note={edit?.editNote ?? null} />

      {/* ---- Inline edit form -------------------------------------------- */}
      {edit?.editing && (
        <EditFormShell label="Update Compensation">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel htmlFor="edit_annual_base">Annual Base Salary</FieldLabel>
              <CurrencyInput id="edit_annual_base" value={baseRaw} onChange={setBaseRaw} />
            </div>
            <div>
              <FieldLabel htmlFor="edit_annual_bonus">Estimated Annual Bonus</FieldLabel>
              <CurrencyInput id="edit_annual_bonus" value={bonusRaw} onChange={setBonusRaw} />
              <Helper>Target or typical annual bonus</Helper>
            </div>
            <div>
              <FieldLabel htmlFor="edit_annual_equity">Annual Equity Value</FieldLabel>
              <CurrencyInput id="edit_annual_equity" value={equityRaw} onChange={handleEquityChange} />
              <Helper>Annual vesting value — not total grant</Helper>

              {equityNeedsConfirmation && (
                <div
                  data-testid="equity-confirm-card"
                  className="mt-4 rounded-xl border border-aegis-border-strong bg-aegis-bg-subtle"
                  style={{ padding: '16px 20px' }}
                >
                  <h3 className="text-[14px] font-semibold text-aegis-text-primary">
                    Please confirm your equity entry
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.5] text-aegis-text-body">
                    The equity value you&apos;ve entered (
                    <span className="font-mono">${(draftEquity ?? 0).toLocaleString()}</span>) is{' '}
                    <span className="font-mono">{equityMultiple.toFixed(1)}x</span> your base
                    salary. This is possible but uncommon for your company profile. Before
                    saving, please confirm:
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-aegis-text-body">
                      <input
                        type="radio"
                        name="edit_equity_confirm"
                        checked={equityConfirmed}
                        onChange={() => setEquityConfirmed(true)}
                        className="mt-0.5 accent-[#2D7A6B]"
                      />
                      Yes — this is my annual vesting value, not my total grant
                    </label>
                    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-aegis-text-body">
                      <input
                        type="radio"
                        name="edit_equity_confirm"
                        checked={false}
                        onChange={() => {
                          setEquityRaw('');
                          setEquityConfirmed(false);
                        }}
                        className="mt-0.5 accent-[#2D7A6B]"
                      />
                      I need to correct this — let me re-enter it
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </EditFormShell>
      )}
    </ScorecardCard>
  );
}
