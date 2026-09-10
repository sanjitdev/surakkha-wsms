---
title: 'FE-B5b-sort-a11y — Table sort comparator hardening + resize cleanup + tri-state select-all + keyboard resize'
type: 'refactor'
created: '2026-09-09'
status: 'approved'
review_loop_iteration: 0
baseline_commit: '771f5e6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** Four real bugs / missing features in the shipped Table primitive:

1. **B5b-1 — Sort comparator doesn't handle nulls / Dates.**
   `web/src/components/ui/useTableSort.ts:50-67` — when one row's column
   value is `null` and another is a string, the null sorts to top
   regardless of direction (because `stringify` returns `''` for null,
   and `''.localeCompare('Apple')` is negative — null is "less" than
   everything). Users expect nulls to either always sort last OR
   consistently order. Also `Date` objects compare via their `toString`
   (which is locale-dependent and not chronological).

2. **B5b-2 — Resize listeners leak on unmount mid-drag.**
   `web/src/components/ui/useTableResize.ts:54-64` — if the component
   unmounts during a drag (e.g. consumer changes route), the global
   `mousemove`/`mouseup` listeners stay attached. Memory leak +
   possible `setState on unmounted` warnings.

3. **B5b-3 — Select-all checkbox is binary (no tri-state).**
   `web/src/components/ui/Table.tsx:51-55` — `allSelected = pageKeys.every(...)`.
   When SOME (but not all) rows are selected, the checkbox is unchecked
   — visually misleading. ARIA `aria-checked="mixed"` + HTML
   `indeterminate` property should signal partial selection.

4. **B5b-4 — Resize handle is `aria-hidden` — no keyboard alternative.**
   `web/src/components/ui/TableHeader.tsx:116` — the resize `<span>` has
   `aria-hidden="true"`. Keyboard / SR users cannot resize columns.
   No way to focus the handle. Need a focusable, keyboard-operable
   alternative (or a keyboard shortcut when the column header is focused).

**Approach:** Four targeted patches:

- Sort comparator: add `null`/`undefined` aware comparison (nulls
  always sort last regardless of dir) + `Date` branch using
  `.getTime()` numeric compare.
- Resize cleanup: add a `useEffect` cleanup function that removes
  the listeners on unmount; track the current listeners in refs so
  the cleanup can call `removeEventListener` with the same function
  references.
- Tri-state select-all: introduce a `partial` derived state; render
  `indeterminate={partial && !allSelected}` on the checkbox; set
  `aria-checked={allSelected ? 'true' : partial ? 'mixed' : 'false'}`.
- Keyboard resize: when the column `<th>` is focused, ArrowLeft /
  ArrowRight (with Shift modifier for larger steps) adjusts the
  column width by ±8px. Keep the mouse handle for pointer users.

## Boundaries & Constraints

**Always:**
- Sort null-handling: nulls sort LAST in both `asc` and `desc` (most
  databases do NULLS LAST, which matches user expectation from SQL).
  This is documented as the new contract — older consumers that relied
  on nulls-first behavior would need to migrate, but no current
  consumer does.
- Date compare: only when both values are `Date` instances. Mixed
  (Date + string) falls through to `stringify` + `localeCompare`
  (existing behavior).
- Resize cleanup: useRef the listener functions; useEffect cleanup
  removes them. SSR-safe via `typeof window === 'undefined'` guard.
- Tri-state: HTML `indeterminate` is a DOM property, not an attribute.
  Set via `ref.current.indeterminate = …`. The `aria-checked` attribute
  uses the ARIA `mixed` value.
- Keyboard resize: 8px step (Shift = 32px). Min width 48px enforced
  (matches `useTableResize.ts:11` `MIN_WIDTH_PX`).
- Each bug has its own test cases. 4 new tests minimum.
- 100% backward compat: existing 114-case suite stays green.

**Ask First:** None — all four are quality fixes, low-blast-radius.

**Never:**
- No third-party deps.
- No barrel files (AD-FE-9).
- No public `TableProps` change.
- No CSS edits (keyboard resize uses existing `onResizeStart` flow
  via direct `setWidths` call).
- No edits to consumer pages (`OperatorDashboard`, `InboxList`,
  `AuditLog`) — the migration is B5b-migrate (next deferred spec).
- No Date-fns / Intl.RelativeTimeFormat (zero-dep lockdown holds).

## I/O & Edge-Case Matrix

### Sort comparator

| Scenario | Input rows | Expected order (asc) |
|----------|------------|----------------------|
| HAPPY_PATH_nulls_last_asc | `[1, null, 3, null, 2]` | `[1, 2, 3, null, null]` |
| HAPPY_PATH_nulls_last_desc | `[1, null, 3, null, 2]` | `[3, 2, 1, null, null]` |
| HAPPY_PATH_date_compare | `[{d: new Date('2024-01-01')}, {d: new Date('2024-03-01')}, {d: new Date('2024-02-01')}]` | chronological: Jan, Feb, Mar |
| HAPPY_PATH_mixed_null_string | `[null, 'Banana', 'Apple', null, 'Cherry']` | `['Apple', 'Banana', 'Cherry', null, null]` |
| REGRESSION_number_sort | `[3, 1, 2]` | `[1, 2, 3]` |
| REGRESSION_string_sort | `['Banana', 'Apple', 'Cherry']` | `['Apple', 'Banana', 'Cherry']` |
| REGRESSION_unicode_locale | `['Ä', 'Z', 'A']` | locale-correct order (de-DE-ish) |

### Resize cleanup

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_cleanup_on_unmount | Start a drag, unmount Table | `window` has no leftover `mousemove`/`mouseup` listeners (spy on `addEventListener` / `removeEventListener`) |
| HAPPY_PATH_drag_to_min | Drag to less than 48px | width clamps at 48px (regression check) |
| REGRESSION_drag_to_max | Drag to wider | width persists |

### Tri-state select-all

| Scenario | Selected state | Expected |
|----------|---------------|----------|
| HAPPY_PATH_none_selected | `selectedRows.size === 0` | `indeterminate=false`, `aria-checked='false'` |
| HAPPY_PATH_some_selected | 2 of 5 page rows selected | `indeterminate=true`, `aria-checked='mixed'` |
| HAPPY_PATH_all_selected | All 5 page rows selected | `indeterminate=false`, `aria-checked='true'` |
| REGRESSION_toggle_all_from_some | Some selected; click select-all | selects all (current) |

### Keyboard resize

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_arrow_left_shrinks | Focus header; press ArrowLeft | width -= 8px |
| HAPPY_PATH_arrow_right_grows | Focus header; press ArrowRight | width += 8px |
| HAPPY_PATH_shift_arrow_grows_faster | Focus header; press Shift+ArrowRight | width += 32px |
| HAPPY_PATH_min_clamped | Drag/ArrowLeft until <48px | clamps at 48px |
| REGRESSION_arrow_on_non_resizable | Focus non-resizable column header; press ArrowRight | no-op (no `resizable=true`) |

<frozen-after-approval>

## Spec Change Log

(To be appended after Step-05 ships.)

## Code Map

### Modified (4 files, ~80 LoC net)

- `web/src/components/ui/useTableSort.ts` (MODIFY, +18 LoC) —
  - In the comparator at lines 50-67, add:
    ```typescript
    // Null/undefined always sort last (NULLS LAST).
    const aNull = av === null || av === undefined;
    const bNull = bv === null || bv === undefined;
    if (aNull && !bNull) return 1;
    if (!aNull && bNull) return -1;
    if (aNull && bNull) return 0;
    ```
  - Add a Date branch:
    ```typescript
    if (av instanceof Date && bv instanceof Date) {
      return (av.getTime() - bv.getTime()) * mul;
    }
    ```

- `web/src/components/ui/useTableResize.ts` (MODIFY, +20 LoC) —
  - Refactor: store the current `onMove` and `onUp` in refs so the
    cleanup can call `removeEventListener` with the same function
    references.
  - Add a `useEffect` cleanup that removes any active listeners on
    unmount:
    ```typescript
    useEffect(() => () => {
      if (cleanupRef.current) cleanupRef.current();
    }, []);
    ```

- `web/src/components/ui/Table.tsx` (MODIFY, +12 LoC) —
  - In the `allSelected` `useMemo` (lines 51-55), add a derived
    `partialSelected` (some but not all).
  - Add a `selectAllRef` to the checkbox; in a `useEffect`, set
    `selectAllRef.current.indeterminate = partialSelected && !allSelected`.
  - Change the checkbox `aria-checked` attribute to use `'mixed'`
    when partial.

- `web/src/components/ui/TableHeader.tsx` (MODIFY, +25 LoC) —
  - On the `<th>` itself, add `tabIndex={isResizable ? 0 : undefined}`
    + an `onKeyDown` handler that adjusts width on ArrowLeft/Right
    (±8px, Shift = ±32px). The handler calls into the resize hook
    via a new `onResizeAdjust(columnKey, deltaPx)` callback prop.
  - Add `onResizeAdjust` to `TableHeaderProps`; thread from
    `useTableResize` via `Table.tsx`.
  - The mouse handle stays as-is for pointer users; the `<th>`
    itself becomes the keyboard target.

- `web/src/components/ui/useTableResize.ts` (MODIFY, additional
  +8 LoC) — add `onResizeAdjust: (columnKey: string, deltaPx: number) => void`
  to the result interface; implement as a `setWidths` updater that
  clamps to `MIN_WIDTH_PX`.

### Tests (vitest)

- `web/src/__checks__/fe-b5b-sort-a11y.test.tsx` (NEW, ~140 LoC, 8-10
  cases) — covers the I/O matrix above:
  - Sort: `nulls_sort_last_asc`, `nulls_sort_last_desc`,
    `date_values_sort_chronologically`, `mixed_null_and_string`,
    `number_sort_regression`, `string_sort_regression`.
  - Resize cleanup: `unmount_during_drag_removes_listeners` (spy on
    `addEventListener` / `removeEventListener`).
  - Tri-state: `partial_selection_shows_indeterminate`,
    `all_selected_clears_indeterminate`,
    `none_selected_clears_indeterminate`.
  - Keyboard resize: `arrow_left_shrinks_column`,
    `arrow_right_grows_column`, `shift_arrow_grows_32px`,
    `arrow_clamped_at_min_width`.

### Read-only references
- `web/src/components/ui/Table.types.ts` — `SortState`, `SortDir`,
  `ResizeState` types unchanged.

### Reuse (no edits)
- The existing `MIN_WIDTH_PX = 48` constant at `useTableResize.ts:11`
  — keyboard resize uses the same minimum.
- The existing `cycleSort` helper at `useTableSort.ts:13` — unchanged.

### CHANGELOG
- Append `### Fixed` bullet: "Table sort comparator now treats nulls
  as LAST (was first; B5b-1); Date values now compare chronologically
  (was locale-string; B5b-1). Resize listeners now cleaned up on
  unmount mid-drag (B5b-2; was leaking). Select-all checkbox now
  tri-state with `indeterminate` + `aria-checked='mixed'` for partial
  selections (B5b-3)."
- Append `### Added` bullet: "Resizable columns now respond to
  ArrowLeft / ArrowRight (±8px; Shift = ±32px) when the column header
  is focused (B5b-4). Min width 48px enforced."
- Append `### Tests` bullet: "Suite 114 → 122-124; +8-10 cases. Zero
  new deps."

## Tasks & Acceptance

**Execution:**
- [ ] `useTableSort.ts` — null-last comparator + Date branch.
- [ ] `useTableResize.ts` — listener cleanup + `onResizeAdjust`.
- [ ] `Table.tsx` — tri-state `partialSelected` + `indeterminate` +
      `aria-checked='mixed'`.
- [ ] `TableHeader.tsx` — keyboard `onKeyDown` on resizable `<th>` +
      thread `onResizeAdjust` from `useTableResize`.
- [ ] `fe-b5b-sort-a11y.test.tsx` — new file, ~140 LoC, 8-10 cases.
- [ ] `CHANGELOG.md` — `### Fixed` + `### Added` + `### Tests`
      bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 122-124
  cases pass (114 + 8-10), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new
  errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.5 kB gzipped (4 fixes, mostly small additions).
- Given rows with null values, when sorted asc, then nulls are last.
- Given rows with Date values, when sorted, then chronological order.
- Given a Table mid-drag is unmounted, when checking
  `addEventListener` spies, then no listeners remain.
- Given a partial selection, when rendered, then the select-all
  checkbox has `indeterminate=true` and `aria-checked='mixed'`.
- Given a focused resizable column header, when ArrowRight is
  pressed, then the column width grows by 8px.
- Given a focused resizable column header at min width, when
  ArrowLeft is pressed, then the width stays at 48px (clamped).

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 122-124 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Open styleguide Table section. Click the "severity" header to
  sort. Verify rows with missing severity values appear at the
  bottom regardless of asc/desc direction.
- Click select-all when 2 of 5 rows are individually selected.
  Observe the checkbox briefly shows indeterminate, then becomes
  fully checked.
- Tab into the styleguide table. Focus a resizable column header.
  Press ArrowRight. Observe the column widens. Press Shift+ArrowRight
  for a larger step.
- Resize a column by drag, then navigate away mid-drag (route
  change). Return to the page. No console warnings about state
  updates on unmounted components.

## Design Notes

**Why NULLS LAST, not NULLS FIRST.** SQL standard is implementation-
defined; PostgreSQL uses NULLS LAST by default in DESC, NULLS FIRST
in ASC. SQLite uses NULLS FIRST in ASC. Our consumers are Surakkha
dashboard tables — they expect "missing = bottom" because missing
values are anomalies, not the most-important row. NULLS LAST in both
directions is the simpler, more intuitive rule for the dashboard
context.

**Why Date via `getTime()` not `valueOf()`.** Same numeric compare;
   `valueOf` for Date returns `getTime()`. Using `getTime()` is more
   explicit and avoids any monkey-patching of `valueOf` by user code.

**Why `indeterminate` is a DOM property, not attribute.** HTML's
`indeterminate` is a one-way DOM property on checkboxes — there's
no `indeterminate` HTML attribute. React doesn't support it as a
prop. So we use a ref + `useEffect` to set it. The ARIA `aria-checked`
attribute is the accessibility-correct way to communicate partial
selection to SR users.

**Why keyboard resize on the `<th>` not the handle.** The handle is
8px wide and visually decorative. Putting keyboard resize on the
`<th>` matches the ARIA APG pattern: focusable column header, Arrow
keys adjust width. SR users hear "Sort by Severity, column header,
press arrow keys to resize." Power users get a familiar interaction.

**Why ±8px / ±32px.** 8px matches the visual handle width. 32px is 4x
— matches the common "Shift = 4x step" convention in design tools
(Figma, etc.).

## Out of scope (deferred to later specs)

- **Server-side sort** — Table's sort is client-side only. Real
  consumers with >1000 rows need server-side; B5b-migrate handles the
  OperatorDashboard migration, but server-side sort is a separate
  spec.
- **Virtualization** for very large tables (>1000 rows) — not needed
  for Phase 1.
- **Persist resize widths to localStorage** — widths reset on page
  reload. Acceptable for Phase 1; can land as a follow-up if users
  complain.
- **Resize via mouse drag is already supported** — keyboard resize is
  new; mouse drag stays as-is.
- **Column reordering** — not in scope; would require a `react-dnd`
  or similar dep (forbidden by zero-dep lockdown).

## Suggested Review Order

**Sort (the comparator)**
- `useTableSort.ts` — null-last + Date branch. ~18 LoC.
  [`useTableSort.ts`](../../web/src/components/ui/useTableSort.ts)

**Resize (the hook)**
- `useTableResize.ts` — listener cleanup on unmount + new
  `onResizeAdjust` callback. ~28 LoC.
  [`useTableResize.ts`](../../web/src/components/ui/useTableResize.ts)

**Composition + Header (the wiring)**
- `Table.tsx` — tri-state `partialSelected` + `indeterminate` ref +
  `aria-checked='mixed'`.
- `TableHeader.tsx` — keyboard handler on resizable `<th>`; thread
  `onResizeAdjust` from composition root.
  [`Table.tsx`](../../web/src/components/ui/Table.tsx) · [`TableHeader.tsx`](../../web/src/components/ui/TableHeader.tsx)

**Tests + CHANGELOG**
- 8-10 Vitest cases pin the contract per the I/O matrix above.
  [`fe-b5b-sort-a11y.test.tsx`](../../web/src/__checks__/fe-b5b-sort-a11y.test.tsx)
- CHANGELOG `### Fixed` (nulls last, dates chronological, listener
  cleanup, tri-state) + `### Added` (keyboard resize) +
  `### Tests` (suite 114 → 122-124). No new deps.

**Verification:** `pnpm test` → 122-124 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.5 kB gzipped.