# Personas — Surakkha v1

Companion to `SPEC.md`. Source: `product-brief-v1.md` §5. Order: Anjali (user persona zero) → Priya → Dr. Mensah → Ramesh → attacker (constraint persona).

---

## Anjali — local operator / school principal

**Role:** Designated trusted human embedded in her micro-community; primary user of the Anjali-mobile surface (Android, WhatsApp-fronted); 50 of her exist in v1, 2 per ward, of whom 1–2 are real co-designers.

**Win condition:** My school, my ward, my neighborhood is demonstrably safe, my reports are taken seriously, my effort earns me status and (ideally) income, and I am credited when something I caught gets resolved fast.

**What the product must do for her:**
- One-tap reporting — voice + image over text, with SMS as a first-class surface (not a degraded fallback).
- Local-language UI in Hindi + at least one regional language; language functions as a credibility signal, not only accessibility.
- Route her reports to Priya within minutes, with a source-credibility weight she does not see but that her track record has accumulated.
- Public acknowledgement when her report triggers a real response — she must see that her report mattered.
- A certification / credential built from her track record, marketable in high-unemployment labor markets; this is the social design that compensates for weak stipends.
- Empowerment framing, not surveillance — the system feels for her, not on her.
- Survive her constraints: cracked-screen Android, low data plan, WhatsApp-only, no dashboard login, no training-app download.

### Anjali incentive model — hybrid (OQ-4)

The product is **incentive-agnostic**; the v1 deployment picks the model. The chosen model for the lighthouse city is **hybrid**, by design: each lever compensates where the others are weak.

- **Small stipend.** A modest recurring payment tied to weekly check-in completion and sentinel-strip reading submission. Sized to be meaningful in the local context but not large enough to be the primary motivation. Stipend structure must not be a per-report bounty — that creates gaming and false-positive inflation; it must be tied to participation discipline (weekly cadence, photo submission, audit-trail integrity).
- **Credential.** A formal certification issued by a recognized local body (e.g., PHA-issued or municipal-health-issued) attesting that Anjali has completed the local-operator training, maintains weekly discipline, and contributes to verified contamination events. The credential is portable: it has labor-market value beyond the Surakkha program, which means it cannot be revoked at the vendor's discretion and is not a bribe.
- **Status recognition.** A visible, public form of credit when her report triggers a real response. Examples: by-name acknowledgement in the city-level monthly report, local-councillor or PHA citation, inclusion in the public audit summary for that month. Recognition is what makes the hybrid a hybrid — the stipend and credential address financial and professional status, but the recognition addresses the human need to be seen as doing good work.

The product supports all three levers; specific sizing (stipend amount, credential issuer, recognition cadence) is a deployment decision captured in the city configuration, not a product design constraint. OQ-12 captures the open question of exact numbers.

**Failure mode if product misses her:** She stops reporting, the last-mile sensor layer collapses, spoofing risk on the consumer channel rises, and the two-tier architecture loses its foundation.

---

## Priya — central city operator

**Role:** Most experienced water-safety professional on the city's central dashboard; supervisor of a network of Anjalis; the most important non-founding hire; 1–2 of her exist in v1; user of the Priya-desktop surface.

**Win condition:** I resolve contamination incidents without harm, on shift every day, with full institutional backing; my expertise compounds; my PHA trusts me; the mayor does not bury me; my monthly report is auto-generated not assembled.

**What the product must do for her:**
- An incident dashboard ranked by fusion score, with source attribution and corroborated confidence — not raw sensor feeds.
- Auto-generated handover brief ("today's open threads") at shift change — kills tribal-knowledge dependency.
- Read-only playbook editor with the ability to propose deviations and edits that feed playbook amendments.
- Override-with-reasoning capture; overrides later compared to outcomes and feed threshold tuning plus her credential.
- A 2-minute "what would have happened" simulator for new sensor configs, new playbook drafts, new shifts.
- Auto-generated PHA monthly report assembled from the audit trail, not by hand.
- A visible "your expertise is compounding" surface — every override outcome, every monthly stat.
- Escape hatch with friction (not a block) when she deviates from playbook — blame-free review is the goal; a block would cost her trust on the bad-day.

**Failure mode if product misses her:** Tribal knowledge stays tribal, deviations go underground and look like negligence under inquiry, and the playbook decays the moment the city changes.

---

## Dr. Mensah — PHA director (regulator)

**Role:** Public-health regulator at state or city level, physician-trained, mid-career; policy approver of playbooks and thresholds; co-author of tiered escalation; user of the PHA-pane.

**Win condition:** I deliver clean water to my population without political blowback from preventable outbreaks, I cross-utility benchmark without litigation against me, I have early-warning before hospitals see patients, my office mandates a defensible standard across the region and is seen as the source of that standard, and the next outbreak is not mine to own alone.

**What the product must do for him:**
- One pane of glass across all utilities in his jurisdiction, with comparison and benchmarking built in.
- Independent second-source verification of utility claims — sensor + Anjali + Ramesh + lab, not only the utility's own reports.
- Early-warning by triangulating sensor + complaint + environment into a probability-of-incident signal that fires before hospitals report cases.
- Political cover via the append-only, cryptographically chained audit trail — defensible in press conferences and inquiries.
- Leverage over utilities via objective indicators (e.g., "Zone 7 uncalibrated 47 days") he can name.
- A standard he can mandate — he co-authors the playbook; the system is implemented in his image.
- A deviation dashboard across utilities — his early-warning system for under-performers.
- Policy control over alert tone and thresholds, but not ownership of consumer message issuance — he must not become the message desk.

**Failure mode if product misses him:** He is either bypassed (and the political cover evaporates) or saddled with message-issuance duty (and a single false boil notice ends his career); either path loses the lighthouse city.

---

## Ramesh — consumer (the 250,000th citizen of the lighthouse city)

**Role:** Downstream audience of the operator loop; not a product user; reports feed the cheapest last-mile sensor network; reached via WhatsApp + SMS + ward-councillor endorsement.

**Win condition:** I get a clear "is the water safe to drink right now" answer without downloading anything, I know what to do if it isn't, I trust the source enough to follow the advice, I do not get screamed at with panic for routine updates, and my reports (when I bother) are heard.

**What the product must do for him:**
- Multi-channel reach (WhatsApp blast + SMS targeted + occasional ward-councillor endorsement) as a distribution strategy, not as a product.
- Plain-language messages — "Safe now / Boil / Do not drink / Use bottled / Wait" — short and sourced.
- A way to report back if his household or block sees symptoms (voice / WhatsApp / SMS), feeding the last-mile signal.
- Trust built through visible local-operator use of the system (Anjali endorsement at her school is brand-building).
- Never a dashboard. Never a dedicated app. Never a paywall. The system is invisible infrastructure.
- Messages routed through trusted voices (Anjali, councillor) carry more weight than system-issued messages; brand is their endorsement, not ours.

**Failure mode if product misses him:** A false-positive public notice panics the city and destroys the program's standing; without trusted-voice routing, his reports are ignored and the cheapest last-mile signal goes dark.

---

## Attacker — constraint persona

**Role:** Not a user; a constraint. Profiles in scope: script kiddie (embarrassment), state actor (real harm), insider (cheapest and most dangerous). Treated as a product persona with features — every defense is a saleable feature with a buyer (regulator, mayor, risk officer).

**Win condition:** Damage public trust in the system, the utility, or the PHA — cost-effectively and deniably.

**What the product must defend against (v1):**
- Spoofed sensor reading + replay against the ingestion API → false boil notice + public panic.
- DDoS on the consumer channel during a real crisis → real consumers do not get real notices.
- Spoofed regulator dashboard → "all green" while contamination is real.
- Slow-poison protocol — sub-threshold micro-doses across multiple points, cumulatively harmful, never flagged individually.
- Insider playbook tampering → wrong valve closure order or wrong threshold.
- Insider override of real alerts → "false positive, closing ticket."
- Insider exfiltration of audit trail → business-intelligence breach.

**Defenses built in v1:** sensor authentication + cryptographic signing (public sensor IDs are a feature AND a vulnerability, both true); multi-signal trend detection against slow-poison; consumer channel redundancy (WhatsApp + SMS fallback); tamper-evident append-only audit chain; two-person rule on playbook edits at T3 boundary and on consumer message issuance; override-anomaly detection logged in v1 (enforced in v2); data minimization (zone-level geofence not lat/long, access-logged operator data, anonymous-by-default consumer channel).

**Failure mode if product misses the attacker persona:** A single successful spoof or insider override kills the city (false notice or missed real incident); the program's political cover collapses and lighthouse deployment cannot repeat.

---

## Source gaps

- The brief does not specify Anjali's exact stipend amount, credential-issuing body, recognition cadence, or whether women's collectives are the formal recruitment channel in v1 — model chosen (hybrid), numbers open as OQ-12.
- The brief does not name the regional language(s) beyond "at least one" — v1 launch decision.
- Priya's exact permission level on the playbook editor (read-only vs. propose-only) is described functionally but not as a precise RBAC matrix — RBAC implementation detail deferred.
- Dr. Mensah's exact jurisdictional scope (state vs. city PHA) is unspecified — sales motion assumes he is city-level for the lighthouse, with state-level as a v2 federation outcome.
- The attacker's threat-model probability and acceptable residual risk are not quantified — risk-acceptance posture is a founding-team decision before v1 launch.
