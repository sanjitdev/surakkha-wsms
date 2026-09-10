# Priya the Pipeline Pilot — Persona 03

> Priority: Secondary (after PIA)
> Business goals served: G1 (direct, primary), G2 (direct, primary), G3 (indirect, the in-progress signal)

---

## Who Priya Is

Priya is the central city operator for Dhaka's PHA — one of 1-2 in Phase 1, possibly 4-6 in a multi-shift city, dozens in a fleet deployment. **The name "Priya" is the role archetype, not a person.** Every instance of Priya is a career public-service operator on salary, sitting in a designated operations room with the dashboard on one screen and her phone on the other, running a single long shift. When she hands over, the next operator inherits her in-progress incidents with the chain state preserved.

She is not a typist. She does not chase data. She triages, verifies, decides, and — once Karim's work and Adi's verification close the loop — closes the incident. Her working surface is the ranked action list, the verification detail view, and the final-close action — not the chain explorer (Pia's surface), not Karim's resolution proof (Karim + Adi's surface), not the citizen ack (Anjali's surface). She is **municipal in disposition**, not alarmed. She has handled 3-4 real incidents in the last month that mattered, and dozens that didn't.

**Phase 1 incident lifecycle (locked):** Anjali reports (or sensor fires) → `IncidentCreated` lands with a trust band → Priya verifies (sensor cross-check + reporter call + photo review), captures reasoning, and assigns Karim with a priority → Karim goes on site (`TechnicianArrived`), diagnoses (`DiagnosisSubmitted`), submits fix (`FixSubmitted`), and submits the resolution proof with photo + GPS + EXIF → Admin (Adi) reviews Karim's proof and dispatches the citizen-ack request to Anjali → Anjali taps ✅ or ❌ → ✅ → Priya closes (`IncidentClosed`); ❌ → `IncidentReopened{parent}` re-enters the chain. Priya is the **closer**, but the close depends on Adi's verification + Anjali's tap. Both roles matter; the chain is the handoff surface.

She is *the* load-bearing user. Goal 1 (loop is reproducible) and Goal 2 (loop is defensible) stand or fall on whether she can do her part reliably, shift after shift.

---

## Psychological Profile

Priya thinks in **decisions, not features**. Her mental model of the system is: *"each incident is a decision I make in 3-5 minutes; the system helps me make it well, captures my reasoning, and moves on."* **Bold traits: Decisive under load.** **Capacity-aware** — she knows the inbox is always longer than her shift, and she triages accordingly. **Evidence-led** — she does not act on instinct; she acts on the sensor data + reporter call + submitted photo. **Municipal, not heroic** — her job is to do the routine reliably, not to be celebrated for the rare save. **Trusts the chain as proof surface, returns to it when something doesn't add up.**

She does not want to be the system's hero. She wants the system to make her ordinary day easy and her hard day survivable. **Bold key insight: she fears being the bottleneck more than she fears being wrong, because being wrong is auditable, but being the bottleneck is invisible until SLA drift has already happened.**

---

## Internal State

Priya is **municipally working**, not anxious. She is not debugging the system; she is running it. **Bold dominant emotions: working rhythm, capacity awareness, decisive calm.** When she opens the dashboard, she is looking for: which incidents are at the top of the ranked list, which ones have aged past their SLA, which ones are missing context she needs to decide.

When she closes her shift, she wants to walk away with: a clean handover brief, an inbox that's been worked top to bottom, and the certainty that the open threads are named (not hidden) for the next shift.

When the shift goes hard, the rhythm breaks in one of two ways: **capacity exhaustion** (too many incidents, not enough time) or **ambiguous evidence** (an incident she can't verify or dismiss with what she has). She recovers from capacity by re-prioritising; she recovers from ambiguity by escalating.

---

## Usage Context

**How Priya finds the system:** Same as any other user — she logs in at shift start. The handover brief (auto-generated) tells her what's open, what's in flight, what aged overnight. She reads it once (~3 min) and the day's shape is set.

**Emotional state on arrival:** Either calm (clean handover, empty inbox, ranked list waiting) or pre-loaded (open T2 from yesterday, two T3 escalations pending Pia's signature, three reporters she owes callbacks). The handover brief is the trigger — calm or loaded, she is oriented before she touches the inbox.

**Behavior pattern:** Top-down by trust band as the default — high-band first, medium-band next, low-band only if there's slack. Each incident is a 3-5 minute loop: read the band + reporter context → cross-check sensor → review photo + EXIF → call reporter if needed → write verification reasoning → assign tech → close the verification step. She does not read the chain segment for every incident; she reads it when something doesn't add up.

**Behavior variants:** She can work bottom-up (clear the easy low-band ones first to free cognitive load for the hard ones) when that's the rhythm the day calls for. She can defer a high-band to call the reporter first, even though that costs time, when she judges that the call is the difference between assigning confidently and assigning blind. The dashboard has to support both rhythms without punishing either.

**Decision criteria:** "Can I assign this within 3 minutes and move on?" If yes, the dashboard worked. If no, something's wrong — bad data, missing context, ambiguous signal — and she escalates rather than guessing.

**What she reads the chain for:** When verification data is contradictory, when a reporter disputes a previous verdict, when Pia asks about a decision three months later. She trusts the chain as the proof surface; she doesn't live in it.

---

## Driving Forces

Format: WHAT + WHY + WHEN
Score: Frequency (1–5) + Intensity (1–5) + Fit (1–5) = Total /15

### Negative Forces (what Priya is moving away from)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| − | **Verification eats the day** | 14 incidents queued; 8 reporter calls + 5 sensor cross-checks + 11 photo reviews needed before any tech dispatches; 4 assigned before the 10th ages past SLA | Bottleneck is her own capacity, not the system's | A typical shift, on a busy week | 5 | 5 | 5 | **15** |
| − | **The report that can't be verified** | High-band incident; reporter doesn't pick up; nearest sensor offline; submitted photo blurry. She must decide *something* with insufficient evidence | Defaulting to "assign anyway" wastes a tech; defaulting to "wait" lets SLA drift | Once or twice a week in Phase 1 | 4 | 5 | 5 | **14** |
| − | **The resolution that doesn't resolve** | Tech returned with proof, admin verified, chain closed — but the next sensor reading shows contamination hasn't cleared | She reopens a closed incident. The system worked as designed; reality didn't | Monthly; the case that erodes her over time | 3 | 5 | 5 | **13** |
| − | **A wrong verification, publicly** | She assigned a tech to an incident she thought was real; it was false; tech wasted hours; Anjali's ward-level reputation ledger took the soft mark | Priya's "verify" call was the trigger, but the social cost landed on Anjali | Quarterly; visible in the reporter reputation ledger | 3 | 4 | 5 | **12** |
| − | **A genuine incident she dismissed** | She triaged, marked it low-band, didn't assign. Two days later, a citizen is sick. The chain shows the low-band call; she owned it | Asymmetric cost: false-positive wastes a tech, false-negative lets bad water through | Rare but catastrophic when it happens | 2 | 5 | 5 | **12** |

### Positive Forces (what Priya is moving toward)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| + | **Triage that respects her capacity** | Dashboard shows the incidents that *need* her, not the ones the system can route. She works top-down and finishes her queue | Her hardest shift ends with the inbox empty, not a backlog she hands over | Every shift | 5 | 5 | 5 | **15** |
| + | **Verification that's decisive** | Reporter call tells her what she needs in 90 sec; sensor cross-check is one view, not five; EXIF is on the photo, not buried | Her time is spent on judgment, not on data wrangling | Every verification | 5 | 5 | 5 | **15** |
| + | **Resolution that's real** | Post-resolution sensor readback confirms contamination cleared, or Anjali's ✅ tap confirms on the citizen side. Closure is an act of evidence, not an act of faith | Reopens are rare and signal something the system should learn from | Every closure | 4 | 5 | 5 | **14** |
| + | **Verdicts she can defend** | Her verification calls land in the chain with the reasoning she wrote at the moment of decision. Three months later, Pia asks "why did you assign a tech to that incident on August 14?" — Priya pulls the chain segment and shows her reasoning in under a minute | Her expertise compounds into a defensible record | Every audit; every Pia review | 4 | 4 | 5 | **13** |
| + | **False-negative incidents that almost never happen** | When she marks low-band and doesn't assign, the next sensor reading in that ward still confirms her call. The asymmetry — false-positive wastes a tech, false-negative lets bad water through — is tilted toward false-positive by design | She trusts the system is keeping that tilt honest | Every low-band dismissal | 3 | 5 | 4 | **12** |
| + | **Expertise that compounds** | Each shift's verification calls make her better at the next shift's. The dashboard remembers her decisions and why; the monthly report shows her false-positive/false-negative rate trending toward expert-level | Her reputation as the city's best operator grows without her having to perform it | Monthly aggregate; quarterly trend | 3 | 4 | 4 | **11** |
| + | **Handover briefs that actually brief** | The next-shift Priya inherits a brief that names the open threads, the in-flight incidents, and the open questions — not a list of incidents they have to re-discover | Tribal knowledge stops compounding | Every handover | 4 | 4 | 4 | **12** |

---

## Relationship to Business Goals

- ✅ **Goal 1 — Loop is reproducible (direct, primary).** Priya is the load-bearing user. Every incident that goes through the demo bar passes through her verification-and-assignment step. If the loop is reproducible, it's because *she* can do her part reproducibly — same shift, same load, same outcome. **This is the goal she breaks if it fails.**

- ✅ **Goal 2 — Loop is defensible (direct, primary).** Every verification reasoning she writes is anchored to the chain. Every assignment decision is auditable. Pia's defensibility claim rests on Priya's reasoning being captured at the moment of decision, not reconstructed after. **This is the goal she makes possible by doing her job well.**

- ✅ **Goal 3 — Citizens feel heard in motion (indirect, but real).** The "in progress" signal citizens get at the verification-and-assignment step is *Priya moving*. The moment she picks up the phone and calls the reporter, that's the in-progress signal the citizen feels. The assignment notification to Karim is the next beat. **She is the citizen's experience of "in progress" — not the got-heard ack (Anjali's) and not the closed ack (Anjali's again), but the middle beat where the report becomes an action.**

---

## Design Implications for Freya

| Force | Implication for the operator (Priya) dashboard |
|---|---|
| Verification eats the day | Trust-band ranking must be honest — high-band only what *needs* her; auto-route what doesn't. Inbox shows the *remaining* work, not the *total* work. |
| The report that can't be verified | Every incident detail must show the missing-evidence state explicitly (reporter-not-reached, sensor-offline, photo-low-quality) so she can decide without hunting. |
| The resolution that doesn't resolve | Post-resolution sensor readback must surface as a re-open prompt, not a hidden dashboard signal. |
| A wrong verification, publicly | Per-incident reasoning capture is the audit trail; the dashboard must make reasoning capture one keystroke, not a separate form. |
| A genuine incident she dismissed | Low-band dismissals need a "marked-dismissed-because" capture (sensor-still-clean, reporter-not-reached-but-prior-trustworthy, etc.) so she can defend the call later. |
| Triage that respects capacity | Top of inbox = "what only she can do." Bottom of inbox = "what the system can route." Filter chip for "needs me" vs "in flight." |
| Verification that's decisive | One view per verification signal — sensor cross-check, photo EXIF, reporter call outcome — not five tabs. |
| Resolution that's real | Post-resolution state badge on the incident (verified / disputed / pending-readback). |
| Verdicts she can defend | Reasoning capture is *inline* on the verification step, not a separate "add note" form. |
| False-negatives that almost never happen | Low-band dismissals show the next-scheduled-sensor-readback timestamp — so she can trust her call was right when that readback lands. |
| Expertise that compounds | Per-operator false-positive / false-negative trend visible in the dashboard (not just in the monthly PHA report). |
| Handover briefs that actually brief | Brief is auto-generated at end of shift, names the open threads by incident id, not as a list of unresolved events. |

---

_Produced by Saga — 2026-09-10_
_Source: Priya workshop (action lane; load-bearing user; persona archetype covers 1-2 instances in Phase 1, scales to 4-6 in multi-shift and dozens in fleet deployment)_
