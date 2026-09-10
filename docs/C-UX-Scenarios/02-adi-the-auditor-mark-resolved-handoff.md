# Scenario 02 — Adi's shift: Mark resolved, hand back to Priya (closed-loop queue)

**Phase:** 2 — UX Scenarios
**Archetype:** Adi the Auditor (decision lane; the last human decision before `IncidentClosed`; **the close is Priya's, not hers**)
**Instance count:** 1–2 in Phase 1 (paired with Priya)
**Goal served:** G1 (loop is reproducible — the close is the loop's end-state, direct) · G2 (loop is defensible — direct, primary) · G3 (citizens feel heard in motion — indirect, via the citizen-ack dispatch)
**Persona link:** [05-persona-adi-the-auditor.md](../B-Trigger-Map/05-persona-adi-the-auditor.md)
**Feature link:** #5 — Resolution-proof bundle viewer ([feature-impact.md](../B-Trigger-Map/feature-impact.md)); supports #4 (closure ack with ✅/❌), #18 (pre-ranked closed-loop queue), #22 (decision-capture structured field enforcement), #26 (per-Karim proof-quality trend), #27 (per-Priya verification-depth trend), #29 (trust-band override structured reasoning), #36 (beyond-tech-mandate escalation templates)
**Force links:** A1 "Close that's verifiable" (15), A2 "Queue tells her what matters" (14), A3 "Karim's proof is reliably good" (13), A4 "System defends her, not the other way around" (13), A5 "Override rate trends toward expert-level" (11) — plus five negative forces the scenario must drain.

**Handoff continuity (read this first):**
- This scenario picks up where [Scenario 01 — Priya's shift: Triage, verify, assign](01-priya-the-pipeline-pilot-triage-verify-assign.md) ends. Karim's `FixSubmitted` event is the **entry event** from Priya's assignment (Scenario 1's held-state handoff to Karim). Adi's `IncidentResolvedByAdmin` is the **exit event** that hands back to Priya's confirmation+close step (Scenario 1's reverse arc / close action).
- Karim's on-site work (`TechnicianArrived` → `DiagnosisSubmitted` → `FixSubmitted`) is **Scenario 4 (Karim)** — held-state here, referenced as already-completed.
- Anjali's ✅/❌ tap on the `CitizenAckPage` is **Scenario 3** — referenced as the chain event that follows Adi's `IncidentResolvedByAdmin`.

---

## Header — locked decisions for this scenario

> **Confirmed by user before scenario writeup. Locking these so Freya reconciles against them, not against an interpretation:**
>
> 1. **Three queue buckets, not four.** Adi's closed-loop queue is pre-ranked as: (a) overrides awaiting her call, (b) proofs awaiting verification, (c) escalations awaiting decision. **No citizen-ack monitoring queue** — once Adi marks resolved, the incident leaves her queue entirely.
> 2. **Adi marks resolved; Priya confirms and closes.** Adi's "mark resolved" submit fires three chain events in one action: `ProofAccepted{reviewer: adi}`, `CitizenAckRequested{dispatched_to: anjali}`, `IncidentResolvedByAdmin{reviewer: adi}`. The close button is **not** on Adi's surface.
> 3. **Adi is tension-free after marking resolved.** No ack-window monitoring, no nudge action, no sub-queue. The chain records `CitizenAckRequested` but she doesn't watch it land. Her work is done.
> 4. **Reopen path:** If Anjali taps ❌ OR Priya's confirmation finds contamination hasn't cleared → `IncidentReopened{parent}`. The reopened incident re-enters **both** Priya's inbox AND Adi's closed-loop queue at the same priority band, with the ❌ reasoning or Priya's reopen reasoning visible on the chain segment. **Adi's first action on a reopen is to re-review Karim's proof.** If the proof is genuinely insufficient (new contamination, different problem, scope creep), she then re-dispatches Karim with new structured instructions; this is the `ProofInsufficient` escalation event.
> 5. **Five-event handoff chain.** `FixSubmitted` → `ProofAccepted` → `CitizenAckRequested` → `IncidentResolvedByAdmin` → Anjali ✅ tap → `IncidentClosed{closer: priya}`. Five events, four actors (Karim, Anjali, Adi, Priya), one incident.
> 6. **Citizen-ack behavior unchanged from trigger map.** Anjali taps ✅ or ❌. Silent expiry is captured as `CitizenAckWindowExpired` first, then routed forward. Goal 3's third beat ("closed") is Priya's, not Adi's.
> 7. **Three-column `FieldIncidentDetailPage` layout.** Left: original report + Priya's verification reasoning + Karim's proof bundle metadata + post-resolution sensor readback + Anjali ack status. Center: full-size proof photo with EXIF strip + mini-map with GPS pin overlay + sensor reading trend (24h). Right: closure controls — "Mark resolved" (greyed until every input present), escalate back to Karim (structured: what's missing, what we need, ETA), override trust band (structured reasoning field), beyond-tech-mandate escalation (templates surface from prior incidents: WASA specialist, PHA on call, councillor, lab).
> 8. **Reopen queue bucket.** When an incident re-enters Adi's queue as `IncidentReopened{parent}`, it appears with a special chip (`REOPENED`) and is sorted to the top of the proofs bucket — not as a new fourth bucket, but as a high-priority row in the existing one.
> 9. **No silent-nudge action.** Adi has no SMS-nudge to Anjali. The dispatch of `CitizenAckRequested` is a one-shot system action; Anjali either responds or she doesn't, and the silence is recorded structurally.
> 10. **Shift-end state.** Adi's queue is empty of overrides / proofs / escalations — she's ahead of the work. The shift-end view shows override-rate trend (her own false-positive/false-negative rate trending toward expert-level), escalation list (incidents that need Pia's tier-3 attention), and the certainty that nothing she marked resolved today will reopen tomorrow.

---

## Entry point & emotional state

**Entry screen:** LoginPage → `FieldQueuePage` at shift start.
**Trigger (continuity from Scenario 1):** Karim's `FixSubmitted` event for one or more incidents assigned to him in the previous shift (or earlier in this shift). The proof photo + GPS + EXIF + reasoning + post-resolution sensor readback is the input packet that lands on Adi's closed-loop queue.
**Handover brief:** Light — Adi's morning starts with the ranked action list, not a heavy narrative. The brief is a one-glance count of overrides / proofs / escalations waiting.

**Internal state:** Working patience. She is not in a hurry; she is in a queue. **Bold dominant emotions: working patience, evidence-led calm, cross-role awareness.** She fears the close that's not real more than the close that's late — the late close has a citizen who waits; the wrong close has a citizen who drinks bad water and an audit that points at her name.

**What she does NOT see:** Priya's inbox. Karim's field reality. Anjali's taps (until they arrive on the chain segment she's reading). The system surfaces what she needs to verify, in the order it matters, without re-doing anyone else's triage.

---

## Screen 1 — LoginPage → FieldQueuePage

**File path reference:** `web/src/pages/02-adi/FieldQueuePage.tsx` (to be reconciled by Freya)
**File path reference (login):** `web/src/pages/00-shared/LoginPage.tsx` (per FE-1 spine)

**What Adi sees on `FieldQueuePage`:**

Three pre-ranked sections. Each section shows a count badge and the top rows collapsed to ~3, with "show all" expansion. The order is fixed by locked decision #1:

| Bucket order | Bucket label | What's in it | Why this order |
|---|---|---|---|
| **1** | Overrides awaiting call | High-band incidents where Adi's override reasoning is the last missing input before Priya can dispatch. Trust-band disagree calls. Rare; most consequential because **overrides change the system's call**. | First — overrides are rare and consequential; she handles them before anything else, when her judgment is fresh. |
| **2** | Proofs awaiting verification | Karim's `FixSubmitted` packets. Photo + GPS + EXIF + reasoning + post-resolution sensor readback + Priya's verification reasoning on the same row chip-set. **Reopened incidents (`IncidentReopened{parent}`) appear at the top of this bucket with a `REOPENED` chip** (locked decision #8). | Second — proofs are the load-bearing close; they're the volume of her day and the decision she cannot delegate. |
| **3** | Escalations awaiting decision | Incidents where Karim's mandate ends before the problem does (beyond-tech-mandate). Templates surface from prior incidents: WASA specialist, PHA on call, councillor, lab. | Third — escalations are rare and require her judgment but not her immediacy; she reaches them last in a clean shift. |

**No citizen-ack monitoring bucket.** Once Adi marks resolved, the incident leaves her queue entirely. The `CitizenAckRequested` chain event is recorded but not displayed as work-in-queue (locked decision #1).

**TopChrome (48 px):** brand + chain-status pulse-dot on the left; persona chip + locale-globe + theme toggle on the right. Same shared TopChrome as Priya's surface per visual-direction.md.

**Sidebar (4 items, persona-aware per visual-direction.md):** closed-loop queue, per-Karim proof-quality dashboard, per-Priya verification-depth dashboard, shift-end / trends.

**What she does:** Skims the three counts. Picks the top row in bucket 1 if non-empty (rare). Otherwise goes to bucket 2 (proofs — the load-bearing work). Bucket 3 only if buckets 1 and 2 are clear.

**Decision point at the row level:** Three openable paths per row:
- **Open for verification** (`FieldIncidentDetailPage` — Screen 2).
- **Quick-override** with structured reasoning (trust-band overrides only; the override is captured inline, not in a separate form).
- **Defer to next shift** with `due_at` and one-line deferral reasoning (rare; for incidents where she wants Priya's next-shift morning brief to surface it).

**What fires automatically when she opens a row:** The detail view loads with every input that justifies a close already pre-staged. The "Mark resolved" button is greyed until every input is present (locked decision #7).

---

## Screen 2 — FieldIncidentDetailPage (the three-column verification view)

**File path reference:** `web/src/pages/02-adi/FieldIncidentDetailPage.tsx` (to be reconciled by Freya)
**Opened from:** Any row in the proofs bucket (most common), override bucket (rare), or escalation bucket (rare). `REOPENED` chips route to the same page with the reopen reasoning visible on the chain segment at the top.

**Layout (locked decision #7):**

| Column | Contents |
|---|---|
| **Left** | Original report (Anjali's text + photo + EXIF) at top · Priya's verification reasoning (`Verified{inc, reasoning, signals_state, path}` from Scenario 1, Screen 4) · Karim's proof bundle metadata (photo taken-at, GPS coordinates, device-clock timestamp, reasoning text, `FixSubmitted` chain event anchor) · Post-resolution sensor readback (latest NTU / conductivity / chlorine_residual reading within the 24h window, color-coded against the WHO thresholds) · Anjali ack status (one of: not-yet-requested / `CitizenAckRequested` dispatched / ✅ received / ❌ received / window-expired — only populated after Adi marks resolved). |
| **Center** | Full-size proof photo with EXIF strip overlay (camera, lens, ISO, shutter, GPS, timestamp — forensic, no re-encode) · Mini-map with GPS pin overlay showing the proof photo's GPS, the original report's location, and the nearest sensor (OpenStreetMap tiles, C-16 vendor-neutral) · Sensor reading trend (24h) — small time-series chart showing NTU / conductivity / chlorine_residual before and after Karim's work, with the `FixSubmitted` timestamp marked. |
| **Right** | Closure controls: **Mark resolved** (primary, greyed until every input present), **Escalate back to Karim** (structured: what's missing / what we need / ETA expectation → fires `ProofInsufficient`), **Override trust band** (structured reasoning field, dropdown of override reasons — fires `TrustBandOverridden{reviewer: adi, from_band, to_band, reason_category, free_text}`), **Beyond-tech-mandate escalation** (templates surface from prior incidents: WASA specialist, PHA on call, councillor, lab → fires `EscalationTriggered{path_template, incident, reason}`). |

**What Adi sees — the input completeness check:**
The "Mark resolved" button on the right column is **greyed until every input is present** (locked decision #7 + feature #5 design implication). The checklist is visible to her as a small list above the button:

- ✅ Original report present
- ✅ Priya's verification reasoning present
- ✅ Karim's proof bundle (photo + GPS + EXIF + reasoning) present
- ✅ Post-resolution sensor readback present (or marked-unavailable-with-reason)
- ✅ Karim's `FixSubmitted` chain anchor present

The fifth item is the chain integrity check — if the proof bundle references a chain anchor that doesn't verify, the button stays greyed with a `chain-anchor-mismatch` chip.

**What she does:**

For a **normal proofs bucket row** (Karim's work was clean):
1. Reads the left column top to bottom (Anjali's report → Priya's verification → Karim's proof metadata → sensor readback).
2. Reviews the center column: proof photo with EXIF, GPS pin on the mini-map, 24h sensor trend with the `FixSubmitted` marker.
3. Cross-checks: does the proof photo's GPS match the original report's location? Does the post-resolution sensor readback show contamination clearing? Does Karim's reasoning say *what* he did and *why* it should resolve?
4. If everything lines up → clicks **Mark resolved**. One click. Three chain events fire (locked decision #2):
   - `ProofAccepted{reviewer: adi, inc, accepted_at}`
   - `CitizenAckRequested{dispatched_to: anjali, inc, dispatched_at, ack_window_minutes}`
   - `IncidentResolvedByAdmin{reviewer: adi, inc, resolved_at}`

For a **proof bundle that is weak** (Karim's photo is blurry, GPS missing, reasoning thin):
1. Clicks **Escalate back to Karim**. The structured form expands:
   - **What's missing** (dropdown: GPS / EXIF / photo clarity / reasoning depth / proof of root cause)
   - **What we need** (free-text short field, not an essay)
   - **ETA expectation** (time picker, defaults to Karim's standard SLA)
2. Submit fires `ProofInsufficient{reviewer: adi, inc, missing, needed_by, dispatched_back_to: karim}`.
3. Karim re-submits (`FixSubmitted` again, anchored to the new `ProofInsufficient`). The row re-enters Adi's proofs bucket when the new proof lands.

For a **trust-band override** (she disagrees with the system's high-band call):
1. Clicks **Override trust band**. The structured reasoning surface expands (feature #29: trust-band override structured reasoning surface):
   - **From band** (pre-filled) · **To band** (dropdown) · **Reason category** (dropdown: prior-incident-pattern / sensor-anomaly / reporter-history / cross-context-contradiction) · **Free text** (one-line defence, not an essay)
2. Submit fires `TrustBandOverridden{reviewer: adi, inc, from_band, to_band, reason_category, free_text}`.
3. The row stays in the overrides bucket until her override is captured; the `IncidentVerified` chain event from Priya's assignment is updated with the override context. The row moves to the proofs bucket for the resolution proof to land (or has already landed).

For a **beyond-tech-mandate escalation** (Karim's mandate ends before the problem does):
1. Clicks **Beyond-tech-mandate escalation**. The template surface expands (feature #17: first-class escalation event + escalation path templates):
   - **Template picker** (WASA specialist / PHA on call / councillor / lab — populated from prior incidents, not invented)
   - **Reason** (one-line: "Karim on site, contamination looks bigger than his scope, needs WASA valve shutoff")
   - **Linked proof** (Karim's bundle, pre-attached)
2. Submit fires `EscalationTriggered{path_template, inc, reason, linked_proof}`.
3. The row leaves Adi's queue (it has escalated); it does NOT route back to her — it is now Pia's tier-3 problem. The chain retains her reasoning as the handoff narrative.

**Decision point at the row level:** Which path. The "Mark resolved" path is the steady state. The other three are exceptions (proof insufficient / override / escalate). Each exception has a structured form, not free-text essays (feature #22: decision-capture structured field enforcement — this is also the structural response to the "chain captures too much" negative force).

**What fires automatically when she clicks Mark resolved** (the load-bearing single submit — locked decision #2):

1. `ProofAccepted{reviewer: adi}` lands on the chain.
2. `CitizenAckRequested{dispatched_to: anjali, ack_window_minutes}` lands on the chain.
3. `IncidentResolvedByAdmin{reviewer: adi}` lands on the chain.

The incident row **leaves Adi's queue entirely** (locked decision #1). Anjali receives the citizen-ack notification on her phone. Priya's dashboard surfaces the incident under a new state — "resolved by admin, awaiting citizen ack + Priya close." **Adi's work is done.** She does not see Anjali's ack queue. She does not see Priya's confirmation step. The chain records what happened; she moves to the next row.

---

## Screen 3 — FieldQueuePage (post-Mark-resolved steady state)

**What Adi sees after Mark resolved:** The proofs bucket count decrements by one. The row is gone. No toast, no "awaiting ack" chip, no progress bar. The queue state is the queue state.

**What she does:** Picks the next top row in the proofs bucket. If the bucket is empty, she checks the overrides bucket (rare) and the escalations bucket (rare). When all three are empty, her shift is over — she is ahead of the work.

**Decision point:** None at this level. The dashboard does not second-guess her. If she wants to see what happened to an incident she marked resolved, she pulls the chain segment for that incident id from the per-incident audit timeline (feature shared with Scenario 1).

**What fires automatically while she works:** Karim re-submissions (`FixSubmitted`) may land in her proofs bucket as new rows. Trust-band overrides she submitted may complete (the `IncidentVerified` chain event updates, the row moves out of overrides). Escalations she triggered may surface completion events from the templates (WASA specialist on call / PHA on call — these are Phase 2 surface, but the chain events are real).

---

## Screen 4 — FieldIncidentDetailPage on a REOPENED incident

**What Adi sees:** Same three-column layout. But the top of the left column carries an additional chip: **`REOPENED`**, with the ❌ reasoning from Anjali or Priya's reopen reasoning visible inline on the chain segment.

**The reopen triggers:**

| Trigger | Chain event source | Reopen reasoning surface |
|---|---|---|
| Anjali taps ❌ | `CitizenAckRejected{anjali, reason_category, free_text}` → automatic `IncidentReopened{parent}` | ❌ reasoning inline |
| Priya's confirmation finds contamination hasn't cleared (post-resolution sensor readback shows re-contamination, or chain integrity check fails) | Priya's reopen action → `IncidentReopened{parent, reopen_reason}` | Priya's reasoning inline |
| Silent citizen-ack expiry (Phase 1: 1-hour window) | `CitizenAckWindowExpired` first → routed forward (locked decision #6) → `IncidentReopened{parent, reason: ack_window_expired}` | System-recorded silence as reopen reason |

The reopened incident re-enters **both** Priya's inbox AND Adi's closed-loop queue at the same priority band (locked decision #4). The `REOPENED` chip sorts to the top of the proofs bucket (locked decision #8).

**What Adi does on a REOPENED row:**
1. **Re-reviews Karim's proof first.** Locked decision #4 is explicit — her first action is to look at the existing proof bundle with fresh eyes, not to dispatch anyone. The ❌ reasoning or Priya's reopen reasoning is the question; the proof bundle is the answer.
2. If the proof is genuinely sufficient and the issue is downstream (e.g., Anjali's ❌ was a miscommunication, not a real failure) → she adds a structured `ReReviewAccepted` reasoning field and clicks **Mark resolved** again. This fires the same three chain events (`ProofAccepted` re-fired / `CitizenAckRequested` re-dispatched / `IncidentResolvedByAdmin` re-fired); Anjali gets a fresh ack request.
3. If the proof is genuinely insufficient (new contamination, different problem, scope creep) → she clicks **Escalate back to Karim**. This is the `ProofInsufficient` escalation event (locked decision #4). The structured form is the same as the first-pass escalation, but the `missing` and `needed_by` fields carry forward the reopen context.

**Decision point on REOPENED:** Re-review-first, then re-dispatch if needed. She does not auto-dispatch Karim on a reopen without re-reviewing the proof. The reopen reasoning is the input; her fresh review is the decision; the re-dispatch (or re-mark-resolved) is the output.

**What fires automatically on re-Mark-resolved:** Same three chain events. The reopen lineage is preserved on the chain — every previous `FixSubmitted`, `ProofAccepted`, `CitizenAckRequested`, `IncidentResolvedByAdmin`, `CitizenAckRejected`, `IncidentReopened{parent}` is in the segment. Pia can pull it three months later and see the full arc.

---

## Screen 5 — FieldQueuePage at shift end (ShiftEnd view)

**File path reference:** `web/src/pages/02-adi/ShiftEndPage.tsx` (to be reconciled by Freya)

**What Adi sees:**
- **Queue state summary:** all three buckets empty (or near-empty if she deferred to next shift). "Closed: N · Marked resolved: M · Deferred: K · Escalated: J" — N + M + K + J = the day's incident load.
- **Override rate trend:** her own override rate (per band, per month) trending toward expert-level. False-positive rate (overrides where the verifier disagreed with the band × outcome was bad — feature #23) tracked separately. Phase 1 surface is a small chart; the full auto-generated PHA monthly report is Phase 2 export tooling.
- **Escalation list:** incidents that need Pia's tier-3 attention. Each row carries the chain segment anchor so Pia can pull the context.
- **The certainty that nothing she marked resolved today will reopen tomorrow** — surfaced as a quiet summary line, not as a number. The reopen risk is structural; the post-resolution sensor readback (feature #3) is the early-warning signal. If a reopened incident fires overnight, it surfaces in her morning queue on the next shift (held by Scenario 1's reverse arc + Scenario 4).

**What she does:** Closes her laptop. Walks away.

**Decision point:** None. Shift-end is a view, not a workflow. The override rate trend is a glance, not a dashboard to spelunk through.

**What fires automatically:** A new handover brief is generated for her next shift (light — named open threads only, same shape as Priya's handover brief per feature #13).

---

## End state — handed back to Priya

**Scenario 2 ends here.** The incident is `IncidentResolvedByAdmin{reviewer: adi}` on the chain. Anjali has the citizen-ack notification. Priya's dashboard surfaces the incident under "resolved by admin, awaiting citizen ack + close."

**The close is Priya's, not Adi's.** This is the load-bearing sentence of the scenario. Adi marks resolved; Priya confirms and closes. Goal 3's third beat ("closed") is Priya's; Adi's contribution to Goal 3 is the citizen-ack dispatch.

**Held-state — explicitly NOT in this scenario:**
- Anjali's ✅/❌ tap on the `CitizenAckPage` — **Scenario 3 (Anjali)**.
- Silent citizen-ack expiry → `CitizenAckWindowExpired` → forward routing — **Scenario 3** + system monitor.
- Priya's `IncidentClosed{closer: priya}` action after ✅ — **Scenario 1's reverse arc / close action**.
- `IncidentReopened{parent}` on Adi side — **Scenario 4 (Reopen path)** — but the reopen reasoning and `REOPENED` chip are explicit in Screen 4 above.
- Per-Karim proof-quality trend dashboard — **Phase 1.x addition**, not part of Scenario 2's load-bearing flow.
- Per-Priya verification-depth dashboard — **Phase 1.x addition**.

For Phase 1 demo bar purposes, **Scenario 2 = the verify-proof-and-mark-resolved step**. The chain from Scenario 1's `FixSubmitted` → Adi's `ProofAccepted` / `CitizenAckRequested` / `IncidentResolvedByAdmin` lands cleanly on the chain, the queue reflects it, and the handoff back to Priya's confirmation+close step is structural.

---

## The three queue buckets — what each contains and why the order matters

This sub-section names the locked decision (decision #1) and explains why **overrides first, proofs second, escalations third**, not the reverse.

| Bucket | What it contains | Consequence if delayed | Why this slot |
|---|---|---|---|
| **1 — Overrides awaiting call** | High-band incidents where Adi's override reasoning is the last missing input before dispatch. Trust-band disagree calls. Rare (1–2 per shift typical). | High. An override pending means a tech dispatch is blocked or an existing dispatch is on shaky ground. | **Most consequential** because overrides change the system's call. She handles them before anything else, when her judgment is fresh. Per her "auditor-disposition" trait — she doesn't second-guess others, she makes her own call from the evidence she has. The chain captures her override reasoning as a first-class event (`TrustBandOverridden`). |
| **2 — Proofs awaiting verification** | Karim's `FixSubmitted` packets. Photo + GPS + EXIF + reasoning + post-resolution sensor readback. **REOPENED incidents appear at the top of this bucket with a `REOPENED` chip.** | High. Every proof pending is an Anjali who hasn't been asked yet, a Priya who can't close yet, a ward whose resolution is in limbo. | **The load-bearing close.** This is the volume of her day and the decision she cannot delegate. Her correctness here is more load-bearing than her throughput — a wrong close becomes `IncidentReopened{parent}` and a soft mark on her ledger. |
| **3 — Escalations awaiting decision** | Incidents where Karim's mandate ends before the problem does. Beyond-tech-mandate templates (WASA specialist / PHA on call / councillor / lab). | Lower for Adi; high for the chain segment. Escalations move the incident out of Adi's queue entirely once she triggers them — they are now Pia's tier-3 problem. | **Rare and not her immediacy.** Escalations are judgment calls but not time-critical — the contamination is contained (Karim is on site), and the escalation template means the path is reproducible. She reaches them last in a clean shift. |

**The order is fixed by consequence, not by age.** Older proofs don't bubble above fresh overrides. The system tells her what matters, in the order it matters — addressing the "system can't tell her what matters" negative force (FIA 11) and the "queue tells her what matters" positive force (FIA 14) at the structural level.

**No citizen-ack monitoring bucket.** Locked decision #1 + #3. Once Adi marks resolved, the incident leaves her queue. She does not watch the ack window. She does not nudge Anjali. The silence is structural; the chain records it. Her work is done.

---

## The reopen path — what fires, what she sees, what she does

This sub-section names the locked decision (decision #4) and walks through the reopen arc.

**The reopen triggers** (locked decision #4):

| Trigger | Chain event | Reopen reasoning surface on Adi's `FieldIncidentDetailPage` |
|---|---|---|
| Anjali taps ❌ | `CitizenAckRejected{anjali, reason_category, free_text}` → automatic `IncidentReopened{parent}` | ❌ reasoning inline at the top of the left column |
| Priya's confirmation finds contamination hasn't cleared | Priya's reopen action → `IncidentReopened{parent, reopen_reason}` | Priya's reasoning inline |
| Silent citizen-ack expiry | `CitizenAckWindowExpired` → routed forward → `IncidentReopened{parent, reason: ack_window_expired}` | System-recorded silence |

**Where the reopened incident lands:** Both Priya's inbox AND Adi's closed-loop queue, at the same priority band. On Adi's side, it surfaces in the **proofs bucket** (not as a new fourth bucket, not at the top of all three buckets — locked decision #8), with a **`REOPENED` chip** that sorts it above other proofs in the same band.

**Adi's first action on a reopen: re-review Karim's proof.** Locked decision #4 is explicit. She does not auto-dispatch Karim on a reopen; she does not auto-mark-resolved; she re-reads the proof bundle with the reopen reasoning as the question. This is the structural response to her "auditor-disposition" trait — she makes her own call from the evidence she has, not from the prior decision.

**The decision tree on a reopen:**

| State of proof after re-review | Action | Chain event(s) fired |
|---|---|---|
| **Sufficient** (Anjali's ❌ was a miscommunication, or the issue is downstream of Karim's work) | Click **Mark resolved** with a structured `ReReviewAccepted` reasoning field | `ProofAccepted` re-fired · `CitizenAckRequested` re-dispatched · `IncidentResolvedByAdmin` re-fired |
| **Insufficient** (new contamination, different problem, scope creep) | Click **Escalate back to Karim** with structured fields (what's missing / what we need / ETA) | `ProofInsufficient{reviewer: adi, missing, needed_by, dispatched_back_to: karim}` |
| **Beyond her scope entirely** (the contamination now needs WASA valve shutoff, lab test, councillor notification) | Click **Beyond-tech-mandate escalation** | `EscalationTriggered{path_template, inc, reason, linked_proof}` — row leaves her queue, routes to Pia |

**The reopen returns to Priya's queue when Adi re-marks-resolved.** Same shape as the first-pass: Priya's confirmation step sees the reopen lineage on the chain segment, sees the fresh `IncidentResolvedByAdmin`, and proceeds to confirmation + close (or to her own reopen if contamination still hasn't cleared — Phase 1's structural backstop).

**The reopen lineage is preserved on the chain.** Every event from `FixSubmitted` → `ProofAccepted` → `CitizenAckRequested` → `IncidentResolvedByAdmin` → Anjali's ❌ → `IncidentReopened{parent}` → re-`ProofAccepted` (or `ProofInsufficient`) is in the segment. Pia pulls it three months later and sees the full arc. This is the structural response to Adi's "system defends her, not the other way around" positive force (FIA 13) — the close defends itself.

---

## Force coverage map (Adi's 20 forces — 10 negative + 10 positive)

| # | Force (FIA) | Direction | Addressed in this scenario? | Where in the scenario |
|---|---|---|---|---|
| **−1** | The close that's not real (13) | ❌ | **Yes — central problem.** | Screen 2's three-column layout surfaces every input that justifies the close (photo, GPS, EXIF, post-resolution sensor readback, Karim's reasoning, Priya's verification, Anjali's tap). The "Mark resolved" button is greyed until every input is present. The reopen path (Screen 4) ensures that when the close is wrong, it re-enters Adi's queue with the ❌ reasoning visible — the system supports her correctness, not her speed. |
| **−2** | Karim can't do more (12) | ❌ | **Yes — escalate back to Karim is first-class.** | Screen 2 right column: "Escalate back to Karim" with structured fields (what's missing / what we need / ETA). Fires `ProofInsufficient`. The chain captures Karim's bandwidth as a structural data point, not as a hidden assumption. |
| **−3** | Anjali doesn't tap (11) | ❌ | **Yes — no nudge action, structural silence capture.** | Locked decisions #1 + #3 + #9. No citizen-ack monitoring bucket on Adi's surface. The dispatch of `CitizenAckRequested` is a one-shot system action. Silence is captured as `CitizenAckWindowExpired` and routed forward; it does not compete for Adi's attention. |
| **−4** | Trust-band override that goes wrong (12) | ❌ | **Yes — override is structured, reasoning is auditable.** | Screen 2 right column: "Override trust band" with structured reasoning (from_band, to_band, reason_category dropdown, one-line free text). Fires `TrustBandOverridden`. The reasoning is the defence. Feature #29 (trust-band override structured reasoning surface) is the mechanism. |
| **−5** | Escalation that has nowhere to go (11) | ❌ | **Yes — beyond-tech-mandate templates.** | Screen 2 right column: "Beyond-tech-mandate escalation" with template picker (WASA specialist / PHA on call / councillor / lab). Templates surface from prior incidents, not invented. Fires `EscalationTriggered`. Feature #17 (first-class escalation event + escalation path templates) is the mechanism. |
| **−6** | Karim's proof keeps being weak (11) | ❌ | **Partially — trend dashboard is Phase 1.x.** | Screen 2's "Escalate back to Karim" captures the pattern data structurally (each `ProofInsufficient` is a chain event). The per-Karim proof-quality dashboard (feature #26) is a Phase 1.x addition — out of Scenario 2's load-bearing flow. |
| **−7** | Priya's verification is thin (10) | ❌ | **Partially — trend dashboard is Phase 1.x.** | Same as −6. Each `Verified{inc, reasoning}` from Priya is on the chain segment Adi reads; trend dashboard (feature #27) is Phase 1.x. Within Scenario 2, the structural response is that Priya's reasoning is required input on the left column of Screen 2 — if it's missing, "Mark resolved" stays greyed. |
| **−8** | Chain captures too much (10) | ❌ | **Yes — structured reasoning, no essays.** | Screen 2's right column: every decision path uses structured fields (dropdowns, short free-text, reason categories). Feature #22 (decision-capture structured field enforcement) is the mechanism. Per Adi's "auditor-disposition" trait, the capture is structured, not surveillance. |
| **−9** | System can't tell her what matters (11) | ❌ | **Yes — three pre-ranked buckets.** | Screen 1's three buckets (overrides → proofs → escalations) are pre-ranked by consequence. Feature #18 (pre-ranked closed-loop queue) is the mechanism. Morning starts with the action list, not the flat inbox. |
| **−10** | Tech mandate ends before problem does (11) | ❌ | **Yes — same as −5.** | Screen 2 right column "Beyond-tech-mandate escalation" — fires `EscalationTriggered`, row leaves Adi's queue. |
| **+1** | The close that's verifiable (15) | ✅ | **Yes — primary force, central to the scenario.** | Screen 2: every input that justifies the close is in one view (photo + GPS + EXIF + sensor readback + Karim reasoning + Priya verification). "Mark resolved" is greyed until every input is present. Feature #5 (resolution-proof bundle viewer) is the load-bearing surface. |
| **+2** | Karim's proof is reliably good (13) | ✅ | **Yes — steady-state response.** | Screen 2's "Mark resolved" path is the steady state — Karim's proof lines up, click once, three chain events fire. Adi's verification is fast because the proof is solid. Feature #26 trend dashboard (Phase 1.x) surfaces the reliability. |
| **+3** | Priya's verification is reliably deep (12) | ✅ | **Yes — required input on left column.** | Screen 2 left column: Priya's verification reasoning (`Verified{inc, reasoning, signals_state, path}`) is a required input before "Mark resolved" enables. If Priya's reasoning is thin, the row stays greyed — the system surfaces the gap structurally. |
| **+4** | Anjali taps back promptly (12) | ✅ | **Yes — chain-recorded, no monitoring queue.** | Locked decision #1: once Adi marks resolved, the incident leaves her queue. Anjali's promptness is her own; Adi's work is done. The chain records her ✅ as the audit signal that the close was real. |
| **+5** | Escalation path is clear (12) | ✅ | **Yes — templates surface from prior incidents.** | Screen 2 right column "Beyond-tech-mandate escalation" — templates (WASA specialist / PHA on call / councillor / lab) surface from prior incidents. Feature #17 (first-class escalation event + escalation path templates) is the mechanism. |
| **+6** | Chain supports her judgment (12) | ✅ | **Yes — every decision captured with structured reasoning.** | Screen 2's structured reasoning fields (per path) are the support surface. Per Adi's "trusts the chain as her evidence ledger" trait — every input to her decision is on the chain, and she can pull the segment at any moment. Feature #22 (structured field enforcement) keeps the capture light. |
| **+7** | Queue tells her what matters (14) | ✅ | **Yes — three pre-ranked buckets by consequence.** | Screen 1's three buckets (overrides → proofs → escalations) — fixed order, not by age. Feature #18. The morning starts with the action list. |
| **+8** | Override rate trends toward expert-level (11) | ✅ | **Yes — shift-end trend.** | Screen 5: shift-end override-rate trend (her own false-positive/false-negative rate). Feature #23 (trust-band distribution chart with historical override rate per band) + feature #11 (per-actor SLA + override reasoning dashboard) surface the trajectory. |
| **+9** | System defends her, not the other way around (13) | ✅ | **Yes — three months later, the chain segment speaks.** | Screen 2's structured reasoning + chain-anchored events mean that when Pia reviews three months later, the close's context surfaces automatically — sensor showed X, Karim submitted Y, Anjali tapped Z, Priya closed it. Adi doesn't defend; the close defends itself. |
| **+10** | Citizens get acknowledged even when she can't close fast (12) | ✅ | **Yes — citizen-ack dispatch is decoupled from her throughput.** | Locked decision #3: `CitizenAckRequested` fires on Mark-resolved submit, not on Adi's continued attention. The ack pipeline runs on automation. Goal 3 (citizens feel heard) is preserved even when Adi's proofs queue is heavy. |

**Forces not addressed in this scenario, and where they carry:**
- **−6 (Karim's proof keeps being weak) and −7 (Priya's verification is thin)** — partially addressed via required-input check on Screen 2; the per-actor trend dashboards (features #26 + #27) are Phase 1.x additions.
- **Cross-cutting: chain captures too much (+8/−8), system defends her not the other way around (+9)** — partially Scenario 2, partially Scenario 6 (audit chain) and the system-wide chain contract. Scenario 2 covers the per-decision structured-field response; the system-wide audit chain view (per-incident audit timeline, chain head, block hash) is Scenario 6.

---

## Design log

**Produced by Saga/Freya — 2026-09-10**

**Source links:**
- [Product brief](../A-Product-Brief/product-brief.md)
- [Trigger map](../B-Trigger-Map/00-trigger-map.md)
- [Adi persona](../B-Trigger-Map/05-persona-adi-the-auditor.md)
- [Priya persona](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) (for the close-side handoff back to her)
- [Feature impact](../B-Trigger-Map/feature-impact.md)
- [Visual direction](../A-Product-Brief/visual-direction.md) (trust-band palette only — T1/T2/T3 referenced, not redefined)
- [Scenario 01 — Priya's shift](01-priya-the-pipeline-pilot-triage-verify-assign.md) (handoff continuity — Adi's entry event is Karim's `FixSubmitted` from Scenario 1's assignment)