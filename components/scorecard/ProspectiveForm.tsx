'use client';

import { useState } from 'react';
import { INDUSTRY_LIST } from '@/lib/constants';
import { UI_FUNCTIONS } from '@/lib/function-weights';
import type { ScorecardParams } from '@/lib/types';

// Compact inline prospective-role inputs — same fields as the contribution
// form. The scorecard updates dynamically as fields change (300ms debounce,
// handled by ScorecardView).

export interface ProspectiveInputs {
  role_tier: string;
  industry: string;
  size_bucket: string;
  company_structure: string;
  reporting_line: string;
  board_frequency: string;
  baseRaw: string;
  bonusRaw: string;
  equityRaw: string;
  has_do: boolean;
  has_indemnification: boolean;
  has_severance: boolean;
  has_accel_vest: boolean;
  functions: string[];
}

export function emptyProspective(roleTier: string): ProspectiveInputs {
  return {
    role_tier: roleTier,
    industry: '',
    size_bucket: '',
    company_structure: '',
    reporting_line: '',
    board_frequency: '',
    baseRaw: '',
    bonusRaw: '',
    equityRaw: '',
    has_do: false,
    has_indemnification: false,
    has_severance: false,
    has_accel_vest: false,
    functions: [],
  };
}

function parseCurrency(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits === '' ? null : Number(digits);
}

/** Null until the minimum inputs (role level + base) are present. */
export function prospectiveToParams(p: ProspectiveInputs): ScorecardParams | null {
  const base = parseCurrency(p.baseRaw);
  if (!p.role_tier || base == null || base <= 0) return null;
  return {
    mode: 'prospective',
    role_tier: p.role_tier,
    industry: p.industry || null,
    company_structure: p.company_structure || null,
    size_bucket: p.size_bucket || null,
    metro_tier: null,
    reporting_line: p.reporting_line || null,
    board_frequency: p.board_frequency || null,
    functions: p.functions,
    annual_base: base,
    annual_bonus: parseCurrency(p.bonusRaw),
    annual_equity: parseCurrency(p.equityRaw),
    has_do: p.has_do,
    has_indemnification: p.has_indemnification,
    has_severance: p.has_severance,
    has_accel_vest: p.has_accel_vest,
  };
}

const ROLE_LEVELS = ['CISO', 'VP Security', 'Director', 'Manager'];
const SIZES = [
  { label: 'Small (<250)', value: 'Small' },
  { label: 'Mid-Market (250–999)', value: 'Mid-Market' },
  { label: 'Large (1,000–4,999)', value: 'Large' },
  { label: 'Enterprise (5,000+)', value: 'Enterprise' },
];
const STRUCTURES = ['Publicly Traded', 'Privately Held', 'PE-Backed', 'Non-Profit', 'Government'];
const REPORTING = [
  'CEO', 'COO', 'President', 'CTO', 'CFO', 'CIO', 'General Counsel',
  'Chief Risk Officer', 'Chief Product Officer', 'Board of Directors', 'Other',
];
const BOARD = [
  { label: 'At least quarterly', value: 'At least quarterly' },
  { label: 'Semi-annually', value: 'At least semi-annually' },
  { label: 'Annually', value: 'At least annually' },
  { label: 'Per request', value: 'Per request' },
  { label: "I don't report to the Board", value: 'I do not report to the Board of Directors' },
];
const PROTECTIONS: Array<{ key: keyof ProspectiveInputs; label: string }> = [
  { key: 'has_do', label: 'D&O' },
  { key: 'has_indemnification', label: 'Indemnification' },
  { key: 'has_severance', label: 'Severance' },
  { key: 'has_accel_vest', label: 'Accel. Vesting' },
];
const ALL_FUNCTIONS = [...UI_FUNCTIONS.technical, ...UI_FUNCTIONS.risk, ...UI_FUNCTIONS.operations];

const selectClass =
  'h-10 w-full rounded-lg border border-aegis-border bg-aegis-bg-card px-3 text-[13px] text-aegis-text-primary outline-none transition-colors duration-200 focus:border-aegis-brand';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProspectiveForm({
  value,
  onChange,
}: {
  value: ProspectiveInputs;
  onChange: (v: ProspectiveInputs) => void;
}) {
  const [functionsOpen, setFunctionsOpen] = useState(false);
  const set = (patch: Partial<ProspectiveInputs>) => onChange({ ...value, ...patch });

  return (
    <div className="animate-slide-down rounded-2xl border border-aegis-border bg-aegis-bg-card p-5 shadow-card">
      <h3 className="text-[15px] font-medium text-aegis-text-primary">Prospective role</h3>
      <p className="mt-0.5 text-[12px] text-aegis-text-muted">
        Describe the role you&apos;re considering — your scorecard updates as you type.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Role Level">
          <select className={selectClass} value={value.role_tier} onChange={e => set({ role_tier: e.target.value })}>
            {ROLE_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Industry">
          <select className={selectClass} value={value.industry} onChange={e => set({ industry: e.target.value })}>
            <option value="">Any industry</option>
            {INDUSTRY_LIST.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field label="Company Size">
          <select className={selectClass} value={value.size_bucket} onChange={e => set({ size_bucket: e.target.value })}>
            <option value="">Any size</option>
            {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Structure">
          <select className={selectClass} value={value.company_structure} onChange={e => set({ company_structure: e.target.value })}>
            <option value="">Any structure</option>
            {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Reports To">
          <select className={selectClass} value={value.reporting_line} onChange={e => set({ reporting_line: e.target.value })}>
            <option value="">Not sure yet</option>
            {REPORTING.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Board Access">
          <select className={selectClass} value={value.board_frequency} onChange={e => set({ board_frequency: e.target.value })}>
            <option value="">Not sure yet</option>
            {BOARD.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </Field>
        <Field label="Base Salary">
          <input
            id="prospective_base"
            type="text"
            inputMode="numeric"
            placeholder="$000,000"
            className={`${selectClass} font-mono`}
            value={value.baseRaw ? `$${Number(value.baseRaw).toLocaleString()}` : ''}
            onChange={e => set({ baseRaw: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </Field>
        <Field label="Annual Bonus">
          <input
            type="text"
            inputMode="numeric"
            placeholder="$000,000"
            className={`${selectClass} font-mono`}
            value={value.bonusRaw ? `$${Number(value.bonusRaw).toLocaleString()}` : ''}
            onChange={e => set({ bonusRaw: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </Field>
        <Field label="Annual Equity">
          <input
            type="text"
            inputMode="numeric"
            placeholder="$000,000"
            className={`${selectClass} font-mono`}
            value={value.equityRaw ? `$${Number(value.equityRaw).toLocaleString()}` : ''}
            onChange={e => set({ equityRaw: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </Field>
      </div>

      {/* Protections — compact chips */}
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
          Protections in the offer
        </div>
        <div className="flex flex-wrap gap-2">
          {PROTECTIONS.map(p => {
            const on = value[p.key] as boolean;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => set({ [p.key]: !on } as Partial<ProspectiveInputs>)}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors duration-150 ${
                  on
                    ? 'border-aegis-brand bg-aegis-brand-soft text-aegis-brand'
                    : 'border-aegis-border text-aegis-text-muted hover:border-aegis-border-strong'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Functions — compact collapsible */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setFunctionsOpen(!functionsOpen)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-aegis-brand"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${functionsOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          Functional scope ({value.functions.length} selected)
        </button>
        {functionsOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ALL_FUNCTIONS.map(fn => {
              const on = value.functions.includes(fn);
              return (
                <button
                  key={fn}
                  type="button"
                  onClick={() =>
                    set({
                      functions: on
                        ? value.functions.filter(f => f !== fn)
                        : [...value.functions, fn],
                    })
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors duration-150 ${
                    on
                      ? 'border-aegis-brand bg-aegis-brand-soft text-aegis-brand'
                      : 'border-aegis-border text-aegis-text-body hover:border-aegis-border-strong'
                  }`}
                >
                  {fn}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
