# Escalation Policy — Surakkha v1

Companion to the SPEC kernel. Defines the tiered escalation policy in operational detail that does not fit the five-field kernel.

---

## 1. The four-tier model

Contamination is a probabilistic state over time, place, and source. The escalation policy is calibrated to the asymmetry that false-negative cost (people drink poison) dominates false-positive cost (people boil unnecessarily for a day). The vendor ships WHO-grounded defaults; the PHA owns customization per jurisdiction.

| Tier | Trigger | Action | Who owns transition |
|---|---|---|---|
| **T0 — Background** | Normal operating condition. Sensors within baseline, no active complaint cluster. | Logging only. No public messaging. System is "green but reading." | Operator (Priya) routine confirmation. |
| **T1 — Single anomaly** | One sensor outside threshold OR one credible local-operator report OR one complaint cluster (≥3 Ramesh reports in a zone in 24h). | Investigate. Pull operator into the loop. No public message. | Priya unilaterally. |
| **T2 — Multi-source corroboration** | ≥2 independent sources concur: sensor + Anjali, OR Anjali + Ramesh cluster, OR sensor + env signal. Source-fusion rank-decision starts. | Pre-playbook activation. Lab sample dispatched if classifiable. | Priya unilaterally, with audit-log justification required. |
| **T3 — Confirmed event** | T2 plus lab confirmation OR Priya's professional judgment (override with reason) OR PHA call. Sub-tiered: 3a targeted (small zone), 3b city-wide (PHA + mayor briefed), 3c state/national (PHA leads, system is backbone). | Playbook execution: valve closure, isolation, public notice (T3a only — targeted), lab verification, all-clear protocol. | **PHA approval required for transition T2→T3.** Mayor's office for T3 sub-tier and T4. |
| **T4 — Crisis** | Active outbreak OR catastrophic infrastructure event. | All T3 actions + multi-agency coordination + city-wide public communication + media protocol. | PHA + Mayor jointly. Mayor's office owns public message tone. |

The transition T0→T1→T2 is operator-domain: Priya moves freely with audit-log reasoning. T2→T3 requires a PHA approval gate — embedded governance, not a UI nuisance. Priya's authority and PHA's authority are both load-bearing.

---

## 2. Tier 3 sub-tiers

T3 is the political-risk band. It is the only tier where public notice can fire, and therefore the only tier where a wrong call reaches the population. The sub-tiers calibrate scope of message, scope of briefing, and scope of coordination.

| Sub-tier | What fires it | Looped in | Message scope |
|---|---|---|---|
| **3a — Targeted** | Confirmed contamination confined to a small zone (single ward, single distribution branch, single sentinel cluster). Lab confirmation OR strong sensor + Anjali convergence. | PHA on notice; local councillor briefed; utility operations mobilized. | Targeted public notice to affected zone only. WhatsApp + SMS to zone residents. No city-wide broadcast. No press. |
| **3b — City-wide** | Confirmed contamination with cross-zone implications (source-grade trigger, pump-station compromise, multi-ward Anjali convergence, or 3a escalation when isolation fails). | PHA + Mayor's office formally briefed; utility leadership; donor co-branding activated if applicable. | City-wide public notice prepared and ready. Mayor owns the tone. Press liaison active. |
| **3c — State / national** | Confirmed contamination with state-level public-health implications (cross-utility, trans-jurisdictional, industrial-spill source, slow-poison pattern surfaced). | PHA leads. State health authority, neighboring-city PHAs, national agencies briefed. System is backbone for coordination. | State-coordinated public notice. Surakkha provides audit chain and source-fusion evidence; PHA and state own the message. |

The 3a→3b escalation is operational and may move on Priya + PHA judgment. The 3b→3c escalation is political and requires PHA + Mayor alignment. T4 sits above 3c, reserved for active outbreak or catastrophic infrastructure failure, with PHA + Mayor joint ownership and full multi-agency coordination.

---

## 3. Signal fusion matrix

Movement between tiers is driven by specific source combinations. The matrix below is the operational definition of "what makes the tier change."

| Movement | Required sources | Threshold / pattern |
|---|---|---|
| **T0 → T1** | Sensor OR Anjali OR Ramesh cluster | Any one credible signal outside baseline. Sensor: threshold breach. Anjali: single credible report. Ramesh: ≥3 reports in one zone in 24h. |
| **T1 → T2** | ≥2 independent sources | Sensor + Anjali, OR Anjali + Ramesh cluster, OR sensor + environmental signal. Independent means not co-sourced (one Anjali and one of her own reports do not count as two). |
| **T2 → T3a** | Lab OR Priya override OR PHA call | Lab confirmation of classifiable contaminant, OR Priya professional judgment with override-reasoning captured, OR direct PHA call. |
| **T3a → T3b** | Spatial or operational escalation signal | Contamination not isolable to single zone, OR isolation fails, OR source-grade trigger. |
| **T3b → T3c** | Cross-jurisdictional implication | Cross-utility source, trans-boundary spread, industrial-spill origin, or slow-poison pattern detected across multiple points. |
| **Any → T4** | Active outbreak OR catastrophic infrastructure | Hospital admissions correlated, OR main transmission failure, OR mass-exposure event. |

Sources are not interchangeable in weight. Sensor weight, Anjali weight, Ramesh-cluster weight, lab weight, and environmental-signal weight are city-configurable per contaminant class. Source-credibility weights for Anjali are learned from historical override-outcome accuracy and updated weekly in v1.

---

## 4. Voting matrix

Authority at each transition is explicit. "Voting" here means authority + required action + audit obligation, not consensus.

| Transition | Priya | PHA | Mayor | Audit obligation |
|---|---|---|---|---|
| **T0 → T1** | Sole authority | Notified | — | Routine confirmation log. |
| **T1 → T2** | Sole authority | Notified | — | Justification entry required. |
| **T2 → T3a** | Sole authority (with override option) | **Approval required** | Briefed | Two-person signature: Priya + PHA approver. Override-with-reasoning if Priya proceeds without lab. |
| **T3a → T3b** | Recommends | **Approves** | **Briefed; approves message tone** | Three-signature capture: Priya action, PHA approval, Mayor message-tone sign-off. |
| **T3b → T3c** | Recommends | **Approves + leads** | Aligned | PHA-led; system captures coordination evidence. |
| **T2/T3 → T4** | Recommends | **Approves jointly with Mayor** | **Approves jointly with PHA; owns message tone** | Joint signature; press-protocol log entry. |

The T2→T3 boundary is the political hinge. It is the gate that separates internal investigation from external communication. Below the gate, Priya is sovereign; above the gate, the PHA is sovereign until the Mayor takes the message-tone seat at T3+.

---

## 5. Acute vs. chronic contamination policy

Acute contamination favors speed over certainty. Sewage cross-connection, industrial spill, and pump-station failure are the canonical cases: hours matter, hours cost lives. Operators and PHAs should be willing to escalate on weaker corroboration for this class.

Chronic contamination favors certainty over speed. Long-term leach events, low-dose cumulative exposure, and seasonal drift can wait for lab confirmation. False-positive public notice on a chronic pattern destroys trust without saving lives; the asymmetric cost flips.

Both poles are configurable per contaminant class. The city sets:

- **Source-weight profile per contaminant class** (chlorine residual, turbidity, pH, conductivity, lead, bacterial, chemical).
- **Minimum corroboration count per class** (acute may run at 2-source minimum; chronic requires lab confirmation before T3).
- **Override tolerance per class** (acute allows Priya override-with-reasoning to T3 on 2 sources; chronic does not).

### 5a. Tiered PHA-approval SLA per contaminant class (C-3)

The PHA-approval gate at T2→T3 does not run on a single SLA. The city and the PHA negotiate a tiered SLA keyed to contaminant class:

- **Acute contaminant classes** (bacterial, chemical spill, sewage cross-connection, industrial discharge): **minutes SLA, on-call rotation.** PHA approval is a paging-and-confirm flow, not a meeting. The platform exposes a one-tap "approve / decline / defer" channel that reaches the on-call PHA approver within minutes; the system auto-escalates to the next approver in the rotation on timeout. Default SLA: 5 minutes. Default rotation: 3 named PHA approvers, 7×24 coverage.
- **Chronic contaminant classes** (lead leach, long-term conductivity drift, cumulative low-dose exposure, seasonal source drift): **hours SLA, business hours.** PHA approval is a queue-and-decide flow; the platform surfaces a "next PHA business-hours batch" lane for chronic-class transitions. Default SLA: 4 hours during PHA business hours; defer overnight, batch next morning. Default: single daytime approver, batched review twice per day.

This tiering is captured in the audit chain at SLA-config time and on every escalation event. The SLA tier itself is PHA-tunable per contaminant class but is logged, not silent — every SLA change is a two-person event with reasoning.

The asymmetry is deliberate: acute escalation costs lives if it waits; chronic escalation costs trust if it fires on weak corroboration. The SLA tier encodes the cost asymmetry at the governance layer, where it can be defended in inquiry.

Defaults ship WHO-grounded. PHA customizes per jurisdiction and per incident class. The PHA-pane exposes the configuration and the audit chain captures every change with reasoning.

---

## 6. Why this matters politically

T3 escalation is where political risk concentrates. A false boil notice is career-ending for the PHA director; a missed escalation is preventable deaths on his watch. The tiered model is the political-defense surface sold to him: he owns the threshold where public notice fires, he owns when broadcast messaging goes out, the system surfaces his decision with a full audit chain he can defend in any post-incident inquiry. He is positioned as the champion, not the gatekeeper — that framing closes the sale. The Mayor owns message tone, not the threshold. The system itself is invisible infrastructure: residents trust the ward councillor and the local operator, not the brand. Authority is visible; the platform is not. That separation is what makes the political defense hold under pressure.