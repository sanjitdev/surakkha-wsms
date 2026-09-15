# WO-008 — Audit Log

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.2 — Tier 2 (load-bearing).
> Date: 2026-09-15

---

## Objective

Reconcile `web/src/pages/AuditLog.tsx` (582 LOC) — the cross-incident chain view with filter chips. Surface `ChainRead` events, allow operators to filter by incident / event-type / actor / band / reporter-badge, and drill into per-incident segment (WO-003).

## Scope

**In:**
- Reconcile `web/src/pages/AuditLog.tsx` to spec lockdown binding
- Filter chips (foundation §13): incident, event-type, actor, band, reporter-badge, date range
- Filter chip URL persistence (filter combo serialised to query string)
- Filter combos write `ChainRead{actor, incident_id, filter_combo}` event on every filter change (PRD §11.1)
- Cross-incident view: list of chain events grouped by incident
- Row ⚠️ + top banner when any incident in the filter set shows anomaly
- "Open chain segment" link per row → `/incidents/:incident_id/chain` (WO-003)
- Date range picker (foundation `DateRangePicker`)
- Export to CSV (deferred — Phase 1.7+)
- 100% of chain reads logged

**Out:**
- Single-incident view (lives on `IncidentChainSegmentPage` per WO-003)
- Public/citizen mode (lives on `CitizenStatusTimeline` per WO-001)
- Real-time push (currently poll-based)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/audit-log.md`
- **Scenario:** `docs/C-UX-Scenarios/06-audit-chain-timeline-cross-cutting.md` Screen 1
- **Lockdown:** foundation §3.2, §4.1, §4.2, §6.2, §8.2, §10, §13
- **Helper:** `web/src/lib/chain-verify.ts` (used for inline single-block verify from this page)

## Acceptance criteria

1. Page renders at `/audit-log` for `utility_operator`
2. Filter chips render: incident (search), event-type (multi-select), actor (search), band (multi-select), reporter-badge (multi-select), date range
3. Filter chip state serialises to URL query string (e.g., `?band=T1,T2&reporter=hotline`)
4. Loading URL params pre-populates filter chip state
5. Filter change emits `ChainRead{actor, incident_id: null, filter_combo}` event
6. Cross-incident list shows chain events grouped by `incident_id`
7. Each row: timestamp (relative + absolute), actor chip, event-type icon (27 approved Lucide), band pill, reporter-badge chip, hash anchor
8. Anomaly in any row → row ⚠️ + top banner (persistent until acknowledged)
9. "Open chain segment" link per row → `/incidents/:incident_id/chain`
10. Date range picker uses `DateRangePicker` primitive (not raw `<input type="date">`)
11. Single-block inline verify reuses `web/src/lib/chain-verify.ts` (not copy-pasted)
12. Tab order matches visual order
13. Bangla toggle works
14. No Hindi strings

## UI rules

- **Area Labels:**
  - `audit-log-page`, `…-header`, `…-main`
  - `audit-log-filter-chips`, `…-chip-incident`, `…-chip-event-type`, `…-chip-actor`, `…-chip-band`, `…-chip-reporter-badge`, `…-chip-date-range`
  - `audit-log-event-list`, `…-event-row`
  - `audit-log-event-timestamp`, `…-actor-chip`, `…-event-type-icon`, `…-band-pill`, `…-reporter-badge-chip`, `…-hash-anchor`
  - `audit-log-button-open-chain-segment`, `…-verify-inline`
  - `audit-log-anomaly-banner`
- **Primitives:** `Card`, `Button`, `Dropdown` (multi-select), `Input` (search), `DateRangePicker`, `Toast`, `Modal` (anomaly expansion)

## Wire contract

- **Read:** `GET /api/chain/blocks?from=…&to=…` (paginated; filter applied client-side for now), `GET /api/incidents` (for incident filter dropdown)
- **Verify (inline):** `POST /api/chain/verify` via chain-verify.ts
- **Emit (filter change):** `POST /api/events` with `ChainRead{actor, incident_id: null, filter_combo: [serialised chip values]}`

`web/src/mocks/handlers.ts` additions:
- `POST /api/events` handler for `ChainRead` event variant (already needed by WO-001/WO-003)

## i18n keys

Add to both `web/src/i18n/locales/en/auditLog.json` and `…/bn/`:

```
"page.title": "Audit log"
"page.subtitle": "Every chain read is logged."
"filter.incident.label": "Incident"
"filter.eventType.label": "Event type"
"filter.actor.label": "Actor"
"filter.band.label": "Band"
"filter.reporterBadge.label": "Reporter source"
"filter.dateRange.label": "Date range"
"button.openChainSegment": "Open chain segment"
"button.verifyInline": "Verify"
"banner.anomaly.title": "Chain anomaly in filter set"
"banner.anomaly.body": "Acknowledge or escalate to Pia."
"timestamp.justNow": "just now"
"timestamp.minutesAgo": "{n} min ago"
"timestamp.hoursAgo": "{n} hr ago"
"timestamp.daysAgo": "{n} day ago"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-audit-log-reconcile.test.tsx`
  - Filter chips render and function
  - URL serialisation round-trips correctly
  - Filter change emits `ChainRead` with correct filter_combo
  - Cross-incident grouping renders
  - Anomaly triggers row + banner
  - Single-block inline verify uses helper
  - "Open chain segment" link target correct
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with audit-log → filter → drill-into-chain-segment journey

## Migration debt

- **PR 4 of 95-step plan:** "AuditLog filter chips + chain-read logging" — main vehicle for this WO
- **Phase 1.7+:** CSV export

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Filter chips for both dimensions; rows render both |
| Closure confetti removed | ✅ N/A |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Card, Button, Dropdown, Input, DateRangePicker, Toast, Modal |
| Token names kept, hexes replaced | ✅ References `--color-trust-*`, `--color-reporter-*`, `--color-alert-red-reserved` |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
