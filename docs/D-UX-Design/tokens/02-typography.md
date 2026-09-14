# Typography — Surakkha v1

> **Mirror of:** `../01-design-system-foundation.md` §2 (lines 79–148)
> **Runtime:** `web/mockups/theme.css` §2 typography tokens (lines 141–164)
> **Lockdown binding:** `_bmad-output/design/02-typography-lockdown.md`

---

## Font families

| Token | Value | Use |
|-------|-------|-----|
| `--font-family-sans` | `'IBM Plex Sans', 'Noto Sans', system-ui, -apple-system, sans-serif` | Latin/English body and headings on all operator surfaces |
| `--font-family-bangla` | `'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif` | Bangla body and headings on Anjali-mobile and Bangla-toggle operator surfaces; primary on Ramesh-channel Bangla locale |
| `--font-family-mono` | `'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace` | Chain hashes, event IDs, ISO timestamps, hex values, code blocks |

**Bangla degrade rule:** Bangla text MUST degrade to a system Bangla font, never to a Latin glyph. The stack ends at `system-ui`; if the system has no Bangla font, the gateway's feature-phone fallback path sends English-locale content instead.

**Mono digit rule:** `--font-family-mono` is Latin-only by design. It never carries Bangla glyphs. Chain hashes and event IDs are always Latin digits in mono, regardless of locale toggle. Bengali digit substitution never applies inside mono.

## Type scale (7-step) — LOCKDOWN-BOUND

| Token | Value | Use |
|-------|-------|-----|
| `--font-size-1` | `0.75rem` (12 px) | Tertiary metadata (timestamps, footer) |
| `--font-size-2` | `0.875rem` (14 px) | Body small, list rows, **tier badges (binding per accessibility review)** |
| `--font-size-3` | `1rem` (16 px) | Body |
| `--font-size-4` | `1.125rem` (18 px) | Card title |
| `--font-size-5` | `1.375rem` (22 px) | Section header |
| `--font-size-6` | `1.75rem` (28 px) | Page title |
| `--font-size-7` | `2.25rem` (36 px) | Display |

## Line-heights

| Token | Value | Use |
|-------|-------|-----|
| `--line-height-tight` | `1.2` | Headings (Latin) |
| `--line-height-body` | `1.5` | Body (Latin) |
| `--line-height-body-bangla` | `1.6` | Body (Bangla) — Bangla glyphs need more leading |
| `--line-height-heading-bangla` | `1.3` | Headings (Bangla) |
| `--line-height-loose` | `1.7` | Reader-mode surfaces (PHA pane, audit browser) |

## Operator type roles (mapping scale to roles)

| Role | Token | Use |
|------|-------|-----|
| Caption | `--font-size-1` (12 px) | Timestamps, footer |
| **Tier badge** | `--font-size-2` (14 px) | **Bumped from xs per lockdown accessibility review** |
| Body | `--font-size-3` (16 px) | Body text |
| Card title | `--font-size-4` (18 px) | Incident card titles |
| Section header | `--font-size-5` (22 px) | Panel headers |
| Page title | `--font-size-6` (28 px) | Page headers |
| Display | `--font-size-7` (36 px) | KPI numbers |

## Citizen type roles (Anjali-mobile, Bangla-first)

| Role | Token | Use |
|------|-------|-----|
| Caption | `--font-size-1` (12 px) | Timestamps, footer |
| Body | `--font-size-3` (16 px) | Body text — Bangla line-height 1.6 |
| Card body | `--font-size-4` (18 px) | Card body |
| Card title | `--font-size-5` (22 px) | Card titles |
| Page title | `--font-size-6` (28 px) | Page titles |
| Hero | `--font-size-7` (36 px) | Hero numbers (e.g., "15 days since last alert") |

## Chain events typography

| Role | Token | Font | Use |
|------|-------|------|-----|
| Hash anchor | `--font-size-2` (14 px) | `--font-family-mono` | Hash, event_id |
| JSON payload | `--font-size-2` (14 px) | `--font-family-mono` | Operator-mode expanded JSON |
| Plain-language event | `--font-size-3` (16 px) | `--font-family-sans` | Public-mode plain-language event |

## VS15 text-style glyph — BINDING

On consumer messages (Anjali timeline, Ramesh-channel SMS), `✓` and `⚠` MUST carry U+FE0E (text variation selector) to force text-style rendering on iOS. Spec author writes the string as `\u2713\uFE0E` and `\u26A0\uFE0E`; copy editor reviews for VS15 inclusion.

---

_Mirror of foundation doc §2 — content unchanged from 2026-09-11 lockdown reconciliation._
