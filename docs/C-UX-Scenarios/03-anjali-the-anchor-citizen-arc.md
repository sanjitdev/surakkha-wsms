# Scenario 03 — Anjali's full citizen arc: Report, got-heard ack, in-progress signals, closure tap

**Phase:** 2 — UX Scenarios
**Archetype:** Anjali the Anchor (source lane — citizen edge; one persona/role that all citizens in Dhaka can use; NID-bound web reporter; anchors get a special flag for higher priority because their reports don't need a lot of verification — they're authentic reporters)
**Instance count:** 50 civic anchors (ICDDR,B-credentialed, BDT 2,000/month stipend tied to weekly check-in discipline) + open-ended reporting citizens. Both tiers share this role archetype; the credibility signal emerges from reporting history.
**Goal served:** G1 (loop is reproducible — her report is the loop's input) · G2 (loop is defensible — her closure tap is an audit signal) · **G3 (citizens feel heard in motion — DIRECT, PRIMARY; she is the citizen edge of Goal 3)**
**Persona link:** [04-persona-anjali-the-anchor.md](../B-Trigger-Map/04-persona-anjali-the-anchor.md)
**Feature link:** **#2 — In-flight citizen motion signals (state transitions)** ([feature-impact.md](../B-Trigger-Map/feature-impact.md)) — the gap screen this scenario centers on. Also addresses **#5 — 5-min "got heard" acknowledgment**, **#6 — Closure ack with ✅ / ❌ tap + reopen lineage**, **#14 — Tier-signal internal handling (citizen vs anchor response parity)**, **#16 — False-positive "thanks, we checked" response**, **#21 — Background in-progress signal automation (decoupled from close velocity)**, **#28 — Citizen-ack window countdown with silent-incident auto-routing**, **#32 — Offline-queue status indicator on citizen submit surface**.

> **Thread-back (load-bearing for understanding this scenario):**
> - Anjali's submit is the **entry event** into [Scenario 01 — Priya's shift: Triage, verify, assign](01-priya-the-pipeline-pilot-triage-verify-assign.md). She submits → `IncidentCreated` lands → Priya's `Verified` + `Assigned` fires → the **in-progress signal** (Goal 3 middle beat) is what Anjali sees on her phone.
> - Adi's `IncidentResolvedByAdmin` from [Scenario 02 — Adi's shift: Mark resolved, hand back to Priya](02-adi-the-auditor-mark-resolved-handoff.md) is the **trigger event** for Anjali's closure ack. Adi marks resolved → `CitizenAckRequested` dispatches → Anjali gets the closure notification + ✅ / ❌ tap (Goal 3 third beat).
> - **Priya's `IncidentClosed{closer: priya}` is the loop's end-state** (Scenario 1's reverse arc). Anjali's ✅ tap is the citizen-voice input that lets Priya close.

---

## Header — locked decisions for this scenario

> **Confirmed by user before scenario writeup. Locking these so Freya reconciles against them, not against an interpretation:**
>
> 1. **Submit form is under 60 seconds.** Five fields in order: where (map pin, GPS-defaulted, draggable) / what (short text, Bangla or English, with auto-suggestions: "foul smell," "discoloration," "sickness in family," "leak/pipe damage") / when (auto-now with calendar fallback) / photo (optional but encouraged; EXIF preserved, NOT stripped) / voice note (optional, 30s max, speech-to-text on). Single primary CTA: "Submit report" in green (trust-band T1 color). No secondary CTAs.
> 2. **Anchor-trust badge visible to Anjali.** "Anchor reporter ✓" shown near the submit button on her own form. Tells her: "Your reports get priority because you're verified as authentic." Chain captures anchor flag on every report. No trust-band math visible, just the badge.
> 3. **Got-heard ack within 5 minutes, dual channel.** On-screen: form transitions to confirmation view "Got heard ✅. Your report id: `inc_01HX...`. We'll keep you posted as it moves." SMS: same message + deep link to portal status timeline. Bangla-first, calm tone per `content-language.md`. No resolution timeline promised — only motion promised.
> 4. **Status timeline is the gap screen — #2 priority feature from feature-impact.md.** Vertical list of state transitions with timestamps + one-line Bangla descriptions. Captures every state: `IncidentCreated` → `VerificationSubmitted` (Priya) → `AssignedToTechnician` → `TechnicianArrived` → `DiagnosisSubmitted` → `FixSubmitted` → `ProofAccepted` (Adi) → `IncidentResolvedByAdmin` → `IncidentClosed` (Priya close) OR `IncidentReopened{parent}` (re-enter with branch visible). Reopen lineage preserved as a connected thread — never confuse her about what happened to her report.
> 5. **Closure ✅/❌ tap is INSIDE the authenticated web portal.** SMS notifies ("tap to confirm") but tapping opens the browser → portal login → once authenticated, taken to the closure screen for that specific incident. One screen, one decision. Large ✅ / ❌ buttons. Incident summary visible above (where, what, when, who worked on it). ❌ tap opens a free-text + optional voice "tell us why" field.
> 6. **Silent-ack path: held open with periodic reminders.** 60 min first nudge SMS → 24h second nudge → 7d third nudge (escalated tone, "incident will remain open until you respond or until 30 days from now") → 30d auto-close with `CitizenAckWindowExpired + IncidentClosed{closer: priya, ack: silent, age: 30d}`. Final SMS: "Your report was closed without your confirmation. If the problem persists, please resubmit." **Priya monitors the held-open state** (not Adi, who has already walked away after marking resolved). Priya can close earlier with sensor-confirmed silence if her post-resolution readback confirms clearance.
> 7. **My reports tab + (Phase 2 candidate) ward-at-a-glance for anchors.** Phase 1 only ships the My Reports tab (full history with status). Phase 2 candidates: ward-at-a-glance view for anchor reporters (12 active reports · 3 resolved this week · 1 escalated — without revealing other reporters' identities). Flag the Phase 2 candidate in the scenario writeup without designing it.
> 8. **Submit fires `IncidentCreated{source: web_form, reporter: nid_hash, band: T1 or T2, anchor: bool}`.** Anchors default to T1; non-anchors default to T2; priority can be uplifted by sensor proximity at creation time.
> 9. **All Bangla copy.** Noto Sans Bengali per `visual-direction.md`. Tone is calm, protective, not alarming. Slot discipline per `content-language.md` — no marketing language, no PHA bureaucracy speak.
> 10. **Three-beat Goal 3 visibility.** The scenario must explicitly thread all three beats: got-heard ack (Screen 2), in-progress signals (Screen 3), closure tap (Screen 4). These are not separate scenarios; they are the spine of Anjali's arc.

---

## Entry point & emotional state

**Entry screen:** LoginPage (NID-bound phone authentication, web form on low-end Android browser — no mobile app, no PWA polish in Phase 1).
**Trigger:** Something happened to the water — her family noticed a foul smell this morning, or her neighbour mentioned discoloration at the standpipe, or she saw a leak near her son's school. The system isn't on her mind until the water is.

**Two arrival states (both in scenario):**

- **Urgent arrival — protective urgency.** The water looks bad. She wants to act before the moment passes, before the family drinks from the wrong tap, before the school day starts. She opens the web form, fills five fields in under 60 seconds, and hits submit. She is *in motion*, not anxious. Her dominant emotion is protective urgency.
- **Curious arrival — attentive curiosity.** The city said a tech was coming yesterday. She wants to know what happened. She opens the portal, lands on My Reports, and reads the timeline. Her dominant emotion is attentive curiosity.

**Internal state in both states:** practically urgent when submitting, curiously attentive when checking. She is **not** a tech user; she is a parent/neighbour/community member who happens to have a phone. She does not optimise for UX; she uses the lowest-friction surface that works. When the system fails her, the emotion is **quiet withdrawal** — not anger, not complaint, just *I won't bother next time.* That quiet withdrawal is what erodes the social infrastructure over months.

**What she does NOT see:** Priya's dashboard, Adi's verification queue, the chain explorer, the trust band as a number, the operator reasoning. She sees only her own account's status view. The trust-band math is internal; the anchor badge is the only tier signal she sees.

---

## Screen 1 — LoginPage (NID-bound phone auth)

**File path reference:** `web/src/pages/00-shared/LoginPage.tsx` (per FE-1 spine; auth mechanism placeholder per product-brief gap row)

**What Anjali sees:** A minimal web login form. Phone number field + send-OTP button. OTP arrives via SMS (C-11 binding — SMS first-class). Bangla-first, English fallback per `content-language.md`.

**What she does:** Types her NID-bound phone number. Taps the SMS OTP. Taps verify. If she's a returning anchor reporter, she lands on My Reports with a brief "where do you want to go?" choice. If she's a new citizen, she's registered on first OTP confirmation (NID-bound; no separate credential application — the reputation ledger builds from her reporting history).

**Decision point:** Whether to start a new report or check status on an existing one. Most urgent arrivals go straight to "Submit report"; most curious arrivals go straight to "My Reports." Both are one tap from the landing.

**What fires automatically on login:** A `LoginSucceeded{reporter: nid_hash, anchor: bool, locale, last_seen}` event lands on the chain. The `anchor: bool` flag is captured here; it's stamped onto every subsequent `IncidentCreated` event from this account. The offline-queue status indicator (feature #32) is also surfaced — if she has queued reports from previous offline sessions, they fire automatically and she sees a "2 reports just sent" toast.

---

## Screen 2 — SubmitForm (the under-60-second report) — **Got-heard beat begins**

**File path reference:** `web/src/pages/03-anjali/SubmitForm.tsx` (to be reconciled by Freya; mockup parity per `web/mockups/03-anjali-minimal/`)

**What Anjali sees:**

Five fields in fixed order, each one obvious:

| # | Field | Default | Interaction |
|---|---|---|---|
| 1 | **Where** (map pin) | GPS-defaulted to her current location; pin is draggable if the GPS pin lands on the wrong tap | Drag the pin if needed. Ward label appears below the map ("Ward 14, Mohammadpur"). |
| 2 | **What** (short text, 140 char Bangla / 280 char English) | Empty | Type free text OR tap one of four auto-suggestions: **"foul smell"** / **"discoloration"** / **"sickness in family"** / **"leak/pipe damage"**. Suggestions populate the field; she can edit. |
| 3 | **When** | Auto-now (timestamp captured from device clock) | Tap to open calendar picker if "now" is wrong ("I noticed it yesterday morning"). |
| 4 | **Photo** (optional but encouraged) | Empty | Tap "Add photo" → camera or gallery. EXIF preserved verbatim (no re-encode, no filter, no strip — per visual-direction.md "real evidence only"). A small caption underneath reads "Photo helps the city act faster." |
| 5 | **Voice note** (optional) | Empty | Tap the mic icon → 30-second recording with a waveform visual. Speech-to-text on (server side); the resulting text lands in field #2 as an editable draft. |

**Single primary CTA:** **"Submit report"** in green (trust-band T1 color; the anchor default). No secondary CTAs. No "Save draft." No "Cancel." The form is so fast that "draft" is friction.

**Anchor-trust badge:** Near the submit button, a small badge reads **"Anchor reporter ✓"** with a one-line caption: *"Your reports get priority because you're verified as authentic."* This is the only tier signal visible to her. The badge is conditional on `anchor: true` in the chain record; non-anchors don't see it, and anchors don't see anything else different — the priority promise is what the badge means.

**Bangla copy on the form** (placeholder copy pending i18n review per `content-language.md`):

| Element | Bangla placeholder | English gloss |
|---|---|---|
| Form title | জলের সমস্যা রিপোর্ট করুন | Report a water problem |
| Field 1 label | কোথায় | Where |
| Field 2 label | কী হয়েছে | What happened |
| Field 3 label | কখন | When |
| Field 4 label | ছবি (ঐচ্ছিক) | Photo (optional) |
| Field 5 label | ভয়েস নোট (ঐচ্ছিক) | Voice note (optional) |
| Submit CTA | রিপোর্ট পাঠান | Submit report |
| Anchor badge caption | আপনার রিপোর্ট অগ্রাধিকার পায় কারণ আপনি বিশ্বস্ত রিপোর্টার | Your reports get priority because you're a verified reporter |

Tone is **calm, protective, not alarming.** No exclamation marks. No "URGENT!" No PHA bureaucracy speak. Slot discipline per `content-language.md`.

**What she does:** Fills five fields in under 60 seconds. Most reports take 20-30 seconds when she uses a suggestion + photo. Taps Submit.

**Decision point:** Whether to add the photo (the caption nudges her toward yes; she often does). Whether to use a suggestion or type free text (suggestions are faster; she uses them when the situation matches). Whether to record a voice note (she skips it on urgent arrivals; curious arrivals sometimes add it).

**What fires automatically on submit:**

1. **`IncidentCreated{source: web_form, reporter: nid_hash, band: T1 or T2, anchor: bool, location, observed_at, text, photo_ref, voice_ref, created_at}`** lands on the chain.
2. The form transitions to the **confirmation view** (no page navigation — same screen, new state): big ✅ icon, Bangla message *"আপনার রিপোর্ট পাওয়া গেছে / Got heard ✅"*, report id displayed in mono font (`inc_01HX...`, copy-to-clipboard), and a one-line *"We'll keep you posted as it moves / আমরা আপনাকে জানিয়ে যাব"* in Bangla.
3. **SMS dispatch:** within 5 minutes (Goal 3.1 timing), the same message lands on her phone via SMS, with a deep link to the authenticated portal status timeline for this incident. Bangla-first, GSM-7 / UCS-2 hard caps per C-11.
4. The offline-queue indicator (feature #32) clears if she had anything queued.

**The form-to-confirmation transition is the got-heard ack.** It is the load-bearing UX promise of the entire citizen surface: sub-60-sec submit + 5-min ack. It is the structural response to the "report that disappears" negative force (FIA 15) — she knows the city saw her within five minutes.

**Note on the offline path:** If her phone was offline at submit, the report is queued on the device with a "queued, will send when online" indicator (feature #32). The chain write happens when connectivity returns; the SMS ack fires from the gateway after the chain write, so the 5-min window is from the source-side timestamp, not from when the SMS landed. The offline indicator keeps her from re-submitting.

---

## Screen 3 — MyReports + StatusTimeline (the in-progress signals — the gap screen) — **In-progress beat lives here**

**File path reference:** `web/src/pages/03-anjali/MyReports.tsx` and `web/src/pages/03-anjali/StatusTimeline.tsx` (to be reconciled by Freya)

**What Anjali sees — the My Reports tab:**

A vertical list of all her reports, newest first. Each row carries: ward label + one-line description + status pill (one of: *Got heard / Being checked / Tech on the way / Fix in progress / Resolved / Awaiting your confirmation / Closed*). Tapping a row opens the **status timeline** for that incident.

**What Anjali sees — the status timeline (THE GAP SCREEN):**

This is the #2 priority feature (`feature-impact.md`) and the structural response to the "motion is visible" positive force (FIA 15). It is the load-bearing surface that bridges the got-heard ack and the closure ack.

**Layout:** A vertical list of state transitions for the incident, top-to-bottom (newest at top), each row carrying:

- **Timestamp** in Bangla numerals (`Intl.NumberFormat('bn-BD')`, `useNumberFormatter` per FE-B5g)
- **One-line Bangla description** of what happened
- **Actor chip** (small, mono, copy-to-clipboard for the chain ref) — *who* triggered the state: "Operator: Priya" / "Tech: Karim" / "Reviewer: Adi" / "System"
- **Chain anchor chip** (forensic, mono, copy-to-clipboard) — the per-incident audit timeline's block hash

**The timeline shows every state in the loop.** Per the locked state list:

| # | State | Bangla placeholder description | English gloss | Triggered by | Visible to Anjali? |
|---|---|---|---|---|---|
| 1 | `IncidentCreated` | রিপোর্ট গ্রহণ করা হয়েছে | Report received | Anjali's submit | ✅ Yes — first row |
| 2 | `VerificationSubmitted` | যাচাই করা হচ্ছে | Being verified | Priya (Scenario 1, Screen 4 submit) | ✅ Yes |
| 3 | `AssignedToTechnician` | মাঠ কর্মী পাঠানো হচ্ছে | Field worker dispatched | Priya (paired with #2) | ✅ Yes |
| 4 | `TechnicianArrived` | মাঠ কর্মী পৌঁছেছে | Field worker arrived | Karim | ✅ Yes |
| 5 | `DiagnosisSubmitted` | সমস্যা নির্ণয় করা হয়েছে | Problem diagnosed | Karim | ✅ Yes |
| 6 | `FixSubmitted` | মেরামত করা হয়েছে | Repair completed | Karim (with photo + GPS + EXIF) | ✅ Yes |
| 7 | `ProofAccepted` | মেরামত যাচাই করা হয়েছে | Repair verified | Adi (Scenario 2, Screen 2) | ✅ Yes |
| 8 | `IncidentResolvedByAdmin` | প্রশাসনিকভাবে সমাধান হয়েছে | Resolved by admin | Adi (paired with #7) | ✅ Yes |
| 9 | `IncidentClosed` (✅ path) | রিপোর্ট বন্ধ করা হয়েছে | Report closed | Priya (after Anjali's ✅) | ✅ Yes — final row |
| 9-alt | `IncidentReopened{parent}` (❌ path) | রিপোর্ট আবার খোলা হয়েছে | Report reopened | Anjali's ❌ OR Priya's confirmation OR silent expiry | ✅ Yes — visible as a branch |

**Each transition also fires a one-way SMS** with the same one-line Bangla message, decoupled from Adi's queue throughput (feature #21 — background in-progress signal automation). The SMS is a nudge, not a dependency; the timeline in the portal is the canonical view.

**What she does (curious arrival):** Opens My Reports → taps the row → reads the timeline top-down. She watches the report move. She doesn't refresh; new rows arrive at the top automatically.

**What she does (between states):** Closes the phone, goes back to her day. The motion lives in her pocket; when she wants to check, she checks.

**Decision point:** None at this level. The timeline is informational, not a workflow. The only decision she makes on this screen is whether to tap a row to see detail — and the row tap is one tap, not a workflow.

**What fires automatically when a new state arrives:**

1. The new row appears at the top of the timeline (in-portal).
2. An SMS is dispatched to her phone with the one-line Bangla message.
3. The status pill on the My Reports row updates to reflect the new state.

**The timeline is the structural response to "the motion is visible"** (FIA 15). It runs on automation, not on any operator's attention. Goal 3.2 ("in progress signal at every state transition") is met by this surface.

**Invisible to Anjali (deliberately):** All `Verified`, `Assigned`, `DeferRequested`, `EscalatedToPia`, `HotlineIntakeReceived`, `ProofInsufficient`, `TrustBandOverridden`, `EscalationTriggered` chain events from operator/administrator surfaces — these are operator-internal reasoning captures, not citizen-facing signals. The timeline is curated; she sees the citizen-relevant state transitions, not every chain event.

---

## Screen 4 — CitizenAckClosurePage (the ✅ / ❌ tap — the decision) — **Closed beat lands here**

**File path reference:** `web/src/pages/03-anjali/CitizenAckClosurePage.tsx` (FE-F6 shipped per visual-direction.md "shoulder-surfing redaction" binding)

**How Anjali arrives here:**

The SMS closure notification arrives on her phone with the deep link: "আপনার রিপোর্ট সমাধান করা হয়েছে — নিশ্চিত করুন / Your report has been resolved — tap to confirm." She taps the SMS link → opens her phone browser → portal login (NID-bound OTP) → once authenticated, the portal routes her directly to `CitizenAckClosurePage` for this specific incident.

**What Anjali sees:**

**Above the decision area — the incident summary** (so she knows what she's deciding on):

| Element | Content | Bangla placeholder |
|---|---|---|
| Where | Ward + nearest landmark | ওয়ার্ড ১৪, মোহাম্মদপুর |
| What | One-line description from her original report | পানিতে দুর্গন্ধ |
| When | When she submitted | আজ সকাল ৭:৩০ |
| Who worked on it | Actor chips in chronological order: Operator, Field worker, Reviewer | পরিচালক: প্রিয়া · মাঠ কর্মী: করিম · পর্যালোচক: অদি |
| Fix summary | Adi's resolution proof caption + sensor readback outcome | পাইপ মেরামত করা হয়েছে, পানি পরীক্ষায় স্বাভাবিক |

**Below the summary — the decision:**

Two large buttons (mobile touch floor ≥48×48 px per visual-direction.md). Bangla-first labels, English fallback underneath:

- ✅ **"হ্যাঁ, সমস্যা সমাধান হয়েছে / Yes — fixed"** (primary, green / trust-band-success-500)
- ❌ **"না, সমস্যা এখনো আছে / No — still a problem"** (secondary, danger-tinted — danger-500)

**The ✅ path:**

She taps ✅. One chain event fires: `CitizenAckAccepted{anjali, inc, accepted_at}`. The portal routes to a thank-you view (single screen, calm tone): *"ধন্যবাদ। আপনার রিপোর্ট বন্ধ করা হয়েছে। / Thank you. Your report has been closed."* Priya's `IncidentClosed{closer: priya, ack: yes}` fires automatically within minutes (Scenario 1's reverse arc — the close is Priya's, but the close is triggered by Anjali's ✅). She sees the row move to "Closed" in My Reports.

**The ❌ path:**

She taps ❌. The page transitions (same screen, new state) to a "tell us why" field:
- **Free-text field** (Bangla or English, 280 char Bangla / 560 char English): *"কী সমস্যা এখনো আছে? / What problem is still there?"*
- **Optional voice note** (30s, speech-to-text on): same mic icon pattern as Submit.
- **Submit reopen button** (primary, danger-500).
- **Cancel button** (ghost, returns to the ✅/❌ choice).

When she submits, the chain fires:
1. `CitizenAckRejected{anjali, inc, reason_category, free_text, voice_ref, rejected_at}`
2. **Automatic** `IncidentReopened{parent: inc, reopened_by: anjali, reopen_reason: ack_rejected, reopened_at}`

The reopened incident re-enters both Priya's inbox AND Adi's closed-loop queue at the same priority band, with the ❌ reasoning visible on the chain segment (per Scenario 2 Screen 4 and Scenario 1's reverse arc). The status timeline (Screen 3) for this incident now shows the reopen as a **branch** — connected to the original timeline, never confused with it.

**What she sees after ❌ submit:** A calm-tone confirmation (not alarming): *"আপনার রিপোর্ট আবার খোলা হয়েছে। / Your report has been reopened."* The portal returns to the timeline for this incident, which now shows the reopen branch.

**Decision point:** Whether to tap ✅ or ❌. The decision is the citizen's voice in the audit trail. There is no neutral option — silence has its own path (see Silent-ack path below).

**What fires automatically on ✅:** `CitizenAckAccepted` lands. Priya is notified. `IncidentClosed{closer: priya, ack: yes}` lands within minutes. SMS confirms closure: *"আপনার রিপোর্ট বন্ধ করা হয়েছে — ধন্যবাদ। / Your report has been closed — thank you."*

**What fires automatically on ❌:** `CitizenAckRejected` + automatic `IncidentReopened{parent}` land. The reopened incident re-enters Priya's inbox AND Adi's queue. SMS confirms reopen: *"আপনার রিপোর্ট আবার খোলা হয়েছে। আমরা আবার দেখব। / Your report has been reopened. We will look again."*

**Shoulder-surfing redaction:** Per visual-direction.md and FR-4, the ✅ / ❌ buttons render in a way that can't be over-the-shoulder guessed. The shoulder-surfing redaction binding is load-bearing for FR-4 (citizen privacy on the closure tap).

---

## Screen 5 — MyReports (post-closure steady state)

**What Anjali sees after the loop ends:**

The row in My Reports now carries the **"Closed"** status pill (or "Reopened" with the branch visible). She can still tap the row to see the full timeline — including the reopen branch if applicable, or the simple "Got heard → Closed" arc if she tapped ✅.

**The history is preserved.** Every report she's ever submitted is in My Reports, with its full timeline. She can scroll back weeks or months. The reporting history is the reputation ledger from the citizen's side — but she doesn't see any "score" or "tier" math. She sees her history; the system sees her credibility.

**Anchor tier note:** Anchors see the same My Reports as non-anchors. The anchor badge is on the submit form, not on My Reports. There is no per-row indicator that says "this report was priority-fast-tracked because you're an anchor" — that would surface the tier signal, which is internal-only per feature #14 (tier-signal internal handling — citizen vs anchor response parity).

---

## End state — two outcomes, both preserved

### Outcome A — ✅ ack path: `IncidentClosed{closer: priya, ack: yes}`

**State sequence:** `IncidentCreated` → `VerificationSubmitted` → `AssignedToTechnician` → `TechnicianArrived` → `DiagnosisSubmitted` → `FixSubmitted` → `ProofAccepted` → `IncidentResolvedByAdmin` → `CitizenAckAccepted` → **`IncidentClosed{closer: priya, ack: yes}`**

Anjali is done. Her report is closed on the chain. She can see it in My Reports with the full timeline. The next time something looks wrong, she weighs the cost of submitting again against the cost of doing nothing — and submitting wins because **the loop told her what was happening, and it ended in a way she confirmed.**

The next time a neighbour complains about the water, she tells them: "the system worked — I reported and they came." That word-of-mouth is the social infrastructure that keeps the reporter base growing (per Anjali persona "What she does share" section).

### Outcome B — silent-ack path: `IncidentClosed{closer: priya, ack: silent, age: 30d}`

**State sequence:** `IncidentCreated` → ... → `IncidentResolvedByAdmin` → *silent ack window* → `CitizenAckWindowExpired` (held open) → **`IncidentClosed{closer: priya, ack: silent, age: 30d}`** (30 days after `IncidentResolvedByAdmin`)

Anjali is done — but she never confirmed. The chain captures silence as a non-response. The close is Priya's (not Adi's), Priya has already done the work of monitoring the held-open state (locked decision #6). Nothing punitive happens — her reporting history is intact; no soft mark; no "citizen who doesn't respond" badge.

The final SMS when auto-close fires: *"আপনার রিপোর্ট নিশ্চিতকরণ ছাড়াই বন্ধ করা হয়েছে। সমস্যা এখনো থাকলে আবার রিপোর্ট করুন। / Your report was closed without your confirmation. If the problem persists, please resubmit."*

**Both outcomes preserve her as a reporter.** The system honours her silence as structural, not personal. The follow-up path (resubmit) is one tap, not a new account.

---

## Status timeline states (sub-section — the gap screen design in full)

This sub-section names the load-bearing gap screen design unambiguously. Per Scenario 2 and the trigger map, the chain fires a fixed sequence of events. Anjali sees the citizen-relevant ones; the timeline is curated.

| # | Chain state | Visible to Anjali? | Bangla placeholder | English gloss | Triggered by | SMS fires? |
|---|---|---|---|---|---|---|
| 1 | `IncidentCreated` | ✅ | রিপোর্ট গ্রহণ করা হয়েছে | Report received | Anjali's submit (Screen 2) | ✅ Got-heard ack |
| 2 | `VerificationSubmitted` | ✅ | যাচাই করা হচ্ছে | Being verified | Priya (Scenario 1, Screen 4 submit) | ✅ In-progress |
| 3 | `AssignedToTechnician` | ✅ | মাঠ কর্মী পাঠানো হচ্ছে | Field worker dispatched | Priya (paired with #2 — same submit) | ✅ In-progress |
| 4 | `TechnicianArrived` | ✅ | মাঠ কর্মী পৌঁছেছে | Field worker arrived | Karim | ✅ In-progress |
| 5 | `DiagnosisSubmitted` | ✅ | সমস্যা নির্ণয় করা হয়েছে | Problem diagnosed | Karim | ✅ In-progress |
| 6 | `FixSubmitted` | ✅ | মেরামত করা হয়েছে | Repair completed | Karim (with photo + GPS + EXIF bundle) | ✅ In-progress |
| 7 | `ProofAccepted` | ✅ | মেরামত যাচাই করা হয়েছে | Repair verified | Adi (Scenario 2, Screen 2) | ✅ In-progress |
| 8 | `IncidentResolvedByAdmin` | ✅ | প্রশাসনিকভাবে সমাধান হয়েছে | Resolved by admin | Adi (paired with #7 — same submit) | ✅ Closure notification fires the CitizenAckRequested |
| 9 | `CitizenAckRequested` (internal) | ❌ — visible as closure notification | — | — | Adi (paired with #7 — same submit) | ✅ Triggers the closure ack SMS that brings her to Screen 4 |
| 10 | `CitizenAckAccepted` | ✅ — appears on timeline as "Closed" | রিপোর্ট বন্ধ করা হয়েছে | Report closed | Anjali's ✅ (Screen 4) | ✅ Final thank-you SMS |
| 11 | `IncidentClosed{closer: priya, ack: yes}` | ✅ — final row | (same as #10) | — | Priya (after Anjali's ✅) | (none — already closed) |
| 10-alt | `CitizenAckRejected` | ✅ — appears on timeline | সমস্যা এখনো আছে — পুনরায় খোলা হচ্ছে | Still a problem — reopening | Anjali's ❌ (Screen 4) | ✅ Reopen confirmation |
| 11-alt | `IncidentReopened{parent, reopened_by, reopen_reason}` | ✅ — branch visible | রিপোর্ট আবার খোলা হয়েছে | Report reopened | Anjali's ❌ OR Priya's confirmation OR silent expiry | (none — incident is back in flight) |
| 12 | `CitizenAckWindowExpired` | ❌ internal — captured on chain | — | — | System monitor (1h, 24h, 7d, 30d thresholds) | ✅ Nudge SMSs per silent-ack schedule |
| 13 | `IncidentClosed{closer: priya, ack: silent, age: 30d}` | ✅ — final row, marked silent | রিপোর্ট বন্ধ করা হয়েছে (নিশ্চিতকরণ ছাড়া) | Report closed (without confirmation) | Priya (auto-close, after 30d) | ✅ Final SMS — resubmit prompt |

**Hidden from Anjali (deliberately):** `Verified`, `Assigned`, `DeferRequested`, `EscalatedToPia`, `HotlineIntakeReceived`, `ProofInsufficient`, `TrustBandOverridden`, `EscalationTriggered`, all `LoginSucceeded`, all chain-integrity events. These are operator-internal reasoning captures. The timeline is curated; she sees what the city did about her water, not the operator's workflow noise.

**The actor chip on each visible row** is the named-actor transparency that's load-bearing for defensibility — Priya / Karim / Adi all appear by name (or role chip if anonymous), copy-to-clipboard for the chain ref. Anjali never needs to know the chain, but if she ever wants to verify, the chip takes her there.

---

## The three-beat Goal 3 signal map (sub-section)

This sub-section threads all three Goal 3 beats — got-heard → in-progress → closed — to the screen + chain event + channel + timing.

| Beat | Screen | Chain event fired (trigger) | Bangla placeholder wording | Channel | Timing (Goal 3 objective) |
|---|---|---|---|---|---|
| **Got-heard** (3.1) | Screen 2 (confirmation view) + initial SMS | `IncidentCreated` (Anjali's submit) | আপনার রিপোর্ট পাওয়া গেছে। রিপোর্ট নম্বর: `inc_01HX...`। আমরা আপনাকে জানিয়ে যাব। / Your report has been received. Report id: `inc_01HX...`. We'll keep you posted. | Both: on-screen + SMS (with portal deep link) | Within 5 minutes of submit (Goal 3.1) |
| **In-progress** (3.2) — state #2 | Screen 3 (timeline) + per-state SMS | `VerificationSubmitted` (Priya) | যাচাই করা হচ্ছে / Being verified | Both: timeline row + SMS | At every state transition (Goal 3.2) |
| **In-progress** (3.2) — state #3 | Screen 3 | `AssignedToTechnician` (Priya) | মাঠ কর্মী পাঠানো হচ্ছে / Field worker dispatched | Both | At every state transition |
| **In-progress** (3.2) — state #4 | Screen 3 | `TechnicianArrived` (Karim) | মাঠ কর্মী পৌঁছেছে / Field worker arrived | Both | At every state transition |
| **In-progress** (3.2) — state #5 | Screen 3 | `DiagnosisSubmitted` (Karim) | সমস্যা নির্ণয় করা হয়েছে / Problem diagnosed | Both | At every state transition |
| **In-progress** (3.2) — state #6 | Screen 3 | `FixSubmitted` (Karim) | মেরামত করা হয়েছে / Repair completed | Both | At every state transition |
| **In-progress** (3.2) — state #7 | Screen 3 | `ProofAccepted` (Adi) | মেরামত যাচাই করা হয়েছে / Repair verified | Both | At every state transition |
| **In-progress** (3.2) — state #8 | Screen 3 | `IncidentResolvedByAdmin` (Adi) | প্রশাসনিকভাবে সমাধান হয়েছে / Resolved by admin | Both | At every state transition |
| **Closed** (3.3) — ack request | Screen 4 + closure notification SMS | `CitizenAckRequested` (Adi, paired with #8) | আপনার রিপোর্ট সমাধান করা হয়েছে — নিশ্চিত করুন / Your report has been resolved — tap to confirm | Both: SMS (with deep link) + portal route after auth | Within 1 hour of `IncidentResolvedByAdmin` (Goal 3.3) |
| **Closed** (3.3) — ✅ path | Screen 4 (thank-you view) + final SMS | `CitizenAckAccepted` (Anjali) → auto `IncidentClosed{closer: priya, ack: yes}` (Priya) | ধন্যবাদ। আপনার রিপোর্ট বন্ধ করা হয়েছে। / Thank you. Your report has been closed. | Both | At the moment of ✅ tap; `IncidentClosed` within minutes |
| **Closed** (3.3) — ❌ path | Screen 4 (reopen confirmation) + reopen SMS | `CitizenAckRejected` (Anjali) → auto `IncidentReopened{parent}` | আপনার রিপোর্ট আবার খোলা হয়েছে। আমরা আবার দেখব। / Your report has been reopened. We will look again. | Both | At the moment of ❌ submit; reopen enters Priya + Adi queues |
| **Closed** (3.3) — silent path | Screen 5 (My Reports) + final SMS | `CitizenAckWindowExpired` (system) → `IncidentClosed{closer: priya, ack: silent, age: 30d}` (Priya, auto-close) | আপনার রিপোর্ট নিশ্চিতকরণ ছাড়াই বন্ধ করা হয়েছে। সমস্যা এখনো থাকলে আবার রিপোর্ট করুন। / Your report was closed without your confirmation. If the problem persists, please resubmit. | SMS at auto-close (nudge SMSs along the way) | 30 days after `IncidentResolvedByAdmin` |

**The three beats are not separate features.** They are the spine of Anjali's arc on a single, continuous surface (the portal: SubmitForm → MyReports + StatusTimeline → CitizenAckClosurePage). The chain events are the spine; the SMSs are the awareness channel; the in-portal screens are the canonical view.

---

## Silent-ack path (sub-section)

This sub-section names the held-open state Anjali's incident enters when she doesn't tap within the ack window. **Priya monitors this state, not Adi** (locked decision #6). Adi has already walked away after marking resolved. The system runs the nudge schedule automatically; Priya is the human owner of the held-open state and can close earlier with sensor-confirmed silence.

### Reminder schedule

| Touchpoint | Timing (after `IncidentResolvedByAdmin`) | Tone | Bangla placeholder | English gloss | Chain event |
|---|---|---|---|---|---|
| **First nudge** | 60 min | Calm, gentle | আপনার রিপোর্ট সমাধান করা হয়েছে — দয়া করে নিশ্চিত করুন / Your report has been resolved — please confirm | First gentle reminder | (system reminder fired) |
| **Second nudge** | 24h | Calm, factual | আমরা এখনো আপনার নিশ্চিতকরণের অপেক্ষায় / We are still waiting for your confirmation | Factual, no pressure | (system reminder fired) |
| **Third nudge** | 7d | Escalated tone, structural | এই রিপোর্ট আপনার সাড়া না পাওয়া পর্যন্ত খোলা থাকবে, অথবা আগামী ৩০ দিন পর্যন্ত। / This report will remain open until you respond, or for the next 30 days. | Tells her the structural truth | (system reminder fired) |
| **Auto-close** | 30d | Final | আপনার রিপোর্ট নিশ্চিতকরণ ছাড়াই বন্ধ করা হয়েছে। সমস্যা এখনো থাকলে আবার রিপোর্ট করুন। / Your report was closed without your confirmation. If the problem persists, please resubmit. | Resubmit path preserved | `CitizenAckWindowExpired` → `IncidentClosed{closer: priya, ack: silent, age: 30d}` |

### Priya's earlier-close-with-sensor option

Locked decision #6: Priya can close the held-open incident earlier if **her post-resolution sensor readback confirms clearance**. If the sensor data in the next 24-48h shows contamination clearing and Anjali still hasn't tapped, Priya can manually close with `IncidentClosed{closer: priya, ack: silent, age: <30d, reason: sensor_confirmed_clearance}`. The SMS wording is the same as the auto-close wording — the resubmit path is preserved.

This is the structural response to Adi's "Anjali doesn't tap" negative force (A-3, FIA 11) — the silence is structural, not personal, and the system honours it by closing cleanly without making Anjali a "citizen who doesn't respond."

### Nothing punitive about silence

The held-open path is **not** a penalty. Her reporting history is preserved. No soft mark on any ledger. No badge that says "citizen who doesn't tap." The auto-close is the system's way of saying "we did what we could, the door is still open if the water is still bad."

---

## Reopen lineage (sub-section)

When Anjali's ❌ tap (or Priya's confirmation, or silent auto-close-after-❌ within 30d) triggers `IncidentReopened{parent}`, the reopened incident surfaces in her My Reports and StatusTimeline as a **connected thread** — never confused with the original arc.

### How the timeline shows the reopen

The timeline for a reopened incident renders in **two visual sections** connected by a vertical line:

| Section | Contents |
|---|---|
| **Original arc** (top) | All states from `IncidentCreated` through the original `IncidentResolvedByAdmin` → `CitizenAckRequested` → `CitizenAckRejected` → `IncidentReopened{parent}` |
| **Reopen branch** (bottom, indented + connected line) | The reopened incident's states from `IncidentReopened{parent}` forward — Priya re-verifying, Karim re-dispatched (if needed), new `FixSubmitted`, new `ProofAccepted`, new `IncidentResolvedByAdmin`, new `CitizenAckRequested` |

The connected line is a structural signal: *"this is the same report, reopened."* Anjali never has to wonder whether the reopen is a new incident or a continuation. The chain ref chip on the reopen row points back to the original `IncidentCreated` block hash.

### The reopen lineage on the chain

Per Scenario 2's locked decision #4 and Scenario 1's reverse arc, the chain preserves every event in sequence:
- Original arc: `IncidentCreated` → `Verified` → `Assigned` → `TechnicianArrived` → `DiagnosisSubmitted` → `FixSubmitted` → `ProofAccepted` → `IncidentResolvedByAdmin` → `CitizenAckRequested` → `CitizenAckRejected` → `IncidentReopened{parent}`
- Reopen branch: `Reopened` (auto from Anjali's ❌) → Priya's reopen reasoning (`ReopenReviewed{priya, reopen_reason}`) → re-`FixSubmitted` (if Karim redispatched) OR re-`Verified` (if Priya re-verifies in place) → re-`IncidentResolvedByAdmin` → re-`CitizenAckRequested` → re-`CitizenAckAccepted` (or re-`Rejected`, or re-`Expired`) → final `IncidentClosed`

**The reopen lineage is preserved on the chain forever.** Three months later, if Pia reviews the incident, the chain segment shows the full arc — original submit, original resolution, original ❌, reopen, second-pass resolution, second-pass ✅ (or silent). The close is defensible because the lineage is complete.

**Anjali never sees the operator-side reasoning** (Priya's `Verified` reasoning, Adi's `ProofAccepted` reasoning). She sees the states and the actor chips. If the reopen reasoning matters to her ("why did they reopen it?"), the reopen row in her timeline carries a one-line Bangla gloss generated from the chain — never the operator's free-text reasoning.

---

## Phase 2 flag — ward-at-a-glance for anchors (not designed in Phase 1)

Per locked decision #7, Phase 1 ships only the **My Reports tab** (full history with status). The following is a **Phase 2 candidate** flagged here for future design, NOT designed in this scenario:

> **Phase 2 candidate — Ward-at-a-glance view for anchor reporters.** An anchor (or any reporter with sufficient reporting history) sees a monthly aggregate view of her ward: *12 active reports · 3 resolved this week · 1 escalated — without revealing other reporters' identities.* Surfaces as a chart, not a number, so it tells a story she can share with her neighbours. This addresses the "her neighbourhood gets better, visibly" positive force (FIA 12) and is the structural hook for the "your ward at a glance" trend view per Anjali's design implications.

This view is **explicitly deferred to Phase 2** for these reasons: (a) per-writer privacy ("without revealing other reporters' identities") requires an aggregation layer not in Phase 1's data contract; (b) the citizen-facing analytics surface is a Phase 2 capability per the product brief's "What is NOT in the brief" section. The anchor-tier badge (locked decision #2) is the only Phase 1 tier signal; the ward view is the natural next tier-up.

---

## Force coverage map (Anjali's 12 forces — 5 negative + 7 positive)

| # | Force (FIA) | Direction | Addressed in this scenario? | Where in the scenario |
|---|---|---|---|---|
| **−1** | The report that disappears (15) | ❌ | **Yes — load-bearing negative; this scenario IS the response.** | Screen 2's 5-min dual-channel ack (on-screen confirmation + SMS) is the structural answer. The offline-queue indicator (feature #32) handles the "phone shows submitted but the system didn't get it" failure mode. Every state transition pushes an SMS — the report cannot disappear because the timeline shows every step. |
| **−2** | The report that comes back wrong (12) | ❌ | **Partially.** | Screen 4's incident summary carries the original where / what / when / who — so Anjali can verify the closure ack matches her reality before she taps. If the summary doesn't match her report, she taps ❌ and the reopen path preserves the lineage. The structural response to "wrong response to a real report" is the ❌ tap; full resolution is on Scenario 2's reopen handling. |
| **−3** | Being the false alarm (12) | ❌ | **Yes — false-positive "thanks, we checked" response.** | Per feature #16, when her report turns out not to be a real incident, the response is *"ধন্যবাদ, আমরা পরীক্ষা করেছি / Thanks, we checked"* — no reputation penalty. The anti-abuse `bulk_triage_routed` flag is internal-only; never surfaces to her account UI. The "thanks, we checked" wording lives in the timeline as a final row; she never feels like a noisy reporter. |
| **−4** | Being disbelieved because of her tier (10) | ❌ | **Yes — tier-signal internal handling.** | Per feature #14, citizen-tier and anchor-tier reports get identical response time and identical ack language. The anchor badge (locked decision #2) is the only tier signal she sees; the response time parity is structural. No "you're a citizen-tier reporter so this will take longer" message ever surfaces. |
| **−5** | The problem that stays unfixed (12) | ❌ | **Yes — ❌ tap on closure + reopen lineage.** | Screen 4's ❌ path is the structural response. If Karim's work didn't actually fix the water, Anjali taps ❌, types (or speaks) why, and the incident re-enters Priya's + Adi's queues with full lineage. The post-resolution sensor readback (feature #3) is a parallel backstop; if the sensor data shows contamination hasn't cleared, Priya's confirmation step catches it and reopens without Anjali having to act. |
| **+1** | The ack lands (15) | ✅ | **Yes — primary force.** | Screen 2's 5-min dual-channel ack (on-screen + SMS, with portal deep link) is the load-bearing UX promise. Bangla-first, calm tone, includes the report id. The ack is the difference between "I bothered for nothing" and "the city saw me." Goal 3.1 met. |
| **+2** | The motion is visible (15) | ✅ | **Yes — gap screen (#2 feature) is the response.** | Screen 3's status timeline is THE structural answer to this force. Every state transition pushes a row to the timeline AND an SMS to her phone. She sees the report moving through the loop without refreshing. Goal 3.2 met by automation (feature #21), decoupled from any operator's throughput. |
| **+3** | The closure is real and acknowledged (14) | ✅ | **Yes — ✅ / ❌ tap.** | Screen 4's closure page is the structural answer. Her ✅ confirms the closure matches her reality; her ❌ reopens with full lineage. The tap is the citizen's voice in the audit trail — her reality is the final word on whether the closure was real. Goal 3.3 met within 1 hour of `IncidentResolvedByAdmin`. |
| **+4** | Her report is taken seriously the first time (12) | ✅ | **Yes — tier parity + 5-min ack.** | The 5-min ack lands whether she's a citizen or anchor. The response time is the response time; the tier signal is internal-only. She never sees a difference she shouldn't see. |
| **+5** | Her neighbourhood gets better, visibly (12) | ✅ | **Deferred — Phase 2.** | Per locked decision #7, the ward-at-a-glance view is a Phase 2 candidate, NOT designed in Phase 1. Flagged in the Phase 2 flag section above. My Reports carries per-incident history; aggregated ward view is the natural next-tier-up. |
| **+6** | She earns standing by being useful (11) | ✅ | **Partially — anchor badge + history.** | The anchor badge (locked decision #2) is the tier signal she sees. Her My Reports history is the trajectory. The small credibility badge on her account profile (feature #20) is a Phase 1.x addition; the trajectory is in the history regardless. |
| **+7** | The system doesn't punish her for getting it wrong (12) | ✅ | **Yes — false-positive "thanks, we checked."** | Per feature #16, when she reports something that turns out not to be a real incident, the response is "thanks, we checked" — no reputation penalty, no soft mark on the ledger. The system treats her uncertainty as a feature, not a bug. |

**Forces not addressed in this scenario, and where they carry:**
- **−2 (the report that comes back wrong)** — partially addressed by Screen 4's incident summary + ❌ tap; the operator-side response (correcting the system when the tech arrived at the wrong place, or the public notice fired for the wrong ward) is on the operator surface (Scenarios 1 + 2). The citizen-side response is the ❌ tap.
- **+5 (her neighbourhood gets better, visibly)** — Phase 2 by design.
- **+6 (she earns standing by being useful)** — partially via anchor badge + My Reports history; the recruitment trajectory (system invites consistent reporters to anchor tier) is a Phase 1.x addition.

---

## Design log

**Produced by Saga/Freya — 2026-09-10**

**Source links:**
- [Product brief](../A-Product-Brief/product-brief.md)
- [Trigger map](../B-Trigger-Map/00-trigger-map.md)
- [Anjali persona](../B-Trigger-Map/04-persona-anjali-the-anchor.md)
- [Priya persona](../B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md) (handoff thread — Anjali's submit is Priya's verify+assign entry event; Anjali's ✅ is Priya's close trigger)
- [Adi persona](../B-Trigger-Map/05-persona-adi-the-auditor.md) (handoff thread — Adi's `IncidentResolvedByAdmin` is Anjali's closure ack trigger)
- [Feature impact](../B-Trigger-Map/feature-impact.md) — **#2 In-flight citizen motion signals** is the load-bearing gap screen
- [Content & language](../A-Product-Brief/content-language.md) — Bangla-first tone, slot discipline, calm tone per surface; placeholder copy pending i18n review
- [Visual direction](../A-Product-Brief/visual-direction.md) — Noto Sans Bengali, trust-band palette references (T1 green / T2 amber / T3 grey); token system locked 2026-09-07; shoulder-surfing redaction binding for FR-4 ✅ / ❌ tap
- [Scenario 01 — Priya's shift](01-priya-the-pipeline-pilot-triage-verify-assign.md) — Anjali's submit is the entry event; `Verified` + `Assigned` from Screen 4 is the in-progress signal she sees on her phone
- [Scenario 02 — Adi's shift](02-adi-the-auditor-mark-resolved-handoff.md) — Adi's `IncidentResolvedByAdmin` from Screen 2 is the trigger for Anjali's `CitizenAckRequested` closure ack

---

_All Bangla copy in this scenario is placeholder copy pending i18n review. Bangla strings must be reviewed by at least 3 low-literacy readers before any template ships (per `content-language.md` §Language Strategy)._