# WO-012 — Citizen Ack Page

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/CitizenAckPage.tsx` (351 LOC) — Anjali's closure-ack surface. **5 MAJOR items** includes: add VS15 + glyph characters + ack-window expiry.

## Scope

**In:**
- **MAJOR #2:** VS15 + glyph characters (lockdown `06-data-formats-lockdown.md` rendering rules)
- **MAJOR #2:** Ack-window expiry surfaced (24h window from `IncidentResolvedByAdmin` event)
- ✅ Confirm resolved button → emits `CitizenAckAccepted{actor: citizen, incident_id}`
- ❌ Reopen button → opens reason picker → emits `ChainReopened{actor: citizen, incident_id, reason}`
- Bangla-first default
- Silent-closure reopen UI (after 30-day window expiry)
- Acknowledge expired window gracefully (no countdown pressure on this surface; SMS carries the schedule)

**Out:** Closure reasoning capture (deferred to Phase 2 PHA flow)

## Acceptance criteria

1. Renders at `/my-reports/:incident_id/ack` for `citizen`
2. **MAJOR #2:** VS15 + glyph characters render correctly (no broken Bengali)
3. **MAJOR #2:** Ack-window expiry visible (e.g., "Acknowledge within 24 hours")
4. ✅ button emits `CitizenAckAccepted` event
5. ❌ button opens reason picker; emits `ChainReopened` with reason
6. Silent-closure reopen UI after 30-day expiry
7. Bangla-first; no countdown pressure on this surface
8. No Hindi strings

## Wire contract

- Read: `GET /api/events?incident_id=…&types=IncidentResolvedByAdmin`
- Emit: `POST /api/events` with `CitizenAckAccepted` or `ChainReopened`

## i18n keys

Add to `citizenAck.json` (en + bn): confirm/reopen labels, ack-window messaging, reopen reasons.

## Tests + lockdown compliance

- Vitest: `fe-citizen-ack-reconcile.test.tsx`
- Lockdown: trust band shown (resolved), reporter-badge (anchor), VS15 + glyph rendering correct

---

_Ready for Stage 6._
