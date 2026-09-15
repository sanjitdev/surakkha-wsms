# Operator Dashboard (Priya) — Spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 2
> **Spec author:** Saga/Freya — 2026-09-11

---

## Meta

- **Target file:** `web/src/pages/OperatorDashboard.tsx`
- **Source scenario:** [Scenario 01 — Priya's shift](../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md)
- **Lockdown binding:**
  - `docs/D-UX-Design/01-design-system-foundation.md` (full)
  - `docs/D-UX-Design/decisions/00-lockdown-audit.md` §F Tier 2 page impact
  - `docs/D-UX-Design/decisions/01-token-deconfliction-plan.md` (additive tokens)
  - `web/mockups/theme.css` (lockdown tokens section, additive)
- **Primary actor:** Priya (utility operator; pipeline pilot; action lane)
- **Secondary actors:** Adi's per-Priya verification-depth dashboard surfaces data this page emits; Karim sees the `Assigned` event this page's `+ New hotline report` and verify+assign actions author.
- **Sort contract (locked #1):** Priority-first, age-second.

---

## Existing implementation inventory

`OperatorDashboard.tsx` is a React port of `web/mockups/01-priya/dashboard.html`. It renders three layouts (A grid / B editorial / C status-board) toggled via `localStorage.surakkha.layout`, and three tabs (Overview / Sensors / Wards). It fetches `/api/incidents` via `useIncidents()`, `/api/sensors`, and `/api/events?limit=20`. It consumes `dashboard.css` and themed components (`.badge--t1/t2/t3`, `.kpi`, `.card`, `.top-chrome` via `AppLayout`). Severity badges use `--band-high/-medium/-low` and `var(--danger/warning/info)` directly. Charts are inline SVG. The page does NOT mount hotline intake trigger, chain-freshness sub-second indicator (it lives in AppLayout top-chrome), or reporter-badge chips.

## Scenario alignment

Per Scenario 01 locked decisions:

- **Locked #1** (priority-first / age-second sort) — currently sort is implicit (useIncidents order). Needs explicit priority sort.
- **Locked #2** (verify-and-assign single submit) — not on this page; this page is the inbox/queue ranker, not the detail.
- **Locked #3** (hotline intake path) — must mount a `+ New hotline report` button on top-chrome (action bar of this page).
- **Locked #7** (auto-routed tail collapsed chip) — currently absent. The page has no auto-routed chip in the top-right.
- **Locked #5** (InboxDetail three-column) — not on this page; this is the dashboard/queue ranker.

What this page MUST do per Scenario 01:

1. Render ranked inbox (`IncidentSummary` list), priority-first / age-second.
2. Mount `+ New hotline report` button in top-chrome action bar (Tier 1 spec mounts the modal — see `hotline-intake-modal.md`).
3. Render the **"needs me"** filter chip (default) and **"in flight"** filter chip.
4. Render the collapsed auto-routed-tail chip (count + "system handled, hide") in the top-right.
5. Render the chain-freshness sub-second indicator (already lives in `AppLayout` top-chrome; spec verifies presence, not duplicated here).
6. Render each row with: `BandPill` (glyph + text, lockdown §4.1), reporter-badge chip (anchor/hotline/webform/sensor — new dimension), missing-evidence chip set, age.
7. Quick-dismiss affordance for low-band rows (visible because next-sensor-readback timestamp shows).

## Lockdown binding

- **Foundation §1.1** — trust band palette (T1 divider / T2 amber / T3 alert-red-reserved / Resolved safe-green) **supersedes** current `--band-high/-medium/-low` semantics. Existing tokens stay during migration; new components reference `--color-trust-t*`.
- **Foundation §1.1** — reporter-badge palette (`--color-reporter-anchor/hotline/webform/sensor`) is a **new dimension** not in existing tokens; must be added to row rendering.
- **Foundation §4.1** — trust band badges are glyph + text (`◔ T1`, `◑ T2`, `● T3`, `✓ resolved`); current implementation uses Lucide-free badges but the text + colour-only treatment must move to glyph + text.
- **Foundation §4.2** — chain event icons on the "Today on chain" widget use the 27 approved Lucide icons. Current implementation uses inline text labels (no icons); this is OK but missing the icon.
- **Foundation §6.2** — reporter-badge add-on per `reporter_kind` (`⚓` anchor / `☎` hotline / `✎` webform / `📡` sensor) **paired with** the trust-band glyph.
- **DESIGN.md spine rule** — overrides any `theme.css` token name conflict.
- **Foundation §8.2** — operator motion patterns (5s live update with 100ms crossfade on changed cells; instant chain event mount; modal enter 200ms ease-out).
- **Foundation §10.2** — focus rings 2px solid `--color-primary-tint`. Current `dashboard.css` `.input:focus` uses `var(--brand-400)` — needs swap to primary-tint.
- **Foundation §10.3** — keyboard nav, j/k on lists optional but Tab order must match visual order.
- **Foundation §11** — i18n English + Bangla; Bangla-first surfaces deferred to operator toggle (this page is operator-mode, English-default but Bangla-toggleable).
- **Foundation §13** — chain-freshness sub-second projection lag is the design contract; AppLayout owns the pulse-dot; this page surfaces `incident_count` in the page-header subtitle as the "live data" cue.

## Reconciliation diff

| # | Existing | Spec (lockdown-bound) | Severity |
|---|----------|----------------------|----------|
| 1 | Page renders 3 layouts (A/B/C) via localStorage toggle | Keep as-is; A/B/C are layout-density variants, not lockdown-relevant | **OK** |
| 2 | Page renders 3 tabs (Overview/Sensors/Wards) | Keep tabs; tab semantics are operator-internal | **OK** |
| 3 | KPI row uses `--brand-*`, `--success`, `--warning` directly | Map `--brand-500` (CTA hover) to `--color-primary`; `--success` to `--color-safe-green`; `--warning` to `--color-amber` (additive — both systems coexist). Keep current renders for now | **MINOR** |
| 4 | Severity dot uses `var(--danger/warning/info)` per `severityColor()` | Map to lockdown palette: T3 → `--color-alert-red-reserved` (issuance path only — operator surface should map T3 to `--color-amber-bright` for large-UI dot, with caveat), T2 → `--color-amber`, T1 → `--color-trust-t1` divider neutral. The current `--danger` is reserved for issuance; flag T3 row uses for any non-issuance badge as MEDIUM migration | **MEDIUM** |
| 5 | `<span className="badge badge--t2">` for severity badge | Re-bind badge to `--color-trust-t2` + glyph `◑` + text "T2" per §4.1. Current `badge--t2` uses `--warning-bg/warning` (amber) — semantically close but lacks glyph | **MEDIUM** |
| 6 | No hotline intake trigger mounted | Add `+ New hotline report` button in page-header__row right side; mounts Tier 1 `HotlineIntakeModal` spec | **MAJOR** (new component mount) |
| 7 | No "needs me" / "in flight" filter chips | Add filter chip group above the inbox table; default = "needs me"; "in flight" hides pre-`IncidentClosed` rows | **MAJOR** (new component) |
| 8 | No collapsed auto-routed-tail chip | Add chip in top-right showing auto-routed count + tap-to-collapse affordance (locked #7) | **MAJOR** (new component) |
| 9 | No reporter-badge chip per row (anchor/hotline/webform/sensor) | Add per-row reporter-badge chip; consume `reporter_kind` from incident payload; use `--color-reporter-*` chip palette | **MAJOR** (new component, new dimension) |
| 10 | Trust band badge text + colour only (no glyph) | Add glyph `◔/◑/●/✓` adjacent to text label; consume lockdown §4.1 | **MEDIUM** |
| 11 | No missing-evidence chip set on row | Add `missing-evidence` chips on row when signals absent (Scenario 01 Screen 4 specifies; mirror to row-level for triage cue) | **MEDIUM** |
| 12 | Priority-first / age-second sort is implicit | Add explicit sort comparator: priority (T1→T3) then age (oldest first within priority) | **MINOR** (logic change, no UI change) |
| 13 | Donut chart uses `--band-high/-medium/-low` | Keep `--band-*` for now (additive); spec flags `MINOR` migration to `--color-trust-t1/2/3` in Phase 1.7 / 2.0 | **MINOR** |
| 14 | `.input:focus` uses `outline: 2px solid var(--brand-400)` | Swap to `outline: 2px solid var(--color-primary-tint)` per §10.2 | **MEDIUM** |
| 15 | Live data polled once via `useEffect` (mount-only) | Add 5s polling with 100ms crossfade on changed KPI cells per §8.2 (operator motion pattern) | **MAJOR** (state change, polling layer) |
| 16 | Chain-freshness pulse-dot in `AppLayout` top-chrome | OK — AppLayout owns it; spec just verifies presence | **OK** |
| 17 | Today-on-chain table renders event_type as text | Add Lucide icon from 27-approved set per §4.2 (e.g., `FilePlus`, `UserPlus`, `MapPin`) | **MINOR** |
| 18 | No quick-dismiss affordance for low-band rows | Add quick-dismiss button on rows where band = T1 with `next_sensor_readback_at` chip visible (locked #5 path) | **MAJOR** (new component) |
| 19 | Layout toggle reads `localStorage.surakkha.layout` | OK — keep | **OK** |
| 20 | Charts (24h trend, donut, ward ranking) use `--brand-500/--success/--warning/--band-*` | Map to `--color-primary` / `--color-safe-green` / `--color-amber` / `--color-trust-*` (additive) | **MINOR** |
| 21 | i18n keys under `operatorDashboard.*` namespace | Lockdown audit §F #36: namespaces already aligned. OK | **OK** |

## Spec for the lockdown-bound version

### Purpose

Priya's ranked inbox + dashboard. The page is her primary surface at shift start and during the day; it ranks work by priority-first / age-second (locked #1), mounts the hotline intake action, and presents KPIs / sensor fleet / chain activity / ward distribution as a single glanceable view.

### User journeys

1. **Shift start (calm arrival):** Loads ranked inbox, sees handover brief (held by Tier 1 spec), picks the top row, taps `+ New hotline report` to start a caller's report, dispatches Karim.
2. **Mid-shift:** Receives a new T2 escalation; it floats to the top of the ranked inbox regardless of age. She opens the row into `InboxDetail` and chooses Path A/B/C.
3. **Hotline call:** Caller on the line; she opens `+ New hotline report`, fills the modal, submits. The new incident lands at the bottom of T3 band (lowest priority) but won't outrank T2 work in flight.
4. **Quick-dismiss (low-band only):** A T1 sensor-flicker row arrives; she taps `Dismiss` with a one-line "why" reasoning; the chain records `DismissedBecause{}`.

### Layout (locked)

```
+-----------------------------------------------------------+
| AppLayout top-chrome (chain-freshness pulse, locale, role) |
+-----------------------------------------------------------+
| PAGE HEADER: title + subtitle (count · sensors)            |
| [layout toggle A·B·C]                  [+ New hotline]      |
+-----------------------------------------------------------+
| Tabs: Overview | Sensors | Wards                            |
+-----------------------------------------------------------+
| Layout A (default — dense grid):                           |
|  +--KPI row: active / pH / response / pending / notices-+  |
|  +--Sensors table (4 rows)-----+--Chain (6 rows)--------+  |
|  +--Threads (top 3 incidents)------------------------+    |
| Layout B (editorial): hero handover card + chain + KPI row  |
| Layout C (status-board): KPI strip + split-pane           |
+----------------------------------------------------------------+
| Needs-me | In-flight | Auto-routed (collapsed chip)            |
+----------------------------------------------------------------+
| Inbox table — ranked, priority-first / age-second:            |
|  band | reporter-chip | incident-id | ward | age | next-read  |
+----------------------------------------------------------------+
```

### Components

- `PageHeader` (foundation §3.1, dark text on warm surface)
- `LayoutToggle` (existing; A/B/C variants)
- `Tabs` (existing; Overview/Sensors/Wards)
- `KPICard` × 5 (KPI row)
- `Table` (existing shadcn primitive; `InboxRow`, `SensorRow`, `ChainEventRow`)
- `FilterChip` × 3 (needs-me / in-flight / auto-routed)
- `InboxRow` (per Scenario 01 Screen 2 row contract):
  - **Trust band pill:** `<span class="badge badge--band-{tier}">{glyph} {label}</span>` where `{glyph}` = `◔` / `◑` / `●` / `✓` and `{label}` = "T1" / "T2" / "T3" / "resolved".
  - **Reporter-badge chip:** `<span class="chip chip--reporter-{kind}"><ReporterIcon /> {label}</span>` — `Anchor` / `Phone` / `Edit` / `RadioTower` Lucide icons (foundation §4.1 reporter-badge add-on set).
  - **Incident id:** mono (foundation §2.1), copy-to-clipboard.
  - **Ward + block ref:** one line, mono for block hash.
  - **Age:** relative time (existing `useRelativeTime` hook).
  - **Next-sensor-readback chip:** small clock chip showing next scheduled readback (T1 rows; quick-dismiss affordance visible).
  - **Missing-evidence chip set:** rendered only when at least one signal is missing (Scenario 01 locked #5).
  - **Quick-dismiss button (T1 only):** opens structured reason dropdown.
- **Action bar:** `[+ New hotline report]` button (primary, deep teal); mounts `HotlineIntakeModal` (Tier 1 spec).

### State mapping

| State | Visible |
|-------|---------|
| **Loading** | First-paint empty (no spinner — foundation §8.4: sub-second = no spinner). |
| **Empty** | "No incidents in your queue" + handover-brief summary line. |
| **Error** | Inline error banner above KPI row; chain-freshness pulse-dot shifts to amber. |
| **Live** | 5s polled refresh (foundation §8.2). |
| **Hotline modal open** | Backdrop `rgba(15, 23, 42, 0.4)`, modal 640px, focus trap, ESC dismiss with confirm. |

### Wireframe (textual ASCII)

```
+--top-chrome----------------------------------------------------+
| SURAKKHA · ●chain-freshness-pulse    EN | বাংলা  Priya ▾ |
+----------------------------------------------------------------+

Operator Dashboard · 7 active incidents · 18 sensors online     [A·B·C]
                                                  [+ New hotline report]

[Overview] [Sensors] [Wards]

+--+--+--+--+--+
| 7|7.2|2.4|2 |1 |   <- KPI row
|act|pH |RT |sig|not|
+--+--+--+--+--+

+-Sensors-------------------+  +--Today on chain-----------+
| ● S-04 dhanmondi NTU 2.3  |  | 09:42 Assigned           |
| ● S-07 mirpur     CL 0.4  |  | 09:30 Verified            |
| ● S-12 uttara     pH  7.1 |  | 09:14 DiagnosisSubmitted  |
+---------------------------+  +--------------------------+

+-Top incidents (needs me)--------------------+
| ◑ T2  ⚓ Anjali · dhanmondi-3 · 14m · inc... |
| ◔ T1  ☎ hotline · mirpur-12 · 31m · inc... |
| ● T3  ⚓ Anjali · uttara-2  · 2m  · inc...  |
+--------------------------------------------+
```

### Empty / loading / error states

- **Loading:** Empty inbox cells; KPI row shows `—` placeholders (no spinner per §8.4).
- **Empty:** "No incidents ranked for you right now. Your auto-routed tail (3) is collapsed."
- **Error:** Banner above tabs: "Couldn't reach the chain. Showing cached data from 09:42."

### i18n

Namespace `operatorDashboard.*`. Keys per lockdown §11.4 (locale-at-container). Trust-band labels are localised plain language: `band.t1 = "not yet verified"` / `band.t2 = "verified"` / `band.t3 = "high priority"` / `band.resolved = "resolved"`. Reporter badges: `reporter.anchor = "anchor citizen"` / `reporter.hotline = "hotline call"` / `reporter.webform = "web report"` / `reporter.sensor = "sensor reading"`. Bangla strings per `06-data-formats-lockdown.md` Bangla pack.

### A11y

- Tab order: brand → nav → layout toggle → tabs → KPI cards → table rows → action button.
- Trust band badges emit `aria-label="Trust band T2, verified"` (spelled out per §10.4).
- Reporter-badge chips emit `aria-label="Reporter: anchor citizen"`.
- Chain event rows emit `aria-live="polite"` on the table container for live refresh announcements.
- Focus rings on every interactive element: 2px solid `--color-primary-tint` with 2px offset (foundation §10.2).
- Keyboard: `Tab` cycles; `Enter` on row opens `InboxDetail`; `?` opens help modal (foundation §10.3 chain-viewer convention, optional here).
- Reduced motion (`prefers-reduced-motion`): 5s polling continues but cell crossfade omitted (instant update) per §8.3.

### Implementation notes

- **`useIncidents()`** must return ranked order with explicit comparator (priority tier, then age). Add `priorityRank` + `ageMs` derived fields to `IncidentSummary` if absent.
- **Reporter-badge** requires `reporter_kind` field on incident payload. Add to type contract; default to `"webform"` if absent.
- **`+ New hotline report`** mounts Tier 1 `HotlineIntakeModal` (already spec'd in `hotline-intake-modal.md`). Page passes incident context pre-fill (`reported_at = now`, `reporter_kind = "hotline"`).
- **Auto-routed tail chip** fetches count from `/api/incidents?auto_routed=true&limit=0` (count only). Expand-to-list is Phase 1.x.
- **Quick-dismiss** writes `DismissedBecause{inc, reason}` to chain via `useIncidentActions().dismiss()`.
- **Polling layer:** 5s `setInterval` with `cancelled` flag pattern (matches existing `useEffect` shape).
- **Bangla numerals:** Not in scope for operator surface (foundation §11.2 Bangla-first is for Anjali-mobile and citizen-facing surfaces; operator toggle uses Bangla labels, not Bangla numerals).
- **Sub-second projection lag:** AppLayout owns the pulse-dot; this page does not duplicate the indicator. The KPI row's "live" feel comes from 5s polling per §8.2.

### Test scenarios

1. **Sort order:** With 7 incidents (2× T1, 3× T2, 2× T3) of varying ages, the inbox table renders T3 first by age, then T2 by age, then T1 by age.
2. **Hotline trigger:** `+ New hotline report` button opens modal; on submit, the new incident appears at the bottom of T3 band (lowest); chain event `IncidentCreated{source: hotline}` lands.
3. **Reporter-badge rendering:** An incident with `reporter_kind: anchor` shows `⚓ Anchor` chip; `hotline` shows `☎ Hotline`; `webform` shows `✎`; `sensor` shows `📡`.
4. **Auto-routed chip:** When `/api/incidents?auto_routed=true` returns count=3, the chip shows "Auto-routed (3) — system handled, hide"; tap dismisses.
5. **Quick-dismiss:** T1 row shows `Dismiss` button; tapping opens structured reason dropdown; submit writes `DismissedBecause` chain event and removes the row from inbox.
6. **Filter chips:** "In-flight" hides all rows without an active `Assigned` or later chain event; "Needs me" shows unranked + unassigned rows.
7. **Lockdown focus ring:** Tabbing through the page shows 2px deep-teal-tint (`#3F6E7C`) focus rings on every interactive element.
8. **Bangla toggle:** Locale switches to Bangla; trust-band labels and reporter-badge labels render Bangla strings; chain-event-type names stay English (foundation §11.5).

### Locked decisions (this spec)

- Trust band is **verification state**, not source attribute (foundation §1.1).
- Reporter-badge is **source attribute**, separate dimension (foundation §1.1).
- T1 = divider neutral (lowest verification), NOT a brand colour (foundation §1.1).
- T3 = alert-red-reserved ONLY when consumer-notice has been issued; otherwise row colour is amber-bright for the dot (foundation §1.3 carve-out for chart colour-coding, NOT for badges — badges per §4.1 use glyph + text only).
- Anchor reporter badge ≠ T1 (anchor is at any tier; anchor = source attribute).
- Hotline-sourced row default = T1 unverified + reporter-badge hotline chip (not T3).
- Sorted priority-first / age-second (Scenario 01 locked #1).
- `+ New hotline report` mounts Tier 1 modal (Scenario 01 locked #3).
- Auto-routed tail collapsed chip (Scenario 01 locked #7).
- Verify+assign single submit is on `InboxDetail`, not this page.
- No load spinner; 5s polled live data with cell crossfade (foundation §8.2, §8.4).

## Migration plan

| Order | Edit | Files | Effort |
|-------|------|-------|--------|
| 1 | Add lockdown tokens section to `theme.css` | `web/mockups/theme.css` | **S** (already done in Step 4) |
| 2 | Add `priorityRank` + `ageMs` derived fields to `IncidentSummary` | `web/src/types/domain.ts` | **S** |
| 3 | Add explicit sort comparator to `useIncidents()` | `web/src/hooks/useIncidents.ts` | **S** |
| 4 | Mount `+ New hotline report` button in page-header__row right side | `OperatorDashboard.tsx` | **S** |
| 5 | Wire button to Tier 1 `HotlineIntakeModal` import + state | `OperatorDashboard.tsx` | **M** |
| 6 | Add filter chip group (needs-me / in-flight / auto-routed) above inbox | `OperatorDashboard.tsx` + new CSS | **M** |
| 7 | Add reporter-badge chip column to `InboxRow` (consume `reporter_kind`) | `OperatorDashboard.tsx` | **M** |
| 8 | Re-bind trust band badge to glyph + text per §4.1 | `OperatorDashboard.tsx` + `dashboard.css` | **M** |
| 9 | Add `next_sensor_readback_at` chip + quick-dismiss button to T1 rows | `OperatorDashboard.tsx` | **M** |
| 10 | Add missing-evidence chip set column (consume `signals_state.missing[]`) | `OperatorDashboard.tsx` | **M** |
| 11 | Add 5s polling layer with 100ms crossfade on changed cells (foundation §8.2) | `OperatorDashboard.tsx` | **M** |
| 12 | Add Lucide icon column to "Today on chain" widget (foundation §4.2) | `OperatorDashboard.tsx` | **S** |
| 13 | Swap `.input:focus` colour to `--color-primary-tint` | `dashboard.css` | **S** |
| 14 | Map `--brand-500/--success/--warning` chart colours to lockdown tokens (additive) | `dashboard.css` | **S** |
| 15 | Add i18n keys for hotline modal trigger, filter chips, reporter badges, missing-evidence chips | `operatorDashboard.*` locales | **M** |
| 16 | Add `aria-label` strings on band badges and reporter chips | `OperatorDashboard.tsx` | **S** |
| 17 | (Phase 1.7) Migrate `--band-*` → `--color-trust-t*` in dashboard.css | `dashboard.css` | **L** |
| 18 | (Phase 2) Add stylelint rule for alert-red reservation | `stylelint.config.js` | **M** (out of Phase 4 scope) |

## Open questions

- **Q1:** Does the page own the KPI row's "live data" feel via polling, or does `AppLayout` provide a shared polling context? Defer to AppLayout contract review.
- **Q2:** Auto-routed-tail chip's count source — is it a separate API endpoint or a derived slice from `useIncidents()`? Defer to backend contract.
- **Q3:** Quick-dismiss on T1 rows — does it require operator role check (only Priya, not Karim or reporter)? Defer to auth contract; default = all operator roles can dismiss with reason.
- **Q4:** Layout toggle A/B/C persists in `localStorage.surakkha.layout` — does this need migration to `user_prefs.layout` in Phase 2? Defer.
- **Q5:** Reporter-badge chip placement — inline with band pill, or separate column? Spec chooses inline (compact row); defer to design review.
- **Q6:** Polling layer's stale-data handling — what if the user is mid-interaction when a poll refreshes? Defer to AppLayout's interaction-pause contract.
