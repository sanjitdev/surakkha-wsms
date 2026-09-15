# WO-002 — Hotline Intake Modal

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.1.b — Tier 1 (gap screen).
> Date: 2026-09-15

---

## Objective

Build the modal that lets Priya log a hotline call as a first-class incident in under 90 seconds while the caller is still on the line. The hotline-sourced incident always defaults to **T1 (unverified) + hotline reporter-badge** (per PRD §3.3 — T3 reserved for consumer-notice path).

## Scope

**In:**
- New component at `web/src/components/operator/HotlineIntakeModal.tsx` (file may already exist as pre-lockdown draft; needs reconciliation)
- Mounted from `OperatorDashboard` top-chrome action bar (single button "Log hotline call")
- Six fields: caller name (opt), caller phone (opt), call time (default now, editable), incident description (req, 500c), location hint (req), call outcome (req, dropdown)
- Three outcome branches:
  - Outcome 1 (incident): creates `IncidentCreated` with `reporter_kind: hotline_operator`, `hotline_call_id`, defaults to T1
  - Outcome 2/3 (no incident): logs `HotlineCallLogged{outcome: no_incident}` event (still on chain, not an incident)
- ESC / Cancel dismiss with confirmation-if-dirty
- Bangla-first for hotline-text-heavy fields

**Out:**
- Voice recording / transcription
- Caller-ID auto-populate
- Cross-references to past calls by same phone

## Parent artifacts

- **Spec:** `docs/D-UX-Design/hotline-intake-modal.md`
- **Scenario:** `docs/C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md` Screen 3
- **Foundation:** `docs/D-UX-Design/01-design-system-foundation.md` §3.4 (Modal primitive rules)
- **Lockdown:** `_bmad-output/design/01-color-lockdown.md` (T1 = divider neutral; reporter-badge tokens)
- **Master PRD:** `docs/E-Development/000-PRD.md` §3, §13 (feature PRD authoring)

## Acceptance criteria

1. Modal opens from "Log hotline call" button on OperatorDashboard
2. Six fields render in the order: caller name → caller phone → call time → description → location hint → outcome
3. Submit disabled until description, location hint, and outcome are all filled
4. On submit (outcome = incident):
   - Modal closes
   - Toast confirms "Incident created with ID `inc_01HX…` (T1 default, hotline source)"
   - New incident appears at top of Priya's inbox with `Phone` icon and `--color-reporter-hotline` chip
   - `IncidentCreated` event lands on chain
5. On submit (outcome = no-incident):
   - Modal closes
   - Different toast: "Call logged. No incident created."
   - `HotlineCallLogged{outcome: no_incident}` event lands (no `IncidentCreated`)
6. ESC / Cancel with dirty fields shows "Discard this call log? You can keep editing." confirmation
7. Tab order matches spec §10: caller name → caller phone → call time → description → location hint → outcome → Cancel → Submit
8. Bangla-first for all labels, button text, and outcome names
9. Modal focus traps; restore-on-close per foundation §3.4
10. The hotline reporter-badge is `hotline_operator` (not anchor), and the chain event preserves it for Scenario 05 metrics

## UI rules

- **Area Labels** (per foundation §13):
  - `hotline-intake-modal-page` (the modal root)
  - `hotline-intake-modal-header`, `hotline-intake-modal-main`
  - `hotline-intake-modal-form`
  - `hotline-intake-modal-input-caller-name`, `…-caller-phone`, `…-call-time`
  - `hotline-intake-modal-input-description`, `…-location-hint`, `…-outcome`
  - `hotline-intake-modal-button-cancel`, `…-submit`
- **Primitives used:** `Modal` (640px wide, centred, focus trap), `Input`, `DatePicker` (call time), `Dropdown` (outcome), `Button` (primary + ghost), `Toast`
- **Layout primitive:** foundation §3.4 Modal layer
- **Button placement:** Cancel (ghost, left) → Submit (primary, right)
- **Required indicator:** asterisk (`*`) per lockdown `06-data-formats-lockdown.md`
- **Reporter-badge color:** `--color-reporter-hotline` (deep-teal-tint) when surfaced in inbox

## Wire contract

- **Emit (incident):** `POST /api/events` with `IncidentCreated{reporter_kind: hotline_operator, hotline_call_id, description, location_hint, call_time, band: T1}`
- **Emit (no incident):** `POST /api/events` with `HotlineCallLogged{reporter_kind: hotline_operator, hotline_call_id, outcome: no_incident, call_time}`
- **No read endpoints** — modal is create-only

`web/src/mocks/handlers.ts` needs:
- Add `POST /api/events` handler for `HotlineCallLogged` event variant (if not already covered by generic `/api/events`)
- Add fixture for `hotline_call_id` minting (UUID v7 pattern, similar to chain block IDs)

## i18n keys

Add to both `web/src/i18n/locales/en/operatorDashboard.json` and `…/bn/`:

```
"actions.logHotlineCall": "Log hotline call"

"hotline.modal.title": "Log hotline call"
"hotline.modal.subtitle": "Records will be added to the audit chain. Hotline-sourced incidents default to T1 (unverified) + hotline reporter-badge."
"hotline.modal.callerName.label": "Caller name"
"hotline.modal.callerPhone.label": "Caller phone"
"hotline.modal.callTime.label": "Call time"
"hotline.modal.description.label": "Incident description"
"hotline.modal.description.required": "Required"
"hotline.modal.locationHint.label": "Location hint"
"hotline.modal.outcome.label": "Call outcome"
"hotline.modal.outcome.incident": "Reported an incident"
"hotline.modal.outcome.inquiry": "Inquiry only"
"hotline.modal.outcome.missed": "Missed call / wrong number"
"hotline.modal.button.cancel": "Cancel"
"hotline.modal.button.submit": "Submit"
"hotline.modal.toast.incidentCreated": "Incident created with ID {incidentId} (T1 default, hotline source)"
"hotline.modal.toast.callLogged": "Call logged. No incident created."
"hotline.modal.discardConfirm.title": "Discard this call log?"
"hotline.modal.discardConfirm.body": "You can keep editing."
"hotline.modal.discardConfirm.discard": "Discard"
"hotline.modal.discardConfirm.keepEditing": "Keep editing"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-hotline-intake-modal.test.tsx`
  - Six fields render in correct order
  - Submit disabled until required fields filled
  - Outcome branching: incident path emits `IncidentCreated`; no-incident emits `HotlineCallLogged`
  - ESC with dirty field shows confirmation
  - Tab order matches spec §10
  - Modal focus traps and restores on close
  - Bangla-first on first mount
  - Default band is T1 (not T2 or T3)
  - `reporter_kind: hotline_operator` on emitted event
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with operator-dashboard → hotline modal → inbox round-trip

## Migration debt

- None (Tier 1 gap screen; new component)
- Verify pre-lockdown draft (if any) doesn't contain Hindi strings or `band: T3` defaults

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Hotline defaults to T1 + hotline badge (NOT T3) |
| Closure confetti removed | ✅ N/A (no closure here) |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Modal, Input, Dropdown, DatePicker, Button, Toast from `web/src/components/ui/` |
| Token names kept, hexes replaced | ✅ References `--color-reporter-hotline` (lockdown name) |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
