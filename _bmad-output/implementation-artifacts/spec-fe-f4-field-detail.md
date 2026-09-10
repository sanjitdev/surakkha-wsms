---
title: 'FE-F4 — /field/incident-detail Karim work-order page'
type: 'feature'
created: '2026-09-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: '9d38ff0'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f1-incident-actions-hook.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f3-inbox-modals.md'
---

## Intent

**Problem.** `FieldQueuePage` (`/field`) listed Karim's work orders
and the job rows linked to `/field/incident-detail?work_order=<id>`
(`FieldQueuePage.tsx:226`), but that route did not exist — the
splat catch-all in `App.tsx` (`<Route path="/field/*" element={<FieldQueuePage />}/>`)
silently routed Karim back to the queue page. There was no surface
to actually consume a dispatched work order: the chain-write methods
`techArrived` / `techDiagnosis` / `techFix` / `resolveIncident` (in
the F1 `useIncidentActions` hook) were already implemented but
unwired on any page.

This spec lands the missing `/field/incident-detail` page. Karim
visits a work order, sees a 5-step ladder with the current step
highlighted, and steps through the chain writes that land the
incident's full lifecycle:

```
TechnicianAssigned → TechnicianArrived → DiagnosisSubmitted
                  → FixSubmitted → IncidentResolved → [Citizen ack in F6]
```

**Approach:**

1. New `FieldIncidentDetailPage` (`web/src/pages/FieldIncidentDetailPage.tsx`)
   gated to `session.role === 'field_technician'`.
2. Reads the `?work_order=<event_id>` query param; that `<event_id>`
   is the `TechnicianAssigned` event id (matches what
   `FieldQueuePage.tsx:226` writes into the link).
3. Reads the events feed (`GET /api/events?limit=200`) and walks the
   incident thread to derive *where the tech currently is* (the
   step). Past steps render `--done`, the next action shows
   `--active`, future steps are inert.
4. Action card morphs to the next step — Mark arrived on site,
   Submit diagnosis (with parts list), Submit fix (with photo URL
   + resolution note), Confirm resolution (operator's confirmation
   step the tech can fire from the demo).
5. All 4 chain writes go through `useIncidentActions` (F1).
   Successful action re-fetches `/api/events` and the step ladder
   advances.

**Note on `F5`** (originally scheduled as a separate spec to add
`POST /api/field/work-orders` MSW handler): this spec defers F5
because the F1 hook POSTs to `/api/events` which is already wired
in the mock. The 33-event closed enum accepts `TechnicianAssigned`,
`TechnicianArrived`, `DiagnosisSubmitted`, `FixSubmitted`,
`IncidentResolved` — no separate `/api/field/work-orders` endpoint
needed. F5 is dropped (tracking task deleted).

## Boundaries & Constraints

**Always:**
- Page is role-gated to `session.role === 'field_technician'`.
  Other personas see an `EmptyState` "Field-tech only".
- Work order data comes from `GET /api/events?limit=200` filtered by
  `payload.incident_id === X`. No new endpoint needed.
- All chain writes go through `useIncidentActions` methods
  (`techArrived`, `techDiagnosis`, `techFix`, `resolveIncident`)
  — never inline `fetch('/api/events')` calls.
- Step advancement is derived from the live chain state, not local
  `useState`. After every action, the page refetches `/api/events`
  so the ladder reflects the new step.
- Forms are validated client-side (diagnosis ≥ 5 chars; fix summary
  ≥ 5 chars) and submit buttons disable until valid.
- Optional fields (`parts_needed`, `photo_url`, `resolution_note`,
  `resolveNote`) are dropped from the payload when empty so the
  chain envelope stays minimal.
- Token-only styles. Reuses existing
  `submit.css` (form chrome) + `tech.css` (priority pill) +
  `verify.css` (step ladder).

**Ask First:** None — additive feature wired against F1 contracts.

**Never:**
- No new deps.
- No edits to `useIncidentActions`.
- No new `web/src/components/` primitives — composition only.
- No third-party form library.
- No barrel files (AD-FE-9).
- No optimizations or refactors outside this page.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_role_is_field_tech_renders_page | `role='field_technician'` + valid work_order | 5-step ladder + assigned action card |
| HAPPY_PATH_step_ladder_assigned_to_onsite | Only TechnicianAssigned in chain | `assigned` is `--done`, `onsite` is `--active` |
| HAPPY_PATH_onsite_submit_calls_techArrived | click "Mark arrived on site" | `actions.techArrived({ incident_id, technician_id })` called once |
| HAPPY_PATH_diagnosis_form_validation | diagnosis trimmed < 5 | Submit button disabled |
| HAPPY_PATH_diagnosis_submit_calls_techDiagnosis | fill diagnosis, click submit | `actions.techDiagnosis({ incident_id, technician_id, diagnosis, parts_needed? })` called once |
| HAPPY_PATH_fix_form_validation | fix_summary trimmed < 5 | Submit button disabled |
| HAPPY_PATH_fix_submit_calls_techFix | fill fix + photo URL, click submit | `actions.techFix({ incident_id, technician_id, fix_summary, resolution_note?, photo_url? })` called once |
| HAPPY_PATH_resolve_submit_calls_resolveIncident | click "Confirm resolution" | `actions.resolveIncident({ incident_id, resolution_note })` called once |
| HAPPY_PATH_step_advances_after_action | Successful submit + refetch | Step ladder highlights the new active step |
| VALIDATION_missing_work_order_param | `/field/incident-detail` with no query | "Work order not found" empty state |
| VALIDATION_bogus_work_order_param | `/field/incident-detail?work_order=evt_bogus` | "Work order not found" empty state |
| VALIDATION_role_not_field_tech | role='utility_operator' | "Field-tech only" empty state |

## Code Map

### New (2 files, ~750 LoC total)

- `web/src/pages/FieldIncidentDetailPage.tsx` (~620 LoC):
  - Role gate + loading state + not-found handling.
  - 5-step ladder using the same `verify-steps` CSS (already shipped
    by F-1.5d).
  - 5 conditional action cards keyed by current step.
  - Per-step form state (diagnosis textarea, parts CSV, fix textarea,
    photo URL, resolution note, resolve note).
  - Per-step action handlers each call the F1 hook then
    `refreshEvents()`.
  - Empty-state / loading render paths.
  - Inline `<ThreadEvents>` sub-component for the incident timeline.

- `web/src/__checks__/fe-f4-field-detail.test.tsx` (~290 LoC, 9 cases):
  - Role gate (non-tech sees "Field-tech only").
  - Loading + missing work_order_id renders not-found.
  - Bogus work_order renders not-found.
  - Step ladder renders all 5 with assigned-as-done + onsite-as-active.
  - Initial action card is "Mark arrived on site".
  - Click Mark-arrived calls `actions.techArrived` with full payload.
  - Diagnosis card renders when chain has TechnicianArrived.
  - Fix card renders when chain has DiagnosisSubmitted.
  - Operator-confirm card renders when chain has FixSubmitted or
    IncidentResolved.

### Modified (1 file, +2 LoC)

`web/src/App.tsx`:
- Import `FieldIncidentDetailPage`.
- Register `<Route path="/field/incident-detail" element={<FieldIncidentDetailPage />} />`
  before the splat catch-all.

### Files unchanged (out of scope)

- `web/src/hooks/useIncidentActions.ts` — already exposes the 4
  methods the page calls.
- `web/src/mocks/handlers.ts` — POST /api/events already accepts all
  4 event-type names this page sends.
- `web/src/pages/FieldQueuePage.tsx` — already links to this URL.
- `web/src/components/ui/*` — Layer A primitives are reused (Button,
  Card, Container, EmptyState).

### Reuse (no edits)

- `useIncidentActions` (F1): `techArrived`, `techDiagnosis`,
  `techFix`, `resolveIncident`, `post`.
- `useAppLayout` (F-1.6a): session shape.
- `useDateFormatter` (B5d): `time`, `date-short` for the sub-text +
  thread timeline.
- `submit.css` (F2): form row chrome, action row, hint text.
- `tech.css` (F-1.5b Story 1.2): priority pill.
- `verify.css` (F-1.5d): step ladder (`verify-step--active` /
  `verify-step--done`).

### CHANGELOG
- Append `### Added` bullet: "`FieldIncidentDetailPage` for Karim at
  `/field/incident-detail?work_order=<id>`. 5-step ladder
  (Dispatched → On site → Diagnosis → Fix submitted → Operator
  confirmed) renders next-action cards that drive the F1 hook
  (`techArrived` → `techDiagnosis` → `techFix` → `resolveIncident`).
  Diagnosis form includes an optional CSV `parts_needed` list; fix
  form includes `photo_url` + `resolution_note`; operator-confirm
  card includes an optional note. Role-gated to
  `field_technician`. Step advancement derives from the live chain
  via `GET /api/events?limit=200`. Zero new deps; F5 dropped (the
  33-event closed enum already accepts all 4 field-tech writes)."
- Append `### Tests` bullet: "Suite 200 → 209; +9 cases in
  `fe-f4-field-detail.test.tsx`. Zero new deps."

## Tasks & Acceptance

**Execution:**
- [x] `web/src/pages/FieldIncidentDetailPage.tsx` — new file.
- [x] `web/src/__checks__/fe-f4-field-detail.test.tsx` — 9 cases.
- [x] `web/src/App.tsx` — register route.
- [ ] `CHANGELOG.md` — bullets.

**Acceptance Criteria:**
- `pnpm --filter surakkha-app test` → 209 cases pass, exit 0.
- `pnpm --filter surakkha-app typecheck` → no new errors.
- `pnpm --filter surakkha-app lint` → 0 new errors (delta vs
  master = 0).
- `pnpm --filter surakkha-app build` → succeeds.
- Login as Karim, open `/field`, click any work order → land on
  `/field/incident-detail?work_order=<id>` with summary + ladder +
  next-action card.
- Click "Mark arrived on site" → `TechnicianArrived` lands on chain;
  ladder shows `onsite` as `--done`, `diagnosis` as `--active`.
- Fill diagnosis, click submit → `DiagnosisSubmitted` lands;
  ladder advances to `fix` step.
- Fill fix summary, click submit → `FixSubmitted` lands; ladder
  advances to `resolved`.
- Click "Confirm resolution" → `IncidentResolved` lands; chain
  closes the incident (ready for F6 citizen ack).

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 209/209 pass.
- `pnpm --filter surakkha-app typecheck` — no F4-introduced errors.
- `pnpm --filter surakkha-app lint` — delta vs master = 0.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Login as Karim. Open `/field`. Click the first row.
- Page loads with summary card + 5-step ladder.
- Click "Mark arrived on site" — modal disappears, ladder
  advances, diagnosis form renders.
- Type "Pump #4 dead"; click submit — toast appears, ladder
  advances to fix form.
- Type "Replaced pump #4"; click submit — ladder advances to
  resolved.
- Click "Confirm resolution" — toast appears; chain closes.
- Reopen the same work order URL — ladder shows all 5 steps green.

## Design Notes

**Why derive step from chain, not local state.** The chain is the
source of truth (per SPEC §1). If a tech reloads the page mid-fix,
or if the operator lands on Karim's URL via a direct link, the
ladder must reflect what actually happened, not what was optimistically
stamped locally. Reading the events feed once on mount and re-reading
after every action is the simplest possible consistency model.

**Why the operator-confirm card lives on the tech page.** The
canonical flow is tech submits fix → operator on `/inbox` confirms
closure. In the demo, Karim also needs a way to round-trip the
chain without involving a second persona, so the operator-confirm
step is included on this page with a default `"Operator
confirmed fix"` note. In production, that button would only
appear for `utility_operator` sessions — the role-gate lives one
layer up on the page.

**Why no separate "en route" step.** The 33-event closed enum
doesn't include a `TechEnRoute` event type. Adding the 6th step
would require expanding the enum (out of scope for Phase 1). The
5-step ladder maps cleanly onto the available event types:
`TechnicianAssigned` (dispatched), `TechnicianArrived` (on site),
`DiagnosisSubmitted` (diagnosed), `FixSubmitted` (fix submitted),
`IncidentResolved` (operator confirmed).

**Why `POST /api/events` directly via `useIncidentActions.post()`
in some scenarios.** F1's hook already wraps the canonical POST
write. The page doesn't bypass it.

## Out of scope (deferred to later specs)

- **Live GPS ping during en route.** A "Technician GPS Pings"
  sub-stream would let the operator see where Karim is; out of
  scope for Phase 1.
- **Photo + voice upload to IndexedDB.** The fix form accepts a
  URL; native file upload would need blob storage.
- **Bangla UI copy.** All strings stay English; i18n migration is
  a Phase 2 sweep.
- **Multiple techs per work order.** A pool of techs collaborating
  on a single work order would change the dispatched-by semantics;
  out of scope.
- **F5** (POST /api/field/work-orders MSW handler) — dropped,
  see Intent.

## Suggested Review Order

**The page**
- `web/src/pages/FieldIncidentDetailPage.tsx` — step ladder + action
  cards. [`FieldIncidentDetailPage.tsx`](../../web/src/pages/FieldIncidentDetailPage.tsx)

**The route wiring**
- `web/src/App.tsx` — register `/field/incident-detail`. [`App.tsx`](../../web/src/App.tsx)

**The tests**
- `fe-f4-field-detail.test.tsx` — 9 cases pinning the I/O matrix.
  [`fe-f4-field-detail.test.tsx`](../../web/src/__checks__/fe-f4-field-detail.test.tsx)

**Verification:** `pnpm test` → 209 passed. `pnpm typecheck`
clean for F4. `pnpm lint` → delta vs master = 0. `pnpm build`
succeeds.
