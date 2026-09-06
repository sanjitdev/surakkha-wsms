# Product Brief — Surakkha v1 (Lighthouse City)

**Status:** Draft v1, derived from 2026-09-06 brainstorming session
**Owner:** Founding team
**Audience:** Future product, architecture, engineering, design, sales hires
**Scope:** One lighthouse city, 12–18 months from first conversation to paid renewal

---

## 1. Product one-sentence description

Surakkha is a two-tier operator response loop — a network of **Anjali**-class local operators (school principals, ward stewards, community health volunteers) who detect contamination that sensors miss, feeding a **Priya**-class central city operator who resolves incidents through admin-authored playbooks, with tiered escalation governed by the Public Health Authority (PHA), a sentinel-anchored sensor mesh, multi-channel consumer messaging, and a tamper-evident audit chain that doubles as operator legal defense, ML training fuel, and cross-city regulator forecasting — delivered as multi-tenant SaaS, first deployed to a single ~500K-population Tier-2 Indian lighthouse city on donor funding, designed to federate after the loop is proven.

---

## 2. Why now — the forces that make this viable

Three convergences — institutional, regulatory, technological — make this product possible in 2026 and unlikely five years earlier or five years later.

**Institutional.** Tier-2 Indian cities have just enough technical capacity (digital municipal infrastructure, smart-cities mission precedent, public-health-officer digital literacy) but not enough that they have built their own equivalent. The Smart Cities Mission created a procurement vocabulary and a class of officials who recognize "monitoring-as-a-service" as a category. Urban water crises repeat annually — the institutional memory of an outbreak is fresh enough to motivate capital spend but old enough that the pain has subsided into "background dread." This is the adoption window.

**Regulatory.** Two structural shifts: (1) PHAs in India and similar emerging-market regulators are gaining statutory muscle and political willingness to mandate cross-utility oversight — they want standard-setting authority and a vendor who hands them that authority is welcome. (2) Donor agencies (WHO, UNICEF, World Bank, ADB, climate funds) have shifted toward outcome-priced water-sanitation programs — they fund what they can audit, and they will fund a system that produces append-only, defensible audit trails at the rate their reporting cycles demand. The regulatory environment is permissive, even encouraging, for a vendor who builds PHA-governance and audit-by-default into the product.

**Technological.** Three things converged simultaneously. First, low-cost industrial probes from Chinese OEMs dropped municipal-grade hardware to ~$200–500/sensor (10x cheaper than five years ago). Second, computer vision on commodity smartphones turned a $1 paper test strip into a quantitative reading — Anjali-grade sentinel sensing at ward-scale economics. Third, multi-radio connectivity (cellular / LPWAN / store-and-forward on SD) means a sensor mesh can survive intermittent connectivity, which is the actual failure mode in target cities. **None of these alone is new — together they enable a price point and a deployment density that was not previously possible.**

A fourth force, less structural but tactical: cultural acceptance of WhatsApp as official communication channel. The consumer-channel problem is solved for free in target geographies.

---

## 3. The structural insight — two-tier operator model

The session surfaced one bedrock insight that re-frames the entire product: **contamination is detectable + containable, not preventable, and operators exist because of this — their job IS the response, not the prevention.** A product that optimizes for sensor accuracy without optimizing for the operator response loop optimizes for the wrong thing.

This leads to the second insight. A single operator class cannot do both halves of the loop well. Detection at last-mile (school taps, dead-end pipes, illegal tappings, social context sensors cannot see) requires a trusted human embedded in the community. Resolution at city scale (multi-source triage, lab coordination, valve closure, PHA communication, media handling) requires a central operator with cross-ward authority and institutional backing. **The two-tier operator model — Anjali local + Priya central — is therefore not an organizational choice. It is the product architecture.**

What this reframe does:
- **Collapses three problems into one design.** Ramesh-class noisy consumer reports, sensor blind spots at last-mile, and spoofing risk on a public reporting channel all dissolve if you have a designated trusted human (Anjali) reporting on behalf of her micro-community. Anjali is not "another sensor" — she is the designated-trusted-human version of Ramesh, with the same data but a different trust model.
- **Flips the architecture.** Priya is not the primary user with Anjali as a feature. Anjali is the primary user (50 of them in v1); Priya is the supervisor of a network of Anjalis. Mobile-first UX belongs to Anjali. Desktop dashboard belongs to Priya. Most of the engineering effort flows toward the local operator surface.
- **Makes the source-fusion engine coherent.** Without credible local reporting, source-fusion fuses only sensors (limited density, high unit-cost). With credible local reporting, source-fusion fuses sensors + Anjali + Ramesh-class citizen + lab + environment — and a cheap signal at scale can outweigh an expensive scarce one.
- **Reduces spoofing risk on the consumer channel.** Anonymous consumer reports are spoofable and panic-inducing. Designated-local-operator reports are not. The same chat surface that handles Ramesh "the consumer" handles Anjali "the trusted local employee" — but the second is treated as authoritative, not panic-triggering.

Every other architectural choice in this brief flows from this insight.

---

## 4. The lighthouse-city v1

### Geography and scope

**One Tier-2 Indian city, ~500,000 population.** Public case study. Multi-level champion stack. Goal: prove the response loop, not sensor density. 12–18 months from first conversation to paid renewal at 30/30/30/10 payment terms (signing / deploy / 6-month / renewal).

The city is chosen by criteria the founding team will refine: (a) a utility manager + PHA + mayor's office who will co-author playbooks and co-design tiered escalation; (b) at least one existing donor-funded water-sanitation program to ride alongside; (c) multilingual environment (Hindi + at least one regional language + ideally English) so localization is exercised; (d) reasonable travel distance from founding team for in-person co-design; (e) a digitally literate operator class (school principals, community health workers) who already use WhatsApp professionally.

### Sensors — strict v1 scope

- **5 industrial sensors** at source and pump stations (Hach / Thermo / Xylem probes, ~$200–500 each, integrated not manufactured) for high-leverage source-grade measurements.
- **30 sentinel strips** at schools, hospitals, community points. Each strip is a $1 paper test + smartphone photo + CV model. Anjali owns the strip at her site and the photo is the data node.
- **No municipal-grade hardware in v1.** The intermediate tier (Chinese OEM, $200–500) is for v2 after the model is proven.

This is approximately $2,500 industrial capex + 30 × $1 strips + 30 × phone-as-network = a 20x denser coverage footprint than industrial-only at a 6x lower capex.

### Operators

- **50 Anjalis** distributed across ~25 wards (2 per ward). Of these, **1–2 are real Anjalis** who co-designed v1 with the team, before recruitment broader.
- **1–2 Priyas** on the central dashboard. Priya is the co-designer city-side. She is the most important hire after the engineering lead.

### Channels (v1)

- **WhatsApp** as primary consumer channel.
- **SMS** as authoritative-notice fallback (carries more legal weight, lower spoofing risk).
- **1–2 ward councillor networks** as trust-bridging voices.
- **No IVR, no community radio, no dedicated consumer app in v1.**

### Sales motion (v1)

- Pre-RFP relationship building.
- Parallel donor conversation (smart-cities or World Bank water) — donor is not fallback, donor is **Day-1 primary**.
- 30/30/30/10 payment terms.

### Architecture (v1)

- Multi-tenant SaaS, single-city deployment.
- **Basic weighted-source fusion in v1** — not ML-heavy. The fusion engine is the architectural seam where sophistication can be added later (cross-city benchmarking, anomaly detection on overrides, drift prediction) but v1 ships weighted-voting with source-credibility weights.
- **Append-only cryptographic audit chain** as built-in platform feature.
- **3 UIs:** Anjali-mobile (Android, WhatsApp-fronted), Priya-desktop (incident dashboard + handover + monthly report assembly), PHA-pane (cross-ward aggregate + deviation dashboard + threshold tuning).

### What is NOT in v1 — explicit deferrals

- Federated multi-city operation. v1 is one city.
- Outcome-priced insurance product. That is a 5-year arc.
- Calibration-as-a-service standalone product. Calibration is a feature of the platform, not a SKU.
- Quarterly red-team mode. The defenses are designed in but the simulation is v2.
- ML-heavy detection / cross-city trained models. v1 uses weighted-voting only.
- Regulator-benchmarking product. The PHA-pane exists; cross-utility benchmarking is v2.
- Dedicated consumer mobile app. WhatsApp + SMS only.
- Building our own sensors at any tier. We integrate.
- Selling directly to consumers. We do not.
- Replacing the existing SCADA. We sit alongside it.

The single load-bearing test of v1 is: **does the playbook-driven, two-tier-operator, tiered-escalation, audit-tracked response loop work in a real city?** Everything else is supporting.

---

## 5. The personas

Every persona is built around a win condition. The product exists to serve those wins; if it does not, the product is wrong.

### Anjali — local operator / school principal

**Win condition:** *My school, my ward, my neighborhood is demonstrably safe, my reports are taken seriously, my effort earns me status and (ideally) income, and I am credited when something I caught gets resolved fast.*

Anjali is a school principal in her 30s–40s, mother of two, part-time health volunteer in her community. Android phone with a cracked screen. WhatsApp-only. Low data plan. Knows her school's water visually but does not know WHO guidelines. Will not read a dashboard, will not download a training app, will not log in daily. **What the product must do for her:**

- One-tap reporting. Voice + image over text. SMS fallback that is a first-class surface, not a degraded one.
- Local-language UI (Hindi + regional language) — language is a credibility signal, not just accessibility.
- Reports that route to Priya within minutes, with a credibility weight she does not see but which her track record has accumulated.
- Public acknowledgement when her report triggers a real response. She must **see** that her report mattered.
- A certification / credential built from her track record — marketable in high-unemployment labor markets; this is the social design that compensates for weak stipend budgets.
- Empowerment framing, not surveillance. The system feels like **for** her, not **on** her.

### Priya — central city operator

**Win condition:** *I resolve contamination incidents without harm, on shift every day, with full institutional backing; my expertise compounds; my PHA trusts me; the mayor does not bury me; my monthly report is auto-generated not assembled.*

Priya is the city's most experienced water-safety professional, often 10+ years in role, mid-30s to mid-40s. The most important non-founding hire. **What the product must do for her:**

- An incident dashboard ranked by severity, with source-fusion scoring already done — not raw sensor feeds, ranked action list.
- An auto-generated handover brief ("today's open threads") at shift change — kills tribal-knowledge dependency.
- Playbook editor (read-only at her permission level; she proposes deviations and edits which feed playbook amendments).
- Override-with-reasoning capture; her overrides are later compared to outcomes and contribute to threshold tuning and her credential.
- A 2-minute "what would have happened" simulator for new sensor configs, new playbook drafts, new shifts — so she can test before live.
- Auto-generated PHA monthly report assembled from audit trail, not by hand.
- A visible "your expertise is compounding" surface — every override outcome, every monthly stat.
- Escape hatch with friction when she deviates from playbook (welcome, blame-free review is the goal; a block would cost her trust on the bad-day).

### Dr. Mensah — PHA director (regulator)

**Win condition:** *I deliver clean water to my population without political blowback from preventable outbreaks, I cross-utility benchmark without litigation against me, I have early-warning before hospitals see patients, my office mandates a defensible standard across the region and is seen as the source of that standard, and the next outbreak is not mine to own alone.*

Dr. Mensah is a public-health regulator at state or city level, often physician-trained, mid-career. **What the product must do for him:**

- **One pane of glass across all utilities** in his jurisdiction, with comparison and benchmarking built in.
- **Independent second-source verification** of utility claims — sensor + Anjali + Ramesh + lab, not just the utility's own reports.
- **Early-warning** by triangulating sensor + complaint + environment into a probability-of-incident signal that fires before hospitals report cases.
- **Political cover** — append-only audit trail with cryptographic chaining, defensible in press conferences and inquiries.
- **Leverage over utilities** — objective indicators ("Zone 7 uncalibrated 47 days") he can name.
- **A standard he can mandate** — de facto standard = regulatory moat. PHA co-authors the playbook; the system is implemented in his image.
- A **deviation dashboard** across utilities — regulator's early-warning system for under-performers.
- Does **not** want to own consumer communications or to be the sole arbiter of alert tone. The product must give him policy control, not message-issuance duty.

### Ramesh — consumer (the 250,000th citizen of the lighthouse city)

**Win condition:** *I get a clear "is the water safe to drink right now" answer without downloading anything, I know what to do if it isn't, I trust the source enough to follow the advice, I do not get screamed at with panic for routine updates, and my reports (when I bother) are heard.*

Ramesh is the operator's downstream audience. He does not know the system exists. He trusts his ward councillor, not apps. **What the product must do for him:**

- Multi-channel reach (WhatsApp blast + SMS targeted + occasional ward-councillor endorsement) — distribution strategy, not a "product."
- Plain-language messages: "Safe now / Boil / Do not drink / Use bottled / Wait" — short, sourced.
- A way to report back if his household or block sees symptoms (voice / WhatsApp / SMS), contributing to the cheapest last-mile sensor network.
- Trust built through the local operator visibly using the system (Anjali endorsement at her school is brand-building).
- **Never** a dashboard. **Never** a dedicated app. **Never** a paywall.
- Messages routed via trusted voices (Anjali, councillor) carry more weight than system-issued messages; the system is invisible infrastructure, not a brand.

### The attacker

**Win condition:** *Damage public trust in the system, the utility, or the PHA — cost-effectively and deniably.*

Attacker is not a user; the attacker is a constraint. Profiles: script kiddie (embarrassment), state actor (real harm), insider (cheapest and most dangerous). **Attack vectors the product must defend in v1:**

- Spoofed sensor reading + replay against the ingestion API → false boil notice + public panic.
- DDoS on the consumer channel during a real crisis → real consumers do not get real notices.
- Spoofed regulator dashboard → "all green" while contamination is real.
- Slow-poison protocol — sub-threshold micro-doses across multiple points, cumulatively harmful, never flagged individually.
- Insider playbook tampering → wrong valve closure order or wrong threshold.
- Insider override of real alerts → "false positive, closing ticket."
- Insider exfiltration of audit trail → business-intelligence breach.

**Defenses built in v1:** sensor authentication + cryptographic signing (public sensor IDs are a feature AND a vulnerability, both are true); multi-signal trend detection against slow-poison; consumer channel redundancy (WhatsApp + SMS fallback); tamper-evident append-only audit chain; two-person rule for playbook edits and consumer message issuance; override-anomaly detection in v2 but logged for v1; data minimization (zone-level geofence not lat/long, access-logged operator data, anonymous-by-default consumer channel). The attacker is treated as a **product persona with features** — every defense is a saleable feature with a buyer (regulator, mayor, risk officer).

---

## 6. The tiered escalation policy

Contamination is a probabilistic state over time+place+source. False-negative cost (people drink poison) is asymmetrically worse than false-positive cost (people boil unnecessarily for a day). The escalation policy must be calibrated to that asymmetry, but it must also be **owned by the PHA**, not the vendor. The vendor provides WHO-grounded defaults; PHA customizes per jurisdiction.

### The four-tier model

| Tier | Trigger | Action | Who owns transition |
|---|---|---|---|
| **T0 — Background** | Normal operating condition. Sensors within baseline, no active complaint cluster. | Logging only. No public messaging. System is "green but reading." | Operator (Priya) routine confirmation. |
| **T1 — Single anomaly** | One sensor outside threshold OR one credible local-operator report OR one complaint cluster (≥3 Ramesh reports in a zone in 24h). | Investigate. Pull operator into the loop. No public message. | Priya unilaterally. |
| **T2 — Multi-source corroboration** | ≥2 independent sources concur: sensor + Anjali, OR Anjali + Ramesh cluster, OR sensor + env signal. Source-fusion rank-decision starts. | Pre-playbook activation. Lab sample dispatched if classifiable. | Priya unilaterally, with audit-log justification required. |
| **T3 — Confirmed event** | T2 plus lab confirmation OR Priya's professional judgment (override with reason) OR PHA call. **Sub-tiered:** 3a targeted (small zone), 3b city-wide (PHA + mayor briefed), 3c state/national (PHA leads, system is backbone). | Playbook execution: valve closure, isolation, public notice (T3a only — targeted), lab verification, all-clear protocol. | **PHA approval required for transition T2→T3.** Mayor's office for T3 sub-tier and T4. |
| **T4 — Crisis** | Active outbreak OR catastrophic infrastructure event. | All T3 actions + multi-agency coordination + city-wide public communication + media protocol. | PHA + Mayor jointly. Mayor's office owns public message tone. |

**Acute contamination favors speed beats certainty — operators and PHAs should be willing to escalate on weaker corroboration for a class of incidents where hours matter (sewage cross-connection, industrial spill). Chronic contamination favors certainty beats speed — long-term leach events can wait for lab confirmation. The escalation policy is configurable per contaminant class.**

The transition T0→T1→T2 is operator-domain — Priya can move freely with audit-log reasoning. T2→T3 requires a PHA approval gate; this is **embedded governance, not a UI nuisance.** Priya's authority and PHA's authority are both load-bearing.

### Why the tiered model matters politically

Tier 3 escalation is where the political risk sits (false boil notice = career-ending for Dr. Mensah; missed escalation = preventable deaths). The tiered model is the political-defense sales pitch to him: he **owns** the threshold where public notice fires, he **owns** when broadcast messaging goes out, the system surfaces his decision with full audit chain for follow-up. **He is the champion, not the gatekeeper** — that is the framing that closes the sale.

---

## 7. The playbook authoring workflow

The playbook is the unit of codified organizational knowledge. It is **operator/utility-authored, not vendor-written, not generic** — it is local, jurisdiction-specific, and explicitly designed to evolve from incidents. Public-health authorities (not mayors, not internal engineering) are the approval authority.

### The lifecycle

```
[author] → [approve] → [run] → [deviate] → [review] → [amend] → [re-approve]
```

1. **Author.** A senior operator (Priya, or her utility counterpart) drafts in a structured editor with constraint checks against WHO templates. Confidence score surfaces on the draft — lower confidence for novel regions, higher for well-trodden cases. Playbook editor doubles as **institutional memory and onboarding** — new operators learn the city's playbook as training material.
2. **Approve.** PHA Director (Dr. Mensah) reviews and signs. Vendor does not have approval authority. Audit-logged with timestamp + approver identity. Approval creates the version-of-record the live system loads.
3. **Run.** Priya and her team operate against the approved playbook. Every action (and every non-action) is logged against the playbook step, with reasoning.
4. **Deviate.** During live incident, Priya may **deviate with friction but not block**. Deviation is welcome; blame-free review is the goal. Each deviation is a first-class audit object: who / when / what / why / outcome.
5. **Review.** Post-incident, deviations cluster for review. PHA + utility + vendor review monthly. Patterns of deviation indicate either a bad playbook step (system problem) or a uniquely good operator instinct (training material).
6. **Amend.** Playbook is edited in response to review. **Deviations promote into playbook amendments** — that is how playbooks actually evolve. The system treats operator deviation as a leading indicator of where the playbook is wrong, not as a compliance failure.
7. **Re-approve.** PHA signs the amendment. Audit-logged. New version-of-record.

### Why deviation must be first-class

Without explicit deviation support, operators game the system: they match playbook steps formally but execute different intents. With deviation-with-reasoning + blame-free review + promotion-to-amendment, the system captures **real field learning** and turns it into institutional knowledge. This is the feedback loop a static playbook never has. Without it, the playbook decays the moment the city changes (new piping, new supplier, new season).

### A2 — the admin-authored playbook surface

The playbook editor must include: a structured editor with constraint checks; a 2-minute simulator / dry-run for new configurations; a WHO-grounded template library as starting point; versioning with sign-off metadata; a confidence score per playbook step; and a deviation log as an editable feed, not a punishment database.

Liability when a playbook step is wrong: the question is open and must be answered in writing before v1 launch. The leading hypothesis is **shared liability** — vendor commits to platform integrity, PHA commits to playbook approval, utility commits to operations within approved playbooks — with the audit chain as the evidence of which party committed to which decision. This is a legal design question, not an engineering one, and it lands before the first renewal.

---

## 8. The audit chain

The append-only, cryptographically chained audit log is a load-bearing platform feature, not an after-thought compliance surface. It serves three distinct stakeholders with three distinct products, all from the same data structure.

### What it records

Every event with a security, safety, or policy implication:
- Sensor calibration events (who, when, before/after reading, drift amount).
- Threshold changes (who changed, from what value to what value, why).
- Playbook approvals and amendments (signer, version, timestamp).
- Operator actions during incidents (action, reasoning, outcome).
- Deviations from playbook (who, why, outcome, post-incident review note).
- Consumer message issuance (issuer, two-person rule, content snapshot, recipient scope).
- System logins, role changes, permission grants.
- Lab submissions and results.
- Cross-system integrations (SCADA pulls, PHA dashboard reads).

The chain is **append-only with cryptographic linking** — each block references the prior, so retroactive tampering is detectable. Two-person rule on sensitive actions (consumer message issuance, playbook edits at T3 boundary) requires dual signatures captured in the chain.

### Three jobs the same data does

**1. Operator defense (Priya).** Every action, every reasoning, every deviation is captured and time-stamped. Under post-incident inquiry (regulator, press, court), the chain is her **proof that she made the right call, at the right time, with the right reasoning**. The same chain is also her proof that her deviation was reasonable — without it, deviation looks like negligence.

**2. ML training fuel (system).** Once the cross-city federation lands (v2+), the audit chain becomes **labeled incident training data at scale** — what triggered, what was decided, what worked, what did not. A model trained on 50,000 such events from 50 cities beats a model trained on 50 events from a single city. The data moat deepens with every city added.

**3. Regulator forecasting (Dr. Mensah / WHO / UNICEF).** Aggregated, anonymized, jurisdiction-level audit data feeds cross-jurisdictional public-health research and forecasting. The same data that defends Priya's decisions also lets Dr. Mensah predict which zones in his region are likely to escalate next quarter — **regulator's leading indicator**, not lagging indicator. WHO, UNICEF, climate funds, and insurance carriers are downstream buyers of this aggregated intelligence product.

### Why this is a moat

If we get this right, three moats compound at once: **legal** (audit chain defends us in operator/regulator litigation); **technical** (training fuel + cross-city federation); **commercial** (regulator forecasting product is a multi-stakeholder sale). They cannot be replicated by a sensor-only competitor because the sensor-only competitor does not have the operational loop generating the chain data.

---

## 9. The sales motion

The sales motion is not a single-channel effort. It is a multi-stakeholder campaign with a champion-stack order, a parallel donor motion, and a funding-channel choice that doubles as a sales weapon.

### Champion-stack order

Sell in this order — bottom-up trust first, decision authority last. Selling to finance first is the common mistake.

1. **Operator (Priya)** — co-design v1 with her. She becomes first champion, internal advocate, reference-deployment credibility.
2. **Utility manager** — operational ROI story, opex-savings framing, calibration automation.
3. **PHA (Dr. Mensah)** — cross-utility oversight + standard-setting authority. He becomes champion not gatekeeper because he owns the playbook approval and threshold policy.
4. **Mayor's office** — political-cover story, audit-trail-as-defense-in-inquiry, donor-branded visibility.
5. **Finance** — predictable subscription, 30/30/30/10 payment terms, ROI documentation. **Last** — finance approves, not initiates.

### Institutionalize across levels

Identify 2–3 champions per city (utility + PHA + mayor's office at minimum). Train successors in 30 days. Build org-owned value not person-owned. Survive admin change by positioning as institutional capacity, not political patronage.

### Donor funding as parallel primary sales motion

Donor funding is **not a fallback for slow sales** — it is **Day-1 primary** because:
- Donor-funded deployments become reference customers with donor branding as sales weapon.
- Donor contracts pay in tranches tied to milestones — cleaner cashflow than direct municipal sale.
- Donor-funded cycles (18–24 months from application to close) align with our pre-revenue runway needs.
- Active donor channels: **WHO, UNICEF, World Bank water programs, ADB, climate funds, smart-cities missions, foundations** (Gates, Wellcome, Open Society), bilateral aid (DFID, USAID, GIZ, JICA).

The donor channel is parallel because it serves different buyers than municipal sale — donor is looking for replicable model + audit-by-default + outcome-evidence, while utility is looking for ROI + risk reduction. Same product, different decks.

### Multi-stakeholder value-prop matrix

| Stakeholder | Their win condition | Our pitch |
|---|---|---|
| Operator (Priya) | Resolve incidents without harm | I am your supervisor tool; I learn from you; your credential compounds. |
| Utility manager | Opex savings + risk reduction | Calibration automation, SLAs you can hit, defensible incident record. |
| PHA (Dr. Mensah) | Cross-utility oversight + standard-setting | You own the playbook approval; you have independent second-source verification; you mandate the standard. |
| Mayor | Political cover, donor visibility | Audit trail as press-defense; donor co-branding; system in your city is named. |
| Finance | Predictable spend, ROI | 30/30/30/10 payment terms; opex-not-capex; quantified ROI documentation. |
| IT | Clean integration | APIs into SCADA, billing, lab systems; least-privilege permissions; SOC2-ready. |

### Buyer ≠ user ≠ payer

Always map the triangle explicitly. Anjali is the user. Priya is the user + operator buyer. Utility is the operational payer. Donor is the capital payer. Mayor is the political decider. PHA is the policy approver. **No single sales conversation closes the deal — close the campaign, with sequenced wins across the matrix.**

### Time sales around elections

Year-before-election: fastest conversion. Election-year: frozen procurement. Year-after-election: unpredictable (new admin). Position as institutional capacity, survive admin changes.

---

## 10. The trust/adoption design

All Group D constraints converge on a single design principle: **the local operator is the only trust-bearing interface.** Not the app. The human.

If the Anjali recruitment / training / retention operational challenge is not solved, no amount of software engineering ships a product. Therefore the trust layer is **incentive design + cultural contextualization + privacy-by-default** more than it is feature design.

### Local operator as trust bridge

Three pillars:
- **Visibly using.** The system must be visibly at Anjali's school in a way parents and ward residents can see. Her notification is also a neighborhood notification.
- **Trusted-intermediary messages.** Messages routed through her (and ward councillors) carry more weight than system-issued messages. The system is invisible infrastructure; the brand is her endorsement.
- **Failures acknowledged publicly.** A bad batch of sentinel strips, an outage, a missed event — must be acknowledged by Anjali or her supervisor, transparently. Silent behavior changes destroy trust permanently.

### Incentive design

The local operator must be **paid, credentialed, or socially rewarded** — and the design must be incentive-agnostic because cities vary. Options:
- Stipend paid through utility or donor program.
- Gamification (and we do not mean points — we mean status, recognition, rank).
- Training + certification as marketable credential in high-unemployment labor markets.
- Women's collectives as recruitment + retention + distribution channel (same social architecture is used for consumer messaging).

The founding team must decide: are we selling software to manage 50–1000 local operators, or are we in the people-management business ourselves? v1 co-designs with 1–2 real Anjalis and uses their input; v2+ offloads operator management to the city's HR or to a BPO partner. **The product must work either way.**

### Multilingual UX

Design for translation Day 1. Languages for v1: **Hindi + 1 regional language minimum, English as fallback.** Trigger for 6th language: >5% of Anjali daily volume in that language OR a 2nd city where it is primary. Voice prompts and WhatsApp-first surface in regional languages. Dialect-specific STT if volume justifies. **Multilingual is a credibility signal, not just accessibility.**

### SMS fallback as first-class surface

Many target users have feature phones or low-bandwidth moments. SMS must be a first-class channel: same incident workflows as WhatsApp, authoritative weight (carries more legal weight than WhatsApp in target geographies), spoof-resistant (signed gateway). The system must work end-to-end on SMS — no implicit dependency on WhatsApp.

### Privacy-by-design

Privacy is a saleable feature — some cities will pay premium for it. v1 design:
- **Geofence to zone, not lat/long.** Sensor locations published at zone-level (e.g., "Ward 7, North zone") never precise.
- **Data minimization.** Only data needed for the incident loop is retained. Aggregated where possible.
- **Encryption everywhere** — at rest, in transit, end-to-end on consumer channel.
- **Anonymous-by-default consumer channel.** Reports contribute to outbreak signals but are not personally attributable.
- **Operator data access-logged** — who sees what, when, why.
- **Right to be forgotten** for consumer reports (where law permits; data sovereignty clause per jurisdiction).
- **Cultural advisors, not just translators** — local context for messaging, norms, gender dynamics. 3–5 contexts max for v1.

### Women's collectives

Same social architecture serves three jobs: local operator recruitment (intentional female recruitment, addresses gender-dynamics design honestly), consumer messaging (women's collectives as trusted distribution channels), and trust network (collective accountability surfaces problems faster). Compensation must be fair; safety must be designed for; the design must avoid paternalism.

---

## 11. The detection layer v1

The detection layer is **most visible to outside viewers but NOT highest leverage.** The response loop + sales motion are. v1 ships a deliberately narrow detection layer to prove the loop, with the architecture designed to absorb sophistication in v2.

### Hardware footprint

- **5 industrial probes** (Hach / Thermo / Xylem integration, not manufacture) at source intakes and pump stations. These are high-leverage: one reading at source protects the entire downstream. Approximately $200–500 each, possibly rented as part of sensor-as-a-service. Class focus: bacterial (free chlorine residual, turbidity, pH, conductivity), with chemical baseline capability.
- **30 sentinel strips** at schools (Anjali's site), hospitals, community points. Each strip is a $1 paper test (colorimetric chemistry) + smartphone photo + on-device CV model. Anjali reads the strip weekly; photos upload when connectivity allows; CV model yields quantitative reading. Anubis-grade sensing at ward-scale economics.

**Not in v1:** municipal-grade hardware (Chinese OEM probes). That is v2 once the integration pattern is proven and budget expands.

### What the sentinel strip does

- 10x denser spatial coverage than industrial-only at the same budget.
- Lives at the ward's human-traffic point (school, hospital, community center) — exactly where Anjali is and where Ramesh passes.
- Anchors Anjali's authority: she is the human-in-the-loop for the sensor at her site.
- Creates a **structural data moat** as the network scales — 50K strip readings across 50 cities > 50 readings in one city.
- QA/QC is a challenge at scale (storage, handling, lot degradation, reader variance) and must be designed in v1 even if not load-bearing yet. **Bad lot = silent trust destruction.** Responsibility assignment: vendor owns strip manufacture, city owns handling discipline, ownership of "what to do when bad lot ships" is a v1 launch decision.

### Source-fusion engine v1

**Basic weighted-source voting, deliberately not ML-heavy.**

```
score = w_sensor · sensor_reading + w_anitali · anitali_report
      + w_citizen · complaint_cluster + w_lab · lab_result
      + w_env · environmental_signal
```

Weights are city-configurable per contaminant class; defaults come from WHO-grounded calibration. Source-credibility weights for Anjali are learned from her historical accuracy (overridden outcomes) but updated weekly in v1, not real-time.

The output is a **ranked action list, not raw sensor feeds** — Priya does not see 36 sensor readings; she sees an ordered list of 4–6 incidents to action with playbook recommendation, source attribution, and corroborated confidence score.

**ML-heavy detection (cross-city-trained models, drift-prediction models, override-anomaly detection) is v2.** v1's fusion engine is deliberately simple because (a) the response loop is the load-bearing test, (b) ML without data overfits, (c) the audit chain generates the training data that justifies ML in v2+.

### Sensor placement optimization

Placement is **information-gain-per-dollar, not uniform coverage.** Source-grade sensors (high leverage, protect downstream) cluster at intakes and pumps. Tap-grade sensors (low cost, high density) cluster at sentinel sites. Placement is also a political decision — ward-by-ward resource allocation becomes a negotiation — and PHA approval is the political wrapper for that allocation.

### Connectivity tiers (v1 architecture supports all)

- **Source-grade = trivial** (mains power, fixed connectivity).
- **Pump-grade = medium** (mostly connected, intermittent outages common).
- **Distribution-grade = hard** (diesel generator, intermittent).
- **Tap-grade (sentinel) = very hard** (no mains, possibly no fixed network).
- **Multi-radio fallback in v1:** cellular primary → LPWAN secondary → store-and-forward on SD card tertiary. **Ward sentinel uses phone-as-network** — phone syncs to cloud when it can, inherits offline-first patterns from community-health-worker systems.

---

## 12. Architecture (v1)

### Multi-tenant SaaS, single-city deployment

The platform is multi-tenant from Day 1 — database-isolation-per-city, configurable per-city policies, separate audit-chain namespaces. v1 deploys to one city. The architecture supports federation; the v1 product does not exercise it. This is the v2-on ramp from which cross-city benchmarking, regulator forecasting product, and federation sales motions fall out.

### Three UIs (each optimized for its persona)

- **Anjali-mobile:** Android-first, WhatsApp-fronted, low-bandwidth, voice+image, regional languages, one-tap reporting, weekly sensor-photo capture, status-of-my-reports feed, credentials display.
- **Priya-desktop:** incident dashboard ranked by fusion score, playbook execution view, handover brief at shift change, deviation-with-reasoning capture, override interface, simulator access, PHA monthly report export, anjali-network credibility view.
- **PHA-pane:** cross-ward aggregate, deviation dashboard across utilities, threshold-tuning controls, playbook-approval queue, regulator-facing analytics, audit-chain browser.

### Append-only cryptographic audit chain

Database-backed, content-addressed, chained block references. Cryptographic signing on sensitive events. Two-person rule implemented as dual-signature requirement on playbook edits at T3 boundary and consumer message issuance. **This is a platform feature, integrated into every module, not a compliance afterthought.**

### Multi-radio connectivity + store-and-forward

Sensors use cellular primary / LPWAN secondary / SD-card store-and-forward tertiary. Ward sentinels use phone-as-network (the Anjali's phone, with offline-first sync). The system tolerates connectivity loss as expected operation, not as exception. **Latency of action beats measurement accuracy — the architecture optimizes for the bad-day path, not the good-day path.**

### Where the seams live

- **Source-fusion engine** is a sealed component with a simple interface (inputs: sensor + Anjali + complaint + lab + env; outputs: ranked action list with source attribution). V1 ships weighted-voting; v2 swaps in ML without changing the interface.
- **Playbook engine** is a sealed component with execution + deviation capture + amendment hooks. Versioning + sign-off + confidence-score surfaces.
- **Channel adapters** (WhatsApp / SMS / ward councillor / lab inbox) are pluggable. V1 ships three adapters. V2 adds IVR, community radio, dedicated consumer app.
- **Audit chain** is a single platform-level service. Every module writes to it through the same gateway. Read-access is policy-controlled per role.
- **Auth + RBAC** with role-permission matrix per city, defense-in-depth (override-anomaly detection in v1 logs, enforces in v2).

---

## 13. Constraints we surfaced — the load-bearing ones

The session surfaced 56 constraints. The seven that **must be respected** — not because the others don't matter, but because these are the ones that, if ignored, kill the product or the company:

**1. Sensor cost and the three-tier pyramid.** Industrial $5K–20K (lab), municipal $200–500 (utility), ward sentinel $1–50 (community). v1 occupies tiers 1 (small footprint) and 3 (sentinel-only). The ratio of cost to information-gained-per-dollar favors dense ward sentinel over uniform industrial coverage. Vertical integration of sentinel strip (Gillette-model razor-and-blade economics) is the key cost lever.

**2. Opex sublinearity with sensor count.** If COGS scales linearly with sensor count, growth consumes margin. The opex levers (remote calibration, self-service Anjali QA, bulk strip reorder, cloud cost at scale, support automation) must be designed-in v1 or growth fails at 100 sensors. **Critical pre-launch question: have we modeled COGS at 1K/10K/100K sensors, or assumed sublinearity unproven?**

**3. Procurement cycles 18–30 months.** Cities buy slowly. v1 launch requires pre-RFP relationship-building work starting 12+ months before any signed contract. Donor cycles (18–24 months to close) and municipal cycles (~24 months) can run in parallel. The runway must absorb 24 months of pre-revenue sales.

**4. Payment terms and architectural consequence.** 30/30/30/10 (signing / deploy / 6-month / renewal) on municipal sale; donor tranches on donor sale; outcome-priced is a 5-year arc. Monthly subscription billing is easier than annual because accounts payable is pre-approved. **Architectural question: can service stop for non-payment without harming public safety?** Leading answer: sensors log locally, audit chain preserved on-device, only analytics suspended on non-payment. This is a v1 design constraint, not a v2 nice-to-have.

**5. Institutional inertia is asymmetric.** Conservative on operational change (you don't tell Priya how to work) but **aggressive on monitoring investment** (visibility reduces political risk without changing ops). Position as risk-reduction, not operational change. "Visibility you've never had" beats "change how operators work." Inertia cuts both ways: hard to adopt, hard to displace once in. Pilot as non-extractable integration via co-authored playbooks/calibrations creates switching costs — must stay on the right side of the dark-pattern line.

**6. Panic risk on the consumer channel.** The single fastest way to lose a city is a false-positive public notice. **Tiered escalation policy is the only defense** — public messaging only at T3+, owned by PHA + mayor, never by an algorithm. The system must support calm communication (channel redundancy, plain-language messages, trusted-intermediary endorsements) and a documented escalation policy that the regulator can defend in press. **Public sensor failure or wrong broadcast = political disaster.**

**7. Privacy-by-default as architecture and sales.** Geofenced to zone, not lat/long; data minimization; encryption everywhere; anonymous-by-default consumer channel; data sovereignty per jurisdiction; right to be forgotten. This is not just ethics — **some cities will pay premium for it**, and absent it, gender-design and women's-collective channels cannot exist safely. Privacy is a load-bearing constraint, not a nice-to-have.

**Other constraints matter but are not load-bearing at v1:** sensor placement (political, addressable); integration smoothness with SCADA (build v1); custom hardware design (defer); ML detection (defer to v2); regulator benchmarking product (defer); insurance product (5-year arc); cross-utility federation (v2); legal-liability model (resolve before launch, not load-bearing day-to-day).

---

## 14. Open questions for the founding team

These are the questions that cannot be answered in a brainstorm session. They are the decisions the founding team owes the product before v1 ships and before any sale closes.

**1. Lighthouse city candidate.** Realistic candidate, founder network or not, criteria check: (a) utility + PHA + mayor co-design willing, (b) donor-funded water program already present, (c) multilingual environment, (d) reachable for in-person co-design, (e) digitally literate operator class. **Decision by end of month 1.**

**2. Runway.** Is the runway 18–24 months? If less, donor funding is Day-1, not Year-1. If more, donor-funding can be parallel secondary. **This determines whether donor motion is urgent or relaxed.**

**3. Sales lead.** B2B municipal sale is a specific skill — sales engineering, public-sector procurement, multi-stakeholder campaigns. The founding team needs a sales lead or the city-close will not happen. **Are we equipped for this, or do we hire immediately?**

**4. Anjali and Priya — first real hires on the city side?** Get commitments from the actual human Anjalis and Priya in the lighthouse city. Co-design v1 with them, not just "for them." Their commitment is the single most important early sale.

**5. Liability model for playbook.** When a playbook step is wrong and harm results, who carries liability — admin, vendor, or shared? The audit chain is the evidence; the **agreement structure** is what matters. Lead hypothesis: shared liability with audit chain as evidence of contribution. **Resolve in writing before v1 launch.**

**6. Sentinel QA ownership.** Bad lot ships, who pays — strip manufacturer (vendor), city (handling discipline), donor (procurement responsibility)? **A bad-lot incident response plan must exist before first lot ships.**

**7. Cross-functional founding team.** Communications lead (consumer-channel-as-distribution, brand-building), regulatory lead (PHA relationships, playbook-authoring partnership), ML engineer v2 (anomaly detection on overrides, drift prediction). Engineers are necessary but not sufficient.

---

**End of brief v1. This document is the design intent for the lighthouse-city deployment. A future product team should be able to read this and answer both "what to build" and — more importantly — "why."**
