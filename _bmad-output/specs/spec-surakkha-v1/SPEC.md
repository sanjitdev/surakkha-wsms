---
id: SPEC-surakkha-v1
companions:
  - personas.md
  - playbook-lifecycle.md
  - escalation-policy.md
  - sales-motion.md
  - architecture-invariants.md
  - detection-layer.md
  - constraints-load-bearing.md
  - ../../planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
sources:
  - ../../brainstorming/brainstorm-water-safety-monitoring-system-2026-09-06/product-brief-v1.md
  - ../../../docs/idea.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Surakkha v1 — Water-Safety Monitoring System (Lighthouse City)

## Why

Cities lose public trust one outbreak at a time. Tier-2 Indian cities face annual water-safety events — pipe-leakage contamination, post-accident spikes, illegal tappings — that the central operator cannot see until hospitals report cases, by which point prevention has failed and politics has begun. **Surakkha exists to make the operator's response loop the load-bearing system**, not the sensor feed: a two-tier network of trusted local reporters (Anjali) feeding a central operator (Priya) who runs admin-authored, PHA-approved, simulator-tested playbooks with tiered escalation and a tamper-evident audit chain. v1 is the **first lighthouse-city deployment** that proves the loop, not a fleet rollout. The timing is now because three forces converged by 2026: low-cost industrial probes dropped municipal hardware ~10x, computer-vision on smartphones turned a $1 paper strip into a quantitative reading, and multi-radio connectivity made dense sensor meshes viable in intermittent-network environments. The funding model is donor-primary via the **World Bank Water Global Practice**, with municipal co-funding on opex lines.

## Capabilities

- **CAP-1: Local operator (Anjali) can report contamination via one-tap WhatsApp, voice, image, or SMS in her regional language, with auto-sync when connectivity returns.**
  - **success:** A real Anjali at a real school can complete a daily check-in + a sentinel-strip photo + a "something wrong" escalation in under 60 seconds on a low-end Android phone with intermittent connectivity; her report reaches Priya within 5 minutes when online and is queued offline-first when not.

- **CAP-2: Central operator (Priya) can view a ranked action list (not raw sensor feeds) and execute an approved playbook with deviation capture and reason.**
  - **success:** A real Priya can pick the top-ranked incident, see source-attribution and corroboration confidence, execute the matching playbook step, and if she deviates record the reason — all in under 3 minutes per incident, with every action and reasoning logged to the audit chain.

- **CAP-3: PHA director (Dr. Mensah) can approve playbook amendments, set tiered-escalation thresholds, and audit any utility's response history without altering the record.**
  - **success:** Dr. Mensah can sign a playbook amendment in the app; tune a per-contaminant-class threshold for his jurisdiction (with tiered SLA — acute in minutes, chronic in hours); and view a deviation dashboard across utilities in his region — all from one pane, with cryptographic proof that the audit chain is unaltered since the events he queries.

- **CAP-4: Consumer (Ramesh) can receive a clear, source-attributed "safe / boil / do not drink / wait" message via WhatsApp or SMS in his language without installing an app.**
  - **success:** Ramesh receives a Tier 3 public notice via WhatsApp + SMS within 15 minutes of confirmed contamination; the message names the issuing authority, the affected zone, the action, and the verification horizon; no app download is required.

- **CAP-5: System can fuse heterogeneous sources (industrial sensors, sentinel strips, Anjali reports, citizen complaints, lab results, environmental signals) into a single ranked action list with per-source credibility weighting.**
  - **success:** Given inputs from at least three of those source types, the system produces an ordered list of 4-6 candidate incidents with source attribution and a corroboration-confidence score that Priya can act on; weights are city-configurable per contaminant class.

- **CAP-6: System maintains an append-only, cryptographically chained audit log of every safety-, policy-, and governance-relevant event.**
  - **success:** Any event a regulator, PHA, or court might query (sensor calibration, threshold change, playbook approval, operator action, deviation, consumer-message issuance, role change, lab submission) is captured, content-addressed, and chained; retroactive tampering is detectable; two-person rule on sensitive actions is enforced.

- **CAP-7: Admin can author a structured playbook from WHO templates, simulate it against historical or synthetic incidents, version it with sign-off metadata, and have deviations from the live playbook promote into amendment candidates.**
  - **success:** A senior operator can author a contaminant-class playbook in the editor with constraint checks, dry-run it against a synthetic event in under 2 minutes, and have deviations from a live incident surface as proposed amendments in the next monthly review.

## Constraints

- **C-1: Multi-tenant SaaS from Day 1.** Per-city database isolation, configurable per-city policies, separate audit-chain namespaces. Single-city deployment in v1; architecture supports federation.
- **C-2: Three persona-specific UIs, not one.** Anjali-mobile (Android, WhatsApp-fronted), Priya-desktop (incident dashboard + handover + report export), PHA-pane (cross-ward aggregate + threshold tuning + audit browser). Do not collapse into a single responsive app.
- **C-3: Tier 2→3 escalation requires PHA approval with tiered SLA per contaminant class.** Acute contamination = minutes SLA / on-call rotation. Chronic = hours SLA / business hours. T0→T1→T2 remains operator-domain with audit-log justification. T2→T3 is an embedded governance gate, not a UI nuisance.
- **C-4: Public-facing consumer messages only at Tier 3 or above.** No public broadcast from T1 or T2. Public-messaging policy is PHA-owned; two-person rule on issuance is enforced in code.
- **C-5: Three-tier sensor pyramid is fixed.** Industrial ($200–500 OEM, integrated not manufactured) at source/pump; sentinel ($1 paper strip + phone + CV) at community points; no in-house sensor manufacturing at any tier in v1.
- **C-6: Basic weighted-source fusion in v1 — not ML-heavy.** `score = Σ w_source · source_evidence`. Weights city-configurable per contaminant class, defaults WHO-grounded; ML-heavy detection deferred to v2.
- **C-7: Source-fusion engine is a sealed component with a stable interface.** v1 ships weighted-voting; v2 swaps in ML without changing the consumer contract (inputs/outputs of the engine are versioned).
- **C-8: Audit chain is content-addressed with cryptographic chaining.** Two-person rule on playbook edits at T3 boundary and consumer-message issuance implemented as dual-signature requirement.
- **C-9: Sentinel strip QA discipline = third-party lab certification.** Each lot certified before shipment; vendor's role ends at certified delivery; city owns handling discipline and any field failures; documented bad-lot incident response plan exists before first lot ships.
- **C-10: Privacy-by-default.** Geofence consumer reports to zone (not lat/long); anonymize consumer reports by default; encrypt at rest, in transit, and end-to-end on consumer channel; support right-to-be-forgotten where legally required.
- **C-11: Local operator (Anjali) is the only trust-bearing interface.** Design Anjali-mobile first, Priya-desktop second; the system must work end-to-end on SMS, not implicitly depend on WhatsApp.
- **C-13: Vendor-disclaims liability for playbook-wrong harm.** PHA and utility carry operational and approval liability through city contracts. Vendor provides platform + audit chain as evidence.
- **C-14: WHO-grounded playbook template library is a v1 deliverable to be authored** — not an external dependency. The library ships with the product.
- **C-15: Multi-radio connectivity is the architecture, not a user capability.** Cellular primary → LPWAN secondary → SD-card store-and-forward tertiary. Ward sentinels use phone-as-network (Anjali's phone, offline-first sync). Sensor silence is an audit-logged event, not maintenance noise.
- **C-16: Lighthouse-city funding channel is the World Bank Water Global Practice.** Donor Day-1 primary; contract structure, audit standards, and reporting cadence follow WB procurement rules; municipal co-funding covers opex lines.

## Non-goals

- **NG-1: Replacing the city's existing SCADA.** Sit alongside it; integrate via read-only APIs where needed.
- **NG-2: Selling directly to consumers.** Consumers receive messages; they are not the customer, not the billable party, not the user persona the product is shaped around.
- **NG-3: Building a dedicated consumer mobile app in v1.** WhatsApp + SMS + ward-councillor voice only; the trust bridge is a human, not an app icon.
- **NG-4: ML-heavy detection / cross-city trained models in v1.** Weighted-source voting only; ML is a v2 swap into the source-fusion engine, not a v1 component.
- **NG-5: Federated multi-city operation in v1.** Multi-tenant architecture supports it; the v1 product does not exercise it.
- **NG-6: Outcome-priced insurance product in v1.** Subscription-only pricing in v1; outcome pricing is a 5-year arc.
- **NG-7: Manufacturing sensors at any tier.** Integrate industrial probes from established vendors; integrate municipal-grade from Chinese OEMs in v2; integrate $1 paper strips for ward sentinel.
- **NG-8: Regulator benchmarking across utilities in v1.** Single-city PHA pane exists; cross-utility comparison is v2.

## Success signal

By the end of the v1 lighthouse-city deployment (12–18 months from first conversation with the city to paid renewal), **the city has run at least one real contamination event through the full response loop — Anjali report → Priya escalation → PHA approval → Tier 3a public notice → resolution → deviation review → playbook amendment signed off — with the entire chain on the audit log, no false-positive public notice, and the PHA attesting that the system produced a defensible record under press or inquiry.** The repeatability test: a *second* real event runs through the same loop faster, with fewer deviations, with the same PHA attesting again. Two consecutive real events handled cleanly = v1 succeeds.

## Assumptions

- A sales lead with B2B municipal experience is in the founding team or is hired before the first city sale.
- Industrial sensors ($200–500 OEM tier) are procurable in the lighthouse city's geography without import-license friction.
- A third-party lab exists in-region to certify each sentinel lot per C-9.
- The WHO publishes or licenses per-contaminant-class response templates that the C-14 template library can build on (without this, the library is built from public-health best practice).

## Open Questions

- **OQ-7: Real lighthouse city candidate committed within 30 days of v1 launch.** Founder must identify by criteria in `sales-motion.md`. Currently aspirational.
- **OQ-8: 1–2 real Anjalis co-design v1 in the lighthouse city.** Chicken-and-egg with city commitment (OQ-7); one depends on the other. Resolves once OQ-7 closes.
- **OQ-9: Specific PHA approval SLA per contaminant class** (acute minutes vs chronic hours). C-3 sets the framework; OQ-9 is the city-specific number negotiated with the chosen PHA before launch.
- **OQ-10: World Bank procurement track choice** (specific WB program/lens under the Water Global Practice). C-16 commits to WB; OQ-10 names the program.
- **OQ-11: Sentinel strip manufacturer and lab certification partner selection.** C-9 names the discipline; OQ-11 names the parties.
- **OQ-12: Anjali hybrid incentive sizing** — stipend amount, credential issuer, recognition cadence. Product is incentive-agnostic; v1 deployment picks the numbers.
