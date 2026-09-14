# Design Tokens — Surakkha v1

> Phase 4 — UX Design · Mirror folder
> **Source of truth:** [`../01-design-system-foundation.md`](../01-design-system-foundation.md)
> **Authoritative runtime:** `web/mockups/theme.css` (442 lines; additive lockdown bridge)
> **Lockdown binding:** `_bmad-output/design/{01-color,02-typography,03-iconography,04-spacing-components,...}.md`

## Purpose

This folder exists so design tokens are easy to track at a glance. Every file here is a **mirror** of content that lives in the lockdown-bound foundation doc and the runtime CSS. The source of truth remains unchanged — these mirrors exist purely for navigation and review.

> **Do not edit token values in this folder.** Edit `01-design-system-foundation.md` or `web/mockups/theme.css` instead. The mirror is regenerated manually when tokens shift.

## Index

| File | Group | Foundation reference |
|------|-------|---------------------|
| [01-colors.md](01-colors.md) | Brand palette, trust band palette, reporter-badge palette, status palette, theme support, forbidden tokens | §1 |
| [02-typography.md](02-typography.md) | Font families, type scale (7-step), line-heights, type roles, chain events, VS15 | §2 |
| [03-spacing.md](03-spacing.md) | 7-token semantic spacing scale, Bangla-aware leading | §5 |
| [04-radii-and-elevation.md](04-radii-and-elevation.md) | Border radii (4-token), elevation (flat/card/panel/modal), trust-bridge rule | §6, §9 |
| [05-motion.md](05-motion.md) | Three motion patterns, citizen/operator rules, reduced-motion, spinner | §8 |
| [06-trust-bands.md](06-trust-bands.md) | Trust band palette as a separate dimension; glyph + text pattern | §1.1, §4.1 |
| [07-reporter-badges.md](07-reporter-badges.md) | Reporter-badge palette as a separate dimension from trust band | §1.1, §4.1 |

## How tokens map to runtime

```
Foundation doc (authoritative prose)
  ↓
docs/D-UX-Design/tokens/*.md    ← this folder (navigation mirrors)
  ↓
web/mockups/theme.css           ← runtime CSS (build dependency)
  ↓
web/src/styles/*.css            ← component-level composition
```

The `--band-*` / `--brand-*` legacy tokens and the lockdown `--color-*` tokens **coexist** in `theme.css` until Tier 2 reconciliations migrate consumers (see `decisions/01-token-deconfliction-plan.md`).

## Cross-references

- Foundation: [`../01-design-system-foundation.md`](../01-design-system-foundation.md)
- Lockdown audit: [`../decisions/00-lockdown-audit.md`](../decisions/00-lockdown-audit.md)
- Token deconfliction plan: [`../decisions/01-token-deconfliction-plan.md`](../decisions/01-token-deconfliction-plan.md)
- 17 page wireframes: [`../wireframes/`](../wireframes/) (mirrors of `specs/`)
- 15 specs that reference tokens: [`../specs/`](../specs/)

---

_Mirror folder created 2026-09-14 for navigability — content is unchanged._
