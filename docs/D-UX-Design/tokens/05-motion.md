# Motion — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §8 (lines 315–345)
> **Runtime:** `web/mockups/theme.css` §motion tokens (lines 196–206)
> **Lockdown binding:** `_bmad-output/design/08-motion-lockdown.md`

---

## Three patterns only

**State-change, data-arrival, error-crit.** Decorative animation banned. No page-load animation.

## Citizen surfaces

- **State-change patterns:**
  - Closure celebration (✅ ack received): **200ms green pulse ONLY**. No confetti. No sparkle. No flourish.
  - Status pill colour transitions: 300ms ease-out when state changes.
- **Data-arrival patterns:**
  - New timeline event arrival: 200ms ease-out fade-up. (Acceptable as data-arrival, not page-load.)
- **Error-crit patterns:**
  - Chain anomaly banner: 300ms shake (one-shot).
- **No page-load animation.** Surakkha opens to live data. There is no load state — only projection lag (sub-second display).

## Operator surfaces

- Status-board live updates: 5s polling with 100ms crossfade on changed cells (state-change).
- Inbox list reorder: 150ms ease-in-out (data-arrival).
- Chain event rows mount instantly (state-change, immediate).
- Modal enter/exit: 200ms ease-out fade (state-change).

## Reduced-motion

`prefers-reduced-motion: reduce` → replace all transitions with instant state changes; omit the closure green pulse; omit the chain anomaly shake.

## Spinner rules

- Sub-second: no spinner
- >2s: inline spinner
- >30s: chain monitor surface (operator-only)

## Runtime motion tokens

| Token | Value | Use |
|-------|-------|-----|
| `--motion-press-120` | `120ms` | Button press feedback |
| `--motion-tab-switch` | `160ms` | Persona / tab selection |
| `--motion-pane-in` | `200ms` | Modal / pane enter |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.4, 1)` | State-gain |
| `--ease-in` | `cubic-bezier(0.6, 0, 0.8, 0.2)` | State-loss |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.6, 1)` | Symmetric |

The remaining 12 dim 8 tokens (modal, toast, chart, shake, etc.) ship with their first consumer in a later story — this is the foundation, not the full set.

---

_Mirror of foundation doc §8 — content unchanged from 2026-09-11 lockdown reconciliation._
