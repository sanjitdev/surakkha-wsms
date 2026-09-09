---
title: 'FE-B5b — Table primitive (typed columns, sort, select, paginate, resize)'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '0eee22e'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-fe-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md'
---

## Intent

**Problem:** FE-1 pages (`OperatorDashboard`, `InboxList`, `AuditLog`, `InboxRail`) ship bespoke `<table className="data-table">` markup with hand-rolled sort logic + select-all checkboxes + pagination. The repetition fragments the design system (4 columns rules, 4 resize policies, 4 selection-checkboxes) and locks the pages out of upcoming features (server-side sort, virtualized rows).

**Approach:** New `web/src/components/ui/Table.tsx` (~280 lines, split into `Table.tsx` + `TableHeader.tsx` + `TableBody.tsx` + `useTableSort.ts` + `useTableResize.ts` + `useTableSelection.ts` per AD-FE-5 ceiling) — generic `Table<T>`, `TableColumn<T>`, `TableProps<T>`. Optional sort + select + resize. `Pagination.tsx` (~120 lines) composes B5a's Dropdown for page-size select. Styleguide Section 10 with 25-row fixture showing sort + select + pagination + resize. Ship 10 Vitest cases.

## Boundaries & Constraints

**Always:**
- Generic `Table<T>` over a row record type. `TableColumn<T> = { key: keyof T | string; header: string; render?: (row: T, rowIndex: number) => ReactNode; sortable?: boolean; width?: string; align?: 'left' | 'right' | 'center'; resizable?: boolean; className?: string }`.
- Sort state: `useState<{ key: string; dir: 'asc' | 'desc' | null } | null>(null)`; click header cycles `null → asc → desc → null`. Numeric compare if `typeof cell === 'number'`, else `localeCompare`.
- Selection: optional `selectedRows: Set<string>` + `onSelectionChange(rows: Set<string>)`. Header checkbox toggles all in current page (or all rows if no pagination). Rows selectable by `key` field.
- Resize: drag the 8px right edge of a `resizable` column header; min width 48px, no max. State: `useState<Record<string, string>>({})`.
- Empty state slots compose `<EmptyState>`. Loading state: 5 skeleton rows (`<td colSpan=...><span className="table__skeleton" /></td>`).
- ARIA: `<table role="table">` with `<thead>`/`<tbody>` (canonical). Sort button has `aria-sort`. Select column is a `<th scope="col">` with a checkbox.
- Keyboard: Space/Enter toggles sort header. Space toggles row checkbox.
- Pagination sub-component: `page`, `pageSize`, `total`, `onPageChange`, `pageSizeOptions?`, `onPageSizeChange?`. Renders prev/next + page chips + page-size Dropdown.
- New `web/src/styles/table.css` (~150 lines). Token-only. Sticky header at `top: var(--space-md)`. Zebra rows via `[--zebra]`. Mobile floor at 767px → horizontal scroll.
- Styleguide Section 10: 25-row fixture (id, severity band, ward, opened-at, status). Live `onChange` readout wired to `useState`.
- New `web/src/__checks__/fe-b5b-table.test.tsx` (~250 lines, 10 cases).

**Ask First:** None.

**Never:**
- No third-party deps (no `@tanstack/react-table`). Built from scratch.
- No barrel files (AD-FE-9).
- No source edits to `OperatorDashboard.tsx`/`InboxList.tsx`/`AuditLog.tsx`/page consumers (B5d migration is the follow-up).
- No `passthrough()` in MSW overrides.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_render | Mount with 3 rows × 3 cols | `<table role="table">`; 1 `<thead>` + 1 `<tbody>` |
| HAPPY_PATH_sort_string | Click "name" header | `aria-sort="ascending"`; rows reorder A-Z |
| HAPPY_PATH_sort_number | Click "age" header | Rows reorder 0-9 numerically |
| HAPPY_PATH_select_row | Single-mode select; click row checkbox | `onSelectionChange({row-1})` |
| HAPPY_PATH_select_all | Toggle header checkbox | All rows selected; `onSelectionChange({r1,r2,r3})` |
| HAPPY_PATH_paginate | `page=2 pageSize=10 total=25` | Renders rows 11-20; prev/next buttons enabled |
| HAPPY_PATH_resize | Drag "name" header right edge | Column width updates in DOM |
| HAPPY_PATH_empty | `rows=[]` | `<EmptyState heading="No matches" />` renders |
| HAPPY_PATH_loading | `loading=true` | 5 skeleton rows render |
| ERROR_CASE_sortable_disabled | `sortable=false`; click header | No `aria-sort`; click no-op; rows unchanged |

</frozen-after-approval>

## Code Map

### New primitive (Layer A)
- `web/src/components/ui/Table.tsx` (NEW, ~100 lines) — composition root. Generic `Table<T>`. Props: `columns`, `rows`, `rowKey`, `selectable`, `selectedRows`, `onSelectionChange`, `loading`, `emptyState`, `testId`.
- `web/src/components/ui/Table.types.ts` (NEW, ~40 lines) — `TableColumn<T>`, `TableProps<T>`, `SortState`, `ResizeState`.
- `web/src/components/ui/TableHeader.tsx` (NEW, ~80 lines) — `<thead>` + `<tr>` + per-column `<th>` w/ sort button + resize handle.
- `web/src/components/ui/TableBody.tsx` (NEW, ~70 lines) — `<tbody>` + per-row `<tr>` + cell rendering via `column.render`.
- `web/src/components/ui/Pagination.tsx` (NEW, ~120 lines) — prev/next + page chips + page-size Dropdown.
- `web/src/components/ui/useTableSort.ts` (NEW, ~40 lines) — sort state + comparator.
- `web/src/components/ui/useTableSelection.ts` (NEW, ~50 lines) — selected-row set + toggle + select-all.
- `web/src/components/ui/useTableResize.ts` (NEW, ~40 lines) — per-column width state + drag handlers.
- `web/src/styles/table.css` (NEW, ~150 lines) — `.table` + `.table__header-cell` + `.table__row` + `.table__skeleton` + `.table__resize-handle` + `.table__select-checkbox`.

### Styleguide showcase
- `web/src/pages/StyleguidePage.tsx` (EXTEND, +120 lines) — Section 10 "Table". 25-row fixture × 5 columns. Live readout wired to `useState` showing current sort + selection + page.
- `web/src/styles/styleguide.css` (EXTEND, +10 lines) — `.section--table` spacing.

### Tests (vitest)
- `web/src/__checks__/fe-b5b-table.test.tsx` (NEW, ~250 lines, 10 cases) — render, sort, sort-number, select-row, select-all, paginate, resize (mocked mouse events), empty, loading, sortable-disabled. `afterEach(() => { cleanup(); vi.restoreAllMocks(); })` per FE-1.3c review.

### Reuse (no edits)
- `web/src/components/ui/Button.tsx` — prev/next buttons in `<Pagination>`.
- `web/src/components/ui/Dropdown.tsx` — page-size select composes `<Dropdown mode="single">` from B5a.
- `web/src/components/layout/EmptyState.tsx` — Table's empty slot composes.
- `<Section>` + `<Row>` helpers at `web/src/pages/StyleguidePage.tsx:43-72`.

### Read-only references
- `_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md` — table design tokens + dim 4 lockdown.
- `web/src/pages/AuditLog.tsx` — current <table class="data-table"> reference (not migrated).
- `web/src/pages/OperatorDashboard.tsx` — second reference.

### CHANGELOG
- Append `### Added` (Table + Pagination + styleguide + 10 cases; suite 71 → 81) + `### Tests` bullet.

## Tasks & Acceptance

**Execution:**
- [ ] `web/src/components/ui/Table.types.ts` — new file, ~40 lines. `TableColumn<T>` + `TableProps<T>` types.
- [ ] `web/src/components/ui/useTableSort.ts` — new file, ~40 lines. Sort state + asc/desc/null cycle.
- [ ] `web/src/components/ui/useTableSelection.ts` — new file, ~50 lines. Set + toggle + select-all.
- [ ] `web/src/components/ui/useTableResize.ts` — new file, ~40 lines. Per-column width + drag handlers.
- [ ] `web/src/components/ui/TableHeader.tsx` — new file, ~80 lines. Header + sort button + resize handle.
- [ ] `web/src/components/ui/TableBody.tsx` — new file, ~70 lines. Rows + selection checkboxes + cell rendering.
- [ ] `web/src/components/ui/Table.tsx` — new file, ~100 lines. Composition root + empty/loading slots.
- [ ] `web/src/components/ui/Pagination.tsx` — new file, ~120 lines. Prev/next + page chips + page-size Dropdown.
- [ ] `web/src/styles/table.css` — new file, ~150 lines. Token-only.
- [ ] `web/src/pages/StyleguidePage.tsx` — Section 10 + 25-row fixture.
- [ ] `web/src/styles/styleguide.css` — section scaffolding.
- [ ] `web/src/__checks__/fe-b5b-table.test.tsx` — new file, ~250 lines, 10 cases.
- [ ] `CHANGELOG.md` — append `### Added` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 81 cases pass (71 + 10), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new errors.
- Given `pnpm --filter surakkha-app build`, when run, then succeeds.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `<Table>` mounted with 3 sortable columns, when user clicks header, `aria-sort` flips + rows reorder + `onSortChange` fires.
- Given `<Table selectable>` mounted, when user toggles row checkbox, `onSelectionChange({rowKey})` fires; select-all toggles all.
- Given `<Pagination page=2 pageSize=10 total=25>`, when rendered, rows 11-20 show + prev/next enabled.
- Given `<Table emptyState={...}>` mounted with empty rows, when rendered, EmptyState composes inside the table region.
- Given `<Table loading>`, when rendered, 5 skeleton rows + headers + no checkboxes.

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 81 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app build` — succeeds.
- `pnpm --filter surakkha-app lint` — 0 new errors.

**Manual checks:**
- Open `/styleguide`; Section 10 "Table" renders 25-row fixture.
- Click "ward" header → `aria-sort="ascending"`; rows reorder.
- Toggle select-all → all 10 visible rows selected; readout updates.
- Change page-size Dropdown to 25 → all rows visible; pagination chips hidden.
- Resize below 767px → table horizontally scrolls.
- Drag "severity" header right edge 100px right → column widens.

## Design Notes

**Why built from scratch.** `react-table` v8 is ~40KB gzipped and ships a headless API that forces you to write your own `<thead>`/`<tbody>`. The Table primitive only needs ~250 LoC of sort+select+resize+pagination — pulling the dep adds 40KB + a learning curve for zero feature gain.

**Why sortable is opt-in per column.** FE-1's diverse tables sort on different fields; making `sortable` opt-in lets `AuditLog` (always-sorted by `block_height desc`) opt out while `InboxList` opts in for `severity`/`ward`.

**Why pagination is a separate component.** `Pagination` doesn't need to know about rows — it just renders prev/next + chips + a page-size Dropdown. Decoupling lets `InboxList` use the same Pagination component that B5b ships, but a future server-side list (e.g. audit log) can use the same Pagination with manually-sliced rows.

**Why Dropdown composes inside Pagination.** The page-size select (10 / 25 / 50 / 100) is the highest-value reuse of B5a — same ARIA combobox semantics, same keyboard nav.

**Why column resize is per-column opt-in.** Audit logs need fixed widths (block hash is 16 chars exactly); ward/severity columns benefit from resize. Opting in column-by-column avoids forcing every column to ship a drag handle.

## Out of scope (deferred to later specs)

- **B5d — Consumer migration**: replace bespoke tables in `OperatorDashboard`/`InboxList`/`AuditLog` with `<Table>`. Each consumer is its own sub-spec.
- **Virtualization** for very large tables (>1000 rows) — defer to a follow-up that benchmarks whether any FE-1 consumer actually needs it.
- **Column reorder via drag-and-drop** — defer.
- **Server-side sort** — the `onSortChange` callback already supports this; consumer wiring ships in B5d.
- **Filter row** — Table assumes filter UI lives in the page header, not inside the table.
- **Sticky first column** on horizontal-scroll — defer until a real consumer (audit-log timeline) needs it.
- **Row-level actions menu** — defer to the consumer's page-level Toolbar pattern (B5e).

## Suggested Review Order

**Types + per-file hooks (Layer A — sort/select/resize primitives)**
- `Table.types.ts` (~64 lines) — `TableColumn<T>`, `TableProps<T>`, `SortState`, `SortDir`, `ResizeState`, `PaginationProps`. Discriminated union not needed since columns is a homogeneous array.
  [`Table.types.ts`](../../web/src/components/ui/Table.types.ts)
- `useTableSort` (~85 lines) — state + `cycleSort(null → asc → desc → null)` per header click + numeric vs `localeCompare` comparator. The `stringify` helper narrows `unknown` to primitives so `@typescript-eslint/no-base-to-string` is silenced (review patch).
  [`useTableSort.ts`](../../web/src/components/ui/useTableSort.ts)
- `useTableSelection` (~75 lines) — `Set<string>` state + `toggle` / `toggleAll` / `isAllSelected` / `clear`. Selection is controlled (the consumer passes `selectedRows` + `onSelectionChange`); the hook is the public utility for uncontrolled callers and the test fixtures.
  [`useTableSelection.ts`](../../web/src/components/ui/useTableSelection.ts)
- `useTableResize` (~85 lines) — per-column widths; window-level `mousemove`/`mouseup` listeners; min 48px enforcement; cleanup on unmount (review patch: prevents leaked listeners).
  [`useTableResize.ts`](../../web/src/components/ui/useTableResize.ts)

**Sub-components (Layer A — DOM surface)**
- `TableHeader.tsx` (~140 lines) — `<thead>` + per-column `<th>` with sort button (`aria-sort="ascending"|"descending"|"none"`), resize handle (when `resizable: true`), and select-all checkbox (when `selectable`). The `ariaSortFor` helper uses `sort?.key === key ? sort.dir : null` to narrow optional chain (review patch).
  [`TableHeader.tsx`](../../web/src/components/ui/TableHeader.tsx)
- `TableBody.tsx` (~110 lines) — `<tbody>` + per-row `<tr>` with selection checkbox (when `selectable`). Cell rendering uses a `stringify(v)` helper that checks null/string/number/boolean explicitly to avoid `String(object)` falling back to `[object Object]` (review patch).
  [`TableBody.tsx`](../../web/src/components/ui/TableBody.tsx)
- `Table.tsx` (~150 lines) — composition root. Generic `Table<T>` consumer API: `columns`, `rows`, `rowKey`, `selectable`, `selectedRows`, `onSelectionChange`, `loading`, `emptyState`. Computes `sortedRows` via `useMemo`.
  [`Table.tsx`](../../web/src/components/ui/Table.tsx)
- `Pagination.tsx` (~135 lines) — prev/next `<Button>` + page chips + page-size `<Dropdown>` composed from B5a. Default page sizes `[10, 25, 50, 100]`. Chips use `typeof prev === 'number'` to safely render ellipsis when `chips[idx-1]` is `undefined`.
  [`Pagination.tsx`](../../web/src/components/ui/Pagination.tsx)

**Style + showcase**
- `table.css` (~220 lines) — token-only; sticky `<thead>` at `top: var(--space-md)`; zebra rows; skeleton shimmer; mobile horizontal scroll at 767px.
  [`table.css`](../../web/src/styles/table.css)
- Styleguide Section 10 — 25-row fixture (5 columns) + live `useState` readout `<pre>` showing current sort + selection + page.
  [`StyleguidePage.tsx`](../../web/src/pages/StyleguidePage.tsx) · [`styleguide.css`](../../web/src/styles/styleguide.css)

**Tests + CHANGELOG**
- 10 Vitest cases pin the contract: render, sort-string, sort-number, select-row, select-all, paginate, resize, empty, loading, sortable-disabled. Select tests use `(screen.getByTestId(...) as HTMLInputElement).checked` with eslint-disable for the unnecessary-type-assertion rule (the rule fires incorrectly because RTL types `getByTestId` as `HTMLElement`, but `.checked` is `HTMLInputElement`-only — review patch).
  [`fe-b5b-table.test.tsx`](../../web/src/__checks__/fe-b5b-table.test.tsx)
- CHANGELOG single `### Added` + `### Tests` section under `[Unreleased]`; suite grows 71 → 81.
  [`CHANGELOG.md`](../../CHANGELOG.md)

**Verification:** `pnpm test` → 81 passed (exit 0, ~6.5s). `pnpm typecheck` → clean. `pnpm lint` → 0 errors (62 pre-existing warnings). `pnpm build` → 356 modules transformed; dist index-cnAMpjek.css 77.22 kB + index-Bimy7Nqi.js 307.16 kB; built in 2.15s.
