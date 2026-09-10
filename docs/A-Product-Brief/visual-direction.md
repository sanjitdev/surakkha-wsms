# Visual Direction — Surakkha v1

2026-09-10

> **Source.** Extracted from `_bmad-output/ux-designs/ux-Surakkha-2026-09-06/` (mockups + lockdown), `project-context.md` §9 (UX lockdown gate), `AGENTS.md` §2 (frontend architecture invariants), and the dim 1–4 token lockdown at 2026-09-07. **Not invented** — visual tokens and component patterns are pre-locked; this doc is a brief-form summary, not the source of truth.

The canonical visual contract lives in the dim docs (`_bmad-output/design/00-04-*-lockdown.md`) and the mockup set (`web/mockups/01-priya/`). This brief-form doc orients Freya and downstream reviewers; it does not redefine tokens.

---

## Visual References

**Primary mockup set:** `web/mockups/01-priya/` — the six dim-5 page templates (Dashboard, Inbox List, Inbox Detail, Verify Flow, Audit Log, Settings) plus styleguide. All six must match mockup parity per AD-FE-8.

**Supporting sets:**
- `web/mockups/02-karim/` — field technician (Karim) surface reuses the same component primitives, layout slightly adapted for mobile-friendly web.
- `web/mockups/03-anjali-minimal/` — Anjali submission form (Phase 1 ships minimal; not PWA-polished).
- `web/mockups/04-audit/` — per-incident audit timeline + chain-hash anchoring.
- `web/mockups/05-citizen-ack/` — 1-screen ✅ / ❌ tap surface (CitizenAckPage shipped as FE-F6).

**Referenced generics:** Material Design 3 system tokens (sourced via Inter + Noto Sans Bengali) — Bangla-capable primary font is mandatory; Plex Mono for block_hash and chain-ref cells.

---

## Design Style

**Tone of the visual system:** Operational, public-sector, defensible. Not consumer. Not boutique. Not playful. A busy city operator looking at this UI on a phone in intermittent sunlight must resolve the incident — visual style serves that, not the other way around.

**Style principles:**
- **Density is support, not style.** Inbox rows are 56 px comfortable; audit rows are 40 px dense. Both are correct for their use.
- **Trust band is color-before-content.** The band color and badge must communicate severity before the operator reads the body text. High = green, Medium = amber, Low = grey, Error/System = red. C-1 binds.
- **Token-only.** Every visual value is `var(--*)`. No raw hex / rgb / px / rem in component code (AD-FE-4). No new tokens (token system locked 2026-09-07).
- **Defensible defensibility.** Every forensic surface (audit timeline, chain head, block hash) uses mono font and copy-to-clipboard. The auditor should be able to verify the chain from the screen.
- **Mobile floor at 767 px** — touch targets ≥48×48 px on mobile, ≥44×44 px on desktop. Focus rings via `:focus-visible` only (AD-FE-7).

---

## Color Direction

**Base palette** (locked 2026-09-07, sourced from `web/src/styles/theme.css` — see dim-2 lockdown doc):

| Role | Token | Notes |
|---|---|---|
| Background (base) | `--surface-base` | Neutral, not stark white |
| Surface (raised) | `--surface-raised` | Card / modal |
| On-surface (primary text) | `--on-surface` | High contrast, WCAG AA |
| On-surface (secondary text) | `--on-surface-muted` | Lower contrast for non-essential labels |
| Border | `--border-subtle` | Hairline, not heavy |
| Success | `--success-500` | For "verified" states, ack ✅ |
| Warning | `--warning-500` | For "needs attention", trust band Medium |
| Danger | `--danger-500` | For "override", ❌ reopen, audit-failure |
| Info | `--info-500` | For system messages, neutral |

**Trust-band colors** (lockstep with audit-chain semantics — C-1):

| Band | Token | Notes |
|---|---|---|
| High | `--band-high` | Two corroborating signals in cluster window |
| Medium | `--band-medium` | One corroborating signal OR sensor agrees |
| Low | `--band-low` | Single source, no corroboration |
| (no band) | n/a | System, non-persona |

**Theme support:** Light + Dark via `data-theme` on `<body>`; no per-component branches; `useTheme()` hook + styleguide live toggle (shipped FE-1.1). Both themes must pass WCAG AA against `--on-*` text colors.

---

## Typography Direction

**Primary (Bangla-capable):** Noto Sans Bengali for Anjali + Admin surfaces. Loads via the lockstep font set in `web/src/styles/theme.css`.

**Fallback:** system-ui / `-apple-system` chain (no third-party font CDN at runtime).

**Display:** Bold weight, +0.5 size-step above the body — used for KPI numbers + page headers. Bangla numerals display per `Intl.NumberFormat('bn-BD')` (shipped as `useNumberFormatter` per FE-B5g).

**Body:** Regular weight, 16 px desktop / 16 px mobile (no per-component font-size override).

**Caption:** 12 px, used for table meta + audit-log dense rows.

**Mono (forensic):** Plex Mono for block_hash, incident IDs, chain refs. Always copy-to-clipboard. Truncation: first 8 + "…" + last 4 by default; full hash on hover/expand.

**Bangla punctuation:** Use `।` (U+0964 Devanagari Danda) not `.` at sentence ends in Bangla strings. VS15 glyph (U+FE0E) used to force text-presentation on characters that have an emoji variant (e.g., for ✅ / ❌ in inbox rows where emoji rendering is unreliable).

---

## Imagery Style

**Real evidence only. No stock photography.** Operator and audit surfaces use:

- **Anjali photo submissions** — verbatim EXIF-stamped images from the citizen's phone. No re-encoding. No filters.
- **Operator resolution proofs** — verbatim EXIF-stamped photos + GPS + device-clock timestamp from the field tech's phone.
- **Map tiles** — OpenStreetMap (vendor-neutral, C-16 binding). No Google Maps API in Phase 1.
- **Icons** — locked icon library (Lucide or Heroicons — final choice at dim-4 lockdown, 2026-09-07; whichever was selected ships). Custom Bangla glyphs only where the icon library fails.

**Imagery rules:**
- No decorative imagery anywhere in operator / admin / audit surfaces.
- Sentinel strip photos are forensic evidence, not marketing.
- Trust-band badges are typographic (color + text), not pictorial — required for accessibility (color-blind safety).

---

## Component Patterns (lockstep with AD-FE-4 through AD-FE-9)

| Pattern | Reference | Notes |
|---|---|---|
| Buttons | `Button` primitive | variants: primary / secondary / ghost / danger. sizes: sm / md. |
| Inputs | `Input`, `SearchInput` | controlled; `testId` decoupled from label. |
| Modals | `Modal` primitive | focus-trap + restore-on-close. |
| Toasts | `Toast` primitive | `DURATION_MS=4000`, hover-pause, `role="status"`. |
| Trust-band pills | `BandPill` primitive | variants: high / medium / low. |
| Tables | `Table` + `Pagination` | generic, sortable, selectable, resizable. |
| Dropdowns | `Dropdown` primitive | single / multi, searchable, ARIA combobox. |
| Date pickers | `DatePicker` + `DateRangePicker` + `Calendar` | ARIA grid, locale-aware (Bangla-first). |
| Charts | `web/src/components/pages/charts/*.tsx` | TimeSeriesLine, Donut, HorizontalBar. |
| Layout | TopChrome (48 px) + Sidebar (persona-aware) + `Container` (narrow/bangla/wide) | 8 sidebar items for Priya, 4 for Karim. |

**Layout dimensions:**
- TopChrome: 48 px height, 3 slots (left: brand + chain-status with pulse-dot; right: persona chip + locale-globe + theme toggle).
- Sidebar: 44 px row height, 3 px left-border active marker.
- Inbox rows: 56 px comfortable. Audit rows: 40 px dense.
- Verify Flow container: `--container-narrow` (720 px), no sidebar.
- Mobile floor: `@media (max-width: 767px)` collapses Sidebar to a drawer; Datpicker popovers become bottom sheets.

---

## Accessibility Baseline

**WCAG AA minimum.** Contrast on text/background pairs verified via axe-core in CI (FE-1.6 checks). Focus rings via `:focus-visible` only — never on `:focus`. Keyboard nav for every interactive component; Modal traps focus; Toast announces via `role="status"`. Esc closes Modal; no surprises.

**Shoulder-surfing redaction for citizen taps** is a load-bearing security property for FR-4 — the ✅ / ❌ tap surface on the citizen's phone renders yes/no in a way that can't be over-the-shoulder guessed. Locked in `web/mockups/05-citizen-ack/`.

---

## Token Lockdown

**No new design tokens.** The token system is locked 2026-09-07. Adding a token requires amending the relevant dim doc (`_bmad-output/design/0X-*-lockdown.md`), the FE-1 lockdown companion, and explicit user sign-off (per AGENTS.md §2 AD-FE-4 / Token lockdown row).

Every shipped primitive ships with a `web/src/__checks__/fe-{id}-{slug}.test.tsx` enforcement test (FE-1.6 pattern). No exemptions.
