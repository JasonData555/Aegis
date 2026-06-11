import MiniPercentileBar from './MiniPercentileBar';

// Floating product preview in the hero — a miniature of the scorecard's
// sticky summary strip (hardcoded illustrative values), dropped on the desk
// at a slight angle. Entrance: fade-up 600ms, 300ms after load.

export default function HeroPreviewCard() {
  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-floating md:-rotate-2"
      style={{
        animation: 'aegis-fade-up 600ms ease-out 300ms both',
        ['--aegis-fade-dy' as string]: '20px',
      }}
    >
      {/* Three headline stats — comp percentile / zone / protections */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col items-center">
          <div className="font-mono text-[28px] leading-none text-aegis-brand">
            68<sup className="font-sans text-[14px]">th</sup>
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.05em] text-aegis-text-muted">
            Total Comp
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="whitespace-nowrap rounded-[20px] bg-aegis-brand px-3 py-1 text-[12px] font-medium leading-none text-white">
            Paragon Leader
          </span>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.05em] text-aegis-text-muted">
            Traction Zone
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="whitespace-nowrap font-mono text-[28px] leading-none text-aegis-text-primary">
            3 of 4
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.05em] text-aegis-text-muted">
            Protections
          </div>
        </div>
      </div>

      {/* Miniature percentile bar */}
      <MiniPercentileBar
        percentile={68}
        markerLabel="You — $487k"
        showTicks
        className="mt-10 pb-5"
      />
    </div>
  );
}
