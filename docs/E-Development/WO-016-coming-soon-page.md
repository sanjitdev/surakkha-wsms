# WO-016 — Coming Soon Page

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light, placeholder).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/ComingSoonPage.tsx` (86 LOC) — placeholder for 4 routes: `/submit` (placeholder, but real route now handled by WO-011 — see note), `/approve`, `/audit`, `/vendor`.

## Scope

**In:**
- Generic placeholder for the 3 still-pending routes (`/approve`, `/audit`, `/vendor`)
- **Note:** `/submit` is now a real route per WO-011; remove `ComingSoonPage` mapping from `/submit` in `App.tsx`
- Bangla toggle
- Phase 2 notice ("Coming in Phase 2")

**Out:** Real implementations of `/approve`, `/audit`, `/vendor` (deferred to Phase 2 PHA flow)

## Acceptance criteria

1. Renders at `/approve`, `/audit`, `/vendor` (3 placeholder routes)
2. **`/submit` removed from ComingSoonPage mapping** in `App.tsx` (now routes to `SubmitReportPage`)
3. Phase 2 notice shown
4. Bangla toggle works
5. No Hindi strings

## Wire contract

- None

## i18n keys

Add to `comingSoon.json` (en + bn): "Coming in Phase 2" + role-specific messaging.

## Tests + lockdown compliance

- Vitest: `fe-coming-soon-reconcile.test.tsx`
- Lockdown: EN+BN only

---

_Ready for Stage 6._
