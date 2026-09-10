# Feature Impact Analysis — Surakkha v1

> Phase 2 — Trigger Mapping · Workshop 5
> Derived from: 02-persona-pia-the-public-health-authority.md, 03-persona-priya-the-pipeline-pilot.md, 04-persona-anjali-the-anchor.md, 05-persona-adi-the-auditor.md driving forces
> Status: Draft — for review

---

## Scoring Method

Features scored against prioritized driving forces (0–3 per force, weighted by FIA score /15).
Higher score = stronger alignment with user psychology and business goals.

Features are inferred from positive driving forces (in-phase only — deferred-positive forces are excluded per spec). A feature may address multiple positive forces; weighted scores are summed across all matching forces.

Scale: 0 (no impact) · 1 (minor indirect) · 2 (meaningful) · 3 (directly addresses).
Weight = force's FIA total / 15.
Weighted contribution per cell = score × weight.

Personas covered:
- **Pia** (constraint persona — drives Phase 1 data contract and Phase 2 dashboard design)
- **Priya** (action lane — load-bearing operator)
- **Anjali** (source lane — citizen edge)
- **Adi** (decision lane — verifier / closer)

---

## Feature Scores

| Rank | Feature | Pia | Priya | Anjali | Adi | Weighted Total | Priority |
|------|---------|-----|-------|--------|-----|----------------|----------|
| 1 | Pre-triage trust band with auto-routing | 3.00 | 3.00 | 1.00 | 2.33 | **9.33** | High |
| 2 | In-flight citizen motion signals (state transitions) | 2.60 | 1.73 | 3.00 | 1.60 | **8.93** | High |
| 3 | Post-resolution sensor readback verification | 3.00 | 2.80 | 0.67 | 2.33 | **8.80** | High |
| 4 | Structured per-decision reasoning capture | 2.33 | 2.60 | 0.00 | 2.47 | **7.40** | High |
| 5 | 5-min citizen acknowledgment ("got heard" signal) | 0.87 | 0.00 | 3.00 | 0.27 | **4.13** | High |
| 6 | Closure ack with ✅ / ❌ tap + reopen lineage | 2.00 | 1.73 | 2.80 | 2.00 | **8.53** | High |
| 7 | Pre-ranked operator inbox (trust-band order, "needs me" filter) | 0.00 | 3.00 | 0.00 | 2.80 | **5.80** | High |
| 8 | Auto-generated monthly PHA report from audit trail | 3.00 | 1.73 | 0.00 | 0.80 | **5.53** | High |
| 9 | Disbursement-linked indicator chart (spend → resolved incidents) | 2.60 | 0.00 | 0.00 | 0.00 | **2.60** | High |
| 10 | Ward-level reporter reputation ledger (internal, never surfaced to citizens) | 2.60 | 2.07 | 0.73 | 1.47 | **6.87** | High |
| 11 | Per-actor SLA compliance + override-reasoning dashboard | 2.80 | 1.47 | 0.00 | 2.07 | **6.33** | High |
| 12 | Resolution-proof bundle viewer (photo + GPS + EXIF + sensor readback + reasoning) | 2.00 | 1.87 | 0.00 | 3.00 | **6.87** | High |
| 13 | Handover brief auto-generation at shift end | 0.00 | 2.40 | 0.00 | 1.60 | **4.00** | Medium |
| 14 | Tier-signal internal handling (citizen vs anchor response parity) | 0.00 | 0.80 | 2.40 | 0.00 | **3.20** | Medium |
| 15 | Ward-level "your neighbourhood at a glance" trend view for citizens | 1.73 | 0.00 | 2.40 | 0.00 | **4.13** | Medium |
| 16 | False-positive "thanks, we checked" response (no reputation penalty) | 0.00 | 0.80 | 2.40 | 0.00 | **3.20** | Medium |
| 17 | First-class escalation event + escalation path templates | 0.00 | 0.00 | 0.00 | 2.00 | **2.00** | Medium |
| 18 | Pre-ranked closed-loop queue (overrides > proofs > escalations > ack waits) | 0.00 | 1.87 | 0.00 | 2.80 | **4.67** | Medium |
| 19 | Per-operator false-positive / false-negative trend dashboard | 0.00 | 2.20 | 0.00 | 1.47 | **3.67** | Medium |
| 20 | Citizen-credibility badge on account profile (small, opt-in visibility) | 0.00 | 0.00 | 2.20 | 0.00 | **2.20** | Medium |
| 21 | Background in-progress signal automation (decoupled from close velocity) | 0.00 | 0.00 | 2.40 | 1.60 | **4.00** | Medium |
| 22 | Decision-capture structured field enforcement (no free-text essays) | 0.00 | 1.60 | 0.00 | 1.60 | **3.20** | Medium |
| 23 | Trust-band distribution chart with historical override rate per band | 3.00 | 0.00 | 0.00 | 0.00 | **3.00** | Medium |
| 24 | Low-band dismissal reasoning capture ("marked-dismissed-because") | 0.00 | 2.00 | 0.00 | 0.00 | **2.00** | Medium |
| 25 | Next-scheduled-sensor-readback display for low-band dismissals | 0.00 | 2.40 | 0.00 | 0.00 | **2.40** | Medium |
| 26 | Per-Karim proof-quality trend dashboard | 0.00 | 0.00 | 0.00 | 1.73 | **1.73** | Medium |
| 27 | Per-Priya verification-depth trend dashboard | 0.00 | 0.00 | 0.00 | 1.60 | **1.60** | Medium |
| 28 | Citizen-ack window countdown with silent-incident auto-routing | 0.00 | 0.00 | 0.80 | 1.47 | **2.27** | Medium |
| 29 | Trust-band override structured reasoning surface (for verifier) | 0.00 | 0.00 | 0.00 | 1.60 | **1.60** | Medium |
| 30 | Reporter-cohort retention trend (90-day window per ward) | 1.73 | 0.00 | 0.00 | 0.00 | **1.73** | Medium |
| 31 | Cross-tenant chain access log with read-attempt events | 1.47 | 0.00 | 0.00 | 0.00 | **1.47** | Medium |
| 32 | Offline-queue status indicator on citizen submit surface | 0.00 | 0.00 | 2.00 | 0.00 | **2.00** | Medium |
| 33 | Ward-vs-ward comparison charts for operational trend reviews | 2.00 | 0.00 | 0.00 | 0.00 | **2.00** | Medium |
| 34 | Post-closure sensor readback "we may have missed something" prompt | 0.00 | 0.93 | 2.00 | 0.00 | **2.93** | Deprioritized |
| 35 | Anti-abuse `bulk_triage_routed` internal flag (never surfaces to citizen) | 0.00 | 0.00 | 1.60 | 0.00 | **1.60** | Deprioritized |
| 36 | Beyond-tech-mandate escalation event type | 0.00 | 0.00 | 0.00 | 1.47 | **1.47** | Deprioritized |
| 37 | Anjali reporting rate trend (by ward) for PHA dashboard | 1.73 | 0.00 | 0.00 | 0.00 | **1.73** | Deprioritized |
| 38 | Resolution-rate vs. citizen-✅-tap divergence chart | 3.00 | 0.00 | 0.00 | 0.00 | **3.00** | Deprioritized |
| 39 | Trust-band correct-rate exhibit (band vs. outcome backtest) | 3.00 | 0.00 | 0.00 | 0.00 | **3.00** | Deprioritized |
| 40 | Named-actor tooltip surfacing on every chart (no anonymous role labels) | 2.80 | 0.00 | 0.00 | 0.00 | **2.80** | Deprioritized |
| 41 | Sensor density per ward table (forward-compat for Phase 2 coverage) | 0.80 | 0.00 | 0.00 | 0.00 | **0.80** | Deprioritized |

---

## High Priority

Features that address the top-scored driving forces. Must be in the core product.

### Pre-triage trust band with auto-routing
**Forces addressed:** Pia "Trust band is correct, demonstrably" (15), Priya "Triage that respects her capacity" (15), Adi "Queue tells her what matters" (14), Anjali "Ack lands" (15 — minor indirect via routing speed).
**Design implication:** Trust band is computed in the gateway *before* any human sees the report. Inbox routing is fully automated by band — high to operator, medium to verifier-pending, low to background. The band value is the load-bearing signal for every downstream surface; correctness here is the foundation of every other defensibility claim.

### In-flight citizen motion signals (state transitions)
**Forces addressed:** Anjali "Motion is visible" (15), Pia "Citizens keep reporting because it works" (13), Priya "Triage that respects her capacity" (15 — indirect), Adi "Citizens get acknowledged even when she can't close fast" (12).
**Design implication:** Every state transition (`Verified`, `Assigned`, `On Site`, `Resolved`, `Closed`) pushes a signal to the citizen's surface in Bangla. The citizen sees her report moving through the loop without refreshing — this is the in-progress signal that bridges the got-heard ack and the closure ack.

### Post-resolution sensor readback verification
**Forces addressed:** Pia "Resolution is real, not paper" (15), Priya "Resolution that's real" (14), Adi "Close that's verifiable" (15), Anjali "Closure is real and acknowledged" (14 — indirect via post-closure sensor).
**Design implication:** After `IncidentClosed`, the system schedules and surfaces the next sensor readback for that location. If readback clears contamination, closure is confirmed by sensor evidence. If readback does not clear, the system prompts Anjali ("we may have missed something") and triggers `IncidentReopened{parent}`. This is the bridge between workflow closure and outcome reality.

### Structured per-decision reasoning capture
**Forces addressed:** Pia "Clear accountability, owned by named roles" (14), Priya "Verdicts she can defend" (13), Adi "Chain supports her judgment" (12), Adi "System defends her, not the other way around" (13).
**Design implication:** Every operator and verifier decision writes a structured reasoning field at the moment of decision — not a separate form, not free-text. The reasoning is the audit trail; the structure (specific options: "trust-band override," "insufficient proof," "escalation") keeps the capture light and the audit reusable. Three months later, Pia pulls the chain segment and reads the reasoning, not the workflow.

### 5-min citizen acknowledgment ("got heard" signal)
**Forces addressed:** Anjali "Ack lands" (15), Pia "Citizens keep reporting" (13 — indirect).
**Design implication:** Within 5 minutes of source-side timestamp, the citizen's phone receives a Bangla message confirming the report landed, what band it landed in, and roughly what happens next. This is the load-bearing UX promise of the citizen surface — sub-60-sec submit + 5-min ack. The ack is the difference between "I bothered for nothing" and "the city saw me."

### Closure ack with ✅ / ❌ tap + reopen lineage
**Forces addressed:** Anjali "Closure is real and acknowledged" (14), Pia "Resolution is real" (15), Priya "Resolution that's real" (14), Adi "Close that's verifiable" (15 — via Anjali's tap as evidence input).
**Design implication:** Closure ack includes a plain-language resolution summary + ✅ / ❌ tap. The tap is the citizen's voice in the audit trail. ✅ confirms the closure matches reality; ❌ triggers `IncidentReopened{parent}` with full lineage preserved on the chain. Without this surface, the closure is paper-true but citizen-false.

### Pre-ranked operator inbox (trust-band order, "needs me" filter)
**Forces addressed:** Priya "Triage that respects her capacity" (15), Adi "Queue tells her what matters" (14).
**Design implication:** Inbox sorts high-band first, medium-band next, low-band only if there's slack. Filter chip separates "needs me" from "in flight." The remaining work is at the top, not the total work — Priya's hardest shift ends with the inbox empty, not a backlog.

### Auto-generated monthly PHA report from audit trail
**Forces addressed:** Pia "Trust band is correct" (15), Pia "Spend is traceable" (13), Pia "Citizens keep reporting" (13), Priya "Verdicts she can defend" (13 — indirect).
**Design implication:** Report is assembled from chain events, never hand-built. Includes trust-band distribution, override rate, resolution rate vs. citizen-✅-tap, named-actor SLA compliance, spend-to-outcome trail. Auto-export format for WB review (Phase 2 export tooling).

### Disbursement-linked indicator chart (spend → resolved incidents)
**Forces addressed:** Pia "Spend is traceable to resolved incidents" (13), Pia "Money doesn't reach the problem" — implicit in the negative force addressed.
**Design implication:** One chart, auto-export. Per-ward, per-month: "incidents resolved / BDT spent." This is the exhibit Pia drops into a WB review deck — one number, one chart, defensible because every BDT traces to a chain-anchored outcome.

### Ward-level reporter reputation ledger (internal, never surfaced to citizens)
**Forces addressed:** Pia "Citizens keep reporting because it works" (13), Priya "False-negative incidents that almost never happen" (12), Adi "Anjali taps back, promptly" (12), Anjali "Her report is taken seriously the first time" (12 — indirect).
**Design implication:** Internal ledger tracks reporter accuracy over time. Tier signal (citizen vs anchor) is internal-only — never surfaces to the citizen's account UI. Antiledger hits are routed to `bulk_triage_routed = true`, not a reputation penalty.

### Per-actor SLA compliance + override-reasoning dashboard
**Forces addressed:** Pia "Clear accountability, owned by named roles" (14), Pia "Wrong incidents, real consequences" — implicit negative addressed, Adi "Override rate trends toward expert-level" (11).
**Design implication:** Operator name → SLA compliance %, verifier name → override rate with reasoning, named actors surfaced in every chart tooltip. No anonymous role labels. This is the chart that survives projection on a wall at a board meeting.

### Resolution-proof bundle viewer (photo + GPS + EXIF + sensor readback + reasoning)
**Forces addressed:** Adi "Close that's verifiable" (15), Pia "Resolution is real, not paper" (15), Priya "Verification that's decisive" (15 — indirect), Priya "Verdicts she can defend" (13).
**Design implication:** Single view per closing incident surfaces every input that justifies the close — photo, GPS, EXIF, post-resolution sensor readback, Karim's reasoning, Priya's verification, Anjali's tap. The close button is greyed until every input is present.

---

## Medium Priority

Address if feasible. Enhance the experience without blocking core value.

### Handover brief auto-generation at shift end
**Forces addressed:** Priya "Handover briefs that actually brief" (12), Adi "Queue tells her what matters" (14 — indirect).
**Design implication:** Brief is auto-generated at end of shift, names the open threads by incident id, not as a list of unresolved events. Tribal knowledge stops compounding across shifts.

### Tier-signal internal handling (citizen vs anchor response parity)
**Forces addressed:** Anjali "Her report is taken seriously the first time" (12).
**Design implication:** Citizen-tier and anchor-tier reports get identical response time and identical ack language. The tier signal shapes how Priya triages, not whether the system believes her. Internal-only.

### Ward-level "your neighbourhood at a glance" trend view for citizens
**Forces addressed:** Anjali "Her neighbourhood gets better, visibly" (12), Pia "Citizens keep reporting" (13 — indirect).
**Design implication:** Monthly view on the citizen's account: incidents resolved, response time trend, sensor coverage change. Surfaced as a chart, not a number — it tells a story she can share with her neighbours.

### False-positive "thanks, we checked" response (no reputation penalty)
**Forces addressed:** Anjali "System doesn't punish her for getting it wrong" (12).
**Design implication:** When a report turns out not to be a real incident, the response is "thanks, we checked" — not a reputation hit, not a soft mark on the ledger. Anti-abuse `bulk_triage_routed` flag is internal only.

### First-class escalation event + escalation path templates
**Forces addressed:** Adi "Escalation path is clear" (12).
**Design implication:** First-class escalation event type with templates (WASA specialist, PHA on call, councillor, lab). The system builds the escalation ladder over time from real escalations.

### Pre-ranked closed-loop queue (overrides > proofs > escalations > ack waits)
**Forces addressed:** Adi "Queue tells her what matters" (14), Priya "Triage that respects her capacity" (15 — indirect).
**Design implication:** Queue is pre-ranked by what needs her now. Triage is built in, not hand-done. Morning starts with the action list.

### Per-operator false-positive / false-negative trend dashboard
**Forces addressed:** Priya "Expertise that compounds" (11), Priya "False-negative incidents that almost never happen" (12).
**Design implication:** Per-operator false-positive / false-negative trend visible in the operator dashboard (not just in the monthly PHA report). Expertise compounds in the dashboard, not just in her head.

### Citizen-credibility badge on account profile
**Forces addressed:** Anjali "She earns standing by being useful" (11).
**Design implication:** Small, opt-in badge on the citizen's account profile surfaces the trajectory. Civic-anchor recruitment emerges from this trajectory — the system invites consistent reporters to anchor tier.

### Background in-progress signal automation (decoupled from close velocity)
**Forces addressed:** Anjali "Motion is visible" (15), Adi "Citizens get acknowledged even when she can't close fast" (12).
**Design implication:** In-progress signals run on automation, not on the verifier's throughput. The ack queue is separate from the close queue. Goal 3 (citizens feel heard) is preserved even when the verifier is the bottleneck.

### Decision-capture structured field enforcement
**Forces addressed:** Adi "Chain captures too much" — implicit negative addressed, Adi "Chain supports her judgment" (12).
**Design implication:** Reasoning fields have specific options ("insufficient proof," "trust-band override," "escalation") so the verifier isn't writing essays for the chain. Capture is structured, not surveillance.

### Trust-band distribution chart with historical override rate per band
**Forces addressed:** Pia "Trust band is correct" (15).
**Design implication:** Chart shows *historical* misroute rate (override rate per band per month). Auto-mark anomalies — overrides where the verifier disagreed with the band × outcome was bad.

### Low-band dismissal reasoning capture
**Forces addressed:** Priya "False-negative incidents that almost never happen" (12), Priya "Verdicts she can defend" (13).
**Design implication:** Low-band dismissals need a "marked-dismissed-because" capture (sensor-still-clean, reporter-not-reached-but-prior-trustworthy, etc.) so the call can be defended later.

### Next-scheduled-sensor-readback display for low-band dismissals
**Forces addressed:** Priya "False-negative incidents that almost never happen" (12).
**Design implication:** Low-band dismissals show the next-scheduled-sensor-readback timestamp — so the operator can trust her call was right when that readback lands.

### Per-Karim proof-quality trend dashboard
**Forces addressed:** Adi "Karim's proof is reliably good" (13).
**Design implication:** Per-Karim proof-quality dashboard visible to verifier (and to Karim). Trends are the conversation.

### Per-Priya verification-depth trend dashboard
**Forces addressed:** Adi "Priya's verification is reliably deep" (12).
**Design implication:** Per-Priya verification-depth dashboard visible to verifier. The system surfaces the trend so it can be addressed.

### Citizen-ack window countdown with silent-incident auto-routing
**Forces addressed:** Adi "Anjali taps back, promptly" (12), Adi "Anjali doesn't tap" — implicit negative addressed.
**Design implication:** Citizen-ack queue shows ack-window countdown per incident. Silent incidents auto-route to a "needs follow-up" sub-queue, not the main queue.

### Trust-band override structured reasoning surface
**Forces addressed:** Adi "Trust-band override that goes wrong" — implicit negative addressed.
**Design implication:** Override surface requires structured reasoning capture (not free text). The override is auditable; the reasoning is the defence.

### Reporter-cohort retention trend (90-day window per ward)
**Forces addressed:** Pia "Citizens stop reporting because no one came" — implicit negative addressed.
**Design implication:** Anjali reporting rate trend, by ward. Cohort retention over 90 days.

### Cross-tenant chain access log with read-attempt events
**Forces addressed:** Pia "Clear accountability" (14 — indirect), Goal 2.3.
**Design implication:** Every chain read logged as `ChainRead` event with per-role policy check. Cross-tenant read attempts logged as `CrossTenantAccessAttempted`.

### Offline-queue status indicator on citizen submit surface
**Forces addressed:** Anjali "Report disappears" — implicit negative addressed.
**Design implication:** Offline queue surfaces "queued, will send when online" so the citizen knows her report isn't lost on her phone.

### Ward-vs-ward comparison charts for operational trend reviews
**Forces addressed:** Pia "Citizens keep reporting" (13 — indirect), Pia "Trust band is correct" (15 — indirect).
**Design implication:** WASA leadership review surface — operational metrics by ward, response time, sensor uptime, resolution rate.

---

## Deprioritized

Low impact on current driving forces. Consider in future iterations.

- **Post-closure sensor readback "we may have missed something" prompt** — implicit in the post-resolution sensor readback feature; treat as a sub-capability of that high-priority feature rather than a separate one.
- **Anti-abuse `bulk_triage_routed` internal flag** — implicit in the reporter reputation ledger; not a citizen-facing capability.
- **Beyond-tech-mandate escalation event type** — implicit in the first-class escalation event + escalation path templates; treat as a sub-event of that medium-priority feature.
- **Anjali reporting rate trend (by ward) for PHA dashboard** — implicit in the reporter-cohort retention trend; not a separate capability.
- **Resolution-rate vs. citizen-✅-tap divergence chart** — covered by the auto-generated monthly PHA report (a sub-chart within it).
- **Trust-band correct-rate exhibit (band vs. outcome backtest)** — covered by the auto-generated monthly PHA report (a sub-chart within it).
- **Named-actor tooltip surfacing on every chart** — design-system enforcement rather than a feature; treat as a chart-rendering rule across all PHA-dashboard charts.
- **Sensor density per ward table** — Phase 2 deferred-positive force (coverage); forward-compat only; no Phase 1 surface.

---

## Gap Analysis

High-scored forces with no strong product response. Flag for Freya.

| Force | Persona | FIA Score | Gap |
|-------|---------|-----------|-----|
| Triage that respects her capacity | Priya | 15 | The pre-ranked inbox is the core response, but the *underlying* capacity problem is that Priya's bottleneck is the reporter-call step (F5+I5+Fit5). Reporter-call automation is not in scope for Phase 1. **Gap: human-phone bottleneck at the verification step cannot be fully automated; Phase 1 accepts Priya's capacity ceiling as a constraint.** |
| Verification that's decisive | Priya | 15 | The "one view per verification signal" design implication is partially addressed by the resolution-proof bundle viewer, but the reporter-call itself remains a 90-sec phone conversation outside the system. **Gap: reporter-call outcome capture is a workflow, not a feature. Capture mechanism (call-summary field, call-duration timestamp) is open in FE-F4.x scope.** |
| Citizens feel heard in motion | Anjali (the entire Goal 3 arc) | 15/15/14 | The ack + motion + closure signals cover the citizen arc structurally, but **the in-progress signal during slow operator handoffs depends on the verifier's queue not blocking the ack pipeline.** The background in-progress automation addresses this partially, but the SMS gateway reliability under intermittent connectivity is a Phase 1 risk not owned by any feature. **Gap: SMS-first-class reliability (C-11) under low-end Android intermittent connectivity is a platform risk, not a feature.** |
| T3-boundary dual signature (implicit in Pia's forces) | Pia | n/a | The T3-boundary playbook approval is out of Phase 1 scope (per product brief). **Gap: Pia's T3-boundary veto power has no Phase 1 enforcement surface — the audit chain captures the event but no human is named on the receiving end. This is a known deferral, not a design oversight.** |
| Escalation path is clear | Adi | 12 | The first-class escalation event covers the data shape, but **the escalation ladder content (WASA specialist on call, PHA on call, councillor, lab) is operational knowledge that lives outside Surakkha.** Phase 1 ships with templates; Phase 2 must populate them from real escalations. **Gap: escalation ladder is empty on day one.** |
| Coverage that matches the threat (deferred-positive) | Pia | 8 | Deferred per spec — Phase 2 only. **Gap: sensor density expansion is out of scope; flagged for Freya's Phase 2 trigger map.** |
| System scales because it earns trust (deferred-positive) | Pia | 7 | Deferred per spec — Phase 2+. **Gap: growth and adoption are out of scope; no Phase 1 design implication.** |
| Reporter-cohort retention trend is a *negative* force's response | Pia (negative) | 13 | The negative force "Citizens stop reporting because no one came" has a strong response (the motion-visibility + ack + closure arc + cohort retention trend), but **the social-infrastructure collapse is detected late — only after it has already happened.** Early-warning signals (single-ward reporting drop, week-over-week volume decline) are not currently surfaced. **Gap: leading indicators of reporter-base erosion are missing; consider adding a "ward reporting drop" alert to the PHA dashboard.** |
| Chain captures too much (Adi negative force) | Adi | 10 | The structured decision-capture fields address this partially, but **the underlying tension between audit-capture depth and operator cognitive load has no clean resolution.** Phase 1 accepts structured-field mitigation; Phase 2 may need lighter-weight reasoning capture. **Gap: balance between audit depth and operator burden is unresolved; revisit after Phase 1 field experience.** |

---

_Produced by Saga — 2026-09-10_
_Derived autonomously from: 02-persona-pia-the-public-health-authority.md, 03-persona-priya-the-pipeline-pilot.md, 04-persona-anjali-the-anchor.md, 05-persona-adi-the-auditor.md_
_Derived from driving forces across Pia (constraint), Priya, Anjali, Adi workshops_
_Review: share with client before handoff to Freya_
