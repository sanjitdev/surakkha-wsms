# Karim the Karrier — Persona 06

> Priority: Operational (load-bearing middle act; surfaced as a full persona in master PRD §2.1 even though not in trigger map groups)
> Business goals served: G1 (direct — Karim's on-site work is the loop's middle act), G2 (direct — his proof bundle is the evidence surface), G3 (indirect — his `TechnicianArrived` is one of Anjali's in-progress beats)
>
> Note on numbering: this is file `06-persona-karim-the-karrier.md`. The persona set in `B-Trigger-Map/` is **5 files total**: 02 (Pia), 03 (Priya), 04 (Anjali), 05 (Adi), 06 (Karim). Karim was the implicit field worker referenced in scenario 04 and master PRD §2.1; he is now formalised in the persona set per WDS glossary ("Persona — `B-Trigger-Map/NN-persona-[firstname]-the-[archetype].md`"). The trigger map mermaid groups in `00-trigger-map.md` show only 3 personas (Priya / Adi / Anjali) because those are the customer-edge groups; Karim is internal staff, structurally counted through the personas that dispatch him.

---

## Who Karim Is

Karim is a WASA (Dhaka Water Supply and Sewerage Authority) field technician. **The name "Karim" is the role archetype, not a person.** Every WASA technician who accepts Surakkha field work — pump-house crew, valve-yard crew, distribution-line rovers, sewerage-network rovers — is an instance of this role. The persona count is structurally many: 5–15 WASA technicians in Phase 1, scaling with incident volume.

He works the wards on a motorbike. His phone is his office: case notes, GPS, photos, voice memos, sensor readback, queue. He does not have a desk. He is one-handed in sunlight or one-handed in a pump-house basement. He works shifts; he is capacity-burdened; his connectivity is intermittent.

He is **not a customer**. He is staff. He is paid by WASA, seconded or reassigned to Surakkha field work. His login is employee credentials, not NID-bound (per scenario 04 locked decision §1 and product-brief gap row "auth mechanism placeholder"). His surface is action-lane, English-first, terse imperative copy. He is not the citizen-facing surface; he is the on-site act.

---

## Psychological Profile

Karim thinks in **fixes, not features**. His mental model of the system is: *"Priya told me where, what, why; I go, I see, I fix, I prove; the chain records what I did."* **Bold traits: action-oriented, evidence-led, capacity-burdened.** **Time-pressured patience** — he moves fast when he has a queue, but he does not cut corners on proof, because rejected proof is wasted field time. **Pragmatic about tech** — he uses his phone because his phone is the tool he has; he does not celebrate the UX, he does not mourn it. **Trusts the chain because the chain is the audit, distrusts the network because the network drops in pump-houses.** **English-fallback Bangla-comfortable** — his form labels and CTAs are English (operator UI), but he speaks Bangla on-site and in his voice notes.

He does not care about the trust band as a number, the verification reasoning in Priya's words, the governance ladder, or the audit log. He cares about: did I prove what I did, and will the proof hold up.

---

## Internal State

Karim is **working under load**. He is not anxious; he is **in motion**. **Bold dominant emotions: action-orientation when on the queue, evidence-led caution when writing up the proof, capacity-burdened patience through the shift.** When he receives an assignment, he wants: full context inline so he does not have to call dispatch, the priority band colour so he can triage under load, and a clear due_at countdown so he can plan his route.

When he is on-site, he wants: the original report + Priya's reasoning + the sensor prep at his fingertips, three forms that work offline (diagnosis, fix, proof), and a single submit per form that fires a chain event he can verify fired.

When he submits proof, he wants: immediate queue clearance, a confirmation that his role is complete, and a structured reopen path if the proof comes back insufficient — verbatim feedback, no translation layer, only the proof bundle to redo.

When the system fails him, the emotion is **invisible but corrosive** — a rejected proof means a re-trip. Two re-trips in a week and he deprioritises Surakkha work for the calls his supervisor also counts. That erosion is what shrinks field capacity over months.

---

## Usage Context

**How Karim arrives at the system:** He opens a web surface on his phone (low-end Android, intermittent 3G/4G, English UI, Bangla for voice notes). He does not have an NID-bound account; he has employee credentials. Returning sessions restore from local cache — his queue, his draft forms, his queued submissions.

**Emotional state on arrival:** Either **shift-starting** (opens the queue, scans the overdue count, plans his route) or **just-dispatched** (notification from Priya's assignment, deep-links into the incident row, reads context for 60–90 seconds before he gets on the bike).

**Behavior pattern — acknowledge flow:** Open notification → tap **Acknowledge** → `Acknowledged{by: karim}` fires immediately on the chain → tap **Mark arrived** (or auto-fires when GPS confirms within 50m of incident pin, per scenario 04 locked decision §5) → `TechnicianArrived` fires.

**Behavior pattern — on-site flow:** Diagnosis (text + photo + voice + GPS, offline-tolerant) → Fix (text + photo + reasoning, offline-tolerant) → Proof (5 fields, fields 1–4 REQUIRED, field 5 OPTIONAL but encouraged — see scenario 04 §7) → submit → `FixSubmitted` then `ProofSubmitted` fire.

**Behavior pattern — reopen flow:** Adi's `ProofInsufficient` lands back on his queue → he sees Adi's structured feedback verbatim (`what's missing`, `what we need`, `ETA expectation`) → re-submits a stronger proof bundle only (no re-diagnosis, no re-fix) → `ProofSubmitted{reopened: true}` fires.

**Surface:** Action lane. Distinct from Priya's inbox (decision lane triage) and Adi's queue (decision lane closed-loop). Karim's surface is `/field/*` — login → queue → incident detail → action timeline (diagnosis / fix / proof as three steps). No inbox, no proofs bucket, no overrides.

**Offline behaviour:** **Full offline mode** (per scenario 04 locked decision §3). Queue cached locally, photos queued locally, form submissions deferred, sync on reconnect with conflict resolution by timestamp + chain hash. The system defends against network failure mid-shift; Karim's surface works at the bottom of a pump-house without signal.

**Decision criteria:** "Did the proof hold up?" Everything else is invisible to him. The system's success is the proof bundle's defensibility, not the workflow's elegance.

**What he never sees:** Priya's inbox. Adi's queue. Anjali's tap-back queue. The chain explorer (Pia's surface). Operator-internal reasoning captures (`Verified`, `DeferRequested`, `EscalatedToPia`, `HotlineIntakeReceived`, `TrustBandOverridden`, `EscalationTriggered`, `LoginSucceeded`). He sees his queue, his assignment context, and his own action timeline.

**What he does share:** A clean `ProofSubmitted` with five-field evidence. His reasoning lands on the chain as the field-side truth. When the proof holds up, Anjali's closure-tap clears his ledger. When the proof comes back insufficient, Adi's verbatim feedback tells him what was missing in operator language he can act on.

---

## Driving Forces

Format: WHAT + WHY + WHEN
Score: Frequency (1–5) + Intensity (1–5) + Fit (1–5) = Total /15

### Negative Forces (what Karim is moving away from)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-------|-------|
| − | **The proof that gets rejected** | He submitted photo + GPS + reasoning + sensor readback. Adi came back with `ProofInsufficient` and `what's missing: clearer before/after` | Wasted field time. He did the work, the proof didn't hold up, he redoes the trip. Two re-trips in a week and he deprioritises Surakkha work | When Adi's proof-verification bar is tight and Karim's bundle was light on context | 4 | 5 | 5 | **14** |
| − | **Karim can't do more** | His queue is overfull, his due_at is in 15 minutes, and the assignment context is incomplete — no address pin, no Priya reasoning, no sensor prep | He is forced to either re-dispatch (losing 20 minutes) or show up under-informed (losing diagnostic quality). Either way, his capacity is the constraint | When Priya's verify+assign step is rushed and the context bundle is sparse | 3 | 5 | 5 | **13** |
| − | **Tech mandate ends before problem does** | He submitted proof; Adi accepted; the incident closes. A week later the sensor readback shows the problem is still there. He gets `IncidentReopened{parent}` on a different (or reopened) incident in the same ward | He fixed what was in front of him; the systemic cause is upstream. He has no lever to fix the systemic cause, only the visible instance | Monthly; the cases that erode his trust in the loop | 3 | 4 | 4 | **11** |
| − | **Offline mid-submit** | He is in a pump-house with no signal. He fills the proof form, hits submit, the system says "queued, will send when online." He walks back to signal — submission lands — but `ProofSubmitted` is timestamped to the walk-back, not the on-site moment | The audit trail records a delay that was a network artefact, not his. Adi's verification sees a slow submission and wonders why | When connectivity drops in the middle of a submission | 3 | 4 | 4 | **11** |
| − | **Assignment to the wrong ward** | Priya's `Assigned` lands him at an address that doesn't match the incident pin — the pin moved, or the ward boundary was redrawn, or the reporter mistyped | He wastes 30 minutes riding to the wrong pump-house, then re-dispatches to the right one. The clock starts over on due_at | When ward-boundary data and incident pin data drift; visible in the GPS discrepancy at arrival | 2 | 4 | 4 | **10** |

### Positive Forces (what Karim is moving toward)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-------|-------|
| + | **Karim's proof is reliably good** | He submits the proof bundle; Adi accepts on first pass; Anjali taps ✅; the closure is real. No re-trips, no reopen, no soft mark on his ledger | His work held up. The chain records what he did. His capacity is spent on new incidents, not re-trips | When the bundle is complete and Adi's bar is calibrated to field reality | 5 | 5 | 5 | **15** |
| + | **Full assignment context at tap** | Notification fires with incident id, ward, priority colour, due_at countdown, Anjali's anchor chip (or hotline caller info), original report, Priya's reasoning, sensor prep — all inline | He does not have to call dispatch. He reads for 60–90 seconds, plans the route, gets on the bike | Every dispatch | 5 | 5 | 5 | **15** |
| + | **Offline works as advertised** | Pump-house with no signal: queue loads, forms work, photos queue, submission defers, sync on reconnect, `ProofSubmitted` timestamp reflects the on-site moment (not the walk-back) | The system defends his work against network failure. The audit trail is honest about when the work happened | Every shift | 4 | 5 | 5 | **14** |
| + | **Reopen feedback is actionable, not narrative** | Adi's `ProofInsufficient` lands with structured fields: `what's missing`, `what we need`, `ETA expectation`. He reads, re-submits, done. No translation layer, no "we appreciate your work" padding | His re-submit closes the loop in one trip. The reopen is a fix, not a friction event | When proof comes back insufficient | 4 | 5 | 5 | **14** |
| + | **Proof bundle is durable evidence** | His photo + GPS + EXIF + reasoning + sensor readback survives the chain — verifiable, citable, admissible in a PHA audit. When Pia's data contract lands (Phase 2), his bundle is the field-side input that satisfies it | His work is the loop's evidentiary backbone; he is the middle act, and the middle act is load-bearing | Every closure | 4 | 5 | 5 | **14** |
| + | **Queue clears on submit, not on accept** | After `ProofSubmitted`, his queue drops the row immediately. He sees "Proof submitted. Your role on this incident is complete." He does not wait for Adi to verify before moving on | His capacity is freed for the next assignment. The cognitive load of "is this done?" is removed | Every submission | 4 | 4 | 5 | **13** |
| + | **Priority band colour helps him triage under load** | T1 unverified (divider neutral), T2 verified (amber) — he sees the colour on the row, sorts by due_at first, then priority within due_at | When three assignments land in the same hour, the colour cue lets him sequence without re-reading context | Every multi-assignment shift | 4 | 4 | 4 | **12** |

---

## Relationship to Business Goals

- ✅ **Goal 1 — Loop is reproducible (direct, primary, the middle act).** Karim's on-site work is the loop's middle act. Without him, the loop has verified reports that never get diagnosed, fixed, or evidenced. He does not drive reproducibility at the edges — Priya does that — but he is the *act* the loop runs on once verification fires.

- ✅ **Goal 2 — Loop is defensible (direct, primary, the evidence surface).** Karim's proof bundle is the field-side input that satisfies Goal 2. Photo + GPS + EXIF + reasoning + sensor readback is the evidence surface Adi's verification reads. When Pia's data contract lands, his bundle is the citable artefact. His capacity to produce durable evidence is the loop's evidentiary backbone.

- ✅ **Goal 3 — Citizens feel heard in motion (indirect).** Karim's `TechnicianArrived` event threads into Anjali's status timeline as one of her in-progress beats ("মাঠ কর্মী পৌঁছেছে / Field worker arrived"). His on-site presence is the moment Anjali's "is anyone coming?" becomes "someone is here." He does not author Goal 3, but he is one of its beats.

---

## Design Implications for Freya

| Force | Implication for the field (Karim) web surface |
|---|---|
| The proof that gets rejected | Proof form fields 1–4 required and inline-validated; field 5 (extra context) actively encouraged with a "this strengthens the bundle" hint; submit button greys until bundle is complete. Adi's `ProofInsufficient` reason code surfaces as a checklist above the re-submit form so Karim knows exactly what to add. |
| Karim can't do more | Pre-arrival context is non-negotiable: address pin + mini-map, reporter chip, original report, Priya's reasoning, sensor prep. Queue sort by due_at first, then priority within due_at. Overdue rows surface with a countdown chip that turns amber at <30min, red at overdue. |
| Tech mandate ends before problem does | `IncidentReopened{parent}` carries the original proof bundle so Karim can see what he submitted, plus the readback that flagged the reopen, plus Adi's interpretation. He addresses the gap, not the systemic cause. |
| Offline mid-submit | Submission timestamps capture the on-site moment (when the form was filled), not the network moment (when it landed). The chain stores both `client_timestamp` and `server_timestamp` so the audit trail is honest. |
| Assignment to the wrong ward | Mini-map shows the pin AND his current GPS; if the discrepancy is >200m at assignment time, the row surfaces a "verify pin" CTA that re-opens the incident for Priya without firing `Acknowledged`. |
| Karim's proof is reliably good | Bundle-defensibility is rewarded by first-pass accept rate, surfaced as a per-Karim trend (feature #26, Phase 1.x). The trend is operator-visible, not Karim-visible — to avoid gaming. |
| Full assignment context at tap | Notification deep-links into the row with all context pre-loaded. No "tap to load details" step. |
| Offline works as advertised | Queue + form + photo queue + deferred submission + conflict resolution by `client_timestamp` + chain hash. All offline-tolerant. |
| Reopen feedback is actionable | `ProofInsufficient` event payload carries structured `what's_missing`, `what_we_need`, `eta_expectation` fields. Karim's re-submit form prefills these as a checklist. |
| Proof bundle is durable evidence | Photo upload preserves EXIF verbatim (no re-encode, per visual-direction.md "real evidence only"). GPS captured at submit moment (not at photo moment), surfaced as a second pin for triangulation. |
| Queue clears on submit | After `ProofSubmitted`, row drops immediately with a confirmation toast. No polling for Adi's accept. |
| Priority band colour | Trust-band tier colour on each row (T1 divider neutral, T2 amber, T3 reserved for consumer-notice issuance). Colour cue only — Karim does not reason about bands, he triages by colour. |

---

_Produced by Saga — 2026-09-15_
_Source: Scenario 04 ([C-UX-Scenarios/04-karim-the-technician-field-lane.md](../C-UX-Scenarios/04-karim-the-technician-field-lane.md)), master PRD §2.1, trigger map line 105 (Adi's positive force "Karim's proof is reliably good"). Closes WDS gap GAP-TRIG-KARIM (Karim persona file absent from `B-Trigger-Map/`)._
