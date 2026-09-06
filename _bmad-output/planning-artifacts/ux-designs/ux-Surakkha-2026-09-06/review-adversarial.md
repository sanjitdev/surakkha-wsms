# Surakkha v1 UX Spines — Adversarial Review

**Reviewer:** Adversarial UX lens
**Date:** 2026-09-06
**Targets:** `DESIGN.md`, `EXPERIENCE.md` (both `final`)
**Verdict:** **CONCERNS** — the spines are unusually disciplined, but they expose at least three load-bearing gaps and one structural contradiction.

---

## 1. Anjali trust-bridge collapse — PARTIAL PASS

The spine does more than most civic-tech surfaces to avoid surveillance framing. Ramesh-channel never shows operator identities; Anjali-mobile only surfaces her own attribution back to her ("Your report on Tuesday 14:01…"); the audit-browser in PHA-pane is read-only and access-logged.

**Failure modes not closed:**

- **Anjali-mobile status feed shows "received by Priya" + "action taken (if any)"** (EXPERIENCE.md §"Anjali-mobile IA"). This is necessary for the trust-bridge, but **the design does not define what happens when no action is taken for 14 days**. The empty-state copy ("No reports yet") is fine for a fresh operator; the *stale* state ("Your reports are received but no action has been taken") is exactly the surveillance-feel trap. Anjali will start asking: *Am I being watched for non-performance?* A hostile operator will weaponize this: *Why did the system sit on my report for two weeks?* The spine should define a graceful-stale pattern (e.g., "Priya has reviewed your reports. No action needed in your area right now — thank you for the watch.") and a max-staleness threshold after which her reports escalate to a Priya acknowledgement rather than sit unacknowledged.
- **Source attribution in consumer messages names Anjali by school + ward** when a sentinel-strip reading is the corroboration source (Flow 1 step 14). This is named in the flow ("Anjali X at school Y + sensor Z at pump station W") but not in the message template table. The template table only carries `ZONE_GEOFENCE`. **Inconsistency risk:** an attentive Anjali who reads one notice that credits her and another that does not will infer differential treatment. Either the template carries named Anjali attribution in the body, or it never does — pick one and commit.
- **Tier badge visible on Anjali acknowledgement "only when her report triggered a T3 response"** (EXPERIENCE.md §"Badge: status"). This is exactly the right rule, but the *absence* of a badge on a T0/T1 acknowledgement is silent in a way that an operator will read as surveillance: *if I never see T3, am I a low performer?* The spine needs a positive framing for the common case ("Your report was reviewed by Priya on Tuesday 15:30") — not a badge-driven UI.

## 2. Ramesh false-positive panic — PARTIAL PASS with one critical gap

The two-tap confirmation flow is well-designed (preview → confirm → 5-second timeout → both taps logged). The red-reservation rule protects signal-to-noise. The signature-required structure (`SignatureAttestation` with identical `(event_id, payload_hash, version_id)` triple) protects against typo-correction replay.

**Critical gap — what happens after a wrong T3 notice fires:**

The spine describes the issuance flow but **not the recall or correction flow**. The Ramesh-channel template table has five shapes; none is "Correction" or "False alarm retracted." When (not if) a T3 notice is issued incorrectly:

- A WhatsApp + SMS retraction is not in the template table. The five-shape discipline is undermined.
- The audit chain will capture the issuance event but the *retraction* is unspecified. A hostile reviewer under inquiry will ask: *What was the consumer-facing correction?* The spine has no answer.
- The "Safe now" template is the closest analog, but it is shaped as a *resolution*, not a *correction*. Citizens who never saw a problem ("we were fine all along") reading "Water in Ward 7 is safe to drink. Resolves prior notice from {TIME}" will infer *there was* a problem. That itself causes panic.

**Required addition:** a sixth shape, "Retraction / False alarm" (`Earlier notice for {ZONE} was issued in error. Water is safe. We apologise — {ISSUING_AUTHORITY}`), and a chain event `PublicNoticeRetracted` to back it. Without this, the two-tap confirmation only protects the happy path.

**Secondary gap — councillor-routed voice messages bypass the template discipline:**

Flow 3 step 4 shows the councillor delivering a voice message in Bangla: *"Brothers and sisters, the city water department and the PHA have asked us to boil water today…"* This voice message is **not from the template table** — it is human-composed by the councillor. The councillor is a trusted voice (persona win) but also an uncontrolled broadcast surface. There is no chain event, no template discipline, no retraction path. If a councillor mistranslates or improvises ("the water department says there is a deadly bacteria"), the system has no recourse. The spine needs either (a) a script the councillor reads from, (b) a recorded-message-from-the-system route through the councillor's phone that the councillor only relays, or (c) an explicit acknowledgment that councillor voice is a separate trust surface and the design accepts the risk. Right now it is silent.

## 3. Priya trust collapse on deviation capture — PASS with one medium gap

The friction-not-block rule is correctly implemented. Empty reasoning is allowed but logged as `DeviationCaptured{reasoning: empty}`. Reasoning is a single text input, not a rich-text editor. No "are you sure" modal. Post-submit, the chain shows the `DeviationCaptured` event and the incident row updates with a badge. This is the right shape.

**The medium gap — audit-traceability under hostile inquiry:**

The deviation capture is logged to the chain (good). But the Priya-desktop surface shows deviations as badges on incident rows; there is no dedicated "my deviations" view. Under inquiry ("why did you deviate on Sept 14?"), Priya must:

1. Find the incident row in the ranked action list (incidents rotate off the list when resolved).
2. Drill into the resolved incident detail.
3. Find the `DeviationCaptured` event in the incident timeline.
4. Cross-reference the reasoning text.

Each step is a friction point. A hostile reviewer can argue *the reasoning was buried*. The spine should add a **persistent "deviations log" view** on Priya-desktop that surfaces her deviations with reasoning, outcome, and reviewer verdict (when one lands). This is a single pane and it converts "friction-not-block" from a policy into a UI commitment. Without it, the deviation record is technically captured but procedurally findable only through archaeology.

**Minor — the reasoning field is a single text input.** For chronic-incident deviations that span hours, a single text field is too small. The spine should allow optional sub-event notes (each appending a chain event, not mutating the first) so Priya can capture "I deviated at 14:01 because X; at 16:30 I noted Y; at 18:00 outcome Z." Right now the design implies one reasoning field, one event.

## 4. PHA governance capture — **FAIL (structural)**

The persona failure mode is sharp: *"PHA is either bypassed (and the political cover evaporates) or saddled with message-issuance duty (and a single false boil notice ends his career)."*

The spine attempts to address this. PHA-pane IA says: *"Never a message-desk. PHA does not see or trigger consumer-message issuance (FR-6.5). Mayor's office owns message tone; PHA owns the threshold where public notice fires."* Good.

**But then the spine contradicts itself in two places:**

1. **Flow 1, step 13:** *"Consumer-message issuance. PHA pane (or operator with pha_approver role) issues the public notice. Two-tap confirmation flow."* The parenthetical "(or operator with pha_approver role)" is a **load-bearing escape hatch** that the design does not flag. A `pha_approver` is, by the RBAC enum (`architecture-invariants.md` §6), a separate role from PHA-Director. In practice, the `pha_approver` role is exactly the on-call rotation person the escalation policy §5a describes (3 named approvers, 7×24). When Dr. Mensah is off-shift, his on-call `pha_approver` colleague issues the notice — and *that person is the message-desk for that shift*. The spine names the failure mode and then bakes it in.
2. **Two-tap confirmation lives on the PHA pane** (EXPERIENCE.md §"Two-tap confirmation"). The UI affordance for issuing a public notice is on the pane that the spine says is "never a message-desk." This is a structural contradiction: the design is right that Dr. Mensah must not be the message desk, and then puts the message-issuance button on his screen.

**Required fix:** the two-tap confirmation surface must live on **Priya-desktop** (where the operator is the natural issuer) and on a **dedicated "Message desk" role** (`utility_message_desk` or similar), not on PHA-pane. PHA-pane surfaces the *approval* of the issuance (the `SignatureAttestation` for T3a), not the issuance button itself. The architectural RBAC needs a third role distinct from `pha_approver` for the issuer — currently it does not exist.

**Compounding gap:** Flow 3 has no PHA involvement at all (councillor-issued voice message + system-issued WhatsApp). The escalation policy says T2→T3a requires Priya + PHA two-person signature. Flow 3 has a councillor voice-message bypass that skips PHA entirely. The spine should reconcile: is councillor voice a T3a equivalent (and therefore needs PHA approval), or a non-T3 trust-bridging broadcast? The spine does not say.

## 5. Attacker spoof scenarios — PARTIAL PASS

The audit chain and two-person rule defend against several vectors, and DESIGN.md reserves red for T3+ only (which limits visual confusion as a phishing lever). The freshness clock in the chrome is a good passive defense.

**Failure modes not surfaced in the UI:**

- **Spoofed sensor + replay:** the design assumes cryptographic signing per `architecture-invariants.md` §9. But there is no UI cue that helps Priya detect a sensor that is signing correctly but reading from a spoofed physical probe. A *sensor-trust indicator* on the Priya-desktop incident row (per-source trust score, last calibration timestamp, drift indicator) would give her a read-time cue. The spine has the chain freshness clock but not the per-source trust indicator.
- **Spoofed regulator dashboard:** the design is operator-first, not consumer-facing for PHA — Dr. Mensah sees aggregates. If his dashboard is spoofed, he sees "all green." The PHA-pane should show **out-of-band verification cues** (a hash of his last-viewed-state that he can verify via SMS or a printed audit summary). The spine has nothing on this.
- **Slow-poison protocol:** the fusion engine uses weighted voting and corroboration thresholds. Slow-poison (sub-threshold micro-doses across many points) evades both. The PHA-pane aggregate tiles should include a "cross-ward drift" indicator and the operator surfaces should show a *cumulative-trust-weighted-drift* cue. The spine does not.
- **Insider playbook tampering:** two-person rule defends the version-of-record. But the **draft editor** (where Priya authors amendments) is not gated. A malicious Priya could draft an amendment that *looks* innocuous in the queue and only reveals the harm after PHA signs. The design should show PHA a *diff* against the version-of-record with risk-highlighting (e.g., "this step changes the T2→T3 trigger condition"). The spine mentions "He reviews the diff" but does not specify the diff's UI treatment.
- **Insider override of real alerts:** the override-anomaly detection is logged in v1, enforced in v2. Priya can close a real incident as "false positive" today and the system will not act. The spine does not surface an *override-velocity* cue to Dr. Mensah ("Anjali has 0 overrides; Priya has 47 overrides this month; the median is 12"). Without this surface, the override-anomaly monitor is invisible infrastructure in the worst sense.
- **Audit-chain exfiltration:** access-logging is in place, but the spine does not specify a **read-volume anomaly cue** on the PHA-pane ("Dr. Mensah has accessed 12,000 audit events this week; the median is 800"). Insider exfiltration looks like a normal access pattern until it isn't.

## 6. Ramesh-channel language safety — **FAIL (high)**

This is the highest-risk gap in the spine. The five message shapes are in English in EXPERIENCE.md; the Bangla equivalent is implicit. **No Bangla text exists in the spine.** A typo in a Bangla template is not visible to a designer who reads only the English spine.

**Specific failure modes:**

- **"Boil" in Bangla** is *ফুটিয়ে নিন* (phutiye nin). A typo to *ফুটে নিন* (phute nin — passive voice, "it boiled") reverses the agency and reads as a *statement of fact*, not an instruction. In a stress read on a low-end phone, Ramesh will not parse the difference.
- **"Do not drink"** in Bangla is *পান করবেন না* (pan korben na). A typo to *পান করুন* (pan korun — affirmative "please drink") is a **single-character deletion that reverses life-safety instructions**. This is not theoretical; this is the canonical Bangla typo risk.
- **"Use bottled"** in Bangla is *বোতলজাত পানি ব্যবহার করুন*. The adjective *বোতলজাত* (bottled-made) is not a household word in low-literacy wards; a reader will guess and may guess wrong. The spine should specify the Bangla text with a literacy-floor review and a *tested-on-three-low-literacy-readers* requirement before any shape ships.
- **Class name {CLASS} in the body** — "Likely contamination: chlorine residual" — the Bangla equivalent *সম্ভাব্য দূষণ: ক্লোরিন অবশেষ* uses the loanword *ক্লোরিন* (klorin), which is not understood at low literacy. A citizen who does not parse *ক্লোরিন অবশেষ* may infer "medicine residue" and panic. The spine should mandate a plain-Bangla gloss per contaminant class and pre-tested citizen-readable phrasing.
- **Verification horizon formatting:** "Next update by 18:00" in Bangla is *পরবর্তী আপডেট ১৮:০০ টায়*. The spine says Bangla locale uses Bengali digits where culturally appropriate, but **the verification horizon is a load-bearing safety element** — Bengali digits ১৮:০০ vs Arabic digits 18:00 are visually distinct and on a cracked-screen Android with auto-contrast off, the citizen may misread ১৮ as ১৭ or ৭৮. The spine should mandate a single digit form per locale and never mix.
- **Resolution message vs. retraction** (also raised in §2): there is no Bangla copy for a retraction. When (not if) a false T3 fires, the Bangla correction copy will be written under time pressure by someone who is not a Bangla linguist. This is the highest-risk scenario in the spine.

**Required additions:**
- Bangla copy in the spine itself for all five shapes (and the proposed sixth retraction shape).
- A *low-literacy reader test* requirement: each shape validated by ≥3 readers from the target ward before launch.
- A *character-class lock* on the template fields — the {CLASS} slot must come from a pre-approved glossary, not free text. The spine currently allows any string.
- A *single-digit-form rule* per locale for the verification horizon.

## 7. Council citation politics — **FAIL (high)**

The persona failure mode is sharp: *"the councillor is hostile to the program; does the design route around a hostile councillor without burning Anjali?"*

The spine does not address this. The acknowledgement surface is *"Quarterly, by name, in her phone via the councillor channel"* (EXPERIENCE.md §"Anjali-mobile IA"). Flow 3 step 7 confirms: *"Anjali receives quarterly councillor citation… Councillor's monthly school-visit mentions her by name as a contributor."*

**Failure modes:**

- **Single-councillor dependency.** Each ward has one councillor; the citation is quarterly via that councillor. If the councillor is hostile (or simply inattentive), Anjali gets zero recognition for three months. The trust-bridge collapses on a per-ward basis and the failure is invisible to the platform.
- **Politically weaponized citation.** A hostile councillor can use the citation as a *campaign tool* — name Anjali publicly only when she is politically useful, withhold it when she is inconvenient. The spine treats the councillor as a neutral amplifier; in practice the councillor is a political actor with their own incentives.
- **Councillor voice-message as parallel channel (Flow 3 step 4).** The councillor is also a *broadcast* surface, not just a citation surface. The same political-capture vector applies: a hostile councillor can suppress a T3 message ("I'll tell my constituents the water is fine") and the system has no recourse — the chain captures only the system-issued WhatsApp, not the councillor's voice.

**Required additions:**
- A **PHA-direct citation channel** as a fallback. If the councillor does not deliver within 30 days of the trigger event, PHA-pane auto-issues the by-name citation via a system channel (email to Anjali's institutional address, certificate PDF, etc.). The chain captures the fallback.
- A **per-councillor citation-delivery metric** on the PHA-pane. Dr. Mensah sees which councillors are delivering and which are not. The political problem becomes a visible operational metric.
- A **councillor-broadcast audit hook.** When a councillor voice-message is sent, the system records *that it was sent* and to whom, even if the system does not compose the message. The chain captures the *event of councillor endorsement*, not the content. This is not surveillance of the councillor — it is a record that *some* endorsement happened, which defends Anjali and the platform against a "no one told us" defense.
- A **route-around for hostile councillors.** If a councillor actively suppresses a T3 broadcast, Priya-desktop should expose a "PHA-direct broadcast" path that bypasses the councillor. The spine does not name this path.

## 8. Two-tap confirmation usability — PARTIAL PASS

The two-tap flow is well-shaped. Five-second timeout. Both taps logged. Preview-then-confirm. Reserved-red color.

**Failure modes not closed:**

- **Rapid-tap automation / hostile insider spamming.** The five-second timeout defeats double-tap automation but **does not defeat scripted automation that issues one tap, waits six seconds, taps again, repeats**. A hostile insider could issue dozens of T3 notices in an hour before anyone notices. The defense is rate-limiting at the gateway (e.g., max 5 T3 issuances per actor per hour), not at the UI. The spine does not name the rate limit. It should.
- **Touch-device stress.** Five seconds is short for a panicked operator on a cracked screen. The UI should show a *visible countdown* (not just the "tap window is visible" line) and the count should grow under stress cues (e.g., chain-freshness degraded → 7-second window). The spine has "tap window is visible" but does not specify the visual treatment.
- **Tap-target on a low-end Android in bright sun.** The button-danger is `radius-md` (10px) with `padding-x: s-5` (24px) and `padding-y: s-3` (12px) — that yields roughly a 48×48 button minimum on a standard layout, but the Bangla preview text inside the modal adds height. The spine should test the modal on a 4.7-inch 720p display in direct sunlight. The accessibility floor says ≥48×48 but does not name a "danger modal in sun" variant.
- **Confirmation by the same operator twice.** The two-tap flow lives on one pane; both taps come from the same operator session. The architecture's two-person rule (`SignatureAttestation` with identical triple) requires *two distinct actors*. The UX two-tap confirmation is a *single-operator* flow that visually mimics the two-person rule. The spine should clarify: the two-tap is a *safety pause*, not a substitute for the two-person rule. The chain event is a single operator's `PublicNoticeIssued` (or whatever the event is named) — the two-person signature comes from the architectural layer, not the UX layer. Right now the UX could be misread as the two-person enforcement point.

**Minor:** the five-second timeout is a UX choice, not an architectural one. A motivated operator can hit preview, read, confirm — well under five seconds. A panicked operator who pauses to re-read may *exceed* five seconds and have to start over. The timeout should be **adaptive**: longer when the operator hovers / long-presses the preview, shorter when they tap through. The spine does not name this.

---

## Cross-cutting findings

### C-1. Spine is silent on multi-operator handoff during a live T3.

Priya-desktop is staffed 1–2 people; what happens when the on-call operator is mid-issuance and shift changes? The handover brief captures open incidents but not in-flight confirmations. The two-tap confirmation could be left dangling (previewed, not confirmed) at shift change. A second operator arriving mid-flow has no UI cue that a preview is pending and no chain event until confirm. The spine should specify the dangling-preview state explicitly.

### C-2. Empty-state copy assumes good faith.

Anjali-mobile empty state: *"No reports yet. Your first report lands here."* Priya-desktop: *"No open incidents. Last incident resolved {RELATIVE_TIME}."* PHA-pane aggregate tiles: *"zero state shows `0` with a sub-line `last X days`."* These are well-crafted for a happy-path operator. They do not address the *post-incident* operator — the operator who just resolved a cholera alert and is staring at "No open incidents" three hours later. The empty state should acknowledge that the absence is *good news earned by work*, not silence.

### C-3. Ramesh-channel template table has no "all clear without prior notice" path.

The "Safe now" template is shaped as *resolution of a prior notice*. If water is genuinely safe through routine testing (no prior incident), there is no message to send. The spine correctly says "silence is the state" — but it does not address the *citizen who never saw a prior notice* receiving a "Safe now" message via a forwarded chain. The template should be tested against the case where the message reaches a citizen out of context.

### C-4. Voice note provenance is named but not visually anchored.

EXPERIENCE.md §"Voice input (Anjali)" says the voice note attaches to the `AnjaliReportSubmitted` event with provenance linking to the auth-session reference (AD-12). This is correct architecturally. But the Anjali-mobile UI does not show Anjali *which session* her voice note is bound to. If Anjali lends her phone to a substitute teacher who files a report in Anjali's name, the system does not surface this to Anjali (the provenance is opaque). Anjali-mobile should show a session-bound indicator (subtle, not surveillance-feeling) — *"This device is registered to Anjali [name], Ward [X] school"* — so the trust anchor is visible, not just inferred.

### C-5. The two-tap confirmation's *first tap* (preview) is the more dangerous one.

A hostile insider who reaches the preview step has already caused harm: the preview is generated from chain values, and the chain values include the geofence + class. If the preview is *visible on a screen that gets shoulder-surfed* (PHA office, shared workstation), the attacker learns the geofence and class before the confirm. The preview should default to a *redacted* form (`{ZONE_GEOFENCE}` shown as "Ward 7" but class shown as "[redacted until confirm]") with full reveal only at confirm. The spine does not address shoulder-surfing on the preview.

### C-6. Accessibility floor is strong on contrast and tap targets but silent on cognitive accessibility.

The DESIGN.md and EXPERIENCE.md name visual contrast (12.6:1, AAA), keyboard nav, screen reader, color independence, and motion. They do not name *cognitive* accessibility: reading-level, plain-language review, sentence-length limits, dual-channel confirmation (visual + audio cue for the two-tap), or stress-mode simplification (fewer options, larger type, reduced color). For Anjali under stress and Ramesh in panic, cognitive accessibility is the floor that matters. The spine should add it.

### C-7. The five-shape discipline and the councillor voice-message discipline are inconsistent.

The five-shape table is rigorous: no free composition; the chain fills the slots. The councillor voice-message (Flow 3 step 4) is *free composition by a non-system actor*. The spine enforces discipline on the system and trusts the councillor. This is a *deliberate* trust-bridging choice (persona win) but it should be **explicitly named as a deliberate exception**, not silently allowed. Right now it looks like an oversight.

### C-8. The audit chain is referenced everywhere but never *visualized* for operators.

Operators see badges that say "deviation captured" or "action taken." They never see the chain itself. A panicked operator (or a defensive one under inquiry) who wants to *prove* what happened must ask Dr. Mensah to look it up in the audit-browser. The Priya-desktop should expose a **per-incident audit timeline** (read-only, access-logged) so Priya can defend her own actions without escalating to PHA. This is a single UI affordance and it converts the audit chain from a regulator-only surface to an operator-self-defense surface.

---

## Summary by severity

| # | Finding | Severity |
|---|---|---|
| 4 | PHA governance capture: two-tap on PHA pane contradicts "never a message-desk"; `pha_approver` is a de facto message-desk | **critical** |
| 6 | Ramesh-channel Bangla copy not in the spine; typo reversal risk on "Do not drink"; literacy floor unaddressed | **high** |
| 7 | Councillor citation has no hostile-councillor fallback; councillor voice is an uncontrolled broadcast surface | **high** |
| 2 | No retraction message shape; no chain event for `PublicNoticeRetracted`; false-T3 recall path undefined | **high** |
| 8 | Two-tap does not defeat scripted single-actor automation; no rate limit named; same-operator double-tap could be misread as two-person rule | **medium** |
| 3 | Deviation-capture audit traceability: no persistent "my deviations" view on Priya-desktop | **medium** |
| 5 | Per-source sensor-trust indicator, override-velocity cue, and read-volume anomaly cue absent from operator surfaces | **medium** |
| 1 | Anjali-mobile status feed has no graceful-stale pattern; surveillance-feel risk for the common (non-T3) case | **low** |
| C-1 | Dangling-preview state on shift change undefined | **low** |
| C-5 | Two-tap preview is shoulder-surfable before confirm | **low** |
| C-6 | Cognitive accessibility floor not addressed | **low** |
| C-8 | Per-incident audit timeline not exposed to operators | **low** |

---

## Recommendation

The spines are at **CONCERNS**, not FAIL, because the foundation is solid: separate-product architecture, chain-as-truth, two-person rule, friction-not-block on deviations, red-reservation, and the councillor-as-trusted-voice move are all the right shape. The gaps are concentrated in three places:

1. **The Bangla consumer-message table is empty.** This is the highest-risk gap and the cheapest to close — write the Bangla copy, test it on three low-literacy readers, and lock the {CLASS} field to a pre-approved glossary.
2. **The PHA-as-message-desk contradiction.** Move the two-tap confirmation surface to Priya-desktop (or a dedicated message-desk role); keep PHA-pane on the approval side. The architectural RBAC needs a third role.
3. **The retraction path is undefined.** Add the sixth shape ("Retraction / False alarm"), the `PublicNoticeRetracted` chain event, and the councillor-bypass path for hostile councillors.

Resolve these three and the spine moves to PASS.
