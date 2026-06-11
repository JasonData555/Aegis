'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from './ProgressSteps';
import { INDUSTRY_LIST } from '@/lib/constants';
import { UI_FUNCTIONS } from '@/lib/function-weights';

// 4-step data contribution form (Part 7). Tone: a trusted colleague asking
// questions, not a bureaucratic intake form.

// ---------------------------------------------------------------------------
// Equity confirmation trigger (Part 7):
//   annual_equity > annual_base × 3 AND size is Small or Mid-Market
//   OR annual_equity > annual_base × 5 at any size
// ---------------------------------------------------------------------------
export function shouldConfirmEquity(
  equity: number | null,
  base: number | null,
  sizeBucket: string | null,
): boolean {
  if (equity == null || base == null || base <= 0) return false;
  const smallOrMid = sizeBucket === 'Small' || sizeBucket === 'Mid-Market';
  return (smallOrMid && equity > base * 3) || equity > base * 5;
}

// UI board options map to the canonical dataset values for storage
const BOARD_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'At least quarterly', value: 'At least quarterly' },
  { label: 'Semi-annually', value: 'At least semi-annually' },
  { label: 'Annually', value: 'At least annually' },
  { label: 'Per request', value: 'Per request' },
  { label: "I don't report to the Board", value: 'I do not report to the Board of Directors' },
];

const ROLE_LEVELS = ['CISO', 'VP Security', 'Director', 'Manager'];

const SIZE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Small (<250)', value: 'Small' },
  { label: 'Mid-Market (250–999)', value: 'Mid-Market' },
  { label: 'Large (1,000–4,999)', value: 'Large' },
  { label: 'Enterprise (5,000+)', value: 'Enterprise' },
];

const STRUCTURE_OPTIONS = ['Publicly Traded', 'Privately Held', 'PE-Backed', 'Non-Profit', 'Government'];

const REPORTING_OPTIONS = [
  'CEO', 'COO', 'President', 'CTO', 'CFO', 'CIO', 'General Counsel',
  'Chief Risk Officer', 'Chief Product Officer', 'Board of Directors', 'Other',
];

const PROTECTION_CARDS = [
  {
    key: 'has_do' as const,
    title: 'Directors & Officers Insurance',
    description:
      'Your employer provides D&O coverage that protects you personally against claims arising from your role as a security leader',
    marketNote: 'Present in 50% of peer roles',
    icon: (
      <svg className="h-6 w-6 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'has_indemnification' as const,
    title: 'Corporate Indemnification',
    description:
      'Your employer has a written obligation to cover your personal legal costs if you face role-related litigation',
    marketNote: 'Present in 22% of peer roles',
    icon: (
      <svg className="h-6 w-6 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7l-4-4z" />
        <path d="M14 3v4h4" />
        <path d="M9.5 14l2 2 3.5-3.5" />
      </svg>
    ),
  },
  {
    key: 'has_severance' as const,
    title: 'Severance Agreement',
    description:
      'You have a pre-negotiated severance package agreed at the time of hire — not a standard at-will termination policy',
    marketNote: 'Present in 17% of peer roles',
    icon: (
      <svg className="h-6 w-6 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l4-4 5 2 4-2 5 4" />
        <path d="M7 6v8l4 4 2-2" />
        <path d="M17 10v6l-3 3-3-3" />
      </svg>
    ),
  },
  {
    key: 'has_accel_vest' as const,
    title: 'Accelerated Vesting — Double Trigger',
    description:
      'Your equity vests immediately upon qualifying termination following a change of control. Both triggers must occur: the acquisition AND your termination.',
    marketNote: 'Present in 16% of peer roles',
    icon: (
      <svg className="h-6 w-6 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Field primitives
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted"
    >
      {children}
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[12px] leading-[1.5] text-aegis-text-muted">{children}</p>;
}

const inputClass =
  'h-12 w-full rounded-xl border border-aegis-border bg-aegis-bg-card px-4 text-[15px] text-aegis-text-primary outline-none transition-colors duration-200 placeholder:text-aegis-text-subtle focus:border-aegis-brand';

function parseCurrency(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits === '' ? null : Number(digits);
}

function formatCurrencyDisplay(raw: string): string {
  const n = parseCurrency(raw);
  return n == null ? '' : `$${n.toLocaleString('en-US')}`;
}

function CurrencyInput({
  id,
  value,
  onChange,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (raw: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  return (
    <input
      id={id}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={formatCurrencyDisplay(value)}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
      placeholder="$000,000"
      className={`${inputClass} font-mono text-[14px]`}
    />
  );
}

function PillSelect({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }> | string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  const items = options.map(o => (typeof o === 'string' ? { label: o, value: o } : o));
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-colors duration-200 ${
            value === o.value
              ? 'border-aegis-brand bg-aegis-brand text-white'
              : 'border-aegis-border bg-aegis-bg-card text-aegis-text-muted hover:border-aegis-border-strong'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IndustrySelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () => INDUSTRY_LIST.filter(i => i.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="relative">
      <input
        id="industry"
        type="text"
        value={open ? query : (value ?? '')}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search or select your industry"
        className={inputClass}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-aegis-border bg-aegis-bg-card py-1 shadow-lg">
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-[14px] text-aegis-text-muted">No matches</div>
          )}
          {filtered.map(industry => (
            <button
              key={industry}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onChange(industry);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-[14px] transition-colors duration-150 hover:bg-aegis-brand-soft ${
                value === industry ? 'text-aegis-brand' : 'text-aegis-text-body'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleCard({
  title,
  description,
  marketNote,
  icon,
  on,
  onToggle,
}: {
  title: string;
  description: string;
  marketNote: string;
  icon: React.ReactNode;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`w-full rounded-xl text-left transition-all duration-200 ${
        on
          ? 'border-y-[1.5px] border-r-[1.5px] border-l-[3px] border-aegis-brand bg-aegis-brand-soft'
          : 'border border-aegis-border bg-aegis-bg-card hover:border-aegis-border-strong'
      }`}
      style={{ padding: '16px 20px' }}
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium text-aegis-text-primary">{title}</div>
          <p className="mt-1 text-[13px] leading-[1.5] text-aegis-text-body">{description}</p>
          <p className="mt-1 text-[12px] text-aegis-text-muted">{marketNote}</p>
        </div>
        <div
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
            on ? 'bg-aegis-brand' : 'bg-aegis-border'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
              on ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function FunctionsSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (fns: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(fn: string) {
    onChange(selected.includes(fn) ? selected.filter(f => f !== fn) : [...selected, fn]);
  }

  const columns: Array<{ heading: string; fns: readonly string[] }> = [
    { heading: 'Technical & Engineering', fns: UI_FUNCTIONS.technical },
    { heading: 'Risk & Compliance', fns: UI_FUNCTIONS.risk },
    { heading: 'Operations & Leadership', fns: UI_FUNCTIONS.operations },
  ];

  return (
    <div className="rounded-xl border border-aegis-border bg-aegis-bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="text-[15px] font-medium text-aegis-text-primary">
            Functional Scope (Optional)
          </div>
          <p className="mt-0.5 text-[12px] text-aegis-text-muted">
            Selecting your functions improves your Traction Score accuracy. Takes 30 seconds.
          </p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-aegis-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="grid gap-5 border-t border-aegis-border px-5 py-4 md:grid-cols-3">
          {columns.map(col => (
            <div key={col.heading}>
              <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
                {col.heading}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {col.fns.map(fn => {
                  const isOn = selected.includes(fn);
                  return (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => toggle(fn)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors duration-150 ${
                        isOn
                          ? 'border-aegis-brand bg-aegis-brand-soft text-aegis-brand'
                          : 'border-aegis-border text-aegis-text-body hover:border-aegis-border-strong'
                      }`}
                    >
                      {isOn && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {fn}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-aegis-text-primary">
        {title}
      </h2>
      <p className="mt-1.5 text-[14px] leading-[1.7] text-aegis-text-body">{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

export default function ContributionForm() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0–3 form steps, 4 = review

  // Step 1
  const [roleTitle, setRoleTitle] = useState('');
  const [roleTier, setRoleTier] = useState<string | null>(null);
  // Step 2
  const [industry, setIndustry] = useState<string | null>(null);
  const [sizeBucket, setSizeBucket] = useState<string | null>(null);
  const [companyStructure, setCompanyStructure] = useState<string | null>(null);
  const [reportingLine, setReportingLine] = useState<string | null>(null);
  const [boardFrequency, setBoardFrequency] = useState<string | null>(null);
  // Step 3 — raw digit strings
  const [baseRaw, setBaseRaw] = useState('');
  const [bonusRaw, setBonusRaw] = useState('');
  const [equityRaw, setEquityRaw] = useState('');
  const [equityConfirmed, setEquityConfirmed] = useState(false);
  const equityInputRef = useRef<HTMLInputElement>(null);
  // Step 4
  const [protections, setProtections] = useState({
    has_do: false,
    has_indemnification: false,
    has_severance: false,
    has_accel_vest: false,
  });
  const [hasSigning, setHasSigning] = useState<string | null>(null);
  const [signingRaw, setSigningRaw] = useState('');
  const [functions, setFunctions] = useState<string[]>([]);
  const [teamSizeRaw, setTeamSizeRaw] = useState('');
  // Review
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const base = parseCurrency(baseRaw);
  const bonus = parseCurrency(bonusRaw);
  const equity = parseCurrency(equityRaw);

  const equityNeedsConfirmation = shouldConfirmEquity(equity, base, sizeBucket);
  const equityMultiple = base && base > 0 && equity != null ? equity / base : 0;

  const stepValid = [
    roleTitle.trim() !== '' && roleTier !== null,
    industry !== null && sizeBucket !== null && companyStructure !== null &&
      reportingLine !== null && boardFrequency !== null,
    base !== null && base > 0 && !(equityNeedsConfirmation && !equityConfirmed),
    true,
  ];

  function handleEquityChange(raw: string) {
    setEquityRaw(raw);
    setEquityConfirmed(false); // any edit resets the confirmation
  }

  function handleRecalculate() {
    setEquityRaw('');
    setEquityConfirmed(false);
    equityInputRef.current?.focus();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_title: roleTitle.trim(),
          role_tier: roleTier,
          size_bucket: sizeBucket,
          industry,
          company_structure: companyStructure,
          reporting_line: reportingLine,
          board_frequency: boardFrequency,
          annual_base: base,
          annual_bonus: bonus,
          annual_equity: equity,
          has_do: protections.has_do,
          has_indemnification: protections.has_indemnification,
          has_severance: protections.has_severance,
          has_accel_vest: protections.has_accel_vest,
          has_signing: hasSigning === 'Yes',
          signing_amount: hasSigning === 'Yes' ? parseCurrency(signingRaw) : null,
          functions,
          team_size: teamSizeRaw === '' ? null : Number(teamSizeRaw),
          metro_tier: null,
          equity_entry_confirmed: equityConfirmed,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/onboarding/complete');
      } else {
        setSubmitting(false);
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitting(false);
      setSubmitError('Something went wrong. Please try again.');
    }
  }

  const reviewSections = [
    {
      heading: 'Your Role',
      step: 0,
      rows: [
        ['Role title', roleTitle],
        ['Role level', roleTier ?? '—'],
      ],
    },
    {
      heading: 'Your Organization',
      step: 1,
      rows: [
        ['Industry', industry ?? '—'],
        ['Company size', SIZE_OPTIONS.find(o => o.value === sizeBucket)?.label ?? '—'],
        ['Company structure', companyStructure ?? '—'],
        ['Reports to', reportingLine ?? '—'],
        ['Board access', BOARD_OPTIONS.find(o => o.value === boardFrequency)?.label ?? '—'],
      ],
    },
    {
      heading: 'Your Compensation',
      step: 2,
      rows: [
        ['Base salary', base != null ? `$${base.toLocaleString()}` : '—'],
        ['Annual bonus', bonus != null ? `$${bonus.toLocaleString()}` : '—'],
        ['Annual equity', equity != null ? `$${equity.toLocaleString()}` : '—'],
      ],
    },
    {
      heading: 'Your Protections',
      step: 3,
      rows: [
        ...PROTECTION_CARDS.map(c => [c.title, protections[c.key] ? 'Yes' : 'No'] as [string, string]),
        ['Signing bonus', hasSigning === 'Yes' ? `$${(parseCurrency(signingRaw) ?? 0).toLocaleString()}` : 'No'],
        ['Functions selected', functions.length > 0 ? String(functions.length) : 'None'],
        ['Team size', teamSizeRaw !== '' ? teamSizeRaw : '—'],
      ],
    },
  ];

  return (
    <div>
      {step < 4 && <ProgressSteps current={step} />}

      <div key={step} className="animate-step mt-8">
        {/* ---------------- Step 1 — Your Role ---------------- */}
        {step === 0 && (
          <div>
            <SectionHeader
              title="Tell us about your role"
              sub="This takes about 4 minutes. Your data is anonymized and never linked to your name or employer."
            />
            <div className="space-y-6">
              <div>
                <FieldLabel htmlFor="role_title">Role Title</FieldLabel>
                <input
                  id="role_title"
                  type="text"
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  placeholder="e.g. CISO, VP of Security, Director..."
                  className={inputClass}
                />
                <Helper>Use your actual title — we&apos;ll map it to the right peer group</Helper>
              </div>
              <div>
                <FieldLabel>Role Level</FieldLabel>
                <PillSelect options={ROLE_LEVELS} value={roleTier} onChange={setRoleTier} />
                <Helper>
                  Choose the level that best reflects your position, regardless of exact title
                </Helper>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Step 2 — Your Organization ---------------- */}
        {step === 1 && (
          <div>
            <SectionHeader
              title="About your organization"
              sub="We use this to find your closest peer group. We never store or display your employer's name."
            />
            <div className="space-y-6">
              <div>
                <FieldLabel htmlFor="industry">Industry</FieldLabel>
                <IndustrySelect value={industry} onChange={setIndustry} />
              </div>
              <div>
                <FieldLabel>Company Size</FieldLabel>
                <PillSelect options={SIZE_OPTIONS} value={sizeBucket} onChange={setSizeBucket} />
              </div>
              <div>
                <FieldLabel>Company Structure</FieldLabel>
                <PillSelect options={STRUCTURE_OPTIONS} value={companyStructure} onChange={setCompanyStructure} />
              </div>
              <div>
                <FieldLabel htmlFor="reporting_line">Who do you report to?</FieldLabel>
                <select
                  id="reporting_line"
                  value={reportingLine ?? ''}
                  onChange={e => setReportingLine(e.target.value || null)}
                  className={`${inputClass} appearance-none ${reportingLine ? '' : 'text-aegis-text-subtle'}`}
                >
                  <option value="" disabled>
                    Select who you report to
                  </option>
                  {REPORTING_OPTIONS.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>How often do you present to the Board?</FieldLabel>
                <PillSelect options={BOARD_OPTIONS} value={boardFrequency} onChange={setBoardFrequency} />
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Step 3 — Your Compensation ---------------- */}
        {step === 2 && (
          <div>
            <SectionHeader
              title="Your compensation"
              sub="All figures are anonymized and never displayed individually. Benchmark outputs show ranges across your peer group, never your specific numbers."
            />
            <div className="space-y-6">
              <div>
                <FieldLabel htmlFor="annual_base">Annual Base Salary</FieldLabel>
                <CurrencyInput id="annual_base" value={baseRaw} onChange={setBaseRaw} />
                <Helper>Your current base salary before bonus or equity</Helper>
              </div>
              <div>
                <FieldLabel htmlFor="annual_bonus">Estimated Annual Bonus</FieldLabel>
                <CurrencyInput id="annual_bonus" value={bonusRaw} onChange={setBonusRaw} />
                <Helper>
                  Your target or typical annual bonus. Use $0 if you do not receive a bonus.
                </Helper>
              </div>
              <div>
                <FieldLabel htmlFor="annual_equity">Annual Equity Value</FieldLabel>
                <CurrencyInput
                  id="annual_equity"
                  value={equityRaw}
                  onChange={handleEquityChange}
                  inputRef={equityInputRef}
                />

                {/* Always-visible helper text */}
                <div className="mt-2 space-y-2 text-[12px] leading-[1.5] text-aegis-text-muted">
                  <p>
                    Enter the estimated value of equity that vests in a single year —
                    not your total grant value.
                  </p>
                  <p className="font-medium text-aegis-text-body">How to calculate:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>RSUs: shares vesting this year × current share price</li>
                    <li>Options: shares vesting this year × (current price minus strike price)</li>
                    <li>Carried interest / profit sharing: estimated annual distribution value</li>
                  </ul>
                  <p>
                    Example: a $400,000 grant vesting over 4 years = $100,000 annual
                    equity value.
                  </p>
                </div>

                {/* Common-error callout box */}
                <div
                  className="mt-3 flex gap-2.5 rounded-lg bg-aegis-accent-soft"
                  style={{ borderLeft: '3px solid #C4784A', padding: '12px 16px' }}
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-aegis-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l10 18H2L12 3z" />
                    <path d="M12 10v4" />
                    <path d="M12 17.5v.5" />
                  </svg>
                  <p className="text-[13px] leading-[1.5] text-aegis-text-body">
                    Common error: entering your total grant value instead of the annual
                    vesting value will overstate your equity by 3–4x and affect your
                    scorecard accuracy. If you&apos;re unsure, use the annual calculation
                    above.
                  </p>
                </div>

                <Helper>Use $0 if you do not receive equity compensation.</Helper>

                {/* Equity confirmation — inline, blocks Step 4 until resolved */}
                {equityNeedsConfirmation && (
                  <div
                    data-testid="equity-confirm-card"
                    className="mt-4 rounded-xl border border-aegis-border-strong bg-aegis-bg-subtle"
                    style={{ padding: '16px 20px' }}
                  >
                    <h3 className="text-[14px] font-semibold text-aegis-text-primary">
                      Please confirm your equity entry
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-[1.5] text-aegis-text-body">
                      The equity value you&apos;ve entered (
                      <span className="font-mono">${equity!.toLocaleString()}</span>) is{' '}
                      <span className="font-mono">{equityMultiple.toFixed(1)}x</span> your
                      base salary. This is possible but uncommon for your company profile.
                      Before continuing, please confirm:
                    </p>
                    <div className="mt-3 space-y-2">
                      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-aegis-text-body">
                        <input
                          type="radio"
                          name="equity_confirm"
                          checked={equityConfirmed}
                          onChange={() => setEquityConfirmed(true)}
                          className="mt-0.5 accent-[#2D7A6B]"
                        />
                        Yes — this is my annual vesting value, not my total grant
                      </label>
                      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-aegis-text-body">
                        <input
                          type="radio"
                          name="equity_confirm"
                          checked={false}
                          onChange={handleRecalculate}
                          className="mt-0.5 accent-[#2D7A6B]"
                        />
                        I need to correct this — let me recalculate
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Step 4 — Your Protections ---------------- */}
        {step === 3 && (
          <div>
            <SectionHeader
              title="Your employment protections"
              sub="These governance terms significantly impact compensation benchmarking. They are less commonly negotiated than base salary — but our data shows they are associated with $211K–$362K in additional total compensation depending on the protection type."
            />
            <div className="space-y-3">
              {PROTECTION_CARDS.map(card => (
                <ToggleCard
                  key={card.key}
                  title={card.title}
                  description={card.description}
                  marketNote={card.marketNote}
                  icon={card.icon}
                  on={protections[card.key]}
                  onToggle={() =>
                    setProtections(p => ({ ...p, [card.key]: !p[card.key] }))
                  }
                />
              ))}
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <FieldLabel>Did you receive a signing bonus?</FieldLabel>
                <PillSelect options={['Yes', 'No']} value={hasSigning} onChange={setHasSigning} />
                {hasSigning === 'Yes' && (
                  <div className="mt-4">
                    <FieldLabel htmlFor="signing_amount">Signing Bonus Amount</FieldLabel>
                    <CurrencyInput id="signing_amount" value={signingRaw} onChange={setSigningRaw} />
                  </div>
                )}
              </div>

              <FunctionsSelect selected={functions} onChange={setFunctions} />

              <div>
                <FieldLabel htmlFor="team_size">Team Size</FieldLabel>
                <input
                  id="team_size"
                  type="text"
                  inputMode="numeric"
                  value={teamSizeRaw}
                  onChange={e => setTeamSizeRaw(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className={`${inputClass} font-mono text-[14px]`}
                />
                <Helper>Total number of people who report to you directly or indirectly</Helper>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Review and confirm ---------------- */}
        {step === 4 && (
          <div>
            <SectionHeader
              title="Review your submission"
              sub="Check everything over — you can edit any section before generating your scorecard."
            />
            <div className="space-y-5">
              {reviewSections.map(section => (
                <div key={section.heading} className="rounded-xl border border-aegis-border bg-aegis-bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-medium text-aegis-text-primary">
                      {section.heading}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep(section.step)}
                      className="text-[13px] font-medium text-aegis-brand hover:text-aegis-brand-dark"
                    >
                      Go back to edit
                    </button>
                  </div>
                  <dl className="mt-3 space-y-1.5">
                    {section.rows.map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4 text-[13px]">
                        <dt className="text-aegis-text-muted">{label}</dt>
                        <dd className={`text-right text-aegis-text-body ${/^\$/.test(val) ? 'font-mono' : ''}`}>
                          {val}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-aegis-bg-subtle p-4 text-[13px] leading-[1.6] text-aegis-text-body">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#2D7A6B]"
                />
                I confirm that the information I&apos;ve provided accurately reflects my
                current role and compensation. I understand my data will be anonymized
                and used to generate aggregate benchmarks for the Aegis platform.
              </label>

              {submitError && (
                <p className="text-[13px] leading-[1.5] text-aegis-danger">{submitError}</p>
              )}

              <button
                type="button"
                disabled={!agreed || submitting}
                onClick={handleSubmit}
                className="h-12 w-full rounded-xl bg-aegis-brand text-[15px] font-medium text-white transition-colors duration-200 hover:bg-aegis-brand-dark disabled:opacity-50"
              >
                {submitting ? 'Generating…' : 'Generate my scorecard'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`text-[14px] font-medium text-aegis-text-muted transition-colors duration-200 hover:text-aegis-text-primary ${
              step === 0 ? 'invisible' : ''
            }`}
          >
            ← Back
          </button>
          <button
            type="button"
            disabled={!stepValid[step]}
            onClick={() => setStep(s => s + 1)}
            className="h-12 rounded-xl bg-aegis-brand px-8 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-aegis-brand-dark disabled:opacity-50"
          >
            {step === 3 ? 'Review' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
