# Constraints — Load-Bearing (Commercial / Institutional / Political)

**Companion to:** SPEC.md kernel, v1.
**Scope:** Seven non-architectural constraints from brief §13. Architectural invariants (12) live in the kernel's Constraints section. This file holds the commercial, institutional, and political load-bearing constraints — the ones that kill the product or the company if ignored.

| # | Constraint |
|---|---|
| 1 | Sensor cost and three-tier pyramid economics |
| 2 | Opex sublinearity with sensor count |
| 3 | Procurement cycles 18–30 months |
| 4 | Payment terms and architectural consequence |
| 5 | Institutional inertia asymmetry |
| 6 | Public panic risk on consumer channel |
| 7 | Privacy-by-default as architecture and sales |

---

## 1. Sensor cost and three-tier pyramid economics

**What it is.** A three-tier pyramid exists: industrial ($5K–20K lab-grade), municipal ($200–500 utility-grade), and ward sentinel ($1–50 community-grade). v1 occupies tier 1 (small footprint) and tier 3 (sentinel-only), because cost-per-information-gained favors dense ward sentinel over uniform industrial coverage.

**Why it's load-bearing.** Sensor economics determine whether the capex story closes at all. The ratio is what makes the response-loop-first design defensible to a finance buyer, and what makes the lighthouse-city deployment fundable before revenue. Get this wrong and the unit economics never recover regardless of operator-loop quality.

**The genie path.** Vertical integration of the sentinel strip — Gillette-model razor-and-blade economics — is the key cost lever. We integrate industrial probes from incumbents (Hach / Thermo / Xylem) but own the strip-and-reader chain so the consumable economics flow back to vendor margin, not to a third-party OEM.

**The hardest version of the problem.** Sentinel strip QA/QC at scale (storage, handling, lot degradation, reader variance). A bad lot ships, silent readings destroy trust, and "who pays" is unresolved at v1 launch.

---

## 2. Opex sublinearity with sensor count

**What it is.** COGS must scale sublinearly as the sensor count grows. The opex levers — remote calibration, self-service Anjali QA, bulk strip reorder, cloud cost at scale, support automation — must be designed in from v1.

**Why it's load-bearing.** Linear COGS at 100 sensors consumes the margin that growth depends on. Without sublinearity, the v1 lighthouse proves the loop but cannot scale to v2 federation.

**The genie path.** Pre-launch COGS modeling at 1K, 10K, and 100K sensors — done as a v1 critical question, not a v2 nice-to-have. Build the opex levers (remote calibration, automation) into v1 so the curve bends before scale arrives.

**The hardest version of the problem.** Anjali-side labor does not scale sublinearly with sensors. The 50-operator model does not extrapolate to 5,000 operators without a people-management layer we do not own.

---

## 3. Procurement cycles 18–30 months

**What it is.** Municipal cycles run ~24 months; donor cycles run 18–24 months from application to close. Pre-RFP relationship-building starts 12+ months before any signed contract.

**Why it's load-bearing.** The runway must absorb 24 months of pre-revenue sales before the first paid renewal. Mis-sized runway kills the company before the loop is proven in city.

**The genie path.** Run municipal and donor motions in parallel — donor is Day-1 primary, not a fallback. Donor-funded deployments become reference customers with donor branding as a sales weapon; donor contracts pay in tranches tied to milestones, giving cleaner cashflow than direct municipal sale.

**The hardest version of the problem.** Elections freeze or distort procurement. Year-of-election is frozen; year-after-election is unpredictable. Runway must survive admin change, not just calendar time.

---

## 4. Payment terms and architectural consequence

**What it is.** 30/30/30/10 (signing / deploy / 6-month / renewal) on municipal sale; milestone-tranches on donor sale; outcome-priced is a 5-year arc. Monthly subscription billing is easier than annual because accounts payable is pre-approved at the line-item level.

**Why it's load-bearing.** Cashflow depends on these terms being both saleable and collectible. The harder question is architectural: if the city stops paying, can the service stop without harming public safety?

**The genie path.** Leading answer: sensors log locally, the audit chain is preserved on-device, and only analytics suspend on non-payment. Public-safety-relevant signals continue; the city loses the dashboard, not the response capability. This is a v1 design constraint, not a v2 add-on.

**The hardest version of the problem.** The clean stop-service boundary exists in theory but not in political reality. Cutting analytics from a paying city that is mid-crisis is a relationship event the sales motion cannot afford.

---

## 5. Institutional inertia asymmetry

**What it is.** Institutions are conservative on operational change ("don't tell Priya how to work") but aggressive on monitoring investment ("visibility reduces political risk without changing ops"). The asymmetry is the wedge.

**Why it's load-bearing.** Inertia cuts both ways — hard to adopt, hard to displace once installed. Positioning wrong (as operational change rather than risk reduction) kills the first sale; positioning right creates switching costs that compound.

**The genie path.** Position as risk-reduction, not operational change. "Visibility you've never had" beats "change how operators work." Pilot as non-extractable integration: co-authored playbooks, co-designed calibrations, PHA-signed playbook approvals. Switching cost becomes institutional, not contractual.

**The hardest version of the problem.** Staying on the right side of the dark-pattern line. Lock-in that is institutional and earned is durable; lock-in that is contractual and engineered is a liability that re-emerges at every renewal.

---

## 6. Public panic risk on consumer channel

**What it is.** A false-positive public notice is the single fastest way to lose a city. Career-ending for the PHA director; political-disaster for the mayor; trust-destroying for the system.

**Why it's load-bearing.** One wrong broadcast ends the lighthouse-city contract and damages the donor-funded reference customer. The consumer channel is the highest-blast-radius surface in the product, run by the actors with the least technical authority.

**The genie path.** Tiered escalation policy is the only defense: only T3+ messages go public; PHA approves T2→T3 transitions; mayor's office owns T3 sub-tier and T4 message tone; two-person rule on consumer message issuance; channel redundancy (WhatsApp + SMS + councillor endorsements). The system surfaces calm communication, not panic.

**The hardest version of the problem.** The PHA owns the threshold, the mayor owns the tone, but a public sensor failure or wrong broadcast is still our fault upstream. The political blast radius lands on the city, but the reputational blast radius lands on us.

---

## 7. Privacy-by-default as architecture and sales

**What it is.** Geofence to zone (not lat/long), data minimization, encryption everywhere, anonymous-by-default consumer channel, data sovereignty per jurisdiction, right-to-be-forgotten where law permits.

**Why it's load-bearing.** This is not ethics-as-decoration — some cities pay premium for it, and absent it, gender-design and women's-collective channels cannot exist safely. The channels that close the women's-collective recruitment gap and the gender-aware consumer messaging depend on this constraint being structural, not bolted on.

**The genie path.** Build privacy as architecture from Day 1: zone-level geofencing, on-device data minimization, jurisdiction-pinned data sovereignty, operator access-logged, consumer channel anonymous-by-default. The same architecture that enables women's collectives is the architecture that closes the premium-paying-city segment.

**The hardest version of the problem.** Privacy defaults can conflict with operator effectiveness — Anjali's track record requires attribution at the operator layer; consumer anonymity must not prevent outbreak-signal correlation. The boundary between privacy-by-default and operational utility is a constant negotiation, not a one-time design choice.
