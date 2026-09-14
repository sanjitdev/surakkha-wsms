# Colors — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §1 (lines 11–76)
> **Runtime:** `web/mockups/theme.css` §1 (lines 8–91 dark theme) + §5 lockdown block (lines 433–464)
> **Lockdown binding:** `_bmad-output/design/01-color-lockdown.md`

---

## Trust band palette — LOCKDOWN-BOUND

Trust band = verification state. Reporter badge = source attribute. **These are two different data dimensions, not one.**

| Token | Name | Hex | Use |
|-------|------|-----|-----|
| `--color-trust-t1` | T1 unverified (neutral) | `#E1DDD4` (divider) | Lowest verification state — divider neutral. The structural default. |
| `--color-trust-t2` | T2 verified | `#B8801E` (amber) | Some verification signals present. |
| `--color-trust-t3-issuance` | T3 issuance | `#B23A2A` (alert-red-reserved) | **RESERVED — T3+ consumer-notice issuance ONLY.** Build-time lint (stylelint) fails any non-issuance consumer. Never for general operator UI. |
| `--color-trust-resolved` | Resolved | `#2F6E45` (safe-green) | Resolved positively. |

## Reporter badge palette — SEPARATE dimension

| Token | Hex | Use |
|-------|-----|-----|
| `--color-reporter-anchor` | `#2F6E45` (safe-green) | Anchor citizen reporter (verified nid) |
| `--color-reporter-hotline` | `#3F6E7C` (deep-teal-tint) | Hotline operator (proxy reporter) |
| `--color-reporter-webform` | `#1B2026` (ink) | Web-form reporter (default) |
| `--color-reporter-sensor` | `#B8801E` (amber) | Sensor-fired incident (no human report) |

## Rules

- Trust band badge ALWAYS pairs colour + text (T1/T2/T3/Resolved) + glyph character (○/◔/◑/●/✓). Never colour alone.
- Glyph characters are **not** Lucide icons. Lockdown specifies glyph characters for trust-band redundancy.
- Citizen surfaces never see T1/T2/T3 band labels — they see plain-language verification state ("verified" / "not yet verified") and the reporter badge if relevant.
- An anchor reporter is **not** elevated to a trust-band colour. Anchors carry `reporter_kind: anchor` on the chain; the badge is `--color-reporter-anchor` chip.
- T3 + alert-red is only used in the consumer-notice issuance path (Phase 1 SMS/Ramesh-channel, Phase 2 PHA dashboard alerts).
- Override events (`TrustBandOverridden`) are **chain events**, not a band. Shown as an event chip with the original band still visible. No `T_overridden` category.

## Brand palette — LOCKDOWN-BOUND

| Token | Hex | Use |
|-------|-----|-----|
| `--color-primary` | `#0F4C5C` (deep teal) | Brand mark, primary actions, header chrome |
| `--color-primary-tint` | `#3F6E7C` (deep teal tint) | Hover, focus ring (AAA-grade contrast) |
| `--color-surface` | `#FAF7F2` (warm off-white) | All surface backgrounds |
| `--color-ink` | `#1B2026` (ink) | Body text (16.9:1 against surface, WCAG AAA) |
| `--color-amber` | `#B8801E` (amber) | Acute indicators, calibrated warnings (4.7:1 against ink) |
| `--color-amber-bright` | `#E9A23B` | Large-UI only (≥18 pt; 3:1 large-text rule) |
| `--color-safe-green` | `#2F6E45` | "Safe now" / resolved states (5.1:1 against ink) |
| `--color-alert-red` | `#B23A2A` | T3+ consumer-notice issuance ONLY — never general UI |
| `--color-alert-red-reserved` | `#B23A2A` (separate token) | Same hex, build-time lint enforces reservation |
| `--color-divider` | `#E1DDD4` | Panel/separator strokes |

## Status colours

| Token | Hex | Use |
|-------|-----|-----|
| `--color-status-pending` | `#F1F1EE` (bg-subtle) | Pending / silent / awaiting |
| `--color-status-verified` | `--color-safe-green` (`#2F6E45`) | Verified / ✅ / resolved positively |
| `--color-status-failed` | `--color-alert-red-reserved` (issuance path only) | Anomaly / ❌ / failed verification — lint-enforced |
| `--color-status-warn` | `--color-amber` (`#B8801E`) | In-progress / form validation error |

**Carve-out:** form validation errors are NOT a T3+ consumer-notice. They use `--color-status-warn` (amber). Anomaly badges from chain verification failures DO use alert-red-reserved.

## Theme support — LOCKDOWN

Dark mode via `[data-theme="dark"]` selector with cool-neutral scaled surfaces. Light default. Operators get user-selectable theme; Anjali-mobile defaults to light for outdoor field reading.

## Forbidden tokens

- `rose-*` (Tailwind palette) — not in lockdown. Use `--color-status-warn` for form validation errors.
- `emerald-*`, `blue-*`, `indigo-*` — not in lockdown. Phase 4 trust-band palette is fully replaced.
- T3 alert-red for general operator UI — stylelint rule enforces reservation.

---

_Mirror of foundation doc §1 — content unchanged from 2026-09-11 lockdown reconciliation._
