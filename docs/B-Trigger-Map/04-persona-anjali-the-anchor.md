# Anjali the Anchor — Persona 04

> Priority: Tertiary (after PIA + Priya)
> Business goals served: G1 (indirect, the report is the loop's input), G2 (indirect, her closure tap is an audit signal), G3 (direct, primary — she is the citizen edge)

---

## Who Anjali Is

Anjali is a Dhaka citizen. **The name "Anjali" is the role archetype, not a person.** Every reporting citizen in Dhaka — parent, neighbour, school principal, ward councillor, imam, anyone with a phone and an NID — is an instance of this role. In Phase 1 there are 50 civic anchors (ICDDR,B-credentialed, BDT 2,000/month stipend tied to weekly check-in discipline) plus an open-ended count of reporting citizens. The role archetype covers both tiers.

She thinks about her family's safety and health. She doesn't tolerate unhealthy water. She reports as soon as the water seems foul or she hears of a nearby water-related problem. She is **not** a tech user; she is a parent / neighbour / community member who happens to have a phone.

She registers with her **NID (National ID) phone number**, which makes her an authentic user — not anonymous. The system treats her account as the unit of reputation; civic anchors and reporting citizens share the same web surface; the *credibility signal* emerges from her reporting history, not from a separate credential application.

---

## Psychological Profile

Anjali thinks in **safety, not features**. Her mental model of the system is: *"the city sees what I see, and acts on it so my family isn't drinking bad water."* **Bold traits: Family-first.** **Civic-minded without being civic-duty-framed** — she reports because she cares, not because she was hired. **Pragmatic** — she uses the lowest-friction surface that works; she does not optimise for UX. **Trusts the system if it responds, distrusts it if it doesn't** — the response is the proof, the absence of response is the disproof. **Bangla-native, English-fallback** — Bangla is her operating language, English is what she falls back to when Bangla fails.

She does not care about the chain, the trust band, the playbook, or the verification reasoning. She cares about: did the city see this, did the city act, did the water get fixed.

---

## Internal State

Anjali is **practically urgent** when she submits and **curiously attentive** when she checks back. She is not anxious; she is *in motion*. **Bold dominant emotions: protective urgency when reporting, attentive curiosity when checking.** When she submits, she wants: confirmation the report landed, an estimate of what happens next, and an end to the worrying uncertainty of *did anyone see this?*

When she checks back, she wants: motion in the report (someone is doing something), and a clear closure signal when the water is fixed (or an honest explanation if it wasn't).

When the system fails her, the emotion is **quiet withdrawal** — not anger, not complaint, just *I won't bother next time.* That quiet withdrawal is what erodes the social infrastructure over months.

---

## Usage Context

**How Anjali arrives at the system:** She does not "log in" in the user-product sense. She opens a web form on her phone's browser — low-end Android, intermittent connectivity, Bangla primary, English fallback. First-time visitors register with her NID phone number; returning visitors are recognised by the bound number.

**Emotional state on arrival:** Either *urgent* (water looks bad — submit before the moment passes) or *curious* (the city said a tech was coming — checking what happened).

**Behavior pattern — submit flow:** Open form → photo (if she has one) + voice note (if she prefers talking) + 1-line text in Bangla → tap send → done. **Target: under 60 seconds (FR-4 acceptance criterion).**

**Behavior pattern — check flow:** Open form → status tab → recent reports + their motion timeline → tap one for detail → tap ✅ / ❌ on closure if available.

**Surface:** All Surakkha surfaces are web-based in Phase 1. No mobile app, no PWA polish. Anjali submits via the web form; Priya, Karim, Admin, and Pia use their respective web surfaces. WhatsApp front-end is a Phase 2+ consideration (FR-4.1 deferred).

**Offline behaviour:** When her phone is offline, the report is queued on the device and sent when connectivity returns. The phone-as-network pattern (FR-4.4) applies if the system ever wants to push the report via SMS as a fallback in low-coverage wards.

**Decision criteria:** "Did the city respond?" Everything else is invisible to her. The system's success is the response, not the workflow.

**What she never sees:** Priya's dashboard, the trust band as a number, the chain explorer, the operator reasoning. She sees only her own account's status view.

**What she does share:** When the water gets fixed and she gets the closure ack, she often tells her neighbours ("the system worked — I reported and they came"). That word-of-mouth is the social infrastructure that keeps the reporter base growing.

---

## Driving Forces

Format: WHAT + WHY + WHEN
Score: Frequency (1–5) + Intensity (1–5) + Fit (1–5) = Total /15

### Negative Forces (what Anjali is moving away from)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| − | **The report that disappears** | She hits send; nothing comes back. No ack, no motion, no closure. The phone shows "submitted" but she has no proof the system saw her | Next time something looks wrong, she weighs the cost of submitting again against the cost of doing nothing. Doing nothing wins | Once is enough; once is too much | 5 | 5 | 5 | **15** |
| − | **The report that comes back wrong** | She hit send; the system acked her; then a tech arrived at the wrong place, or a public notice fired for a different ward, or someone called back asking questions she already answered in the report | The system saw her — but heard her wrong. She's correcting the system's mistake instead of being helped by it | Quarterly; visible in the call-back pattern | 3 | 4 | 5 | **12** |
| − | **Being the false alarm** | She reported something she genuinely thought was foul water; it wasn't; the tech came; the chain recorded it; her ward-level reputation ledger carries a soft mark | She wasn't trying to be wrong — she was trying to be useful. The system treats her like a noisy reporter. Next time she's uncertain, she stays quiet | When it happens; quietly corrosive | 3 | 5 | 4 | **12** |
| − | **Being disbelieved because of her tier** | She's a plain citizen, not an ICDDR,B anchor. She submits a report that looks identical to an anchor's. The system ranks hers lower, acts slower | The system *says* it trusts her; it acts like it doesn't | Visible only if the tier signal surfaces to her; corrosive when it does | 2 | 5 | 3 | **10** |
| − | **The problem that stays unfixed** | She reported; the system acked; a tech was assigned; chain shows `IncidentClosed`; but the water is still foul. She reports again. Same loop. She loses faith that the system can fix things | She calls her councillor instead. The system worked; the water didn't. Anjali is now outside the loop | Monthly; the case that erodes the reporter base | 3 | 5 | 4 | **12** |

### Positive Forces (what Anjali is moving toward)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| + | **The ack lands** | She hits send; within 5 minutes the system tells her it received her report, what band it landed in, and roughly what happens next. Phone buzzes, message in Bangla, the report wasn't lost | The ack is the difference between "I bothered for nothing" and "the city saw me" | Every successful submission | 5 | 5 | 5 | **15** |
| + | **The motion is visible** | After the ack, she gets occasional signals — "your report has been verified," "a technician is on the way," "your report is being escalated" | The report hasn't disappeared into the city's machinery; she can see it move | Between ack and closure, every transition | 5 | 5 | 5 | **15** |
| + | **The closure is real and acknowledged** | She gets the final signal — the water is fixed (or wasn't, and the system tells her why). She can tap ✅ if the closure matches her reality, or ❌ if it doesn't, and the system acts on both | Her tap is part of the audit trail — her reality is the final word on whether the closure was real | Every closure | 4 | 5 | 5 | **14** |
| + | **Her report is taken seriously the first time** | A citizen-tier report and an anchor-tier report with the same content get the same response time. The tier signal shapes how Priya triages, not whether the system believes her | She doesn't see a difference she shouldn't see | Every submission | 4 | 4 | 4 | **12** |
| + | **Her neighbourhood gets better, visibly** | Over weeks and months, reports from her ward resolve faster, sensor coverage improves, public-notice history shows fewer "still happening" entries | The system isn't just receiving reports; it's making her neighbourhood safer | Monthly aggregate; quarterly trend | 4 | 4 | 4 | **12** |
| + | **She earns standing by being useful** | The longer she reports accurately, the more the system recognises her as a credible reporter — even if she's never enrolled as an anchor | Her standing grows without her having to apply for credentials. She is the citizen-anchor emerging from the citizen base | Quarterly trend; surfaced as a small badge on her account | 3 | 4 | 4 | **11** |
| + | **The system doesn't punish her for getting it wrong** | When she reports something that turns out not to be a real incident, the system's response is "thanks, we checked" — not a reputation hit, not a soft mark on her ledger | The error cost stays on her side; the response cost stays on the system's side. She keeps reporting because the system keeps being kind | Every false-positive she submits | 4 | 4 | 4 | **12** |

---

## Relationship to Business Goals

- ✅ **Goal 1 — Loop is reproducible (indirect, the report is the loop's input).** Anjali's report is what the loop runs on. Without her submission, the loop has no signal to act on. She doesn't drive reproducibility — Priya does — but she is the *source* of every incident that flows through the loop.

- ✅ **Goal 2 — Loop is defensible (indirect, her closure tap is an audit signal).** Her ✅ / ❌ tap on closure is part of the audit trail. If she taps ❌, the incident reopens with full lineage; if she taps ✅, her reality is the system's record of the closure being real. The chain captures her voice as evidence, not just her words.

- ✅ **Goal 3 — Citizens feel heard in motion (direct, primary).** Anjali is the citizen edge of the entire loop. The got-heard ack is hers. The in-progress signals are hers. The closure ack with the ✅ / ❌ tap is hers. **She is the only persona whose entire experience of the system is "the loop told me what was happening."** If Goal 3 fails, it fails for her first.

---

## Design Implications for Freya

| Force | Implication for the citizen (Anjali) web surface |
|---|---|
| The report disappears | Sub-60-sec submit + guaranteed 5-min ack is the load-bearing UX promise. Offline queue must surface "queued, will send when online" so she knows her report isn't lost on her phone. |
| The report comes back wrong | Every signal sent to Anjali must use the same identifiers she submitted (ward, location, contaminant class). Mismatches surface as "we saw something — please confirm this is the right one." |
| Being the false alarm | False-positive reports get a "thanks, we checked" response — *no reputation penalty*. The anti-abuse `bulk_triage_routed` flag is an internal signal, never surfaced to her account UI. |
| Being disbelieved because of tier | Citizen-tier and anchor-tier reports get identical response time and identical ack language. The tier signal is internal-only; Anjali never sees a difference in how her report is treated. |
| The problem stays unfixed | If `IncidentClosed` is followed by a post-closure sensor readback that doesn't clear, Anjali gets a "we may have missed something" message prompting her to re-submit if the water is still foul. The reopen pathway is one tap from her account, not a new submission. |
| The ack lands | Ack is in Bangla, includes a plain-language "what happens next" sentence, lands within 5 minutes of the source-side timestamp. |
| The motion is visible | Every state transition (`Verified`, `Assigned`, `On Site`, `Resolved`, `Closed`) pushes a signal to her account. She sees the report moving through the loop without having to refresh. |
| The closure is real and acknowledged | Closure ack includes the resolution summary + ✅ / ❌ tap. The tap is the citizen's voice in the audit trail. |
| Her report is taken seriously the first time | Internal tier signal never surfaces. The response time is the response time. |
| Her neighbourhood gets better, visibly | A monthly "your ward at a glance" view on her account: incidents resolved, response time trend, sensor coverage change. Surfaced as a chart, not a number, so it tells a story she can share with her neighbours. |
| She earns standing by being useful | Account-level credibility badge (small, on her account profile) surfaces the trajectory. Civic-anchor recruitment emerges from this trajectory — the system invites consistent reporters to anchor tier. |
| The system doesn't punish her for getting it wrong | False-positive responses are *kind*. No ledger hits. The system treats her uncertainty as a feature, not a bug. |

---

_Produced by Saga — 2026-09-10_
_Source: Anjali workshop (source lane; citizen edge of Goal 3; NID-bound web-form surface in Phase 1; civic-anchor + reporting-citizen tiers share the role archetype)_
