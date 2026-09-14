# Trust Bands — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §1.1 (lines 13–39) + §4.1 (lines 194–206)
> **Runtime:** `web/mockups/theme.css` §2 trust band palette (lines 447–451) + `.badge--t*` rules (lines 330–333)
> **Lockdown binding:** `_bmad-output/design/01-color-lockdown.md` + `02-typography-lockdown.md`

---

## Conceptual model

**Trust band = verification state.** It is one of two orthogonal data dimensions on a chain event.

| Dimension | Encodes | Values |
|-----------|---------|--------|
| **Trust band** | Verification state | T0 / T1 / T2 / T3 / Resolved |
| **Reporter badge** | Source attribute | Anchor / Hotline / Webform / Sensor |

A reporter can be an anchor (reporter-badge) at **any** trust band (verification state). Hotline-sourced incidents carry `reporter_kind: hotline_operator` on the chain and render as a reporter-badge chip regardless of band.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-trust-t1` | `#E1DDD4` (divider neutral) | Lowest verification state — structural default |
| `--color-trust-t2` | `#B8801E` (amber) | Some verification signals present |
| `--color-trust-t3-issuance` | `#B23A2A` (alert-red-reserved) | **RESERVED — T3+ consumer-notice issuance ONLY** |
| `--color-trust-resolved` | `#2F6E45` (safe-green) | Resolved positively |

## Glyph + text redundancy (LOCKDOWN)

Trust bands use **glyph + text**, never colour alone.

| Band | Glyph | Text label | Reporter-badge add-on (if applicable) |
|------|-------|------------|--------------------------------------|
| T0 / uninitialised | `○` | "T0" | — |
| T1 unverified | `◔` | "T1" | `⚓` anchor / `☎` hotline / `✎` webform / `📡` sensor |
| T2 verified | `◑` | "T2" | same add-on set |
| T3 issuance | `●` | "T3" | T3 issuance path only (consumer-notice confirmation) |
| Resolved | `✓` | "resolved" | — |

Trust band uses glyph + text only — no Lucide for the band badge itself. Reporter-badge attribute uses Lucide (`Anchor`, `Phone`, `Edit`, `RadioTower`) on top of the band.

## Citizen surface translation

Citizens never see T1/T2/T3 band labels — they see plain-language verification state ("verified" / "not yet verified") and the reporter badge if relevant.

| Trust band | Citizen-facing copy (en) | Citizen-facing copy (bn) |
|------------|-------------------------|-------------------------|
| T1 / unverified | "not yet verified" | "যাচাই করা হয়নি" |
| T2 / verified | "verified" | "যাচাইকৃত" |
| T3 / issuance | (consumer-notice path only) | (same) |
| Resolved | "resolved" | "সমাধান হয়েছে" |

## Override events

Override events (`TrustBandOverridden`) are **chain events**, not a band. The override is shown as an event chip in the chain segment with the original band still visible. There is no `T_overridden` category in the band palette. Every band shown with an override event chip surfaces a "View override reasoning" affordance (foundation rule §12.8).

## Reservation enforcement

T3 + alert-red is only used in the consumer-notice issuance path. Build-time lint (stylelint) fails any non-issuance consumer. See `decisions/00-lockdown-audit.md` for the 29 high-severity conflicts this rule caught.

---

_Mirror of foundation doc §1.1 + §4.1 — content unchanged from 2026-09-11 lockdown reconciliation._
