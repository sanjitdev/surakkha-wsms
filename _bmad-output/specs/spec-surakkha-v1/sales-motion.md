# Sales Motion — Surakkha v1 (Lighthouse City)

**Companion to SPEC kernel.** The kernel carries the five load-bearing fields. This file carries the sales-motion detail that does not fit the kernel — champion sequencing, stakeholder matrix, payment terms, donor channels, election timing, and the lighthouse-city selection checklist.

---

## 1. Champion-stack order

Sell bottom-up trust first, decision authority last. Finance approves — finance does not initiate. Selling to finance first is the common mistake.

**1. Operator (Priya).** Co-design v1 with her before any other conversation. She is the first champion, the reference-deployment credibility, and the operator-side advocate every other stakeholder eventually asks. Pitch: "I am your supervisor tool; I learn from you; your credential compounds." Failure mode: she is told about the system after procurement — adoption collapses because she was not built-in, she was bolt-on.

**2. Utility manager.** Operational ROI story, opex savings from calibration automation, SLAs the utility can now hit, defensible incident record. Pitch: opex reduction and risk reduction. Failure mode: she hears about it from her operator after a contract is signed — becomes a passive obstacle instead of an internal sponsor.

**3. PHA (Dr. Mensah).** Cross-utility oversight + standard-setting authority. He becomes champion, not gatekeeper, because he owns the playbook approval and the threshold policy. Pitch: he owns the standard; the system is implemented in his image. Failure mode: framed as surveillance on him rather than authority through him — he blocks the sale.

**4. Mayor's office.** Political-cover story, audit-trail-as-defense-in-inquiry, donor-branded visibility in his city. Pitch: the system in your city is named; the audit chain is your press-defense. Failure mode: framed as cost — mayors never buy cost, they buy visibility and cover.

**5. Finance.** Last. Predictable subscription, 30/30/30/10 payment terms, ROI documentation. Finance approves; finance does not initiate. Failure mode: finance sets the conversation and the sale becomes a procurement exercise rather than a champion campaign.

Institutionalize across all levels: 2–3 champions per city, train successors in 30 days, build org-owned value, survive admin change by positioning as institutional capacity, not political patronage.

---

## 2. Multi-stakeholder value-prop matrix

| Stakeholder | Their win condition | Our pitch |
|---|---|---|
| Operator (Priya) | Resolve incidents without harm | I am your supervisor tool; I learn from you; your credential compounds. |
| Utility manager | Opex savings + risk reduction | Calibration automation, SLAs you can hit, defensible incident record. |
| PHA (Dr. Mensah) | Cross-utility oversight + standard-setting | You own the playbook approval; you have independent second-source verification; you mandate the standard. |
| Mayor | Political cover, donor visibility | Audit trail as press-defense; donor co-branding; the system in your city is named. |
| Finance | Predictable spend, ROI | 30/30/30/10 payment terms; opex-not-capex; quantified ROI documentation. |
| IT | Clean integration | APIs into SCADA, billing, lab systems; least-privilege permissions; SOC2-ready. |

---

## 3. Buyer ≠ user ≠ payer — explicit triangle

No single sales conversation closes the deal. Close the campaign, with sequenced wins across the matrix.

| Role | Who |
|---|---|
| **User** | Anjali (local operator) — daily reporter, sentinel strip owner, the trust-bearing interface. |
| **User + operator buyer** | Priya (central city operator) — uses the dashboard daily, proposes playbook edits, is the most important non-founding hire. |
| **Operational payer** | Utility — pays the subscription from opex budget. |
| **Capital payer** | Donor — pays the capex, donor branding rides on the deployment. |
| **Political decider** | Mayor's office — signs off on city-wide visibility and donor co-branding. |
| **Policy approver** | PHA (Dr. Mensah) — owns playbook approval, threshold policy, cross-utility oversight. |
| **Beneficiary** | Ramesh — the 250,000th citizen; downstream audience; does not know the system exists. |
| **On the hook** | Priya and Dr. Mensah — carry the political and reputational risk of false-positive public notice or missed escalation. |

---

## 4. Donor funding as parallel primary sales motion

Donor funding is **Day-1 primary, not fallback.** It runs parallel to municipal sale, not after slow direct sales.

Why donor is primary: donor-funded deployments become reference customers with donor branding as a sales weapon; donor contracts pay in tranches tied to milestones — cleaner cashflow than direct municipal sale; donor cycles (18–24 months from application to close) align with pre-revenue runway needs; the sales deck differs (donor buys replicable model + audit-by-default + outcome-evidence; municipal buyer buys ROI + risk reduction).

### 4a. Lighthouse-city funding channel: World Bank Water Global Practice (C-16)

The lighthouse-city donor primary is the **World Bank Water Global Practice.** This is a constraint, not a default — the contract structure, audit standards, and reporting cadence for the lighthouse deployment follow WB procurement rules end-to-end. OQ-10 captures the specific WB program / lens (e.g., a particular financing instrument under the Water Global Practice) as the city-specific number to be named before launch.

**Architectural consequences of the WB funding channel:**

- **Procurement vocabulary.** The lighthouse deployment's RFP, contract structure, milestone definitions, and reporting cadence are written in WB procurement terms. This is the donor's vocabulary; the platform's data model must surface the fields WB asks for (disbursement-linked indicators, results framework, audit-trail evidence per outcome) without retrofit.
- **Audit standards.** WB audit standards are stricter than municipal default. The cryptographic audit chain (CAP-6 + C-8) is the substrate that satisfies WB evidence requirements; the lighthouse deployment ships with WB-aligned evidence-export tooling from day one, not as a v2 retrofit.
- **Reporting cadence.** WB disbursement-linked reporting on a fixed quarterly / milestone cadence. The auto-generated PHA monthly report (Priya's deliverable) must be able to roll up into the WB quarterly submission without manual reassembly.
- **Co-funding split.** The WB tranche typically covers capex and the central-platform line; municipal co-funding covers opex (operator salaries, sentinel-strip replenishment, connectivity line items). The 30/30/30/10 municipal terms are **not** the WB contract — WB contracts run on tranche-tied milestones instead.

### 4b. Other donor channels — secondary, not for the lighthouse

The lighthouse-city funding channel is WB. Other channels remain active and serve later deployments:

- **WHO** — outcome-priced water-sanitation programs, audit-by-default buyers. Strong fit for v2+ cities where the lighthouse has produced outcome evidence.
- **UNICEF** — WASH programs, anchor funder for city-scale deployments.
- **Asian Development Bank (ADB)** — Tier-2 India urban water fits portfolio.
- **Climate funds** — water-security framing, growing allocation.
- **Smart Cities Mission** — Indian national precedent, procurement vocabulary; fits when the lighthouse has produced a reference deployment that SCM can co-fund.
- **Foundations** — Gates, Wellcome, Open Society.
- **Bilateral aid** — DFID, USAID, GIZ, JICA.

Donor and municipal are parallel because they serve different buyers on the same product. Different decks, same platform.

---

## 5. Payment terms — 30/30/30/10

30% on signing. 30% on deploy. 30% at 6-month milestone. 10% on renewal. This is the municipal-default; donor sales run on tranche-tied milestones instead.

The discipline matters because procurement cycles run 18–30 months and the runway must absorb 24 months of pre-revenue sales. Tranches tied to verifiable events — signed contract, live deployment, six-month operating record, paid renewal — align vendor cashflow with buyer milestones and make the renewal conversation a conversation about evidence, not about budget.

**Architectural consequence.** Can service stop for non-payment without harming public safety? The leading answer: sensors log locally, audit chain preserved on-device, only analytics suspended on non-payment. This is a v1 design constraint, not a v2 nice-to-have — the answer is in the architecture, not in the contract.

---

## 6. Time sales around elections

- **Year-before-election.** Fastest conversion. Incumbent mayor wants a visible deliverable before the campaign; procurement is politically motivated and time-pressured. Land the champion stack here.
- **Election-year.** Frozen. Procurement is paused pending outcome; no signed commitment until the new term begins.
- **Year-after-election.** Unpredictable. New admin may reverse, may accelerate, may ignore. Survive by positioning as institutional capacity — utility + PHA + operator adoption — not as political patronage tied to the prior mayor.

---

## 7. Lighthouse city criteria — 5-item checklist

The founding team selects one Tier-2 Indian city (~500K population) using these five criteria. All five must hold before first conversation.

1. **Utility + PHA + mayor's office co-design willing.** All three institutions must commit in writing to co-authoring playbooks and co-designing tiered escalation before signing. Any one of them passive and the deal collapses.
2. **Donor-funded water program already present.** A pre-existing donor program on the ground gives us a co-funding partner, an in-country implementation team to ride alongside, and a procurement vocabulary already established.
3. **Multilingual environment.** Hindi + at least one regional language + ideally English. Multilingual is a credibility signal, not just accessibility; it must be exercised in v1.
4. **Reachable for in-person co-design.** Reasonable travel time from the founding team. v1 co-designs with 1–2 real Anjalis; remote-only kills the co-design loop.
5. **Digitally literate operator class.** School principals, community health workers who already use WhatsApp professionally. The trust-bearing interface is the human, not the app; the human must already be on the channel.

Decision deadline: end of month 1.