---
title: 'FE-1.3c — useIncidents() hook extraction + OperatorDashboard + InboxDetail migration'
type: 'refactor'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '34c424f3ba2329d86c50c08dccfbb01127316220'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-fe-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md'
---

## Intent

**Problem:** FE-1 Layer C (data hooks at `web/src/hooks/`) names `useChain`, `useIncidents`, `useIncident`, `useSensors`, `useEvents`, `useSessionRole` — but only `useTheme` + `useLocale` ship. `OperatorDashboard` and `InboxDetail` inline-fetch `/api/incidents` with divergent shapes (`IncidentRow` vs `IncidentSummary`) and error handling. FE-1.5b parent deferred hook extraction here.

**Approach:** Create `web/src/hooks/useIncidents.ts` returning `{ incidents, loading, error }`. Extend `domain.ts` with `IncidentStatus` enum + `IncidentSummary`. Refactor the 2 pages to consume the hook. Ship 4 Vitest cases. InboxList stays on `/api/events?event_type=IncidentCreated` (deferred — it needs the rich chain-event payload).

## Boundaries & Constraints

**Always:**
- New `web/src/hooks/useIncidents.ts` (~50 lines). Single `useEffect` keyed `[]` calling `fetch('/api/incidents')`.
- Extend `web/src/types/domain.ts` with `IncidentStatus = { Open, Resolved, Escalated } as const` + `IncidentSummary` mirroring wire shape from `handlers.ts:443-461`.
- Refactor `OperatorDashboard.tsx`: DELETE local `IncidentRow` + its `Promise.all` incidents arm (sensors + events arms stay inline).
- Refactor `InboxDetail.tsx`: DELETE local `IncidentSummary` + incidents arm (events + chain poll untouched).
- New `web/src/__checks__/fe-1-3c-useincidents.test.tsx` (~120 lines, 4 cases) using `renderHook` + `act` + MSW.
- Error contract: `setIncidents([])` + `setError(err)` + `setLoading(false)` on fetch failure.

**Ask First:** None.

**Never:**
- No new tokens, deps, or barrel files.
- No source edits to `InboxList.tsx`, `inboxListModel.ts`, fixtures, mocks.
- No cache layer (`useRef`, SWR, TanStack Query) — fetch-on-mount only.
- No `passthrough()` in MSW overrides.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_idle | Mount; no fetch yet | `loading=true`, `incidents=[]`, `error=null` |
| HAPPY_PATH_success | `/api/incidents` → 3 rows | `loading=false`, `incidents.length===3`, `error=null` |
| ERROR_CASE_500 | `/api/incidents` → 500 | `loading=false`, `incidents=[]`, `error` non-null (no toast) |
| HAPPY_PATH_memo | Re-render, no deps change | `fetch` called exactly once per mount |

</frozen-after-approval>

## Code Map

### New hook (Layer C)
- `web/src/hooks/useIncidents.ts` (NEW, ~50 lines) — `useIncidents(): { incidents: IncidentSummary[], loading: boolean, error: Error | null }`.

### Domain types (Layer-agnostic)
- `web/src/types/domain.ts` (EXTEND, +20 lines) — append `IncidentStatus` + `IncidentSummary` mirroring wire shape from `handlers.ts:443-461`.

### Page consumer refactors
- `web/src/pages/OperatorDashboard.tsx:33-41,100` — DELETE local `IncidentRow` + incidents arm of `Promise.all`. Replace with `const { incidents, loading: incLoading } = useIncidents();`.
- `web/src/pages/InboxDetail.tsx:30-38,110-134` — DELETE local `IncidentSummary` + incidents arm. Replace with `const { incidents, loading: incLoading, error: incError } = useIncidents();`.

### Tests (vitest)
- `web/src/__checks__/fe-1-3c-useincidents.test.tsx` (NEW, ~120 lines) — `renderHook` + `Wrapper` + 4 cases.

### Reuse (no edits)
- `web/src/mocks/handlers.ts:425-463` — `/api/incidents` handler is wire source of truth.
- `web/src/hooks/useTheme.ts` + `useLocale.tsx` — mirror their `useState`+`useEffect` pattern.

### Read-only references
- `_bmad-output/implementation-artifacts/epic-fe-1-context.md:35-43` — Layer C invariants.
- `_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md:40,158,217` — FE-1.5b deferral note.

### CHANGELOG
- Append one `### Changed` bullet (hook + 2-consumer migration) + one `### Tests` bullet (4 new cases; suite grows 57 → 61).

## Tasks & Acceptance

**Execution:**
- [x] `web/src/types/domain.ts` + `web/src/hooks/useIncidents.ts` — append types; new hook (~70 lines total). Single source of truth + Layer C hook per AD-FE-6.
- [x] `web/src/pages/OperatorDashboard.tsx` — refactor incidents arm to `useIncidents()`; delete local `IncidentRow`. Layer D page becomes a hook consumer.
- [x] `web/src/pages/InboxDetail.tsx` — refactor incidents arm to `useIncidents()`; delete local `IncidentSummary`. Unifies divergent loading/error handling.
- [x] `web/src/__checks__/fe-1-3c-useincidents.test.tsx` — new file, ~120 lines, 4 cases. Locks the hook contract.
- [x] `CHANGELOG.md` — append `### Changed` + `### Tests` bullets under `[Unreleased]`. Trace refactor + suite growth.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 61 cases pass (57 + 4 new), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then 7 pre-existing baseline errors remain, 0 new.
- Given `pnpm --filter surakkha-app build`, when run, then succeeds.
- Given `useIncidents()` mounted + `/api/incidents` returns 3 rows, then `result.current.incidents.length === 3` after `waitFor`.
- Given `useIncidents()` mounted + `/api/incidents` returns 500, then `result.current.error` is non-null + `incidents=[]`.
- Given `useIncidents()` re-rendered with no dep change, then `fetch` called exactly once.
- Given OperatorDashboard + InboxDetail consume the hook, pages render identically (no DOM change).

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 61 cases pass, exit 0.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app build` — succeeds.
- `pnpm --filter surakkha-app lint` — 0 errors.

**Manual checks (if a consumer test fails):**
- OperatorDashboard `openIncidents.length` still reads correctly.
- InboxDetail "Incident not found" branch still triggers when `incident` is null.

## Design Notes

**Why now, not at FE-1.5b.** Parent punted to keep scope bounded. One hook per spec = tight blast radius.

**Why `IncidentSummary` not `IncidentRow`.** Existing shapes diverge on `status` (closed enum vs string). OperatorDashboard's narrow shape matches handler verbatim.

**Why fetch-on-mount only.** No cache in Phase 1. Chain-head poll lives in `AppLayout`.

## Suggested Review Order

**Hook (Layer C — entry point)**
- Single fetch keyed `[]` returns `{ incidents, loading, error }`; cancellation guards all 3 setters; `projectStatus()` maps wire strings to enum.
  [`useIncidents.ts:17`](../../web/src/hooks/useIncidents.ts#L17)
- `cancelled` ref pattern + cleanup function prevents setState-on-unmounted if component unmounts mid-fetch.
  [`useIncidents.ts:22`](../../web/src/hooks/useIncidents.ts#L22)

**Domain types (Layer-agnostic)**
- `IncidentStatus = { Open, Resolved, Escalated } as const` + `IncidentSummary` interface mirror wire shape from `handlers.ts:443-461`.
  [`domain.ts`](../../web/src/types/domain.ts)

**Consumer refactors (Layer D pages)**
- OperatorDashboard deletes local `IncidentRow` + incidents arm; consumes hook for the open-incidents slice.
  [`OperatorDashboard.tsx:33`](../../web/src/pages/OperatorDashboard.tsx#L33)
- InboxDetail deletes local `IncidentSummary` + incidents arm; consumes hook for the incident-resolution lookup.
  [`InboxDetail.tsx:30`](../../web/src/pages/InboxDetail.tsx#L30)

**Tests + peripheral**
- 4 Vitest cases lock the contract: idle, success (3 rows + enum projection), 500 error, single-fetch memo.
  [`fe-1-3c-useincidents.test.tsx:91`](../../web/src/__checks__/fe-1-3c-useincidents.test.tsx#L91)
- `afterEach` includes `vi.restoreAllMocks()` to harden spy isolation across tests (review patch).
  [`fe-1-3c-useincidents.test.tsx:49`](../../web/src/__checks__/fe-1-3c-useincidents.test.tsx#L49)
- CHANGELOG single `### Changed` section under `[Unreleased]` (review patch — collapsed duplicate header).
  [`CHANGELOG.md:41`](../../CHANGELOG.md#L41)
- Two follow-up entries for bigint drift on `last_block_height` + InboxDetail error UX (review defers).
  [`deferred-work.md`](deferred-work.md)
