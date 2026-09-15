# WO-011 — Submit Report Page (Anjali / citizen)

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/SubmitReportPage.tsx` (350 LOC) — Anjali's web-form report surface. **5 MAJOR items** flagged in `02-phase-4-closeout.md` §4.3.

## Scope

**In:**
- Bangla-first default (citizen surface, lockdown §11.2)
- Plain-language category picker (no T1/T2/T3 dropdown — that was the first MAJOR item)
- Location: lat/lon auto-detect (with permission) + editable, OR manual address
- Description: 500 char limit, Bangla numerals for timestamps
- Photo capture with EXIF (auto-populated, editable)
- Reporter-badge: `anchor` (because citizen with verified NID becomes anchor)
- Trust band: defaults to **T1** (unverified) until verified by operator
- On submit: emits `IncidentCreated{reporter_kind: anchor, band: T1, description, location, photo_hash}`
- 5-min dual-channel ack (Screen 2 of Scenario 03) — SMS + portal

**Out:** Anchor verification flow (operator-side; happens in `InboxDetail` per WO-005)

## Acceptance criteria

1. Renders at `/submit` for `citizen`
2. **MAJOR #1:** Plain-language category dropdown (replaces the T1/T2/T3 technical dropdown)
3. Bangla-first default; EN toggle
4. Photo capture with auto-EXIF (lat/lon/timestamp/device); all editable
5. Submit emits `IncidentCreated` with `reporter_kind: anchor` and `band: T1`
6. 5-min dual-channel ack surfaces (SMS + portal notice)
7. Success page with incident ID + "View your report" link → `/my-reports/:incident_id/timeline`
8. No Hindi strings

## Wire contract

- Emit: `POST /api/events` with `IncidentCreated{reporter_kind: anchor, band: T1, …}`

## i18n keys

Add to `submitReport.json` (en + bn): plain-language categories, ack messaging, success.

## Tests + lockdown compliance

- Vitest: `fe-submit-report-reconcile.test.tsx`
- Lockdown: reporter-badge = anchor (correct dimension), band = T1 (correct dimension, NOT T3)

---

_Ready for Stage 6._
