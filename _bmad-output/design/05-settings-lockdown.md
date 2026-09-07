# Dimension 5 — Settings Page Template · Lockdown (extension)

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/settings-preview.html`
**Parent dim:** dim 5 (extends the 6 → 7 page-template roster)

---

## 1. Scope

This dim is an **extension of dim 5** — it locks the 7th Priya page template that dim 5 §7 omitted (Login, Dashboard, InboxList, InboxDetail, VerifyFlow, AuditLog were the original 6). Settings was referenced in dim 6 §4.5 as `SettingsPage` data shape but the page-template contract was unwritten.

**In scope:**
- Settings page layout (1 column, sticky section nav, full-width sections)
- 6 `SettingControl` kinds: `toggle`, `select`, `text`, `numeric`, `link`, `danger`
- Section grouping rules (how SettingsSection cards stack, spacing between, section dividers)
- Save / discard behavior (draft vs immediate commit)
- Bangla label rendering (inherits dim 2/4/5 rules)
- Light + dark parity

**Out of scope:**
- Settings data model (covered by dim 6 §4.5: `SettingControl`, `SettingsSection`, `SettingsPage`)
- Auth / permission gating on individual settings (covered by dim 6 §6.1 `Permission`)
- Audit logging of setting changes (covered by dim 6 §4.6 `AuditEntry` `eventType`)
- Sensor calibration UI (separate verify-flow-adjacent surface, v1.1)

**Inherited from upstream dims (no re-litigation):**
- Dim 1 colors, dim 2 typography, dim 3 icons (lucide), dim 4 spacing + 8 component classes (especially `card--with-heading`, `input`, `button--primary/secondary/danger`, `band-pill` not used here)
- Dim 5 §2 breakpoints, §3 container widths, §4 12-col grid, §6 shadcn adoption (uses `<Card>` + `<Input>` + `<Switch>` + shadcn's `<Select>`)
- Dim 6 §4.5 `SettingsPage` data shape (this dim paints it, doesn't redefine it)
- Dim 4 Amendment A Bangla row-pad modifier for Bangla labels

---

## 2. Page layout

```
┌──────────────────────────────────────────────────────────┐
│ TopChrome (dim 5 §6)                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Page header                                    │    │
│  │   H1: "Settings"                               │    │
│  │   meta: "Last saved 2 min ago"                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │ Sticky section   │  │ Section card                │ │
│  │ nav              │  │   Card heading: "Account"   │ │
│  │  • Account       │  │   description               │ │
│  │  • Notifications │  │   ┌──────────────────────┐  │ │
│  │  • Display       │  │   │ Toggle row           │  │ │
│  │  • Bangla        │  │   ├──────────────────────┤  │ │
│  │  • Chain         │  │   │ Select row           │  │ │
│  │  • Danger zone   │  │   ├──────────────────────┤  │ │
│  │                  │  │   │ Numeric row          │  │ │
│  │                  │  │   └──────────────────────┘  │ │
│  │                  │  └─────────────────────────────┘ │
│  │                  │  ┌─────────────────────────────┐ │
│  │                  │  │ Next section card...        │ │
│  │                  │  └─────────────────────────────┘ │
│  └──────────────────┘                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Slot | Width | Padding |
|---|---|---|
| TopChrome | full width | dim 4 `--space-xl` inline |
| Page header | `col-span-12` | `--space-xl` block, `--space-3xl` top |
| Sticky section nav (xl+) | `col-span-3` (320 px) | `--space-md` inline |
| Section cards stack (xl+) | `col-span-9` | `--space-lg` gap between cards |
| Mobile (< 1024) | full width, section nav collapses to anchor pills at top | `--space-lg` inline |

Container width per dim 5 §3: Settings uses `containerWidth: 'wide'` (1280 px) — settings are full-Latin admin surface, no Bangla line-length tuning needed. The section nav + content together fit comfortably in 1280.

---

## 3. SettingControl rendering (per kind)

Each `SettingControl` (dim 6 §4.5) renders as a single row inside a section card. Row height is `--height-row-comfortable` (56 px, per dim 4 Amendment A) for most kinds; danger actions render in a separate `--bg-subtle` inset block.

### 3.1 `kind: 'toggle'`

```
┌────────────────────────────────────────────────────┐
│  Dark mode                          [ ●── ]   ON   │  56 px row
│  Use system theme when available                   │  --font-size-sm --fg-secondary
└────────────────────────────────────────────────────┘
```

- Label: `--font-size-md` `--fg-default` `--font-weight-medium`
- Description: `--font-size-sm` `--fg-secondary`, single line, truncate with ellipsis
- Toggle: shadcn `<Switch>`, `--brand-500` when on, `--bg-inset` track when off. 36×20 px.
- Bangla labels: row-pad modifier applies (1 tier of `--space-xs` block padding).

### 3.2 `kind: 'select'`

```
┌────────────────────────────────────────────────────┐
│  Theme                                  ▾ System    │  56 px row
│  Choose how the app looks                          │
└────────────────────────────────────────────────────┘
```

- Renders as dim-4 `.input` (read-only display). Tap → opens dim-4 modal with option list.
- Options use dim-3 chevron-down icon (`chevron-down` 16 px).
- Selected value: `--font-size-md` `--fg-default`.

### 3.3 `kind: 'text'`

```
┌────────────────────────────────────────────────────┐
│  Display name                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │ Priya Sharma                                │  │  56 px row (input takes remaining height)
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

- Label above the input (stacked, not inline — text inputs need width).
- Input: dim-4 `.input` (36 px height per dim 4 §6).
- Description below input: `--font-size-sm` `--fg-secondary`.

### 3.4 `kind: 'numeric'`

Same layout as text, but input is `type="number"`, accepts integers or decimals (specified per-control).

### 3.5 `kind: 'link'`

```
┌────────────────────────────────────────────────────┐
│  Manage API keys                          →         │  56 px row
│  Rotate or revoke chain-anchored keys              │
└────────────────────────────────────────────────────┘
```

- Renders as dim-4 nav row (dim 4 §8.3 settings-menu pattern).
- Trailing chevron (`chevron-right` 16 px `--fg-tertiary`).
- Tap → navigates to `href`.

### 3.6 `kind: 'danger'`

Renders OUTSIDE the regular section card, in a separate `--bg-subtle` inset block with `--border-strong` left border (3 px) and `--danger` accent on the icon.

```
┌────────────────────────────────────────────────────┐
│ ⚠ Reset all settings                       [Reset] │  64 px row
│   This cannot be undone. Chain keys remain intact. │
└────────────────────────────────────────────────────┘
```

- Icon: dim-3 `triangle-alert` 20 px `--danger`.
- Label: `--font-size-md` `--fg-default` `--font-weight-semibold`.
- Description: `--font-size-sm` `--fg-secondary` (the `dangerDescription` from dim 6 §4.5).
- Action: dim-4 button--secondary with `--danger` text + outline. Per dim 1 §7.3, no filled danger buttons.
- Confirmation: opens dim-4 modal asking "Type RESET to confirm" (input field, 36 px). Cancel + Confirm buttons (Confirm is button--secondary with danger styling).

---

## 4. Section rules

| Rule | Value |
|---|---|
| Section card container | dim-4 `.card--with-heading` |
| Section card spacing | `--space-lg` (16 px) between cards |
| Section heading typography | `--font-size-lg` `--fg-default` `--font-weight-semibold` |
| Section description | `--font-size-sm` `--fg-secondary`, optional, below heading |
| Controls inside section | stacked vertically, `--height-row-comfortable` (56 px) per row, dividers between (`--border-subtle` 1 px) |
| Section divider | none between rows inside a section card; `--space-lg` gap between sections |
| Sticky nav active marker | 3 px `--brand-500` left border on the active section link, dim 4 §8.5 active-state pattern |
| Sticky nav scroll | the sticky section nav uses `position: sticky; top: 48px` (below top-chrome) on xl+ viewports |

Section ordering is the order in `SettingsPage.sections[]`. The "Danger zone" section (if present) **must be last** — both per UX convention and per `Permission` ordering in dim 6 §6.1.

---

## 5. Save / discard behavior

### 5.1 Immediate commit (default)

Most controls commit on change:
- `toggle`: commit on flip
- `select`: commit on selection (modal closes + value persists)
- `text` / `numeric`: commit on blur (focus leaves the input) or Enter key

These trigger an `onSettingChange(controlId, newValue)` callback. The settings page does **not** render a save bar.

### 5.2 Deferred commit (draft mode)

Controls can opt into draft mode via a `draft?: boolean` flag on the SettingControl (extends dim 6 §4.5 shape in v1.1, but the rendering pattern is locked here):
- The control renders the new value but shows a pending state (`--warning-bg` left border on the row)
- A save bar appears at the bottom: `[Discard]` `[Save changes]` (button--secondary + button--primary)
- Save bar height: 56 px, sticky to bottom of viewport on xl+

For v1, **all controls are immediate-commit** — draft mode is contractually defined but no control in v1 ships with `draft: true`. Locked here so v1.1 doesn't have to re-litigate the pattern.

### 5.3 Conflict resolution

When two tabs are open (operator opens Settings in two browser tabs), the last commit wins. The settings page does **not** implement operational transform — out of scope for v1.

---

## 6. Bangla labels

Per dim 2 §9.4 + dim 4 §15 + dim 5 §10:
- Settings labels (`SettingControl.label`, `SettingsSection.title`, `description`) are plain strings in either script — no `{ text, locale }` shape per dim 6 §2.
- Bangla rows auto-add 1 tier of `--space-xs` block padding (dim 4 Amendment A row-pad modifier).
- The locale toggle lives in TopChrome (dim 3 §8 globe icon), not in Settings — Settings just renders whatever locale the page is in.
- A `Bangla` section in Settings can include a control like `kind: 'select'` with options `['হ্যাঁ', 'না']` for "Use Bangla numerals" — the values are Bangla strings, the rendering uses `--font-family-bangla`.

---

## 7. Light + dark parity

Settings uses the same tokens as every other Priya surface. No settings-specific color tokens.

- Section cards: `var(--bg-surface)` with `var(--border-subtle)` outline
- Toggle (on): track `var(--brand-500)`, thumb `var(--bg-surface)`
- Toggle (off): track `var(--bg-inset)`, thumb `var(--bg-surface)`
- Danger block: `var(--bg-subtle)` background, `var(--danger)` icon + button outline
- Sticky nav active marker: `var(--brand-500)` (light) / `var(--brand-400)` (dark) — dim 5 §5 Tailwind config maps this 1:1

---

## 8. Hand-offs

### To dim 6 (data formats)

`SettingControl` already exported from dim 6 §4.5. Add an optional field for v1.1:

```ts
interface SettingControl {
  // ... existing fields from dim 6 §4.5
  draft?: boolean;             // opt into deferred-commit mode (v1.1)
  placeholder?: string;        // for kind: 'text' / 'numeric'
  min?: number;                // for kind: 'numeric'
  max?: number;                // for kind: 'numeric'
  step?: number;               // for kind: 'numeric'
}
```

### To dim 7 (sensor wire format)

Settings mutations emit `AuditEntry` events with `eventType: 'setting_changed'` (extends the enum from dim 6 §4.6):
```ts
| 'setting_changed'           // dim 7 wire-format addition
| 'api_key_rotated'
| 'settings_reset'
```

### To dim 8 (motion)

- Toggle flip: `--motion-toggle-flip: 120ms ease-out` (translates thumb 16 px). Referenced from dim 8.
- Section nav scroll-spy: `--motion-section-nav-highlight: 200ms ease-out` (background-color fade on active marker).
- Danger modal open: same as dim 4 modal motion (locked there).

### To engineering-setup workstream

- shadcn `<Switch>` primitive (used for `kind: 'toggle'`)
- shadcn `<Select>` primitive (used for `kind: 'select'`)
- Sticky-nav scroll-spy via IntersectionObserver on the section cards (each section gets `id={section.id}` for anchor linking)

---

## 9. Verification checklist

### Ships in dim 5 extension

- [ ] All 6 SettingControl kinds render in the preview HTML with correct row layouts
- [ ] Section cards stack with `--space-lg` gap; dividers between rows inside cards
- [ ] Sticky section nav pins below top-chrome on xl+ viewports
- [ ] Toggle uses shadcn `<Switch>` with brand-500 fill when on
- [ ] Danger block renders in `--bg-subtle` inset with `--danger` icon, separate from regular section cards
- [ ] Bangla label demo: section + control labels in Bangla, row-pad modifier applied
- [ ] Light + dark parity: re-tints on theme toggle
- [ ] Mobile width (< 1024): section nav collapses to anchor pills at top
- [ ] `05-settings-lockdown.md` matches dim 5 conventions (sections numbered, hand-offs explicit)

### Deferred to engineering-setup

- [ ] shadcn `<Switch>` and `<Select>` primitives installed and themed via dim-5b tokens
- [ ] `onSettingChange` callback wired to backend persistence
- [ ] `AuditEntry` emission on each setting mutation
- [ ] Draft mode implementation (v1.1)
- [ ] Multi-tab conflict detection (v2)

---

## 10. Amendment log

- **v1 (2026-09-07):** Initial lockdown. 6 SettingControl kinds, immediate-commit default, sticky section nav, danger-zone separation. Closes the 7-template gap in dim 5.
