# Citizen Status Timeline — Spec

> Phase 4 — UX Design
> Page: `web/src/pages/CitizenStatusTimeline.tsx`
> Source: Scenario 03 (Anjali the Anchor) Screen 3; Use Case C of Scenario 06 (audit chain timeline — public-mode projection)
> Produced by Saga/Freya — 2026-09-11

---

## 1. Meta

| Field | Value |
|---|---|
| **File path** | `web/src/pages/CitizenStatusTimeline.tsx` (NEW) |
| **Source scenario** | [03-anjali-the-anchor-citizen-arc.md](../../C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md) — Screen 3 (in-progress beat) |
| **Related** | [06-audit-chain-timeline-cross-cutting.md](../../C-UX-Scenarios/06-audit-chain-timeline-cross-cutting.md) — Use Case C (Anjali's public view is a render of the chain) |
| **Status** | **NEW** (no existing implementation) |
| **Priority tier** | **1** (load-bearing — Goal 3 middle beat) |
| **Actors** | Anjali (citizen — primary); Karim/Adi/Operator names appear as actor chips in the timeline rows |
| **Locked decisions** | Scenario 03 #4 (timeline is curated citizen-relevant subset of chain events); Scenario 06 #1 (two render modes — public mode is motion-only, no JSON/hashes/payload); Scenario 06 #6 (Anjali sees only her own segments) |

**Locked-decisions callout from scenario:**
- The timeline is a projection of the audit chain, not a separate state. **Chain is the source of truth** (foundation §11.1).
- Public mode hides payloads, hashes, JSON. Anjali sees motion-only events.
- 5-min dual-channel ack is on Screen 2 (SubmitForm); this surface handles beats 2 (in-progress) and the holding pattern for beat 3 (closure).

---

## 2. Purpose

This page answers the question every Anjali has after submitting: **"Did anyone come?"** It surfaces the in-progress signals for her report — the verified moment, the dispatch, the field crew's arrival, the fix, and the eventual closure ask. The page is **informational, not a workflow**: she reads the motion and goes back to her day. The only decision it surfaces is the closure tap when one is due. The page is the structural answer to Goal 3.2 (in-progress signal at every state transition) and the load-bearing surface that keeps her from quietly withdrawing the next time the water looks wrong.

---

## 3. User journeys

### Journey A — Anjali checks her in-flight report

She opens the web portal, sees the timeline, sees **"Verified — assigned to field crew 12 min ago"**. She feels heard. She closes her phone.

**Entry:** LoginPage → MyReports → tap row → CitizenStatusTimeline
**Timeline state:** 3 events (Report received → Being verified → Field worker dispatched)
**ActionCall state:** "We'll update this page when there's news."
**Outcome:** She has evidence the city acted; she does not need to check again for hours.

### Journey B — Anjali checks after a day

She taps the row. Sees the timeline with a new **"Field worker arrived"** event. Sees the relative time — "4 hr ago". Notes the field crew's first name.

**Entry:** Same as Journey A; the row's status pill has changed
**Timeline state:** 4–5 events depending on Karim's progress
**ActionCall state:** "We'll update this page when there's news."
**Outcome:** She confirms the work is happening; she doesn't need to refresh — the row will update next time she opens the page.

### Journey C — Anjali checks after the closure tap

She taps the row. Sees the final timeline with the **closure event** and the ack status visible: ✅ received / pending / silent path.

**Entry:** She either tapped ✅ on the closure page, or the 30-day window expired
**Timeline state:** 6+ events plus the appropriate closure event
**ActionCall state:** Depends on path — "Thanks for confirming. All set." (✅) OR silent-closure reopen UI
**Outcome:** The loop ends; her history is preserved.

### Journey D — Anjali's report is resolved but she hasn't acked

She sees the held-open state with calm messaging. The ActionCall surfaces the **closure tap** (✅ Confirm resolved / ❌ Reopen) plus a one-line "Reopen if something's wrong" affordance.

**Entry:** Same as Journey A but the timeline ends with `IncidentResolvedByAdmin` and no ack
**Timeline state:** 6 events
**ActionCall state:** Closure tap UI from Scenario 03 Screen 4
**Outcome:** She can confirm or reopen in one tap; the system doesn't pressure her with countdown timers on this surface (the SMS carries the schedule).

---

## 4. Layout

Uses the **single-pane citizen layout from §3.3 of the foundation**.

```
+------------------------------------------+
| App header (logo, language, logout)      |
+------------------------------------------+
|                                          |
|  <StatusTimeline /> (motion over data)   |
|                                          |
|  <ActionCall /> (the one thing to do)    |
|                                          |
|                                          |
+------------------------------------------+
```

Padding: `px-6 py-8` mobile, `px-12 py-12` desktop. Single-column until 768px, then card-stack layout. Generous whitespace is intentional — citizen surfaces are not dense.

---

## 5. StatusTimeline component spec

### Data source

Read-only projection of chain events for the citizen's own incidents. Filtered to the `CitizenVisibleEventType` subset — the curated list of motion-bearing chain events Anjali is permitted to see. Reads from the same `read_chain_segment` gateway function that emits `ChainRead{actor, surface: status_timeline, mode: public}` (per Scenario 06 locked decision #5).

### Visual

Vertical timeline. Each row is a `Card` from `web/src/components/ui/`. Each row shows:

- **Bullet** — small circle on the left connector (icon per event type from foundation §4.2)
- **Connector** — vertical line between rows
- **Content** — title (the plain-language event description) + one-line detail + relative timestamp

Events render **newest at the top** ("what's happened lately" frame, per Scenario 03). Each event enters with a 200ms ease-out fade-up on mount (foundation §8.1).

### Event types rendered (citizen-readable)

| Chain event | Citizen-visible text | Icon | Detail line |
|---|---|---|---|
| `IncidentCreated` | Report received | `FilePlus` | (none — she's the actor) |
| `TrustBandAssigned` | Verified [as anchor / verified / hotline] | `Tag` | Band label localized (per foundation §1.1 — plain language, never "T1/T2/T3") |
| `AssignedToTechnician` | Assigned to field crew | `UserPlus` | "[First name only]" — Karim |
| `TechnicianEnRoute` (if emitted) | Field crew on the way | `MapPin` | (none) |
| `ProofSubmitted` | Field crew reports work complete | `Package` | (none) |
| `IncidentResolvedByAdmin` | Marked resolved — please confirm | `CheckCircle2` | (none) |
| `CitizenAckWindowExpired` | Marked closed (we haven't heard back) | `Clock` | (none) |
| `CitizenAckReceived` | You confirmed: issue resolved ✅ | `MessageSquareCheck` | (none) |
| `CitizenReopened` | Reopened for review | `ChevronRight` | (none) |

### Per-event row contents

Each row carries: relative timestamp (e.g., "12 min ago"), plain-language event description, optional one-line detail (e.g., field crew first name). **NO chain hash, NO JSON, NO payload** — public mode (Scenario 06 locked decision #1).

### Empty state

"No reports yet. Submit your first report from the home page." Renders only for new accounts with zero reports.

---

## 6. ActionCall component spec

The ActionCall shows **the one thing to do** (if anything). It is always present below the timeline.

### States (priority order)

1. **Closure ack** (when `IncidentResolvedByAdmin` is <30 days old and no ack yet)
2. **Silent-closure reopen** (when `CitizenAckWindowExpired` is in the timeline)
3. **In-progress reassurance** (when the timeline has events but no closure)
4. **All caught up** (when there's nothing to do)

### State content

| State | Content |
|---|---|
| **All caught up** | "All caught up. We'll message you when something changes." |
| **Closure ack** | The closure tap UI from Scenario 03 Screen 4: ✅ Confirm resolved / ❌ Reopen. ❌ Reopen asks for a one-line reason. |
| **Silent-closure reopen** | "We marked this closed because we hadn't heard back. If something's still wrong, you can reopen within 30 days of closure." + single "Reopen" button (calm frame: "this is here for you if you need it"). |
| **In-progress reassurance** | "We'll update this page when there's news." |

---

## 7. State mapping

Exhaustive state table:

| Incident state | Timeline shows | ActionCall shows |
|---|---|---|
| Just submitted, not yet verified | 1 event | "We're reviewing your report — usually within 30 min" |
| Verified, awaiting assignment | 2 events | "Your report is verified and queued for dispatch" |
| Assigned, on the way | 3 events | "Field crew [name] is on the way" |
| On-site | 4 events | "Field crew is on-site now" |
| Proof submitted, awaiting admin close | 5 events | "Field crew reports work complete — admin review in progress" |
| Resolved by admin, awaiting ack | 6 events | Closure tap UI |
| Acked ✅ | 7 events + ack | "Thanks for confirming. All set." |
| Ack window expired | 6 events + expired | Silent-closure reopen UI |
| Reopened | reopened event | "We've reopened this for review" |

The state is derived from the chain events themselves — there is no separate mutable state. The page is a pure projection.

---

## 8. Wireframes

Three states shown side by side: in-flight / closure-tap / silent-closure.

### In-flight state

```
+----------------------------------------+
| [logo]  Status Timeline     [EN] [⎋]  |
+----------------------------------------+
|                                        |
|  ┌──────────────────────────────────┐  |
|  │ ●  Field crew on the way         │  |
|  │    Karim · 12 min ago            │  |
|  ├──────────────────────────────────┤  |
|  │ ●  Verified                      │  |
|  │    Verified reporter · 18 min ago│  |
|  ├──────────────────────────────────┤  |
|  │ ●  Report received               │  |
|  │    32 min ago                    │  |
|  └──────────────────────────────────┘  |
|                                        |
|  ┌──────────────────────────────────┐  |
|  │  Field crew Karim is on the way  │  |
|  └──────────────────────────────────┘  |
|                                        |
+----------------------------------------+
```

### Closure-tap state

```
+----------------------------------------+
| [logo]  Status Timeline     [EN] [⎋]  |
+----------------------------------------+
|                                        |
|  ┌──────────────────────────────────┐  |
|  │ ●  Marked resolved — confirm?    │  |
|  │    2 hr ago                      │  |
|  ├──────────────────────────────────┤  |
|  │ ●  Field crew reports complete   │  |
|  │    Karim · 3 hr ago              │  |
|  ├──────────────────────────────────┤  |
|  │ ...                              │  |
|  └──────────────────────────────────┘  |
|                                        |
|  ┌──────────────────────────────────┐  |
|  │  Is this resolved?               │  |
|  │                                  │  |
|  │  [ ✓ Yes, fixed ]   [ ✗ No ]    │  |
|  └──────────────────────────────────┘  |
|                                        |
+----------------------------------------+
```

### Silent-closure state

```
+----------------------------------------+
| [logo]  Status Timeline     [EN] [⎋]  |
+----------------------------------------+
|                                        |
|  ┌──────────────────────────────────┐  |
|  │ ●  Marked closed                 │  |
|  │    (we hadn't heard back)        │  |
|  │    7 days ago                   │  |
|  ├──────────────────────────────────┤  |
|  │ ●  Marked resolved — confirm?    │  |
|  │    37 days ago                   │  |
|  ├──────────────────────────────────┤  |
|  │ ...                              │  |
|  └──────────────────────────────────┘  |
|                                        |
|  ┌──────────────────────────────────┐  |
|  │  We marked this closed because   │  |
|  │  we hadn't heard back.           │  |
|  │                                  │  |
|  │  If something's still wrong,     │  |
|  │  you can reopen within 30 days.  │  |
|  │                                  │  |
|  │       [ Reopen ]                 │  |
|  └──────────────────────────────────┘  |
|                                        |
+----------------------------------------+
```

---

## 9. Empty / loading / error states

### Empty state

Renders when the citizen has zero reports. Shows the timeline shell with the message: **"No reports yet. Submit your first report from the home page."** The ActionCall is hidden (nothing to act on).

### Loading state

Skeleton rows (3 placeholder cards with shimmer). No spinner — the page should feel like motion over data, not loading. Skeleton matches the row geometry exactly so the layout doesn't shift when real data arrives.

### Error state

**Network error:** "We can't load your reports right now. [Try again]" — retry button is the primary CTA. The timeline skeleton stays visible behind the error toast.

**Chain integrity anomaly (defensive — should never reach citizens in Phase 1):** If a recomputed hash doesn't match the stored hash for an event Anjali is reading, the affected row shows a subtle ⚠️ next to the timestamp with a tooltip: "This entry is being checked. It will appear correctly when verified." The page does not block — Anjali sees the motion. The anomaly is logged on the chain for operator review (Scenario 06 §Anomaly surfacing).

**Authorization error (defensive):** If the citizen's account is unauthorized for the requested incident, the page shows a calm "This report isn't available on your account." and a way back to MyReports.

---

## 10. i18n key surface

| Namespace | Purpose |
|---|---|
| `citizen.statusTimeline` | Page title, timeline row titles (event descriptions), relative time labels |
| `citizen.closureTap` | Closure tap UI copy (✅ / ❌ buttons, reopen prompt, reopen reason field label) |
| `citizen.actionCall` | All ActionCall state copy ("All caught up", "We'll update…", "We marked this closed…") |
| `citizen.reopen` | Reopen modal copy (reopen reason field, submit button, cancel button) |
| `citizen.empty` | "No reports yet" message |
| `citizen.error` | Error state copy (network, authorization) |
| `citizen.loading` | Loading state aria-label (skeleton rows don't need text) |

Trust band labels in `citizen.statusTimeline.bandLabel` are localized plain-language versions ("verified citizen anchor" / "verified reporter" / "hotline-sourced report" per foundation §1.1). Hash anchors and chain event type codes are **not** translated (foundation §10).

---

## 11. Accessibility notes

- **Relative time updates** are announced via `aria-live="polite"` on the timeline container. New events arriving via the 5s chain-freshness poll trigger a polite announcement ("Field crew on the way, 12 minutes ago").
- **Action buttons** have visible focus rings (2px emerald-600, 2px offset — foundation §9). The closure tap UI's ✅ / ❌ buttons are ≥48×48 px touch floor (foundation §3.5 + Scenario 03 locked decision #5).
- **Motion** respects `prefers-reduced-motion` (foundation §8.1): the 200ms fade-up is replaced with an instant state change; the ✅ ack celebration (Scenario 1 closure pulse + 1s confetti) is omitted.
- **Timeline rows** are not interactive — they are read-only projections. No keyboard trap risk.
- **Color contrast** on citizen surfaces is WCAG AA+ (foundation §9). Trust band badge pairs colour + text + icon (never colour alone).
- **Screen reader landmarks:** `<main>` wraps the timeline + ActionCall. The ActionCall is a `<section aria-labelledby="action-call-title">`.
- **Shoulder-surfing redaction** on the closure tap UI (Scenario 03 locked decision #5) — the ✅ / ❌ buttons render in a way that can't be over-the-shoulder guessed. This spec inherits that binding; implementation detail lives on the closure page itself.

---

## 12. Implementation notes

### Components to compose

From `web/src/components/ui/` (already shipped Phase 1.6a):
- `Card` — wraps each timeline row
- `Button` — closure tap ✅ / ❌ buttons, reopen button
- `Badge` — band label on the `TrustBandAssigned` row (with text, never colour alone)

New visual patterns (composed, not new primitives):
- The timeline itself is a `<ul>` of `Card` rows with a vertical connector line (CSS `border-left` on the `<ul>` + `border-radius: 9999px` bullets positioned with absolute positioning).
- The ActionCall is a `Card` with conditional content per state.

### Data hooks

- `useIncidentTimeline(incidentId)` — reads the chain segment filtered to `CitizenVisibleEventType`. Emits `ChainRead{actor, surface: status_timeline, inc, mode: public}` on mount (Scenario 06 locked decision #5).
- `useIncidentState(incidentId)` — derives the current state from the chain events (just-submitted / verified / assigned / on-site / proof-submitted / resolved-awaiting-ack / acked / ack-expired / reopened). Pure projection, no separate state.
- `useClosureTapActions(incidentId)` — fires `CitizenAckAccepted` (✅) or `CitizenAckRejected` + `IncidentReopened{parent}` (❌ with reason). Returns optimistic update for the ack state.
- `useReopenAction(incidentId)` — for the silent-closure path; fires `IncidentReopened{parent}` with `reopen_reason: still_problem`.

### Chain-event projection

The projection layer (the filter from 33 closed-enum events → `CitizenVisibleEventType`) lives in `web/src/lib/chainProjection/citizenProjection.ts`. It is the **same projection** that Scenario 06 Use Case C describes; this page consumes it. The mapping table is:

| Chain event | Citizen-visible | Display text (en) |
|---|---|---|
| `IncidentCreated` | ✅ | Report received |
| `TrustBandAssigned` | ✅ | Verified [band label] |
| `AssignedToTechnician` | ✅ | Assigned to field crew |
| `TechnicianEnRoute` | ✅ (if emitted) | Field crew on the way |
| `TechnicianArrived` | ✅ | Field crew arrived |
| `DiagnosisSubmitted` | ✅ | Problem diagnosed |
| `FixSubmitted` | ✅ | Repair completed |
| `ProofSubmitted` | ✅ | Field crew reports work complete |
| `ProofAccepted` | ✅ | Repair verified |
| `IncidentResolvedByAdmin` | ✅ | Marked resolved — please confirm |
| `CitizenAckRequested` | ❌ hidden | (internal — fires the closure SMS) |
| `CitizenAckAccepted` | ✅ | You confirmed: issue resolved ✅ |
| `CitizenAckRejected` | ✅ (paired) | Reopening — see reopen event |
| `CitizenReopened` | ✅ | Reopened for review |
| `CitizenAckWindowExpired` | ✅ | Marked closed (we haven't heard back) |
| `IncidentClosed` | ✅ | Report closed |
| All other 17 events | ❌ hidden | (operator-internal) |

---

## 13. Test scenarios

### Test 1 — Anjali lands on the page with one in-flight incident

**Setup:** One incident, chain events: `IncidentCreated`, `TrustBandAssigned`, `AssignedToTechnician` (Karim).
**Expected:**
- Timeline shows 3 rows, newest first.
- ActionCall shows: "Field crew Karim is on the way."
- No closure tap UI.
- `aria-live="polite"` announces new rows as they arrive (mock polling).
- No chain hash, no JSON, no payload visible anywhere on the page.

### Test 2 — Anjali lands with an unresolved closure

**Setup:** One incident, chain events through `IncidentResolvedByAdmin` (no ack yet, <30 days).
**Expected:**
- Timeline shows 6 rows.
- ActionCall shows the closure tap UI: ✅ Confirm resolved / ❌ Reopen buttons (≥48×48 px).
- No countdown timer on the surface (countdown is in the SMS schedule, not here).
- The "Reopen if something's wrong" copy is present.

### Test 3 — Anjali lands with a silently-closed incident

**Setup:** One incident, chain events through `CitizenAckWindowExpired` + `IncidentClosed{closer: priya, ack: silent}`.
**Expected:**
- Timeline shows the expired event + the silent-close row.
- ActionCall shows the silent-closure reopen UI: "We marked this closed because we hadn't heard back…" with a single Reopen button.
- The frame is calm — no error styling, no alarm.
- Reopen button is present and enabled (within 30 days of closure).

### Test 4 — Anjali taps ✅ Confirm resolved

**Setup:** Test 2 state. She taps ✅.
**Expected:**
- `CitizenAckAccepted` chain event fires.
- The page optimistically updates: closure tap UI is replaced with "Thanks for confirming. All set."
- A new row appears in the timeline: "You confirmed: issue resolved ✅".
- A subtle ✅ pulse + 1s confetti animation (or instant state change if `prefers-reduced-motion`).
- Within minutes, `IncidentClosed{closer: priya, ack: yes}` fires and the final row appears.

### Test 5 — Anjali taps ❌ Reopen

**Setup:** Test 2 state. She taps ❌.
**Expected:**
- A reopen modal opens with a one-line reason field (280 char Bangla / 560 char English).
- Optional voice note (30s max) is offered (same pattern as SubmitForm per Scenario 03 #5).
- Submit fires `CitizenAckRejected{reason_category, free_text, voice_ref}` + automatic `IncidentReopened{parent}`.
- The page returns to the timeline with the reopen row visible as a **branch** (connected to the original arc — never confused with it).
- Calm confirmation: "Your report has been reopened. We will look again."

---

## 14. Open questions

1. **Should `TechnicianEnRoute` be a separate event from `TechnicianArrived`?** Scenario 03's locked state list does not include `TechnicianEnRoute`; Scenario 06's `CitizenVisibleEventType` table does. This spec defers to the user — if `TechnicianEnRoute` is not in the final 33-event enum, the row simply doesn't render. The "Field crew on the way" line is best-effort.

2. **Band label wording on `TrustBandAssigned` for citizens.** The foundation §1.1 mandates plain language ("verified citizen anchor" / "verified reporter" / "hotline-sourced report"), but the exact localized strings across en/hi/bn need i18n review before shipping. This spec defers wording to `citizen.statusTimeline.bandLabel` namespace; the mapping is structural, the strings are pending.

3. **Should the ActionCall show in the empty state?** Current spec: hidden (nothing to act on). Alternative: show "Submit your first report" as the ActionCall. Deferred — depends on whether the empty state lives on this page or on a separate `/citizen/new` route.

4. **Should the timeline auto-poll for live updates, or refresh on mount?** Scenario 06's 5s chain-freshness poll applies to operator surfaces; for citizen surfaces the spec assumes polling on focus + on the 5-min dual-channel ack cycle (when an SMS lands, the user opens the app, the timeline is fresh). This spec says: poll on focus + on visibility change. If the team wants true live polling for citizens, that's a product decision.

5. **Reopen within 30 days of closure — does this window slide?** Scenario 03 locked decision #6 says the silent-closure auto-close fires at 30 days. The reopen window per this spec is 30 days from closure. If a citizen reopens at day 29, does the reopen window reset to 30 days from the new reopen, or does the original timeline still close at day 30? Deferred to product — this spec assumes the window is from the original closure; the reopened incident has its own ack window.

---

_Spec produced by Saga/Freya — 2026-09-11_
_See foundation §1–§11 for locked tokens, components, and rules this spec references._