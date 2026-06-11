import ScopeGauge from '@/components/shared/ScopeGauge';
import TractionMatrix from '@/components/shared/TractionMatrix';
import { CardHeader, ScorecardCard } from './ScorecardCard';
import { ZONE_COLORS } from '@/lib/constants';
import type { ScorecardResult } from '@/lib/types';

// Card 2 — Is my role structured right?

// Multiplier shown with full precision up to 3 decimals (e.g. 1.625x)
export function formatMultiplier(m: number): string {
  return m.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function PrevalenceRow({
  text,
  pct,
}: {
  text: React.ReactNode;
  pct: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[13px] leading-[1.5] text-aegis-text-body">{text}</span>
      <div className="h-1 w-20 shrink-0 overflow-hidden rounded-full bg-aegis-bg-subtle">
        <div
          className="h-full rounded-full bg-aegis-brand"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function RoleStructureCard({
  result,
  reportingLine,
  teamSize,
  hasFunctions,
}: {
  result: ScorecardResult;
  reportingLine: string | null;
  teamSize: number | null;
  hasFunctions: boolean;
}) {
  const rs = result.role_structure;
  const t = rs.traction;
  const [rangeP25, rangeP75] = rs.team_size_peer_range;

  return (
    <ScorecardCard>
      <CardHeader
        icon={
          <svg className="h-5 w-5 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="5" rx="1" />
            <rect x="3" y="16" width="6" height="5" rx="1" />
            <rect x="15" y="16" width="6" height="5" rx="1" />
            <path d="M12 8v4M6 16v-2a2 2 0 012-2h8a2 2 0 012 2v2" />
          </svg>
        }
        heading="Role Structure"
        sub="How your scope and surface compare"
      />

      {/* Headline stat */}
      <div className="text-center">
        <div className="font-mono text-[36px] leading-tight text-aegis-text-primary">
          {t.traction_score.toFixed(1)}
        </div>
        <span
          className="mt-2 inline-block rounded-[20px] px-3 py-1 text-[12px] font-medium text-white"
          style={{ backgroundColor: ZONE_COLORS[t.traction_zone] }}
        >
          {t.traction_zone}
        </span>
        <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
          {result.narrative.traction_headline}
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <TractionMatrix
          fss={t.fss}
          siScore={t.surface_index.si_score}
          peerFSSMedian={t.zone_peer_fss_median}
          peerSIMedian={t.zone_peer_si_median}
          tractionScore={t.traction_score}
          fssLabel={t.fss_label}
          surfaceLabel={t.surface_index.surface_label}
          activeZone={t.traction_zone}
        />
      </div>

      {/* Traction Score breakdown — the calculation, shown transparently */}
      <p
        data-testid="traction-breakdown"
        className="mt-4 text-center font-mono text-[13px] text-aegis-text-muted"
      >
        FSS {t.fss.toFixed(1)} × {formatMultiplier(t.surface_index.surface_multiplier)}x
        surface multiplier = Traction Score {t.traction_score.toFixed(1)}
      </p>

      {hasFunctions && (
        <div className="mt-6">
          <ScopeGauge
            fssLabel={t.fss_label}
            percentile={t.fss_percentile}
            zone={t.traction_zone}
          />
        </div>
      )}

      {/* Structure rows */}
      <div className="mt-6 divide-y divide-aegis-border border-t border-aegis-border">
        <PrevalenceRow
          text={
            <>
              <span className="font-mono">{rs.reporting_line_prevalence}%</span> of your
              peers report to {reportingLine ?? 'the same title'}
            </>
          }
          pct={rs.reporting_line_prevalence}
        />
        <PrevalenceRow
          text={
            <>
              <span className="font-mono">{rs.board_access_prevalence}%</span> of peers
              have the same or more frequent board access
            </>
          }
          pct={rs.board_access_prevalence}
        />
        <div className="py-2.5 text-[13px] leading-[1.5] text-aegis-text-body">
          You lead <span className="font-mono">{teamSize ?? '—'}</span> · Peer median:{' '}
          <span className="font-mono">{Math.round(rs.team_size_peer_median)}</span> ·
          Typical range: <span className="font-mono">{Math.round(rangeP25)}</span>–
          <span className="font-mono">{Math.round(rangeP75)}</span>
        </div>
      </div>
    </ScorecardCard>
  );
}
