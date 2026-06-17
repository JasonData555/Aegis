'use client';

import { useEffect, useState } from 'react';
import CrossfadeText from '@/components/shared/CrossfadeText';
import GovernanceMeter from '@/components/shared/GovernanceMeter';
import { useCountUp } from '@/components/shared/useCountUp';
import { PROTECTION_CARDS, ToggleCard } from '@/components/onboarding/contribution-inputs';
import { type EditableCardControls, EditFormShell, EditNote } from './card-editing';
import EditControls from './EditControls';
import { CardHeader, type CardEditState, ScorecardCard } from './ScorecardCard';
import type { EditableProfile, ScorecardResult } from '@/lib/types';

// Card 3 — Am I protected?

type ProtectionFlags = Pick<
  EditableProfile,
  'has_do' | 'has_indemnification' | 'has_severance' | 'has_accel_vest'
>;

export default function ProtectionCard({
  result,
  profile,
  edit,
}: {
  result: ScorecardResult;
  profile?: EditableProfile;
  edit?: EditableCardControls;
}) {
  const gov = result.governance;

  const [draft, setDraft] = useState<ProtectionFlags>({
    has_do: false,
    has_indemnification: false,
    has_severance: false,
    has_accel_vest: false,
  });

  useEffect(() => {
    if (edit?.editing && profile) {
      setDraft({
        has_do: profile.has_do,
        has_indemnification: profile.has_indemnification,
        has_severance: profile.has_severance,
        has_accel_vest: profile.has_accel_vest,
      });
    }
  }, [edit?.editing, profile]);

  function handleSave() {
    edit?.onSave({ ...draft });
  }

  const animatedCount = useCountUp(gov.protection_count, 300);

  // Conditional header tint: full coverage celebrates, zero coverage nudges
  const tintClass =
    gov.protection_count === 4
      ? 'bg-aegis-brand-soft'
      : gov.protection_count === 0
        ? 'bg-aegis-accent-soft'
        : '';

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
        tintClass={tintClass}
        icon={
          <svg className="h-5 w-5 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
          </svg>
        }
        heading="Employment Protections"
        sub="Your governance coverage vs. verified peers"
        action={
          edit && (
            <EditControls
              editing={edit.editing}
              saving={edit.saving}
              onEdit={edit.onEdit}
              onCancel={edit.onCancel}
              onSave={handleSave}
            />
          )
        }
      />

      {/* Headline stat */}
      <div className="text-center">
        <div className="leading-tight">
          <span className="font-mono text-[36px] text-aegis-text-primary">
            {Math.round(animatedCount)}
          </span>
          <span className="ml-2 text-[20px] font-medium text-aegis-text-body">of 4</span>
        </div>
        <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
          <CrossfadeText text={result.narrative.protection_headline} />
        </p>
      </div>

      <div className="mt-6">
        <GovernanceMeter
          elements={gov.elements}
          combinationPremium={gov.combination_premium}
          combinationPeerN={result.peer_n}
        />
      </div>

      <EditNote note={edit?.editNote ?? null} />

      {/* ---- Inline edit form -------------------------------------------- */}
      {edit?.editing && (
        <EditFormShell label="Update Protections">
          <div className="space-y-3">
            {PROTECTION_CARDS.map(card => (
              <ToggleCard
                key={card.key}
                title={card.title}
                description={card.description}
                marketNote={card.marketNote}
                icon={card.icon}
                on={draft[card.key]}
                onToggle={() => setDraft(d => ({ ...d, [card.key]: !d[card.key] }))}
              />
            ))}
          </div>
        </EditFormShell>
      )}
    </ScorecardCard>
  );
}
