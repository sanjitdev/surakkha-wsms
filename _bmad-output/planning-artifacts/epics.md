---
title: Surakkha v1 — Epic Breakdown
status: final
created: 2026-09-06
updated: 2026-09-06
stepsCompleted: [1, 2, 3, 4]
validationPasses:
  - rule: FR coverage (all 32 sub-FRs across 7 FRs land in ≥1 story)
    verdict: PASS
  - rule: Architecture implementation (no starter template named; events-first store IS the chain)
    verdict: PASS
  - rule: Story quality (14 stories, all independent, all Given/When/Then, all single-dev doable)
    verdict: PASS
  - rule: Epic structure (7 value-bounded epics; minimal file churn across epic boundaries)
    verdict: PASS
  - rule: Dependency validation (later epics consume earlier epics via projections; within-epic stories flow backward)
    verdict: PASS
  - rule: UX-DR coverage (7/7 persona-derived UX-DRs land in stories)
    verdict: PASS
inputDocuments:
  - ../../_bmad-output/specs/spec-surakkha-v1/SPEC.md
  - ../../_bmad-output/planning-artifacts/prds/prd-surakkha-2026-09-06/prd.md
  - ../../_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
  - ../../_bmad-output/specs/spec-surakkha-v1/stories.yaml
---

# Surakkha v1 — Epic Breakdown

> **Source-of-truth hierarchy.** Spec kernel (`SPEC.md` + 7 companions) > PRD (`prd.md`) > Architecture spine (`ARCHITECTURE-SPINE.md`, adopted as companion) > this epic breakdown. Epics decompose PRD FRs/NFRs and architecture ADs into deliverable units; stories are independently shippable, testable, and dispatchable.

## Overview

This document provides the complete epic and story breakdown for Surakkha v1 (lighthouse-city water-safety monitoring platform, Dhaka deployment), decomposing the PRD's FRs and NFRs and the architecture spine's 16 ADs into implementable stories grouped by user-value theme.

## Requirements Inventory

### Functional Requirements

**FR-1 — Append-only cryptographic audit chain with two-person rule.** *(Story 1; Spec: CAP-6 + C-8; Companion: architecture-invariants.md §6.)*
- FR-1.1. Every audit-relevant event (sensor calibration, threshold change, playbook approval/amendment, operator action/deviation, consumer message issuance, role change, lab submission, system login, integration pull) is captured as a content-addressed block chained to its predecessor.
- FR-1.2. A single gateway mediates all chain writes; no module writes directly to chain storage. Per-city namespace; federation-ready but not active (C-1).
- FR-1.3. Two-person signature enforced on (a) T3-boundary playbook edits and (b) consumer message issuance. Dual signature captured in the chain block; both signatures attest to identical `(event_id, payload_hash, version_id)` triple (AD-11).
- FR-1.4. Sensor silence beyond a configurable threshold is logged as an audit event, not as maintenance noise (C-15).
- FR-1.5. Read access to chain is policy-controlled per role (Priya: own operator log; PHA: cross-ward rollups; audit browser in PHA-pane is read-only and access-logged per read).
- *Acceptance:* Retroactive tampering detectable; chain verifiable independently; two-person rule enforced in code not policy; both signatures bind to identical payload triple.

**FR-2 — Heterogeneous source-fusion engine with per-source credibility weighting.** *(Story 2; Spec: CAP-5 + C-6 + C-7; Companion: architecture-invariants.md §3, detection-layer.md §4.)*
- FR-2.1. Five inputs: industrial sensor (5 in v1), Anjali report (with credibility weight), citizen complaint cluster (≥3 in zone/24h), lab result, environmental signal.
- FR-2.2. Output: ranked action list of 4-6 incidents with playbook recommendation, source attribution, and corroborated confidence score. Priya sees the ranked list, not raw sensor feeds.
- FR-2.3. Weights are city-configurable per contaminant class (WHO-grounded defaults); Anjali credibility updates weekly in v1, not real-time.
- FR-2.4. v1 implementation is weighted-voting. v2 may swap to ML; the five-input/ranked-list-output contract is sealed (C-7) — consumers insulated from the swap.
- *Acceptance:* Given inputs from ≥3 of the five source types, engine produces an ordered list of 4-6 candidate incidents with attribution and confidence that Priya can act on in <3 minutes per incident.

**FR-3 — Playbook authoring, simulation, and deviation-to-amendment lifecycle.** *(Story 3; Spec: CAP-7 + C-13 + C-14; Companion: playbook-lifecycle.md.)*
- FR-3.1. Seven-stage lifecycle: author → approve → run → deviate → review → amend → re-approve. Every stage writes to the audit chain.
- FR-3.2. Authoring surface: structured editor with constraint checks against the WHO-grounded template library (C-14 — v1 deliverable, not external dependency). Confidence score surfaces on the draft.
- FR-3.3. Simulator: 2-minute "what would have happened" dry-run against historical or synthetic incidents. Available for new sensor configs, new playbook drafts, new shifts.
- FR-3.4. Approval authority: PHA director owns approval, vendor does not. Dual signature if the amendment touches the T3 boundary.
- FR-3.5. Deviation is first-class with friction but not block. Override-with-reasoning captured to audit chain as a distinct event type. Monthly review clusters deviations; patterns indicate either bad playbook step (system problem) or uniquely good operator instinct (training material). Clusters promote to amendment candidates with lineage recorded.
- FR-3.6. Liability split is codified: vendor carries platform-integrity liability; PHA carries approval liability; utility carries operational liability. Audit chain is the evidence surface.
- FR-3.7. Simulator Harness reads inputs from event stream; outputs returned to caller; **does not persist** (AD-3 non-persistence property); harness contract is sealed.
- *Acceptance:* A senior operator authors a contaminant-class playbook in the editor with constraint checks; dry-runs it against a synthetic event in <2 minutes; deviations from a live incident surface as proposed amendments in the next monthly review.

**FR-4 — Anjali one-tap reporting across WhatsApp, voice, image, and SMS in regional language.** *(Story 4; Spec: CAP-1 + C-11 + C-15; Companion: personas.md Anjali.)*
- FR-4.1. Voice + image + SMS over text; SMS is first-class not fallback (C-11).
- FR-4.2. Local-language UI: Bangla primary, English fallback.
- FR-4.3. Reports reach Priya within 5 minutes when online; queued offline-first when not. Multi-radio connectivity architecture (cellular primary / LPWAN secondary / SD-card tertiary, C-15) routes around outages silently.
- FR-4.4. Phone-as-network for ward sentinel: Anjali's phone syncs to cloud when it can, inheriting offline-first patterns from community-health-worker systems.
- FR-4.5. Anjali is the only trust-bearing interface: no login, no training app, no dashboard. Survives cracked-screen Android, low data plan, WhatsApp-only.
- FR-4.6. Hybrid incentive surface: BDT 2,000/month stipend (~US$18) tied to weekly check-in discipline (not per-report bounty) + credential issued by ICDDR,B or Bangabandhu Sheikh Mujib Medical University + quarterly city-level recognition. Stipend structure cannot be per-report bounty (creates gaming + false-positive inflation).
- FR-4.7. Public acknowledgement when her report triggers a real response; she must see that her report mattered.
- *Acceptance:* A real Anjali at a real school can complete a daily check-in + sentinel-strip photo + "something wrong" escalation in <60 seconds on a low-end Android phone with intermittent connectivity; her report reaches Priya within 5 minutes when online.

**FR-5 — Priya ranked action list with playbook execution and deviation capture.** *(Story 5; Spec: CAP-2; Companion: personas.md Priya.)*
- FR-5.1. Incident dashboard ranked by fusion score, with source attribution and corroborated confidence — not raw sensor feeds.
- FR-5.2. Auto-generated handover brief at shift change ("today's open threads"); kills tribal-knowledge dependency.
- FR-5.3. Read-only playbook view + ability to execute steps against the active version-of-record (latest `PlaybookVersionPublished` event per AD-13). Every action and non-action logged against the playbook step with reasoning.
- FR-5.4. Override-with-reasoning capture. Deviations compared to outcomes and feed threshold tuning + Priya credential.
- FR-5.5. Escape hatch with friction but not block when deviating from playbook. Blame-free review is the goal; a block would cost her trust on the bad day.
- FR-5.6. Auto-generated PHA monthly report assembled from the audit trail, not by hand.
- *Acceptance:* A real Priya can pick the top-ranked incident, see source-attribution + corroboration confidence, execute the matching playbook step, and if she deviates record the reason — all in <3 minutes per incident.

**FR-6 — PHA pane for playbook approval, threshold tuning, and audit without alteration.** *(Story 6; Spec: CAP-3 + C-3; Companion: personas.md Dr. Mensah, escalation-policy.md §5a, sales-motion.md §4a.)*
- FR-6.1. Playbook amendment approvals with dual signature at T3 boundary (identical-payload-triple attestation per AD-11).
- FR-6.2. Per-contaminant-class threshold tuning with tiered SLA (C-3): acute classes (bacterial, chemical spill, sewage cross-connection) — 5 minutes SLA, on-call rotation, 3 named approvers, 7×24 coverage, auto-escalation on timeout. Chronic classes (lead leach, conductivity drift, cumulative exposure, seasonal drift) — 4 hours SLA, business hours, batched review 2x/day.
- FR-6.3. Read-only audit-chain browser: cross-ward aggregates, deviation dashboards, threshold edit history with reasoning. Access-logged per read.
- FR-6.4. Cross-utility oversight + standard-setting authority. PHA owns the threshold where public notice fires; Mayor's office owns message tone (T3+).
- FR-6.5. Never a message-desk. The PHA does not become the message issuer.
- FR-6.6. WB-aligned evidence-export tooling from day one (C-16) — disbursement-linked indicators, results framework, audit-trail evidence per outcome — without retrofit. Exports aggregated k-anonymized indicators only; no raw PII or raw observations cross residency boundary (AD-9, AD-16).
- *Acceptance:* PHA director signs a playbook amendment in the app; tunes per-contaminant-class threshold; views deviation dashboard — all from one pane, with cryptographic proof that the audit chain is unaltered since the events he queries.

**FR-7 — Ramesh consumer messaging via WhatsApp and SMS at Tier 3 and above.** *(Story 7; Spec: CAP-4 + C-4; Companion: personas.md Ramesh, architecture-invariants.md §5.)*
- FR-7.1. Public messages only at Tier 3 or above (C-4). No public broadcast from T1 or T2.
- FR-7.2. Two-person rule on consumer message issuance (C-4, C-8).
- FR-7.3. WhatsApp + SMS redundancy (architecture-invariants.md §5); signed gateway. SMS carries more legal weight in target geographies than WhatsApp.
- FR-7.4. Plain-language messages: "Safe now / Boil / Do not drink / Use bottled / Wait" — short and sourced. Names the issuing authority, the affected zone, the action, and the verification horizon.
- FR-7.5. Ward-councillor network as trust-bridging voice: messages routed through councillor carry more weight than system-issued messages. Brand is the councillor's endorsement, not the platform's.
- FR-7.6. No app install, no dashboard, no paywall. The system is invisible infrastructure.
- *Acceptance:* Ramesh receives a Tier 3 public notice via WhatsApp + SMS within 15 minutes of confirmed contamination; the message names the issuing authority, affected zone, action, and verification horizon; no app download required.

### Non-Functional Requirements

**NFR-P1 — Performance**
- NFR-P1.1. Anjali report ingestion: <5 minutes end-to-end (online); queued offline-first with no data loss.
- NFR-P1.2. Priya dashboard load: ranked action list surfaces within 3 seconds of login.
- NFR-P1.3. Sentinel strip CV read: <10 seconds per strip on mid-tier Android.
- NFR-P1.4. Source-fusion engine: produces ranked list in <2 seconds for the v1 input volume (5 sensors + 30 strips + Anjali reports).

**NFR-R1 — Reliability & Availability**
- NFR-R1.1. Sensor ingestion tolerates connectivity loss as expected operation (C-15). Latency of action beats measurement accuracy.
- NFR-R1.2. Audit chain gateway is the most-load-bearing service; designed for no-data-loss writes. Replication across at least 2 geographic zones per tenant city.
- NFR-R1.3. Consumer message issuance is synchronous (not best-effort) — failed deliveries retry, escalate to alternative channel (SMS fallback if WhatsApp down).
- NFR-R1.4. Idempotency by `(tenant_id, event_id)` (AD-14): gateway rejects duplicate pairs with `DuplicateEventRejected`; adapters mint `event_id` once at user-acknowledged submission time.

**NFR-S1 — Privacy & Security**
- NFR-S1.1. Privacy-by-default (C-10): zone-level geofence for consumer reports (not lat/long), anonymized consumer reports by default, encryption at rest + in transit + E2E on consumer channel.
- NFR-S1.2. Right-to-be-forgotten via `SubjectRedacted` tombstones (AD-16); projections apply redaction on read; chain never edited.
- NFR-S1.3. RBAC defense-in-depth, three layers (AD-6): gateway / service boundary / data-access layer. Closed `actor_identity.role` enum tied to per-city RBAC matrix; gateway rejects events whose role is not in the closed enum or whose `actor_identity.ref` cannot be resolved to a live auth-session reference (AD-12).
- NFR-S1.4. Access-logged operator data: every read of operator data produces an audit event.
- NFR-S1.5. Override-anomaly detection: logged in v1, enforced in v2 (architecture-invariants.md §7). Override patterns deviating from peer baselines surface for retrospective review.

**NFR-M1 — Multi-tenancy & Data Sovereignty**
- NFR-M1.1. Per-city database isolation (C-1); no cross-city joins at the storage layer.
- NFR-M1.2. Per-city RBAC matrix; same global role name maps to city-specific permissions.
- NFR-M1.3. Per-city audit-chain namespace. Federation operates on aggregated roll-ups, not raw cross-city reads.
- NFR-M1.4. Data sovereignty: Bangladesh-resident data lives in Bangladesh-resident storage (AD-9). Active write path must be Bangladesh-resident; AWS ap-southeast-1 acceptable as replicated peer only.
- NFR-M1.5. Retention floor per tenant (default 7 years; per WB / city contract). Out-of-region backup snapshots are cold-storage only; live path stays in Bangladesh.

**NFR-C1 — Compliance**
- NFR-C1.1. Audit standards satisfy World Bank IDA/IBRD audit requirements (C-16) from day one — disbursement-linked indicators, results framework, audit-trail evidence per outcome.
- NFR-C1.2. Reporting cadence aligned to WB quarterly/milestone submission. The auto-generated PHA monthly report must roll up into the WB quarterly submission without manual reassembly.
- NFR-C1.3. Liability contract split (C-13) reflected in Dhaka city contract: vendor platform-integrity liability; PHA approval liability; utility operational liability. Audit chain as the evidence surface; `actor_identity` enforcement is structural, not contractual (AD-12).
- NFR-C1.4. Sentinel QA discipline (C-9): third-party lab certifies each lot before shipment; vendor's role ends at certified delivery; city owns handling discipline and field failures.

**NFR-N1 — Connectivity & Resilience**
- NFR-N1.1. Multi-radio fallback (C-15; AD-8): cellular primary → LPWAN secondary → SD-card store-and-forward tertiary. Every sensor ingest request declares a radio tier; gateway routes through the right adapter.
- NFR-N1.2. Ward sentinel uses phone-as-network (Anjali's phone, offline-first sync).
- NFR-N1.3. SMS is first-class (not degraded fallback, C-11).
- NFR-N1.4. Sensor silence beyond configurable threshold = `SensorSilenceObserved` audit event (FR-1.4).

**NFR-I1 — Interoperability**
- NFR-I1.1. Read-only APIs into existing SCADA where present (NG-1 — do not replace SCADA, sit alongside it).
- NFR-I1.2. APIs into billing, lab systems with least-privilege permissions.
- NFR-I1.3. SOC2-ready posture in v1.

**NFR-O1 — Observability**
- NFR-O1.1. Internal observability stack with vendor-neutral tooling (AD-10); OpenTelemetry (CNCF Graduated) for instrumentation.
- NFR-O1.2. Chain-integrity monitor verifies hash chain every N minutes.
- NFR-O1.3. Sensor-silence monitor alerts on any sensor silent beyond threshold.
- NFR-O1.4. Override-anomaly monitor (logged v1, enforced v2).
- NFR-O1.5. Logs themselves are events; the chain is the source of truth for everything the platform does.

### Additional Requirements (Architecture)

The architecture spine contributes 16 ADs that govern implementation consistency. Each AD translates into a sub-list of implementation requirements that bind across multiple epics.

**AR-A1 — Event store IS the audit chain (AD-1).** All state changes are events written through the gateway. The audit chain gateway is the single write path. No component writes to operational storage directly. Content-addressed blocks; each block references prior hash. Implemented in Epic 1 (foundation), consumed by every other epic.

**AR-A2 — Hybrid aggregate model (AD-2).** Observations are first-class events written to the stream before fusion. Incidents are lazily materialized by the Incident Aggregator when fusion correlates ≥1 observation into a coherent story. Incident identity is content-addressed: `sha256(canonical(observation_event_ids[] | tenant_id | correlation_window_id | contaminant_class))`. The Incident Aggregator is the sole writer of `IncidentCreated` events. Cross-epic: Epic 2 produces the observation stream, Epic 1's gateway materializes Incidents.

**AR-A3 — Sealed-component contracts (AD-3).** Each sealed component exposes a stable input/output contract, versioned. Sealed list: Audit Chain Gateway, Source-Fusion Engine, Incident Aggregator, Playbook Engine, Simulator Harness, Channel Adapters, Multi-Radio Ingestion, Auth + RBAC, UIs. Simulator Harness does not persist — reads from event stream; outputs returned to caller, not written back. The fusion contract's `source_attribution` is pinned to `[observation_id, source_type, weight, observed_at]` — not free-form strings.

**AR-A4 — Event-schema evolution: strict versioning + upcasters (AD-4).** Every event schema has a version (v1, v2, v3…). New versions add fields but never rename or remove. Old events upcasted on read by per-version upcaster functions. Schema-version bumps require PHA + vendor dual sign-off (two-person rule applied to schema evolution). Upcasters owned by event-type owner, shipped in lockstep with version bump. Schema version-of-record = latest `SchemaVersionBumped` event. Cross-epic: Epic 1 establishes the schema-registry mechanism; every other epic's component owns its event types and upcasters.

**AR-A5 — Strict logical per-tenant isolation (AD-5).** Each tenant city has its own logical database with its own audit-chain namespace. No cross-tenant joins at any layer (gateway, service, data-access). Federation operates on aggregated projections only. Tenant isolation verified at all three RBAC layers.

**AR-A6 — RBAC defense-in-depth, three layers (AD-6).** Permission checks at (1) gateway/admission, (2) service boundary/component-internal, (3) data-access layer/storage query. Per-city policy matrix; cross-cutting concern.

**AR-A7 — Three UIs as separate products (AD-7).** Anjali-mobile, Priya-desktop, PHA-pane are three separate products with separate deploy cadences. No shared component library above the data layer. Drives Epic 4 / Epic 5 / Epic 6 split.

**AR-A8 — Multi-radio contract enforced at gateway (AD-8).** Every sensor ingest request declares a radio tier. Gateway routes through right adapter. Adapters port-swappable. Cross-epic: Epic 1 implements the routing; Epic 4 (Anjali) and Epic 5 (Priya's industrial sensor view) consume.

**AR-A9 — Single-region Dhaka deployment (AD-9).** Single-region Bangladesh-resident active write path; replicated peer; out-of-region backup snapshots are cold-storage only. Multi-region is v2-on. Drives operational requirements across all epics.

**AR-A10 — Internal + vendor-neutral observability (AD-10).** OpenTelemetry (CNCF Graduated) for instrumentation; vendor-neutral metrics/logs/traces backend. Monitors: chain-integrity, sensor-silence, override-anomaly. Logs are events.

**AR-A11 — Two-person rule on T3-boundary + consumer messages (AD-11).** Both signatures must attest to identical `(event_id, payload_hash, version_id)` triple. Linked `SignatureAttestation` events; gateway accepts underlying command only after both attestations. Cross-epic: Epic 1 implements mechanism; Epic 3 (playbook amendment approval at T3), Epic 6 (PHA approval), Epic 7 (consumer message issuance) consume.

**AR-A12 — Liability split via actor identity (AD-12).** Every event carries `actor_identity` with `role` (closed enum per-city-tenant: `{vendor, pha_approver, utility_operator, anjali, priya, pha_viewer, system}`) and `ref` (resolved from auth-service session token, not minted by emitting component). Gateway rejects events whose role is not in closed enum or whose ref is not session-bound. Splits liability vendor/PHA/utility structurally.

**AR-A13 — Version-of-record content-addressed; simulator reads from event stream (AD-13).** `PlaybookVersionPublished` event carries `version_id = sha256(canonical(serialized_playbook_definition))`. Version-of-record = latest published event per tenant. Lineage is linear via `parent_version_id`. Drafts emit `PlaybookVersionDrafted`; abandoned drafts emit `PlaybookVersionAbandoned` (append-only). Simulator Harness reads inputs from event stream. Cross-epic: Epic 3 owns the lifecycle; Epic 6 (PHA pane) reads version-of-record.

**AR-A14 — Idempotency by `(tenant_id, event_id)` (AD-14).** Gateway rejects duplicate pairs with `DuplicateEventRejected` (silent dedup forbidden — chain must show the attempt). Adapters mint `event_id` at user-acknowledged submission time. Critical for Epic 4 (mobile reconnect storms), Epic 5 (industrial sensor retries), Epic 7 (consumer message retry).

**AR-A15 — Change-management authority is structured (AD-15).** Three categories of platform-wide change each have named authority + dual-signature event: schema-version bump (event-type owner; vendor + pha_approver), playbook version promotion (Playbook Engine component; pha_approver + utility_operator), city-wide config change (PHA per-tenant; pha_approver single-signature; emits `CityConfigChanged`). All event-sourced; no out-of-band config-update path.

**AR-A16 — Retention floor + RTBF via tombstones (AD-16).** Chain remains append-only and tamper-evident. RTBF honored by `SubjectRedacted` events; projections apply redaction on read. Retention floor default 7 years per WB / city contract. Principles: "chain remembers everything; projection forgets what the law requires it to forget."

### UX Design Requirements

**No UX design document exists for Surakkha v1.** This is not a gap to flag — the spec kernel explicitly commits to three persona-specific UIs (Anjali-mobile / Priya-desktop / PHA-pane) where the UI *is* the persona win, not a wrapper around shared design tokens. Each surface's design language is specified in `personas.md` and ratified by spec constraint C-2 ("three persona-specific UIs, not one responsive app"). No reusable component library above the data layer (AD-7).

UX-driven requirements that fall out of `personas.md` rather than a separate UX document:

- **UX-DR1 — Anjali-mobile survives cracked-screen Android, low data plan, WhatsApp-only.** No login, no training app, no dashboard. Voice and image inputs first-class. WhatsApp Business API as primary channel; SMS as legal-weight equivalent.
- **UX-DR2 — Priya-desktop ranks by fusion score, never raw sensor feeds.** Auto-generated handover brief at shift change. Read-only playbook view + deviation-with-reasoning capture that does not block.
- **UX-DR3 — PHA-pane is read-mostly regulator pane, never a message-desk.** Approval surface + threshold tuning + audit browser. Cryptographic proof of unaltered audit chain on every query.
- **UX-DR4 — Ramesh-channel is invisible infrastructure.** No app install, no dashboard, no paywall. Plain-language messages only ("Safe now / Boil / Do not drink / Use bottled / Wait").
- **UX-DR5 — Councillor-network trust-bridging voice.** Messages routed through councillor carry more weight than system-issued messages; brand is the councillor's endorsement, not the platform's.
- **UX-DR6 — Local-language UI for Anjali.** Bangla primary; English fallback.
- **UX-DR7 — Public acknowledgement when Anjali's report triggers a real response.** She must see that her report mattered.

### FR Coverage Map

| FR | Epic | Brief |
|---|---|---|
| FR-1 (audit chain: append-only content-addressed, two-person rule, sensor-silence logging, access-logged reads) | Epic 1 — Trust Foundation | The seam every later epic writes through; provides tamper-evidence + access policy enforcement |
| FR-2 (fusion engine: 5 inputs → ranked 4-6 incident list, sealed contract, weighted-voting v1) | Epic 2 — Heterogeneous Detection | Sensor + Anjali + complaint + lab + env → ranked incident list that Priya consumes |
| FR-3 (playbook authoring, simulation, deviation-to-amendment, PHA-owned approval) | Epic 3 — Codified Response | WHO-grounded templates + authoring + simulator + deviation cluster to amendment |
| FR-4 (Anjali one-tap reporting: WhatsApp / voice / image / SMS, Bangla, offline-first, hybrid incentive) | Epic 4 — Field Reporting | Trust-bearing interface; sub-60s report; reaches Priya in 5 min online |
| FR-5 (Priya ranked action list + playbook execution + deviation + handover + monthly report) | Epic 5 — Operations Desk | Ranks incidents, executes steps, captures deviations, hands over cleanly |
| FR-6 (PHA pane: playbook approval + threshold tuning + audit browser + WB export) | Epic 6 — Regulator Governance | Approves amendments, tunes thresholds, audits without altering, exports WB evidence |
| FR-7 (Ramesh consumer messaging at T3+: WhatsApp + SMS, two-person rule, councillor trust-bridging) | Epic 7 — Public Notice Channel | Issues plain-language notices; signed; 15 min from confirmed contamination |

**NFR coverage:**
- Performance NFRs (NFR-P1.*) surface in Epic 5 (Priya dashboard load) and Epic 2 (fusion engine latency) and Epic 4 (Anjali ingestion)
- Reliability NFRs (NFR-R1.*) live in Epic 1 (no-data-loss writes, idempotency by `(tenant_id, event_id)`)
- Privacy & Security NFRs (NFR-S1.*) spread across Epic 1 (RBAC defense-in-depth, audit access), Epic 4 (zone-geofence), and Epic 6 (audit-browser access-logged)
- Multi-tenancy / sovereignty NFRs (NFR-M1.*) cross-cutting across all epics; epic-specific lines in Epic 1 (per-city namespace) + Epic 2 (per-city RBAC matrix) + Epic 6 (WB export aggregated-only)
- Compliance NFRs (NFR-C1.*) cross-cutting; epic-specific in Epic 6 (WB export tooling) and Epic 1 (liability split via `actor_identity`)
- Connectivity (NFR-N1.*) cross-cutting; epic-specific in Epic 1 (multi-radio gateway) + Epic 4 (Anjali multi-radio + phone-as-network)
- Interoperability (NFR-I1.*) cross-cutting; surfaced in Epic 1 (SCADA read-only adapter) + Epic 2 (lab system adapter)
- Observability (NFR-O1.*) cross-cutting; epic-specific monitors in Epic 1 (chain-integrity, sensor-silence, override-anomaly)

**AD coverage:**
- AD-1..AD-12 govern Epic 1 (Trust Foundation) directly
- AD-2 (hybrid aggregate) + AD-3 (sealed fusion contract) govern Epic 2
- AD-3 (sealed playbook contract, simulator non-persistence) + AD-13 (version-of-record) + AD-15 (change-management authority) govern Epic 3
- AD-7 (three UIs as products) + AD-8 (multi-radio at gateway) govern Epic 4
- AD-7 (Priya-desktop) + AD-2 (Priya consumes from incident projection) govern Epic 5
- AD-7 (PHA-pane) + AD-11 (identical-triple two-person attestation) + AD-12 (closed role enum) + AD-15 (city-wide config change) + AD-16 (RTBF tombstone) govern Epic 6
- AD-3 (channel adapter sealed) + AD-11 (two-person rule on consumer messages) govern Epic 7
- AD-4 + AD-5 + AD-6 + AD-9 + AD-10 + AD-14 + AD-16 cross all epics; surfaced in implementation across the foundation

## Epic List

### Epic 1: Trust Foundation (Audit Chain, RBAC, Multi-tenancy Seam)
A regulator (PHA), an operator (Priya), or a court can verify that every event on the system — sensor readings, threshold changes, playbook approvals, operator actions, deviations, consumer-message issuances, role changes, logins, lab submissions — was captured, content-addressed, chained to its predecessor, written through a single gateway, scoped to one tenant city, and policy-controlled on read. Two-person rule is enforced in code for sensitive events; RBAC checks happen at three layers; right-to-be-forgotten is honored by tombstones not edits. After this epic, no later epic needs to defend its own trust model; it just writes events through the gateway and consumes projections. **FRs covered:** FR-1 (all sub-FRs). **Key ADs:** AD-1, AD-4, AD-5, AD-6, AD-10, AD-11, AD-12, AD-14, AD-15, AD-16. **Depends on:** nothing (first epic). **Enables:** every later epic.

### Epic 2: Heterogeneous Detection (Source-Fusion Engine)
A central operator sees a ranked, source-attributed, confidence-scored list of 4-6 candidate incidents — *not* raw sensor feeds — derived from five source types (industrial probes, Anjali reports with credibility weights, citizen complaint clusters, lab results, environmental signals). Weights are city-configurable per contaminant class. The engine's contract is sealed: v2 may swap to ML without changing what consumers see. **FRs covered:** FR-2 (all sub-FRs). **Key ADs:** AD-2, AD-3. **Depends on:** Epic 1 (writes through the gateway). **Enables:** Epic 3 (playbook consumes ranked list input), Epic 5 (Priya consumes projection).

### Epic 3: Codified Response (Playbook Lifecycle + Simulator + Deviation-to-Amendment)
A senior operator authors contaminant-class playbooks from WHO-grounded templates with constraint checks and a confidence score; runs the simulator (2-minute "what would have happened" dry-run against historical or synthetic incidents); the PHA owns approval (vendor does not); deviations captured live with reasoning are first-class audit events that cluster monthly and surface as amendment candidates. Each amendment is a `PlaybookVersionPublished` event with content-addressed version_id; the Simulator Harness reads from the event stream (not projections) and does not persist. **FRs covered:** FR-3 (all sub-FRs including FR-3.7 simulator non-persistence). **Key ADs:** AD-3, AD-13, AD-15. **Depends on:** Epic 1 (writes through gateway), Epic 2 (playbook consumes fusion output). **Enables:** Epic 6 (PHA approves), Epic 5 (Priya executes).

### Epic 4: Field Reporting (Anjali-mobile Trust-Bearing Interface)
A real Anjali at a real school can complete a daily check-in, a sentinel-strip photo, and a "something wrong" escalation in under 60 seconds on a low-end Android with intermittent connectivity, in Bangla (English fallback). Voice, image, and SMS are first-class alongside WhatsApp; SMS is first-class (not fallback) per spec C-11. Multi-radio routing (cellular / LPWAN / SD-card) routes around outages silently; her phone acts as the network endpoint for ward sentinels. Reports reach Priya within 5 minutes online and queue offline-first. She sees that her report triggered a real response (public acknowledgement surface). **FRs covered:** FR-4 (all sub-FRs including FR-4.6 hybrid incentive + FR-4.7 public acknowledgement). **Key ADs:** AD-7, AD-8, AD-14. **Depends on:** Epic 1 (writes through gateway), Epic 2 (reports become fusion input). **Enables:** Epic 5 (Priya sees Anjali reports ranked), Epic 7 (Ramesh public notice may reference Anjali's zone).

### Epic 5: Operations Desk (Priya-desktop Ranked Action List)
A real Priya can pick the top-ranked incident, see source-attribution + corroboration confidence, execute the matching playbook step against the active version-of-record, and if she deviates record the reason — all in under 3 minutes per incident. The handover brief at shift change is auto-generated, killing tribal knowledge. The auto-generated PHA monthly report is assembled from the audit trail, not by hand. **FRs covered:** FR-5 (all sub-FRs including FR-5.3 version-of-record consumption + FR-5.6 auto-generated PHA report). **Key ADs:** AD-2 (Priya consumes from incident projection), AD-7 (Priya-desktop as separate product). **Depends on:** Epic 1, Epic 2, Epic 3. **Enables:** Epic 6 (PHA reads Priya's deviation clusters), Epic 7 (Priya's actions are inputs to two-person approval flow).

### Epic 6: Regulator Governance (PHA Pane + World Bank Evidence Export)
Dr. Mensah signs a playbook amendment in the app (dual signature at T3 boundary, identical-payload-triple attestation), tunes per-contaminant-class thresholds with tiered SLA (acute = 5 min on-call; chronic = 4 hr business hours), and views a cross-ward deviation dashboard — all from one read-mostly pane with cryptographic proof of unaltered audit chain. World Bank evidence-export tooling ships day one: aggregated k-anonymized indicators only, no raw PII or raw observations cross residency boundary. PHA-owned thresholds, Mayor-owned message tone, PHA is never the message-desk. **FRs covered:** FR-6 (all sub-FRs including FR-6.2 tiered SLA + FR-6.6 WB-aligned export). **Key ADs:** AD-7, AD-11, AD-12, AD-15, AD-16, AD-9. **Depends on:** Epic 1, Epic 3 (approves amendments), Epic 4 + Epic 5 (consumes Priya + Anjali inputs). **Enables:** Epic 7 (PHA approval gates T3-boundary consumer messages).

### Epic 7: Public Notice Channel (Ramesh-class Consumer Messaging)
A consumer receives a plain-language notice ("Safe now / Boil / Do not drink / Use bottled / Wait") via WhatsApp + SMS within 15 minutes of confirmed contamination, only at Tier 3 or above, only after dual-signature approval. SMS carries more legal weight than WhatsApp. Ward-councillor-routed messages carry more weight than system-issued messages. No app install, no dashboard, no paywall. **FRs covered:** FR-7 (all sub-FRs). **Key ADs:** AD-3 (sealed channel adapter), AD-11 (two-person attestation on consumer message issuance). **Depends on:** Epic 1, Epic 3, Epic 6 (PHA approval flows). **Enables:** the lighthouse success signal (two consecutive real contamination events handled cleanly with PHA attestation).


## Epic 1: Trust Foundation (Audit Chain, RBAC, Multi-tenancy Seam)

A regulator, operator, or court can verify that every event on the system was captured, content-addressed, chained to its predecessor, written through a single gateway, scoped to one tenant city, and policy-controlled on read. Two-person rule is enforced in code for sensitive events; RBAC checks happen at three layers; right-to-be-forgotten is honored by tombstones not edits. After this epic, no later epic needs to defend its own trust model; it just writes events through the gateway and consumes projections.

**FRs covered:** FR-1 (FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5). **NFRs:** NFR-R1.2 (no-data-loss writes), NFR-R1.4 (idempotency), NFR-S1.2 (RTBF), NFR-S1.3 (RBAC defense-in-depth), NFR-S1.4 (access-logged reads), NFR-M1.1 + NFR-M1.3 + NFR-M1.4 + NFR-M1.5 (per-city isolation + Bangladesh residency + retention), NFR-O1.1 + NFR-O1.2 + NFR-O1.5 (observability + chain-integrity monitor). **Key ADs:** AD-1, AD-4, AD-5, AD-6, AD-10, AD-11, AD-12, AD-14, AD-15, AD-16.

### Story 1.1: Single-Gateway Content-Addressed Chain with Per-Tenant Namespace

As a platform architect,
I want every audit-relevant event written through one gateway that produces content-addressed, hash-chained blocks scoped to a tenant city,
So that retroactive tampering is detectable, federation is architectural-not-active, and every later component has a defensible write path.

**Acceptance Criteria:**

**Given** a tenant city `dhaka` is provisioned and a single-tenant deployment is configured
**When** any component submits an event `{tenant_id, schema_version, event_type, event_id, occurred_at, ingested_at, actor_identity, correlation_id, causation_id, payload}` to the gateway
**Then** the gateway validates `tenant_id` is present and matches the active session's tenant scope (gateway-enforced; missing → request-rejection condition)
**And** the gateway assigns the next block in the chain with a header containing `prev_block_hash` and a new `block_hash = sha256(canonical(header || event))`
**And** the block is persisted to the content-addressed store; the chain is gateway-computed (the underlying store is unaware of chaining) per consistency convention
**And** no component writes to operational storage directly — the gateway is the only component that may depend on storage; all other reads are projections of the event stream

**Given** a tenant `dhaka` has been provisioned and a second tenant `delhi` is later added
**When** an event is submitted without a tenant_id
**Then** the gateway rejects the event with `CommandRejected{reason: "missing tenant_id"}` before any persistence
**And** an attempt to read another tenant's events from a tenant-scoped query returns an empty result and logs a `CrossTenantAccessAttempted` audit event (gateway-enforced per AD-5)

**Given** a chain has been built for tenant `dhaka`
**When** the chain-integrity monitor runs every N minutes (N ≤ 60 per NFR-O1.2)
**Then** it recomputes the hash chain forward and back from a checkpoint
**And** any mismatch raises a `ChainVerificationFailed` event into the operational stream and a high-severity alert (per AD-10)
**And** tamper with any past block (modifying its payload or header) is detected because the recomputed hash diverges

**Given** an event schema is v1 and a v2 is published
**When** the schema-version bump is approved (dual-signed `SchemaVersionBumped` event with `pha_approver` + `vendor` signatures per AD-4 + AD-15)
**Then** the chain itself never migrates (no rewrite of past events)
**And** projections reading v1 events upcast them inline via per-version upcaster functions owned by the event-type owner
**And** the chain-integrity monitor flags any projection that lags behind the latest upcaster
**And** the schema registry emits the new version as an event on a dedicated schema-registry stream

### Story 1.2: RBAC Defense-in-Depth with Closed Role Enum and Session-Bound Actor Identity

As a platform architect,
I want permission checks at three layers (gateway / service boundary / data-access) with a closed-role enum for `actor_identity.role` and a session-bound `actor_identity.ref`,
So that the vendor / PHA / utility liability split (C-13) is structural rather than contractual, and the gateway rejects free-form role strings or self-minted actor references.

**Acceptance Criteria:**

**Given** the RBAC policy matrix for tenant `dhaka` defines roles `{vendor, pha_approver, utility_operator, anjali, priya, pha_viewer, system}` (closed enum per AD-12)
**When** an authenticated principal submits an event
**Then** the gateway validates the principal's session token against the auth service, resolves `actor_identity.ref` from the session, and refuses to accept an event whose `actor_identity.role` is outside the closed enum
**And** the gateway rejects events whose `actor_identity.ref` is not bound to a live auth-session reference at write time (gateway-enforced; emits `CommandRejected{reason: "actor_ref not session-bound"}`)

**Given** the gateway receives an event
**When** the event reaches a service boundary inside any component
**Then** the component performs a second-layer permission check (component-internal) verifying the role is permitted for this event_type
**And** on rejection, the component emits a `CommandRejected` event with the typed reason; no raw exception crosses the boundary

**Given** a component queries storage directly (e.g., a projection rebuild job)
**When** the query is executed
**Then** the data-access layer applies a third permission check filtered by `tenant_id` and the requesting role's allowed scopes
**And** the query result is rejected if it would cross-tenant; the rejection is logged as a `CrossTenantAccessAttempted` audit event

**Given** an audit-chain read is performed by a `priya` role
**When** the read request is submitted
**Then** the read returns only events where `priya` is the actor or events that the per-city policy matrix permits `priya` to view
**And** the read access is logged as a `ChainReadPerformed` event carrying `actor_identity`, `tenant_id`, and the query filter — every read produces an audit event (NFR-S1.4)

**Given** a `pha_approver` role queries chain
**Then** `pha_approver` sees cross-ward aggregates and the audit browser; the audit browser is read-only and every read is access-logged
**And** `pha_approver` cannot mutate the chain — only `vendor` and `pha_approver` (in specific event_type pairs) may emit specific two-person-required events (per AD-11)

### Story 1.3: Two-Person Rule + Idempotency + RTBF via Tombstones

As a platform architect,
I want sensitive events gated by dual-signature attestation over an identical-payload triple, every event idempotent by `(tenant_id, event_id)`, and right-to-be-forgotten honored by tombstones not edits,
So that no single actor mutates politically sensitive state, store-and-forward retries don't produce duplicate incidents, and the chain remains append-only under privacy pressure.

**Acceptance Criteria:**

**Given** a `PlaybookAmendmentApproved` event is submitted that touches the T3 boundary (or a `ConsumerMessageIssued` event)
**When** the underlying event is presented to the gateway
**Then** the gateway emits a placeholder event but does NOT accept the underlying command until two `SignatureAttestation` events are recorded
**And** both attestations must carry `event_id`, `payload_hash`, and `version_id` matching the underlying event exactly (identical triple per AD-11)
**And** if the second attestation lands against a `payload_hash` that differs from the first (e.g., a typo-correction v2), the second attestation is rejected and the chain shows the rejection attempt

**Given** the two attestations match and are recorded
**Then** the gateway accepts the underlying command by emitting it as a normal event in the chain with both attestation events as `causation_id` predecessors
**And** the two actor identities are distinct per the closed enum: e.g., `pha_approver` + `vendor` for T3-boundary playbook amendments; `pha_approver` + `utility_operator` for consumer message issuance (per C-13 split)

**Given** an adapter (mobile or SD-card store-and-forward) retries submitting the same logical event after a connectivity drop
**When** the retry arrives at the gateway with the same `(tenant_id, event_id)` as a previously accepted event
**Then** the gateway rejects the retry with a typed `DuplicateEventRejected` event (silent dedup is forbidden — the chain must show the attempt)
**And** the client receives the rejection and surfaces a stable state (no retry storm)

**Given** adapters mint `event_id` at user-acknowledged submission time
**When** the user re-tries the same logical event
**Then** the same `event_id` is reused (the client tracks logical event identity, not network attempt identity)
**And** the gateway accepts only the first submission; subsequent retries are visible in the chain as `DuplicateEventRejected`

**Given** a right-to-be-forgotten request is received for an `actor_ref` (or a geofenced `subject_geo_id`)
**When** the request is processed
**Then** the gateway emits a `SubjectRedacted` event referencing the subject's identity
**And** no event in the chain is rewritten or deleted (append-only and tamper-evident per AD-16)
**And** downstream projections apply the redaction on read (subject's payload fields become `null` or `redacted`)
**And** the `SubjectRedacted` event itself remains in the chain as evidence the request was honored

**Given** an event older than the retention floor (default 7 years; per WB / city contract) is past its live-projection window
**When** the projection serves the historical window
**Then** the projection lazy-restores from immutable out-of-region cold storage
**And** redactions from `SubjectRedacted` events apply consistently across the restored window
**And** the cold-storage snapshots never leave the audit-chain structure (they're block-anchored)

**Given** a sensor has not reported within a configurable threshold (C-15)
**When** the sensor-silence monitor detects the silence
**Then** it emits a `SensorSilenceObserved` event to the audit chain with `sensor_id`, `tenant_id`, `last_observed_at`, `silent_since`
**And** the chain shows the silence as a recorded event, not maintenance noise (FR-1.4)

## Epic 2: Heterogeneous Detection (Source-Fusion Engine)

A central operator sees a ranked, source-attributed, confidence-scored list of 4-6 candidate incidents — *not* raw sensor feeds — derived from five source types. Weights are city-configurable per contaminant class. The engine's contract is sealed: v2 may swap to ML without changing what consumers see.

**FRs covered:** FR-2 (FR-2.1, FR-2.2, FR-2.3, FR-2.4). **NFRs:** NFR-P1.4 (fusion latency <2s). **Key ADs:** AD-2, AD-3.

### Story 2.1: Source-Fusion Engine (Sealed Contract + Weighted Voting + City-Configurable Weights)

As a central city operator (Priya),
I want to see a ranked list of 4-6 candidate incidents with source attribution and a corroborated confidence score, derived from five source types with city-configurable per-contaminant-class weights,
So that I can act on the most credible signal in under 3 minutes, and the platform can swap to ML in v2 without breaking what I see.

**Acceptance Criteria:**

**Given** the fusion engine is configured with the v1 input contract (5 input channels: industrial sensor, Anjali report with credibility weight, citizen complaint cluster ≥3 in zone/24h, lab result, environmental signal)
**When** an operator query requests a ranked incident list for tenant `dhaka` in the active operational window
**Then** the engine returns 4-6 candidate incidents ranked by fused score `score = Σ w_source · source_evidence` (per C-6)
**And** each item carries a pinned `source_attribution` payload: `[{observation_id: ULID, source_type: enum{anjali_report, sensor_reading, lab_result, complaint, env_signal}, weight: float, observed_at: ISO8601}]` (no free-form strings, per AD-3)
**And** anomalies with insufficient corroboration (<3 of the 5 source types contributing) are excluded from the ranked list but logged for transparency

**Given** per-contaminant-class weights are configured in `platform-config/` (defaults WHO-grounded; PHA-customizable per city)
**When** a chronic-contaminant class (lead leach, conductivity drift, cumulative exposure) is detected
**Then** the fusion applies the chronic weight profile (different from the acute profile for bacterial / chemical spill / sewage cross-connection)
**And** the weight profile is read from the same projection by both the fusion engine and the Incident Aggregator (shared window config per AD-2)

**Given** an Anjali's credibility weight is updated
**When** the weekly Anjali-credibility update runs (not real-time per FR-2.3)
**Then** her future-report weight shifts based on her override-outcome history
**And** the update is logged as a `CredibilityWeightChanged` event in the audit chain (not silent — the chain shows the weight evolution)

**Given** the v2 ML swap is on the roadmap
**When** the swap is implemented
**Then** the five-input → ranked-list-output contract is unchanged — consumers of the engine are insulated from the swap (sealed contract per C-7 + AD-3)
**And** v2 implementation may replace weighted-voting with a cross-city-trained ML model; the engine's sealed contract does not change

**Given** inputs span at least 3 of the 5 source types for a candidate incident
**When** the engine produces the ranked list
**Then** Priya can act on the top-ranked item with full attribution visible in <3 minutes (NFR-P1.4: fusion latency <2s)
**And** the ranked list is delivered via a Priya-desktop projection, not raw sensor feeds

**Given** the Incident Aggregator observes the fused-ranked output stream
**When** ≥1 observation correlates into a coherent story (configurable per contaminant class)
**Then** the Aggregator is the **sole writer** of `IncidentCreated` events with content-addressed `incident_id = sha256(canonical(observation_event_ids[] | tenant_id | correlation_window_id | contaminant_class))` (per AD-2)
**And** no other component may emit `IncidentCreated`

## Epic 3: Codified Response (Playbook Lifecycle + Simulator + Deviation-to-Amendment)

A senior operator authors contaminant-class playbooks from WHO-grounded templates with constraint checks and a confidence score; runs the simulator; PHA owns approval (vendor does not); deviations captured live with reasoning are first-class audit events that cluster monthly and surface as amendment candidates. Each amendment is a `PlaybookVersionPublished` event with content-addressed version_id; the Simulator Harness reads from the event stream (not projections) and does not persist.

**FRs covered:** FR-3 (FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, FR-3.6, FR-3.7). **NFRs:** none specific beyond NFR-R1.1 (sensor ingestion tolerance). **Key ADs:** AD-3, AD-13, AD-15.

### Story 3.1: Playbook Authoring + Content-Addressed Versioning via Event Stream

As a senior operator,
I want to author contaminant-class playbooks from WHO-grounded templates with constraint checks and a confidence score, and have each approved version recorded as a content-addressed event in the chain,
So that the version-of-record is recoverable from the event stream under DR or projection-rebuild, and Playbook Engine history is replayable end-to-end.

**Acceptance Criteria:**

**Given** the WHO-grounded template library is shipped with the product (C-14 v1 deliverable)
**When** a senior operator opens the structured editor for a contaminant class (e.g., bacterial contamination acute)
**Then** the editor presents the WHO-grounded template skeleton with constraint checks (e.g., required fields, default step ordering, minimum confidence score thresholds)
**And** the editor shows a confidence score on the draft that reflects template-fit and historical precedent

**Given** a playbook draft is saved
**When** the draft is committed
**Then** the engine emits a `PlaybookVersionDrafted` event with `version_id = sha256(canonical(serialized_playbook_definition))` and a `parent_version_id` referencing the prior draft lineage (linear lineage per AD-13)
**And** the draft is NOT the version-of-record; the live engine runs against the latest published version

**Given** a `pha_approver` approves a draft (vendor does not own approval per FR-3.4)
**When** the approval is granted
**Then** the engine emits `PlaybookVersionPublished` carrying the content-addressed `version_id`
**And** the version-of-record becomes the latest `PlaybookVersionPublished` event for the tenant — **not** a DB row, **not** a projection (per AD-13)
**And** the dual-signature rule applies if the amendment touches the T3 boundary (per AD-11): two `SignatureAttestation` events with identical `(event_id, payload_hash, version_id)` triple

**Given** a draft was promoted to published
**When** a new draft is started (e.g., after a deviation cluster)
**Then** the new draft's `parent_version_id` references the prior published version, building linear lineage
**And** concurrent drafts emit their own `PlaybookVersionDrafted` events with different `version_id`s — only one can be promoted per tenant (per AD-13)

**Given** a draft is abandoned (e.g., editor starts over)
**When** the abandonment is committed
**Then** the engine emits `PlaybookVersionAbandoned` (append-only per AD-13) — the chain never deletes the draft history
**And** abandoned drafts are not part of version-of-record resolution

**Given** the running components need to know the active playbook version
**When** they read config
**Then** they read from the projection rebuilt by replaying `PlaybookVersionPublished` events for the tenant
**And** there is no out-of-band config-update path (per AD-15)

### Story 3.2: Simulator Harness (Non-Persistent, Reads from Event Stream)

As a senior operator,
I want a 2-minute "what would have happened" dry-run against historical or synthetic incidents for any new sensor config, new playbook draft, or new shift,
So that I can validate the playbook before live use and during onboarding, without simulator outputs polluting the audit chain.

**Acceptance Criteria:**

**Given** the Simulator Harness is a sealed component (per AD-3)
**When** a dry-run is requested with inputs `{time_window, hypothetical_version_id, scenario_event_set}`
**Then** the harness reads its inputs from the event stream — NOT from a projection (per AD-13 non-persistence property)
**And** the harness returns the simulated ranked incident list and playbook execution outcomes to the caller
**And** the harness **does not write** to the chain (no `SimulatedIncidentCreated` or similar events leak into the audit log)

**Given** a projection-rebuild is in progress (DR scenario)
**When** a simulator dry-run is requested
**Then** the simulator's outputs are identical to what they would have been before the rebuild, because inputs come from the event stream (canonical source) not a partially-built projection

**Given** the simulator is run against a `hypothetical_version_id` (a draft not yet promoted)
**When** the dry-run completes
**Then** the output shows what WOULD have happened under that draft — the simulation is a what-if, not a record of what did happen
**And** the draft itself remains a draft (`PlaybookVersionDrafted`), not promoted

**Given** the simulator must satisfy FR-3.3 (2-minute dry-run)
**When** the dry-run completes for a typical scenario
**Then** elapsed wall-clock time is ≤120 seconds for the v1 input volume (5 sensors + 30 strips + Anjali reports)
**And** the harness logs an `OperationalTrace` event for performance monitoring (not to the audit chain — the simulator doesn't write there)

### Story 3.3: Deviation Capture + Monthly Cluster + Amendment Promotion + Liability Split Codification

As a central operator (Priya) and PHA director (Dr. Mensah),
I want deviations from approved playbook steps captured as first-class audit events with reasoning, clustered monthly, and surfaced as amendment candidates,
So that playbook quality compounds from field learning, and the vendor / PHA / utility liability split is structurally evident from the chain.

**Acceptance Criteria:**

**Given** Priya is executing a live playbook step against the active version-of-record
**When** she deviates from a step (with friction but not blocked per FR-3.5)
**Then** she records the override-with-reasoning and the engine emits a `DeviationCaptured` event (distinct from the underlying state change event per consistency convention)
**And** the `DeviationCaptured` event carries `actor_identity = priya`, `playbook_version_id`, `deviated_step_id`, `attempted_action`, `actual_action`, `reasoning`, `outcome`
**And** the chain shows the override as the audit trail; the state change is its consequence

**Given** deviations cluster during the monthly review
**When** the cluster projection runs
**Then** it surfaces patterns: recurring deviations indicate either a bad playbook step (system problem) or uniquely good operator instinct (training material)
**And** clusters promote to amendment candidates with lineage recorded — the candidate links to its parent_version_id (per AD-13)

**Given** a deviation cluster is promoted to an amendment candidate
**When** the amendment is drafted and goes through PHA approval
**Then** the candidate follows the same authoring + approval flow as a new playbook (Story 3.1)
**And** the amendment lineage includes the deviation-cluster source, so reviewers can see why the amendment exists

**Given** the liability split is codified (C-13)
**When** the chain is queried for an event
**Then** vendor-actor events (e.g., schema bumps, platform config) are auditable separately from PHA-actor events (approvals, threshold changes) and utility-actor events (operational actions, sensor maintenance)
**And** the `actor_identity.role` closed enum (`{vendor, pha_approver, utility_operator, anjali, priya, pha_viewer, system}`) enforces structural liability separation at write-rejection (per AD-12)
**And** the audit chain is the evidence surface: vendor liability ends at vendor-actor events; PHA liability covers PHA-actor events; utility covers utility-actor events

**Given** an override pattern deviates from peer baselines
**When** the override-anomaly monitor (logged v1 per architecture-invariants.md §7) reviews the historical pattern
**Then** it surfaces the anomaly as a retrospective review item — not an enforcement action in v1
**And** the anomaly detection itself emits an `OverrideAnomalyDetected` event for traceability (becomes enforcement v2)

## Epic 4: Field Reporting (Anjali-mobile Trust-Bearing Interface)

A real Anjali at a real school can complete a daily check-in, a sentinel-strip photo, and a "something wrong" escalation in under 60 seconds on a low-end Android with intermittent connectivity, in Bangla (English fallback). Voice, image, and SMS are first-class alongside WhatsApp; SMS is first-class (not fallback). Multi-radio routing routes around outages silently; her phone acts as the network endpoint for ward sentinels. Reports reach Priya within 5 minutes online and queue offline-first. She sees that her report triggered a real response.

**FRs covered:** FR-4 (FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-4.7). **NFRs:** NFR-N1.1, NFR-N1.2, NFR-N1.3 (multi-radio + phone-as-network + SMS first-class), NFR-P1.1 (Anjali ingestion latency), NFR-S1.1 (zone-geofence). **UX-DRs:** UX-DR1, UX-DR6. **Key ADs:** AD-7, AD-8, AD-14.

### Story 4.1: Anjali-mobile WhatsApp / Voice / Image / SMS Front-End with Bangla + Hybrid Incentive + Public Acknowledgement

As Anjali (local operator at a school),
I want a one-tap reporting surface that works on my cracked-screen Android over WhatsApp, voice, image, or SMS, in Bangla, with a weekly check-in cadence and visible acknowledgement when my report matters,
So that I can report a contamination in under 60 seconds even with intermittent connectivity, and be recognized for staying on cadence.

**Acceptance Criteria:**

**Given** Anjali opens Anjali-mobile on a low-end Android with WhatsApp installed
**When** she taps the "report" affordance
**Then** she sees three input modalities: voice note, photo (sentinel-strip or scene), free-text — Bangla primary, English fallback (FR-4.1, FR-4.2, UX-DR6)
**And** the surface requires no login, no training app, no dashboard (FR-4.5, UX-DR1)
**And** the surface survives low data plan and WhatsApp-only connectivity

**Given** Anjali has the SMS-only channel available
**When** she sends a report via SMS
**Then** the SMS is first-class (not a degraded fallback per C-11); the gateway treats it with equal evidentiary weight to WhatsApp
**And** SMS messages are signed via a gateway signature so the consumer-channel trust holds

**Given** Anjali reports a contamination in under 60 seconds (success criterion)
**When** she submits the report
**Then** the local adapter mints a stable `event_id` (ULID) at user-acknowledged submission time (per AD-14 idempotency)
**And** the report is queued offline-first if no connectivity; the queue persists across app restarts and connectivity changes
**And** when connectivity returns, the report is delivered to Priya within 5 minutes end-to-end (FR-4.3, NFR-P1.1)

**Given** Anjali is enrolled with the hybrid incentive (FR-4.6)
**When** she completes her weekly check-in + sentinel-strip photo on cadence
**Then** her BDT 2,000/month stipend accumulates (tied to weekly check-in discipline, not per-report bounty)
**And** her ICDDR,B credential / Bangabandhu Sheikh Mujib Medical University credential badge surfaces in her status feed
**And** at quarterly city-level recognition, she is publicly acknowledged among peers
**And** the stipend structure explicitly cannot be per-report bounty — bounty creates gaming and false-positive inflation

**Given** Anjali's report triggers a real response (Priya escalates, PHA approves, consumer notice issued)
**When** the response chain reaches her status feed
**Then** she sees a public acknowledgement: "Your report on [date] at [zone] triggered action X — thank you" (FR-4.7)
**And** the acknowledgement is private to her — not broadcast to other Anjalis (avoid competitive comparison)

### Story 4.2: Multi-Radio Storage-and-Forward + Phone-as-Network for Ward Sentinels

As Anjali and as the platform architect,
I want every sensor ingest request declared with a radio tier (cellular / LPWAN / SD-card), routed through the right adapter, with the Anjali's phone acting as the network endpoint for ward sentinels,
So that intermittent connectivity is expected operation not exception, and ward sentinels have network coverage via phone-as-network even when no fixed network exists.

**Acceptance Criteria:**

**Given** a sensor ingest request arrives declaring radio tier `cellular | lpwan | sd_card`
**When** the request reaches the gateway
**Then** the gateway routes through the matching multi-radio adapter (per AD-8 — multi-radio contract enforced at gateway)
**And** the adapter normalizes the payload to the gateway's event envelope
**And** adapters are port-swappable (C-15); swapping an adapter implementation does not change the gateway's contract

**Given** connectivity is intermittent and Anjali's mobile client cannot reach the cellular network
**When** she submits a report or the sentinel strip sync attempts upload
**Then** the report is held in the offline-first queue (Anjali-mobile local storage)
**And** LPWAN is attempted as secondary fallback; if unavailable, SD-card store-and-forward is the tertiary tier
**And** no data is lost — the chain shows eventual delivery and the absence-of-delivery is a `SensorSilenceObserved` event, not silent drop

**Given** a ward sentinel strip at a school, hospital, or community point needs network connectivity
**When** no fixed network is available (tap-grade sites)
**Then** the sentinel uses Anjali's phone as the network endpoint (phone-as-network per C-15 / architecture-invariants.md §8)
**And** Anjali's phone syncs the sentinel data to cloud when it can, inheriting offline-first patterns from community-health-worker systems
**And** the sentinel reading is delivered as an observation event with provenance linking back to the sentinel strip's lot and lab-cert ID (per C-9 sentinel QA discipline)

**Given** a sensor has been silent beyond a configurable threshold
**When** the sensor-silence monitor detects the silence
**Then** it emits a `SensorSilenceObserved` audit event (FR-1.4, NFR-N1.4)
**And** the absence-of-reading is a recorded event, not maintenance noise

**Given** SMS is first-class for Anjali reporting (C-11, NFR-N1.3)
**When** WhatsApp is unavailable
**Then** the SMS channel carries the report end-to-end
**And** the SMS carries a signed gateway signature so the trust bridge holds

**Given** Anjali submits the same logical event after a connectivity drop
**When** the retry arrives at the gateway
**Then** the gateway recognizes the `(tenant_id, event_id)` and rejects with `DuplicateEventRejected` (per AD-14)
**And** the client surfaces a stable state — no retry storm, no double incident in fusion

## Epic 5: Operations Desk (Priya-desktop Ranked Action List)

A real Priya can pick the top-ranked incident, see source-attribution + corroboration confidence, execute the matching playbook step against the active version-of-record, and if she deviates record the reason — all in under 3 minutes per incident. The handover brief at shift change is auto-generated, killing tribal knowledge. The auto-generated PHA monthly report is assembled from the audit trail, not by hand.

**FRs covered:** FR-5 (FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6). **NFRs:** NFR-P1.2 (Priya dashboard load <3s). **UX-DRs:** UX-DR2. **Key ADs:** AD-2 (Priya consumes from incident projection), AD-7 (Priya-desktop as separate product).

### Story 5.1: Ranked Incident Dashboard + Playbook Step Execution + Deviation Capture

As Priya (central city operator),
I want a ranked incident dashboard with source attribution and corroborated confidence, and the ability to execute the matching playbook step against the active version-of-record, recording deviations with reasoning,
So that I can resolve incidents in under 3 minutes each, without losing tribal knowledge, and my deviations drive future playbook improvement.

**Acceptance Criteria:**

**Given** Priya logs into Priya-desktop on a web browser
**When** the dashboard loads
**Then** the ranked action list surfaces within 3 seconds (NFR-P1.2)
**And** the list is ranked by fusion score (FR-5.1), not raw sensor feeds
**And** each incident shows source attribution (e.g., "Anjali X at school Y + sensor Z at pump station W") and corroborated confidence score

**Given** Priya picks the top-ranked incident
**When** she opens the incident detail
**Then** she sees the matching playbook recommendation pulled from the active version-of-record (latest `PlaybookVersionPublished` event for the tenant per AD-13 / FR-5.3)
**And** she sees a read-only playbook view of the recommended steps
**And** she can execute each step; each action and non-action is logged against the playbook step with reasoning

**Given** Priya deviates from a playbook step
**When** she records the override-with-reasoning
**Then** friction is present but the deviation is NOT blocked (FR-5.5) — blame-free review is the goal
**And** the override-with-reasoning is captured as a `DeviationCaptured` audit event with her `actor_identity` and full reasoning (FR-5.4)
**And** the deviation feeds the monthly review cluster (Story 3.3) and threshold tuning + her own credential

**Given** Priya's dashboard is read-mostly on the chain side
**When** she queries or executes
**Then** the chain remains append-only; her actions are recorded as events, not edits to past events
**And** Priya-desktop is a separate product from Anjali-mobile and PHA-pane (per AD-7); it shares data via projections, not via shared UI code

### Story 5.2: Auto-Generated Handover Brief at Shift Change + Auto-Generated PHA Monthly Report

As Priya and as the city operation team,
I want the handover brief at shift change and the PHA monthly report to be auto-generated from the audit trail, not assembled by hand,
So that tribal knowledge does not accumulate, and the WB quarterly submission rolls up from the monthly report without manual reassembly.

**Acceptance Criteria:**

**Given** Priya's shift is ending
**When** she opens the handover view
**Then** the system auto-generates a "today's open threads" brief: incidents still open, deviations still under review, threshold changes pending PHA approval, anomalies flagged by override-anomaly monitor (FR-5.2)
**And** the brief is pulled from projection state rebuilt by replaying audit events — no manual assembly

**Given** the month is closing
**When** the PHA monthly report is generated
**Then** the report is auto-assembled from the audit trail (FR-5.6): incidents handled, deviation clusters, time-to-T3 medians, false-positive rate, Anjali weekly-discipline aggregate, PHA approval timeout rate
**And** the report is k-anonymized (no PII) for WB quarterly roll-up (per AD-9 + AD-16)
**And** Priya does not assemble it by hand — the assembly is a projection read

**Given** the auto-generated report must roll into the WB quarterly submission (NFR-C1.2)
**When** the WB-aligned evidence export runs (per C-16)
**Then** it reads from a projection (projection-not-recompute per AD-13) and exports results-framework-compatible artifacts
**And** it may not export raw PII or raw observations out of Bangladesh (per AD-9 + AD-16) — only aggregated, k-anonymized indicators

## Epic 6: Regulator Governance (PHA Pane + World Bank Evidence Export)

Dr. Mensah signs a playbook amendment in the app (dual signature at T3 boundary, identical-payload-triple attestation), tunes per-contaminant-class thresholds with tiered SLA, and views a cross-ward deviation dashboard — all from one read-mostly pane with cryptographic proof of unaltered audit chain. World Bank evidence-export tooling ships day one: aggregated k-anonymized indicators only, no raw PII or raw observations cross residency boundary.

**FRs covered:** FR-6 (FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-6.5, FR-6.6). **NFRs:** NFR-C1.1, NFR-C1.2, NFR-C1.3. **UX-DRs:** UX-DR3. **Key ADs:** AD-7, AD-11, AD-12, AD-15, AD-16, AD-9.

### Story 6.1: Playbook Amendment Approval with Dual Signature + Per-Contaminant-Class Threshold Tuning

As Dr. Mensah (PHA director),
I want to sign playbook amendments in the app with dual signature at the T3 boundary, and tune per-contaminant-class thresholds with tiered SLA (acute minutes / chronic hours),
So that amendments have structural two-person attestation, thresholds reflect the public-health urgency, and I am never the message-desk.

**Acceptance Criteria:**

**Given** Dr. Mensah opens the PHA pane to approve a playbook amendment
**When** the amendment touches the T3 boundary
**Then** the approval flow requires two distinct `SignatureAttestation` events with identical `(event_id, payload_hash, version_id)` triple (per AD-11)
**And** both signatures identify distinct actor identities per the closed role enum (`pha_approver` + `vendor` for T3-boundary playbook amendments per C-13)
**And** the gateway rejects approvals where the two attestations differ on the triple (e.g., second signature lands against a typo-correction v2)

**Given** Dr. Mensah tunes per-contaminant-class thresholds
**When** he sets an acute-class threshold (bacterial, chemical spill, sewage cross-connection)
**Then** the threshold is registered with **5-minute SLA, on-call rotation, 3 named approvers, 7×24 coverage, auto-escalation on timeout** (FR-6.2)
**And** an `EscalationPolicyUpdated` event emits the change with `before/after` payload diff (per AD-15 city-wide config change rule; single-signed by `pha_approver`)

**Given** Dr. Mensah tunes a chronic-class threshold (lead leach, conductivity drift, cumulative exposure, seasonal drift)
**When** the threshold is set
**Then** it registers with **4-hour SLA, business hours, batched review 2x/day**
**And** the chronic-vs-acute split prevents acute-class SLA pressure from overwhelming chronic-class review capacity

**Given** the PHA pane is read-mostly
**When** Dr. Mensah interacts
**Then** he can approve amendments and tune thresholds, but he is **never the message issuer** (FR-6.5)
**And** the Mayor's office owns message tone (T3+); the PHA owns the threshold where public notice fires
**And** the PHA pane is a separate product from Anjali-mobile and Priya-desktop (per AD-7)

### Story 6.2: Read-Only Audit-Chain Browser + Deviation Dashboard + WB-Aligned Evidence Export

As Dr. Mensah (PHA director) and as the World Bank program officer,
I want a read-only audit-chain browser with deviation dashboards and a WB-aligned evidence-export tool from day one,
So that I can verify the chain is unaltered, defend the system under press or inquiry, and the WB quarterly submission rolls up without retrofit.

**Acceptance Criteria:**

**Given** Dr. Mensah opens the audit-chain browser
**When** he queries a tenant's event stream with filters (time window, event_type, actor_role, geography)
**Then** the browser returns events matching the filter; events he is not permitted to view are excluded
**And** the browser is read-only and access-logged per read (FR-6.3)
**And** every read emits a `ChainReadPerformed` audit event carrying `actor_identity`, `tenant_id`, and the query filter (NFR-S1.4)
**And** the chain-integrity monitor's last-verified timestamp is shown — cryptographic proof that the chain is unaltered since the events he queries (NFR-O1.2)

**Given** Dr. Mensah views the deviation dashboard
**When** he opens it
**Then** he sees cross-ward aggregates: deviation cluster size by playbook step, time-to-T3 medians, override-anomaly flags
**And** he sees threshold edit history with reasoning (each `EscalationPolicyUpdated` event's payload diff is surfaced)

**Given** a WB program officer (or Dr. Mensah on the city's behalf) needs WB-aligned evidence
**When** the WB evidence export runs (scheduled job per C-16 + FR-6.6)
**Then** the export reads from a projection (projection-not-recompute per AD-13) and produces results-framework-compatible artifacts
**And** the export contains aggregated, k-anonymized indicators only — disbursement-linked indicators, audit-trail evidence per outcome
**And** the export **does not** carry raw PII or raw observations out of Bangladesh (per AD-9 + AD-16): only aggregated roll-ups cross the residency boundary
**And** the export itself is logged as a `WBEvidenceExported` event with k-anonymity threshold, indicator set, and recipient

**Given** the WB reporting cadence is quarterly / milestone-driven (NFR-C1.2)
**When** the WB-aligned monthly report (auto-generated per FR-5.6) is generated
**Then** it rolls up into the WB quarterly submission without manual reassembly
**And** the chain shows the report generation event; the audit-trail evidence supports disbursement-linked decisions

**Given** Dr. Mensah's pane integrates cross-utility oversight (FR-6.4)
**When** he reviews cross-ward data
**Then** he sees aggregated views — not raw cross-city reads — because federation operates on aggregated projections only (per AD-5)

## Epic 7: Public Notice Channel (Ramesh-class Consumer Messaging)

A consumer receives a plain-language notice via WhatsApp + SMS within 15 minutes of confirmed contamination, only at Tier 3 or above, only after dual-signature approval. SMS carries more legal weight than WhatsApp. Ward-councillor-routed messages carry more weight than system-issued messages. No app install, no dashboard, no paywall.

**FRs covered:** FR-7 (FR-7.1, FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-7.6). **NFRs:** NFR-R1.3 (consumer message synchronous with fallback). **UX-DRs:** UX-DR4, UX-DR5. **Key ADs:** AD-3 (sealed channel adapter), AD-11 (two-person attestation).

### Story 7.1: T3+ WhatsApp+SMS Broadcast with Two-Person Rule + Councillor Trust-Bridging

As Ramesh (a consumer) and as Dr. Mensah / the utility operator issuing the notice,
I want public notices issued only at Tier 3 or above, only after dual-signature approval, delivered via WhatsApp + SMS redundancy with the councillor network as a trust-bridging voice,
So that consumers receive clear "safe / boil / do not drink / wait" answers in their language without installing an app, and the trust bridge holds in the political moment a notice fires.

**Acceptance Criteria:**

**Given** a contamination event has been confirmed at Tier 3 or above
**When** a public-notice issuance is requested
**Then** the system checks: tier is T3+, PHA approval is recorded, dual-signature is valid (two `SignatureAttestation` events with identical `(event_id, payload_hash, version_id)` triple per AD-11)
**And** if any check fails, the request is rejected with `CommandRejected{reason: "tier below T3 | missing PHA approval | signature mismatch"}`
**And** if any check fails, no public broadcast occurs (FR-7.1, C-4)

**Given** the dual-signature check passes
**When** the message is issued
**Then** a `ConsumerMessageIssued` event is emitted with both attestations as predecessors
**And** the message is delivered via WhatsApp AND SMS redundancy (FR-7.3)
**And** SMS carries more legal weight than WhatsApp in target geographies; signed gateway ensures both channels are trust-bearing
**And** failed deliveries retry and escalate to the alternative channel (NFR-R1.3 — synchronous not best-effort)

**Given** the message is delivered to Ramesh
**When** he receives it
**Then** the message is plain language ("Safe now / Boil / Do not drink / Use bottled / Wait") — short and sourced (FR-7.4, UX-DR4)
**And** the message names: the issuing authority (PHA), the affected zone (geofenced), the action (one of the five short forms), and the verification horizon (when the next update or resolution is expected)
**And** the message is in his language (Bangla or English per locale)

**Given** a notice is routed through a ward councillor instead of system-issued
**When** the councillor-routed message is delivered
**Then** it carries the councillor's voice and endorsement (FR-7.5, UX-DR5)
**And** the brand is the councillor's endorsement, not the platform's — the councillor network is a trust bridge

**Given** the consumer is Ramesh
**When** he receives the notice
**Then** he required no app install, no dashboard, no paywall (FR-7.6, UX-DR4)
**And** the system is invisible infrastructure — the consumer experiences a clear answer, not a product

**Given** a public notice issuance fails delivery
**When** the retry and channel-fallback exhaust
**Then** the chain shows the `ConsumerMessageDeliveryFailed` event
**And** operators see the failure in Priya-desktop so they can escalate to councillor voice or alternative outreach
**And** the chain remains the source of truth for who was told what when
