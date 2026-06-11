import { ZONE_COLORS } from '@/lib/constants';
import { ordinalSuffix } from '@/lib/format';
import type { TractionZone } from '@/lib/types';

// Sticky summary strip — 72px, never scrolls away. The three headline
// answers: comp percentile / traction zone / protection count.

export default function StickyStrip({
  compPercentile,
  zone,
  protectionCount,
}: {
  compPercentile: number;
  zone: TractionZone;
  protectionCount: number;
}) {
  return (
    <div
      data-testid="sticky-strip"
      className="sticky top-0 z-30 h-[72px]"
      style={{ backgroundColor: 'rgba(28,43,42,0.95)', backdropFilter: 'blur(8px)' }}
    >
      <div className="mx-auto grid h-full w-full max-w-[760px] grid-cols-3 px-6 md:px-10">
        {/* Left — compensation percentile */}
        <div className="flex flex-col items-center justify-center">
          <div className="font-mono text-[22px] leading-none text-white">
            {compPercentile}
            <sup className="font-sans text-[14px]">{ordinalSuffix(compPercentile)}</sup>
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
            className="rounded-[20px] px-3 py-1 text-[12px] font-medium leading-none text-white"
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
            {protectionCount} of 4
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.05em] text-[#7A908E]">
            Protections
          </div>
        </div>
      </div>
    </div>
  );
}
