'use client';

// Footer — methodology note + print action. Existing users update their data
// inline via the Edit button on each card (no round-trip to the contribution
// form), so only the print action remains here.

export default function ScorecardFooter({ datasetN }: { datasetN: number }) {
  const roundedN = Math.floor(datasetN / 100) * 100;
  return (
    <footer className="mx-auto max-w-[600px] pb-16 pt-4 text-center">
      <p className="text-[12px] leading-[1.6] text-aegis-text-subtle">
        Aegis benchmarks are derived from a proprietary dataset of{' '}
        <span className="font-mono">{roundedN.toLocaleString()}+</span> verified security
        leaders, refreshed annually. Peer matching uses role level, company size,
        industry, and geographic market. All figures are recency-weighted — recent
        data carries more weight. Individual contributors are never identifiable
        from aggregate outputs.
      </p>
      <p className="mt-5 text-[13px] text-aegis-text-subtle">
        To update your profile — use the edit buttons on each card above.
      </p>
      <div className="mt-4 flex items-center justify-center text-[13px] font-medium">
        <button
          type="button"
          onClick={() => window.print()}
          className="text-aegis-brand transition-colors duration-200 hover:text-aegis-brand-dark"
        >
          Download scorecard
        </button>
      </div>
    </footer>
  );
}
