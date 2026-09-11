# Scenario 05 — Pia's data contract: Phase 1 emission contract for the Phase 2 PHA dashboard

**Phase:** 2 — UX Scenarios
**Archetype:** Pia the Public Health Authority (constraint persona; PHA director; **NO Phase 1 UI**; surfaces via the **Phase 2 PHA dashboard** — a separate WDS project)
**Deliverable:** This is **NOT** a UX scenario. There are **no screens, no user journeys, no wireframes**. The deliverable is a **data contract specification**: six data shapes Phase 1 must emit so the Phase 2 PHA dashboard can answer Pia's questions without retro-engineering the data later. Phase 1 owns emitting the data correctly. Phase 2 PHA dashboard is a separate WDS project and builds against this contract.
**Persona link:** [02-persona-pia-the-public-health-authority.md](../B-Trigger-Map/02-persona-pia-the-public-health-authority.md)
**Feature links:** #1 Pre-triage trust band with auto-routing · #3 Post-resolution sensor readback verification · #4 Structured per-decision reasoning capture · #6 Closure ack with ✅ / ❌ tap + reopen lineage · #8 Auto-generated monthly PHA report from audit trail · #10 Ward-level reporter reputation ledger · #11 Per-actor SLA compliance + override-reasoning dashboard · #23 Trust-band distribution chart with historical override rate per band · #38 Resolution-rate vs. citizen-✅-tap divergence chart · #39 Trust-band correct-rate exhibit · #40 Named-actor tooltip surfacing on every chart · #30 Reporter-cohort retention trend. ([feature-impact.md](../B-Trigger-Map/feature-impact.md))
**Deferred-positive force map (Pia's forces that this contract serves):** Negative forces deferred — **"Wrong incidents, real consequences" (15)**, **"Solved on paper, not in reality" (15)**, **"Accountability vanishes into the system" (14)**, **"Citizens stop reporting because no one came" (13)**, **"Money doesn't reach the problem" (13)**. Positive forces deferred — **"Trust band is correct, demonstrably" (15)**, **"Resolution is real, not paper" (15)**, **"Clear accountability, owned by named roles" (14)**, **"Citizens keep reporting because it works" (13)**, **"Spend is traceable to resolved incidents" (13)**. All ten forces are Pia's and all ten live in the deferred-positive table of [00-trigger-map.md](../B-Trigger-Map/00-trigger-map.md).

---

## Why this scenario exists

Pia is the Dhaka Public Health Authority (PHA) director — the named accountable authority for water-safety public health. She does not live in Surakkha the way Priya does. She does not have a Phase 1 UI: no inbox, no closed-loop queue, no per-incident detail page. But her forces are city-scale questions — "are the right incidents landing in the right buckets?", "did the closure match reality?", "did the money reach the problem?" — and those questions can only be answered by **aggregating Phase 1 data across all incidents, all operators, all admins, all wards, all months**.

This scenario is the **emission contract** that Phase 1 must satisfy so the Phase 2 PHA dashboard can answer Pia's questions without retro-engineering the data later. The contract has three structural properties:

1. **Chain anchoring for every aggregate.** Every number on the Phase 2 dashboard must trace back to underlying chain events. Pia drills from a monthly chart into the incident-level chain segment that produced the number. This satisfies Goal 2 (defensible) at per-incident scale and at city scale simultaneously.
2. **Named-actor attribution at every level.** Every metric is attributable to a named operator, named admin, named technician, named reporter (anchor flag visible). No anonymous role labels. This satisfies Goal 2 (defensible) at city scale — when Pia asks "which operator is missing SLA?", she gets a name, not a role.
3. **Reporter-badge dimension preserved as a SEPARATE axis from the trust-band tier.** Hotline-intake incidents (from Scenario 1's `+ New hotline report` button) are first-class data. The reporter-cohort retention metric distinguishes reporter kinds (anchor / hotline_operator / webform / sensor) because they have different reporting baselines — but reporter-kind is a SEPARATE dimension from trust-band. A hotline caller reports once and may never return; an anchor reporter reports weekly by design; the *trust-band* (verification state) is independent of the reporter-kind (source attribute). Hotline-sourced incidents default to T1 (unverified) because they have no verification signals; the hotline reporter-badge is the source, not the band colour.

Without this contract, the Phase 2 dashboard team has to either retro-engineer aggregates from raw chain events (expensive, error-prone, fragile to chain schema changes) or ask Phase 1 to add emission queries after the fact (rework, blast radius). The contract makes Phase 1's emissions Phase 2-ready on day one.

---

## The six data shapes

Two timing subsets. **Phase 1 ready (4 shapes)** — Phase 1 emits these correctly from day one. **Phase 2+ sensor expansion (2 shapes)** — Phase 1 emits partial data; the full shape needs sensor coverage, WB integration, or other Phase 2 infrastructure.

### Phase 1 ready (4 shapes)

#### Shape 1 — Trust band distribution (incidents per band per ward per period)

**(a) Pia's question.** *"For each ward, over the last month, how many incidents landed in T1 unverified / T2 verified / T3 issuance / Resolved trust band — and what was the override rate per band? Are the right incidents landing in the right buckets?"*

**(b) SQL/API surface.** Read-only view `v_trust_band_distribution` joining `IncidentCreated` (band field) with `TrustBandOverridden` events (reviewer, from_band, to_band, reason_category). Aggregation grain: `(ward, band, period)`. Bands are now `T1` (unverified, divider neutral) / `T2` (verified, amber) / `T3` (issuance, alert-red-reserved — only counts if a consumer-notice was issued; build-time lint-enforced, not used in operator UI) / `Resolved` (safe-green). Period is `month` (Phase 1 default) or `week` (drill-down). Returns counts of `IncidentCreated`, counts of overrides, and override-rate per cell. Override events are chain events with `from_band` and `to_band` fields; there is no T_overridden category.

**(c) Chain anchor.** Every cell in the view aggregates from the per-incident chain. Pia drills from `(ward, band, month)` → `IncidentCreated` rows for that cell → per-incident audit timeline. Each incident has a chain block hash; the drill returns the list of incident ids.

**(d) Named-actor attribution.** `TrustBandOverridden{reviewer: adi, ...}` names the admin who overrode the band. Per-band override rate per named reviewer is the attribute surface — Pia can ask "which admin overrode high → low most often?" and get a name. (Operator-side overrides do not exist in Phase 1; trust band is set by the system at `IncidentCreated` and only admins override.)

**(e) Timing marker.** **Phase 1 ready.** The trust band is computed at `IncidentCreated` and overrides happen at `Verified` / `TrustBandOverridden`. Both chain events are first-class Phase 1 emissions.

**Phase 1 scenario link:** [Scenario 01 — Priya](01-priya-the-pipeline-pilot-triage-verify-assign.md) emits `IncidentCreated{band, ward, source, reporter_kind}`; [Scenario 02 — Adi](02-adi-the-auditor-mark-resolved-handoff.md) emits `TrustBandOverridden{reviewer, from_band, to_band, reason_category}` (an override event, NOT a band).

---

#### Shape 2 — Resolution rate vs. citizen-✅ divergence

**(a) Pia's question.** *"For incidents closed by admin in the last month, what percentage were confirmed by the citizen's ✅ tap — and what percentage were closed without confirmation (silent, or via sensor-only)? If resolution rate and ✅ rate diverge, the closure was paper, not reality."*

**(b) SQL/API surface.** Read-only view `v_resolution_ack_divergence` joining `IncidentResolvedByAdmin` with `CitizenAckAccepted` (✅ tap), `CitizenAckRejected` (❌ tap), `CitizenAckWindowExpired` (silent), and `IncidentClosed{closer: priya}` events. Aggregation grain: `(ward, period)` plus per-`path_template` and per-`source` drill-downs. Returns: `resolved_count`, `ack_yes_count`, `ack_no_count`, `ack_silent_count`, `divergence_rate = (resolved_count - ack_yes_count) / resolved_count`.

**(c) Chain anchor.** Every cell aggregates from the per-incident chain. Pia drills from `(ward, month)` → list of `IncidentResolvedByAdmin` events → per-incident audit timeline (which shows the full `CitizenAckRequested` → ✅/❌/expired → `IncidentClosed` arc).

**(d) Named-actor attribution.** `IncidentResolvedByAdmin{reviewer: adi}` names the closer; `CitizenAckAccepted{anjali}` names the confirmer (or `CitizenAckRejected{anjali}` for the rejector; `CitizenAckWindowExpired` is system-recorded, no actor). Per-admin resolution-✅ correlation is the attribute surface — Pia can ask "which admin's resolutions have the highest ✅ confirmation rate?" and get a name.

**(e) Timing marker.** **Phase 1 ready.** All four chain events are first-class Phase 1 emissions. The divergence metric is computed by the view, not by the dashboard.

**Phase 1 scenario link:** Scenario 2 emits `IncidentResolvedByAdmin` (Adi) + `CitizenAckRequested` (system); Scenario 3 emits `CitizenAckAccepted` / `CitizenAckRejected` (Anjali) or `CitizenAckWindowExpired` (system); Scenario 1 emits `IncidentClosed{closer: priya}` (Priya).

---

#### Shape 3 — SLA compliance per named actor

**(a) Pia's question.** *"For each named operator, named admin, and named technician in the last month — what percentage of incidents met their SLA windows? Who is missing SLA, on which step, by how much? Is accountability clear, or does it vanish into the system?"*

**(b) SQL/API surface.** Read-only view `v_actor_sla_compliance` joining per-step SLA targets (operator ack = 10 min from `Assigned`; admin verify = 10 min from `Verified`; technician on-site = per `due_at`; citizen ack = 1h from `CitizenAckRequested`). Aggregation grain: `(actor_id, actor_role, step, period)`. Returns: `events_total`, `sla_met_count`, `sla_missed_count`, `sla_compliance_pct`, `median_time_to_completion`, `p90_time_to_completion`. Per-`reasoning_category` drill-down for missed-SLA cells.

**(c) Chain anchor.** Every cell aggregates from the per-incident chain. Pia drills from `(operator_id, period)` → list of `Assigned{operator, due_at}` events paired with the downstream `Acknowledged{by: operator}` events → per-incident audit timeline (which surfaces the full time-to-completion arc and the operator's `Verified{reasoning}` if a `DeferRequested` intervened).

**(d) Named-actor attribution.** This is the load-bearing surface for Goal 2's defensibility at city scale. Every metric carries the actor's name (not "operator" or "admin" — the actual operator id and display name). Pia sees: "Karim: 92% SLA met this month; 8% missed on T2-band assignments." When an operator or admin is missing SLA systematically, the view shows the trend; Pia can pull the underlying incidents and see the per-decision reasoning captured at the moment of decision.

**(e) Timing marker.** **Phase 1 ready.** Every SLA-relevant chain event is emitted by Scenarios 1, 2, 4. The view is computed, not authored.

**Phase 1 scenario link:** Scenario 1 emits `Assigned{operator, due_at}` and `Verified{inc, reasoning}`; Scenario 4 emits `Acknowledged{by: karim}` and `TechnicianArrived{by: karim}`; Scenario 2 emits `ProofAccepted{reviewer: adi}` and `TrustBandOverridden{reviewer: adi}`. All carry named actors and timestamps.

---

#### Shape 4 — Reporter cohort retention (anchor-vs-non-anchor, web-form-vs-hotline, repeat-vs-once)

**(a) Pia's question.** *"Per ward over the last 90 days — how many distinct reporters submitted? Of those, how many are still reporting at the 30-day / 60-day / 90-day mark? Are anchor reporters retained differently from citizen-tier reporters? Are hotline-sourced reporters retained differently from web-form reporters? Does the retention curve differ for anchor reporters at T1 baseline vs T2 verified? If retention drops, the social infrastructure that makes the sensor graph trustworthy is collapsing."*

**(b) SQL/API surface.** Read-only view `v_reporter_cohort_retention` joining `IncidentCreated{reporter, source, anchor, reporter_kind, trust_band}` events with the reporter's full submission history. Aggregation grain: `(ward, cohort_month, anchor_flag, source_category, trust_band)`. `source_category` is one of `web_form` / `hotline` / `sensor`; `reporter_kind` is `anchor` / `hotline_operator` / `webform` / `sensor` (a SEPARATE dimension from `trust_band`). Returns: `cohort_size`, `retained_at_30d`, `retained_at_60d`, `retained_at_90d`, `retention_pct`. The metric must distinguish: (a) anchor reporter at T1 baseline vs (b) anchor reporter at T2 verified — the retention curve is different at different trust bands. Per-`reporter` drill-down for cohort members.

**(c) Chain anchor.** Every cell aggregates from the per-incident chain. Pia drills from `(ward, cohort_month)` → list of reporters in that cohort → list of incidents per reporter → per-incident audit timeline. The drill-down answers "who reported, when, and what happened to each report."

**(d) Named-actor attribution.** `IncidentCreated{reporter: nid_hash, source: web_form | hotline, anchor: bool}` is the per-incident record. The cohort is built by `reporter` (NID hash, never plaintext). `anchor: true` flag is preserved through every aggregation step — anchor-flagged reporters' reports are visible to Pia as a distinct cohort, never merged with non-anchor cohorts. **The anchor system is not opaque to Pia.** She sees who is an anchor and how anchor cohorts retain, without seeing who specifically is the anchor by name (the NID hash protects identity; the `anchor: true` flag preserves the cohort distinction).

**(e) Timing marker.** **Phase 1 ready.** `IncidentCreated` carries `reporter`, `source`, `anchor`, `created_at` — every field needed for cohort construction. The view is computed by the gateway, not authored.

**Phase 1 scenario link:** Scenario 1 emits `IncidentCreated{reporter, source, band, reporter_kind, anchor}` from both the Anjali submit path (Scenario 3 → Scenario 1 entry) and the hotline-intake path (Scenario 1, Screen 3). Scenario 3's `LoginSucceeded{reporter, anchor}` is the source of the `anchor: bool` flag. The `IncidentCreated` chain event carries `reporter_kind` as a separate column from `trust_band`; aggregates can drill on either dimension independently.

---

## Reporter-badge as separate dimension (lockdown reconciliation 2026-09-11)

Phase 1 emits two parallel data dimensions on every incident:

- `trust_band` (verification state): T1 unverified / T2 verified / T3 issuance / resolved
- `reporter_kind` (source attribute): anchor / hotline_operator / webform / sensor

A reporter can be an anchor at any trust band. A hotline-sourced
incident always defaults to T1 because it has no verification
signals. The two dimensions must be preserved through every
aggregate in Shapes 1–6 so Pia can drill on either dimension
independently.

---

### Phase 2+ sensor expansion (2 shapes)

#### Shape 5 — Spend traceability (Karim's dispatch time, materials, lab tests — WB integration deferred)

**(a) Pia's question.** *"For each BDT of WB disbursement-linked spend in the last quarter — which resolved incident did it fund? Per ward, per month: incidents resolved / BDT spent. Is the money reaching the problem?"*

**(b) SQL/API surface.** Read-only view `v_spend_to_outcome` joining `IncidentClosed` events with the WB-side cost ledger (dispatch cost per `TechnicianDispatched`, materials per `FixSubmitted{parts}`, lab-test cost per `LabTestRequested` if escalated). Aggregation grain: `(ward, period)` plus per-`cost_category` drill-down. Returns: `incidents_resolved_count`, `total_bdt_spent`, `bdt_per_resolved_incident`. Per-`spend_category` (dispatch / materials / lab) breakdown.

**(c) Chain anchor.** Every cell aggregates from the per-incident chain + the WB cost ledger (external join). Pia drills from `(ward, period)` → list of `IncidentClosed` events → per-incident chain segment (which includes Karim's `FixSubmitted{parts}` and any escalation costs) → WB-side ledger entry that funded the work.

**(d) Named-actor attribution.** Per-incident cost attribution is by named actor: Karim's `TechnicianDispatched{by: karim}` carries dispatch cost; Karim's `FixSubmitted{parts}` carries materials cost; Adi's `EscalationTriggered{path_template: lab}` carries lab-test cost. The WB ledger entry is linked to the incident id, not to an anonymous cost pool.

**(e) Timing marker.** **Phase 2+ sensor expansion.** Phase 1 emits Karim's `parts` field in `FixSubmitted` and the dispatch / lab cost categories in escalation events. **The WB-side ledger join is Phase 2** — WB's procurement system is not integrated in Phase 1. Phase 1 ships the Surakkha-side cost fields; Phase 2 ships the WB join.

**Phase 1 scenario link:** Scenario 4 (Karim) emits `TechnicianDispatched` and `FixSubmitted{parts}`; Scenario 2 (Adi) emits `EscalationTriggered{path_template}` which carries lab / WASA-valve cost categories.

---

#### Shape 6 — (Full) trust band correctness (deferred until sensor coverage matches all wards; partial in Phase 1)

**(a) Pia's question.** *"Across all wards — does the trust band assignment match the actual outcome? For each incident, was the assigned band the right band, in retrospect, given the resolution path? If we trust the band, are we right to trust it?"*

**(b) SQL/API surface.** Read-only view `v_trust_band_correctness` joining `IncidentCreated{band}` with the resolution-path outcome (`IncidentClosed` reason, `CitizenAckRejected`, sensor readback outcome). Aggregation grain: `(band, period)` plus per-`ward` and per-`source` drill-downs. Returns: `incidents_per_band`, `correct_band_count`, `misrouted_count`, `correctness_pct`. The view is "correct" if the outcome path matches what the band predicted at creation time.

**(c) Chain anchor.** Every cell aggregates from the per-incident chain. Pia drills from `(band, period)` → list of misrouted incidents → per-incident audit timeline. The drill-down surfaces `IncidentCreated{band, reasoning_at_creation}` + the resolution path + the override history + the outcome.

**(d) Named-actor attribution.** Override data is per-named-admin (via `TrustBandOverridden{reviewer: adi}`). The "band correct" metric is computed at the cell level; per-admin override-rate-with-bad-outcome is the load-bearing attribution surface — Pia can see "admin X overrode high → low and the outcome was bad N times."

**(e) Timing marker.** **Phase 2+ sensor expansion — partial in Phase 1.** Phase 1 ships the view with **partial coverage**: correctness can only be computed for wards where sensor coverage is sufficient to back-test the band against sensor-confirmed outcomes. **Full coverage requires sensor density across all 25 wards** — a Phase 2 sensor expansion. Phase 1 ships the query and the chain-anchored data; the Phase 2 dashboard renders the full-coverage chart only when sensor coverage matches all wards. Until then, the dashboard renders a "partial coverage: N of 25 wards" badge on the chart.

**Phase 1 scenario link:** All four Phase 1 scenarios feed `IncidentClosed` and resolution-path events into the view. Adi's `TrustBandOverridden` (Scenario 2) provides the override data; Anjali's `CitizenAckRejected` (Scenario 3) provides the citizen-validated bad-outcome signal.

---

## Cross-cutting requirements

These requirements apply to **every** data shape above, every aggregation, every metric. They are the structural properties that make the contract Phase 2-ready without retro-engineering.

| # | Requirement | Why it matters | Phase 1 enforcement |
|---|---|---|---|
| **1** | **Chain anchoring for every aggregate.** Every number on the Phase 2 dashboard must trace back to underlying chain events. Pia drills from a monthly chart into the incident-level chain segment that produced the number. | Goal 2 (defensible) at per-incident AND city scale. Without drill-down, the chart is assertion; with drill-down, the chart is evidence. | Every read-only view in this contract returns an `incident_ids[]` array alongside the aggregated metric. The Phase 2 dashboard renders drill-down links to the per-incident chain segment. |
| **2** | **Named-actor attribution at every level.** Every metric attributable to a named operator, named admin, named technician, named reporter (anchor flag visible). No anonymous role labels. | Goal 2 (defensible) at city scale. "The system worked as designed" is not a defence; "Karim missed SLA 8 times in T2" is. | Every chain event that captures a human decision or action carries the actor's identity. Views never collapse to role-level aggregates when the underlying events carry names. |
| **3** | **Reporter-badge dimension preserved through all metrics — SEPARATE from trust-band tier.** `reporter_kind: anchor | hotline_operator | webform | sensor` is preserved through every aggregation as a SEPARATE column from `trust_band`. Hotline-intake incidents (from Scenario 1, Screen 3) appear as a distinct cohort and default to T1 (unverified) because they have no verification signals — but the hotline reporter-badge is the source, not the band colour. | Hotline-sourced reports have different reporting baselines than web-form reports (hotline caller reports once and may never return; web-form reporter returns on the timeline; anchor reporter reports weekly by design). Merging reporter-kind dimensions hides the retention signal; merging trust-band tiers hides the verification signal. Both dimensions must remain independently drillable. | `IncidentCreated{reporter_kind}` is one of `anchor` / `hotline_operator` / `webform` / `sensor`. `IncidentCreated{trust_band}` is one of `T1` (unverified) / `T2` (verified) / `T3` (issuance) / `resolved`. Every view accepts both a `reporter_kind` filter and a `trust_band` filter; no view defaults to "all sources" or "all bands" in the absence of a filter. |
| **4** | **Anchor-trust flag preserved through all reporter-cohort metrics.** `anchor: bool` is preserved through every aggregation. Anchor-flagged reporters' reports are visible to Pia as a distinct cohort. | The anchor system is not opaque to Pia. If anchor reporters retain at 95% and citizen-tier reporters at 40%, that is the load-bearing signal for the "citizens keep reporting" force — and Pia needs to see it to defend it. | `IncidentCreated{anchor: bool}` is preserved through every cohort construction. The reporter-cohort retention view (Shape 4) is the primary surface; trust-band distribution (Shape 1) and resolution-✅ divergence (Shape 2) accept `anchor` as an optional drill-down filter. |
| **5** | **Citizen-ack silence (`CitizenAckWindowExpired`) is data, not absence.** `CitizenAckWindowExpired` events feed into reporter cohort retention and resolution-rate-vs-divergence metrics. Pia sees the silence structurally. | "Citizens stop reporting because no one came" (Pia, FIA 13, negative) is detected via the silence pattern, not the absence of data. Silent-ack + non-return is the structural signature of the force. | `CitizenAckWindowExpired` is emitted by the system monitor on the 1h / 24h / 7d / 30d schedule (Scenario 3, Silent-ack path). The event is first-class; the cohort retention view counts silent reporters as a distinct retention bucket. |
| **6** | **Override-rate metric from Adi's surface feeds into trust band correctness check.** `TrustBandOverridden{reviewer: adi, from_band, to_band, reason_category}` is the override-rate numerator; the trust band correctness view (Shape 6) consumes it. | Adi's override rate trends toward expert-level is one of her load-bearing forces (FIA 11). The override-rate trend is also the load-bearing input to the trust band correctness exhibit — Pia needs to see overrides-where-outcome-was-bad as the anomaly marker. | Scenario 2 emits `TrustBandOverridden` at the moment of override; the view consumes it directly. |
| **7** | **Reporter-reputation ledger (internal, never surfaced to citizens) is observable to Pia.** The internal reputation ledger feeds cohort retention; Pia sees aggregate trends without seeing individual reporter scores. | Per feature #10, the ledger is internal-only for the citizen surface (no "score" or "tier" math on Anjali's account). But Pia needs aggregate trends to defend "citizens keep reporting" — internal does not mean opaque to the PHA. | The reporter-cohort retention view (Shape 4) aggregates the ledger into retention curves without exposing individual scores. |
| **8** | **Reopen lineage is preserved through every aggregate.** `IncidentReopened{parent}` incidents are NOT excluded from any aggregate — they are counted, attributed, and surfaced. | Reopens are the structural signal for "resolution that doesn't resolve" (Priya, FIA 13) and "the close that's not real" (Adi, FIA 13). Excluding them from aggregates hides the signal. | Every view treats a reopened incident as a continuation of the same parent incident; the parent `incident_id` is the join key. Reopen counts surface as a per-incident field on every aggregate. |

---

## Phase 2 dashboard build contract

This scenario is the contract that the **Phase 2 PHA dashboard team builds against**. Phase 2 is a **separate WDS project** with its own design lockdown, its own UX scenarios, its own trigger map. Phase 1 does not own the dashboard surface; Phase 1 owns **emitting the data correctly**.

**The boundary is sharp:**

| Phase 1 owns | Phase 2 owns |
|---|---|
| The six data shapes above (the read-only views). | The dashboard surface that consumes the views. |
| Chain events with named actors, timestamps, ward, source, anchor flag. | The chart layouts, drill-down UX, export formats, screenshot-ready exhibits. |
| The per-incident audit timeline (shared with Phase 1 surfaces). | The auto-generated monthly PHA report export format. |
| The reporter-reputation ledger (internal, observable to Pia via aggregates). | The per-ward / per-month KPI displays. |
| The override-rate + override-reasoning capture (Scenario 2). | The override-trend-toward-expert-level chart. |
| The post-resolution sensor readback (Scenario 4 field #5). | The "resolution verified by ≥1 source" badge. |
| The trust-band computation at `IncidentCreated`. | The trust-band distribution chart with historical override rate. |

**What Phase 1 explicitly does NOT ship:**

- WB-side ledger integration (Shape 5, full coverage). **Phase 2 only.**
- Sensor density expansion to all 25 wards (Shape 6, full coverage). **Phase 2 only.**
- The PHA dashboard UI itself. **Phase 2 only.**
- WB evidence export format. **Phase 2 only.**
- Dual-signature attestation for T3 boundary changes. **Phase 2 only.**
- Public-notice issuance rate. **Phase 2 only.**

**The contract this scenario delivers is the seam.** Phase 1's responsibility ends at emitting the data shapes correctly. Phase 2's responsibility begins at consuming them. **If the contract is satisfied, Phase 2's dashboard can answer Pia's ten deferred forces without retro-engineering.** If the contract is not satisfied, Phase 2 has to retro-fit — and retro-fitting a chain is structurally hostile work.

---

## Force coverage map — Pia's 12 forces

Pia has 12 forces (5 negative + 7 positive per `02-persona-pia-the-public-health-authority.md`; some are also captured in the deferred-positive table of `00-trigger-map.md`). The mapping below names every force and which of the six data shapes answers it.

| # | Force | FIA | Direction | Answered by data shape(s) | In-phase (via another persona) |
|---|---|---|---|---|---|
| 1 | **Wrong incidents, real consequences** — trust band misroutes flood the city or let bad water through | 15 | ❌ Negative | **Shape 1** (trust band distribution per ward / band / period) · **Shape 6** (trust band correctness, partial Phase 1) | — |
| 2 | **Solved on paper, not in reality** — chain shows clean execution; field reality unchanged | 15 | ❌ Negative | **Shape 2** (resolution rate vs. citizen-✅ divergence) · **Shape 6** (trust band correctness, where the band predicted a clean closure but the citizen-❌ or sensor readback said otherwise) | — |
| 3 | **Accountability vanishes into the system** — "the system worked as designed" — but no one is accountable | 14 | ❌ Negative | **Shape 3** (SLA compliance per named actor) | — |
| 4 | **Citizens stop reporting because no one came** — Anjali reports, gets acked, sees nothing happen, stops bothering | 13 | ❌ Negative | **Shape 4** (reporter cohort retention, with anchor-vs-non-anchor + web-vs-hotline distinction) · **Shape 2** (silent-ack signal captured structurally) | Anjali's "the report that disappears" (FIA 15, in-phase via Scenario 3) |
| 5 | **Money doesn't reach the problem** — spend cannot be traced to resolved incidents | 13 | ❌ Negative | **Shape 5** (spend traceability, Phase 2+ — WB integration deferred) | — |
| 6 | **Trust band is correct, demonstrably** — every incident in the right inbox bucket | 15 | ✅ Positive | **Shape 1** (distribution) · **Shape 6** (correctness exhibit) | — |
| 7 | **Resolution is real, not paper** — `IncidentClosed` corresponds to water actually safe again | 15 | ✅ Positive | **Shape 2** (resolution rate vs. citizen-✅ divergence) · cross-cutting requirement #5 (silent-ack is data) | — |
| 8 | **Clear accountability, owned by named roles** — chain names the actors | 14 | ✅ Positive | **Shape 3** (SLA compliance per named actor) · cross-cutting requirement #2 (named-actor attribution at every level) | — |
| 9 | **Citizens keep reporting because it works** — Anjali reports, gets acked, sees motion, gets a closure signal | 13 | ✅ Positive | **Shape 4** (cohort retention) · **Shape 2** (✅-rate as a leading indicator) | Anjali's "the ack lands" (FIA 15, in-phase via Scenario 3) |
| 10 | **Spend is traceable to resolved incidents** — every BDT of WB disbursement-linked spend is traceable to a chain-anchored outcome | 13 | ✅ Positive | **Shape 5** (spend traceability, Phase 2+ — WB integration deferred) | — |
| 11 | **Coverage that matches the threat** — sensor density across all wards | 8 (deferred-positive) | ✅ Positive | **Shape 6** (trust band correctness, full coverage — deferred until sensor coverage matches all wards) | — |
| 12 | **System scales because it earns trust** — lighthouse becomes the pattern | 7 (deferred-positive) | ✅ Positive | **Shape 4** (cohort retention growth as the leading indicator) | — |

**Note on forces 4 and 9.** "Citizens stop reporting" (FIA 13, negative) and "Citizens keep reporting" (FIA 13, positive) are deferred-positive from Pia's perspective (no Phase 1 UI), but the in-phase version of "stop reporting" already lives at FIA 15 via Anjali's "the report that disappears" force — Scenario 3 is the structural response. The contract delivers the cohort retention surface so Pia can see whether the structural response is working; she sees it as a leading indicator in the data, not as a surface she interacts with.

**Note on forces 5 and 10.** Both spend forces are deferred-positive because Phase 1 does not integrate the WB procurement ledger. Phase 1 ships Surakkha-side cost fields (`FixSubmitted{parts}`, `TechnicianDispatched`, `EscalationTriggered{path_template}`); the WB join is Phase 2.

---

## Design log

**Produced by Saga/Freya — 2026-09-10**

**Source links:**

- [Product brief](../A-Product-Brief/product-brief.md) — PHA as constraint persona; Phase 1 ships operator surfaces only; PHA pane deferred to Phase 2
- [Trigger map](../B-Trigger-Map/00-trigger-map.md) — deferred-positive forces table; Pia's 12-force profile
- [Pia persona](../B-Trigger-Map/02-persona-pia-the-public-health-authority.md) — force catalog, design implications, audience matrix
- [Business goals](../B-Trigger-Map/01-business-goals.md) — Goal 2 (defensible) as the city-scale obligation; Goal 2.1–2.3 chain anchoring requirements
- [Feature impact](../B-Trigger-Map/feature-impact.md) — features #1, #3, #4, #6, #8, #10, #11, #23, #30, #38, #39, #40 as the emission-side feature surface
- [Scenario 01 — Priya](01-priya-the-pipeline-pilot-triage-verify-assign.md) — emits `IncidentCreated{band, ward, source, reporter, anchor}` (web-form + hotline paths) and `Assigned{operator, due_at}` + `Verified{reasoning}`
- [Scenario 02 — Adi](02-adi-the-auditor-mark-resolved-handoff.md) — emits `TrustBandOverridden{reviewer}`, `ProofAccepted{reviewer}`, `CitizenAckRequested`, `IncidentResolvedByAdmin{reviewer}`, `EscalationTriggered{path_template}`, `ProofInsufficient{reviewer}`
- [Scenario 03 — Anjali](03-anjali-the-anchor-citizen-arc.md) — emits `IncidentCreated` (web-form path), `CitizenAckAccepted{anjali}`, `CitizenAckRejected{anjali}`, `CitizenAckWindowExpired`, `IncidentClosed{closer: priya, ack: yes | silent}`
- [Scenario 04 — Karim](04-karim-the-technician-field-lane.md) — emits `Acknowledged{by: karim}`, `TechnicianArrived{by: karim}`, `DiagnosisSubmitted`, `FixSubmitted{parts}`, `ProofSubmitted`

---

## Lockdown reconciliation (2026-09-11)

This scenario was re-read after the lockdown audit (00-lockdown-audit.md)
bound the design system. Edits applied:
- §"Why this scenario exists" property #3 (Hotline-vs-web-form distinction): reframed as the reporter-badge dimension PRESERVED AS A SEPARATE AXIS from the trust-band tier; explicitly states hotline incidents default to T1 (unverified), and the hotline reporter-badge is the source, not the band colour.
- Shape 1 (Trust band distribution): band set re-bound to lockdown values (T1 unverified divider / T2 verified amber / T3 issuance alert-red-reserved / Resolved safe-green); T3 only counts if a consumer-notice was issued; override events are chain events with `from_band` and `to_band` (not a band category).
- Shape 1 scenario link: `IncidentCreated` payload now lists `reporter_kind` as a separate field from `band`; `TrustBandOverridden` is annotated "(an override event, NOT a band)".
- Shape 4 (Reporter cohort retention): title kept; SQL surface now joins `IncidentCreated{reporter, source, anchor, reporter_kind, trust_band}` — aggregation grain expanded to `(ward, cohort_month, anchor_flag, source_category, trust_band)`; explicitly notes that (a) anchor reporter at T1 baseline vs (b) anchor reporter at T2 verified are distinct retention curves.
- Shape 4 scenario link: `IncidentCreated` chain event payload now names `reporter_kind` as a separate column from `trust_band` with independent drill-down.
- Cross-cutting requirement #3: rewritten to name both dimensions separately (`reporter_kind: anchor | hotline_operator | webform | sensor` AND `trust_band: T1 | T2 | T3 | resolved`); every view accepts both filters independently.
- New subsection added: "Reporter-badge as separate dimension (lockdown reconciliation 2026-09-11)" — defines the two parallel data dimensions and the rule that aggregates must preserve both.
- This scenario's structural shape did not change (six data shapes intact), but the schema and aggregation contracts re-bind so that `reporter_kind` and `trust_band` are independent drill axes.
- Trust band now = verification state only (T1/T2/T3/Resolved)
- Reporter-badge now = separate source attribute (anchor/hotline/webform/sensor)
- Hotline-sourced no longer T3; hotline = reporter-badge hotline + T1 default
- Anchor no longer T1; anchor = reporter-badge anchor attribute at any tier
- Reference: docs/D-UX-Design/01-design-system-foundation.md (lockdown-bound)
- Reference: docs/D-UX-Design/decisions/00-lockdown-audit.md
