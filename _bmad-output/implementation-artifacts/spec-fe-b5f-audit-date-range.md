---
title: 'FE-B5f — AuditLog opened-between date-range filter'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '96f6eb1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5c-datepicker.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** AuditLog.tsx ships 7 filter chips (`all`, `errors`,
`signatures`, `sensor`, `citizen`, `notices`, `auth`) and a sortable
Table. But there's no way to scope events to a **time range** — a
core ask from compliance officers who need to "show me everything
that happened in the 6 hours after the Friday incident." Today the
only escape is to scroll the table or `Cmd-F` for a date string.

The shipped DatePicker primitive (FE-B5c, in `web/src/components/ui/DatePicker.tsx`)
already implements the WAI-ARIA combobox + calendar pattern with
locale-aware formatting. There's no reason to ship a custom date
input — reuse the primitive.

**Approach:** Add a `From` and `To` date filter row above the events
table, using the shipped `DatePicker` primitive. The filter combines
with the existing chip filter (AND semantics: chip matches AND date
in range). Range is inclusive on both ends. Empty inputs mean "no
constraint on that side."

## Boundaries & Constraints

**Always:**
- Use the shipped `DatePicker` primitive (FE-B5c). No new date input.
- Inclusive range (from <= occurred_at <= to) — both ends inclusive.
- Empty input on either side = unbounded on that side.
- Filter is AND with the existing chip filter (chip + date range).
- Dates are compared at **day granularity** in the user's active
  timezone (use `Intl.DateTimeFormat` to get the local YYYY-MM-DD,
  then parse back via `new Date(...)`). This avoids the
  "midnight UTC != midnight BDT" off-by-one that bites naive
  `Date.parse(iso)` filters.
- Both pickers carry `aria-label` for screen readers.
- A "Clear range" button resets both pickers.
- The "events" summary count updates to reflect the filtered count,
  not the total. (e.g. "47 of 200 events" when a range is active.)
- 100% backward compat: existing 143-case suite stays green.

**Ask First:** None — additive feature, low-blast-radius.

**Never:**
- No third-party deps.
- No barrel files (AD-FE-9).
- No new CSS files. DatePicker ships its own styles; the row layout
  uses existing tokens via `style={{ display: 'flex', gap: 'var(--space-sm)' }}`
  or a new class in `audit.css`.
- No backend changes (filter is client-side).
- No new chip types.
- No URL state (out of scope; `?from=...&to=...` is a follow-up).
- No time-of-day picker (date-only is sufficient for audit log
  granularity; events within a day sort via Table's `occurred_at`
  column).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_no_range | empty From + empty To | All events visible (chip filter applies) |
| HAPPY_PATH_from_only | From=2024-01-01, To=empty | Events on/after Jan 1 visible |
| HAPPY_PATH_to_only | From=empty, To=2024-01-31 | Events on/before Jan 31 visible |
| HAPPY_PATH_both_bounds | From=2024-01-01, To=2024-01-31 | Events in Jan 1-31 inclusive |
| HAPPY_PATH_inclusive_ends | From=2024-01-01, To=2024-01-01 | Events on Jan 1 only (single-day range) |
| HAPPY_PATH_combined_with_chip | chip='errors', From=Jan 1, To=Jan 31 | Errors in Jan only (AND) |
| HAPPY_PATH_clear_button | range set; click "Clear range" | Both pickers reset to empty |
| HAPPY_PATH_summary_updates | range narrows result to 47 of 200 events | "47 of 200 events" shown |
| ERROR_CASE_from_after_to | From=2024-01-31, To=2024-01-01 | Empty result + "no events in range" hint |
| ERROR_CASE_invalid_date | DatePicker rejects (B5c already validates) | Filter not applied |
| ERROR_CASE_zero_events_in_range | Valid range, no matching events | Table shows EmptyState |
| REGRESSION_existing_chip_filter | chip='all', no range | All events visible (regression) |
| REGRESSION_sortable_columns_preserved | Range set; click "Event" sort | Sort still works inside filtered range |

## Code Map

### Modified (2 files, ~50 LoC net)

- `web/src/pages/AuditLog.tsx` (MODIFY, ~+50 LoC):
  - Add state: `const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });`.
  - Add a `useMemo` for `dateFiltered` that filters `events` by
    `range.from` / `range.to` (inclusive, day-granularity).
  - Update the existing `visible` `useMemo` to chain:
    `events.filter(chip.match).filter(dateInRange)`. Rename to
    `chipFiltered` for clarity, then `visible = dateFiltered(chipFiltered)`.
  - Add a "Date range" row above the Table (after the FilterChips,
    inside the same Card or in a new Card). Renders:
    ```jsx
    <div className="audit-range" data-testid="audit-range">
      <label>
        From
        <DatePicker
          value={range.from}
          onChange={(d) => setRange((r) => ({ ...r, from: d }))}
          testId="audit-range-from"
          aria-label="Filter from date"
        />
      </label>
      <label>
        To
        <DatePicker
          value={range.to}
          onChange={(d) => setRange((r) => ({ ...r, to: d }))}
          testId="audit-range-to"
          aria-label="Filter to date"
        />
      </label>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setRange({ from: null, to: null })}
        disabled={range.from === null && range.to === null}
        testId="audit-range-clear"
      >
        Clear range
      </Button>
    </div>
    ```
  - Update the summary to show `{visible.length} of {events.length} events · chain head block #{chainHead?.height ?? '—'}` when range is active, else
    `{events.length} events · chain head block #{chainHead?.height ?? '—'}`.
  - Adjust the EmptyState copy when the date range is the cause of the
    empty result: "No events in the selected range."

- `web/src/styles/audit.css` (MODIFY, ~+15 LoC):
  - Add `.audit-range { display: flex; gap: var(--space-md); align-items: flex-end; padding: var(--space-md); border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; }`.
  - Add `.audit-range label { display: flex; flex-direction: column; gap: var(--space-xs); font-size: var(--font-size-xs); color: var(--fg-secondary); }`.
  - Add `.audit-range button { margin-left: auto; }`.

### Tests (vitest)

- `web/src/__checks__/fe-b5f-audit-date-range.test.tsx` (NEW, ~120 LoC,
  7-9 cases) — covers the I/O matrix:
  - `no_range_shows_all_events` — empty From + To; assert all events visible.
  - `from_only_filters_after` — From=Jan 1; assert only events on/after Jan 1.
  - `to_only_filters_before` — To=Jan 31; assert only events on/before Jan 31.
  - `both_bounds_filter_inclusive` — From=Jan 1, To=Jan 31; assert events in range.
  - `single_day_range_inclusive` — From=To=Jan 1; assert only Jan 1 events.
  - `combined_with_chip_filter` — chip='errors' + range Jan; assert errors in Jan.
  - `clear_range_button_resets_pickers` — set range, click clear, assert empty.
  - `summary_shows_filtered_count` — range narrows to 47 of 200; assert "47 of 200" text.
  - `from_after_to_yields_empty` — From=Jan 31, To=Jan 1; assert empty result.

Test structure: render `<AuditLog>` inside `<AppLayoutProvider>` +
`<LocaleProvider>`. Mock `fetch('/api/events?limit=200')` to return
fixture events spanning multiple days. Use `userEvent.type` or direct
DatePicker prop changes to set the range.

Note: DatePicker's open + click flow is async (`queueMicrotask` for
focus restore). Use `await act(async () => { ... })` to flush.

### Read-only references
- `web/src/components/ui/DatePicker.tsx` — already shipped. Use as-is.
- `web/src/components/ui/DateRangePicker.tsx` — alternative primitive
  but for the AuditLog UX, two single DatePickers are clearer than the
  range picker (which is built for hotel-style "check in / check out").
- `web/src/hooks/useDateFormatter.tsx` — already provides locale-aware
  formatting. Not directly needed for filtering but available.

### Reuse (no edits)
- DatePicker primitive (B5c) — zero modifications.
- AppLayout context — already imported.
- EmptyState (existing) — copy adjusted but no API change.
- FilterChip — already supports the chip filter; no API change.

### CHANGELOG
- Append `### Added` bullet: "AuditLog: date-range filter (From / To)
  using the shipped DatePicker primitive. Inclusive day-granularity
  bounds, AND-combines with the existing chip filter. `Clear range`
  button resets. Summary count updates to `'N of M events'` when
  range is active."
- Append `### Tests` bullet: "Suite 143 → 150-152; +7-9 cases. Zero
  new deps."

## Tasks & Acceptance

**Execution:**
- [ ] `AuditLog.tsx` — add `range` state + `dateFiltered` memo + range
      row UI + updated summary.
- [ ] `audit.css` — add `.audit-range` rules.
- [ ] `fe-b5f-audit-date-range.test.tsx` — new file, ~120 LoC, 7-9
      cases.
- [ ] `CHANGELOG.md` — `### Added` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 150-152
  cases pass (143 + 7-9), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.3 kB gzipped (small UI addition).
- Given AuditLog with events spanning Jan 1-31, when the user sets
  From=Jan 1, To=Jan 31, then only events in Jan are visible.
- Given AuditLog with chip='errors' + From=Jan 1, To=Jan 15, then
  only error events in Jan 1-15 are visible.
- Given AuditLog with a range that excludes all events, when
  rendered, then the EmptyState shows "No events in the selected
  range."
- Given AuditLog with a range set, when the user clicks "Clear
  range", then both DatePickers reset to empty and all events
  (subject to chip filter) are visible.

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 150-152 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Open `/audit-log`. Observe the existing chip filters still work.
  Above the events table (or in the same row as chips), observe the
  "From / To / Clear range" controls.
- Set From=2 days ago, To=1 day ago. Observe only events in that
  range. Summary shows "N of M events".
- Set From > To. Observe empty result + helpful empty state.
- Combine with chip='errors'. Observe AND semantics.
- Toggle to Bangla locale. Observe the DatePicker labels localize
  (B5c already wired this).

## Design Notes

**Why two DatePickers instead of DateRangePicker.** The shipped
`DateRangePicker` is built for "check in / check out" UX — both
dates are required, and the calendar highlights the range in one
view. For audit log filtering, the two pickers are independent
(unbounded on either side), and a single picker with a "From" /
"To" toggle adds complexity. Two simple DatePickers are clearer.

**Why day-granularity, not timestamp-granularity.** Audit log events
are timestamped to the second, but compliance officers think in
calendar days ("what happened on Friday"). A date-only filter at
day granularity matches the mental model. The Table's `occurred_at`
column still sorts to the second.

**Why the "From > To yields empty" case is shown, not auto-corrected.**
Auto-correcting (swapping From and To) would surprise users — the
input might be wrong in a way they haven't noticed yet. Showing
empty + a helpful empty-state lets the user notice and fix.

**Why "of M events" in the summary.** Total event count remains
visible — the user always knows how many events exist on the chain.
The filtered count makes it obvious how much the range narrowed.

**Why the summary uses `events.length` not `visible.length` for the
total.** The total is the absolute count of fetched events. The
filtered count is the post-chip + post-range count. The "N of M"
phrasing makes both visible at a glance.

## Out of scope (deferred to later specs)

- **URL state sync** — `?from=...&to=...` would let users bookmark
  a range. Out of scope; a small follow-up.
- **Time-of-day picker** — date-only is the audit log's natural
  granularity. Adding time-of-day requires DatePicker UX rework
  (24-hour pickers etc.).
- **Preset ranges** ("Last hour", "Last 24h", "Last 7d") — common UX
  nicety. Out of scope; can land as quick chips near the pickers.
- **Relative time presets** ("Last 7 days from now") — same as above.
- **Persisting range to localStorage** — would survive reloads. Out
  of scope; URL state is the cleaner approach when added.
- **Server-side range filter** — `/api/events?from=...&to=...`. The
  data set in Phase 1 is small (200 events max). Out of scope.

## Suggested Review Order

**State + filter (the brain)**
- `AuditLog.tsx` — `range` state + `dateFiltered` memo + chain into
  the existing `visible` filter. Update summary text. Add the From /
  To / Clear UI row.
  [`AuditLog.tsx`](../../web/src/pages/AuditLog.tsx)

**CSS (the visual row)**
- `audit.css` — `.audit-range` row layout using only tokens.
  [`audit.css`](../../web/src/styles/audit.css)

**Tests + CHANGELOG**
- 7-9 Vitest cases pin the contract per the I/O matrix.
  [`fe-b5f-audit-date-range.test.tsx`](../../web/src/__checks__/fe-b5f-audit-date-range.test.tsx)
- CHANGELOG `### Added` (date range filter) + `### Tests` (suite
  143 → 150-152). No new deps.

**Verification:** `pnpm test` → 150-152 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.3 kB gzipped.