// Current / Prospective / Compare mode pills.
// Prospective and Compare behavior (ProspectiveForm, two-column layout)
// arrives in build Step 10 — the toggle itself is fully functional.

export type ScorecardMode = 'current' | 'prospective' | 'compare';

const MODES: Array<{ value: ScorecardMode; label: string }> = [
  { value: 'current', label: 'Current Role' },
  { value: 'prospective', label: 'Prospective Role' },
  { value: 'compare', label: 'Compare' },
];

export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: ScorecardMode;
  onChange: (mode: ScorecardMode) => void;
}) {
  return (
    <div className="flex gap-2">
      {MODES.map(m => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`rounded-[20px] border px-4 py-2 text-[14px] font-medium transition-colors duration-150 ${
            mode === m.value
              ? 'border-aegis-brand bg-aegis-brand text-white'
              : 'border-aegis-border bg-aegis-bg-card text-aegis-text-muted hover:border-aegis-border-strong'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
