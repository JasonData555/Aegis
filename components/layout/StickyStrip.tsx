'use client';

import { useCountUp } from '@/components/shared/useCountUp';
import { ZONE_COLORS } from '@/lib/constants';
import { ordinalSuffix } from '@/lib/format';
import type { TractionZone } from '@/lib/types';

// Sticky summary strip — 72px, never scrolls away. The three headline
// answers: comp percentile / traction zone / protection count. Values animate
// in step with the cards below when the scorecard recomputes.

export default function StickyStrip({
  compPercentile,
  zone,
  protectionCount,
  recomputing = false,
}: {
  compPercentile: number;
  zone: TractionZone;
  protectionCount: number;
  recomputing?: boolean;
}) {
  const animatedPct = Math.round(useCountUp(compPercentile, 500));
  const animatedCount = Math.round(useCountUp(protectionCount, 300));

  return (
    <div
      data-testid="sticky-strip"
      className="sticky top-0 z-30 h-[72px]"
      style={{ backgroundColor: 'rgba(28,43,42,0.95)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative mx-auto grid h-full w-full max-w-[760px] grid-cols-3 px-6 md:px-10">
        {/* Left — compensation percentile */}
        <div className="flex flex-col items-center justify-center">
          <div className="font-mono text-[22px] leading-none text-white">
            {animatedPct}
            <sup className="font-sans text-[14px]">{ordinalSuffix(animatedPct)}</sup>
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.05em] text-[#7A908E]">
            Total Comp
          </div>
        </div>

        {/* Center — traction zone pill */}
        <div
          className="flex flex-col items-center justify-center"
          style={{ borderLeft: '1px solid rgba(226,221,214,0.2)', borderRight: '1px solid rgba(226,221,214,0.2)' }}
        >
          <span
            key={zone}
            className="animate-fade-in rounded-[20px] px-3 py-1 text-[12px] font-medium leading-none text-white"
            style={{ backgroundColor: ZONE_COLORS[zone] }}
          >
            {zone}
          </span>
          <div className="mt-1.5 text-[11px] uppercase tracking-[0.05em] text-[#7A908E]">
            Traction Zone
          </div>
        </div>

        {/* Right — protection coverage */}
        <div className="flex flex-col items-center justify-center">
          <div className="font-mono text-[22px] leading-none text-white">
            {animatedCount} of 4
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.05em] text-[#7A908E]">
            Protections
          </div>
        </div>

        {recomputing && (
          <div className="animate-pulse-soft pointer-events-none absolute inset-0 bg-aegis-brand-soft" />
        )}
      </div>
    </div>
  );
}
