import { ZONE_MEDIAN_TC } from '@/lib/constants';
import { formatDollarsK } from '@/lib/format';
import type { TractionZone } from '@/lib/types';

// The Traction Matrix — FSS (X axis) vs SI (Y axis), four zones split at the
// matched peer medians. No peer dots: this is a personal tool, not a
// comparative scatter. `illustrative` renders the static landing-page preview
// (50/50 split, no dot, crosshairs without peer-median labels).

const FSS_AXIS_MAX = 21; // max achievable FSS (all 22 functions, diminishing returns)

const ZONE_STYLE: Record<TractionZone, { fill: string; labelColor: string }> = {
  'Paragon Leader': { fill: '#E8F5F2', labelColor: '#2D7A6B' },
  'Specialist Surgeon': { fill: '#EEF2FF', labelColor: '#1D9E75' },
  'Utility Player': { fill: '#FAF0E8', labelColor: '#C4784A' },
  'Generalist': { fill: '#F4F1EC', labelColor: '#8A9E9C' },
};

function clampPct(v: number): number {
  return Math.min(96, Math.max(4, v));
}

function ZoneLabel({
  zone,
  position,
}: {
  zone: TractionZone;
  position: string;
}) {
  return (
    <div className={`pointer-events-none absolute ${position}`}>
      <div
        className="text-[11px] font-medium uppercase leading-tight tracking-[0.05em]"
        style={{ color: ZONE_STYLE[zone].labelColor }}
      >
        {zone}
      </div>
      <div className="font-mono text-[12px] text-aegis-text-muted">
        {formatDollarsK(ZONE_MEDIAN_TC[zone])} median
      </div>
    </div>
  );
}

export default function TractionMatrix({
  fss,
  siScore,
  peerFSSMedian,
  peerSIMedian,
  tractionScore,
  fssLabel,
  surfaceLabel,
  activeZone,
  illustrative = false,
  plotWidth = 280,
  plotHeight = 240,
}: {
  fss?: number;
  siScore?: number;
  peerFSSMedian?: number;
  peerSIMedian?: number;
  tractionScore?: number;
  fssLabel?: string;
  surfaceLabel?: string;
  activeZone?: TractionZone;
  illustrative?: boolean;
  plotWidth?: number;
  plotHeight?: number;
}) {
  // Zone split positions as % of plot area (50/50 when illustrative)
  const splitX = illustrative || peerFSSMedian == null
    ? 50
    : clampPct((peerFSSMedian / FSS_AXIS_MAX) * 100);
  const splitYFromTop = illustrative || peerSIMedian == null
    ? 50
    : clampPct(100 - peerSIMedian);

  const showDot = !illustrative && fss != null && siScore != null;
  const dotX = showDot ? clampPct((fss! / FSS_AXIS_MAX) * 100) : 0;
  const dotY = showDot ? clampPct(100 - siScore!) : 0;

  const opacityFor = (zone: TractionZone) =>
    activeZone === zone ? 0.6 : 0.4;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        {/* Y axis label — absolutely positioned so the rotated text doesn't
            occupy its unrotated width in layout */}
        <div className="relative mr-3 w-6" style={{ height: plotHeight }}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[12px] font-medium text-aegis-text-muted">
            SI — Surface Index
            <span className="ml-2 text-[11px] font-normal text-aegis-text-subtle">
              ← Lower&nbsp;&nbsp;&nbsp;Higher →
            </span>
          </div>
        </div>

        {/* Plot area */}
        <div
          data-testid="traction-matrix"
          className="relative overflow-hidden rounded-lg border border-aegis-border"
          style={{ width: plotWidth, height: plotHeight }}
        >
          {/* Quadrant fills — split at the peer medians */}
          <div
            className="absolute left-0 top-0"
            style={{ width: `${splitX}%`, height: `${splitYFromTop}%`, backgroundColor: ZONE_STYLE['Specialist Surgeon'].fill, opacity: opacityFor('Specialist Surgeon') }}
          />
          <div
            className="absolute top-0"
            style={{ left: `${splitX}%`, right: 0, height: `${splitYFromTop}%`, backgroundColor: ZONE_STYLE['Paragon Leader'].fill, opacity: opacityFor('Paragon Leader') }}
          />
          <div
            className="absolute left-0 bottom-0"
            style={{ width: `${splitX}%`, top: `${splitYFromTop}%`, backgroundColor: ZONE_STYLE['Generalist'].fill, opacity: opacityFor('Generalist') }}
          />
          <div
            className="absolute bottom-0"
            style={{ left: `${splitX}%`, right: 0, top: `${splitYFromTop}%`, backgroundColor: ZONE_STYLE['Utility Player'].fill, opacity: opacityFor('Utility Player') }}
          />

          {/* Quadrant corner labels — 16px from edges */}
          <ZoneLabel zone="Specialist Surgeon" position="left-4 top-4" />
          <ZoneLabel zone="Paragon Leader" position="right-4 top-4 text-right" />
          <ZoneLabel zone="Generalist" position="left-4 bottom-4" />
          <ZoneLabel zone="Utility Player" position="right-4 bottom-4 text-right" />

          {/* Crosshair lines at peer medians (midpoints when illustrative) */}
          <div
            className="absolute inset-y-0 border-l border-dashed border-aegis-border"
            style={{ left: `${splitX}%` }}
          />
          <div
            className="absolute inset-x-0 border-t border-dashed border-aegis-border"
            style={{ top: `${splitYFromTop}%` }}
          />
          {!illustrative && (
            <>
              <div
                className="absolute -translate-x-1/2 text-[11px] text-aegis-text-subtle"
                style={{ left: `${splitX}%`, bottom: '2px' }}
              >
                Peer median FSS
              </div>
              <div
                className="absolute text-[11px] text-aegis-text-subtle"
                style={{ top: `${splitYFromTop}%`, left: '2px', transform: 'translateY(-100%)' }}
              >
                Peer median SI
              </div>
            </>
          )}

          {/* Contributor dot with hover tooltip */}
          {showDot && (
            <div
              className="group absolute z-10 transition-all duration-[400ms] ease-in-out"
              style={{ left: `${dotX}%`, top: `${dotY}%` }}
            >
              <div
                className="h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-aegis-brand"
                style={{ boxShadow: '0 2px 8px rgba(45,122,107,0.4)' }}
              />
              <div className="pointer-events-none absolute bottom-[14px] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-aegis-bg-dark px-3 py-1.5 font-mono text-[11px] text-white group-hover:block">
                Traction Score: {tractionScore?.toFixed(1)} | FSS: {fss!.toFixed(1)}
                {fssLabel ? ` (${fssLabel})` : ''} | SI: {Math.round(siScore!)}
                {surfaceLabel ? ` (${surfaceLabel})` : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* X axis label */}
      <div className="mt-2 text-center text-[12px] font-medium text-aegis-text-muted">
        FSS — Functional Scope
        <div className="text-[11px] font-normal text-aegis-text-subtle">
          ← Narrow&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Broad →
        </div>
      </div>
    </div>
  );
}
