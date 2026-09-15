# WO-009 — Inbox List

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/InboxList.tsx` (454 LOC) — Priya's ranked incident inbox with filter chips, row-level reporter-badge chips, and missing-evidence chips.

## Scope

**In:**
- Sort: priority-first / age-second
- Filter chips: priority, band, reporter-badge, status (open/in-flight/resolved), date range
- Each row: BandPill (glyph + text), reporter-badge chip, age, missing-evidence chips
- Pagination (`Pagination` primitive)
- URL persistence of filter state
- Empty/loading/error states

**Out:** Drill-into-detail (linked from row to `/inbox/:id` per WO-005)

## Acceptance criteria

1. Renders at `/inbox` for `utility_operator`
2. Sort priority-first / age-second
3. All filter chips function + URL persistence
4. Rows render all required fields
5. Pagination works
6. Empty/loading/error states render correctly

## Wire contract

- Read: `GET /api/incidents?…`, `GET /api/events?limit=20`

## i18n keys

Add to `inboxList.json` (en + bn): filter labels, pagination, empty/loading/error messages.

## Tests + lockdown compliance

- Vitest: `fe-inbox-list-reconcile.test.tsx` (sort, filters, URL persistence, pagination)
- Lockdown: trust-band × reporter-badge, EN+BN, shadcn, lockdown tokens

---

_Ready for Stage 6._
