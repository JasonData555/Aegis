// Step indicator shown at the top of every contribution step.
// Completed: filled check circle. Current: active circle. Upcoming: empty.

const STEPS = ['Your Role', 'Your Organization', 'Your Compensation', 'Your Protections'];

export default function ProgressSteps({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                i < current
                  ? 'border-aegis-brand bg-aegis-brand'
                  : i === current
                    ? 'border-aegis-brand bg-aegis-bg-card'
                    : 'border-aegis-border bg-aegis-bg-card'
              }`}
            >
              {i < current ? (
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    i === current ? 'bg-aegis-brand' : 'bg-transparent'
                  }`}
                />
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${i < current ? 'bg-aegis-brand' : 'bg-aegis-border'}`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
        Step {Math.min(current + 1, 4)} of 4 — {STEPS[Math.min(current, 3)]}
      </p>
    </div>
  );
}
