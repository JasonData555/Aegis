'use client';

import { useEffect, useState } from 'react';
import { formatDollarsK } from '@/lib/format';

// Horizontal position bar (Part 10 spec):
//   10px track, distribution fill by percentile band, contributor marker
//   sliding to position 400ms ease-out after a 200ms delay, ticks at
//   P25/P50/P75 with dollar labels beneath.

export default function PercentileBar({
  percentile,
  p25,
  p50,
  p75,
  markerLabel,
}: {
  percentile: number; // contributor position, 0–100
  p25: number; // peer dollar values for tick labels
  p50: number;
  p75: number;
  markerLabel: string; // e.g. "You — $460k"
}) {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPosition(Math.min(100, Math.max(0, percentile))), 200);
    return () => clearTimeout(t);
  }, [percentile]);

  const ticks = [
    { at: 25, value: p25 },
    { at: 50, value: p50 },
    { at: 75, value: p75 },
  ];

  return (
    <div className="w-full pb-6 pt-7">
      <div className="relative">
        {/* Track + distribution fill */}
        <div className="relative h-[10px] w-full overflow-hidden rounded-[6px] bg-aegis-border">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-white" />
          <div className="absolute inset-y-0 left-1/4 w-1/2 bg-aegis-brand-soft" />
          <div className="absolute inset-y-0 left-3/4 w-[15%] bg-aegis-brand-light opacity-60" />
          <div className="absolute inset-y-0 left-[90%] right-0 bg-aegis-brand opacity-40" />
        </div>

        {/* Tick marks */}
        {ticks.map(tick => (
          <div key={tick.at}>
            <div
              className="absolute top-[10px] h-[6px] w-px bg-aegis-border"
              style={{ left: `${tick.at}%` }}
            />
            <div
              className="absolute top-[18px] -translate-x-1/2 font-mono text-[11px] text-aegis-text-subtle"
              style={{ left: `${tick.at}%` }}
            >
              {formatDollarsK(tick.value)}
            </div>
          </div>
        ))}

        {/* Contributor marker */}
        <div
          className="absolute top-1/2 z-10 -translate-x-1/2 transition-[left] duration-[400ms] ease-out"
          style={{ left: `${position}%`, top: '5px' }}
        >
          <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium text-aegis-brand-dark">
            {markerLabel}
          </div>
          <div
            className="h-3 w-3 -translate-y-1/2 rounded-full border-2 border-aegis-brand-dark bg-white"
            style={{ boxShadow: '0 2px 6px rgba(45,122,107,0.3)' }}
          />
        </div>
      </div>
    </div>
  );
}
