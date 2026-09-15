# WO-015 — Styleguide Page

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light, dev-only).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/StyleguidePage.tsx` (847 LOC) — dev-only design system reference. **5 MAJOR items** includes: update 3-band docs → 5-band + remove Danger button misuse demo.

## Scope

**In:**
- Token reference: all `--color-trust-*`, `--color-reporter-*`, spacing, radii, motion
- **MAJOR #4:** Trust band docs updated from 3-band (T1/T2/T3) to **5-band** (T0/T1/T2/T3/resolved) per lockdown revision
- **MAJOR #4:** Remove Danger button misuse demo (Danger variant reserved for alert-red issuance path only)
- Component gallery: 22 shadcn primitives with all variants
- Icon library: 27 approved Lucide icons
- Locale toggle (EN/BN)
- Live theme toggle (light/dark)

**Out:** Production build (dev-only; outside `<AppLayout>` per App.tsx)

## Acceptance criteria

1. Renders at `/styleguide` (dev-only; outside `<AppLayout>`)
2. **MAJOR #4:** Trust band docs show **5-band** (T0/T1/T2/T3/resolved), not 3-band
3. **MAJOR #4:** Danger button misuse demo removed
4. All 22 primitives shown with variants
5. All 27 icons shown
6. Locale + theme toggles work live
7. No Hindi strings

## Wire contract

- None (pure reference page; no API calls)

## i18n keys

Styleguide labels already exist; verify `styleguide.json` (en + bn) is current.

## Tests + lockdown compliance

- Vitest: `fe-styleguide-reconcile.test.tsx`
- Lockdown: 5-band docs match foundation §1.1; Danger misuse removed

---

_Ready for Stage 6._
