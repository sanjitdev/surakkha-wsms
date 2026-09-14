# Reporter Badges — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §1.1 (lines 24–39) + §4.1 (lines 199–206)
> **Runtime:** `web/mockups/theme.css` §3 reporter-badge palette (lines 453–457)
> **Lockdown binding:** `_bmad-output/design/01-color-lockdown.md` + `03-iconography-lockdown.md`

---

## Conceptual model

**Reporter badge = source attribute.** It is one of two orthogonal data dimensions on a chain event, **separate** from trust band.

| Dimension | Encodes | Values |
|-----------|---------|--------|
| **Trust band** | Verification state | T0 / T1 / T2 / T3 / Resolved |
| **Reporter badge** | Source attribute | Anchor / Hotline / Webform / Sensor |

The two dimensions are **never** collapsed. A reporter can be an anchor at any trust band. Hotline-sourced incidents carry `reporter_kind: hotline_operator` on the chain and render as a reporter-badge chip regardless of band.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-reporter-anchor` | `#2F6E45` (safe-green) | Anchor citizen reporter (verified nid) |
| `--color-reporter-hotline` | `#3F6E7C` (deep-teal-tint) | Hotline operator (proxy reporter) |
| `--color-reporter-webform` | `#1B2026` (ink) | Web-form reporter (default) |
| `--color-reporter-sensor` | `#B8801E` (amber) | Sensor-fired incident (no human report) |

## Icons (Lucide, MIT)

| Reporter kind | Lucide icon | Notes |
|---------------|-------------|-------|
| Anchor | `Anchor` | Verified nid |
| Hotline | `Phone` | Proxy reporter |
| Webform | `Edit` | Default |
| Sensor | `RadioTower` | No human report |

Reporter-badge attribute uses Lucide on top of the trust band, never in place of it. Chain events display the actor's role and name (foundation rule §12.9) — no anonymous aggregations.

## Citizen surface translation

Reporter badges are localised as plain language.

| Reporter kind | Operator copy (en) | Citizen copy (en) | Citizen copy (bn) |
|---------------|--------------------|--------------------|---------------------|
| Anchor | "anchor" | "verified reporter" | "যাচাইকৃত রিপোর্টার" |
| Hotline | "hotline" | "hotline call" | "হটলাইন কল" |
| Webform | "webform" | (operator-only) | — |
| Sensor | "sensor" | "sensor reading" | "সেন্সর রিডিং" |

Hash anchors and chain event types are **not translated** (technical identifiers stay English). Citizen timeline event descriptions are localised plain language.

## Anjali-mobile case

An anchor reporter is **not** elevated to a trust-band colour. Anchors carry `reporter_kind: anchor` on the chain; the badge is the `--color-reporter-anchor` chip. This separation lets anchor citizens render their badge regardless of whether the incident is verified.

## Pia (Phase 2)

The orthogonality lets Pia drill on either dimension independently in Scenario 05's data contract. See `docs/C-UX-Scenarios/05-pia-data-contract-pha-deferred.md`.

---

_Mirror of foundation doc §1.1 reporter-badge rows + §4.1 — content unchanged from 2026-09-11 lockdown reconciliation._
