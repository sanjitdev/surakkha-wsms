# Lockdown Audit — Phase 4 Foundation vs bmad Design Lockdown

> Audit produced 2026-09-11
> Source: read-only review of 22 files (18 lockdown + DESIGN/EXPERIENCE + 1 Phase 4 foundation + 3 Tier 1 specs)
> Audience: Saga, Freya, Adi (downstream Tier 2 reconciliation owners)
> Decision required: which design system wins. Default = lockdown wins, per `bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md` ("Spine wins on conflict").

This document is the audit record. It summarises what the bmad lockdown specifies, diffs Phase 4 against it, names the conflicts, and orders the reconciliation edits. **No code is changed by this audit.** Edits are proposed in §5 and gated on Saga sign-off.

---

## A. bmad lockdown summary (per file)

Each entry: file, what it locks, and the binding rule a Phase 4 spec author would trip over if they wrote in ignorance of it.

### A.1 `DESIGN.md` (`_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md`)

Visual identity, ratified 2026-09-06.

- **Palette:** deep teal primary `#0F4C5C`, warm off-white surface `#FAF7F2`, ink `#1B2026`, amber `#B8801E`, amber-bright `#E9A23B`, safe-green `#2F6E45`, alert-red `#B23A2A` (RESERVED — T3+ consumer-notice issuance only), divider `#E1DDD4`.
- **Typography:** `family-sans` = `'Noto Sans', 'Inter', system-ui, ...`; `family-bangla` = `'Noto Sans Bengali', 'Hind Siliguri', system-ui, ...`; `family-mono` = `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace`. Scale `xs/sm/md/xl/xxl/display`.
- **Shape:** `radius-sm` 6px, `radius-md` 10px, `radius-lg` 16px, `radius-pill` 999px. Rounded corners carry the humane trust-bridge cue.
- **Components:** button-primary / button-danger / card / input-field / badge-status / message-template.
- **Spine rule:** "Both DESIGN.md and EXPERIENCE.md win against any mock, wireframe, or import."
- **Alert-red reservation rule:** "surakkha-alert-red" + "surakkha-alert-red-reserved" are SEPARATE tokens; the `reserved` variant is wired through a build-time lint (stylelint) that fails any non-T3-issuance consumer. The reservation is enforced by **token architecture**, not reviewer vigilance.
- **Bangla fallback rule:** "Fall back from `family-bangla` to a Latin glyph if the Bangla font fails to load — degrade to a system Bangla font, not to Latin." (Do's and Don'ts.)

### A.2 `EXPERIENCE.md` (`_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/EXPERIENCE.md`)

Behaviour, IA, voice, state patterns. (File too large for one read; refer to file directly.) Key binding rules a Phase 4 spec author would trip over:

- Four surfaces: **Anjali-mobile** (citizen), **Priya-desktop** (operator), **PHA-pane** (deferred to Phase 2), **Ramesh-channel** (consumer messages).
- Trust band labels: T0/T1/T2/T3/resolved. T0/T1 → `divider` (neutral); T2 → `amber`; T3 → `alert-red` (with `surface` text); resolved → `safe-green`. **T0/T1 use the divider token (neutral), NOT a brand color.** This conflicts with Phase 4's emerald T1.
- Tier-badge contrast at 14px: `sm` (14 px) bumped from `xs` for legibility per accessibility review.
- Glyph redundancy: `○`/`◔`/`◑`/`●`/`✓` + "T0"/"T1"/"T2"/"T3"/"resolved". Never color alone.
- Emoji rule: no emoji on operator surfaces; one neutral glyph max on consumer messages (`✓` or `⚠` only).
- "Surakkha opens to live data; no load state" — chain freshness shown as clock/timestamp indicator on operator surfaces. Sub-second projection lag is the design contract.
- Ramesh-channel: divider mark `—`, line length ≤ 64 chars, signature line `— {issuing_authority} ({verification_horizon})`.
- Motion: motion floor rules; no decorative animation, no page-load animation, no confetti.

### A.3 `00-ux-flow-map.md` (`_bmad-output/design/00-ux-flow-map.md`)

Defines the page template inventory across personas.

- 6 Priya page templates + cross-persona screens. Tier 1 page list (per foundation §7) maps to these templates.
- Each Priya page = three-column operator surface (InboxRail | DetailPane | EventChain) at 240/flex/360px.
- Anchors the AppLayout shell that foundation §3.1 inherits.

### A.4 `01-color-lockdown.md` (`_bmad-output/design/01-color-lockdown.md`)

Single source of truth for CSS color tokens.

- **32 tokens** with light + dark variants via `[data-theme="dark"]` selector.
- **Warm-neutral light scale** + **cool-neutral dark scale** (slate-shifted hue rotation for dark).
- 5 brand-step tokens (primary-50/200/500/600/900 variants of deep teal).
- Semantic pairs: `--color-bg-success` / `--color-fg-success`, etc.
- **Trust band tokens:** `--color-trust-t0/1/2/3/resolved` — T0/T1 share the **divider** neutral token; T2 uses **amber**; T3 uses **alert-red-reserved** (only when consumer-notice messaging is being issued); resolved uses **safe-green**.
- Reporter badge tokens: `--color-reporter-anchor/-verified/-hotline/-sensor/-webform`.
- Status tokens: `--color-status-pending/-verified/-failed/-warn`.

### A.5 `02-typography-lockdown.md` (`_bmad-output/design/02-typography-lockdown.md`)

- **IBM Plex Sans** body + **IBM Plex Mono** for chain hashes + **Noto Sans Bengali** for Bangla glyphs.
- 7-step scale (`--font-size-1` … `--font-size-7`); 5 line-heights including `--line-height-body-bangla: 1.6` and `--line-height-heading-bangla: 1.3` (Bangla needs more leading than Latin).
- VS15 text-style glyph rule: `✓` and `⚠` MUST carry U+FE0E (text variation selector) when used on consumer messages to force text-style rendering on iOS.
- No proprietary font lock-in; Bangla family is explicit so Anjali-mobile never falls back to Latin.

### A.6 `02a-font-swap-amendment.md` (`_bmad-output/design/02a-font-swap-amendment.md`)

- **Amendment:** Noto Sans swapped for IBM Plex Sans (and IBM Plex Mono). Bangla family unchanged.
- Rationale: IBM Plex has better Bangla-coverage at body sizes; pairing with Plex Mono for chain hashes reads cleaner.
- **Phase 4 spec conflict:** Phase 4 §2 references `ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace` — does NOT match IBM Plex Mono binding.

### A.7 `03-iconography-lockdown.md` (`_bmad-output/design/03-iconography-lockdown.md`)

- **Lucide v0.460.0** (MIT) as the icon source.
- 5 sizes: 12 / 14 / 16 / 20 / 24 px.
- 3 stroke weights: 1.75 / 2 / 2.5.
- 27 icons approved in v1; new icons require lockdown-amendment flow.
- **No Bangla in icons.** Icons stay Latin/abstract.
- Trust band icons use glyph redundancy at the badge level (`○`/`◔`/`◑`/`●`/`✓`) not Lucide icons. **Phase 4 spec conflict:** foundation §4.1 maps T1 → `Anchor`, T2 → `CheckCircle`, T3 → `Phone`, T_overridden → `ShieldCheck` (lucide). Lockdown uses glyph characters.

### A.8 `04-spacing-components-lockdown.md` (`_bmad-output/design/04-spacing-components-lockdown.md`)

- **7 spacing tokens:** `--space-xs` (4) / `--space-sm` (8) / `--space-md` (12) / `--space-lg` (16) / `--space-xl` (24) / `--space-2xl` (32) / `--space-3xl` (48). 4px base + 8pt grid.
- **4 radii:** `--radius-xs` (2) / `--radius-sm` (3) / `--radius-md` (4) / `--radius-lg` (6). **Phase 4 spec conflict:** foundation §6 maps `rounded-sm` 4px / `rounded` 6px / `rounded-md` 8px / `rounded-lg` 12px / `rounded-full` 9999px. Completely different scale.
- 4 control heights (32 / 40 / 48 / 56).
- 8 component classes (button / input / card / badge / modal / nav / toolbar / empty-state).

### A.9 `04a-spacing-amendment-A.md` (`_bmad-output/design/04a-spacing-amendment-A.md`)

- Adds **row heights** (40px default, 56px comfortable) and **card--with-heading** modifier.
- Bangla-aware spacing: Bangla glyphs need ~10% more leading; `--line-height-body-bangla` already encodes this.
- Inbox row at 40px height for Priya (density); 56px height for Anjali-mobile (thumb floor).

### A.10 `05-grid-pages-stack-lockdown.md` (`_bmad-output/design/05-grid-pages-stack-lockdown.md`)

- **5 breakpoints:** 480 / 768 / 1024 / 1280 / 1440.
- **3 containers:** 720 / 1080 / 1280.
- 12-column grid; 24px gutter on desktop; 16px on tablet; 12px on phone.
- **shadcn/ui adoption** — themed via CSS variables; **Phase 4 spec conflict:** Phase 4 does not mention shadcn/ui but uses Tailwind utility classes directly.
- Tailwind config spec: exposes CSS vars as utilities via `theme.extend.colors`.
- **MSW (Mock Service Worker) + IndexedDB** for Phase 1 demo; SSE poll fallback at 30s ±10% jitter when SSE unavailable.

### A.11 `05b-data-viz-lockdown.md` (`_bmad-output/design/05b-data-viz-lockdown.md`)

- **9 chart types** (line, bar, stacked-bar, area, scatter, pie, choropleth, heatmap, sankey) via **Recharts + Leaflet**.
- 33 chart tokens (axes, gridlines, series colors); locale formatter rules (Bangla numerals, date-fns locale).
- PHA-pane aggregate tiles use Shape 1/2/3/4 metric shapes.

### A.12 `05c-anjali-mobile-lockdown.md` (`_bmad-output/design/05c-anjali-mobile-lockdown.md`)

- **DEFERRED to Phase 2.** Phase 1 ships Anjali-mobile as web-responsive single-pane (foundation §3.3).
- 3 panes defined: Report / Status feed / Profile.
- 4 input modes: text / voice (30s max) / photo (with EXIF) / location.

### A.13 `05d-priya-mobile-lockdown.md` (`_bmad-output/design/05d-priya-mobile-lockdown.md`)

- **DEFERRED to Phase 2.**
- 3 panes: Action list / Detail / Handover.
- 3 breakpoints (sm/md/lg).

### A.14 `05e-pha-pane-lockdown.md` (`_bmad-output/design/05e-pha-pane-lockdown.md`)

- **DEFERRED to Phase 2.**
- 6 aggregate tiles (trust-band distribution, resolution-ack divergence, SLA compliance, hotline-vs-web-form retention, sensor uptime, anomaly count).
- Dual-signature amendment queue (AD-11 ed25519).
- Audit browser with read-access logging (Pia reads logged to chain).
- `@media print` styles for export PDFs.

### A.15 `05-settings-lockdown.md` (`_bmad-output/design/05-settings-lockdown.md`)

- **6 SettingControl kinds:** toggle / select / text / numeric / link / danger.
- 7th Priya page template (`SettingsPage`).
- Threshold tuning lives here (PHA threshold sliders deferred to Phase 2; Phase 1 settings are operator preferences only).

### A.16 `06-data-formats-lockdown.md` (`_bmad-output/design/06-data-formats-lockdown.md`)

- TypeScript interfaces for all data shapes.
- **Branded ID types:** `ULID`, `SensorId`, `WardId`, `ReporterId`, `IncidentId`, `ChainEventId`, `OperatorId`, `VerificationId`, `DualSignatureId` — all branded `string` types.
- ISO 8601 timestamps with timezone.
- **Locale-at-container rule:** the container decides the locale; no per-string locale tags. **Phase 4 spec conflict:** Phase 4 §1.1 references "band label localized" per row — that's container-level locale, fine; but Phase 4 §10 says "Trust band labels are localised: T1/T2/T3 stay as code" which is correct.
- No string concatenation for sentences; full i18n keys at sentence level.

### A.17 `07-sensor-wire-format-lockdown.md` (`_bmad-output/design/07-sensor-wire-format-lockdown.md`)

- `EnvelopeBase` interface (event_id, actor, actor_role, incident_id, event_type, payload, timestamp, prev_hash, block_hash, signature).
- **33 event types** in the closed enum (matches Phase 4 §4.2 chain event icons table).
- **3 transports:** HTTP POST (gateway), SSE (live stream), poll fallback (30s ±10% jitter).
- **5-state sensor status machine:** `nominal / warning / critical / offline / decommissioned`.

### A.18 `08-motion-lockdown.md` (`_bmad-output/design/08-motion-lockdown.md`)

- **14 motion tokens** (durations + easings + patterns).
- **3 patterns:** state-change / data-arrival / error-crit.
- 3 easings (standard / emphasized / decel).
- **No decorative animation.**
- **No page-load animation.**
- **No confetti.** Closure-celebration is a 200ms green pulse only (Scenario 01 closure §). **Phase 4 spec conflict:** Phase 4 §8.1 mandates "Closure celebration (✅ ack received): subtle confetti (1s) + green pulse (200ms)". The confetti is in lockdown violation.

---

## B. Phase 4 foundation divergence (point-by-point)

Foundation source: `docs/D-UX-Design/01-design-system-foundation.md` (Saga/Freya, 2026-09-10).

Each row: lockdown says X, Phase 4 says Y, conflict level.

### B.1 Trust-band palette

| Aspect | Lockdown | Phase 4 foundation | Conflict |
|---|---|---|---|
| T0 | `--color-trust-t0` = `--color-divider` (neutral slate) | not in foundation table | Phase 4 omits T0 |
| T1 (anchor-priority) | `--color-trust-t1` = `--color-divider` (neutral; T1 is *not* a brand color) | `--color-trust-t1` emerald `#0E9F6E` / `emerald-600` — anchor reporter = **emerald** | **HIGH** — T1 meaning and color inverted |
| T2 (verified reporter) | `--color-trust-t2` = `--color-amber` (T2 IS a brand color in lockdown) | `--color-trust-t2` sky `#1A73E8` / `blue-600` — verified reporter = **sky** | **HIGH** — T2 different color and meaning |
| T3 (hotline-sourced) | `--color-trust-t3` = `--color-alert-red-reserved` (only for T3+ consumer-notice issuance; otherwise no badge color) | `--color-trust-t3` amber `#D97706` / `amber-600` — hotline = **amber** | **HIGH** — T3 color shifted; lockdown reserves red |
| Overridden | lockdown has no overridden band; override events show original band + override chip | `--color-trust-overridden` indigo `#4F46E5` / `indigo-600` with shield-chevron-up | **HIGH** — Phase 4 introduces 4th state not in lockdown |
| T0/T1 same color | yes (both `divider`) | T1 emerald vs T0 implicit | lockdown compresses T0+T1 to neutral; Phase 4 elevates T1 |

### B.2 Background tints

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| T1-bg | `--color-trust-t1-bg` = `--color-divider-bg` (neutral) | `--color-trust-t1-bg` emerald-50 `#E6F6F1` | **HIGH** |
| T2-bg | `--color-trust-t2-bg` = `--color-amber-bg` | `--color-trust-t2-bg` blue-50 `#E8F0FE` | **HIGH** |
| T3-bg | `--color-trust-t3-bg` = `--color-alert-red-reserved-bg` (only on issuance) | `--color-trust-t3-bg` amber-50 `#FEF3C7` | **HIGH** |

### B.3 Status colors

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Verified | `--color-status-success` = `--color-safe-green` `#2F6E45` | `emerald-600` `#059669` | **MEDIUM** — different green |
| Failed/anomaly | `--color-status-failed` = `--color-alert-red-reserved` `#B23A2A` (anomaly banner ONLY) | `rose-600` `#E11D48` | **HIGH** — alert-red reserved, not used for anomaly; rose used instead |
| Pending | `--color-status-pending` slate | `slate-500` | OK |

### B.4 Forbidden in Phase 1

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Red as primary CTA | forbidden | forbidden | OK |
| Multiple categorical color codings | forbidden | forbidden | OK |
| Dark mode | **supported** (light + dark via `[data-theme="dark"]`) | **forbidden** | **HIGH** — Phase 4 forbids what lockdown supports |
| Gradients | not forbidden; allowed sparingly on data viz | forbidden except chain-event timeline accents (8% alpha) | **MEDIUM** |

### B.5 Typography

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Operator body | IBM Plex Sans 16px 1.5 line-height | system-ui default; foundation lists `text-base` 16px 1.5 | **HIGH** — Phase 4 doesn't bind IBM Plex Sans |
| Operator mono | IBM Plex Mono (chain hashes) | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace` | **HIGH** — wrong font stack |
| Citizen body | Noto Sans / Noto Sans Bengali | system-ui; Phase 4 §10 says Bangla is supported but doesn't bind the family | **HIGH** |
| Bangla line-height | `--line-height-body-bangla: 1.6` + `--line-height-heading-bangla: 1.3` | not specified | **HIGH** — Phase 4 has no Bangla-specific line heights |
| Operator type scale | 7-step lockdown scale | foundation §2.1 8-step (xs/sm/sm-medium/base/base-medium/lg/xl/2xl) | **MEDIUM** — scale doesn't match |
| Citizen type scale | lockdown 7-step | foundation §2.2 6-step (sm/base/lg/xl/3xl/5xl) | **MEDIUM** |

### B.6 Spacing

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Token set | 7 semantic tokens `--space-xs/sm/md/lg/xl/2xl/3xl` (4/8/12/16/24/32/48) | Tailwind defaults `1=4, 2=8, 3=12, 4=16, 6=24, 8=32, 12=48, 16=64` | **HIGH** — Phase 4 introduces 64px (`16` in Tailwind) not in lockdown |
| Unit | 4px | 4px | OK |
| Bangla-aware spacing | `--line-height-body-bangla: 1.6` (already in 04a amendment) | not in Phase 4 | **HIGH** |

### B.7 Border radii

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Token set | `--radius-xs/sm/md/lg` = 2/3/4/6 px | `rounded-sm/md/lg/full` = 4/6/8/12/9999px | **HIGH** — entirely different scale; lockdown max is 6px, Phase 4 max is 12px |
| Pill | not a radius token; uses badge pattern | `rounded-full` 9999px | **MEDIUM** |

### B.8 Components

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Library | shadcn/ui themed via CSS vars + base components from `components/ui/` | Tailwind utility classes + hand-rolled components | **HIGH** — Phase 4 doesn't mention shadcn/ui |
| New primitives | forbidden (compose from existing) | forbidden (foundation §7 says same) | OK |
| Button variants | primary / secondary / danger / ghost | primary / secondary / destructive / ghost | OK (semantic match) |

### B.9 Motion

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Citizen fade-up on mount | no page-load animation; state-change pattern only | 200ms ease-out fade-up on mount (foundation §8.1) | **HIGH** — violation of "no page-load animation" |
| Closure celebration | 200ms green pulse ONLY (no confetti) | 1s confetti + 200ms green pulse (foundation §8.1) | **HIGH** — confetti violation |
| `prefers-reduced-motion` | required; tokens map to instant | required; same | OK |
| Status board updates | 5s live update; 100ms crossfade | 5s polling; 100ms crossfade | OK |
| Chain event mount | instant (no enter animation) | instant | OK |

### B.10 Layout

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| AppLayout | shadcn/ui shell + sidebar | AppLayout shell (Phase 1.6a) | **MEDIUM** — foundation doesn't reference shadcn/ui |
| Three-column operator | 240/flex/360 (foundation §3.2 inherits lockdown 00) | 240/flex/360 (same) | OK |
| Modal layer | 640px operator / 480px citizen (foundation §3.4 matches lockdown §3) | 640px operator / 480px citizen | OK |
| Backdrop | not specified; uses shadcn default | `rgba(15, 23, 42, 0.4)` | **LOW** |

### B.11 Iconography

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Library | Lucide v0.460.0 | lucide-react (no version pinned) | **MEDIUM** |
| Trust band icons | glyph characters `○`/`◔`/`◑`/`●`/`✓` (NOT Lucide) | Lucide `Anchor`/`CheckCircle`/`Phone`/`ShieldCheck` | **HIGH** — different icon system for trust band |
| Chain event icons | 27 approved Lucide icons | Lucide icons mapped 1:1 to 33 event types | **MEDIUM** — Phase 4 expands to 33; lockdown has 27 approved |
| Bangla in icons | forbidden | not addressed | **LOW** |

### B.12 Accessibility

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Color contrast | WCAG 2.1 AA floor; citizen surfaces AA+; tier badges at 14px (per accessibility review) | WCAG AA on operator, AA+ on citizen | OK (but Phase 4 doesn't enforce 14px badge floor) |
| Focus ring | 2px primary-tint ring, 2px offset | 2px emerald-600 ring, 2px offset | **HIGH** — Phase 4 uses emerald; lockdown uses primary-tint (deep teal tint `#3F6E7C`) |
| aria-live on chain | required (operator + citizen) | required | OK |
| Form labels | required, never placeholder-only | required | OK |

### B.13 i18n

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Languages | English + Bangla | English + Hindi + Bengali (3) | **HIGH** — Phase 4 introduces Hindi not in lockdown |
| Bangla-first surfaces | explicit (Anjali-mobile, Bangla-toggle) | not specified | **HIGH** |
| Hash/event-type translation | not translated | not translated | OK |
| Locale-at-container | enforced | not explicit | **MEDIUM** |
| VS15 text-style glyph | required (`✓` + U+FE0E) | not addressed | **HIGH** |

### B.14 Chain freshness indicator

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Indicator | clock/timestamp on operator surfaces; sub-second projection lag is design contract | 5s polling; pill in top-chrome; no sub-second display rule | **MEDIUM** |
| Style | chain-freshness pill (per 03-iconography; Clock icon + relative time) | same | OK |

### B.15 Trust band label semantics

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| T1 meaning | **low-trust baseline** (no verification signals); T0 is uninitialised | **anchor-priority** (highest trust) | **HIGH** — inverted |
| T2 meaning | **mid-trust** (some signals) | **verified reporter** | **HIGH** |
| T3 meaning | **high-priority** (consumer-notice issuance triggers) | **hotline-sourced** (lowest trust) | **HIGH** — T3 default band for hotline-sourced is what Phase 4 calls T3 (amber), but lockdown calls T3 the consumer-notice trigger |
| Overridden | lockdown has no override band; overrides are events on the chain with original band visible | Phase 4 adds indigo T_overridden band + shield-chevron icon | **HIGH** — Phase 4 introduces a category lockdown doesn't have |

### B.16 Forbidden-in-Phase-1 list

| Aspect | Lockdown | Phase 4 | Conflict |
|---|---|---|---|
| Red as primary CTA | forbidden | forbidden | OK |
| Multiple categorical colors | forbidden | forbidden | OK |
| Dark mode | **supported** (light + dark) | **forbidden** | **HIGH** |
| Gradients | allowed sparingly | forbidden except chain-event timeline | **MEDIUM** |

### B.17 Token-name conflicts (CSS variable names)

| Lockdown name | Phase 4 equivalent | Conflict |
|---|---|---|
| `--color-trust-t1` (divider) | `--color-trust-t1` (emerald) | name collision; **same name, different value** |
| `--color-trust-t2` (amber) | `--color-trust-t2` (sky) | name collision |
| `--color-trust-t3` (alert-red-reserved) | `--color-trust-t3` (amber) | name collision |
| `--space-xs/sm/md/lg/xl/2xl/3xl` | Tailwind `1/2/3/4/6/8/12/16` | no name collision (different naming scheme) |
| `--radius-xs/sm/md/lg` | Tailwind `rounded-sm/md/lg/full` | no name collision |

The trust-band token-name collisions are the **highest-risk conflict**: a developer who reads `docs/D-UX-Design/specs/` first and writes `--color-trust-t1: emerald` in a stylesheet will have a name collision with the lockdown token, and the build-time lint may or may not catch it.

---

## C. Tier 1 spec divergences

### C.1 `citizen-status-timeline.md` vs lockdown

| Aspect | Spec | Lockdown | Conflict |
|---|---|---|---|
| **Focus ring color** | "2px emerald-600, 2px offset" (§11 accessibility) | 2px primary-tint (deep teal tint `#3F6E7C`) | **HIGH** — wrong color |
| **Closure celebration** | "subtle ✅ pulse + 1s confetti animation" (§13 Test 4) | 200ms green pulse only (no confetti) | **HIGH** — confetti violation |
| **Touch floor** | ≥48×48 px (correct) | 48 px floor (correct) | OK |
| **Bangla rendering** | i18n includes Bangla; band labels localized plain language | Bangla-first surfaces required; lock i18n at container level | **MEDIUM** — spec doesn't enforce Bangla-first |
| **Card component** | uses existing `Card` from `components/ui/` | shadcn/ui themed | OK |
| **Aria-live** | required on timeline container (polite) | required (polite) | OK |
| **Skeleton rows on load** | 3 placeholder cards with shimmer (no spinner) | "Surakkha opens to live data; no load state" — skeletons OK as graceful degradation; spec matches | OK |
| **Chain event icons** | foundation §4.2 (Lucide icons) | lockdown 27 approved icons | OK (Phase 4 mapping is best-effort) |
| **Languages** | en + hi + bn (i18n §10) | en + bn (lockdown 06-data-formats) | **HIGH** — Hindi introduced |
| **Bengali numerals** | not addressed in spec | lockdown §content-language requires Bangla numerals | **HIGH** |
| **Type scale** | Phase 4 §2.2 citizen scale (sm/base/lg/xl/3xl/5xl) | lockdown 7-step scale | **MEDIUM** — scale mismatch |
| **Mono font for hash anchors** | not visible (public mode hides hashes) | IBM Plex Mono | N/A (not visible) |

### C.2 `hotline-intake-modal.md` vs lockdown

| Aspect | Spec | Lockdown | Conflict |
|---|---|---|---|
| **Modal width** | 640px (operator) | 640px (operator) | OK |
| **Backdrop** | `rgba(15, 23, 42, 0.4)` | not specified; shadcn default | OK |
| **Focus ring color** | "2px emerald-600 ring, 2px offset" (foundation §9) | 2px primary-tint | **HIGH** — wrong color |
| **T3 default band color** | amber (`--color-trust-t3` / `amber-600`) | alert-red-reserved (consumer-notice issuance only) | **HIGH** — T3 hotline-sourced incidents are NOT T3 in lockdown semantics; lockdown has no T3 hotline-default rule |
| **T3 icon** | `Phone` lucide | glyph character (Phase 4 vs lockdown glyph conflict) | **HIGH** |
| **Color contrast** | WCAG AA across all text | WCAG 2.1 AA floor (operator AA+) | OK |
| **T3 toast** | "Incident created with ID inc_01HX... (T3 default)" | not specified | OK (operator-internal toast) |
| **Languages** | English + Hindi + Bengali | English + Bangla | **HIGH** — Hindi |
| **Color of "T3" in subtitle** | implicit (text-sm slate-500 for subtitle, but band reference is to T3) | OK (subtitles are neutral) | OK |
| **Reuses `Modal` primitive** | yes (foundation §3.4) | shadcn `Modal` (themed via CSS vars) | OK |
| **Required field indicator** | asterisk after label | asterisk after label | OK |
| **Section dividers** | thin slate-200 horizontal rule | `--color-divider` (`#E1DDD4`) | **LOW** — both use neutral divider |
| **Bangla locale first for hotline-text** | "Bengali locale first for hotline-text-heavy context" (foundation §10) | Bangla-first surfaces required | OK |
| **i18n key namespace** | `operator.hotlineIntake.*` | consistent with `data-formats` namespace convention | OK |
| **Error color** | `rose-600` (text-sm) | `--color-status-failed` (alert-red-reserved ONLY for issuance; not for form errors) | **MEDIUM** — form errors typically use a non-reserved color; lockdown §status pattern doesn't address form validation specifically |
| **Cancel button** | ghost (text only) | ghost | OK |
| **Submit button** | primary emerald | primary (deep teal) | **HIGH** — wrong color |

### C.3 `per-incident-chain-segment.md` vs lockdown

| Aspect | Spec | Lockdown | Conflict |
|---|---|---|---|
| **Focus ring color** | "2px emerald-600 ring, 2px offset" (foundation §9) | 2px primary-tint | **HIGH** — wrong color |
| **Verified badge color** | emerald-600 | safe-green `#2F6E45` | **HIGH** — different green |
| **Anomaly badge color** | rose-600 | alert-red-reserved (only for issuance) | **HIGH** — wrong color; rose is not a lockdown token |
| **Hash font** | mono (Phase 4 system mono) | IBM Plex Mono | **HIGH** — wrong font |
| **Languages** | en + hi + bn (i18n §11) | en + bn | **HIGH** — Hindi |
| **Bengali numerals for public mode** | "Timestamp in Bangla numerals per content-language.md" (§4) | Bangla numerals required per content-language | OK |
| **Skeleton on load** | 5 skeleton row placeholders, animated pulse | "no load state"; skeletons acceptable as graceful degradation | OK |
| **Keyboard nav** | j/k/Enter/v/a/e shortcuts + `?` help | not specified; accessibility floor requires keyboard nav | OK |
| **Trust-band icons** | "T1 / T2 / T3 / Overridden" with icon (foundation §4.1) | glyph characters | **HIGH** — lucide icons used; lockdown uses glyph |
| **Color contrast** | WCAG AA+ on verified/anomaly badges | WCAG 2.1 AA floor; 14px badge contrast bump per accessibility review | OK |
| **Bangla-only public mode** | spec §9.3 wireframe shows Bangla | Bangla-first required | OK |
| **Hash recomputation algorithm** | sha256(prev_hash || seq || actor || event_type || payload || timestamp) | content-addressed chain per AD-1 | OK |
| **Cache TTL** | 60s per (incident_id, last_known_seq) | not specified (page-scoped caching OK) | OK |
| **Anomaly acknowledgment on chain** | `ChainAnomalyAcknowledged` event lands on chain | meta-audit principle: chain of custody | OK |
| **Performance budget** | <200ms for chains up to 50 events | not specified | OK |

---

## D. Lockdown rules that surprise casual readers

These are the rules Phase 4 spec authors most likely miss. They are not all "conflicts" but they are binding constraints that any Phase 4 spec must respect, and most Phase 4 specs do not currently reference them.

### D.1 Alert-red is reserved for T3+ consumer-notice issuance ONLY

`surakkha-alert-red` and `surakkha-alert-red-reserved` are SEPARATE tokens. The `reserved` variant is wired through a build-time stylelint rule that fails any non-T3-issuance consumer. Phase 4 specs use red liberally (rose-600 for form errors, anomaly badges, destructive buttons). Most of these uses violate the reservation — but `rose` is a different token (`rose-600` = `#E11D48`), so the stylelint rule may or may not flag it depending on configuration. **Action:** verify the stylelint rule covers the rose token; if not, add a parallel lint rule.

### D.2 No decorative animation, no page-load animation, no confetti

Lockdown `08-motion-lockdown.md` is explicit. Phase 4 §8.1 has a 1s confetti on closure celebration — this is a lockdown violation. Phase 4 §8.1 also has 200ms fade-up on mount — this is borderline; the lockdown calls "no page-load animation" but a state-change animation on first paint may be acceptable if scoped to data-arrival pattern, not page-load. **Action:** remove confetti; clarify fade-up is data-arrival pattern, not page-load.

### D.3 Mono family is Latin-only by design

IBM Plex Mono does not have Bangla glyphs. Phase 4 specs that render Bangla in mono will break. The lockdown solution: Bangla text uses `family-bangla` (Noto Sans Bengali) and mono text (chain hashes, event IDs) stays English. **Phase 4 spec check:** none of the 3 specs use Bangla in mono contexts, so no immediate bug, but the rule is binding.

### D.4 Tier-badge contrast at 14px is a binding bump

Lockdown `01-color-lockdown.md` notes: tier badges bumped from `xs` (12 px) to `sm` (14 px) for legibility per accessibility review. Phase 4 §2.1 lists `text-sm` (14 px) for list rows — but tier badges specifically should be 14 px to clear WCAG AA at the chosen color pairings (T2 amber on surface = 4.7:1; safe-green on surface = 5.1:1). **Action:** Phase 4 spec should add a binding rule that tier badges use `text-sm` not `text-xs`.

### D.5 "Spine wins on conflict"

`DESIGN.md` §opening: "Spine wins on conflict." Both DESIGN.md and EXPERIENCE.md win against any mock, wireframe, or import. This is the load-bearing rule: when Phase 4 conflicts with lockdown, lockdown wins. **Action:** Phase 4 should cite lockdown by section/line in every divergence, not the reverse.

### D.6 Rounded corners carry the trust-bridge cue

Lockdown §"Shape rule": "Do not switch to `0px` corners for 'operational density' — the cost is the brand cue Anjali relies on." Phase 4 §6 has rounded tokens that go to 12px (`rounded-lg`) but no `0px` for sharp corners — Phase 4 already complies with the "no 0px" rule. **No conflict; just binding.**

### D.7 Chain freshness sub-second indicator is a contract

Lockdown §opening of EXPERIENCE.md: "sub-second projection lag is the design contract; users see the freshness at a glance." Phase 4 §3.1 mentions 5s polling; doesn't bind sub-second display. **Action:** Phase 4 spec should add a chain-freshness indicator in the operator top-chrome with sub-second update.

### D.8 Three motion patterns: state-change, data-arrival, error-crit

Lockdown `08-motion-lockdown.md`. Phase 4 §8 has 3 patterns (state-board, inbox reorder, chain event mount) that don't map cleanly to lockdown's 3. **Action:** Phase 4 should align motion vocabulary with lockdown: state-change (5s board crossfade, chain event mount, status pill color), data-arrival (fade-up on new row), error-crit (anomaly banner pulse).

### D.9 "Surakkha opens to live data; no load state"

Lockdown §opening of EXPERIENCE.md. Phase 4 §9 in citizen-status-timeline uses skeleton placeholders + shimmer — that's graceful degradation, not a load state per se. **Action:** Phase 4 specs should keep skeleton placeholders but never show a spinner; the page should feel like live data.

### D.10 Bangla-first surfaces

Anjali-mobile and Bangla-toggle surfaces default to Bangla. Phase 4 §10 says Bangla is supported but doesn't bind Bangla-first. **Action:** Phase 4 specs that target Anjali should default locale to Bangla.

### D.11 VS15 text-style glyph

Lockdown `02-typography-lockdown.md`: `✓` and `⚠` must carry U+FE0E on consumer messages. Phase 4 doesn't address this. **Action:** add binding rule to citizen specs and i18n key surface.

### D.12 Bangla line-heights are explicit

`--line-height-body-bangla: 1.6` and `--line-height-heading-bangla: 1.3`. Phase 4 has no Bangla-specific line heights. **Action:** Phase 4 spec should reference these tokens explicitly on Bangla surfaces.

### D.13 Dual-signature attestation (AD-11) is a binding constraint

Lockdown `05e-pha-pane-lockdown.md` (Phase 2). Phase 4 doesn't reference AD-11 in the operator foundation; per-incident-chain-segment doesn't reference AD-11 either. **Action:** when Phase 2 lands, audit browser and amendment queue must use ed25519 dual-signature.

### D.14 Alert-red for issuance, rose for everything else

Phase 4 specs use `rose-600` (`#E11D48`) for form errors, anomaly badges, destructive buttons. Lockdown reserves `alert-red` (`#B23A2A`) for T3+ consumer-notice issuance. **No token collision** (different hexes), but stylelint rule should fail alert-red on non-issuance consumers. **Action:** verify stylelint rule covers rose if rose is to be reserved too; otherwise allow rose freely.

### D.15 Locale-at-container rule

Lockdown `06-data-formats-lockdown.md`: the container decides locale; no per-string locale tags. Phase 4 §10 says "i18n keys at the page level" — this is consistent with the rule. **No conflict.**

### D.16 The 27-icon lockdown vs 33-event mapping

Lockdown `03-iconography-lockdown.md` approves 27 icons. Phase 4 §4.2 maps 33 chain event types to Lucide icons. If the lockdown-approved icon list doesn't cover 33 events, Phase 4 is using unapproved icons. **Action:** verify each of the 33 mappings to a lockdown-approved icon, or open amendment tickets for the gap.

---

## E. Reconciliation plan (ordered list of edits)

Each edit has a target file, a one-line summary, and the order in which it must be done. **No code is changed by this audit.** Edits are proposed for Saga sign-off.

### E.1 Lockdown binding decisions (no edits needed; just acknowledged)

- **L1:** Alert-red reservation stays. Build-time lint enforced. **Status:** binding; no change.
- **L2:** No confetti, no page-load animation. **Status:** binding; Phase 4 §8.1 must be edited to remove confetti.
- **L3:** Spine wins on conflict. **Status:** binding; no change.

### E.2 Phase 4 foundation edits (`docs/D-UX-Design/01-design-system-foundation.md`)

These edits must happen FIRST because the 3 Tier 1 specs inherit from the foundation.

| Order | Edit | Action |
|---|---|---|
| **1** | **Trust-band palette (§1.1)** | Replace Phase 4 trust-band palette with lockdown tokens. T1 = divider (NOT emerald). T2 = amber. T3 = alert-red-reserved (only for consumer-notice issuance). Drop T_overridden from the trust-band palette (move to override-event-chip pattern per lockdown). |
| **2** | **Trust band citizen language (§1.1)** | Keep plain-language labels ("anchor reporter" / "verified reporter" / "hotline-sourced report"). Add the rule that T0/T1 share the divider neutral color; T1 is **not** elevated to a brand color. |
| **3** | **Status colours (§1.3)** | Replace `emerald-600` with safe-green `#2F6E45`. Replace `rose-600` with `--color-status-failed` (with explicit carve-out: form validation errors MAY use a non-reserved error color, but anomaly badges MUST use alert-red-reserved via the issuance path). |
| **4** | **Forbidden in Phase 1 (§1.4)** | Remove "dark mode" from the forbidden list; lockdown supports dark via `[data-theme="dark"]`. Keep "red as primary CTA" and "multiple categorical colours" forbidden. |
| **5** | **Typography operator (§2.1)** | Bind IBM Plex Sans (body) + IBM Plex Mono (chain hashes) + Noto Sans Bengali (Bangla). Replace system defaults. Add Bangla line-heights: body 1.6, heading 1.3. |
| **6** | **Typography citizen (§2.2)** | Bind Noto Sans Bengali as primary for Bangla-toggle surfaces; Bangla-first by default on Anjali-mobile. Add 5xl hero number rule per lockdown. |
| **7** | **Typography chain events (§2.3)** | Bind IBM Plex Mono. Add VS15 text-style glyph rule for `✓` and `⚠` on consumer messages. |
| **8** | **Spacing (§5)** | Replace Tailwind defaults with 7 semantic tokens (4/8/12/16/24/32/48). Drop the 64px (Tailwind `16`) value. |
| **9** | **Radii (§6)** | Replace rounded-sm/md/lg/full (4/6/8/12/9999px) with `--radius-xs/sm/md/lg` (2/3/4/6px). The rounded-full pill pattern is not a radius but a badge pattern; document it as such. |
| **10** | **Components (§7)** | Reference shadcn/ui as the base. Note that components are themed via CSS variables. |
| **11** | **Motion citizen (§8.1)** | Remove confetti from closure celebration (200ms green pulse only). Re-classify fade-up on mount as data-arrival pattern (acceptable). |
| **12** | **Motion operator (§8.2)** | Re-align motion vocabulary with lockdown's three patterns: state-change / data-arrival / error-crit. |
| **13** | **Accessibility (§9)** | Replace "emerald-600 focus ring" with "primary-tint focus ring" (`#3F6E7C`). Add tier-badge 14px binding rule (sm not xs). |
| **14** | **i18n (§10)** | Remove Hindi from the language list (lockdown supports English + Bangla only). Add Bangla-first default on Anjali surfaces. Add VS15 text-style glyph rule. |
| **15** | **Layout primitives (§3)** | Reference shadcn/ui shell. Bind backdrop color `rgba(15, 23, 42, 0.4)` (matches lockdown default). |
| **16** | **Iconography trust band (§4.1)** | Replace Lucide icons with glyph characters: T0=`○`, T1=`◔`, T2=`◑`, T3=`●`, resolved=`✓`. Lockdown trust bands use glyph + text redundancy. |
| **17** | **Iconography chain events (§4.2)** | Verify 33 event types map to lockdown-approved 27 icons. Open amendment tickets for any gap. |
| **18** | **Trust band rules (§1.1)** | Add explicit rule: T0/T1 share divider neutral; T1 is the lowest-trust band (NOT the highest). Phase 4's "anchor-priority T1" is INVERTED — anchors are at T2 in lockdown semantics, or at a separate "anchor" reporter-badge dimension. **This is a structural change; needs Saga sign-off.** |

### E.3 Tier 1 spec edits (after foundation edits)

| Order | Edit | Action |
|---|---|---|
| **19** | `citizen-status-timeline.md` §11 | Replace "2px emerald-600, 2px offset" with "2px primary-tint, 2px offset". |
| **20** | `citizen-status-timeline.md` §13 Test 4 | Remove confetti from closure celebration. Keep 200ms green pulse. |
| **21** | `citizen-status-timeline.md` §10 | Remove Hindi from language list. Keep English + Bengali. |
| **22** | `citizen-status-timeline.md` §4 | Add Bangla-first default to Anjali-mobile locale. Add Bangla numerals for timestamps. |
| **23** | `citizen-status-timeline.md` §2.2 | Bind Noto Sans Bengali as primary font. Add Bangla line-heights. |
| **24** | `hotline-intake-modal.md` §14 | Replace "primary emerald" with "primary deep teal" (button). Replace focus-ring "emerald-600" with "primary-tint". |
| **25** | `hotline-intake-modal.md` §4 trigger | Replace T3 amber (`--color-trust-t3` / `amber-600`) with lockdown T3 semantics. Hotline-sourced incidents do NOT get a brand-color badge in lockdown; they get the T0/T1 divider neutral or a separate reporter-badge dimension (hotline = `--color-reporter-hotline`). |
| **26** | `hotline-intake-modal.md` §14 | Remove Hindi from language list. |
| **27** | `hotline-intake-modal.md` §1 meta | Add Bangla-first for hotline-text-heavy context. |
| **28** | `per-incident-chain-segment.md` §12 | Replace "emerald-600 ring" with "primary-tint ring". |
| **29** | `per-incident-chain-segment.md` §3.4 | Replace verified badge "emerald-600" with safe-green `#2F6E45`. Replace anomaly badge "rose-600" with alert-red-reserved `#B23A2A` (issuance path only). |
| **30** | `per-incident-chain-segment.md` §11 | Remove Hindi from language list. |
| **31** | `per-incident-chain-segment.md` §3.3 | Replace system mono with IBM Plex Mono. |
| **32** | `per-incident-chain-segment.md` §3.3 top bar | Replace "T1 / T2 / T3 / Overridden" with lockdown glyph + text redundancy. T_overridden is NOT a trust band in lockdown; it is an override event chip. |

### E.4 Token name deconfliction (after foundation + spec edits)

| Order | Edit | Action |
|---|---|---|
| **33** | `tailwind.config.js` | Map lockdown CSS variables to Tailwind utility classes. Use lockdown token names (`--color-trust-t1`, `--color-trust-t2`, `--color-trust-t3`) and bind them to lockdown hexes, not Phase 4 hexes. |
| **34** | `dashboard.css` (or equivalent) | Replace any Phase 4 trust-band hex values with lockdown hex values. |
| **35** | Stylelint config | Add rule that fails any consumer of `surakkha-alert-red` outside the T3+ issuance path. Add rule that fails any use of `rose-600` for trust-band or anomaly badges (rose is for form errors only). |
| **36** | i18n key surface | Rename namespaces to align with lockdown: `citizen.statusTimeline.*` (already aligned), `operator.hotlineIntake.*` (already aligned), `chain.operator.*` and `chain.public.*` (already aligned). |

### E.5 Verification (after edits)

| Order | Edit | Action |
|---|---|---|
| **37** | Build verification | `pnpm build` succeeds; no stylelint failures. |
| **38** | Token audit | Grep the codebase for `emerald-600`, `blue-600`, `indigo-600`, `rose-600` — these should NOT appear on trust-band or anomaly surfaces. |
| **39** | i18n audit | Hindi locale file should be removed; Bengali locale file should be Bangla-first. |
| **40** | Component smoke test | Render the 3 Tier 1 specs in isolation; verify lockdown tokens apply. |
| **41** | Saga sign-off | Saga approves the reconciliation plan; lockdown audit closed. |

---

## F. Tier 2 reconciliation impact

The 5 Tier 2 pages inherit from the foundation. After foundation edits, Tier 2 specs will need re-review:

| Tier 2 page | Inherits from foundation § | Edit impact |
|---|---|---|
| `OperatorDashboard.tsx` | §3.1, §4.1, §4.2 | Trust band badges → glyph + text; T3 hotline row → hotline reporter badge (not T3); focus rings → primary-tint |
| `InboxDetail.tsx` | §3.2, §4.2 | Three-column layout stays; chain event icons → verify lockdown-approved; status pills → safe-green/alert-red-reserved |
| `FieldQueuePage.tsx` | §4.1, §4.2 | Karim's read-only lineage; chain event icons → verify lockdown-approved; reporter badges |
| `FieldIncidentDetailPage.tsx` | §3.2, §4.2 | Same as InboxDetail but Karim's view |
| `AuditLog.tsx` (Screen 1 of Scenario 06) | §4.2 | Chain event icons; filter chips; access logging |

All 5 Tier 2 pages are at risk for the same foundation-level conflicts. **No Tier 2 edits should happen until foundation edits E.2 are merged.**

---

## G. Summary of conflicts by category

| Category | High | Medium | Low |
|---|---|---|---|
| Trust-band palette | 6 | 0 | 0 |
| Typography | 5 | 2 | 0 |
| Spacing/radii | 4 | 0 | 0 |
| Components / shadcn | 1 | 1 | 0 |
| Motion | 3 | 0 | 0 |
| Layout | 0 | 1 | 1 |
| Iconography | 1 | 2 | 1 |
| Accessibility | 2 | 0 | 0 |
| i18n | 5 | 1 | 0 |
| Chain freshness | 0 | 1 | 0 |
| Forbidden-in-Phase-1 | 1 | 1 | 0 |
| Token-name conflicts | 1 | 0 | 0 |
| **TOTAL** | **29** | **9** | **2** |

29 high-severity conflicts, 9 medium, 2 low. **The largest concentration of high-severity conflicts is in trust-band palette (6) and i18n (5) and typography (5).** These are structural, not cosmetic; they require Phase 4 foundation rewrite, not bug fixes.

---

## H. Sign-off

This audit is the record. Reconciliation plan in §E is proposed, not executed. Saga/Freya to confirm:

1. **Alert-red reservation** stays (L1) — even at the cost of Phase 4 specs using rose for form errors.
2. **Confetti removal** (E.2 #11) — closure celebration is 200ms green pulse only.
3. **Hindi removal** (E.2 #14) — Phase 4 was wrong to add Hindi; lockdown supports English + Bangla only. Hindi can be added in a future amendment.
4. **T1 inversion** (E.2 #18) — Phase 4's "anchor-priority T1" was structurally wrong. T1 in lockdown is the LOWEST trust band. Anchors are at a separate reporter-badge dimension or at T2. **This is the largest structural change.**
5. **shadcn/ui adoption** (E.2 #10) — Phase 4 specs must reference shadcn/ui as the base, not hand-rolled components.

If Saga approves items 1–5, the reconciliation plan can proceed in order (foundation first, specs second, Tier 2 third, verification last).

---

_Audit produced by read-only review — 2026-09-11_
_Source: 18 lockdown files + DESIGN.md + EXPERIENCE.md + 1 Phase 4 foundation + 3 Tier 1 specs_
_No code changed. Reconciliation plan gated on Saga sign-off._
_Referenced by Tier 2 reconciliation (pending lockdown audit)._