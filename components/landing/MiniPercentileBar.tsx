// Static illustrative percentile bar for landing previews. Echoes the live
// PercentileBar's distribution bands and marker style, with no animation and
// no dollar data — purely a product-preview element.

export default function MiniPercentileBar({
  percentile = 68,
  markerLabel,
  showTicks = false,
  className = '',
}: {
  percentile?: number;
  markerLabel?: string;
  showTicks?: boolean;
  className?: string;
}) {
  const position = Math.min(100, Math.max(0, percentile));

  return (
    <div className={className}>
      <div className="relative">
        {/* Track + distribution fill */}
        <div className="relative h-[6px] w-full overflow-hidden rounded-[6px] bg-aegis-border">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-white" />
          <div className="absolute inset-y-0 left-1/4 w-1/2 bg-aegis-brand-soft" />
          <div className="absolute inset-y-0 left-3/4 w-[15%] bg-aegis-brand-light opacity-60" />
          <div className="absolute inset-y-0 left-[90%] right-0 bg-aegis-brand opacity-40" />
        </div>

        {/* Tick marks at P25 / P50 / P75 */}
        {showTicks &&
          [25, 50, 75].map(at => (
            <div key={at}>
              <div
                className="absolute top-[6px] h-[5px] w-px bg-aegis-border"
                style={{ left: `${at}%` }}
              />
              <div
                className="absolute top-[12px] -translate-x-1/2 font-mono text-[9px] text-aegis-text-subtle"
                style={{ left: `${at}%` }}
              >
                P{at}
              </div>
            </div>
          ))}

        {/* Marker */}
        <div className="absolute z-10 -translate-x-1/2" style={{ left: `${position}%`, top: '3px' }}>
          {markerLabel && (
            <div className="absolute -top-[24px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium text-aegis-brand-dark">
              {markerLabel}
            </div>
          )}
          <div
            className="h-[10px] w-[10px] -translate-y-1/2 rounded-full border-2 border-aegis-brand-dark bg-white"
            style={{ boxShadow: '0 2px 6px rgba(45,122,107,0.3)' }}
          />
        </div>
      </div>
    </div>
  );
}
