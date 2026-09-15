# Inbox Detail (Priya's verification pane) — Spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 2
> **Spec author:** Saga/Freya — 2026-09-11

---

## Meta

- **Target file:** `web/src/pages/InboxDetail.tsx`
- **Source scenario:** [Scenario 01 — Priya's shift](../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md)
- **Lockdown binding:**
  - `docs/D-UX-Design/01-design-system-foundation.md` §1.1, §3.2, §4.1, §4.2, §10, §11, §13
  - `docs/D-UX-Design/decisions/00-lockdown-audit.md` §F Tier 2 + §E.2 (#18 T1 inversion)
  - Tier 1 spec `per-incident-chain-segment.md` (right-rail chain segment)
  - Tier 1 spec `hotline-intake-modal.md` (modal mounted here for inbound callers)
- **Primary actor:** Priya (action lane)
- **Secondary actors:** Karim (receives `Assigned`); Anjali (receives in-progress SMS); Pia (audit, deferred to Phase 2).
- **Locked decision anchor:** Scenario 01 locked #5 (three-column layout) + locked #6 (one submit, four events).

## Existing implementation inventory

`InboxDetail.tsx` is a 2-pane incident detail at `/inbox/:id`. Currently uses `container--bangla` (1080px) width with a left pane (col-span-7) showing the chain-event timeline for the incident, and a right pane (col-span-5) showing related (sibling) incidents by ward. Header carries `Assign field tech` (opens `AssignTechModal`) and `Request citizen ack →` (opens `RequestAckModal`) buttons. The page reads `/api/incidents` via `useIncidents()` and `/api/events?limit=200` (filtered client-side by `payload.incident_id`). It does **not** currently implement the three-column 240/flex/360 layout, structured per-decision reasoning capture, single-click verify+assign submit, or hotline reporter-badge chip.

## Scenario alignment

Per Scenario 01 Screen 4 + locked decisions:

- **Locked #5** (three-column InboxDetail layout: 240px InboxRail / flex DetailPane / 360px EventChain) — currently absent. Page is 2-pane 1080px-wide Bangla container; spec must transition to 3-column.
- **Locked #2** + **#6** (verify+assign single submit firing four downstream events) — currently two separate CTAs (AssignTechModal + RequestAckModal). Spec must collapse to one submit action that fires `Verified` + `Assigned` + `CitizenAckInProgress` + `TechnicianDispatched`.
- **Locked #4** (four verification paths A/B/C/D, each with structured reasoning field) — currently absent. Spec must introduce path picker + path-dependent reasoning fields.
- **Locked #3** (hotline intake first-class) — `+ New hotline report` mounts from dashboard; this page's right column carries the hotline reporter-badge chip on the detail pane when `reporter_kind = hotline`.

What this page MUST do:

1. Render the three-column layout (240px InboxRail / flex DetailPane / 360px EventChain) per foundation §3.2.
2. InboxRail: ranked incident list with band pill, reporter-badge chip, age, missing-evidence chips.
3. DetailPane (center): band pill, reporter badge, missing-evidence chips (left of center), five verification signal cards, photo viewer with EXIF strip, map showing incident + nearest sensor.
4. DetailPane (right): structured reasoning capture field (path-dependent), Karim picker, `due_at` picker, priority override dropdown, **Submit verify + assign** (primary), **Defer with callback** + **Escalate to Pia** (secondary, ghost).
5. Single-submit action fires four downstream events in one click.
6. Hotline-sourced incidents show reporter-badge hotline chip on detail pane header.
7. Override surface: any row with `TrustBandOverridden` event in segment shows "View override reasoning" affordance (foundation §12 #8).
8. Right rail (EventChain) renders the per-incident chain segment per Tier 1 spec `per-incident-chain-segment.md`.

## Lockdown binding

- **Foundation §1.1** — trust band (verification state) and reporter badge (source attribute) are **two dimensions**; render both on the detail header.
- **Foundation §3.2** — three-column 240/flex/360 ratios. **MAJOR** structural change to existing 2-pane layout.
- **Foundation §4.1** — trust band glyph + text (`◔/◑/●/✓` + "T1/T2/T3/resolved"); reporter-badge Lucide icon (`Anchor`/`Phone`/`Edit`/`RadioTower`).
- **Foundation §4.2** — chain event icons in the EventChain right rail use 27 approved Lucide icons.
- **Foundation §6** — radii preserved (`--radius-md` for cards, `--radius-sm` for hash anchor chips).
- **Foundation §7.3** — focus rings 2px primary-tint.
- **Foundation §7.4** — Badge component for trust band + reporter.
- **Foundation §8** — modal enter/exit 200ms ease-out (the path picker reveal pattern uses this).
- **Foundation §10.3** — keyboard nav; the page must respect Tab order matching visual order; `?` opens help modal.
- **Foundation §11** — i18n locale-at-container; trust band labels localised plain language; reporter badges localised; hash anchors NOT translated.
- **Foundation §12** — Reasoning capture is structured (severity / category / tags / reasoning text — never a single textarea for verification) — **binding** per §12 #7.
- **Foundation §12** — Override surface visible (any band with override chip shows "View override reasoning" affordance).
- **Foundation §12** — Single-click verification (operator recomputes hashes; <200ms).
- **Foundation §12** — Hotline-sourced first-class (reporter-badge chip `Phone`, no T3 colour default).

## Reconciliation diff

| # | Existing | Spec (lockdown-bound) | Severity |
|---|----------|----------------------|----------|
| 1 | `Container width={Bangla}` (1080px) 2-pane (col-7 + col-5) | Three-column 240/flex/360px per §3.2; new `<aside>` for InboxRail + `<main>` for DetailPane + `<aside>` for EventChain | **MAJOR** |
| 2 | Header shows severity badge (`badge--t1/t2/t3`) + status badge | Replace severity badge with trust band glyph + text per §4.1; add reporter-badge chip next to it | **MEDIUM** |
| 3 | Page header CTAs: "Assign field tech" + "Request citizen ack →" (two separate modals) | Collapse to one primary submit "Verify + Assign" that fires `Verified` + `Assigned` + Anjali in-progress signal + Karim dispatch in one action (locked #2 + #6) | **MAJOR** |
| 4 | `AssignTechModal`: tech picker + priority (P1/P2/P3) + ETA + work-order summary | Move tech picker + `due_at` + priority-override into DetailPane right column (no modal); drop the work-order summary textarea (covered by structured reasoning field) | **MAJOR** |
| 5 | `RequestAckModal`: channel + summary | Remove entirely; the Anjali in-progress signal is fired automatically on submit (locked #6 #3) | **MAJOR** |
| 6 | Left pane (`col-7`) shows chain-event timeline for incident | This pane moves to the **right rail** (EventChain, 360px); left becomes the InboxRail with ranked incident list | **MAJOR** |
| 7 | Right pane (`col-5`) shows related (sibling) incidents by ward | This pane moves to the **center** (DetailPane); content changes from siblings to the verification surface (band + reporter + 5 signal cards + photo + map + structured reasoning + submit) | **MAJOR** |
| 8 | No path picker (A/B/C/D) | Add path picker (4 options, radio group); each path gates the structured reasoning field shape | **MAJOR** |
| 9 | No structured reasoning capture | Add path-dependent reasoning fields: Path A (1 line free-text); Path B (3 structured: missing / what-else-says / why-anyway); Path C (4 structured: caller-said / asked-answered / asked-unanswered / why-trust); Path D (1 structured: reason + picker: callback-time OR escalation-path-template) | **MAJOR** |
| 10 | Missing-evidence chips absent | Add top-of-DetailPane callout showing missing signals as chips (reporter-not-reached / sensor-offline / photo-low-quality / no-photo / no-reputation / cluster-pending); elevate from inline row to top-of-screen (Scenario 01 locked #5) | **MEDIUM** |
| 11 | 5 verification signal cards absent | Add Sensor cross-check / Photo+EXIF / Reporter-call outcome / Reporter reputation lookup / Cluster-window corroboration — each renders present/missing/ambiguous | **MAJOR** |
| 12 | Photo viewer with EXIF strip absent | Add photo viewer with EXIF overlay (camera, lens, ISO, shutter, GPS, timestamp); verbatim image, no re-encode | **MAJOR** |
| 13 | Map showing incident + nearest sensor absent | Add mini-map (OpenStreetMap tiles per lockdown C-16); pin = incident location; secondary pins = nearest 3 sensors with distance labels | **MAJOR** |
| 14 | No hotline reporter-badge chip on detail pane | Add `<ReporterBadge kind="hotline" />` to detail pane header when `incident.reporter_kind === "hotline"` | **MINOR** |
| 15 | No override surface ("View override reasoning") | Right rail scans for `TrustBandOverridden` events; if any, show "View override reasoning" affordance at top of EventChain that expands to the event payload | **MEDIUM** |
| 16 | No single-click independent verification | Right rail per-row carries a "Verify" button; clicking recomputes hash locally and shows pass/fail badge in <200ms (foundation §12 #10) | **MEDIUM** (per-row), **MAJOR** if not yet shipped (verify against existing tier 1 spec `per-incident-chain-segment.md`) |
| 17 | Hash anchors rendered as mono `e.block_hash` truncate | Use IBM Plex Mono per foundation §2.1 (`--font-family-mono`); copy-to-clipboard on click | **MINOR** |
| 18 | Actor display rendered as `e.actor_identity?.display` | Render actor name + role chip per Scenario 06 use case ("Priya (operator)"); `role` field on chain event | **MINOR** |
| 19 | `Related incidents` (sibling) section removed in 3-column layout | Remove; sibling navigation is not load-bearing on this surface; defer to inbox rail | **MINOR** |
| 20 | Submit button uses `--brand-500` background | Swap to `--color-primary` per §7.1 + focus ring to `--color-primary-tint` per §7.3 | **MEDIUM** |
| 21 | No `priority-override` dropdown | Add dropdown (P1/P2/P3 with default from pre-triage reasoning); pre-filled from `priority` field on incident | **MINOR** |
| 22 | `due_at` picker absent | Add `due_at` time picker (defaults to dispatched standard SLA, e.g., +30 min); required for submit | **MINOR** |
| 23 | Karim picker is a select with `TECH_ROSTER` hardcoded | OK for demo; spec marks as MIGRATION candidate when `useTechnicians()` hook ships | **MINOR** |
| 24 | Container width `Bangla` (1080px) | New layout uses 3-column from container--wide (1280px); InboxRail fixed 240px; DetailPane flex; EventChain 360px (collapsible) | **MAJOR** |
| 25 | No ESC dismiss for modals (modal never opened in new design) | N/A — modals removed in favour of inline form | **OK** (resolved by structure change) |
| 26 | No keyboard shortcuts (`v` for verify, `a` for anomaly ack per §10.3) | Add keyboard shortcuts: `v` triggers verify on focused row; `?` opens help modal; `j/k` navigate InboxRail | **MEDIUM** |
| 27 | i18n under `inboxDetail.*` namespace | OK; spec aligns with Tier 1 chain-segment namespace `chain.operator.*` | **OK** |

## Spec for the lockdown-bound version

### Purpose

Priya's single-decision surface for verify-and-assign. Each row open is a 30-second decision: read center, pick path, fill structured reasoning, submit once. The page is the load-bearing surface for Scenario 01's positive force +2 ("Verification that's decisive").

### User journeys

1. **Path A (decisive, all signals present):** Opens row → sees all 5 signal cards green. Path picker default = A. Right column shows one-line free-text reasoning field. Karim picker + due_at + submit. One click, four downstream events fire.
2. **Path B (ambiguous, 1–2 signals missing):** Opens row → top-of-DetailPane callout shows missing signals as chips (e.g., `reporter-not-reached`). Path picker switches to B (or auto-suggests). Right column shows 3 structured fields: missing / what-else-says / why-anyway. Submit anyway because "why-anyway" carries defence.
3. **Path C (hotline-sourced):** Row's reporter-badge chip is `Phone Hotline`. Top-of-screen callout: "Hotline-sourced report — heaviest reasoning weight." 4 structured fields: caller-said / asked-answered / asked-unanswered / why-trust. Submit fires same four events.
4. **Path D (defer/escalate):** Path picker = D. Right column shows reason field + picker (callback-time OR escalation-path-template). Submit fires `DeferRequested` or `EscalatedToPia` instead of verify+assign.

### Layout (locked)

```
+--top-chrome----------------------------------------------------+
| SURAKKHA · ●chain-freshness-pulse    EN | বাংলা  Priya ▾       |
+----------------------------------------------------------------+
| PAGE HEADER: incident id · band glyph+text · reporter-badge   |
|              path picker (A·B·C·D)                             |
+----------------------------------------------------------------+
| 240px     | flex                  | 360px (collapsible)        |
| InboxRail | DetailPane            | EventChain                |
|           |                       |                            |
| ranked    | - 5 signal cards      | per-incident segment      |
| incident  | - photo viewer+EXIF   | (Tier 1 spec)             |
| list,     | - mini-map            |                            |
| priority- | - missing-evidence    | TrustBandOverridden        |
| first,    |   chips (top callout) | row → "View override       |
| age-      | - path picker         |  reasoning" affordance     |
| second    | - structured          | Single-click verify per    |
|           |   reasoning fields    | row                        |
|           | - Karim picker        |                            |
|           | - due_at picker       |                            |
|           | - priority override   |                            |
|           | - [Submit verify+     |                            |
|           |    assign] PRIMARY    |                            |
|           | - [Defer callback]    |                            |
|           | - [Escalate Pia]      |                            |
|           |   (ghost secondary)   |                            |
+-----------+-----------------------+----------------------------+
```

### Components

- `InboxRail` (240px fixed; ranked list; each row = `InboxRow` from dashboard spec)
- `DetailPane` (flex; detail surface)
  - `PathPicker` (radio group A/B/C/D)
  - `MissingEvidenceCallout` (top-of-pane; only when at least one signal missing)
  - 5 × `SignalCard` (Sensor cross-check / Photo+EXIF / Reporter-call / Reporter reputation / Cluster-window)
  - `PhotoViewerWithExif` (verbatim image; EXIF strip overlay)
  - `MiniMap` (incident pin + 3 nearest sensor pins + distance labels)
  - `ReasoningCapture` (path-dependent shape; component switches form fields by path)
  - `KarimPicker` (dropdown of field technicians; default = current top-of-queue)
  - `DueAtPicker` (time picker; default +30 min)
  - `PriorityOverride` (dropdown P1/P2/P3; default from pre-triage)
  - `SubmitVerifyAssign` (primary button; one click fires 4 events)
  - `DeferCallback` (ghost button; opens `DeferOrEscalateDialog`)
  - `EscalateToPia` (ghost button; opens `DeferOrEscalateDialog`)
- `EventChain` (360px; right rail; renders Tier 1 spec `per-incident-chain-segment.md` per-incident segment for this incident)
  - Includes "View override reasoning" affordance when `TrustBandOverridden` events present
  - Includes single-click verify per row
  - Collapse affordance (right rail collapses to give DetailPane full width)

### State mapping

| State | Visible |
|-------|---------|
| Loading (chain read) | DetailPane shows skeleton (5 card placeholders, no spinner per §8.4); InboxRail empty |
| Empty incident | "Incident not found" page (existing behaviour; OK) |
| Path = A | 1-line reasoning field visible; missing-evidence chips = none |
| Path = B | 3 structured fields; missing-evidence chips at top |
| Path = C | 4 structured fields; "hotline-sourced" callout at top |
| Path = D | Reason + picker (callback OR escalation-template); "verify+assign" button becomes alt-secondary |
| All inputs present | Submit enabled |
| Submitting | Submit button text = "Verifying & assigning…"; disabled; chain-freshness pulse-dot shifts to amber |
| Success | Toast "Verified + assigned to Karim ✅" (200ms green pulse; role=status; hover-pause; DURATION_MS=4000); row moves to "in flight" filter on dashboard |
| Error | Toast "Couldn't seal the chain event — retry?"; submit re-enabled |

### Wireframe (textual ASCII)

```
+--top-chrome--chain-freshness-pulse--EN|বাংলা--Priya▾---+

← Back to inbox
[◑ T2 verified] [⚓ Anchor] · dhanmondi-3 · inc_01HX... · 14m

+-InboxRail--+-DetailPane---------------------+-EventChain--+
| ◑ T2 ⚓Anj | Top callout: missing        | ev 09:42  |
|   dm-3    |   [reporter-not-reached]    | Verified   |
| ◔ T1 ☎Hot |   [photo-low-quality]       |   Priya    |
|   mir-12  |                             |   [verify] |
| ● T3 ⚓Anj | Path picker:                | ev 09:30  |
|   utt-2   |  ○A  ◉B  ○C  ○D              | Assigned   |
| ◑ T2 ⚓Anj |                             |   Karim    |
|   dm-7    | 5 Signal cards:             |   [verify] |
| ◔ T1 ✎Web |  [Sensor ✓] [Photo ~]       | ev 09:14  |
|   utt-5   |  [Call ✗] [Rep ✓] [Clu ✓]  | Diagnosis  |
| ◑ T2 ⚓Anj |                             |   Karim    |
|   mir-3   | Reasoning (Path B):         |            |
|           |  * What's missing: ...      | TrustBand  |
|           |  * What else says: ...      | Overridden  |
|           |  * Why anyway: ...          |  [View]     |
|           |                             |            |
|           | Karim: [Karim Hossain ▾]    |             |
|           | due_at: [10:15]            |             |
|           | priority: [P2 ▾]            |             |
|           |                             |             |
|           | [Submit verify+assign]     |             |
|           | [Defer callback]  [Escalate]|             |
+-----------+-----------------------------+------------+
```

### Empty / loading / error states

- **Loading:** Skeleton row placeholders (5 cards on DetailPane; 6 rows on InboxRail); no spinner.
- **Empty incident id:** "Incident not found — back to inbox."
- **Chain read error:** Banner at top of DetailPane: "Couldn't read the chain segment. Showing cached snapshot from 09:42. Retry?"
- **Submit error:** Toast above submit button; submit re-enabled.

### i18n

Namespaces: `inboxDetail.*` (page-level), `chain.operator.*` (right rail, aligned with Tier 1 spec). Trust band labels localised plain language. Reporter-badge labels localised. Path picker labels localised (A: decisive / B: ambiguous / C: hotline-sourced / D: defer-or-escalate). Hash anchors NOT translated. `due_at` time format uses `useDateFormatter` with locale; Bangla toggle renders Bangla labels (numbers stay Latin in operator mode).

### A11y

- Tab order: InboxRail (top-down) → DetailPane (path picker → signal cards → reasoning fields → Karim picker → due_at → priority → submit → defer → escalate) → EventChain (top-down).
- Path picker: radio group with `aria-label="Verification path"`.
- Reasoning fields: each labelled; required fields have asterisk + `aria-required="true"`.
- Trust band badge: `aria-label="Trust band T2, verified"` (spelled out).
- Reporter badge: `aria-label="Reporter: anchor citizen"`.
- Submit button: `aria-live="polite"` text changes during submit.
- Focus rings 2px primary-tint on every interactive.
- Keyboard: `Tab` cycles; `j/k` InboxRail; `v` triggers verify on focused row; `?` help modal.
- Reduced motion: 200ms modal/transition skip; toast pulse omitted.

### Implementation notes

- **Three-column layout:** Use CSS grid `grid-template-columns: 240px 1fr 360px;` inside `container--wide`. Right rail collapses via state toggle.
- **Reasoning field shape switcher:** Single `<ReasoningCapture path={path} />` component; emits field set keyed by path. The submit validator gates required fields per path.
- **Submit action:** Calls `actions.verifyAndAssign(...)` which fires 4 chain events via the gateway. Single submit = 4 events. Backend contract: gateway endpoint `POST /api/incidents/:id/verify-and-assign` accepts `{path, reasoning, signals_state, technician_id, due_at, priority_override?}` and emits the 4 events.
- **Path C heuristic:** When `incident.reporter_kind === "hotline"`, default path picker = C; top-of-screen callout auto-shows.
- **Hotline reporter-badge:** `<ReporterBadge kind="hotline" />` component (shared with dashboard spec).
- **EventChain right rail:** Imports Tier 1 `PerIncidentChainSegment` component per `per-incident-chain-segment.md`.
- **Override affordance:** `View override reasoning` button expands the `TrustBandOverridden` event row's payload in-place.
- **Keyboard shortcuts:** `useHotkeys` hook (foundation §10.3 convention).
- **Single-click verify:** Reuse from Tier 1 chain-segment spec.
- **Reuse `useIncidentActions`** for the new `verifyAndAssign`, `defer`, `escalate` methods (add to hook).
- **`+ New hotline report`** is mounted on OperatorDashboard, not here.

### Test scenarios

1. **Path A submit:** All signals present → path picker = A → 1-line reasoning → submit → 4 events land on chain → toast ✅ → row moves to in-flight.
2. **Path B submit:** 1 signal missing → top-of-pane callout shows missing chip → path = B → 3 fields filled → submit → same 4 events land → reasoning captured.
3. **Path C hotline:** Reporter-badge = `Phone Hotline` → top callout = "Hotline-sourced" → 4 fields filled → submit → same 4 events.
4. **Path D defer:** Path = D → reason + callback-time picker → submit fires `DeferRequested` (not verify+assign).
5. **Path D escalate:** Path = D → reason + escalation-path-template picker (`WASA specialist` etc.) → submit fires `EscalatedToPia`.
6. **Override affordance:** Right rail shows `TrustBandOverridden` event → tap "View override reasoning" → expands payload (from + to band + reason_category + free_text).
7. **Single-click verify:** Right rail row `Verify` button → local hash recomputation → pass badge within 200ms.
8. **Lockdown focus rings:** Tab through page; every interactive shows 2px deep-teal-tint ring.
9. **Three-column layout resize:** Browser 1024px wide → right rail collapses; 768px wide → InboxRail collapses to drawer (Phase 1.x).
10. **Bangla toggle:** All labels + path picker + reasoning field labels render Bangla; hash anchors + chain event types stay English.
11. **Keyboard nav:** `j/k` InboxRail focus cycles rows; `v` verifies focused row; `?` opens help modal.
12. **Reduced motion:** Toast pulse omitted; transitions instant; submit button still shows busy state.

### Locked decisions (this spec)

- Three-column 240/flex/360px per foundation §3.2.
- Single Submit verify+assign action fires `Verified` + `Assigned` + Anjali in-progress signal + Karim dispatch (locked #2 + #6).
- Four paths (A/B/C/D) — never one-size-fits-all (locked #4).
- Reasoning capture is structured, not freeform (foundation §12 #7).
- Override surface visible (foundation §12 #8).
- Hotline-sourced first-class (reporter-badge chip + Path C default).
- EventChain right rail from Tier 1 spec `per-incident-chain-segment.md`.
- Single-click independent verification on every EventChain row (foundation §12 #10).

## Migration plan

| Order | Edit | Files | Effort |
|-------|------|-------|--------|
| 1 | Restructure layout to 3-column grid (240/flex/360) | `InboxDetail.tsx` + `dashboard.css` / new `inbox-detail.css` | **L** |
| 2 | Move chain-event timeline from left pane to new EventChain right rail | `InboxDetail.tsx` | **M** |
| 3 | Move sibling-incidents list to InboxRail (or remove; defer to dashboard) | `InboxDetail.tsx` | **S** |
| 4 | Replace `AssignTechModal` + `RequestAckModal` with inline detail-pane form | `InboxDetail.tsx` (delete modals) | **M** |
| 5 | Add PathPicker + 4 reasoning-field shape variants | `InboxDetail.tsx` + new `ReasoningCapture` component | **L** |
| 6 | Add 5 SignalCard components | new file + integration | **L** |
| 7 | Add PhotoViewerWithExif (verbatim image + EXIF strip) | new file | **M** |
| 8 | Add MiniMap (OpenStreetMap; incident pin + 3 nearest sensors) | new file (Leaflet integration) | **L** |
| 9 | Add MissingEvidenceCallout (top-of-pane) | `InboxDetail.tsx` | **S** |
| 10 | Add ReporterBadge component on detail pane header (hotline/anchor/etc.) | `InboxDetail.tsx` + shared component | **S** |
| 11 | Wire single Submit verify+assign action → 4 events | `useIncidentActions.ts` + `InboxDetail.tsx` | **L** |
| 12 | Add KarimPicker + DueAtPicker + PriorityOverride (inline) | `InboxDetail.tsx` | **M** |
| 13 | Reuse Tier 1 EventChain right rail (`PerIncidentChainSegment`) | `InboxDetail.tsx` (import) | **M** |
| 14 | Add "View override reasoning" affordance | `InboxDetail.tsx` (right rail integration) | **S** |
| 15 | Re-bind trust band + reporter badges to lockdown tokens + glyph + text | `InboxDetail.tsx` + CSS | **M** |
| 16 | Swap submit button background to `--color-primary` + focus to primary-tint | CSS | **S** |
| 17 | Add i18n keys: paths A/B/C/D, reasoning field labels, signal cards, submit states | `inboxDetail.*` + `chain.operator.*` locales | **M** |
| 18 | Add aria-label strings + keyboard shortcuts | `InboxDetail.tsx` | **M** |
| 19 | (Phase 1.7) Migrate `--band-*` → `--color-trust-*` | `dashboard.css` | **L** |

## Open questions

- **Q1:** Does the single submit action call a single gateway endpoint `POST /api/incidents/:id/verify-and-assign` (transactional), or does it fire 4 separate events client-side? Defer to backend contract review; spec assumes single gateway endpoint for atomicity.
- **Q2:** Path D's escalation-path-template list (`WASA specialist` / `PHA on call` / `councillor` / `lab`) — is this a fixed enum or populated from prior incidents per Scenario 02? Defer; spec assumes enum for Phase 1, future Phase pulls from history.
- **Q3:** When the 4 events fire and Anjali's phone is offline, does the SMS still queue (Goal 3 in-progress beat)? Defer to SMS gateway contract.
- **Q4:** Single-click verify in the right rail — does it run a full-segment hash recomputation or only the row's hash? Tier 1 spec defines row-level; spec follows.
- **Q5:** Right rail collapse to give DetailPane full width — what is the breakpoint trigger? Spec defers to AppLayout contract (likely 1024px).
- **Q6:** Defer with callback — when does the row re-surface to top of ranked inbox? At `callback_at`. Backend contract.
- **Q7:** Escalate to Pia — Phase 1 has no Pia surface; the escalation routes to a Phase 1 monitoring log. Confirm with product.
