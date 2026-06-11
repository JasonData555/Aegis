import { ZONE_COLORS } from '@/lib/constants';
import { formatDollarsK, ordinalSuffix } from '@/lib/format';
import type { ScorecardResult, SuppressedResult } from '@/lib/types';

// Compare mode — current vs. prospective in two condensed columns with a
// delta column between them on wide screens.

function ZonePill({ zone }: { zone: ScorecardResult['role_structure']['traction']['traction_zone'] }) {
  return (
    <span
      className="inline-block rounded-[20px] px-2.5 py-0.5 text-[11px] font-medium text-white"
      style={{ backgroundColor: ZONE_COLORS[zone] }}
    >
      {zone}
    </span>
  );
}

function CompareColumn({
  title,
  subtitle,
  result,
}: {
  title: string;
  subtitle: string;
  result: ScorecardResult;
}) {
  const t = result.role_structure.traction;
  return (
    <div className="w-full max-w-[360px] space-y-4" data-testid={`compare-column-${title.toLowerCase()}`}>
      <div>
        <h3 className="text-[16px] font-semibold text-aegis-text-primary">{title}</h3>
        <p className="text-[12px] text-aegis-text-muted">{subtitle}</p>
      </div>

      <div className="rounded-xl bg-aegis-bg-card p-4 shadow-card">
        <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
          Total Comp
        </div>
        <div className="mt-1 font-mono text-[22px] text-aegis-text-primary">
          {formatDollarsK(result.compensation.total_comp_submitted)}
        </div>
        <div className="text-[12px] text-aegis-text-body">
          {result.compensation.total_comp_percentile}
          {ordinalSuffix(result.compensation.total_comp_percentile)} percentile of{' '}
          <span className="font-mono">{result.peer_n}</span> peers
        </div>
      </div>

      <div className="rounded-xl bg-aegis-bg-card p-4 shadow-card">
        <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
          Traction
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[22px] text-aegis-text-primary">
            {t.traction_score.toFixed(1)}
          </span>
          <ZonePill zone={t.traction_zone} />
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-aegis-text-muted">
          FSS {t.fss.toFixed(1)} · SI {Math.round(t.surface_index.si_score)}
        </div>
      </div>

      <div className="rounded-xl bg-aegis-bg-card p-4 shadow-card">
        <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
          Protections
        </div>
        <div className="mt-1 font-mono text-[22px] text-aegis-text-primary">
          {result.governance.protection_count} of 4
        </div>
      </div>
    </div>
  );
}

function Delta({ value, format }: { value: number; format: (v: number) => string }) {
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <div
      className={`font-mono text-[13px] ${
        neutral ? 'text-aegis-text-subtle' : positive ? 'text-aegis-brand' : 'text-aegis-danger'
      }`}
    >
      {positive ? '+' : ''}
      {format(value)}
    </div>
  );
}

export default function CompareView({
  current,
  prospective,
}: {
  current: ScorecardResult;
  prospective: ScorecardResult | SuppressedResult | null;
}) {
  if (prospective == null) return null;

  if ('suppression_reason' in prospective) {
    return (
      <div className="rounded-2xl bg-aegis-bg-card p-6 text-center shadow-card">
        <p className="text-[14px] leading-[1.7] text-aegis-text-body">
          Your prospective peer group is too small to display safely.{' '}
          {prospective.suggestion}
        </p>
      </div>
    );
  }

  const tcDelta =
    prospective.compensation.total_comp_submitted - current.compensation.total_comp_submitted;
  const pctDelta =
    prospective.compensation.total_comp_percentile - current.compensation.total_comp_percentile;
  const tractionDelta =
    prospective.role_structure.traction.traction_score -
    current.role_structure.traction.traction_score;
  const protectionDelta =
    prospective.governance.protection_count - current.governance.protection_count;

  return (
    <div className="flex flex-col items-start justify-center gap-4 md:flex-row" data-testid="compare-view">
      <CompareColumn title="Current" subtitle="Your role today" result={current} />

      {/* Delta column — wide screens */}
      <div className="hidden shrink-0 flex-col items-center gap-4 self-stretch pt-12 md:flex">
        <div className="flex h-[88px] flex-col items-center justify-center">
          <Delta value={tcDelta} format={v => formatDollarsK(Math.abs(v) * Math.sign(v))} />
          <Delta value={pctDelta} format={v => `${v} pts`} />
        </div>
        <div className="flex h-[96px] items-center">
          <Delta value={Number(tractionDelta.toFixed(1))} format={v => v.toFixed(1)} />
        </div>
        <div className="flex h-[84px] items-center">
          <Delta value={protectionDelta} format={v => String(v)} />
        </div>
      </div>

      <CompareColumn title="Prospective" subtitle="The role you're considering" result={prospective} />
    </div>
  );
}
