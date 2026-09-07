---
title: Surakkha v1 — Phase 1 Epic Breakdown
status: final
created: 2026-09-07
updated: 2026-09-07
stepsCompleted: [1, 2, 3, 4]
scope: Phase 1 MVP — single-city Dhaka, four personas, end-to-end incident lifecycle
validationPasses:
  - rule: Phase 1 boundary (only Phase-1-in-scope FRs and ADs land in stories)
    verdict: PASS
  - rule: Architecture implementation (chain is the spine; no separate status column)
    verdict: PASS
  - rule: Story quality (19 stories, all independent, all Given/When/Then, all single-dev doable)
    verdict: PASS
  - rule: Epic structure (5 value-bounded epics; minimal file churn across epic boundaries)
    verdict: PASS
  - rule: Trust-scoring completeness (cluster window + sensor cross-check + reporter-reputation all land in Epic 2)
    verdict: PASS
  - rule: Citizen-loop completeness (✅ / ❌ → reopened branch lands in Epic 5)
    verdict: PASS
  - rule: Persona completeness (4 personas — Sensor, Anjali, Admin, Operator — all on stage)
    verdict: PASS
companions:
  - ../../_bmad-output/planning-artifacts/workflow-phase1.html
  - ../../_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
  - ../../_bmad-output/specs/spec-surakkha-v1/SPEC.md
inputDocuments:
  - ../../_bmad-output/specs/spec-surakkha-v1/SPEC.md
  - ../../_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
deferredToPhase2:
  - PHA regulator persona (Story 6.1, 6.2 in old breakdown)
  - Public notice / Ramesh channel (Story 7.1)
  - Dual-signature attestation (AD-11)
  - Simulator harness (FR-3.3, FR-3.7, AD-13)
  - Multi-tenancy beyond single Dhaka tenant
  - World Bank evidence export tooling (FR-6.6)
  - Multi-radio fallback (cellular / LPWAN / SD-card tiers)
  - Phone-as-network for ward sentinels
  - Hybrid incentive (BDT 2,000/month stipend + ICDDR,B credential)
  - Right-to-be-forgotten tombstones (AD-16) — kept in spec for Phase 2
  - Councillor trust-bridging voice
---

# Surakkha v1 — Phase 1 Epic Breakdown

> **Phase 1 scope.** Single-city Dhaka, four personas (Sensor, Anjali, Admin, Operator), end-to-end incident lifecycle from detection through verified closure. The chain is the audit trail and the source of state. Trust scoring pre-triages reports before any admin sees them; the admin overrides, not re-triages. Citizens confirm or dispute closure through a tap that reopens the incident with full lineage.
>
> **Out of scope (Phase 2).** Documented in §10 of the workflow visualization and in the `deferredToPhase2` frontmatter above. Anything in those lists is **not in Phase 1 code**.
>
> **Source-of-truth hierarchy.** Spec kernel (`SPEC.md` + 7 companions) > Architecture spine (`ARCHITECTURE-SPINE.md`, adopted as companion) > this epic breakdown > the workflow visualization (`workflow-phase1.html`). Epics decompose spec FRs/NFRs and architecture ADs into implementable Phase 1 stories.

## Phase 1 at a glance

- **4 personas** on stage: Sensor, Anjali, Admin, Operator. The System is a non-persona trust actor that runs the cluster window, sensor cross-check, and reputation lookup.
- **15 first-class chain events** (11 gate events + 4 trust signals).
- **5 epics, 19 stories**, end-to-end.
- **12 states** including 4 terminal branches (`closed`, `rejected_false_alarm`, `rework_requested`, `reopened`).
- **7 SLAs** at every gate, auto-escalation wired at the gateway.
- **The system pre-triages; the admin overrides.** Trust signals (T1–T11) flow into a 5-minute cluster window, a sensor cross-check, and a reporter-reputation lookup before any admin sees a report. Admin's verify step becomes a 5-second "agree or override the trust band" decision instead of a 5-minute triage.
- **Citizen-confirmed closure.** When Anjali gets the closure notification, she taps ✅ or ❌. ❌ triggers `IncidentReopened{parent}` on the chain — the closure is reversed, not silently lost.

## Persona map

| Persona | Lane | Role |
|---|---|---|
| **Sensor** | source | Auto-detects contamination above threshold. Cellular radio in Phase 1. Manual injection path for demo. |
| **Anjali** (school operator) | source | Submits reports — voice, photo, text, GPS — in Bangla primary, English fallback. No login, no training app, no dashboard. |
| **Admin** | decision | Verifies (overrides the trust band, doesn't re-triage), assigns operator, verifies resolution, closes. |
| **Operator** (field operator) | action | Acks, dispatches team, submits resolution proof (photo + GPS + timestamp). |
| **System** *(non-persona)* | trust | Runs cluster window (5 min), cross-checks with sensor, looks up reporter reputation, computes trust band, auto-routes notifications, monitors SLAs. |

## Story map

| # | Story | Epic | Maps to trust mechanism / event |
|---|---|---|---|
| 1.1 | Single-gateway content-addressed chain writes | 1 | AD-1, AD-14 |
| 1.2 | RBAC defense-in-depth with closed Phase 1 role enum | 1 | AD-6, AD-12 (5-entry Phase 1 enum) |
| 1.3 | Idempotency by (tenant_id, event_id) | 1 | AD-14, R5 sensor-silence as chain event |
| 2.1 | Sensor cellular ingestion path | 2 | T1, T2 |
| 2.2 | Anjali submission path with photo + voice + GPS + EXIF | 2 | T5, T6, T7, T8 |
| 2.3 | 5-minute cluster window for cross-report corroboration | 2 | M5, T3 |
| 2.4 | Sensor cross-check (co-witness signal) | 2 | M4, T1, T2 |
| 2.5 | Reporter-reputation lookup + trust band assignment | 2 | M1, M3, T4, T9, T10, T11 |
| 2.6 | Trust-banded IncidentCreated + admin inbox routing | 2 | M1 (high/medium/low buckets) |
| 3.1 | Trust-band inbox with bulk-triage bucket | 3 | M1 |
| 3.2 | Acknowledge + review-and-decide (override the band) | 3 | M1, R2 (rejection payload schema) |
| 3.3 | Operator assignment with structured due_at + recommended team size | 3 | R3 (OperatorAssigned payload) |
| 3.4 | Rework request with structured failure_code | 3 | R4 (ReworkRequested payload) |
| 4.1 | Operator ack receipt with auto-escalation timer | 4 | OperatorAckReceived, SLABreached |
| 4.2 | Field team dispatch logging with team_id + vehicle + ETA | 4 | FieldTeamDispatched (renamed from TeamDispatched) |
| 4.3 | Resolution proof submission with photo + GPS + timestamp | 4 | ResolutionSubmitted (tightened payload) |
| 5.1 | Resolution verify (photo + GPS + timestamp check) | 5 | ResolutionVerified |
| 5.2 | Close + citizen confirm (✅/❌ tap → reopened) | 5 | IncidentClosed, IncidentReopened, citizen-confirmed loop |
| 5.3 | Per-incident audit timeline (chain-hash anchored) | 5 | Implicit — chain itself is the timeline |

---

## Epic 1: Trust Foundation

A regulator, an operator, or a court can verify that every event on the system — sensor readings, Anjali reports, admin verifications, operator dispatches, resolutions, closures, reopens — was captured, content-addressed, chained to its predecessor, written through a single gateway, scoped to one tenant city, and policy-controlled on read. RBAC checks happen at three layers. After this epic, no later epic needs to defend its own trust model; it just writes events through the gateway.

**Phase 1 FR coverage:** FR-1.1 (every audit-relevant event captured), FR-1.2 (single gateway), FR-1.4 (sensor silence logged). **Phase 1 AD coverage:** AD-1 (event store IS the audit chain), AD-4 (strict versioning + upcasters — schema-registry mechanism), AD-6 (RBAC defense-in-depth, 3 layers), AD-12 (closed role enum — Phase 1 trim: `{sensor, anjali, admin, operator, system}`), AD-14 (idempotency by `event_id`), AD-10 (internal + vendor-neutral observability with OpenTelemetry).

### Story 1.1: Single-Gateway Content-Addressed Chain with Per-Tenant Namespace

As a platform architect,
I want every audit-relevant event written through one gateway that produces content-addressed, hash-chained blocks scoped to a tenant city,
So that retroactive tampering is detectable, and every later component has a defensible write path.

**Acceptance Criteria:**

**Given** tenant `dhaka` is provisioned
**When** any component submits an event `{tenant_id, schema_version, event_type, event_id, occurred_at, ingested_at, actor_identity, correlation_id, causation_id, payload}` to the gateway
**Then** the gateway validates `tenant_id` is present and matches the active session's tenant scope (missing → `CommandRejected{reason: "missing tenant_id"}` before any persistence)
**And** the gateway assigns the next block in the chain with `prev_block_hash` and a new `block_hash = sha256(canonical(header || event))`
**And** no component writes to operational storage directly — the gateway is the only component that may depend on storage

**Given** a chain has been built for tenant `dhaka`
**When** the chain-integrity monitor runs every N minutes (N ≤ 60)
**Then** it recomputes the hash chain forward and back from a checkpoint
**And** any mismatch raises a `ChainVerificationFailed` event into the operational stream and a high-severity alert

**Given** an event schema is v1 and a v2 is published (Phase 2 — mechanism is in Phase 1, dual-signature requirement comes later)
**When** the version bump happens
**Then** projections reading v1 events upcast them inline via per-version upcaster functions
**And** the chain itself never migrates (no rewrite of past events)
**And** the schema-registry mechanism is wired in Phase 1; the dual-signature schema-bump event is Phase 2

### Story 1.2: RBAC Defense-in-Depth with Closed Phase 1 Role Enum

As a platform architect,
I want permission checks at three layers (gateway / service boundary / data-access) with a closed Phase 1 enum for `actor_identity.role`,
So that the gateway rejects free-form role strings or self-minted actor references, and the demo personas stay scoped.

**Acceptance Criteria:**

**Given** the RBAC policy matrix for tenant `dhaka` defines the Phase 1 role enum `{sensor, anjali, admin, operator, system}` (closed per AD-12 — `pha_approver`, `councillor`, and `utility_message_desk` are Phase 2)
**When** an authenticated principal submits an event
**Then** the gateway validates the principal's session token, resolves `actor_identity.ref` from the session, and refuses events whose `actor_identity.role` is outside the closed enum
**And** the gateway rejects events whose `actor_identity.ref` is not bound to a live auth-session reference at write time (`CommandRejected{reason: "actor_ref not session-bound"}`)

**Given** the gateway receives an event
**When** the event reaches a service boundary inside any component
**Then** the component performs a second-layer permission check verifying the role is permitted for this event_type
**And** on rejection, the component emits `CommandRejected` with the typed reason; no raw exception crosses the boundary

**Given** a component queries storage directly (e.g., a projection rebuild job)
**When** the query executes
**Then** the data-access layer applies a third permission check filtered by `tenant_id` and the requesting role's allowed scopes
**And** the query result is rejected if it would cross-tenant; the rejection is logged as `CrossTenantAccessAttempted`

### Story 1.3: Idempotency by `(tenant_id, event_id)` + Sensor-Silence-as-Event

As a platform architect,
I want every event idempotent by `(tenant_id, event_id)` and sensor silence recorded as a chain event (not silent drop),
So that mobile reconnect storms don't produce duplicate incidents, and "no signal" stays in the audit trail.

**Acceptance Criteria:**

**Given** an Anjali-mobile client (or sensor adapter) retries submitting the same logical event after a connectivity drop
**When** the retry arrives at the gateway with the same `(tenant_id, event_id)` as a previously accepted event
**Then** the gateway rejects the retry with `DuplicateEventRejected` (silent dedup is forbidden — the chain must show the attempt)
**And** the client receives the rejection and surfaces a stable state (no retry storm)

**Given** adapters mint `event_id` at user-acknowledged submission time
**When** the user re-tries the same logical event
**Then** the same `event_id` is reused (the client tracks logical event identity, not network attempt identity)

**Given** a sensor has not reported within a configurable threshold (Phase 1 default: 30 minutes)
**When** the sensor-silence monitor detects the silence
**Then** it emits a `SensorSilenceObserved` event to the audit chain with `sensor_id`, `tenant_id`, `last_observed_at`, `silent_since`
**And** the chain shows silence as a recorded event, not maintenance noise

---

## Epic 2: Source Ingestion & Trust Scoring

A sensor detects, or Anjali submits, a report — and the system turns it into an incident without anyone driving anywhere to verify. The 5-minute cluster window holds the report and watches for matching reports in the same ward; the sensor cross-check compares the report's GPS + timestamp + class against the latest sensor reading; the reporter-reputation lookup tags the user as trusted, new, or caution. The system then creates the incident with a trust band (high / medium / low) and routes it to the right inbox bucket. The pre-triage happens before any admin opens the report — the system does the triage, the admin does the override.

**Phase 1 FR coverage:** FR-2 (heterogeneous detection — Phase 1 trim: 2 inputs not 5), FR-4 (Anjali one-tap reporting — Phase 1 trim: cellular + form, no WhatsApp Business API or multi-radio), sensor-only auto-detection path. **Phase 1 AD coverage:** AD-2 (observation → incident — Phase 1 trim: 1 source type = sensor or Anjali report), AD-3 (sealed contract — Phase 1 emits two observables: `AnjaliReportSubmitted`, `SensorReadingSubmitted`).

### Story 2.1: Sensor Cellular Ingestion Path

As a platform operator,
I want sensors to deliver turbidity (NTU), conductivity, and chlorine-residual readings via cellular radio into the gateway as observation events,
So that the auto-detection path is wired and the audit chain has its first source type.

**Acceptance Criteria:**

**Given** a sensor is provisioned with `sensor_id`, `tenant_id = dhaka`, and a freshness threshold (Phase 1 default 30 min)
**When** the sensor submits a reading `{sensor_id, ntu, conductivity, chlorine_residual, observed_at, device_clock_skew_seconds}`
**Then** the gateway writes a `SensorReadingSubmitted` event with `actor_identity.role = sensor`, content-addressed `event_id`, and `tenant_id` from the device cert
**And** readings that exceed configured thresholds (defaults: NTU > 1.0, chlorine_residual < 0.2) auto-promote to a `SensorReadingSubmitted.threshold_exceeded = true` payload field that the Incident Aggregator picks up
**And** manual injection path: an admin can submit a `SensorReadingSubmitted` event for demo/test purposes, with `actor_identity.role = admin` carrying `{injected: true, reason}` payload field

**Given** a sensor has been offline beyond the freshness threshold
**When** the sensor-silence monitor tick runs
**Then** it emits `SensorSilenceObserved` per Story 1.3 — not silent

### Story 2.2: Anjali Submission Path (Voice / Photo / Text / GPS)

As Anjali (school operator),
I want a one-tap surface that lets me submit a report with voice, photo, or text, captures GPS and EXIF, and survives low-end Android + intermittent connectivity,
So that I can report a contamination in under 60 seconds even when my network is patchy.

**Acceptance Criteria:**

**Given** Anjali opens the form on a low-end Android (no login required)
**When** she taps the "report" affordance
**Then** the surface asks for: photo OR voice note OR free-text, plus auto-captured GPS, plus a self-classified category from `{bad_smell, discoloration, sick_person, visible_contamination, pipe_burst}`
**And** `family-bangla` is the primary font; `family-sans` is the fallback
**And** the form requires at least one of photo / voice / text (anti-abuse: priority queue routing requires evidence)

**Given** Anjali submits a report
**When** the submit happens
**Then** the client captures EXIF metadata from any photo (GPS, device, timestamp — `T6`)
**And** the client captures the recorded voice note's duration and device timestamp (`T7`)
**And** the client mints a stable `event_id` (ULID) at user-acknowledged submission time
**And** the report is queued offline-first if connectivity is unavailable; the queue persists across app restarts
**And** when connectivity returns, the report is delivered to the gateway within 60 seconds of online

**Given** Anjali submits a bare text-only report (no photo, no voice)
**When** the report reaches the gateway
**Then** the trust scorer tags it `evidence_minimum_not_met = true` and routes it to the bulk-triage bucket (Story 3.1), not the priority queue
**And** the client gets an honest acknowledgement: "We have your report. Because this is your first report and we don't have other matching signals, an admin will review it shortly." (per M2, credibility-weighted ETA)

### Story 2.3: 5-Minute Cluster Window for Cross-Report Corroboration

As the system,
I want to hold each new source event for 5 minutes and watch for matching reports in the same ward before notifying admins,
So that real incidents (which cluster) get high-band routing, and isolated reports (which often are false alarms) get bulk-triage routing without an admin having to sort them.

**Acceptance Criteria:**

**Given** a `SensorReadingSubmitted.threshold_exceeded = true` or `AnjaliReportSubmitted` lands in the system
**When** the cluster window starts
**Then** the window holds the event for 5 minutes (Phase 1 default; configurable)
**And** during the hold, the system watches for other source events within `ward_id` + 200m radius + same contaminant class
**And** if 2+ reports cluster in 5 minutes: trust band is auto-promoted to `high` and the match count is recorded in the trust-band payload (`{"clustered_match_count": N}`)

**Given** the 5 minutes elapse with no cluster match
**When** the window closes
**Then** the event proceeds with its base trust band (computed from Step 2.4 + Step 2.5 below)
**And** the chain shows the cluster-window duration as part of the trust-band payload (`{"cluster_window_seconds": N}`)

### Story 2.4: Sensor Cross-Check (Co-Witness Signal)

As the system,
I want every Anjali report cross-checked against the nearest sensor's latest reading,
So that admins see "sensor agrees" or "sensor disagrees" beside the report instead of having to look it up themselves.

**Acceptance Criteria:**

**Given** an Anjali report with `gps`, `observed_at`, and `contaminant_class` reaches the cluster window's end
**When** the cross-check runs
**Then** the system finds the nearest sensor within 500m (Phase 1 default) and looks up its latest reading within the last 30 minutes
**And** the cross-check emits `SensorCrossCheckComputed` with payload `{agreement: agrees_with_sensor | disagrees_with_sensor | no_signal, sensor_id, reading_ntu, age_seconds}`
**And** the agreement rule: if the sensor reading crossed the same-class threshold within ±15 minutes of the report → `agrees_with_sensor`; if the sensor reading was normal and within 30 minutes → `disagrees_with_sensor`; else → `no_signal`

**Given** the cross-check returns `agrees_with_sensor`
**When** the trust band is computed
**Then** the trust band gets a +1 bump (e.g., medium → high)

**Given** the cross-check returns `disagrees_with_sensor`
**When** the trust band is computed
**Then** the trust band gets a -1 bump (e.g., medium → low)

### Story 2.5: Reporter-Reputation Lookup + Trust Band Assignment

As the system,
I want every report tagged with a trust band (high / medium / low) and a reporter-rep badge (trusted / new / caution) computed from the report's history,
So that admin sees a triaged report, not raw signal — and a known reporter's good track record is automatically rewarded.

**Acceptance Criteria:**

**Given** an Anjali-mobile client with `reporter_id` submits a report
**When** the reputation lookup runs
**Then** the system queries the chain for prior `AnjaliReportSubmitted` events by this reporter and the corresponding `IncidentVerified` / `IncidentRejected` outcomes
**And** the lookup emits `ReporterReputationQueried` with payload `{prior_total, prior_verified_true, prior_verified_false, trust_band: high | medium | low, badge: trusted | new | caution}`
**And** the badge thresholds (Phase 1 defaults):
   - `trusted` — `prior_verified_true >= 5` and `prior_verified_false / prior_total < 0.1`
   - `caution` — `prior_verified_false >= 1` within last 30 days
   - `new` — everything else

**Given** multiple signals flow together
**When** the trust band is finalized
**Then** the system weighs: cluster match (Step 2.3, +1 high band if cluster ≥2), sensor cross-check (Step 2.4, ±1), reporter reputation (Step 2.5, +1 for trusted, -1 for caution), time of day (T9, -1 for 02:00–05:00), recent activity at exact GPS pin (T10, -1 if same pin was closed as false-alarm in last 24 hr), and evidence presence (T5/T6/T7, +1 if photo+EXIF or voice)
**And** the trust band is clamped to `{high, medium, low}` and persisted to the incident's `trust_band` field

**Given** a reporter accumulates 2+ verified-false reports in 30 days
**When** their next report lands
**Then** soft-throttle applies (A1): the report still goes through but auto-tags `bulk_triage_routed = true` and is excluded from the priority queue — not blocked, just de-prioritized

### Story 2.6: Trust-Banded Incident Creation + Admin Inbox Routing

As the system,
I want the source event to become a `IncidentCreated` carrying the trust band, and the admins to be routed into the bucket that matches the band,
So that the admin inbox is pre-sorted and the verify step becomes a 5-second decision.

**Acceptance Criteria:**

**Given** a `SensorReadingSubmitted.threshold_exceeded` or `AnjaliReportSubmitted` event has finished the cluster window, cross-check, and reputation lookup
**When** the Incident Aggregator creates the incident
**Then** it emits `IncidentCreated` with payload `{incident_id, source_event_id, ward_id, contaminant_class, trust_band: high | medium | low, badge?: trusted | new | caution, cluster_match_count, sensor_agreement}`
**And** `actor_identity.role = system`
**And** the chain shows the cluster window, cross-check, and reputation-lookup events as `causation_id` predecessors of `IncidentCreated`

**Given** `IncidentCreated` lands
**When** the inbox router runs
**Then**:
   - trust_band = `high` → admin's priority inbox (real-time)
   - trust_band = `medium` → admin's standard queue
   - trust_band = `low` → admin's bulk-triage bucket (separate queue, 30-second sweep UI)
**And** for each routed admin, `NotificationSent` fires (per projection — not silent)

---

## Epic 3: Admin Verification & Assignment

A real admin opens the inbox for their scope, picks an incident, and decides whether to verify it as real and assign an operator, or reject it as false alarm. Today's verify step is **review-and-decide**, not re-triage — the system has already clustered, cross-checked, and rated the reporter. Admin's job is to agree with or override the trust band. The bulk-triage bucket exists for the low-band reports that the system has de-prioritized, so the priority queue stays clean.

**Phase 1 FR coverage:** FR-5 (Priya ranked action list + verification — Phase 1 trim: single-actor verify, no deviation-with-reasoning review cycle, no auto-generated PHA monthly report). **Phase 1 AD coverage:** AD-7 (admin UI as a separate product), AD-2 (admin consumes the incident projection built in Epic 2).

### Story 3.1: Trust-Band Inbox with Bulk-Triage Bucket

As an admin,
I want a three-bucket inbox (high / medium / low) with the bulk-triage bucket showing me 30-second-sweep rows,
So that priority reports get my attention first and bulk-triage doesn't waste my cognitive load.

**Acceptance Criteria:**

**Given** `IncidentCreated` events land and `NotificationSent` fires for admins in scope
**When** an admin opens the inbox
**Then** the inbox shows three sections: Priority (high band, real-time), Queue (medium band), Bulk-triage (low band)
**And** priority and queue rows show: source type, ward, contaminant class, trust band badge, reporter-rep badge, cluster match count, sensor agreement, photo preview (if Anjali source)
**And** bulk-triage rows show: source type, ward, class, badge, cluster match count (compact view — admin scans and bulk-rejects false alarms without opening each one)

**Given** an admin opens a bulk-triage row
**When** she expands the row
**Then** she sees the full incident detail (same view as priority queue)

### Story 3.2: Acknowledge + Review-and-Decide (Override the Trust Band)

As an admin,
I want to acknowledge an incident (locking it to me) and then verify or reject it,
So that no other admin double-decides on the same incident, and the verify step is a 5-second "agree or override the trust band" decision.

**Acceptance Criteria:**

**Given** an admin opens an incident from any bucket
**When** she clicks "Acknowledge"
**Then** the gateway emits `IncidentAcknowledged` with `actor_identity = admin` carrying her session ref
**And** the incident is now locked to her — other admins see it as "in-progress by [name]" and cannot re-acknowledge
**And** the chain shows the lock event

**Given** the incident is acknowledged
**When** the admin reviews it
**Then** the detail view shows: source evidence (photo + GPS + timestamp + EXIF), the trust band's contributing factors (cluster match, cross-check, reputation), the auto-classified category, and the free-text or voice transcript
**And** she sees the trust band badge prominently; the UI prompts "Agree with `medium` band?" with one-click accept or reject

**Given** the admin agrees (verify)
**When** she clicks "Verify"
**Then** the gateway emits `IncidentVerified` with `actor_identity = admin`, `{admin_id, agreed_with_trust_band: true}` payload

**Given** the admin overrides the band
**When** she clicks "Reject (false alarm)" instead
**Then** the gateway emits `IncidentRejected` with `actor_identity = admin` and **structured payload**: `{reason_category: false_alarm | duplicate | already_resolved | out_of_scope, note: string (min 30 chars)}` (per R2 — note is stored immutably on chain; reason category makes the bulk-rejection mechanically auditable later)

### Story 3.3: Operator Assignment with Structured `due_at` + Recommended Team Size

As an admin,
I want to pick an operator from the on-call roster and assign the incident with a specific `due_at` and a recommended team size hint,
So that the operator has a clear deadline and the dispatch SLA is measurable.

**Acceptance Criteria:**

**Given** the admin clicks "Assign" on a verified incident
**When** the assign dialog opens
**Then** it shows the on-call operator list for the ward (Phase 1: a static list per ward for demo) and a recommended team-size hint (Phase 1 default: 2 for medium band, 3 for high band)
**And** the dialog auto-suggests a `due_at` based on the trust band (Phase 1 defaults: high = +2 hr, medium = +4 hr)

**Given** the admin selects an operator and confirms
**When** the assignment is committed
**Then** the gateway emits `OperatorAssigned` with structured payload `{operator_id, due_at: ISO8601, recommended_team_size: int, trust_band_at_assign}` (per R3)
**And** a `NotificationSent` fires to the operator's UI inbox + browser notification

### Story 3.4: Rework Request with Structured `failure_code`

As an admin,
I want to reject a resolution proof with a specific failure code,
So that the operator knows exactly what to redo (instead of "your proof wasn't good enough") and the rework reason is mechanically classifiable for tuning.

**Acceptance Criteria:**

**Given** an operator has submitted `ResolutionSubmitted` and the admin opens it for verification
**When** the admin clicks "Request rework"
**Then** the dialog asks for `failure_code` (enum: `photo_too_dark | note_unclear | wrong_site | insufficient_evidence`) plus a free-text note
**And** on confirm, the gateway emits `ReworkRequested` with structured payload `{failure_code, note}` (per R4)

**Given** the operator receives the rework
**When** she opens it in her UI
**Then** she sees the `failure_code` badge prominently and the admin's note
**And** a `NotificationSent` fires to the operator + Anjali (if the source was Anjali)

---

## Epic 4: Field Operator Execution

A real field operator receives an assigned incident, acknowledges it (auto-escalation if SLA breaches), dispatches a team (team ID + vehicle + ETA), and submits resolution proof (photo + GPS + device-clock timestamp). The operator lives on a deadline the admin set in Step 3.3 — and the SLA timer is visible.

**Phase 1 FR coverage:** FR-5.3 (playbook step execution — Phase 1 trim: each step logs to chain with reasoning; no deviation cluster, no version-of-record playbook yet, that's Phase 2). **Phase 1 AD coverage:** AD-7 (operator UI as a separate product).

### Story 4.1: Operator Ack Receipt with Auto-Escalation Timer

As a field operator,
I want to acknowledge receipt of an assigned incident and see the deadline timer visibly counting down,
So that I know what I'm responsible for and the system catches me if I miss the deadline.

**Acceptance Criteria:**

**Given** an operator receives `OperatorAssigned` + `NotificationSent`
**When** she clicks "Acknowledge"
**Then** the gateway emits `OperatorAckReceived` with `actor_identity = operator`, `{operator_id, ack_within_seconds: int}` payload
**And** the operator's UI now shows a visible countdown to `due_at` from Step 3.3

**Given** the operator does not acknowledge within the SLA (Phase 1 default 10 minutes)
**When** the SLA monitor tick runs
**Then** it emits `SLABreached{step: operator_ack, operator_id, expected_at}` to the chain (per A1, refactor — SLAs are on-chain now)
**And** the admin gets a `NotificationSent` flagging the breach
**And** the system auto-creates a new `OperatorAssigned{backup_operator_id}` event selecting the next on-call operator (Phase 1: round-robin from the ward list) — escalation happens in code, not in admin's hands

### Story 4.2: Field Team Dispatch Logging with Team ID + Vehicle + ETA

As a field operator,
I want to log dispatch details (team ID, vehicle, ETA) when I send a team to the site,
So that the audit trail shows who went where with what, and the Anjali source (if applicable) gets notified that a team is en route.

**Acceptance Criteria:**

**Given** the operator has acknowledged and is ready to dispatch
**When** she clicks "Dispatch team" and fills the dispatch dialog
**Then** the dialog asks: team_id (free text for Phase 1; ops-supplied identifier), vehicle (free text), eta_minutes (int)
**And** on confirm, the gateway emits `FieldTeamDispatched` (renamed from `TeamDispatched` per R1) with payload `{operator_id, team_id, vehicle, eta_minutes, dispatched_at}`
**And** a `NotificationSent` fires to the Anjali source's status feed (if the original submission was Anjali) and to the admin who assigned

### Story 4.3: Resolution Proof Submission with Photo + GPS + Timestamp

As a field operator,
I want to submit resolution proof with a photo, a GPS stamp, and a device-clock timestamp captured at the site (not the server clock),
So that the admin can verify the proof is portable back to the field — not a stock photo uploaded from the office.

**Acceptance Criteria:**

**Given** the operator has completed the field work
**When** she opens "Submit resolution" and fills the form
**Then** the form requires: photo (mandatory; EXIF must show GPS at site + device clock within ±5 minutes of submission time), free-text note (mandatory, min 20 chars), optional follow-up category
**And** the photo's EXIF is parsed client-side; if GPS or timestamp are missing or stale, the form rejects with "photo must be captured at the site just now"
**And** on submit, the gateway emits `ResolutionSubmitted` with payload `{operator_id, photo_event_id, gps_lat, gps_lng, device_clock_at_capture: ISO8601, server_clock_at_submit: ISO8601, note}`
**And** the payload shows the gap between device and server clock as `clock_skew_seconds` for auditability — the proof is anchored to the field, not the cloud

---

## Epic 5: Admin Closure & Citizen Loop

A real admin verifies the resolution proof, marks the incident closed, and the source (Anjali) gets a "your report is closed" notification with ✅ / ❌ taps. The ✅ tap is private positive feedback for her reputation count; the ❌ tap is the citizen-confirmed-closure-loop catch — it triggers `IncidentReopened{parent}` on the chain with full lineage preserved. The reopened incident re-enters the cycle at `acknowledged`. The audit timeline view shows the full story of any incident — original submission through to closure or reopen — anchored to chain hashes.

**Phase 1 FR coverage:** FR-5.6 (handover brief auto-generated — Phase 1 trim: per-incident audit timeline only, no city-wide auto-PHA-report). **Phase 1 AD coverage:** AD-7 (admin UI as a separate product).

### Story 5.1: Resolution Verify (Photo + GPS + Timestamp Check)

As an admin,
I want to verify a resolution by checking the proof photo's EXIF (GPS at site, recent timestamp) and reading the operator's note,
So that the verification is mechanical, not subjective.

**Acceptance Criteria:**

**Given** an operator has submitted `ResolutionSubmitted`
**When** the admin opens the resolution verify view
**Then** she sees: the resolution photo with EXIF metadata (GPS lat/lng, device clock at capture, EXIF device model), the operator's note, the time gap between dispatch and resolution, and the original incident detail (for context)
**And** the UI shows the EXIF GPS on a small map alongside the original incident's GPS — they should be within 50m
**And** the UI shows the clock_skew_seconds from the resolution payload — values > 300s get a "verify clock" warning

**Given** the admin agrees the resolution is real
**When** she clicks "Verify resolution"
**Then** the gateway emits `ResolutionVerified` with `actor_identity = admin`, `{admin_id, verified_resolution_payload_hash}` payload

**Given** the admin disagrees
**When** she clicks "Request rework" instead
**Then** Story 3.4 takes over (rework path)

### Story 5.2: Close + Citizen Confirm (✅ / ❌ Tap → Reopened)

As an admin,
I want to mark an incident closed and have the source receive a closure notification with ✅ / ❌ taps,
So that the citizen can confirm her report was resolved or flag that it wasn't — and the system catches the gap.

**Acceptance Criteria:**

**Given** the admin has verified a resolution
**When** she clicks "Close incident"
**Then** the gateway emits `IncidentClosed` with `actor_identity = admin`, `{admin_id, closed_at, citizen_loop_enabled: true}` payload
**And** the closed incident moves to the archive projection
**And** a `NotificationSent` fires to: the Anjali source (with the ✅ / ❌ tap UI), the operator who resolved, the admin who assigned

**Given** Anjali receives the closure notification
**When** she taps ✅
**Then** the client emits `ClosureConfirmed{parent_incident_id, confirmed_by_citizen: true}` to the chain (reputation +1)
**And** the notification UI shows "Thank you — your report mattered"

**Given** Anjali taps ❌ (still seeing the problem)
**When** the tap registers
**Then** the client emits `IncidentReopened` with `actor_identity.role = anjali` (per A3, citizen-confirmed closure loop), payload `{parent_incident_id, citizen_note: string}` (per R5)
**And** the reopened incident re-enters the chain at the `acknowledged` state — `reopened → acknowledged` is a state machine branch, not a new incident (the chain preserves lineage)
**And** the incident surfaces back in the admin's priority inbox (Phase 1 default: medium trust band — admin reviews and decides again)
**And** the chain shows the full story: original `IncidentCreated` → `IncidentVerified` → ... → `IncidentClosed` → `IncidentReopened{parent}` → `IncidentAcknowledged` (second time)

### Story 5.3: Per-Incident Audit Timeline (Chain-Hash Anchored)

As an admin (or any auditor),
I want to open any incident and see its full timeline of events anchored to chain hashes,
So that I can answer "what happened, when, by whom" without trusting anyone's reconstruction.

**Acceptance Criteria:**

**Given** an admin opens the audit timeline view for any incident
**When** the view renders
**Then** it shows every event on the chain that referenced this `incident_id`, in order, with: `event_type`, `actor_identity`, `occurred_at`, `block_hash` (truncated, mono-font), and a copy-to-clipboard button for the full hash
**And** the chain-integrity monitor's last-verified timestamp is shown ("chain verified intact as of [timestamp]")
**And** the timeline is read-only — no edits possible

**Given** the incident was reopened
**When** the timeline renders
**Then** `IncidentReopened{parent}` is shown with an explicit "→ re-enters at acknowledged" annotation
**And** the second-cycle events are visually grouped below an `── reopened ──` divider so the lineage stays readable

---

## Architecture decisions in scope for Phase 1

The architecture spine contributes ADs that govern implementation consistency in Phase 1. ADs marked **(deferred)** are described in the spine but their Phase 1 enforcement is limited to mechanism-only or moved entirely to Phase 2.

| AD | Phase 1 enforcement | Phase 2 adds |
|---|---|---|
| **AD-1** — Event store IS the audit chain | Full | — |
| **AD-2** — Hybrid aggregate (observation → incident) | Phase 1 trim: 1 source type (sensor) + 1 observable for Anjali (1 person submit → 1 observation); no ML | Weighted-voting fusion engine (5 input types) |
| **AD-3** — Sealed-component contracts | Mechanism only (per-event-type upcasters) | Simulator Harness, Multi-Radio adapters |
| **AD-4** — Strict versioning + upcasters | Schema-registry mechanism + per-version upcasters | Dual-signature requirement on schema bumps |
| **AD-5** — Per-tenant isolation | Single-tenant `dhaka`; AD enforced at gateway | Multi-city federation |
| **AD-6** — RBAC defense-in-depth, 3 layers | Full | — |
| **AD-7** — Three UIs as separate products | Phase 1 has 2 UIs (Admin desktop, Operator mobile) — Anjali submits via mobile form; no third product surface | Anjali-mobile as a separate product; PHA-pane |
| **AD-8** — Multi-radio contract enforced at gateway | **deferred** | Cellular / LPWAN / SD-card tiers |
| **AD-9** — Single-region Dhaka deployment | Full | Multi-region DR |
| **AD-10** — Internal + vendor-neutral observability | OpenTelemetry instrumentation + chain-integrity monitor + sensor-silence monitor | Override-anomaly monitor |
| **AD-11** — Two-person rule | **deferred** | Dual-signature on `PublicNoticeIssued`, `PublicNoticeRetracted`, T3-boundary amendments |
| **AD-12** — Closed role enum | Phase 1 trim: `{sensor, anjali, admin, operator, system}` (5 entries) | Full 8-entry enum including `pha_approver`, `councillor`, `utility_message_desk` |
| **AD-13** — Content-addressed playbook versioning | **deferred** | Playbook Engine + Simulator Harness |
| **AD-14** — Idempotency by `(tenant_id, event_id)` | Full | — |
| **AD-15** — Change-management authority | Mechanism only (event-sourced config); single-signature allowed in Phase 1 | Dual-signature on schema bumps, playbook promotions, city-wide config |
| **AD-16** — Retention + RTBF via tombstones | **deferred** | `SubjectRedacted` + retention floor |
| **AD-17** — Public Notice channel contract | **deferred** | `PublicNoticeIssued` + `PublicNoticeRetracted` events; rate limit, SMS char budget, councillor endorsement, councillor-hostile fallback, `ShiftCoverageActivated` |

## Out of Phase 1 (deliberately deferred)

These items appear in the spec kernel or the architecture spine but are **not in Phase 1 code**. The training project scope is "everything decided in the requirements documents is in code; nothing else". The system as scoped here meets the demo bar; anything below is the next milestone, not this milestone.

- **PHA regulator persona** — no PHA pane UI, no PHA-actor events.
- **Public notice / Ramesh channel** — no WhatsApp Business API integration, no SMS broadcast, no `PublicNoticeIssued` / `PublicNoticeRetracted` events.
- **Dual-signature attestation (AD-11)** — single-actor per gate. Schema-version bumps are single-signed.
- **Simulator harness** — no "what would have happened" dry-run.
- **Multi-tenancy beyond Dhaka** — single tenant `dhaka`. Per-city RBAC matrix not active.
- **World Bank evidence export tooling** — no `WBEvidenceExported` event.
- **Multi-radio fallback (AD-8)** — cellular only. LPWAN / SD-card routes not wired.
- **Phone-as-network** — Anjali-mobile is a manual submission surface only; no sentinel sync from her phone.
- **Hybrid incentive (BDT 2,000 stipend + ICDDR,B credential)** — no incentive surface in Phase 1.
- **RTBF tombstones (AD-16)** — no redaction path in Phase 1; private-phone numbers in reports are out of scope.
- **Councillor trust-bridging voice** — no councillor routing in Phase 1.
- **Playbook versioning (AD-13)** — no playbooks. Operator follows the admin's instructions ad-hoc; each step logged with reasoning but no version-of-record.
- **Penalty: deviation cluster → amendment promotion** — `DeviationCaptured` events with reasoning happen (per R3 rework, per Phase 1 admin UX), but the monthly cluster → amendment-candidate projection is Phase 2.
- **Auto-generated PHA monthly report** — no auto-PHA-report; the closed-arc timeline view (Epic 5.3) is the single audit artifact in Phase 1.
- **Override-anomaly monitor** — logged only, not enforced.
- **Bangla locale switch in operator UI** — Phase 1 ships Bangla primary on Anjali-mobile and admin UI; operator UI stays English.

## Validation summary

| Check | Verdict |
|---|---|
| Phase 1 boundary (only Phase-1-in-scope FRs/ADs) | PASS |
| Architecture implementation (chain is the spine) | PASS |
| Story quality (17 stories, all Given/When/Then, single-dev doable) | PASS |
| Epic structure (5 value-bounded epics) | PASS |
| Trust-scoring completeness (cluster, cross-check, reputation, all in Epic 2) | PASS |
| Citizen-loop completeness (✅ / ❌ → reopened in Epic 5.2) | PASS |
| Persona completeness (4 personas — Sensor, Anjali, Admin, Operator — all on stage) | PASS |
| Out-of-scope items explicitly deferred (and listed in §"Out of Phase 1") | PASS |
| Workflow visualization alignment (matches `workflow-phase1.html`) | PASS |
