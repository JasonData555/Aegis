// Shared card scaffold — all four scorecard cards use the same shell and
// icon-circle header pattern.

export type CardEditState = 'idle' | 'editing' | 'dimmed';

export function ScorecardCard({
  children,
  className = '',
  editState = 'idle',
  recomputing = false,
}: {
  children: React.ReactNode;
  className?: string;
  // 'editing' lifts and outlines the card; 'dimmed' fades the other cards while
  // one is being edited. A ring (not a border) avoids any layout shift.
  editState?: CardEditState;
  // Pulsing overlay shown on every card while the scorecard recomputes.
  recomputing?: boolean;
}) {
  const stateClass =
    editState === 'editing'
      ? 'opacity-100 shadow-card-hover ring-[1.5px] ring-aegis-brand'
      : editState === 'dimmed'
        ? 'opacity-55 pointer-events-none'
        : '';

  return (
    <section
      className={`relative rounded-2xl bg-aegis-bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover ${stateClass} ${className}`}
    >
      {children}
      {recomputing && (
        <div className="animate-pulse-soft pointer-events-none absolute inset-0 z-20 rounded-2xl bg-aegis-brand-soft" />
      )}
    </section>
  );
}

export function CardHeader({
  icon,
  heading,
  sub,
  tintClass = '',
  action,
}: {
  icon: React.ReactNode;
  heading: string;
  sub: React.ReactNode;
  tintClass?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`-m-6 mb-6 flex items-center gap-4 rounded-t-2xl p-6 ${tintClass}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aegis-brand-soft">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-aegis-text-primary">
          {heading}
        </h2>
        <p className="text-[13px] text-aegis-text-muted">{sub}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
