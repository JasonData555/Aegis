'use client';

import type { EditableProfile } from '@/lib/types';

// Shared scaffolding for the inline card edit forms (Part 4/5). Each editable
// card receives an `edit` object describing its current state and the callbacks
// to open / cancel / save, plus the live `profile` to seed its draft.

export interface EditableCardControls {
  editing: boolean;
  dimmed: boolean;
  recomputing: boolean;
  saving: boolean;
  // Calm copper note shown on the card after a recompute left the peer group
  // too small to benchmark (the edit was reverted). Null when there is nothing
  // to say.
  editNote: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<EditableProfile>) => void;
}

// Divider + uppercase section label wrapping a card's edit fields. Slides open
// with the expand animation when the card enters edit mode.
export function EditFormShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-expand-down">
      <div className="my-4 border-t border-aegis-border" />
      <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

// The reverted-edit notice — warm copper, never alarming (per design voice).
export function EditNote({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <p className="mt-4 text-[13px] italic leading-[1.5] text-aegis-accent">{note}</p>
  );
}
