---
title: 'FE-F7 — Bulk-bar Mark reviewed + Field Optimize route'
type: 'feature'
created: '2026-09-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: '577f13a'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f1-incident-actions-hook.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f3-inbox-modals.md'
---

## Intent

**Problem.** Two operator/technician surfaces are wired to UI but
not to a real action:

1. **`InboxList` bulk-bar** (`InboxList.tsx:365-380`) renders three
   CTAs (`Assign to me`, `Mark reviewed`, `Archive`) that all ship
   with `disabled` and no `onClick`. The bulk-bar shows when ≥1 row
   is selected but no action lands. The F1 hook already exposes
   `markReviewed({ incident_ids })` which posts one
   `SignatureAttestation` (action=`reviewed_by_operator`) per
   selected incident — wire that to the "Mark reviewed" CTA.

2. **`FieldQueuePage` "Optimize route" button** (`FieldQueuePage.tsx:138-140`)
   renders but is `disabled` with a `title="Phase 2"` tooltip. The
   filter chips (All / P1 / P2 / P3 / En route / On site) already
   drive a `visible` array — wire "Optimize route" to switch the
   filter back to `all` and re-order the visible jobs by SLA
   priority (P1 → P2 → P3 → P4, with overdue jobs first within
   each priority, then en route > on site > assigned).

**Approach:**

1. **InboxList bulk-bar — Mark reviewed:**
   - Add `useIncidentActions()` to the imports.
   - Wire the `Mark reviewed` button: `disabled` flips to enabled
     when `selectedRows.size > 0 && !actions.busy`; on click,
     collect `Array.from(selectedRows)` as `incident_ids`, call
     `actions.markReviewed({ incident_ids })`, then clear
     `selectedRows` and re-fetch `/api/events?event_type=IncidentCreated`
     so the table reflects the new `isAwaitingSig=false` state
     (each review drops the row out of the awaiting-sig rail).
   - Keep `Assign to me` and `Archive` as `disabled` placeholders
     (out of scope for this spec; they have no F1 method to call).

2. **FieldQueuePage Optimize route:**
   - Add a local `[sortMode, setSortMode]` state defaulting to
     `'manual'` (preserves the existing visual order).
   - Replace the `disabled` button with a real button:
     `disabled={sortMode === 'sla'}` (can't optimize twice in a
     row without re-sorting); on click, set `filter='all'` and
     `sortMode='sla'`.
   - When `sortMode === 'sla'`, sort `visible` by:
     priority rank (P1=0 < P2=1 < P3=2 < P4=3), then
     `timeIsOverdue ? 0 : 1`, then status rank
     (`enroute=0 < onsite=1 < assigned=2 < resolved=3`).
   - When `sortMode === 'manual'`, preserve the existing
     `buildRows` order (which is the chain-event order, oldest
     first — the natural arrival order).
   - Show a small "Optimized — SLA order" subtitle row when
     `sortMode === 'sla'` so the operator knows the order changed.

**Why these specific actions:**

- **Mark reviewed** is the only bulk action the F1 hook
  implements; the other two are explicit out-of-scope stubs.
- **Optimize route** as "switch to All + SLA sort" is the simplest
  meaningful interpretation of an SLA priority feature: P1 jobs
  come first, overdue jobs float to the top of each priority, and
  the natural work order (en route → on site → assigned) plays
  out within each priority tier. No GPS / mapping needed.

## Boundaries & Constraints

**Always:**
- InboxList bulk-bar `Mark reviewed` button calls the F1 hook —
  never inline `fetch('/api/events')`.
- After a successful `markReviewed` call, clear `selectedRows`
  and refetch `/api/events?event_type=IncidentCreated&limit=100`
  so the table + `AwaitingActionRail` reflect the new
  `isAwaitingSig=false` state.
- FieldQueuePage "Optimize route" is idempotent: clicking it once
  switches the filter + sort; clicking again while
  `sortMode === 'sla'` is a no-op (button disabled). A reset path
  isn't required — the operator can pick a filter chip to
  re-impose their own ordering.
- Optimize sort is a **stable sort** of the existing `visible`
  array; we never mutate `rows`.
- Token-only CSS — no new stylesheets. Reuses
  `inbox.css` (bulk-bar chrome) + `tech.css` (button).

**Ask First:** None — additive wiring against F1 contracts.

**Never:**
- No new deps.
- No edits to `useIncidentActions`, `useIncidents`, or the
  `inboxListModel.buildRows` reducer.
- No new `/api/...` MSW handlers.
- No edits to F3 modals, F4 ladder, F6 citizen ack.
- No barrel files (AD-FE-9).

## I/O & Edge-Case Matrix

### InboxList bulk-bar — Mark reviewed

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_single_selection_calls_markReviewed | 1 row selected, click Mark reviewed | `actions.markReviewed({ incident_ids: [id] })` called once |
| HAPPY_PATH_multi_selection_calls_markReviewed | 3 rows selected, click Mark reviewed | `actions.markReviewed({ incident_ids: [id1, id2, id3] })` called once with all 3 ids |
| HAPPY_PATH_clears_selection_after_success | markReviewed resolves true | `selectedRows` becomes empty Set; bulk-bar hides |
| HAPPY_PATH_refetches_rows_after_success | markReviewed resolves true | `/api/events?event_type=IncidentCreated&limit=100` is re-fetched |
| EDGE_disable_while_busy | `actions.busy=true` | Mark reviewed button disabled (no double-fire) |
| EDGE_no_selection | 0 rows selected | bulk-bar hidden (existing behaviour preserved) |
| RECOVERY_hook_returns_false | markReviewed resolves false | selection NOT cleared; row stays in awaiting-sig rail; error toast appears |
| ROLE_GATE_no_restriction | role check is implicit (page already role-gated to utility_operator) | none — page chrome handles role |

### FieldQueuePage — Optimize route

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_click_optimize_resets_filter_to_all | filter='P1', click Optimize | `filter` becomes 'all'; `sortMode` becomes 'sla' |
| HAPPY_PATH_click_optimize_sorts_visible_by_sla | 6 rows mixed priority + status | first row in `visible` is P1 + overdue (if any); else P1; within priority overdue first; within overdue, enroute > onsite > assigned |
| HAPPY_PATH_button_disabled_when_already_optimized | sortMode='sla' | button disabled |
| HAPPY_PATH_manual_order_preserved_by_default | sortMode='manual', no click | rows render in `buildRows` order (no sort) |
| HAPPY_PATH_subtitle_shows_when_optimized | sortMode='sla' | "Optimized — SLA order" subtitle visible |
| HAPPY_PATH_filter_chip_still_works_after_optimize | sortMode='sla', click P2 chip | `filter` becomes 'P2'; rows re-filtered; sort preserved (priority rank irrelevant inside P2) |
| EDGE_no_jobs_visible | `visible.length === 0` | "no jobs in this filter" empty state preserved |
| EDGE_all_jobs_done | every row `isDone=true` | sort runs (all are ties), list renders in input order |

## Code Map

### Modified (2 files, +~80 LoC total)

- `web/src/pages/InboxList.tsx` (~+45 LoC):
  - Import `useIncidentActions`.
  - Call the hook at top of component.
  - Wrap the existing bulk-bar `Mark reviewed` button with
    `disabled={actions.busy || selectedRows.size === 0}` and an
    `onClick` that fires `markReviewed`, clears selection on
    success, and refetches rows.
  - Keep `Assign to me` + `Archive` as disabled placeholders.

- `web/src/pages/FieldQueuePage.tsx` (~+35 LoC):
  - Add `[sortMode, setSortMode] = useState<'manual' | 'sla'>('manual')`.
  - Compute `sortedVisible` by `sortMode === 'sla' ? slaSort(visible) : visible`.
  - Replace the disabled button with one that sets
    `filter='all'; sortMode='sla'` on click; disabled when
    `sortMode === 'sla'`.
  - Render the existing jobs loop from `sortedVisible` instead of
    `visible`.
  - Optional: tiny subtitle "Optimized — SLA order" in the
    page-header sub row when `sortMode === 'sla'`.

### New (1 file, ~200 LoC)

- `web/src/__checks__/fe-f7-bulk-optimize.test.tsx` (~200 LoC,
  ~10 cases):
  - InboxList bulk-bar (5 cases): single-row markReviewed,
    multi-row markReviewed, clears selection on success,
    refetches rows on success, button disabled while busy.
  - FieldQueuePage Optimize route (5 cases): click resets filter
    to all + sort to sla, sla sort puts P1+overdue first,
    button disabled when already optimized, manual order
    preserved by default, filter chip still works after
    optimize.

### Files unchanged (out of scope)

- `web/src/hooks/useIncidentActions.ts` — `markReviewed` is
  already implemented.
- `web/src/hooks/useIncidents.ts` — InboxList builds rows from
  `/api/events?event_type=IncidentCreated` directly; that path
  stays.
- `web/src/pages/inboxListModel.ts` — `buildRows` reducer is
  reused as-is.
- `web/src/components/ui/{Button,Table}.tsx` — existing
  primitives consumed as-is.

### CHANGELOG
- Append `### Added` bullet: "InboxList bulk-bar `Mark reviewed`
  CTA now wired to `useIncidentActions.markReviewed({ incident_ids })`;
  each call posts one `SignatureAttestation` (`action:
  reviewed_by_operator`) per selected incident. Selection clears
  on success and the inbox refetches. FieldQueuePage `Optimize
  route` button now resets the filter to `All` and re-orders the
  visible jobs by SLA priority (P1 → P2 → P3 → P4, overdue first
  within each tier, en route > on site > assigned within overdue).
  Token-only styles; zero new deps."
- Append `### Tests` bullet: "Suite 216 → ~226; +~10 cases in
  `fe-f7-bulk-optimize.test.tsx`. Zero new deps."

## Tasks & Acceptance

**Execution:**
- [x] `web/src/pages/InboxList.tsx` — wire bulk-bar Mark reviewed.
- [x] `web/src/pages/FieldQueuePage.tsx` — wire Optimize route.
- [x] `web/src/__checks__/fe-f7-bulk-optimize.test.tsx` — ~10 cases.
- [ ] `CHANGELOG.md` — bullets.

**Acceptance Criteria:**
- `pnpm --filter surakkha-app test` → ~226 cases pass, exit 0.
- `pnpm --filter surakkha-app typecheck` → no new errors
  (delta vs F6 baseline = 0).
- `pnpm --filter surakkha-app lint` → 0 new errors (delta vs F6
  baseline = 0).
- Login as Priya → `/inbox` → select 2 rows → bulk-bar shows →
  click Mark reviewed → rows disappear from the awaiting-sig
  rail; selection clears.
- Login as Karim → `/field` → click Optimize route → filter
  resets to All; jobs re-order P1+overdue first; subtitle "Optimized
  — SLA order" visible.

## Verification

**Commands:**
- `pnpm --filter surakkha-app test -- src/__checks__/fe-f7-bulk-optimize.test.tsx`
  → ~10/~10 pass.
- `pnpm --filter surakkha-app test` → ~226/~226 pass.
- `pnpm --filter surakkha-app typecheck` → no new errors.
- `pnpm --filter surakkha-app lint` → 0 new errors (delta vs F6
  baseline = 0).

**Manual checks:**
- Login as Priya → `/inbox` → select rows → Mark reviewed.
- Login as Karim → `/field` → Optimize route → verify order.

## Design Notes

**Why a local sort state, not a reducer.** The Optimize route is
a transient view ("I want to see them in SLA order right now")
not a persisted preference. `useState<'manual' | 'sla'>` is
enough; clicking any filter chip doesn't reset it (the operator
can layer filters on top of SLA order) but switching personas
does (component remounts).

**Why no `re-sort` button.** Re-sorting twice in a row is a
no-op because SLA order is deterministic. The button disables
itself once active to signal that.

**Why the subtitle.** Without the "Optimized — SLA order" label,
the operator can't tell whether the order changed by accident or
on purpose. It's a tiny `<span className="page-header__sub">`
that mirrors the F4 step-ladder convention.

**Why "Assign to me" + "Archive" stay disabled.** Neither has an
F1 method to call. `Assign to me` would conflict with the
single-incident `AssignTechModal` (F3 — one tech + priority +
ETA + summary), and `Archive` is a Phase 2 status mutation
(`IncidentArchived`) not in the 33-event enum.

## Out of scope (deferred to later specs)

- **`Assign to me` bulk action.** Would need a new F1 method
  that posts one `TechnicianAssigned` per selected incident with
  the operator as `assigned_by`. The F3 modal still drives the
  per-incident case.
- **`Archive` bulk action.** Requires expanding the 33-event
  enum to add `IncidentArchived` (or similar) plus a new
  `archiveIncidents({ incident_ids })` hook method.
- **Multi-driver route optimization.** Karim sometimes shares
  wards with Rashid or Sumi; cross-driver dispatch (swap jobs
  to balance load) is a Phase 2 ops feature.
- **Persisting sort preference across sessions.** Today the
  Optimize button is local; toggling it via a `localStorage`
  preference would let Karim keep his SLA order across reloads.

## Suggested Review Order

**The wiring**
- `web/src/pages/InboxList.tsx` — Mark reviewed CTA wired.
  [`InboxList.tsx`](../../web/src/pages/InboxList.tsx)
- `web/src/pages/FieldQueuePage.tsx` — Optimize route wired.
  [`FieldQueuePage.tsx`](../../web/src/pages/FieldQueuePage.tsx)

**The tests**
- `fe-f7-bulk-optimize.test.tsx` — ~10 cases pinning both surfaces.
  [`fe-f7-bulk-optimize.test.tsx`](../../web/src/__checks__/fe-f7-bulk-optimize.test.tsx)

**Verification:** `pnpm test` → ~226 passed. `pnpm typecheck`
delta vs F6 = 0. `pnpm lint` delta vs F6 = 0.
