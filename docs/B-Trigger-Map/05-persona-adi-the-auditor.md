# Adi the Auditor — Persona 05

> Priority: Secondary (after PIA, Priya)
> Business goals served: G1 (direct, the close is the loop's end-state), G2 (direct, primary), G3 (indirect, the citizen-ack is the close's final word)

---

## Who Adi Is

Adi is the verifier in the closed-loop queue — she overrides trust bands, dispatches technicians (Karim), verifies Karim's resolution proof, talks to Karim when proof is weak, dispatches the citizen-ack request to Anjali, and confirms the resolution is real before Priya closes. She is **the last human decision before `IncidentClosed`**, and her closure is the load-bearing step that makes Goal 2 (defensible) real at the per-incident scale.

She sits in the same operations room as Priya, but on a different surface. Her surface is the **closed-loop queue** — incidents that have moved past Priya's verification-and-assignment, are now with the tech (or back from the tech), and are waiting on her final verification + closure. She does not see Priya's inbox; she sees what Priya has handed off. She does not see Karim's field reality directly; she sees his submitted proof (photo + GPS + EXIF + reasoning). She does not see Anjali's reality directly; she sees the closure-ack queue and the ✅ / ❌ taps when they arrive.

She is slower than Priya per incident by design. Her correctness is more load-bearing than her throughput — a wrong close becomes `IncidentReopened{parent}` and a soft mark on her own ledger, while a slow close at most delays Anjali's closure ack.

---

## Psychological Profile

Adi thinks in **defensibility, not throughput**. Her mental model of the system is: *"the close is real because every input that justifies it is captured; if any input is missing, the close is wrong by definition."* **Bold traits: Defensibility-first.** **Patient** — she would rather close slowly and be right than close fast and be wrong. **Trusts the chain as her evidence ledger** — every input to her decision is on the chain, and she can pull the segment at any moment. **Cooperative across roles** — her work succeeds when Karim's proof is good, Priya's verification is deep, and Anjali taps promptly. **Auditor-disposition** — she doesn't second-guess others, she makes her own call from the evidence she has.

She does not want to be the bottleneck, but she accepts that she is the *last* bottleneck — the close that can't happen without her. **Bold key insight: she fears the close that's not real more than she fears the close that's late, because the late close has a citizen who waits, but the wrong close has a citizen who drinks bad water and an audit that points at her name.**

---

## Internal State

Adi is **patiently working**, not anxious. She is not chasing throughput; she is *closing carefully*. **Bold dominant emotions: working patience, evidence-led calm, cross-role awareness.** When she opens her queue, she is looking for: which incidents need her verification now, which are awaiting Karim's stronger proof, which are awaiting Anjali's citizen-ack, which need her override call.

When she closes her shift, she wants to walk away with: an empty proof-review queue (every incident either closed or routed forward), an open escalation list (incidents that need Pia's tier-3 attention), and the certainty that nothing she closed today will reopen tomorrow.

When the shift goes hard, the rhythm breaks in one of two ways: **Karim's proof is weak across many incidents** (the relationship-layer erosion) or **escalation paths are unclear** (the systemic gap). She recovers from the first by escalating and accepting queue delay; she recovers from the second by writing her own template and asking Pia to ratify it.

---

## Usage Context

**How Adi finds the system:** She logs in to the closed-loop queue at shift start. Her surface is the resolution-review and dispatch surface.

**Emotional state on arrival:** Working patience. She is not in a hurry; she is in a queue.

**Behavior pattern — proof review rhythm:** Incoming proof queue, top-down. Karim's submissions land; she reviews photo + GPS + EXIF + reasoning + post-resolution sensor readback (if available) + any cross-context from Priya's verification. She either accepts the proof (and dispatches citizen-ack) or escalates back to Karim ("what else is needed?"). She is *the* bottleneck for closure velocity.

**Behavior pattern — citizen-ack rhythm:** Pending citizen-ack queue, background. She monitors it but does not push Anjali. The citizen-ack window expires; the chain records the silence as a non-response; her queue grows by half-closed incidents without citizen signal.

**Decision criteria:** "Is the close verifiable?" She would rather escalate and delay than close and be wrong. The chain is her evidence ledger; the close is her name on the audit.

**What she reads the chain for:** When Karim's proof is weak and she needs the original Anjali report + Priya's verification reasoning to make the call. When she overrides the trust band and wants the override reasoning captured. When Pia reviews three months later and the chain segment is the proof that her close was right.

---

## Driving Forces

Format: WHAT + WHY + WHEN
Score: Frequency (1–5) + Intensity (1–5) + Fit (1–5) = Total /15

### Negative Forces (what Adi is moving away from)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| − | **The close that's not real** | Karim's proof looked real; Anjali tapped ❌; chain reopens. The close is on Adi's ledger; Anjali's report goes back to Priya; Karim returns to the ward | The system worked; the close didn't. Wrong closure becomes `IncidentReopened{parent}` — visible in the chain forever | Quarterly; the case that erodes her over months | 3 | 5 | 5 | **13** |
| − | **Karim can't do more** | Karim's proof is weak; he can't go back; SLA is drifting. Close without proof, or let SLA drift | Stuck between two bad options; both options land on her ledger | Monthly; structural when Karim is overloaded | 4 | 4 | 4 | **12** |
| − | **Anjali doesn't tap** | Citizen-ack dispatched 6 hours ago; no response. The ack window expires; chain records silence as a non-response | Her queue grows by half-closed incidents with no citizen signal. Anjali's silence is structural, not personal | Weekly; more in wards with low citizen engagement | 4 | 3 | 4 | **11** |
| − | **Trust-band override that goes wrong** | She overrode a high-band call ("I think this is medium"); contamination turned out to be T1; override shows in chain; Pia sees it in monthly report | Her override rate climbs. She made a judgment with incomplete info; the system captured it | Quarterly; rare but catastrophic | 2 | 5 | 5 | **12** |
| − | **Escalation that has nowhere to go** | Karim is on site, mandate ends before problem does. Need to escalate — to Pia, WASA specialist, PHA on call, councillor. Path is unclear; chain has no template | Admin makes judgment call on her own authority, with no audit trail. Wrong escalation wastes time; no escalation lets contamination spread | When it happens; structurally damaging because there's no template | 2 | 5 | 4 | **11** |
| − | **Karim's proof keeps being weak** | A pattern, not one incident. Karim's photos are routinely low-quality, EXIF missing, reasoning thin | Admin's verification queue is bottlenecked on Karim's proof quality. Close weak proofs at cost of own ledger, or escalate every incident at cost of SLA | Pattern-based; corrosive when sustained | 3 | 4 | 4 | **11** |
| − | **Priya's verification is thin** | Priya sent her an incident with shallow verification reasoning — "looks real, assigning Karim" | Admin has to redo Priya's verification. Chain shows the incident went through Priya's hands, but Admin can't tell what Priya saw | Pattern-based; corrosive when sustained | 3 | 4 | 3 | **10** |
| − | **Chain captures too much** | Every decision Admin makes — overrides, weak-proof closes, escalations — is captured with her reasoning | The chain is a support surface in theory; in practice it's a *surveillance* surface. She second-guesses because she knows she'll be reviewed in 3 months | Continuous; quietly exhausting | 4 | 3 | 3 | **10** |
| − | **System can't tell her what matters** | Queue has 14 incidents: 6 awaiting citizen-ack, 4 awaiting Karim's proof, 2 awaiting her override, 2 awaiting Pia's escalation. Flat list, not ranked action list | Admin has to triage by hand every morning. Her expertise is spent on ordering, not closing | Every morning start | 4 | 3 | 4 | **11** |
| − | **Tech mandate ends before problem does** | Karim is on site; contamination looks bigger than his scope — needs WASA valve shutoff, lab test, councillor notification | Admin escalates; path unclear; chain has no template. She's on her own for the escalation decision | When it happens; structurally damaging | 2 | 5 | 4 | **11** |

### Positive Forces (what Adi is moving toward)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| + | **The close that's verifiable** | Photo + GPS + EXIF + sensor readback + Karim's reasoning + Anjali's ✅ all line up. Chain captures every input | Three months later, when Pia reviews, the close is *obviously right*. This is Adi's home win | Every closure | 5 | 5 | 5 | **15** |
| + | **Karim's proof is reliably good** | Karim's photos are clear; EXIF consistent; reasoning says *what* he did and *why* it should resolve | Adi's verification is fast because the proof is solid. She trusts Karim because Karim delivers | Every proof review | 4 | 5 | 4 | **13** |
| + | **Priya's verification is reliably deep** | Priya captures sensor + cross-checks + reporter call summary + decision rationale | Adi can tell *why* Priya made her call. She doesn't have to redo Priya's work | Every handoff | 4 | 4 | 4 | **12** |
| + | **Anjali taps back, promptly** | Citizen-ack queue resolves quickly because Anjali trusts the system enough to engage | Her ✅ / ❌ tap is the citizen's voice in the audit trail; her responsiveness is what makes the close defensible | Every citizen-ack | 4 | 4 | 4 | **12** |
| + | **Escalation path is clear** | When Karim's mandate ends before the problem does, Adi knows who to call — WASA specialist, PHA on call, councillor, lab. Chain captures escalation as a first-class event | Adi's escalation decisions are auditable and the path is reproducible | When escalation is needed | 3 | 5 | 4 | **12** |
| + | **Chain supports her judgment** | Every decision is captured, but the capture is a *resource* — she can pull her own chain segment, see what she decided and why, trust her reasoning | The chain is her memory, not her judge | Every decision | 4 | 4 | 4 | **12** |
| + | **Queue tells her what matters** | Closed-loop queue pre-ranked: overrides awaiting call, proofs awaiting verification, escalations awaiting decision. Citizen-ack waits run in background | Her morning starts with the ranked action list, not the flat inbox | Every shift | 5 | 4 | 5 | **14** |
| + | **Override rate trends toward expert-level** | Over months, override rate trends toward a stable defensible number; false-positive rate trends toward zero | Expertise compounds in the dashboard, not just in her head | Monthly aggregate; quarterly trend | 3 | 4 | 4 | **11** |
| + | **System defends her, not the other way around** | When Pia reviews, the system surfaces Adi's reasoning in context — sensor showed, Karim submitted, Anjali tapped | Adi doesn't have to defend her close; the close defends itself | Every Pia review | 4 | 5 | 4 | **13** |
| + | **Citizens get acknowledged even when she can't close fast** | When Adi's queue is full and a close is delayed, Anjali still gets the in-progress signal — "your report is being verified" | Goal 3 (citizens feel heard) is preserved even when Adi is the bottleneck | Every queue delay | 4 | 4 | 4 | **12** |

---

## Relationship to Business Goals

- ✅ **Goal 1 — Loop is reproducible (direct, the close is the loop's end-state).** Adi's close is the loop's last step. If the close happens, the loop ran end-to-end. If the close is wrong, the loop ran but the goal failed. **This is the goal she serves by doing her job correctly.**

- ✅ **Goal 2 — Loop is defensible (direct, primary).** Every input to her close is on the chain. Her override reasoning is captured. Her escalation decisions are auditable. Her close is the load-bearing audit signal that makes Goal 2 real. **This is the goal she makes possible by doing her job well.**

- ✅ **Goal 3 — Citizens feel heard in motion (indirect, the citizen-ack is the close's final word).** Adi dispatches the citizen-ack. Anjali's ✅ / ❌ tap is the close's final word on whether the resolution was real. Adi's work preserves Goal 3 by ensuring that when citizens get the closure ack, it's a real close — not a paper close.

---

## Design Implications for Freya

| Force | Implication for the Admin (closed-loop) surface |
|---|---|
| The close that's not real | Closure surface shows *every input* that justifies the close — sensor readback, Karim's proof, Priya's verification, Anjali's tap — in one view. The close button is greyed until every input is present. |
| Karim can't do more | "Escalate back to Karim" is a first-class action with structured fields (what's missing, what we need, ETA expectation). The chain captures it as `ProofInsufficient` event. |
| Anjali doesn't tap | Citizen-ack queue shows ack-window countdown per incident. Silent incidents auto-route to a "needs follow-up" sub-queue, not the main queue. The system honours the citizen's silence as structural, not personal. |
| Trust-band override that goes wrong | Override surface requires structured reasoning capture (not free text). The override is auditable; the reasoning is the defence. |
| Escalation that has nowhere to go | First-class escalation event with templates (WASA specialist, PHA on call, councillor, lab). The system builds the escalation ladder over time from real escalations. |
| Karim's proof keeps being weak | Per-Karim proof-quality dashboard visible to Admin (and to Karim). Trends are the conversation. |
| Priya's verification is thin | Per-Priya verification-depth dashboard visible to Admin. The system surfaces the trend so it can be addressed, not so Admin can complain. |
| Chain captures too much | Decision capture is structured, not free-form. Reasoning fields have specific options ("insufficient proof," "trust-band override," "escalation") so Admin isn't writing essays for the chain. |
| System can't tell her what matters | Queue is pre-ranked by what needs her now (overrides > proofs > escalations > citizen-ack waits). Triage is built in, not hand-done. |
| Tech mandate ends before problem does | "Beyond tech mandate" is a first-class event type. Admin can flag it, the system suggests the escalation path based on similar prior incidents. |
| The close that's verifiable | Closure view surfaces every input in one place — photo, GPS, EXIF, sensor readback, Karim reasoning, Priya verification, Anjali tap. The close is verifiable at a glance. |
| Karim's proof is reliably good | No design implication — this is the steady state. |
| Priya's verification is reliably deep | No design implication — this is the steady state. |
| Anjali taps back promptly | No design implication — this is the steady state the system protects. |
| Escalation path is clear | Escalation templates surface the path based on the incident type. The system builds the ladder from real escalations. |
| Chain supports her judgment | Decision capture is structured, not surveillance. Reasoning fields are short, specific, and reusable. |
| Queue tells her what matters | Queue is pre-ranked; morning starts with the action list, not the flat inbox. |
| Override rate trends toward expert-level | Per-Admin override-rate trend visible in the dashboard. False-positive rate tracked. |
| System defends her, not the other way around | When Pia reviews, the close's context surfaces automatically — sensor showed X, Karim submitted Y, Anjali tapped Z. Adi doesn't defend; the close defends itself. |
| Citizens get acknowledged even when she can't close fast | In-progress signals to Anjali run on automation, not on Adi's throughput. The ack queue is separate from the close queue. |

---

_Produced by Saga — 2026-09-10_
_Source: Adi workshop (decision lane; verifier; the close is the loop's end-state; per-incident mirror of PIA's city-scale defensibility fears)_
