import { CardHeader, ScorecardCard } from './ScorecardCard';
import { formatMultiplier } from './RoleStructureCard';
import { ZONE_COLORS } from '@/lib/constants';
import type { ScorecardResult, TractionZone } from '@/lib/types';

// Card 4 — the Traction Score, explained in plain English.

const ZONE_SENTENCES: Record<TractionZone, string> = {
  'Paragon Leader':
    'This is maximum traction — broad scope fully engaged with a demanding environment. These roles command the strongest compensation packages in the market.',
  'Specialist Surgeon':
    'Precision traction — focused scope gripping a high-surface environment. Your compensation is driven more by your surface conditions than your breadth.',
  'Utility Player':
    'Broad capability on a low-surface road — at risk of slippage. The scope is there; the organizational conditions to fully engage it are not yet present.',
  'Generalist':
    'A foundational profile building toward productive traction. Compensation is driven primarily by company size and role level at this stage.',
};

export default function TractionCard({ result }: { result: ScorecardResult }) {
  const t = result.role_structure.traction;
  const si = t.surface_index;

  return (
    <ScorecardCard>
      <CardHeader
        icon={
          <svg className="h-5 w-5 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" />
          </svg>
        }
        heading="Traction Score"
        sub="How your scope and surface combine"
      />

      {/* Plain English explanation — the car traction metaphor */}
      <p data-testid="traction-explanation" className="text-[14px] leading-[1.7] text-aegis-text-body">
        Traction is the relationship between your tires and the road surface.
        Your Scope Score is the tire — the breadth of functional capability you
        bring. Your Surface Index is the road — the organizational environment
        where you deploy it. Low surface means slippage. High surface means
        grip. Your Traction Score measures how effectively your capabilities
        engage with your environment.
      </p>

      {/* Two stat blocks side by side */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-aegis-bg-subtle p-4 text-center">
          <div className="text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
            Scope Score
          </div>
          <div className="mt-1 font-mono text-[28px] leading-tight text-aegis-text-primary">
            {t.fss.toFixed(1)}
          </div>
          <span className="mt-1.5 inline-block rounded-[20px] bg-aegis-bg-card px-2.5 py-0.5 text-[12px] font-medium text-aegis-text-body">
            {t.fss_label}
          </span>
          <p className="mt-1.5 text-[12px] text-aegis-text-muted">
            The tire — what you bring
          </p>
        </div>
        <div className="rounded-xl bg-aegis-bg-subtle p-4 text-center">
          <div className="text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
            Surface Index
          </div>
          <div className="mt-1 font-mono text-[28px] leading-tight text-aegis-text-primary">
            {Math.round(si.si_score)}
          </div>
          <span className="mt-1.5 inline-block rounded-[20px] bg-aegis-bg-card px-2.5 py-0.5 text-[12px] font-medium text-aegis-text-body">
            {si.surface_label}
          </span>
          <p className="mt-1.5 text-[12px] text-aegis-text-muted">
            The road — where you do it
          </p>
        </div>
      </div>

      {/* Prominent Traction Score with transparent calculation */}
      <div className="mt-6 text-center">
        <div className="font-mono text-[36px] leading-tight text-aegis-brand">
          {t.traction_score.toFixed(1)}
        </div>
        <p className="mt-1 font-mono text-[14px] text-aegis-text-muted">
          = FSS {t.fss.toFixed(1)} × {formatMultiplier(si.surface_multiplier)}x surface
          multiplier
        </p>
        <span
          className="mt-3 inline-block rounded-[20px] px-3 py-1 text-[12px] font-medium text-white"
          style={{ backgroundColor: ZONE_COLORS[t.traction_zone] }}
        >
          {t.traction_zone}
        </span>
      </div>

      {/* Zone description */}
      <p className="mt-5 text-[14px] leading-[1.7] text-aegis-text-body">
        Your Traction Score of{' '}
        <span className="font-mono">{t.traction_score.toFixed(1)}</span> reflects a role
        with {t.fss_label.toLowerCase()} functional scope on a{' '}
        {si.surface_label.toLowerCase()} organizational surface.{' '}
        {ZONE_SENTENCES[t.traction_zone]}
      </p>
    </ScorecardCard>
  );
}
