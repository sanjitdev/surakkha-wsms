# WO-010 — Inbox Rail

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/InboxRail.tsx` (123 LOC) — the 240px left rail used inside `InboxDetail` per foundation §3.2.

## Scope

**In:**
- Compact list view of ranked incidents
- Each row: BandPill (glyph + text, compact), reporter-badge chip (icon only, compact), age
- Currently selected row highlighted
- Click → navigate to `/inbox/:id` (sets the parent InboxDetail's selected incident)
- URL persistence of selection

**Out:** Filter chips (live on `/inbox`)

## Acceptance criteria

1. Renders as 240px rail inside InboxDetail
2. Compact band pill + reporter badge icons fit the rail width
3. Selection state syncs to URL
4. Click navigates to detail

## Wire contract

- Read: `GET /api/incidents?…` (filtered subset)

## i18n keys

Compact labels only — add to `inboxCommon.json` (en + bn).

## Tests + lockdown compliance

- Vitest: `fe-inbox-rail-reconcile.test.tsx`
- Lockdown: trust-band × reporter-badge, EN+BN, shadcn, lockdown tokens

---

_Ready for Stage 6._
