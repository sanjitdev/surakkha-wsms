# Scenario 04 — Karim's shift: Acknowledge, diagnose, fix, submit proof (field lane)

**Phase:** 2 — UX Scenarios
**Archetype:** Karim the Technician (field lane; WASA technician; action-oriented, evidence-led, capacity-burdened, on a phone with intermittent connectivity)
**Instance count:** Many in Phase 1 (every WASA technician who accepts Surakkha field work uses this surface); the trigger map counts them structurally through Priya and Adi's persona references
**Goal served:** G1 (loop is reproducible — Karim's on-site work is the loop's middle act, direct) · G2 (loop is defensible — the proof bundle is the evidence surface, direct, primary) · G3 (citizens feel heard in motion — indirect; Karim's `TechnicianArrived` is one of Anjali's in-progress beats)
**Persona link:** This scenario authors Karim's surface explicitly because Karim is **not a primary persona in the trigger map** — he is the *implicit* field worker referenced in Priya's assignment handoff (Scenario 1) and Adi's proof-verification handoff (Scenario 2). Adi's positive force **"Karim's proof is reliably good" (FIA 13)** lives or dies on this surface. His negative inverse — *"Karim's proof keeps being weak" (FIA 11, Adi's negative)* — also lives here, as does *"Karim can't do more" (FIA 12)* and the surface response to *"Tech mandate ends before problem does" (FIA 11)*.
**Feature link:** **#5 — Resolution-proof bundle viewer (photo + GPS + EXIF + sensor readback + reasoning)** ([feature-impact.md](../B-Trigger-Map/feature-impact.md)) is the load-bearing feature Karim is *producing* data for. This scenario addresses the field-side creation of feature #5's inputs (photo + GPS + EXIF + reasoning + sensor readback reference). It depends on **#3 — Post-resolution sensor readback verification** (readback captured after `FixSubmitted`) and supports **#4 — Structured per-decision reasoning capture** (Karim's reasoning lands on the chain at submit). Reopen path addresses **#26 — Per-Karim proof-quality trend dashboard** via the `reopened: true` flag on the chain event (the trend dashboard itself is Phase 1.x). Offline behavior addresses **#32 — Offline-queue status indicator** pattern (reused on the field surface).

**Handoff continuity (read this first):**
- **Entry event from Scenario 1 (Priya, Screen 4 submit):** Priya's combined `Verified` + `Assigned{operator: karim, due_at, priority}` fires. The assignment notification lands on Karim's device. **Karim's queue is born from Priya's dispatch.** Scenario 1 ends at "assigned to Karim, awaiting tech on-site." Karim's `Acknowledged{by: karim}` is the first chain event this scenario authors.
- **Exit event back to Scenario 2 (Adi, FieldQueuePage proofs bucket):** Karim's `FixSubmitted` (with the proof bundle) is the input packet that lands on Adi's proofs bucket. **Adi's `ProofAccepted` is what happens after Karim exits this scenario.** Scenario 2 opens with "Karim's `FixSubmitted` event is the entry event from Priya's assignment." Karim's `ProofSubmitted` is the final chain event this scenario authors; the queue clears, the incident routes to Adi.
- **Anjali's status timeline (Scenario 3) threads `TechnicianArrived`:** Anjali's screen shows Karim's `TechnicianArrived` as one of her in-progress beats ("মাঠ কর্মী পৌঁছেছে / Field worker arrived"). The status events Karim fires (`Acknowledged`, `TechnicianArrived`, `DiagnosisSubmitted`, `FixSubmitted`, `ProofSubmitted`) surface on Anjali's phone in Bangla. Karim's surface does not display Anjali's report back to him; the timeline on the operator side is what gives him context.

---

## Header — locked decisions for this scenario

> **Confirmed by user before scenario writeup. Locking these so Freya reconciles against them, not against an interpretation:**
>
> 1. **Karim's queue is assignments-only, distinct from Adi's closed-loop queue.** Sorted by `due_at` first, then priority within `due_at`. Top row = what he needs to act on *now*. He does NOT see the action lane queue (Priya's inbox) or the decision lane queues (Adi's overrides / proofs / escalations buckets). His surface is field lane, full stop.
> 2. **Priority band colour visible to Karim.** T1/T2/T3 colour-coded on each queue row by trust-band tier (verification state) — T1 unverified (divider neutral), T2 verified (amber), T3 issuance (alert-red-reserved — only visible if a consumer-notice has been issued, which is rare in operator UI). He's an action lane (not a decision lane), but the colour cue helps him triage under load. The colour is the trust-band tier, NOT the reporter-badge source. He does NOT override or reason about bands; he just sees the colour.
> 3. **Full offline mode for Karim's surface.** Queue cached locally, photos queued locally, form submissions deferred, sync on reconnect with conflict resolution by timestamp + chain hash. Diagnosis form is offline-tolerant at minimum; the whole surface works offline. The system defends against network failure mid-shift.
> 4. **Each row in the queue exposes the assignment context inline:** incident id + ward + address, priority band, time since assignment + `due_at` countdown, reporter context (Anjali name + anchor flag, OR hotline caller info + phone + language preference), original report (text + photo + voice), Priya's verification reasoning (full text), and pre-arrival sensor prep (nearest sensors + current readings + 24h trend chart).
> 5. **Two pre-arrival actions per row:** `Acknowledged{by: karim}` (fires immediately on tap) and `TechnicianArrived` (fires when GPS confirms within 50m of incident pin, OR manual "I'm here" tap if GPS is unreliable in a pump-house / indoor location).
> 6. **Three submission events, separate forms, distinct chain event types:** `DiagnosisSubmitted`, `FixSubmitted`, `ProofSubmitted`. Same offline-tolerant form pattern (photos + voice + text + GPS), but each has its own semantic.
> 7. **Proof bundle is the load-bearing submission.** Five fields, fields 1–4 REQUIRED (submit button greyed until present), field 5 OPTIONAL but encouraged — see proof form detail below.
> 8. **Karim's view of `FieldIncidentDetailPage` is distinct from Adi's.** Three sections: (1) operator reasoning + original report + hotline caller info; (2) sensors in area with mini-map + current readings + 24h trend; (3) his actions timeline — diagnosis, fix, proof — each a separate step with its own form.
> 9. **Post-submit state: queue clears.** After `ProofSubmitted`, the incident leaves Karim's queue and routes to Adi's `ProofAwaitingVerification` bucket (Scenario 2's proofs bucket). Karim sees a confirmation: "Proof submitted. Your role on this incident is complete."
> 10. **Reopen path with structured feedback VERBATIM.** When the incident comes back to Karim as `IncidentReopened{parent}` → `ProofInsufficient` from Adi, Karim sees Adi's structured feedback verbatim (`what's missing`, `what we need`, `ETA expectation`). No translation layer. He re-submits a stronger proof bundle only (no need to redo diagnosis or fix). Same form, same chain event type, with `reopened: true` flag.
> 11. **Karim's actions are action-lane — terse copy, no citizen-trust narrative.** Per `content-language.md`, his surface uses short imperative copy ("Acknowledge," "Mark arrived," "Submit diagnosis"). No calm-tone reassuring language; he's not the citizen-facing surface. Operator UI stays English-first in Phase 1 (per `content-language.md` §Language Strategy); Karim's form labels and CTAs are English.

---

## Entry point & emotional state

**Entry screen:** LoginPage (employee credentials, not NID-bound; WASA technician login).
**Trigger (continuity from Scenario 1):** Priya's `Assigned{operator: karim, due_at, priority}` lands on his device at the moment of dispatch (paired with her `Verified` event from Scenario 1, Screen 4). The assignment notification is the wake event — but Karim may not be looking at his phone. **FieldQueuePage is his real entry point at shift start.**
**Shift start state:** His queue loads from local cache (offline-first). If he has open assignments from the previous shift that didn't end with a submitted proof, they're at the top — still his responsibility until he closes them with a `FixSubmitted` + `ProofSubmitted` or a `ProofInsufficient` triggers a redispatch.
**Handover brief:** Light. Headline counts: "open: N · due in <30 min: M · overdue: K." Not a narrative; just the action list.

**Internal state:** Working under load. Capacity-burdened. Intermittent connectivity on a phone in a pump-house or alleyway. **Bold dominant emotions: action-oriented, evidence-led, time-pressured patience.** He is not in front of a desktop; he is on a phone, one-handed, often in sunlight, sometimes in a basement. He is not a typist; he taps and points.

**His fear:** *"The proof that gets rejected."* A rejected proof bundle is wasted field time and a soft mark on his ledger. He submitted the photo, the GPS, the reasoning — and it came back insufficient. He now has to do the field trip again with the same answer. That's the failure mode his surface exists to prevent.

**What he does NOT see:** Priya's inbox. Adi's queue. Anjali's tap-back queue (until he reaches the `ProofSubmitted` step — then he knows it's her who confirms). The chain explorer (Pia's surface). Operator-internal reasoning captures (`Verified`, `DeferRequested`, `EscalatedToPia`, `HotlineIntakeReceived`, `TrustBandOverridden`, `EscalationTriggered`, `LoginSucceeded`). He sees his queue, his assignment context, and his own action timeline.

---

## Threading the handoff in from Scenario 1 (the entry event)

At the moment Priya clicks **Submit verify + assign** on her `InboxDetail` right column (Scenario 1, Screen 4), four downstream events fire in one submit:

1. `Verified{inc, reasoning, signals_state, path}` on the chain.
2. `Assigned{inc, operator: karim, due_at, priority}` on the chain.
3. The in-progress signal to Anjali's phone (Bangla SMS, Goal 3 middle beat).
4. The assignment notification to Karim's device.

**Karim's surface receives event #4.** If the app is closed, the notification fires as a system-level push with the incident id, ward, priority colour, and `due_at` countdown. If Karim taps the notification, it deep-links into `FieldIncidentDetailPage` for that incident (load-bearing context: the row he's about to act on). If he opens the app cold, the row is at the top of his queue (locked decision #1: sorted by `due_at` first, then priority).

**The assignment context is pre-loaded.** Karim does not have to look anything up. By the time he opens the row, his surface already carries:

- **Incident id** (mono font, copy-to-clipboard per visual-direction.md)
- **Ward + address** (the pin location, with a mini-map showing the pin and his current GPS — to plan the route)
- **Priority band** (T1/T2/T3 colour — locked decision #2)
- **Time since assignment + `due_at` countdown** (small clock chip — changes colour as `due_at` approaches and after it passes)
- **Reporter context:**
  - If the report came from Anjali: her display name + anchor reporter-badge chip (`Anchor` Lucide icon, `--color-reporter-anchor` chip). The chip is the `reporter_kind: anchor` source attribute, NOT a trust-band tier — Anjali's incident can be at T1 unverified or T2 verified regardless of the anchor chip. He does not see her reputation score or any tier math.
  - If the report came from the hotline (Priya's `HotlineIntakeModal` from Scenario 1, Screen 3): the caller's hashed phone reference + caller's described symptom + caller's ward + proximity-to-sensor answer + caller's language preference (for his on-site courtesy). The hotline reporter-badge chip (`Phone` Lucide icon, `--color-reporter-hotline`) surfaces next to the caller info — this is the source attribute. Hotline-sourced incidents default to T1 (unverified) because they have no verification signals; the hotline reporter-badge is the source, not the band.
- **Original report** (text + photo + voice note — verbatim, EXIF preserved, no re-encode per visual-direction.md "real evidence only"). Photo viewer with EXIF strip; voice note plays back.
- **Priya's verification reasoning** (the full text she captured at the moment of dispatch — from her right column's reasoning field per Scenario 1, Screen 4). This is load-bearing for Karim's on-site context; she tells him what she saw, what was missing, and why she assigned him anyway (the audit-defensible "why" is his briefing).
- **Pre-arrival sensor prep:** nearest sensors + current readings + a 24h trend chart (mini, inline). See the Pre-arrival sensor prep sub-section below.

Karim reads this in 60–90 seconds before he gets on his motorbike. The same context stays with him on `FieldIncidentDetailPage` when he opens the row.

---

## Screen 1 — LoginPage → FieldQueuePage

**File path reference (login):** `web/src/pages/00-shared/LoginPage.tsx` (per FE-1 spine; auth mechanism placeholder per product-brief gap row — Karim's login is employee credentials, NOT NID-bound).
**File path reference (queue):** `web/src/pages/02-karim/FieldQueuePage.tsx` (to be reconciled by Freya)

**What Karim sees on `FieldQueuePage`:**

A pre-ranked list of his open assignments, sorted by `due_at` first, then priority within `due_at` (locked decision #1). **The top row is what he needs to act on now.** Each row carries:

- **Incident id** (mono, copy-to-clipboard)
- **Ward + address** (one line)
- **Priority band** (T1 / T2 / T3 colour-coded chip by trust-band tier — T1 unverified divider, T2 verified amber, T3 reserved alert-red — locked decision #2; NOT a source-attribute colour)
- **Time since assignment + `due_at` countdown** (small clock chip, colour-shifts toward warning at `due_at − 10 min`, past `due_at` shows as "OVERDUE")
- **Reporter name + reporter-badge chip** (anchor chip with `Anchor` Lucide icon, OR hotline chip with `Phone` Lucide icon, OR no chip for plain webform; the chip is the `reporter_kind` source attribute, NOT the trust band)
- **Status chip:** one of `NEW` / `ACKNOWLEDGED` / `EN_ROUTE` / `ON_SITE` / `DIAGNOSED` / `FIXED` / `AWAITING_PROOF` / `REOPENED` — Karim's surface state, distinct from the chain event types

**TopChrome (48 px, persona-adapted):** brand + chain-status pulse-dot on the left; persona chip + locale-globe + theme toggle on the right. Same shared TopChrome as Priya's and Adi's surfaces per visual-direction.md.

**Sidebar (4 items, persona-aware per visual-direction.md):** My queue (this page), Sync status (offline-queue indicator + last sync timestamp), Shift log (his own action history, anchored to chain refs), Settings / logout.

**Sync status chip:** A persistent chip on the queue page — green when online, amber when syncing, grey-red when offline. Tapping the chip opens a small "Sync status" sheet showing: last successful sync timestamp, number of events queued locally, number awaiting chain confirmation. This is the **structural response to intermittent connectivity** (locked decision #3) — Karim always knows what's synced and what's pending.

**What he does:**
1. Authenticates.
2. Skims the three counts (open / due-in-30 / overdue) — his handover brief.
3. Picks the top row. The top row is the next decision.
4. Taps **Acknowledge** on the row if he's just received the assignment — `Acknowledged{by: karim}` fires immediately on tap, no chain call needed before the chain confirms (chain confirmation happens on next sync). The status chip flips to `ACKNOWLEDGED`.

**Decision point at the row level:** Three paths per row —
- **Tap Acknowledge** (fires `Acknowledged{by: karim}` — light, no form).
- **Open for diagnosis** (the row opens into `FieldIncidentDetailPage` — Screen 2 — where the three-step actions timeline lives).
- **Mark arrived when on site** (`TechnicianArrived` fires; status chip flips to `ON_SITE` — see locked decision #5).

**Action-lane copy.** Per locked decision #11, Karim's copy is terse. The buttons read **"Acknowledge"** / **"Mark arrived"** / **"Open"** — short imperatives. No "Dear technician, please review the assignment context" framing. He's working under load; the copy is the verb.

**What fires automatically on Acknowledge:**
- `Acknowledged{by: karim, inc, acknowledged_at}` lands on the chain.
- The status chip flips to `ACKNOWLEDGED`.
- An SMS notification is dispatched to Anjali's phone (Bangla, in-progress beat — Goal 3.2).
- The `due_at` countdown chip persists; approaching `due_at − 10 min` shows the SLA-warning colour.

**What fires automatically while he works the queue:**
- New assignments may land from Priya's dispatch. They appear at the top of the ranked queue (sorted by `due_at`).
- `IncidentReopened{parent}` rows surface at the top of the queue with a **`REOPENED`** chip (same chip as Adi uses on her reopen rows). The Adi's `ProofInsufficient` feedback is visible inline on the row.

---

## Screen 2 — FieldIncidentDetailPage (the three-section assignment context + actions timeline)

**File path reference:** `web/src/pages/02-karim/FieldIncidentDetailPage.tsx` (to be reconciled by Freya; distinct from Adi's version per locked decision #8)

**Opened from:** Any row in the FieldQueuePage. `REOPENED` rows route here with Adi's reopen reasoning visible at the top of the left section.

**Layout (locked decision #8) — three sections, vertically stacked on mobile:**

### Section 1 — Operator reasoning + original report + hotline caller info

| Element | Content |
|---|---|
| **Incident id** | Mono, copy-to-clipboard |
| **Ward + address** | One line; mini-map preview; tap to expand full map |
| **Priority band** | T1/T2/T3 chip (coloured by trust-band tier: T1 unverified divider, T2 verified amber, T3 reserved alert-red) |
| **Time since assignment + `due_at` countdown** | Live chip |
| **Reporter context** | Anjali: name + anchor reporter-badge chip (`Anchor` Lucide icon). Hotline: hashed phone ref + described symptom + language preference + hotline reporter-badge chip (`Phone` Lucide icon). The chip is the `reporter_kind` source attribute, not the trust band. |
| **Original report** | Verbatim text (Anjali's "what" field, or caller's description) + photo (with EXIF strip viewer) + voice note (play button). |
| **Priya's verification reasoning** | Full text from her right column at dispatch. Verbatim. The "why anyway" reasoning (per Scenario 1 Path B or Path C) is here if it was a B/C-path assignment. |
| **Path badge** | Path A / B / C / D from Scenario 1's verification — Karim knows what shape the call was. |

### Section 2 — Sensors in area (pre-arrival sensor prep)

See the dedicated Pre-arrival sensor prep sub-section below. This is the second structural response to Adi's "Karim's proof is reliably good" force — Karim arrives knowing what the sensor shows.

### Section 3 — Karim's actions timeline (the three-step load-bearing workflow)

A vertical timeline of Karim's three submissions, each a separate step with its own form. He progresses top-down through:

| Step | Status | Form | Submit button text | Chain event fired |
|---|---|---|---|---|
| **Step 1 — Diagnosis** | `NEW` / `ACKNOWLEDGED` / `EN_ROUTE` / `ON_SITE` → after submit: `DIAGNOSED` | Diagnosis form (see below) | **"Submit diagnosis"** | `DiagnosisSubmitted{inc, ...}` |
| **Step 2 — Fix** | `DIAGNOSED` → after submit: `FIXED` | Fix form (see below) | **"Submit fix"** | `FixSubmitted{inc, ...}` |
| **Step 3 — Proof** | `FIXED` → after submit: queue clears | Proof form (see below) | **"Submit proof"** | `ProofSubmitted{inc, ...}` |

Each step is gated by the previous one. The next step's form is locked greyed until the previous submits (offline-tolerant forms — see Offline behaviour sub-section).

**What Karim sees as he progresses:**
- Step 1 form opens as soon as he taps "Submit diagnosis" (Step 1 collapsed by default; expandable inline).
- After `DiagnosisSubmitted`, Step 2 form opens. Step 1 collapses to a summary view ("Submitted at HH:MM. [Reasoning text]. [Photo thumb]. ▶ View chain event"). Step 2 expands.
- After `FixSubmitted`, Step 3 form opens. Step 2 collapses. Step 3 expands.
- After `ProofSubmitted`, all three steps collapse to summary views. A confirmation state replaces the timeline (see Screen 3 / End state).

**Decision point at this screen:** Which step he's on. The next-step button is always at the bottom of the open form. There's no "save draft" — forms are short enough that draft is friction (same logic as Anjali's `SubmitForm`, but for an action-lane user who values speed over safe-drafting).

**What fires automatically on each step's submit:**
- The chain event lands with Karim's `prev_block_hash` linking (same-tenant, AD-1 binding).
- The SMS to Anjali's phone fires (in-progress signal — Goal 3.2 — one per step).
- The status chip on the FieldQueuePage row updates.
- If offline, the event is queued locally and fires on reconnect (locked decision #3).

---

## Screen 3 — FieldIncidentDetailPage post-`ProofSubmitted` state (queue clears)

**What Karim sees after `ProofSubmitted`:**

The three-step timeline collapses to summary views. The page top carries a confirmation banner — short, action-lane copy:

> **"Proof submitted. Your role on this incident is complete."**

Below the banner, three collapsed summaries (one per step), each with a `▶ View chain event` link to the per-incident audit timeline (forensically verifiable, mono font, copy-to-clipboard).

**What he does:** Reads the confirmation, moves to the next assignment. The row is gone from his queue (locked decision #9 — post-submit, queue clears). On `FieldQueuePage` back-navigation, the next top row is the assignment he needs to act on now.

**Decision point:** None. The proof is submitted; Adi has it. **Karim's role on this incident is complete.**

**What fires automatically:**
- `ProofSubmitted{inc, by: karim, ...}` lands on the chain (signature chains Karim's `prev_block_hash` to Priya's `Assigned` and Adi's `ProofAwaitingVerification` event, which fires next as the routing marker — see Scenario 2's entry.
- The incident's `state` flips to `ProofAwaitingVerification` (system-internal, surfaces on Adi's bucket).
- The row leaves Karim's queue.
- A confirmation toast: "Proof submitted. ✅" (Toast primitive per visual-direction.md, DURATION_MS=4000, role=status, hover-pause).

---

## The three submission forms (sub-section)

All three forms share the same offline-tolerant form pattern (same input controls, same queue-locally-when-offline behaviour, same sync-on-reconnect UX). What differs is the **field set, the chain event type, and the semantic**.

| Form | When it opens | Required fields | Optional fields | Chain event type | Submit button copy |
|---|---|---|---|---|---|
| **Diagnosis** | When Step 1 expands (initial entry into FieldIncidentDetailPage; or after `TechnicianArrived`) | Diagnosis summary text (short) · Photo of the diagnosis (camera-only; EXIF preserved) | Voice note (30s) · Sensor reading observed on site (manual entry if visible) | `DiagnosisSubmitted{inc, summary, photo_ref, voice_ref?, sensor_reading_observed?, gps, device_clock, by: karim, submitted_at}` | **"Submit diagnosis"** |
| **Fix** | After `DiagnosisSubmitted` confirms (Step 2 expands) | Fix description text (short) · Photo of the fix-in-progress (camera-only; EXIF preserved) · GPS confirmation (auto-captured, must be within 50m of incident pin — outside radius warns but does not block) | Voice note (30s) · Parts / materials used (short free text) | `FixSubmitted{inc, description, photo_ref, gps, gps_warning?, voice_ref?, parts?, device_clock, by: karim, submitted_at}` | **"Submit fix"** |
| **Proof** (load-bearing) | After `FixSubmitted` confirms (Step 3 expands) | See proof form structure below (5 fields; 1–4 required) | See field 5 below | `ProofSubmitted{inc, ...}` | **"Submit proof"** |

**Karim's voice in each form:** Short, terse, action-led. He writes what he did and why, not a narrative. The form's textarea placeholder is an active verb: *"What did you find?"* / *"What did you fix?"* / *"Why should this resolve?"*

**Three separate submissions, three separate chain events.** The forms are not batched. Each is a single decision Karim makes at a specific moment — the diagnosis is what he found on arrival; the fix is what he did; the proof is what he wants Adi to close on. Combining them would lose the granularity that lets Adi's verification step (Scenario 2) reason about each input.

---

## The proof bundle — field-by-field (the load-bearing submission)

| # | Field | Required? | Input | Validation |
|---|---|---|---|---|
| 1 | **Photo of the fix** (post-fix state) | **REQUIRED** | Camera-only capture. EXIF preserved verbatim (not stripped — per visual-direction.md "real evidence only"). | Submit button greyed until a photo is attached. EXIF must include GPS + timestamp; if missing, a "Photo missing location data — retake?" warning surfaces but does not block. |
| 2 | **GPS confirmation** (auto-captured) | **REQUIRED** | Auto-captured at the moment of submit. Backend compares to the incident pin. | Submit button greyed until GPS is captured. If GPS is outside the 50m radius of the incident pin, the form **warns but does not block** (locked decision #7 — GPS drift / indoor location). The warning is captured on the chain as `GPWWarned: true` flag. |
| 3 | **Voice note** (Bangla: fix description + why it should resolve) | **REQUIRED** | 30-second recording with a waveform visual. Speech-to-text on (server side); the resulting text lands in field #4 as an editable draft. Raw audio stored verbatim. | Submit button greyed until the voice note is recorded. Recording must be ≥3 seconds. |
| 4 | **Reasoning text** (what he did + why contamination should clear) | **REQUIRED** | Short free-text field (≤280 characters — same as Anjali's "what" budget for parity). Defaults to the speech-to-text draft from field #3; Karim edits. | Submit button greyed until text is present and ≥10 characters. |
| 5 | **Sensor readback reference** (optional but encouraged) | **OPTIONAL** | Nearest sensor's current reading if Karim checked it on site. Manual entry (he reads it off his phone or the on-site display if there is one). | If sensor reading suggests contamination has NOT cleared, the form carries a soft warning: *"Sensor reading still elevated — re-check or escalate?"* with two paths: "Submit anyway with note" or "Mark for escalation." This is the field-layer backstop for "the fix didn't actually fix it." |

**Field 5 as the structural response to "the resolution that doesn't resolve":** Per Priya's negative force (−3, FIA 13) and Adi's "Karim can't do more" negative force (−2, FIA 12), the proof form gives Karim one chance to surface "this didn't actually clear the contamination" before he submits. The soft warning is a nudge, not a block; he can submit anyway if he believes the sensor is wrong (e.g., drift, calibration lag), but the warning is captured on the chain as `SensorReadbackFlagged: true`.

**Submit fires:** `ProofSubmitted{inc, photo_ref, gps, gps_warning?, voice_ref, reasoning_text, sensor_readback?, sensor_flag?, device_clock, by: karim, submitted_at, reopened: false}` (the `reopened` flag is `false` on first-pass submissions, `true` on redispatches — see Reopen path sub-section).

---

## Offline behaviour (sub-section)

**The whole surface works offline. No caveat. Karim is on a phone in a pump-house.**

| Capability | Offline? | Behaviour |
|---|---|---|
| **Queue view** | ✅ Yes | Cached locally at last successful sync. The full sorted list renders. Status chips show last-known state. New assignments that arrived while offline are not visible until sync; pending ones are queued. |
| **Form fill (Diagnosis, Fix, Proof)** | ✅ Yes | All three forms are openable and fillable offline. The "submit" button is not greyed by offline state — only by missing required fields. Local queue accepts the submission immediately and tags it "PENDING_SYNC." |
| **Photo capture** | ✅ Yes | Camera input works offline. Photos are stored on-device in the local submission queue, compressed to a reasonable size (not full-EXIF-aware in the queue UI, but the original EXIF is preserved when the sync fires and the photo reaches the gateway). |
| **GPS capture** | ✅ Yes | Device GPS works offline. Auto-captured at submit. Synced with the submission. |
| **Voice capture** | ✅ Yes | Microphone works offline. Audio stored locally with the submission. |
| **Pre-arrival sensor readings** | ⚠️ Cached snapshot only | The 24h trend chart + current reading are a snapshot from last successful sync. If Karim is offline at the moment he opens the row, the chart shows the latest data the phone had, with a "Last sync: HH:MM" caption. He does NOT see live data while offline. The soft warning in field #5 of the proof form uses the cached value. |
| **Acknowledge / Mark arrived** | ✅ Yes | Fires locally; syncs on reconnect. |
| **Incoming assignments (from Priya)** | ⚠️ Queued | New assignments dispatched by Priya while Karim is offline are queued at the gateway; they land on his phone at next sync. Karim does NOT see them in real-time while offline. |
| **Chain event confirmation** | ❌ Deferred | Each submission gets a local event id on submit. The chain `prev_block_hash` link is computed on sync, not at submit time. Karim sees the local id ("Submission #abc — pending sync") until the gateway confirms; at that point, the id is replaced with the chain block hash (mono font, copy-to-clipboard). |

**Conflict resolution — timestamp + chain hash:**
- Karim's local queue is sorted by local-clock submit timestamp.
- The gateway computes chain ordering by `prev_block_hash` + server-clock ingestion timestamp.
- If Karim submits two `Acknowledged` events for the same incident from two devices (rare — he has one phone, but the system is defensive), the gateway keeps the first by `prev_block_hash` and the second is logged as `DuplicateAcknowledged{by: karim, inc}`.
- If Karim submits a `DiagnosisSubmitted` for an incident that the gateway considers closed (e.g., Priya's `DeferRequested` or `EscalatedToPia` fired in between), the gateway surfaces an `IncidentStateConflict{inc, karim_submission, gateway_state_at_sync}` reconciliation event; Karim sees a sync-conflict toast on his next online session and the per-incident audit timeline surfaces both events with timestamps.

**Sync UX on reconnect:**
- On reconnect (the network-state listener fires `online`), Karim's queue automatically begins syncing. **Sync is silent in the background** unless there's a conflict.
- A persistent toast appears top-right ("Syncing N events…"), lasting until sync completes.
- The Sync status chip on `FieldQueuePage` shifts from grey-red (offline) → amber (syncing) → green (online). The shift is visible; the toast is informational, not blocking.
- **No blocking modals.** Karim does not wait for sync to continue working. His forms are open during sync; new submissions queue locally and sync in their own turn.
- On sync completion, a confirmation toast: "All events synced ✅" (or "Sync complete — N conflict(s), see [Sync log]").

**The `PendingSync` chip on a row:** While a row has submissions waiting to sync, the row status chip carries a small `PENDING_SYNC` indicator. Once the gateway confirms, the indicator disappears and the chain block hash appears on the row.

---

## Pre-arrival sensor prep (sub-section)

**Why this matters for his decision-making once on-site:**

Karim is a WASA technician with technical knowledge of what NTU, conductivity, and chlorine_residual readings mean for a contamination event. He doesn't need the readings interpreted; he needs the readings **in his hand before he gets there**, so he can:

- Plan the route with a hypothesis (e.g., "high NTU at the upstream sensor suggests the contamination is upstream of where Anjali reported — I should bring the upstream shutoff tools").
- Cross-check Anjali's report against sensor data (does her "foul smell" match what the sensor shows?).
- Calibrate his own assessment ("the sensor says chlorine_residual is dropping — that's consistent with a leak, not a source contamination — my diagnosis form should lead with leak, not source").
- Avoid redundant work (if the sensor shows the upstream is fine and the downstream is the one reading an anomaly, the problem is between Anjali's standpipe and her house, not the supply main).

**What Karim sees on the Section 2 panel of `FieldIncidentDetailPage`:**

| Element | Content |
|---|---|
| **Mini-map** | The incident pin (Anjali's location) + the nearest 3 sensors as pins, with the incident-to-sensor distances labelled. The route he should drive is suggested as a polyline (if his current GPS is on). |
| **Current readings** | NTU / conductivity / chlorine_residual for each of the 3 nearest sensors, with colour-coding against WHO thresholds (red = exceeds threshold; amber = approaching; green = within bounds). Snapshot from last sync. |
| **24h trend chart** | A small inline time-series chart per sensor (NTU primary). Each chart shows the past 24h; the `IncidentCreated` timestamp is marked on the x-axis; the `Assigned` timestamp is marked on the x-axis; the `Now` vertical line shows. Karim can glance at the chart and see whether the contamination is rising, falling, or stable. |
| **"Last sync" caption** | The cached snapshot timestamp. If live-data is critical and the data is stale (>30 min), the caption shows in warning colour. |

**Linkage to Anjali's status timeline:** On Anjali's phone (Scenario 3), the state transitions visible to her are `IncidentCreated` → `VerificationSubmitted` → `AssignedToTechnician` → `TechnicianArrived` → `DiagnosisSubmitted` → `FixSubmitted` → `ProofSubmitted` → `ProofAccepted` (Adi) → `IncidentResolvedByAdmin` → `IncidentClosed` (Priya) OR `IncidentReopened{parent}`. The two states Karim fires that surface on her timeline specifically are **`TechnicianArrived`** ("মাঠ কর্মী পৌঁছেছে / Field worker arrived") and **`DiagnosisSubmitted`** ("সমস্যা নির্ণয় করা হয়েছে / Problem diagnosed"). Karim's surface does not display this back to him; the timeline is a one-way citizen-facing signal. The link is structural, not UI-visible.

---

## `TechnicianArrived` — the GPS-confirmed-or-manual pre-arrival action

**Locked decision #5:** `TechnicianArrived` fires when GPS confirms within 50m of incident pin, OR manual "I'm here" tap if GPS is unreliable in a pump-house / indoor location.

**Behaviour on FieldIncidentDetailPage:**
- The Section 1 header carries a **"Mark arrived"** button (tertiary-style, prominent). When Karim is at the pin location, the button auto-highlights to indicate GPS-confirmed; he taps to confirm. If GPS says he's far (>50m), the button stays neutral; manual tap still works if he knows he's there.
- Background GPS check fires periodically (every 30 sec while on the FieldIncidentDetailPage). When GPS confirms within 50m, the button highlights within 3 seconds.
- **Manual tap is honoured always.** GPS is a hint, not a gate. Pump-house basements don't have GPS; if Karim says he's there, he's there. The chain captures `TechnicianArrived{by: karim, inc, gps_confirmed: bool, gps_at_arrival?, device_clock}`.

**What fires automatically on `TechnicianArrived`:**
- The chain event lands (or queues locally if offline).
- A Bangla SMS notification fires to Anjali's phone ("Field worker arrived" — Goal 3.2 in-progress beat, Scenario 3).
- Section 3's Step 1 (Diagnosis) form unlocks if it wasn't already; if Karim is already inside the form, the Step 1 status chip flips to `ON_SITE`.
- The row status chip on `FieldQueuePage` flips to `ON_SITE`.

---

## Reopen path (sub-section) — `ProofInsufficient` from Adi

**Karim's reopen path is structured feedback verbatim. No translation layer.**

**The arc:**
1. Karim submits `ProofSubmitted` (first pass).
2. Adi opens the row, reviews the bundle, decides the proof is insufficient.
3. Adi clicks **Escalate back to Karim** on her `FieldIncidentDetailPage` (Scenario 2, Screen 2). She fills the structured fields:
   - **What's missing** (dropdown: GPS / EXIF / photo clarity / reasoning depth / proof of root cause)
   - **What we need** (free-text short field, not an essay)
   - **ETA expectation** (time picker, defaults to Karim's standard SLA)
4. Adi submits. `ProofInsufficient{reviewer: adi, inc, missing, needed_by, dispatched_back_to: karim, dispatched_at}` lands on the chain.
5. The incident re-enters Karim's queue at the top with a **`REOPENED`** chip.

**What Karim sees on the reopened row (FieldQueuePage):**

- **`REOPENED`** chip, sorted to the top of his queue (same chip as Adi uses on her reopen rows).
- Inline preview of Adi's structured feedback — **VERBATIM**, no translation layer:
  - "Missing: *GPS*"  / "Missing: *photo clarity*"
  - "Need: *[what we need free-text]*"
  - "ETA: *[time expectation]*"
- The original assignment context (operator reasoning, original report, sensor prep) is preserved below the reopen block.

**What Karim does:**
1. Opens the row → re-enters `FieldIncidentDetailPage` for the reopened incident.
2. The page top carries a **"Reopen — Adi's feedback"** panel with Adi's three fields, verbatim. The `REOPENED` chip is here too.
3. **He does NOT redo diagnosis or fix.** Those are anchored to the chain from his first pass; the reopen is only about the proof. The Diagnosis and Fix sections of his action timeline are collapsed to summary views with locked greyed backgrounds (read-only).
4. The Step 3 (Proof) form is **re-opened** — same five fields, same validation, same submit button.
5. He re-fills only what's missing (per Adi's verbatim feedback — "Missing: *GPS*" means he re-takes with confirmed GPS; "Missing: *photo clarity*" means he re-takes with a clearer shot; "Missing: *reasoning depth*" means he re-records the voice note and tightens the text).
6. Submits. `ProofSubmitted{inc, ..., reopened: true, reopened_feedback_addressed: [which fields he addressed]}` lands on the chain (the `reopened: true` flag is the load-bearing marker — it tells Adi's per-Karim proof-quality trend dashboard that this submission is part of a reopen arc).

**What fires automatically:**
- `ProofSubmitted{...reopened: true}` lands.
- The row leaves Karim's queue again. Routes back to Adi's proofs bucket with the `REOPENED` chip preserved as a row-level tag (per Scenario 2's locked decision #8 — reopened rows sort to the top of the proofs bucket).
- Adi's re-review-first action (Scenario 2, Screen 4) applies — she re-reviews the proof with the reopen feedback as the question.
- Anjali's phone may receive a brief "Update on your report" SMS depending on the reopen outcome (system-decided; not Karim's surface).

**The reopen reason is on the chain, not on Karim's surface.** `ProofInsufficient{reviewer: adi, missing, needed_by}` is the structural record. Karim's surface shows Adi's verbatim text; that's the surface translation (none — it's verbatim).

---

## End state — three outcomes

### Outcome A — Proof submitted, queue clears (sunshine path)

`DiagnosisSubmitted` → `FixSubmitted` → `ProofSubmitted` land. Karim sees the confirmation: *"Proof submitted. Your role on this incident is complete."* The row leaves his queue. The next top row is the assignment he needs to act on now. **Adi's proofs bucket receives it. Anjali's timeline updates with "Repair completed / মেরামত করা হয়েছে."** Karim moves on.

This is the steady state — the path that makes Adi's positive force "Karim's proof is reliably good" (FIA 13) actually load-bearing. The proof bundle is structured, the GPS confirms or warns, the voice note explains, the reasoning text says what he did and why, the sensor readback is included if he has it.

### Outcome B — Proof insufficient, Adi's structured feedback, Karim re-submits (corrective path)

`ProofSubmitted` (first pass) → Adi's `ProofInsufficient` (structured feedback) → row re-enters Karim's queue with `REOPENED` chip → Karim re-submits `ProofSubmitted{...reopened: true}` after addressing the gaps → row leaves his queue again → Adi's re-review-first action applies → either re-Mark-resolved (proof accepted, chains `ProofAccepted`) or further escalation (proof still insufficient → `ProofInsufficient` again, OR `EscalationTriggered` if the issue is now beyond Karim's scope entirely per Scenario 2 locked decision #10).

The reopen path is **not a failure** — it's the system's structural correction. Adi's re-review-first-then-re-dispatch (Scenario 2 locked decision #4) means Karim only sees `ProofInsufficient` when the proof was genuinely insufficient — not when Karim's fix itself failed, not when the symptom was downstream of his work, not when the report turned out to be a miscommunication. **Karim only redoes the proof, not the diagnosis and not the fix.** Same form, same chain event type, `reopened: true` flag.

### Outcome C — Karim's fix itself failed (beyond-tech-mandate escalation, owned by Adi)

This is the edge case the chain has to support but Karim's surface does not act on. If Karim arrives, diagnoses, fixes, submits the proof — and the contamination turns out to be bigger than his scope (e.g., main pipe needs WASA valve shutoff, lab test required, councillor notification) → that's a **beyond-tech-mandate** case that Adi owns.

**What Karim sees:** Nothing on his surface changes. His proof was already submitted. The escalation is Adi's, not his. **He is informed** — Adi's escalation includes a one-line "what we escalated" note visible on the chain segment if Karim pulls the audit timeline — but he does not act on it. The escalation routes to Pia (tier-3), not back to Karim.

**The structural role of this outcome:** This is the case where Karim's negative force "Karim can't do more" (−2, FIA 12) and Adi's negative force "Tech mandate ends before problem does" (−10, FIA 11) coincide. Adi's surface — and only Adi's surface — escalates. Karim's surface stays clean. **His queue is for work he can do, not work he can't.**

---

## Force coverage map (Karim's implicit forces — drawn from Adi's persona + Scenarios 1–3)

> Karim is not a trigger-map persona, so his forces are inferred from the persona texts that reference him. The four negative forces below are the inverses of his positive ones; the two positive forces are what his surface serves. Where forces are listed as "not Karim's," they belong to Adi and are carried by Scenario 2 — not addressed here.

| # | Force (source) | Direction | Addressed in this scenario? | Where in the scenario |
|---|---|---|---|---|
| **+1** | **Karim's proof is reliably good** (Adi, FIA 13) | ✅ | **Yes — load-bearing positive.** | The proof form's 5-field structure (locked decision #7), the offline tolerance, the GPS-confirmation-with-warning pattern, the sensor readback reference field as field #5 — all of these make the proof reliably structured. Adi's `Mark resolved` is fast because the proof is solid. The structural response lives here. |
| **+2** | **Priya's verification is reliably deep** (Adi, FIA 12) | ✅ (indirectly) | **Yes — but it's Priya's screen, not Karim's.** | Priya's reasoning is visible on Karim's FieldIncidentDetailPage as a required input. The "why anyway" reasoning feeds his on-site context. Karim doesn't author it, but he benefits from it. The force itself is Scenarios 1's load-bearing contribution. |
| **−1** | **Karim's proof keeps being weak** (Adi, FIA 11) | ❌ | **Yes — structural response in the proof form + reopen path.** | The required-field validation (fields 1–4 greyed until present) prevents missing-field weakness. The GPS-confirmation-with-warning prevents missing-GPS weakness. The voice note + reasoning text structure prevents "thin reasoning" weakness. The reopen path with `reopened: true` flag feeds Adi's per-Karim proof-quality trend dashboard (feature #26, Phase 1.x) — the trend conversation starts here. Karim sees Adi's verbatim feedback; he learns from the structural correction. |
| **−2** | **Karim can't do more** (Adi, FIA 12) | ❌ | **Yes — by queue design + escalation routing.** | Karim's queue is assignments-only, sorted by `due_at` (locked decision #1). He doesn't see Priya's inbox, doesn't see Adi's queue, doesn't see Anjali's open ack window. He acts on his lane. When his mandate ends before the problem does, the beyond-tech-mandate escalation is Adi's (`EscalationTriggered`), not his (Outcome C above). **Karim is not asked to do more than his lane allows.** This is a load-bearing design choice. |
| **−3** | **The close that's not real** (Adi, FIA 13) | ❌ | **Not Karim's — Adi's per-decision reasoning.** | Covered in Scenario 2 (Adi's `Mark resolved` + Screen 2's input-completeness check). Karim produces the proof bundle; Adi decides whether it's enough. |
| **−4** | **The resolution that doesn't resolve** (Priya, FIA 13) | ❌ | **Partially — field #5 of the proof form.** | Karim's soft warning in the proof form ("Sensor reading still elevated — re-check or escalate?") is the field-layer backstop. He can submit anyway with a note, or escalate. The closure backstop is Priya's confirmation step (Scenario 1's reverse arc / Scenario 2). |
| **−5** | **Tech mandate ends before problem does** (Adi, FIA 11) | ❌ | **Yes — by routing, not by Karim acting.** | Adi's `EscalationTriggered` owns this case (Outcome C). Karim is informed but does not act. His surface stays clean of escalations he can't resolve. |
| **−6** | **Chain captures too much** (Adi, FIA 10) | ❌ | **Not Karim's.** | Karim's chain captures are evidence-led (photo + GPS + voice + reasoning + sensor readback reference). The chain never reads as surveillance to him — it's his audit defence when Adi's reopen feedback is questioned. Covered in Scenario 2 for Adi's reasoning. |
| **−7** | **A genuine incident he dismissed** (Priya, FIA 12) | ❌ | **Not Karim's.** | Karim doesn't dismiss; he acts. The queue pre-screened by Priya's verification + assignment. Priya owns low-band dismissal (Scenario 1). |
| **−8** | **Verification eats the day** (Priya, FIA 15) | ❌ | **Not Karim's.** | Covered in Scenario 1 (ranked inbox + auto-routed tail collapse). Karim's queue is pre-ranked by `due_at`; that's a different load. |
| **+3** | **The motion is visible** (Anjali, FIA 15) | ✅ | **Indirectly.** | Each of Karim's submissions fires a Bangla SMS to Anjali (Goal 3.2). Karim's surface does not display this back to him; Anjali's timeline (Scenario 3) is where the visibility lives. |

**Forces not addressed in this scenario, and where they carry:**
- **Adi's decision-quality forces** (the close that's verifiable, the close that's not real, override-rate trends, system defends her) — Scenario 2.
- **Priya's decision-quality forces** (triage / verification) — Scenario 1.
- **Anjali's citizen-trust forces** (ack lands, motion visible, closure is real) — Scenario 3.
- **Pia's defensibility forces** — Phase 2 PHA dashboard (out of scope).
- **Chain-as-surveillance risk** — system-wide contract, addressed structurally across all four scenarios.

---

## Design log

**Produced by Saga/Freya — 2026-09-10**

**Source links:**
- [Product brief](../A-Product-Brief/product-brief.md) — Karim as the implicit field worker referenced in Phase 1 incident lifecycle
- [Trigger map](../B-Trigger-Map/00-trigger-map.md) — Adi's "Karim's proof is reliably good" force (FIA 13) is the load-bearing force this scenario authors
- [Adi persona](../B-Trigger-Map/05-persona-adi-the-auditor.md) — source of the four forces this scenario addresses; thread-back to Scenario 2 is the structural shape
- [Priya persona](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) — source of Karim's entry event (`Assigned` from InboxDetail Screen 4)
- [Anjali persona](../B-Trigger-Map/04-persona-anjali-the-anchor.md) — referenced for Karim's `TechnicianArrived` impact on Anjali's status timeline (Scenario 3)
- [Feature impact](../B-Trigger-Map/feature-impact.md) — **#5 resolution-proof bundle viewer** is the load-bearing feature Karim is producing data for; #3 post-resolution sensor readback verification supplies the readback reference
- [Content & language](../A-Product-Brief/content-language.md) — Karim is action lane, terse copy, English-first in Phase 1
- [Visual direction](../A-Product-Brief/visual-direction.md) — TopChrome + Sidebar component patterns; trust-band palette referenced (T1 unverified divider / T2 verified amber / T3 reserved alert-red; Resolved safe-green); token system locked 2026-09-07; EXIF preserved verbatim
- [Scenario 01 — Priya's shift](01-priya-the-pipeline-pilot-triage-verify-assign.md) — Karim's entry event is Priya's `Verified` + `Assigned` from InboxDetail Screen 4 (assignment handoff in)
- [Scenario 02 — Adi's shift](02-adi-the-auditor-mark-resolved-handoff.md) — Karim's exit event is his `ProofSubmitted`, which routes to Adi's proofs bucket (`ProofAwaitingVerification`); Adi's `ProofInsufficient` is the reopen path back to Karim (reopen handoff)
- [Scenario 03 — Anjali's shift](03-anjali-the-anchor-citizen-arc.md) — Anjali's status timeline threads Karim's `TechnicianArrived`, `DiagnosisSubmitted`, `FixSubmitted`, `ProofSubmitted` as in-progress beats

---

## Lockdown reconciliation (2026-09-11)

This scenario was re-read after the lockdown audit (00-lockdown-audit.md)
bound the design system. Edits applied:
- Locked decision #2: priority-band colour re-bound to trust-band tier (T1 unverified divider / T2 verified amber / T3 reserved alert-red); the colour is the verification-state tier, NOT the reporter-badge source.
- §"Threading the handoff" reporter context: anchor "flag" reframed as a reporter-badge chip (`Anchor` Lucide icon, `--color-reporter-anchor`); hotline caller info gains a hotline reporter-badge chip (`Phone` Lucide icon, `--color-reporter-hotline`). Hotline-sourced incidents default to T1 (unverified); the hotline reporter-badge is the source attribute, not the band colour.
- Screen 1 FieldQueuePage: queue-row priority chip notes "NOT a source-attribute colour" — priority chip = trust-band tier; reporter-badge chip = source attribute.
- Screen 1 FieldQueuePage: "Reporter name + anchor flag" reframed as "Reporter name + reporter-badge chip (anchor / hotline / webform)".
- Screen 2 FieldIncidentDetailPage Section 1 row: "Reporter context" table cell now names the specific reporter-badge chip per source (anchor = Anchor icon; hotline = Phone icon + caller info).
- Visual direction source link: trust-band palette references re-bound to lockdown values.
- Karim's arc does not structurally change (he still gets assigned, acknowledges, arrives, diagnoses, fixes, submits proof); only the visual treatment of priority colour and reporter-badge chips re-binds.
- Trust band now = verification state only (T1/T2/T3/Resolved)
- Reporter-badge now = separate source attribute (anchor/hotline/webform/sensor)
- Hotline-sourced no longer T3; hotline = reporter-badge hotline + T1 default
- Anchor no longer T1; anchor = reporter-badge anchor attribute at any tier
- Reference: docs/D-UX-Design/01-design-system-foundation.md (lockdown-bound)
- Reference: docs/D-UX-Design/decisions/00-lockdown-audit.md
