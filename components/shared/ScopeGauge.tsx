import { ZONE_COLORS } from '@/lib/constants';
import type { FSSLabel, TractionZone } from '@/lib/types';

// Compact scope position bar — only shown when the contributor submitted
// their functional scope. Fill color follows the zone color logic.

export default function ScopeGauge({
  fssLabel,
  percentile,
  zone,
}: {
  fssLabel: FSSLabel;
  percentile: number; // FSS percentile vs peer group, 0–100
  zone: TractionZone;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
        Scope Label — <span className="text-aegis-text-primary">{fssLabel}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-aegis-bg-subtle">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(2, percentile))}%`,
            backgroundColor: ZONE_COLORS[zone],
          }}
        />
      </div>
      <p className="mt-1.5 text-[12px] text-aegis-text-muted">
        Your functional scope is at the{' '}
        <span className="font-mono text-aegis-text-body">{percentile}</span>th percentile
        of your peer group
      </p>
    </div>
  );
}
