# Stage 7 — Open Question Resolutions + Tier 3 MAJOR Item Closure

> Phase 5 prep artifact. Resolves all open questions across Tier 1 + Tier 2 specs and
> formally closes the 4 Tier 3 MAJOR items flagged in `02-phase-4-closeout.md` §4.3.
> Date: 2026-09-15
> Author: Mimir (Phase 5) — derived via judgement-call from lockdown, foundation, master
> PRD, and 17 feature PRDs.

---

## Status

- **Tier 1 open questions resolved:** 16 / 16
- **Tier 2 open questions resolved:** 35 / 35
- **Total resolved:** 51 / 51
- **Tier 3 MAJOR items closed:** 4 / 4 (via PRDs 011, 012, 014, 015)

---

## Tier 1 open questions — resolutions

### `citizen-status-timeline.md` §15

#### Q1 — Should `TechnicianEnRoute` be a separate event from `TechnicianArrived`?

**Decision:** Keep `TechnicianEnRoute` as a separate event type. It is in the 33-event
enum per Scenario 06's `CitizenVisibleEventType` table. If removed in future, the row
simply won't render; row is best-effort.

**Rationale:** Scenario 06 explicitly enumerates this. Removing it is a breaking change
to the citizen-visible surface. Out of scope for Stage 7.

**Binding:** PRD-001-REQ-002 (event filter set).

---

#### Q2 — Band label wording on `TrustBandAssigned` for citizens

**Decision:** Use plain-language labels per foundation §1.1: "verified citizen anchor" /
"verified reporter" / "hotline-sourced report". i18n keys in
`web/src/i18n/locales/en/citizenStatusTimeline.json` and `bn/`. Bangla-first binding
per lockdown §11.2.

**Rationale:** Lockdown §11.2 binding + foundation §1.1 + §11 i18n already locked this.

**Binding:** PRD-001-REQ-003 (Bangla-first locale default).

---

#### Q3 — Should the ActionCall show in the empty state?

**Decision:** No. ActionCall hidden when no `IncidentResolvedByAdmin` event exists
(nothing to act on). Empty state lives on the timeline page; no separate `/citizen/new`
route.

**Rationale:** Spec choice is already documented; deferred question collapses to the
spec choice.

**Binding:** PRD-001-REQ-004 (closure tap conditional rendering).

---

#### Q4 — Auto-poll for live updates, or refresh on mount?

**Decision:** Poll on focus + on visibility change. No true live polling in Phase 1.

**Rationale:** Phase 4.5 product decision; out of scope for Phase 1.

**Binding:** Implicit in PRD-001 (no live-polling requirement declared).

---

#### Q5 — Reopen within 30 days — does the window slide?

**Decision:** No. The window is anchored to the original `IncidentResolvedByAdmin`
event timestamp. A reopen at day 29 starts a new ack cycle anchored to the reopen
event, not the original closure.

**Rationale:** Spec is explicit; the reopen produces a fresh ack window so the citizen
can confirm the reopen-resolution, not the original closure. This matches Scenario 03
arc and avoids the citizen being stuck in a closing-state limbo.

**Binding:** PRD-012-REQ-006 (silent-closure reopen UI after 30-day expiry).

---

### `hotline-intake-modal.md` (Remaining open questions)

#### Q1 — Should the modal capture the caller's preferred language?

**Decision:** No. Not a Phase 1 requirement. Caller-language tracking deferred to
Phase 2 PHA dashboard.

**Rationale:** Spec explicitly marks as deferred; not a Phase 1 demo bar requirement.

**Binding:** Out of scope (PRD-002 has no language field requirement).

---

#### Q2 — Auto-routing of T1 hotline incidents

**Decision:** T1 hotline incidents do NOT jump priority sort above higher-band work
in progress. Modal relies on the inbox sort to honor this contract; behavioural
contract re-confirmed at Stage 7.

**Rationale:** Scenario 01 lockdown #1 (priority-first / age-second) explicitly binds
this. No modal logic required.

**Binding:** PRD-002-REQ-004 (outcome branching); PRD-004-REQ-002 (sort).

---

#### Q3 — Escaping accent / non-Bangla character handling

**Decision:** Out of scope for spec. Smoke test required before Phase 1 demo bar.
Recommendation: use UTF-8 NFC normalisation for storage; do not trim Unicode.

**Rationale:** Standard i18n best practice; not Phase 1 design concern.

**Binding:** Pre-demo smoke test (not a PRD requirement).

---

#### Q4 — Hotline call id generation

**Decision:** Generated client-side at modal mount. Re-opening after discard
intentionally starts a new lineage key. Current behaviour acceptable.

**Rationale:** Discard is a deliberate reset; a new lineage prevents stale
half-completed incidents from polluting the chain.

**Binding:** PRD-002-REQ-006 (UUID v7 mint helper).

---

### `per-incident-chain-segment.md` §17

#### Q1 — Web Worker for chains >50 events

**Decision:** Defer to Phase 2. Synchronous recomputation is acceptable for Phase 1
chain sizes (median ~10–20 events per incident).

**Rationale:** Phase 2 performance optimisation; not a Phase 1 requirement.

**Binding:** PRD-003-REQ-002 (helper reuse; no perf claim).

---

#### Q2 — Cross-tenant chain export

**Decision:** "Share with Pia" button is a placeholder. URL with HMAC + per-tenant
boundary is Phase 2.

**Rationale:** Scenario 06 explicitly defers this; Phase 1 ships the placeholder
button only.

**Binding:** Phase 2 (not in PRD-003).

---

#### Q3 — Phase 2 PHA dashboard integration

**Decision:** URL `/incidents/:incident_id/chain` is the stable contract. URL must
remain stable across Phase 1 → Phase 2.

**Rationale:** URL stability is the contract; Phase 2 will drill in from a different
route but consume the same path.

**Binding:** PRD-003-REQ-001 (route mount at `/incidents/:incident_id/chain`).

---

#### Q4 — Hash anchor truncation (8 chars + ellipsis)

**Decision:** Use 8 chars + ellipsis for at-a-glance identification. Full hash
available in expanded view.

**Rationale:** 8 chars (40 bits) is sufficient for at-a-glance disambiguation; full hash
visible on expand for verification.

**Binding:** PRD-003-REQ-008 (operator-mode render with full payloads).

---

#### Q5 — Anomaly escalation queue (Phase 2 placeholder)

**Decision:** Phase 1 logs `ChainAnomalyEscalated` to local log only. Phase 2 owns the
queue UI. Acceptable for demo bar.

**Rationale:** Scenario 06 deferral; Phase 1 demo bar has no Pia consumer.

**Binding:** PRD-003-REQ-006 (escalate routes to placeholder Phase 2 queue).

---

#### Q6 — i18n locale for hash anchors and event type names

**Decision:** Hash anchors and event type names are NOT translated. Technical
identifiers stay in English for citizen and operator surfaces.

**Rationale:** Foundation §10 binds technical identifiers as English-only. Bangla-first
citizens see localised labels but raw event type names remain English.

**Binding:** Foundation §10 (already locked); no PRD change required.

---

#### Q7 — Cache invalidation on new event

**Decision:** Invalidate the 60s verification cache on new chain event arrival
(5s chain-freshness poll, per foundation §3.1).

**Rationale:** A new block invalidates the previous verification; otherwise
verification can lie about state.

**Binding:** PRD-003-REQ-004 (60s cache; explicit invalidation on new event).

---

## Tier 2 open questions — resolutions

### `operator-dashboard.md`

#### Q1 — KPI row live data: page-owned polling or AppLayout shared context?

**Decision:** AppLayout owns chain-freshness polling (foundation §3.1). Page-owned
5s polling for incident list per foundation §8.2 (state-change crossfade).

**Rationale:** Foundation §3.1 already locks chain-freshness in AppLayout top-chrome.
Incident list polling is page-specific (operator motion pattern §8.2).

**Binding:** PRD-004-REQ-002 (sort is render-time; PRD-004 references foundation §8.2
implicitly via live update acceptance criteria).

---

#### Q2 — Auto-routed-tail chip count source

**Decision:** Derived slice from `useIncidents()` (filtered to
`reporter_kind: 'sensor'` + `band: 'T1'` + auto-routed flag). No separate endpoint.

**Rationale:** Avoids API surface bloat; derived slice is trivial client-side.

**Binding:** PRD-004-REQ-007 (auto-routed-tail chip from derived slice).

---

#### Q3 — Quick-dismiss role check

**Decision:** All operator roles can dismiss with reason. Default per spec. Karim
cannot dismiss from this page (only from field-queue); Karim never visits the
operator dashboard.

**Rationale:** Operator dashboard is operator-only by route guard; field tech
sees different surface.

**Binding:** PRD-004-REQ-008 (quick-dismiss emits `IncidentDismissed`; route guard
ensures utility_operator only).

---

#### Q4 — Layout toggle A/B/C persistence migration

**Decision:** A/B/C toggle is REMOVED in this WO (PRD-004-REQ-001). No migration
required; the `localStorage.surakkha.layout` key is unused post-WO.

**Rationale:** Toggle removed entirely; no future migration needed.

**Binding:** PRD-004-REQ-001 (status-board grid only, no A/B/C toggle).

---

#### Q5 — Reporter-badge chip placement (inline vs separate column)

**Decision:** Inline with band pill (compact row). Spec choice stands.

**Rationale:** Compact row matches 240px column constraint; separate column would
overflow on mobile.

**Binding:** PRD-004-REQ-004 (reporter-badge chip per row, independent of band pill).

---

#### Q6 — Polling layer's stale-data handling during user interaction

**Decision:** Pause polling while user has focus on a row or modal is open.
Resume on blur/modal close. Pause is per-page (not AppLayout-wide).

**Rationale:** Prevents visual disruption during critical user actions.

**Binding:** PRD-004 implicit (polling interaction-pause is page-owned behaviour,
documented in component).

---

### `inbox-detail.md`

#### Q1 — Single submit: gateway endpoint vs 4 separate events?

**Decision:** Single gateway endpoint `POST /api/incidents/:id/verify-and-assign`
(transactional). Backend persists 4 events atomically. Frontend fires single
network request; backend fans out to 4 chain events.

**Rationale:** Atomicity required; client-side 4-event fan-out risks partial
failure.

**Binding:** PRD-005-REQ-005 (single-click submit fires 4 events atomically).
PRD-005-REQ-013 (MSW batch handler — supports both gateway-fanout and client-batch
patterns).

---

#### Q2 — Path D escalation-path-template enum source

**Decision:** Fixed enum for Phase 1: `["WASA specialist", "PHA on call",
"councillor", "lab"]`. Phase 2 may populate from prior incidents.

**Rationale:** Phase 1 has no historical incident data to pull from; fixed enum
is appropriate.

**Binding:** PRD-005 i18n keys (`pathPicker.D` label); PRD-005-REQ-004 (path picker
A/B/C/D rendering).

---

#### Q3 — SMS queue when Anjali's phone is offline

**Decision:** SMS gateway queues regardless of phone state. Gateway-level concern,
not UI. Phone offline simply delays receipt.

**Rationale:** SMS is asynchronous by nature; gateway handles queuing.

**Binding:** Out of scope for PRD-005 (backend concern).

---

#### Q4 — Single-click verify: full-segment or row-level?

**Decision:** Row-level hash recomputation. Tier 1 spec `per-incident-chain-segment.md`
defines row-level.

**Rationale:** Per-row verification is faster and more targeted; full-segment
verification is a separate flow (verify-flow.tsx, PRD-017).

**Binding:** PRD-005-REQ-010 (single-click verification via helper); PRD-003
(row-level); PRD-017 (full-segment in standalone flow).

---

#### Q5 — Right rail collapse breakpoint

**Decision:** 1024px. Below 1024px, EventChain collapses to icon-only rail; above
1024px, full 360px panel.

**Rationale:** Common operator workstation width; matches AppLayout contract.

**Binding:** PRD-005-REQ-001 (three-column 240/flex/360); collapse behaviour
documented in component.

---

#### Q6 — Defer with callback: when does row re-surface?

**Decision:** Row re-surfaces at `callback_at` timestamp. Backend handles resurface
via event subscription; frontend reflects on next poll cycle (5s).

**Rationale:** Backend timestamp is canonical; client reflects via existing polling.

**Binding:** PRD-005-REQ-006 (defer emits `IncidentDeferred` with `callback_at`).

---

#### Q7 — Escalate to Pia: Phase 1 destination

**Decision:** Phase 1 routes to a local log file
(`POST /api/events` with `IncidentEscalatedToPha`; no Phase 1 queue UI). Phase 2
consumes the log to populate Pia's queue.

**Rationale:** Scenario 06 deferral; Phase 1 has no Pia surface.

**Binding:** PRD-005-REQ-007 (escalate emits `IncidentEscalatedToPha`).

---

### `field-queue.md`

#### Q1 — Offline-first layer location

**Decision:** Shared `useOfflineCache` hook in `web/src/lib/`. Used by all
Karim-side surfaces (FieldQueue, FieldIncidentDetail).

**Rationale:** DRY; field tech surfaces share offline concerns.

**Binding:** PRD-006 (acknowledges shared hook); explicit refactor is Phase 1.7+.

---

#### Q2 — Sync conflict resolution

**Decision:** `prev_block_hash` wins (Scenario 04). Client retries with server
`prev_block_hash` until accepted; on persistent conflict, surfaces manual reconcile
banner.

**Rationale:** Chain is source of truth (AD-1); server hash always wins.

**Binding:** Foundation §13 (chain is source of truth); backend handles retry,
UI surfaces manual reconcile only on persistent conflict.

---

#### Q3 — GPS detection interval (queue page)

**Decision:** GPS only fires on FieldIncidentDetail page mount (not queue page).
Queue page uses last-known location for distance estimates.

**Rationale:** Battery conservation; queue is overview-only, detail is where
on-site accuracy matters.

**Binding:** PRD-006-REQ-006 (geolocation watchPosition — page-level, not queue-level
polling).

---

#### Q4 — `due_at` countdown chip alert-red at OVERDUE

**Decision:** Status warning (overdue) uses `--color-status-warn` (amber), NOT
`--color-alert-red-reserved`. Carve-out is not needed because status warnings are
explicitly NOT issuance path per foundation §1.5.

**Rationale:** Foundation §1.5 reserves alert-red for issuance path only. Status
warnings use `--color-status-warn`. No carve-out required.

**Binding:** Foundation §1.5 (already locked); PRD-007-REQ-002 (due_at countdown
renders amber at overdue).

---

#### Q5 — Sensor prep mini-map when offline

**Decision:** Use last cached snapshot with "Last sync: HH:MM" caption.

**Rationale:** Standard offline-cache UX; caption makes staleness explicit.

**Binding:** PRD-006 implicit (shared offline cache hook).

---

#### Q6 — Reopened rows: `ProofInsufficient` metadata

**Decision:** Includes `reviewer: adi` metadata. Verbose metadata stands.

**Rationale:** Karim benefits from knowing who flagged his proof insufficient.

**Binding:** PRD-007 implicit (event payload includes reviewer metadata; UI displays
in reopen banner).

---

### `field-incident-detail.md`

#### Q1 — Step 2 GPS: auto-capture or explicit tap?

**Decision:** Auto-captured at submit (matches Scenario 04 locked #7). Explicit
"Mark arrived" button captures GPS at click time.

**Rationale:** Scenario 04 binding; explicit button gives Karim control over
arrival time vs auto-detection timing.

**Binding:** PRD-007-REQ-007 (Mark arrived captures current geolocation).

---

#### Q2 — Voice note STT location

**Decision:** Server-side STT (Phase 2). Phase 1 has no voice input.

**Rationale:** STT is Phase 2 capability.

**Binding:** Phase 2 (out of PRD-007 scope).

---

#### Q3 — Sensor readback reference (Step 3 field 5)

**Decision:** Manual entry. Karim reads from on-site display or his phone.

**Rationale:** Spec choice stands; manual entry is intentional to ensure Karim
confirms the actual on-site reading.

**Binding:** PRD-007-REQ-004 (diagnosis form structured fields; sensor readback is
optional input).

---

#### Q4 — Confirmation banner duration

**Decision:** Persist until navigation. Matches Scenario 04 locked #9 — "Your role on
this incident is complete."

**Rationale:** Persistent banner is a deliberate signal of role-completion;
auto-dismiss would undermine the closure beat.

**Binding:** PRD-007-REQ-006 (toast confirms "Proof submitted — awaiting review";
banner persists).

---

#### Q5 — Reopen panel: `dispatched_back_to: karim` metadata

**Decision:** Yes. Verbose metadata stands.

**Rationale:** Karim benefits from knowing the dispatch path.

**Binding:** Implicit (event payload structure; UI surfaces in reopen banner).

---

#### Q6 — Photo EXIF preservation

**Decision:** HTML `<input type="file" capture>` + gateway receives verbatim file.
No client-side re-encode.

**Rationale:** EXIF preservation is load-bearing for verification; re-encode
strips metadata.

**Binding:** PRD-007-REQ-003 (photo capture with auto-EXIF, verbatim file).

---

#### Q7 — 2-column layout on tablet+

**Decision:** Defer to Phase 1.x. Phase 1 ships mobile-first single-column.

**Rationale:** Tablet+ is Phase 1.7+; Karim mobile is the priority surface.

**Binding:** Phase 1.7+ (out of PRD-007 scope).

---

#### Q8 — Three-section page on desktop (≥1280px)

**Decision:** Defer to Phase 1.x. Phase 1 ships mobile-first single-column.

**Rationale:** Same as Q7.

**Binding:** Phase 1.7+ (out of PRD-007 scope).

---

### `audit-log.md`

#### Q1 — `ChainRead` emission cadence

**Decision:** Debounced 300ms on filter change. Spec choice stands.

**Rationale:** 300ms is the standard debounce window; prevents excessive events
on rapid chip toggling.

**Binding:** PRD-008-REQ-004 (filter change emits ChainRead with filter_combo).

---

#### Q2 — Per-role authorization windows

**Decision:** Karim = own assignments only; Priya = inbox + ward; Adi = all in her
queue. Backend enforces; UI filters reflect role-scoped fetch.

**Rationale:** Phase 1 backend contract; UI is downstream of API scope.

**Binding:** PRD-008-REQ-001 (route role guard); backend contract documented in
000-tech-audit.md §8.

---

#### Q3 — Per-incident segment drill-down URL

**Decision:** New URL `/incidents/:incident_id/chain` (Tier 1 spec `per-incident-chain-segment.md`).

**Rationale:** Standalone page is a Phase 1 surface; matches WO-003.

**Binding:** PRD-008-REQ-008 (link to WO-003 page).

---

#### Q4 — Anomaly banner persistence

**Decision:** Persistent until acknowledged. Matches `per-incident-chain-segment.md`
locked #7.

**Rationale:** Persistent banner is the operator signal that the chain needs
attention; acknowledgement closes it.

**Binding:** PRD-008-REQ-007 (anomaly surfacing with persistent banner).

---

#### Q5 — Single-click verify: full-segment or row-level?

**Decision:** Row-level (per `per-incident-chain-segment.md`). Same as InboxDetail Q4.

**Rationale:** Consistent verification granularity across surfaces.

**Binding:** PRD-008-REQ-010 (inline verify via helper, row-level).

---

#### Q6 — Export CSV/PDF

**Decision:** Phase 1 stubs only. Phase 2 export tooling owns the real exports.

**Rationale:** Out of scope for Phase 1 demo bar.

**Binding:** Phase 2 (out of PRD-008 scope; deferred export debt).

---

#### Q7 — `TrustBandOverridden` row affordance

**Decision:** Expand inline (matches InboxDetail right rail).

**Rationale:** Consistent affordance across surfaces.

**Binding:** Implicit (matches PRD-005-REQ-009 override surface pattern).

---

#### Q8 — Filter chip dropdown autocomplete source

**Decision:** Actor: `GET /api/actors?role=<role>`. Incident id: from `GET /api/incidents`
list. Event type: hardcoded enum (27 approved event types).

**Rationale:** Server-side autocomplete for actor prevents stale client state;
incident list is already paginated; event type is bounded enum.

**Binding:** PRD-008-REQ-002 (filter chips with autocomplete).

---

## Tier 3 MAJOR items — closure

### MAJOR #1 — SubmitReportPage: replace T1/T2/T3 dropdown with plain-language

**Status:** ✅ CLOSED via PRD-011.

**Resolution path:** PRD-011-REQ-002 (plain-language category picker, no T1/T2/T3 on
this surface) + PRD-011-REQ-009 (reconciliation acceptance: grep 'T1\|T2\|T3' in
user-facing strings returns zero hits).

**Files:** `docs/E-Development/011-submit-report.xml`

---

### MAJOR #2 — CitizenAckPage: add VS15 + glyph characters + ack-window expiry

**Status:** ✅ CLOSED via PRD-012.

**Resolution path:** PRD-012-REQ-002 (VS15 + glyph characters render correctly) +
PRD-012-REQ-003 (ack-window expiry visible, silent after expiry) +
PRD-012-REQ-010 (reconciliation acceptance: VS15 codepoint + glyph chars + window
expiry surfaced).

**Files:** `docs/E-Development/012-citizen-ack.xml`

---

### MAJOR #3 — Settings Reset → ghost variant + confirmation modal

**Status:** ✅ CLOSED via PRD-014.

**Resolution path:** PRD-014-REQ-005 (Reset uses ghost variant + confirmation modal;
emits `SettingsReset{actor}`) + PRD-014-REQ-009 (reconciliation acceptance: ghost
variant class + modal copy match).

**Files:** `docs/E-Development/014-settings.xml`

---

### MAJOR #4 — Styleguide: 3-band docs → 5-band + remove Danger button misuse

**Status:** ✅ CLOSED via PRD-015.

**Resolution path:** PRD-015-REQ-002 (5-band docs: T0/T1/T2/T3/resolved) +
PRD-015-REQ-003 (Danger variant only in reserved context; misuse demo removed) +
PRD-015-REQ-009 (reconciliation acceptance: 5-band test + Danger misuse test).

**Files:** `docs/E-Development/015-styleguide.xml`

---

### MAJOR #5 (counting artifact)

The closeout document §4.3 lists 4 MAJOR items but text says "5 MAJOR items flagged".
This is a counter artifact; all 4 explicitly listed items are closed above. The
discrepancy is the count, not a missing item.

---

## Summary table

| Source | Open questions | Resolved | Notes |
|---|---|---|---|
| `citizen-status-timeline.md` §15 | 5 | 5 | |
| `hotline-intake-modal.md` §Remaining | 4 | 4 | |
| `per-incident-chain-segment.md` §17 | 7 | 7 | |
| **Tier 1 subtotal** | **16** | **16** | |
| `operator-dashboard.md` §Open | 6 | 6 | |
| `inbox-detail.md` §Open | 7 | 7 | |
| `field-queue.md` §Open | 6 | 6 | |
| `field-incident-detail.md` §Open | 8 | 8 | |
| `audit-log.md` §Open | 8 | 8 | |
| **Tier 2 subtotal** | **35** | **35** | |
| **Total** | **51** | **51** | |

---

## Decisions deferred beyond Phase 1 (preserved as open in Phase 2)

These resolutions explicitly defer to Phase 2; preserved as known-open for Phase 2:

| Source | Question | Phase 2 surface |
|---|---|---|
| citizen-status-timeline Q4 | Live polling | Phase 2 PHA dashboard |
| hotline-intake-modal Q1 | Caller-language field | Phase 2 PHA dashboard |
| per-incident-chain-segment Q1 | Web Worker for chains >50 events | Phase 2 perf |
| per-incident-chain-segment Q2 | Cross-tenant chain export | Phase 2 PHA |
| per-incident-chain-segment Q5 | Anomaly escalation queue UI | Phase 2 PHA |
| inbox-detail Q2 | Path D enum from history | Phase 2 |
| inbox-detail Q7 | Phase 1 Pia surface | Phase 2 PHA |
| field-incident-detail Q2 | Voice note STT | Phase 2 |
| field-incident-detail Q7-Q8 | 2-column / 3-section desktop | Phase 1.7+ |
| field-queue Q1 | Shared `useOfflineCache` hook refactor | Phase 1.7+ |
| audit-log Q6 | Export CSV/PDF | Phase 2 export tooling |

---

_Last updated: 2026-09-15_
_Phase 5 Stage 7 complete; ready for Stage 9 ready-for-build handoff._
