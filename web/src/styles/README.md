# Design Tokens

Surakkha's visual contract is built entirely from CSS custom properties
declared in `mockups/theme.css`. Every component consumes tokens via
`var(--token-name)` — no literal hex, spacing, or font-size appears in
component CSS. When B5 introduces visual regression testing, snapshot
diffs will be reasoned-about against this enumeration, not against a
commit hash.

ADR 0004 ("Design Tokens Lockdown") is the policy. This file is the
catalog. Dim numbers below refer to `mockups/lockdown/` (e.g. `dim-1-colors.md`).

## Color tokens (dim 1)

Declared under `:root` (dark — the default) and `[data-theme="light"]`
(light — toggled via the theme button on `/styleguide`).

### Surface

| Token          | Dark      | Light     | Use                           |
| -------------- | --------- | --------- | ----------------------------- |
| `--bg-base`    | `#0E1013` | `#F7F7F5` | App background, page shell    |
| `--bg-surface` | `#16191D` | `#FFFFFF` | Cards, top chrome, sidebar    |
| `--bg-subtle`  | `#1C2025` | `#F1F1EE` | Hover, secondary fills        |
| `--bg-inset`   | `#22272D` | `#ECEBE7` | Disabled buttons, inset wells |

### Foreground

| Token            | Dark      | Light     | Use                             |
| ---------------- | --------- | --------- | ------------------------------- |
| `--fg-default`   | `#ECEDEE` | `#111418` | Body text, primary content      |
| `--fg-secondary` | `#B5B9BF` | `#4A5159` | Captions, metadata, nav labels  |
| `--fg-tertiary`  | `#80858C` | `#7A8088` | Timestamps, tertiary metadata   |
| `--fg-disabled`  | `#54585E` | `#B8BCC2` | Disabled controls, placeholders |

### Border

| Token              | Dark      | Light     | Use                                   |
| ------------------ | --------- | --------- | ------------------------------------- |
| `--border-subtle`  | `#23272D` | `#E6E5E1` | Card edges, dividers within bg-subtle |
| `--border-default` | `#2E333A` | `#D4D3CF` | Form inputs, default outlines         |
| `--border-strong`  | `#4A4F57` | `#9A9B98` | Focused borders, active outlines      |

### Brand (the only hue the app uses for emphasis)

| Token         | Dark      | Light     | Use                                       |
| ------------- | --------- | --------- | ----------------------------------------- |
| `--brand-600` | `#4A8AC4` | `#0F3A5F` | Brand hover, deep accents                 |
| `--brand-500` | `#5C9AD0` | `#144A78` | Primary buttons, active links, brand text |
| `--brand-400` | `#76AEDF` | `#1F5E91` | Focus rings, info chips, links            |
| `--brand-200` | `#2B3E55` | `#C7D5E3` | Inset brand backgrounds, borders          |
| `--brand-100` | `#1F2D3D` | `#E5EDF4` | Subtle brand backgrounds                  |

### Status (T3 / chain health / page state)

Each status has a foreground token (`--success`, `--warning`, etc.) plus
a paired `--{status}-bg` for backgrounds. Never use one without the
other — status badges need contrast.

| Token pair                   | Dark                  | Light                 |
| ---------------------------- | --------------------- | --------------------- |
| `--success` / `--success-bg` | `#5DB287` / `#1A2D24` | `#1E6E47` / `#E9F2ED` |
| `--warning` / `--warning-bg` | `#D6A865` / `#2D2418` | `#8A5A1A` / `#F4ECDD` |
| `--danger` / `--danger-bg`   | `#D8806E` / `#2D1F1B` | `#8E2E1E` / `#F2E4E0` |
| `--info` / `--info-bg`       | `#76AEDF` / `#1F2D3D` | `#1F5E91` / `#E5EDF4` |

### Banding (T3 ranks)

| Token           | Dark      | Light     | Use                        |
| --------------- | --------- | --------- | -------------------------- |
| `--band-high`   | `#3E9B6E` | `#1E6E47` | T0 / T1 high-priority rows |
| `--band-medium` | `#8A8E94` | `#6B6F76` | T2 medium-priority rows    |
| `--band-low`    | `#5A5C60` | `#A8A9A4` | T3+ low-priority rows      |

### Banding — lockdown palette (added 2026-09-11)

The bmad design lockdown system binds trust-band tokens differently. These tokens are
**additive** — existing `--band-*` tokens above continue to render for legacy consumers.
New components built against Phase 4 specs use these lockdown tokens.

| Token | Hex | Use |
|-------|-----|-----|
| `--color-trust-t1`           | `#E1DDD4` | T1 unverified (divider neutral — lowest verification state) |
| `--color-trust-t2`           | `#B8801E` | T2 verified (amber) |
| `--color-trust-t3-issuance`  | `#B23A2A` | T3 issuance (alert-red-reserved — issuance path ONLY) |
| `--color-trust-resolved`     | `#2F6E45` | Resolved (safe-green) |

Reporter-badge tokens (separate dimension from trust band — added 2026-09-11):

| Token | Hex | Use |
|-------|-----|-----|
| `--color-reporter-anchor`   | `#2F6E45` | Anchor citizen reporter badge |
| `--color-reporter-hotline`  | `#3F6E7C` | Hotline operator reporter badge |
| `--color-reporter-webform`  | `#1B2026` | Web-form reporter badge |
| `--color-reporter-sensor`   | `#B8801E` | Sensor-fired incident reporter badge |

Reference: `docs/D-UX-Design/01-design-system-foundation.md` (lockdown-bound).

### Shadow

| Token            | Value                                                 | Use                            |
| ---------------- | ----------------------------------------------------- | ------------------------------ |
| `--shadow-modal` | `0 4px 12px rgba(0,0,0,0.32)` (dark) / `0.08` (light) | Modals, popovers, theme toggle |

## Typography (dim 2)

| Token                  | Value                                        | Use                           |
| ---------------------- | -------------------------------------------- | ----------------------------- |
| `--font-family-sans`   | `'IBM Plex Sans', 'Noto Sans', system-ui, …` | Default body + chrome         |
| `--font-family-bangla` | `'Noto Sans Bengali', 'Hind Siliguri', …`    | Bangla locale headings + body |
| `--font-family-mono`   | `'IBM Plex Mono', 'JetBrains Mono', …`       | Hashes, IDs, code             |

### Size scale (1.125 ratio — modular)

| Token                 | Value      | Use                           |
| --------------------- | ---------- | ----------------------------- |
| `--font-size-xs`      | `0.75rem`  | Badges, meta                  |
| `--font-size-sm`      | `0.875rem` | Captions, nav links           |
| `--font-size-md`      | `1rem`     | Body text (default)           |
| `--font-size-lg`      | `1.125rem` | Card headings, section titles |
| `--font-size-xl`      | `1.375rem` | Page titles                   |
| `--font-size-xxl`     | `1.75rem`  | Hero text                     |
| `--font-size-display` | `2.25rem`  | Login heading                 |

### Weight

| Token                    | Value | Use                      |
| ------------------------ | ----- | ------------------------ |
| `--font-weight-regular`  | `400` | Body                     |
| `--font-weight-medium`   | `500` | Buttons, nav links       |
| `--font-weight-semibold` | `600` | Card headings, badges    |
| `--font-weight-bold`     | `700` | Brand mark, primary CTAs |

### Line height

| Token                          | Value | Use                                            |
| ------------------------------ | ----- | ---------------------------------------------- |
| `--line-height-tight`          | `1.2` | Display headings                               |
| `--line-height-body`           | `1.5` | Default body                                   |
| `--line-height-body-bangla`    | `1.6` | Bangla body (extra spacing for Bengali glyphs) |
| `--line-height-heading-bangla` | `1.3` | Bangla headings                                |
| `--line-height-loose`          | `1.7` | Long-form text (rare)                          |

## Spacing scale (dim 4)

| Token         | Value  | Use                                 |
| ------------- | ------ | ----------------------------------- |
| `--space-xs`  | `4px`  | Badge padding, tight gaps           |
| `--space-sm`  | `8px`  | Icon-to-label gap, button inner gap |
| `--space-md`  | `12px` | Default control padding (inline)    |
| `--space-lg`  | `16px` | Default card padding                |
| `--space-xl`  | `24px` | Section separation, page padding    |
| `--space-2xl` | `32px` | Top-chrome nav spacing              |
| `--space-3xl` | `48px` | Page-level breathing room           |

## Radius

| Token         | Value | Use                              |
| ------------- | ----- | -------------------------------- |
| `--radius-xs` | `2px` | Tiny chips                       |
| `--radius-sm` | `3px` | Badges                           |
| `--radius-md` | `4px` | Default — buttons, inputs, cards |
| `--radius-lg` | `6px` | Modals, large surfaces           |

## Control heights

| Token                 | Value  | Use                                   |
| --------------------- | ------ | ------------------------------------- |
| `--height-control-sm` | `28px` | Inline actions, top-chrome nav links  |
| `--height-control-md` | `36px` | Inputs, secondary buttons             |
| `--height-control-lg` | `44px` | Primary buttons, default touch target |
| `--height-control-xl` | `48px` | Top chrome height                     |

## Row heights

| Token                      | Value  | Use                      |
| -------------------------- | ------ | ------------------------ |
| `--height-row-default`     | `40px` | Dense tables (audit log) |
| `--height-row-comfortable` | `56px` | Inbox rows, KPI tiles    |

## Foreground on saturated backgrounds (B5.1)

Foreground tokens for use on top of `--danger` / `--info` / `--warning`
/ `--band-medium` fills (severity badges) and on `--brand-600` /
brand-panel gradient (login splash). Theme-invariant — these are
contrast colors, not theme colors.

| Token                        | Value     | Use                                                  |
| ---------------------------- | --------- | ---------------------------------------------------- |
| `--fg-on-status-light`       | `#FFFFFF` | White text on red/blue severity fills                |
| `--fg-on-status-dark`        | `#0E1013` | Dark text on yellow/gray severity fills              |
| `--brand-on-color`           | `#F5F7FA` | Off-white on the brand panel (mark glyph, live text) |
| `--brand-on-color-strong`    | `#FFFFFF` | Pure white for the hero title over dark gradient     |
| `--brand-gradient-dark-from` | `#0B1A2A` | Brand panel dark gradient — top stop                 |
| `--brand-gradient-dark-to`   | `#0F2236` | Brand panel dark gradient — bottom stop              |

## Container widths (dim 5 §3)

These are NOT CSS custom properties — they're hard-coded in `.container--*`
class definitions in `theme.css`. Three breakpoints:

| Class                | Max width | Use                                  |
| -------------------- | --------- | ------------------------------------ |
| `.container--narrow` | `720px`   | Login, form-only pages               |
| `.container--bangla` | `1080px`  | Anjali submission (BN: longer words) |
| `.container--wide`   | `1280px`  | Operator dashboard, inbox            |

## Motion (dim 8)

Theme-invariant. Defined in `mockups/theme.css` under a dedicated
`--motion-*` / `--ease-*` section.

| Token                 | Value                            | Use                          |
| --------------------- | -------------------------------- | ---------------------------- |
| `--motion-press-120`  | `120ms`                          | Button press, persona border |
| `--motion-tab-switch` | `160ms`                          | Persona / nav-link hover     |
| `--motion-pane-in`    | `200ms`                          | Pane slide-in (future)       |
| `--ease-out`          | `cubic-bezier(0.2, 0.8, 0.4, 1)` | State-gain (default)         |
| `--ease-in`           | `cubic-bezier(0.6, 0, 0.8, 0.2)` | State-loss                   |
| `--ease-in-out`       | `cubic-bezier(0.4, 0, 0.6, 1)`   | Symmetric change             |

The remaining 12 dim 8 tokens (modal-in, toast-pane-in, chart-new-point,
shake-300, etc.) ship with their first consumer — adding them now without
a use site is dead weight. See `_bmad-output/design/08-motion-lockdown.md`
for the full enumeration.

## What is NOT a token (deferred)

These literal values appear in component CSS and should be tokens but
aren't yet. Each is a follow-up story; the goal is to eventually have
zero literals outside `theme.css`.

- **Border widths** — currently `1px` everywhere. Could become
  `--border-width-thin`, `--border-width-thick`.
- **Focus offset** — currently `1px` in `.input:focus`. Should be
  `--focus-offset`.
- **Z-index layers** — currently magic numbers (`50`, `100`) in
  `.top-chrome` and `.theme-toggle`. Should be `--z-chrome`, `--z-toggle`.
- **Sidebar width** — currently `240px` in `Sidebar.tsx`. Should be
  `--width-sidebar`.
- **Icon sizes** — `16px` / `20px` / `24px` hardcoded throughout
  components. Could be `--icon-size-{sm,md,lg}`.
- **SSE pulse `1600ms`** — login brand-panel pulse animation. Should
  become `--motion-pulse-1600` (or similar) when the motion section
  gets its full 14-token implementation.
- **`1.875rem` font-size** — `.brand-panel__title` hero text. Could
  become `--font-size-hero`.

## Visual regression (B5.2)

`web/e2e/visual.spec.ts` ships 5 `toHaveScreenshot()` specs covering
the 3 real surfaces × the 3 theme/locale combinations that matter:

| Surface       | Theme | Locale | Snapshot                    |
| ------------- | ----- | ------ | --------------------------- |
| Login picker  | dark  | en     | `login-picker-dark-en.png`  |
| Login picker  | dark  | bn     | `login-picker-dark-bn.png`  |
| Login picker  | light | en     | `login-picker-light-en.png` |
| Inbox (Priya) | dark  | en     | `inbox-priya-dark-en.png`   |
| Field (Karim) | dark  | en     | `field-karim-dark-en.png`   |

Strict matching (`maxDiffPixelRatio: 0.005` — ~0.5% tolerance for
sub-pixel anti-aliasing drift) on a 1280×800 viewport, with the chain
freshness number + toast region masked (time-varying). Animations
disabled globally so the SSE pulse dot doesn't drift frame-by-frame.

To update snapshots after an intentional visual change:

```sh
pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
git add web/e2e/visual.spec.ts-snapshots/
```

## Verification

When adding a new component:

1. **Open `mockups/theme.css`.** If the value you need is in the table
   above, use the token.
2. **If it's not, propose a token first.** Add the value to a new
   `--token-name` in `theme.css`, then reference it from your component.
   The new token should belong to an existing dim (1-8); if it doesn't,
   that's a dim extension, not a new addition.
3. **Run `pnpm lint`.** Pre-commit hook runs `eslint --fix` on the
   changed files; CI runs the full `pnpm lint` (0 errors required).
4. **Run `pnpm test:e2e`** — Vitest covers primitives, Playwright
   covers full routes, and visual.spec covers the 3 ship-ready
   surfaces.

When reviewing a PR:

- Any literal `#hex`, `px` value, or `font-size` in component CSS
  requires a justification ("this is the only place we use this value"
  is acceptable; "I forgot" is not).
- Any change to `theme.css` requires a CHANGELOG entry — the token
  surface is the application contract, and every token has a name
  that's reviewed here.
- Any change that touches the login picker, inbox, or field surfaces
  requires a visual snapshot update via `--update-snapshots`.
