import GovernanceMeter from '@/components/shared/GovernanceMeter';
import { CardHeader, ScorecardCard } from './ScorecardCard';
import type { ScorecardResult } from '@/lib/types';

// Card 3 — Am I protected?

export default function ProtectionCard({ result }: { result: ScorecardResult }) {
  const gov = result.governance;

  // Conditional header tint: full coverage celebrates, zero coverage nudges
  const tintClass =
    gov.protection_count === 4
      ? 'bg-aegis-brand-soft'
      : gov.protection_count === 0
        ? 'bg-aegis-accent-soft'
        : '';

  return (
    <ScorecardCard>
      <CardHeader
        tintClass={tintClass}
        icon={
          <svg className="h-5 w-5 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
          </svg>
        }
        heading="Employment Protections"
        sub="Your governance coverage vs. verified peers"
      />

      {/* Headline stat */}
      <div className="text-center">
        <div className="leading-tight">
          <span className="font-mono text-[36px] text-aegis-text-primary">
            {gov.protection_count}
          </span>
          <span className="ml-2 text-[20px] font-medium text-aegis-text-body">of 4</span>
        </div>
        <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
          {result.narrative.protection_headline}
        </p>
      </div>

      <div className="mt-6">
        <GovernanceMeter
          elements={gov.elements}
          combinationPremium={gov.combination_premium}
          combinationPeerN={result.peer_n}
        />
      </div>
    </ScorecardCard>
  );
}
