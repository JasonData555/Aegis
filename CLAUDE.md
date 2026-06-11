# Aegis — Project Guide

## Working Rules

1. **Ask, don't assume.** If something's unclear, ask before writing a line — no silent guesses about intent, architecture, or requirements.
2. **Simplest solution first.** Implement the minimum thing that works. No abstractions that weren't requested.
3. **Don't touch unrelated code.** If a file isn't part of the current task, leave it.
4. **Flag uncertainty explicitly.** If you're not confident, say so before proceeding — confidence without certainty causes more damage than admitting a gap.

## What Aegis Is

Aegis is a consumer-facing personal intelligence scorecard for individual CISOs and senior security leaders. It answers three questions: **Am I paid fairly? Is my role structured appropriately? Am I protected?**

Business model: data-for-data. A CISO contributes anonymized role/comp data once and receives permanent access to a personalized scorecard benchmarked against verified peers. Contributions feed the Paragon platform's data freshness flywheel.

**Relationship to Paragon**: Paragon (`../Paragon`) is a separate B2B product owned by Hitch Partners. Aegis reads Paragon's survey dataset (read-only) and shares calculation logic, but the naming diverges at the product layer (see Naming Convention). **Never modify Paragon from this project.**

Three comparison modes: **Current** (benchmark my role), **Prospective** (benchmark a role I'm considering), **Compare** (side by side). Only the current role requires a data contribution.

## Build Status

**All 12 build steps complete** (kickoff prompt Part 14), plus Part 15 Paragon cleanup. Every step validated in headless Chrome and/or via scripts: traction engine math (FSS=12 × SI=75 → 19.5), K=15 suppression, email-free contribution storage (injection-tested), equity confirmation triggers (×3 Small/Mid and ×5 any-size), all four scorecard cards, sticky strip during scroll, four-zone TractionMatrix, breakdown arithmetic, prospective debounced re-query, and compare columns.

## Dev Environment

- **Stack**: Next.js 14 (App Router), TypeScript strict, Tailwind CSS 3.4, Resend (magic link email), file-based JSON storage. Deploy target: Vercel.
- **Port**: 3001 (`npm run dev`)
- **Fonts**: Geist via `geist/font/sans` (sans), JetBrains Mono via `next/font/google` (mono — data values only)
- **Validate engine**: `npx tsx scripts/validate-traction.ts`
- **UI testing**: `playwright-core` (devDep) drives system Chrome via `chromium.launch({ channel: 'chrome' })` — no browser download. See `scripts/validate-equity-confirm.js` (needs dev server + a curl cookie jar with a session). Note: `tsx` cannot evaluate component modules with JSX at module scope — test UI behavior through the browser, not unit imports.
- **No Resend key yet**: `/api/auth/request` falls back to logging the magic link to the server console — grab tokens from `data/tokens.json` when testing the flow via curl.
- `.env.local`: `RESEND_API_KEY`, `AEGIS_EMAIL_FROM`, `AEGIS_BASE_URL`, `AEGIS_SESSION_SECRET` (32-byte hex), `PARAGON_DATA_PATH=../Paragon/data/survey.json` (capital P — the folder is case-sensitive on Linux), `ALLOW_WRITES=true`

## Naming Convention — CRITICAL

Every variable, type, label, and comment uses Traction framework naming:

| Use | Meaning |
|---|---|
| `fss` / `FSSResult` | Functional Scope Score |
| `si` / `SurfaceIndex` | Surface Index |
| `surface_multiplier` | the 0.50–2.00 multiplier |
| `traction_score` / `TractionScore` | the composite score |
| Traction Matrix / Traction Zone | the 2×2 viz / archetype |
| `traction_percentile`, `zone_peer_fss_median`, `zone_peer_si_median` | peer positioning |

**Banned everywhere in Aegis** (these exist only in Paragon): `PIS`, `pis`, `RCI`, `rci`, `FrictionIndex`, `friction_index`, `friction_multiplier`, "Leadership Intensity Matrix/Score", "Paragon Intensity Score". Verify with a word-boundary grep before any commit.

## The Traction Framework

Car-traction metaphor: the **tire** is FSS (what you bring — functional scope); the **road surface** is SI (the organizational environment). Traction is how effectively they combine into forward motion.

**FSS — Functional Scope Score** (`lib/function-weights.ts`)
- Tier 1 (×1.5): Product Security/AppSec, Cloud Security, Fraud, Security Operations
- Tier 2 (×1.2): Corp IT Security, GRC, AI/ML Security Engineering, Incident Response, AI Threat Intelligence and IR, IT/BizApps, PQC, IAM
- Tier 3 (×1.0): everything else; flagged-neutral at 1.0 with no penalty: Enterprise Risk, Privacy, AI Ethics, AI Governance Policy
- Diminishing returns: 50% weight after function 13. Sum = FSS.
- Both "&" and "and" spellings are keyed (dataset uses "and", UI uses "&") — keep both when adding functions.
- Labels vs peer percentile: Narrow <P25 · Standard P25–P75 · Broad P75–P90 · Expansive >P90

**SI — Surface Index, 0–100** (`lib/traction-engine.ts`, points in `lib/constants.ts`)
- Components: Reporting Line (max 30, case-insensitive contains match), Board Access (max 25), Company Size (max 25), Industry (max 20, tiers A–L, null/unknown → 8)
- `si = min(100, reporting×1.0 + board×1.5 + size×2.0 + industry×0.5)`
- **Industry points follow the Aegis spec, not Paragon's table** (they differ slightly — e.g. Manufacturing 16, Utilities 6)
- Labels: 0–30 Lower · 31–55 Moderate · 56–75 High · 76–100 Very high surface

**Traction Score**
- `surface_multiplier = 0.50 + (si/100) × 1.50` (0.50x at SI=0, 2.00x at SI=100)
- `traction_score = fss × surface_multiplier` · validated r=0.306 with TC (n=926), 118% over FSS alone

**Traction Matrix** — 2×2 of FSS (X) vs SI (Y), split at matched-peer medians:
- **Paragon Leader** (high/high, #2D7A6B, $700k median TC) · **Specialist Surgeon** (low FSS/high SI, #1D9E75, $577k) · **Utility Player** (high FSS/low SI, #C4784A, $403k) · **Generalist** (low/low, #8A9E9C, $380k)

## App Structure

```
app/
  layout.tsx               Geist + JetBrains Mono, aegis-bg-base body
  page.tsx                 Landing — 5 sections (hero, exchange, questions, traction w/ illustrative matrix, trust)
  icon.svg                 Favicon (added to silence the only console 404)
  onboarding/page.tsx      Email verify; handles ?token= from magic link
  onboarding/contribute/   4-step ContributionForm (session-protected)
  onboarding/complete/     Confirmation → /scorecard
  scorecard/page.tsx       Server: session → latest contribution → executeScorecardQuery in-process → ScorecardView.
                           No contribution → redirect /onboarding/contribute. Suppressed → calm explanatory state.
  compare/page.tsx         Same as scorecard but ScorecardView initialMode="compare"
  api/auth/request|verify|logout, api/query, api/contribute   All live and validated
middleware.ts              Protects /scorecard/*, /compare/*, /onboarding/contribute, /api/query, /api/contribute.
                           Edge runtime — verifies session HMAC via Web Crypto (mirrors lib/auth.ts exactly);
                           pages → 307 to /, APIs → 401. Routes re-verify with Node crypto as second layer.
components/
  layout/                  AegisHeader (landing|app variants, logout), PageContainer (760px), StickyStrip (72px, comp/zone/protections)
  shared/                  DataLabel, ConfidenceNote, PercentileBar (client, animated marker),
                           TractionMatrix (live + `illustrative` mode), ScopeGauge, GovernanceMeter (rows, tooltips, missing prompts, combo premium)
  onboarding/              EmailVerifyForm, ProgressSteps, ContributionForm (exports shouldConfirmEquity)
  email/                   MagicLinkEmail (React Email, sent via Resend `react:` prop)
  scorecard/               ScorecardCard (shared shell + CardHeader), ModeToggle, ScorecardHeader,
                           CompensationCard, RoleStructureCard (breakdown row, exports formatMultiplier),
                           ProtectionCard (conditional header tint), TractionCard (car metaphor),
                           ScorecardFooter (methodology + window.print), ScorecardView (client composition:
                           mode state, 300ms-debounced prospective /api/query), ProspectiveForm
                           (exports prospectiveToParams/emptyProspective), CompareView (two columns + delta)
lib/
  format.ts                formatDollarsK / formatDollars / ordinalSuffix
  constants.ts           All point tables, weights, K=15, protection stats, TTLs
  types.ts               SurveyRecord, SurfaceIndex, TractionResult, ScorecardParams/Result, ContributionRecord…
  function-weights.ts    FSS weights + calcFSS + getFSSLabel
  recency-weights.ts     Linear decay 1.0→0.60 over 24mo; weightedPercentile (cumulative-weight), Kish effective N
  data-loader.ts         Reads PARAGON_DATA_PATH read-only, caches, NULLS EMAILS at load
  traction-engine.ts     calcSI, calcTractionScore, classifyTractionZone, calcGovernanceCombination
  anonymization.ts       matchPeers with K=15 + suppression order
  auth.ts                Magic link tokens, SHA-256 email hash, HMAC-signed session cookie
  contribution-store.ts  contributions.json + emailmap.json I/O, scoreContribution (checks 1–7)
  statement-generator.ts generateNarrative — the four card headlines
  query-engine.ts        executeScorecardQuery → ScorecardResult | SuppressedResult
data/           contributions.json, tokens.json, emailmap.json (all gitignored)
scripts/        validate-traction.ts, validate-equity-confirm.js, validate-scorecard.js, validate-compare.js
```

## Scorecard Page Notes (Steps 9–10 implementation)

- The server page runs `executeScorecardQuery` in-process (no HTTP); `/api/query` serves the dynamic prospective re-queries.
- `TractionResult.fss_percentile` is a deliberate spec extension — Part 10's ScopeGauge needs it but Part 9's types omitted it.
- StickyStrip always shows current-role numbers (the personal anchor), even in prospective/compare modes.
- Prospective minimum inputs: role level + base salary; until then a hint renders instead of cards.
- Test hooks: `data-testid` on sticky-strip, traction-matrix, traction-breakdown, traction-explanation, equity-confirm-card, compare-view, compare-column-current|prospective.

## Data & Privacy Rules

**Identity separation (non-negotiable)**: a contributor's email is never stored alongside their data.
- `emailmap.json`: SHA-256(email) → contributor_id UUID. Plaintext email never persisted.
- `tokens.json`: magic link tokens only, 15-min TTL, deleted on use.
- `aegis_session` cookie: signed contributor_id only, 8hr, httpOnly, SameSite strict.
- `contributions.json`: contributor_id only. `addContribution()` strips email keys and aborts the write if any `email*` key survives serialization — keep this enforcement at the store layer, not just routes.
- `data-loader.ts` nulls the `email` field on every survey record at load.

**K-anonymity (K=15)**: no aggregate is shown from fewer than 15 matched peers. Enforced server-side in `matchPeers()` before any calculation; UI enforcement is fallback only. Suppression order when under K: `metro_tier` → `company_structure` → `industry` → `board_frequency` (generalized to has/no board access, not dropped). **Never suppress `role_tier` or `size_bucket`.** Still under K → return `{suppressed, suppression_reason, suggestion}`.

**Contribution confidence** (`scoreContribution`): base 0.70; checks 1–7 adjust (email verified +0.10, base/bonus/equity/team-size/TC plausibility, governance-structure mismatch); floor 0.20, ceiling 1.00. Never reject a submission — flag and weight. Equity >3× base (Small/Mid) triggers an inline confirmation in the form; if confirmed, the flag is informational with no confidence reduction. Equity >5× base loses 0.15 regardless.

**Recency weighting**: all aggregates weight records by linear decay (1.0 at 0 months → 0.60 at 24 months; older records excluded). Percentiles use the cumulative-weight method; confidence levels come from Kish effective N (HIGH ≥30, MEDIUM ≥15, LOW ≥8, else INSUFFICIENT).

## Auth Flow (magic link — built and verified)

1. User submits work email (personal domains rejected — see `isWorkEmail`).
2. `POST /api/auth/request`: `createMagicLinkToken(email)` → Resend sends MagicLinkEmail to `[AEGIS_BASE_URL]/onboarding?token=…` (no key → link logged to console).
3. `/onboarding?token=…` → EmailVerifyForm POSTs `/api/auth/verify`: `consumeMagicLinkToken` (single-use, replay rejected) → `hashEmail` → `getOrCreateContributorId` → `createSessionValue` cookie. New user → `/onboarding/contribute`; returning → `/scorecard`.
4. Middleware (Edge, Web Crypto HMAC) protects `/scorecard/*`, `/compare/*`, `/onboarding/contribute`, `/api/query`, `/api/contribute`.

## Onboarding Form Notes (Part 7 implementation)

- Equity confirmation is an **inline card** below the equity input (per spec, not a modal). Trigger: `shouldConfirmEquity` — equity > base×3 at Small/Mid-Market, OR > base×5 any size. Blocks Next until resolved; any equity edit resets confirmation; "correct this" clears the field and refocuses it. Card has `data-testid="equity-confirm-card"`.
- Board access UI labels map to canonical dataset values on submit (e.g. "Semi-annually" → "At least semi-annually", "I don't report to the Board" → "I do not report to the Board of Directors") so peer matching works.
- `/api/contribute` strips `/email/i` keys from the body, scores via `scoreContribution` against role_tier+size_bucket survey peers (`email_verified: true, domain_plausible: false`), logs flagged records to console as the review queue, never rejects.
- Form sends `annual_bonus`/`annual_equity`/`team_size` as null when empty; `metro_tier` is always null (not collected).

## Design System (essentials — full spec in `design.md`)

Aegis is personal/warm (premium personal-finance tool), deliberately distinct from Paragon's institutional look. All colors are `aegis-*` tokens in `tailwind.config.ts` (brand #2D7A6B teal, accent #C4784A copper, bg-base #FAFAF8, bg-dark #1C2B2A). Geist 400/500/600 for language; JetBrains Mono 400 exclusively for data values (dollars, percentages, scores) — never for narrative. Layout: single 760px centered column, 16px-radius cards, 20px gaps, 72px sticky summary strip on `aegis-bg-dark`. Red (#C0392B) only for below-P25 comp and zero-protection states; copper for "attention," never alarm. Voice: "You're in the top third," not "68th percentile."

Protection display order (strongest comp delta first): Accel Vesting +$362K · Severance +$351K · Indemnification +$211K · D&O +$250K. Premiums are fixed published values in `PROTECTION_STATS`; prevalence is computed live from the peer set.

## Reference Files

- `design.md` — the full visual specification (typography, tokens, layout, component specs, animation, voice)
- `Aegis-Design.md.txt` — original design-system source doc (preserved)
- Kickoff prompt (Parts 1–15) — authoritative product spec; Part 2 overrides Paragon wherever they differ
