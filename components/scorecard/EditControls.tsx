'use client';

// The header-row edit affordance shared by the three editable scorecard cards.
// Closed: a single "Edit" button. Open: "Cancel" + "Save & recompute".

export default function EditControls({
  editing,
  saving,
  saveDisabled = false,
  onEdit,
  onCancel,
  onSave,
}: {
  editing: boolean;
  saving: boolean;
  saveDisabled?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!editing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1.5 rounded-lg border border-aegis-border bg-transparent px-3 py-1.5 text-[13px] text-aegis-text-muted transition-colors duration-200 hover:bg-aegis-bg-subtle"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
          <path d="M13.5 6.5l3 3" />
        </svg>
        Edit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-aegis-border bg-transparent px-3 py-1.5 text-[13px] text-aegis-text-muted transition-colors duration-200 hover:bg-aegis-bg-subtle disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || saveDisabled}
        className="rounded-lg bg-aegis-brand px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-aegis-brand-dark disabled:opacity-50"
      >
        Save & recompute
      </button>
    </div>
  );
}
