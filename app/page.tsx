import Link from 'next/link';
import AegisHeader from '@/components/layout/AegisHeader';
import TractionMatrix from '@/components/shared/TractionMatrix';
import CountUpStat from '@/components/landing/CountUpStat';
import HeroPreviewCard from '@/components/landing/HeroPreviewCard';
import MiniPercentileBar from '@/components/landing/MiniPercentileBar';
import Reveal from '@/components/landing/Reveal';
import { ZONE_COLORS, ZONE_MEDIAN_TC } from '@/lib/constants';
import { formatDollarsK } from '@/lib/format';
import type { TractionZone } from '@/lib/types';

// Landing page — five sections: dark hero with floating product preview,
// exchange, three questions, traction, trust (a value-prop differentiation
// strip sits between the hero and exchange). Landing sections use a wider
// 1100px container; app pages keep the 760px column.

const BRING_ROLE = [
  'Your level, company size, and industry',
  'Your organizational structure and reporting line',
];

const BRING_PACKAGE = [
  'Base, bonus, and annual equity value',
  'Employment protections: D&O, indemnification, severance, and accelerated vesting',
  'Functional scope (optional, improves accuracy)',
];

const QUESTIONS = [
  {
    heading: 'Am I paid fairly?',
    description:
      'See your exact compensation percentile vs. verified peers matched to your role, company size, and industry.',
    accent: '#2D7A6B',
    circleClass: 'bg-aegis-brand-soft',
    circleStyle: undefined as React.CSSProperties | undefined,
    iconColor: '#2D7A6B',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5 9.2 9.5 12 9.5s5 1.1 5 3-2.2 3-5 3-5-1.1-5-3" transform="translate(0 2.5)" />
      </svg>
    ),
  },
  {
    heading: 'Is my role structured right?',
    description:
      'Understand how your functional scope and organizational complexity compare — and what that means for your market value.',
    accent: '#1D9E75',
    circleClass: '',
    circleStyle: { backgroundColor: '#EEF2FF' } as React.CSSProperties,
    iconColor: '#1D9E75',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="5" rx="1" />
        <rect x="3" y="16" width="6" height="5" rx="1" />
        <rect x="15" y="16" width="6" height="5" rx="1" />
        <path d="M12 8v4M6 16v-2a2 2 0 012-2h8a2 2 0 012 2v2" />
      </svg>
    ),
  },
  {
    heading: 'Am I protected?',
    description:
      'See how your D&O coverage, indemnification, severance, and equity acceleration compare to peers — and what you may be leaving on the table.',
    accent: '#C4784A',
    circleClass: 'bg-aegis-accent-soft',
    circleStyle: undefined as React.CSSProperties | undefined,
    iconColor: '#C4784A',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const ZONE_PILLS: TractionZone[] = [
  'Paragon Leader',
  'Specialist Surgeon',
  'Utility Player',
  'Generalist',
];

const TRUST_STATEMENTS = [
  {
    heading: 'Anonymized by architecture',
    body: 'Individual data is never identifiable from outputs. Peer groups below 15 are suppressed.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    heading: 'Verified contributions',
    body: 'Every submission is cross-checked for consistency. Outliers are flagged and reviewed.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    heading: 'Powered by Hitch Partners',
    body: 'Built on a proprietary dataset from the firm that has placed security leaders at hundreds of companies.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* 1 — Hero */}
      <section className="relative bg-aegis-bg-dark">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <AegisHeader variant="landing" />
          <div className="mx-auto grid w-full max-w-[1100px] items-center gap-14 px-6 pb-24 pt-16 md:grid-cols-[55fr_45fr] md:px-10">
            <div>
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.01em] text-white md:text-[56px]">
                <span className="block">
                  Most CISOs are paid for{' '}
                  <span className="text-aegis-brand-light">what they own</span>.
                </span>
                <span className="block">
                  The best are paid for{' '}
                  <span className="text-aegis-brand-light">where they do it</span>.
                </span>
              </h1>
              <p className="mt-[20px] max-w-[440px] text-[18px] leading-[1.65] text-aegis-text-subtle">
                A private intelligence scorecard for security leaders, benchmarked
                against verified peers matched to your role, environment, and
                governance structure.
              </p>
              <Link
                href="/onboarding"
                className="mt-8 inline-flex h-[52px] items-center gap-2 rounded-[10px] bg-aegis-brand px-6 text-[16px] font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:bg-aegis-brand-dark"
              >
                See where you stand <span aria-hidden>→</span>
              </Link>
              <p className="mt-3 text-[12px] text-aegis-text-muted">
                Takes 4 minutes · Anonymized by architecture · LinkedIn verification
              </p>
            </div>
            <div className="md:px-4">
              <HeroPreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* Differentiation strip */}
      <div className="border-y border-aegis-border bg-aegis-bg-subtle py-[18px]">
        <p className="mx-auto max-w-[720px] px-6 text-center text-[16px] font-medium leading-[1.6] text-aegis-text-body">
          Unlike generic salary surveys, Aegis benchmarks your role against
          verified security leaders matched to your specific complexity, company
          size, and governance structure.
        </p>
      </div>

      {/* 3 — Exchange */}
      <section className="bg-aegis-bg-base">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-20 md:px-10">
          <h2 className="text-center text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
            Intelligence for intelligence.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal immediate dy={12}>
              <div className="h-full rounded-2xl border border-aegis-border bg-aegis-bg-subtle p-8">
                <h3 className="text-[18px] font-medium text-aegis-text-primary">
                  What you bring
                </h3>
                <div className="mt-6">
                  <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
                    About your role
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {BRING_ROLE.map(item => (
                      <li
                        key={item}
                        className="text-[12px] leading-[1.6] text-aegis-text-body"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-[20px]">
                  <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
                    About your package
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {BRING_PACKAGE.map(item => (
                      <li
                        key={item}
                        className="text-[12px] leading-[1.6] text-aegis-text-body"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            <Reveal immediate dy={12} delay={150}>
              <div
                className="h-full rounded-2xl bg-aegis-brand-soft p-8"
                style={{ border: '1px solid rgba(45,122,107,0.3)' }}
              >
                <h3 className="text-[18px] font-medium text-aegis-text-primary">
                  What you unlock
                </h3>
                <div className="mt-6 space-y-6">
                  {/* Item 1 — Compensation */}
                  <div>
                    <MiniPercentileBar
                      percentile={68}
                      markerLabel="You — $487k"
                      showTicks
                      className="w-full"
                    />
                    <p className="mt-2 text-[14px] font-medium text-aegis-text-primary">
                      Compensation percentile
                    </p>
                    <p className="text-[12px] text-aegis-text-muted">
                      Where your total package ranks among verified peers matched
                      to your exact profile
                    </p>
                  </div>
                  {/* Item 2 — Traction */}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-[20px] bg-aegis-brand px-3 py-1 text-[12px] font-medium leading-none text-white">
                        Paragon Leader
                      </span>
                      <span className="font-mono text-[13px] text-aegis-text-primary">
                        Traction Score 18.9
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] font-medium text-aegis-text-primary">
                      Leadership traction
                    </p>
                    <p className="text-[12px] text-aegis-text-muted">
                      How your functional scope and organizational environment
                      combine to determine your market value
                    </p>
                  </div>
                  {/* Item 3 — Governance */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-aegis-brand" />
                      <span className="h-2.5 w-2.5 rounded-full bg-aegis-brand" />
                      <span className="h-2.5 w-2.5 rounded-full bg-aegis-brand" />
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-aegis-border" />
                    </div>
                    <p className="mt-2 text-[14px] font-medium text-aegis-text-primary">
                      Governance gap
                    </p>
                    <p className="text-[12px] text-aegis-text-muted">
                      Which protections your peers hold that you may be missing,
                      and what each is worth in total compensation
                    </p>
                  </div>
                  {/* Item 4 — Permanent access */}
                  <div>
                    <span className="font-mono text-[20px] leading-none text-aegis-brand">
                      ∞
                    </span>
                    <p className="mt-2 text-[14px] font-medium text-aegis-text-primary">
                      Permanent access
                    </p>
                    <p className="text-[12px] text-aegis-text-muted">
                      Contribute once. Your scorecard updates as the market moves.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4 — Three questions */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-20 md:px-10">
          <h2 className="text-center text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
            Three questions. Clear answers.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {QUESTIONS.map((q, i) => (
              <Reveal key={q.heading} dy={8} delay={i * 100}>
                <div className="relative h-full overflow-hidden rounded-2xl border border-aegis-border bg-white px-7 py-8 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${q.circleClass}`}
                    style={{ ...q.circleStyle, color: q.iconColor }}
                  >
                    {q.icon}
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold leading-[1.4] text-aegis-text-primary">
                    {q.heading}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
                    {q.description}
                  </p>
                  <div
                    className="absolute inset-x-0 bottom-0 h-[3px]"
                    style={{ backgroundColor: q.accent }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Traction */}
      <section className="bg-aegis-bg-subtle">
        <div className="mx-auto grid w-full max-w-[1100px] items-start gap-12 px-6 py-20 md:grid-cols-2 md:px-10">
          <div>
            <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
              Measure your traction.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-aegis-text-body">
              Security leadership compensation isn&apos;t just about what you
              own — it&apos;s about where you own it.
            </p>
            <p className="mt-4 text-[14px] leading-[1.7] text-aegis-text-body">
              The Traction Matrix plots every security leader role across two
              axes: the breadth of what you own (Functional Scope) and the
              demands of where you do it (Surface Index). Where your role falls
              determines your Traction Zone — and your market value.
            </p>

            <div className="mt-6 rounded-xl border border-aegis-border bg-white px-6 py-5">
              <CountUpStat
                value={320000}
                className="font-mono text-[36px] leading-none text-aegis-brand"
              />
              <p className="mt-2 text-[13px] leading-[1.5] text-aegis-text-muted">
                median total comp difference between maximum and minimum
                traction profiles
              </p>
            </div>

            <div className="mt-6 flex flex-col items-start gap-2">
              {ZONE_PILLS.map(zone => (
                <span
                  key={zone}
                  className="rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium leading-none text-white"
                  style={{ backgroundColor: ZONE_COLORS[zone] }}
                >
                  {zone} · {formatDollarsK(ZONE_MEDIAN_TC[zone])}
                </span>
              ))}
            </div>
          </div>

          <Reveal dy={8} className="md:justify-self-center">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="lg:hidden">
                <TractionMatrix illustrative plotWidth={220} plotHeight={200} />
              </div>
              <div className="hidden lg:block">
                <TractionMatrix illustrative plotWidth={320} plotHeight={280} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6 — Trust */}
      <section className="relative bg-aegis-bg-dark">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(45,122,107,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-6 py-20 text-center md:px-10">
          <h2 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.01em] text-white">
            Built on verified data.
            <br />
            Protected by design.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TRUST_STATEMENTS.map((t, i) => (
              <Reveal key={t.heading} dy={8} delay={i * 100}>
                <div
                  className="h-full rounded-2xl px-6 py-7"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-aegis-brand-light"
                    style={{ backgroundColor: 'rgba(45,122,107,0.3)' }}
                  >
                    {t.icon}
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold text-white">
                    {t.heading}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-aegis-text-muted">
                    {t.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
