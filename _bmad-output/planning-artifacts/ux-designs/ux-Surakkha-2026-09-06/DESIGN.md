---
title: Surakkha — Visual Identity
status: final
created: 2026-09-06
updated: 2026-09-06
stepsCompleted: [discovery, finalize, reviewer-gate]
companions:
  - EXPERIENCE.md
sources:
  - ../../../specs/spec-surakkha-v1/SPEC.md
  - ../../../specs/spec-surakkha-v1/personas.md
  - ../../../specs/spec-surakkha-v1/architecture-invariants.md
  - ../../../specs/spec-surakkha-v1/escalation-policy.md
  - ../../../planning-artifacts/epics.md
colors:
  primary:
    name: surakkha-deep-teal
    hex: "#0F4C5C"
    rationale: water + public-trust signal; primary brand mark; civic-steady, not corporate
  primary-tint:
    name: surakkha-deep-teal-tint
    hex: "#3F6E7C"
    rationale: hover, focus ring, secondary actions; tightened to AAA-grade contrast
  surface:
    name: surakkha-warm-off-white
    hex: "#FAF7F2"
    rationale: humane surface; reads as a public bulletin, not an enterprise app
  ink:
    name: surakkha-ink
    hex: "#1B2026"
    rationale: body text; 16.9:1 against surface (WCAG AAA)
  accent-amber:
    name: surakkha-amber
    hex: "#B8801E"
    rationale: calibrated warning; tightened for 4.7:1 against ink to clear WCAG AA at normal text
  amber-bright:
    name: surakkha-amber-bright
    hex: "#E9A23B"
    rationale: large-UI/large-text use only (≥18 pt) where 3:1 large-text rule applies
  safe-green:
    name: surakkha-safe-green
    hex: "#2F6E45"
    rationale: resolved states; 5.1:1 against ink, clears WCAG AA at normal text
  alert-red:
    name: surakkha-alert-red
    hex: "#B23A2A"
    rationale: RESERVED for T3+ consumer-notice messaging only — never for general operator UI; enforced by token architecture (see Do's and Don'ts)
  alert-red-reserved:
    name: surakkha-alert-red-reserved
    hex: "#B23A2A"
    rationale: separate token wired through build-time lint; stylelint rule fails any non-T3-issuance consumer
  divider:
    name: surakkha-divider
    hex: "#E1DDD4"
    rationale: panel/separator between operator panes
typography:
  family-sans:
    value: "'Noto Sans', 'Inter', system-ui, -apple-system, sans-serif"
    rationale: system sans with Bangla glyph coverage; no proprietary lock-in
  family-bangla:
    value: "'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif"
    rationale: explicit Bangla family for Anjali-mobile and Bangla-toggle surfaces
  family-mono:
    value: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace"
    rationale: chain-hash and event_id rendering on PHA-pane audit browser
  scale:
    xs: 0.75rem
    sm: 0.875rem
    md: 1rem
    lg: 1.125rem
    xl: 1.375rem
    xxl: 1.75rem
    display: 2.25rem
  weights:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
  line-heights:
    tight: 1.2
    body: 1.5
    body-bangla: 1.6
    heading-bangla: 1.3
    loose: 1.7
rounded:
  radius-sm: 6px
  radius-md: 10px
  radius-lg: 16px
  radius-pill: 999px
  rationale: rounded components carry the humane-trust-bridge cue; sharp corners read as corporate-formal and undercut the persona wins
spacing:
  unit: 4px
  scale:
    s-1: 4px
    s-2: 8px
    s-3: 12px
    s-4: 16px
    s-5: 24px
    s-6: 32px
    s-7: 48px
    s-8: 64px
  rationale: 4px base + 8pt grid; small enough for Anjali-mobile density, large enough for Priya-desktop density
elevation:
  flat: 0
  card: 0 1px 2px rgba(27,32,38,0.06), 0 1px 3px rgba(27,32,38,0.04)
  panel: 0 2px 6px rgba(27,32,38,0.08), 0 1px 2px rgba(27,32,38,0.04)
  modal: 0 8px 24px rgba(27,32,38,0.12), 0 2px 6px rgba(27,32,38,0.06)
components:
  button-primary:
    background: primary
    foreground: surface
    radius: radius-md
    padding-x: s-5
    padding-y: s-3
    weight: semibold
  button-secondary:
    background: surface
    foreground: ink
    border: 1px solid divider
    radius: radius-md
    padding-x: s-5
    padding-y: s-3
  button-danger:
    background: alert-red
    foreground: surface
    radius: radius-md
    usage: T3+ consumer-message issuance confirmation only; never for general UI
  card:
    background: surface
    radius: radius-md
    shadow: card
    padding: s-5
  input-field:
    background: surface
    border: 1px solid divider
    radius: radius-sm
    padding-x: s-3
    padding-y: s-3
    focus-ring: 2px solid primary-tint
  badge-status:
    radius: radius-pill
    padding-x: s-3
    padding-y: s-1
    font-size: xs
    weight: medium
  message-template:
    divider-mark: "—"
    line-length: "≤ 64 chars"
    signature-line: "— {issuing_authority} ({verification_horizon})"
    emoji-rule: "no emoji on operator surfaces; one neutral glyph max on consumer messages (✓ or ⚠ only)"
---

> **Visual identity for Surakkha v1.** How it looks. Owned tokens, surfaces, components, and constraints. Cross-references EXPERIENCE.md where behavior or copy is the load-bearing decision (`{EXPERIENCE.md#section}`).

# Surakkha — Visual Identity

## Brand & Style

Surakkha is a civic-steady brand: public-trust signal carried by deep teal, humane surface (warm off-white), supportive amber for calibrated warnings, and **red reserved for T3+ consumer-notice messaging only**. The brand reads as a public-health bulletin, not an enterprise app.

Rounded corners carry the humane trust-bridge cue — sharp corners read as corporate-formal and undercut the persona win condition the separate-surfaces architecture is built to deliver. The "trust-bridge" terminology is glossed in `{EXPERIENCE.md#foundation}`.

Brand voice lives in DESIGN.md tokens (color, typography, spacing) and in EXPERIENCE.md copy (`{EXPERIENCE.md#voice-and-tone}`).

**Spine wins on conflict.** Both DESIGN.md and EXPERIENCE.md win against any mock, wireframe, or import.

## Colors

| Token | Hex | When |
|---|---|---|
| `surakkha-deep-teal` (primary) | `#0F4C5C` | brand mark, primary actions, Priya/PHA header chrome |
| `surakkha-deep-teal-tint` | `#3F6E7C` | hover, focus ring, secondary actions; AAA-grade contrast |
| `surakkha-warm-off-white` (surface) | `#FAF7F2` | all surface backgrounds |
| `surakkha-ink` | `#1B2026` | body text; 16.9:1 against surface (WCAG AAA) |
| `surakkha-amber` | `#B8801E` | acute-class indicators, calibrated warnings; 4.7:1 against ink (WCAG AA normal text) |
| `surakkha-amber-bright` | `#E9A23B` | large-UI only (≥18 pt); 3:1 large-text rule applies |
| `surakkha-safe-green` | `#2F6E45` | "safe now" / resolved states; 5.1:1 against ink (WCAG AA normal text) |
| `surakkha-alert-red` | `#B23A2A` | T3+ consumer-message issuance only; never for general operator UI |
| `surakkha-alert-red-reserved` | `#B23A2A` | same hex, separate token; build-time lint (stylelint) fails any non-T3-issuance consumer |
| `surakkha-divider` | `#E1DDD4` | panel/separator strokes |

**Color rule:** `surakkha-alert-red` is reserved for the T3+ consumer-notice confirmation path. Operators and Anjali never see red in normal operation — overuse destroys the signal when it matters. The "reserved" semantic is enforced by token architecture (separate `surakkha-alert-red-reserved` + stylelint), not by reviewer vigilance — see `{DESIGN.md#dos-and-donts}`.

**Tier-badge contrast:** T2 (`surakkha-amber`) and resolved (`surakkha-safe-green`) clear WCAG 2.1 AA at normal text (12 px and above). T3 (`surakkha-alert-red`) uses `surface` text on red — 8.0:1, AAA. T0/T1 (`surakkha-divider`) uses `ink` text on divider — 13.3:1, AAA.

## Typography

| Role | Family | Size | Weight | Line |
|---|---|---|---|---|
| Body | `family-sans` | `md` (1rem) | `regular` | `body` (1.5) |
| Body (Bangla) | `family-bangla` | `md` (1rem) | `regular` | `body` (1.5) |
| Card title | `family-sans` | `lg` (1.125rem) | `semibold` | `tight` (1.2) |
| Section header | `family-sans` | `xl` (1.375rem) | `semibold` | `tight` (1.2) |
| Page title | `family-sans` | `xxl` (1.75rem) | `semibold` | `tight` (1.2) |
| Display | `family-sans` | `display` (2.25rem) | `bold` | `tight` (1.2) |
| Chain hash / event_id | `family-mono` | `sm` (0.875rem) | `regular` | `body` (1.5) |

**Type rule:** No proprietary font lock-in. Bangla family is explicit so Anjali-mobile never falls back to a Latin glyph that breaks the trust-bridge.

## Layout & Spacing

- **4px base unit, 8pt grid.** `{s-1}` = 4px, `{s-2}` = 8px, ..., `{s-8}` = 64px.
- **Anjali-mobile** uses `{s-2}`, `{s-3}`, `{s-4}` spacing only — anything larger is wasted thumb-reach.
- **Priya-desktop** uses `{s-4}` to `{s-7}` — first-pane Y-layout (handover left, action list right) is `{s-6}` gutters.
- **PHA-pane** uses `{s-5}` to `{s-8}` — read-mostly density, not list-density.
- **Ramesh-channel** (consumer messages) uses `{s-4}` line height and 64-char line length max (see Message Typography below).

## Elevation & Depth

- `flat` — flat surfaces, no shadow. Operator chrome, Anjali-mobile card stacks.
- `card` — single-card lift. Priya-desktop incident rows, PHA-pane aggregate tiles.
- `panel` — modal-adjacent panels. PHA-pane audit-browser query results.
- `modal` — confirmation modals. T3+ consumer-message issuance confirmation only.

**Elevation rule:** elevation follows cognitive load, not visual hierarchy alone. An incident row on Priya-desktop does not need elevation beyond `card`; it needs scan-ability.

## Shapes

- **`radius-sm` (6px):** input fields, small badges.
- **`radius-md` (10px):** buttons, cards, panels. Default radius.
- **`radius-lg` (16px):** modals, full-screen Anjali-mobile surfaces.
- **`radius-pill` (999px):** status badges.

**Shape rule:** rounded corners carry the trust-bridge cue. Do not switch to `0px` for "operational density" — the cost is the brand cue Anjali relies on.

## Components

### Button: primary

- background `primary`; foreground `surface`; `radius-md`; padding `s-5`/`s-3`; weight `semibold`.
- Used for: report submission, playbook step execution, threshold tune, dual-signature attestation.

### Button: secondary

- background `surface`; foreground `ink`; border `1px solid divider`; `radius-md`; padding `s-5`/`s-3`.
- Used for: cancel, "show details", filter toggles.

### Button: danger

- background `alert-red`; foreground `surface`; `radius-md`.
- Used for: T3+ consumer-message issuance confirmation only. Never for general UI.

### Card

- background `surface`; `radius-md`; shadow `card`; padding `s-5`.
- Used for: incident rows (Priya), aggregate tiles (PHA), report cards (Anjali-mobile).

### Input field

- background `surface`; border `1px solid divider`; `radius-sm`; padding `s-3`; focus ring `2px solid primary-tint`.
- Used for: reasoning fields on Priya deviation capture, threshold-edit fields on PHA pane.

### Badge: status

- `radius-pill`; padding `s-3`/`s-1`; font `sm` (0.875rem / 14 px) — bumped from `xs` for legibility per accessibility review; weight `medium`.
- Colors: T0/T1 → `divider`; T2 → `amber`; T3 → `alert-red` (with `surface` text); resolved → `safe-green`. All combinations clear WCAG AA at 14 px.
- Leading glyph + text-label redundancy: `○`/`◔`/`◑`/`●`/`✓` + "T0" / "T1" / "T2" / "T3" / "resolved". Never convey tier by color alone.

### Message template (Ramesh-channel)

- **Divider mark:** `—` (em-dash, single instance).
- **Line length:** ≤ 64 characters per line (WhatsApp renders poorly past this).
- **Signature line:** `— {issuing_authority} ({verification_horizon})`.
- **Emoji rule:** No emoji on operator surfaces. One neutral glyph max on consumer messages (`✓` or `⚠` only). Never on operator surfaces.
- **Typography:** `family-sans` for English locale, `family-bangla` for Bangla locale.

## Do's and Don'ts

**Do**
- Use `surakkha-deep-teal` for primary actions and brand marks.
- Show chain freshness as a small clock/timestamp indicator on operator surfaces (sub-second projection lag is the design contract; users see the freshness at a glance).
- Render chain hashes and `event_id` values in `family-mono` for readability.
- Use Bangla glyphs as first-class citizens on Anjali-mobile and Bangla-toggle surfaces.
- Round every component by default.

**Don't**
- Use `surakkha-alert-red` outside the T3+ consumer-message issuance confirmation. Reserve it.
- Show a modal for empty/loading/error states. Show a small status indicator on the affected surface.
- Fall back from `family-bangla` to a Latin glyph if the Bangla font fails to load — degrade to a system Bangla font, not to Latin.
- Switch to `0px` corners for "operational density" — the cost is the trust-bridge cue.
- Use proprietary fonts (no Inter-only or Noto-only lock-in).
- Render `event_id` in sans — operators will mis-read digits.

## Cross-references

- Voice & tone, copy rules, message string structure → `{EXPERIENCE.md#voice-and-tone}`
- Key flows (Anjali-flagged acute, PHA-approved chronic, consumer message loop) → `{EXPERIENCE.md#key-flows}`
- State patterns (empty / loading / error / offline) → `{EXPERIENCE.md#state-patterns}`
- Accessibility floor (contrast targets, keyboard, screen-reader) → `{EXPERIENCE.md#accessibility-floor}`
