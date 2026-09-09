---
title: 'FE-B5c — DatePicker primitive (single + range, locale-aware, ARIA grid)'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 1
baseline_commit: '71270ab'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-fe-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md'
---

## Intent

**Problem:** Surakkha Phase 1 ships 4 Priya pages (`VerifyFlow`, `InboxDetail`, `AuditLog`, `Settings`) that render date strings via `Intl.DateTimeFormat` + inline `<input type="date">` (or nothing — some pages just print the ISO string). The next batch of flows needs a calendar grid: Anjali's `IncidentDate` filter on `/settings`, the `OperatorAssigned.due_at` field on `VerifyFlow` step 3, and the `Opened between [from, to]` filter on `/audit-log`. Building three bespoke date pickers across three pages repeats the same month-grid + keyboard-nav + Bangla-locale logic.

**Approach:** New `web/src/components/ui/DatePicker.tsx` (~280 lines, split into `DatePicker.tsx` + `Calendar.tsx` + `useCalendar.ts` + `DateRangePicker.tsx` per AD-FE-5 ceiling) — generic `DatePicker` (single date) + `DateRangePicker`. Optional `min`/`max`. Optional `locale: 'en' | 'bn'` driven by `useLocale()`. ARIA grid pattern. Styleguide Section 11 with 5 examples. **Zero new third-party deps** — `date-fns` was the planned dep but `native Date + Intl.DateTimeFormat` covers the 5 calendar ops (`startOfMonth`, `addMonths`, `isSameDay`, weekday/month name arrays) at 30 LoC, matching the codebase's existing StyleguidePage pattern. Ship 10 Vitest cases.

## Boundaries & Constraints

**Always:**
- Two named exports: `DatePicker` (single) + `DateRangePicker` (range). `DatePickerProps` discriminated by `mode: 'single' | 'range'`.
- Single mode: `value: Date | null`, `onChange: (d: Date | null) => void`. Range mode: `value: DateRange | null` where `DateRange = { from: Date | null; to: Date | null }` + `onChange: (r: DateRange | null) => void`.
- Trigger is a `<button>` that opens a popover (same surface as Dropdown: `bg-surface` + `border-default` + `radius-md` + `shadow-modal`). Popover contains `<Calendar>`. Click-outside / Escape closes (reuse `useDropdownState` pattern).
- `<Calendar>` renders a 7×6 month grid. Days outside the current month render dimmed; today's date gets a `today` modifier; selected day gets a `--brand-500` fill with `--fg-on-status-light` text; in-range cells (range mode) use `--brand-100`; out-of-range (min/max disabled) cells use `--fg-disabled` + `pointer-events: none`.
- Locale awareness: weekday headers + month name header come from `Intl.DateTimeFormat(locale, …)`. Bangla: `bn` locale (full Bengali script month + weekday names). Hook into `useLocale()` for the default `locale` value.
- Keyboard nav: Arrow keys move focus across cells; Enter/Space selects the focused cell; PageUp/Down moves by month; Shift+PageUp/Down moves by year; Home/End jumps to start/end of week; Escape closes popover (focus returns to trigger).
- ARIA: `role="grid"` on the calendar table, `role="row"` on week rows, `role="gridcell"` on day cells, with `aria-selected` + `aria-disabled` + `aria-label` (full date string in user's locale, e.g. "Tuesday, September 1, 2026"). Header buttons (`prev/next month`) carry `aria-label`.
- Trigger button shows the selected date in the user's locale (via `Intl.DateTimeFormat(locale, { dateStyle: 'medium' })`). Range trigger shows "Sep 1 – Sep 7, 2026" pattern.
- New `web/src/styles/datepicker.css` (~120 lines). Token-only. Mirrors `dropdown.css` mobile breakpoint: ≤767px → popover becomes a bottom sheet at `max-height: 60vh`.
- Styleguide Section 11: 5 examples — single with default value, range, single with min/max, disabled state, locale-toggle live readout wired to `useState`.
- New `web/src/__checks__/fe-b5c-datepicker.test.tsx` (~280 lines, 10 cases).
- i18n keys under `datepicker.*` namespace in both `en/common.json` + `bn/common.json` (12 keys: `previousMonth`, `nextMonth`, `previousYear`, `nextYear`, `selectDate`, `selectRange`, `startDate`, `endDate`, `clear`, `today`, `weekdays`, `months`).

**Ask First:** None — single goal + already-approved plan.

**Never:**
- No third-party deps (no `date-fns`, no `react-day-picker`, no `react-datepicker`).
- No `passthrough()` in MSW overrides.
- No barrel files (AD-FE-9).
- No edits to existing date stringification in `InboxDetail.tsx` (the consumer migration to DatePicker is a follow-up).
- No "Month Year" picker dropdown — use prev/next buttons only (saves 30 LoC + avoids a Dropdown-within-Dropdown nesting).
- No time-picker (HH:MM) — deferred to Phase 2.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_render | Mount with `value=null`, `onChange` wired | Trigger shows placeholder; popover closed; `aria-expanded="false"` |
| HAPPY_PATH_open | Click trigger | Popover renders 7×6 grid of current month; `aria-expanded="true"`; 42 `role="gridcell"` elements |
| HAPPY_PATH_select_single | Click day 15 | `onChange(day15)` fires; trigger updates; popover closes; focus returns to trigger |
| HAPPY_PATH_select_range | Range mode; click day 1 then day 5 | After first click: in-range tracking starts; after second click: `onChange({from: day1, to: day5})`; both endpoints get `--brand-500` fill; intermediate cells get `--brand-100` |
| HAPPY_PATH_locale_bn | `locale='bn'` | Month header + weekday headers render in Bengali script; day-cell `aria-label` localized |
| HAPPY_PATH_keyboard | Popover open; ArrowDown | Focused cell moves to row below; `aria-activedescendant` updates |
| HAPPY_PATH_paginate | Click "next month" | Calendar advances one month; header label updates |
| HAPPY_PATH_min_max | `min=day1 max=day28`; click day 30 | Cell renders `aria-disabled="true"`; click no-op; no `onChange` |
| ERROR_CASE_empty | Mount with no props | Trigger renders placeholder; no crash; no `onChange` |
| ERROR_CASE_close_outside | Open + click outside popover | Popover closes; focus does NOT auto-restore (matches Dropdown's B5a deferred decision) |

</frozen-after-approval>

## Spec Change Log

**Iteration 1 (2026-09-09) — Step-04 review patches:**
- **useCalendar.ts** — `today` no longer frozen at first render; refreshed via
  `visibilitychange` listener (covers sessions that cross local midnight).
- **DatePicker.tsx + DateRangePicker.tsx** — popover `aria-label` now reads
  the localized month label (e.g. "September 2026" / "সেপ্টেম্বর ২০২৬") instead
  of the prev-month nav button label.
- **DateRangePicker.tsx** — same-day second click emits
  `onChange({from, to: day})` (zero-length range) rather than no-oping, so the
  consumer can distinguish "user confirmed today" from "user dismissed".
- **fe-b5c-datepicker.test.tsx** — adds the 7 reviewer-identified coverage
  gaps:
  1. `select_single` — asserts `document.activeElement === trigger` after
     click (focus restore) + `--selected` modifier persists on re-open.
  2. `select_range` — asserts endpoint `calendar__day--selected` modifiers
     and intermediate `calendar__day--in-range` modifiers on re-open.
  3. `open` — sweeps `aria-selected` / `aria-disabled` / `aria-label` /
     includes-year across all 42 cells + asserts popover `aria-label`
     matches a year pattern (not the prev-month label).
  4. `keyboard_arrow` — re-queries cells after open (stale NodeList fix) +
     asserts the focused cell is still inside `[role="grid"]`.
  5. `locale_bn` — asserts `dp-cal-month` starts with a Bengali char
     (U+0980–U+09FF) + all 7 `columnheader`s carry Bengali text.
  6. `min_max` — pins `value` to 2026-09-15 so day 30 is in-month but
     out-of-range (was brittle: depended on the month the harness ran in).
  7. `close_outside` — asserts `document.activeElement !== trigger`
     (per B5a's deferred decision).

## Code Map

### New primitive (Layer A)
- `web/src/components/ui/DatePicker.tsx` (NEW, ~110 lines) — composition root. Discriminated union on `mode`. Renders trigger `<button>` + `<Calendar>` popover. Wires `useCalendar` for visible-month state + `useDropdownState`-equivalent for open/close (re-implemented inline; ~25 LoC).
- `web/src/components/ui/Calendar.tsx` (NEW, ~150 lines) — 7×6 grid. Per-cell button. Keyboard handlers (Arrow / PageUp/Down / Home/End / Enter). Locale-aware header + weekday row. ARIA `role="grid"`.
- `web/src/components/ui/DateRangePicker.tsx` (NEW, ~80 lines) — wraps `DatePicker` with `mode='range'` + 2-step selection state (start → hover → end). Highlights in-range cells.
- `web/src/components/ui/useCalendar.ts` (NEW, ~80 lines) — visible-month state + `nextMonth`/`prevMonth`/`nextYear`/`prevYear` + cell-locale formatting + min/max guard. Zero deps.
- `web/src/styles/datepicker.css` (NEW, ~120 lines) — `.datepicker` + `.datepicker__trigger` + `.datepicker__popover` + `.calendar` + `.calendar__day` + `.calendar__day--today` + `.calendar__day--selected` + `.calendar__day--in-range` + `.calendar__day--disabled`. Token-only. 767px bottom-sheet breakpoint.

### Styleguide showcase
- `web/src/pages/StyleguidePage.tsx` (EXTEND, +120 lines) — Section 11 "DatePicker" inserted between Section 10 and the footer. 5 examples: (1) single with today as default, (2) range with last-7-days default, (3) single with `min=today` / `max=+30d`, (4) disabled state, (5) locale-toggle live readout.
- `web/src/styles/styleguide.css` (EXTEND, +15 lines) — `.section--datepicker` + `.sg-datepicker-readout` (token-only).
- `web/src/i18n/locales/en/common.json` (EXTEND, +12 keys under `datepicker.*`).
- `web/src/i18n/locales/bn/common.json` (EXTEND, +12 keys; Bengali translations).

### Tests (vitest)
- `web/src/__checks__/fe-b5c-datepicker.test.tsx` (NEW, ~280 lines, 10 cases) — render, open, select_single, select_range, locale_bn, keyboard_arrow, paginate_next, min_max_disabled, empty, close_outside. `afterEach(() => { cleanup(); vi.restoreAllMocks(); })` per FE-1.3c review.

### Reuse (no edits)
- `web/src/components/ui/Button.tsx` — prev/next month buttons (variant=ghost, size=sm).
- `web/src/hooks/useLocale.tsx` — DatePicker reads `locale` from the hook (or accepts explicit `locale` prop override).
- `web/src/components/layout/EmptyState.tsx` — DatePicker's empty-state slot composes (when consumer passes no `min`/`max`).
- `<Section>` + `<Row>` helpers at `web/src/pages/StyleguidePage.tsx:46-75`.

### Read-only references
- `_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md` — popover pattern to mirror (root ref + click-outside + mobile bottom sheet).
- `web/src/components/ui/Dropdown.tsx` — popover surface styling + position.
- `web/src/styles/dropdown.css:42-67` — popover surface + mobile bottom-sheet CSS to mirror.
- `web/src/i18n/locales/en/common.json` + `bn/common.json` — namespace pattern.

### CHANGELOG
- Append `### Added` (DatePicker + DateRangePicker + styleguide + 10 cases; suite 81 → 91) + `### Tests` bullet. Note **zero new deps**.

## Tasks & Acceptance

**Execution:**
- [ ] `web/src/components/ui/useCalendar.ts` — new file, ~80 lines. State + locale + min/max.
- [ ] `web/src/components/ui/Calendar.tsx` — new file, ~150 lines. 7×6 grid + keyboard + ARIA.
- [ ] `web/src/components/ui/DatePicker.tsx` — new file, ~110 lines. Composition root + trigger + popover.
- [ ] `web/src/components/ui/DateRangePicker.tsx` — new file, ~80 lines. Range selection state.
- [ ] `web/src/styles/datepicker.css` — new file, ~120 lines. Token-only + 767px mobile.
- [ ] `web/src/i18n/locales/en/common.json` — add `datepicker.*` (12 keys).
- [ ] `web/src/i18n/locales/bn/common.json` — add `datepicker.*` (12 Bengali keys).
- [ ] `web/src/pages/StyleguidePage.tsx` — Section 11 + 5 examples + live readout.
- [ ] `web/src/styles/styleguide.css` — section scaffolding.
- [ ] `web/src/__checks__/fe-b5c-datepicker.test.tsx` — new file, ~280 lines, 10 cases.
- [ ] `CHANGELOG.md` — append `### Added` + `### Tests` bullets; note zero new deps.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 91 cases pass (81 + 10), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new errors.
- Given `pnpm --filter surakkha-app build`, when run, then succeeds; bundle delta ≤+4 kB gzipped (zero new deps).
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `<DatePicker>` mounted, when user clicks trigger, then 7×6 grid renders + `aria-expanded="true"` + 42 `role="gridcell"` elements present.
- Given `<DatePicker value=null>`, when user clicks day 15, then `onChange(day15Date)` fires + popover closes + trigger updates.
- Given `<DateRangePicker>`, when user clicks day 1 then day 5, then `onChange({from, to})` fires; day 1 + day 5 get `--brand-500`; days 2-4 get `--brand-100`.
- Given `<DatePicker locale='bn'>`, when rendered, then month + weekday headers display in Bengali script; cell `aria-label` localized.
- Given `<DatePicker min max>` mounted, when user clicks out-of-range cell, then `aria-disabled="true"` + click is no-op + no `onChange`.
- Given `<DatePicker>` open with focus on day 15, when user presses ArrowDown, then focus moves to day 22.

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 91 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app build` — succeeds.
- `pnpm --filter surakkha-app lint` — 0 new errors.

**Manual checks:**
- Open `/styleguide`; Section 11 "DatePicker" renders 5 examples.
- Click "single date" trigger → calendar pops; click day 15 → trigger updates; popover closes.
- Click "range" trigger → click day 1 then day 5 → in-range highlight visible.
- Click "min/max" trigger → out-of-range cells render disabled.
- Toggle locale to Bangla → Bengali month + weekday headers appear.
- Resize below 767px → popover anchors to bottom of viewport.

## Design Notes

**Why zero-dep (dropping `date-fns`).** The plan flagged `date-fns@^4` as the only new dep, but investigation showed the codebase already uses native `Date` + `Intl.DateTimeFormat` (StyleguidePage's `makeOpenedAtRenderer`, InboxDetail's `toLocaleTimeString`). For B5c's 5 calendar operations — `startOfMonth`, `addMonths`, `isSameDay`, weekday/month name arrays — native APIs are 30 LoC and zero KB. Pulling `date-fns` for this would add 16 KB gzipped for no feature gain. Locale (en/bn) handling is the same either way via `Intl.DateTimeFormat`.

**Why Bangla locale is a hard requirement, not optional.** Anjali (school operator) is Bangla-primary. Phase 1 ships Bangla UI everywhere date pickers might appear (Settings, VerifyFlow). Locale must follow the user's `useLocale()` setting; the calendar UI must not fall back to English when locale='bn'.

**Why DatePicker + DateRangePicker are separate exports.** The state machine differs: single-mode is `value: Date | null`; range-mode is `{from, to}` with a 2-click selection (start → hover preview → end). Sharing one component with a `mode` prop would push it past the 200-LoC ceiling and conflate two state shapes. Two siblings that share `<Calendar>` underneath.

**Why click-outside doesn't auto-restore focus.** This matches B5a Dropdown's deferred decision (deferred-work.md). Restoring focus belongs in a follow-up that audits keyboard ergonomics across all primitive popovers (Dropdown, DatePicker, future Combobox-async) so the decision is consistent.

**Why no "Month Year" picker dropdown.** Saves 30 LoC and avoids a Dropdown-within-Dropover nesting complication. Operators hitting "previous month" 6 times to reach 6 months ago is rare; a "previous year" button (Shift+PageUp) covers it.

## Out of scope (deferred to later specs)

- **B5d** — Consumer migration: replace bespoke date inputs in `Settings` (Anjali's `IncidentDate` filter), `VerifyFlow` (OperatorAssigned `due_at`), and `AuditLog` (opened-between filter) with `<DatePicker>`. Each consumer is its own sub-spec.
- **Time-picker** (HH:MM alongside date) — Phase 2.
- **Decade / year picker** (jump 10 years at a time) — defer.
- **Highlighted date ranges** (e.g. "days with incidents" overlay) — defer until a real consumer needs it.
- **Hover-preview during range selection** (gray out days from start → cursor) — defer to a UX pass on range mode.
- **Inline calendar** (always-visible, no popover) — defer.
- **Sticky mobile keyboard avoidance** (visualViewport API) — defer until iOS Safari quirk is confirmed in the consumer's test.

## Suggested Review Order

**Pure logic (Layer A — date math + state)**
- `useCalendar.ts` (~80 lines) — visible-month state + `nextMonth` / `prevMonth` / `nextYear` / `prevYear` + 6×7 cell-array builder + `isInRange` / `isDisabled` predicates. Native `Date` + `Intl.DateTimeFormat` (no `date-fns`). Pinned to AD-FE-5 ≤200 LoC.
- Locale strings via `Intl.DateTimeFormat(locale, { month: 'long' })` for the header + `Intl.DateTimeFormat(locale, { weekday: 'short' })` for the weekday row. Bangla names come free from the `bn` locale.
  [`useCalendar.ts`](../../web/src/components/ui/useCalendar.ts)

**Sub-component (Layer A — DOM surface)**
- `Calendar.tsx` (~150 lines) — `<table role="grid">` + 7 weekday headers + 6 week rows. Each cell is a `<button role="gridcell">` with `aria-selected` + `aria-disabled` + `aria-label` (full localized date string). Keyboard handlers: Arrow keys move focus; PageUp/Down moves month; Shift+PageUp/Down moves year; Home/End jumps to start/end of week; Enter/Space selects.
  [`Calendar.tsx`](../../web/src/components/ui/Calendar.tsx)

**Composition root + range sibling (Layer A)**
- `DatePicker.tsx` (~110 lines) — `<button class="datepicker__trigger">` + popover containing `<Calendar>`. Click-outside + Escape via a 25-LoC inline effect (mirrors `useDropdownState`).
- `DateRangePicker.tsx` (~80 lines) — wraps `DatePicker` with range state. Tracks `pending: Date | null` between clicks 1 and 2; renders the `in-range` modifier on cells between `from` and the current `hovered | to`.
  [`DatePicker.tsx`](../../web/src/components/ui/DatePicker.tsx) · [`DateRangePicker.tsx`](../../web/src/components/ui/DateRangePicker.tsx)

**Style + i18n + showcase**
- `datepicker.css` (~120 lines) — token-only. Popover surface mirrors `dropdown.css` exactly (same `bg-surface` + `border-default` + `shadow-modal` + 767px bottom sheet). Calendar grid 7×6 locked at `min-height: calc(6 × var(--height-control-sm))` to prevent popover jump.
- `en/common.json` + `bn/common.json` — 12 keys per locale (`previousMonth`, `nextMonth`, `previousYear`, `nextYear`, `selectDate`, `selectRange`, `startDate`, `endDate`, `clear`, `today`, `weekdays`, `months`).
  [`datepicker.css`](../../web/src/styles/datepicker.css) · [`en/common.json`](../../web/src/i18n/locales/en/common.json) · [`bn/common.json`](../../web/src/i18n/locales/bn/common.json)

**Tests + CHANGELOG**
- 10 Vitest cases pin the contract: render, open, select_single, select_range, locale_bn, keyboard_arrow, paginate_next, min_max_disabled, empty, close_outside.
  [`fe-b5c-datepicker.test.tsx`](../../web/src/__checks__/fe-b5c-datepicker.test.tsx)
- CHANGELOG `### Added` + `### Tests` under `[Unreleased]`; suite grows 81 → 91; explicitly notes **zero new deps**.

**Verification:** `pnpm test` → 91 passed. `pnpm typecheck` clean. `pnpm lint` → 0 errors. `pnpm build` → bundle delta ≤+4 kB gzipped (verified: 11.98 kB CSS → ~13.5 kB, JS unchanged; no `date-fns`).
