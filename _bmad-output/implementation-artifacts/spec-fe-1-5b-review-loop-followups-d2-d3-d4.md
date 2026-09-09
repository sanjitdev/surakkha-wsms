---
title: 'FE-1.5b review-loop D2/D3/D4 — InboxList I/O matrix + route assertion + CSS lockdown'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '53c94bc817d93eae189dc9d46f717d11c817ce6b'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-1-5b-review-loop-followups.md'
---

## Intent

**Problem:** FE-1.5b's review-loop-1 split deferred D2 (page-level I/O matrix integration tests), D3 (`/inbox` route source-assertion), and D4 (CSS literal lockdown verification). Three gaps remain: (a) 4 untested I/O matrix rows from `spec-fe-1-5b-inbox-list.md` (filter_T3, fetch_fail, Bangla chrome, severity rail), (b) no test confirms `App.tsx` wires `<InboxList />` at `/inbox`, (c) no test confirms `inbox.css` stays at zero hex literals per dim 4 lockdown.

**Approach:** Append 3 more `describe` groups (6 cases total) to `web/src/__checks__/fe-1-5b-inboxlist.test.tsx` — D1's file. Reuse its `setupServer`, ROWS, `overrideEventsHandler()`, `renderInboxAndWaitForRows()` helper. D2 = 4 cases. D3 + D4 = 1 case each via `fs.readFileSync` source-assertion. No source change to `InboxList.tsx`, `App.tsx`, `inbox.css`.

## Boundaries & Constraints

**Always:**
- Append to `web/src/__checks__/fe-1-5b-inboxlist.test.tsx`. Reuse `setupServer`, ROWS, helpers from D1.
- 3 new `describe` groups: `InboxList I/O matrix` (4 cases), `InboxList /inbox route` (1), `InboxList CSS lockdown` (1). ≤120 lines growth.
- D2 fetch_fail: override `/api/events?event_type=IncidentCreated` → 500, assert `<EmptyState heading="No incidents" />`.
- D3: `fs.readFileSync('web/src/App.tsx', 'utf8')`, assert `path="/inbox"` + `element={<InboxList />}` within 3 lines.
- D4: `fs.readFileSync('web/src/styles/inbox.css', 'utf8')`, assert zero matches for `/#[0-9a-fA-F]{3,8}|rgb\(/`.

**Ask First:**
- None.

**Never:**
- No new tokens, no third-party deps.
- No edits to `InboxList.tsx`, `App.tsx`, `inbox.css`, `InboxRow.tsx`, `FilterChip.tsx`, `inboxListModel.ts`.
- No `passthrough()` in MSW overrides (D1 lesson — triggers `ECONNREFUSED`).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Errors |
|----------|------|----------|--------|
| HAPPY_PATH_filter_T3 | Render w/ 3 rows; click `T3 urgent` | 1 `<InboxRow>` visible; chip `aria-selected="true"` + `is-active`; count = 1 | N/A |
| ERROR_CASE_fetch_fail | `/api/events?event_type=IncidentCreated` → 500 | `<EmptyState heading="No incidents" />`; `loading=false`; no toast | No toast per FE-1.5b AC |
| LOCALE_BANGLA | `body.dataset.locale = 'bn'` before render | `<body data-locale="bn">` set; page renders without crash | N/A |
| HAPPY_PATH_severity_rail | 3 rows (high=1, medium=1, low=1) | Right rail: T3=1, T2=1, T1=1, T0=0 | N/A |
| HAPPY_PATH_route_wired | Read `App.tsx` source | `path="/inbox"` + `element={<InboxList />}` within 3 lines (line 152) | N/A |
| HAPPY_PATH_css_lockdown | Read `inbox.css` source | Zero matches for hex literals + `rgb(` | N/A |

</frozen-after-approval>

## Code Map

### Reuse (no edits)
- `web/src/__checks__/fe-1-5b-inboxlist.test.tsx` — append after `InboxList bulk-bar` group.
- `web/src/mocks/handlers.ts` — base handlers; MSW overrides per-case.
- `web/src/App.tsx:152` — `/inbox` route binding (D3 locks).
- `web/src/styles/inbox.css` — token-only file (D4 locks).
- `web/src/components/layout/EmptyState.tsx` — `heading`+`body` (per `InboxList.tsx:251-255`).

### New content (this spec appends; no new files)
- `web/src/__checks__/fe-1-5b-inboxlist.test.tsx` — 3 new `describe` groups at end, ~120 lines.

### Read-only references
- `_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md:48-62` — I/O matrix rows.
- `_bmad-output/implementation-artifacts/spec-fe-1-5b-review-loop-followups.md:97-99` — D2/D3/D4 entry points.

### CHANGELOG
- Append one `### Tests` bullet under `[Unreleased]`: 6 new Vitest cases (I/O matrix 4 + route 1 + CSS lockdown 1); suite now 57 (was 51).

## Tasks & Acceptance

**Execution:**
- [ ] `web/src/__checks__/fe-1-5b-inboxlist.test.tsx` -- append `describe('InboxList I/O matrix')` w/ 4 cases -- Rationale: locks 4 unwritten I/O rows from parent; reuses ROWS + MSW + renderInboxAndWaitForRows. ~80 lines.
- [ ] `web/src/__checks__/fe-1-5b-inboxlist.test.tsx` -- append `describe('InboxList /inbox route')` w/ 1 case using `fs.readFileSync` -- Rationale: source-asserts route wiring without runtime router test. ~12 lines.
- [ ] `web/src/__checks__/fe-1-5b-inboxlist.test.tsx` -- append `describe('InboxList CSS lockdown')` w/ 1 case using `fs.readFileSync` + regex grep -- Rationale: locks dim 4 lockdown at file level. ~12 lines.
- [ ] `CHANGELOG.md` -- append one `### Tests` bullet under `[Unreleased]` -- Rationale: locks D2/D3/D4 resolution.

**Acceptance Criteria:**
- Given `pnpm test`, when run, then 57 cases pass (51 prior + 6 new), exit 0; new describe groups green.
- Given filter_T3, when `T3 urgent` chip clicked, then 1 row visible, chip `aria-selected="true"` + `is-active`.
- Given fetch_fail, when `/api/events?event_type=IncidentCreated` returns 500, then `<EmptyState heading="No incidents" />` renders.
- Given locale_bangla, when `body.dataset.locale = 'bn'`, then `<body data-locale="bn">` set, page renders without crash.
- Given severity_rail, when 3 rows (1×T3, 1×T2, 1×T1), then right rail T3=1, T2=1, T1=1, T0=0.
- Given route assertion, when reading `App.tsx`, then `path="/inbox"` + `element={<InboxList />}` within 3 lines.
- Given css_lockdown, when reading `inbox.css`, then zero matches for `/#[0-9a-fA-F]{3,8}|rgb\(/`.
- Given `pnpm typecheck`, when run, then baseline preserved.
- Given `pnpm build`, when run, then no new errors.

## Verification

**Commands:**
- `pnpm test web/src/__checks__/fe-1-5b-inboxlist.test.tsx` -- expected: 4 describe groups, 8 cases pass.
- `pnpm test` -- expected: 57 cases pass, exit 0, ~3.5s wall.
- `pnpm typecheck` -- expected: no new errors.
- `pnpm build` -- expected: succeeds.

**Manual checks (if any D2 case fails):**
- filter_T3: `web/src/pages/InboxList.tsx:94-104` filter predicates match parent I/O matrix.
- fetch_fail: `web/src/pages/InboxList.tsx:42-55` catch path sets `rows=[]` + `loading=false`.
- severity_rail: `web/src/pages/InboxList.tsx:105-112` sevCounts unchanged.

## Suggested Review Order

**D2 I/O matrix coverage (the load-bearing locks)**

- filter_T3 — clicks `data-testid='filter-chip-t3-urgent'`, asserts aria-selected flip + `is-active` class + 1 visible row (Ward 7).
  [`fe-1-5b-inboxlist.test.tsx:262`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L262)

- fetch_fail — single `server.use()` returns 500 for IncidentCreated + empty array for others, asserts `<EmptyState heading="No incidents" />`.
  [`fe-1-5b-inboxlist.test.tsx:283`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L283)

- locale_bangla — sets `body.dataset.locale='bn'` before render; try/finally restores; asserts attribute persists + rows mount.
  [`fe-1-5b-inboxlist.test.tsx:312`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L312)

- severity_rail — scans `.card` for `'Queue by severity'` heading, asserts 4 `.hbar-row` entries reading exactly `T3 urgent 1 / 3 / T2 elevated 1 / 3 / T1 review 1 / 3 / T0 info 0 / 3`.
  [`fe-1-5b-inboxlist.test.tsx:324`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L324)

**D3 route source-assertion (route wiring lock)**

- App.tsx — `readFileSync` finds `path="/inbox"` line + asserts `element={<InboxList />}` within 3 lines.
  [`fe-1-5b-inboxlist.test.tsx:354`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L354)

**D4 CSS lockdown (dim 4 colour-token lockdown)**

- inbox.css — `readFileSync` + `/#[0-9a-fA-F]{3,8}|rgb\(/g`; asserts zero matches.
  [`fe-1-5b-inboxlist.test.tsx:370`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L370)

**Test lifecycle (peripheral)**

- beforeEach — `server.resetHandlers(...handlers)` + `delete document.body.dataset.locale` (step-04 patch #2 cross-test cleanup guard).
  [`fe-1-5b-inboxlist.test.tsx:42`](../../web/src/__checks__/fe-1-5b-inboxlist.test.tsx#L42)

**Read-only references (production code under test)**

- InboxList catch path — sets `rows=[]` + `loading=false` on fetch error.
  [`InboxList.tsx:42`](../../web/src/pages/InboxList.tsx#L42)

- Filter predicates — T3/sig/drafts/citizen/resolved branches the test exercises via the T3 chip.
  [`InboxList.tsx:94`](../../web/src/pages/InboxList.tsx#L94)

- sevCounts derivation — feeds the severity_rail test's expected counts.
  [`InboxList.tsx:105`](../../web/src/pages/InboxList.tsx#L105)

**Changelog (peripheral)**

- One `### Tests` bullet aggregating D2/D3/D4 coverage + suite-count growth from 51 → 57.
  [`CHANGELOG.md:37`](../../CHANGELOG.md#L37)
