# Field Incident Detail (Karim's three-section page) — Spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 2
> **Spec author:** Saga/Freya — 2026-09-11

---

## Meta

- **Target file:** `web/src/pages/FieldIncidentDetailPage.tsx`
- **Source scenario:** [Scenario 04 — Karim's shift](../C-UX-Scenarios/04-karim-the-technician-field-lane.md)
- **Lockdown binding:**
  - `docs/D-UX-Design/01-design-system-foundation.md` §1.1, §3.2, §4.1, §7, §8, §10, §11, §12
  - `docs/D-UX-Design/decisions/00-lockdown-audit.md` §F Tier 2 page impact
  - Tier 1 spec `per-incident-chain-segment.md` (read-only lineage view)
  - Scenario 02 spec (Adi's read-only post-resolution readback left rail — reused here)
- **Primary actor:** Karim (action lane; field; offline-tolerant)
- **Secondary actors:** Priya (assignment source); Adi (proof destination); Anjali (in-progress SMS receivers).
- **Locked decision anchor:** Scenario 04 locked #7 (proof bundle 5 fields), #8 (three-section page), #10 (reopen path with verbatim feedback), #11 (terse English copy).

## Existing implementation inventory

`FieldIncidentDetailPage.tsx` is a single-pane action page with a 5-step timeline (`assigned → onsite → diagnosis → fix → resolved`) and a morphing action panel that gates each step by the previous. Header carries priority pill + work-order ref (mono). Action panel renders one of four cards depending on current step: mark-arrived, submit-diagnosis, submit-fix, resolve. Reads `/api/events?limit=200` and filters client-side by `payload.incident_id`. Writes chain events via `useIncidentActions` (`techArrived`, `techDiagnosis`, `techFix`, `resolveIncident`). Does NOT implement three-section layout (operator reasoning + sensors + actions timeline), five-field proof bundle, reopen feedback panel, reporter-badge chip, or offline-tolerance.

## Scenario alignment

Per Scenario 04 locked decisions:

- **Locked #7** (proof bundle = 5 fields, fields 1–4 required) — currently single-form `submit-fix` form has 3 fields. Spec must add 5-field proof form (photo, materials, lab result, technician notes, completion time).
- **Locked #8** (three-section page: operator reasoning + original report + hotline info / sensors / actions timeline) — currently single-section with morphing action panel. Spec marks this as `MAJOR`.
- **Locked #10** (reopen path: `ProofInsufficient` verbatim feedback; same proof form, `reopened: true` flag) — currently absent. Spec marks as `MAJOR`.
- **Locked #5** (GPS-confirmed or manual `TechnicianArrived`) — currently single `Mark arrived` button. Spec marks as `MINOR` (already supports manual; add GPS-confirmed highlight).
- **Locked #3** (full offline mode) — currently no offline layer. Spec marks as `MAJOR`.

What this page MUST do:

1. Render three sections vertically stacked on mobile (per locked #8):
   - Section 1: operator reasoning + original report + hotline caller info
   - Section 2: pre-arrival sensor prep (mini-map + current readings + 24h trend)
   - Section 3: Karim's actions timeline (three-step: diagnosis / fix / proof)
2. Five-field proof form (load-bearing submission): photo + GPS confirmation + voice note + reasoning text + sensor readback reference (optional). Fields 1–4 required.
3. Trust band priority chip + reporter-badge chip on Section 1 header.
4. Priya's verification reasoning (verbatim) + path badge (A/B/C/D) on Section 1.
5. Pre-arrival sensor prep on Section 2 (cached snapshot when offline).
6. Actions timeline on Section 3 with three-step ladder; submit per step fires chain event (`DiagnosisSubmitted` / `FixSubmitted` / `ProofSubmitted`).
7. `REOPENED` chip + verbatim `ProofInsufficient` feedback panel at top of page when incident is a reopen (locked #10).
8. `TechnicianArrived` GPS-confirmed highlight when GPS within 50m of incident pin (locked #5).
9. Confirmation state after `ProofSubmitted`: three collapsed step summaries + "Proof submitted. Your role on this incident is complete." banner (locked #9).

## Lockdown binding

- **Foundation §1.1** — trust band + reporter-badge (two dimensions, both on Section 1 header).
- **Foundation §4.1** — trust band glyph + text; reporter-badge Lucide icon.
- **Foundation §3.2** — three-section vertically stacked on mobile is a single-column pattern (foundation §3.3 single-pane citizen pattern adapted for action-lane; not three-column operator pattern).
- **Foundation §7** — focus rings 2px primary-tint.
- **Foundation §8** — operator motion: step card expand 200ms ease-out; confirmation banner instant.
- **Foundation §10.3** — keyboard nav; tab order matches visual order.
- **Foundation §11** — i18n English + Bangla; operator-mode English-default.
- **Foundation §12 #2** — reporter-badge separate dimension; anchor/hotline/webform/sensor.
- **Foundation §12 #3** — glyph + text for trust band.
- **Foundation §12 #7** — reasoning capture structured; proof form's reasoning field is one of 5 structured fields (not freeform).
- **Foundation §12 #8** — override surface visible (read-only here; if `TrustBandOverridden` exists, Karim sees original band + override chip).
- **Scenario 04 §"Threading the handoff"** — assignment context pre-loaded (Priya's reasoning, original report, reporter context).
- **Scenario 04 §"Reopen path"** — `ProofInsufficient` verbatim, no translation.

## Reconciliation diff

| # | Existing | Spec (lockdown-bound) | Severity |
|---|----------|----------------------|----------|
| 1 | 5-step timeline (`assigned → onsite → diagnosis → fix → resolved`) | Replace with 3-step actions timeline (`diagnosis → fix → proof`); `resolved` step becomes confirmation banner only (queue-clears state per Scenario 04 locked #9) | **MAJOR** |
| 2 | Header: priority pill (P1/P2/P3) + work-order ref (mono) | Add trust-band glyph + text priority chip + reporter-badge chip + path badge (A/B/C/D) + incident id (mono, copy-to-clipboard) | **MEDIUM** |
| 3 | Section 1 absent (operator reasoning + original report + hotline info) | Add Section 1 with operator reasoning collapsed-by-default + original report (verbatim text + photo with EXIF strip + voice note playback) + hotline caller info (`Phone` chip + described symptom + ward + language preference) | **MAJOR** |
| 4 | Section 2 absent (pre-arrival sensor prep) | Add Section 2 with mini-map (incident pin + 3 nearest sensors with distance labels + polyline route suggestion) + current readings (NTU/conductivity/chlorine_residual per sensor, colour-coded against WHO thresholds) + 24h trend micro-chart + last-sync caption | **MAJOR** |
| 5 | Section 3: morphing action panel (mark-arrived / diagnosis / fix / resolve) | Section 3 = 3-step actions ladder. Step 1 (diagnosis): diagnosis summary text + photo + voice note optional + sensor reading observed optional. Step 2 (fix): fix description + photo + GPS confirmation + voice note optional + parts/materials. Step 3 (proof): 5-field form per locked #7 | **MAJOR** |
| 6 | `submit-diagnosis` form: diagnosis text + parts CSV | Step 1 form: diagnosis summary text (REQUIRED, ≥5 char) + photo of diagnosis (REQUIRED, camera-only, EXIF preserved) + voice note (optional, 30s max) + sensor reading observed (optional) | **MAJOR** |
| 7 | `submit-fix` form: fix summary + resolution note + photo URL | Step 2 form: fix description text (REQUIRED) + photo of fix-in-progress (REQUIRED, camera-only) + GPS confirmation (REQUIRED, auto-captured, within 50m warning) + voice note optional + parts/materials (optional) | **MAJOR** |
| 8 | `resolve` form: resolve note | Step 3 form = 5-field proof form per locked #7. Field 1: photo of fix (REQUIRED). Field 2: GPS confirmation (REQUIRED, auto-captured). Field 3: voice note (REQUIRED, ≥3s). Field 4: reasoning text (REQUIRED, ≥10 char, defaults to speech-to-text draft from field 3). Field 5: sensor readback reference (OPTIONAL) | **MAJOR** |
| 9 | No `REOPENED` panel at top of page | Add `REOPENED` chip + Adi's verbatim `ProofInsufficient` feedback panel at top of page when incident is a reopen (3 fields: missing / what-we-need / ETA expectation) | **MAJOR** |
| 10 | Diagnosis + Fix forms have photo via `photoUrl` input (URL field, not camera) | Replace with camera-only photo capture; EXIF preserved verbatim | **MAJOR** |
| 11 | `tech-job__priority--p1/p2/p3` CSS uses `--band-*` | Re-bind to trust-band tokens + glyph + text per §4.1 (additive migration) | **MEDIUM** |
| 12 | Submit button uses `--brand-500` | Swap to `--color-primary` + focus ring `--color-primary-tint` per §7.1 + §7.3 | **MEDIUM** |
| 13 | No GPS-confirmed highlight on `Mark arrived` | Add `useGeolocation()` 30s interval; when within 50m, button highlights within 3 sec | **MEDIUM** |
| 14 | No confirmation banner after `ProofSubmitted` | Add confirmation state: three collapsed step summaries + "Proof submitted. Your role on this incident is complete." banner (200ms ease-in) | **MEDIUM** |
| 15 | No chain-freshness sub-second indicator | AppLayout owns; spec verifies | **OK** |
| 16 | `useIncidentActions` events: `techArrived`, `techDiagnosis`, `techFix`, `resolveIncident` | Replace `resolveIncident` with `submitProof` (5-field form); keep others | **M** |
| 17 | No offline layer | Add offline-tolerant forms: photo/audio/GPS queue locally; sync on reconnect; `PENDING_SYNC` chip on each step's summary | **MAJOR** |
| 18 | No `TechnicianArrived` GPS-confirmed-or-manual gate | OK (manual already supported); add GPS highlight only | **MINOR** |
| 19 | Sidebar `field-thread-card` shows plain chain-event list | Render as `EventChain` per Tier 1 spec `per-incident-chain-segment.md` (operator mode, Karim's authorized window) | **MEDIUM** |
| 20 | i18n `fieldIncidentDetail.*` namespace | OK; aligned | **OK** |
| 21 | No aria-label on submit buttons | Add `aria-label="Submit proof bundle, five fields"` etc. | **S** |
| 22 | Form labels English-only | Operator-mode English-default; Bangla toggle renders Bangla labels | **OK** |
| 23 | `Mark arrived` button text "Mark arrived on site" | Shorten per Scenario 04 locked #11: "Mark arrived" | **MINOR** |
| 24 | Diagnosis submit button "Submit diagnosis" | OK | **OK** |
| 25 | Fix submit button "Submit fix" | OK | **OK** |
| 26 | Resolve submit button "Resolve (operator confirms)" | Replace with "Submit proof" (locked #7) | **MINOR** |

## Spec for the lockdown-bound version

### Purpose

Karim's on-site work surface. The page is where he diagnoses, fixes, and submits proof. Each step is a discrete chain event. The page is the load-bearing surface for Scenario 04 positive force +1 ("Karim's proof is reliably good") — the proof form structure + GPS confirmation + voice note + reasoning text + sensor readback make the proof reliably structured.

### User journeys

1. **New assignment:** Opens row from FieldQueuePage. Section 1 shows operator reasoning + original report + reporter context. Section 2 shows sensor prep (cached snapshot if offline). Section 3 step 1 (diagnosis) is expanded by default.
2. **On-site:** GPS detects within 50m; "Mark arrived" button highlights. Tap → `TechnicianArrived{gps_confirmed: true}`. Step 1 (diagnosis) form opens.
3. **Diagnosis submit:** Fills diagnosis summary text + camera photo + optional voice note. Tap "Submit diagnosis" → `DiagnosisSubmitted` fires. Step 1 collapses to summary; step 2 expands.
4. **Fix submit:** Fills fix description + camera photo + auto GPS confirms (warns if outside 50m but doesn't block). Tap "Submit fix" → `FixSubmitted` fires. Step 2 collapses; step 3 (proof) expands.
5. **Proof submit:** Fills 5 fields. Photo + GPS confirmation + voice note + reasoning text (defaults to STT from voice) + optional sensor readback. Tap "Submit proof" → `ProofSubmitted` fires. All three steps collapse; confirmation banner shows.
6. **Reopen:** Incident re-enters queue with `REOPENED` chip + Adi's verbatim feedback. Karim opens → `REOPENED` panel at top of page. He re-fills only what's missing in the proof form (Diagnosis and Fix sections greyed read-only). Submit fires `ProofSubmitted{...reopened: true}`.

### Layout (locked)

```
+--top-chrome----------------------------------------------------+
| SURAKKHA · ●chain-freshness-pulse    EN | বাংলা  Karim ▾       |
+----------------------------------------------------------------+
| PAGE HEADER: incident id (mono) · ◑T2 ⚓Anchor · path: C       |
|              dispatch time · due_at countdown                  |
+----------------------------------------------------------------+
| [REOPENED panel — only when reopen]                             |
|   Adi's feedback (verbatim):                                    |
|   Missing: GPS                                                 |
|   Need: re-take with confirmed GPS                             |
|   ETA: +15 min                                                 |
+----------------------------------------------------------------+
| SECTION 1: Operator reasoning + original report + hotline info |
|  - Priya's verification reasoning (collapsed) ▶                |
|  - Path badge: A / B / C / D                                   |
|  - Reporter context: Anjali (anchor) or Hotline (caller info)  |
|  - Original report: text + photo viewer with EXIF + voice note |
+----------------------------------------------------------------+
| SECTION 2: Pre-arrival sensor prep                              |
|  - Mini-map (incident pin + 3 nearest sensors + polyline)     |
|  - Current readings (NTU/conductivity/chlorine_residual)       |
|  - 24h trend micro-chart (NTU primary)                         |
|  - Last sync: HH:MM caption                                    |
+----------------------------------------------------------------+
| SECTION 3: Actions timeline (3 steps)                          |
|  Step 1 (diagnosis):  [Submitted HH:MM ✓] ▶ View chain event   |
|  Step 2 (fix):        [Submitted HH:MM ✓] ▶ View chain event   |
|  Step 3 (proof):      [Submitted HH:MM ✓] ▶ View chain event   |
|  OR current step expanded: form with required fields + submit  |
|  OR all collapsed: "Proof submitted. Your role is complete."   |
+----------------------------------------------------------------+
| EventChain right rail (Tier 1 spec per-incident-chain-segment) |
+----------------------------------------------------------------+
```

### Components

- `PageHeader` (incident id mono + trust-band chip + reporter-badge chip + path badge + due_at countdown)
- `ReopenPanel` (top of page when reopen; verbatim `ProofInsufficient` feedback)
- `Section1_OperatorContext` (Priya's reasoning + original report + reporter context)
- `Section2_SensorPrep` (mini-map + current readings + 24h trend micro-chart + last-sync caption)
- `Section3_ActionsTimeline` (3-step ladder; diagnosis / fix / proof)
  - `DiagnosisForm` (summary text + photo + voice note + sensor observed)
  - `FixForm` (description + photo + GPS confirmation + voice note + parts)
  - `ProofForm` (5 fields per locked #7)
  - `StepSummary` (collapsed view after submit; ▶ View chain event link)
  - `ConfirmationBanner` (after all 3 steps submitted)
- `EventChainRightRail` (Tier 1 spec)
- `MarkArrivedButton` (GPS-confirmed highlight when within 50m)

### State mapping

| State | Visible |
|-------|---------|
| Step 1 (diagnosis) | Step 1 form expanded; steps 2+3 greyed |
| Step 2 (fix) | Step 1 summary collapsed; step 2 form expanded; step 3 greyed |
| Step 3 (proof) | Steps 1+2 summaries collapsed; step 3 form expanded |
| All submitted | All 3 collapsed; confirmation banner |
| Reopen | `REOPENED` panel at top; steps 1+2 read-only summary; step 3 form re-opened |
| Offline | Forms accept input; submit writes to local queue; `PENDING_SYNC` chip on step summary; sensor prep shows cached snapshot |
| GPS-confirmed | `Mark arrived` button highlights within 3 sec when within 50m |

### Wireframe (textual ASCII)

```
+--top-chrome--chain-freshness-pulse--EN|বাংলা--Karim▾--+

← Back to queue
[◑ T2 verified] [⚓ Anchor Anjali] · inc_01HX... · dhanmondi-3
dispatched 09:14 · due in 16m · [path: C badge]

+-REOPENED panel (when reopen)----------------+
| ⚠ Reopen — Adi's feedback (verbatim):      |
|   Missing: GPS                             |
|   Need: re-take with confirmed GPS         |
|   ETA: +15 min                             |
+--------------------------------------------+

+-Section 1: Operator context-----------------+
| Priya's reasoning ▶ (collapsed)            |
| Path badge: C — hotline-sourced            |
| Reporter: Anjali (anchor) ⚓                |
| Original report: text + photo (EXIF) + 🔊  |
+--------------------------------------------+

+-Section 2: Sensor prep----------------------+
| Mini-map: ●pin · S-04 ↗240m · S-07 ↗480m  |
| Current: NTU 2.3 (✓) CL 0.4 (⚠)            |
| 24h trend (NTU)                            |
| Last sync: 09:42                           |
+--------------------------------------------+

+-Section 3: Actions timeline----------------+
| 1. Diagnosis  [Submitted 09:30 ✓] ▶ View  |
| 2. Fix         [Submitted 10:05 ✓] ▶ View  |
| 3. Proof       [Submit proof]              |
|                                             |
| Proof form (Step 3, expanded):             |
|  [1] Photo of the fix: [📷 Take photo]      |
|  [2] GPS: ✓ confirmed (within 50m)         |
|  [3] Voice note: [🎤 Record 30s]            |
|  [4] Reasoning: [textarea, STT draft...]   |
|  [5] Sensor readback: [optional manual]    |
|                                             |
| [Submit proof] (greyed until 1-4 present)  |
+--------------------------------------------+

EventChain right rail: (Tier 1 spec per-incident-chain-segment)
```

### Empty / loading / error states

- **Loading (chain read):** Skeleton row placeholders; no spinner per §8.4.
- **Offline:** Sensor prep shows cached snapshot with "Last sync: HH:MM" caption; form submissions queue locally; `PENDING_SYNC` chips appear on step summaries.
- **GPS warning (outside 50m):** "GPS outside 50m — fix submitted from N meters away. Submit anyway?" Soft warning, doesn't block; chip carries `gps_warning: true` on chain.
- **Sensor readback warning (still elevated):** "Sensor reading still elevated — re-check or escalate?" Soft warning with two paths: "Submit anyway with note" or "Mark for escalation".
- **Submit error:** Toast above submit; submit re-enabled.
- **Step 5 (escalation):** Routes to Adi via `EscalationTriggered` chain event; Karim's queue does not show escalation.

### i18n

Namespace `fieldIncidentDetail.*`. Operator-mode English-default per Scenario 04 locked #11. Bangla toggle renders Bangla labels. Chain event types stay English. Hash anchors stay English. Section headers + form labels localise.

### A11y

- Tab order: header → reopen panel (if present) → Section 1 (expandable reasoning) → Section 2 (mini-map + trend) → Section 3 (step ladder) → EventChain right rail.
- Trust band badge `aria-label="Trust band T2, verified"`.
- Reporter badge `aria-label="Reporter: anchor citizen"`.
- Path badge `aria-label="Verification path C, hotline-sourced"`.
- Step forms: each field labelled; required fields have asterisk + `aria-required="true"`.
- Submit buttons emit `aria-live="polite"` text changes during submit.
- Focus rings 2px primary-tint.
- Keyboard: `Tab` cycles; `Enter` submits focused step form; `v` triggers voice note; `?` opens help modal.
- Reduced motion: form expand transitions instant; confirmation banner instant.

### Implementation notes

- **Three-section layout:** CSS flexbox column on mobile (single-column under 1024px); optional 2-column on tablet+ (sections 1+2 left, section 3 right) — defer to Phase 1.x.
- **Step ladder state:** `step` state machine: `'assigned' | 'arrived' | 'diagnosis' | 'fix' | 'proof' | 'confirmed' | 'reopened'`. Reopen transitions to `'reopened'` which renders only Step 3 expanded and Steps 1+2 read-only.
- **Offline forms:** Each form's submit writes to IndexedDB queue (`pending_submissions` keyed by `actor_ref + step_name + local_timestamp`). On `online` event, sync layer fires gateway calls; on success, replace local id with chain block hash.
- **GPS confirmation:** `useGeolocation()` 30s interval while page open; when within 50m of incident pin, set `gps_confirmed_at` in local state; submit button reflects GPS state in payload (`gps_at_arrival?`).
- **Photo capture:** HTML `<input type="file" accept="image/*" capture="environment">`; EXIF preserved verbatim (no client-side re-encode); uploaded to gateway on sync.
- **Voice note:** `MediaRecorder` API; max 30s; STT server-side; STT draft fills reasoning field on Step 3.
- **Reasoning text default:** Step 3's reasoning field defaults to STT from Step 3's voice note; Karim edits before submit (≤280 char).
- **`Mark arrived` button highlight:** When GPS confirms within 50m, button background shifts to `--color-primary`; auto-reverts after 5 sec or on submit.
- **Reopen panel:** Reads `ProofInsufficient{reviewer: adi, missing, needed_by}` from chain; renders 3 fields verbatim.
- **Confirmation banner:** "Proof submitted. Your role on this incident is complete." rendered in primary action colour; fades in 200ms ease-out; persists until page navigation.
- **Per-step summary:** Each collapsed step shows "Submitted HH:MM · [reasoning one-line] · [photo thumb] · ▶ View chain event".

### Test scenarios

1. **Step 1 submit:** Diagnosis form has summary text + photo (camera-only) → submit → `DiagnosisSubmitted` chain event fires → step collapses to summary → step 2 expands.
2. **Step 2 submit:** Fix form has description + photo + GPS confirmed → submit → `FixSubmitted` fires → step collapses → step 3 expands.
3. **Step 3 (proof) submit:** 5 fields filled (photo, GPS, voice, reasoning, sensor optional) → submit → `ProofSubmitted` fires → all 3 collapsed → confirmation banner shows.
4. **Reopen path:** `REOPENED` chip + verbatim `ProofInsufficient` panel at top; steps 1+2 greyed read-only; step 3 form re-opened; submit fires `ProofSubmitted{...reopened: true}`.
5. **GPS-confirmed highlight:** Phone at incident pin → `Mark arrived` highlights within 3 sec → tap → `TechnicianArrived{gps_confirmed: true}` fires.
6. **Offline form submit:** Toggle offline → fill proof form → submit → writes to IndexedDB → `PENDING_SYNC` chip on step summary → reconnect → chip clears + chain block hash appears.
7. **Sensor readback warning:** Sensor reading still elevated → "Sensor reading still elevated — re-check or escalate?" → "Submit anyway with note" submits with `SensorReadbackFlagged: true` flag.
8. **GPS warning (outside 50m):** Phone 200m from pin → "GPS outside 50m" warning → submit anyway → `gps_warning: true` flag.
9. **Bangla toggle:** All section headers + form labels render Bangla; chain event types stay English.
10. **Lockdown focus rings:** Tab through page; every interactive shows 2px deep-teal-tint ring.
11. **Confirmation banner:** After all 3 steps submitted, banner renders "Proof submitted. Your role on this incident is complete." in primary action colour.
12. **Photo EXIF preservation:** Camera-only capture; EXIF preserved verbatim (verified via gateway log).
13. **Voice note STT:** Step 3 voice note records 30s → STT drafts reasoning field → Karim edits → submit.

### Locked decisions (this spec)

- Three-section page (operator reasoning + original report + hotline info / sensors / actions timeline) per locked #8.
- 5-field proof form per locked #7.
- Reopen path with verbatim `ProofInsufficient` feedback per locked #10.
- `ProofSubmitted{...reopened: true}` flag on reopens.
- Trust band priority chip = verification state tier (foundation §1.1, Scenario 04 locked #2).
- Reporter-badge = source attribute (anchor / hotline / webform / sensor), separate dimension.
- Full offline mode (Scenario 04 locked #3).
- Terse English copy (Scenario 04 locked #11).
- Path badge on Section 1 (A / B / C / D from Scenario 01 verification).
- `Mark arrived` GPS-confirmed highlight (locked #5).
- Queue clears after `ProofSubmitted` (locked #9).

## Migration plan

| Order | Edit | Files | Effort |
|-------|------|-------|--------|
| 1 | Restructure page to three sections | `FieldIncidentDetailPage.tsx` + new CSS | **L** |
| 2 | Replace 5-step ladder with 3-step ladder (diagnosis / fix / proof) | `FieldIncidentDetailPage.tsx` | **M** |
| 3 | Add Section 1 (operator reasoning + original report + hotline info) | `FieldIncidentDetailPage.tsx` | **L** |
| 4 | Add Section 2 (pre-arrival sensor prep — mini-map + readings + 24h trend + last-sync caption) | `FieldIncidentDetailPage.tsx` + new `MiniMap` + `TrendMicroChart` | **L** |
| 5 | Replace diagnosis form fields per Step 1 spec | `FieldIncidentDetailPage.tsx` | **M** |
| 6 | Replace fix form fields per Step 2 spec | `FieldIncidentDetailPage.tsx` | **M** |
| 7 | Replace resolve form with 5-field proof form per Step 3 spec | `FieldIncidentDetailPage.tsx` | **L** |
| 8 | Add `REOPENED` panel + verbatim `ProofInsufficient` feedback | `FieldIncidentDetailPage.tsx` | **M** |
| 9 | Add `MarkArrivedButton` with GPS-confirmed highlight | new `useGeolocation` + `FieldIncidentDetailPage.tsx` | **M** |
| 10 | Add offline-tolerant form layer (IndexedDB queue + sync) | new hooks + `FieldIncidentDetailPage.tsx` | **L** |
| 11 | Replace photo URL input with camera-only photo capture | `FieldIncidentDetailPage.tsx` | **M** |
| 12 | Add voice note capture (MediaRecorder API) + STT draft to reasoning field | new + `FieldIncidentDetailPage.tsx` | **L** |
| 13 | Add per-step summary collapsed view + `▶ View chain event` link | `FieldIncidentDetailPage.tsx` | **M** |
| 14 | Add confirmation banner after all 3 steps submitted | `FieldIncidentDetailPage.tsx` | **S** |
| 15 | Re-bind priority chip to trust-band glyph + text + reporter-badge chip | `FieldIncidentDetailPage.tsx` + `tech.css` | **M** |
| 16 | Add path badge to Section 1 header | `FieldIncidentDetailPage.tsx` | **S** |
| 17 | Swap submit button background to `--color-primary` + focus to primary-tint | CSS | **S** |
| 18 | Replace `field-thread-card` with `EventChainRightRail` (Tier 1 spec) | `FieldIncidentDetailPage.tsx` | **M** |
| 19 | Add i18n keys: 3 section headers, 3 form labels, reopen panel, GPS warning, sensor warning, confirmation banner | `fieldIncidentDetail.*` locales | **M** |
| 20 | Add aria-label strings + keyboard shortcuts | `FieldIncidentDetailPage.tsx` | **M** |
| 21 | Update `useIncidentActions` to add `submitProof` method; deprecate `resolveIncident` | `useIncidentActions.ts` | **M** |
| 22 | (Phase 1.7) Migrate `--band-*` → `--color-trust-*` | `tech.css` | **L** |

## Open questions

- **Q1:** Step 2 form's GPS confirmation — does it auto-capture from device GPS, or does Karim tap "Capture GPS" explicitly? Spec assumes auto-captured at submit (matches Scenario 04 locked #7). Confirm.
- **Q2:** Voice note STT — server-side or client-side? Spec assumes server-side; STT draft fills reasoning field on Step 3. Confirm with backend.
- **Q3:** Sensor readback reference (Step 3 field 5) — manual entry or auto-fetch from nearest sensor? Spec assumes manual entry (Karim reads it off the on-site display or his phone).
- **Q4:** Confirmation banner duration — persists until navigation, or auto-dismisses after 4 sec? Spec assumes persist-until-navigation (matches Scenario 04 locked #9 — "Your role on this incident is complete").
- **Q5:** Reopen panel — does it include `dispatched_back_to: karim` metadata from Adi's `ProofInsufficient` event? Spec assumes yes (verbose metadata).
- **Q6:** Photo EXIF preservation — verified via gateway log on sync; client-side doesn't re-encode. Spec assumes HTML `<input type="file" capture>` + gateway receives verbatim file.
- **Q7:** 2-column layout on tablet+ — Phase 1 ships single-column only (mobile-first per Scenario 04). Defer to Phase 1.x.
- **Q8:** Three-section page on desktop — does Section 3 + EventChain right rail compose as 2-column on ≥1280px viewport? Spec assumes mobile-first single-column; defer.
