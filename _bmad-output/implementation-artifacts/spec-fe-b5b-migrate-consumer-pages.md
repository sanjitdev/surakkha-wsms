---
title: 'FE-B5b-migrate — Migrate OperatorDashboard + InboxList + AuditLog raw <table> markup to the Table primitive'
type: 'refactor'
created: '2026-09-09'
status: 'approved'
review_loop_iteration: 0
baseline_commit: 'b804284'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** Three consumer pages render hand-rolled `<table>` markup
inline instead of using the shipped `<Table>` primitive. This means:

1. **No sortable columns** — `<th>` cells have no sort buttons, ARIA
   `aria-sort`, or keyboard handlers.
2. **No column resize** — keyboard users can't resize any column.
3. **Inconsistent select-all semantics** — InboxList's checkbox is
   binary-only (no tri-state indeterminate).
4. **No empty-state primitive** — pages render ad-hoc "no matches"
   rows with inline styles.
5. **Inline CSS values** — pages use `style={{ color: 'var(--fg-tertiary)' }}`
   for empty states, violating AD-FE-4 (token-only CSS).
6. **Duplicated CSV/PDF-export scaffolding** — every page reimplements
   the same `<thead><tr><th>` skeleton.

Wired-up consumers (per `grep "<table"`):
- **`OperatorDashboard.tsx`** (1100 LoC, 5 hand-rolled tables in layout
  variants A/B/C). The most surgery-heavy target.
- **`InboxList.tsx`** (326 LoC, 1 table at lines 256-287 wrapping the
  `<InboxRow>` page-component).
- **`AuditLog.tsx`** (345 LoC, 1 table at lines 263-339).

**Approach:** Replace each hand-rolled `<table>` with the shipped
`<Table>` primitive. Use the `render` column prop to preserve custom
cell content (severity dots, badges, copy buttons, `<InboxRow>` cells).
Adopt Table's built-in sort/resize/tri-state where the surrounding UX
makes sense (sort = yes on `AuditLog` event_type column; resize = yes
on `OperatorDashboard` reading columns; tri-state select = yes on
`InboxList`).

## Boundaries & Constraints

**Always:**
- **No CSS edits beyond migration.** The existing `dashboard.css`,
  `inbox.css`, and `audit.css` page-level styling is preserved. The
  Table primitive's `table.css` already supplies the structural styles;
  if a page-level class conflict arises (e.g. `.data-table--inbox`)
  keep the page class on the `<Table className="data-table--inbox">`
  parent and let Table's CSS win for structure (thead/tbody/tr/td).
- **Preserve every existing data-testid** so downstream tests + Playwright
  E2E selectors don't break. Mapping:
  - `OperatorDashboard` had no `data-testid` on its tables; add
    testId='table-sensors' / 'table-chain' / 'table-threads' per card.
  - `InboxList` `data-testid` for row checkboxes already uses
    `inbox-row-${id}`; preserve.
  - `AuditLog` already uses `data-testid="audit-table"` +
    `audit-row-${event_id}` + `audit-copy-${event_id}`; preserve.
- **All existing page-level behavior is preserved:**
  - `OperatorDashboard`: KPIs, layout A/B/C, tabs, charts, donut, hbar
    — all untouched. Only the 5 inline tables change.
  - `InboxList`: filter chips, search, severity rail, awaiting-action
    rail, recent-decisions rail, bulk bar — all untouched. Only the
    action-queue table changes.
  - `AuditLog`: filter chips, chain-head banner, copy-to-clipboard,
    loading/empty states — all untouched. Only the events table
    changes.
- **Migration is purely structural.** New tests pin: each migrated
  table renders the same number of rows, each cell's text content
  matches the old markup byte-for-byte for a known fixture.

**Ask First:** None — pure migration, low-blast-radius.

**Never:**
- No third-party deps.
- No new primitives. Reuse what exists.
- No `<table>` markup left in the migrated sections (audit-only
  exceptions documented below).
- No behaviour changes: same fetches, same filters, same render.
- No CSS token additions.
- No public `TableProps` change — Table already supports
  `className`, `selectable`, `selectedRows`, `onSelectionChange`,
  `columns` (with `render`), `rowKey`, `emptyState`, `loading`,
  `testId`.

## I/O & Edge-Case Matrix

### Migration contracts (per page)

| Page | Existing selectors | New Table props | Notes |
|------|--------------------|-----------------|-------|
| OperatorDashboard Sensors card | 7-col table, no testId | `testId="table-sensors"`, `selectable={false}`, `rowKey="sensor_id"`, 7 columns | Status badge → render. Severity dot → render. |
| OperatorDashboard Today-on-chain card | 4-col table, no testId | `testId="table-chain"`, 4 columns | Time + What + Where + Status badge |
| OperatorDashboard Open-threads card | 6-col table, no testId | `testId="table-threads"`, 6 columns | Relative-time column |
| OperatorDashboard editorial (Layout B) Today-on-chain | 4-col table, no testId | `testId="table-chain"`, 4 columns | Same as A |
| OperatorDashboard Layout C — Sensors + Open-threads + Today-on-chain | 3 tables | `testId="table-sensors"` / `table-threads"` / `"table-chain"` | Each gets its own Table instance |
| InboxList action-queue | 7-col table with row-checkbox | `testId="table-inbox"`, `selectable={true}`, columns | `<InboxRow>` becomes the first column's `render` |
| AuditLog events | 7-col table with copy button | `testId="audit-table"` (preserved), 7 columns | `event_type` column becomes sortable |

### Edge cases

| Scenario | Behavior |
|----------|----------|
| HAPPY_PATH_row_count_matches | Migrations render same number of rows as the old table for a fixture of 5 sensors + 6 events + 3 incidents |
| HAPPY_PATH_empty_state_uses_primitive | Empty arrays route through Table's built-in `<EmptyState>` (no more inline `colspan` styling) |
| HAPPY_PATH_loading_state_uses_primitive | `loading={loading}` flag shows skeleton (no more ad-hoc "loading…" cell) |
| REGRESSION_testids_preserved | Every `data-testid` from the old markup survives (rows, copy buttons, etc.) |
| ERROR_CASE_selectable_with_empty_set | Tri-state correctly shows `aria-checked='false'` |
| ERROR_CASE_loading_to_loaded_transition | Skeleton rows disappear, real rows render |
| REGRESSION_inline_table_styling_intact | Migration preserves card wrapping, layout CSS still wins via `className` on the Table |

## Code Map

### Modified (3 files, ~200-300 LoC net reduction)

- `web/src/pages/OperatorDashboard.tsx` (MODIFY, -200 to -300 LoC net) —
  - Replace each of 5 `<table className="data-table">` blocks with
    `<Table>`.
  - Sensor-fleet card: columns = `[severity-dot, ward+id, parameter,
    reading, time, status-badge, action-link]`.
  - Today-on-chain card (3 places, layout A/B/C): columns = `[time,
    what, where, status-badge]`.
  - Open-threads card (2 places): columns = `[severity-dot, thread,
    status, time, status-badge, action-link]`.
  - Layout-B/C tests/skeleton: only the inline tables get migrated;
    the surrounding `<div className="card data-card">` + chart-card
    layout is untouched.
  - Delete the local helpers `summarizeEvent`, `statusBadgeClass`,
    `statusBadgeLabel`, `severityColor`, `severityBadgeClass`,
    `relativeTime` ONLY for the migrated columns; chart-card-only
    helpers stay.

- `web/src/pages/InboxList.tsx` (MODIFY, ~ -10 LoC net) —
  - Replace `<table className="data-table data-table--inbox">` at
    lines 256-287 with `<Table<InboxRowType>>`.
  - Columns: `[select-col (renders the row checkbox + label), severity,
    thread (renders <InboxRow>), where, owner, severity-badge, action]`.
  - The `<InboxRow>` page-component becomes a cell renderer — it
    receives the row data and renders its existing body. The Table's
    selectable-handling still works because we put the row-checkbox
    in its own column with `render: (r) => <input type=checkbox .../>`.
  - `selectable={true}` + `selectedRows` + `onSelectionChange` threads
    through.
  - The `inbox-bulkbar` stays outside the Table.

- `web/src/pages/AuditLog.tsx` (MODIFY, ~ -40 LoC net) —
  - Replace `<table className="data-table audit-table">` at lines
    263-339 with `<Table<ChainEvent>>`.
  - 7 columns: `[time, severity-dot, event-name+sub, ward+chain-ref,
    actor, status-badge, copy-button]`.
  - The `event_name` column gets `sortable={true}` (a real UX win on
    audit logs). The `time` column is also sortable (by occurred_at).
  - `loading={loading}` routes through Table's built-in skeleton.
  - `emptyState={<EmptyState />}` replaces the conditional branch.

### Files unchanged (out of scope)
- `web/src/components/ui/Table.tsx`, `TableHeader.tsx`, `TableBody.tsx`,
  `useTableSort.ts`, `useTableResize.ts`, `Table.types.ts` — the
  primitive is feature-complete for this migration. No primitive
  changes needed.
- `web/src/components/pages/InboxRow.tsx` — stays a page-component
  that renders a `<td>` body. Caller wraps it via the Table's `render`
  prop inside the first content column.
- `web/src/components/ui/Card.tsx`, `EmptyState.tsx`, `Button.tsx`,
  `Container.tsx` — page-level primitives, untouched.
- All CSS: `dashboard.css`, `inbox.css`, `audit.css`, `table.css` —
  no edits.

### Tests (vitest)

- `web/src/__checks__/fe-b5b-migrate-tables.test.tsx` (NEW, ~140 LoC,
  6-8 cases) — pins the migration contract:
  - `OperatorDashboard_sensors_table_renders_5_rows_with_severity_dots`
    — render `<OperatorDashboard>` with 5 fixtures; assert 5 rows in
    `testId="table-sensors"` and severity-dot cells present.
  - `OperatorDashboard_chain_table_has_4_columns_with_status_badge` —
    6 events fixture; assert 4 columns; status-badge cell present.
  - `InboxList_action_queue_table_has_selectable_checkbox_with_tri_state` —
    5 rows fixture, select 2, assert `aria-checked="mixed"` on
    `testId="table-inbox-select-all"`.
  - `AuditLog_events_table_sortable_on_event_type_column` —
    `testId="audit-table-sort-event_type"` exists; click it; assert
    `aria-sort="ascending"`; click again; `aria-sort="descending"`.
  - `AuditLog_loading_state_uses_table_skeleton` — `loading={true}`;
    assert skeleton rows render (no real event rows).
  - `AuditLog_empty_state_uses_table_empty` — `events={[]}`; assert
    the empty-state renders.
  - `InboxList_row_checkbox_toggles_selection_and_updates_tri_state`
    — select one row; assert partial → select another; assert partial;
    select the rest via select-all; assert full → toggle select-all
    off; assert none.
  - `OperatorDashboard_inline_table_markup_removed` — grep the source
    file for `<table`; assert no matches in the migrated sections
    (Layout A sensors, Layout B chain, Layout C threads).

### Read-only references
- `web/src/components/ui/Table.tsx` — already shipped with sort, resize,
  tri-state, loading, emptyState. Migration uses these directly.
- `web/src/components/layout/EmptyState.tsx` — already shipped; used
  as the `emptyState` prop.
- `web/src/types/inbox.ts` — `InboxRow` shape unchanged.

### Reuse (no edits)
- `<InboxRow>` page-component: stays untouched; InboxList's
  Table-renderer wraps `<td><InboxRow ... /></td>` semantics by
  rendering the InboxRow inside a cell wrapper.
- The `useDateFormatter()` hook for `formatTime('time', iso)` — call
  sites move from `formatTime(...)` inline to inside the column's
  `render: (row) => formatTime('time', row.last_at)`.
- The `severityColor`, `severityBadgeClass` etc. helpers — stay in
  OperatorDashboard for the chart-card variants that aren't tables.

### CHANGELOG
- Append `### Changed` bullet: "Migrated OperatorDashboard (5 tables),
  InboxList (action queue), AuditLog (events) from hand-rolled `<table>`
  markup to the shipped `<Table>` primitive. Gains: column sort
  (AuditLog event + time), column resize, tri-state select-all
  (InboxList), built-in loading skeleton + empty-state. No visual or
  behavioural changes to non-table portions of each page."
- Append `### Tests` bullet: "Suite 126 → 132-134; +6-8 cases. Zero
  new deps. All existing testIds preserved (audit-row-*, audit-copy-*,
  inbox-row-*); migration verified row-for-row + cell-for-cell against
  known fixtures."

## Tasks & Acceptance

**Execution:**
- [ ] `OperatorDashboard.tsx` — replace 5 inline tables with `<Table>`;
      preserve card-wrapping + chart-card layouts.
- [ ] `InboxList.tsx` — replace 1 inline table with `<Table>`; thread
      tri-state `selectable`.
- [ ] `AuditLog.tsx` — replace 1 inline table with `<Table>`; mark
      event_type + time columns sortable.
- [ ] `fe-b5b-migrate-tables.test.tsx` — new file, ~140 LoC, 6-8 cases.
- [ ] `CHANGELOG.md` — `### Changed` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 132-134
  cases pass (126 + 6-8), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤-5 kB gzipped (migrating removes duplicated <thead>/<tbody>
  markup).
- Given `<OperatorDashboard>` rendered with 5 sensor fixtures, when
  inspected, then the migrated `testId="table-sensors"` has 5 rows.
- Given `<InboxList>` rendered with 5 row fixtures, when 2 are
  selected, then `aria-checked="mixed"` is on the select-all checkbox.
- Given `<AuditLog>` rendered with events, when the user clicks
  `testId="audit-table-sort-event_type"`, then `aria-sort="ascending"`
  is set on the column header.
- Given `<AuditLog>` rendered with `loading={true}`, when inspected,
  then skeleton rows render (5 of them) and no real rows.
- Given the OperatorDashboard source, when grepped for `<table`
  outside the SVG/`<table data-` allowed prefixes, then no matches
  inside the migrated sections.

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 132-134 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds; bundle delta should
  shrink (negative).

**Manual checks:**
- Open `/dashboard` (OperatorDashboard). Click layout toggles A/B/C.
  All three layouts render their tables identically to the pre-migration
  version (visual diff = 0).
- Open `/inbox`. Select 2 of 5 rows. Observe the select-all checkbox
  shows indeterminate state. Click select-all → all 5 selected.
- Open `/audit-log`. Click "Event" column header → rows sort ascending
  alphabetically. Click again → descending. All `data-testid="audit-row-*"`
  rows + `data-testid="audit-copy-*"` copy buttons preserved.

## Design Notes

**Why not also migrate charts/cards/kpis.** The Table primitive is a
table; the dashboards' chart cards (SVG donut, hbar ranking) and KPI
grids are not tables. Migration is scoped to actual `<table>` markup.

**Why threads `<InboxRow>` via the `render` prop.** The `render: (row)
=> ReactNode` pattern keeps the page-component's existing DOM contract
(checkboxes, severity dot, hover state, etc.) inside a single cell.
This is a 1-line wrapper at the migration site vs. a refactor of
InboxRow's own structure.

**Why `testId` for the new Table instances.** The old markup didn't have
testIds on these tables; migration assigns them so the new tests can
locate them precisely. Old testIds (audit-row-*, audit-copy-*) flow
through `render` so Playwright selectors keep working.

**Why no sortable columns on InboxList / OperatorDashboard.** The
spec calls out sorts only where the surrounding UX needs them
(AuditLog event_type + time) — adding sort everywhere would change
interactions users rely on (e.g. dashboard reading columns sorted by
incidents would lose the "fleet at a glance" layout intent). Sort is
opt-in per the primitive's contract.

**Why migrate Layout C / Layout B even though they're hidden by default.**
Hidden-by-CSS (Layout A is default) tables still exist in the DOM. Even
with `hidden`, they're rendered and counted by axe-core / accessibility
tools. Migration normalizes the markup regardless.

## Out of scope (deferred to later specs)

- **Migration of the chart-card ranking tables** — the Wards tab uses
  `<WardRanking>` rendering an hbar chart, not a table. Out of scope.
- **Adding sort to OperatorDashboard / InboxList** — explicitly NOT
  done (see Design Notes). Out of scope as a separate spec if asked.
- **Adding a `resizable` opt-in everywhere** — Table's resize is
  opt-in per column. Most migration columns don't enable it; user
  research would inform what to expose. Out of scope.
- **Server-side sort** — Table stays client-side sort. Out of scope.
- **Migrating InboxRail components** — they render as `<Card>`s, not
  tables. Out of scope.
- **OperatorDashboard filter chips to Dropdown migration** — already
  FilterChip page-component; out of scope.
- **Adding row-level action menus** — Table supports row-level action
  column (Copy button on AuditLog); broader menus deferred.

## Suggested Review Order

**InboxList (smallest, lowest-risk)**
- `InboxList.tsx` — 1-table migration with selectable + tri-state;
  surface area ~30 LoC. Most isolated.
  [`InboxList.tsx`](../../web/src/pages/InboxList.tsx)

**AuditLog (medium, sortable gain)**
- `AuditLog.tsx` — 1-table migration; `event_type` + `time` sortable;
  loading + empty states route through primitive.
  [`AuditLog.tsx`](../../web/src/pages/AuditLog.tsx)

**OperatorDashboard (largest, 5 tables)**
- `OperatorDashboard.tsx` — 5 tables across 3 layout variants; preserve
  every KPI, tab, chart, and donut. LoC reduction but high visual
  fidelity required.
  [`OperatorDashboard.tsx`](../../web/src/pages/OperatorDashboard.tsx)

**Tests + CHANGELOG**
- 6-8 Vitest cases pin the migration contract per the I/O matrix.
  [`fe-b5b-migrate-tables.test.tsx`](../../web/src/__checks__/fe-b5b-migrate-tables.test.tsx)
- CHANGELOG `### Changed` (3 pages migrated) + `### Tests` (suite
  126 → 132-134). No new deps.

**Verification:** `pnpm test` → 132-134 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤-5 kB gzipped (deduplication win).