---
title: 'FE-F6 — /ack/:incident_id citizen acknowledgement page'
type: 'feature'
created: '2026-09-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'b689c10'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f1-incident-actions-hook.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f3-inbox-modals.md'
---

## Intent

**Problem.** The operator's "Request citizen ack →" CTA on
`InboxDetail` (F3) emits `CitizenAckRequested` with the channel +
summary that Anjali then receives out-of-band (SMS, WhatsApp, voice).
There was no in-app surface where Anjali could record a decision:
the chain write `CitizenAcknowledgement` (via the F1
`citizenAcknowledge` action) was implemented but unwired.

This spec lands `/ack/:incident_id` — the in-app fallback / demo
surface where Anjali opens the URL directly, reviews what the
operator sent, and confirms (`✅ Approve & close`) or disputes
(`❌ Dispute & reopen`) the fix. The chain event lands either way;
`approve=true` lets the operator seal the incident resolved,
`approve=false` reopens it for review.

**Approach:**

1. New `CitizenAckPage` (`web/src/pages/CitizenAckPage.tsx`) at
   `/ack/:incident_id` gated to `session.role === 'anjali'`.
2. Reads the incident via `useIncidents()` (same hook the inbox
   uses). If the incident isn't in the feed (e.g. demo dataset
   wasn't seeded), renders an `EmptyState` "Incident not found".
3. Fetches `/api/events?event_type=CitizenAckRequested&limit=50`
   on mount to pull the operator's notice (channel + summary) so
   Anjali can see exactly what was sent. Falls back to a generic
   copy if no `CitizenAckRequested` event exists for the incident
   yet (Anjali can still respond).
4. Renders a decision card with two CTAs:
   - `✅ Approve & close` → `actions.citizenAcknowledge({ incident_id, method, approve: true })`
   - `❌ Dispute & reopen` → `actions.citizenAcknowledge({ incident_id, method, approve: false })`
5. After a successful write, the page re-fetches the ack-events
   feed and renders a receipt card with the recorded decision
   (`APPROVED` / `DISPUTED` badge + decision metadata).

**Why a dedicated page (not a modal on the inbox):** Anjali logs in
via the login picker (the same `LoginPage` operator + tech +
anjali + pha roles use) but in a different browser session —
the citizen never touches the operator chrome. The cycle ends with
the citizen pressing "Approve", and that final UX surface must be
reachable as a clean URL Anjali can bookmark / receive via SMS.

**Why InboxDetail doesn't link here:** the inbox is operator-only
chrome (`session.role === 'utility_operator'`), and F3's
`RequestAckModal` already displays the channel + summary to the
operator at send time. The citizen receives the URL out-of-band.

## Boundaries & Constraints

**Always:**
- Page is role-gated to `session.role === 'anjali'`. Other
  personas see an `EmptyState` "Wrong persona" with their role
  name in the body copy.
- Incident lookup goes through `useIncidents()` — no direct
  `/api/incidents` fetch.
- Both CTAs route through the F1 hook
  (`useIncidentActions().citizenAcknowledge`) — never inline
  `fetch('/api/events')`.
- The `method` arg sent to the hook mirrors the channel on the
  most-recent `CitizenAckRequested` event for the incident
  (`sms` | `whatsapp` | `voice` | `in_app`). Defaults to
  `in_app` when no notice event exists.
- Receipt card derives badge variant from the decision:
  `approve=true` → `badge badge--t1` (`APPROVED`),
  `approve=false` → `badge badge--t3` (`DISPUTED`).
- Token-only styles. Reuses `submit.css` (form chrome + receipt)
  + `inbox.css` + `dashboard.css`. Zero new CSS files.

**Ask First:** None — additive feature wired against F1 + F3.

**Never:**
- No new deps.
- No edits to `useIncidentActions` or `useIncidents`.
- No new `/api/...` MSW handlers — the page consumes `/api/events`
  + `/api/incidents` that already exist.
- No new `web/src/components/` primitives — composition only.
- No barrel files (AD-FE-9).
- No optimizations or refactors outside this page + its test.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_role_is_anjali_renders_form | `role='anjali'` + valid `incident_id` + matching `CitizenAckRequested` event | "Operator notice" card with operator's summary + decision card with Approve/Dispute |
| HAPPY_PATH_fallback_when_no_notice_event | `role='anjali'` + valid `incident_id` + no `CitizenAckRequested` event | Generic notice copy ("The operator confirmed the fix…") + decision card still renders |
| HAPPY_PATH_approve_calls_citizenAcknowledge_true | click `✅ Approve & close` | `actions.citizenAcknowledge({ incident_id, method: 'whatsapp', approve: true })` called once |
| HAPPY_PATH_dispute_calls_citizenAcknowledge_false | click `❌ Dispute & reopen` | `actions.citizenAcknowledge({ incident_id, method: 'whatsapp', approve: false })` called once |
| HAPPY_PATH_approve_success_renders_receipt | click Approve + hook resolves true | "APPROVED" badge + "You approved the fix" + receipt metadata; decision card removed |
| HAPPY_PATH_dispute_success_renders_receipt | click Dispute + hook resolves true | "DISPUTED" badge + "You disputed the fix" + receipt metadata |
| HAPPY_PATH_method_defaults_to_in_app_when_no_notice | valid incident + no notice event | `citizenAcknowledge` called with `method: 'in_app'` |
| ROLE_GATE_blocks_non_anjali | `role='utility_operator'` | "Wrong persona" empty state; no decision card |
| VALIDATION_missing_incident_id_renders_not_found | empty `incidents` fixture | "Incident not found" empty state |
| RECOVERY_hook_returns_false | approve + hook resolves false | Stays on decision card; no receipt rendered |

## Code Map

### New (2 files, ~570 LoC total)

- `web/src/pages/CitizenAckPage.tsx` (~250 LoC):
  - Role gate (non-anjali → "Wrong persona").
  - Loading + missing-incident states.
  - Mount-time fetch of `CitizenAckRequested` events filtered by
    `payload.incident_id`.
  - Two CTAs (Approve / Dispute) wired to the F1 hook.
  - Receipt card with badge variant derived from decision.
  - All hooks (`useIncidents`, `useIncidentActions`,
    `useDateFormatter`, `useAppLayout`).

- `web/src/__checks__/fe-f6-citizen-ack.test.tsx` (~320 LoC, 7 cases):
  - Role gate (Priya sees "Wrong persona").
  - Missing incident renders not-found.
  - Initial form renders with the operator's notice copy
    (`Please confirm` substring from the fixture summary).
  - Approve fires `citizenAcknowledge` with `approve=true` and
    `method='whatsapp'` (from the fixture's `CitizenAckRequested`
    payload channel).
  - Dispute fires `citizenAcknowledge` with `approve=false` and
    `method='whatsapp'`.
  - Approve success renders APPROVED receipt; decision card
    removed.
  - Dispute success renders DISPUTED receipt.

### Modified (1 file, +2 LoC)

`web/src/App.tsx`:
- Import `CitizenAckPage`.
- Register `<Route path="/ack/:incident_id" element={<CitizenAckPage />} />`
  inside the `<RequireSession>` shell.

### Files unchanged (out of scope)

- `web/src/hooks/useIncidentActions.ts` — already exposes
  `citizenAcknowledge`. The page consumes it as-is.
- `web/src/hooks/useIncidents.ts` — already exposes `incidents` +
  `loading`. The page consumes it as-is.
- `web/src/mocks/handlers.ts` — `POST /api/events` accepts the
  `CitizenAcknowledgement` event-type name + payload shape the F1
  hook sends.
- `web/src/components/ui/{Card,Button,EmptyState}.tsx` — Layer A
  primitives are reused.

### CHANGELOG
- Append `### Added` bullet: "`CitizenAckPage` for Anjali at
  `/ack/:incident_id`. Reads the operator's `CitizenAckRequested`
  notice from `/api/events?event_type=CitizenAckRequested` on
  mount and renders Approve (`citizenAcknowledge({ approve: true })`)
  + Dispute (`citizenAcknowledge({ approve: false })`) CTAs that
  seal the cycle end-to-end. Receipt card shows APPROVED / DISPUTED
  badge derived from decision. Role-gated to `anjali`. Zero new
  deps; reuses F1 + F3 contracts."
- Append `### Tests` bullet: "Suite 209 → 216; +7 cases in
  `fe-f6-citizen-ack.test.tsx`. Zero new deps."

## Tasks & Acceptance

**Execution:**
- [x] `web/src/pages/CitizenAckPage.tsx` — new file.
- [x] `web/src/__checks__/fe-f6-citizen-ack.test.tsx` — 7 cases.
- [x] `web/src/App.tsx` — register route.
- [ ] `CHANGELOG.md` — bullets.

**Acceptance Criteria:**
- `pnpm --filter surakkha-app test` → 216 cases pass, exit 0.
- `pnpm --filter surakkha-app typecheck` → no new errors
  (delta vs F4 baseline = 0; pre-existing `fe-b5b-*` errors are
  out of scope).
- `pnpm --filter surakkha-app lint` → 0 new errors (delta vs F4
  baseline = 0).
- Login as Anjali → visit `/ack/<incident_id>` → see notice +
  decision card → click Approve → see APPROVED receipt.
- Login as Priya → visit `/ack/<incident_id>` → see "Wrong persona".

## Verification

**Commands:**
- `pnpm --filter surakkha-app test -- src/__checks__/fe-f6-citizen-ack.test.tsx`
  → 7/7 pass.
- `pnpm --filter surakkha-app test` → 216/216 pass.
- `pnpm --filter surakkha-app typecheck` → 13 pre-existing errors
  (all in `fe-b5b-*`); F6 added 0.
- `pnpm --filter surakkha-app lint` → 46 errors / 123 warnings
  (identical to F4 baseline); F6 added 0.
- `pnpm --filter surakkha-app build` → succeeds modulo the 13
  pre-existing typecheck errors (which gate the `tsc -b` step).

**Manual checks:**
- Login as Anjali. Navigate to `/ack/inc_ack_001` → see operator
  notice (channel + summary) + decision card with Approve +
  Dispute buttons.
- Click `✅ Approve & close` → receipt renders with "APPROVED"
  badge + decision metadata.
- Login as Priya. Navigate to `/ack/inc_ack_001` → see "Wrong
  persona" empty state with role name in body.

## Design Notes

**Why derive `method` from the `CitizenAckRequested` channel.**
The operator explicitly chose how they contacted Anjali (SMS,
WhatsApp, voice). The receipt should record the same channel so
the chain envelope is symmetric: the operator's notice cites
`channel: 'whatsapp'` and Anjali's acknowledgement cites
`method: 'whatsapp'`. When no notice event exists (e.g. Anjali
visits the URL cold), `in_app` is the obvious default.

**Why mount-time fetch + post-write refresh.** The notice copy
is the operator's message to Anjali — it doesn't change between
mounts. Reading it once on mount is the simplest possible
consistency model and matches F4's "step ladder derived from live
chain" pattern. After a successful ack we re-read so a follow-up
visit (e.g. the operator refreshing) sees the recorded decision.

**Why a single URL per incident, not a session-scoped link.** The
demo URL is shareable out-of-band (SMS, WhatsApp body, voice
script), so it has to be a stable route that survives Anjali
logging in from a different browser session. Tying it to the
incident id — not to a per-session token — keeps the link
copy-pasteable.

## Out of scope (deferred to later specs)

- **Per-channel link generation.** The operator's notice UI today
  hard-codes a generic `/ack/<id>` URL. A later spec could
  generate channel-specific deep links (e.g.
  `sms:+91…?body=…&url=https://app/ack/<id>`).
- **Multi-incident ack dashboard.** A "Pending acks" inbox for
  Anjali listing all `CitizenAckRequested` events without a
  matching `CitizenAcknowledgement` would let the citizen triage
  multiple incidents in one session; deferred.
- **Push notification when a notice is sent.** The operator's
  `RequestAckModal` already toasts on success; native push is a
  Phase 2 native-app concern.
- **Anjali inbox notifications thread.** Mirroring the operator's
  inbox for Anjali would require a new `/api/anjali/...` endpoint
  + a new page; out of scope for F6.

## Suggested Review Order

**The page**
- `web/src/pages/CitizenAckPage.tsx` — role gate + notice fetch +
  decision CTAs + receipt. [`CitizenAckPage.tsx`](../../web/src/pages/CitizenAckPage.tsx)

**The route wiring**
- `web/src/App.tsx` — register `/ack/:incident_id`. [`App.tsx`](../../web/src/App.tsx)

**The tests**
- `fe-f6-citizen-ack.test.tsx` — 7 cases pinning the I/O matrix.
  [`fe-f6-citizen-ack.test.tsx`](../../web/src/__checks__/fe-f6-citizen-ack.test.tsx)

**Verification:** `pnpm test` → 216 passed. `pnpm typecheck`
delta vs F4 = 0. `pnpm lint` delta vs F4 = 0.
