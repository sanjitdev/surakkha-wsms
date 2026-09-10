# Pia the Public Health Authority — Persona 02

> Priority: Primary
> Business goals served: G1 (indirect, load-bearing for WB sign-off), G2 (direct, primary), G3 (indirect, gatekeeper-only)

---

## Who Pia Is

Pia is the Dhaka Public Health Authority (PHA) director — a career public-health officer, likely trained as an epidemiologist or environmental health specialist. She sits at the intersection of three pressures: (a) WB funding accountability (lighthouse deliverables are tied to IDA/IBRD disbursement-linked indicators), (b) Dhaka WASA operational responsibility (the utility does the field work, but the public health authority owns the public-notice threshold), (c) Mayor's office political pressure (public-notice tone is owned there at T3+). She is named, accountable, and visible. Her weekday is dominated by preparing what to show the next meeting — WASA leadership, the WB country office, PHA board, ICDDR,B credentialing board, Mayor's office.

She does not "live" in the system the way Priya does. She logs in weekly when there's an active situation, mostly monthly. Each login is preparation for showing someone else.

---

## Psychological Profile

Pia thinks in **defensibility**, not features. Her mental model of the system is: *"every claim I make about the city is anchored to a chain event that someone with no Surakkha installed can verify."* **Bold traits: Defensibility-first.** **Audit-narrative literate** — she reads a chain segment the way a chartered accountant reads a ledger, and she can tell the difference between a workflow that executed and an outcome that happened. **Stakeholder-aware** — every chart she looks at is a chart she might have to project on a wall. **Stewardship, not authority** — she does not exercise power over Priya or Anjali; she signs off so that they can exercise theirs with cover.

She distrusts systems that make her look good in the short run and create liability in the long run. She is the **named public-health authority**, and she knows that "the system worked as designed" is not a defense when a citizen is sick. She wants the system to make her accountable, not the system to absorb her accountability.

---

## Internal State

Pia is **cautiously working**, not anxious. She is not debugging the system; she is signing it off. **Bold dominant emotions: working anticipation, public-trust stewardship.** When she opens the dashboard, she is looking for: anomalies in trust-band overrides, T3-boundary events that need her signature, deviation clusters from the previous month, chain-integrity monitor status, the headline number for the meeting she's preparing.

When she closes the dashboard, she wants to walk away with: one exhibit she can drop into a deck, one number she can defend in writing, and the certainty that nothing happened this period that she should know about and didn't.

---

## Usage Context

**How Pia finds the system:** Same as any other user — she logs in to a dashboard. The dashboard is not a back-end tool; it is her working surface.

**Emotional state on arrival:** Working. She opens the dashboard with a purpose — usually because she has a meeting coming up, because she's preparing a brief for the Mayor's office, or because the WB country office asked for an update. She is *always* preparing to show something to someone.

**Behavior pattern:** Dashboard-first. She lands on the overview, reads the headline numbers and the trust-band distribution, then drills into the chart that supports the story she needs to tell today. She rarely reads the monthly report PDF — the dashboard *is* the report, just always-on. Charts are *exhibits*, not data — each one is a pre-shaped narrative that survives being projected on a wall.

**Decision criteria:** "Can I export this view and put it in a meeting?" A chart is useful if it is screenshot-ready, has clean labels, and tells the story without her having to narrate it. A data table is useful only if she is the one doing the analysis; she is not — the dashboard did.

**Login cadence:** Weekly if there is an active situation (open T3 incident, WB review in flight, scheduled meeting). Monthly otherwise — the dashboard has to be *informative on first open* without requiring continuous monitoring. No "you haven't been here in a while" guilt patterns.

---

## Driving Forces

Format: WHAT + WHY + WHEN
Score: Frequency (1–5) + Intensity (1–5) + Fit (1–5) = Total /15

### Negative Forces (what Pia is moving away from)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| − | **Wrong incidents, real consequences** | Trust band misroutes (false positive floods the city OR false negative lets bad water through) | Over-taxing the city erodes trust in the system; under-taxing lets citizens drink bad water | Every incident — the error is silent until the audit asks | 5 | 5 | 5 | **15** |
| − | **Solved on paper, not in reality** | Chain shows clean execution; field reality unchanged | WB reviewer conflates chain = impact; Pia cannot prove the difference | Every monthly PHA report; every disbursement-linked indicator review | 5 | 5 | 5 | **15** |
| − | **Accountability vanishes into the system** | When something goes wrong, "the system worked as designed" — but no one is accountable | Pia's role is to be the accountable public-health authority; if the system absorbs accountability, her role disappears | Every incident that goes wrong; every audit | 4 | 5 | 5 | **14** |
| − | **Citizens stop reporting because no one came** | Anjali reports, gets acked, sees nothing happen, stops bothering | The reporter base thins; the social infrastructure that makes the sensor graph trustworthy collapses | Quietly, over months; visible only when the next crisis hits | 4 | 5 | 4 | **13** |
| − | **Money doesn't reach the problem** | Spend cannot be traced to resolved incidents | WB disbursement-linked indicators + city budget pressure both demand impact-per-taka evidence | Every quarterly review; every WB disbursement milestone | 5 | 4 | 4 | **13** |

### Positive Forces (what Pia is moving toward)

| # | Force | WHAT | WHY | WHEN | F | I | Fit | Total |
|---|-------|------|-----|------|---|---|-----|-------|
| + | **Trust band is correct, demonstrably** | Every incident in the right inbox bucket; high-band actually needs urgent response; low-band actually doesn't | Pia can prove this to a WB reviewer with evidence, not assertion | Every monthly report; every WB review | 5 | 5 | 5 | **15** |
| + | **Resolution is real, not paper** | `IncidentClosed` corresponds to water actually safe again — verified by post-resolution testing or Anjali's ✅ tap (or `IncidentReopened{parent}` on ❌) | The audit is about *outcomes*, not just *workflows* | At every closure; at every monthly aggregate | 5 | 5 | 5 | **15** |
| + | **Clear accountability, owned by named roles** | Chain names the actors: which operator didn't dispatch within SLA, which admin overrode the trust band and why, which sensor went silent and when | The system names the actors; the actors own the decision; the public-health authority holds them to account | Every incident; every audit | 5 | 4 | 5 | **14** |
| + | **Citizens keep reporting because it works** | Anjali reports, gets acked, sees motion, gets a closure signal, sees the city respond | The reporter base is a *growing* social infrastructure, not a thinning one | Monthly aggregate; quarterly trend | 4 | 5 | 4 | **13** |
| + | **Spend is traceable to resolved incidents** | Every BDT of WB disbursement-linked spend is traceable to a chain-anchored outcome | PHA monthly report is auto-assembled, WB review is a 30-minute conversation not a 3-week audit | Every quarterly review; every WB disbursement milestone | 5 | 4 | 4 | **13** |
| + | **Coverage that matches the threat** *(deferred-positive)* | More sensors in more locations turn raw water-quality data into a real signal, not a sampled one | Pia can defend "we know what's happening across Dhaka" instead of "we know what's happening in the 25 wards we instrumented" | Phase 2; depends on landing Phase 1 cleanly | 2 | 4 | 2 | **8** |
| + | **System scales because it earns trust** *(deferred-positive)* | More people hear about Surakkha — Anjalis, councillors, school principals, citizens — and want to use it | The lighthouse is reproducible because people *want* it reproduced | Phase 2+; depends on landing Phase 1 cleanly | 2 | 3 | 2 | **7** |

---

## Audience Matrix (what Pia shows, to whom)

| Audience | What they care about | What Pia shows them |
|---|---|---|
| WASA leadership | Operational metrics — response time, sensor uptime, resolution rate | Trend charts over time, ward-by-ward comparisons |
| WB country office | Disbursement-linked indicators, results framework evidence, audit-chain integrity | Aggregated KPIs, exception reports, "money → outcomes" trail |
| Board meetings (PHA board, City Corp board) | Public-notice thresholds, false-positive rates, public-safety narrative | Headline numbers, trust-band distribution, response-time compliance |
| Mayor's office | Public-notice thresholds at T3+ boundary, message tone | Trend charts, threshold-tuning history (Phase 2 dual signature) |
| ICDDR,B | Anjali credibility, credential pipeline, weekly check-in discipline | Reporter reputation ledger (weekly cadence), credential issuance rate |

---

## Relationship to Business Goals

- ✅ **Goal 1 — Loop is reproducible (indirect, load-bearing for WB sign-off).** Pia serves this by *being the public sign-off*. When the WB country office asks "is this real?", Pia's signature on the lighthouse sign-off is the answer. She doesn't drive reproducibility — that's Priya's lane — but she certifies it externally.

- ✅ **Goal 2 — Loop is defensible (direct, primary).** This is *Pia's home turf*. Every audit chain entry, every T3-boundary dual signature, every chain-integrity monitor tick, every read-access log — all of it exists because Pia will eventually have to defend it. She is the named accountable authority, and the loop is designed to make her defensible, not to make her famous.

- ✅ **Goal 3 — Citizens feel heard in motion (indirect, gatekeeper-only).** Pia serves this by *not being the bottleneck*. The acknowledgment signal (got heard → in progress → closed) runs without her involvement. She only enters when (a) a T3-boundary public notice fires (Phase 2), (b) a chronic-class threshold needs tuning, or (c) a chain-integrity anomaly demands escalation. The citizens' loop has to work *despite* her being busy, not *because* she's watching.

---

## Design Implications for Freya

| Force | Implication for the PHA dashboard (Phase 2 surface; Phase 1 shapes the data contract) |
|---|---|
| Wrong incidents, real consequences | Trust-band distribution chart must show *historical* misroute rate (override rate per band per month). |
| Solved on paper, not in reality | Resolution-rate vs. citizen-✅-tap chart. If they diverge, flag it as an exhibit. |
| Accountability vanishes | Per-actor SLA compliance chart. Operator name → SLA compliance %, admin name → override rate with reasoning. |
| Citizens stop reporting | Anjali reporting rate trend, by ward. Cohort retention over 90 days. |
| Money doesn't reach | Disbursement-linked indicators → resolved-incident count chart. One view, auto-export. |
| Trust band is correct | Auto-mark anomalies — overrides where admin disagreed with band × outcome was bad. |
| Resolution is real | Post-resolution sensor readback + Anjali's tap → "resolution verified by ≥1 source" badge. |
| Clear accountability | Named actors surfaced in every chart tooltip. No anonymous role labels. |
| Citizens keep reporting | Reporter reputation ledger in dashboard; weekly cohort view. |
| Spend traceable | Per-ward, per-month "incidents resolved / BDT spent" chart. WB-export-ready. |
| Coverage (deferred) | Sensor density per ward table. Forward-compat: chart schema must extend without re-design. |
| System scales (deferred) | No fixed constraint on user count, ward count, or reporter count in any chart's design. |

---

_Produced by Saga — 2026-09-10_
_Source: Pia workshop (constraint persona — no Phase 1 UI; forces shape Phase 1 data contract and Phase 2 dashboard design)_
