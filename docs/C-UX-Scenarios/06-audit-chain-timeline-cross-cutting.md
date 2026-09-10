# Scenario 06 — Audit chain timeline: Cross-cutting surface for verification, audit, and citizen motion

**Phase:** 2 — UX Scenarios
**Archetype:** **Cross-cutting.** The audit chain is the shared surface that all four operator roles (Priya, Adi, Karim, Anjali) read from at different moments. Karim in operator mode; Priya in operator mode; Adi in operator mode; Anjali in public mode. Every scenario 1–5 emits to the chain; this scenario is the spine they all share.
**Instance count:** N/A — the chain is per-tenant (single tenant `dhaka` in Phase 1); one chain per deployment.
**Goal served:** **G2 (loop is defensible — direct, primary).** Goal 2.1 ("chain verifiable by independent hash recomputation") is realized at the per-incident scale by this scenario's single-click verification surface. Goal 2.3 ("100% of chain reads logged") is realized by this scenario's meta-audit. G1 and G3 are indirect — the chain is the system of record that makes the loop reproducible and the citizen motion traceable.
**Persona link:** [Priya](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) (dispute use case), [Adi](../B-Trigger-Map/05-persona-adi-the-auditor.md) (override audit use case + her own memory surface), [Karim](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) (read-only on his own chain segments; this scenario is the surface he returns to when reopened), [Anjali](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) (public-mode projection as her status timeline — Scenario 3 Screen 3 IS the public render of this surface). Pia ([02-persona-pia-the-public-health-authority.md](../B-Trigger-Map/02-persona-pia-the-public-health-authority.md)) is the constraint persona — no Phase 1 PHA surface, but her forces (FIA 14 "Clear accountability"; FIA 15 "Trust band correct, demonstrably") are answered by the per-actor attribution + the anomaly surfacing in this scenario.
**Feature link:** #4 — Structured per-decision reasoning capture ([feature-impact.md](../B-Trigger-Map/feature-impact.md)) is the input layer that makes the chain legible. #22 — Decision-capture structured field enforcement keeps the operator reasoning short. #23 — Trust-band distribution chart with historical override rate per band consumes the chain aggregates. #11 — Per-actor SLA compliance + override-reasoning dashboard consumes the same. #31 — Cross-tenant chain access log with read-attempt events is the per-tenant boundary that Goal 2.3 enforces.
**Force links:** Priya "Verdicts she can defend" (13), Adi "Chain supports her judgment" (12), Adi "System defends her, not the other way around" (13), Pia deferred-positive "Trust band correct, demonstrably" (15) — answered structurally here, Pia deferred-positive "Clear accountability, owned by named roles" (14) — answered structurally here, Phase 1 unbuilt-but-implicit "Chain captures too much" (Adi FIA 10) — addressed by the operator-vs-public render split (operator mode sees payloads + hashes; public mode sees motion only).

> **Thread-back (load-bearing for understanding this scenario).** This is the surface the other five scenarios write to and read from. Without it, the chain is invisible; with it, the chain is the proof surface for every claim made by every actor in the system.
>
> - [Scenario 01 — Priya's shift: Triage, verify, assign](01-priya-the-pipeline-pilot-triage-verify-assign.md) emits `IncidentCreated`, `Verified{inc, reasoning, signals_state, path}`, `Assigned{operator: karim, due_at, priority}`, `DeferRequested`, `EscalatedToPia` — all anchored to the chain. Each of Priya's verification decisions shows on this scenario's chain segment with her reasoning visible inline.
> - [Scenario 02 — Adi's shift: Mark resolved, hand back to Priya](02-adi-the-auditor-mark-resolved-handoff.md) emits `ProofAccepted`, `CitizenAckRequested`, `IncidentResolvedByAdmin`, `TrustBandOverridden{reviewer, from_band, to_band, reason_category}`, `ProofInsufficient`, `EscalationTriggered`. **The override audit use case (Use Case B below) is the structural reason this scenario exists.**
> - [Scenario 03 — Anjali's full citizen arc](03-anjali-the-anchor-citizen-arc.md) has a screen — `StatusTimeline` (Screen 3) — that **IS** this scenario's public-mode render of the chain for one incident, filtered to motion-only events. This scenario describes the operator-mode sibling and the two render modes as one surface; Scenario 3 ships the public-mode projection as Anjali's status timeline.
> - [Scenario 04 — Karim's shift: Acknowledge, diagnose, fix, submit proof](04-karim-the-technician-field-lane.md) emits `Acknowledged{by: karim}`, `TechnicianArrived`, `DiagnosisSubmitted`, `FixSubmitted`, `ProofSubmitted`. Karim's read-only view of his own chain segments (his assignments and their lineage) is the operator-mode surface for him.
> - [Scenario 05 — Pia's data contract: Phase 1 emission contract for the Phase 2 PHA dashboard](05-pia-data-contract-pha-deferred.md) consumes the chain aggregates that this scenario's data shapes produce. The PHA dashboard does not read raw chain events; it reads the per-shape read-only views that this scenario's chain emission contract defines.

---

## Header — locked decisions for this scenario

> **Confirmed by user before scenario writeup. Locking these so Freya reconciles against them, not against an interpretation:**
>
> 1. **Two render modes, one source of truth.** The chain is the same data; the mode is a **render-layer choice**, not a data access choice. **Operator mode** (Priya / Adi / Karim) — full payload view, JSON expandable, hash anchor visible, single-click independent verification. **Public mode** (Anjali / citizen-facing) — motion-only projection, plain-language, no JSON, no hashes, no payload. Same chain, two render layers.
> 2. **Two screens in the audit surface.** **Screen 1 — `AuditLogPage`** (cross-incident view) — chronological list of every chain event across all incidents the actor is authorized to view. Filters: by actor, by incident id, by event type, by date range. **Screen 2 — Per-incident chain segment** — the full chain segment for a specific incident, ordered by `seq` (chain sequence number).
> 3. **Single-click hash anchor + independent verification.** Goal 2.1 ("chain verifiable by independent hash recomputation") is exposed as **one click** in operator mode: trigger local hash recomputation, show pass/fail badge. No two-click confirm. The verification is operator-authorized by the act of clicking.
> 4. **Three documented use cases.** **Use Case A** — Priya — incident dispute (Anjali disputes "I never reported that"). **Use Case B** — Adi — override audit (Pia asks why T3 was overridden to T1). **Use Case C** — Anjali — simplified public view (her status timeline is a projection of the chain filtered to motion-only events).
> 5. **100% of chain reads logged.** Goal 2.3 ("100% of chain reads logged") is enforced by this scenario. Each view of the chain viewer emits a `ChainRead` event on the chain itself — meta-audit. Anjali viewing her own timeline, Priya pulling a segment for dispute, Pia's quarterly review — every read is a chain event.
> 6. **Authorization per role.** Each operator sees only the chain segments they are authorized for. Per-incident drill-down is allowed across roles when the operator has a queue interest. Anjali sees only her own incidents' segments in public mode.
> 7. **Chain anomaly surfacing.** If a recomputed hash doesn't match the stored hash, the event row shows ⚠️ and the chain viewer surfaces a top-banner warning ("Chain anomaly detected on incident `inc_01HX...` — escalate to Pia"). Phase 1 surfaces to operators; Phase 2 surfaces to Pia's dashboard.
> 8. **Filter chips are operator-friendly.** Four filter chips on `AuditLogPage`: Actor / Incident / Event type / Date range. Filters compose. Each filter combination emits a `ChainRead{filter_combo}` event for the meta-audit.

---

## Entry point & emotional state

**Entry screen:** Varies by role; documented per use case below. The shared surface is `AuditLogPage` (cross-incident) → per-incident chain segment (drill-down). Karim's read-only view, Anjali's public-mode status timeline, and the operator-mode chain viewer share the same data layer.

**Trigger (varies by role):**

- **Priya** — A reporter disputes a previous verdict three months later (Use Case A). She pulls the per-incident chain segment to defend the call.
- **Adi** — Karim's proof is weak and she needs the original Anjali report + Priya's verification reasoning to make her call; OR Pia reviews a decision three months later and the chain segment is the proof (Use Case B); OR she overrides the trust band and wants the override reasoning captured in context.
- **Karim** — A reopened incident lands with a `ProofInsufficient` (Adi's structured feedback). He re-opens the per-incident segment to see the chain lineage and the verbatim reopen reasoning.
- **Anjali** — She opens My Reports → Status Timeline. The timeline is the public-mode render of the chain for one incident (Use Case C).

**Internal state (varies by role):**

- **Priya** — municipally working, defensive calm. She is not defensive about her call; she is *ready to defend her call* if it is questioned. The chain is her evidence ledger.
- **Adi** — patiently working, evidence-led calm. When Pia asks about a decision, she does not need to remember the decision; she pulls the chain. The chain is her memory, not her judge.
- **Karim** — action-oriented, evidence-led. He reads the chain segment to see Adi's verbatim reopen feedback (the `ProofInsufficient{reviewer: adi, missing, needed_by}` event) and the original chain lineage. He does not act on the segment; he acts on the work the segment describes.
- **Anjali** — curious attentiveness (Scenario 3's "curious arrival" state). She reads the timeline to see what happened to her report. She does not see JSON, hashes, or payloads.

**What all four actors do NOT see:**

- Other reporters' data (Anjali's authorization boundary — public mode hides every other `IncidentCreated` chain event not anchored to her account).
- Operator-internal reasoning captures that are not relevant to their surface (e.g., Anjali does not see `Verified{reasoning}` or `ProofAccepted{reasoning}` — those are operator-internal).
- The audit log of other tenants (cross-tenant reads are logged as `CrossTenantAccessAttempted` — feature #31 — never returned to the actor).

---

## The shared chain surface

The audit chain is one surface with two screens, two render modes, and one set of underlying chain events. The screens are the load-bearing surface that makes Goal 2 real at per-incident scale; the render modes are the load-bearing surface that makes the chain usable by every role without leaking payloads to unauthorized actors.

### Screen 1 — `AuditLogPage` (cross-incident view)

**What every operator sees (operator mode):**

A chronological list of every chain event across all incidents the actor is authorized to view, newest at the top. Each row carries:

| Column | Content |
|---|---|
| **Timestamp** | ISO-8601 with relative time on hover ("3 days ago"). |
| **Event type** | One of the 33 closed-enum Phase 1 chain event types referenced in `01-business-goals.md` and the per-scenario chain emissions (e.g., `IncidentCreated`, `Verified`, `Assigned`, `TechnicianArrived`, `FixSubmitted`, `ProofAccepted`, `TrustBandOverridden`, `CitizenAckRequested`, `CitizenAckAccepted`, `IncidentClosed`). Icon + colour from the trust-band palette (T1/T2/T3). |
| **Actor** | Actor name + role (e.g., "Priya (operator)", "Karim (technician)", "Adi (admin)", "Anjali (reporter)", "Sensor S-04"). |
| **Incident id** | Linked; tapping opens the per-incident chain segment (Screen 2). |
| **One-line summary** | Auto-generated from the event payload — e.g., "Karim submitted proof bundle (5 fields) for `inc_01HX...`." |

**Filters (locked decision #8):** Four filter chips at the top of the page:

| Filter chip | Options |
|---|---|
| **Actor** | Dropdown with: Operator, Admin, Technician, Reporter (anchor / non-anchor), Sensor, System. Selects one named actor or one role-class. |
| **Incident** | Free-text field for incident id or partial id; autocomplete from the actor's authorized incident set. |
| **Event type** | Dropdown with the 33 closed-enum Phase 1 chain event types. |
| **Date range** | Date-range picker (defaults to last 7 days; max 90 days in Phase 1). |

Filters compose. The combined filter is captured on the meta-audit chain event — `ChainRead{actor, filter_combo}` (locked decision #5 + #8).

**Public mode (Anjali):** Anjali does not see the `AuditLogPage` at all. Her only view of the chain is the per-incident `StatusTimeline` (Screen 2 in public mode). This is the structural difference between the two modes: **public mode is per-incident only**, never cross-incident. Anjali never sees another reporter's `IncidentCreated` event, never sees the operator queue's chain writes, never sees the filter chips.

**TopChrome (48 px, persona-adapted):** brand + chain-status pulse-dot on the left; persona chip + locale-globe + theme toggle on the right. Same shared TopChrome as Priya's, Adi's, and Karim's surfaces per `visual-direction.md`.

**Sidebar (persona-aware per `visual-direction.md`):** varies by role. Priya's sidebar includes the audit log as a navigation item alongside her inbox; Adi's includes it alongside her closed-loop queue; Karim's includes it as a read-only "chain history" link from his `FieldIncidentDetailPage`.

**What fires automatically when the page loads:**

- The full list renders from the actor's authorized chain-event window.
- A `ChainRead{actor: <id>, filter_combo: <filter_set>}` event lands on the chain. This is the meta-audit (locked decision #5; Goal 2.3 enforcement).
- The chain-status pulse-dot in TopChrome shows a green pulse if the chain-integrity monitor's last tick passed; an amber pulse if a recent anomaly was detected; a red pulse if an anomaly is currently unacknowledged.

**What the actor does:**

- Skims the chronological list. The most recent events are at the top.
- Taps a row's incident id to drill into the per-incident chain segment (Screen 2).
- Uses the filter chips to narrow the list — e.g., "show me all events by Karim in ward 12 last week" emits `ChainRead{actor: <id>, filter_combo: {actor: karim, ward: 12, date_range: last_7d}}`.

**Decision point:** Whether to drill into an incident or stay on the cross-incident view. The cross-incident view is for triage (e.g., "what has Karim been up to today?"); the per-incident view is for verification (Use Cases A and B).

### Screen 2 — Per-incident chain segment

**What every operator sees (operator mode):**

The full chain segment for a specific incident, ordered by `seq` (chain sequence number). Each event row shows:

| Column | Content |
|---|---|
| **Timestamp** | ISO-8601 with relative time on hover. |
| **Event type** | Icon + colour from the trust-band palette. |
| **Actor** | Actor name + role. |
| **Event payload** | Collapsed by default; expanded on click. JSON view in operator mode (`{...}` syntax-highlighted, copy-to-clipboard for the full payload). |
| **Chain hash anchor** | Mono font, copy-to-clipboard. Verified ✅ (recomputed hash matches stored hash) or anomaly ⚠️ (recomputed hash doesn't match stored hash — see Anomaly surfacing sub-section below). |
| **Single-click "Independent verification" button** | Triggers local hash recomputation against the per-tenant chain. Pass/fail badge result. |

**Public mode (Anjali's Status Timeline):** Per Scenario 3's locked decisions, Anjali sees only the motion-only chain events for her own incidents:

| Visible | Hidden |
|---|---|
| `IncidentCreated` | `Verified`, `Assigned`, `DeferRequested`, `EscalatedToPia`, `HotlineIntakeReceived` (all operator-internal) |
| `VerificationSubmitted` (Bangla: "যাচাই করা হচ্ছে / Being verified") | `ProofInsufficient` (Adi-internal) |
| `AssignedToTechnician` | `TrustBandOverridden` (Adi-internal) |
| `TechnicianArrived` | `EscalationTriggered` (Adi-internal) |
| `DiagnosisSubmitted` | All `LoginSucceeded`, all chain-integrity events |
| `FixSubmitted` | All `ChainRead` events (this scenario's meta-audit — never visible to Anjali) |
| `ProofAccepted` | All payloads, all hash anchors, all `Independent verification` buttons |
| `IncidentResolvedByAdmin` | — |
| `CitizenAckRequested` (as closure notification) | — |
| `CitizenAckAccepted` / `CitizenAckRejected` | — |
| `IncidentClosed` | — |
| `IncidentReopened{parent}` (visible as a branch, connected to original arc) | — |

**In public mode, there is no JSON, no hashes, no payload.** Each row shows: timestamp (Bangla numerals per `content-language.md`), one-line Bangla description, actor chip (operator's display name + role, copy-to-clipboard for the chain ref). The chain anchor chip is forensic (mono font, copy-to-clipboard) but no hash recomputation button is offered — Anjali does not need to verify hashes; the system verifies for her.

**Top of page (operator mode):** A small horizontal summary — incident id (mono, copy-to-clipboard), ward + address, current state pill (`OPEN` / `RESOLVED` / `CLOSED` / `REOPENED`), and the count of events in the segment. Tapping the chain-status pulse-dot opens a small "Chain integrity" sheet showing the last integrity-monitor tick result, the last anomaly timestamp (if any), and the per-tenant head block hash.

**What fires automatically when the page loads:**

- The full chain segment renders, ordered by `seq`. The chain reads from the actor's authorized chain-event window — Priya sees segments for incidents in her inbox or her ward(s); Adi sees segments for incidents in her queue or via drill-down; Karim sees segments for incidents he has been assigned; Anjali sees only her own segments.
- A `ChainRead{actor: <id>, inc: <id>}` event lands on the chain (meta-audit — locked decision #5).
- The hash anchor on each row is recomputed in the background; the ✅ / ⚠️ badge is current at render time.

**What the actor does:**

- **Operator mode:** Reads top-down. Taps an event row to expand the payload. Taps the "Independent verification" button on any row to trigger full-segment hash recomputation (see Single-click independent verification sub-section below). Taps an actor chip to see the actor's per-actor history.
- **Public mode (Anjali):** Reads top-down. Taps a row to see a one-line detail. Taps the chain ref chip to see the per-row block hash (read-only, no recomputation offered). Closes the timeline and goes back to her day.

---

## Use Case A — Priya — Incident Dispute (Anjali disputes "I never reported that")

**Entry point:** Priya's `OperatorDashboard` (Scenario 1) → sidebar → audit log → drill into incident id.

**Trigger (in scenario):** Three months after `IncidentClosed`, Anjali files a complaint: *"I never reported that — your records are wrong."* Priya needs to defend the original report's existence and her verification reasoning.

**What Priya does (operator mode):**

1. Opens the audit log, filters by incident id (`inc_01HX...`), sees the full chain segment.
2. Reads top-down. The first row is `IncidentCreated{source: web_form, reporter: nid_hash, anchor: true, band: T1, created_at}` — this is the original report's existence on the chain. The hash anchor is verified ✅.
3. The second row is her own `Verified{inc, reasoning: "Two corroborating signals + reporter confirms. Assigning Karim at standard priority.", signals_state: {present: [sensor, photo_exif, reporter_call, cluster], missing: []}, path: A}`. **This is the line that defends her.** The reasoning is captured inline at the moment of decision, not retrofitted.
4. She scrolls through the rest of the segment: `Assigned`, `TechnicianArrived`, `DiagnosisSubmitted`, `FixSubmitted`, `ProofAccepted`, `IncidentResolvedByAdmin`, `CitizenAckAccepted`, `IncidentClosed`.
5. Taps the "Independent verification" button on any row → full-segment hash recomputation runs locally → pass/fail badge appears within ~3 seconds.
6. Taps the `IncidentCreated` row to expand the payload — sees `nid_hash` (Anjali's NID, hashed; never plaintext), `photo_exif` (verbatim from the original report), `created_at` timestamp.

**End state — 30 seconds:** Priya points Anjali at the chain segment. The dispute is resolved by showing: (a) the `IncidentCreated` event with the original `nid_hash` and `photo_exif`, (b) Anjali's own `CitizenAckAccepted` from the closure, (c) the pass badge on every row. **Anjali's complaint is structurally addressed by the chain — Priya did not have to remember anything; the chain remembered for her.**

**What fires automatically during the use case:**

- Multiple `ChainRead{actor: priya, inc: <id>}` events land on the chain — one for each segment view, one for each filter combo, one for the audit log page view.
- Anjali's complaint itself becomes a `CitizenDisputeAcknowledged{anjali, inc, dispute_text, acknowledged_at}` chain event (recorded for the audit trail — Anjali's voice in the system, separate from her original report and her closure ack).

**Timestamp floor:** The full use case takes Priya ≤30 seconds. Open audit log → filter → read segment → independent verification → share the segment with Anjali.

**Force addressed:** Priya's "Verdicts she can defend" (FIA 13). The reasoning capture at the moment of decision IS the defence. Three months later, the chain surfaces her reasoning in context automatically.

---

## Use Case B — Adi — Override Audit (Pia asks why T3 was overridden to T1)

**Entry point:** Adi's `FieldQueuePage` (Scenario 2) → row opens `FieldIncidentDetailPage` → top of left column carries a "View chain segment" link to Screen 2. (Or: from her queue's "overrides" bucket, drill into the override event.)

**Trigger (in scenario):** Pia, in her monthly review, asks: *"Why did you override T3 to T1 on `inc_01HX...` last week? The chain shows the override; show me your reasoning."* Adi needs to surface her override reasoning in context — sensor showed, Karim submitted, Anjali tapped.

**What Adi does (operator mode):**

1. Opens the per-incident chain segment for `inc_01HX...` (operator mode).
2. Locates the `TrustBandOverridden{reviewer: adi, from_band: T3, to_band: T1, reason_category: prior_incident_pattern, free_text: "Two similar reports in ward 14 in the past 30 days, both resolved T1. The third match in the cluster is the trigger; not overriding would have missed the pattern."}` event.
3. Reads top-down: `IncidentCreated{band: T3}` → `Verified{reasoning: ...}` → `TrustBandOverridden{reviewer: adi, from: T3, to: T1, reasoning: ...}` → `Assigned{operator: karim, priority_override: high}` → ... → `ProofAccepted` → `CitizenAckAccepted` → `IncidentClosed`.
4. Sees that her override reasoning cites the prior-incident pattern. Prakash's question is answered by the chain — she didn't have to remember the reasoning; the chain captured it.
5. Taps the "Independent verification" button → full-segment hash recomputation runs locally → pass badge appears within ~3 seconds. The chain is intact.
6. Shares the segment with Pia via the per-incident chain export (URL with HMAC + per-tenant boundary; out of scope for UI design here but flagged for Phase 4).

**End state — 60 seconds:** Adi points Pia at the chain segment. The override is defensible because: (a) her reasoning was structured (per feature #22 + feature #29), (b) the reasoning cites a pattern from the prior 30 days, (c) the incident was resolved with `IncidentClosed` and `CitizenAckAccepted` (the citizen confirmed the resolution), (d) every row in the segment passes independent verification. **Pia sees: "Adi overrode T3 → T1 because of a two-incident pattern; the override was right."** Goal 2 is satisfied at per-incident scale.

**What fires automatically during the use case:**

- Pia's view of the segment (if she's in Phase 2 with the PHA dashboard) emits a `ChainRead{actor: pia, inc: <id>}` event. In Phase 1, this is logged at the audit-export mechanism, not the live view.
- Adi's multiple chain reads (audit log, segment view, filter combos) emit `ChainRead` events with her actor id and the filter combo.

**Timestamp floor:** The full use case takes Adi ≤60 seconds. Open segment → locate override → read reasoning in context → independent verification → share with Pia.

**Force addressed:** Adi's "System defends her, not the other way around" (FIA 13) + Adi's "Chain supports her judgment" (FIA 12). The chain is her memory, not her judge; the close defends itself when Pia reviews three months later.

---

## Use Case C — Anjali — Simplified Public View (her status timeline is a render of the chain)

**Entry point:** Anjali's `MyReports` (Scenario 3) → taps a row → lands on `StatusTimeline` (Scenario 3, Screen 3) for that incident.

**Trigger (in scenario):** Anjali submits a report at 7:30 AM. By 10 AM she wants to know: "Did anyone come?" She opens her phone, taps the portal, taps My Reports, taps the row.

**What Anjali sees (public mode):**

A vertical list of motion-only chain events for her incident, newest at the top:

| Timestamp (Bangla) | Bangla description | English gloss | Actor chip |
|---|---|---|---|
| আজ সকাল ১০:১৫ | প্রশাসনিকভাবে সমাধান হয়েছে | Resolved by admin | পর্যালোচক: অদি / Reviewer: Adi |
| আজ সকাল ৯:৪৫ | মেরামত যাচাই করা হয়েছে | Repair verified | পর্যালোচক: অদি / Reviewer: Adi |
| আজ সকাল ৯:৩০ | মেরামত করা হয়েছে | Repair completed | মাঠ কর্মী: করিম / Field worker: Karim |
| আজ সকাল ৮:৫০ | সমস্যা নির্ণয় করা হয়েছে | Problem diagnosed | মাঠ কর্মী: করিম / Field worker: Karim |
| আজ সকাল ৮:৩০ | মাঠ কর্মী পৌঁছেছে | Field worker arrived | মাঠ কর্মী: করিম / Field worker: Karim |
| আজ সকাল ৮:১৫ | মাঠ কর্মী পাঠানো হচ্ছে | Field worker dispatched | পরিচালক: প্রিয়া / Operator: Priya |
| আজ সকাল ৭:৪৫ | যাচাই করা হচ্ছে | Being verified | পরিচালক: প্রিয়া / Operator: Priya |
| আজ সকাল ৭:৩৫ | রিপোর্ট গ্রহণ করা হয়েছে | Report received | (no actor — system) |

**What she sees (deliberately hidden):** All payloads, all hash anchors, all "Independent verification" buttons, all `Verified`/`Assigned`/`ProofAccepted`/`TrustBandOverridden` operator-internal reasoning, all `ChainRead` events from this scenario's meta-audit (Anjali never sees that operators are reading her chain — that's operator-side telemetry, not citizen-facing signal).

**What fires automatically during the use case:**

- Anjali's view of the timeline emits `ChainRead{actor: anjali, inc: <id>, mode: public}` on the chain. This is the meta-audit (locked decision #5): even Anjali's public-mode view of her own timeline is logged.
- The timeline is a **projection** of the chain filtered to motion-only events — the chain is the source of truth; the timeline is the render layer.

**Decision point:** None. The timeline is informational, not a workflow. She reads it, she closes her phone, she goes back to her day.

**End state:** Anjali's question — "did anyone come?" — is answered. She sees Karim arrived at 8:30 AM and Adi verified at 9:45 AM. **She doesn't need to verify hashes.** The chain verifies itself for her via the system's tamper-evident architecture. If she wanted to verify, the actor chip + chain ref chip are copy-to-clipboard — she could hand the chain ref to someone with operator-mode access (Pia, a WB auditor) and they could verify on her behalf. She doesn't need to do this herself.

**Force addressed:** Anjali's "The motion is visible" (FIA 15) — realized structurally by the chain itself being the data layer. The status timeline IS the chain, in a form she can read.

---

## Single-click independent verification

The verification surface is the load-bearing mechanism that makes Goal 2.1 ("chain verifiable by independent hash recomputation") real at per-incident scale. It is operator-mode-only; Anjali does not need to verify hashes.

### What the operator clicks

The "Independent verification" button on any row in `Screen 2` (per-incident chain segment). Clicking triggers the local hash recomputation against the per-tenant chain.

### What the system does (sequence)

1. **Operator click.** Operator taps the button. The button's text changes to "Verifying…" and a spinner shows.
2. **Local hash recomputation.** The gateway (or a local client-side verifier, if Phase 4 ships one) walks the chain segment from the tenant head backwards, recomputing each row's `block_hash` from `(prev_block_hash + seq + actor + event_type + payload + timestamp)`. The recomputation is independent of the gateway's stored chain — it uses the same SHA-256 algorithm but the inputs come from the chain's published segment, not from the gateway's cache.
3. **Pass/fail badge.** Within ~3 seconds for a typical 30-event segment, every row's hash anchor chip updates:
   - **✅ Verified** — recomputed hash matches stored hash.
   - **⚠️ Anomaly** — recomputed hash doesn't match stored hash. The row's background shifts to a warning tint; a top-banner warning appears (see Anomaly surfacing sub-section below).
4. **No two-click confirm.** The verification is operator-authorized by the act of clicking. The operator does not need to type "VERIFY" or confirm anything. The button click is the authorization.
5. **Chain event emitted.** `VerificationRequested{actor: <operator_id>, inc: <id>, scope: segment | single_row, requested_at}` lands on the chain. This is the operator's audit signal that they ran a verification — separate from the meta-audit `ChainRead` event.

### What pass looks like

Every row's hash anchor chip turns green ✅. A small toast appears: "Chain integrity verified for `inc_01HX...` (N rows)." The toast is informational; the per-row badges are the durable signal.

### What fail looks like

⚠️ One or more rows have a mismatch. The specific row(s) are highlighted; a top-banner warning appears: **"Chain anomaly detected on `inc_01HX...` — escalate to Pia."** The `ChainAnomalyDetected{inc, row_seq, expected_hash, actual_hash, actor_requested}` event lands on the chain. In Phase 1 the banner surfaces to the operator who clicked; in Phase 2 the same `ChainAnomalyDetected` event feeds into Pia's dashboard's chain-integrity view.

### What this is NOT

This is **not** a cryptographic proof in the formal sense (it's a recomputation, not a zero-knowledge proof). It is the operator-mode surface that satisfies Goal 2.1's "independently verifiable without the gateway code" requirement — the same SHA-256 algorithm applied to the same inputs produces the same hash. **An auditor with no Surakkha installed can verify the chain** by reading the per-incident segment and recomputing — that's the C-16 binding (no proprietary lock-in) and Goal 2.1's intent. The single-click surface is the operator-friendly shortcut; the underlying mechanism is fully reproducible by any third party.

---

## Authorization model

Per locked decision #6, each operator sees only the chain segments they are authorized for. The authorization is enforced at the read path; every unauthorized read attempt is logged as `CrossTenantAccessAttempted` (feature #31) or `UnauthorizedSegmentAccessAttempted`.

| Role | Authorized segments | Read mode | What they can do |
|---|---|---|---|
| **Priya** | Segments for incidents in her inbox (verified or assigned by her) plus all segments in her ward(s) for handover context. | Operator | View, filter, drill-down, single-click verification, export (Phase 4). |
| **Adi** | Segments for all incidents in her queue (overrides / proofs / escalations / formerly-citizen-ack) plus per-incident drill-down from any operator surface. | Operator | Same as Priya, plus she can see her own `TrustBandOverridden` reasoning in context across incidents. |
| **Karim** | Segments for incidents he has been assigned (read-only on his own chain emission). | Operator (read-only) | View, filter, drill-down, single-click verification. He cannot edit or re-write any event; the chain is append-only. |
| **Anjali** | Only her own incidents' segments in public mode. **No other reporter's data, ever.** | Public | View (motion-only projection). No filter chips (per-incident only). No JSON, no hashes, no payloads. |
| **Pia (Phase 2 dashboard)** | Aggregated metrics + drill-to-incident on demand. | Operator (read-only, aggregated) | View aggregates + drill-down to per-incident chain segments for any incident. Phase 2 only. |

### Why Anjali cannot see other reporters' data

The public-mode surface for Anjali is **per-incident only**, never cross-incident. There is no `AuditLogPage` in public mode — only the `StatusTimeline` for one specific incident at a time. This is the structural answer to: (a) citizen privacy (FR-4 binding — Anjali never sees another reporter's `nid_hash` or `photo_exif`); (b) citizen-side scope minimization (Anjali doesn't need cross-incident information to make her own decisions); (c) Goal 2.3's policy-controlled access (the cross-tenant boundary is one axis; the cross-citizen boundary is the other). **Public mode hides every other `IncidentCreated` chain event not anchored to her account, by construction — the surface doesn't expose cross-incident views to her.**

---

## Meta-audit chain reads

Per locked decision #5 + Goal 2.3 ("100% of chain reads logged"), every view of the chain viewer emits a `ChainRead` event on the chain itself. This is the meta-audit — the audit of the audit.

### What is logged

| Read action | Chain event emitted |
|---|---|
| Operator opens `AuditLogPage` | `ChainRead{actor: <id>, surface: audit_log, filter_combo: <filter_set>}` |
| Operator opens per-incident segment | `ChainRead{actor: <id>, surface: incident_segment, inc: <id>}` |
| Operator opens audit log with filter combo (e.g., "show me all events by Karim in ward 12 last week") | `ChainRead{actor: <id>, surface: audit_log, filter_combo: {actor: karim, ward: 12, date_range: last_7d}}` |
| Operator triggers single-click verification | `VerificationRequested{actor: <id>, inc: <id>, scope: segment \| single_row}` (separate from `ChainRead`) |
| Anjali opens her status timeline | `ChainRead{actor: anjali_nid_hash, surface: status_timeline, inc: <id>, mode: public}` |
| Cross-tenant read attempt | `CrossTenantAccessAttempted{actor: <id>, tenant_from: <tenant>, tenant_to: <tenant>}` (feature #31) |
| Unauthorized segment access attempt | `UnauthorizedSegmentAccessAttempted{actor: <id>, inc: <id>, authorization_basis: <role>}` |

### What the meta-audit enables

- **Pia (Phase 2)** can see who read which segments, when, and for what purpose. She reads "Karim's `ProofInsufficient` reopen was re-read by Karim 4 times in the week after dispatch — the audit pattern suggests he was re-anchoring his understanding before re-dispatching."
- **Pia (Phase 2)** can see whether Anjali is reading her own timeline frequently (signal that the system is being used; anti-fingerprint for "citizens stop reporting") or not at all (signal that the timeline is broken or the citizen has dropped off).
- **Auditors (WB review)** can see the full read trail — every segment view, every filter combo, every verification request. Goal 2.3 is fully satisfied.

### Why `ChainRead` is itself a chain event

The principle is: **the audit log is part of the audit trail**. If `ChainRead` events were stored in a separate table or a separate system, that system would itself need auditing. By emitting `ChainRead` to the same per-tenant chain, the audit trail is self-contained — every read is in the same tamper-evident ledger as every write. The 60-second chain-integrity monitor tick (per product brief) verifies all `ChainRead` events as part of the same chain integrity check.

### Goal 2.3 enforcement

Phase 1 must emit `ChainRead` for 100% of chain reads. This is enforced by routing every chain read through a single gateway function (`read_chain_segment` or `read_audit_log`) that emits the `ChainRead` event before returning the data. **There is no path to read the chain that bypasses the meta-audit emission.** Phase 1 demo bar: 100% of chain reads logged.

---

## Anomaly surfacing

Per locked decision #7, if a recomputed hash doesn't match the stored hash, the event row shows ⚠️ and the chain viewer surfaces a top-banner warning. This is the system's tamper-evidence warning.

### What it looks like in operator mode

| Element | Behaviour on anomaly |
|---|---|
| **Affected row** | Background shifts to a warning tint (amber per `visual-direction.md` anomaly colour). The hash anchor chip turns ⚠️ Anomaly with a tap-to-expand showing expected_hash vs actual_hash. |
| **Other rows** | Pass badge ✅ unchanged. An anomaly on one row doesn't invalidate other rows; only the tampered row fails. |
| **Top banner** | Persistent amber banner at the top of the per-incident segment page: **"Chain anomaly detected on `inc_01HX...` — escalate to Pia."** Dismissable but persistent across page navigations until acknowledged. |
| **Chain event** | `ChainAnomalyDetected{inc, row_seq, expected_hash, actual_hash, actor_requested: <operator_id>, detected_at}` lands on the chain. |
| **TopChrome pulse-dot** | Shifts from green → amber. The TopChrome pulse-dot's state is shared with the `ChainIntegritySheet` — tapping the pulse-dot shows the last anomaly timestamp and the unresolved anomaly count. |

### Escalation path to Pia

- **Phase 1:** The banner surfaces to the operator who clicked. The operator's action is to escalate to Pia via the existing `EscalatedToPia` chain event pattern (Scenario 1). Pia has no Phase 1 surface, so the escalation lands in a Phase 1 monitoring log; the WB auditor's review (Phase 1 demo bar) can read the escalation events directly.
- **Phase 2:** The same `ChainAnomalyDetected` event feeds into Pia's PHA dashboard's chain-integrity view (Shape 5 from Scenario 5's data contract is adjacent; the chain integrity view is a Phase 2 dashboard widget). Pia sees chain anomalies as a first-class aggregate — count per month, per-ward anomaly map, recent anomaly list with one-click drill to the affected segment.

### What anomaly detection is NOT

An anomaly is **not** automatically a malicious actor. Common causes include: storage corruption, partial-write during a sync failure, schema migration that miscomputed a hash, a legitimate operator-side correction that didn't anchor to the chain. The system surfaces the anomaly; humans investigate. The structural point is: **the system detects the anomaly**, not that it determines intent.

### Force addressed

Pia's deferred-positive "Trust band correct, demonstrably" (FIA 15) is answered structurally by the anomaly surfacing. The chain's tamper-evident property is the trust-band correctness backbone — if the chain is intact, the band assignment is verifiable; if the chain is anomalous, the system surfaces it.

---

## End state

The scenario has three end states, one per use case. All three preserve the chain as the source of truth.

### End state A — Priya's dispute resolved in 30 seconds

`ChainRead{actor: priya, surface: incident_segment, inc: <id>}` lands. Priya shares the segment with Anjali. Anjali's complaint is structurally addressed by the chain segment showing: (a) her original `IncidentCreated{nid_hash, photo_exif}` event, (b) her own `CitizenAckAccepted` from the closure, (c) the pass badge on every row. **The chain remembered; Priya didn't have to.**

A `CitizenDisputeAcknowledged{anjali, inc, dispute_text, acknowledged_at}` chain event is emitted. The dispute is recorded structurally — Anjali's voice in the system — and the resolution (chain shows she did report; she accepted closure) is preserved on the chain forever. **The chain is the source of truth for the dispute's resolution.**

### End state B — Adi's override audit closed in 60 seconds

`ChainRead{actor: adi, surface: incident_segment, inc: <id>}` lands. Adi shares the segment with Pia (Phase 2 dashboard or audit-export mechanism). Pia sees: Adi's `TrustBandOverridden{reviewer: adi, from: T3, to: T1, reason_category: prior_incident_pattern, free_text: "..."}` reasoning is in context with the segment's full chain. **The override is defensible because the reasoning is structured, dated, and anchored.** Goal 2 is satisfied at per-incident scale.

A `ChainRead{actor: pia, surface: incident_segment, inc: <id>}` event lands if Pia is using the Phase 2 dashboard. The read trail is preserved — Pia's view of the segment is part of the meta-audit.

### End state C — Anjali's public timeline is a one-way render of the chain

`ChainRead{actor: anjali_nid_hash, surface: status_timeline, inc: <id>, mode: public}` lands. Anjali's view of her own timeline is logged (meta-audit), but she doesn't see the meta-audit; she sees only the motion-only chain events for her incident. **The chain is the source of truth; the timeline is the render layer; Anjali doesn't need to verify hashes.**

If Anjali wanted to verify, the chain ref chip on each row is copy-to-clipboard — she could hand the chain ref to someone with operator-mode access (Pia, a WB auditor) and they could verify on her behalf. **She doesn't need to do this herself; the system verifies for her.**

### The common end state across all three

The chain is the source of truth. The audit chain timeline surface is one source of truth rendered two ways (operator mode + public mode) for two audiences (operators + citizens). Every event in the system is anchored to the chain; every read of the chain is logged; every hash is verifiable; every anomaly is surfaced.

**No single actor's word is the system's source of truth — the chain is.** That is the structural answer to Pia's deferred-positive "Accountability vanishes into the system" force (FIA 14): the system names the actors (`TrustBandOverridden{reviewer: adi, ...}`, `Verified{inc, reasoning: "..."}`, `ProofAccepted{reviewer: adi, ...}`), the actors own the decision, and the public-health authority holds them to account through the chain.

---

## Force coverage map

The cross-cutting forces this scenario addresses. Some are in-phase (Priya, Adi); some are Pia's deferred-positive forces answered structurally by the per-actor attribution + anomaly surfacing; some are the implicit "chain captures too much" negative force addressed by the operator-vs-public render split.

| # | Force | Persona | FIA | Direction | Addressed in this scenario? | Where |
|---|---|---|---|---|---|---|
| **+1** | **Verdicts she can defend** | Priya | 13 | ✅ Positive | **Yes — primary force.** | Use Case A. Reasoning capture at the moment of decision IS the defence. Three months later, the chain surfaces her reasoning in context automatically. The single-click independent verification is the operator's evidence-strength signal. |
| **+2** | **Chain supports her judgment** | Adi | 12 | ✅ Positive | **Yes — primary force.** | Use Case B. The chain is Adi's memory, not her judge. When Pia reviews three months later, the chain segment is the proof; Adi doesn't have to remember the decision. Per locked decision #1, every operator decision has structured reasoning, not free-text essays — the chain supports judgment without becoming surveillance. |
| **+3** | **System defends her, not the other way around** | Adi | 13 | ✅ Positive | **Yes — primary force.** | Use Case B's outcome. The override audit closes in 60 seconds because the chain surfaces Adi's reasoning in context — sensor showed, Karim submitted, Anjali tapped, override reasoning cited the prior-incident pattern. **The close defends itself.** |
| **+4** | **Clear accountability, owned by named roles** (deferred-positive) | Pia | 14 | ✅ Positive | **Yes — structural answer.** | Every chain event carries named actors (`reviewer: adi`, `operator: karim`, `reporter: anjali`). The cross-cutting requirement #2 from Scenario 5 is enforced: no anonymous role labels, ever. Pia (Phase 2) sees named-actor attribution at every level — operators, admins, technicians, reporters (anchor flag visible). |
| **+5** | **Trust band correct, demonstrably** (deferred-positive) | Pia | 15 | ✅ Positive | **Yes — structural answer.** | Anomaly surfacing sub-section. The chain's tamper-evident property is the trust-band correctness backbone. If the chain is intact, the band assignment is verifiable; if anomalous, the system surfaces it. Phase 2's dashboard consumes the `ChainAnomalyDetected` events as a first-class aggregate. |
| **+6** | **Resolution is real, not paper** (deferred-positive) | Pia | 15 | ✅ Positive | **Yes — partially, via chain-anchored reality.** | The chain captures every input to the closure: Karim's `ProofSubmitted` (photo + GPS + EXIF + voice + reasoning), Priya's `Verified{reasoning}`, Adi's `ProofAccepted`, Anjali's `CitizenAckAccepted`. The chain segment is the structural evidence that the closure had real inputs — not paper. The post-resolution sensor readback (Scenario 4 field #5) is also anchored. |
| **+7** | **The motion is visible** | Anjali | 15 | ✅ Positive | **Yes — Use Case C.** | Anjali's status timeline IS the chain in public mode. The motion-visible force is realized structurally by the chain itself being the data layer. |
| **−1** | **Chain captures too much** | Adi | 10 | ❌ Negative | **Yes — operator-vs-public render split.** | Public mode (Anjali's status timeline) sees motion-only events with no payloads, no JSON, no hashes. Operator mode sees full payloads + hashes. **The capture is structured, not surveillance.** Per locked decision #1 of Scenario 2's reasoning-capture pattern, decisions use specific options (dropdowns, short text), not essays. The chain captures what matters for defensibility; it doesn't capture what doesn't. |
| **−2** | **Verification eats the day** | Priya | 15 | ❌ Negative | **Yes — single-click verification.** | The independent verification sub-section. Three seconds for a typical 30-event segment. Priya doesn't spend her shift doing manual hash recomputation; the system does it. |
| **−3** | **The close that's not real** | Adi | 13 | ❌ Negative | **Yes — anomaly surfacing + per-actor override rate.** | If the chain has been tampered with to fabricate a closure, the anomaly surfaces. If the override was wrong, Adi's per-actor override rate (Phase 2 dashboard, Shape 6 from Scenario 5) catches the pattern. The chain is the structural answer to "the close that's not real." |

**Forces not addressed in this scenario, and where they carry:**

- **Adi's "Queue tells her what matters" (FIA 14)** — Scenario 2's three pre-ranked buckets (overrides → proofs → escalations) are the structural response. This scenario reads the chain; it doesn't rank the queue.
- **Priya's "Triage that respects her capacity" (FIA 15)** — Scenario 1's ranked inbox + auto-routed tail collapse. This scenario is for after-the-fact verification, not capacity-respect triage.
- **Anjali's "The ack lands" (FIA 15)** — Scenario 3's 5-min dual-channel ack. This scenario's status timeline is the in-progress signal, not the got-heard ack.
- **Pia's "Citizens stop reporting because no one came" (FIA 13)** — Scenario 3's status timeline is the structural answer at the citizen edge; Scenario 5's Shape 4 (reporter cohort retention) is the city-scale answer.
- **Phase 1 unbuilt forces** — the broader "ward at a glance" view (Anjali's "neighbourhood gets better, visibly" FIA 12), the WB spend traceability (Pia FIA 13), the public-notice channel — all Phase 2 candidates per the product brief.

---

## Design log

**Produced by Saga/Freya — 2026-09-10**

**Source links:**

- [Product brief](../A-Product-Brief/product-brief.md) — the chain is the database (AD-1); single tenant per chain (AD-5); per-tenant chain with `prev_block_hash` linking; SHA-256 block hashing; Goal 2 (defensible) at per-incident AND city scale
- [Trigger map](../B-Trigger-Map/00-trigger-map.md) — deferred-positive forces table; Pia's 12-force profile; cross-cutting force summary
- [Business goals](../B-Trigger-Map/01-business-goals.md) — Goal 2.1 ("chain verifiable by independent hash recomputation"), Goal 2.3 ("100% of chain reads logged")
- [Pia persona](../B-Trigger-Map/02-persona-pia-the-public-health-authority.md) — constraint persona; FIA 14 / FIA 15 deferred-positive forces answered structurally here
- [Priya persona](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) — "Verdicts she can defend" (FIA 13) is the load-bearing positive force for Use Case A
- [Adi persona](../B-Trigger-Map/05-persona-adi-the-auditor.md) — "Chain supports her judgment" (FIA 12) + "System defends her, not the other way around" (FIA 13) are the load-bearing positive forces for Use Case B
- [Feature impact](../B-Trigger-Map/feature-impact.md) — #4 structured per-decision reasoning capture, #22 decision-capture structured field enforcement, #23 trust-band distribution chart, #11 per-actor SLA + override reasoning, #31 cross-tenant chain access log
- [Scenario 01 — Priya's shift](01-priya-the-pipeline-pilot-triage-verify-assign.md) — entry event: `IncidentCreated`; load-bearing emission: `Verified{inc, reasoning, signals_state, path}`; the per-decision reasoning is the surface this scenario's chain segment makes legible
- [Scenario 02 — Adi's shift](02-adi-the-auditor-mark-resolved-handoff.md) — entry event: Karim's `FixSubmitted`; load-bearing emission: `TrustBandOverridden{reviewer, from_band, to_band, reason_category, free_text}`; the override audit use case (Use Case B) is the structural reason this scenario exists
- [Scenario 03 — Anjali's full citizen arc](03-anjali-the-anchor-citizen-arc.md) — the public-mode status timeline IS this scenario's per-incident segment in public mode; the 33 closed-enum Phase 1 chain event types are listed in this scenario's StatusTimeline sub-section; motion-only events are filtered per Scenario 3's locked decisions
- [Scenario 04 — Karim's shift: Acknowledge, diagnose, fix, submit proof](04-karim-the-technician-field-lane.md) — Karim's read-only view of his own chain segments is operator-mode-only; his `ProofSubmitted{...reopened: true}` flag feeds the per-Karim proof-quality trend dashboard (feature #26)
- [Scenario 05 — Pia's data contract: Phase 1 emission contract for the Phase 2 PHA dashboard](05-pia-data-contract-pha-deferred.md) — the six data shapes consume the chain aggregates that this scenario's chain emission contract defines; cross-cutting requirements (chain anchoring, named-actor attribution, hotline-vs-web-form distinction, anchor-flag preservation, silent-ack-as-data, override-rate input, reporter-cohort retention, reopen lineage) are enforced by this scenario's `ChainRead` meta-audit
