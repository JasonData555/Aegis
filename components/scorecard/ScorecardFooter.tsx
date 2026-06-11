import Link from 'next/link';

// Footer — methodology note + action links.

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
      <div className="mt-5 flex items-center justify-center gap-6 text-[13px] font-medium">
        <Link
          href="/onboarding/contribute"
          className="text-aegis-brand transition-colors duration-200 hover:text-aegis-brand-dark"
        >
          Update your data
        </Link>
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
