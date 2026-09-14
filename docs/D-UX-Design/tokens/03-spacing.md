# Spacing — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §5 (lines 245–259)
> **Runtime:** `web/mockups/theme.css` §3 spacing tokens (lines 167–188)
> **Lockdown binding:** `_bmad-output/design/04-spacing-components-lockdown.md` + `04a-spacing-amendment-A.md`

---

## Spacing scale — LOCKDOWN-BOUND

7 semantic tokens on a 4px base + 8pt grid.

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | `4px` | Tight vertical rhythm inside cards |
| `--space-sm` | `8px` | Inline spacing |
| `--space-md` | `12px` | Default inline padding |
| `--space-lg` | `16px` | Default block padding |
| `--space-xl` | `24px` | Section spacing, gutter |
| `--space-2xl` | `32px` | Major section spacing |
| `--space-3xl` | `48px` | Page-level vertical rhythm |

## Bangla-aware spacing

Bangla surfaces use `--line-height-body-bangla` (1.6) instead of `--line-height-body` (1.5). Bangla glyphs need ~10% more leading.

## Height tokens (component control heights — runtime only)

| Token | Value | Use |
|-------|-------|-----|
| `--height-control-sm` | `28px` | Compact button / chip |
| `--height-control-md` | `36px` | Default input height |
| `--height-control-lg` | `44px` | Default button height |
| `--height-control-xl` | `48px` | Top chrome height |
| `--height-row-default` | `40px` | Table / list row |
| `--height-row-comfortable` | `56px` | Comfortable row for touch |

---

_Mirror of foundation doc §5 — content unchanged from 2026-09-11 lockdown reconciliation._
