---
title: Surakkha — Experience & Behavior
status: final
created: 2026-09-06
updated: 2026-09-06
stepsCompleted: [discovery, finalize, reviewer-gate]
companions:
  - DESIGN.md
sources:
  - ../../../specs/spec-surakkha-v1/SPEC.md
  - ../../../specs/spec-surakkha-v1/personas.md
  - ../../../specs/spec-surakkha-v1/architecture-invariants.md
  - ../../../specs/spec-surakkha-v1/escalation-policy.md
  - ../../../specs/spec-surakkha-v1/playbook-lifecycle.md
  - ../../../planning-artifacts/epics-backend.md
---

> **Behavior, IA, and voice for Surakkha v1.** How it works. EXPERIENCE.md governs copy, state, interaction, accessibility behavior, and named-protagonist key flows. Visual identity lives in DESIGN.md. Both spines win on conflict with any mock, wireframe, or import. Cross-references use `{DESIGN.md#section}` and `{path/to/companion#section}`.

# Surakkha — Experience & Behavior

## Foundation

Surakkha v1 ships **four product surfaces** to **three named personas** (Anjali, Priya, Dr. Mensah) plus the consumer (Ramesh). For Ramesh, the surfaces are invisible infrastructure — no app to install, no dashboard to log into; the WhatsApp and SMS threads *are* the product.

Throughout this document, "trust-bridge" denotes the deliberate surfacing of a known authority (operator, councillor, sensor chain) on a message or surface to make an unfamiliar system legibly trustworthy to a recipient who has no prior relationship with it.

| Surface | Form-factor | Primary persona | Inputs | Outputs | Core jobs |
|---|---|---|---|---|---|
| **Anjali-mobile** | Android, WhatsApp-fronted, low-bandwidth | Anjali (local operator) | voice note, sentinel-strip photo, free-text, weekly check-in, SMS-equivalent path | one-tap incident reports, status feed, public acknowledgement | report fast; see that reports mattered |
| **Priya-desktop** | web desktop dashboard | Priya (central operator) | ranked action list, playbook steps, handover brief, deviation capture | deviation captures, overrides, PHA report export | resolve incidents; pass shift cleanly |
| **PHA-pane** | read-mostly regulator pane | Dr. Mensah (PHA Director) | cross-ward aggregates, deviation dashboards, threshold controls, audit-browser | playbook approvals, threshold edits, audit-chain browse, *dual-signature attestation on T3-boundary issuances* | govern; mandate standard; defend decisions; **never** operate as a message-issuance desk |
| **Ramesh-channel** | invisible infrastructure — WhatsApp + SMS + councillor-routed voice | Ramesh (consumer) | none as a UI surface | "safe / boil / do not drink / use bottled / wait" notice in Bangla or English | know what to do right now |

**Surface separation is structural.** The two-tap consumer-message issuance confirmation lives on **Priya-desktop** (where the operator with `utility_message_desk` role is the natural issuer). PHA-pane surfaces the *approval* (the dual-signature `SignatureAttestation` events on `PublicNoticeIssued` and on T3-boundary playbook amendments), not the issuance affordance itself. Dr. Mensah approves; the operator with `utility_message_desk` role (or Priya-desktop on-call `utility_operator` actor) issues. **Critically: the `pha_approver` role does not include message-issuance rights.** This separation prevents the PHA-as-message-desk failure mode the persona explicitly names.

This split adds one role to the closed role enum (`actor_identity.role` from architecture AD-12):

- `utility_message_desk` — the named on-call operator who may issue T3+ consumer messages. Distinct from `utility_operator`. Both signatures (`pha_approver` + `utility_message_desk`) are required to attest to the identical `(event_id, payload_hash, version_id)` triple before the gateway accepts the `PublicNoticeIssued` command (AD-11). Either role alone cannot issue.

The three operator UIs are separate products with separate design, deployment, and update cadences — not one responsive app collapsing across breakpoints (spec C-2, AD-7). No shared component library above the data layer. Each surface reads from the chain projection and writes through the gateway; no surface mutates operational state directly.

**Visual identity is the same brand across all four surfaces.** Civic-steady palette and system sans carry Surakkha's public-trust signal on operator faces and consumer messages alike. See `{DESIGN.md#brand-and-style}`.

## Information Architecture

### Shared mental model: an incident

Every surface sees the same domain object differently. The shared abstraction is *an incident* — a content-addressed materialization of one or more correlated observations within a correlation window. (Architecture AD-2.)

- **Priya** sees an *incident* as a row on a ranked action list — sorted by fusion score, with source attribution and corroborated confidence. Each row opens into a detail pane that pulls the matching playbook recommendation from the active version-of-record.
- **Dr. Mensah (PHA)** sees an *incident* as an item in a cross-ward aggregate dashboard — confirmable through deviation history and audit-browser drilldown, but never owned as his day-job. He approves thresholds and amendments; he does not act on individual incidents.
- **Anjali** sees an *incident* as *a report she sent that mattered* — the seed observation. She must later see (FR-4.7) that her report reached Priya and (where applicable) triggered a real response.
- **Ramesh** sees an *incident* as *a one-off message in his WhatsApp or SMS thread* — only when there's something to do. No map, no dashboard, no app.

### Surface IA

#### Anjali-mobile IA

The mobile surface has one job: get Anjali to a submitted report in under 60 seconds on a low-end Android with intermittent connectivity (FR-4 success criterion). IA is therefore minimal:

- **One action card: Report.** Tapping opens a 3-modality input sheet (voice note, photo, free-text) with Bangla primary, English fallback.
- **One status feed: Your reports.** A read-only feed of her past reports' lifecycle — submitted, received by Priya, action taken (if any). No filters, no dashboards, no detail drilldown beyond "your report triggered action X — thank you" (FR-4.7).
- **One acknowledgement surface: Councillor citation.** Quarterly, by name, in her phone via the councillor channel (FR-4.7 surface split; see Key Flows §3).
- **No login.** No training app. No dashboard. (FR-4.5, UX-DR1)

#### Priya-desktop IA

The desktop surface has two jobs: resolve incidents fast (under 3 minutes per incident, FR-5 success criterion) and pass shift cleanly. IA is Y-shaped on first login:

- **Left pane: Handover brief.** Today's open threads — incidents still open, deviations still under review, threshold changes pending PHA approval, anomalies flagged by override-anomaly monitor. (FR-5.2 surface decision.)
- **Right pane: Ranked action list.** The hot path. Ranked by fusion score (FR-5.1). Each row carries source attribution (e.g., "Anjali X at school Y + sensor Z at pump station W") and corroborated confidence score.
- **Detail pane (overlay):** Matching playbook recommendation pulled from the active version-of-record (latest `PlaybookVersionPublished` event for the tenant, per AD-13). Read-only playbook view + per-step execute/deviate buttons.
- **Top chrome:** Chain freshness clock. Live status of gateway, sensor-silence monitor, override-anomaly monitor.
- **Footer:** "Auto-generated PHA monthly report" button (FR-5.6) — projection read, not a hand-assembly.

#### PHA-pane IA

The pane has one job: govern without altering the record (FR-6 success criterion). IA is read-mostly:

- **Top: Cross-ward aggregate tiles.** Deviations, time-to-T3 medians, threshold edit history, override-anomaly flags. Each tile is an aggregation, not raw data.
- **Middle: Playbook amendment queue.** Approvals with dual-signature at T3 boundary (FR-6.1). Single-signature on city-wide config changes (AD-15).
- **Bottom: Audit-chain browser (read-only).** Filter by time window, event_type, actor_role, geography. Every read is access-logged (NFR-S1.4).
- **Never a message-desk.** PHA does not see or trigger consumer-message issuance (FR-6.5). Mayor's office owns message tone; PHA owns the threshold where public notice fires.

#### Ramesh-channel IA

There is no IA for Ramesh — there is no UI surface. The "IA" is a *message string template* with strict structure:

```
{HEADER_LINE}
{BODY_LINES — ≤ 64 chars each}
{ACTION — one of: Safe now | Boil | Do not drink | Use bottled | Wait}
{ZONE_GEOFENCE — ward or area, not lat/long}
{VERIFICATION_HORIZON — when the next update or resolution is expected}
— {ISSUING_AUTHORITY}
```

Each token is filled from the chain, not composed freehand. The string is sent via WhatsApp AND SMS (FR-7.3). The two channels carry the same content; SMS carries more legal weight in target geographies. Councillor-routed messages carry the councillor's voice and endorsement (FR-7.5, UX-DR5) — the string template is the same; only the sender differs.

### Surface closure check

- Anjali's persona win condition (reports fast, reports matter) → Anjali-mobile surfaces deliver both.
- Priya's persona win condition (resolve incidents, pass shift cleanly) → Priya-desktop surfaces deliver both.
- Dr. Mensah's persona win condition (govern without altering) → PHA-pane surfaces deliver.
- Ramesh's persona win condition (clear answer without installing anything) → Ramesh-channel is invisible infrastructure.

Closure achieved. No missing piece.

## Voice and Tone

### Brand voice

**Steady, sourced, near-authority.** The voice is public-health-bulletin, not enterprise-app. Three properties:

- **Steady:** never panics, never apologizes without action, never raises the alarm on routine updates.
- **Sourced:** every claim names its source (PHA, Priya, Anjali X at school Y, sensor Z at pump station W). Sourcing is the trust bridge.
- **Near-authority:** the voice knows what to do. It does not equivocate on the action — "Boil" or "Do not drink" — even when the underlying evidence is correlated.

### Tonal range across surfaces

One voice, three registers. Same voice, tuned to persona:

- **Anjali-mobile register:** warm, direct, second-person. "Your report reached Priya. Thank you." Not "Submission accepted at 14:03."
- **Priya-desktop register:** plain, workmanlike, third-person. "Anjali X, school Y, 14:01. Sensor Z, pump station W, 14:02. Confidence: high." Not "Incident #4711 has been created."
- **PHA-pane register:** institutional, third-person, audit-precise. "Approval required: Playbook amendment v3.2 → v3.3, dual signature pending. C-13 split: pha_approver + vendor." Not "Hey, sign this."
- **Ramesh-channel register:** friendlier, more-direct, second-person, imperative for the action. "Do not drink the water in Ward 7. Boil for 3 minutes before use. Next update at 18:00. — Dhaka PHA."

The register shifts; the brand voice holds. A consumer who overhears an Anjali acknowledgement and a Ramesh notice reads them as one program.

#### Councillor channel hostile-fallback

The councillor-voice trust-bridge assumes a councillor who is willing and trusted in their ward. Reviewer-gate adversarial lens surfaced that this assumption is brittle — a single hostile councillor (politically opposed to the operator, personally compromised, or simply unreachable) can silently sink the trust-bridge for that ward's notice. Surfacing this gap is the design decision; resolving it is an epic-level operational requirement, not a workaround in the spine.

- **Per-councillor delivery metric:** the councillor channel is monitored continuously. If a councillor fails to relay a notice within 15 minutes of dispatch (the SLA band), or if relay quality degrades (audible mumbling, refusal-pattern matches from logged transcripts), the councillor is flagged on PHA-pane aggregate tiles.
- **PHA-direct citation channel:** when the councillor channel is degraded, PHA can fall back to a direct PHA-voice channel (text message from the Director's office, in the Director's name). This is a **last-resort** path that bypasses the councillor; it should not become the default.
- **Route-around for hostile councillors:** a ward where the councillor is hostile is not blocked from notification — the ward receives WhatsApp + SMS + the PHA-direct channel, with no councillor-voice at all. The citizen gets the notice without the trust-bridge penalty.
- **Why this is in the spine:** the spec assumes the councillor-routed channel is reliable. It is not. The spine must name the failure mode so the implementation honors it.

The councillor voice still wins when it works — the brand voice holds. When it doesn't, the citizen still gets the notice.

### Microcopy rules

- **No exclamation marks.** Operator surfaces never. Consumer messages only on resolution ("Safe now ✓").
- **No emoji on operator surfaces.** Consumer messages: one neutral glyph max (`✓` or `⚠`).
- **No "Sorry" or apology language without an immediate action.** Apology-then-action is fine; apology alone is not.
- **No passive voice on incident attribution.** "Anjali X reported at 14:01" — not "A report was received."
- **Numbers carry the trust-bridge.** Source attribution always names the time, the place, the sensor or operator. Unattributed claims do not appear in the voice.
- **Chain hash and `event_id` render in mono** — see `{DESIGN.md#typography}`.

### Message string structure (Ramesh-channel)

EXPERIENCE.md owns the string. DESIGN.md owns the typography. Split per memlog decision.

Six message shapes, one per action plus a retraction:

| Action | English header | Bangla header | Body (EN) | Body (BN) | Verification horizon |
|---|---|---|---|---|---|
| **Safe now** | "Water in {ZONE} is safe to drink. ✓" | "{ZONE}-এর পানি এখন বিশুদ্ধ। ✓" | "Resolves prior notice from {TIME}. Tested at {TIME}." | "{TIME} থেকে পূর্ববর্তী সতর্কতা প্রত্যাহার করা হলো। পরীক্ষিত: {TIME}।" | "Next routine update at {TIME}." / "পরবর্তী হালনাগাদ: {TIME}।" |
| **Boil** | "Boil water in {ZONE} before drinking." | "{ZONE}-এর পানি ফুটিয়ে খান।" | "Likely contamination: {CLASS}. Boil for 3 minutes, let cool, store covered." | "সম্ভাব্য দূষণ: {CLASS}। ৩ মিনিট ফুটিয়ে নিন, ঠাণ্ডা করে ঢেকে রাখুন।" | "Next update by {TIME}." / "পরবর্তী হালনাগাদ: {TIME}।" |
| **Do not drink** | "Do not drink water in {ZONE}." | "{ZONE}-এর পানি পান করবেন না।" | "Use bottled or tanker-supplied water. Boil does not remove this contaminant: {CLASS}." | "বোতলজাত বা ট্যাঙ্কারের পানি ব্যবহার করুন। ফুটালেও এই দূষক দূর হয় না: {CLASS}।" | "Next update by {TIME}." / "পরবর্তী হালনাগাদ: {TIME}।" |
| **Use bottled** | "Use bottled water in {ZONE}." | "{ZONE}-এ বোতলজাত পানি ব্যবহার করুন।" | "Tap water unsafe: {CLASS}. Bottled supply points: {LIST}." | "ট্যাপের পানি অনুপযুক্ত: {CLASS}। বোতলজাত পানির পয়েন্ট: {LIST}।" | "Next update by {TIME}." / "পরবর্তী হালনাগাদ: {TIME}।" |
| **Wait** | "Wait before using water in {ZONE}." | "{ZONE}-এর পানি এখন ব্যবহার করবেন না — পরীক্ষাধীন।" | "Testing in progress. Decision expected by {TIME}." | "পরীক্ষা চলছে। সিদ্ধান্ত আশা করা হচ্ছে: {TIME}।" | "Next update by {TIME}." / "পরবর্তী হালনাগাদ: {TIME}।" |
| **Retraction / false alarm** | "Rescinded: prior notice on {ZONE}." | "প্রত্যাহার: {ZONE}-এর পূর্ববর্তী সতর্কতা বাতিল।" | "An earlier notice on {ZONE} was issued in error at {TIME}. Cause: {REASON_LANG_FIELD}. No action required." | "{TIME}-এ {ZONE} সম্পর্কিত পূর্ববর্তী সতর্কতা ভুলবশত দেওয়া হয়েছিল। কারণ: {REASON_LANG_FIELD}। কোনো ব্যবস্থা নেওয়ার দরকার নেই।" | "Updated at {TIME}." / "হালনাগাদ: {TIME}।" |

Footer line is uniform: `— {ISSUING_AUTHORITY} ({VERIFICATION_HORIZON})`.

The six shapes do not vary outside the table. No free composition — the chain fills the slots; humans do not write the message.

**Why six shapes, not five:** adversarial review surfaced that "Do not drink" carries a single-character deletion risk — losing the negation word ("drink" alone) reverses the life-safety instruction. The Retraction shape exists explicitly for false-alarm recovery: if a "Do not drink" notice was issued in error, the chain-anchored retraction travels the same channels (WhatsApp + SMS + councillor voice) and is the only path by which a T3+ notice is undone. Issuing a Retraction requires a new dual-signature `PublicNoticeRetracted` chain event referencing the prior `PublicNoticeIssued` `event_id`; the gateway will not accept a Retraction without the prior event on the same projection. Retraction is its own event type, not a parameter on `PublicNoticeIssued`.

## Component Patterns

Behavioral rules for the components named in DESIGN.md.

### Button: primary

- Tap target ≥ 48×48 px on Anjali-mobile (per `{EXPERIENCE.md#accessibility-floor}`).
- Pressed state: deep-teal-tint for 120ms then back to primary. No animation flourishes.
- Disabled state: `divider` background, `ink` at 50% opacity. Reason shown as a tooltip on long-press (mobile) or hover (desktop).

### Button: secondary

- Same tap-target rule.
- Disabled state: invisible (not shown), not greyed.

### Button: danger

- Confined to T3+ consumer-message issuance confirmation flow.
- Two-tap confirmation: first tap previews the message string; second tap confirms issuance. Both taps log to the chain (chain-integrity).
- Never appears on operator surfaces in normal operation.

### Card

- Pressable cards (Priya incident rows, PHA aggregate tiles): subtle 1px ink-tint border on hover/focus, never elevation change. Elevation stays flat for "list-of-things" surfaces.
- Non-pressable cards (status indicators): flat, no hover state.

### Input field

- Reasoning field (Priya deviation capture): friction-not-block. Field is required; submitting empty is allowed but logs a `DeviationCaptured{reasoning: empty}` event so the empty case is visible to the audit chain.
- Threshold-edit field (PHA pane): inline validation; out-of-band values are rejected with a small inline message. No modal.

### Badge: status

- Tier badges follow `{DESIGN.md#components}` color rules: T0/T1 → `divider`, T2 → `amber`, T3 → `alert-red`, resolved → `safe-green`.
- Tier badge is always visible on Priya incident rows; visible on Anjali acknowledgement surfaces only when her report triggered a T3 response.
- Tier badge is never used on Ramesh-channel; the action word is the signal.

### Message template

See `{EXPERIENCE.md#voice-and-tone#message-string-structure-ramesh-channel}`. Typography in `{DESIGN.md#components#message-template}`.

#### SMS length budget

Each filled message template must satisfy a hard character budget — the gateway enforces a per-template byte count before acceptance. This is a build-time invariant, not a runtime linter; exceeding the budget causes the issuance affordance to be disabled with reason "Template exceeds SMS character budget."

- **English GSM-7 alphabet:** ≤ 160 characters total per message. The body, the footer signature, and one line of leading whitespace are all counted. A multi-segment message (153 chars × N) is rejected; one SMS is the hard cap.
- **Bangla UCS-2 alphabet:** ≤ 70 characters total per message. Bangla glyphs are two-byte UTF-16 code units; the budget is roughly halved versus GSM-7.
- **Verification step:** before a template reaches production, a build-time test fills each template slot with the worst-case strings (long zone names, long Bangla transliteration, full 6-word contaminant class) and asserts the filled string is within budget. Failing templates block the playbook amendment that introduced them.
- **WhatsApp side:** no 1600-character cap hit in practice with the current template; the budget is SMS-driven, but WhatsApp renders the same body.

#### VS15 text-style glyph on consumer emoji

`✓` (U+2713) and `⚠` (U+26A0) are followed by U+FE0E (text-style variation selector) on consumer messages, rendering them as monochrome text glyphs on Android feature-phones that would otherwise substitute colorful emoji. The substitution must be deterministic — a colorful emoji rendering of ⚠ on a T3 message is a brand-voice failure (consumer reads "warning" as "informational"). Operators never see these glyphs on Priya-desktop or PHA-pane.

#### Bangla punctuation and numeral formatting

- **Punctuation:** Bangla full-stop `।` (U+0964) inside Bangla sentences. Latin `,` for in-numeric thousands separators on operator surfaces; Bengali `,` on consumer messages when followed by a Bangla word. The pairing is consistent within a message.
- **Numerals:** Bengali digits `০`–`৯` (U+09E6–U+09EF) inside Bangla body text. Latin digits on operator surfaces and in any mono-rendered field (chain hash, `event_id`, ISO timestamps).
- **Time format:** Bangla consumer messages use 12-hour with `বিকাল` (afternoon, 12:00–17:59) and `রাত` (night, 18:00–23:59) suffixes per `{EXPERIENCE.md#accessibility-floor#internationalization}`. Operator surfaces always use ISO 8601 + 24-hour.
- **Feature-phone fallback:** when `family-bangla` cannot be rendered on the recipient device, the gateway sends the English-locale body with a Bangla transliteration note appended in parentheses. This is a graceful-degradation path, not a default.

## State Patterns

Surakkha is event-sourced. Every operator surface is a projection of the chain. State patterns reflect this — there is no "loading" in the REST sense; there is *projection lag* and *projection freshness*.

### Empty state

- **Anjali-mobile status feed:** "No reports yet. Your first report lands here." No CTA to "create a report" — that is the report affordance, not in the feed.
- **Priya-desktop action list:** "No open incidents. Last incident resolved {RELATIVE_TIME}." Sub-line: chain-freshness clock.
- **PHA-pane aggregate tiles:** zero state shows `0` with a sub-line `last X days`. Never blank.
- **Ramesh-channel:** never empty in the sense of "no message to send" — silence is the state. No "we'll be in touch" message.

### Loading state

- **Operator surfaces:** sub-second projection lag. Show a small clock indicator (chain freshness) in the top chrome. "Last update 0.3s ago." Never a spinner for sub-second loading.
- **Loading > 2 seconds:** small inline indicator on the affected panel only — never a full-screen spinner. Show the most-recent committed state with a "stale as of {TIME}" badge.
- **Loading > 30 seconds:** chain-verification monitor surfaces in the chrome. The projection is stuck; the chain is the truth.

### Error state

- **Chain-write rejected (gateway):** typed rejection reason surfaced to the operator. Common typed rejections:
  - `CommandRejected{reason: "missing tenant_id"}`
  - `CommandRejected{reason: "actor_ref not session-bound"}`
  - `DuplicateEventRejected`
  - `CrossTenantAccessAttempted`
- **Operator surfaces show the typed reason in plain English with a chain-reference ID** — never raw JSON. "Your report could not be submitted because the connection dropped. Reference: evt_01HXYZ… — please try again." (Anjali-mobile copy; Priya-desktop is more terse.)
- **Ramesh-channel never errors to the consumer.** A failed delivery retries and escalates to the alternative channel (NFR-R1.3). The consumer only sees the message or nothing.

### Offline state (mobile)

- **Anjali-mobile:** queue persists across app restarts and connectivity changes. Show "queued — will send when online" as a small badge on the report. Sub-status: "X queued, Y sent."
- **Priya-desktop, PHA-pane:** desktop surfaces assume connectivity. Loss of connectivity falls back to the chain-integrity monitor's last-known-good timestamp with a visible "chain fresh as of {TIME}" indicator. Operator knows the projection is stale.

### Deviation capture state (Priya)

- **Pre-submit:** friction. Reasoning field is required; submitting empty is allowed but logs an empty-reasoning event. No block.
- **Post-submit:** the chain shows the `DeviationCaptured` event; the incident row updates with a "deviation captured" badge. No "thank you" modal — the badge is the thank-you.

### Dangling-preview state (T3 issuance + shift change)

A two-tap confirmation can be interrupted by shift handover: operator opens the preview, then walks off shift without confirming or cancelling (ADV-FIX; rare but documented in operations drills). The chain has the `MessagePreviewRendered` event; the issuance did not fire.

- **Visible state:** the incident row carries a "preview pending — open" badge until the preview is resolved either way.
- **Operator action:** the next-shift operator sees the dangling preview in the handover brief ("incident X has an open preview from operator Y at 14:08 — confirm or cancel to clear").
- **Auto-cancel:** if no operator touches the preview for 30 minutes, the system auto-cancels (logs `MessageIssuanceCancelled{reason: "dangling_preview_timeout"}`); the issuance affordance clears and must be re-opened from scratch. This bounds the dangling state to a shift-bound; it never persists past the handover window.
- **Audit rationale:** the preview itself is on the chain (it logged when the operator first tapped). What the chain cannot show is *intent*, which is why the operator's action is required to close the dangling state cleanly.

## Interaction Primitives

### Voice input (Anjali)

- Voice is first-class. Tap-and-hold to record; release to attach. Recording duration visible (mm:ss).
- Transcription is OPTIONAL. The voice note is the source of truth; Bangla transcription is offered but not required. If transcription fails, the voice note still submits.
- Voice note attaches as a payload field on the `AnjaliReportSubmitted` event with provenance linking to the user's auth-session reference (AD-12).

### Photo input (Anjali sentinel-strip)

- Photo is a sentinel-strip CV read on the device. The phone does the reading; the platform stores the result + the original photo. CV failure falls back to "manual color match" mode (Anjali picks the closest of 5 swatches).
- Photo attaches as `AnjaliSentinelReadingSubmitted` with the CV result + confidence + photo blob reference.

### Two-tap confirmation (T3+ consumer-message issuance)

**Owner surface: Priya-desktop.** The on-call operator with `utility_message_desk` role (or a `utility_operator` actor sitting in for the named `utility_message_desk` on shift) executes the two-tap from the Priya-desktop ranked action list — specifically, from a T3-confirmed incident row whose chain state has crossed the dual-signature threshold. The two-tap affordance does not appear on PHA-pane; PHA has already approved. It does not appear on Anjali-mobile; Anjali never issues.

Both signatures (`pha_approver` + `utility_message_desk`, per `{EXPERIENCE.md#foundation}`) must already be on the chain as `SignatureAttestation` events referencing the identical `(event_id, payload_hash, version_id)` triple before the two-tap UI is even reachable. The first tap validates that both signatures are present on the chain projection; if either is missing, the issuance affordance is disabled with a visible reason ("PHA approval pending — {actor} attested at {TIME}, vendor attestation missing"). This guards the AD-11 invariant at the affordance boundary, not only at the gateway.

- **First tap — preview:** opens a modal showing the message string exactly as it will be sent (template filled with chain values, including the Bangla or English locale per recipient list config), the recipient-zone geofence, and the verification horizon. The preview is read-only text in mono where chain references appear, in Bangla/English body, and in `{DESIGN.md#components#message-template}` typography. The primary action on the modal is "Issue"; the secondary action is "Cancel." Both are reachable by keyboard.
- **Second tap — confirm:** available for 5 seconds after the first tap, with a visible countdown ring on the "Issue" button. The countdown is itself the kinetic signal of "this is the last chance." Confirmation logs `MessageIssuanceConfirmed` to the chain (alongside the first `MessagePreviewRendered` event); the gateway then writes `PublicNoticeIssued`. Both events carry the same `payload_hash`.
- **After confirmation:** the modal collapses, the incident row flips to a "message issued" state with a small `PublicNoticeIssued` chain-link chip, and the operator returns to the ranked action list. No "thank you" modal — the chain link is the thank-you.
- **Race-defense (ADV-FIX):** rate-limited to a maximum of 5 `PublicNoticeIssued` confirmations per `utility_message_desk` actor per rolling hour. Beyond the limit, the "Issue" button is disabled with the reason "Rate limit reached (5/hour) — escalation requires City Incident Commander sign-off." This defeats scripted automation without slowing the human-issued acute response.

#### Modal focus management (T3 two-tap)

Focus on the modal must be deterministic and reproducible — operator lives in this loop under acute SLA.

- **Open:** focus moves to the primary action button ("Issue"). If keyboard-only, focus is announced via `aria-live="assertive"` with the message title.
- **Escape:** releases the modal; returns focus to the originating incident row's "Issue public notice" button; no state change.
- **Tab order inside modal:** primary action → secondary action ("Cancel") → recipient-zone geofence link (read-only) → verification-horizon link (read-only) → "Show Bangla/English toggle." Skip the message body (read-only).
- **Return focus:** on close (any path), focus returns to the originating button on the incident row. This is auditable and surprise-free.
- **Screen reader announcement on open:** message title in Bangla or English per current input locale, plus "Press Enter to confirm issuance, or Escape to cancel."
- **Countdown legibility:** the 5-second countdown ring has an accompanying `aria-live="polite"` text ("4 seconds remaining to confirm, 3 seconds remaining…"). The text is the redundant signal — the ring is decoration under `prefers-reduced-motion`.

### Inline validation (PHA threshold tuning)

- Threshold edits validate inline against the city's WHO-grounded defaults and against the live `EscalationPolicyUpdated` event history. Out-of-range values surface inline with a "suggested range: {LOWER}–{UPPER}" line.
- No modal; no save-cancel dance. Every keystroke is a soft-validation; submit is the hard-validation.

### Override-with-reasoning capture (Priya)

- Every deviation captures: actor (auto-filled), attempted action, actual action, reasoning (required). Reasoning field is a single text input, no rich-text editor.
- The chain shows the override as the audit trail; the state change is its consequence. No "are you sure" — the chain is the truth.

### Per-incident audit timeline (Priya-desktop)

Every incident row in the ranked action list carries an expandable audit timeline (ADV-FIX: operator self-defense — Priya must be able to defend her own decisions under PHA review or WB evidence export). Expansion is keyboard-disclosable; the timeline is read-only.

- **Events shown:** all chain events that referenced this incident's `event_id` cluster — `IncidentOpened`, `IncidentEscalated`, `PlaybookStepExecuted`, `DeviationCaptured`, `SignatureAttestation`, `PublicNoticeIssued`, `PublicNoticeRetracted`, `MessageIssuanceConfirmed`, `MessagePreviewRendered`. Each event shows actor, time, and a one-line plain-English description.
- **Chain hash anchor:** the timeline exposes the chain hash of the most-recent event in `family-mono`. Operators can quote this on a phone call to PHA and the words are verifiable. This is operator self-defense — Priya can answer "what was the state of incident X at 14:08" with a chain reference, not a recollection.
- **Acceptance:** Priya can drill from any incident row to "every action anyone took on this row, with what proof" in ≤ 3 clicks.
- **Why this lives in Interaction Primitives:** it is not a state — it is an always-available disclosure.

### Shoulder-surfing redaction (T3 preview)

The T3+ two-tap modal previews the message *before* it broadcasts to the public. A bystander (coworker, journalist, family member visiting the operator at the wrong moment) reading the operator's screen sees the message that is about to send. PHA's institutional position requires that this preview not be a leak vector (ADV-FIX).

- **Redacted preview by default:** the preview modal shows the message body with sensitive tokens (`{REASON_LANG_FIELD}` substitutes for "false alarm cause", `{ZONE}` is visible but `{RECIPIENT_LIST}` is collapsed to a count). A "Reveal full" button, paired with a 750 ms hold (long-press on touch, click-and-hold on desktop), exposes the full message.
- **Redaction does not apply to the issuer's confirmation:** once the second tap fires and the message broadcasts, the operator sees the full message in the chain-event detail, since the chain itself is auditable.
- **Why this matters:** Bangladeshi operators sit in shared open-plan offices. The preview is the highest-leak moment of the operator's day; the chain itself is the trusted record.

## Accessibility Floor

Behavioral floor. Visual contrast targets live in `{DESIGN.md#colors}`.

### Tap targets

- ≥ 48×48 px on every operator surface.
- ≥ 44×44 px on Anjali-mobile (Bangla glyphs need the headroom).

### Keyboard navigation

- All operator surfaces fully keyboard-navigable. Tab order matches visual order. Focus ring `2px solid primary-tint`.
- Modal traps focus; ESC releases. The audit-browser modal in PHA-pane does NOT trap focus — operators drill in and out frequently.

### Screen reader

- All interactive elements have `aria-label`s in both English and Bangla. Toggle button on each operator surface.
- Anjali-mobile: voice-first. The voice input affordance has the highest screen-reader priority on the Anjali-mobile first pane.
- Chain hashes and `event_id` values are exposed as text with the chain-reference role.

### Color independence

- Tier badges are not conveyed by color alone. Each tier badge carries a text label (T0/T1/T2/T3/resolved) and a leading glyph (`○`/`◔`/`◑`/`●`/`✓`).
- Alert red on operator surfaces is NEVER the sole signal for a state. Every alert-red surface also has a text label or icon.

### Contrast

- Body text: `surakkha-ink` on `surakkha-warm-off-white` = 16.9:1 (WCAG AAA).
- Primary buttons: `surface` on `primary` = 8.2:1 (AAA).
- Secondary buttons: `ink` on `surface` = 16.9:1 (AAA).
- Status badges: T2 `ink` on `amber` = 4.7:1 (AA); resolved `ink` on `safe-green` = 5.1:1 (AA); T3 `surface` on `alert-red` = 8.0:1 (AAA); T0/T1 `ink` on `divider` = 13.3:1 (AAA). All clear WCAG 2.1 AA at 14 px text.

### Motion

- No motion on operator surfaces for routine updates. Motion is reserved for: (1) Anjali acknowledgement ("report received" pulse, 200ms ease-out, one-shot), (2) chain-verification failure (full-screen banner with shake, 300ms one-shot). No animation flourishes elsewhere.
- `prefers-reduced-motion` respected globally: motion replaced with non-motion cues (color shift, text label).

### Internationalization

- Bangla primary on Anjali-mobile. English primary on Priya-desktop and PHA-pane with Bangla toggle.
- Ramesh-channel locale-driven per recipient.
- Number formatting: locale-driven (Bangla locale shows Bengali digits where culturally appropriate, but event_id and chain hash always render in Latin digits + `family-mono`).
- Date/time: locale-driven (Bangla locale: Bengali calendar + 12-hour with বিকাল/রাত suffixes where appropriate; English locale: ISO 8601 + 24-hour).

### Cognitive accessibility floor

Beyond visual and motor: Surakkha surfaces must serve operators and citizens under acute stress (incident in flight) and operators under chronic load (12-hour shift, 200 incidents/day). WCAG cognitive accessibility guidelines give the floor.

- **Reading level:** operator-UI microcopy at grade 8 or below (English). Bangla microcopy at the equivalent of class 5 or below. Measured by Flesch–Kincaid for English; by a native-speaker review pass for Bangla.
- **Plain-language review:** all PHA-pane copy reviewed by a non-specialist (someone outside the water-safety domain) before final. Confusing idioms and acronym-nesting ("PHA-cleared SLA-bound amendment") are flagged and rewritten.
- **Sentence length limits:** operator prose max 22 words per sentence. Consumer message prose max 18 words per Bangla clause. PHA summary text can run longer where precision demands it.
- **Dual-channel confirmation for life-safety actions:** every T3+ issuance is dispatched on both WhatsApp AND SMS (signed gateway) so that even if the recipient's primary channel is unreachable, the second channel carries the notice. This is the consumer-side equivalent of "two-person rule" for message delivery.
- **Memory load:** state patterns minimize the operator's need to hold information across screens. The ranked action list is the single thing a Priya operator must hold in mind; handover briefs and audits are projections, not separate mental models.
- **Time pressure cue:** acute-SLA timers are visible on incident rows but never animate (per Motion floor). The kinetic signal of urgency is the SLA ring, not a flashing badge.

### Per-surface line-height rules

DESIGN.md supplies the per-family line-height tokens. EXPERIENCE.md specifies which token applies where.

- **`line-height: tight` (1.2)**: card titles, section headers, page titles, display — applies identically across all surfaces.
- **`line-height: body` (1.5)**: Latin/English body text on Priya-desktop and PHA-pane. Default for English prose.
- **`line-height: body-bangla` (1.6)**: all Bangla body text on Anjali-mobile, on Bangla-toggle surfaces of Priya-desktop and PHA-pane, and on Bangla consumer messages. The 1.6 ratio gives Bangla glyphs room above their inherent ascenders, which sit higher than Latin.
- **`line-height: heading-bangla` (1.3)**: Bangla headings on Anjali-mobile and on Bangla-toggle operator surfaces.
- **`line-height: loose` (1.7)**: PHA-pane aggregate tile text where the operator reads many tiles in a row and where density is the wrong optimization.

A Bangla sentence rendered at `line-height: body` (1.5) is a brand-voice failure — the glyphs crowd their ascenders and the trust-bridge cue weakens.

## Key Flows

Three named-protagonist flows, tied to the success signal. Each flow names a real session, ends at a chain event, and lands in a chain-anchored state.

### Flow 1 — Anjali-flagged acute event handled cleanly

**Protagonist:** Anjali (school principal, Ward 7).

**Session:** Tuesday 14:01. Anjali smells chlorine at the school tap, stronger than the routine dose. Children are about to drink.

**Steps:**

1. **Anjali-mobile first pane.** One action card: Report. (FR-4.5.)
2. **Tap Report → input sheet.** Voice + photo + free-text. She taps voice, holds 8 seconds, says "Ward 7, school tap, chlorine smell, kids about to drink." Releases. (FR-4.1, FR-4.2, UX-DR6.)
3. **Submits.** Local adapter mints `event_id` at user-acknowledged submission time. (AD-14.)
4. **Quiet "report received" pulse.** 200ms ease-out, one-shot. No fanfare. (Microcopy stance.)
5. **Queue persists.** She closes the app. Phone-as-network forwards the report when connectivity returns. (FR-4.4, NFR-N1.2.)
6. **Priya sees the report.** Within 5 minutes (online) — lands in the ranked action list as a new row, ranked by fusion score. Source attribution: "Anjali [name], Ward 7 school, 14:01."
7. **Priya picks the row.** Reads source attribution + corroborated confidence. Opens detail pane.
8. **Priya reads matching playbook.** Bacterial-contamination acute playbook from version-of-record. Three steps: confirm with sensor reading, escalate to T2 if corroborated, escalate to T3 if PHA approves.
9. **Priya executes Step 1: confirm with sensor reading.** Sensor at pump station W confirms high chlorine at 14:08. Playbook advances.
10. **Priya executes Step 2: escalate to T2.** Crossed the corroboration threshold. `IncidentEscalated` event with `from_tier: T1, to_tier: T2` writes to the chain.
11. **Priya hands off to PHA for T3 approval.** PHA-pane surfaces the escalation queue. Acute SLA: 5 minutes (FR-6.2). Dual-signature attestation lands within 4 minutes (per AD-11, identical-payload-triple rule).
12. **T3 confirmed.** `IncidentEscalated{to_tier: T3}` event. Two-person attestation on the chain.
13. **Consumer-message issuance.** The on-call operator with the `utility_message_desk` role issues the public notice from the Priya-desktop ranked action list, using the T3 two-tap confirmation (per `{EXPERIENCE.md#interaction-primitives#two-tap-confirmation-t3-consumer-message-issuance}`). PHA has already attested via the dual-signature step (12); that `SignatureAttestation` is the precondition that surfaces the issuance affordance. WhatsApp + SMS broadcast (FR-7.3).
14. **Ramesh receives:** "Boil water in Ward 7. Likely contamination: chlorine residual. Boil for 3 minutes. Next update by 18:00. — Dhaka PHA."
15. **Anjali receives acknowledgement:** "Your report on Tuesday 14:01 at Ward 7 triggered action X. Thank you." (FR-4.7, surface split.)
16. **Resolution:** sensor normalizes by 17:30. Safe-now notice issued.
17. **Anjali receives resolution acknowledgement:** "Your report contributed to the safe-now notice for Ward 7. Thank you." (FR-4.7.)
18. **Deviation cluster review (monthly):** Priya's deviation captures from this event surface in the cluster. PHA reviews and either closes the cluster or drafts a playbook amendment that codifies the new pattern.

**Climax beat:** Anjali's "your report mattered" message. The whole flow's purpose is to deliver her status recognition (Anjali's persona win condition, defined in `{../../../specs/spec-surakkha-v1/personas.md}` as "see that my report mattered"). Chain holds the evidence; her phone holds the message.

### Flow 2 — PHA-approved chronic-class escalation with full audit

**Protagonist:** Dr. Mensah (PHA Director, city-level).

**Session:** Thursday 09:30. Dr. Mensah opens PHA-pane to review a chronic-class escalation that has been building for 8 days. Lead-leach signal accumulating in Ward 3 — conductivity drift, citizen complaint cluster, two Anjali reports. Not acute, not T3-eligible, but the chronic threshold has crossed.

**Steps:**

1. **PHA-pane first pane.** Cross-ward aggregate tiles: Ward 3 lead-leach indicator is amber (chronic threshold crossed). Time-to-T3 median for the week is 4 days (within chronic SLA).
2. **Dr. Mensah drills into the aggregate.** Sees the observation trail: 2 Anjali reports (Ward 3 schools A and B), 1 complaint cluster (12 citizen reports in 5 days), 0 lab results yet, conductivity drift at pump station W.
3. **He opens the playbook amendment queue.** A senior operator has drafted v3.3 of the chronic-lead playbook, citing the deviation cluster from September.
4. **He reviews the diff.** v3.2 → v3.3 changes: lower the action threshold from "amber for 7 days" to "amber for 5 days"; add a step "request lab confirmation at 3-day mark."
5. **He signs.** First signature. `SignatureAttestation{event_id, payload_hash, version_id: v3.3}` lands. (AD-11.)
6. **Vendor counter-signature.** Vendor actor lands the second signature with identical triple. (C-13 split; AD-12.)
7. **`PlaybookVersionPublished` event** with content-addressed `version_id = sha256(canonical(serialized_playbook_definition))`. (AD-13.)
8. **Active version-of-record advances.** Priya-desktop's playbook view updates from v3.2 to v3.3 within 5 seconds (projection lag).
9. **Priya picks up the chronic incident** with the new playbook. Executes the new "request lab confirmation at 3-day mark" step.
10. **Lab result returns 4 days later.** Lead levels confirmed. Chronic-class action fires (community notice via councillor-routed voice, NOT a T3+ public broadcast).
11. **Dr. Mensah reviews deviation dashboard.** Priya's deviation captures from this flow show good judgment (executing the new step at 3 days). Override-anomaly monitor shows no peer-baseline deviation.
12. **Monthly report.** Auto-generated PHA monthly report (FR-5.6) shows this flow: incidents handled, deviation clusters, time-to-action medians, false-positive rate, Anjali weekly-discipline aggregate. WB-aligned evidence export (FR-6.6) rolls up from this projection.

**Climax beat:** Dr. Mensah's "the playbook evolved from the field" surface. The system showed him that his amendment was informed by Priya's deviation captures, which were informed by Anjali's reports. Brand-unity: one program.

### Flow 3 — Consumer message issuance + acknowledgement loop closed

**Protagonist:** Ramesh (citizen, Ward 7). Indirect: Anjali (school principal, Ward 7), Priya (central operator), Dr. Mensah (PHA Director), Ward 7 councillor.

**Session:** Tuesday 14:13 — Wednesday 09:00. Ramesh has been using the city tap water for cooking and drinking for years. He receives his first Surakkha public notice.

**Steps:**

1. **14:13 — WhatsApp arrives.** "Boil water in Ward 7. Likely contamination: chlorine residual. Boil for 3 minutes, let cool, store covered. Next update by 18:00. — Dhaka PHA." (FR-7.4, message template.)
2. **14:14 — SMS arrives** (signed gateway, FR-7.3). Same content. Ramesh's phone shows two notifications from two numbers — same issuer, same content. He reads both; they agree.
3. **14:15 — Ramesh tells his neighbor.** "Did you see the notice?" Trust-bridge through conversation, not through product.
4. **14:30 — Ward 7 councillor calls.** Voice-message in Bangla: "Brothers and sisters, the city water department and the PHA have asked us to boil water today. Please follow this until evening. — Councillor [name]." (FR-7.5, UX-DR5.) Trust-bridge through councillor's voice.
5. **17:30 — Ramesh receives safe-now notice.** "Water in Ward 7 is safe to drink. Resolves prior notice from Tuesday 14:13. Next routine update at {TIME}. — Dhaka PHA ✓" (resolution message template.)
6. **17:31 — Anjali receives acknowledgement.** (FR-4.7.) WhatsApp: "Your report on Tuesday 14:01 at Ward 7 contributed to the safe-now notice. Thank you." Anjali sees the message; she feels seen.
7. **17:45 — Anjali receives quarterly councillor citation.** (FR-4.7 surface split.) Councillor's monthly school-visit mentions her by name as a contributor. Status recognition.
8. **Wednesday 09:00 — Ramesh resumes routine.** No app to check. No dashboard to clear. The system is invisible infrastructure.

**Climax beat:** Ramesh's "I didn't have to do anything" experience. He received clear answers; he trusted them; the answer resolved; the system never asked anything of him except to follow the action when there was one. Brand promise: invisible infrastructure that earns trust by getting out of the way.

## Cross-references

- Brand colors, typography, spacing, components, message-template typography → `{DESIGN.md}`
- Audit-chain invariants, RBAC, two-person rule → `{../../../specs/spec-surakkha-v1/architecture-invariants.md}`
- Persona detail (Anjali / Priya / Dr. Mensah / Ramesh / Attacker) → `{../../../specs/spec-surakkha-v1/personas.md}`
- Escalation tier rules, acute vs chronic SLA → `{../../../specs/spec-surakkha-v1/escalation-policy.md}`
- Playbook lifecycle, deviation-to-amendment, liability split → `{../../../specs/spec-surakkha-v1/playbook-lifecycle.md}`
- Epic breakdown (epic-level acceptance criteria) → `{../../../planning-artifacts/epics-backend.md}`
