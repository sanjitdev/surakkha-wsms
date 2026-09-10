# Scenario 01 — Priya's shift: Triage, verify, assign (with hotline intake)

**Phase:** 2 — UX Scenarios
**Archetype:** Priya the Pipeline Pilot (action lane; load-bearing Phase 1 user)
**Instance count:** 1–2 in Phase 1, 4–6 in multi-shift deployment, dozens in fleet deployment
**Goal served:** G1 (loop is reproducible, direct, primary) · G2 (loop is defensible, direct, primary) · G3 (citizens feel heard in motion — the "in-progress" middle beat, indirect but real)
**Persona link:** [03-persona-priya-the-pipeline-pilot.md](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md)
**Feature link:** #1 — Pre-triage trust band with auto-routing ([feature-impact.md](../B-Trigger-Map/feature-impact.md)); supports features #4 (structured per-decision reasoning), #7 (pre-ranked operator inbox), #11 (per-actor SLA), #13 (handover brief), #24 (low-band dismissal reasoning)
**Force links:** P1 "Triage that respects her capacity" (15), P2 "Verification that's decisive" (15), P5 "Resolution that's real" (14), P6 "Verdicts she can defend" (13), P11 "Handover briefs that actually brief" (12), P12 "False-negatives that almost never happen" (12) — plus three negative forces (P−1, P−2, P−3) the scenario must drain.

---

## Header — locked decisions for this scenario

> **Confirmed by user before scenario writeup. Locking these so Freya reconciles against them, not against an interpretation:**
>
> 1. **Primary sort on the dashboard = priority-first, then age within priority.** Trust band is *not* the first axis. The top-priority incident is the top row.
> 2. **Verify and assign are one combined submit action.** One submit. Not two clicks, not a confirm step, not "Save → Continue → Assign." Priya is decisive under load.
> 3. **Hotline intake path.** A `+ New hotline report` button on the operator dashboard opens a modal/side-panel intake form. Submitting creates `IncidentCreated{source: hotline, reporter: caller_phone_hash}` at **T3 band (lowest)**. Three of five verification signals start missing. Reasoning capture is heaviest on this path.
> 4. **Four verification paths the operator has:**
>     - **Path A — Decisive.** All signals present; one-line reasoning.
>     - **Path B — Ambiguous.** Some signals missing; structured multi-field reasoning with explicit "why assign anyway."
>     - **Path C — Hotline-sourced.** Heaviest reasoning weight because no automated defence exists.
>     - **Path D — Defer / escalate.** Defer-with-callback or escalate-to-Pia as first-class actions, not failures.
> 5. **Three-column `InboxDetail` layout:** left (trust band + source + reporter + missing-evidence chips), center (five verification signal cards + photo viewer + map), right (structured reasoning capture + Karim picker + due_at + priority override + submit + defer/escalate secondary).
> 6. **The submit action fires three things automatically:** the verification event, the in-progress signal to Anjali, the assignment notification to Karim. One submit, three downstream events.
> 7. **Auto-routed tail is collapsed behind a chip** on the dashboard. Incidents the system has already triaged out (low-band auto-routed, no operator action needed) do not compete for her attention.
> 8. **Scenario 1 ends at "assigned to Karim, awaiting tech on-site."** Karim → Adi → Anjali → close is held-state for this scenario; it is carried by Scenarios 2 (Adi) and 4 (Karim).

---

## Entry point & emotional state

**Entry screen:** LoginPage.
**Trigger:** Auto-generated handover brief from the previous operator's shift. She reads it once (≈3 min) and the day's shape is set.
**Two arrival states (both in scenario):**
- **Calm arrival** — clean handover, empty inbox, ranked list waiting. The "what only she can do" filter is populated, nothing else is.
- **Pre-loaded arrival** — one open T2 from yesterday, two T3 escalations pending Pia's signature, three reporters she owes callbacks. The handover brief names each by incident id and band.

**Internal state in both states:** municipally working, capacity-aware, decisive calm. She is *running* the system, not debugging it. She fears being the bottleneck more than being wrong — wrong is auditable, bottleneck is invisible until SLA drift has already happened.

---

## Screen 1 — LoginPage → HandoverBriefModal

**What Priya sees:** Login form on mobile-friendly web. After auth, the handover brief auto-opens as a modal over the dashboard. The brief is named (incident ids + bands + ageing minutes), not a list of unresolved events. Auto-routed tail and ack-queue activity are summarised in two collapsed chips at the bottom of the modal.

**What she does:** Authenticates. Skims the brief (~3 min). Closes the modal.

**Decision point:** Whether to read the in-flight chip before opening the inbox, or skip it and trust it. Default: skim, then proceed.

**What fires automatically on close:** Dashboard loads sorted priority-first / age-second. Any open T2 from yesterday floats to the top regardless of age band. The "+ New hotline report" button is pinned top-right on the dashboard.

---

## Screen 2 — OperatorDashboard (ranked inbox)

**File path reference:** `web/src/pages/01-priya/OperatorDashboard.tsx` (locked mockup parity per `web/mockups/01-priya/`)

**What Priya sees:**
- Ranked list. Each row carries a `BandPill` (high / medium / low, color-before-content per visual-direction.md), source attribution (sensor / Anjali / hotline), reporter, age, and a missing-evidence chip set if any verification signal is absent.
- Two filter chips at the top: **"needs me"** (default) and **"in flight"** (assigned but not closed).
- A collapsed chip in the top-right summarising auto-routed tail (count + "system handled, hide").
- The **+ New hotline report** button pinned above the list, opening a modal/side-panel intake form on click.
- TopChrome (48 px): brand + chain-status pulse-dot on the left; persona chip + locale-globe + theme toggle on the right.
- Sidebar (8 items) collapsed to drawer on mobile.

**What she does:** Works the list top-down. The top row is the next decision. She does not batch, she doesn't triage-the-triage; the ranking is already doing that work for her.

**Decision point at the row level:** Three openable paths per row —
- **Open for verification** (paths A / B / C — `InboxDetail`).
- **Quick-dismiss** with marked-dismissed-because reasoning (low-band only; visible because the next sensor readback timestamp is showing on the row).
- **Defer / escalate** (path D — opens `DeferOrEscalateDialog`).

**What fires automatically when she opens a row:** The verification-detail view loads with all five verification signal cards pre-staged. Pre-triage reasoning (why this band) is visible in the left column. Any missing-evidence chip is escalated to a top-of-screen callout so she doesn't read the rows to discover it.

---

## Screen 3 — HotlineIntakeModal (the "+ New hotline report" path)

**File path reference:** `web/src/pages/01-priya/HotlineIntakeModal.tsx` (to be reconciled by Freya)

**Opened from:** The `+ New hotline report` button on the OperatorDashboard. Modal focus-trap + restore-on-close per `Modal` primitive. Bangla locale first; English fallback.

**What Priya sees:** A short intake form. Fields: caller phone (becomes `reporter: caller_phone_hash` on submit — phone is never stored in plaintext), caller's described symptom (free text, no structure on purpose — the caller is panicking or translating), caller's ward (lookup), proximity to a sensor (optional — yes / no / unknown), reported time (defaults to now), and an action chip row at the bottom: **Submit intake**, **Cancel**, **Escalate to Pia now**.

**What she does:** Fills it in while the caller is still on the line. The form is short on purpose — the caller is the bottleneck, not the typing. Submits while still on the call so the caller hears "we have it logged, the operator is on it."

**Decision point:** Whether to escalate to Pia during the call (rare; usually when the caller's tone signals an acute public-health emergency that needs a parallel voice), or just submit as a T3 hotline incident.

**What fires automatically on submit:**
- `IncidentCreated{source: hotline, reporter: caller_phone_hash, band: low}` lands on the chain.
- A `HotlineIntakeReceived` toast appears top-right for ~4 s (`role="status"`, hover-pause) confirming the chain write succeeded.
- The new incident surfaces at the bottom of the operator inbox at **T3 band (lowest)** — it does **not** jump the priority sort above higher-band work in progress. Hotline reports are de-prioritised by design when there's already meaningful work in flight; they re-prioritise on the next refresh if nothing else has aged.
- The caller gets a "got heard" ack SMS within the 5-min window (Bangla-first, GSM-7 / UCS-2 hard caps per C-11). This is the Goal 3 middle-beat message *before* Priya has decided anything.

**Path transitions:** After submission, the next decision is the same one she'd reach for any row: open it via `InboxDetail` and choose Path C (hotline-sourced) for verification.

---

## Screen 4 — InboxDetail (the three-column verification view)

**File path reference:** `web/src/pages/01-priya/InboxDetail.tsx`

**Layout (locked):**

| Column | Contents |
|---|---|
| **Left** | `BandPill` + source + reporter (or `caller_phone_hash` for hotline) + missing-evidence chips. Pre-triage reasoning (why this band) is collapsed-but-visible below. |
| **Center** | Five verification signal cards (see below) + photo viewer with EXIF overlay + map showing incident location + nearest sensor location. |
| **Right** | Structured reasoning capture field (path-dependent fields per Table 1 below) + Karim picker + `due_at` picker + priority-override dropdown + **Submit verify + assign** (primary) + **Defer with callback** + **Escalate to Pia** (secondary, ghost-style). |

**The five verification signal cards (center column):**
1. Sensor cross-check (NTU / conductivity / chlorine_residual vs the cluster window).
2. Photo + EXIF (submitted by reporter; verbatim image, no re-encode).
3. Reporter-call outcome (timestamp + outcome category — reached / no-answer / wrong-number / hotline-not-applicable).
4. Reporter reputation lookup (internal ledger; tier and recent accuracy, never surface-graded).
5. Cluster-window corroboration (other signals in the 5-min window within 500 m).

Each card shows its status: **present** / **missing** / **ambiguous**. Cards in "missing" render the missing-evidence chip in the left column too, so the two views agree.

**What Priya does:** Reads the center column. If everything is present, she writes one line of reasoning in the right column and picks Karim + due_at + submits. If signals are missing, she reads the missing-evidence chips at the top of the left column, decides whether the path is A, B, C, or D, and reasons accordingly.

**Decision point — which of four verification paths:** See Section 4 below. The reasoning field changes shape based on path; the submit button is the same.

**What fires automatically on submit (single combined action):**
1. `Verified{inc, reasoning, signals_state, path}` lands on the chain.
2. `Assigned{inc, operator: karim, due_at, priority}` lands on the chain.
3. The in-progress signal fires to Anjali's phone (Bangla SMS, goal 3 middle beat — "your report is with the field team now").
4. The assignment notification fires to Karim's device (`TechnicianDispatched` event surfaces in his mobile-friendly-web view).

One submit, four downstream events. No second click. The trust hand-off is auditable on the chain: every incident has a `Verified` immediately followed by an `Assigned` with the same chain head parent.

**Secondary actions (paths D and ambiguity fallbacks):**
- **Defer with callback** writes `DeferRequested{inc, callback_at, reason}` and parks the incident under "in flight" until `callback_at`, then resurfaces to the top of the ranked inbox at the deferred time.
- **Escalate to Pia** writes `EscalatedToPia{inc, path_template, reason}` and moves the incident out of Priya's inbox into the (Phase-2) Pia queue; the chain retains Priya's reasoning as the handoff narrative.

---

## Screen 5 — OperatorDashboard (the held-state inbox row)

**What Priya sees after submit:** The row she just submitted moves to the **"in flight"** filter chip group. Its left edge shows a small chip counting minutes since `Assigned`; the `due_at` timestamp counts down. Karim's status (acknowledged / en route / arrived / diagnosed) is visible inline as Karim's events land.

**What she does:** Picks the next top row. The row she just submitted is no longer "needs me"; it is "in flight." She does not re-open it unless Karim signals ambiguity.

**Decision point:** Whether the submitted row needs a check-in (no — it's in flight), or whether the next row down outranks her time. The dashboard does not second-guess this for her.

**What fires automatically while she works the rest of the list:** The submitted incident ages; if Karim hasn't acknowledged by `due_at − 10 min`, a quiet SLA-warning chip appears on the row. This is the `Per-actor SLA compliance + override-reasoning dashboard` (feature #11) surfaced inline, not in a separate view.

---

## End state — assigned to Karim

**Scenario 1 ends here.** The incident is `Assigned{operator: karim, due_at}` on the chain. Karim has the dispatch notification. Anjali has the in-progress SMS.

**Held-state — explicitly NOT in this scenario:**
- Karim's on-site work (`TechnicianArrived` → `DiagnosisSubmitted` → `FixSubmitted`) — **Scenario 4 (Karim)**.
- Karim's resolution proof (photo + GPS + device-clock EXIF) — **Scenario 4**.
- Adi's verification of Karim's proof — **Scenario 2 (Adi the Auditor)**.
- Adi dispatching the citizen-ack request to Anjali — **Scenario 2**.
- Anjali's ✅ / ❌ tap — owned by the `CitizenAckPage` (FE-F6) but referenced from Scenarios 2 and 3.
- Priya's `IncidentClosed` action after ✅ — **Scenario 1's reverse arc**; some say this is "still Scenario 1" if the shift didn't end, but for sprint-planning clarity it is held by Scenario 2 (which closes).

For Phase 1 demo bar purposes, **Scenario 1 = the verify+assign step**. The chain from sensor trigger → citizen report → `IncidentCreated` → `Verified` → `Assigned` lands cleanly on the chain and the dashboard reflects it. The rest of the loop is held-state for the next scenarios and the close comes back to Priya only when an `IncidentReopened{parent}` fires (rare; Scenario 1's reverse arc).

---

## The four verification paths

These paths all live on `InboxDetail` (Screen 4). The difference is the **reasoning field** shape on the right column, the missing-evidence chips on the left, and which secondary action becomes default.

| Path | When it's picked | Reasoning field shape (right column) | Missing-evidence state (left column) | Default secondary action |
|---|---|---|---|---|
| **A — Decisive** | All five signals present; cluster corroborated, EXIF clean, reporter reachable, sensor agrees, reporter reputation neutral-or-better. | One line of free text. Inline. e.g. *"Two corroborating signals + reporter confirms. Assigning Karim at standard priority."* | None — left column reads "all signals present." | None — primary submit only. |
| **B — Ambiguous** | 1–2 signals missing but the rest point in the same direction. e.g. reporter didn't pick up, but sensor cross-check + EXIF + cluster all agree. | **Three structured fields:** (1) *What's missing,* (2) *What the rest of the evidence says,* (3) *Why I'm assigning anyway.* The "why anyway" is load-bearing for the audit. | The missing signals are chips at the top of the left column (`reporter-not-reached` / `sensor-offline` / `photo-low-quality`). | **Defer with callback** is offered as the alt-primary; Priya picks submit anyway because the structured "why" carries the defence. |
| **C — Hotline-sourced** | `source: hotline, band: low`. Three of five signals start missing by definition: there's no EXIF photo, no reporter-reputation (caller_phone_hash only), no cluster corroboration guarantee. What remains: caller description (free text), sensor proximity (if "yes"), call duration. | **Four structured fields:** (1) *What the caller said,* (2) *What I asked that they answered,* (3) *What I asked that they didn't,* (4) *Why I'm trusting this report.* The reasoning weight is heaviest here because no automated defence exists — only Priya's judgment, captured at the moment of decision. | Chips show `no-photo` / `no-reputation` / `cluster-pending` (sensor proximity is rendered as a partial-signal chip: "nearest sensor ↗ 240m, last readback 28 min ago"). | **Escalate to Pia** is offered as alt-primary when caller's tone suggests acute emergency; **Defer with callback** is offered when Priya wants the next shift to call back. |
| **D — Defer / escalate** | The signal set does not let Priya assign, *and* the priority isn't acute. Two first-class treatments, not failures. | **One structured field:** *Reason for deferral / escalation.* Plus a structured picker: callback-time OR escalation path template (WASA specialist on call / PHA on call / councillor / lab). | Chips show the missing signals as causal evidence for *why* deferred. The deferral reasoning cites them directly. | Primary is the defer-or-escalate action; the verify+assign button is the *alt* in this path. |

**Submit button is the same button in all four paths.** Submit fires the chain event(s) appropriate to the path — `Verified` for A / B / C, or `DeferRequested` / `EscalatedToPia` for D.

**Reasoning capture is structured, not free-text essays.** Per feature #22 (`Decision-capture structured field enforcement`), the fields are specific options, dropdowns, and short textareas. Priya is not writing for the chain; she is checking boxes for the chain. The reasoning is reusable for Pia's review three months later.

---

## Force coverage map (Priya's 12 forces — 5 negative + 7 positive)

| # | Force (FIA) | Direction | Addressed in this scenario? | Where in the scenario |
|---|---|---|---|---|
| −1 | Verification eats the day (15) | ❌ | **Yes — central problem.** | Screens 2 & 4. The ranked inbox (priority-first, age-second) is the structural response. The "needs me" filter chip is the explicit product feature that honours this force. The five-signal-cards-on-one-view layout (Screen 4) means each verification takes ≤ 5 min, not the 12-min average cited in the force's WHAT. The auto-routed-tail-collapsed chip (locked decision #7) is the second structural response — Priya doesn't see work the system has handled. |
| −2 | The report that can't be verified (14) | ❌ | **Yes — explicit Path D + Path B "why anyway."** | Screen 4's right column. Path D is a first-class treatment (Defer with callback / Escalate to Pia). Path B's structured "why I'm assigning anyway" field is the audit-defensible response when Priya chooses to assign under partial evidence. Missing-evidence chips at the top of the left column make the state explicit so she doesn't hunt. |
| −3 | The resolution that doesn't resolve (13) | ❌ | **Partially.** | Screen 5 (held-state row) shows Karim's status so Priya can see if a resolution is in progress. The full resolution-readback loop is held by Scenarios 2 (Adi) and 4 (Karim); `IncidentReopened{parent}` flows back to Priya's inbox (Phase 2 / next-scenario scope). Within Scenario 1, the surface that responds is the in-flight chip and the `due_at` countdown. |
| −4 | A wrong verification, publicly (12) | ❌ | **Yes — reasoning captured at the moment of decision.** | Screen 4's reasoning field (all four paths) writes to the chain inline with the `Verified` event, not retrofitted. The Anjali-reputation-ledger soft mark (the social cost) is internal-only per feature #10; the surface never lands on the citizen's account UI. |
| −5 | A genuine incident she dismissed (12) | ❌ | **Yes — low-band dismissal reasoning.** | Screen 2's quick-dismiss path requires `marked-dismissed-because` reasoning; the next-scheduled-sensor-readback timestamp is on the row so Priya can trust her call was right when that readback lands (feature #25). Not central to Scenario 1 because T1/T2 work dominates the inbox; carried into the low-band-dismissal moments that arise during a shift. |
| +1 | Triage that respects her capacity (15) | ✅ | **Yes — primary sort, "needs me" filter, auto-routed tail collapse.** | Locked decisions 1 & 7. Screen 2's three structural choices are all this force's response: priority-first sort, "needs me" default filter, collapsed-chip auto-routed tail. |
| +2 | Verification that's decisive (15) | ✅ | **Yes — one view, five signals, one submit.** | Screen 4. Sensor cross-check + photo + EXIF + reporter-call outcome + cluster corroboration all on one view in the center column. Submit is one click, not five. The reasoning field changes shape by path but the action is the same button. |
| +5 | Resolution that's real (14) | ✅ | **Indirectly, by setting up the chain events Adi + Karim need to fire.** | Screen 4's submit writes `Verified` + `Assigned` as a paired chain head. The close loop is held by Scenario 2 (Adi) and Scenario 4 (Karim); within Scenario 1 the load-bearing contribution is that the *assignment reasoning is anchored* so Adi's later verification can stand on it. |
| +6 | Verdicts she can defend (13) | ✅ | **Yes — structured reasoning captured inline at decision.** | Screen 4 right column. All four paths require reasoning at the moment of decision. Feature #4 (`Structured per-decision reasoning capture`) is the mechanism. Three months later, Pia pulls the chain segment, reads the `Verified{inc, reasoning}` event, and sees Priya's call in under a minute. |
| +11 | Handover briefs that actually brief (12) | ✅ | **Yes — entry point.** | Screen 1's HandoverBriefModal. Brief is auto-generated, names open threads by incident id + band + ageing minutes, not as a list of unresolved events. The auto-routed tail and ack-queue activity live in two collapsed chips so they don't compete. |
| +12 | False-negative incidents that almost never happen (12) | ✅ | **Indirectly, via the low-band dismissal path.** | Screen 2 quick-dismiss shows the next-scheduled-sensor-readback timestamp on the row (feature #25). Priya can defer trust to the next readback while staying defensive about her call. The per-operator false-positive / false-negative trend (feature #19) is out of Scenario 1's screen surface but the data infrastructure it requires is established by Scenario 1's chain writes. |

**Forces not addressed in Scenario 1, and where they carry:**
- **−3 (resolution that doesn't resolve)** — fully carried by Scenario 2 (Adi's verification step) + Scenario 4 (Karim's on-site work). The reopen loop is out of Scenario 1 by user-locked decision #8.
- **+5 (resolution that's real)** — primary surface is Scenario 2 (Adi) and Scenario 4 (Karim); Scenario 1's contribution is the chain-event foundation.
- **+7 (expertise that compounds)** — out-of-scenario by design; the per-operator trend dashboard (feature #19) is a Phase 1.x addition, not part of Scenario 1's load-bearing flow.

---

## Design log

**Produced by Saga/Freya — 2026-09-10**

**Source links:**
- [Product brief](../A-Product-Brief/product-brief.md)
- [Trigger map](../B-Trigger-Map/00-trigger-map.md)
- [Priya persona](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md)
- [Feature impact](../B-Trigger-Map/feature-impact.md)
- [Visual direction](../A-Product-Brief/visual-direction.md) (trust-band palette only — T1/T2/T3 referenced, not redefined)
