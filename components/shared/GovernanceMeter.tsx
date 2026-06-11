import { formatDollarsK } from '@/lib/format';
import type { GovernanceElement, ProtectionKey } from '@/lib/types';

// Four protection rows ordered strongest comp delta first (set by the query
// engine). Missing prompts are warm, not alarming — a helpful signal.

const TOOLTIPS: Record<ProtectionKey, string> = {
  accel_vest:
    'Equity vests immediately upon qualifying termination following a change of control (double trigger — both the acquisition AND your termination must occur)',
  severance: 'Pre-negotiated cash payment upon termination, agreed at time of hire',
  indemnification:
    'Company legally obligates itself to cover personal legal costs arising from role-related litigation',
  do: 'Directors and Officers insurance — personal liability coverage for decisions made in the role',
};

function ProtectionIcon({ k }: { k: ProtectionKey }) {
  const cls = 'h-5 w-5 text-aegis-brand';
  switch (k) {
    case 'do': // shield-check
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'indemnification': // document-check
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7l-4-4z" />
          <path d="M14 3v4h4" />
          <path d="M9.5 14l2 2 3.5-3.5" />
        </svg>
      );
    case 'severance': // handshake
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10l4-4 5 2 4-2 5 4" />
          <path d="M7 6v8l4 4 2-2" />
          <path d="M17 10v6l-3 3-3-3" />
        </svg>
      );
    case 'accel_vest': // bolt
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z" />
        </svg>
      );
  }
}

export default function GovernanceMeter({
  elements,
  combinationPremium,
  combinationPeerN,
}: {
  elements: GovernanceElement[];
  combinationPremium?: number | null;
  combinationPeerN?: number;
}) {
  return (
    <div>
      <div className="divide-y divide-aegis-border">
        {elements.map(el => (
          <div key={el.key} className="py-3" style={{ minHeight: 52 }}>
            <div className="flex items-center gap-3">
              {/* Left: icon + name with hover tooltip */}
              <div className="group relative flex min-w-0 flex-1 items-center gap-2.5">
                <ProtectionIcon k={el.key} />
                <span className="cursor-default truncate text-[14px] font-medium text-aegis-text-primary">
                  {el.label}
                </span>
                <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-72 rounded-lg bg-aegis-bg-dark px-3 py-2 text-[12px] leading-[1.5] text-white group-hover:block">
                  {TOOLTIPS[el.key]}
                </div>
              </div>

              {/* Center: status pill */}
              <span
                className={`shrink-0 rounded-[20px] px-3 py-1 text-[12px] font-medium ${
                  el.contributor_has
                    ? 'bg-aegis-brand-soft text-aegis-brand'
                    : 'bg-aegis-bg-subtle text-aegis-text-muted'
                }`}
              >
                {el.contributor_has ? 'You have this' : 'Not in your package'}
              </span>

              {/* Right cluster: prevalence bar + % + premium */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="h-1 w-20 overflow-hidden rounded-full bg-aegis-bg-subtle">
                  <div
                    className="h-full rounded-full bg-aegis-brand"
                    style={{ width: `${Math.min(100, el.peer_prevalence)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[12px] text-aegis-text-muted">
                  {el.peer_prevalence}%
                </span>
                <span
                  className={`w-14 text-right font-mono text-[13px] ${
                    el.contributor_has ? 'text-aegis-brand' : 'text-aegis-text-muted'
                  }`}
                >
                  +{formatDollarsK(el.market_premium)}
                </span>
              </div>
            </div>

            {/* Missing prompt — peer prevalence >40% and contributor lacks it */}
            {!el.contributor_has && el.peer_prevalence > 40 && (
              <p className="mt-1.5 pl-8 text-[13px] italic text-aegis-accent">
                → <span className="font-mono not-italic">{el.peer_prevalence}%</span> of your
                peers have this. Typical premium:{' '}
                <span className="font-mono not-italic">+{formatDollarsK(el.market_premium)}</span>.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Combination premium — shown when 2+ protections present */}
      {combinationPremium != null && combinationPremium > 0 && (
        <p className="mt-4 text-[14px] leading-[1.7] text-aegis-text-body">
          Your protection combination is associated with{' '}
          <span className="font-mono text-aegis-brand">
            {formatDollarsK(combinationPremium)}
          </span>{' '}
          higher median total comp vs. peers with no protections
          {combinationPeerN != null && (
            <>
              {' '}
              (<span className="font-mono">{combinationPeerN}</span> verified peers)
            </>
          )}
          .
        </p>
      )}
    </div>
  );
}
