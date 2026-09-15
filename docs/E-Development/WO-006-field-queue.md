# WO-006 — Field Queue (Karim)

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.2 — Tier 2 (load-bearing).
> Date: 2026-09-15

---

## Objective

Reconcile `web/src/pages/FieldQueuePage.tsx` (422 LOC) to the lockdown-bound spec. Field-tech queue view with priority-first / age-second sort, distance-from-current-location estimate, and one-tap acknowledge + en-route actions.

## Scope

**In:**
- Reconcile `web/src/pages/FieldQueuePage.tsx` to spec
- Sort: priority-first / age-second (same contract as OperatorDashboard locked #1)
- Each row: BandPill (glyph + text), reporter-badge chip, distance estimate (km from current location), age, missing-evidence chips
- One-tap `Acknowledge` (emits `Acknowledged{actor: karim, incident_id}`) — opens detail page
- One-tap `En route` (emits `EnRoute{actor: karim, incident_id, eta_minutes}`) — opens detail page
- "My assignments" filter chip (default) + "Available" filter chip
- Page-level pull-to-refresh (5s live update with 100ms crossfade on changed cells, per foundation §8.2)
- Operator-mode locale (English-default; Bangla-toggleable)
- Tab order matches visual order

**Out:**
- Map view (separate route — Phase 1.7+)
- Voice notes for en-route ETA
- Photo capture from this page (handled in `FieldIncidentDetail`)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/field-queue.md`
- **Scenario:** `docs/C-UX-Scenarios/04-karim-the-technician-field-lane.md` Screen 1
- **Lockdown:** foundation §4.1 (band glyph + text), §6.2 (reporter-badge), §8.2 (motion)
- **Master PRD:** `docs/E-Development/000-PRD.md` §3

## Acceptance criteria

1. Page renders at `/field` for `field_technician`
2. Sort is priority-first / age-second
3. Each row shows: BandPill, reporter-badge chip, distance estimate, age, missing-evidence chips
4. `Acknowledge` button visible on each row; emits `Acknowledged` event
5. `En route` button visible on each row; opens ETA picker (1/5/15/30/60 min) then emits `EnRoute` event
6. Distance estimate updates when geolocation changes (uses `navigator.geolocation`)
7. "My assignments" (default) + "Available" filter chips function
8. 5s live update; changed cells crossfade over 100ms; new rows mount instantly
9. No Hindi strings
10. Bangla toggle works; preference persists

## UI rules

- **Area Labels:**
  - `field-queue-page`, `…-header`, `…-main`
  - `field-queue-filter-chips`, `…-chip-mine`, `…-chip-available`
  - `field-queue-incident-list`, `…-row`
  - `field-queue-band-pill`, `…-reporter-badge-chip`, `…-distance-estimate`
  - `field-queue-button-acknowledge`, `…-en-route`
- **Primitives:** `Card`, `Button`, `Dropdown` (ETA picker), `Toast`
- **Motion:** 5s polling + 100ms crossfade per foundation §8.2

## Wire contract

- **Read:** `GET /api/incidents?assigned_to=karim_id` (or unassigned for "Available"), `GET /api/events?limit=50`
- **Geolocation:** `navigator.geolocation.watchPosition()` (with permission prompt; graceful fallback if denied)
- **Emit (acknowledge):** `POST /api/events` with `Acknowledged{actor: karim, incident_id}`
- **Emit (en route):** `POST /api/events` with `EnRoute{actor: karim, incident_id, eta_minutes}`

## i18n keys

Add to both `web/src/i18n/locales/en/fieldQueue.json` and `…/bn/`:

```
"page.title": "Field queue"
"page.subtitle": "Your assigned incidents"
"filter.mine": "My assignments"
"filter.available": "Available"
"row.distance": "{km} km away"
"row.eta": "ETA {minutes} min"
"button.acknowledge": "Acknowledge"
"button.enRoute": "En route"
"etaPicker.label": "ETA"
"etaPicker.1": "1 min"
"etaPicker.5": "5 min"
"etaPicker.15": "15 min"
"etaPicker.30": "30 min"
"etaPicker.60": "60 min"
"toast.acknowledged": "Acknowledged"
"toast.enRoute": "En route — ETA {minutes} min"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-field-queue-reconcile.test.tsx`
  - Sort priority-first / age-second
  - Acknowledge button emits correct event
  - En-route opens ETA picker; emits with correct minutes
  - Distance estimate updates on geolocation change
  - Filter chips function
  - 5s polling triggers re-render; changed cells crossfade
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with field-tech persona → field-queue → acknowledge → en-route journey

## Migration debt

- **Phase 1.7+:** `--band-*` → `--color-trust-*` migration in `InboxRow.tsx`-style code if shared

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Both rendered as independent chips |
| Closure confetti removed | ✅ N/A |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Card, Button, Dropdown, Toast |
| Token names kept, hexes replaced | ✅ References `--color-trust-*`, `--color-reporter-*` |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
