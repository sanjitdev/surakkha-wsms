# Adversarial Review — Surakkha v1 Architecture Spine

**Reviewer lens:** Two competent engineers, given only this spec, the spec architecture-invariants companion, and the spine, are asked to independently build a unit one level down. If each can obey every AD to the letter and still produce a system that breaks against the other's unit, the spine has failed its job as the invariant contract.

**Scope reviewed:** `ARCHITECTURE-SPINE.md` (12 ADs, 8 inherited invariants, consistency conventions, dependency diagram), cross-referenced against `architecture-invariants.md` and `prd.md`.

**Method:** For each candidate divergence pair, I name the units, name the ADs that *appear* to bind them, and show how a reasonable implementation can obey those ADs literally and still build incompatibly.

---

## TL;DR

The spine is structurally sound at the **macro** level — the event-sourced core + CQRS paradigm is real, the three-UIs-as-separate-products split is enforceable, and the sealed-component framing genuinely survives the v1→v2 fusion swap.

But the spine is **structurally weak at the boundaries**, specifically where:

1. Two components are jointly responsible for one entity (Observation→Incident handoff; Fusion→Aggregator contract).
2. A constraint is **enumerated in prose** ("errors are events", "every event carries actor_identity") but **never operationalized** — no event-type list, no actor-role taxonomy enforced in code, no field-level schema discipline.
3. The change-management envelope (versioning of playbooks, simulator inputs, amendment lineage) is referenced as a sealed-contract surface but not pinned to a single AD that an implementer cannot bypass.
4. Race conditions between Observation correlators and Incident Aggregator and operator manual triage are entirely unaddressed.
5. The liability split is encoded in a single field (`actor_identity`) that the spine admits is "carried by" the event — but nothing in AD-12 prevents an actor from being misclassified or a vendor actor from emitting a PHA-bound event.

The verdict is **PASS-with-notes**, but the notes are load-bearing. Fixing the five hole pairs below would change this verdict.

---

## Hole Pair 1 — The Observation→Incident Handoff has no concurrency contract

**Two units:** (a) the **Source-Fusion Engine** that writes `FusionScoredIncident` events to the stream, and (b) the **Incident Aggregator** that materializes `IncidentCreated` events when fusion correlates ≥1 observation.

**What ADs appear to bind them:**
- AD-1 says all state changes are events.
- AD-2 says "the Incident Aggregator reads the observation stream and materializes an Incident when ≥1 observation correlates into a coherent story (configurable per contaminant class). Before Incident creation, the observation is queryable but has no incident-level commands. After Incident creation, commands target the Incident aggregate."

**The divergence scenario:**
- Engineer A (Fusion Engine owner) treats "correlation" as a per-observation semantic: when fusion scores observation O, it emits `FusionScoredObservation{observation_id=O.id, score, candidate_incident_id=hash(O)}`. The `candidate_incident_id` is a deterministic derivation — every fusion run for O produces the same candidate id. Fusion runs are idempotent by `(observation_id, fusion_run_id)`.
- Engineer B (Incident Aggregator owner) treats "coherent story" as a windowed-correlation semantic: the Aggregator reads the observation stream over a time window and emits `IncidentCreated{incident_id, observation_ids=[…], window_start, window_end}` when the fused score crosses a threshold. Incident ids are ULIDs minted at creation time. Two observations O1 and O2 that *should* be in the same incident end up in different incidents because the Aggregator's window is smaller than Fusion's correlation horizon.
- **System now has two incident-paths for the same contamination event.** Priya sees incident #A on the ranked list from the Fusion output projection (which carries `candidate_incident_id`) and incident #B on the Incident-Aggregator projection. She acts on #A, deviates from #B; both deviation events are valid; the audit chain proves Priya acted inconsistently. Under inquiry, this is exactly the failure mode AD-2 claims to prevent.

**What AD-2 actually says vs what it needs to say:**
AD-2 commits to the *existence* of an Incident Aggregator with a correlation rule ("≥1 observation correlates into a coherent story (configurable per contaminant class)") but does not bind:
- The **identity contract** between Fusion's `candidate_incident_id` and Aggregator's `incident_id`. Is `incident_id` deterministically derived from observation inputs, or is it minted at aggregation time? AD-2 says observations "live in the same store" — but does not say an Incident id is a pure function of its observation inputs.
- The **correlation-window discipline**. Fusion may have its own window for "this is the same event"; the Aggregator may have a different window for "this rises to incident-level." Nothing in AD-2 prevents these from drifting.
- The **single-writer rule** for Incident creation. AD-2 does not say whether the Aggregator is the only writer of `IncidentCreated`, or whether fusion output is also allowed to emit incident-like events that downstream consumers treat as incidents.
- **Race resolution between SensorReading and AnjaliReport**. AD-2 says "≥1 observation correlates" but does not say *who* decides correlation order. Engineer A's Fusion writes `FusionScoredObservation` first; Engineer B's Aggregator writes `IncidentCreated` second. When both reach the Aggregator at roughly the same wall-clock time, and Priya manually opens an Incident before either has correlated, what wins? AD-2 is silent. The spec mentions a manual-incident-creation path is implicit in Priya's role, but AD-2 only describes the lazy materialization path.

**Fix direction:** AD-2 must be tightened to declare:
1. Incident id is a **deterministic derivation** of the observation-set that triggered it (e.g., `incident_id = hash(tenant_id || sorted(observation_ids) || correlation_window_id)`), so that two correlation paths producing the same observations produce the same incident id — and so that re-running fusion never creates a "duplicate" incident.
2. The Aggregator is the **sole writer** of `IncidentCreated`; fusion output is observation-scored, not incident-created.
3. A **single correlation-window discipline** is named in the spine (not deferred to per-contaminant-class config): e.g., "the Aggregator's correlation window is the same as Fusion's scoring window; both are properties of the tenant config and cannot diverge."
4. A **manual-incident-creation path** is either explicitly prohibited (Priya can only triage existing incidents) or explicitly named as an out-of-band `IncidentOpenedByOperator` event that bypasses fusion correlation but uses the same deterministic id derivation, with the operator's `actor_identity` carrying the action.

Without these four clauses, AD-2 cannot prevent two engineers from building Fusion and Aggregator that produce inconsistent incident ledgers.

---

## Hole Pair 2 — The Fusion Engine contract doesn't bind the *shape* of the ranked list

**Two units:** (a) the **Source-Fusion Engine** and (b) the **Priya desktop projection** that consumes the ranked action list.

**What ADs appear to bind them:**
- AD-3 names the fusion contract as `{5 inputs} → ranked 4-6 incident list with attribution and confidence`.
- The architecture-invariants companion §3 says: "OUTPUTS: ranked_action_list: ordered 4–6 incidents to action, per_item: playbook recommendation, source attribution, corroborated confidence score."

**The divergence scenario:**
- Engineer A (Fusion owner) interprets `per_item.source attribution` as a list of source-type strings (`["sensor", "anjali", "complaint_cluster"]`) — i.e., which channels contributed, not which specific observations.
- Engineer B (Priya projection owner) needs to show Priya *which* Anjali reported, *which* sensor, *which* complaint cluster — so they interpret `source attribution` as a list of observation references (`[{observation_id, source_type, weight, observed_at, location}]`).
- **System now has two truths.** Fusion output projection says "Anjali reported" (string). Priya's drill-down projection says "Anjali #14 at school #7" (specific reference). When Priya clicks to confirm an action and the audit chain has to attribute the action to a specific observation, there is no canonical observation-id in the Fusion output to reference. The incident-level commands (EscalateIncident, ExecutePlaybookStep) need to bind to observations; Fusion's output doesn't carry them.

This is a **stricter version** of the original sealed-contract problem: AD-3 names the contract in prose but doesn't pin the **schema** of the contract. The architecture-invariants companion shows a code-block-shaped "INPUTS / OUTPUTS" structure, but the spine says nothing about which fields are mandatory, which are optional, what the type of `source_attribution` is, or whether `playbook_recommendation` is a single recommendation or a list of candidates.

**Fix direction:** AD-3 needs a sub-clause: "Each sealed component's input/output contract is specified as a schema-versioned message definition. The fusion engine's `ranked_action_list.per_item` payload MUST include: `{observation_references: [...], source_weights: [...], confidence: number, playbook_candidate_ids: [...]}`. Schema versioning follows AD-4." Without this, "sealed contract" reduces to "we drew a box around the function and called it stable."

---

## Hole Pair 3 — The Liability Split is encoded in a single field with no role taxonomy

**Two units:** (a) the **Playbook Engine** that emits `PlaybookAmendmentApproved` and `PlaybookStepExecuted` events, and (b) the **Audit Chain Gateway** that validates event payloads before writing to chain storage.

**What ADs appear to bind them:**
- AD-11 says dual signatures are required on T3-boundary events and consumer messages.
- AD-12 says every event carries `actor_identity` with `role (vendor / PHA / utility / Anjali / Priya / Dr. Mensah / system)` and that the liability split is encoded in this field.
- The spine's Consistency Conventions table also mentions `actor_identity` as part of the event envelope.

**The divergence scenario:**
- Engineer A (Playbook Engine owner) implements `actor_identity` as `{role: string, ref: string}` where `role` is a free-form string set by the calling component (e.g., when Priya approves a playbook amendment, the Playbook Engine writes `actor_identity: {role: "operator", ref: "priya_dhaka_01"}` — because the engine has its own internal vocabulary).
- Engineer B (Audit Chain Gateway owner) implements validation as: "the field exists and is non-null." The gateway has no enum check, no whitelist of allowed role values, no binding between `role` and the RBAC matrix.
- **Now the liability split is contractual, not structural.** Under inquiry, the audit chain proves a `PlaybookAmendmentApproved` event was emitted with `actor_identity.role = "operator"` — and the vendor's lawyer says "our operator, not your operator." The PHA's lawyer says "your operator, not ours." The chain doesn't decide. AD-12's stated goal ("the vendor's liability boundary ends at events the vendor's actors emitted") is not achieved by the rule as written.

There are at least three concrete gap-pairs here:

1. **No actor-role taxonomy pinned to the RBAC matrix.** AD-6 names RBAC as the cross-cutting enforcer; AD-12 names the actor roles as a vocabulary. But no AD says the Audit Chain Gateway rejects events whose `actor_identity.role` is not in the per-tenant RBAC matrix, or whose `actor_identity.ref` does not resolve to a live RBAC principal. Engineer B (gateway) cannot enforce what is not bound.
2. **No attestation of *who classified the role*.** AD-12 says "the vendor's liability boundary ends at events the vendor's actors emitted." But the Playbook Engine is itself a vendor-built component. When Priya approves an amendment through the Playbook Engine UI, the event's `actor_identity` is set by the engine, not by an authoritative identity service. Engineer B's gateway has no way to detect that the engine lied about whose action this was.
3. **Two-person rule binds two signatures, but does not bind them to the same *version* of the action.** Per AD-11, the dual signature must capture "distinct actor identities." But the spine does not say the dual signature must reference the **same `(event_payload_hash, playbook_version_id)` tuple**. Engineer A's Playbook Engine emits `PlaybookAmendmentApproved{payload_v1}`; signature 1 lands first; the PHA amends their approval to point to `payload_v2` (a slightly different amendment text — typo correction); signature 2 lands against `payload_v2`. **The chain records two signatures against different payloads.** Under inquiry, the dual signature is meaningless: it does not prove two people approved the *same* action. The two-person rule passes the test on paper and fails the test in practice.

**Fix direction:** AD-11 and AD-12 together need:
1. A **closed-set role vocabulary** pinned to the RBAC matrix, enforced at the gateway as a write-rejection condition (the gateway has the RBAC service as a dependency and validates every event).
2. The `actor_identity.ref` must resolve to a **session token** signed by the auth service at the time of action, not a string minted by the emitting component.
3. The two-person rule must require both signatures to attest to the **same canonical payload** (a `(payload_hash, version_id)` tuple); signature 2 must include signature 1's `payload_hash` in its own attestation, or the gateway rejects.
4. The liability split is not just "actor role is recorded" — it is "**only events whose `actor_identity.role ∈ {vendor_managed_roles}` carry vendor liability, and that set is enumerated per tenant and versioned**." This is a structural claim, not a contractual one.

---

## Hole Pair 4 — The Playbook Engine's "sealed contract" doesn't pin the change-management envelope

**Two units:** (a) the **Playbook Engine** that authors, amends, simulates, and runs playbooks, and (b) the **Simulator Harness** that does dry-runs.

**What ADs appear to bind them:**
- AD-3 names the playbook engine contract as `{execution, deviation, amendment, versioning, confidence, simulator}` per architecture-invariants §4.
- The architecture-invariants companion §4 lists versioning ("every amendment produces a new version-of-record. Sign-off metadata captured"), confidence, and simulator as contract surfaces.

**The divergence scenario:**
- Engineer A (Playbook Engine owner) implements versioning as: every amendment emits `PlaybookVersionCreated{playbook_id, parent_version_id, content_hash, status}` where `status ∈ {draft, approved, deprecated}`. The active version is the latest `status=approved` record.
- Engineer B (Simulator owner) implements the simulator as: "given a hypothetical playbook version X and a historical incident set, replay the incident through X." The simulator's input is `playbook_version_id` and `incident_set`.
- **Now: how does the simulator know what "playbook version X" *is*?** The simulator reads from the playbook engine's storage. But the spine doesn't say what the canonical source of a playbook version is. Is it an event in the audit chain? A row in the playbook engine's private database? A file in object storage? Engineer A may treat playbook versions as a private concern (the engine owns the storage); Engineer B may treat them as event-stream projections (every version is replayable from the chain). Under DR, under replay, under simulator-on-a-snapshot-of-historical-data: these two views produce **different simulator outputs for the same input**, because the private storage and the event stream disagree on what version X contains.
- A second sub-scenario: **amendment lineage is not pinned**. The spine says "every amendment produces a new version-of-record. Sign-off metadata captured." But it does not say:
  - What is the lineage type? (linear, branched, merged?)
  - When two amendments are authored concurrently against the same parent version, what happens? (Both succeed and diverge? One wins?)
  - When a draft amendment is abandoned, is it a version-of-record? (If yes, the version count explodes. If no, the audit chain has events that don't correspond to a version.)
  - When the simulator runs against a "what would have happened" scenario, is the simulator's output an event in the chain? (If yes, it pollutes the audit trail. If no, the simulator is unauditable.)

**This is the "operational/change-management envelope" the brief asked me to check.** The spine inherits playbook versioning from architecture-invariants §4 but never pins it to a single AD that an implementer cannot bypass. AD-3 says "sealed contract" but the contract surface is enumerated, not specified.

**Fix direction:** Add AD-13 (or extend AD-3) with explicit rules:
1. A playbook version is the **content-addressed hash of its serialized definition** (`version_id = sha256(tenant_id, playbook_id, parent_version_id, serialized_definition)`). The id is deterministic; the engine cannot have a "draft version" without an id; the simulator's input is the version id, which resolves through the event stream.
2. Amendment lineage is **linear**. Concurrent amendments to the same parent are serialized by the gateway; the second-arriving amendment is rejected and the author is told to re-base against the new head. (This is a deliberate simplification; if branched is needed later, it is a v2 contract change.)
3. Abandoned drafts emit `PlaybookDraftAbandoned` events but do not mint a new version id; the draft is queryable but not version-of-record.
4. Simulator runs emit `SimulatorRunCompleted{input_version_ids, output_projection_snapshot_id}` events. The snapshot is a derived projection, not a state mutation. Simulator outputs are **not** themselves version-of-record mutations of any playbook.
5. The simulator's input (which playbook version, which historical incidents) is itself an event in the chain so the simulator is replayable end-to-end.

---

## Hole Pair 5 — Two-person signatures do not bind to the same `(incident_id, step_id, version_id)` triple

This is a sub-case of Hole Pair 3, but it is specific enough to warrant its own entry because the failure mode is concrete and the AD-11 wording suggests it is *intended* to be prevented.

**The divergence scenario:**
- Per AD-11, `PlaybookAmendmentApproved` (at T3 boundary) and `ConsumerMessageIssued` require dual signatures. The dual signature is "captured as part of the event payload" — i.e., both signatures are attached to the *same* event.
- But "same event" is a single event id. Engineer A (gateway owner) interprets "dual signature" as: signature 1 and signature 2 must both be present on the event when it is written. The gateway checks `{event_id, signatures: [s1, s2]}`.
- Engineer B (Playbook Engine owner) implements the multi-actor attestation pattern per the Consistency Conventions table: "the second signature emits a `SignatureAttestation` event that references the first; the gateway accepts the underlying command only after both signatures are recorded."
- **Now the gateway has two patterns, both of which AD-11 allows.** Engineer A's pattern is the embedded-dual-signature; Engineer B's pattern is the linked-SignatureAttestation. The downstream audit-chain browser reads these two patterns differently: pattern A has both signatures on one event; pattern B has one signature on the command event and a separate `SignatureAttestation` event that *might or might not* be joined in the projection. Under inquiry, the auditor sees:
  - Pattern A: event X has two signatures; "two people approved X."
  - Pattern B: event X has one signature, plus event Y that "attests to X"; "two people approved X" — *if you read both events*.
- The PHA's lawyer will object to pattern B because the audit-trail is split across two events. The vendor's lawyer will object to pattern A because it's harder to implement idempotently. **Neither is wrong per AD-11.**

A worse sub-scenario: Engineer B's `SignatureAttestation` event carries `attested_event_id` but **not** the attested event's `payload_hash` or `version_id`. Signature 1 attests to `PlaybookAmendmentApproved{event_id, version_id: v17, payload_hash: H1}`. Signature 2 attests to "the event referenced by `attested_event_id`" — but Engineer B's engine has already emitted a second `PlaybookAmendmentApproved` event against the same logical amendment, with `version_id: v17, payload_hash: H2` (H2 differs from H1 by a one-character typo correction between signature 1 and signature 2). Signature 2 lands against H2. **The chain records two signatures against two different payloads.** The dual signature is meaningless.

This is exactly the two-person-rule-gap the brief asked about. AD-11 prevents it in spirit but not in rule.

**Fix direction:** AD-11 must explicitly state:
1. Dual signatures attest to the same **canonical triple** `(event_id, payload_hash, version_id)`. The triple is content-addressed at first signature; the second signature's attestation payload includes the triple; the gateway rejects the second signature if the triple does not match.
2. The dual-signature pattern is **one** pattern, not two. Pick one: either both signatures on one event (with `signatures: [{actor, signed_hash, signed_at}, ...]`), or both as separate `SignatureAttestation` events that *each* carry the canonical triple. The spine currently leaves it open.
3. The canonical triple must be derivable **before** the first signature is collected, so that "what are we signing" is stable across the signature window.

---

## Hidden Cross-Tenant Paths (supplementary)

The brief asked specifically about hidden cross-tenant paths. AD-5 says "every event, projection query, and adapter call MUST carry a tenant_id. Missing tenant_id is a request-rejection condition (gateway-enforced)." This is a good rule — but it has two narrow gaps:

1. **Cross-tenant federation through the platform-config projection.** The Consistency Conventions table says "Cross-city config (defaults, WHO template library, fusion weights) lives in a shared 'platform-config' projection, not in tenant stores." This is correct. But the spine does not say who *writes* to the platform-config projection. If the vendor pushes a new WHO template library from a vendor operator, the platform-config projection is updated. But the **tenant-id of the write** is ambiguous: is it the originating vendor's tenant (where the vendor has admin), or is it a vendor-superuser tenant that spans all cities, or is it null? Engineer A (vendor admin tool) emits the update with `actor_identity.role = "vendor"` and `tenant_id = null` because the template is "global." Engineer B (PHA pane projection) reads the update and applies it to all tenants. **This is a cross-tenant write that bypasses AD-5's tenant_id rule** because the rule applies to *operational* events, not to *configuration* events.

2. **Federation roll-up reads in v1.** The architecture-invariants companion §1 says "federation hooks exist at the seam; v1 product surfaces do not call them." AD-9 says federation is v2+. But the spine does not forbid the PHA pane projection from joining across tenants when computing a "Bangladesh water safety overview" view for the WB evidence export. The WB export is a v1 surface (FR-6.6, AD-9 says "WB evidence export runs as a scheduled job"). The WB export needs a city-aggregate or country-aggregate. **The aggregate will cross tenants.** AD-5 says federation reads operate on "aggregated projections only — never on raw cross-city reads." But the spine does not name the WB export as a federation-aggregate or pin its tenant-scope.

**Fix direction:** AD-5 must explicitly include configuration events: "platform-config writes carry `tenant_id = platform-config` (a sentinel non-city tenant), and the platform-config projection is read-only from per-tenant projections; per-tenant projections can read but not write to it." And: "WB evidence export is a federation-aggregate read; it is named as such in AD-5 and is the only v1 surface that crosses tenants."

---

## Boundary rules that didn't make it into any AD

The brief asked me to check for boundary rules promised in prose but absent from the ADs. I found these:

1. **"Errors are events (CommandRejected, ProjectionFailed, ChainVerificationFailed). No exceptions cross component boundaries as raw exceptions; they become events with a typed payload."** — This is in the Consistency Conventions table but is not bound to any AD. An implementer can satisfy every AD and still let `KafkaUnavailableException` propagate as a raw exception from the Fusion Engine to the Incident Aggregator. The rule is unenforceable as written. **Should be AD-14: every error crossing a component boundary is an event in the audit chain with `event_type ∈ {CommandRejected, ProjectionFailed, ChainVerificationFailed, ComponentFailure}`; raw exceptions are rejected at the boundary by an interceptor.**

2. **"Every event, projection query, and adapter call MUST carry a tenant_id."** — AD-5 says this. But the spine does not say *every log line* carries a tenant_id. Operational logs (AD-10) are vendor-neutral structured logs. If a log line from the Priya projection leaks an Anjali's name without a tenant_id, the cross-tenant investigation gets harder. **Should be AD-15: operational logs are tenant-scoped; log lines without a tenant_id are rejected at the logging boundary.** (Lower priority than the others.)

3. **"Two-person signatures implemented as a multi-actor event emission."** — In the Consistency Conventions table. Already covered in Hole Pair 5.

4. **"Override / deviation: all overrides emit an OverrideRecorded or DeviationCaptured event distinct from the underlying state change event."** — In the Consistency Conventions table. AD-2 and AD-12 reference this but do not bind the *distinctness*. Engineer A (Playbook Engine) could emit `ExecutePlaybookStep{step, deviation: {...}}` — deviation folded into the step. Engineer B (Priya projection) emits two events: `StepExecuted` + `DeviationCaptured`. **Two valid implementations; downstream consumers can't tell whether a single "execute" event hides a deviation.** Should be in AD-2 or AD-12: "deviation events are top-level event types, never sub-fields of the underlying mutation event."

5. **"All events are idempotent by event_id."** — Not stated. An implementer can satisfy every AD and still let the Anjali mobile client emit the same `AnjaliReport` event 50 times during reconnection (a real connectivity-tier problem; the SD-card store-and-forward tier will replay on reconnect). If events are not idempotent, the audit chain has 50 entries and the Fusion Engine correlates 50 reports. **Should be AD-16: every event is idempotent by `(tenant_id, event_id)`; the gateway rejects duplicates; replay-safe across all radio tiers.** This is the kind of rule the brief asked about — promised in spirit ("single gateway enforces signing policy in one place") but not pinned.

6. **"Configuration changes are events."** — Threshold tuning (FR-6.2) is operator-mutation, but the spine does not say `ThresholdChanged` is an event type in the audit chain. The architecture-invariants companion §6 says "events recorded include threshold changes," but the spine ADs do not bind this. Engineer A (PHA pane) saves thresholds to a private config DB; Engineer B (fusion engine) reads from the same DB. The threshold change is *not* in the audit chain. Under inquiry, "who changed the threshold on March 3rd and why" has no chain proof. **Should be in AD-1: every configuration change that affects detection or response is an event in the chain.**

7. **"Lab submissions and lab results are events."** — Listed in architecture-invariants §6. Not bound in ADs. Same fix as above.

---

## Operational / Change-Management / Simulator envelope — what the spine misses

The brief explicitly asked me to check the operational/environmental envelope and the change-management envelope. Beyond Hole Pair 4 (playbook versioning) and Hole Pair 5 (two-person rule), here are the envelope gaps:

**Deployment:**
- AD-9 commits to "single-region Dhaka deployment for v1." Good. But the spine does not name the **deployment unit** for each sealed component. Is the Audit Chain Gateway a single replica? A 3-replica set with one writer? The spine is silent. Two implementers can build "single-region single-pod gateway" and "single-region 3-replica gateway" — both satisfy AD-9. Under DR, these behave differently.
- AD-9 says "Audit-chain gateway writes to local + a single replicated peer." Good. But it does not say **what the replication protocol is**, **what the RPO is**, or **who owns the replicated peer** (vendor? PHA? third-party?). Under inquiry, the replicated peer is the chain's second witness — its operator matters. Two implementers can build AWS-rDS-replica and AWS-cross-account-replica and both satisfy AD-9; under regulatory audit, these have very different trust properties.

**Observability:**
- AD-10 names three monitors: chain-integrity, sensor-silence, override-anomaly. Good. But AD-10 does not say **who acts on the monitor output**. Is it a PagerDuty to the vendor? An SMS to the PHA? A PHA pane alert? Two implementers can build "vendor on-call rotation" and "PHA-direct SMS" — both satisfy AD-10. Under an inquiry about why a sensor-silence monitor didn't fire on March 3rd, the answer depends on this.
- AD-10 says "vendor-neutral tooling." Good. But it does not say the **monitor alerts themselves are events in the chain**. If a sensor-silence monitor fires, the alert is in the operator's PagerDuty but not in the audit chain. Engineer A (observability owner) emits an alert to Slack. Engineer B (PHA pane) reads alerts from a separate system. **Under inquiry, "when was the operator told about the silent sensor" has no chain proof.** The override-anomaly monitor similarly: logged in v1, enforced in v2 — but "logged" means *in the chain*, or *in an application log*? The spine is ambiguous. AD-10 should say: "monitor outputs are events in the audit chain (`MonitorAlertRaised`, `MonitorAlertAcknowledged`); operator actions on alerts are also events."

**Simulator:**
- AD-3 names the simulator as a sealed contract surface. Hole Pair 4 covers the input contract. Beyond that:
  - The simulator runs on **historical events**. AD-1 says "the chain is content-addressed." But the spine does not say whether the simulator has access to the *full* chain or to *projections* of it. Engineer A (simulator owner) reads from the chain directly. Engineer B (simulator owner) reads from the Priya projection. Different inputs → different simulator outputs. **Should be in AD-3 or a new AD: "the simulator reads from the event stream, not from projections; simulator inputs are events with `event_id` references, not derived state."**
  - The simulator output is a **projection snapshot**. AD-2 talks about lazy materialization of Incidents. The spine does not say the simulator's output is also a projection that may diverge from the live one. If the simulator's "what would have happened" is a projection, and that projection is itself queried later (e.g., to compare to actuals), what guarantees the projection is reproducible? **Should be: simulator outputs are content-addressed by their input set; running the simulator with the same inputs against the same event stream produces the same output hash.**

**Change-management:**
- The spine has no AD for **schema evolution of the event types themselves beyond versioning** (AD-4). When a new event type is added (e.g., `PlaybookStepProposed` for the v2 auto-suggest feature), what is the change-management process? Is it a breaking change to the sealed contracts (AD-3)? A new event in the chain (yes, presumably)? An upcaster chain change? Two implementers can add the event type freely (and the gateway accepts it) or gate it through a versioning process. AD-4 covers field-level evolution but not event-type-level evolution. **Should be in AD-4: adding new event types is a versioned change to the sealed contract; removing event types is forbidden; renaming event types is forbidden.**
- The spine has no AD for **config schema evolution**. Per-city config (thresholds, playbook templates, RBAC matrix) evolves. When the config schema changes, who migrates the existing per-city configs? Is it a chain event (`ConfigSchemaMigrated`)? Two implementers can build "vendor pushes new config and overwrites" and "PHA-driven migration with audit trail" — both are not forbidden by the spine.

---

## What the spine does well

To be fair:

1. **The event-sourced-core + CQRS-read-models paradigm is genuinely structural.** AD-1 is the load-bearing call. Two engineers building this paradigm will converge on the same shape because the paradigm enforces them. The audit chain *is* the database is a real architectural commitment, not just a slogan.

2. **The three-UI split (AD-7) is enforceable.** Three separate products, three separate deploys, no shared component library above the data layer. An implementer who tries to share UI code above the data layer will produce something AD-7 forbids.

3. **The sealed-component framing (AD-3) is correct in principle.** The fusion v1→v2 swap survives because the contract is named. The fix is to make the contract *specific*, not to abandon it.

4. **The dependency-direction rule (only Audit Chain Gateway may depend on storage) is clean.** An implementer who tries to put the Fusion Engine's storage behind its own DB has to break this rule explicitly. The diagram is enforceable.

5. **The liability split (AD-12) is the right idea; the encoding is weak.** The spine encodes liability in `actor_identity.role` and that is correct as a design choice — the gap is in the lack of an enforced taxonomy and the lack of binding to the RBAC service.

6. **The multi-radio contract (AD-8) is well-pinned.** Sensor silence is an event; the gateway enforces tier routing; phone-as-network is explicit. This is genuinely hard to do wrong.

7. **The schema-evolution rule (AD-4) is correct.** Versions, upcasters, schema registry per tenant. An implementer who breaks this rule produces a system that can't replay. The rule is enforceable.

---

## Conclusion

The spine holds up as a **macro-level architecture document** — it commits to the right paradigm, names the right sealed components, and the dependency direction is enforceable. But it does **not** hold up as the **invariant contract** that prevents two competent engineers from building units that disagree at the seam.

The five hole pairs above are not abstract concerns. Each names a specific engineer-A / engineer-B scenario, the specific AD that fails to bind, and the specific shape of the divergence. The fixes are not "add a whole new AD" — they are tightening the existing ADs (mostly AD-2, AD-3, AD-11, AD-12) and adding 2-3 new ADs for the gaps the prose mentions but doesn't bind (errors as events, idempotency by event_id, configuration changes as events, simulator-input discipline).

**Verdict:** PASS-with-notes. The notes are load-bearing. Fixing the five hole pairs (and the supplementary boundary-rule gaps) would move this to a clean PASS. As shipped, two competent engineers can build incompatible units in at least five concrete ways.

---

## Summary table — what each AD fails to bind

| AD | What it claims to bind | What it actually fails to bind | Severity |
|---|---|---|---|
| AD-1 | Event store = audit chain; no dual writes | Configuration changes (thresholds, RBAC matrix); monitor alerts; simulator outputs — none are pinned as events | High |
| AD-2 | Observation → Incident correlation | Deterministic incident-id derivation; correlation-window discipline; sole-writer rule for IncidentCreated; manual-incident path | High |
| AD-3 | Sealed-component contracts | Field-level schema of fusion output; simulator input discipline; playbook version-of-record identity; config-schema evolution | High |
| AD-4 | Schema evolution by version + upcaster | Event-type addition/removal discipline; config-schema evolution | Medium |
| AD-5 | Per-tenant isolation | Platform-config writes (cross-tenant); WB evidence export (named as federation or not?) | Medium |
| AD-6 | Defense-in-depth RBAC | RBAC enforcement at the *gateway* — does the gateway reject events with bad actor_identity? | Medium |
| AD-7 | Three UIs as separate products | (this AD is solid) | Low |
| AD-8 | Multi-radio contract | (this AD is solid) | Low |
| AD-9 | Single-region Dhaka | Replication protocol, RPO, replicated-peer operator | Low |
| AD-10 | Operational observability | Monitor outputs as events; who acts on alerts | Medium |
| AD-11 | Two-person rule | Canonical triple `(event_id, payload_hash, version_id)` for both signatures; pattern choice (single event vs linked attestation) | High |
| AD-12 | Liability split via actor_identity | Enforced role taxonomy; actor_identity.ref binding to auth-service session; vendor/PHA/utility role-set enumeration | High |
| (missing) | Errors as events | Raw exceptions crossing component boundaries | High |
| (missing) | Idempotency by event_id | SD-card replay, multi-radio reconnects, mobile reconnection storms | High |
| (missing) | Override events distinct from mutation events | Sub-field vs top-level event type | Medium |

---

## Recommended spine changes (in priority order)

1. **Tighten AD-2** to declare deterministic incident-id derivation, sole-writer rule for IncidentCreated, single correlation-window discipline, and the manual-incident path.
2. **Tighten AD-3** to specify field-level schemas for the fusion output (and other sealed contracts) — at least the mandatory fields and their types.
3. **Tighten AD-11** to require dual signatures attest to the same `(event_id, payload_hash, version_id)` triple, and pick one pattern (single event with multi-sig, or linked `SignatureAttestation` events that each carry the triple).
4. **Tighten AD-12** to require an enforced role taxonomy tied to the RBAC matrix, session-token-derived `actor_identity.ref`, and an enumerated per-tenant role-set that the gateway validates.
5. **Add AD-13** for playbook version-of-record identity (content-addressed by serialized definition) and amendment-lineage discipline (linear; abandon path).
6. **Add AD-14** for errors as events (no raw exceptions across component boundaries).
7. **Add AD-15** for idempotency by `(tenant_id, event_id)`.
8. **Add AD-16** for configuration changes and monitor outputs as events.
9. **Tighten AD-5** to name the WB evidence export as a federation-aggregate and the platform-config as a sentinel non-city tenant.
10. **Tighten AD-10** to name who acts on monitor output and to require monitor outputs as events.

These ten changes would close all five hole pairs and most of the boundary-rule gaps. Without them, the spine is structurally sound but operationally leaky at exactly the seams the spec says are load-bearing.