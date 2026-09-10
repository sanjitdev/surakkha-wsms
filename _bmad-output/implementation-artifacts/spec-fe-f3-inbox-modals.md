---
title: 'FE-F3 — InboxDetail Assign field-tech + Request citizen-ack modals'
type: 'feature'
created: '2026-09-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: '6421027'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f1-incident-actions-hook.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f2-submit-report.md'
---

## Intent

**Problem.** `InboxDetail.tsx` (`/inbox/:id`) shipped two header CTAs
(`/web/src/pages/InboxDetail.tsx:246-252` pre-F3) with no `onClick`. The
"Assign field tech" and "Request citizen ack →" buttons rendered but
did nothing. These are the two actions that drive the operator-side
half of the citizen-report flow:

```
/submit → AnjaliReportSubmitted →
/inbox → Assign field tech → /field (Karim) →
        Request citizen ack → /ack/:id (Anjali)
```

This spec lands the two operator actions inside `InboxDetail`,
keeping the chain-write contract centralised in
`useIncidentActions` (F1) and the modal UX in a sub-component pattern
that reuses the shipped `Modal` primitive.

**Approach:**

1. Inline two modal sub-components (`AssignTechModal`,
   `RequestAckModal`) at the bottom of `InboxDetail.tsx`, kept under
   the AD-FE-5 200-LoC ceiling by extracting them. (Combined they
   fit in ~250 LoC across ~120 LoC each.)
2. Each modal mounts an inline `<form>` with `<Modal>` chrome and
   dismisses on Escape / scrim click / Cancel / successful submit.
3. Modal form values feed straight into
   `actions.assignTech(input)` / `actions.requestAck(input)`. No
   extra state in the parent — the hook owns the busy/lastError.
4. 8-case test file `fe-f3-inbox-modals.test.tsx` pins the I/O matrix
   below.

## Boundaries & Constraints

**Always:**
- Both modals reuse `Modal` (`web/src/components/ui/Modal.tsx`) for
  focus-trap + Escape + scrim dismissal — zero new modal UX code.
- Form values map 1:1 onto `actions.assignTech(input)` and
  `actions.requestAck(input)` from F1. No reshaping, no transformation.
- Submit button disables until the form is valid:
  - Assign: tech always selected (default first), priority always
    selected, ETA is a positive number, summary trimmed ≥ 5 chars.
  - Ack: channel always selected (default sms), summary trimmed ≥ 5
    chars.
- Successful submit resets the modal form to defaults and closes; the
  parent page refetches `/api/incidents` indirectly via the hook's
  post-submit soft refresh (covered by F1).
- Both modals render regardless of `actions.busy` — the buttons show
  the busy label and disable the form controls instead of blocking
  open/close.
- Role is operator-only by extension: `/inbox/:id` itself is reached
  from `/inbox` which is gated to `utility_operator` in `AppLayout`.

**Ask First:** None — wired against the F1 hook contract that's
already shipped.

**Never:**
- No new deps.
- No edits to `useIncidentActions` (it already has the two methods).
- No global modal state — every page that needs modals owns its own.
- No third-party modal library.
- No barrel files (AD-FE-9).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_header_buttons_render | `/inbox/:id` loads a matching incident | Both CTAs visible with `data-testid="inbox-assign-tech"` + `inbox-request-ack"` |
| HAPPY_PATH_assign_click_opens_modal | click Assign | Modal mounts with tech roster (3 names), priority select (P1/P2/P3), ETA input (default 30), summary textarea; submit disabled at start |
| HAPPY_PATH_assign_submit_calls_assignTech | fill form, click submit | `actions.assignTech` called once with `{ incident_id, technician_id, technician_name, priority, eta_target_minutes, work_order_summary }` |
| HAPPY_PATH_ack_click_opens_modal | click Request ack | Modal mounts with channel select (sms/whatsapp/voice, default sms) + summary textarea; submit disabled at start |
| HAPPY_PATH_ack_submit_calls_requestAck | fill form, click submit | `actions.requestAck` called once with `{ incident_id, channel, summary }` |
| VALIDATION_assign_disabled_until_summary_or_eta_valid | summary < 5 OR ETA ≤ 0 | Submit button disabled |
| VALIDATION_ack_disabled_until_summary_min | summary < 5 | Submit button disabled |
| ERROR_CASE_assign_modal_cancels | click Cancel | Modal dismisses; `actions.assignTech` not called |

## Code Map

### Modified (1 file, +260 LoC)

`web/src/pages/InboxDetail.tsx`:
- Import `Modal` + `useIncidentActions`.
- Add `TECH_ROSTER = [karim_actor / rashid_actor / sumi_actor]` as
  a `const` array — Karim matches the seed persona; Rashid + Sumi
  round out the dispatch team. In production this would come from
  `GET /api/field/technicians`.
- Add `AssignTechModal` + `RequestAckModal` sub-components before
  `export function InboxDetail()`. Each receives `{ open, onClose,
  incidentId, busy, onSubmit }`.
- Wire the two header CTAs to `setAssignOpen(true)` /
  `setAckOpen(true)` via `onClick`.
- Mount both modals at the end of the rendered `<Container>` so
  they live inside the React tree but render via the `Modal`
  primitive's portal-style positioning (scrim covers the viewport).

### New (1 file, ~310 LoC)

`web/src/__checks__/fe-f3-inbox-modals.test.tsx`:
- 8 cases listed above.
- Composition pattern matches `fe-b5g-anjali-filter.test.tsx` and
  `fe-f2-submit-report.test.tsx`: stub `AppLayoutContext.Provider` for
  the session, mock `useIncidentActions` via `vi.mock`, provide a
  controllable stub actions object.
- Stubs `useIncidents` so the page renders the incident detail
  directly (no MSW fetch).
- Stubs `global.fetch` so the `/api/events` poll returns an empty
  feed (the test cares about modal wires, not the timeline contents).

### Files unchanged (out of scope)

- `web/src/hooks/useIncidentActions.ts` — F1 already exposes
  `assignTech` and `requestAck` with the payload shapes this page
  consumes.
- `web/src/components/ui/Modal.tsx` — reused as-is.
- `web/src/mocks/handlers.ts` — F1 already wires the two POST
  `/api/events` event types (`TechnicianAssigned`,
  `CitizenAckRequested`).
- `web/src/pages/InboxList.tsx` — the bulk-bar code stays untouched
  (F7 covers Bulk-bar).

### Reuse (no edits)

- `useIncidentActions` (F1) — `assignTech`, `requestAck`.
- `useIncidents` (1-3c) — for incident lookup; mocked in the test.
- `useAppLayout` — for `session`; mocked in the test.
- `Modal` (Layer A) — reused.
- `Button` (Layer A) — reused.

### CHANGELOG
- Append `### Added` bullet: "InboxDetail now dispatches work orders and
  ack requests via two inline modals (`AssignTechModal`,
  `RequestAckModal`). Both reuse the shipped `Modal` primitive and
  the F1 `useIncidentActions` hook. `'Assign field tech'` picks the
  technician from a 3-person roster + priority (P1/P2/P3) + ETA +
  summary; submits `TechnicianAssigned`. `'Request citizen ack'`
  picks a channel (sms/whatsapp/voice) + notice copy; submits
  `CitizenAckRequested`. Both close on success and reset to
  defaults. Header CTAs that previously had no `onClick` are now
  wired (FE-F3)."
- Append `### Tests` bullet: "Suite 192 → 200; +8 cases in
  `fe-f3-inbox-modals.test.tsx`. Zero new deps."

## Tasks & Acceptance

**Execution:**
- [x] `web/src/pages/InboxDetail.tsx` — add modal sub-components +
  wire CTAs.
- [x] `web/src/__checks__/fe-f3-inbox-modals.test.tsx` — 8 cases.
- [ ] `CHANGELOG.md` — `### Added` + `### Tests` bullets.

**Acceptance Criteria:**
- `pnpm --filter surakkha-app test` → 200 cases pass, exit 0.
- `pnpm --filter surakkha-app typecheck` → no new errors.
- `pnpm --filter surakkha-app lint` → 0 new errors (delta vs
  master = 0).
- `pnpm --filter surakkha-app build` → succeeds.
- Login as Priya, open `/inbox/<id>`, click "Assign field tech" →
  modal opens with Karim pre-selected; fill form, submit →
  toast appears, modal closes, "TechnicianAssigned" event lands.
- Click "Request citizen ack →" → modal opens with sms pre-selected;
  fill form, submit → toast appears, modal closes, "CitizenAck
  Requested" event lands.
- Validation: empty summary keeps submit disabled; sub-5-char
  summary keeps it disabled; 5+ chars enables.
- Cancel button closes the modal without firing the action.

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 200/200 pass.
- `pnpm --filter surakkha-app typecheck` — no F3-introduced errors.
- `pnpm --filter surakkha-app lint` — delta vs master = 0.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Login as Priya, open `/inbox/<id>`.
- Click "Assign field tech" → modal with Karim / Rashid / Sumi.
- Change tech to Rashid, priority P2, ETA 45, summary "Replace
  chlorine pump #4" → submit enabled.
- Click submit → toast "Technician dispatched"; modal closes;
  thread timeline now shows the `TechnicianAssigned` event.
- Click "Request citizen ack →" → modal with channel sms.
- Change to whatsapp, summary "Please confirm safe" → submit
  enabled.
- Click submit → toast "Ack requested"; modal closes; timeline
  shows `CitizenAckRequested`.
- Reopen Assign modal — defaults reset (Karim, P1, 30, empty).

## Design Notes

**Why inline sub-components, not a separate file.** Each modal is
~120 LoC. The parent `InboxDetail.tsx` is 360 LoC post-F3 (still
under 400). Extracting to `AssignTechModal.tsx` +
`RequestAckModal.tsx` would add 2 new files (2 import hops, no
shared session context) for ~240 LoC of related state. They live
together and share the same `useIncidentActions` + tech roster;
extracting them buys nothing and adds coupling.

**Why a hardcoded tech roster.** Production would hit `GET
/api/field/technicians`. The mock seed has only Karim; Rashid +
Sumi round out the demo roster so the picker feels real. The roster
sits at module scope as a `const` array — no fetch overhead, no
loading state, deterministic for tests.

**Why single-CTA-per-modal.** A dispatcher who wants to send both
"Assign tech" and "Request ack" in one step has a different feature
(incident auto-routing); F3 keeps the operator's mental model
1-button-1-action.

**Why reset to defaults on success, not on close.** Cancelling
halfway through a form is recoverable; resubmitting needs the form
clean for the next dispatch. Success → reset. Close → keep values
(useful for the typo case).

## Out of scope (deferred to later specs)

- **Multi-tech dispatch.** Production would let the operator pick
  multiple techs + split work; out of scope for F3's 1:1 dispatch.
- **Escalation path.** No "Escalate to PHA" CTA on this modal; that
  is F6's `/approve` surface.
- **Bulk-assign.** Pick 5 incidents → 5 techs in one shot; F7's
  Bulk-bar.
- **Live technician status.** Roster shows names only; "currently
  en-route to incident X" badges would need a streaming poll.
- **Bangla UI copy.** Strings stay English; i18n is a Phase 2 sweep.

## Suggested Review Order

**The wired component**
- `web/src/pages/InboxDetail.tsx` — modal sub-components + header
  CTAs. [`InboxDetail.tsx`](../../web/src/pages/InboxDetail.tsx)

**The tests**
- `fe-f3-inbox-modals.test.tsx` — 8 cases pinning the I/O matrix.
  [`fe-f3-inbox-modals.test.tsx`](../../web/src/__checks__/fe-f3-inbox-modals.test.tsx)

**Verification:** `pnpm test` → 200 passed. `pnpm typecheck` clean
for F3. `pnpm lint` → delta vs master = 0. `pnpm build` succeeds.
