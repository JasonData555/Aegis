// Shared card scaffold — all four scorecard cards use the same shell and
// icon-circle header pattern.

export function ScorecardCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-aegis-bg-card p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  icon,
  heading,
  sub,
  tintClass = '',
}: {
  icon: React.ReactNode;
  heading: string;
  sub: React.ReactNode;
  tintClass?: string;
}) {
  return (
    <div className={`-m-6 mb-6 flex items-center gap-4 rounded-t-2xl p-6 ${tintClass}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aegis-brand-soft">
        {icon}
      </div>
      <div>
        <h2 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-aegis-text-primary">
          {heading}
        </h2>
        <p className="text-[13px] text-aegis-text-muted">{sub}</p>
      </div>
    </div>
  );
}
