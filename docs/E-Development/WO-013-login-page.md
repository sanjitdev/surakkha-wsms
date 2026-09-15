# WO-013 — Login Page

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/LoginPage.tsx` (220 LOC) — persona-picker login surface (MSW-backed in Phase 1).

## Scope

**In:**
- Persona list (5 personas from `_bmad-output/brainstorming/`)
- Click persona → `POST /api/auth/login { persona_id }` → session IDB write → `surakkha:session-changed` event → redirect to `landingFor(session.role)`
- Bangla-first toggle on this page (lockdown §11.2 — applies to all surfaces in principle)
- No real auth — Phase 1 is mock auth via MSW

**Out:** Real auth flow (Phase 1.7+ when backend lands)

## Acceptance criteria

1. Renders at `/` and `/login`
2. Persona list shows 5 personas (Pia, Priya, Anjali, Karim, Vendor)
3. Click persona → login → redirect to role-appropriate landing
4. Session persists across reloads (IDB)
5. Bangla toggle works
6. No Hindi strings

## Wire contract

- Read: `GET /api/auth/personas`
- Emit: `POST /api/auth/login { persona_id }` (already in MSW)

## i18n keys

Add to `login.json` (en + bn): persona display names, login button.

## Tests + lockdown compliance

- Vitest: `fe-login-reconcile.test.tsx`
- Lockdown: EN + BN only

---

_Ready for Stage 6._
