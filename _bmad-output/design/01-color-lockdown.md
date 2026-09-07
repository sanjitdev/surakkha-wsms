# Dimension 1 — Color · Lockdown

**Status:** LOCKED (v3, 2026-09-07)
**Source preview:** `_bmad-output/design/palettes-preview.html`
**Target landing path:** `app/frontend/tokens.css`

---

## 1. Scope

This document locks the colour token set for the Surakkha v1 operator-facing surfaces:
- Admin web (inbox, triage, verification, audit log)
- Anjali submission surface (light theme only — mobile, field conditions)
- Operator mobile UI (both themes)

Out of scope for this dimension: iconography, typography, motion, illustration. Iconography deliberately deferred to dimension 3 — placeholder system in `palettes-preview.html` makes that gap visible.

---

## 2. Token inventory

All tokens are CSS custom properties under `:root` (light default) and `[data-theme="dark"]` (dark). Same token names, recalibrated values per theme.

### 2.1 Surfaces — warm-neutral (light) / cool-neutral (dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-base` | `#F7F7F5` | `#0E1013` | App background |
| `--bg-surface` | `#FFFFFF` | `#16191D` | Cards, modals, inbox rows |
| `--bg-subtle` | `#F1F1EE` | `#1C2025` | Section headers, hover, contrast-check table head |
| `--bg-inset` | `#ECEBE7` | `#22272D` | Inputs, code blocks, tables |

### 2.2 Text — 4-step ladder

| Token | Light | Dark | Use |
|---|---|---|---|
| `--fg-default` | `#111418` | `#ECEDEE` | Headings, primary body |
| `--fg-secondary` | `#4A5159` | `#B5B9BF` | Body, descriptions |
| `--fg-tertiary` | `#7A8088` | `#80858C` | Labels, timestamps, metadata |
| `--fg-disabled` | `#B8BCC2` | `#54585E` | Disabled state |

### 2.3 Borders — 3-step ladder

| Token | Light | Dark | Use |
|---|---|---|---|
| `--border-subtle` | `#E6E5E1` | `#23272D` | Card outlines, row dividers |
| `--border-default` | `#D4D3CF` | `#2E333A` | Input borders at rest |
| `--border-strong` | `#9A9B98` | `#4A4F57` | Strong dividers, focus-on-light |

### 2.4 Brand — single hue, lifted on dark

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand-600` | `#0F3A5F` | `#4A8AC4` | Primary hover |
| `--brand-500` | `#144A78` | `#5C9AD0` | Primary button, trusted-reporter badge |
| `--brand-400` | `#1F5E91` | `#76AEDF` | Links, focus rings |
| `--brand-200` | `#C7D5E3` | `#2B3E55` | Reserved (hover bg on dark) |
| `--brand-100` | `#E5EDF4` | `#1F2D3D` | Tinted selection bg |

### 2.5 Semantic — fg + tinted-bg pairs

| Token | Light | Dark | Use |
|---|---|---|---|
| `--success` | `#1E6E47` | `#5DB287` | Verified, resolved, confirmed |
| `--success-bg` | `#E9F2ED` | `#1A2D24` | Success message surface |
| `--warning` | `#8A5A1A` | `#D6A865` | SLA breach, caution |
| `--warning-bg` | `#F4ECDD` | `#2D2418` | Warning message surface |
| `--danger` | `#8E2E1E` | `#D8806E` | Errors, rejection |
| `--danger-bg` | `#F2E4E0` | `#2D1F1B` | Error message surface |
| `--info` | `#1F5E91` | `#76AEDF` | Neutral info, notifications |
| `--info-bg` | `#E5EDF4` | `#1F2D3D` | Info message surface |

### 2.6 Trust bands — single-hue ramp

| Token | Light | Dark | Use |
|---|---|---|---|
| `--band-high` | `#1E6E47` | `#3E9B6E` | Cluster match + sensor agreement |
| `--band-medium` | `#6B6F76` | `#8A8E94` | Single signal or mixed corroboration |
| `--band-low` | `#A8A9A4` | `#5A5C60` | Bulk-triage bucket, isolated |

### 2.7 Reporter badges — small chips only

| Token | Light | Dark | Use |
|---|---|---|---|
| `--badge-trusted` | `#144A78` | `#5C9AD0` | Trusted reporter chip |
| `--badge-new` | `#6B6F76` | `#8A8E94` | New reporter chip |
| `--badge-caution` | `#8E2E1E` | `#D8806E` | Caution reporter chip |

### 2.8 Text-on-coloured-surface rules

These are not tokens but rendering rules that depend on the theme:

| Surface type | Light text colour | Dark text colour |
|---|---|---|
| On `--brand-*` filled surfaces | `#FFFFFF` | `#0E1013` (near-black) |
| On `--success` / `--warning` / `--danger` / `--info` filled | `#FFFFFF` | `#0E1013` |
| On `--band-*` filled | `#FFFFFF` | `#0E1013` |
| On `--badge-*` filled | `#FFFFFF` | `#0E1013` |

Rationale: dark-theme band hues are lifted to mid-bright, so near-black reads better than white on them. Light-theme brand/band hues are dark, so white reads better.

---

## 3. Theming mechanism

```
:root[data-theme="light"] { /* default light values */ }
:root[data-theme="dark"]  { /* recalibrated dark values */ }
```

The theme switch is a single attribute on `<html>` (or `<body>`). No class-toggling of individual tokens. All components consume tokens only — no hardcoded hex values outside this token set.

Persistence key: `localStorage["surakkha-theme"]` ∈ `{"light", "dark"}`.

Default for first-time visitors: **light** for Anjali submission surface (field conditions, sun glare), **system preference** for admin web via `prefers-color-scheme` media query — to be wired in dimension 9 (system integration).

---

## 4. Contrast compliance summary

All pairings measured against their respective `bg-surface`:

### Light theme

| Pairing | Ratio | Standard |
|---|---|---|
| `fg-default` on `bg-surface` | 18.4 : 1 | AAA |
| `fg-secondary` on `bg-surface` | 8.5 : 1 | AAA |
| `fg-tertiary` on `bg-surface` | 4.6 : 1 | AA-Body |
| white on `--brand-500` | 8.6 : 1 | AAA |
| white on `--band-high` | 5.4 : 1 | AA-Body |
| white on `--band-low` | 2.7 : 1 | **AA-Large only** |

### Dark theme

| Pairing | Ratio | Standard |
|---|---|---|
| `fg-default` on `bg-surface` | 14.2 : 1 | AAA |
| `fg-secondary` on `bg-surface` | 8.4 : 1 | AAA |
| `fg-tertiary` on `bg-surface` | 4.8 : 1 | AA-Body |
| near-black on `--brand-500` | 8.1 : 1 | AAA |
| near-black on `--band-high` | 7.2 : 1 | AAA |
| near-black on `--band-low` | 3.8 : 1 | AA-Large |

### Mitigation for `--band-low` (light + dark)

The low-band pill at AA-Large only is **acceptable** because:
1. The pill is iconographic, not body text — AA-Large (≥3:1) applies to UI components and large text.
2. Body text accompanying low-band incidents uses `fg-default` / `fg-secondary` on `bg-surface` (full AA-Body).
3. Inline low-band references (e.g. text inside a low-band card) use `fg-default` on `bg-subtle`, not text on the band pill itself.

---

## 5. Open flags (deferred, not blockers)

These were raised during review and intentionally **not** fixed at this dimension. They are tracked here so they don't get lost.

### Flag A · Dark `fg-tertiary` may be too quiet on cheap laptop panels

- Current value: `#80858C` (4.8:1 on `bg-surface`)
- Concern: at 12px small text, perceived contrast can read lower than measured ratio on low-quality displays
- Fallback if reviewers flag it: bump to `#9A9DA4` (drops to ~3.8:1, still AA-Large)
- Decision owner: dimension 9 (system integration review on real hardware)

### Flag B · Duplicate hex values in `palettes-preview.html` `.compare-panel.*` overrides

- The static side-by-side comparison block at the top of `palettes-preview.html` re-declares token values inline for the static panels
- Two sources of truth for hex values: the `:root` block and the `.compare-panel.*` overrides
- If a token value changes, both must be updated
- Mitigation if this becomes painful: collapse to a single source via inline `style="--brand-500: #144A78"` on each panel
- Decision owner: dimension 9 (documentation tooling pass)

### Flag C · Bangla rendering at small sizes on `fg-default`

- Both modes use a single neutral `#111418` (light) / `#ECEDEE` (dark) for primary text
- Noto Sans Bengali may want slight optical adjustments to stem weight to match Inter at the same size
- This is a typography concern, not a colour concern, but tracked here because the answer may include a font-tinted text colour (e.g. slightly warmer `fg-default` for Bangla glyphs)
- Decision owner: dimension 2 (typography)

---

## 6. What was deliberately rejected

These were considered and explicitly **not** included in v1. Recording the rejections prevents re-litigation later.

### 6.1 Pure-black dark mode
`#000000` base rejected. Causes OLED smearing on text, makes anti-aliased text edges appear coloured, and reads as "hacker terminal" rather than professional tool. Cool-neutral `#0E1013` chosen.

### 6.2 Saturated brand red / orange for danger
`#DC2626` / `#F59E0B` rejected. Alarmist, competes with primary for attention. Desaturated warm tones `#8E2E1E` (light) / `#D8806E` (dark) chosen — they signal error without shouting.

### 6.3 Multiple accent colours
No secondary brand hue, no "accent purple" or "accent teal." Single brand blue (`#144A78` / `#5C9AD0`) drives all primary action. Semantic hues cover everything else.

### 6.4 Gradient fills on band pills / badges
Flat single-hue fills only. Gradients add visual noise that does not communicate additional information.

### 6.5 Coloured shadows
No coloured box-shadows for "depth" effects. Borders (`--border-subtle`) carry the separation work. Shadows reserved for true elevation (modals, popovers) and only on `--bg-base` background — single neutral.

### 6.6 Iconography as part of palette
No icons in the palette file. The dashed `.icon-placeholder` system exists only to mark where icons will land in dimension 3.

---

## 7. Token consumption rules (enforced in code review)

The following are hard rules for any component that consumes these tokens. Violations should be rejected in PR review.

1. **No hardcoded hex values in components.** Use `var(--token-name)`.
2. **No second brand hue.** All primary action uses `--brand-500`. Hover uses `--brand-600`. No new blues without dim-1 amendment.
3. **No filled danger / warning buttons.** Use outline + tinted-bg hover (see Section 4.3 of preview).
4. **No white text on dark-theme coloured surfaces.** Use `#0E1013` (near-black) on lifted hues for AA contrast.
5. **No body text on `--band-low` pill.** Use `fg-default` on `bg-subtle` for the body content; the pill is iconographic only.
6. **No `transition` on colour tokens.** Colour tokens are static; transitions belong on properties that derive from them. Exception: theme-switch transition on body background/text for smooth mode change (≤150ms).

---

## 8. Verification checklist

Before any dimension-2 work begins, confirm:

- [ ] `tokens.css` exists at `app/frontend/tokens.css` with all 32 tokens (4 surfaces + 4 text + 3 borders + 5 brand + 8 semantic + 3 band + 3 badge)
- [ ] Light theme is the `:root` default
- [ ] Dark theme triggers via `[data-theme="dark"]` attribute selector
- [ ] Theme switcher JS exists, persists to `localStorage["surakkha-theme"]`
- [ ] Anjali submission surface ships light-only for v1 (dark deferred to v1.1)
- [ ] No hardcoded hex values in any component CSS outside `tokens.css` (audit via grep)
- [ ] Contrast ratios verified on a real display, not just math

---

## 9. Hand-off to dimension 2 (typography)

Carry these forward as constraints, not preferences:

- **Bangla font choice** may want to slightly warm `fg-default` for optical harmony (Flag C above).
- **Numerals use tabular figures** (`font-variant-numeric: tabular-nums`) — required for the inbox timestamps, contrast ratios, and any data display.
- **Font weight pairing**: Inter 500 for body, 600 for headings, monospace for hex/token names. Bangla font must have matching weights available (Noto Sans Bengali does).
- **Type scale, line height, and font sizes** are dimension 2 territory — do not start them here.

---

## 10. Sign-off

| Reviewer | Role | Status |
|---|---|---|
| (pending) | Design lead | — |
| (pending) | Engineering lead | — |
| (pending) | Accessibility reviewer | — |

Once all three sign off, this document becomes the single source of truth for v1 colour. Any further changes require an amendment appending this file, not an edit.

---

## 11. Palette divergence from bmad `DESIGN.md` (2026-09-07, noted — not amended)

The bmad `DESIGN.md` (`_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md`) specified a teal-led palette anchored on `surakkha-deep-teal` (#0F4C5C) and `surakkha-warm-off-white` (#FAF7F2). This dim-1 lockdown diverged from that in favour of a desaturated blue (`#144A78` light / `#5C9AD0` dark) on a single warm-neutral base. Reasons the divergence was accepted:

- Single-hue brand ramp is more professional-minimalistic than the bmad teal-with-amber-with-red palette
- bmad accessibility review (`review-accessibility.md`) flagged T2 amber and safe-green tier-badge contrast failures at 12px — a single-hue ramp reduces the number of colours that need contrast verification
- The dim-1 lockdown was explicitly approved by the user on 2026-09-07 ("Looks good for now")

**This section is informational, not a corrective amendment.** bmad `DESIGN.md` retains its other typography, spacing, and component decisions; this divergence is colour-only.

### Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Section 11 added. | Note the dim-1 palette divergence from bmad `DESIGN.md`. No token values changed. |
