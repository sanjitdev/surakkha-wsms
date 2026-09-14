# Implementation Readiness Assessment Report

**Date:** 2026-09-11
**Project:** Surakkha v1
**User:** Sanjit
**Workflow:** bmad-check-implementation-readiness (Step 2 — PRD Analysis)

---

## Document Discovery (Step 1 summary)

| Document | Location | Form |
|---|---|---|
| PRD | `_bmad-output/planning-artifacts/prds/prd-surakkha-2026-09-06/prd.md` | Whole (no sharded index) |
| Architecture — Backend | `_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md` | Spine + reviews |
| Architecture — Frontend | `_bmad-output/planning-artifacts/architecture/architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md` | Spine + reviews |
| Epics — Backend | `_bmad-output/planning-artifacts/epics-backend.md` | Whole (5 epics, 19 stories) |
| Epics — Frontend | `_bmad-output/planning-artifacts/epics-frontend.md` | Whole (FE-1) |
| UX | `_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/` | Sharded (DESIGN + EXPERIENCE + 4 reviews) |

No duplicates; no missing required documents. ✅

---

## PRD Analysis

### Functional Requirements

**FR-1 — Append-only cryptographic audit chain with two-person rule**
- FR-1.1 Every audit-relevant event (sensor calibration, threshold change, playbook approval / amendment, operator action / deviation, consumer message issuance, role change, lab submission, system login, integration pull) is captured as a content-addressed block chained to its predecessor.
- FR-1.2 A single gateway mediates all chain writes; no module writes directly to chain storage. Per-city namespace; federation-ready but not active.
- FR-1.3 Two-person signature enforced on (a) T3-boundary playbook edits and (b) consumer message issuance. Dual signature captured in the chain block.
- FR-1.4 Sensor silence beyond a configurable threshold is logged as an audit event, not as maintenance noise. The absence of a reading is a recorded event.
- FR-1.5 Read access to chain is policy-controlled per role (Priya: own operator log; PHA: cross-ward rollups; audit browser in PHA-pane is read-only and access-logged per read).

**FR-2 — Heterogeneous source-fusion engine with per-source credibility weighting**
- FR-2.1 Five inputs: industrial sensor, Anjali report (with credibility weight), citizen complaint cluster (≥3 in zone/24h), lab result, environmental signal.
- FR-2.2 Output: ranked action list of 4-6 incidents with playbook recommendation, source attribution, and corroborated confidence score.
- FR-2.3 Weights are city-configurable per contaminant class (WHO-grounded defaults); Anjali credibility updates **weekly in v1**, not real-time.
- FR-2.4 v1 implementation is weighted-voting. v2 may swap to ML; the five-input / ranked-list-output contract is **sealed** — consumers insulated from the swap.

**FR-3 — Playbook authoring, simulation, and deviation-to-amendment lifecycle**
- FR-3.1 Seven-stage lifecycle: author → approve → run → deviate → review → amend → re-approve. Every stage writes to the audit chain.
- FR-3.2 Authoring surface: structured editor with constraint checks against the WHO-grounded template library (v1 deliverable).
- FR-3.3 Simulator: 2-minute "what would have happened" dry-run against historical or synthetic incidents.
- FR-3.4 Approval authority: PHA director owns approval, vendor does not. Dual signature if the amendment touches the T3 boundary.
- FR-3.5 Deviation is first-class with friction but not block. Override-with-reasoning captured to audit chain as a distinct event type. Monthly review clusters deviations.
- FR-3.6 Liability split codified: vendor platform-integrity; PHA approval; utility operational. Audit chain is the evidence surface.

**FR-4 — Anjali one-tap reporting across WhatsApp, voice, image, and SMS in regional language**
- FR-4.1 Voice + image + SMS over text; SMS is first-class not fallback.
- FR-4.2 Local-language UI: Bangla primary, English fallback.
- FR-4.3 Reports reach Priya within **5 minutes when online**; queued offline-first when not. Multi-radio connectivity architecture.
- FR-4.4 Phone-as-network for ward sentinel: Anjali's phone syncs to cloud when it can.
- FR-4.5 Anjali is the only trust-bearing interface: no login, no training app, no dashboard.
- FR-4.6 Hybrid incentive surface: BDT 2,000/month stipend + ICDDR,B credential + quarterly recognition.
- FR-4.7 Public acknowledgement when her report triggers a real response.

**FR-5 — Priya ranked action list with playbook execution and deviation capture**
- FR-5.1 Incident dashboard ranked by fusion score, with source attribution and corroborated confidence — not raw sensor feeds.
- FR-5.2 Auto-generated handover brief at shift change.
- FR-5.3 Read-only playbook view + ability to execute steps against the active version-of-record.
- FR-5.4 Override-with-reasoning capture.
- FR-5.5 Escape hatch with friction but not block when deviating from playbook.
- FR-5.6 Auto-generated PHA monthly report assembled from the audit trail.

**FR-6 — PHA pane for playbook approval, threshold tuning, and audit without alteration**
- FR-6.1 Playbook amendment approvals with dual signature at T3 boundary.
- FR-6.2 Per-contaminant-class threshold tuning with **tiered SLA**: acute classes 5-min SLA / 7×24 / 3 named approvers / auto-escalation; chronic classes 4-hr SLA / business hours / batched 2x/day.
- FR-6.3 Read-only audit-chain browser: cross-ward aggregates, deviation dashboards, threshold edit history. Access-logged per read.
- FR-6.4 Cross-utility oversight + standard-setting authority.
- FR-6.5 Never a message-desk. The PHA does not become the message issuer.
- FR-6.6 WB-aligned evidence-export tooling from day one.

**FR-7 — Ramesh consumer messaging via WhatsApp and SMS at Tier 3 and above**
- FR-7.1 Public messages **only at Tier 3 or above**.
- FR-7.2 Two-person rule on consumer message issuance.
- FR-7.3 WhatsApp + SMS redundancy; signed gateway. SMS carries more legal weight.
- FR-7.4 Plain-language messages: "Safe now / Boil / Do not drink / Use bottled / Wait" — short and sourced.
- FR-7.5 Ward-councillor network as trust-bridging voice.
- FR-7.6 No app install, no dashboard, no paywall. The system is invisible infrastructure.

**Total FRs:** 7 capability areas, **35 atomic FR statements** (FR-1.1…FR-7.6).

### Non-Functional Requirements

**NFR-5.1 — Performance**
- NFR-5.1.1 Anjali report ingestion: <5 minutes end-to-end (online); queued offline-first with no data loss.
- NFR-5.1.2 Priya dashboard load: ranked action list surfaces within 3 seconds of login.
- NFR-5.1.3 Sentinel strip CV read: <10 seconds per strip on mid-tier Android.
- NFR-5.1.4 Source-fusion engine: produces ranked list in <2 seconds for v1 input volume.

**NFR-5.2 — Reliability & Availability**
- NFR-5.2.1 Sensor ingestion tolerates connectivity loss as expected operation. Latency of action beats measurement accuracy.
- NFR-5.2.2 Audit chain gateway: no-data-loss writes. Replication across at least 2 geographic zones per tenant city.
- NFR-5.2.3 Consumer message issuance is synchronous (not best-effort) — failed deliveries retry, escalate to alternative channel.

**NFR-5.3 — Privacy & Security**
- NFR-5.3.1 Privacy-by-default: zone-level geofence for consumer reports (not lat/long), anonymized consumer reports by default, encryption at rest + in transit + E2E on consumer channel, RTBF where legally required.
- NFR-5.3.2 Access-logged operator data: every read of operator data produces an audit event.
- NFR-5.3.3 Override-anomaly detection: **logged in v1, enforced in v2**.

**NFR-5.4 — Multi-tenancy & Data Sovereignty**
- NFR-5.4.1 Per-city database isolation; no cross-city joins at the storage layer.
- NFR-5.4.2 Per-city RBAC matrix; same global role name maps to city-specific permissions.
- NFR-5.4.3 Per-city audit-chain namespace. Federation operates on aggregated roll-ups, not raw cross-city reads.
- NFR-5.4.4 Data sovereignty per jurisdiction: Bangladesh data lives in Bangladesh-resident storage.

**NFR-5.5 — Compliance**
- NFR-5.5.1 Audit standards must satisfy World Bank IDA/IBRD audit requirements (C-16) from day one — disbursement-linked indicators, results framework, audit-trail evidence per outcome.
- NFR-5.5.2 Reporting cadence aligned to WB quarterly / milestone submission.
- NFR-5.5.3 Liability contract split (C-13) reflected in Dhaka city contract.
- NFR-5.5.4 Sentinel QA discipline (C-9): third-party lab certifies each lot before shipment.

**NFR-5.6 — Connectivity & Resilience**
- NFR-5.6.1 Multi-radio fallback: cellular primary → LPWAN secondary → SD-card store-and-forward tertiary.
- NFR-5.6.2 Ward sentinel uses phone-as-network (Anjali's phone, offline-first sync).
- NFR-5.6.3 SMS is first-class (not degraded fallback).

**NFR-5.7 — Interoperability**
- NFR-5.7.1 Read-only APIs into existing SCADA where present (do not replace SCADA).
- NFR-5.7.2 APIs into billing, lab systems with least-privilege permissions.
- NFR-5.7.3 SOC2-ready posture in v1.

**Total NFRs:** 7 categories, **23 atomic NFR statements** (NFR-5.1.1…NFR-5.7.3).

### Additional Requirements / Constraints

**Architecture Constraints (load-bearing, referenced from spec):**

- **C-1** Multi-tenant SaaS from Day 1; per-city DB isolation; federation-ready not active.
- **C-2** Three persona-specific UIs (Anjali-mobile / Priya-desktop / PHA-pane), not one responsive app.
- **C-3** Tiered PHA approval SLA per contaminant class (5 min acute / 4 hr chronic); T2→T3 is embedded governance.
- **C-4** Public messages only at T3+; two-person rule on issuance.
- **C-5** Three-tier sensor pyramid fixed (industrial / sentinel / no in-house manufacturing).
- **C-6** Weighted-source fusion v1 (no ML); per-contaminant-class weights city-configurable.
- **C-7** Source-fusion engine is sealed; v2 may swap to ML with consumer contract unchanged.
- **C-8** Audit chain content-addressed with cryptographic chaining + dual signatures.
- **C-9** Sentinel QA = third-party lab certifies each lot before shipment.
- **C-10** Privacy-by-default (zone-geofence, anonymize, encrypt, RTBF).
- **C-11** Anjali is the only trust-bearing interface; SMS first-class not fallback.
- **C-13** Vendor-disclaims liability for playbook-wrong harm; PHA + utility carry operational/approval liability.
- **C-14** WHO-grounded playbook template library is a v1 deliverable.
- **C-15** Multi-radio connectivity architecture; sensor silence logged as event.
- **C-16** Lighthouse funding channel = World Bank Water Global Practice.

**Out of Scope (v1) — NG-1…NG-8:** Replacing SCADA, direct consumer sales, dedicated consumer mobile app, ML-heavy detection, federated multi-city operation, outcome-priced insurance, manufacturing sensors, regulator benchmarking across utilities.

**Success Metrics (operational, monthly):**
- Loop completion rate ≥80% within 12 months.
- Time-to-T3 <30 minutes for acute events.
- False-positive rate ≤1 per quarter.
- Anjali weekly discipline ≥85%.

**Counter-metrics (degradation watch):** sensor-silence days, escalation-to-resolution cycle time, deviation cluster size, PHA approval timeout rate.

**Outcome metric (lighthouse test):** Two consecutive real contamination events handled cleanly with PHA attestation under inquiry.

### PRD Completeness Assessment

**Strengths:**
- 35 atomic FRs across 7 capabilities, 23 NFRs across 7 categories, 15 architecture constraints, 8 out-of-scope items — fully explicit and traceable.
- Spec companions (`personas.md`, `playbook-lifecycle.md`, `escalation-policy.md`, `sales-motion.md`, `architecture-invariants.md`, `detection-layer.md`, `constraints-load-bearing.md`) are the source-of-truth and the PRD defers to them where appropriate.
- Acceptance criteria are concrete and testable ("<60 seconds on a low-end Android", "<5 minutes online", "<2 minutes per incident").
- Success metrics and counter-metrics are separately enumerated — promotes operational awareness of regressions, not just wins.
- Risk register + Open Questions + Resolved Open Questions are all present and dated.

**Gaps (PRD-side, not yet surfaced in planning artifacts):**
- **PRD vs `epics-backend.md` persona mapping divergence.** PRD §3 lists **5 personas** (Anjali / Priya / Dr. Mensah / Ramesh / Attacker). `epics-backend.md` and `project-context.md` lock Phase 1 to **4 personas** (Sensor / Anjali / Admin / Operator) + 1 non-persona (System), with PHA deferred to Phase 2 and Ramesh folded into the citizen ✅/❌ tap surface. **This is a deliberate scope trim captured in `project-context.md` §2, but the PRD has not been amended to reflect it.** Downstream: PRD-as-contract still demands FR-6 (PHA pane) and FR-7 (Ramesh consumer messaging) by 12-month launch, yet Phase 1 explicitly defers both.
- **FR-1.3 dual-signature requirement vs Phase-1 trim.** FR-1.3 mandates two-person signatures on T3-boundary playbook edits and consumer message issuance. `epics-backend.md` (per `project-context.md` §4 AD-11) defers dual-signature to Phase 2. **PRD has not been updated to flag this as Phase-1 deferred.**
- **FR-2.4 sealed contract not yet enforced in code.** The spec caps the source-fusion engine behind a contract; the PRD treats it as FR; no Phase-1 spec on disk formalizes the contract interface yet (Epic 2 stories 2-3/2-4/2-5 cover the implementation but not the sealed-component boundary).
- **FR-3.3 Simulator + FR-3.5 deviation cluster** are both deferred per `project-context.md` §8. **PRD not amended.**
- **FR-4.6 hybrid incentive surface + ICDDR,B credentialing** — out of Phase 1 per `project-context.md` §8. **PRD not amended.**
- **FR-6.6 WB evidence-export tooling + NFR-5.5.1 IDA/IBRD audit posture** — out of Phase 1 per `project-context.md` §8. **PRD not amended.**
- **NFR-5.4.1 per-city DB isolation** is Phase 1 single-tenant (`dhaka` only); the PRD's "Multi-tenant SaaS from Day 1" / "Per-city DB isolation" framing has not been narrowed to match the active scope.
- **NFR-5.4.4 Bangladesh-resident storage** — implemented only by deferring to out-of-region backup snapshots (per `project-context.md` AD-9); the PRD does not flag the snapshot-only approach.
- **NFR-5.6.1 multi-radio fallback (cellular/LPWAN/SD-card)** + **FR-4.3** — explicitly out of Phase 1 per `project-context.md` §8. **PRD not amended.**
- **OQ-7 resolved but Dhaka is Tier-1 (~22M) not Tier-2 (~500K)** — Architecture-review at scale-100K milestone gates this; PRD §12 marks it as Assumption but does not schedule the architecture review.

**Verdict on PRD completeness for downstream readiness:**
The PRD is **complete and well-structured as a contract**, but **out of sync with the active Phase 1 trim** documented in `epics-backend.md`, `project-context.md`, and `ARCHITECTURE-SPINE.md`. The PRD still reads as the full v1 vision; the companion `project-context.md` §8 lists what is intentionally deferred. **A PRD revision or an explicit "Phase 1 PRD §16 — Out of Phase 1 Trim" appendix is recommended** so that an auditor comparing PRD FRs to `epics-backend.md` stories does not flag every deferred item as a missing requirement.

---

(Steps 3–6 to follow in subsequent turns.)

---

## Epic Coverage Validation (Step 3)

### Source: `epics-backend.md`

- 5 epics, 19 stories (1.1 / 1.2 / 1.3 / 2.1–2.6 / 3.1–3.4 / 4.1–4.3 / 5.1–5.3) — `validation summary` row says "17 stories"; this is a doc-typo, count is **19**.
- 4 personas + 1 non-persona (System). 15 first-class chain events (11 gate events + 4 trust signals). 12 states, 7 SLAs.
- Phase-1 trim explicitly excludes dual-signature (AD-11), public-notice channel (AD-17), simulator (AD-13), multi-radio (AD-8), phone-as-network, hybrid incentive, RTBF (AD-16), multi-tenancy beyond `dhaka`, WB export tooling, councillor routing, override-anomaly enforcement, playbook versioning.

### FR → Story Traceability Matrix

Mapping each PRD FR to its Phase-1 in-scope epic/stories (Phase-2-deferred FRs are flagged).

| PRD FR | Phase-1 Epic / Stories | Status |
|---|---|---|
| **FR-1.1** Every audit-relevant event captured as content-addressed block | Epic 1 (1.1 gateway + 1.2 RBAC + 1.3 idempotency), all later epics write through gateway | ✅ Covered |
| **FR-1.2** Single gateway, per-city namespace, federation-ready | Epic 1 (1.1) — single tenant `dhaka`; federation deferred per AD-5 | ⚠️ Partially (per-city namespace active; federation mechanism-only) |
| **FR-1.3** Two-person signature on T3-boundary edits and consumer messages | **DEFERRED** per AD-11 (frontmatter `deferredToPhase2`) | ❌ Not in Phase 1 |
| **FR-1.4** Sensor silence logged as audit event | Epic 1 (1.3 third AC) + Epic 2 (2.1 second AC) | ✅ Covered |
| **FR-1.5** Role-controlled read access; access-logged per read | Epic 1 (1.2 third AC — `CrossTenantAccessAttempted`); per-role read scope partial (Priya: own log; PHA: read-only pane deferred) | ⚠️ Partially (PHA read-only pane Phase 2) |
| **FR-2.1** Five-input source-fusion | **TRIMMED** — Phase 1 ships 2 inputs (sensor + Anjali); lab / environmental / citizen-cluster deferred per AD-2 | ⚠️ Partially (2 of 5) |
| **FR-2.2** Ranked action list of 4–6 incidents w/ attribution + confidence | Epic 2 (2.5 trust band + 2.6 `IncidentCreated` w/ trust_band) — but **ranked-list UX** lives in admin UI (Epic 3 / frontend FE-1) | ✅ Covered (event-side); UX ships via FE-1 |
| **FR-2.3** City-configurable per-class weights; weekly credibility update | Epic 2 (2.5 — badge thresholds Phase-1 defaults; per-class weights via config payload) | ⚠️ Partially (weekly batch update is Phase-1 trim; per-class weight authoring surface is Phase 2) |
| **FR-2.4** Sealed contract; v2 may swap to ML | Mechanism only (AD-3 — per-event-type upcasters wired); engine itself is sealed-component contract | ✅ Mechanism in place; engine contract not yet codified in a Phase-1 spec |
| **FR-3.1** Seven-stage playbook lifecycle | **DEFERRED** (no playbooks in Phase 1 per AD-13 + "Out of Phase 1" list) | ❌ Not in Phase 1 |
| **FR-3.2** Authoring surface with WHO template library constraint checks | **DEFERRED** (C-14, WHO library authoring tracked as PRD OQ/A7 launch prerequisite M1) | ❌ Not in Phase 1 |
| **FR-3.3** Simulator (2-minute "what would have happened") | **DEFERRED** (AD-13, Simulator Harness Phase 2) | ❌ Not in Phase 1 |
| **FR-3.4** PHA-owned approval + dual signature at T3 boundary | **DEFERRED** (AD-11 + PHA persona Phase 2) | ❌ Not in Phase 1 |
| **FR-3.5** Deviation-to-amendment lifecycle (friction-not-block + monthly cluster) | **DEFERRED** (deviation events happen in Phase 1 per R3 rework; cluster→amendment projection Phase 2) | ⚠️ Partially (deviation capture in code; cluster logic Phase 2) |
| **FR-3.6** Liability split codified | Spec-level contract, not a Phase-1 code surface | ⚠️ Partially (audit chain is the evidence surface; city contract workstream out of scope for this assessment) |
| **FR-4.1** Voice + image + SMS; SMS first-class | **TRIMMED** — Epic 2 (2.2) ships photo + voice + text + GPS via web form; **SMS-first-class, WhatsApp, multi-radio deferred** | ⚠️ Partially (photo/voice/text/GPS in; SMS out) |
| **FR-4.2** Bangla primary, English fallback | Epic 2 (2.2 — `family-bangla` primary) + frontend FE-1 lockdown (en/bn i18n parity tests shipped) | ✅ Covered (frontend + form) |
| **FR-4.3** Reach Priya <5 min online; offline-first queue | Epic 2 (2.2 — delivered to gateway ≤60 s of online; multi-radio deferred) | ⚠️ Partially (cellular only; LPWAN/SD-card Phase 2) |
| **FR-4.4** Phone-as-network for ward sentinel | **DEFERRED** (Anjali-mobile is manual-only in Phase 1) | ❌ Not in Phase 1 |
| **FR-4.5** Anjali is the only trust-bearing interface (no login, no app) | Epic 2 (2.2 — "no login required") | ✅ Covered (web form; mobile as separate product is Phase 2 per AD-7) |
| **FR-4.6** Hybrid incentive (BDT 2,000 + ICDDR,B credential) | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-4.7** Public acknowledgement that her report mattered | Phase 1: `NotificationSent` on closure (Epic 5.2). No Phase-1 surface for "your report triggered a real response" outside the closure notification flow | ⚠️ Partially (closure tap only) |
| **FR-5.1** Ranked incident dashboard | Epic 3 (3.1 — three-bucket inbox by trust band) + frontend FE-1 InboxList | ✅ Covered |
| **FR-5.2** Auto-generated handover brief at shift change | **DEFERRED** (per Epic 5 "Phase 1 trim: per-incident audit timeline only") | ❌ Not in Phase 1 |
| **FR-5.3** Read-only playbook view + execute against version-of-record | **DEFERRED** (no playbooks) | ❌ Not in Phase 1 |
| **FR-5.4** Override-with-reasoning capture | Epic 3 (3.2 — `reason_category` + min-30-char note per R2) | ✅ Covered |
| **FR-5.5** Escape hatch with friction not block | Implicit via Epic 3 admin "agree or override" UX; **deviation-as-distinct-event-type** is Phase 1 (per R3 rework), **monthly deviation cluster** is Phase 2 | ⚠️ Partially (escape hatch live; cluster logic Phase 2) |
| **FR-5.6** Auto-generated PHA monthly report | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-6.1** Playbook amendment approvals with dual signature | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-6.2** Tiered PHA SLA (5 min acute / 4 hr chronic) | **DEFERRED** (PHA persona Phase 2) | ❌ Not in Phase 1 |
| **FR-6.3** Read-only audit-chain browser w/ access-logged reads | Epic 5 (5.3 — per-incident audit timeline, chain-hash anchored); PHA cross-ward rollup Phase 2 | ⚠️ Partially (per-incident only; cross-ward rollup Phase 2) |
| **FR-6.4** Cross-utility oversight + standard-setting | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-6.5** Never a message-desk | **N/A for code** (process / role boundary) | ✅ Out-of-band satisfied |
| **FR-6.6** WB evidence-export tooling | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-7.1** Public messages only at T3+ | **DEFERRED** (AD-17, public notice channel Phase 2) | ❌ Not in Phase 1 |
| **FR-7.2** Two-person rule on consumer message issuance | **DEFERRED** (AD-11) | ❌ Not in Phase 1 |
| **FR-7.3** WhatsApp + SMS redundancy, signed gateway | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-7.4** Plain-language messages | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-7.5** Councillor trust-bridging voice | **DEFERRED** | ❌ Not in Phase 1 |
| **FR-7.6** No app install / dashboard / paywall | Citizen ✅/❌ tap surface ships via web in Epic 5 (5.2) — Phase 1 ships a minimal tap surface, not a separate consumer app | ⚠️ Partially (web tap surface ships; no separate consumer app per AD-7 + "Out of Phase 1") |

### Coverage Statistics

- **Total PRD FRs:** 35 atomic statements across 7 capability areas
- **In Phase 1, fully covered:** 7 FRs (FR-1.1, FR-1.4, FR-2.4, FR-4.2, FR-4.5, FR-5.1, FR-5.4) + UX-validated via FE-1 lockdown for FR-4.2
- **In Phase 1, partially covered (trimmed):** 13 FRs (FR-1.2, FR-1.5, FR-2.1, FR-2.3, FR-3.5, FR-3.6, FR-4.1, FR-4.3, FR-4.7, FR-5.5, FR-6.3, FR-7.6, FR-2.2 UX layer)
- **Deferred to Phase 2 (per `epics-backend.md` frontmatter `deferredToPhase2`):** 15 FRs (FR-1.3, FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-4.4, FR-4.6, FR-5.2, FR-5.3, FR-5.6, FR-6.1, FR-6.2, FR-6.4, FR-6.6, FR-7.1, FR-7.2, FR-7.3, FR-7.4, FR-7.5) — fully traceable to `deferredToPhase2` list and `project-context.md` §8
- **Out-of-band (process / role boundary, not a code surface):** 1 (FR-6.5)
- **PRD FRs in `epics-backend.md` but NOT in PRD:** none found
- **PRD FRs missing from `epics-backend.md`:** none found — every Phase-1-in-scope FR has a story; every deferred FR has a documented Phase-2 destination

### Missing FR Coverage (critical findings)

**Critical:** None — every FR has a documented destination (Phase-1 story or Phase-2 deferral).

**High-priority observations:**

1. **PRD-vs-epics drift is invisible to a casual reader.** A reader who compares PRD §4 directly to `epics-backend.md` will see 35 FRs and only 7 fully covered in Phase 1 — a coverage percentage of 20% — without realizing that 15+ of those FRs are explicitly listed in the frontmatter `deferredToPhase2` and `project-context.md` §8. **Recommendation:** Either (a) update PRD with an explicit "Phase 1 trim" appendix mirroring `epics-backend.md` `deferredToPhase2`, or (b) annotate each PRD FR with its Phase-1 status (covered / trimmed / deferred) directly in the PRD so the traceability is self-evident.
2. **Story 2.5 / 2.6 trust-band UX layer.** The event-side payload carries `trust_band`, `badge`, `cluster_match_count`, `sensor_agreement` (good), but no Phase-1 spec on disk formalizes the admin inbox ranking presentation. The FE-1 InboxList (FE-1.5b) ships the three-bucket view, but the "ranked action list of 4–6" UX language in PRD FR-2.2 may need a UX clarification — currently it's a flat three-bucket inbox, not a ranked N-card view.
3. **`epics-backend.md` validation summary typo:** row 4 of the validation table says "17 stories" — the actual count is 19 (6 + 4 + 3 + 3 + 3 = 19). Cosmetic but worth fixing.

### NFR Coverage (informational, not a coverage gap)

| NFR category | Phase-1 coverage |
|---|---|
| **NFR-5.1 Performance** | "Anjali <5 min online" — Epic 2 (2.2) ≤60 s online ⇒ meets <5 min. "Priya dashboard <3 s" — frontend InboxList + InboxDetail shipped; not benchmarked against NFR but architecturally trivial against MSW mock + small fixture set. Sentinel CV <10 s — N/A (no CV in Phase 1). Fusion <2 s — Phase 1 has no fusion engine (trimmed); trust-band computation is event-side and not subject to the 2-s budget. |
| **NFR-5.2 Reliability** | No-data-loss chain writes — Epic 1 (1.1) gateway is sole writer. Replication across 2 geo zones — **single-region Dhaka per AD-9**; out-of-region snapshots only. Synchronous message issuance — **N/A in Phase 1** (no consumer messaging). |
| **NFR-5.3 Privacy & Security** | Privacy-by-default — Anjali reports store GPS as-is in Phase 1 (zone-level geofence for consumer messages is Phase 2 via AD-17). Encryption — TLS for HTTP, SQLite at rest on disk. RTBF — **deferred (AD-16)**. Override-anomaly — **logged only**. Access-logged reads — partial via `CrossTenantAccessAttempted`. |
| **NFR-5.4 Multi-tenancy** | Single tenant `dhaka` only (AD-5 trim); per-city DB isolation is "single-DB-but-with-tenant-scope" via UNIQUE constraint on `(tenant_id, event_id)`. Bangladesh-resident storage — implied by local deployment; no explicit guarantee. |
| **NFR-5.5 Compliance** | WB IDA/IBRD posture — **deferred** (no WB export tooling). Sentinel QA — third-party-lab cert is a vendor-process concern, not Phase-1 code. Liability split — audit chain is the evidence surface; city contract is a workstream outside this assessment. |
| **NFR-5.6 Connectivity** | **Multi-radio deferred** (AD-8). Phase 1 = cellular-only. SMS is first-class — deferred (AD-17). Phone-as-network — deferred. |
| **NFR-5.7 Interoperability** | SCADA APIs — none (no SCADA in Dhaka scope per NG-1). Billing/lab APIs — none in Phase 1. SOC2 — posture-only; not a code deliverable in this milestone. |

### Coverage Verdict

**✅ No missing FRs.** Every PRD FR has a destination (Phase-1 story or documented Phase-2 deferral). The trim is explicit and traceable.

**⚠️ PRD-vs-epics presentation drift** is the only structural finding. **Recommendation:** add a one-page "Phase 1 PRD trim" appendix to the PRD mirroring `epics-backend.md` `deferredToPhase2` and `project-context.md` §8, so the PRD is self-explaining against the active scope.

(Steps 4–6 to follow in subsequent turns.)

---

## UX Alignment Assessment (Step 4)

### UX Document Status

**Found** — `_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/`

| File | Status | Purpose |
|---|---|---|
| `DESIGN.md` | final | Visual identity (colors, typography, spacing, elevation, components, message template) |
| `EXPERIENCE.md` | final | IA, voice & tone, component patterns, state patterns, interaction primitives, accessibility floor, key flows |
| `review-prose.md`, `review-adversarial.md`, `review-structure.md`, `review-accessibility.md` | final | 4 reviewer-gate passes |

UX lockdown gate is **passed** (per `project-context.md` §9: color palette, typography, spacing, iconography, data display formats, component patterns, per-persona wireframes, accessibility baseline, trust-band inbox layout, per-incident audit timeline, Bangla copy rules, SMS char budget enforcement — all committed).

### UX ↔ PRD Alignment

| PRD FR | UX surface | Alignment |
|---|---|---|
| **FR-1.5** Per-role read access; access-logged per read | EXPERIENCE.md §Per-incident audit timeline, §PHA-pane IA (read-only audit browser, access-logged) | ✅ Aligned |
| **FR-2.2** Ranked 4–6 incident list w/ attribution + confidence | EXPERIENCE.md §Priya-desktop IA (Y-shaped, left = handover brief, right = ranked action list) | ⚠️ Drift: PRD says "ranked 4–6" — UX says ranked action list by fusion score. The "4–6" upper bound is **not** explicit in UX. The shipped FE-1 InboxList is a three-bucket inbox (high / medium / low), not a ranked N-card. **Needs UX-side addendum clarifying that the upper bound is per-bucket, not a flat top-N.** |
| **FR-2.3** City-configurable per-class weights | EXPERIENCE.md §PHA-pane IA (cross-ward aggregate tiles + threshold controls) | ✅ Aligned (UX surface) — but Phase 1 deferral means no authoring UI ships in this milestone |
| **FR-3.2** WHO-grounded template library constraint checks | (no UX surface) | ⚠️ Deferred; **PRD-as-claim**, not a Phase-1 UX commitment |
| **FR-3.3** Simulator | (no UX surface) | ⚠️ Deferred; PRD-as-claim only |
| **FR-3.4** PHA-owned approval, dual signature at T3 | EXPERIENCE.md §PHA-pane IA (playbook amendment queue, dual-signature) | ⚠️ UX is fully designed; **deferred to Phase 2** (AD-11, AD-13) |
| **FR-4** Anjali one-tap reporting | EXPERIENCE.md §Anjali-mobile IA (one action card: Report; 3-modality input; 60 s success criterion) | ✅ Aligned — but mobile-as-separate-product is Phase 2; **Phase 1 ships a web form** (FE-1.5b / FE-F2 SubmitReportPage) |
| **FR-4.2** Bangla primary, English fallback | EXPERIENCE.md §Internationalization (Bangla primary on Anjali-mobile) + DESIGN.md `family-bangla` | ✅ Aligned and shipped (FE-1 en/bn i18n parity tests across 45 vitest files) |
| **FR-4.5** Anjali is the only trust-bearing interface (no login) | EXPERIENCE.md §Anjali-mobile IA ("No login. No training app. No dashboard") | ✅ Aligned |
| **FR-4.7** Public acknowledgement when report triggered real response | EXPERIENCE.md §Anjali-mobile IA (Councillor citation surface) + Flow 1 / Flow 3 closures | ✅ Aligned (textual acknowledgement in Phase 1; quarterly councillor citation Phase 2) |
| **FR-5.1** Priya ranked incident dashboard | EXPERIENCE.md §Priya-desktop IA (Y-shaped) | ✅ Aligned — FE-1 InboxList / InboxDetail shipped |
| **FR-5.2** Auto-generated handover brief at shift change | EXPERIENCE.md §Priya-desktop IA (Left pane: Handover brief) | ⚠️ UX is fully designed; **deferred to Phase 2** ("per-incident audit timeline only" in Epic 5) |
| **FR-5.4** Override-with-reasoning capture | EXPERIENCE.md §Override-with-reasoning capture (Priya) | ✅ Aligned — Epic 3.2 `reason_category` + min-30-char note per R2 |
| **FR-5.6** Auto-generated PHA monthly report | EXPERIENCE.md §Priya-desktop IA (Footer: "Auto-generated PHA monthly report" button) | ⚠️ UX is fully designed; **deferred to Phase 2** |
| **FR-6** PHA pane (full) | EXPERIENCE.md §PHA-pane IA (full) | ⚠️ UX is fully designed; **deferred to Phase 2** (no PHA persona in Phase 1) |
| **FR-6.3** Read-only audit-chain browser | EXPERIENCE.md §Per-incident audit timeline | ✅ Aligned (per-incident scope in Phase 1; cross-ward aggregate Phase 2) |
| **FR-7** Ramesh consumer messaging (full) | EXPERIENCE.md §Ramesh-channel IA + 6 message shapes + Bangla/English locales | ⚠️ UX is fully designed; **deferred to Phase 2** (AD-17, no public-notice channel) |
| **FR-7.4** Plain-language messages | DESIGN.md §Message template + EXPERIENCE.md §Message string structure (6 shapes, 64-char line, signature line, emoji rule, SMS char budget) | ⚠️ UX is fully designed; **deferred to Phase 2** |

**Summary:** UX lockdown is **complete and high-quality** (12 of 12 lockdown criteria from `project-context.md` §9 committed). For Phase 1 in-scope work, UX is fully aligned. For Phase 2 deferred work, UX is fully designed and ready for the next milestone.

### UX ↔ Architecture Alignment

#### Load-bearing drift: closed role enum (AD-12)

| Source | Role enum |
|---|---|
| **Architecture spine** (`ARCHITECTURE-SPINE.md` AD-12) | `{vendor, pha_approver, utility_operator, utility_message_desk, anjali, priya, pha_viewer, system}` — **8 entries** |
| **EXPERIENCE.md** §Foundation + §Two-tap confirmation | **8 entries** (mirrors architecture spine) |
| **`epics-backend.md`** AD-12 trim | `{sensor, anjali, admin, operator, system}` — **5 entries** |
| **`epics-backend.md`** Story 1.2 AC | 5-entry enum used as the binding Phase-1 contract |
| **`epics-backend.md`** Story 2.1 AC | Uses `actor_identity.role = sensor` (not in architecture 8-entry; **mapped**) |
| **`epics-backend.md`** Story 2.6 AC | Uses `actor_identity.role = system` (matches) |
| **`epics-backend.md`** Story 3.2 AC | Uses `actor_identity.role = admin` (not in architecture 8-entry; **mapped**) |
| **`epics-backend.md`** Story 4.1 / 4.2 / 4.3 AC | Uses `actor_identity.role = operator` (not in architecture 8-entry; **mapped**) |
| **Frontend FE-1** routing guards | `field_technician` + `utility_operator` (per FE-1.1b App.tsx; legacy terms from earlier persona mapping) |
| **`spec-1-1` epic-1-context.md** | 5-entry closed enum is binding for Phase 1 |

**The drift is documented and intentional:** `project-context.md` §4 AD-12 explicitly says *"Phase 1 trim: 5 entries"*, and the frontmatter of `epics-backend.md` carries the same. The architecture spine is the full v1 vision; `epics-backend.md` is the active Phase 1 contract.

**Implications for downstream:**
1. The gateway (Story 1.1) must enforce the **5-entry** enum. The 8-entry enum lives in the architecture spine for Phase-2-era reference, not for current code.
2. Persona renames are consistent: Anjali = anjali; Sensor = sensor; Admin = admin (mapped to `utility_operator` in some FE-1 places); Operator = operator (mapped to `field_technician` in some FE-1 places); System = system. The legacy `field_technician` and `utility_operator` strings in FE-1 routing guards predate the Phase-1 persona rename.
3. The PHA / Councillor / Utility-message-desk roles (3 of the 8 in the architecture spine) are entirely Phase 2.
4. **Recommendation:** Annotate `ARCHITECTURE-SPINE.md` AD-12 with a "Phase-1 binding = 5-entry (see `epics-backend.md`); Phase-1 ships 4 personas + 1 non-persona" footnote so the spine and the epics are explicitly bridged.

#### AD-1 ↔ UX: per-incident audit timeline

- `epic-1-context.md` says the chain itself is the timeline; the UX (§Per-incident audit timeline) says the timeline exposes chain hashes in mono with copy-to-clipboard and a "chain verified intact as of {TIMESTAMP}" indicator.
- The FE-1 AuditLog page (`web/src/pages/AuditLog.tsx`) and `fe-b6-audit-log-i18n.test.tsx` confirm the timeline is shipped with chain-hash mono rendering, but a **chain-verified-intact-as-of indicator** is not yet wired (no FE-1 spec mentions it).
- **Finding:** the "chain verified intact as of" affordance is a UX-level commitment from EXPERIENCE.md that has no FE-1 spec. Either (a) add a `fe-b6-chain-freshness-indicator` spec, or (b) amend the UX to defer the indicator to the projected-lag clock already shipped.

#### AD-7 ↔ UX: three UIs as separate products

- Architecture says three products, no shared UI library above the data layer.
- EXPERIENCE.md mirrors the three products and adds the closure check ("No missing piece").
- `epics-backend.md` AD-7 trim: "Phase 1 has 2 UIs (Admin desktop, Operator mobile) — Anjali submits via mobile form; no third product surface" — but the **frontend has only ONE** workspace (`web/`) with persona-aware routing (FE-1.1b: `/inbox` for `utility_operator`, `/field` for `field_technician`, `/styleguide` for dev, `/` for login).
- **Finding:** The architecture-level promise of three separate UIs is **collapsed in FE-1 to a single web app with persona-aware routes**. This is consistent with the Phase 1 trim and the deferral of Anjali-mobile-as-separate-product, but the architecture spine does not flag this. **Recommendation:** annotate `ARCHITECTURE-SPINE.md` AD-7 with a Phase-1 trim line mirroring `epics-backend.md` AD-7 row.

#### AD-9 ↔ UX: Bangladesh-resident data

- Architecture says "active write path stays in Bangladesh; out-of-region backup snapshots only."
- UX does not surface this; nothing in DESIGN.md or EXPERIENCE.md indicates a data-residency indicator to operators. This is consistent with "no UX surface ships the residency status" (it would be operational noise), so the gap is **informational, not actionable**.

#### AD-15 ↔ UX: city-wide config change authorship

- Architecture says `CityConfigChanged` is single-signed by `pha_approver`. UX says PHA-pane surfaces the threshold-edit and the dual-signature play for amendments. **Aligned at the level of the Phase-1 deferral; no Phase-1 code surface ships either.**

#### FR-2.2 ↔ UX ↔ shipped FE-1: "ranked 4–6" upper bound

- PRD: ranked action list of 4–6 incidents.
- UX: ranked by fusion score (no upper bound stated).
- FE-1: three-bucket inbox (high / medium / low), not a flat top-N.
- **Drift:** PRD's "4–6" upper bound is not implemented in the FE-1 InboxList. Per-bucket the count is unbounded (paginated). **Recommendation:** either (a) clarify PRD FR-2.2 to say "ranked, paginated, bucketed by trust band" (the FE-1 reality), or (b) clarify the FE-1 InboxList spec to enforce a per-bucket cap of 4–6 with "load more" pagination.

### UX-side observations on the shipped FE-1

| Shipped | UX commitment | Aligned? |
|---|---|---|
| FE-1.1a (10 foundation components) | DESIGN.md component list (Button, Card, Input, Badge, Message template) | ✅ Aligned (FE-1 adds Container, Modal, Toast, BandPill, EmptyState, TopChrome+Sidebar — all consistent with the design system) |
| FE-1.1b (styleguide + dev-only route) | Not in UX; engineering affordance | ✅ Aligned (dev-only by `import.meta.env.DEV` guard) |
| FE-1.3c (`useIncidents` hook + InboxDetail migration) | Per-incident audit timeline | ✅ Aligned; **fetch-error EmptyState** shipped 2026-09-11 is a defensive enrichment not in UX but consistent with the UX §State Patterns (no full-screen spinner for sub-second load) |
| FE-1.5b (InboxList) | Priya-desktop ranked action list (per-bucket) | ✅ Aligned with FE-1 trim; **drift** with PRD "4–6" upper bound (see above) |
| FE-B5a/b/c/d/e/f/g (Dropdowns, Tables, DatePicker, locale-format, relative-time, audit-date-range, Anjali Bangla counters) | DESIGN.md + EXPERIENCE.md primitives | ✅ Aligned |
| FE-B6 (per-page i18n sweep + lockdown bridge) | Bangla primary / English fallback | ✅ Aligned |
| FE-F1 (IncidentActions) | Override-with-reasoning capture | ✅ Aligned (FR-5.4) |
| FE-F2 (SubmitReport) | Anjali-mobile IA (one action card: Report) | ✅ Aligned at Phase-1 web-form scope |
| FE-F4 (FieldIncidentDetail) | Operator mobile-friendly web | ✅ Aligned |
| FE-F6 (CitizenAckPage) | ✅/❌ tap surface | ✅ Aligned with FR-7.6 (no app, no dashboard, web tap) |
| FE-F7 (BulkOptimize) | Inbox bulk-triage bucket | ✅ Aligned with Story 3.1 |

### Findings

**1. UX lockdown gate passed — no gate failures.** All 12 lockdown criteria from `project-context.md` §9 are committed in DESIGN.md and EXPERIENCE.md (color palette, typography, spacing, iconography via family choices, data display formats, component patterns, per-persona IA, accessibility baseline, trust-band inbox layout via three-bucket model, per-incident audit timeline, Bangla copy rules including 3-low-literacy-readers rule, SMS char budget).

**2. Phase-1-deferred UX is fully designed.** PHA pane, Ramesh-channel message shapes, two-tap confirmation, dual-signature UX, simulator, multi-radio, phone-as-network, councillor trust-bridge — all have UX surface, all are documented as Phase-2 deferral in `epics-backend.md` and `project-context.md`.

**3. UX implementation lag in one specific area.** The "chain verified intact as of {TIMESTAMP}" indicator from EXPERIENCE.md §Per-incident audit timeline has no FE-1 spec. The chain-freshness clock from EXPERIENCE.md §Priya-desktop IA (top chrome) is similar. Both are achievable in the existing audit-log / top-chrome primitives; a small FE-1 spec would close the gap.

**4. The closed-role-enum drift (AD-12) is documented and intentional but bridges invisibly.** The architecture spine carries the 8-entry vision; `epics-backend.md` and `epic-1-context.md` carry the 5-entry Phase-1 contract; the FE-1 routing guards use legacy strings (`field_technician`, `utility_operator`). A reader comparing the three without reading the companion ladder will see apparent contradictions. **Recommendation:** annotate the architecture spine with a Phase-1 binding = 5-entry footnote; rename the FE-1 routing guards to use the Phase-1 names (sensor / anjali / admin / operator / system) in a future `fe-b6-rename-routing-roles` spec.

**5. FE-1 InboxList is bucketed, not top-N.** PRD FR-2.2's "ranked action list of 4–6 incidents" is not enforced. The shipped UX is bucketed + paginated. Either the PRD should be amended to reflect the bucketed reality (and the "4–6" should be moved to a Phase-2 spec when the fusion engine and ranked-list UX both ship), or the FE-1 InboxList should be amended to enforce a per-bucket cap with "load more" pagination.

### UX Alignment Verdict

**✅ Phase-1 UX is complete and ready for implementation.** The UX lockdown gate is passed, the shipped FE-1 components align with the design system, the per-page i18n and lockdown sweep are in place, and the four deferrals (PHA pane, Ramesh-channel, two-tap confirmation, playbook simulator) are explicitly tagged Phase 2 in both UX and epics.

**⚠️ Three documented drifts** (closed role enum, chain-freshness indicator, FR-2.2 ranked-cap) are all small enough to fix with a one-paragraph annotation, a small FE-1 spec, or a PRD amendment. **None of them blocks the Phase-1 implementation gate.**

(Steps 5–6 to follow in subsequent turns.)

---

## Epic Quality Review (Step 5)

### Epic Structure Validation

#### Epic titles + goals (user-value focus)

| Epic | Title | Goal (user value) | Verdict |
|---|---|---|---|
| 1 | **Trust Foundation** | A regulator, operator, or court can verify every event was captured, content-addressed, chained, written through a single gateway, scoped per tenant, policy-controlled on read. | ⚠️ Borderline (technical-milestone phrasing — "single gateway" is infra, not user-action) — but the **epic-level user value** is "any auditor can defend the system under inquiry", which is the load-bearing claim. **Acceptable as a foundational epic** because every later epic depends on it; flagged as "infrastructure epic" rather than user-facing. |
| 2 | **Source Ingestion & Trust Scoring** | A sensor or Anjali submission becomes a triaged incident without anyone driving anywhere. | ✅ User-value clear (eliminates physical triage drive). |
| 3 | **Admin Verification & Assignment** | A real admin opens the inbox, picks an incident, decides verify vs reject, assigns an operator. | ✅ User-value clear. |
| 4 | **Field Operator Execution** | A real operator acks, dispatches a team, submits resolution proof. | ✅ User-value clear. |
| 5 | **Admin Closure & Citizen Loop** | A real admin verifies resolution, closes; Anjali gets ✅/❌ tap; ❌ reopens. | ✅ User-value clear. |

**Epic 1 is a foundational infrastructure epic** — it does not deliver user-facing functionality by itself, but every later epic's user value depends on it being there. This is **acceptable per create-epics-and-stories standards for the "trust spine" pattern** (the spine IS the value, because without it no later value can be defended). **Not flagged as a violation**, but reviewers should not accept "trust foundation" as a value epic in projects where the trust spine is itself the product.

#### Epic independence validation

| Test | Verdict |
|---|---|
| **Epic 1** stands alone (foundation) | ✅ Stands alone — gateway + RBAC + idempotency; no later epic dependency. |
| **Epic 2** uses only Epic 1 output | ✅ Reads chain via gateway; writes events through gateway. |
| **Epic 3** uses only Epics 1–2 outputs | ✅ Reads incident projection from Epic 2; writes through gateway from Epic 1. |
| **Epic 4** uses only Epics 1–3 outputs | ✅ Reads operator assignment; writes events through gateway. |
| **Epic 5** uses only Epics 1–4 outputs | ✅ Reads resolution; writes events through gateway; citizen ✅/❌ re-enters state machine at `acknowledged` (already-defined in earlier epics, not a new state). |
| **No forward dependencies** | ✅ Verified. Each epic reads only the artifacts of earlier epics. |
| **No circular dependencies** | ✅ Verified. |

### Story Quality Assessment

#### Story sizing — all 19 stories

| # | Story | Story size check | User value | Verdict |
|---|---|---|---|---|
| 1.1 | Single-gateway content-addressed chain | Foundation; large but bounded (gateway + store + 2 monitors) | High (the spine itself) | ⚠️ Large-but-bounded; the spec file (`spec-1-1-...md`) shows ~6 ACs covering gateway + chain + idempotency placeholder + monitors; achievable by 1 dev in 1 sprint. **Single-dev-doable verified by spec evidence.** |
| 1.2 | RBAC defense-in-depth | 3 layers | High (closed enum enforcement) | ✅ Sized right; 5 ACs across 3 layers + rejection paths. |
| 1.3 | Idempotency + sensor silence | 2 contracts | High (retry storm defense + silence-as-event) | ✅ Sized right; 3 ACs. |
| 2.1 | Sensor cellular ingestion | 1 source path + manual injection | High | ✅ Sized right; 2 ACs. |
| 2.2 | Anjali submission path | Form + EXIF + offline-first queue | High | ✅ Sized right; 3 ACs covering form, EXIF/voice, evidence-floor. |
| 2.3 | Cluster window | 1 mechanism | High | ✅ Sized right; 2 ACs. |
| 2.4 | Sensor cross-check | 1 mechanism | High | ✅ Sized right; 3 ACs. |
| 2.5 | Reputation lookup + trust band | 4 signal fusion | High | ⚠️ Largest story in Epic 2 — 3 ACs but the third AC carries the full trust-band math (cluster, cross-check, reputation, time-of-day, recent-activity, evidence). The spec would benefit from a **table of explicit signal weights** inside the AC; current phrasing is "system weighs [list]" with no numeric weights. **Recommendation:** add a numeric weight table to the AC (or reference a config spec). |
| 2.6 | IncidentCreated + inbox routing | 1 event + 3 routing rules | High | ✅ Sized right; 2 ACs. |
| 3.1 | Trust-band inbox with bulk-triage bucket | 1 UX surface (3 buckets) | High | ✅ Sized right; 2 ACs. |
| 3.2 | Acknowledge + review-and-decide | 2 actions (ack, verify/reject) | High | ✅ Sized right; 4 ACs with structured `reason_category` per R2. |
| 3.3 | Operator assignment | 1 form + 1 event | High | ✅ Sized right; 2 ACs with structured `due_at` per R3. |
| 3.4 | Rework request | 1 form + 1 event | High | ✅ Sized right; 2 ACs with structured `failure_code` per R4. |
| 4.1 | Operator ack + auto-escalation | 1 ack + 1 SLA monitor | High | ✅ Sized right; 2 ACs. |
| 4.2 | Field team dispatch | 1 form + 1 event | High | ✅ Sized right; 2 ACs. |
| 4.3 | Resolution proof | 1 form + 1 event with EXIF | High | ✅ Sized right; 2 ACs. |
| 5.1 | Resolution verify | 1 verify + 1 reject | High | ✅ Sized right; 2 ACs. |
| 5.2 | Close + citizen confirm + reopened | 3 events (close, confirm, reopen) | High | ⚠️ Largest story in Epic 5 — 3 ACs covering close, ✅ path, ❌ path with state-machine branch. Single-dev doable but the state-machine branch is **the load-bearing complexity**. **Recommendation:** split into 5.2a (close + ✅) and 5.2b (❌ → reopened branch with lineage) if the implementation reveals the branch is non-trivial. **Acceptable as-is** for the planning gate. |
| 5.3 | Per-incident audit timeline | 1 read surface | High | ✅ Sized right; 2 ACs with chain-hash anchor + lineage divider. |

#### Acceptance criteria review (sampled across all 19 stories)

| Story | AC format | Testable | Covers errors | Specific | Notes |
|---|---|---|---|---|---|
| 1.1 | BDD Given/When/Then × 3 | ✅ | ✅ (`CommandRejected{reason}`) | ✅ | One AC has a Phase-2 sentence ("dual-signature requirement comes later") embedded in a Phase-1 AC; flagged as forward reference but acceptable since mechanism-only is in Phase 1 |
| 1.2 | Given/When/Then × 3 | ✅ | ✅ (`actor_ref not session-bound`, `CrossTenantAccessAttempted`) | ✅ | Clean |
| 1.3 | Given/When/Then × 3 | ✅ | ✅ (`DuplicateEventRejected`) | ✅ | Clean |
| 2.1 | Given/When/Then × 2 | ✅ | ⚠️ silent on threshold-edge cases (e.g., NTU exactly 1.0 — `>` vs `>=` not specified) | ✅ | Minor: threshold predicate should be explicit (`>` vs `>=`) |
| 2.2 | Given/When/Then × 3 | ✅ | ✅ (evidence-floor rejection + honest ack copy) | ✅ | Good |
| 2.3 | Given/When/Then × 2 | ✅ | ⚠️ silent on what "matching reports" means (same ward_id + 200m + same contaminant class); the AC says it but does not specify the matching algorithm in a way that locks the implementation | ✅ | Implementation can vary; **acceptable for a planning gate** |
| 2.4 | Given/When/Then × 3 | ✅ | ✅ (no_signal branch explicit) | ✅ | Good |
| 2.5 | Given/When/Then × 3 | ⚠️ Third AC lists signals but no numeric weights | ⚠️ "soft-throttle" A1 not formalized as an AC; it's mentioned but not Given/When/Then | ✅ | **Needs numeric weights** (see sizing note above) |
| 2.6 | Given/When/Then × 2 | ✅ | ✅ (routing rules explicit) | ✅ | Clean |
| 3.1 | Given/When/Then × 2 | ✅ | ✅ (compact view for bulk) | ✅ | Clean |
| 3.2 | Given/When/Then × 4 | ✅ | ✅ (`reason_category` enum, min-30-char note per R2) | ✅ | Clean |
| 3.3 | Given/When/Then × 2 | ✅ | ⚠️ silent on operator-offline path (what if no on-call operator is on the roster?) | ✅ | Minor: should specify fallback (e.g., escalate to admin) |
| 3.4 | Given/When/Then × 2 | ✅ | ✅ | ✅ | Clean |
| 4.1 | Given/When/Then × 2 | ✅ | ✅ (`SLABreached` + auto-escalation to next round-robin) | ✅ | Clean — auto-escalation is the AC, not a soft promise |
| 4.2 | Given/When/Then × 2 | ✅ | ⚠️ silent on what happens if `team_id` collides with another team's identifier (free-text for Phase 1 means no uniqueness guarantee) | ✅ | Minor: acceptable for demo |
| 4.3 | Given/When/Then × 2 | ✅ | ✅ (EXIF rejection explicit) | ✅ | Clean — clock_skew_seconds in payload is a thoughtful audit detail |
| 5.1 | Given/When/Then × 2 | ✅ | ⚠️ silent on EXIF spoofing (EXIF is unsigned — a determined operator could re-stamp a photo from home) | ✅ | Out-of-scope for Phase 1; acceptable |
| 5.2 | Given/When/Then × 3 | ✅ | ✅ (✅ path, ❌ path with parent linkage, chain shows full story) | ✅ | Clean — the lineage annotation is a thoughtful detail |
| 5.3 | Given/When/Then × 2 | ✅ | ✅ (reopened lineage grouping) | ✅ | Clean |

#### Dependency analysis

**Within-epic dependencies:**
- Epic 1: 1.2 reads 1.1 (gateway); 1.3 reads 1.1 (gateway writes the duplicate-rejection). ✅ No forward references.
- Epic 2: 2.3 (cluster window) reads 2.1/2.2 events; 2.4 (cross-check) reads 2.1 sensor events + 2.3 cluster window's tail; 2.5 (reputation) reads 2.1/2.2 events; 2.6 (IncidentCreated) reads 2.3, 2.4, 2.5 signals. ✅ All within-epic; no forward refs.
- Epic 3: 3.1 reads 2.6 inbox projection; 3.2 reads 3.1 row; 3.3 reads 3.2 verified incident; 3.4 reads 4.3 resolution. ⚠️ **3.4 references Story 4.3** — this is a cross-epic dependency from Epic 3 to Epic 4. The rework path only fires after the operator has submitted a resolution. **This is a forward dependency at the planning level** but operationally sound because 3.4's reader (admin UI) only shows the "Request rework" button after a `ResolutionSubmitted` event has landed. **Acceptable per BMad standards** — the dependency is event-stream-driven, not code-call-driven. **Flagged as a documentation nicety**: the AC for 3.4 should explicitly note "this story assumes 4.3 is also complete; the rework button is event-driven, not blocked on story order."
- Epic 4: 4.1 reads 3.3 assignment; 4.2 reads 4.1 ack; 4.3 reads 4.2 dispatch. ✅ Linear within epic.
- Epic 5: 5.1 reads 4.3 resolution; 5.2 reads 5.1 verified; 5.3 reads all chain events for the incident. ✅ Linear within epic.

**Cross-epic dependency map:**
- Epic 2 → Epic 1 (gateway exists) ✅
- Epic 3 → Epics 1–2 (gateway + incident projection) ✅
- Epic 4 → Epics 1–3 (gateway + assignment) ✅
- Epic 5 → Epics 1–4 (gateway + resolution + close) ✅
- **No circular dependencies. No Epic N → Epic N+1 forward references.**

**Database/entity creation timing:**
- Story 1.1 creates the chain-store schema (the `events` table with `block_hash`, `prev_block_hash`, `(tenant_id, event_id)` UNIQUE constraint) and the gateway modules. ✅ Right (creates only what it needs).
- Story 1.2 adds the auth session / RBAC policy tables. ✅ Right.
- Story 1.3 adds nothing new (reuses the `(tenant_id, event_id)` UNIQUE constraint; the silence-monitor reads sensor last-seen from the events table). ✅ Right.
- Epic 2 stories add projection tables (incident summary, trust-band routing inbox) and the silent-sensor config. ⚠️ **Not specified at the story level** — the projection rebuild path is implied by the "projection" wording in Epic 5.3 AC. **Recommendation:** add an explicit "projection tables created in this story" note per Epic 2 story, OR clarify in Epic 1 that projections are created lazily on first read. Current text is acceptable but reviewers might ask.

#### Starter template / greenfield indicators

- Architecture spine does **not** specify a starter template (no "Use this cookiecutter / template repo" line in `ARCHITECTURE-SPINE.md`).
- Stack is locked (Python 3.11+, FastAPI, SQLite WAL, OpenTelemetry SDK, pytest + httpx, asyncio) per `project-context.md` §5.
- The Story 1.1 spec (`spec-1-1-...md`) opens with "Land a FastAPI service backed by a SQLite append-only store" — effectively the project bootstrap.
- **Greenfield indicators present:** Story 1.1 ships the initial project skeleton (single-process FastAPI on `127.0.0.1:8000`), pytest harness, OpenTelemetry no-op exporter, the SQLite WAL database file. **There is no "story 0 — initialize repo" because story 1.1 carries that responsibility.** ✅ This is acceptable but the explicit bootstrap steps (pyproject.toml, venv, CI) are not itemized in the spec.

#### Best practices compliance checklist

For each epic (✓ = passes; ⚠ = flagged):

| Check | E1 | E2 | E3 | E4 | E5 |
|---|---|---|---|---|---|
| Epic delivers user value | ⚠ | ✓ | ✓ | ✓ | ✓ |
| Epic can function independently | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stories appropriately sized | ✓ | ⚠ (2.5) | ✓ | ✓ | ⚠ (5.2) |
| No forward dependencies | ✓ | ✓ | ⚠ (3.4→4.3) | ✓ | ✓ |
| Database tables created when needed | ✓ | ⚠ (projection tables implied) | ✓ | ✓ | ✓ |
| Clear acceptance criteria | ✓ | ⚠ (2.5 weights) | ⚠ (3.3 fallback) | ✓ | ✓ |
| Traceability to FRs maintained | ✓ | ✓ | ✓ | ✓ | ✓ |

### Quality Assessment Summary

#### 🔴 Critical violations

**None.** The 5-epic / 19-story structure is sound. The independence rule holds; no circular dependencies; each story has BDD ACs; FR traceability is maintained.

#### 🟠 Major issues (recommend fix before code)

1. **Story 2.5 trust-band signal weights.** The third AC says "the system weighs: cluster match (+1 high band if cluster ≥2), sensor cross-check (±1), reporter reputation (+1 trusted / −1 caution), time of day (−1 for 02:00–05:00), recent activity at exact GPS pin (−1 if same pin closed as false-alarm in last 24 hr), evidence presence (+1 if photo+EXIF or voice)." The numeric weights are listed but **clamping and combination rules are not specified**. With 6 signals each ±1, the worst case is −6 to +6, which does not cleanly map to `{high, medium, low}`. **Remediation:** add a clamping table to the AC (e.g., "score ≥ +2 = high; 0 to +1 = medium; ≤ −1 = low") or a pointer to a separate `platform-config/` spec. Without this, two implementations could legitimately diverge.
2. **Story 3.4 → Story 4.3 forward reference.** 3.4's "Request rework" affordance only fires after 4.3 has submitted a resolution. Event-stream-driven, not code-call-driven, so not a true forward dependency, but the AC does not flag this. **Remediation:** add a sentence to 3.4's AC: "This story assumes Story 4.3 is complete or in-progress; the rework affordance is event-driven and appears once a `ResolutionSubmitted` event lands in the chain."

#### 🟡 Minor concerns (recommend fix in next planning pass)

1. **Story 2.1 threshold predicates.** NTU > 1.0 and chlorine_residual < 0.2 are stated; the strict-vs-non-strict comparison is not. **Recommendation:** spell out `>` and `<` explicitly (current text uses `>` and `<` but reviewers might want the comparison operator locked in tests).
2. **Story 3.3 no-on-call-operator fallback.** The AC assumes an on-call roster with at least one operator. If the roster is empty, the assign dialog would have nothing to pick. **Recommendation:** add a 1-line fallback: "If the on-call roster is empty, the assign dialog disables with reason 'No on-call operators for this ward'; the admin must re-route or escalate."
3. **Story 4.2 free-text `team_id`.** Acceptable for Phase 1 demo but a uniqueness check is not specified. **Recommendation:** add a constraint: "team_id is opaque free-text for Phase 1; uniqueness is not enforced at the gateway; collisions are surfaced as a UI warning on duplicate submission within the same incident."
4. **Story 5.1 EXIF spoofing.** The EXIF GPS + timestamp check defends against unintentional capture-from-home, not against deliberate EXIF editing. **Recommendation:** add a one-line note that deliberate EXIF manipulation is out of scope for Phase 1; trust-band fallback (cross-check sensor + reputation) is the second line of defense.
5. **Validation summary typo.** `epics-backend.md` row 4 says "17 stories"; the actual count is 19. **Cosmetic.**
6. **Projection table ownership.** Epic 2 stories create projection tables (incident summary, inbox routing) but the story text does not say so explicitly. **Recommendation:** add a 1-line "Side effects: creates the `incidents` and `inbox_routing` projections" note per Epic 2 story, or add a single sentence to Epic 1.1 covering "projection tables are created lazily on first read by their owning consumer."
7. **No "story 0 — project bootstrap."** Story 1.1 carries the FastAPI bootstrap, but the AC does not itemize pyproject.toml / venv / CI / lint setup. **Recommendation:** add a 1-line bootstrap clause to Story 1.1 ("Story also creates: pyproject.toml, .python-version, pytest config, GitHub Actions CI workflow").

### Verdict

**✅ Epic structure is implementation-ready for Phase 1.** All 19 stories have BDD ACs, all dependencies are sound (one cross-epic event-driven reference noted as a doc-only fix), and the FR traceability matrix (Step 3) is complete.

**🟠 Two major issues** (Story 2.5 trust-band math, Story 3.4 forward reference) should be addressed in the next planning pass **before** the Story 2.5 spec is written for dev — both are pre-implementation clarifications that prevent implementation drift.

**🟡 Seven minor concerns** are pre-implementation hygiene items that can be folded into the next epic-context update or addressed in spec compilation.

The 5-epic / 19-story architecture supports the Phase 1 demo bar.

(Step 6 — Final Assessment — to follow.)

---

## Summary and Recommendations (Step 6)

### Overall Readiness Status

# ✅ READY — Frontend FE-1 only (mock backend)

> **Scope update 2026-09-11.** Per user direction (Sanjit), the active scope is **frontend FE-1 only, against the mock backend (MSW handlers + fixtures) already shipped in `web/`. The backend `app/` directory is explicitly NOT in scope for this milestone.** Backend Phase 1 planning artifacts remain reference material but the implementation gate that they once gated is closed for this milestone.

**The Surakkha Phase 1 frontend is implementation-ready and actively executing. The MSW mock backend in `web/src/mocks/` is the binding adapter for the duration of this milestone.** All 24 frontend specs, 45 vitest files (340 tests passing as of 2026-09-11, commit 83c9130), and the lockdown bridge CSS sweep + per-page i18n parity tests are in. The mock handler contract (`web/src/mocks/handlers.ts:443-461`) is the binding API surface for every FE-1 page.

The full Phase 1 (5 backend epics + 19 stories + 5 FE-1 epics + 24 frontend specs) is **complete in planning**, **complete in UX lockdown**, and **partially complete in code** — every FE-1 spec has shipped, the only backend spec (Story 1.1) is `draft`, and no backend code exists yet on disk. The backend code will land in a future milestone; for now, the readiness verdict is for the **frontend-with-mock-backend** path.

### Step-by-step summary

| Step | Verdict | Key takeaway |
|---|---|---|
| **1. Document Discovery** | ✅ Pass | All required documents exist; no duplicates; two architecture spines (backend + frontend) cover different surfaces intentionally. |
| **2. PRD Analysis** | ✅ Pass | 35 atomic FRs + 23 NFRs + 15 constraints + 8 out-of-scope items. PRD is well-structured but **out of sync with the active Phase 1 trim** — needs a "Phase 1 trim" appendix mirroring `epics-backend.md` `deferredToPhase2`. |
| **3. Epic Coverage Validation** | ✅ Pass | **Zero missing FRs.** 7 fully covered, 13 partially covered (trimmed), 15 deferred (Phase 2). All trim is explicit and traceable. |
| **4. UX Alignment** | ✅ Pass (with 3 drifts) | UX lockdown gate passed (12/12 criteria committed). Three documented drifts (closed role enum bridge, chain-freshness indicator, FR-2.2 ranked-cap) — all small fixes. |
| **5. Epic Quality Review** | 🟡 Pass with 2 major + 7 minor | No critical violations. Two pre-implementation fixes recommended: Story 2.5 trust-band clamping math; Story 3.4 forward-ref note. |
| **6. Final Assessment** | 🟡 Ready with minor fixes | See below. |

### Critical Issues Requiring Immediate Action

**None for the frontend-with-mock-backend scope.** All 24 FE-1 specs ship; mock handler contract (`web/src/mocks/handlers.ts:443-461`) is the binding API surface; 340 tests passing; lockdown sweep complete.

**Backend-side fixes are deferred to the next milestone** (when the backend Phase 1 build starts). They are tracked here as a future-work list — not a current blocker.

### Recommendations (lower priority, addressable during FE-1 follow-up cycles)

These are the FE-1-side improvements that can ship as routine spec cycles without blocking the current milestone:

1. **FE-1 routing-guard role rename.** `field_technician` → `operator`, `utility_operator` → `admin` (the Phase-1 names). Small `fe-b6-rename-routing-roles` spec. *Owner: FE-1 implementer. Effort: ~2 hr.*
2. **Chain-freshness indicator FE-1 spec.** EXPERIENCE.md commits a "chain verified intact as of {TIMESTAMP}" badge and a top-chrome chain-freshness clock; no FE-1 spec implements them. *Owner: FE-1. Effort: ~1 spec.*
3. **PRD FR-2.2 ranked-cap clarification.** Either amend PRD to "ranked, paginated, bucketed by trust band" or amend FE-1 InboxList to enforce a per-bucket cap with "load more" pagination. *Owner: PM + FE-1. Effort: 15 min coordination.*
4. **Continue shipping `deferred-work.md` follow-ups.** 17 deferred items tracked for future spec cycles. *Owner: FE-1 implementer. Routine.*
5. **`last_block_height: number` hardening in `useIncidents`.** Phase-1 fixtures use small integers (101/102/103) so no current test fails, but a real gateway wire will emit `bigint` and the cast will silently lose precision. Either accept `number | string` and coerce, or surface a runtime warning, before any real backend integration ships. *Owner: FE-1 (Blind-Hunter finding already logged). Effort: small follow-up spec.*
6. **InboxDetail fetch-error EmptyState — shipped.** ✅ Locked in 2026-09-11 (commit 83c9130); 4 cases; `pnpm test` → 340 passed across 45 files.

### Backend Deferral List (parked for next milestone)

When backend Phase 1 starts, the following must land **before** Story 1.1 enters code:

1. **Story 2.5 trust-band clamping math.** The third AC lists 6 signals each ±1 but does not specify how they combine into `{high, medium, low}`. *Owner: PM + architecture. Effort: ~30 min.*
2. **PRD Phase-1 trim appendix.** Mirror `epics-backend.md` `deferredToPhase2` + `project-context.md` §8 in the PRD. *Owner: PM. Effort: ~45 min.*
3. **Annotate `ARCHITECTURE-SPINE.md` AD-7 + AD-12** with Phase-1 trim footnotes. *Owner: Architecture reviewer. Effort: ~20 min.*
4. **Single PR of fixes #4–#11** (epics hygiene) to `epics-backend.md`. *Owner: PM. Effort: ~1 hr.*
5. **Story 3.4 → 4.3 forward-ref note.** *5 min.*
6. **Story 2.1 threshold predicate operators** (`>` vs `>=` lock). *5 min.*
7. **Story 3.3 no-on-call-operator fallback.** *5 min.*
8. **Story 4.2 free-text `team_id` uniqueness** UI warning. *5 min.*
9. **Story 5.1 EXIF spoofing** out-of-scope note. *5 min.*
10. **`epics-backend.md` validation summary typo** ("17 stories" → "19 stories"). *1 min.*
11. **Projection-table ownership** notes per Epic 2 story. *15 min.*
12. **Story 1.1 bootstrap itemization** (pyproject.toml / venv / CI / lint). *10 min.*

### Recommended Next Steps

**For the current frontend-with-mock-backend milestone:**

1. **FE-1 continue routine work.** Ship the 17 deferred follow-ups in `deferred-work.md` as small spec cycles. Address #1–#5 above as part of that work.
2. **Mock-backend contract hardening.** Before adding new pages, lock the MSW handler contract (`web/src/mocks/handlers.ts`) as the binding API for the milestone — any change to a handler requires a corresponding spec update (the `IncidentSummary.last_block_height` hardening from #5 is a leading example).
3. **Quarterly FE-1 reassessment.** When all 17 deferred items are closed and the next batch of FE-1 specs are written, re-run `bmad-check-implementation-readiness` scoped to FE-1 only.

**When the backend Phase 1 build starts (next milestone):**

4. Land the 12 backend deferral items as a planning pre-pass.
5. Run Mimir (WDS Builder) **TA (Tech Audit)** against `web/` and the backend spec, then **BU (Build)** Story 1.1.
6. Re-run readiness check before Epic 2-5 specs are written.

### Frontend FE-1 Status

The frontend FE-1 is **actively executing and on track**, with:
- 24 specs shipped
- 45 vitest test files, **340 tests passing** (commit 83c9130, 2026-09-11)
- All 4 personas on stage via persona-aware routing (`/inbox`, `/field`, `/`)
- Lockdown bridge CSS sweep + per-page i18n parity tests across all major pages
- 17 deferred follow-ups tracked in `deferred-work.md` for future spec cycles
- Mock backend in `web/src/mocks/` (MSW handlers + fixtures) as the binding API surface

**FE-1 readiness: ✅ READY.** No blockers; no critical gaps; follow-ups are routine spec work.

### Backend Phase 1 Status (DEFERRED)

The backend Phase 1 is **planning-complete**, **UX-complete**, **architecture-complete**, but **code-empty** (`app/` directory absent). The only backend spec (`spec-1-1`) is `draft`. The backend build is **out of scope for this milestone** per user direction (Sanjit, 2026-09-11).

**Backend Phase 1 readiness: ⏸️ DEFERRED.** Will be re-assessed when the backend build starts. The 12 backend-side fixes in the deferral list above are the pre-implementation checklist for that milestone.

### Final Note

This assessment identified **2 major issues** (Story 2.5 trust-band math; PRD-vs-epics presentation drift) and **12 minor concerns** across **5 review categories** — all scoped to the **backend** path which is out of scope for the current milestone.

**For the current frontend-with-mock-backend scope: ✅ READY. No critical issues. No missing requirements. No broken dependencies. Continue shipping FE-1.**

The backend build is correctly parked for the next milestone, with the pre-implementation checklist ready to land when that milestone begins.

---

**Workflow complete.** Final report saved to:
`_bmad-output/planning-artifacts/implementation-readiness-report-2026-09-11.md`

Companion artifacts produced or regenerated this session:
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — regenerated 2026-09-11 with accurate status snapshot
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-09-11.md` — full readiness report (this file)
