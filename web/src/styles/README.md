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

## Container widths (dim 5 §3)

These are NOT CSS custom properties — they're hard-coded in `.container--*`
class definitions in `theme.css`. Three breakpoints:

| Class                | Max width | Use                                  |
| -------------------- | --------- | ------------------------------------ |
| `.container--narrow` | `720px`   | Login, form-only pages               |
| `.container--bangla` | `1080px`  | Anjali submission (BN: longer words) |
| `.container--wide`   | `1280px`  | Operator dashboard, inbox            |

## Motion (locked in dim 8; not tokenized)

Motion is locked in `dim-8-motion.md` and currently uses inline `transition`
properties in component CSS (e.g. `transition: background-color 120ms ease-out`).
A motion token (`--motion-duration-fast` etc.) is in the ADR backlog but
NOT yet implemented — when it lands, all transition values get tokenized
in a single pass and this README is updated.

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
- **Transition durations** — see Motion above.

## Verification

When adding a new component:

1. **Open `mockups/theme.css`.** If the value you need is in the table
   above, use the token.
2. **If it's not, propose a token first.** Add the value to a new
   `--token-name` in `theme.css`, then reference it from your component.
   The new token should belong to an existing dim (1-8); if it doesn't,
   that's a dim extension, not a new addition.
3. **Run `pnpm lint`.** The CSS-variable-name lint rule (when added)
   will catch component CSS that uses literals.
4. **Snapshot test** (B5, deferred) will diff the rendered DOM against
   the previous approved baseline.

When reviewing a PR:

- Any literal `#hex`, `px` value, or `font-size` in component CSS
  requires a justification ("this is the only place we use this value"
  is acceptable; "I forgot" is not).
