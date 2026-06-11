import ConfidenceNote from '@/components/shared/ConfidenceNote';
import PercentileBar from '@/components/shared/PercentileBar';
import { CardHeader, ScorecardCard } from './ScorecardCard';
import { formatDollars, formatDollarsK, ordinalSuffix } from '@/lib/format';
import type { ScorecardResult } from '@/lib/types';

// Card 1 — Am I paid fairly?

function PercentilePill({ percentile }: { percentile: number | null }) {
  if (percentile == null) {
    return <span className="font-mono text-[12px] text-aegis-text-subtle">—</span>;
  }
  const cls =
    percentile >= 40
      ? 'bg-aegis-brand-soft text-aegis-brand'
      : percentile >= 25
        ? 'bg-aegis-accent-soft text-aegis-accent'
        : 'bg-aegis-danger/10 text-aegis-danger';
  return (
    <span className={`rounded-[20px] px-2.5 py-0.5 font-mono text-[12px] ${cls}`}>
      P{percentile}
    </span>
  );
}

export default function CompensationCard({
  result,
  submittedBase,
  submittedBonus,
  submittedEquity,
}: {
  result: ScorecardResult;
  submittedBase: number;
  submittedBonus: number | null;
  submittedEquity: number | null;
}) {
  const comp = result.compensation;

  const rows: Array<{ label: string; value: number | null; percentile: number | null }> = [
    { label: 'Base', value: submittedBase, percentile: comp.base_percentile },
    { label: 'Bonus', value: submittedBonus, percentile: comp.bonus_percentile },
    { label: 'Equity', value: submittedEquity, percentile: comp.equity_percentile },
  ];

  return (
    <ScorecardCard>
      <CardHeader
        icon={
          <svg className="h-5 w-5 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20" />
            <path d="M16.5 7c0-1.7-2-3-4.5-3S7.5 5.3 7.5 7s2 3 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" />
          </svg>
        }
        heading="Compensation"
        sub={
          <>
            How your pay compares to{' '}
            <span className="font-mono">{result.peer_n}</span> verified peers
          </>
        }
      />

      {/* Headline stat */}
      <div className="text-center">
        <div className="font-mono text-[36px] leading-tight text-aegis-brand">
          {formatDollars(comp.total_comp_submitted)}
        </div>
        <div className="mt-1 text-[20px] font-medium text-aegis-text-body">
          {comp.total_comp_percentile}
          {ordinalSuffix(comp.total_comp_percentile)} percentile
        </div>
        <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
          {result.narrative.compensation_headline}
        </p>
      </div>

      <PercentileBar
        percentile={comp.total_comp_percentile}
        p25={comp.total_comp_peer_p25}
        p50={comp.total_comp_peer_p50}
        p75={comp.total_comp_peer_p75}
        markerLabel={`You — ${formatDollarsK(comp.total_comp_submitted)}`}
      />

      {/* Base / Bonus / Equity rows */}
      <div className="mt-2 divide-y divide-aegis-border">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-3 items-center py-2.5">
            <span className="text-[13px] text-aegis-text-muted">{row.label}</span>
            <span className="text-center font-mono text-[14px] text-aegis-text-primary">
              {row.value != null ? formatDollars(row.value) : '—'}
            </span>
            <span className="text-right">
              <PercentilePill percentile={row.value != null ? row.percentile : null} />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <ConfidenceNote
          weightedN={result.weighted_n}
          rawN={result.peer_n}
          suppressedAttributes={result.suppressed_attributes}
        />
      </div>
    </ScorecardCard>
  );
}
