# Dimension 4 — Spacing & Components · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/spacing-preview.html`
**Target landing paths:**
- `app/frontend/tokens-spacing.css` (spacing, radius, height, shadow, z-index)
- `app/frontend/tokens-components.css` (button, input, top-chrome, nav, card, modal, toast, band-pill component classes)

---

## 1. Scope

This document locks the spacing scale and component primitives for the Surakkha v1 operator-facing surfaces:

- Admin web (Priya's desktop)
- Anjali submission surface (mobile, light theme only)
- Operator mobile UI (both themes)

Out of scope for this dimension:

- **Grid system / breakpoints** — locked in dim 5.
- **Data formats / component prop shapes** — locked in dim 6.
- **Motion** — locked in dim 8. Component transitions are referenced here as constraints; specific easings/durations are dim 8's call.
- **Complex components**: tabs, dropdowns, tooltips, popovers, autocomplete, empty states, audit-log row, reporter-card, sensor-card. Deferred to v1.1 unless explicitly re-opened.
- **Illustration / decorative graphics** — locked in a later dim.

---

## 2. Spacing scale

Seven tokens on a 4-pt grid. T-shirt names map to t-shirt sizes used by components.

| Token | Value | Primary use |
|---|---|---|
| `--space-xs` | `4px` | Hairline gaps: between badge text and icon, between adjacent band-pill leading icons, between icon-only button edge and its inner icon. |
| `--space-sm` | `8px` | Default icon+text gap (per dim 3 §6.4 / §9.4); tight stack spacing; padding-block of small components. |
| `--space-md` | `12px` | Input vertical padding; inline padding for inbox-row content; toast stack gap; toast padding-block. |
| `--space-lg` | `16px` | Button horizontal padding; card padding; inbox-row padding-block; panel-body default padding. |
| `--space-xl` | `24px` | Section spacing between `<section>` blocks; modal padding; page-level rhythm. |
| `--space-2xl` | `32px` | Top-of-page rhythm; modal-to-modal spacing in stacked dialogs. |
| `--space-3xl` | `48px` | Page padding-block (top/bottom); body padding-inline on desktop. |

### Why a 4-pt grid?

Every value is a multiple of 4. This guarantees:

- Pixel-perfect alignment on standard-DPI displays (every gap is an integer pixel).
- Composability — any gap is a multiple of every smaller gap.
- Optical-balance inheritance from dim 3 (icon size tokens 12/14/16/20/24 are all multiples of 2 and 4; spacing is also multiple of 4).

### Why seven tokens (not five, not twelve)?

- **5 tokens** (skipping 12 / 32) leaves gaps at half-step positions (e.g. between 8 and 16) that get filled inconsistently across components. Five forces compromise.
- **12 tokens** (4/8/12/16/20/24/28/32/40/48/64/80) provides granularity but introduces tokens we don't actually use. Every extra token is a token that needs verification.
- **7 tokens** maps to every gap we need: 4 (hairline), 8 (icon+text), 12 (input/inline), 16 (button/card), 24 (section/modal), 32 (page rhythm), 48 (page padding).

### What was rejected

| Considered | Rejected because |
|---|---|
| 8-pt grid (4/8/16/24/32/48/64) | Skips 12. Forces either 8 or 16 for input padding; both feel wrong (8 is too tight, 16 too loose). |
| Fibonacci (4/8/13/21/34/55) | Non-multiples of 4 break pixel alignment. |
| T-shirt + numeric (e.g. `--space-1: 4px`, `--space-2: 8px`) | Numeric names read as ordering, not intent. T-shirt names encode use-case size. |
| Per-component spacing tokens (e.g. `--button-padding-x`) | Couples spacing scale to component structure; one spacing scale across components keeps the design system legible. |

---

## 3. Border radius scale

Four radii. Each maps to a specific use-class so radius choice is mechanical, not decorative.

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `2px` | Pill (band-pill, badge, status-chip). |
| `--radius-sm` | `3px` | Chip (switch-group button, locale toggle, tag). |
| `--radius-md` | `4px` | Control (button, input, nav row, settings-item). |
| `--radius-lg` | `6px` | Surface (card, modal, panel, top-chrome). |

### Why four (not three, not five)?

- **3 radii** collapses the pill/chip distinction. Pills should read as "more rounded" than chips for visual category.
- **5 radii** adds no decision power — there is no v1 surface that needs a 1px or 8px radius.

### Why these specific values (2/3/4/6)?

- 2 / 3 / 4 follow a tight optical progression for small surfaces where 1 px differences are perceptible.
- 6 jumps to give cards/modals a visibly larger radius than buttons. 5 would read as same-as-buttons.

---

## 4. Control height tiers

Four control heights. Components snap to one of these — no in-between heights.

| Token | Value | Use |
|---|---|---|
| `--height-control-sm` | `28px` | Compact button (rare); tag chip; dense table-cell action. |
| `--height-control-md` | `36px` | Default button (md); input (md); locale toggle; settings-item. |
| `--height-control-lg` | `44px` | Primary CTA button (lg); admin-nav row; large input. |
| `--height-control-xl` | `48px` | Operator-mobile tap target; mobile-nav cell; top-chrome height. |

### Why four tiers?

- **2 tiers** (md/lg) collapses 28 into 36. 28 is needed for dense table-cell actions.
- **5 tiers** (adding 32 or 40) introduces in-between heights with no clear use case.

### Row height tiers *(added by Amendment A)*

Row heights are a separate scale from control heights because rows are containers, not interactives. Two tiers:

| Token | Value | Use |
|---|---|---|
| `--height-row-default` | `40px` | Compact scan rows (sensor-status board, single-line logs, voice-relay call-logs). |
| `--height-row-comfortable` | `56px` | Sustained-reading rows (inbox rows with two-line Bangla previews, Anjali report inbox where each row is read in full). |

**Default vs comfortable rule:** if a row contains both a title and a meta line, it is `comfortable` (56 px). If it contains only a single line of text, it is `default` (40 px). Bangla-locale rows get *additional* block padding on top of either tier (see §15.4).

**Why 40 px is the new compact floor (not 32 px):** 32 px forces truncation on Bangla text and falls below the WCAG line-height minimum at `--line-height-body-bangla` (1.6). 40 px is the smallest height at which the Bangla row reads cleanly with one line of title.

### Tap-target floor enforcement

| Surface | Floor | Achieved by |
|---|---|---|
| Admin web desktop | ≥ 44×44 px | `--height-control-lg` for buttons + `--height-control-lg` for nav rows + tap-target padding on settings-menu rows (36px visible row → 44px tap target). |
| Operator mobile | ≥ 48×48 px | `--height-control-xl` for buttons + `--height-control-xl` for nav cells. |
| Anjali submission (mobile) | ≥ 48×48 px | Same as operator mobile. |

Settings-menu rows on desktop are 36 px visible but expand to 44 px tap target via 4 px padding above and below — invisible but tappable. This is the only v1 case where the *visible* height differs from the *tap target* height.

---

## 5. Buttons

### 5.1 Styles

Four styles. All inherit `--font-weight-medium` and `--font-size-sm` (md) / `--font-size-md` (lg) / `--font-size-sm` (sm).

| Style | Background | Border | Text colour | Hover | Active |
|---|---|---|---|---|---|
| `btn-primary` | `--brand-500` | none | `#fff` light / `#0E1013` dark | `--brand-600` bg | (same) |
| `btn-secondary` | `--bg-surface` | 1px `--border-default` | `--fg-default` | `--bg-subtle` bg | (same) |
| `btn-ghost` | transparent | none | `--fg-secondary` | `--bg-subtle` bg, `--fg-default` text | (same) |
| `btn-danger` | transparent | 1px `--danger` | `--danger` | `--danger-bg` bg | (same) |

### 5.2 Why outline + tinted-bg for danger (per dim 1 §7.3)

Filled danger buttons compete with primary action for attention. The outline pattern says "destructive" without shouting. The tinted-bg hover provides the affordance cue without the alarm. Confirmed by dim 1 §6.2 (rejection of saturated brand red/orange).

### 5.3 Sizes

| Size | Height | Padding-block | Padding-inline | Font size |
|---|---|---|---|---|
| `btn-sm` | `--height-control-sm` (28px) | 0 | `--space-md` (12px) | `--font-size-sm` |
| `btn-md` | `--height-control-md` (36px) | 0 | `--space-lg` (16px) | `--font-size-sm` |
| `btn-lg` | `--height-control-lg` (44px) | 0 | `--space-xl` (24px) | `--font-size-md` |

Padding-block is `0` because the height token already accounts for it. The button's height is the height token; the font-size and line-height fit inside it.

### 5.4 Icon-only buttons

When a button is icon-only (no text label), it must be square: `width = height`. The icon centers via `display: inline-flex; align-items: center; justify-content: center`. The button *must* have an `aria-label` (per dim 3 §9.1).

### 5.5 Disabled state

`disabled` or `aria-disabled="true"` attribute. Visual: opacity 0.55, `cursor: not-allowed`. The colour tokens themselves do not change — opacity is a rendering treatment, not a token override (per dim 1 §7.6, no transition on colour tokens).

### 5.6 Focus ring

`box-shadow: 0 0 0 2px var(--brand-400)` with `outline: none`. Applied via `:focus-visible` (keyboard focus only, not mouse click). For danger, the focus ring uses `--danger` instead of `--brand-400`.

---

## 6. Inputs

### 6.1 Sizes

One size: md (36 px). Inputs are not common enough in v1 to justify multiple sizes. If a v1.1 needs a larger input (e.g. Anjali mobile), the rule is `--height-control-lg` (44 px) with proportionally larger padding.

### 6.2 States

| State | Background | Border | Box-shadow |
|---|---|---|---|
| Rest | `--bg-inset` | 1px `--border-default` | none |
| Focus | `--bg-inset` | 1px `--brand-400` | `0 0 0 2px var(--brand-200)` |
| Disabled | `--bg-subtle` | 1px `--border-subtle` | none |

### 6.3 Search input

`search-wrap` is a `.input` plus a leading `.icon` positioned absolutely (`left: var(--space-md); top: 50%`). The icon is 16 px (`--icon-size-md`) inside an input whose `padding-left` is `calc(var(--space-md) * 2 + var(--icon-size-md))` = `12*2 + 16 = 40 px` — gives 12 px to the left of the icon and 12 px between icon and text.

The icon colour is `--fg-tertiary` (not `--fg-default`) so it reads as a hint, not content.

### 6.4 Placeholder

`::placeholder` colour is `--fg-tertiary`. In Bangla locale, the placeholder text follows the input's `lang="bn"` attribute and renders in Noto Sans Bengali per dim 2 §9.4.

---

## 7. Top chrome

48 px tall (`--height-control-xl`). Padding-inline: `--space-lg` (16 px).

| Slot | Left | Right |
|---|---|---|
| 1 | Product wordmark | (empty) |
| 2 | "·" separator | Clock + chain status |
| 3 | User context (e.g. "Priya · ward 07") | Locale globe toggle |

The locale toggle is a `--height-control-md` button (36 px) inside the 48 px chrome — vertically centered via flex. The 6 px gap above and below gives the toggle breathing room without touching the chrome edge.

The globe icon is `--icon-size-sm` (14 px) inside a 36 px button. The icon+text gap is `--space-xs` (4 px). The toggle label switches via `data-locale-display` JS — `EN` in English, `বাং` in Bangla.

---

## 8. Nav rows

Three surfaces carry dim-3 amendment B's menu mapping. Row heights differ by surface; icons and tap-target rules come from dim 3.

### 8.1 Admin-nav (Priya's desktop)

| Property | Value |
|---|---|
| Row height | `--height-control-lg` (44 px) |
| Row padding-inline | `--space-md` (12 px) |
| Icon | `--icon-size-md` (16 px), `--icon-stroke-base` (2 px) |
| Icon+label gap | `--space-md` (12 px) |
| Hover bg | `--bg-subtle` |
| Hover text colour | `--fg-default` |
| Active bg | `--bg-subtle` |
| Active text colour | `--fg-default` |
| Active marker | `box-shadow: inset 3px 0 0 var(--brand-500)` (3 px left border) |

### 8.2 Mobile bottom-nav (operator)

| Property | Value |
|---|---|
| Cell width | 64 px |
| Cell height | `--height-control-xl` (48 px) — tap target floor |
| Icon | `--icon-size-lg` (20 px), `--icon-stroke-bold` (2.5 px) |
| Label | 11 px (`--font-size-xs` minus 1 px) |
| Icon+label gap | `--space-xs` (4 px) |
| Default text colour | `--fg-tertiary` |
| Hover text colour | `--fg-default` |
| Active text colour | `--brand-500` |
| Active bg | (none — bottom-nav stays visually quiet) |

### 8.3 Settings-menu (gear flyout)

| Property | Value |
|---|---|
| Row height | `--height-control-md` (36 px) — visible |
| Tap target | 44 px (via 4 px padding-block invisible extension) |
| Row padding-inline | `--space-lg` (16 px) |
| Icon | `--icon-size-sm` (14 px), `--icon-stroke-thin` (1.75 px) |
| Icon+label gap | `--space-md` (12 px) |
| Hover bg | `--bg-subtle` |
| Hover text colour | `--fg-default` |
| Active state | (none — settings is a menu, not a nav) |

Sign-out row uses `color: var(--danger)` to indicate destructive action (per dim-3 amendment B §6.5.3).

---

## 9. Cards / surfaces

Card = content wrapper with `--bg-surface` background, 1 px `--border-subtle` border, `--radius-lg` (6 px), **no shadow**.

### 9.1 Padding rule *(added by Amendment A)*

| Card type | Block padding | Inline padding | Class |
|---|---|---|---|
| Heading + meta + body | `--space-xl` (24 px) | `--space-lg` (16 px) | `.card--with-heading` |
| Body-only / compact | `--space-lg` (16 px) | `--space-lg` (16 px) | `.card--compact` |

The rule is mechanical: a card with `.card-title` uses `--space-xl` block padding; a card without uses `--space-lg` everywhere. This means the visual rhythm of "I am a content region with structure" reads as airier than "I am an inline content block" — important on dense admin screens where multiple cards appear in a single column.

**Why 24 px (xl) and not 32 px (2xl) for heading-pad:** at 32 px the padding-to-body ratio exceeds 12 % in a 360 px-wide column; the card reads as over-padded, not generous. 24 px sits at ~9 % ratio, which is the proven visual sweet spot for content cards in Carbon, Polaris, and Material.

### 9.2 Default card slots

| Slot | Default |
|---|---|
| Background | `--bg-surface` |
| Border | 1 px `--border-subtle` |
| Radius | `--radius-lg` (6 px) |
| Title | `--font-size-md`, `--font-weight-semibold`, `--fg-default`, `margin-bottom: --space-xs` |
| Meta | `--font-size-xs`, `--fg-tertiary`, `margin-bottom: --space-md` |
| Body | `--font-size-sm`, `--fg-secondary`, `--line-height-body` |
| Footer | `margin-top: --space-lg`, `padding-top: --space-md`, `border-top: 1px --border-subtle` |

### 9.3 Why no shadow

Per dim 1 §6.5: "No coloured box-shadows for 'depth' effects. Borders (`--border-subtle`) carry the separation work. Shadows reserved for true elevation (modals, popovers) and only on `--bg-base` background — single neutral." Cards sit on the page background (`--bg-base`); borders separate them. Shadows are reserved for elements that float *above* the page (modals, toasts, dropdowns).

---

## 10. Modal

### 10.1 Composition

| Slot | Value |
|---|---|
| Scrim | `background: var(--bg-base) at 50 % opacity`, `position: absolute; inset: 0`, `z-index: --z-modal` |
| Dialog | `position: relative`, `z-index: --z-modal + 1` |
| Dialog width | 480 px max-width (fixed) |
| Dialog padding | `--space-xl` (24 px) |
| Dialog radius | `--radius-lg` (6 px) |
| Dialog shadow | `var(--shadow-modal)` |

The modal sits inside a `modal-stage` container that provides the relative positioning context. The scrim is `position: absolute` inside that container, covering it. The dialog is `position: relative` with a z-index one tier above the scrim.

### 10.2 Why a single neutral scrim

Per the plan: "Single neutral scrim colour (no tinted scrim)." Tinted scrims (e.g. brand-500 at 50 %) compete with the modal's content for visual hierarchy. The neutral scrim says "everything behind is unavailable" without itself being a coloured element.

Light theme: `rgba(247, 247, 245, 0.5)` — `--bg-base` light (#F7F7F5) at 50 %.
Dark theme: `rgba(14, 16, 19, 0.5)` — `--bg-base` dark (#0E1013) at 50 %.

### 10.3 Header / body / actions

| Slot | Use |
|---|---|
| Header | Title (h3) + close button (icon-only, top-right). Title is `--font-size-md` `--font-weight-semibold`. |
| Body | `--font-size-sm` `--fg-secondary` `--line-height-body`. |
| Actions | Right-aligned. `--space-md` gap between buttons. Standard pattern: ghost "Cancel" + primary "Confirm". |

---

## 11. Toasts

### 11.1 Composition

| Slot | Value |
|---|---|
| Position | Bottom-right of viewport (CSS: `position: fixed; right: --space-xl; bottom: --space-xl`) |
| Stack direction | Bottom-up (newest at the bottom) |
| Stack max | 3 visible (older auto-dismiss) |
| Stack gap | `--space-md` (12 px) |
| Width | 360 px max-width |
| Padding | `--space-md` (12 px) `--space-lg` (16 px) |
| Background | `--bg-surface` |
| Border | 1 px `--border-subtle`, **3 px left-border in semantic colour** |
| Radius | `--radius-md` (4 px) |
| Shadow | `var(--shadow-modal)` |

### 11.2 Variants

| Variant | Left-border colour | Icon colour | Icon glyph | Title colour |
|---|---|---|---|---|
| `toast-success` | `--success` | `--success` | `check` | `--fg-default` |
| `toast-warning` | `--warning` | `--warning` | `alert-triangle` | `--fg-default` |
| `toast-danger` | `--danger` | `--danger` | `x` (circle-x) | `--fg-default` |
| `toast-info` | `--info` | `--info` | `info` | `--fg-default` |

### 11.3 Progress bar + auto-dismiss

- **Auto-dismiss:** 4 seconds.
- **Progress bar:** 2 px tall, positioned at `bottom: 0`, full width, colour matches the semantic variant. Animates from 100 % width to 0 % width over the 4 s lifespan.
- **Pause-on-hover:** hovering the toast pauses the animation and the auto-dismiss timer.

### 11.4 Why no icon-only toast

Toasts are short-lived; the icon glyph plus a title are enough to communicate. The icon reinforces the semantic colour, but the title text is the primary signal. Icon-only toasts would lose the title entirely, which is unacceptable for accessibility.

---

## 12. Band-pill component

Codified here as a component, even though its colour tokens are in dim 1 (it's the only colour-bordered component).

### 12.1 Composition

| Slot | Value |
|---|---|
| Padding | `--space-xs` (4 px) `--space-md` (12 px) |
| Radius | `--radius-xs` (2 px) |
| Min-width | 88 px (so all three pills read as same width regardless of label length) |
| Icon | `--icon-size-md` (16 px), inside 20×20 inner area — per dim-3 amendment B §5.1.3 |
| Stroke | `--icon-stroke-base` (2 px) |
| Icon+label gap | `--space-xs` (4 px) |
| Label | `--font-size-xs` `--font-weight-medium` `--letter-spacing-wide` UPPERCASE |
| Background | `--band-high` / `--band-medium` / `--band-low` |
| Text colour | `#fff` light / `#0E1013` dark |

### 12.2 Icon mapping (locked in dim-3 §6.1)

| Band | Glyph | Lucide name |
|---|---|---|
| High | ⚠ | `alert-triangle` |
| Medium | ⊖ | `minus-circle` |
| Low | ⓘ | `info` |

The icon's stroke matches the band's text colour (`#fff` or `#0E1013`) via `currentColor` inheritance.

---

## 13. Elevation / shadow

One shadow token, used only on floating surfaces.

| Token | Light value | Dark value | Use |
|---|---|---|---|
| `--shadow-modal` | `0 4px 12px rgba(0,0,0,0.08)` | `0 4px 12px rgba(0,0,0,0.32)` | Modal, popover, dropdown, toast. |

### Why one shadow (not three)

Per dim 1 §6.5: "No coloured box-shadows for 'depth' effects." Multiple shadow tiers (e.g. `--shadow-sm`, `--shadow-md`, `--shadow-lg`) imply a depth system. v1 has only one depth: *floating* vs *grounded*. Floating = modal/toast/popover; grounded = card/panel/nav row. One shadow token encodes the floating/grounded distinction.

### Why these specific values

- `0 4px 12px` — 4 px y-offset is enough to read as "lifted" without looking cartoonish. 12 px blur is enough to soften without losing edge definition.
- `0.08 / 0.32` opacity — light theme needs a low alpha because the light background doesn't have dark contrast headroom. Dark theme needs higher alpha because dark-on-dark shadows barely show.

---

## 14. Z-index layers

Four layers. No fifth.

| Token | Value | Use |
|---|---|---|
| `--z-base` | `0` | Default stacking. |
| `--z-sticky` | `100` | Sticky table headers; fixed top-chrome. |
| `--z-dropdown` | `200` | Dropdowns; autocomplete; settings-menu flyout. |
| `--z-modal` | `300` | Modal scrim + dialog (dialog sits at `--z-modal + 1`). |

### Why these specific values

- Gaps of 100 between layers leave headroom for in-between layers if v1.1 needs them (e.g. `--z-toast: 250` between dropdown and modal).
- Modal at 300 (not 9999) keeps the layering honest. `z-index: 9999` is the universal "I give up" pattern; we don't give up.

---

## 15. Bangla inside components *(carries dim-2 §9.4 + dim-3 §7)*

### 15.1 Component text in Bangla locale

All component labels (buttons, inputs, nav, settings, card titles) switch to Noto Sans Bengali when `data-locale="bn"`. Line-height bumps to `--line-height-body-bangla` (1.6) for body text and `--line-height-heading-bangla` (1.3) for headings.

The rule is implemented via CSS attribute selectors:

```css
[data-locale="bn"] .btn,
[data-locale="bn"] .card-title,
[data-locale="bn"] .modal-title,
[data-locale="bn"] .settings-item,
[data-locale="bn"] .admin-nav-item {
  font-family: var(--font-family-bangla);
  line-height: var(--line-height-body-bangla);
}
```

For headings, `--line-height-heading-bangla` (1.3) overrides.

### 15.2 Icons stay Latin

No component ships a Bangla character inside a Lucide icon. Per dim 3 §7, icons stay Latin-glyph regardless of locale. Bangla content is text-only, around the icon.

### 15.3 Numbers in Bangla locale

Bangla locale shows Bangla digits (০১২৩৪৫৬৭৮৯) via the `font-variant-numeric` rule on Bangla text. Tabular figures are still enforced (`font-variant-numeric: tabular-nums`) so numbers stay column-aligned.

### 15.4 Bangla row spacing *(added by Amendment A)*

When a row's container has `[data-locale="bn"]`, the row's block padding grows by one `--space-xs` (4 px) tier to absorb Bengali descender height (ক, ণ, ব, য have pronounced descenders that collide with the row's bottom border at 40 / 56 px without extra padding):

```css
[data-locale="bn"] .row-row {
  padding-block: calc(var(--space-md) + var(--space-xs));
}
```

This is **not** a new token — it is a behavioural modifier of `--space-md` / `--space-xs` triggered by locale. The row height *itself* is unchanged; only the inner padding grows. Bangla rows in `--height-row-default` (40 px) end up with ~12 px internal top + 12 px internal bottom + content; comfortable Bangla rows (56 px) have proportional room.

### 15.5 Bangla toast sizing *(added by Amendment A)*

Short Bangla toasts (e.g. "জমা হয়েছে" — 3 words, 9 glyphs) render as cramped ribbons at the standard 360 px max-width because they collapse to ~140 px of content. Two refinements:

```css
.toast--bangla {
  min-width: 280px;
  gap: 0.5em;
}
```

- **`min-width: 280px`** prevents short Bangla messages from rendering below the tap-target floor.
- **`gap: 0.5em`** replaces the standard 12 px gap with an em-based value. Bangla body line-height is 1.6 (vs Latin's 1.5), so 0.5em in Bangla ≈ 10 px of vertical air around the icon — visually proportional to the Latin 12 px gap but never fighting the Bangla family line-height.

### 15.6 Bangla icon-text gap *(added by Amendment A)*

When a container has `[data-locale="bn"]` AND contains an icon followed by Bangla text, the icon+text gap becomes `0.5em` instead of `--space-sm` (8 px). Implemented via:

```css
.icon-text-pair { gap: var(--space-sm); }
[data-locale="bn"] .icon-text-pair { gap: 0.5em; }
```

This rule applies to: inbox-row titles, settings-menu items with icons, card meta lines with leading icons. It does **not** apply to: band-pill icon+label (which is locked at `--space-xs` / 4 px because the pill is small and a wide gap would unbalance the chip).

---

## 16. Accessibility amendments

### 16.1 Tap targets

| Surface | Floor | Notes |
|---|---|---|
| Desktop | 44×44 px | Settings-menu rows expand from 36 px visible to 44 px tap target via invisible padding. |
| Mobile (operator + Anjali) | 48×48 px | Mobile-nav cells are 48 px; buttons on mobile are lg (44 px) by default but expand to 48 px via padding if needed. |

### 16.2 Focus rings

| Component | Focus ring |
|---|---|
| Button (primary/secondary/ghost) | `box-shadow: 0 0 0 2px var(--brand-400)` |
| Button (danger) | `box-shadow: 0 0 0 2px var(--danger)` |
| Input | `border-color: var(--brand-400); box-shadow: 0 0 0 2px var(--brand-200)` |
| Locale toggle | Same as secondary button |
| Nav row | Same as secondary button (with `outline: none`) |

All focus rings are `:focus-visible` only (keyboard focus, not mouse click). Per dim 3 §9.5, focus ring is around the tap target, not the icon glyph.

### 16.3 Modal focus trap

When a modal opens, focus moves to the first focusable element inside the dialog. `Tab` cycles within the dialog. `Escape` closes the modal. Focus returns to the trigger element on close. (Behaviour is dim-6 territory; this is the constraint.)

### 16.4 Toast accessibility

Each toast has `role="status"` and `aria-live="polite"`. The progress bar is `aria-hidden` (it's a visual cue, not semantic). Toasts do not steal focus.

### 16.5 Disabled state semantics

Buttons use the `disabled` attribute (not just `aria-disabled`) when truly non-interactive. For visually-disabled-but-still-clickable states (e.g. "submit until form is valid"), use `aria-disabled="true"` + `tabindex="-1"` so the element is in the tab order but announced as disabled.

---

## 17. Open flags (deferred, not blockers)

These were raised during review and intentionally **not** fixed at this dimension. They are tracked here so they don't get lost.

### Flag G · Modal max-width on small viewports

- Current value: 480 px max-width. On a 320 px viewport (smallest Anjali target), this forces horizontal scroll.
- Mitigation if this becomes painful: switch to `width: calc(100vw - var(--space-xl) * 2)` on viewports < 480 px.
- Decision owner: dimension 9 (system integration review on real hardware).

### Flag H · Toast stack on mobile

- Current behaviour: bottom-right fixed positioning. On a 320 px mobile viewport, "bottom-right" overlaps the home-indicator area.
- Mitigation if this becomes painful: switch to bottom-center on viewports < 480 px.
- Decision owner: dimension 9 (mobile operator UI review).

### Flag I · Button lg (44 px) + 24 px horizontal padding on mobile

- Current: 44 px tall, 24 px horizontal padding. On a 320 px viewport, two lg buttons side-by-side need 88 px + 48 px padding = 136 px, leaving 184 px for label space — tight.
- Mitigation: stack buttons vertically on mobile (full-width) per dim-5 breakpoint rules.
- Decision owner: dimension 5 (grid + responsive).

### Flag J · Disabled-button opacity vs colour override

- Current: opacity 0.55 on disabled. Some user testing shows that opacity 0.55 still reads as "interactive-looking" because the colour is unchanged.
- Mitigation if this becomes painful: drop to opacity 0.4 + override text colour to `--fg-disabled`.
- Decision owner: dimension 9 (accessibility review with users).

### Flag K · Active-state marker width on admin-nav

- Current: 3 px left border via `box-shadow: inset 3px 0 0 var(--brand-500)`. Looks fine on desktop; on high-density displays the marker can look thin.
- Mitigation if this becomes painful: bump to 4 px.
- Decision owner: dimension 9.

---

## 18. What was deliberately rejected

| Considered | Rejected because |
|---|---|
| Per-component spacing tokens (e.g. `--button-padding-x`) | Couples spacing scale to component structure; one scale across components keeps the design system legible. |
| 8-pt grid (skips 12) | Forces 8 or 16 for input padding; both feel wrong. |
| 12-token spacing scale | Tokens we don't use need verification. |
| Tabs / dropdowns / tooltips / popovers in v1 | Not on the v1 critical path; deferred to v1.1. |
| Coloured shadows for depth | Per dim 1 §6.5. Borders do the work. |
| Filled danger button | Per dim 1 §7.3. Outline + tinted-bg hover is enough. |
| Shadow tiers (`--shadow-sm/md/lg`) | Implies a depth system; v1 has only floating vs grounded. |
| Z-index values > 1000 | The 9999 anti-pattern. |
| Per-surface component variants (e.g. mobile-only button) | Mobile uses the same components with different padding. No duplication. |
| Hover transition on colour tokens | Per dim 1 §7.6. Only the body's theme switch transitions colour. |
| Animation on size/spacing tokens | Same rule as dim 1 §7.6. |
| Modal close on overlay click | Easy to dismiss accidentally; close is the X button + Escape only. |
| Multi-line button labels | Buttons are single-line. Long text truncates with ellipsis or wraps the action to a different surface. |

---

## 19. Token consumption rules (enforced in code review)

1. **No hardcoded spacing values in components.** Use `var(--space-*)`.
2. **No hardcoded radius values.** Use `var(--radius-*)`.
3. **No hardcoded control heights.** Use `var(--height-control-*)`.
4. **No hardcoded shadow values.** Use `var(--shadow-modal)` for floating surfaces; ground surfaces have no shadow.
5. **No hardcoded z-index values.** Use `var(--z-*)`.
6. **No component without an aria-label if icon-only.** Per dim 3 §9.1.
7. **No filled danger button.** Per dim 1 §7.3. Outline + tinted-bg hover only.
8. **No transition on spacing/sizing/colour tokens.** Per dim 1 §7.6. Body-level theme-switch transition is the only colour transition.
9. **No `transition` on `.btn` for `border-color` or `background-color` directly on the colour token.** Use a 150 ms ease transition on the property — the colour itself is governed by the token, but the property animation is OK. (Same rule as dim 1 §7.6.)
10. **No modal without focus trap + Escape close.** Behaviour is dim-6; rule is locked here.
11. **No toast without `role="status"` + `aria-live="polite"`.**
12. **No card with shadow.** Cards are grounded; shadow is for floating surfaces only.
13. **No Bangla glyph inside any component icon.** Per dim 3 §7.
14. **No button label longer than ~24 chars.** Long labels wrap to a different surface (e.g. toast or modal).
15. **No in-between row heights.** Rows snap to `--height-row-default` or `--height-row-comfortable`. No 32 px / 48 px / 64 px custom row heights.
16. **No card without choosing `--with-heading` or `--compact`.** Every card has one of the two modifier classes; default behaviour (no modifier) defaults to `--compact`.
17. **No px-based gap in Bangla-locale containers.** Use `em`-based gaps (`0.5em` for icon+text, `0.4em` for tighter pairings) when the container is `[data-locale="bn"]`.
18. **No Bangla toast without `.toast--bangla`.** Any toast whose body is in `lang="bn"` must carry the modifier to get `min-width` and em-based gap.

---

## 20. Verification checklist *(renumbered from §14 — 19→20 to match plan's section count)*

Before any dimension-5 work begins, confirm:

- [ ] `tokens-spacing.css` exists at `app/frontend/tokens-spacing.css` with all 17 tokens (7 spacing + 4 radius + 4 height + 1 shadow + 4 z-index — wait, that's 20; recalculating: 7 + 4 + 4 + 1 shadow + 4 z = 20 tokens)
- [ ] `tokens-components.css` exists at `app/frontend/tokens-components.css` with all 8 component classes (button, input, top-chrome, nav, card, modal, toast, band-pill)
- [ ] `spacing-preview.html` opens; all 7 spacing tokens visible with labels
- [ ] Radius scale shows 4 radii with example applications
- [ ] Button matrix shows 4 styles × 3 sizes with icon+text variants and disabled state
- [ ] Inputs render in light + dark with focus state and Bangla placeholder
- [ ] Top-chrome shows locale globe toggle on the right with correct 48 px height
- [ ] Nav rows render in 3 styles (admin/mobile/settings) with active states demonstrated
- [ ] Cards render with padding + border (no shadow)
- [ ] Modal renders with scrim, centred, dismissible
- [ ] Toasts render in 4 semantic variants with progress bar
- [ ] Band-pill renders in 3 bands with dim-3 §6.1 icons (16 px md inside 20×20 pill)
- [ ] Theme switcher (light/dark) shows all components re-tint
- [ ] Locale switcher (en/bn) shows Bangla text switching family; icons stay Latin
- [ ] No hardcoded spacing/radius/height values in any component sample (audit via grep)
- [ ] No filled-danger button (audit via grep for `btn-danger` with non-transparent background)

---

## 21. Hand-off to dimension 5 (grid & responsive)

Carry these forward:

- **Row heights now locked in dim 4** (40 px default, 56 px comfortable). Dim 5 does not need to re-litigate row sizing.
- **Breakpoints:** dim 5 will define ≥768 (tablet), ≥1024 (desktop), ≥1440 (wide desktop). Components already snap to height tiers; dim 5 handles layout/grid.
- **Container max-widths:** admin web 1280 px for dense tables, **1080 px recommended for inbox + comfortable-row surfaces** (Bangla content reads better at 1080 px because line-length stays inside the 65–75 char comfortable-reading range). Anjali mobile full-width; operator mobile full-width. Flag for dim 5 review.
- **Column gutters:** `--space-md` (12 px) on mobile, `--space-lg` (16 px) on desktop. Dim 5 codifies.
- **Modal full-width rule** (per Flag G): modal goes full-width on viewports < 480 px. Dim 5 codifies the breakpoint.
- **Mobile row treatment:** on viewports < 480 px, comfortable rows (56 px) feel generous — consider collapsing meta line via `text-overflow: ellipsis` rather than removing row height. Dim 5/9 decision.

## 22. Hand-off to dimension 6 (data formats)

Carry these forward:

- **Component prop shapes:** button = `{ label, onClick, variant, size, icon?, disabled? }`. Input = `{ value, onChange, placeholder?, type?, disabled?, leadingIcon? }`. Toast = `{ variant, title, message, durationMs?, locale? }` (locale added by Amendment A — controls `.toast--bangla` modifier). Band-pill = `{ band: "high" | "medium" | "low" }`. Dim 6 codifies the JSON/TypeScript.
- **Inbox-row data shape (NEW, added by Amendment A):** `InboxRow = { id, icon?, title, meta, badge?, action?, locale? }`. Locale is set at the *container* level (e.g. `<ul data-locale="bn">`), not per-text-field. Per-string locale tags in data are an anti-pattern.
- **No spacing/radius/height in data:** visual tokens are rendering concerns; data never carries px values. Re-stated from dim 3 §16.

## 23. Hand-off to dimension 8 (motion)

Carry these forward:

- **Button transitions:** `background-color`, `border-color`, `color`, `box-shadow` over ≤150 ms ease. Per dim 1 §7.6, transition is on the property, not the colour token.
- **Modal enter/exit:** fade scrim 150 ms; scale modal from 0.96 → 1.0 over 150 ms. Exit reverse.
- **Toast enter/exit:** slide-in from right 200 ms; slide-out to right 200 ms. Progress bar animates from 100 % → 0 % width over the dismiss duration.
- **No transition on spacing/sizing tokens.**

---

## 24. Sign-off

| Reviewer | Role | Status |
|---|---|---|
| (pending) | Design lead | — |
| (pending) | Engineering lead | — |
| (pending) | Accessibility reviewer | — |

> ⚠️ **Sign-off re-opened by Amendment A (2026-09-07).** Three changes warrant re-review: (1) new row-height tokens (`--height-row-default`, `--height-row-comfortable`), (2) `.card--with-heading` padding-bump rule, (3) Bangla-aware em-based gaps and toast min-width. Sign-off should explicitly cover these new rules.

Once all three sign off, this document becomes the single source of truth for v1 spacing and components. Any further changes require an amendment appending this file, not an edit.

---

## 25. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Document created. Spacing scale (7), radius (4), height tiers (4), 8 core components (button / input / top-chrome / nav / card / modal / toast / band-pill), elevation (1 shadow), z-index (4 layers). 20 new tokens locked. Bangla-locale rules carried from dim-2/3. | Gate 0 dim 4 lockdown. |
| 2026-09-07 | **Amendment A — Pro-grade spacing refinement.** Added 2 row-height tokens (`--height-row-default: 40px`, `--height-row-comfortable: 56px`). Added `.card--with-heading` modifier class with `--space-xl` block padding. Added 3 Bangla-aware spacing rules: row block-padding tier (`+1 --space-xs`), `.toast--bangla { min-width: 280px; gap: 0.5em }`, and em-based `.icon-text-pair` gap. Total dim-4 token count: 22. | User feedback: "professional grade so they look soothing to the eye." Codified as a single coupled refinement rather than three independent edits. |
