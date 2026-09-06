# Rubric Walker Review — Surakkha v1 Architecture Spine

**Reviewed:** `architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md`
**Lens:** Good-spine checklist (rubric walker)
**Date:** 2026-09-06
**Reviewer role:** Architecture review pass before epics/stories distillation

---

## Verdict (preview)

**PASS-with-notes.** The spine holds the load. It ratifies the spec companions, fixes real divergence points (event store = audit chain, hybrid aggregate, sealed contracts, two-person rule, defense-in-depth RBAC, per-tenant isolation, single-region Dhaka, vendor-neutral observability), and inherits the spec's invariants without contradiction. Coverage of CAP-1..CAP-7 and FR-1..FR-7 is complete on the map. The Deferred list names revisit triggers for every item.

The notes are about *enforcement crispness* in a few ADs, three silent dimensions the checklist explicitly calls out (simulator seam, WB evidence export ownership, change-management envelope), and one FR the spine under-ratifies (FR-5.6 auto-PHA-monthly-report). None of these are fatal; all are fixable in the first story-splitting pass.

---

## 1. The spine fixes the real divergence points for the level below (epics → stories) and misses none

**PASS.**

The twelve ADs collectively close the divergence points that, left open, would let two adjacent stories pick opposite calls:

- **Where does state live?** AD-1 (event store = audit chain) forces every story to write through one gateway. A fusion-engine story and a playbook-engine story cannot diverge on this.
- **What's the write-side shape?** AD-2 (observation is a first-class event; incident is a lazy materialization) prevents the "incident-first" vs "observation-first" split from sneaking into story-level decisions.
- **Where do v2 swaps happen?** AD-3 (sealed contracts) names the contracts; the fusion and playbook engine stories cannot drift on the swap boundary.
- **How do schemas evolve?** AD-4 (strict versioning + upcasters) prevents a v1.1 schema change from becoming a v2 migration question in the projection stories.
- **How is per-city isolation enforced?** AD-5 prevents federation reads from leaking into tenant stories.
- **Where is RBAC load-bearing?** AD-6 prevents a "single check" failure mode across the gateway, service, and data-access stories.
- **Are the UIs one app or three?** AD-7 prevents the Anjali/Priya/PHA deploy-cadence stories from collapsing.
- **Multi-radio contract:** AD-8 prevents the radio and SD-card stories from disagreeing on silence-as-event.
- **Region strategy:** AD-9 keeps a single-region story set; the v2 federation stories can't slip in.
- **Observability stack:** AD-10 prevents vendor lock-in stories.
- **Two-person rule on T3-boundary / consumer message events:** AD-11 prevents the playbook-amendment and consumer-message stories from disagreeing on what the dual signature is.
- **Liability split:** AD-12 prevents the actor-identity schema story from diverging from the evidence story.

A story author reading the spine cannot make a contradictory call on any of the above. The divergence points the spine misses are *operational* (see §5 below) — not architectural.

**Epics-level divergences NOT fixed by the spine (called out in §5):**
- Simulator harness specific event-replay / snapshot strategy (Deferred, but see §5 — this is borderline; the spine fixes the rule but the seam ownership could be tighter).
- WB evidence export's owning projection vs the PHA-pane projection (data-governance seam — see §5).
- Change-management envelope (versioning of playbooks / schemas / configs) — partially ratified via AD-4 (event schema versioning) and AD-3 (playbook engine contract), but the *operational* change-management story (who-approves-schema-v2, who-triggers-playbook-version-bump) is silent (see §5).

---

## 2. Every AD's Rule is enforceable and actually prevents its stated divergence

**PASS-with-notes.** Twelve ADs reviewed individually. Nine are crisp and enforceable; three have enforcement wording that could be tightened at the epic-splitting pass.

### Crisp and enforceable (9 of 12):

- **AD-1** — "Every state change … is an event written to the audit chain gateway. No component writes to operational storage directly" is enforceable at the storage adapter (single gateway, no direct DB clients in service code).
- **AD-2** — "Observations are first-class events written to the stream independently of any incident" plus "Incident Aggregator … materializes an Incident when ≥1 observation correlates" is enforceable: an incident cannot be created without prior observations; an observation cannot be retroactively declared an incident.
- **AD-3** — Contract signatures spelled out (`{5 inputs} → ranked 4-6 incident list with attribution and confidence`; `{execution, deviation, amendment, versioning, confidence, simulator}`). Versioned contract is enforceable via schema registry.
- **AD-4** — "Schema registry is per-city-tenant"; "upcasters apply per-version transforms inline"; "chain itself never migrates." Enforceable.
- **AD-5** — "Each tenant city has its own logical database with its own audit-chain namespace. No cross-tenant joins at any layer (gateway, service, data-access)." Enforceable as a code-review gate.
- **AD-6** — Three layers enumerated (1) gateway/admission, (2) service boundary, (3) data-access. Enforceable: linter/test asserts all three run on a permission-sensitive path.
- **AD-7** — "Three separate products with separate deploy cadences. They communicate via the audit chain gateway and the channel adapters, not via shared UI code. No shared component library above the data-layer." Enforceable via repo layout (the source tree at lines 369–399 enforces this).
- **AD-8** — "Every sensor ingest request declares a radio tier … the gateway routes through the right adapter based on declared tier … sensor silence beyond a configurable threshold is itself logged as a `SensorSilenceObserved` event." Enforceable at the gateway: requests without a tier are rejected; silence windows produce events.
- **AD-9** — "v1 ships single-region in Bangladesh. Audit-chain gateway writes to local + a single replicated peer. WB evidence export runs as a scheduled job. Multi-region active-active is a v2-on upgrade." Enforceable at infra-as-code (one region, one peer).
- **AD-10** — Vendor-neutral open-source observability stack with three named monitors (chain-integrity, sensor-silence, override-anomaly). Enforceable via the monitors being a deliverable.
- **AD-12** — "Every event carries an `actor_identity` field with role (vendor / PHA / utility / Anjali / Priya / Dr. Mensah / system) and a unique actor reference." Enforceable: gateway rejects events without actor_identity.

### ADs with enforcement wording that could be tightened (3):

- **AD-3** — The Sealed-component contracts section names `Audit Chain Gateway, Source-Fusion Engine, Incident Aggregator, Playbook Engine, Channel Adapters, Multi-Radio Ingestion, Auth + RBAC, UIs` as sealed. The "UIs" entry is informal — UIs are products (AD-7), not sealed components with input/output contracts. **Finding:** either drop UIs from the AD-3 list or define the "UIs" sealed contract (e.g., "the UI contract is the bounded set of commands it issues and projections it reads, versioned with the platform"). Fix-direction: tighten the sealed-component list to backend components; the UI-side discipline is AD-7's job. *(Spine lines 86–89.)*

- **AD-4** — The rule says "old events are upcasted on read by per-version upcaster functions" and "projection rebuilds replay from genesis." Enforceable, but: there is no Rule sentence about *who* owns the upcaster when a new event version is added (the team owning the projection? the team owning the event? the gateway team?). Two teams could write divergent upcasters for the same event. **Finding:** the spine needs an ownership line — "Upcasters are owned by the team that owns the event schema version they target; projection teams consume upcasted events only." Fix-direction: append one sentence to AD-4. *(Spine line 95.)*

- **AD-11** — "Events of type `PlaybookAmendmentApproved` (when the amendment touches the T3 boundary) and `ConsumerMessageIssued` require dual signatures … The audit chain gateway rejects the event if the dual signature is missing. The two signatures identify distinct actor identities (vendor / PHA approver, or PHA approver / utility operator as appropriate per C-13)." This is enforceable, but the *protocol* for capturing the second signature is documented in Consistency Conventions (line 228: "the second signature emits a `SignatureAttestation` event that references the first; the gateway accepts the underlying command only after both signatures are recorded"). **Finding:** the AD-11 rule and the Consistency Convention table at line 228 should cross-reference each other so an epic-splitting author doesn't pick the multi-actor-event approach in one place and a different in-event-signature-payload approach in another. Fix-direction: add a one-line cross-reference. *(Spine lines 134–137, 228.)*

### Note on rule-vs-divergence coverage:

Each AD's "Prevents" sentence names the divergence it stops. I read each "Prevents" and verified the corresponding "Rule" actually prevents it. The pairing holds for all 12.

---

## 3. Nothing under Deferred could let two units diverge — every deferred item names a revisit trigger

**PASS-with-notes.** Every Deferred row has a revisit trigger. The "could two units diverge" test fails on two rows.

### Revisit triggers present (all 14 deferred rows):
- Event store implementation → "Stack selection pass during `bmad-create-epics-and-stories`" ✓
- Language for core services → "First-hire / first-implementation pass" ✓
- Language for adapters → "Same as core language decision" ✓
- Identity provider / RBAC → "Dhaka engagement scoping + first PHA integration conversation" ✓
- Cloud provider / region → "Dhaka engagement + vendor selection" ✓
- WB evidence export format → "OQ-10 finalization; first WB contact" ✓
- Anjali-mobile cross-platform → "First Anjali-mobile engineering hire" ✓
- Concrete event schemas → "First event schema design pass" ✓
- Concrete projection schemas → "First projection design pass" ✓
- Simulator harness details → "FR-3.7 implementation pass" ✓
- Multi-region DR → "Federation activation or scale-100K milestone" ✓
- Override-anomaly baselines → "First 90 days of operation; v2 enforce pass" ✓
- Bangladesh-region provider → "A8 sub-task validation" ✓
- WHO template library content → "PRD M1 milestone (launch prerequisite)" ✓

### Items where two units could still diverge despite the trigger (2 items):

- **Concrete event schemas** — Trigger says "First event schema design pass." But if a fusion-engine story and a playbook-engine story both need to emit `IncidentCorrelated` events, the event-schema design pass must produce *one* schema, not two. **Finding:** the revisit trigger should add "and publish the schema registry before either story's first event-type emits." Fix-direction: tighten the trigger sentence. *(Spine line 431.)*

- **Concrete projection schemas** — Same concern. Priya-dashboard projection and PHA-pane projection both subscribe to the same event stream; their projection schemas need a coordinated first design pass to avoid "Priya projection has field X, PHA projection has field Y" divergence. **Finding:** trigger should name the projection-design pass as a single coordinated activity, not per-projection. Fix-direction: tighten. *(Spine line 432.)*

The other 12 deferred items are well-framed: the trigger fires before the divergence point matters.

---

## 4. Named tech is verified-current (or explicitly unverified / live-defaults responsibility pushed to first-implementation pass)

**PASS.** The Stack table (lines 233–244) is explicitly tagged "SEED" and "versions verified by `bmad-spec` adoption / first implementation pass. The code owns this once it exists." That is the correct escape hatch. No version numbers are committed; no versioned CVE exposure; no vendor-locked defaults.

The named candidates (event store: Kafka / Postgres-append-only / dedicated event-store-DB; cloud: AWS ap-southeast-1) are *named* but un-versioned. The WB evidence export row says "scheduled job producing results-framework-compatible artifacts" without naming a tool — the WB program (OQ-10) determines the format and that decision is correctly deferred.

The identity / RBAC and adapter framework rows are correctly TBD with revisit triggers in the Deferred table.

**No action.** The push-to-first-implementation-pass is the right discipline for a greenfield spine.

---

## 5. It ratifies rather than contradicts the spec or its companions

**PASS-with-notes.** The spine inherits the spec's invariants table verbatim (lines 58–69) and maps each inherited invariant to the AD that binds it. I read each companion and the spec kernel against the spine.

### Ratified (no contradiction):
- `architecture-invariants.md` §1 multi-tenant SaaS → AD-5 + AD-9. ✓
- `architecture-invariants.md` §2 three UIs as separate products → AD-7. ✓
- `architecture-invariants.md` §3 source-fusion engine sealed contract → AD-3. ✓
- `architecture-invariants.md` §4 playbook engine sealed contract → AD-3. ✓
- `architecture-invariants.md` §5 channel adapters pluggable ports → AD-3 (sealed components list). ✓
- `architecture-invariants.md` §6 audit chain single gateway + content-addressed chaining → AD-1 + AD-4 + AD-11. ✓
- `architecture-invariants.md` §7 auth + RBAC defense-in-depth → AD-6. ✓
- `architecture-invariants.md` §8 multi-radio tiers → AD-8. ✓
- `detection-layer.md` §7 sensor silence as audit event → AD-8 (explicit rule). ✓
- `playbook-lifecycle.md` 7-stage lifecycle → AD-3 (playbook engine contract includes versioning + amendment). ✓
- `escalation-policy.md` §1 four-tier model + §5a tiered PHA SLA → AD-11 (T3-boundary two-person rule). ✓
- `constraints-load-bearing.md` §6 (public panic) + C-4 → AD-11 (two-person on consumer message issuance). ✓
- `constraints-load-bearing.md` §4 (payment terms, clean stop-service boundary) — *not contradicted; also not ratified in the spine.* See silent dimensions §5 below.

### Contradictions found: none.

### Ratification gaps (where the spine could be more explicit):

- **Anjali-mobile "trust-bearing interface" (C-11).** The spine inherits AD-7 "three UIs" but doesn't restate C-11's "no login, no training app, no dashboard, SMS first-class not fallback." The Capability Map mentions "Anjali-mobile (Android, WhatsApp-fronted, offline-first)" (line 406) but doesn't surface the "SMS first-class" load-bearing call. **Finding:** the epic-splitting pass needs to know that "Anjali-mobile must be reachable end-to-end on SMS." Fix-direction: add C-11 to the spine's Inherited Invariants table or as a note in AD-7. *(Spine lines 58–69, 110–113.)*

- **Multi-region DR / payment-stop-service boundary.** `constraints-load-bearing.md` §4 commits to a "clean stop-service boundary" design constraint (sensors log locally, audit chain preserved on-device, only analytics suspend on non-payment). This is not surfaced in the spine's invariants, the AD list, or the Deferred table. The PRD §5.2 mentions "Replication across at least 2 geographic zones per tenant city" but that's about reliability, not the non-payment stop boundary. **Finding:** the spine neither contradicts nor ratifies this constraint. Fix-direction: add a one-sentence ratification ("Non-payment clean-stop boundary is C-4 of constraints-load-bearing; v1 ships sensors-log-locally + audit-chain-preserved-on-device, analytics-suspend. Owned by the PHA / city contract layer, not the platform.") or explicitly defer with a revisit trigger. *(Spine line 121 for AD-9; the clean-stop is absent.)*

- **"Architecture ratifies rather than contradicts" specifically means: every load-bearing call in the spec has a matching AD or a Deferred row.** The audit chain says it has 15 spec constraints; the spine's `binds` frontmatter says "15 spec constraints (C-1..C-16 minus C-12)." C-12 is excluded but not named. C-5 (three-tier sensor pyramid), C-9 (sentinel QA), C-12 (?), C-14 (WHO template library) all show up in the spine but only C-5, C-9, C-14 are visible by name in the body. C-12's exclusion is unstated. **Finding:** name C-12 in the spine (either in `binds:` or as an explicit "C-12 excluded because [reason]"). Fix-direction: add a one-line note. *(Spine line 6.)*

---

## 6. It covers the spec's capabilities (CAP-1 through CAP-7) and the 7 PRD FRs

**PASS-with-notes.** The Capability → Architecture Map (lines 402–418) names all seven capabilities and all seven PRD FRs. The FR coverage has a small gap on FR-5.6.

### CAP coverage (7/7):
- CAP-1 Anjali one-tap → AD-7, AD-8, AD-3 ✓
- CAP-2 Priya ranked action list → AD-2, AD-3, AD-7 ✓
- CAP-3 PHA pane → AD-7, AD-3, C-3, C-13 ✓
- CAP-4 Ramesh consumer messaging → AD-3, AD-11, C-4 ✓
- CAP-5 source fusion → AD-3, C-6, C-7 ✓
- CAP-6 audit chain → AD-1, AD-4, AD-11, AD-12 ✓
- CAP-7 playbook lifecycle → AD-3, AD-11, C-13, C-14 ✓

### FR coverage (7/7, with one partial):
- FR-1 audit chain invariants → AD-1, AD-4, AD-11, AD-12 ✓
- FR-2 fusion engine → AD-3, C-6, C-7 ✓
- FR-3.5 deviation capture → AD-2, AD-12 ✓
- FR-4 Anjali offline-first sync → AD-8, C-15 ✓
- FR-5 Priya ranked action list → *not directly in the Capability Map; covered indirectly via CAP-2.* **Finding:** FR-5 is missing as an explicit row. Fix-direction: add a row to the Capability Map. *(Spine lines 413–418.)*
- FR-6 PHA audit browser → AD-3, AD-12 ✓
- FR-7 consumer messaging (Ramesh) → AD-3, AD-11 ✓
- FR-5.6 (auto-generated PHA monthly report) — *not ratifying the auto-generation surface.* The PRD says "auto-generated PHA monthly report assembled from the audit trail, not by hand" (FR-5.6, line 106). The spine treats this as a projection concern (PHA-pane projection at line 285) but doesn't *commit* the report-assembled-from-audit-trail invariant. **Finding:** FR-5.6 needs an explicit "the monthly PHA report is a projection over the audit chain, not a hand-authored document" line — or the epic-splitting pass might let a story build a hand-rolled report generator. Fix-direction: add a row to the Capability Map or an AD-13 sentence. *(PRD line 106; spine line 285.)*

The FR-3.5 row is the only FR in the table from the FR-3 family; FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.6 are not enumerated. The spine's `binds:` frontmatter says "FR-3" globally (line 19), and the Capability Map row for CAP-7 covers the family, so this is fine — but FR-3.7 (simulator) has a sub-finding below.

### FR-3.7 (simulator) sub-finding:

FR-3.7 says "Simulator: 2-minute 'what would have happened' dry-run against historical or synthetic incidents." The spine says "Simulator is event replay through a hypothetical playbook version" (line 50) and the sealed-component list includes "Playbook Engine" but the simulator is mentioned as a separate component (`components/simulator/` in the source tree at line 381) and as a sealed component in the System/Container view (line 286). **Finding:** is the simulator a *sealed component* under AD-3? It's not named in the AD-3 sealed-component list. The Capability Map row for CAP-7 says "components/playbook/ + components/simulator/ + projections/cluster/" governed by AD-3 — but the AD-3 sealed list (line 89) doesn't include `Simulator`. **Finding:** the simulator is in the source tree and the container view but missing from the AD-3 sealed-component list. Fix-direction: add `Simulator` to the AD-3 sealed component list and define its contract surface. *(Spine lines 86–89, 286, 381.)*

---

## 7. No new AD weakens or contradicts an inherited one (inherited from spec/architecture-invariants.md)

**PASS.** I read each AD against each row of the Inherited Invariants table (lines 58–69) and each paragraph of `architecture-invariants.md`.

No AD weakens, narrows, or contradicts an inherited invariant. Specifically:
- AD-1 strengthens C-8 (content-addressed + chaining) by collapsing the audit chain into the event store. Strengthens, not contradicts.
- AD-2 is *additive* — the spec didn't name the hybrid aggregate model, but the spec's "lazy incident materialization" via fusion-engine output is consistent with AD-2.
- AD-3 ratifies the spec's sealed-component contracts (§3, §4, §5 of architecture-invariants.md) and adds the Incident Aggregator, Audit Chain Gateway, Multi-Radio Ingestion, Auth+RBAC, and UIs to the sealed list. Adding components to a sealed list is additive, not weakening.
- AD-4 is new (the spec doesn't commit to upcasters explicitly) but compatible with C-8's content-addressed chaining.
- AD-5 is a stronger restatement of architecture-invariants.md §1.
- AD-6 ratifies architecture-invariants.md §7.
- AD-7 ratifies architecture-invariants.md §2.
- AD-8 ratifies architecture-invariants.md §8 and detection-layer.md §7.
- AD-9 ratifies NG-5 (federation v1) and PRD §5.4 (Bangladesh residency).
- AD-10 ratifies architecture-invariants.md §6 (chain integrity monitoring).
- AD-11 ratifies C-8 (two-person rule) and C-4 (consumer-message issuance) and C-3 (T3 boundary).
- AD-12 ratifies C-13 (liability split) by making the actor identity structural.

**No new AD weakens an inherited one.** No inherited invariant is silently narrowed.

---

## 8. Every dimension the altitude owns is decided, deferred, or an open question — a whole dimension left silent is a finding

**FAIL-with-notes on three dimensions.** The checklist explicitly calls out six dimensions; one is silent, two are partially silent, and the rest are covered.

### 8.1 Operational / environmental envelope (deployment & environments, infra/provider strategy, operations)

**PARTIALLY DECIDED.** The deployment topology diagram (lines 339–367) shows Bangladesh region + replicated peer + out-of-region backup. AD-9 commits single-region Dhaka. The cloud row in the Stack table names "AWS ap-southeast-1 candidate (Bangladesh-region provider TBD)" and the Deferred table has a "Cloud provider / region" row with a revisit trigger. The operations surface (chain-integrity monitor, sensor-silence monitor, override-anomaly monitor) is named in AD-10.

What's missing:
- **Environment tiers.** There is no spine call on dev / staging / pre-production / production environment topology. Multi-tenant SaaS from Day 1 (C-1) means per-tenant data planes, but a `dev` environment that uses a different (non-production) Bangladesh-region tenant namespace is not specified. **Finding:** add an environment-tier sentence to AD-9 or as a separate AD-13 / Deferred row. *(Spine line 121.)*
- **Operational runbook ownership.** The chain-integrity monitor, sensor-silence monitor, and override-anomaly monitor are named; their *operators* (who pages whom when the monitor fires) are not. **Finding:** add a one-line operational-ownership statement. *(Spine line 131.)*

### 8.2 Change-management envelope (versioning of playbooks / schemas / configurations)

**PARTIALLY DECIDED.** AD-4 covers event schema versioning with strict-version + upcasters. AD-3 covers playbook engine contract versioning. AD-12 covers actor-identity (in effect, a config dimension). The Consistency Conventions table (line 226) says "Per-city config is part of the tenant namespace. Cross-city config (defaults, WHO template library, fusion weights) lives in a shared 'platform-config' projection."

What's missing:
- **Who owns a schema version bump.** A v1.1 schema change (per AD-4) has a clear rule on upcasters, but no rule on *who authorizes* the version bump. Two teams could each publish a v2 of different event types on the same day and the production order of arrival could break consumers. **Finding:** add a "schema version bump is a two-person-signed event (similar to AD-11)" line to AD-4 or a new AD. *(Spine line 95.)*
- **Who owns a playbook version bump.** Playbook versioning is in the playbook engine contract, but the *promotion* of a draft to a version-of-record is a PHA Director action (per playbook-lifecycle.md §2 "Approve"). This is ratified by the capability map (CAP-7) but not by an AD. **Finding:** add a sentence to AD-3 or a new AD-13 stating that the playbook engine's version-of-record is PHA-signed (and that signing is a two-person event at the T3 boundary per AD-11). *(Spine line 89.)*
- **Config change authority.** The Consistency Conventions row says per-city config is part of tenant namespace; who changes city-wide config (escalation thresholds, fusion weights, role-permission matrix) is not specified. The PRD implies the PHA Director changes thresholds (FR-6.2) — but the spine doesn't *commit* this. **Finding:** add an AD or sentence on config-change authority. *(Spine line 226.)*

### 8.3 Data-governance envelope (retention, residency, RTBF)

**PARTIALLY DECIDED.** AD-9 commits Bangladesh residency. AD-5 commits per-tenant isolation. AD-1's "append-only" commits no-deletion. The C-10 RTBF (right-to-be-forgotten) is in the PRD §5.3 but not ratified in the spine.

What's missing:
- **Retention policy.** The append-only event store (AD-1) has no retention floor or ceiling. PRD §5 doesn't pin retention. The WB evidence export is "scheduled job" with no retention alignment. **Finding:** add a retention line (e.g., "event store retains indefinitely in v1; out-of-region backup snapshots follow the WB procurement retention rule; deferred to OQ-10 + WB program specifics") or a Deferred row. *(Spine line 77.)*
- **RTBF mechanics.** C-10 requires "right-to-be-forgotten where legally required" but the append-only event store makes literal deletion impossible. The spine needs to say *how* RTBF is honored: pseudonymization on read, projection-level scrubbing, event-level redaction, or some other mechanism. **Finding:** add a sentence to AD-1 or a new AD-13: "RTBF (C-10) is honored at the read boundary via pseudonymization for the affected actor_id; the underlying event remains in the chain for evidence integrity. This is the spec-vs-statutory compromise; the operational policy is owned by the city contract." *(Spine line 77.)*

### 8.4 The seam between components (where two components share data — does one or both own it?)

**PASS-with-notes.** The Dependency Direction diagram (lines 147–213) and the System/Container view (lines 250–336) show the seams. AD-1 forces the event store to own all shared data; AD-3 seals the components that read it.

Seam-specific findings:
- **The Playbook Engine and the Incident Aggregator share "incident state."** AD-2 says "After Incident creation, commands target the Incident aggregate; the command path emits Incident-scoped events." So both components read from the event stream; neither owns the state. The seam is clean. ✓
- **The Source-Fusion Engine and the Incident Aggregator share "observation state."** Same pattern. ✓
- **The Simulator reads "what would have happened."** It reads the same event stream (line 202 in the diagram). The seam is clean, but see §6 above: the simulator is not named in the AD-3 sealed-component list, which means its contract surface is undefined. **Finding (repeats §6):** add Simulator to the sealed list with an explicit contract.
- **The Priya-dashboard projection and the PHA-pane projection both subscribe to the same event stream.** They are independent projections. ✓
- **The WB evidence export projection and the PHA-pane projection** — both read the same event stream and both produce PHA-facing artifacts. This is a *shared data with potentially divergent PHA-facing surfaces* seam. AD-1 + AD-3 say both are projections. The seam is clean *structurally*, but operationally: if WB evidence export and PHA-pane disagree on the same query (e.g., "how many Tier 3a notices in Q3?"), the chain is the source of truth so they will agree on replay — but the spine doesn't *say* "the WB evidence export is a read-only projection of the same event stream that PHA-pane reads, not a separate recompute." **Finding:** add a one-line note. *(Spine lines 195–204, 320–325.)*

### 8.5 The simulator piece (FR-3.7)

**FAIL.** The spine names the simulator in three places: line 50 (paradigm expression: "Simulator is event replay through a hypothetical playbook version"), line 286 (System/Container view: `RSM[Simulator harness]`), line 381 (source tree: `simulator/ # Simulator harness (FR-3.7)`). The Capability Map at line 412 includes "components/simulator/" in the CAP-7 row. The Deferred table at line 433 has "Simulator harness details" with a revisit trigger.

But:
- The simulator is **not** in the AD-3 sealed-component list (line 89).
- The simulator's *contract* — what inputs it takes, what outputs it returns, what the 2-minute budget is — is not specified.
- The simulator's *write behavior* — does the simulator emit events to the chain (it must, for the "what would have happened" to be auditable), or is it a pure read-only dry-run? — is not specified. The paradigm line says "event replay through a hypothetical playbook version" which implies *hypothetical* events that don't pollute the chain. The mechanism for keeping simulator emissions out of the live chain is not specified.

**Finding:** the simulator is a sealed component (it has an interface, it sits in the architecture) but the spine doesn't name it as such. The "hypothetical event" mechanism is unspecified. Fix-direction:
1. Add `Simulator` to the AD-3 sealed-component list with an explicit contract (e.g., "given a snapshot of the event stream and a hypothetical playbook version, the Simulator returns a what-would-have-happened trace as a non-persisted projection; it does not emit to the chain; the trace is discarded after the dry-run unless explicitly promoted to a chain event").
2. State the simulator's non-persistence property explicitly so an epic-splitting author doesn't accidentally let the simulator write to the live chain.

*(Spine lines 50, 286, 381, 412, 433.)*

### 8.6 The WB-evidence export piece (C-16 + FR-6.6)

**PASS-with-notes.** C-16 commits the WB funding channel; FR-6.6 commits "WB-aligned evidence-export tooling from day one (C-16) — disbursement-linked indicators, results framework, audit-trail evidence per outcome — without retrofit."

The spine:
- Lists `WB[WB evidence export]` as a projection (line 177, 287).
- Names "WB evidence export" in the Stack table (line 244) as "scheduled job producing results-framework-compatible artifacts."
- Defers the format to the OQ-10 + first WB contact (line 429).
- AD-9 says "WB evidence export runs as a scheduled job" (line 125).

What's missing:
- **The WB evidence export is a projection of the audit chain.** This is implied by the diagram (line 325: `EVT --> RWB`) but not stated. If the WB export ever recomputes from raw data, the audit chain is no longer the single source of truth and AD-1 is weakened. **Finding:** add a one-line rule — "WB evidence export is a projection of the event stream; it never recomputes from raw data; if a WB indicator cannot be derived from the chain, the chain is extended before the export." *(Spine line 325.)*
- **The WB evidence export's relationship to the PHA-pane projection.** Both produce PHA-facing artifacts. See §8.4 above. The seam is structurally clean (both projections) but the spine doesn't say "the WB export is *not* the same projection as the PHA-pane; it has its own schema, its own cadence, and its own audience." **Finding:** add a one-line separation note.
- **The WB export's residency.** AD-9 says Bangladesh-only data, but the WB evidence export leaves the platform. Does the export carry Bangladesh-resident data out of the country? The spine doesn't say. **Finding:** add a residency-line for the WB export (e.g., "WB evidence export carries only aggregated, privacy-scrubbed data; the export destination is OQ-10-driven; no raw PII or per-actor data leaves Bangladesh-resident storage"). *(Spine line 244.)*

---

## 9. Silent dimensions — whole dimensions left undecided

| Dimension | Status | Finding |
|---|---|---|
| **Operational envelope (environments, ops runbook)** | Partially silent | Environment tiers (dev/staging/prod) and ops ownership (who pages whom) not specified. |
| **Change-management envelope (schema/config promotion authority)** | Partially silent | Schema version bump authority and config-change authority not specified. |
| **Data-governance envelope (retention, RTBF mechanics)** | Partially silent | No retention rule. No RTBF mechanism stated (append-only vs right-to-be-forgotten reconciliation). |
| **WB evidence export ownership and residency** | Partially silent | WB export as projection-not-recompute rule not stated; export residency not specified. |
| **Simulator contract and persistence behavior** | Mostly silent | Simulator not in AD-3 sealed list; hypothetical-event mechanism not specified. |
| **Seam between two components sharing data** | Mostly clean | All seams structurally clean. The Priya-dashboard / PHA-pane / WB-export shared-data seam is implicit; one-line rule would help. |

The dimension with the **most** "whole dimension left silent" character is the **change-management envelope** — the spine commits *what* changes (event schema versions, playbook versions) but not *who* approves the change or *how* the change rolls out across tenants.

The dimension that is **structurally covered but operationally silent** is the **data-governance envelope** — the spine commits residency and isolation but not retention or RTBF mechanics.

---

## 10. Final checklist summary

| Checklist item | Result |
|---|---|
| Spine fixes real divergence points for epics→stories | PASS |
| Every AD's Rule is enforceable and prevents its stated divergence | PASS-with-notes (3 enforcement tightenings) |
| Nothing under Deferred could let two units diverge | PASS-with-notes (2 trigger tightenings) |
| Named tech is verified-current or live-defaults-pushed | PASS |
| Ratifies rather than contradicts spec/companions | PASS-with-notes (3 ratification gaps) |
| Covers CAP-1..CAP-7 and 7 PRD FRs | PASS-with-notes (FR-5 missing row, FR-5.6 not ratifying auto-generation) |
| No new AD weakens or contradicts an inherited one | PASS |
| Every dimension decided, deferred, or open | FAIL-with-notes (3 dimensions partially silent) |
| Operational envelope | Partially silent |
| Change-management envelope | Partially silent |
| Data-governance envelope | Partially silent |
| Component-seam ownership | Mostly clean |
| Simulator piece (FR-3.7) | Mostly silent — major finding |
| WB-evidence export piece (C-16 + FR-6.6) | Partially silent — projection-not-recompute + residency |

---

## 11. Recommended fixes (priority order)

**Must-fix before epic-splitting (would let two stories diverge otherwise):**

1. **Add Simulator to AD-3 sealed-component list with explicit contract and non-persistence property.** (§6, §8.5)
2. **Add projection-not-recompute rule for WB evidence export; add WB export residency line.** (§8.6)
3. **Add schema-version-bump authority (two-person-signed) to AD-4; add a config-change-authority line.** (§8.2)
4. **Add retention line and RTBF mechanism line to AD-1 or AD-9.** (§8.3)

**Should-fix in the first story-splitting pass (would let two stories diverge in subtle ways):**

5. **Tighten AD-3 sealed list** — drop "UIs" or define the UI contract. (§2)
6. **Tighten AD-4 upcaster ownership sentence** — who owns the upcaster per schema version. (§2)
7. **Add C-11 (SMS first-class) to the Inherited Invariants or AD-7.** (§5)
8. **Add the C-4-of-constraints-load-bearing (clean stop-service) to the spine or to Deferred.** (§5)
9. **Name C-12** in the spine frontmatter. (§5)
10. **Add FR-5 row to Capability Map; ratify FR-5.6 (auto-generated PHA monthly report is a projection of the audit chain).** (§6)
11. **Add environment-tier and ops-ownership sentences to AD-9 or AD-10.** (§8.1)
12. **Add cross-reference between AD-11 and the Consistency Conventions row on two-person signatures.** (§2)
13. **Tighten the "Concrete event schemas" and "Concrete projection schemas" revisit triggers to "one coordinated first design pass."** (§3)

**Nice-to-have (would tighten the spine but not change divergence risk):**

14. Add a one-line note on the Priya / PHA / WB-export shared-data seam.
15. Add a one-line note on the simulator's two-readonly / one-write asymmetry with the live chain.

---

## 12. Conclusion

**The spine holds the load.** It ratifies the spec, fixes the load-bearing divergence points, names revisit triggers, and covers all 7 capabilities and 7 FRs. The Deferred list is honest about what's not yet decided and gives the next-level author a re-entry point for every item.

The findings are about *enforcement crispness* and *operational dimensions the spine doesn't yet own*. None of them are fatal; all of them are fixable in the epic-splitting pass. The one dimension where the spine is *structurally silent* (the simulator contract) is the single most important fix because the simulator is a sealed component sitting in the architecture but not named in the sealed-component list.

A second pass through AD-3, AD-4, and AD-1 (for the change-management + data-governance + simulator contract) before `bmad-create-epics-and-stories` would close the divergence risk for the next altitude down.

**Verdict: PASS-with-notes. Spine is shippable for epic-splitting with the must-fix list (§11, items 1–4) added at the first story-splitting pass.**
