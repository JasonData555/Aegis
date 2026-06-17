'use client';

import { useMemo, useState } from 'react';
import { INDUSTRY_LIST } from '@/lib/constants';
import { UI_FUNCTIONS } from '@/lib/function-weights';

// Shared input primitives and option constants for the contribution flow.
// Used by both the onboarding ContributionForm and the scorecard inline edit
// forms — single source of truth so the two stay visually identical.

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

// ---------------------------------------------------------------------------
// Option constants
// ---------------------------------------------------------------------------

// UI board options map to the canonical dataset values for storage
export const BOARD_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'At least quarterly', value: 'At least quarterly' },
  { label: 'Semi-annually', value: 'At least semi-annually' },
  { label: 'Annually', value: 'At least annually' },
  { label: 'Per request', value: 'Per request' },
  { label: "I don't report to the Board", value: 'I do not report to the Board of Directors' },
];

export const ROLE_LEVELS = ['CISO', 'VP Security', 'Director', 'Manager'];

export const SIZE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Small (<250)', value: 'Small' },
  { label: 'Mid-Market (250–999)', value: 'Mid-Market' },
  { label: 'Large (1,000–4,999)', value: 'Large' },
  { label: 'Enterprise (5,000+)', value: 'Enterprise' },
];

export const STRUCTURE_OPTIONS = ['Publicly Traded', 'Privately Held', 'PE-Backed', 'Non-Profit', 'Government'];

export const REPORTING_OPTIONS = [
  'CEO', 'COO', 'President', 'CTO', 'CFO', 'CIO', 'General Counsel',
  'Chief Risk Officer', 'Chief Product Officer', 'Board of Directors', 'Other',
];

export const PROTECTION_CARDS = [
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

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted"
    >
      {children}
    </label>
  );
}

export function Helper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[12px] leading-[1.5] text-aegis-text-muted">{children}</p>;
}

export const inputClass =
  'h-12 w-full rounded-xl border border-aegis-border bg-aegis-bg-card px-4 text-[15px] text-aegis-text-primary outline-none transition-colors duration-200 placeholder:text-aegis-text-subtle focus:border-aegis-brand';

export function parseCurrency(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits === '' ? null : Number(digits);
}

export function formatCurrencyDisplay(raw: string): string {
  const n = parseCurrency(raw);
  return n == null ? '' : `$${n.toLocaleString('en-US')}`;
}

export function CurrencyInput({
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

export function PillSelect({
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

export function IndustrySelect({
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

export function ToggleCard({
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

export function FunctionsSelect({
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
