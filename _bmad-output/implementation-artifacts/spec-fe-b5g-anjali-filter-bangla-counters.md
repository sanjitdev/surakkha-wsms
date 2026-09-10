---
title: 'FE-B5g — Settings.Anjali IncidentDate filter + Intl.NumberFormat Bangla counters'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '4394310'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5c-datepicker.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5d-locale-format-helper.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem 1 (Anjali filter):** The `Anjali` persona (`web/src/mocks/session.ts:55-57`)
submits citizen reports at `/submit`. The Settings page
(`web/src/pages/Settings.tsx`) currently shows 4 sections: Theme,
Locale, Persona, Reset — but no way for an Anjali operator to scope
the system to "show me only reports filed in the last 7 days" or
"the last 30 days". Operators triaging the citizen-reporter queue
today see all submissions at once.

A per-Anjali `IncidentDate` filter on Settings persists to
`localStorage` and is consumed by any future `/submit` history
list, plus the dashboard rail. Today the rail shows today's
incidents only — a scoped view is the next ask.

**Problem 2 (Bangla counters):** Every numeric counter in the app
(`openIncidents.length`, `pendingSigs`, `noticesToday`, KPI
values) is rendered as bare JavaScript numbers. When a Bangla
operator toggles `/settings` to `bn`, the numbers still display
in Arabic numerals (`0-9`). Bengali speakers expect
Bengali numerals (`০-৯`).

**Approach:**
1. Add a new Settings card "Citizen reports" (visible when role
   is `anjali`, hidden otherwise). Renders a `DatePicker` for
   `IncidentDate` — a single "from this date forward" filter.
   Persists to `localStorage` via a new `useAnjaliFilter` hook.
2. Add a `formatNumber(locale, value, options?)` pure helper +
   `useNumberFormatter()` hook. Native `Intl.NumberFormat`,
   zero-dep. Migrate the obvious counters in OperatorDashboard.

## Boundaries & Constraints

**Always:**
- Use the shipped `DatePicker` (B5c). No new date input.
- Use the shipped `useLocale` (B5d). `formatNumber` subscribes to
  active locale.
- Settings card is **role-gated**: only renders when
  `session.role === 'anjali'`. For other roles, the card is
  hidden (not just disabled) so the Settings page stays clean
  for utility operators / councillors.
- Filter persists to `localStorage` under
  `surakkha.anjali.incidentDateFrom` key (ISO date string or empty).
- `useAnjaliFilter` hook returns `{ from: Date | null, setFrom: (d: Date | null) => void }`.
- `formatNumber(locale, value, options?)` returns the localized
  string. Null/undefined → `'—'`.
- `useNumberFormatter()` returns `{ format: (value, options?) => string, locale }`.
- Migrate only the obvious counters in OperatorDashboard (KPI values,
  page-header sub-text). Don't migrate every numeric in the codebase
  — that would balloon the spec and pull in style-guide churn.
- 100% backward compat: existing 158-case suite stays green.

**Ask First:** None — additive feature, low-blast-radius.

**Never:**
- No third-party deps.
- No barrel files (AD-FE-9).
- No public API changes to existing hooks.
- No new CSS files. Settings row + counters use existing tokens.
- No new mock routes — the filter is client-side state only.
- No URL state (out of scope).
- No Bengali-digit fallback for non-locale uses (English stays
  Arabic numerals — matches user expectation).

## I/O & Edge-Case Matrix

### Anjali IncidentDate filter

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_role_is_anjali_shows_card | `session.role='anjali'` | Settings shows "Citizen reports" card with DatePicker |
| HAPPY_PATH_role_not_anjali_hides_card | `session.role='priya'` | Settings hides the card |
| HAPPY_PATH_set_from_persists | pick From=2024-01-01 | `localStorage['surakkha.anjali.incidentDateFrom']` = '2024-01-01T00:00:00.000Z' |
| HAPPY_PATH_set_from_clearable | pick date then clear | localStorage value removed (or set to `''`) |
| HAPPY_PATH_load_existing | mount with localStorage value | hook returns `{ from: <stored Date> }` |
| ERROR_CASE_invalid_storage | localStorage value is `'not-a-date'` | hook returns `{ from: null }` (defensive) |
| REGRESSION_other_settings_unchanged | pick From | Theme / Locale / Persona / Reset still work |

### Bangla counters

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_en_locale_renders_arabic | `formatNumber('en', 42)` | `'42'` |
| HAPPY_PATH_bn_locale_renders_bengali_digits | `formatNumber('bn', 42)` | contains Bengali numerals `৪২` |
| HAPPY_PATH_bn_with_thousands | `formatNumber('bn', 1234567)` | contains Bengali thousands separators |
| HAPPY_PATH_null_returns_dash | `formatNumber('en', null)` | `'—'` |
| HAPPY_PATH_undefined_returns_dash | `formatNumber('en', undefined)` | `'—'` |
| HAPPY_PATH_decimal_bn | `formatNumber('bn', 3.14, { maximumFractionDigits: 2 })` | contains `৩.১৪` or similar |
| REGRESSION_en_decimal_unchanged | `formatNumber('en', 3.14, { maximumFractionDigits: 2 })` | `'3.14'` |
| REGRESSION_dashboard_counters_use_helper | OperatorDashboard renders; switch to bn | Counters show Bengali numerals |

## Code Map

### New (4 files, ~110 LoC total)

- `web/src/hooks/useNumberFormatter.tsx` (NEW, ~50 LoC):
  - Pure `formatNumber(locale, value, options?)`.
  - `useNumberFormatter()` hook (mirrors B5d shape).
  - Null/undefined → `'—'`. Valid number → `new Intl.NumberFormat(locale, options).format(value)`.
  - Options type: `Pick<Intl.NumberFormatOptions, 'style' | 'currency' | 'minimumFractionDigits' | 'maximumFractionDigits' | 'useGrouping'>` (keep narrow).

- `web/src/hooks/useAnjaliFilter.ts` (NEW, ~40 LoC):
  - `useAnjaliFilter(): { from: Date | null; setFrom: (d: Date | null) => void; clear: () => void }`.
  - localStorage key: `surakkha.anjali.incidentDateFrom`.
  - Defensive parse: invalid → `null`.
  - SSR-safe via `typeof window === 'undefined'` guard.

- `web/src/__checks__/fe-b5g-anjali-filter.test.tsx` (NEW, ~80 LoC, 4-5 cases):
  - `settings_card_hidden_for_non_anjali_role`.
  - `settings_card_visible_for_anjali_role`.
  - `setting_from_persists_to_local_storage`.
  - `mount_with_existing_localStorage_returns_stored_date`.
  - `invalid_localStorage_value_returns_null`.

- `web/src/__checks__/fe-b5g-bangla-counters.test.tsx` (NEW, ~80 LoC, 5-6 cases):
  - `formatNumber_en_returns_arabic`.
  - `formatNumber_bn_returns_bengali_digits`.
  - `formatNumber_bn_with_thousands_uses_locale_separator`.
  - `formatNumber_null_returns_dash`.
  - `formatNumber_decimal_bn_rounds_correctly`.
  - `useNumberFormatter_subscribes_to_locale_change`.

### Modified (2 files, ~+30 LoC net)

- `web/src/pages/Settings.tsx` (MODIFY, ~+30 LoC):
  - Import `useAnjaliFilter`, `DatePicker`.
  - Add a new `<Card testId="settings-anjali-card">` after the
    Locale card (before Persona). The card body renders the
    DatePicker for `from` + a "Clear" button.
  - Wrap the entire card in `{session.role === 'anjali' ? (...) : null}`.
  - The card's row structure matches the existing Theme/Locale
    rows (label + control). Copy: "Citizen reports from
    [DatePicker]. Affects the reports you see on the dashboard."

- `web/src/pages/OperatorDashboard.tsx` (MODIFY, ~+15 LoC net):
  - Import `useNumberFormatter`.
  - Replace the bare `{openIncidents.length}` / `{pendingSigs}` /
    `{noticesToday}` / `{sensors.length}` in KPI cells + page-
    header sub-text with `{format(openIncidents.length)}` etc.
  - Keep the unit text (`'open'`, `'awaiting'`, `'today'`,
    `'wards'`) unchanged — only the number changes.

### Files unchanged (out of scope)
- `web/src/components/ui/DatePicker.tsx` — reused as-is.
- `web/src/hooks/useLocale.tsx` — reused as-is.
- `web/src/mocks/session.ts` — `anjali` role already exists.

### Reuse (no edits)
- `useLocale()` hook (B5d) — `useNumberFormatter` and
  `useAnjaliFilter` (transitively, for the Settings card
  re-render on locale change) both use it.
- DatePicker primitive (B5c) — zero modifications.
- localStorage helper pattern from `useTheme` /
  `useLocale` (B5d) — same `try/catch` around `localStorage.getItem`.

### CHANGELOG
- Append `### Added` bullet: "`useNumberFormatter()` hook + pure
  `formatNumber(locale, value, options?)` helper. Native
  `Intl.NumberFormat` (zero new deps). Migrates 8 numeric counters
  in OperatorDashboard to render Bengali numerals under `bn`
  locale (B5g-2)."
- Append `### Added` bullet: "`useAnjaliFilter()` hook + new
  Settings card `'Citizen reports'` (role-gated to `anjali`)
  with an `IncidentDate From` DatePicker. Persists to
  `localStorage['surakkha.anjali.incidentDateFrom']` (B5g-1)."
- Append `### Tests` bullet: "Suite 158 → 167-169; +9-11 cases. Zero
  new deps."

## Tasks & Acceptance

**Execution:**
- [ ] `useNumberFormatter.tsx` — new file, ~50 LoC.
- [ ] `useAnjaliFilter.ts` — new file, ~40 LoC.
- [ ] `Settings.tsx` — add the Anjali card (role-gated).
- [ ] `OperatorDashboard.tsx` — migrate 8 obvious counters.
- [ ] `fe-b5g-anjali-filter.test.tsx` — new file, ~80 LoC, 4-5 cases.
- [ ] `fe-b5g-bangla-counters.test.tsx` — new file, ~80 LoC, 5-6 cases.
- [ ] `CHANGELOG.md` — `### Added` × 2 + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 167-169
  cases pass (158 + 9-11), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.5 kB gzipped.
- Given Settings rendered as `priya`, when checked, the Anjali card
  is not in the DOM.
- Given Settings rendered as `anjali`, when the user picks From=2024-01-01,
  then `localStorage['surakkha.anjali.incidentDateFrom']` is set.
- Given `formatNumber('bn', 42)`, when called, result contains
  Bengali numerals `৪২`.
- Given `formatNumber('en', null)`, when called, result is `'—'`.
- Given OperatorDashboard rendered in `bn` locale, when inspected,
  the KPI cells show Bengali numerals.

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 167-169 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Login as Anjali. Open `/settings`. Observe the new "Citizen
  reports" card. Pick a date. Reload. Date persists.
- Login as Priya. Open `/settings`. Card is hidden.
- Switch locale to `bn`. Reload `/dashboard`. Observe KPI values
  show Bengali numerals (`০`, `১`, `২`, ...).
- Switch back to `en`. Observe Arabic numerals restored.

## Design Notes

**Why role-gated, not always-visible.** A Priya operator doesn't
need a "Citizen reports from X" filter — they see all incidents.
Anjali is the persona who submits citizen reports, so the filter
is meaningful only for them. Showing the card for all roles
would clutter Settings for everyone else.

**Why a single "From" date, not a "From / To" range.** An Anjali
operator typically wants "show me everything I've submitted since
last Tuesday" — unbounded past is the natural UX. A "To" bound
would rarely be used (Anjali submits in real time, not into the
future). A future iteration can add a "To" if asked.

**Why `Intl.NumberFormat` and not a hand-rolled Bengali-digit
substitution.** `Intl.NumberFormat('bn')` returns the
Bengali-script version of the number, including proper thousands
separators and decimal handling. The browser already has the
correct CLDR data; hand-rolling would re-implement that incorrectly
for edge cases (negative numbers, scientific notation, etc.).

**Why migrate 8 counters, not every number.** A wholesale migration
would touch every page (KPI cells, table cell values, badge counts,
timestamps, durations). That would balloon scope + risk regression
in unrelated surfaces. The 8 KPI counters are the highest-visibility
ones — Bangla speakers see them on every page load. Other numbers
can be migrated in follow-ups.

**Why a separate test file per concern (Anjali filter, Bangla
counters).** Two unrelated features; bundling them into one test
file would make failure triage slower. Each file is small and
focused.

## Out of scope (deferred to later specs)

- **Wire `useAnjaliFilter` into a real consumer.** The hook +
  Settings card lands; the actual `/submit` history list or
  dashboard rail that consumes the filter is a follow-up
  (the Anjali persona's `/submit` page itself is unbuilt per
  the navigation config note at `nav-config.tsx:18`).
- **Migrate every numeric in the codebase.** Only the 8 KPI
  counters in OperatorDashboard land here. Follow-up specs can
  migrate InboxList counters, AuditLog counts, etc.
- **Bangla-digit `aria-label`.** Screen readers may read Bengali
  numerals differently from Arabic numerals; ARIA-friendly
  alternatives (`aria-label="42"`) are a separate a11y concern.
- **Number input field on the Anjali card.** A number picker
  for "show last N reports" might be a quicker UX. Out of scope;
  DatePicker is more powerful.
- **Server-side Anjali filter.** The data is local mocks today;
  no server.
- **Preset ranges for the Anjali filter.** "Last 7 days" /
  "Last 30 days" chips would be a UX win. Out of scope.

## Suggested Review Order

**Number formatter (the small piece)**
- `useNumberFormatter.tsx` — pure `formatNumber` + hook.
  [`useNumberFormatter.tsx`](../../web/src/hooks/useNumberFormatter.tsx)

**Anjali filter (the role-gated piece)**
- `useAnjaliFilter.ts` — localStorage-backed hook.
- `Settings.tsx` — new card.
  [`useAnjaliFilter.ts`](../../web/src/hooks/useAnjaliFilter.ts) · [`Settings.tsx`](../../web/src/pages/Settings.tsx)

**OperatorDashboard migration (the visible win)**
- 8 KPI counters → `formatNumber` calls.
  [`OperatorDashboard.tsx`](../../web/src/pages/OperatorDashboard.tsx)

**Tests + CHANGELOG**
- 4-5 Anjali-filter Vitest cases + 5-6 Bangla-counter cases.
  [`fe-b5g-anjali-filter.test.tsx`](../../web/src/__checks__/fe-b5g-anjali-filter.test.tsx) ·
  [`fe-b5g-bangla-counters.test.tsx`](../../web/src/__checks__/fe-b5g-bangla-counters.test.tsx)
- CHANGELOG `### Added` (formatter + Anjali card) + `### Tests`
  (suite 158 → 167-169). No new deps.

**Verification:** `pnpm test` → 167-169 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.5 kB gzipped.