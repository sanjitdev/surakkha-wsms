# WO-004 — Operator Dashboard

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.2 — Tier 2 (load-bearing).
> Date: 2026-09-15

---

## Objective

Reconcile the existing `OperatorDashboard.tsx` (1,362 LOC) with the lockdown-bound spec. Three-layout toggle (A/B/C) collapses to status-board grid only; trust-band glyph+text pattern; reporter-badge as separate dimension; mount hotline intake trigger; explicit priority-first / age-second sort.

## Scope

**In:**
- Reconcile `web/src/pages/OperatorDashboard.tsx` to spec lockdown binding
- Drop the three-layout (A/B/C) toggle; keep only the status-board grid
- Sort: priority-first / age-second (locked #1)
- Trust band: glyph + text (`◔ T1`, `◑ T2`, `● T3`, `✓ resolved`) per foundation §4.1
- Reporter-badge chip per row (`⚓` anchor / `☎` hotline / `✎` webform / `📡` sensor) per §6.2
- Mount `+ New hotline report` button in top-chrome action bar (opens `HotlineIntakeModal` from WO-002)
- Render "needs me" filter chip (default) + "in flight" filter chip
- Render collapsed auto-routed-tail chip (count + "system handled, hide") top-right
- Quick-dismiss affordance for low-band rows
- Focus rings swap from `var(--brand-400)` to `var(--color-primary-tint)` per §10.2
- Tab order matches visual order per §10.3
- Operator-mode locale: English-default but Bangla-toggleable

**Out:**
- Chain-freshness sub-second indicator (lives in AppLayout top-chrome, not duplicated here)
- Filter chip persistence in URL (deferred)
- Three-tab layout (Overview / Sensors / Wards) collapse to status-board only — sensor/ward widgets move to dedicated routes (Phase 1.7+)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/operator-dashboard.md`
- **Scenario:** `docs/C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md` (Screen 1)
- **Lockdown:** `_bmad-output/design/01-color-lockdown.md`, foundation §1.1, §4.1, §6.2, §8.2, §10.2, §10.3, §11, §13
- **Master PRD:** `docs/E-Development/000-PRD.md` §3, §8, §9

## Acceptance criteria

1. Page renders at `/dashboard` for `utility_operator`
2. Layout choice collapsed to status-board grid (A/B/C toggle removed)
3. Sort is priority-first / age-second (P1 > P2 > P3 > P4, then ascending age)
4. Each row shows: BandPill (glyph + text) + reporter-badge chip + age + missing-evidence chips
5. Hotline trigger button mounts in top-chrome action bar; opens `HotlineIntakeModal` on click
6. Auto-routed-tail chip renders collapsed with count + "system handled, hide" affordance
7. "needs me" (default) and "in flight" filter chips function
8. Quick-dismiss affordance visible on low-band rows; emits appropriate event
9. Focus rings use `--color-primary-tint`
10. Tab order matches visual order
11. English-default; Bangla toggle works; preference persists per session
12. No Hindi strings anywhere

## UI rules

- **Area Labels:**
  - `operator-dashboard-page`, `…-header`, `…-main`
  - `operator-dashboard-action-bar` (top-chrome)
  - `operator-dashboard-button-log-hotline-call`
  - `operator-dashboard-filter-chips`, `…-chip-needs-me`, `…-chip-in-flight`
  - `operator-dashboard-auto-routed-tail-chip`
  - `operator-dashboard-incident-list`, `…-row`
  - `operator-dashboard-band-pill`, `…-reporter-badge-chip`
  - `operator-dashboard-quick-dismiss`
- **Primitives:** `Card`, `Button`, `Toast`, `Dropdown` (filter)
- **Layout:** status-board grid (single layout; toggle removed)
- **Trust band glyphs:** `◔ T1` / `◑ T2` / `● T3` / `✓ resolved` (foundation §4.1)
- **Reporter-badge icons:** `⚓` anchor / `☎` hotline / `✎` webform / `📡` sensor (foundation §6.2)

## Wire contract

- **Read:** `GET /api/incidents` (via `useIncidents()`), `GET /api/sensors`, `GET /api/events?limit=20`
- **Emit (quick dismiss):** `POST /api/events` with `IncidentDismissed{actor, incident_id, reason}`

## i18n keys

Already exist in `operatorDashboard.json`. Verify new keys are present in both `en` and `bn`:

```
"actions.logHotlineCall": "Log hotline call"  // shared with WO-002
"filter.needsMe": "Needs me"
"filter.inFlight": "In flight"
"autoRouted.label": "{count} handled by system"
"autoRouted.hide": "Hide"
"quickDismiss.label": "Dismiss"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-operator-dashboard-reconcile.test.tsx`
  - Status-board grid renders (no A/B/C toggle in DOM)
  - Sort is priority-first / age-second
  - BandPill renders glyph + text (not color-only)
  - Reporter-badge chip renders for each row with correct icon
  - Hotline button mounts and opens modal on click
  - Auto-routed-tail chip collapses with correct count
  - Quick-dismiss emits `IncidentDismissed` event
  - Focus rings use `--color-primary-tint`
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with dashboard → inbox → verify-assign journey

## Migration debt

- **95-step plan items applicable here:**
  - PR 1 (Trust band badges → glyph + text pattern): 24 OK + 57 MINOR items
  - PR 5 (OperatorDashboard hotline modal trigger + chain-freshness indicator): part of this WO
- **Phase 1.7+ (not blocking):**
  - Progressive `--band-*` → `--color-trust-t1/2/3` migration across `InboxRow.tsx`, `InboxList.tsx`

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Both rendered as independent chips per row |
| Closure confetti removed | ✅ N/A |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Card, Button, Toast, Dropdown |
| Token names kept, hexes replaced | ✅ References `--color-trust-*`, `--color-reporter-*`, `--color-primary-tint` |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
