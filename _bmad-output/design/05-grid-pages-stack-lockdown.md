# Dimension 5 — Grid, Pages & Stack Direction · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/grid-preview.html`
**Target landing paths:**
- `_bmad-output/design/05-grid-pages-stack-lockdown.md` (this doc — the *contract* for the production scaffold)
- `surakkha-app/` (production React/Vite/Tailwind/shadcn app — **deferred to a separate engineering-setup workstream**; spec'd in §I)

---

## 1. Scope

This document locks the **layout language** that composes dim 1–4 tokens into surfaces. It also records the architectural direction for the production stack (React + Vite + Tailwind + shadcn/ui) without committing to the build pipeline in dim 5 itself.

**Surfaces covered:** Priya desktop only (admin web).
- **Anjali-mobile** (dim 5b) — deferred
- **Operator-mobile** (dim 5c) — deferred
- **PHA-pane** (dim 5d) — deferred
- **Ramesh-channel** — invisible WhatsApp+SMS infrastructure; no UI grid

The four operator UIs are **separate products** with separate design, deployment, and update cadences — they do not collapse into one responsive app across breakpoints (per `EXPERIENCE.md` line 41 / `architecture-invariants.md` AD-7 / spec C-2). Dim 5 covers only Priya's surface; the other three get their own grid lockdowns later.

**Out of scope:**
- Full implementation of the 6 page templates (wireframes in this doc; full React pages land in v1.1 once the scaffold is built).
- The `surakkha-app/` directory itself — the 18 files listed in §I are *specified* here but not created in dim 5.
- Mobile surfaces (Anjali / operator / PHA).
- Motion durations — locked in dim 8.

---

## 2. Breakpoints

Five breakpoints + the mobile floor (`≥0`).

| Token | Min width | Tailwind screen | Use |
|---|---|---|---|
| `--bp-md` | `480px` | `sm:` | Large mobile (iPhone Pro Max, Pixel XL). Anjali in landscape. |
| `--bp-lg` | `768px` | `md:` | Tablet. Operator mobile landscape, PHA pane small, Priya "condensed" dashboard. |
| `--bp-xl` | `1024px` | `lg:` | Desktop. Default Priya admin breakpoint. |
| `--bp-2xl` | `1280px` | `xl:` | Wide desktop. Full Priya — audit log, multi-column dashboards. |
| `--bp-3xl` | `1440px` | `2xl:` | X-wide desktop. Board view. Container caps at 1280, so this is mostly "you get more whitespace." |

The `≥0` floor is not a Tailwind screen — it's the no-prefix default block. Tailwind's `screens` config:

```js
screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px' }
```

### Why 5 (not 3, not 7)

- **3 breakpoints** (≥768 / ≥1024 / ≥1440 from the original dim-5 plan) collapses the iPhone-SE / Pro-Max distinction (375 vs 430). Bangla row padding (dim 4 §15.4) performs differently in those two ranges — the larger font sizes of Pro Max tolerate the same row height that SE would truncate on.
- **5 breakpoints** matches mainstream framework conventions (Tailwind default, Bootstrap 5, Bulma) — anchoring Surakkha at these values keeps the codebase legible to anyone who knows those systems.
- **7+ breakpoints** (adding ≥375, ≥414, ≥1700, etc.) is over-engineering for Surakkha's surface area. We are not Pinterest or Notion.

---

## 3. Container widths

Three container tokens, declared per-page (not per-breakpoint):

| Token | Value | Used for |
|---|---|---|
| `--container-narrow` | `720px` | Verify flow, focused reading surfaces. Activates at ≥ 768. |
| `--container-bangla` | `1080px` | Default dashboard / inbox list / inbox detail (Bangla-tuned line-length sweet spot). Activates at ≥ 1024. |
| `--container-wide` | `1280px` | Audit log, settings, full-Latin admin surfaces. Capped at ≥ 1280 (does not grow past 1280 even at the 3xl breakpoint). |

### Why 1080 vs 1280

Bangla body text at `--font-size-sm` (13 px) with `--line-height-body-bangla` (1.6) reaches the proven comfortable-reading 65–75 char line-length at ~1080 px content width when paired with `--space-xl` (24 px) container padding-inline. Beyond ~1100 px, lines stretch past the optimal threshold — Bangla glyphs are wider than Latin, so the same content width reads differently across scripts. 1080 is the validated Bangla sweet spot; 1280 is fine for full-Latin content.

### Why cap at 1280

The 3xl breakpoint (≥ 1440) does not increase the wide container past 1280. The intent at 3xl is *more whitespace*, not wider content. Wide rows stretch the eye's saccade arc; beyond ~120 chars/line on a desktop, the reader loses their place. 1280 caps the content; the page itself can have up to 32 px padding-inline at 3xl for breathing room.

---

## 4. Column grid (12-column CSS Grid)

| Property | Value |
|---|---|
| Columns | 12 |
| Gutter (mobile, &lt; 768) | `--space-md` (12 px) |
| Gutter (desktop, ≥ 768) | `--space-lg` (16 px) |

**Column-span vocabulary** (Tailwind `col-span-*`):
- `col-span-1` / `col-span-2` / `col-span-3` / `col-span-4` — quarter-row content (KPI cards, compact cells)
- `col-span-6` — half-row (inbox detail 2-pane)
- `col-span-8` — 2/3 row (primary content + thin sidebar)
- `col-span-12` — full row (sensor board, audit log, verify flow)

### Why 12

12 divides cleanly into 1, 2, 3, 4, 6, 12 — supporting every layout shape used in Surakkha. 16-column grids force awkward 5/16 sidebar splits; 8-column grids force 3-col + 5-col awkwardness. 12 is the design-industry default and matches what shadcn/ui primitives assume.

---

## 5. Tailwind config (specification)

This section is the **spec** for `tailwind.config.js` — the file itself is created by the production-scaffold workstream, not by dim 5. The shape below ensures every dim-1–4 token is consumable as a Tailwind utility.

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px' },
    extend: {
      colors: {
        bg:    { base: 'var(--bg-base)', surface: 'var(--bg-surface)', subtle: 'var(--bg-subtle)', inset: 'var(--bg-inset)' },
        fg:    { default: 'var(--fg-default)', secondary: 'var(--fg-secondary)', tertiary: 'var(--fg-tertiary)', disabled: 'var(--fg-disabled)' },
        border:{ subtle: 'var(--border-subtle)', default: 'var(--border-default)', strong: 'var(--border-strong)' },
        brand: { 600: 'var(--brand-600)', 500: 'var(--brand-500)', 400: 'var(--brand-400)', 200: 'var(--brand-200)', 100: 'var(--brand-100)' },
        success: 'var(--success)', 'success-bg': 'var(--success-bg)',
        warning: 'var(--warning)', 'warning-bg': 'var(--warning-bg)',
        danger:  'var(--danger)',  'danger-bg':  'var(--danger-bg)',
        info:    'var(--info)',    'info-bg':    'var(--info-bg)',
        band:    { high: 'var(--band-high)', medium: 'var(--band-medium)', low: 'var(--band-low)' },
      },
      spacing: {
        xs: 'var(--space-xs)', sm: 'var(--space-sm)', md: 'var(--space-md)', lg: 'var(--space-lg)',
        xl: 'var(--space-xl)', '2xl': 'var(--space-2xl)', '3xl': 'var(--space-3xl)'
      },
      borderRadius: {
        xs: 'var(--radius-xs)', sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)'
      },
      fontFamily: {
        sans: 'var(--font-family-sans)', bangla: 'var(--font-family-bangla)', mono: 'var(--font-family-mono)',
      },
      fontSize: {
        xs: 'var(--font-size-xs)', sm: 'var(--font-size-sm)', md: 'var(--font-size-md)',
        lg: 'var(--font-size-lg)', xl: 'var(--font-size-xl)', '2xl': 'var(--font-size-xxl)', '3xl': 'var(--font-size-display)'
      },
      boxShadow: { modal: 'var(--shadow-modal)' },
      zIndex: { sticky: 'var(--z-sticky)', dropdown: 'var(--z-dropdown)', modal: 'var(--z-modal)' },
    },
  },
}
```

### Why var(--*) and not literal values

Tailwind utilities like `bg-brand-500` resolve through CSS variables. When dim 1's tokens flip via `[data-theme="dark"]` (the dim 1 colour-switching mechanism), every `bg-brand-500` usage updates automatically — no Tailwind class swap needed. The `darkMode: ['class', '[data-theme="dark"]']` config tells Tailwind to recognise our attribute selectors.

---

## 6. shadcn/ui adoption

shadcn primitives that map to dim-4 components. Each is a copy-into-repo component (shadcn's convention — no `npm install @shadcn/ui` lock-in) themed via dim-1–4 tokens.

| Dim-4 class | shadcn primitive | Notes |
|---|---|---|
| `.btn--primary / secondary / ghost / danger` | `<Button variant="default/secondary/ghost/destructive">` | shadcn's `destructive` variant = our `--danger`. shadcn's `outline` variant is *not* used — we don't have an outline pattern. |
| `.input` | `<Input />` | One size (md, 36 px). Override shadcn's default `h-10` to `h-9` (36 px). |
| `.top-chrome` | Custom `<TopChrome />` | Not a shadcn primitive — too specific to Surakkha's locale toggle. |
| `.admin-nav` | `<Sidebar>` + `<SidebarMenu>` | Maps to left-rail admin nav per dim 4 §8.1. |
| `.card--with-heading` / `.card--compact` | `<Card>` + custom `<CardHeader>` | `<CardHeader>` triggers `--space-xl` block padding (the `with-heading` per dim 4 Amendment A). |
| `.modal` | `<Dialog>` from shadcn | shadcn's Radix-Dialog handles focus trap (was open flag in dim 4 §16.3). |
| `.toast` | Sonner (shadcn's chosen toast lib) | Replaces dim 4's hand-rolled toast; semantically identical (`role="status"` + `aria-live="polite"`). |
| `.band-pill` | `<Badge variant="high/medium/low">` | Custom 3 variants. 16 px md icon inside 20×20 pill per dim 3 amendment B §5.1.3. |

**shadcn components NOT adopted in v1:** `Tabs`, `Dropdown`, `Tooltip`, `Popover`, `Combobox`, `Command` — per dim 4 §1 scope deferral.

### Why shadcn

- **Theme via CSS variables** — shadcn is the only headless library designed around `var(--color-*)` from day one. dim 1–4 tokens drop in directly.
- **Copy-into-repo** — no library lock-in. We own the components. If shadcn goes stale, we replace component-by-component.
- **Radix-based** — accessibility primitives (focus trap, ARIA, keyboard nav) are battle-tested. dim 4 §16's tap-target + focus-ring + modal-focus-trap rules come for free.
- **Already a Tailwind citizen** — config maps 1:1 with our tokens.

---

## 7. Page templates (Priya desktop — 6)

Six page templates locked as wireframes:

### 7.1 Login

- Centred card on full-viewport brand background (`--brand-100` at ≥ 768, `--brand-200` band at < 768).
- Card max-width 480 px.
- No sidebar, no top-chrome.
- Returns to dashboard on successful sign.

### 7.2 Dashboard

- **Container:** `--container-bangla` (1080 px) at default; `--container-wide` (1280 px) on the wide variant.
- **Layout:** `<TopChrome />` + `<Sidebar />` + `<main>`.
- **Main content:** KPI row (`col-span-3` × 4 → stacks to `col-span-12` on mobile) + sensor board (col-span-12).

### 7.3 Inbox List

- **Container:** `--container-bangla` (1080 px).
- **Layout:** `<TopChrome />` + `<Sidebar />` + `<main>`.
- **Main content:** Stack of `<InboxRow>` at `--height-row-comfortable` (56 px — per dim 4 Amendment A). Bangla rows auto-add one `--space-xs` tier of block padding (dim 4 §15.4).

### 7.4 Inbox Detail

- **Container:** `--container-bangla` (1080 px).
- **Layout:** `<TopChrome />` + `<Sidebar />` + 2-pane `<main>`.
- **Main content:** Left `col-span-5` (compact list of related incidents) + right `col-span-7` (incident detail with timeline).
- Drops to single pane (`col-span-12`) below `<bp-lg>` (768).

### 7.5 Verify Flow

- **Container:** `--container-narrow` (720 px) — focused reading.
- **Layout:** `<TopChrome />` + `<main>` (no sidebar — modally-focused flow).
- **Main content:** 3-step wizard. Each step is a single `<Card variant="with-heading">` (per dim 4 §9.1) stacked vertically with `--space-xl` gap.
  - Step 1: Sensor cluster.
  - Step 2: Anjali corroboration.
  - Step 3: Councillor notify.

### 7.6 Audit Log

- **Container:** `--container-wide` (1280 px).
- **Layout:** `<TopChrome />` + `<Sidebar />` + `<main>`.
- **Main content:** Full-width audit table. Dense rows at `--height-row-default` (40 px). Plex Mono for chain refs (dim 2).

### 7.7 Surfaces deferred to dim 5b/c/d

| Surface | Lockdown | Notes |
|---|---|---|
| Anjali-mobile | dim 5b | Full-width mobile-only, 1-column stack, ≥ 48 px tap targets. |
| Operator-mobile | dim 5c | Bottom-nav + content. Sensor board grid (3-col on phone, 6-col on tablet). |
| PHA-pane | dim 5d | Read-mostly; close to Priya desktop but adds `@media print` for regulator reports. |

---

## 8. Empty states (8 patterns)

Codified because they appear in 4+ pages each:

| # | Pattern | Icon | Primary CTA |
|---|---|---|---|
| 1 | No sensors reporting | `activity` (24 px) | "Add sensor" |
| 2 | No incidents in ward | `inbox` (24 px) | none |
| 3 | No chain entries yet | `link` (24 px) | none |
| 4 | No Anjali reports | `message-square` (24 px) | "Share reporting link" (secondary) |
| 5 | Search returns nothing | `search-x` (24 px) | none |
| 6 | Filter returned nothing | `filter-x` (24 px) | "Clear filter" (secondary) |
| 7 | All caught up | `check-circle-2` (24 px) | none |
| 8 | Permission denied / ward mismatch | `shield-alert` (24 px) | none |

**Container:** `.card--with-heading` per dim 4 Amendment A.
**Icon:** `--icon-size-xl` (24 px), `--icon-stroke-base` (2 px), `--fg-tertiary`.
**Heading:** `--font-size-md`, `--font-weight-semibold`, `--fg-default`.
**Body:** `--font-size-sm`, `--fg-secondary`, `--line-height-body`. Max-width 280 px for line-length.

---

## 9. Audit-log row (densest surface in v1)

Locked because it spans grid + table + chain-ref layout.

### 9.1 Desktop slot table (≥ 768)

| Slot | Width | Font | Colour | Notes |
|---|---|---|---|---|
| Time | 80 px (fixed) | Plex Mono (`--font-family-mono`), `--font-size-xs` | `--fg-tertiary` | `HH:MM:SS` tabular. |
| Chain ref | 1fr | Plex Mono, `--font-size-xs` | `--fg-default` | `font-variant-numeric: tabular-nums`. Truncates with ellipsis. |
| Event type | auto | `--font-size-xs`, with `--icon-size-sm` (14 px) leading icon | semantic (success / danger / info / warning) | `gap: --space-xs` (4 px) between icon and label. |
| Ward | 96 px (fixed) | `--font-size-sm` | `--fg-secondary` | |
| Actor | 160 px (fixed) | `--font-size-sm` | `--fg-default` | Truncates with ellipsis. |
| Action | auto | icon-only (`kebab-horizontal` 16 px) | `--fg-tertiary` hover `--fg-default` | `--space-xs` left margin. |

**Row height:** `--height-row-default` (40 px).
**Padding-inline:** `--space-lg` (16 px).
**Border-bottom:** 1 px `--border-subtle`.

### 9.2 Mobile collapse (< 768)

The 6-column desktop grid **collapses to 1-column, not to 3 or 4**. Row content stacks:

1. `<time>` (full width)
2. `<chain ref>` (full width, mono)
3. `<event type badge>` (auto-width, with leading icon)

**Row height:** `--height-row-comfortable` (56 px).
**Padding-block:** `--space-md` (12 px) — Bangla rows auto-add one `--space-xs` tier (dim 4 §15.4).

### 9.3 Event types (locked here, dim 7 owns the enum)

`sensor_spike` · `sensor_offline` · `report_received` · `incident_verified` · `incident_dismissed` · `councillor_notified` · `chain_anchored` · `sign_in` · `sign_out`

dim 7 codifies the wire format and validation. dim 5 paints the row.

---

## 10. Bangla inside layout primitives *(carries dim-2 §9.4 + dim-4 §15)*

### 10.1 Container choice

Pages with mixed Latin/Bangla content prefer `--container-bangla` (1080 px). This is the default for Dashboard, Inbox List, and Inbox Detail. Full-Latin pages (Audit Log, Settings, Verify Flow body) can use `--container-wide` (1280 px) where lines stay within comfortable-reading range.

### 10.2 Locale attribute on root

Layout components receive `<html lang="en">` (or `bn`) and `<body data-locale="bn">`. The `data-locale` attribute drives:
- Font family flip (dim 2 §9.4 — Bangla text → Noto Sans Bengali via `[data-locale="bn"]` selectors).
- Row block-padding tier (dim 4 §15.4 — `+1 --space-xs` for Bangla descender absorption).
- Em-based icon+text gap (dim 4 §15.6).
- Bangla toast min-width (dim 4 §15.5).

### 10.3 Numbers in Bangla locale

Bangla locale renders Bangla digits (০১২৩৪৫৬৭৮৯) via `font-variant-numeric` rules in tokens. Tabular figures are still enforced (`font-variant-numeric: tabular-nums`) so numbers stay column-aligned in the audit-log row time + chain-ref slots.

---

## 11. Accessibility amendments

### 11.1 Tap targets (carried from dim 4 §16.1)

- Desktop: ≥ 44×44 px.
- Mobile (operator + Anjali): ≥ 48×48 px.
- Tap-target-vs-visible-height gap on settings-menu rows (36 px visible → 44 px tap via invisible padding) — preserved in shadcn's `<Sheet>` / `<DropdownMenu>` wrappers.

### 11.2 Focus rings (carried from dim 4 §16.2)

shadcn components ship with focus-ring styling based on `focus-visible`. Tailwind `focus-visible:ring-2 focus-visible:ring-brand-400` with `outline-none` matches dim 4's `box-shadow: 0 0 0 2px var(--brand-400)`. The shadcn components will be themed so their default rings resolve to our tokens.

### 11.3 Modal focus trap

shadcn `<Dialog>` handles focus trap + Escape close + focus return on dismiss. Resolves dim 4 §16.3's open flag (Flag G was about modal max-width on small viewports — still open, deferred to dim 9 review).

### 11.4 Reduced motion

`prefers-reduced-motion: reduce` honoured at the body level for any future motion (dim 8). Tailwind config can add a `motion-safe` variant if dim 8 codifies reduced-motion-aware transitions.

---

## 12. Open flags (deferred, not blockers)

### Flag L · Inbox-detail 2-pane breakpoint

- Current: 2-pane at ≥ 768 (left col-span-5, right col-span-7).
- Risk: at exactly 768, the right pane reads cramped (~432 px content width for the detail).
- Mitigation if painful: bump 2-pane floor to 1024; below that, single pane + back-button.
- Decision owner: dim 9 (system integration review on real hardware).

### Flag M · Top-chrome on mobile

- Top-chrome currently stays visible across all breakpoints. On mobile (< 480), it consumes 48 px of vertical real estate that Anjali's submission flow doesn't need.
- Mitigation if painful: collapse to burger-menu on < 480.
- Decision owner: dim 9.

### Flag N · Audit-log row column-width brittleness

- The 80 / 96 / 160 px column widths are fixed. At a 1024-wide viewport with `--space-xl` (24 px) container padding-inline, the audit table gets ~976 px of usable width. Slot widths sum to 80+96+160 = 336 px fixed, leaving 640 px for chain-ref (1fr) + event-type (auto). Tight but OK.
- Mitigation if painful: switch to `minmax(80px, auto)` for actor column so it can shrink with ellipsis.
- Decision owner: dim 9 (real-data review).

### Flag O · Page templates are wireframes only

- The 6 templates are wireframes. Real implementations (full React pages with state, routing, data fetching) land in v1.1 once the `surakkha-app/` scaffold is built.
- Decision owner: post-dim-5 engineering-setup workstream.

---

## 13. What was deliberately rejected

| Considered | Rejected because |
|---|---|
| 8-column grid | Awkward 3/5 splits; doesn't support half / third naturally. |
| 16-column grid | Forces 5/16 sidebar splits; over-granular for our content density. |
| Per-breakpoint container widths (instead of tokens) | Tokens communicate *intent* (narrow / bangla / wide); per-breakpoint rules scatter the same data across 5 media queries. |
| CSS-only dark mode (no JS toggle) | dim 4 Amendment A's Bangla modifier needs runtime locale switch; dark-mode switch is a sibling concern. Tailwind `darkMode: ['class', '[data-theme="dark"]']` gives both via attribute selectors. |
| No top-chrome on mobile | dim 3 amendment B's locale-globe toggle needs to live somewhere. Top-chrome collapses to a burger-menu on mobile if Flag M becomes painful. |
| MUI / Chakra / Mantine | All bring their own token system; would conflict with dim-1–4 tokens. shadcn is the only one designed to be themed *by* external CSS variables. |
| Bootstrap | Last UI update 2023; no React-native version; less ergonomic with dim-1–4 tokens. |
| Next.js (SSR) | Surakkha is an SPA admin tool + mobile surfaces. SSR doesn't help. Vite + React is simpler. |
| Single responsive app collapsing operator UIs | Violates `EXPERIENCE.md` line 41 / AD-7 / spec C-2. The three operator UIs are *separate products*, not the same product across breakpoints. |
| Tailwind for mobile surfaces | Anjali / operator mobile have fewer than 20 components each; Tailwind's scanning/build cost is wasted. Mobile surfaces use vanilla CSS with the same `var(--space-md)` tokens — single source of truth. |
| Mix shadcn Dialog with our hand-rolled toast | shadcn recommends Sonner as their toast library; we adopt that. Keeps a single toast implementation. |
| Built-in shadcn transitions | shadcn Dialog/Sheet have built-in fade/slide transitions. We accept them in v1; dim 8 audits per-component for conformance to its motion contract. |

---

## 14. Token consumption rules (enforced in code review)

1. **No hardcoded breakpoint values** in component code (use Tailwind's `sm:` / `md:` / etc. or `min-width: var(--bp-lg)` etc. references).
2. **No hardcoded container widths** — use `--container-narrow` / `--container-bangla` / `--container-wide`.
3. **No `col-span-*` outside the 1/2/3/4/6/8/12 vocabulary** declared in §4.
4. **No layout transitions** on `grid-template-columns` / `container` / breakpoint-driven properties. (Per dim 1 §7.6.)
5. **No page template implementations in dim 5** — the 6 templates are wireframes; React pages land post-scaffold.
6. **No shadcn components outside the v1 list** (button / input / card / dialog / badge / sonner / separator / sheet / sidebar).
7. **No mobile-surface grid logic in dim-5 code** — Anjali / operator / PHA each get their own lockdown.
8. **No locale-switching inside individual components** — the locale attribute lives on `<body>`, and Bangla rules apply via `[data-locale="bn"]` selectors. Components are locale-agnostic.

---

## 15. Verification checklist

Before dim 5 is considered complete:

- [x] `grid-preview.html` opens; all 5 breakpoints labeled + 12-column grid visible
- [x] Page templates rendered as wireframes (6 cards)
- [x] Empty states rendered (8 patterns × 2 themes)
- [x] Audit-log row demo (1 desktop dense + 1 mobile collapsed)
- [x] Tailwind config code block visible and matches §5 spec
- [x] Bangla locale section (§8 in preview) shows Noto Sans Bengali + bangla row-modifier
- [x] Theme switcher (light/dark) re-tints all sections
- [x] Locale switcher (en/bn) flips Bangla text and audit-log row meta
- [x] This lockdown doc (`05-grid-pages-stack-lockdown.md`) has 19 sections (matching dim 2/3 conventions)
- [x] No hardcoded values in any committed Tailwind utility class in the spec

### Verification deferred to follow-up engineering-setup workstream

These verification items belong to the React/Vite/Tailwind/shadcn scaffold workstream (not dim 5 itself):

- [ ] `surakkha-app/` directory exists with the 18 files listed in §16
- [ ] `cd surakkha-app && npm install` succeeds
- [ ] `cd surakkha-app && npm run dev` boots Vite dev server on `localhost:5173`
- [ ] `localhost:5173` renders the App.tsx layout (top-chrome + sidebar + content)
- [ ] shadcn components present in `src/components/ui/` (at least: button, input, card, dialog, badge, sonner, separator, sheet, sidebar)
- [ ] All 54 design tokens declared in `src/styles/tokens.css` (cross-checked against dim 1–4 previews)
- [ ] Theme switcher in App.tsx re-tints dark mode via `data-theme` attribute
- [ ] Locale switcher in App.tsx flips Bangla font + adds Bangla row-pad modifier
- [ ] No hardcoded color/spacing/radius/height values in any committed Tailwind class (audit via grep for arbitrary values like `[--brand-500]`)

---

## 16. React scaffold specification *(deferred to engineering-setup workstream)*

The following 18 files are **specified here** but not created in dim 5. They will be created by a post-Gate-0 engineering-setup workstream (or as part of Story 1.1 build kickoff).

```
surakkha-app/
├── package.json                          # vite + react + tailwind + ts + shadcn
├── vite.config.ts                        # React plugin
├── tailwind.config.js                    # Per §5 above
├── postcss.config.js                     # tailwindcss + autoprefixer
├── tsconfig.json                         # TS strict mode
├── tsconfig.node.json                    # Vite-side TS config
├── index.html                            # Mounts <App />, no <style> blocks
├── components.json                       # shadcn config (style: "default", baseColor: "neutral")
├── README.md                             # Run instructions
└── src/
    ├── main.tsx                          # ReactDOM.createRoot, theme + locale bootstrap
    ├── App.tsx                           # <TopChrome /> + <Sidebar /> + content area
    ├── styles/
    │   ├── tokens.css                    # All 54 tokens from dim 1-4 as :root vars + [data-theme="dark"] override
    │   └── globals.css                   # @tailwind base/components/utilities + Google Fonts @import
    ├── lib/
    │   ├── utils.ts                      # shadcn's cn() helper
    │   ├── theme.ts                      # data-theme toggle + localStorage
    │   └── locale.ts                     # data-locale toggle + localStorage
    └── components/
        ├── ui/                           # shadcn-generated primitives
        │   ├── button.tsx
        │   ├── input.tsx
        │   ├── card.tsx
        │   ├── dialog.tsx
        │   ├── badge.tsx
        │   ├── sonner.tsx
        │   ├── separator.tsx
        │   ├── sheet.tsx
        │   └── sidebar.tsx
        └── layout/
            ├── TopChrome.tsx             # 48 px chrome per dim 4 §7
            ├── Sidebar.tsx               # Admin nav per dim 4 §8.1
            ├── Container.tsx             # --container-narrow/bangla/wide switch
            └── EmptyState.tsx            # 8-pattern component per §8
```

`App.tsx` for the v1 scaffold render: a single dashboard shell that demonstrates the 6 empty-state patterns + 1 audit-log row + 1 inbox-row example, with interactive theme + locale switchers. The 6 page templates from §7 are *placeholders* in v1; full implementations land in v1.1.

---

## 17. Hand-off to dimension 6 (data formats)

Carry forward:

- **Page-template data shapes:**
  - `Dashboard = { kpis: KPI[] }` — `KPI = { label, value, trend? }`.
  - `InboxList = { rows: InboxRow[] }` — `InboxRow = { icon?, title, meta, badge?, action? }`.
  - `InboxDetail = { incident: Incident, related: Incident[] }`.
  - `VerifyFlow = { step: 1 | 2 | 3, sensorCluster, corroborations }`.
  - `AuditLog = { entries: AuditEntry[] }` — `AuditEntry = { time, chainRef, eventType, ward, actor, action? }`.
  - `Settings = { sections: SettingsSection[] }` (deferred to v1.1).

- **Container-width-as-data:** each page declares `containerWidth: 'narrow' | 'bangla' | 'wide'`. dim 6 codifies this enum + the mapping to tokens.

- **Locale carries at the container level:** `<body data-locale="bn">`, not per-string. dim 6 ensures data payloads do NOT carry per-string locale tags.

- **Empty-state slot shape:** `EmptyState = { icon, heading, body, primaryCta?, secondaryCta? }`. `icon` is one of the 8 lucide names from §8.

---

## 17.1. Phase 1 frontend-only demo *(amendment 2026-09-07)*

Per the user's call: **Phase 1 ships the frontend against a mock backend, not against the FastAPI gateway.** The gateway (Story 1.1) is deferred until Phase 2. Phase 1 must still let a developer or stakeholder click through login → logout → explore → create → delete and feel the response loop working.

**Strategy:** **MSW (Mock Service Worker) + IndexedDB + TanStack Query + the locked dim-7 wire shapes.** The React app calls `/v1/chain` exactly as it will against the real gateway; MSW intercepts at the network layer and returns the dim-7 envelope shapes. State persists across page refreshes via IndexedDB; reset clears it.

**Opt-in flag:** `VITE_USE_MOCKS=true` enables the mock worker. `VITE_USE_MOCKS=false` (or unset) talks to the real gateway. Component code is identical in both modes — the swap is a one-line config flip, not a code change.

**Wire contract parity (non-negotiable):** every MSW handler returns the exact shape locked in dim 7 §3-§4. The canonical_json + sha256 chain-hash computation is ported from spec-1-1 `app/gateway/canonical.py` so the demo computes the same `block_hash` values the gateway would. The Phase 2 swap to the real gateway requires zero component changes.

**SSE handling:** MSW's service-worker model does not support SSE interception cleanly. Phase 1 demo uses the polling endpoint (`GET /v1/chain?cursor=`) at 30 s ± 10% jitter — the same fallback the production app exercises when SSE drops (per dim 5d §F state machine: `connecting → connected → reconnecting → fallback-poll → offline`). The SSE state machine is documented but not exercised in Phase 1.

**"Delete" affordance is structurally honest:** the chain is append-only — there is no delete. The demo replaces "delete" with the corresponding append-only event: `IncidentResolved` (closes the incident), `PublicNoticeRetracted` (false-alarm correction), or `SubjectRedacted` (RTBF tombstone). Same UX shape, same wire envelope, same chain-event evidence. Demonstrating the truth of the system matters more than faking a delete button.

**Persisted state is per-browser.** IndexedDB does not sync across machines by default; no `BroadcastChannel` cross-tab sync in v1. The mock never persists raw PII or bearer tokens (it stores only chain-shaped events + session-tokens with explicit user logout).

**Scaffold additions** (under `surakkha-app/src/mocks/`):

```
src/mocks/
├── browser.ts          # setupWorker() + conditional start based on VITE_USE_MOCKS
├── handlers.ts         # REST handlers matching dim-7 wire contract
├── fixtures.ts         # Seed: 50 events, 3 sensors, 2 incidents, 1 PHA approval, 1 PublicNoticeIssued
├── idb.ts              # Thin idb-keyval wrapper (events, sensors, sessions, chain_head)
├── canonical.ts        # canonical_json + sha256 — port of spec-1-1 app/gateway/canonical.py
├── session.ts          # Fake login picker — 5 personas from the 8-entry AD-12 enum
└── reset.ts            # "Reset demo data" button clears IDB and reseeds fixtures
```

**Rejections (Phase 1 mock edition):**

| Considered | Rejected because |
|---|---|
| `json-server` standalone mock API | Extra process to run; doesn't deploy as static site; component code paths diverge from production. |
| `miragejs` in-memory only | Loses state on refresh; user can't feel the persistence loop. |
| localStorage instead of IndexedDB | 5 MB quota; events accumulate fast; same DB shape Anjali-mobile IDB queue uses (dim 7 §5.5). Reuse. |
| Hand-rolled in-component mocks | Component code diverges from production; nothing carries over to Phase 2. |
| Real FastAPI gateway running locally | That's Phase 2. Phase 1 is UI-only by user call. |
| MSW + SSE polyfill | MSW does not intercept SSE cleanly; use the polling fallback (which is the same code path production falls back to anyway). |

**Hand-off to Phase 2:** when Story 1.1 lands, the swap is `VITE_USE_MOCKS=false`. MSW handlers stay in the repo as `mocks/` for component tests (Vitest + MSW node) and Storybook stories; production transport flips to the real gateway. Component code unchanged.

---

## 18. Hand-off to dimension 7 (sensor data formats)

- **Audit-log row is the densest sensor-data consumer.** `eventType` enum declared in §9.3: `sensor_spike` / `sensor_offline` / `report_received` / `incident_verified` / `incident_dismissed` / `councillor_notified` / `chain_anchored` / `sign_in` / `sign_out`. dim 7 codifies the wire format + validation.
- **Sensor board (deferred to dim 5c / dim 9):** per `01-color-lockdown.md` §6.3 — single brand hue for sensor state (`--brand-500` for nominal, `--warning` for caution, `--danger` for breach). dim 7 defines the data; dim 5c paints it.

---

## 19. Hand-off to dimension 8 (motion)

- **Responsive motion:** dim 8's transitions can differ by breakpoint. E.g. modal enter/exit may be faster on mobile (100 ms) than desktop (150 ms) because mobile-modal tap-targets need snappiness. Codified per-breakpoint in dim 8.
- **No motion on dim-5 layout primitives:** col-span changes, container-width changes, breakpoint-driven restacks — none of them transition. Per dim 1 §7.6 / dim 4 §13.
- **shadcn/ui has its own transitions baked in** (Dialog fade, Sheet slide). Accepted in v1; dim 8 audits per-component for conformance.
- **Reduced motion:** `prefers-reduced-motion: reduce` honoured at the body level. Tailwind's `motion-safe:` variant can wrap any animation that respects user preference.

---

## 20. Sign-off

| Reviewer | Role | Status |
|---|---|---|
| (pending) | Design lead | — |
| (pending) | Engineering lead | — |
| (pending) | Accessibility reviewer | — |

Once all three sign off, this document becomes the single source of truth for v1 grid / pages / stack direction. Any further changes require an amendment appending this file, not an edit.

---

## 21. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Document created. 5 breakpoints locked. 3 container widths locked. 12-col grid locked. Tailwind config *spec'd* (deferred to engineering-setup workstream). shadcn/ui adoption mapped to 8 dim-4 components. 6 page templates *wireframed* (deferred to v1.1). 8 empty-state patterns locked. Audit-log row locked (desktop 6-slot grid + mobile 1-col timeline). React scaffold (18 files) *specified* in §16 — not created in dim 5. | Gate 0 dim 5 lockdown. |
| 2026-09-07 | **§17.1 added** — Phase 1 frontend-only demo strategy. MSW + IndexedDB + TanStack Query against the locked dim-7 wire shapes. `VITE_USE_MOCKS=true` opt-in. SSE replaced by polling fallback for demo. "Delete" affordance becomes the corresponding append-only event (`IncidentResolved` / `PublicNoticeRetracted` / `SubjectRedacted`) — same UX, structurally honest. Scaffold `src/mocks/` directory added (7 files). Phase 2 swap = one config flip, no component code changes. | User call: Phase 1 ships UI-only; gateway deferred to Phase 2. | |
