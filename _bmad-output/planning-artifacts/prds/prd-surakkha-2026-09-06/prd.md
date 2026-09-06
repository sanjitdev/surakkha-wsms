---
title: Surakkha v1 — PRD
status: final
created: 2026-09-06
updated: 2026-09-06
---

# Surakkha v1 — Product Requirements Document

> **Source-of-truth.** The canonical product contract is `_bmad-output/specs/spec-surakkha-v1/SPEC.md` plus its 7 companions. This PRD distills that contract into FRs, NFRs, success metrics, and review gates for engineering execution. Where the spec and PRD appear to disagree, the spec wins.
>
> **Companions referenced throughout this PRD (relative to spec folder):**
> - `personas.md` — Anjali / Priya / Dr. Mensah / Ramesh / Attacker
> - `playbook-lifecycle.md` — 7-stage playbook lifecycle, deviation policy, liability split (C-13)
> - `escalation-policy.md` — T0-T4 model, signal-fusion matrix, tiered PHA-approval SLA (C-3 §5a)
> - `sales-motion.md` — champion stack, donor / WB funding channel (C-16), lighthouse criteria
> - `architecture-invariants.md` — multi-tenant SaaS, three UIs, sealed-component contracts, channel adapters, audit chain, RBAC, multi-radio, component-seam matrix
> - `detection-layer.md` — sensor pyramid, sentinel QA (C-9), source-fusion math, multi-radio (C-15)
> - `constraints-load-bearing.md` — 7 commercial / institutional / political constraints

## 1. Summary

Surakkha v1 is the **first lighthouse-city deployment** of a water-safety monitoring platform whose load-bearing system is the operator's response loop, not the sensor feed. A two-tier network of trusted local reporters (Anjalis, embedded in micro-communities) feeds a central city operator (Priya) who runs PHA-approved, simulator-tested playbooks with tiered escalation and a tamper-evident audit chain. v1 targets **Dhaka, Bangladesh** as the lighthouse deployment, funded through the World Bank Water Global Practice (IDA/IBRD country lending).

The product ships to prove the loop works end-to-end in one city, not to scale fleet-wide.

## 2. Lighthouse Target

**City:** Dhaka, Bangladesh.
**Population served (v1 footprint):** ~250,000 citizens in a defined zone (specific zone pending Dhaka commitment).
**Anjalis (v1):** 50, 2 per ward across 25 wards.
**Industrial sensors:** 5 source-grade probes at intakes / pump stations.
**Sentinel strips:** 30 at ward human-traffic nodes (schools, hospitals, community points).
**Operator class:** 1-2 Priyas (central city operators); 1 Dr. Mensah-equivalent (city PHA director).

> **Spec divergence (flagged).** The spec recommends a Tier-2 ~500K city (`sales-motion.md` §7). Dhaka is a Tier-1 megacity (~22M metro). The response-loop design is city-size-agnostic; the divergence is acknowledged and tracked. PRD captures this as an Assumption; architecture review at scale-100K-citizens milestone must validate.

## 3. Personas

Personas carry their full context in `personas.md`. Summary for PRD cross-reference:

| Persona | Role | Surface | Core win |
|---|---|---|---|
| **Anjali** | Local operator (school principal) | Anjali-mobile (Android, WhatsApp-fronted) | Reports taken seriously, status + credential earned, my neighborhood safe |
| **Priya** | Central city operator | Priya-desktop (web dashboard) | Resolve incidents without harm, expertise compounds, monthly report auto-generated |
| **Dr. Mensah (BD equiv)** | PHA director | PHA-pane (read-mostly regulator) | Defensible record, no false-positive public notice, mandate the standard |
| **Ramesh** | Consumer | None (WhatsApp + SMS inbound) | Clear safe/boil/do-not-drink answer without app install |
| **Attacker** | Constraint persona | (Defenses, not UI) | (Defenses must hold against spoofing, insider tampering, replay) |

## 4. Capabilities (FRs)

The PRD numbers FRs globally and stable. Each FR names intent + acceptance criterion. Cross-references to spec CAP-N and the companion sections the dev skill must read.

### Foundation Capabilities

**FR-1 — Append-only cryptographic audit chain with two-person rule.**
*Spec ref:* CAP-6 + C-8. *Companion:* `architecture-invariants.md` §6. *Story:* 1.
**FR-1.1.** Every audit-relevant event (sensor calibration, threshold change, playbook approval / amendment, operator action / deviation, consumer message issuance, role change, lab submission, system login, integration pull) is captured as a content-addressed block chained to its predecessor.
**FR-1.2.** A single gateway mediates all chain writes; no module writes directly to chain storage. Per-city namespace; federation-ready but not active (C-1).
**FR-1.3.** Two-person signature enforced on (a) T3-boundary playbook edits and (b) consumer message issuance. Dual signature captured in the chain block.
**FR-1.4.** Sensor silence beyond a configurable threshold is logged as an audit event, not as maintenance noise (C-15). The absence of a reading is a recorded event.
**FR-1.5.** Read access to chain is policy-controlled per role (Priya: own operator log; PHA: cross-ward rollups; audit browser in PHA-pane is read-only and access-logged per read).

*Acceptance:* Retroactive tampering detectable; chain verifiable independently; two-person rule enforced in code not policy.

**FR-2 — Heterogeneous source-fusion engine with per-source credibility weighting.**
*Spec ref:* CAP-5 + C-6 + C-7. *Companion:* `architecture-invariants.md` §3, `detection-layer.md` §4. *Story:* 2.
**FR-2.1.** Five inputs: industrial sensor (5 in v1), Anjali report (with credibility weight), citizen complaint cluster (≥3 in zone/24h), lab result, environmental signal.
**FR-2.2.** Output: ranked action list of 4-6 incidents with playbook recommendation, source attribution, and corroborated confidence score. Priya sees the ranked list, not raw sensor feeds.
**FR-2.3.** Weights are city-configurable per contaminant class (WHO-grounded defaults); Anjali credibility updates **weekly in v1**, not real-time.
**FR-2.4.** v1 implementation is weighted-voting. v2 may swap to ML; the five-input / ranked-list-output contract is **sealed** (C-7) — consumers insulated from the swap.

*Acceptance:* Given inputs from ≥3 of the five source types, engine produces an ordered list of 4-6 candidate incidents with attribution and confidence that Priya can act on in <3 minutes per incident.

**FR-3 — Playbook authoring, simulation, and deviation-to-amendment lifecycle.**
*Spec ref:* CAP-7 + C-13 + C-14. *Companion:* `playbook-lifecycle.md`. *Story:* 3.
**FR-3.1.** Seven-stage lifecycle: author → approve → run → deviate → review → amend → re-approve. Every stage writes to the audit chain.
**FR-3.2.** Authoring surface: structured editor with constraint checks against the WHO-grounded template library (C-14 — v1 deliverable, **not external dependency**). Confidence score surfaces on the draft.
**FR-3.3.** Simulator: 2-minute "what would have happened" dry-run against historical or synthetic incidents. Available for new sensor configs, new playbook drafts, new shifts.
**FR-3.4.** Approval authority: **PHA director owns approval, vendor does not**. Dual signature if the amendment touches the T3 boundary.
**FR-3.5.** Deviation is first-class with friction but not block. Override-with-reasoning captured to audit chain as a distinct event type. Monthly review clusters deviations; patterns indicate either bad playbook step (system problem) or uniquely good operator instinct (training material). Clusters promote to amendment candidates with lineage recorded.
**FR-3.6.** Liability split is codified: vendor carries platform-integrity liability; PHA carries approval liability; utility carries operational liability. Audit chain is the evidence surface.

*Acceptance:* A senior operator authors a contaminant-class playbook in the editor with constraint checks; dry-runs it against a synthetic event in <2 minutes; deviations from a live incident surface as proposed amendments in the next monthly review.

### Persona Surfaces

**FR-4 — Anjali one-tap reporting across WhatsApp, voice, image, and SMS in regional language.**
*Spec ref:* CAP-1 + C-11 + C-15. *Companion:* `personas.md` Anjali. *Story:* 4.
**FR-4.1.** Voice + image + SMS over text; SMS is first-class not fallback (C-11).
**FR-4.2.** Local-language UI: Bangla primary, English fallback.
**FR-4.3.** Reports reach Priya within **5 minutes when online**; queued offline-first when not. Multi-radio connectivity architecture (cellular primary / LPWAN secondary / SD-card tertiary, C-15) routes around outages silently.
**FR-4.4.** Phone-as-network for ward sentinel: Anjali's phone syncs to cloud when it can, inheriting offline-first patterns from community-health-worker systems.
**FR-4.5.** Anjali is the only trust-bearing interface: no login, no training app, no dashboard. Survives cracked-screen Android, low data plan, WhatsApp-only.
**FR-4.6.** Hybrid incentive surface: BDT 2,000/month stipend (~US$18) tied to weekly check-in discipline (not per-report bounty) + credential issued by ICDDR,B or Bangabandhu Sheikh Mujib Medical University + quarterly city-level recognition. Stipend structure cannot be per-report bounty (creates gaming + false-positive inflation).
**FR-4.7.** Public acknowledgement when her report triggers a real response; she must see that her report mattered.

*Acceptance:* A real Anjali at a real school can complete a daily check-in + sentinel-strip photo + "something wrong" escalation in <60 seconds on a low-end Android phone with intermittent connectivity; her report reaches Priya within 5 minutes when online.

**FR-5 — Priya ranked action list with playbook execution and deviation capture.**
*Spec ref:* CAP-2. *Companion:* `personas.md` Priya. *Story:* 5.
**FR-5.1.** Incident dashboard ranked by fusion score, with source attribution and corroborated confidence — not raw sensor feeds.
**FR-5.2.** Auto-generated handover brief at shift change ("today's open threads"); kills tribal-knowledge dependency.
**FR-5.3.** Read-only playbook view + ability to execute steps against the active version-of-record. Every action and non-action logged against the playbook step with reasoning.
**FR-5.4.** Override-with-reasoning capture. Deviations compared to outcomes and feed threshold tuning + Priya credential.
**FR-5.5.** Escape hatch with friction but not block when deviating from playbook. Blame-free review is the goal; a block would cost her trust on the bad day.
**FR-5.6.** Auto-generated PHA monthly report assembled from the audit trail, not by hand.

*Acceptance:* A real Priya can pick the top-ranked incident, see source-attribution + corroboration confidence, execute the matching playbook step, and if she deviates record the reason — all in <3 minutes per incident.

**FR-6 — PHA pane for playbook approval, threshold tuning, and audit without alteration.**
*Spec ref:* CAP-3 + C-3. *Companion:* `personas.md` Dr. Mensah, `escalation-policy.md` §5a, `sales-motion.md` §4a. *Story:* 6.
**FR-6.1.** Playbook amendment approvals with dual signature at T3 boundary.
**FR-6.2.** Per-contaminant-class threshold tuning with **tiered SLA** (C-3): acute classes (bacterial, chemical spill, sewage cross-connection) — **5 minutes SLA, on-call rotation, 3 named approvers, 7×24 coverage, auto-escalation on timeout**. Chronic classes (lead leach, conductivity drift, cumulative exposure, seasonal drift) — **4 hours SLA, business hours, batched review 2x/day**.
**FR-6.3.** Read-only audit-chain browser: cross-ward aggregates, deviation dashboards, threshold edit history with reasoning. Access-logged per read.
**FR-6.4.** Cross-utility oversight + standard-setting authority. PHA owns the threshold where public notice fires; Mayor's office owns message tone (T3+).
**FR-6.5.** Never a message-desk. The PHA does not become the message issuer.
**FR-6.6.** WB-aligned evidence-export tooling from day one (C-16) — disbursement-linked indicators, results framework, audit-trail evidence per outcome — without retrofit.

*Acceptance:* PHA director signs a playbook amendment in the app; tunes per-contaminant-class threshold; views deviation dashboard — all from one pane, with cryptographic proof that the audit chain is unaltered since the events he queries.

**FR-7 — Ramesh consumer messaging via WhatsApp and SMS at Tier 3 and above.**
*Spec ref:* CAP-4 + C-4. *Companion:* `personas.md` Ramesh, `architecture-invariants.md` §5. *Story:* 7.
**FR-7.1.** Public messages **only at Tier 3 or above** (C-4). No public broadcast from T1 or T2.
**FR-7.2.** Two-person rule on consumer message issuance (C-4, C-8).
**FR-7.3.** WhatsApp + SMS redundancy (architecture-invariants.md §5); signed gateway. SMS carries more legal weight in target geographies than WhatsApp.
**FR-7.4.** Plain-language messages: "Safe now / Boil / Do not drink / Use bottled / Wait" — short and sourced. Names the issuing authority, the affected zone, the action, and the verification horizon.
**FR-7.5.** Ward-councillor network as trust-bridging voice: messages routed through councillor carry more weight than system-issued messages. Brand is the councillor's endorsement, not the platform's.
**FR-7.6.** No app install, no dashboard, no paywall. The system is invisible infrastructure.

*Acceptance:* Ramesh receives a Tier 3 public notice via WhatsApp + SMS within 15 minutes of confirmed contamination; the message names the issuing authority, affected zone, action, and verification horizon; no app download required.

## 5. Non-Functional Requirements

### 5.1 Performance
- Anjali report ingestion: <5 minutes end-to-end (online); queued offline-first with no data loss.
- Priya dashboard load: ranked action list surfaces within 3 seconds of login.
- Sentinel strip CV read: <10 seconds per strip on mid-tier Android.
- Source-fusion engine: produces ranked list in <2 seconds for the v1 input volume (5 sensors + 30 strips + Anjali reports).

### 5.2 Reliability & Availability
- Sensor ingestion tolerates connectivity loss as expected operation (C-15). Latency of action beats measurement accuracy.
- Audit chain gateway is the most-load-bearing service; designed for no-data-loss writes. Replication across at least 2 geographic zones per tenant city.
- Consumer message issuance is synchronous (not best-effort) — failed deliveries retry, escalate to alternative channel (SMS fallback if WhatsApp down).

### 5.3 Privacy & Security
- Privacy-by-default (C-10): zone-level geofence for consumer reports (not lat/long), anonymized consumer reports by default, encryption at rest + in transit + E2E on consumer channel, right-to-be-forgotten where legally required.
- Access-logged operator data: every read of operator data produces an audit event.
- Override-anomaly detection: **logged in v1, enforced in v2** (architecture-invariants.md §7). Override patterns deviating from peer baselines surface for retrospective review.

### 5.4 Multi-tenancy & Data Sovereignty
- Per-city database isolation (C-1); no cross-city joins at the storage layer.
- Per-city RBAC matrix (architecture-invariants.md §7); same global role name maps to city-specific permissions.
- Per-city audit-chain namespace. Federation operates on aggregated roll-ups, not raw cross-city reads.
- Data sovereignty per jurisdiction: Bangladesh data lives in Bangladesh-resident storage.

### 5.5 Compliance
- **Audit standards** must satisfy World Bank IDA/IBRD audit requirements (C-16) from day one — disbursement-linked indicators, results framework, audit-trail evidence per outcome.
- **Reporting cadence** aligned to WB quarterly / milestone submission. The auto-generated PHA monthly report must roll up into the WB quarterly submission without manual reassembly.
- **Liability contract split** (C-13) reflected in Dhaka city contract: vendor platform-integrity liability; PHA approval liability; utility operational liability. Audit chain as the evidence surface.
- **Sentinel QA discipline** (C-9): third-party lab certifies each lot before shipment; vendor's role ends at certified delivery; city owns handling discipline and field failures.

### 5.6 Connectivity & Resilience
- Multi-radio fallback (C-15): cellular primary → LPWAN secondary → SD-card store-and-forward tertiary.
- Ward sentinel uses phone-as-network (Anjali's phone, offline-first sync).
- SMS is first-class (not degraded fallback, C-11).

### 5.7 Interoperability
- Read-only APIs into existing SCADA where present (NG-1 — do not replace SCADA, sit alongside it).
- APIs into billing, lab systems with least-privilege permissions.
- SOC2-ready posture in v1.

## 6. Out of Scope (v1)

Carried from spec non-goals (NG-1 through NG-8):
- Replacing the city's existing SCADA.
- Selling directly to consumers.
- Building a dedicated consumer mobile app.
- ML-heavy detection / cross-city trained models (v1 weighted-voting only).
- Federated multi-city operation (architecture supports; product does not exercise).
- Outcome-priced insurance product (subscription only).
- Manufacturing sensors at any tier.
- Regulator benchmarking across utilities.

## 7. Success Metrics

The lighthouse deployment succeeds when the city has run **two consecutive real contamination events** through the full response loop (Anjali report → Priya escalation → PHA approval → Tier 3a public notice → resolution → deviation review → playbook amendment signed off) with the entire chain on the audit log, **no false-positive public notice**, and the PHA attesting that the system produced a defensible record under press or inquiry.

### Operational Metrics (measured monthly)
- **Loop completion rate.** Fraction of contamination events that reach the audit-confirmed "resolved + amendment-signed" stage. Target: ≥80% within 12 months.
- **Time-to-T3.** Median minutes from first source signal to Tier 3a public notice. Target: <30 minutes for acute contamination events.
- **False-positive rate.** Public notices issued at Tier 3+ subsequently re-classified as false positives. Target: ≤1 per quarter.
- **PHA override rate.** Fraction of Tier transitions where Priya / operator overrode without full corroboration. Tracked, not targeted — this is the deviation signal that drives playbook improvement.
- **Anjali weekly discipline.** Fraction of Anjalis completing the weekly check-in + sentinel-strip photo on cadence. Target: ≥85% weekly compliance.

### Counter-Metrics (watch for degradation)
- **Sensor-silence days.** Total sensor-silence days per quarter. Should **decrease** as operations mature. Increase = either installation issue, connectivity failure, or staffing gap.
- **Priya escalation-to-resolution cycle time.** Should **stabilize** then decrease as playbook familiarity compounds. Increase = playbook gap or training gap.
- **Deviation cluster size.** Should **shrink** as amendments land. Growing cluster = a bad playbook step (system problem) not addressed.
- **PHA approval timeout rate.** Auto-escalation events from acute-class SLA timeout. Should be near zero in steady state; sustained elevation = either PHA coverage gap or threshold mis-tuning.

### Outcome Metric (the lighthouse test)
- **Two consecutive real contamination events handled cleanly with PHA attestation under inquiry.** That is the success signal the spec names, and the metric the v1 paid renewal is judged against.

## 8. Architecture Constraints

The architecture constraints are load-bearing and live in the spec. The PRD summarizes:

- **C-1** Multi-tenant SaaS from Day 1; per-city DB isolation; federation-ready not active.
- **C-2** Three persona-specific UIs (Anjali-mobile / Priya-desktop / PHA-pane), not one responsive app.
- **C-3** Tiered PHA approval SLA per contaminant class (5 min acute / 4 hr chronic); T2→T3 is embedded governance.
- **C-4** Public messages only at T3+; two-person rule on issuance.
- **C-5** Three-tier sensor pyramid fixed (industrial / sentinel / no in-house manufacturing).
- **C-6** Weighted-source fusion v1 (no ML); per-contaminant-class weights city-configurable.
- **C-7** Source-fusion engine is sealed; v2 may swap to ML with consumer contract unchanged.
- **C-8** Audit chain content-addressed with cryptographic chaining + dual signatures.
- **C-9** Sentinel QA = third-party lab certifies each lot before shipment; vendor's role ends at certified delivery; city owns handling and field failures.
- **C-10** Privacy-by-default (zone-geofence, anonymize, encrypt, RTBF).
- **C-11** Anjali is the only trust-bearing interface; SMS first-class not fallback.
- **C-13** Vendor-disclaims liability for playbook-wrong harm; PHA + utility carry operational/approval liability through city contracts; vendor provides platform + audit chain as evidence.
- **C-14** WHO-grounded playbook template library is a v1 deliverable, not external dependency.
- **C-15** Multi-radio connectivity architecture (cellular / LPWAN / SD-card); phone-as-network for ward sentinels; sensor silence logged as event.
- **C-16** Lighthouse funding channel = World Bank Water Global Practice (IDA/IBRD country lending — Bangladesh Water Security Program).

## 9. Stories → Implementation Sequencing

The 7 stories in `_bmad-output/specs/spec-surakkha-v1/stories.yaml` are dispatched in this order:

| Order | Story | Why this position |
|---|---|---|
| 1 | Audit chain (CAP-6) | Foundation seam; every later story writes through it. |
| 2 | Source-fusion engine (CAP-5) | Depends on audit chain; enables Priya + playbook to consume ranked list. |
| 3 | Playbook lifecycle (CAP-7) | Depends on audit chain + fusion output; PHA approvals use audit chain. |
| 4 | Anjali one-tap (CAP-1) | Persona surface; depends on fusion input + audit chain. |
| 5 | Priya ranked action list (CAP-2) | Depends on fusion + playbook + audit chain. |
| 6 | PHA pane (CAP-3) | Depends on playbook + audit chain + WB export tooling. |
| 7 | Ramesh consumer messaging (CAP-4) | Last; depends on audit chain + PHA approval + two-person rule; smallest surface. |

All 7 stories have `spec_checkpoint: true` and `done_checkpoint: true` — human review before dispatch and after completion.

## 10. Launch Plan & Milestones

### Pre-launch (months 0-6 from PRD sign-off)
- **M0 — Dhaka commitment secured.** Contract structure aligned to WB IDA/IBRD procurement rules; co-funding split (WB capex, municipal opex) agreed; PHA, Mayor, utility all signed.
- **M1 — WHO template library authoring completed** (C-14). This is a v1 deliverable; authoring has not begun — see Open Items.
- **M2 — Sentinel vendor + lab cert partner contracted** (OQ-11 resolved: Chinese OEM + DPHE/ICDDR,B). Lab cert process documented.
- **M3 — First Anjalis co-design recruited** (OQ-8: 1-2 real Anjalis in Dhaka, recruited in first 90 days post-sign).
- **M4 — Sales hire post-Dhaka-engagement trigger fires** (A3). Founder-led until then.
- **M5 — Industrial sensor procurement validated** (A8 sub-task: lead-time + licensing confirmed for Hach/Thermo/Xylem or Bangladesh-region OEM in Dhaka).
- **M6 — Platform builds to first usable state.** Stories 1-3 (audit chain + fusion + playbook) shippable for internal dogfood.

### Launch (months 7-12)
- **M7 — Stories 4-7 shippable.** Anjali, Priya, PHA, Ramesh surfaces built.
- **M8 — 50 Anjalis recruited + trained in Dhaka.** Hybrid incentive live (BDT 2,000/month + ICDDR,B credential + quarterly recognition).
- **M9 — 5 industrial probes + 30 sentinel strips deployed.** Lab cert records on chain.
- **M10 — First simulated end-to-end loop test.** Synthetic contamination event runs through full chain.
- **M11 — First real contamination event handled.** (Success metric — track end-to-end.)
- **M12 — First paid renewal.** (Sales motion target.)

### Repeatability (months 13-18)
- **M13 — Second real contamination event.** (Success signal: two consecutive events handled cleanly.)
- **M15 — First playbook amendment signed off** driven by deviation cluster from M11.
- **M18 — PHA attestation under inquiry.** Mayor press conference / regulatory review where PHA defends the system record.

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dhaka engagement delays beyond 30-day target | Medium | High | Sales motion contingency in `sales-motion.md` §6 (year-before-election, etc.); WB IDA/IBRD cycles run 18-24 months so 30-day target is soft |
| WHO template library authoring slips past M1 | High | High | Promote to Open Question (see §13); identify WHO-license partner or public-health-best-practice fallback by M0+30d |
| Sentinel lot bad-certification incident | Medium | High | C-9 discipline (third-party lab cert before shipment); bad-lot incident response plan written and PHA-signed before first lot ships; lot-level audit chain attribution for fast public acknowledgement |
| False-positive public notice on first real event | Medium | High (career-ending for PHA) | Tiered escalation (C-3) with PHA approval gate at T2→T3; two-person rule on issuance (C-4); override-anomaly detection logged in v1 |
| Industrial sensor procurement friction in Dhaka | Medium | Medium | A8 sub-task validates lead-time + licensing before M5; Bangladesh-region OEM fallback in `detection-layer.md` §1 |
| Tier-1 city scale stress (Dhaka is megacity, not Tier-2) | Medium | Medium | Architecture review at scale-100K milestone; sensor-fusion engine and audit chain gateway designed for the load |
| Sales hire deferred too long post-Dhaka sign | Medium | Medium | A3 trigger explicit; founder-led motion has defined runway (Dhaka engagement close → first renewal) |
| Insider tamper of audit chain | Low | Critical | C-8 cryptographic chaining; two-person rule on T3-boundary edits and consumer messages; access-logged reads |

## 12. Assumptions

- **A3** Founder(s) cover sales until Dhaka engagement closes; sales hire with B2B municipal experience is a post-sign trigger.
- **A6** ICDDR,B identified as third-party lab cert partner (per OQ-11).
- **A8** Industrial sensors ($200-500 OEM tier) procurable for Dhaka; lead-time and licensing constraints to be validated as M5 sub-task.
- **Dhaka city class.** Dhaka is Tier-1 (~22M metro), differs from spec's recommended Tier-2 (~500K). Response-loop design is city-size-agnostic; PRD flags and architecture review at scale-100K milestone validates.

## 13. Open Questions

- **OQ-7-resolved-but-flagged:** Dhaka lighthouse target differs from spec Tier-2 framing. Founding team decision; tracked as Assumption.
- **A7-promoted:** WHO-grounded playbook template library authoring has not begun. C-14 makes it a v1 deliverable; authoring is a **launch prerequisite** with M1 milestone. Without a written template library by M0+30d, this becomes a launch blocker.
- **A8-sub-task:** Bangladesh-region industrial-sensor procurement validation (lead-time + licensing) by M5.
- **Vendor specifics:** Chinese OEM strip vendor not yet named. Procurement RFI in progress.

## 14. Open Questions Resolved During PRD Authoring

| Item | Resolution |
|---|---|
| OQ-7 | Dhaka as lighthouse target |
| OQ-8 | 1-2 real Anjalis recruited in first 90 days post-Dhaka sign |
| OQ-9 | Use spec defaults: acute 5 min / chronic 4 hr |
| OQ-10 | IDA/IBRD country lending (Bangladesh Water Security Program) |
| OQ-11 | Chinese OEM strip vendor + DPHE Bangladesh / ICDDR,B lab cert |
| OQ-12 | BDT 2,000/month + ICDDR,B credential + quarterly city-level recognition |
| A3 | Founder-led sales until Dhaka sign |
| A6 | ICDDR,B identified |
| A7 | Promoted to Open Question (WHO template library authoring) |
| A8 | Procurement path known; sub-task validates by M5 |

## 15. References

- **Spec kernel:** `_bmad-output/specs/spec-surakkha-v1/SPEC.md`
- **Spec companions:** `_bmad-output/specs/spec-surakkha-v1/{personas,playbook-lifecycle,escalation-policy,sales-motion,architecture-invariants,detection-layer,constraints-load-bearing}.md`
- **Stories:** `_bmad-output/specs/spec-surakkha-v1/stories.yaml`
- **Spec memlog:** `_bmad-output/specs/spec-surakkha-v1/.memlog.md`
- **Brainstorm:** `_bmad-output/brainstorming/brainstorm-water-safety-monitoring-system-2026-09-06/`
- **Product brief:** `_bmad-output/brainstorming/brainstorm-water-safety-monitoring-system-2026-09-06/product-brief-v1.md`
- **Original idea:** `docs/idea.md`
