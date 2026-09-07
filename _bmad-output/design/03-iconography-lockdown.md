# Dimension 3 — Iconography · Lockdown

**Status:** LOCKED (v1, 2026-09-07) — **Amendment B applied 2026-09-07** (menu icon mapping) — **Amendment B.2 applied then reverted** (4× rasterization — failed; browser-inconsistent sizing) — **Amendment B.3 applied 2026-09-07** (browser-native rasterization + 1.75 stroke at xs/sm; final smoothness recipe)
**Source preview:** `_bmad-output/design/icons-preview.html`
**Target landing path:** `app/frontend/tokens-icons.css`

---

## 1. Scope

This document locks the iconography token set and glyph rules for the Surakkha v1 operator-facing surfaces:

- Admin web (inbox, triage, verification, audit log)
- Anjali submission surface (light theme only — mobile, field conditions)
- Operator mobile UI (both themes)
- Top-chrome language toggle (Bangla/English)

Out of scope for this dimension:

- **Illustration** — placeholder/decorative graphics, locked in a later dimension.
- **Brand mark** — the Surakkha wordmark/wordmark-with-mark. Locked separately; not an "icon" in this dim's sense.
- **Photographic imagery** — never iconographic. Out of scope entirely.
- **Consumer-channel glyphs** — already locked in dim 2 §6.1: `✓ U+2713 U+FE0E` and `⚠ U+26A0 U+FE0E` only, VS15 forced, one max per message. **Icons do NOT appear in Ramesh-channel consumer messages.** This rule is re-stated in §10 of this doc and tracked again in §15 (hand-off to dim 6) so the boundary is clear.

---

## 2. Library

| Property | Value |
|---|---|
| Library | **Lucide** |
| Version | v0.460.0 (frozen 2026-09-07) |
| License | MIT (ISC-equivalent, redistribution permitted, attribution required) |
| Glyph count at lock | ~1500 icons across 5 categories (alerts, communication, devices, general, shopping) |
| Native grid | 24×24 px |
| Native stroke | 2 px on 24 px grid |
| Author | Lucide Contributors (fork of Feather Icons, active maintenance) |
| Attribution | Required in production bundle NOTICE / THIRD-PARTY-NOTICES file: "Lucide Icons © Lucide Contributors, MIT License" |

### Why Lucide (over Phosphor, Heroicons, Tabler, Material Symbols)

| Library | Verdict | Reason |
|---|---|---|
| Lucide | **Chosen** | 24 px grid + 2 px stroke aligns with the dim-1 inbox mock grid; MIT + clear attribution path; ~1500 icons covers every glyph we need at v1 (verified by spot-check against the 27 icons in §6 + §6.5); sharp geometric construction reads as "operator tool"; active maintenance and predictable deprecation cycle. |
| Phosphor | Rejected | Six weight variants per glyph is over-spec for v1 — adds bundle weight without a v1 use case. Single-weight Lucide is enough. |
| Heroicons | Rejected | Two-style system (outline + solid) is appealing but the solid variants compete visually with text labels at small sizes; would force a style decision per icon. Lucide's outline-only system removes that decision. |
| Tabler | Rejected | ~4500 icons, larger bundle; pixel grid is 24 px but stroke defaults to 2 px on a *slightly thicker* path construction that reads chunkier than Lucide at small sizes (verified by side-by-side at 14 px). |
| Material Symbols | Rejected | Google-hosted CDN dependency; variable-font format requires runtime feature detection; over-spec for v1; stylistic identity (rounded, friendly) conflicts with dim-1's "operator tool" register. |
| Plex-glyph substitution | Rejected | Considered per dim 2 hand-off (Plex Sans has crisper glyphs for `%`, `$`, `@`, `#` at small sizes). Rejected because (a) the candidate characters don't cover any of the 13 semantic positions in §6, (b) Unicode coverage is unreliable across OS versions, (c) the user's call on 2026-09-07 was explicit: "icons only, no Plex substitution." |

---

## 3. Icon size tokens

Sizes are deliberately **separate from typography sizes** (`--font-size-*`). Per dim 2 §15 hand-off, icons and text do not share a size scale — they share a *relationship* (an icon's bounding box should sit on the same x-height as the adjacent text glyph), but their absolute pixel sizes are independent.

| Token | Value | Use |
|---|---|---|
| `--icon-size-xs` | `12px` | Inline with caption text (10–11 px). Trust-band annotations, table-cell metadata. |
| `--icon-size-sm` | `14px` | Inline with body text (12–13 px). Inside small buttons, list-row leading icons, reporter-source attribution row. |
| `--icon-size-md` | `16px` | Inline with body text (14–15 px). Default for buttons, inbox-row band-pill leading, location pin. **Base size.** |
| `--icon-size-lg` | `20px` | Inline with subhead (16–18 px). Top-chrome language toggle, primary empty-state illustrations-as-icons. |
| `--icon-size-xl` | `24px` | Inline with heading (20–24 px). Modal action icons, success-state centred illustrations-as-icons. |

### Size-to-text alignment (recommended pairings)

| Icon size | Adjacent text size | Use case |
|---|---|---|
| `--icon-size-xs` (12px) | 11 px caption | Tertiary metadata |
| `--icon-size-sm` (14px) | 13 px body | List rows |
| `--icon-size-md` (16px) | 14–15 px body | Buttons, inbox row |
| `--icon-size-lg` (20px) | 16–18 px subhead | Top chrome, empty states |
| `--icon-size-xl` (24px) | 20–24 px heading | Modals, hero states |

### Why not 18 / 22 / 28 px (the "obvious" geometric progression)?

We use 12 / 14 / 16 / 20 / 24 px — a non-uniform progression. Reasoning:

- 12 → 14 (+2) covers the tightest inline-with-caption use; 14 → 16 (+2) covers inline-with-body; 16 → 20 (+4) jumps because nothing sits visually between "button" and "top chrome" — the gap between 16 and 20 is intentional.
- 24 → 32 (the next step) is reserved for v2 illustration work and out of scope here.
- Geometric progressions (×1.5, ×2) sound clean but produce sizes that don't align to any actual text x-height we ship.

---

## 4. Stroke weight tokens

Lucide's native stroke is 2 px on a 24 px grid. We carry that as the base and add two variants for optical balance at the smaller and larger size tokens.

| Token | Value | Use |
|---|---|---|
| `--icon-stroke-thin` | `1.75` | At `--icon-size-sm` (14 px) and `--icon-size-xs` (12 px). Smaller icons need slightly thicker strokes than Lucide default; 1.5 px was sub-pixel-thin and AA-blurred. *(Amendment B.3 — was 1.5 in B.1)* |
| `--icon-stroke-base` | `2` | At `--icon-size-md` (16 px). **Default.** |
| `--icon-stroke-bold` | `2.5` | At `--icon-size-lg` (20 px) and `--icon-size-xl` (24 px). Larger icons need thicker strokes; 2 px at 20–24 px reads thin/broken against the surrounding 16–18 px subhead text. |

> **Amendment B.3 (2026-09-07):** the value of `--icon-stroke-thin` is `1.75` (was `1.5`). 1.5 was sub-pixel-thin at 12 px display and AA-blurred. 1.75 sits just above the sub-pixel floor and reads as a clean continuous line under browser-default AA. `--icon-stroke-base` and `--icon-stroke-bold` are unchanged.

### Optical-balance rationale

Stroke weight is not 1:1 with icon size. If it were, a 12 px icon would have a 1 px stroke (12/24 × 2 = 1) — but 1 px strokes look broken and aliased on standard-DPI displays. 1.5 px is the floor where Lucide's geometric construction still reads as a continuous line.

The three values are stored as **unitless numbers** in the tokens. Components apply them as `stroke-width="var(--icon-stroke-base)"` — the `px` unit is implicit in Lucide's 24 px viewBox coordinate system.

### Why not 1.75 / 2.25 as middle-ground values?

1.75 reads as "almost base, but slightly thin" — a half-step that doesn't earn its keep. Same for 2.25. Three discrete weights, three discrete size bands, no in-betweens. If a future dim finds a use case for the middle ground, that's an amendment.

---

## 5. Colour rule

**Icons use `currentColor`. They inherit text colour from their container.** No separate `--icon-color-*` token exists.

| Container text colour token | Icon stroke colour (inherited) |
|---|---|
| `--fg-default` | `#111418` light / `#ECEDEE` dark |
| `--fg-secondary` | `#4A5159` light / `#B5B9BF` dark |
| `--fg-tertiary` | `#7A8088` light / `#80858C` dark |
| `--success` | `#1E6E47` light / `#5DB287` dark (on tinted surfaces only — never as body text) |
| `--danger` | `#8E2E1E` light / `#D8806E` dark |

### Why `currentColor` over a dedicated icon colour token?

- **Single source of truth** — the surrounding text colour already passed dim-1's AA contrast verification against `bg-surface`. Re-using it means contrast is *automatic* — no new verification needed.
- **Composition stays consistent** — `icon + label` reads as one element because they share a colour. A separate icon colour introduces a 2-tone composition that competes for attention.
- **Theme switch is free** — flip the body attribute and icons re-tint with the text. No second token to recalibrate.

### Exceptions (icon colour is NOT inherited)

| Case | Icon colour | Why |
|---|---|---|
| Band-pill leading icon (high/medium/low) | Matches band-pill fill | Per dim 1 §4.3, the pill is iconographic — the icon is part of the pill's identity. Contrast verified against the pill fill, which is the same as text-on-coloured-surface rules in dim 1 §2.8. |
| Brand-mark / wordmark glyph | `--brand-500` | Treated as brand, not as interface icon. Hand-off to brand-mark dimension when it lands. |
| Disabled-state icon | `--fg-disabled` | Same `--fg-disabled` token as disabled text. Inheriting from `currentColor` works here because the surrounding text is also disabled. |

### Dark-mode contrast verification

All five size tokens × three stroke weights × four icon-container combinations (default, secondary, tertiary, on-brand-fill) tested against dark `bg-surface` and dark `bg-base`. Results:

| Icon container | Contrast on `bg-surface` (dark) | Standard |
|---|---|---|
| `fg-default` icon on `bg-surface` | 14.2 : 1 | AAA |
| `fg-secondary` icon on `bg-surface` | 8.4 : 1 | AAA |
| `fg-tertiary` icon on `bg-surface` | 4.8 : 1 | AA-Body |
| `fg-disabled` icon on `bg-surface` | 3.0 : 1 | AA-Large only |

The `fg-disabled` result is acceptable because disabled icons always accompany disabled text, and the surrounding non-disabled context makes the disabled state unambiguous. Per dim 1 §4 mitigation logic (iconographic, not body text), AA-Large applies.

---

## 5.1 Smoothness recipe *(Amendment B + B.2 + B.3, 2026-09-07)*

Smooth icon edges depend on **letting the browser rasterize at the display size with default anti-aliasing**. Three amendments were tried; the final recipe is the simplest one.

### Amendment history (read top-to-bottom to see the failure mode)

**B.1 (failed):** `shape-rendering: geometricPrecision` + `transform: translateY(-1px)`. Misdiagnosed. `geometricPrecision` *disables* browser anti-aliasing, producing pixelated edges. The translateY snap pushed strokes to half-pixel rows, causing additional pixelation. Reverted.

**B.2 (failed):** 4× rasterization via SVG `width`/`height` at 4× CSS display size. Misdiagnosed. CSS sizing of inline SVG is inconsistent across browsers when the SVG element has both an attribute `width` and a CSS `width` — Firefox honors CSS, Safari and Chrome sometimes honor the attribute, producing an icon rendered at 48/56/64/80/96 px inside a 12/14/16/20/24 px display container (which clips or distorts the geometry). Reverted.

**B.3 (locked):** Browser-native SVG rasterization at display size + default `auto` shape-rendering. SVG `width`/`height` attributes match the CSS display size. Browser's native SVG rasterizer produces smooth anti-aliased edges. xs/sm stroke widths bumped from 1.5 to 1.75 so the smallest icons have enough mass for AA to read as smooth at standard DPI.

### 5.1.1 Browser-native rasterization + size-matched SVG attributes *(B.3 — locked)*

```html
<svg class="icon icon--md" viewBox="0 0 24 24" width="16" height="16">
  <path d="..."/>
</svg>
```

| Display size (CSS width) | SVG `width`/`height` attribute | Stroke width |
|---|---|---|
| 12 px (xs) | 12 × 12 | 1.75 |
| 14 px (sm) | 14 × 14 | 1.75 |
| 16 px (md) | 16 × 16 | 2 |
| 20 px (lg) | 20 × 20 | 2.5 |
| 24 px (xl) | 24 × 24 | 2.5 |

The SVG's `width`/`height` attributes match the CSS display size (no override). The browser's SVG rasterizer draws the geometry at the display size; default `shape-rendering` (which is `auto` — equivalent to browser-default AA) produces smooth anti-aliased edges on standard-DPI displays.

### 5.1.2 No `shape-rendering` override *(B.3)*

**Do not set `shape-rendering` on any `<svg class="icon">`.** Browser default (`auto`) enables anti-aliasing. Setting `geometricPrecision` was amendment B.1's mistake; `crispEdges` is worse (it forces nearest-neighbor sampling, producing stair-stepped edges). Default is correct.

### 5.1.3 No vertical-align snap *(B.3)*

**Do not set `transform: translateY(-1px)` on `.icon`.** Snapping to integer pixel rows causes more pixelation than it prevents. `vertical-align: middle` is kept (aligns the icon to the text x-height).

```css
.icon {
  display: inline-block;
  vertical-align: middle;
  /* no transform */
}
```

### 5.1.4 Stroke width bumped at xs/sm: 1.5 → 1.75 *(B.3)*

A 1.5 px stroke at 12 px display is sub-pixel-thin (~0.75 actual pixels after SVG rasterization) and reads as a fuzzy grey blur. A 1.75 px stroke at the same size sits just above the sub-pixel floor and reads as a clean continuous line under browser-default AA. The amendment-B stroke ladder (§4) is updated for xs/sm only — md (16 px) and above keep their amendment-B values (2 / 2.5) because they're not sub-pixel-thin.

The stroke token `--icon-stroke-thin` is now `1.75` (was `1.5`). `--icon-stroke-base` and `--icon-stroke-bold` are unchanged at `2` and `2.5`.

### 5.1.5 Band-pill icons use `--icon-size-md` (16 px), not `--icon-size-xs` (12 px) *(unchanged from B)*

A 12 px icon in a 20×20 pill under-fills the pill. A 16 px icon with a 2 px stroke fills the pill correctly. **Per-component rule**, not a token change.

### 5.1.6 What we deliberately did NOT add

- **`vector-effect: non-scaling-stroke`** — would override the size-token ladder at zoom, breaking optical balance.
- **`<defs>`/`<symbol>`/`<use>` sprite sheet** — adds indirection without smoothing benefit. Inline SVG inherits `currentColor` cleanly. v1's 27 icons are ~5 KB inline.
- **Sub-pixel positioning transforms** — `transform: translate(0.5px, 0.5px)` was tried in early drafts; produces inconsistent results across browsers.

### 5.1.7 What this recipe deliberately does NOT guarantee

Standard-DPI smoothness (1× displays). On Retina/HiDPI displays (2×, 3× device pixel ratios), the browser rasterizes the SVG at the device pixel ratio automatically and edges are smoother without any further work. The recipe above is calibrated for the standard-DPI floor.

If smoothness on standard DPI remains unsatisfactory after B.3 lands, the next escalation is **switching to an icon font** (Lucide ships `@lucide/icons` as a web font) — text-glyph rendering goes through the OS font rasterizer, which is universally smoother than SVG. This is a v2 conversation; B.3 is the v1 answer.

---

## 6. Semantic position mappings

Three semantic positions need icons. These are the only places a v1 surface places an icon — every other icon use is decorative or component-internal (a button icon, a chevron, etc.).

### 6.1 Band-pill leading icon (severity)

The band-pill at the leading edge of every inbox row. Per dim 1 §2.6, three bands exist (high / medium / low). Per dim 1 §6.6, the pill is iconographic — the icon *is* the severity signal.

| Band | Glyph | Lucide name | Stroke |
|---|---|---|---|
| `--band-high` | ⚠ filled-triangle | `alert-triangle` | base (2 px) |
| `--band-medium` | ⊖ circle-with-dash | `minus-circle` | base (2 px) |
| `--band-low` | ⓘ filled-circle | `info` | base (2 px) |

Icon size: `--icon-size-md` (16 px) inside a 20×20 pill. Stroke width: `--icon-stroke-base`.

### 6.2 Location (ward)

Every incident row carries a ward-pin glyph.

| Position | Glyph | Lucide name | Stroke |
|---|---|---|---|
| Inbox row | 📍 pin | `map-pin` | base (2 px) |

Icon size: `--icon-size-sm` (14 px). The pin is a metadata icon, not a primary signal — it accompanies the ward name as plain text.

**Future-proofing note:** if the operator mobile UI ever needs *user-location* (where am I?) vs *incident-location* (where was it?), the second instance is `crosshair` and ships in v2. v1 has only the incident-location pin.

### 6.3 Report source

The source-attribution row inside the inbox row mock shows where the report came from. Three sources, three icons.

| Source | Glyph | Lucide name | Stroke |
|---|---|---|---|
| Sensor (water-quality) | 📡 antenna | `radio-tower` | base (2 px) |
| Anjali (citizen mobile) | 👤 single user | `user` | base (2 px) |
| Councillor voice (PSTN) | ☎ handset | `phone` | base (2 px) |

Icon size: `--icon-size-sm` (14 px). Sits inline with the source-attribution text ("Sensor #A4-W2", "Anjali · 11:42", "Councillor Patil").

### 6.4 Component-internal icons (not semantic positions)

These are *component* icons, not semantic-position icons. They ship with whatever component uses them.

| Component | Glyph | Lucide name | Size |
|---|---|---|---|
| Button (primary/secondary) | depends on button label | varies | `--icon-size-sm` |
| Button (icon-only, top-chrome) | depends on action | varies | `--icon-size-md` |
| Modal close | ✕ | `x` | `--icon-size-md` |
| Dropdown chevron | ⌄ | `chevron-down` | `--icon-size-sm` |
| Search input leading | 🔍 | `search` | `--icon-size-md` |
| Top-chrome language toggle | 🌐 | `globe` | `--icon-size-lg` (see §8) |
| Confirm/dismiss in toast | ✓ ✕ | `check` / `x` | `--icon-size-sm` |
| Audit-log row leading | depends on action type | varies | `--icon-size-sm` |
| Empty-state illustration-as-icon | depends on context | varies | `--icon-size-xl` |
| Save / discard actions | 💾 🗑 | `save` / `trash` | `--icon-size-md` |

These follow the size/stroke tokens from §3/§4 — the table is a non-exhaustive usage map, not an exception list.

### 6.5 Menu surfaces — icon mapping *(Amendment B, 2026-09-07)*

Three menu surfaces need icons. All inherit `currentColor`. Tap-target wrapping is dim-4 territory; the icons themselves sit at the size tokens below.

#### 6.5.1 Admin web left-nav (Priya's desktop)

Seven items. Icon size `--icon-size-md` (16 px), stroke `--icon-stroke-base` (2 px). Row height 40 px.

| Menu item | Lucide glyph | Rationale |
|---|---|---|
| Inbox | `inbox` | Literal — Lucide's `inbox` glyph matches the tray-with-paper metaphor. Default active state. |
| Triage | `list-checks` | Checklist metaphor reads as "sort + decide." Picked over `git-pull-request-arrow` because the latter implies code review. |
| Verification | `shield-check` | Verification is trust-gated; shield reads correctly. Picked over `badge-check` because the inbox already uses badge icons for *reporter* status; `shield-check` keeps the verification affordance distinct. |
| Audit log | `scroll-text` | Audit log = immutable record; scroll-with-text reads as historical. Picked over `history` because scroll-text reads more specifically as a *log*, not "recent activity." |
| Sensors | `radio-tower` | Already locked for source-attribution (§6.3). Same glyph reused for the nav — keeps the icon vocabulary consistent. |
| Reports | `file-bar-chart` | The report is a document *containing* analytics, not a chart itself. Reads as "exported report." |
| Settings | `settings` | Lucide's standard gear. Universal affordance. |

**Fallbacks** (in case user testing flags ambiguity): `list-checks` → `git-pull-request-arrow`; `shield-check` → `badge-check`.

#### 6.5.2 Operator mobile bottom-nav

Five items. Icon size `--icon-size-lg` (20 px), stroke `--icon-stroke-bold` (2.5 px). Tap target 48×48 px minimum.

| Menu item | Lucide glyph | Rationale |
|---|---|---|
| Home | `house` | Standard. |
| Inbox | `inbox` | Same as admin nav. |
| Verify | `badge-check` | Quick-action; badge metaphor reads as "confirm this" faster than `shield-check` at 20 px on a bottom nav. |
| Map | `map` | Standard. |
| Me | `user-round` | Rounded silhouette reads softer than the bare `user` glyph. Operator mobile is a more personal surface than admin web. |

#### 6.5.3 Settings menu (gear flyout)

Five items. Icon size `--icon-size-sm` (14 px), stroke `--icon-stroke-thin` (1.5 px). Row height 36 px (settings is dense).

| Menu item | Lucide glyph | Rationale |
|---|---|---|
| Theme | `sun-moon` | v1's binary light/dark toggle. If v2 adds multiple themes, swap to `palette`. |
| Language | `globe` | Already locked for top-chrome Bangla toggle (§8). Reused here — same glyph for the same function. |
| Notifications | `bell` | Standard. |
| Chain | `link-2` | Reads as a chain link, not a hyperlink. Chain-of-custody is a *physical* chain, not a URL. |
| Sign out | `log-out` | Standard. Sign-out row tinted `--danger` for destructive cue. |

#### 6.5.4 v1 icon vocabulary (final, post-amendment-B)

| # | Lucide glyph | Source |
|---|---|---|
| 1 | alert-triangle | band-high (§6.1) |
| 2 | minus-circle | band-medium (§6.1) |
| 3 | info | band-low (§6.1) |
| 4 | map-pin | location (§6.2) |
| 5 | radio-tower | source-sensor (§6.3, §6.5.1) |
| 6 | user | source-anjali (§6.3) |
| 7 | phone | source-councillor (§6.3) |
| 8 | globe | locale toggle (§8, §6.5.3) |
| 9 | check | toast-confirm (§6.4) |
| 10 | x | modal-close, toast-dismiss (§6.4) |
| 11 | chevron-down | dropdown (§6.4) |
| 12 | search | search input (§6.4) |
| 13 | save | save action (§6.4) |
| 14 | inbox | admin nav, mobile nav (§6.5.1, §6.5.2) |
| 15 | list-checks | admin nav — triage (§6.5.1) |
| 16 | shield-check | admin nav — verification (§6.5.1) |
| 17 | scroll-text | admin nav — audit log (§6.5.1) |
| 18 | file-bar-chart | admin nav — reports (§6.5.1) |
| 19 | settings | admin nav — settings (§6.5.1) |
| 20 | house | mobile nav — home (§6.5.2) |
| 21 | badge-check | mobile nav — verify (§6.5.2) |
| 22 | map | mobile nav — map (§6.5.2) |
| 23 | user-round | mobile nav — me (§6.5.2) |
| 24 | sun-moon | settings — theme (§6.5.3) |
| 25 | bell | settings — notifications (§6.5.3) |
| 26 | link-2 | settings — chain (§6.5.3) |
| 27 | log-out | settings — sign out (§6.5.3) |

Total: **27 icons** in v1 (was 13, +14 from amendment B). The original lock stated "13 v1 Lucide paths" with rule 7 "no 14th icon without an amendment." This IS that amendment — adding the 14 icons that menu-mapping requires is a deliberate scope expansion, not creep. Every addition is justified by a §6.5 row above.

---

## 7. Bangla inside icons — explicit non-decision

**Icons stay Latin-glyph regardless of locale.** No Bangla character appears inside any Lucide glyph in v1.

Reasoning:

- **Lucide ships Latin glyphs only.** No Bengali, Devanagari, or Arabic variant exists in the v0.460.0 set.
- **Plex-glyph substitution was rejected** per §2 above. The user call was explicit: "icons only, no Plex substitution." Re-litigating that here would re-open a closed question.
- **Bangla text degrades cleanly to a system Bangla font** (per dim 2 §9.4). An icon's *adjacent text* switches to Noto Sans Bengali when locale = Bangla; the icon itself stays Latin-glyph. This is intentional — Bangla-locale and English-locale users see the same icon set, just with different surrounding text.

### What an icon-adjacent Bangla text node looks like

```html
<span class="row-source">
  <svg class="icon" ...><!-- user glyph, stroke="currentColor" --></svg>
  <span class="row-source-label" lang="bn">অঞ্জলি · ১১:৪২</span>
</span>
```

The `<svg>` uses `font-family: inherit` (default for SVG content — none in this case since Lucide is paths, not glyphs). The `<span lang="bn">` switches to Noto Sans Bengali via the dim-2 locale rule. No conflict.

### Bangla-locale icon labelling

Icon-only buttons (no visible label, `aria-label` only) follow the dim-2 §6.2 rule: `aria-label` is bilingual in Bangla locale. The Bangla-toggle globe button is the canonical example (see §8).

---

## 8. Bangla toggle globe icon

Per dim 2 hand-off, the language toggle lives in the top chrome of every operator surface and has:

- **Glyph:** `globe` (Lucide, outlined variant — the default; the solid variant `globe-2` is rejected for v1 because the outlined version reads as "language" more clearly).
- **Position:** top-right of the top chrome, to the right of any user-menu icon.
- **Size:** `--icon-size-lg` (20 px). Larger than typical button icons because it's a top-chrome affordance, not an inline action.
- **Stroke:** `--icon-stroke-bold` (2.5 px). Matches the lg/xl band.
- **Colour:** inherits from `currentColor`, which inherits from top-chrome `--fg-default` text.
- **aria-label:** follows locale: `"Language"` in English, `"ভাষা"` in Bangla. The aria-label is the canonical name; no visible text label is shown in v1 (icon-only).
- **Keyboard shortcut:** `Ctrl+Shift+L` (documented in dim 2 §6.2; not an icon concern but the affordance lives next to the globe).
- **Visual state:** no "active locale" indicator in v1. The toggle flips between two states with no persistent visual feedback beyond the resulting text change. v1.1 may add a small dot or underline; tracked in open flags §11.

### Why `globe` not `languages`?

Lucide ships both `globe` (an outlined planet with longitude/latitude lines) and `languages` (a chat-bubble with "A文" inside). The `languages` glyph is visually busier at 20 px and the chat-bubble shape reads as "messages" before it reads as "language." The plain `globe` is universally read as "language / region / locale" by every user test we ran informally during dim-1 review. Decision: `globe`.

---

## 9. Accessibility amendments

### 9.1 Icon-only buttons must have `aria-label`

Every icon-only button (modal close, search, language toggle, save/discard when no text label, etc.) carries an `aria-label`. The label follows the dim-2 §6.2 bilingual rule for Bangla locale. No icon-only button ships without an aria-label.

### 9.2 Decorative icons must be `aria-hidden`

Icons that are purely decorative — i.e. the icon duplicates information already in the adjacent text label — carry `aria-hidden="true"`. Example: a button that says "Save" and has a save-glyph next to the word. The screen reader reads "Save" once; the icon is silent.

Rule: **if removing the icon would not change the meaning conveyed to a screen reader user, the icon is decorative and `aria-hidden`.** If removing the icon would lose information (e.g. the band-pill icon *is* the severity signal), the icon is semantic and gets appropriate labelling.

### 9.3 Tap targets

Icons inside tappable surfaces must be inside a tap target of:

- **44×44 px minimum** on mobile (Apple HIG, Material Design).
- **48×48 px recommended** on the operator mobile UI (slightly larger because field conditions — gloved hands, sun glare, walking-and-using).

The icon's *bounding box* is 12–24 px (per §3); the surrounding *tap target* is 44–48 px. Padding fills the difference. Padding tokens are dim-4 territory.

### 9.4 Icon + text gap

Icon and adjacent text have an **8 px gap** between them. Dim-4 spacing scale will codify this as `--space-2` (or equivalent). Icons vertically center with the text x-height, not the cap-height.

### 9.5 Focus rings

Focused icon-only buttons show a focus ring around the *tap target* (44×48 box), not around the icon glyph itself. Focus ring colour is `--brand-400` per dim-1 §2.4. Focus ring is 2 px solid with 2 px offset.

### 9.6 Bangla screen-reader parity (carries dim 2 §9.4)

When a row mixes families (Latin icon + Bangla text), the row is read as a single utterance by the screen reader; the family split is a rendering concern, not a semantic concern. Bangla-locale aria-labels work without per-family override because the screen reader reads the label text, which is already in the correct Bangla family.

---

## 10. Consumer message rule (re-stated from dim 2)

**No Lucide icons appear in Ramesh-channel consumer messages.** This is a hard boundary.

- Consumer-channel strings (Ramesh WhatsApp / SMS) render in the consumer's locale font (Noto Sans Bengali for Bangla, Plex Sans for English).
- The only glyphs allowed are the VS15-forced text-style glyphs locked in dim 2 §6.1: `✓ U+2713 U+FE0E` (confirmation) and `⚠ U+26A0 U+FE0E` (warning). One max per message.
- Icons do not appear in consumer messages because (a) Lucide icons are inline SVG and would not render in WhatsApp / SMS contexts, (b) the action word is the signal — "✓ আপনার রিপোর্ট পাওয়া গেছে" reads as "confirmed" without an icon, (c) the VS15 rule keeps the consumer channel pure-text and pure-renderable across every downstream surface (WhatsApp, SMS, push notification, email).

This rule is **re-stated** here, not amended. Dim 6 (data formats) hand-off §15 carries it forward so the consumer channel boundary is not breached during data-format design.

---

## 11. Open flags (deferred, not blockers)

These were raised during review and intentionally **not** fixed at this dimension. They are tracked here so they don't get lost.

### Flag D · Active-locale indicator on globe toggle

- Current state: the globe toggle flips between two locales with no persistent visual feedback beyond the text change that follows.
- Concern: an operator who toggled to Bangla 30 minutes ago may forget. A small dot or underline could make "current locale" obvious.
- Mitigation if this becomes painful: add a 2 px `--brand-500` underline beneath the globe when locale ≠ system default. Decision deferred — no user research has flagged this as a problem yet.
- Decision owner: dimension 9 (system integration review on real hardware with real operators).

### Flag E · Lucide CDN vs self-hosted for production

- The preview HTML references Lucide's CDN (unpkg) for inline-SVG paths. Production `tokens-icons.css` will be authored with inline SVG markup; production bundle ships those SVGs, no CDN.
- Concern: if Lucide v0.460.0 ships a security advisory or licensing change before v1 launch, we have a frozen version to revert to.
- Mitigation: lock the icon path set in `tokens-icons.css` to the exact 27 Lucide paths used in v1 (the §6 + §6.5 vocabulary). Re-freeze is a one-line `path d="..."` change per icon.
- Decision owner: dimension 9 (production build / supply chain).

### Flag F · Band-pill icon on small screens

- Current band pill is 20×20 px with `--icon-size-md` (16 px) icon inside. On a 320 px viewport with three columns (band, source, time), the pill competes for horizontal space.
- Mitigation if this becomes painful: reduce pill to 16×16 px with `--icon-size-sm` (14 px) icon, drop the band-pill text (high/medium/low) and rely on icon + colour. This is a more significant change — affects accessibility for users who can't perceive the colour difference.
- Decision owner: dimension 9 (mobile operator UI review on 320 px viewports).

---

## 12. What was deliberately rejected

These were considered and explicitly **not** included in v1. Recording the rejections prevents re-litigation later.

### 12.1 Phosphor (per §2)

Six weight variants per glyph is over-spec. Bundle weight without a v1 use case.

### 12.2 Heroicons (per §2)

Two-style system forces a per-icon decision. Lucide's outline-only removes that decision.

### 12.3 Tabler (per §2)

~4500 icons, larger bundle. Slightly chunkier construction at small sizes.

### 12.4 Material Symbols (per §2)

CDN dependency, variable-font format, stylistic identity mismatch.

### 12.5 Plex-glyph substitution (per §2 and §7)

Unicode coverage is unreliable across OS versions; candidate characters don't cover the 27 v1 icons; explicit user call.

### 12.6 LibreIcons / icons8 / flaticon

All rejected for license + quality reasons. LibreIcons is CC-BY-SA (viral license — incompatible with proprietary product). icons8 requires per-seat licensing. flaticon is free only with attribution that we can't guarantee in every rendered surface (push notifications, SMS, email). Lucide is MIT — clean, predictable, no per-surface attribution burden beyond the THIRD-PARTY-NOTICES file.

### 12.7 Custom-drawn icons

Considered for the band-pill severity set (a custom triangle / dash / circle set tuned to our exact optical balance). Rejected because (a) the maintenance burden falls on us — any future band addition requires a new draw, (b) Lucide's `alert-triangle` / `minus-circle` / `info` already match the dim-1 inbox mock pixel-for-pixel at the 16 px size, (c) drawing-our-own is a v2 conversation if Lucide's geometric construction ever drifts.

### 12.8 Animated icons

Considered for empty-state illustrations-as-icons. Rejected because motion is dim-8 territory; touching it here would pre-empt that dim. Locked for v1: all icons are static. The `--icon-size-xl` empty-state slot is static-illustration territory; if a future dim wants motion, the icon can be swapped for an animated equivalent without changing the size token.

### 12.9 Two-tone / duotone icons

Considered via Lucide's optional two-tone variant (a separate path set). Rejected because (a) it requires per-icon opt-in, breaking the simple "one Lucide path = one SVG" pipeline, (b) the second colour requires a second colour token (no currentColor inheritance), (c) the operator tool register doesn't want duotone decoration.

---

## 13. Token consumption rules (enforced in code review)

The following are hard rules for any component that consumes these tokens. Violations should be rejected in PR review.

1. **No hardcoded icon size values in components.** Use `var(--icon-size-*)`.
2. **No hardcoded stroke values in components.** Use `var(--icon-stroke-*)`.
3. **No hardcoded icon paths in components (except in `tokens-icons.css`).** Every Lucide icon is documented in the tokens file; components reference icons by `<svg><use href="#icon-name"/></svg>` or by an inlined `<svg>` block copied from the tokens file.
4. **`stroke="currentColor"` on every Lucide path.** No `stroke="#hex"` in component code. The single exception is the band-pill icon, where stroke matches band-pill fill (per §5 exceptions) — and even there, the fill comes from `var(--band-*)`, not a hex literal.
5. **`aria-hidden="true"` on every decorative icon.** Semantic icons get appropriate labelling (per §9.1, §9.2).
6. **No icons on consumer-channel strings.** Ramesh-channel messages stay pure-text with VS15-forced text-style glyphs only (per §10).
7. **No icon outside the 27 v1 Lucide paths without an amendment** *(was: 13; Amendment B adds 14)*. Adding a 28th icon is a dim-3 amendment, not a component decision. Menu icons must come from the §6.5.4 vocabulary table.
8. **No `transition` on icon stroke-width or size tokens.** Icons are static. The only transition allowed on icons is the colour transition during theme switch (≤150 ms, body-level).
9. **No `shape-rendering` override on any `<svg class="icon">`** *(Amendment B.3 — supersedes B.1's mandate)*. Browser default `auto` enables anti-aliasing and produces smooth edges. `geometricPrecision` and `crispEdges` are both forbidden.
10. **SVG `width`/`height` attributes must match CSS display size** *(Amendment B.3 — supersedes B.2)*. Do NOT set them to a 4× multiple — that creates browser-specific sizing conflicts. xs → 12, sm → 14, md → 16, lg → 20, xl → 24.
11. **No `transform: translateY(-1px)` on `.icon`** *(Amendment B.3 — supersedes B.1)*. Snapping to integer pixel rows produces pixelation, not smoothness.

---

## 14. Verification checklist

Before any dimension-4 work begins, confirm:

- [ ] `tokens-icons.css` exists at `app/frontend/tokens-icons.css` with all 8 tokens (5 size + 3 stroke)
- [ ] All 27 v1 Lucide paths are documented inline in `tokens-icons.css` with `<svg id="icon-...">` definitions *(Amendment B: was 13)*
- [ ] All 27 icon usages in `icons-preview.html` render correctly at all 5 sizes (verified visually)
- [ ] Stroke-weight optical-balance comparison shows 1.5 px at sm, 2 px at md, 2.5 px at lg/xl — all three pass visual review
- [ ] **Smoothness recipe applied** *(Amendment B.3 — supersedes B.1 and B.2)*: every `<svg class="icon">` has NO `shape-rendering` attribute (browser default AA); SVG `width`/`height` attributes match CSS display size (xs → 12, sm → 14, md → 16, lg → 20, xl → 24); `.icon` has no `transform`; `--icon-stroke-thin` is `1.75` (was `1.5`); band-pill icons use `icon--md`
- [ ] Inbox mock renders band-pill (md), location (xs), source (xs) icons in correct positions for all 3 rows
- [ ] **Menu section renders three panels** *(Amendment B)*: 7 admin-nav rows, 5 mobile-nav cells, 5 settings-menu rows
- [ ] Bangla globe toggle renders at top-chrome with aria-label following locale
- [ ] Theme switcher (light/dark) shows icons re-tint via `currentColor` inheritance
- [ ] Locale switcher (en/bn) shows icons stay Latin; surrounding text changes family
- [ ] No consumer-message section in preview uses Lucide icons (verified by absence)
- [ ] No hardcoded icon size or stroke values outside the 8 tokens in `tokens-icons.css` (audit via grep)
- [ ] THIRD-PARTY-NOTICES file references "Lucide Icons © Lucide Contributors, MIT License"
- [ ] Lucide v0.460.0 is frozen — no auto-updates from CDN in production

---

## 15. Hand-off to dimension 4 (spacing & components)

Carry these forward as constraints, not preferences:

- **Icon padding budgets.** `--icon-size-sm` (14 px) icon inside a button needs padding around it to hit the 44×48 tap target. If the button height is 36 px, the icon's vertical padding is (36 − 14) / 2 = 11 px above and below. If the button is 44 px tall, padding is (44 − 14) / 2 = 15 px. Dim-4 will define button-padding tokens around these numbers.
- **Icon + text gap.** 8 px between icon and adjacent text. Dim-4 spacing scale will codify as `--space-2` (or equivalent 8 px unit).
- **Icon vertical alignment.** Icon vertically centers with the text *x-height*, not the cap-height or the bounding box. This requires `vertical-align: middle` + a `transform: translateY(-1px)` (or equivalent) in component CSS. Dim-4 will document this as a button-internal rule.
- **Tap-target rule.** Icons inside tappable surfaces must be inside a 44×44 px or 48×48 px tap target. Icon's bounding box is 12–24 px; tap target is larger.
- **Bangla toggle discoverability.** Globe icon top-chrome, aria-label "Language / ভাষা", keyboard Ctrl+Shift+L. Dim-4 will define the top-chrome component's spacing so the globe sits at a consistent offset from the user-menu icon.
- **Bangla glyphs inside icons.** Explicit non-decision (per §7): icons stay Latin; no Bangla glyph inside icons in v1.

## 16. Hand-off to dimension 6 (data formats)

Carry these forward as constraints:

- **Consumer-channel strings carry no Lucide icon markup.** Ramesh-channel message format (whatever dim-6 lands on) must be pure-text. The dim-2 §6.1 VS15 rule still holds: `✓ U+2713 U+FE0E` and `⚠ U+26A0 U+FE0E` only, one max per message.
- **Icon name strings are *not* in the data model.** No `icon: "alert-triangle"` field on a report or band object. Icons are a *rendering* concern tied to *semantic position* (band / location / source), and the mapping is locked in §6 of this doc. Adding an icon-name field to the data model would let downstream consumers (push notifications, email) accidentally try to render a Lucide path they can't — they would see broken markup. The semantic position (band-high / band-medium / band-low / location / source-sensor / source-anjali / source-councillor) is in the data; the icon mapping is in the design system.
- **The 27 v1 Lucide icons are not extensible via data.** A new report source in v2 would require a new icon, which requires a dim-3 amendment (per §13 rule 7), not a data-model change. This is intentional — icons are a design-system concern, not a data concern.

---

## 17. Hand-off to dimension 8 (motion)

- **Icons are static in v1.** No rotation, no pulse, no fill animation.
- **The single motion exception** is the colour transition during theme switch (≤150 ms on body, inherited by `currentColor` on the icon). This is body-level motion, not icon-level motion, but worth noting because icons participate.
- **Future motion work** (loading spinners, success-state checkmarks that draw-in) is dim-8 territory. Dim 8 may extend the icon vocabulary to include `loader` / `loader-circle` Lucide glyphs. If so, that's a dim-3 amendment (per §13 rule 7) and a dim-8 design.

---

## 18. Sign-off

| Reviewer | Role | Status |
|---|---|---|
| (pending) | Design lead | — |
| (pending) | Engineering lead | — |
| (pending) | Accessibility reviewer | — |

Once all three sign off, this document becomes the single source of truth for v1 iconography. Any further changes require an amendment appending this file, not an edit.

**Amendment B (2026-09-07):** sign-off re-opened. Crispness recipe and menu mapping both added post-lock; awaiting re-approval from the same three reviewers.

**Amendment B.2 (2026-09-07):** sign-off re-opened *again*. Amendment B.1 was a misdiagnosis — `geometricPrecision` was the wrong tool. B.2 replaces it with 4× rasterization. Awaiting re-approval.

**Amendment B.3 (2026-09-07):** sign-off re-opened *again*. Amendment B.2's 4× rasterization also failed — produced browser-inconsistent sizing. B.3 reverts to browser-native rasterization + bumps `--icon-stroke-thin` from `1.5` to `1.75`. Awaiting re-approval.

---

## 19. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Document created. Lucide v0.460.0 frozen. 13 icons documented. 5 size + 3 stroke tokens locked. Bangla-inside-icons explicit non-decision logged. Consumer-message rule re-stated from dim 2 §6.1. | Gate 0 dim 3 lockdown. |
| 2026-09-07 | **Amendment B.** Added §5.1 crispness recipe (`shape-rendering="geometricPrecision"` + `vertical-align: middle` + `translateY(-1px)` snap + band-pill `xs→md`); added §6.5 menu icon mapping (admin left-nav 7 + mobile bottom-nav 5 + settings 5); icon vocabulary grew 13 → 27. Sign-off re-opened with note. | User feedback: icons not crisp, even at large sizes; menu→icon mapping required. |
| 2026-09-07 | **Amendment B.2 — supersedes B.1 / §5.1.1 / §5.1.2 / §5.1.3.** Original B.1 misdiagnosed: `shape-rendering: geometricPrecision` disables browser anti-aliasing (the *opposite* of smooth) and the `translateY(-1px)` snap caused additional pixelation. Replaced both with 4× intrinsic rasterization (SVG width/height = 4× CSS display size) + browser-default AA. Removed `shape-rendering` attribute from every `<svg class="icon">`; removed `transform: translateY` from `.icon` CSS. Sign-off re-opened with note. | User feedback: icons still pixelated, edges not smooth after amendment B. |
| 2026-09-07 | **Amendment B.3 — supersedes B.2.** B.2's 4× rasterization produced browser-inconsistent sizing (SVG `width` attribute conflicting with CSS `width` rule). Reverted SVG width/height to match CSS display size; bumped `--icon-stroke-thin` from 1.5 to 1.75 (1.5 was sub-pixel-thin and AA-blurred at 12 px display); left browser-default `shape-rendering: auto` in place. Sign-off re-opened with note. | User feedback: did we remove lucide icon? — clarifying that Lucide is intact; the rendering attributes were conflicting across browsers, not the icons themselves. |
