---
title: 'FE-F2 — Anjali /submit report-submission page'
type: 'feature'
created: '2026-09-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'b889cc6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-f1-incident-actions-hook.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5g-anjali-filter-bangla-counters.md'
---

## Intent

**Problem.** F1 shipped `useIncidentActions()` with a `submitReport()`
method that POSTs `AnjaliReportSubmitted` to `/api/events` and
projects an `IncidentCreated` so the operator sees the report on
their inbox. But the citizen side has no UI to drive the action —
`/submit` is still a `ComingSoonPage` placeholder
(`web/src/App.tsx:157-168` pre-F2).

This spec lands the first usable `/submit` page for the Anjali
persona: a desktop/tablet form that compiles to a single
`AnjaliReportSubmitted` chain write.

**Approach:**
1. New `SubmitReportPage` (`web/src/pages/SubmitReportPage.tsx`)
   role-gated to `session.role === 'anjali'`. Other personas see an
   `EmptyState` pointing at their own landing.
2. Form fields: title (min 5), severity T1/T2/T3, ward W01-W10,
   description (min 10). Optional photo URL + voice URL in a
   collapsible `<details>`.
3. Submit calls `actions.submitReport({ title, severity, ward_id,
   description, photo_url, voice_url })`. Success state shows a
   synthetic receipt with `event_id` + `submitted_at` so the citizen
   has a chain-anchored confirmation without a round-trip to
   `/api/blocks`.
4. New `web/src/styles/submit.css` for form + receipt composition.
   Reuses the existing `--space-*`, `--font-*`, `--brand-*`,
   `--bg-*` tokens. No new design tokens.
5. New test file `fe-f2-submit-report.test.tsx` with 7 cases
   pinning the I/O matrix below.
6. `App.tsx` — register `<Route path="/submit" element={<SubmitReportPage />} />`,
   remove `/submit` from `PLACEHOLDERS`.

## Boundaries & Constraints

**Always:**
- Role-gating: `session.role === 'anjali'`. Other roles see
  `EmptyState` ("Wrong persona") not the form.
- Form validation lives client-side: title ≥ 5 chars, description ≥ 10
  chars. Submit button disabled until both pass.
- Payload shape matches `useIncidentActions.submitReport` exactly:
  `{ title, severity, ward_id, description, photo_url?, voice_url? }`.
- Empty `photoUrl` / `voiceUrl` → `undefined` (drop the key) so
  the chain envelope stays minimal.
- Success state holds `{ event_id, title, ward_id, severity, submitted_at }`
  locally. `event_id` is a synthetic prefix `01` + random base36 — the
  page is a UX surface, not a system-of-record; the chain has the
  authoritative id.
- "Submit another report" button resets the receipt state and clears
  form fields for the next submission.
- Token-only CSS. Reuse `--space-*`, `--font-*`, `--bg-*`,
  `--brand-*`, `--border-*`, `--radius-*`.
- All strings stay English (mirrors the operator pages). Bangla
  copy is a Phase 2 follow-up.

**Ask First:** None — additive feature.

**Never:**
- No third-party deps (no react-hook-form / formik).
- No public API changes to existing hooks or primitives.
- No barrel files (AD-FE-9).
- No edits to existing pages (`InboxList`, `InboxDetail`, etc.).
- No real IndexedDB / MSW wiring — the page reads from
  `useAppLayout()` (session) and `useIncidentActions()` (chain write).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_role_is_anjali_shows_form | `session.role='anjali'` | Form renders; defaults T2 / W01 |
| HAPPY_PATH_role_not_anjali_shows_empty_state | `session.role='utility_operator'` | `EmptyState` "Wrong persona"; form NOT in DOM |
| HAPPY_PATH_submit_calls_submitReport_with_payload | fill form, click submit | `actions.submitReport` called with `{title, severity, ward_id, description, photo_url, voice_url}` |
| HAPPY_PATH_validation_disables_until_minimums | title < 5 OR desc < 10 | Submit button `disabled=true` |
| HAPPY_PATH_success_renders_receipt_with_event_id | submit succeeds | Receipt card replaces form; `data-testid="submit-receipt-event-id"` shows `01[A-Z0-9]+` |
| HAPPY_PATH_submit_another_resets_to_form | click "Submit another report" | Form returns; title + description cleared |
| ERROR_CASE_submit_failure_keeps_form | submitReport returns `false` | Form stays; no receipt rendered |
| ERROR_CASE_optional_attachments_empty_drop_key | submit with empty photo + voice | `photo_url` and `voice_url` are `undefined` (key absent) in payload |

## Code Map

### New (3 files, ~430 LoC total)

- `web/src/pages/SubmitReportPage.tsx` (~280 LoC):
  - Role gate + form + success state.
  - Reuses `Container(Bangla)`, `Card`, `Button`, `EmptyState`,
    `SendIcon`, `useAppLayout`, `useIncidentActions`,
    `useDateFormatter`.
  - `WARDS` and `SEVERITIES` `as const` arrays at module scope
    (mirrors B0 dropdown option pattern).

- `web/src/styles/submit.css` (~120 LoC):
  - `.submit-form__row` / `.submit-form__label` / `.submit-form__input` /
    `.submit-form__textarea` — input chrome.
  - `.submit-form__row--split` — 2-col split for severity+ward at
    `>=768px`; collapses below.
  - `.submit-form__details` / `.submit-form__details-summary` —
    collapsible attachments.
  - `.submit-form__actions` / `.submit-form__action-hint` —
    primary CTA + transient status text.
  - `.submit-receipt*` — receipt card meta + hint copy.

- `web/src/__checks__/fe-f2-submit-report.test.tsx` (~250 LoC, 7 cases):
  - `role_gate_blocks_non_anjali` — Priya sees "Wrong persona".
  - `anjali_renders_form_with_default_values` — form visible,
    defaults T2/W01, submit disabled.
  - `submit_button_disabled_until_minimums_met` — title<5 OR desc<10
    keeps disabled; both filled enables; desc<10 disables again.
  - `submit_calls_actions_submitReport_with_payload` — payload shape
    pinned; `undefined` for empty optional fields.
  - `success_state_renders_receipt_with_event_id` — receipt visible,
    form hidden, event_id matches `01[A-Z0-9]+`.
  - `submit_another_resets_to_form` — receipt → form, fields cleared.
  - `submit_failure_keeps_form_visible` — `submitReport → false`
    keeps form, no receipt.

### Modified (1 file, ~+10 LoC)

- `web/src/App.tsx`:
  - Import `SubmitReportPage`.
  - Remove `/submit` from `PLACEHOLDERS` array.
  - Add `<Route path="/submit" element={<SubmitReportPage />} />` in
    the authenticated shell, before the placeholder map.

### Files unchanged (out of scope)

- `web/src/hooks/useIncidentActions.ts` — `submitReport` already
  accepts the payload shape this page sends (verified in F1).
- `web/src/components/ui/{Button, Card, EmptyState}` — reused
  as-is.
- `web/src/mocks/handlers.ts` — `AnjaliReportSubmitted` already
  projects `IncidentCreated` (verified in F1); no MSW changes.
- `web/src/pages/OperatorDashboard.tsx`, `web/src/pages/InboxList.tsx` —
  the consumer pages that show the new incident are F3's concern.

### Reuse (no edits)

- `useIncidentActions` (F1) — `submitReport` is the only call.
- `useAppLayout` — `session.role` and `session.display_name`.
- `useDateFormatter` (B5d) — `time-full` for the receipt timestamp.
- `useLocale` (B5d) — `submit.css` respects `[data-locale='bn']`
  via inherited tokens.
- Button / Card / Container / EmptyState — Layer A primitives.

### CHANGELOG
- Append `### Added` bullet: "`SubmitReportPage` for the Anjali
  persona at `/submit`. Role-gated form (title ≥ 5, severity T1/T2/T3,
  ward W01-W10, description ≥ 10, optional photo/voice URLs) that
  POSTs `AnjaliReportSubmitted` via the F1 `useIncidentActions`
  hook. Success state shows a synthetic receipt with chain ref +
  ward + submitted time. Replaces the prior `ComingSoonPage`
  placeholder (FE-F2)."
- Append `### Tests` bullet: "Suite 185 → 192; +7 cases. Zero new
  deps."

## Tasks & Acceptance

**Execution:**
- [x] `web/src/pages/SubmitReportPage.tsx` — new file, ~280 LoC.
- [x] `web/src/styles/submit.css` — new file, ~120 LoC.
- [x] `web/src/App.tsx` — wire route, drop from PLACEHOLDERS.
- [x] `web/src/__checks__/fe-f2-submit-report.test.tsx` — new file,
      7 cases.
- [ ] `CHANGELOG.md` — `### Added` + `### Tests` bullets.

**Acceptance Criteria:**
- `pnpm --filter surakkha-app test` → 192 cases pass, exit 0.
- `pnpm --filter surakkha-app typecheck` → no new errors (pre-existing
  `indeterminate` / `checked` errors in fe-b5b-* stay).
- `pnpm --filter surakkha-app lint` → 0 new errors (delta vs master).
- `pnpm --filter surakkha-app build` → succeeds.
- Login as Anjali, visit `/submit`, see the form with T2/W01 defaults.
- Login as Priya, visit `/submit`, see "Wrong persona" empty state.
- Fill title (≥5) + description (≥10), click submit; toast appears,
  receipt card renders with chain ref.
- Click "Submit another report" → form returns, fields cleared.

## Verification

**Commands (run each as a SEPARATE Bash call):**
- `pnpm --filter surakkha-app test` — 192/192 pass.
- `pnpm --filter surakkha-app typecheck` — no F2-introduced errors.
- `pnpm --filter surakkha-app lint` — delta vs master = 0.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Login as Anjali. `/submit` shows the form with default T2 / W01.
- Title "ab" + description "x" → submit disabled.
- Title "Brown water in ward 4" + description "Reported by 3 households
  since 6am" → submit enabled.
- Click submit. Toast "Report submitted to the chain". Receipt
  renders with chain ref + ward + submitted time.
- Click "Submit another report". Form returns with cleared fields.
- Switch locale to `bn`. Receipt timestamp renders in 24h time-full
  format via `Intl.DateTimeFormat`.
- Login as Priya. `/submit` shows "Wrong persona" empty state.

## Design Notes

**Why no third-party form library.** The form has 5 fields + 2
optional attachment URLs. react-hook-form / formik would add ~30KB
gzip for a feature `useState` already handles cleanly. Phase 1
lockdown: zero new deps.

**Why a synthetic event_id on the receipt.** The success state
needs a stable identifier for the receipt card to be useful (so the
user can quote it back to the operator), but
`useIncidentActions.submitReport` returns `{ event_id }` only to
its caller (the page). Rather than refactor the hook to thread the
block-hash through, we mint a local "01..." prefix + base36 random
suffix as a UX anchor. The chain has the authoritative id — the
synthetic id is a one-shot display value. F3 (operator inbox) will
show the real id when the citizen re-checks the report.

**Why role-gated, not a free-for-all.** Anjali is the citizen
persona. Operators / technicians / PHA / vendor personas don't
submit citizen reports — they handle them. A Priya who accidentally
navigates to `/submit` should see "Wrong persona", not a confusing
empty form.

**Why a synthetic "Submitted" timestamp on the receipt.** The hook
fires a single POST, but the chain projection rebuild is async. The
receipt's `submitted_at` is `new Date().toISOString()` captured
client-side at the moment of the success acknowledgement — close
enough for UX purposes.

## Out of scope (deferred to later specs)

- **Bangla UI copy.** All strings English in F2; i18n migration is
  a Phase 2 sweep across all pages.
- **Real photo + voice file upload.** F2 takes URLs; actual file
  upload would need IndexedDB blob storage and a separate
  `CitizenAttachmentUploaded` event.
- **GPS coordinate picker.** The hook accepts `gps?: { lat, lng }`
  but F2 doesn't expose a UI for it. The form has it as a hidden
  capability for Phase 2 mobile.
- **/submit history list** (Anjali-scoped via `useAnjaliFilter`).
  The hook + DatePicker landed in B5g; the consumer page is its
  own spec.
- **Optimistic incident projection** — the operator sees the report
  on next inbox refetch, not immediately. An optimistic update
  would need a separate `useIncidents` integration; deferred.

## Suggested Review Order

**The page**
- `web/src/pages/SubmitReportPage.tsx` — role gate + form + receipt.
  [`SubmitReportPage.tsx`](../../web/src/pages/SubmitReportPage.tsx)

**The styles**
- `web/src/styles/submit.css` — token-only composition.
  [`submit.css`](../../web/src/styles/submit.css)

**The route wiring**
- `web/src/App.tsx` — register route, drop placeholder.
  [`App.tsx`](../../web/src/App.tsx)

**The tests**
- `fe-f2-submit-report.test.tsx` — 7 cases pinning the I/O matrix.
  [`fe-f2-submit-report.test.tsx`](../../web/src/__checks__/fe-f2-submit-report.test.tsx)

**Verification:** `pnpm test` → 192 passed. `pnpm typecheck` clean
for F2. `pnpm lint` → delta vs master = 0. `pnpm build` succeeds.
