# Border Radii + Elevation — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §6 (lines 261–276) + §9 (lines 348–358)
> **Runtime:** `web/mockups/theme.css` §3 (radii lines 176–179); elevation uses raw `rgba()` shadows in component CSS
> **Lockdown binding:** `_bmad-output/design/04-spacing-components-lockdown.md`

---

## Border radii — LOCKDOWN-BOUND

4 radii only. Pill pattern is a badge component pattern, not a radius.

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | `2px` | Tag chips |
| `--radius-sm` | `3px` | Hash anchor chips |
| `--radius-md` | `4px` | Buttons, inputs, cards |
| `--radius-lg` | `6px` | Modals, hero cards |

**Trust-bridge rule (binding):** rounded corners carry the humane trust-bridge cue. Do not switch to `0px` for "operational density" — the cost is the brand cue Anjali relies on.

Pill pattern (`--radius-pill: 999px` from DESIGN.md) applies to badge components — composed via the `Badge` component, not as a radius token on arbitrary elements.

## Elevation — LOCKDOWN-BOUND

| Token | Value | Use |
|-------|-------|-----|
| `flat` | `0` | Operator chrome, Anjali-mobile card stacks |
| `card` | `0 1px 2px rgba(27,32,38,0.06), 0 1px 3px rgba(27,32,38,0.04)` | Priya-desktop incident rows, PHA-pane aggregate tiles |
| `panel` | `0 2px 6px rgba(27,32,38,0.08), 0 1px 2px rgba(27,32,38,0.04)` | PHA-pane audit-browser query results |
| `modal` | `0 8px 24px rgba(27,32,38,0.12), 0 2px 6px rgba(27,32,38,0.06)` | Confirmation modals (T3+ issuance only) |

Elevation follows cognitive load, not visual hierarchy alone.

---

_Mirror of foundation doc §6 + §9 — content unchanged from 2026-09-11 lockdown reconciliation._
