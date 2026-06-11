# Aegis — Design System

## Design Philosophy

Aegis is a personal intelligence tool for security executives. The aesthetic is
warm, precise, and trustworthy — the emotional register of a premium personal
finance tool meeting a high-end health dashboard.

The user is looking at their own sensitive data in private. Every design
decision serves one goal: make complex market data feel immediately clear and
personally meaningful.

Contrast with Paragon (the B2B tool): Paragon signals institutional authority.
Aegis signals personal clarity. Same data. Different emotional register.
Different product.

Design reference points: Apple Health (personal data made human) ·
Linear (precision without coldness) · Levels.fyi (comp data made scannable) ·
Stripe Dashboard (trust through craft).

One rule: if a design element cannot be explained in terms of what it
communicates to the user, remove it.

## Typography

**Primary: Geist** (via `geist/font/sans`, CSS var `--font-geist-sans`)
- Weights: 400 (body), 500 (emphasis), 600 (headings)
- Letter-spacing: −0.01em on headings, 0 on body
- Future upgrade path: Söhne by Klim Type Foundry when validating with first
  external users

**Mono: JetBrains Mono** (via `next/font/google`, CSS var `--font-jetbrains-mono`)
- Weight 400, always
- Used exclusively for data values: dollar amounts, percentages, percentile
  values, FSS/SI/Traction scores, record counts, axis labels, score breakdowns
- Never for narrative text or labels — the mono/sans contrast signals
  "precise data value" vs "human language"

**Type scale**

| Style | Spec |
|---|---|
| Display | 36px / 600 / lh 1.1 |
| Heading 1 | 28px / 600 / lh 1.2 |
| Heading 2 | 22px / 600 / lh 1.3 |
| Heading 3 | 18px / 500 / lh 1.4 |
| Body | 15px / 400 / lh 1.7 |
| Label | 12px / 500 / letter-spacing 0.05em / uppercase |
| Caption | 12px / 400 / lh 1.5 |
| Data large | 36px / JetBrains Mono / 400 |
| Data body | 14px / JetBrains Mono / 400 |
| Data small | 12px / JetBrains Mono / 400 |

## Color Tokens

All defined as `aegis-*` under `theme.extend.colors` in `tailwind.config.ts`.

**Backgrounds**: `bg-base` #FAFAF8 (page — warm near-white) · `bg-card` #FFFFFF ·
`bg-subtle` #F4F1EC (section fills, inputs) · `bg-dark` #1C2B2A (hero, sticky
strip, trust section)

**Brand**: `brand` #2D7A6B (primary teal) · `brand-light` #4BA898 (hover,
secondary) · `brand-soft` #E8F5F2 (tints, selected states) · `brand-dark`
#1A5C50 (active states)

**Accent**: `accent` #C4784A (warm copper) · `accent-soft` #FAF0E8 (copper tints)

**Text**: `text-primary` #1C2B2A · `text-body` #3D4F4E · `text-muted` #7A908E ·
`text-subtle` #A8BFBD

**Borders**: `border` #E2DDD6 · `border-strong` #C8C3BC

**Semantic**: `success` #2D7A6B · `warning` #C4784A · `danger` #C0392B ·
`neutral` #8A9E9C

**Usage rules**
- Brand: primary CTAs, active states, positive signals, "you have this"
- Copper: "you may be missing this" prompts — warm, not alarming. Never errors.
- Danger red: only below-P25 comp position and zero-protection states. Sparingly —
  this is someone's personal data and red is alarming.
- Neutral: benchmark reference lines and peer context, not signal.

**Traction Zone colors**: Paragon Leader `brand` #2D7A6B · Specialist Surgeon
#1D9E75 · Utility Player `accent` #C4784A · Generalist `neutral` #8A9E9C.
Quadrant fills: brand-soft / #EEF2FF / accent-soft / bg-subtle at 40% opacity
(60% for the active quadrant).

## Layout

- Single column, centered, scrollable. Max content width 760px
  (`PageContainer`). Horizontal padding 24px mobile / 40px desktop.
- Background `bg-base`. Not a dashboard — a personal document read top to bottom.
- Cards: 24px padding, 16px radius, 20px gap.
  Shadow `0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`;
  hover `0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)`
  (tokens `shadow-card` / `shadow-card-hover`).
- Compare mode: two 360px columns, 16px gap, delta column between on wide screens.

## Component Specifications

### StickyStrip
72px tall, `position: sticky top-0 z-30`. Background rgba(28,43,42,0.95) with
8px backdrop-blur. Sits below AegisHeader, never scrolls away. Three equal
sections divided by 1px `border` at 0.2 opacity:
- Left: comp percentile — value JetBrains Mono 22px white, ordinal suffix
  superscript in Geist 14px; label "TOTAL COMP" 11px uppercase #7A908E
- Center: Traction Zone pill — zone color bg, white 12px Geist 500, 20px radius
- Right: "[X] of 4" mono 22px white; label "PROTECTIONS"

### PercentileBar
Full width, 10px track, 6px radius, track `border`. Distribution fill left to
right: 0–P25 white · P25–P75 brand-soft · P75–P90 brand-light at 60% ·
P90+ brand at 40%. Contributor marker: 12px circle, white fill, 2px brand-dark
border, shadow `0 2px 6px rgba(45,122,107,0.3)`, label above "You — $XXXk"
12px Geist 500 brand-dark. Ticks at P25/P50/P75 (1px, 6px tall) with dollar
labels in mono 11px text-subtle. Marker slides to position 400ms ease-out,
200ms after render.

### TractionMatrix
280×240 plot area. Quadrants split at the matched-peer FSS/SI medians (50/50 in
`illustrative` mode). Corner labels 16px from edges: zone name 11px Geist 500
uppercase + median TC mono 12px muted, colored per zone. Contributor dot 10px
brand fill, 2px white border, shadow `0 2px 8px rgba(45,122,107,0.4)`; hover
tooltip "Traction Score: X.X | FSS: X.X (label) | SI: X (label)"; position
animates 400ms ease on parameter change. Crosshairs: 1px dashed `border` at the
peer medians with end labels "Peer median FSS" / "Peer median SI" 11px
text-subtle. No peer dots — personal tool, not comparative scatter. Axis
labels: "FSS — Functional Scope" (sub "← Narrow … Broad →") bottom; "SI —
Surface Index" (sub "← Lower … Higher →") rotated left. 12px Geist 500 muted.

### GovernanceMeter
Four protection rows ordered strongest comp delta first (Accel Vesting +$362K ·
Severance +$351K · Indemnification +$211K · D&O +$250K), 52px min-height:
- Left: 20px icon + name Geist 14px 500; hover tooltip with full definition
- Center: status pill — "You have this" brand-soft/brand · "Not in your
  package" bg-subtle/muted; 20px radius, 12px Geist 500
- Right: 80×4px prevalence bar (brand fill on bg-subtle track) + percentage
  mono 12px + premium mono 13px (brand if held, muted if missing)
- Missing prompt (prevalence >40% and missing): indented below the row,
  "→ X% of your peers have this. Typical premium: +$Xk." 13px copper italic —
  helpful signal, not a warning
- Combination premium (2+ held): sentence below rows with the delta in mono brand

### ScorecardCard / CardHeader
Shared card shell. Header: 40px brand-soft icon circle + heading 18px/600 +
sub 13px muted. ProtectionCard tints the header brand-soft when all 4
protections are held, accent-soft at zero.

### ProspectiveForm
Compact inline version of the contribution fields (selects, mono currency
inputs, protection chips, collapsible function pills). Slides down 200ms ease
on mode switch; the scorecard re-queries 300ms (debounced) after each change.

## Interaction and Animation

- Transitions: 200ms ease on all interactive elements (150ms on mode pills)
- Card hover: shadow deepens 200ms — no scale (scale feels wrong for personal data)
- PercentileBar marker: 400ms ease-out slide, 200ms delay
- TractionMatrix dot: 400ms ease position animation
- Contribution form steps: 250ms ease slide-in (`animate-step`) — turning pages
- ProspectiveForm: 200ms slide-down (`animate-slide-down`)
- Prospective re-query: 300ms debounce
- Toggle cards and switches: 200ms ease on all properties

## Voice and Tone

- Headlines: direct and personal. "You're in the top third." Not "Your
  compensation is at the 68th percentile."
- Data captions: precise and honest. "Based on 47 verified peers."
- Missing protections: helpful, not alarming. "71% of your peers have this."
- Methodology notes: confident and transparent. Own the limitations.
- Error states: calm and specific. "Your peer group is too small to display
  this safely. Try removing the industry filter." Never "An error occurred."

## What Aegis Is Not

- Not a dashboard — no sidebar, no tabs, no multiple views
- Not a report generator — no export-first design
- Not a sales tool — no upsell prompts, no feature gates
- Not alarming — red used sparingly, copper for attention
- Not Paragon — different font, radius, color temperature, layout, and tone
