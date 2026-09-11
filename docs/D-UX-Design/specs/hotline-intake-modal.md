# Hotline Intake Modal

> **Spec, not code.** ASCII wireframes only. The eventual React file should match this spec line-for-line for field order, validation, and outcomes.
> **Phase 4 — UX Design.** Tier 1, gap screen. Mounted on `OperatorDashboard`. References the design system foundation (`docs/D-UX-Design/01-design-system-foundation.md`); modal layer rules per §3.4.

---

## Meta

| Field | Value |
|---|---|
| **File path target** | `web/src/components/operator/HotlineIntakeModal.tsx` |
| **Source scenario** | [Scenario 01 — Priya's shift, Screen 3](../../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md) |
| **Status** | **NEW** — gap screen, mounted on `OperatorDashboard` |
| **Priority tier** | **1** (build first — load-bearing surface) |
| **i18n** | English (default), Hindi, Bengali |
| **Layout primitive** | Modal layer (foundation §3.4) — 640px wide, centred |

### Locked decisions (10, from Scenario 01)

1. **Mounted from OperatorDashboard top-chrome.** Single button "Log hotline call" in the dashboard's action bar. NOT a separate page.
2. **T3 default trust band.** Hotline-sourced incidents always default to T3 (lowest trust band) — none of the five anchor/verification signals are available.
3. **Six fields captured** — caller name (optional), caller phone (optional), call time (default now, editable), incident description (required, 500 char), location hint (free text, required), call outcome (required, dropdown). Only the first four fields create an incident; outcomes 2 and 3 do NOT create an incident but DO log the call.
4. **Hotline reporter lineage preserved.** `reporter_kind: hotline_operator` and `hotline_call_id` carried on the created incident so Scenario 05's metrics can distinguish hotline-sourced from web-form-sourced reports throughout their lifecycle.
5. **Submit only enabled when required fields are filled.** Description, location hint, and outcome are required.
6. **On submit:** modal closes, toast confirms "Incident created with ID `inc_01HX...` (T3 default)", and the new incident appears at the top of Priya's inbox with a phone icon and amber trust-band badge. `IncidentCreated` lands on the chain.
7. **Outcome = "no incident"** shows a different confirmation: "Call logged. No incident created." and logs a `HotlineCallLogged{outcome: no_incident}` chain event (still on the chain, but not an incident).
8. **Dismiss with ESC or "Cancel" button.** If any required field has content, dismissal asks "Discard this call log? You can keep editing." — confirmation dialog.
9. **i18n.** All field labels and outcomes translated; Hindi and Bengali defaults required.
10. **No keyboard nav gotchas.** Tab order: caller name → caller phone → call time → description → location hint → outcome → Cancel → Submit. ESC = Cancel (with confirmation if dirty).

---

## Purpose

Hotline calls are a legitimate citizen entry path for those without digital access — a phone call is the lowest-friction surface for a panicking neighbour whose water just turned bad. The operator who takes the call is the **proxy reporter**: she is the one trusted actor between the city and the caller, and the incident she creates from that call is **first-class data** — not a degraded substitute for a web-form report.

The Hotline Intake Modal is the surface that converts a phone conversation into a chain-anchored incident in under 90 seconds, while the caller is still on the line. Because phone-sourced calls cannot carry any of the five verification signals (no nid, no anchor trust, no photo with EXIF, no prior report history, no cross-reporter corroboration), the resulting incident always defaults to **T3** — the lowest trust band — which means the modal is also the surface where the heaviest verification reasoning will later live (Scenario 01 Path C).

---

## Trigger

A single button on the `OperatorDashboard` top-chrome action bar:

- **Label:** "Log hotline call"
- **Icon:** `Phone` (lucide-react, 16px, `text-slate-500`)
- **Variant:** `Button` secondary (slate outline) — secondary because the primary action is "work the inbox," and this is the alt-path for incoming reports
- **Position:** leftmost in the dashboard action bar, before "View Audit Log" and "Settings"
- **i18n key:** `operator.dashboard.actions.logHotlineCall`
- **Behaviour:** on click, opens `HotlineIntakeModal`. Modal focus traps; restore-on-close per foundation §3.4 `Modal` primitive.

---

## Modal anatomy

```
+---------------------------------------------------------------+
|  Log hotline call                                              |
|  Records will be added to the audit chain. Hotline-sourced     |
|  incidents default to T3 (lowest trust band).                  |
+---------------------------------------------------------------+
|                                                                |
|  [Reporter info]                                               |
|  --------------------                                          |
|  Caller name                                                   |
|  [____________________________________________]                |
|                                                                |
|  Caller phone                                                  |
|  [____________________________________________]                |
|                                                                |
|  Call time                                                     |
|  [2026-09-11 14:32  ▼]                                         |
|                                                                |
|  -- - - - - - - - - - - - - - - - - - - - - - - - - - - - -    |
|                                                                |
|  [Incident info]                                               |
|  --------------------                                          |
|  Incident description                          *                |
|  [____________________________________________]                |
|  [____________________________________________]                |
|  20–500 characters                              0 / 500         |
|                                                                |
|  Location hint                                 *                |
|  [____________________________________________]                |
|  5–200 characters. Free text — ward, landmark, standpipe #.    |
|                                                                |
|  Call outcome                                  *                |
|  [ Reported incident                              ▼ ]           |
|                                                                |
+---------------------------------------------------------------+
|                                          [ Cancel ]  [ Submit ]|
+---------------------------------------------------------------+
```

- **Title:** "Log hotline call" (h2, `text-xl`, weight 600)
- **Subtitle:** "Records will be added to the audit chain. Hotline-sourced incidents default to T3 (lowest trust band)." (`text-sm`, `text-slate-500`)
- **Required indicator:** asterisk after label (`*`)
- **Helper text:** below each input, `text-sm slate-500`
- **Error text:** below each input on validation failure, `text-sm rose-600`
- **Section dividers:** thin slate-200 horizontal rule between reporter info and incident info sections
- **Footer:** Cancel (ghost button, left) + Submit (primary emerald, right). Submit `disabled` until required fields filled.

---

## Layout

- **Width:** 640px (operator modal per foundation §3.4)
- **Centred** in viewport with backdrop `rgba(15, 23, 42, 0.4)`
- **Fields stacked single-column** with vertical rhythm 16px between rows
- **Section dividers:** 1px slate-200 horizontal rule between reporter info (caller name, phone, call time) and incident info (description, location hint, outcome)
- **Footer:** sticky to bottom of modal; 48px padding from last field
- **Description textarea:** 3 rows visible, auto-grows to 6
- **Mobile (<640px):** modal goes full-width with 16px side padding

---

## Field-by-field spec

| # | Field | Required | Type | Validation | Default | i18n key |
|---|---|---|---|---|---|---|
| 1 | **Caller name** | no | `Input text` | 0–80 chars | empty | `operator.hotlineIntake.fields.callerName` |
| 2 | **Caller phone** | no | `Input tel` | E.164 OR local 10-digit; trim spaces; never stored plaintext (hashed on submit) | empty | `operator.hotlineIntake.fields.callerPhone` |
| 3 | **Call time** | yes (effectively) | `Input datetime-local` | not in future (system clock + 1 min tolerance) | **PBX ring timestamp** if available; otherwise now (device clock) | `operator.hotlineIntake.fields.callTime` |
| 4 | **Incident description** | yes | `Textarea` | 20–500 chars | empty | `operator.hotlineIntake.fields.description` |
| 5 | **Location hint** | yes | `Input text` | 5–200 chars | empty | `operator.hotlineIntake.fields.locationHint` |
| 6 | **Call outcome** | yes | `Select` | enum: `reported_incident` / `no_incident` / `wrong_number` | `reported_incident` | `operator.hotlineIntake.fields.outcome` |
| 7 | **Call duration (min)** | no | `Input number` | 1–60; integer | 5 | `operator.hotlineIntake.fields.callDuration` |
| 8 | **Mark as sensitive** | no | `Switch` | boolean | false | `operator.hotlineIntake.fields.sensitiveContent` |

**Notes:**
- Phone field helper text: "Stored as a hash. We never keep the number in plaintext." (`operator.hotlineIntake.fields.callerPhoneHelper`)
- Description helper text: "What did the caller describe? Free text — Bangla or English." (`operator.hotlineIntake.fields.descriptionHelper`)
- Location hint helper text: "Ward, landmark, standpipe #, or street name. 5–200 characters." (`operator.hotlineIntake.fields.locationHintHelper`)
- Outcome helper text below the field, framed neutrally: "Use 'no incident' when the caller had a question but no contamination was reported." (`operator.hotlineIntake.fields.outcomeHelper`)
- A persistent caption above the section divider between reporter info and incident info reads: "Required fields below create the incident. Outcomes 'Inquiry handled' and 'Wrong number' only log the call." (`operator.hotlineIntake.sectionNotice`)

---

## State mapping for outcomes

| Outcome enum | i18n key | Submit behaviour | Chain event | New incident? | Inbox effect |
|---|---|---|---|---|---|
| `reported_incident` (default) | `operator.hotlineIntake.outcomes.reportedIncident` ("Reported incident") | Submit creates incident, T3 default band, payload `{ source: hotline, reporter_kind: hotline_operator, hotline_call_id: <uuid>, call_time, caller_name?, caller_phone_hash?, description, location_hint }` | `IncidentCreated{ trust_band: T3, source: hotline, reporter_kind: hotline_operator, hotline_call_id: ... }` | ✅ Yes | New incident at **top of Priya's inbox** with `Phone` icon + amber T3 badge |
| `no_incident` | `operator.hotlineIntake.outcomes.noIncident` ("Inquiry handled / no incident") | Submit logs call only — NO incident created | `HotlineCallLogged{ outcome: no_incident, call_time, hotline_call_id }` | ❌ No | Toast: "Call logged. No incident created." + entry appears in `AuditLog` |
| `wrong_number` | `operator.hotlineIntake.outcomes.wrongNumber` ("Wrong number / disconnected") | Submit logs call only — NO incident created | `HotlineCallLogged{ outcome: wrong_number, call_time, hotline_call_id }` | ❌ No | Toast: "Call logged. No incident created." + entry appears in `AuditLog` |

**Note on outcome selection:** The outcome default is `reported_incident` — operators do most hotline work as incident creation. Selecting a different outcome is a deliberate change; required fields (#4 description, #5 location hint) remain required because they capture the call's content for the audit log entry even when no incident is created.

---

## Submit / Cancel / dismiss behaviour

### Submit

- **Enabled when:** description ≥ 20 chars, location hint ≥ 5 chars, outcome selected, call time valid (not in future).
- **Disabled state:** button rendered with reduced opacity; tooltip "Fill required fields to submit."
- **On click (enabled):**
  1. If outcome is `reported_incident`: `POST /api/incidents` with `source: hotline, reporter_kind: hotline_operator, hotline_call_id` payload; modal closes after server-side success; toast confirms incident id and T3 default; inbox refetches via TanStack Query and surfaces new card.
  2. If outcome is `no_incident` or `wrong_number`: `POST /api/hotline-calls` with the call log payload; modal closes; toast confirms call logged; audit log refetches.

### Cancel / ESC dismiss

- **ESC key** OR **Cancel button click** behaves identically.
- **Dirty check:** modal tracks whether any field has user-entered content (caller name, caller phone, description, location hint — call time is initially set so doesn't count as dirty on its own; outcome is a select with a default so it counts only if user changed it).
- **If dirty:** open confirmation dialog — title "Discard this call log?", body "You can keep editing." Actions: "Keep editing" (ghost, closes dialog) + "Discard" (rose destructive, closes modal without saving).
- **If pristine:** modal closes immediately, no confirmation.

### Form validity on submit

- Live validation on blur and on submit.
- Field-level errors render below the field in `text-sm rose-600`.
- Submit button **never** fires an invalid submit; it stays disabled.

---

## Post-submit behaviour

### Outcome = `reported_incident`

1. Toast appears top-right for **1.5 s** (sticky confirmation pattern, hover-pause), text: `"Incident created with ID inc_01HX... (T3 default)"` (with the actual ULID interpolated). i18n key: `operator.hotlineIntake.toast.incidentCreated`.
2. Modal closes (focus restored to "Log hotline call" trigger button).
3. **`HotlineIntakeReceived` secondary toast** (operator-internal, ~3 s) confirms the chain write succeeded — per Scenario 01 Screen 3.
4. The new incident surfaces at the **top of Priya's inbox** (priority sort is priority-first / age-second — T3 hotline incidents do NOT jump higher-band work in progress; per Scenario 01 §"What fires automatically on submit"). When the inbox is empty (calm arrival), the new T3 incident is the only row.
5. **Inbox card displays:**
   - `Phone` icon (lucide, T3 amber) in the leading position
   - "T3" trust-band badge in amber (`--color-trust-t3` / `amber-600`) with `Phone` icon — per foundation §4.1
   - Description preview, location hint, call time
   - Missing-evidence chips: `no-photo` / `no-reputation` / `cluster-pending` (rendered by Scenario 01 Screen 4 when the operator opens the row for Path C verification — not on the inbox card itself)
6. **`IncidentCreated` lands on the chain** with the same source attribution Surakkha applies for every report; phone is never stored in plaintext (hashed).
7. Caller receives a "got heard" ack SMS within the 5-min window (Bangla-first, GSM-7 / UCS-2 hard caps per C-11) per Scenario 03 — this fires from the gateway after the chain write, **before** Priya has decided anything.

### Outcome = `no_incident` or `wrong_number`

1. Toast appears top-right for **1.5 s**, text: `"Call logged. No incident created."` i18n key: `operator.hotlineIntake.toast.callLogged`.
2. Modal closes.
3. **No incident in inbox.** The call appears in `AuditLog` with `HotlineCallLogged{outcome: ...}` chain event, sortable by `source: hotline`.
4. **No caller ack SMS** is required (no incident, no closure ack loop).

---

## Wireframes

### Empty state (modal just opened)

```
+------------------------------------------------------+
|  Log hotline call                                     |
|  Records will be added to the audit chain. Hotline-   |
|  sourced incidents default to T3 (lowest trust band). |
+------------------------------------------------------+
|                                                       |
|  Caller name                                          |
|  [                                              ]     |
|                                                       |
|  Caller phone                                         |
|  [                                              ]     |
|  Stored as a hash. We never keep the number in        |
|  plaintext.                                           |
|                                                       |
|  Call time                                            |
|  [ 2026-09-11 14:32     ]                             |
|                                                       |
|  - - - - - - - - - - - - - - - - - - - - - - - - -    |
|                                                       |
|  Incident description                          *      |
|  [                                              ]     |
|  [                                              ]     |
|  [                                              ]     |
|  20–500 characters                      0 / 500       |
|                                                       |
|  Location hint                                 *      |
|  [                                              ]     |
|  5–200 characters. Free text — ward, landmark,        |
|  standpipe #.                                         |
|                                                       |
|  Call outcome                                  *      |
|  [ Reported incident                       ▼ ]       |
|                                                       |
|  Use 'no incident' when the caller had a question     |
|  but no contamination was reported.                   |
|                                                       |
+------------------------------------------------------+
|                              [ Cancel ]  [ Submit ]  |
+------------------------------------------------------+
        (Submit greyed/disabled — required fields empty)
```

### Filled state (hotline-sourced incident, ready to submit)

```
+------------------------------------------------------+
|  Log hotline call                                     |
|  Records will be added to the audit chain. Hotline-   |
|  sourced incidents default to T3 (lowest trust band). |
+------------------------------------------------------+
|                                                       |
|  Caller name                                          |
|  [ Rina Akhter                                  ]     |
|                                                       |
|  Caller phone                                         |
|  [ +880 1712 345 678                          ]       |
|                                                       |
|  Call time                                            |
|  [ 2026-09-11 14:32     ]                             |
|                                                       |
|  - - - - - - - - - - - - - - - - - - - - - - - - -    |
|                                                       |
|  Incident description                          *      |
|  [ Foul smell from the kitchen tap since this    ]    |
|  [ morning. Two families on this standpipe       ]    |
|  [ reporting the same. Caller says her child     ]    |
|  [ has a stomach ache.                          ]    |
|  20–500 characters                    187 / 500       |
|                                                       |
|  Location hint                                 *      |
|  [ Ward 14, Mohammadpur, standpipe #7, behind    ]    |
|  [ the primary school                          ]    |
|  5–200 characters. Free text — ward, landmark...      |
|                                                       |
|  Call outcome                                  *      |
|  [ Reported incident                       ▼ ]       |
|                                                       |
+------------------------------------------------------+
|                              [ Cancel ]  [ Submit ]  |
+------------------------------------------------------+
        (Submit enabled, primary emerald)
```

---

## Empty / loading / error states

### Empty state

The modal's initial state on open. Caller name + caller phone empty; call time defaults to now; description + location hint empty; outcome defaults to `reported_incident`. Submit button disabled. (See wireframe above.)

### Loading state

**Not applicable** — the modal is fully synchronous. The submit handler awaits the API call and disables the button + shows inline spinner during the await (~300–800 ms typical). The UI does not have a separate loading state.

### Error state — submit failed

If `POST /api/incidents` (or `POST /api/hotline-calls`) fails or times out:

1. **Toast appears top-centre, auto-dismiss after 5 s, manual dismiss available**, text: `"Couldn't create incident — retrying in 5s"` (or "Couldn't log call — retrying in 5s" for call-only path). i18n key: `operator.hotlineIntake.toast.errorRetry`.
2. **Toast includes a "Retry now" link** (ghost button inline) for manual retry — clicking re-fires the same submit payload.
3. **Modal stays open** with submitted values intact (no data loss). Submit button re-enables so the operator can also click it again.
4. **Background auto-retry** fires once at +5 s with the same payload. If second attempt fails, toast updates to: `"Still couldn't create incident — submit when ready"` and the modal stays open until the operator dismisses it manually.

---

## i18n key surface

### Namespaces

- `operator.hotlineIntake.title` — "Log hotline call"
- `operator.hotlineIntake.subtitle` — "Records will be added to the audit chain. Hotline-sourced incidents default to T3 (lowest trust band)."
- `operator.hotlineIntake.sectionNotice` — "Required fields below create the incident. Outcomes 'Inquiry handled' and 'Wrong number' only log the call."
- `operator.hotlineIntake.fields.callerName` / `callerPhone` / `callTime` / `description` / `locationHint` / `outcome`
- `operator.hotlineIntake.fields.callerPhoneHelper` / `descriptionHelper` / `locationHintHelper` / `outcomeHelper`
- `operator.hotlineIntake.outcomes.reportedIncident` / `noIncident` / `wrongNumber`
- `operator.hotlineIntake.toast.incidentCreated` — `"Incident created with ID {incidentId} (T3 default)"`
- `operator.hotlineIntake.toast.callLogged` — `"Call logged. No incident created."`
- `operator.hotlineIntake.toast.errorRetry` — `"Couldn't create incident — retrying in 5s"` / `"Couldn't log call — retrying in 5s"`
- `operator.hotlineIntake.toast.errorFinal` — `"Still couldn't create incident — submit when ready"`
- `operator.hotlineIntake.confirmDiscard.title` — "Discard this call log?"
- `operator.hotlineIntake.confirmDiscard.body` — "You can keep editing."
- `operator.hotlineIntake.confirmDiscard.keepEditing` / `discard`
- `operator.hotlineIntake.submit` — "Submit" (or context-specific label)
- `operator.hotlineIntake.submitDisabledTooltip` — "Fill required fields to submit."
- `operator.dashboard.actions.logHotlineCall` — "Log hotline call" (button label on the dashboard action bar)

### Hindi & Bengali defaults

The implementation must include Hindi and Bengali translations for all keys above at the baseline (per Phase 4 plan §6: English + Hindi + Bengali). Hindi: "फ़ोन कॉल लॉग करें", "हेल्पलाइन-स्रोत घटनाएँ डिफ़ॉल्ट रूप से T3 हैं" (placeholder copy pending i18n review per Scenario 03 / content-language rules — calm tone, no exclamations, no PHA bureaucracy speak).

---

## Accessibility notes

- **Focus trap** on modal mount; focus restored to "Log hotline call" button on close (foundation §3.4)
- **ESC** dismisses (with confirmation if dirty)
- **Tab order (locked):** caller name → caller phone → call time → description → location hint → outcome → Cancel → Submit
- **All labels visible** — no placeholder-only labels (foundation §9 + §3.5)
- **Required field indicator** is asterisk after label, not separate legend
- **Helper text for "T3 default" framing** is the subtitle AND the section notice between reporter info and incident info — operators know why hotline incidents get the lowest band by default, so the reasoning weight (Scenario 01 Path C) doesn't surprise them
- **Trust band badge** in the inbox row carries `aria-label="T3 hotline-sourced, lowest trust band"` (foundation §9, §4.1)
- **Form errors** are announced via `aria-live="polite"` on a hidden status region adjacent to each field
- **Visible focus ring** on every interactive element — 2px emerald-600 ring, 2px offset (foundation §9)
- **Color contrast:** WCAG AA across all text (operator surfaces AA+ per foundation §9)
- **`Phone` icon on inbox card** has `aria-label="Hotline-sourced incident"` so screen readers surface the hotline lineage

---

## Implementation notes

- **Mounted from `web/src/pages/OperatorDashboard.tsx` top-chrome action bar** — single `Button` component triggers `setOpen(true)`. The dashboard already uses `AppLayout` (foundation §3.1) — the modal lives outside `InboxRail | DetailPane | EventChain` because hotline intake is a top-of-screen concern.
- **Reuses existing primitives** from `web/src/components/ui/`: `Modal`, `Input`, `Textarea`, `Select`, `Button`. No new component primitives introduced (foundation §7).
- **Submits via existing `POST /api/incidents` endpoint** with `source: hotline` payload field. The gateway accepts `source` as `web_form` (default) / `hotline` / `sensor` and stamps it on `IncidentCreated`. Hotline-sourced incidents carry `reporter_kind: hotline_operator` and a `hotline_call_id` UUID generated client-side at form mount (so we can correlate retries if the operator submits twice in the same session).
- **`POST /api/hotline-calls`** for outcomes `no_incident` / `wrong_number` — a lightweight call-log endpoint that emits `HotlineCallLogged{outcome, call_time, hotline_call_id}` on the chain. This endpoint exists to keep hotline call records audit-anchored even when no incident is created.
- **Emits chain event via the same write path as web-form submissions.** The chain doesn't know or care about the source — the source is a field on the event payload (`source: hotline`). The single write path per AD-1 (foundation §11 + product-brief AD-1) is preserved.
- **Inbox refetch** is via the existing TanStack Query / fetch invalidation pattern that InboxList already uses; the new incident card re-renders at the position determined by the priority-first / age-second sort.
- **Phone hashing** happens server-side on the gateway; the modal sends the raw phone (E.164 or local 10-digit) and the gateway replaces it with `reporter: caller_phone_hash` on the chain event. This is the same pattern as Scenario 03's `reporter: nid_hash`.
- **Bengali locale first** for hotline-text-heavy context (operator notes, location hints); English fallback for the operator dashboard chrome. Per Scenario 01 Screen 3: "Bangla locale first; English fallback."

---

## Test scenarios

1. **"Priya opens modal, fills all required fields, submits → incident created with T3 badge visible in inbox."**
   - Open OperatorDashboard, click "Log hotline call"
   - Fill caller name = "Rina Akhter", caller phone = "+880 1712 345 678", description = "Foul smell from the kitchen tap since this morning.", location hint = "Ward 14, Mohammadpur, standpipe #7"
   - Outcome stays at "Reported incident" default
   - Click Submit
   - Modal closes, toast reads "Incident created with ID inc_01HX... (T3 default)"
   - Inbox list now shows new incident at top with `Phone` icon + amber T3 badge
   - Chain segment for the new incident contains `IncidentCreated{trust_band: T3, source: hotline, reporter_kind: hotline_operator, hotline_call_id: <uuid>}`

2. **"Priya selects 'Inquiry handled / no incident' outcome, submits → no incident created, call logged in audit log."**
   - Open modal, fill description + location hint, select outcome "Inquiry handled / no incident"
   - Click Submit
   - Modal closes, toast reads "Call logged. No incident created."
   - Inbox list does NOT gain a new incident
   - AuditLog shows a `HotlineCallLogged{outcome: no_incident}` event with the `hotline_call_id`

3. **"Priya opens modal, types in description, hits ESC → confirmation dialog appears."**
   - Open modal, type "abc" into description (now dirty)
   - Press ESC
   - Confirmation dialog: "Discard this call log? You can keep editing." with Keep editing (ghost) + Discard (rose destructive)
   - Click "Keep editing" → dialog closes, modal stays open with description intact
   - Press ESC again, click "Discard" → modal closes, no submit fired

4. **"Priya opens modal, leaves description empty → submit button disabled."**
   - Open modal, fill location hint only, leave description empty
   - Submit button is greyed/disabled
   - Hover/tab-focus → tooltip "Fill required fields to submit."
   - Cannot click; cannot submit; no error yet
   - Type a single character into description → field error "20 characters minimum" appears (`text-sm rose-600`), button still disabled
   - Type 20th character → button becomes enabled

5. **"Hindi locale: Priya opens modal, all labels and outcomes are translated."**
   - Switch language to Hindi via the TopChrome language picker
   - Click "Log hotline call" (button label is the translated string)
   - Modal opens; title, subtitle, all six field labels, all helper text, the three outcome options in the dropdown, and the Cancel / Submit buttons are all rendered in Hindi
   - The T3-default framing in the subtitle is in Hindi; the operator understands the trust band default reasoning in their working language

6. **"Call time in the future fails validation."**
   - Open modal, advance call time field to tomorrow's date
   - Type valid description + location hint
   - Click Submit
   - Field error renders below call time: "Call time cannot be in the future." (`rose-600`)
   - Submit is disabled

7. **"Network failure: Priya submits, POST times out, toast + auto-retry keep modal open."**
   - Disable network (simulated)
   - Fill the modal, click Submit
   - Toast appears: "Couldn't create incident — retrying in 5s" with "Retry now" inline link
   - After 5 s, auto-retry fires; network still disabled → toast updates to "Still couldn't create incident — submit when ready"
   - Modal stays open with all field values intact; operator can re-enable network and click Submit again or click "Retry now"

---

## Cross-scenario linkage

This modal's submission flow emits the same `IncidentCreated` chain event as:

- **Scenario 03 — Anjali's web-form submit** (`SubmitReportPage`). Both paths land `IncidentCreated{...}` on the chain. The **only differentiator** is the `source` field: `web_form` (Anjali's path) vs `hotline` (this modal). All downstream operator surfaces — InboxDetail, InboxList audit displays, the per-incident chain viewer — distinguish hotline-sourced from web-form-sourced via this field.
- **Scenario 04 — Karim's sensor-fired incidents.** The sensor gateway emits `IncidentCreated{source: sensor, ...}` on the same chain. The three source values are `web_form` / `hotline` / `sensor`, all first-class.

**Scenario 05 — Pia's data contract** depends on the hotline-vs-web-form distinction being preserved as a first-class field through every aggregate. Specifically:

- **Shape 1 (trust band distribution):** accepts `source` filter; hotline-sourced T3 incidents appear as a distinct cell in the distribution grid.
- **Shape 2 (resolution rate vs. citizen-✅ divergence):** accepts `source` filter on the drill-down; hotline-sourced incidents show a different resolution-✅ correlation profile than web-form-sourced because the reporter (`caller_phone_hash`) is one-shot, not a returning reporter.
- **Shape 3 (SLA compliance per named actor):** Priya (the operator who logged the call) carries the SLA-relevant event; the hotline call itself is captured as a `HotlineCallLogged` or `IncidentCreated` with `actor: priya`.
- **Shape 4 (reporter cohort retention — web-form vs hotline, anchor vs non-anchor):** this is the load-bearing surface for hotline-vs-web-form distinction. Hotline callers have a fundamentally different retention profile than web-form reporters — they may report once and never return. The view must preserve `source_category` (web_form / hotline) as a cohort dimension.

**The hotline_call_id carried on `IncidentCreated`** is the lineage key for the hotline path. It links the chain event back to the specific phone call session, enables de-duplication of accidental re-submits, and provides the forensic trail Scenario 05's hotline-cohort retention metric aggregates on.

**T3 trust band for hotline-sourced incidents** is the structural signal that hotline reports start with the lowest verification baseline. This is preserved through every downstream event — no implicit uplift, no auto-promotion. The T3 default applies because none of the five anchor/verification signals are available: there is no nid-bound authentication, no anchor trust flag, no photo with EXIF, no prior report history (the caller is one-shot), and no cross-reporter corroboration within the cluster window.

---

## Locked decisions (resolved 2026-09-11)

| # | Decision | Choice | Where applied |
|---|----------|--------|---------------|
| 1 | "Escalate to Pia" button | **Disabled button + tooltip** "Available in Phase 2 PHA dashboard". Consistent with the chain viewer's answer. Sets expectation, surfaces the future without false functionality. | §3 trigger / modal anatomy (third button) |
| 2 | Call duration field | **Add `call_duration_min`** (number, 1–60, optional). Operators estimate; default 5 min. Useful for later phone-rate analysis and Path C verification reasoning. | §6 field table, §10 wireframe |
| 3 | Location hint for "no incident" outcome | **Required regardless of outcome.** Useful for call-pattern analysis ("we get 10 inquiries about this ward"). | §6 field table, §7 outcome state mapping |
| 4 | Multiple incidents per call | **One incident per modal.** If caller reports two issues, operator opens modal twice. Cleaner audit trail. | §1 modal anatomy, §16 test scenarios |
| 5 | Sensitive content (health/identity) | **Add a "Mark as sensitive" toggle.** When on, description field is hashed at rest and shown only to Priya + Adi; Karim doesn't see it. | §6 field table (new row), §14 implementation notes |
| 6 | Call time default | **Default to call ring timestamp** if PBX integration is available; otherwise default to now. Operator can edit. | §6 field table (call time row), §14 implementation notes |

## Remaining open questions

1. **Should the modal capture the caller's preferred language?** Operators might log "Bangla" if the caller spoke Bangla; this would let the Phase 2 PHA dashboard track language-as-cohort. Currently no field captures it. Deferred — not a Phase 1 requirement.
2. **Auto-routing of T3 hotline incidents:** per Scenario 01, T3 hotline incidents do NOT jump the priority sort above higher-band work in progress. The modal currently relies on the existing inbox sort to honor this. If the inbox sort changes, the modal needs no change — but the behavioural contract should be re-confirmed.
3. **Escaping accent / non-Bangla character handling** in the location hint and description (Bangla IME, Unicode normalisation). Out of scope for this spec but worth a smoke test before Phase 1 demo bar.
4. **Hotline call id generation:** currently generated client-side at modal mount. If the modal is re-opened (after a discarded submit) within the same session, a new `hotline_call_id` is generated. This means discard + reopen starts a new lineage key. Current behaviour is acceptable but not load-bearing.

---

## Design log

- **Spec produced by Surakkha Phase 4 Spec Writer — 2026-09-11**
- **Locked decisions applied 2026-09-11**
- **Source links:**
  - [Scenario 01 — Priya's shift, Screen 3](../../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md) — locked decisions and Path C hotline-sourced verification reasoning
  - [Scenario 03 — Anjali's anchor citizen arc](../../C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md) — hotline is the fallback entry path for citizens without digital access
  - [Scenario 05 — Pia's data contract, PHA deferred](../../C-UX-Scenarios/05-pia-data-contract-pha-deferred.md) — hotline-vs-web-form distinction must be preserved through every metric; Shape 4 cohort retention is the load-bearing surface
  - [Product brief](../../A-Product-Brief/product-brief.md) — AD-1 single write path; chain is the source of truth
  - [Phase 4 plan](../00-phase-4-plan.md) — Tier 1 gap screen, mounted on OperatorDashboard
  - [Design system foundation](../01-design-system-foundation.md) — modal layer §3.4, trust band palette §1.1, Foundation §11 rule "Hotline intake is first-class," T3 amber colour and `Phone` iconography §4.1
