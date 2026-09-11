# Design System Foundation — Surakkha v1

> Phase 4 — UX Design
> **Lockdown-bound:** every rule below is bound to `_bmad-output/design/` (18 dimension files) + `_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/{DESIGN,EXPERIENCE}.md`.
> Per `DESIGN.md`: "Spine wins on conflict." Both DESIGN.md and EXPERIENCE.md win against any mock, wireframe, or import.
> Page specs in `docs/D-UX-Design/specs/` reference this document and don't re-spec its rules.
> Produced by Saga/Freya — 2026-09-11 (rewritten after lockdown reconciliation; superseded foundation at git history).

---

## 1. Colour system

### 1.1 Trust band palette — LOCKDOWN-BOUND

**Trust band = verification state. Reporter badge = source attribute. These are two different data dimensions, not one.**

| Token | Name | Hex | Use |
|-------|------|-----|-----|
| `--color-trust-t1` | T1 unverified (neutral) | `#E1DDD4` (divider) | Lowest verification state — divider neutral. The structural default. |
| `--color-trust-t2` | T2 verified | `#B8801E` (amber) | Some verification signals present. |
| `--color-trust-t3-issuance` | T3 issuance | `#B23A2A` (alert-red-reserved) | **RESERVED — T3+ consumer-notice issuance ONLY.** Build-time lint (stylelint) fails any non-issuance consumer. Never for general operator UI. |
| `--color-trust-resolved` | Resolved | `#2F6E45` (safe-green) | Resolved positively. |

**Reporter badge palette — SEPARATE dimension from trust band:**

| Token | Hex | Use |
|-------|-----|-----|
| `--color-reporter-anchor` | `#2F6E45` (safe-green) | Anchor citizen reporter (verified nid) |
| `--color-reporter-hotline` | `#3F6E7C` (deep-teal-tint) | Hotline operator (proxy reporter) |
| `--color-reporter-webform` | `#1B2026` (ink) | Web-form reporter (default) |
| `--color-reporter-sensor` | `#B8801E` (amber) | Sensor-fired incident (no human report) |

**Rules:**
- Trust band badge ALWAYS pairs colour + text (T1/T2/T3/Resolved) + glyph character (○/◔/◑/●/✓). Never colour alone.
- Glyph characters are **not** Lucide icons. Lockdown specifies glyph characters for trust-band redundancy.
- Citizen surfaces never see T1/T2/T3 band labels — they see plain-language verification state ("verified" / "not yet verified") and the reporter badge if relevant.
- An anchor reporter is **not** elevated to a trust-band colour. Anchors carry the `reporter_kind: anchor` attribute on the chain; the badge is the `--color-reporter-anchor` chip.
- T3 + alert-red is only used in the consumer-notice issuance path (Phase 1 SMS/Ramesh-channel, Phase 2 PHA dashboard alerts).
- Override events (`TrustBandOverridden`) are **chain events**, not a band. The override is shown as an event chip in the chain segment with the original band still visible. There is no T_overridden category in the band palette.

### 1.2 Brand palette — LOCKDOWN-BOUND

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

### 1.3 Status colours

| Token | Hex | Use |
|-------|-----|-----|
| `--color-status-pending` | `#F1F1EE` (bg-subtle) | Pending / silent / awaiting |
| `--color-status-verified` | `--color-safe-green` (`#2F6E45`) | Verified / ✅ / resolved positively |
| `--color-status-failed` | `--color-alert-red-reserved` (issuance path only) | Anomaly / ❌ / failed verification — but only via the issuance lint-enforced path; operator form validation errors use the warning colour below |
| `--color-status-warn` | `--color-amber` (`#B8801E`) | In-progress / form validation error |

**Important carve-out:** form validation errors are NOT a T3+ consumer-notice. They use `--color-status-warn` (amber). Anomaly badges from chain verification failures DO use alert-red-reserved because they're the issuance path.

### 1.4 Theme support — LOCKDOWN

**Dark mode is supported via `[data-theme="dark"]` selector** with cool-neutral scaled surfaces. Light default. Lockdown 01-color-lockdown.md §10 binds this. Operators get user-selectable theme; Anjali-mobile defaults to light for outdoor field reading.

### 1.5 Forbidden tokens

- `rose-*` (Tailwind palette) — not in lockdown. Use `--color-status-warn` for form validation errors.
- `emerald-*`, `blue-*`, `indigo-*` — not in lockdown. Phase 4 trust-band palette is fully replaced.
- T3 alert-red for general operator UI — stylelint rule enforces reservation.

---

## 2. Typography — LOCKDOWN-BOUND

### 2.1 Font families

| Token | Value | Use |
|-------|-------|-----|
| `--font-family-sans` | `'IBM Plex Sans', 'Noto Sans', system-ui, -apple-system, sans-serif` | Latin/English body and headings on all operator surfaces |
| `--font-family-bangla` | `'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif` | Bangla body and headings on Anjali-mobile and Bangla-toggle operator surfaces; primary on Ramesh-channel Bangla locale |
| `--font-family-mono` | `'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace` | Chain hashes, event IDs, ISO timestamps, hex values, code blocks |

**Bangla degrade rule:** Bangla text MUST degrade to a system Bangla font, never to a Latin glyph. The stack ends at `system-ui`; if the system has no Bangla font, the gateway's feature-phone fallback path sends English-locale content instead.

**Mono digit rule:** `--font-family-mono` is Latin-only by design. It never carries Bangla glyphs. Chain hashes and event IDs are always Latin digits in mono, regardless of locale toggle. Bengali digit substitution never applies inside mono.

### 2.2 Type scale (7-step) — LOCKDOWN-BOUND

| Token | Value | Use |
|-------|-------|-----|
| `--font-size-1` | `0.75rem` (12 px) | Tertiary metadata (timestamps, footer) |
| `--font-size-2` | `0.875rem` (14 px) | Body small, list rows, **tier badges (binding per accessibility review)** |
| `--font-size-3` | `1rem` (16 px) | Body |
| `--font-size-4` | `1.125rem` (18 px) | Card title |
| `--font-size-5` | `1.375rem` (22 px) | Section header |
| `--font-size-6` | `1.75rem` (28 px) | Page title |
| `--font-size-7` | `2.25rem` (36 px) | Display |

### 2.3 Line-heights

| Token | Value | Use |
|-------|-------|-----|
| `--line-height-tight` | `1.2` | Headings (Latin) |
| `--line-height-body` | `1.5` | Body (Latin) |
| `--line-height-body-bangla` | `1.6` | Body (Bangla) — Bangla glyphs need more leading |
| `--line-height-heading-bangla` | `1.3` | Headings (Bangla) |
| `--line-height-loose` | `1.7` | Reader-mode surfaces (PHA pane, audit browser) |

### 2.4 Operator type roles (mapping scale to roles)

| Role | Token | Use |
|------|-------|-----|
| Caption | `--font-size-1` (12 px) | Timestamps, footer |
| **Tier badge** | `--font-size-2` (14 px) | **Bumped from xs per lockdown accessibility review** |
| Body | `--font-size-3` (16 px) | Body text |
| Card title | `--font-size-4` (18 px) | Incident card titles |
| Section header | `--font-size-5` (22 px) | Panel headers |
| Page title | `--font-size-6` (28 px) | Page headers |
| Display | `--font-size-7` (36 px) | KPI numbers |

### 2.5 Citizen type roles (Anjali-mobile, Bangla-first)

| Role | Token | Use |
|------|-------|-----|
| Caption | `--font-size-1` (12 px) | Timestamps, footer |
| Body | `--font-size-3` (16 px) | Body text — Bangla line-height 1.6 |
| Card body | `--font-size-4` (18 px) | Card body |
| Card title | `--font-size-5` (22 px) | Card titles |
| Page title | `--font-size-6` (28 px) | Page titles |
| Hero | `--font-size-7` (36 px) | Hero numbers (e.g., "15 days since last alert") |

### 2.6 Chain events typography

| Role | Token | Font | Use |
|------|-------|------|-----|
| Hash anchor | `--font-size-2` (14 px) | `--font-family-mono` | Hash, event_id |
| JSON payload | `--font-size-2` (14 px) | `--font-family-mono` | Operator-mode expanded JSON |
| Plain-language event | `--font-size-3` (16 px) | `--font-family-sans` | Public-mode plain-language event |

### 2.7 VS15 text-style glyph — BINDING

On consumer messages (Anjali timeline, Ramesh-channel SMS), `✓` and `⚠` MUST carry U+FE0E (text variation selector) to force text-style rendering on iOS. Spec author writes the string as `\u2713\uFE0E` and `\u26A0\uFE0E`; copy editor reviews for VS15 inclusion.

---

## 3. Layout primitives — LOCKDOWN-BOUND

### 3.1 AppLayout shell (operator surfaces)

shadcn/ui shell + sidebar + top-chrome. Top-chrome contains: brand mark, role-specific nav, language switcher (English / Bangla), chain-freshness indicator (sub-second projection lag), logout.

Page components render inside `<main className="container--wide">`.

### 3.2 Three-column operator surface (Priya's InboxDetail)

```
+----+---------------+----------------+----------------------+
| R  | InboxRail     | DetailPane     | EventChain           |
| L  | (incident     | (verify +      | (right rail,         |
|    |  list)        |  assign +      |  chain segment,      |
|    |               |  reasoning +   |  operator mode,      |
|    |               |  history)      |  single-click        |
|    |               |                |  verification)       |
+----+---------------+----------------+----------------------+
   240px             flex              360px (collapsible)
```

Ratios: `240px / 1fr / 360px`. Right rail collapses to give DetailPane full width during deep work.

### 3.3 Single-pane citizen surface (Anjali-mobile)

Generous padding: `--space-4` mobile, `--space-6` desktop. Single-column under 768px; card-stack layout for desktop.

### 3.4 Modal layer

Centred modal, max-width 640px (operator) / 480px (citizen), backdrop `rgba(15, 23, 42, 0.4)`. Trap focus, ESC to dismiss (with confirmation if data entered).

### 3.5 Inline form pattern

`<FieldRow>`: label above input, helper text below in `--font-size-2` `--color-ink` at 70% opacity, error in `--color-status-warn`, required indicator as asterisk after label.

---

## 4. Iconography — LOCKDOWN-BOUND

Lucide v0.460.0 (MIT) for everything **except** trust bands.

### 4.1 Trust band — glyph characters (NOT Lucide)

Lockdown specifies glyph + text redundancy for trust bands:

| Band | Glyph | Text label | Reporter-badge add-on (if applicable) |
|------|-------|------------|--------------------------------------|
| T0 / uninitialised | `○` | "T0" | — |
| T1 unverified | `◔` | "T1" | `⚓` anchor / `☎` hotline / `✎` webform / `📡` sensor |
| T2 verified | `◑` | "T2" | same add-on set |
| T3 issuance | `●` | "T3" | T3 issuance path only (consumer-notice confirmation) |
| Resolved | `✓` | "resolved" | — |

Trust band uses glyph + text only — no Lucide for the band badge itself. Reporter-badge attribute uses Lucide (`Anchor`, `Phone`, `Edit`, `RadioTower`) on top of the band.

### 4.2 Chain event icons (Lucide, 27 approved)

27 icons are lockdown-approved. New icons require lockdown-amendment flow. Map chain event types to approved icons only — open amendment tickets for gaps.

| Event category | Icon | Approved? |
|----------------|------|-----------|
| Incident created | `FilePlus` | yes |
| Trust band set | `Tag` | yes |
| Override event chip | `ShieldCheck` | yes |
| Assigned | `UserPlus` | yes |
| On-site | `MapPin` | yes |
| Proof submitted | `Package` | yes |
| Resolved | `CheckCircle2` | yes |
| Closed | `Lock` | yes |
| Citizen ack received | `MessageSquareCheck` | yes |
| Ack window expired | `Clock` | yes |
| Chain read | `Eye` | yes |
| Chain anomaly | `AlertTriangle` | yes |
| (everything else) | `ChevronRight` | yes (default) |

If a chain event type doesn't map to an approved icon, the spec author opens a lockdown-amendment ticket — not a free choice.

### 4.3 Status icons

| Status | Icon |
|--------|------|
| Verified ✅ | `CheckCircle2` safe-green |
| Failed ❌ | `XCircle` alert-red-reserved (issuance path) |
| Pending / silent | `Clock` neutral |
| In-progress | `Loader2` (animated) amber |

### 4.4 Bangla in icons

Icons stay Latin/abstract. No Bangla glyphs inside icons.

---

## 5. Spacing — LOCKDOWN-BOUND

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

**Bangla-aware spacing:** Bangla surfaces use `--line-height-body-bangla` (1.6) instead of `--line-height-body` (1.5). Bangla glyphs need ~10% more leading.

---

## 6. Border radii — LOCKDOWN-BOUND

4 radii only. Pill pattern is a badge component pattern, not a radius.

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | `2px` | Tag chips |
| `--radius-sm` | `3px` | Hash anchor chips |
| `--radius-md` | `4px` | Buttons, inputs, cards |
| `--radius-lg` | `6px` | Modals, hero cards |

**Trust-bridge rule (binding):** rounded corners carry the humane trust-bridge cue. Do not switch to `0px` for "operational density" — the cost is the brand cue Anjali relies on.

Pill pattern (`--radius-pill: 999px` from DESIGN.md) applies to badge components — composed via the `Badge` component, not as a radius token on arbitrary elements.

---

## 7. Components — LOCKDOWN-BOUND

shadcn/ui themed via CSS variables, base components in `web/src/components/ui/`.

### 7.1 Button variants

| Variant | Background | Foreground | Border | Use |
|---------|------------|------------|--------|-----|
| Primary | `--color-primary` | `--color-surface` | none | Report submit, playbook step execute, threshold tune, dual-signature attestation |
| Secondary | `--color-surface` | `--color-ink` | `1px solid --color-divider` | Cancel, "show details", filter toggle |
| Danger | `--color-alert-red` | `--color-surface` | none | **T3+ consumer-message issuance confirmation only** |
| Ghost | transparent | `--color-ink` | none | "Cancel" / text-only actions |

### 7.2 Card

Background `--color-surface`; radius `--radius-md`; shadow `card` (`0 1px 2px rgba(27,32,38,0.06), 0 1px 3px rgba(27,32,38,0.04)`); padding `--space-xl`.

### 7.3 Input field

Background `--color-surface`; border `1px solid --color-divider`; radius `--radius-sm`; padding `--space-md`; **focus ring `2px solid --color-primary-tint`** (binding).

### 7.4 Badge — trust band + reporter

Trust band badge: glyph + text label; tier badge text at `--font-size-2` (14 px binding per accessibility review). Reporter badge: Lucide icon + label, on top of the trust band.

### 7.5 Modal

shadcn `Modal` themed via CSS variables. Centred, max-width 640px (operator) / 480px (citizen). Backdrop `rgba(15, 23, 42, 0.4)`. Trap focus, ESC dismiss.

### 7.6 No new primitives in Phase 1

Compose from existing primitives.

---

## 8. Motion — LOCKDOWN-BOUND

Three patterns only: **state-change, data-arrival, error-crit**. Decorative animation banned. No page-load animation.

### 8.1 Citizen surfaces

- **State-change patterns:**
  - Closure celebration (✅ ack received): **200ms green pulse ONLY**. No confetti. No sparkle. No flourish.
  - Status pill colour transitions: 300ms ease-out when state changes.
- **Data-arrival patterns:**
  - New timeline event arrival: 200ms ease-out fade-up. (Acceptable as data-arrival, not page-load.)
- **Error-crit patterns:**
  - Chain anomaly banner: 300ms shake (one-shot).
- **No page-load animation.** Surakkha opens to live data. There is no load state — only projection lag (sub-second display).

### 8.2 Operator surfaces

- Status-board live updates: 5s polling with 100ms crossfade on changed cells (state-change).
- Inbox list reorder: 150ms ease-in-out (data-arrival).
- Chain event rows mount instantly (state-change, immediate).
- Modal enter/exit: 200ms ease-out fade (state-change).

### 8.3 Reduced-motion

`prefers-reduced-motion: reduce` → replace all transitions with instant state changes; omit the closure green pulse; omit the chain anomaly shake.

### 8.4 Spinner rules

- Sub-second: no spinner
- >2s: inline spinner
- >30s: chain monitor surface (operator-only)

---

## 9. Elevation — LOCKDOWN-BOUND

| Token | Value | Use |
|-------|-------|-----|
| `flat` | `0` | Operator chrome, Anjali-mobile card stacks |
| `card` | `0 1px 2px rgba(27,32,38,0.06), 0 1px 3px rgba(27,32,38,0.04)` | Priya-desktop incident rows, PHA-pane aggregate tiles |
| `panel` | `0 2px 6px rgba(27,32,38,0.08), 0 1px 2px rgba(27,32,38,0.04)` | PHA-pane audit-browser query results |
| `modal` | `0 8px 24px rgba(27,32,38,0.12), 0 2px 6px rgba(27,32,38,0.06)` | Confirmation modals (T3+ issuance only) |

Elevation follows cognitive load, not visual hierarchy alone.

---

## 10. Accessibility — LOCKDOWN-BOUND

### 10.1 Contrast

- All text on operator surfaces: WCAG 2.1 AA (4.5:1 normal, 3:1 large).
- All text on citizen surfaces: AA+ where surface permits.
- Tier badges: 14 px font + binding colour pairings to clear WCAG AA at the chosen pair (T2 amber on surface = 4.7:1; safe-green on surface = 5.1:1).
- Ink on surface: 16.9:1 (AAA).

### 10.2 Focus

- Focus ring `2px solid --color-primary-tint` (`#3F6E7C`) with `2px offset`. (Binding — replaces any emerald / blue / indigo focus.)
- Visible on all interactive elements.

### 10.3 Keyboard nav

- Tab order matches visual order.
- All modals trap focus; ESC dismisses.
- All form fields have visible labels (never placeholder-only).
- Chain viewer operator mode: j/k to navigate rows, Enter to expand, v to verify, a to acknowledge anomaly, ? to open help modal.

### 10.4 Screen reader

- Trust band badges emit `aria-label` with the band name spelled out.
- Chain event rows emit `aria-live="polite"` updates when chain state changes.
- Citizen timeline updates emit `aria-live="polite"`.
- Form errors announce via `aria-describedby` linkage to the error message.

---

## 11. Internationalisation — LOCKDOWN-BOUND

### 11.1 Languages

**English + Bangla. No Hindi in Phase 1.**

### 11.2 Bangla-first surfaces

- Anjali-mobile: Bangla default.
- Bangla-toggle surfaces: Bangla default.
- Operators can toggle English/Bangla; preference persists per session.

### 11.3 VS15 text-style glyph

`✓` and `⚠` MUST carry U+FE0E on consumer messages (Ramesh-channel, Anjali timeline). String literal in copy: `\u2713\uFE0E` and `\u26A0\uFE0E`.

### 11.4 Locale-at-container

The container decides locale; no per-string locale tags. i18n keys at the page level.

### 11.5 Translation surface

- Trust band labels: localised plain language ("verified" / "not yet verified" / "resolved"). Bangla strings per `06-data-formats-lockdown.md`.
- Reporter badges: localised plain language ("anchor citizen" / "verified reporter" / "hotline call" / "sensor reading").
- Hash anchors and chain event types: NOT translated (technical identifiers stay English).
- Citizen timeline event descriptions: localised plain language.
- Ramesh-channel messages: 64-char line length max; signature line `— {issuing_authority} ({verification_horizon})`.

---

## 12. Rules that span all surfaces

1. **Chain is the source of truth.** No mutable state. Every UI surface reads from chain events.
2. **Trust band is verification state; reporter badge is source attribute.** Two different data dimensions. A reporter can be an anchor (reporter-badge) at any trust band (verification state).
3. **Glyph + text for trust bands.** Never colour alone.
4. **Alert-red is reserved for T3+ consumer-notice issuance.** Build-time lint enforced. Operators and Anjali never see red in normal operation.
5. **No decorative animation, no page-load animation, no confetti.** Motion only for state-change / data-arrival / error-crit.
6. **Spine wins on conflict.** DESIGN.md and EXPERIENCE.md override any mockup, wireframe, or import.
7. **Reasoning capture is structured, not freeform.** Where the spec requires reasoning, the form has fields (severity / category / tags / reasoning text). Never a single textarea for verification or override reasoning.
8. **Override surface is visible.** Any band shown with an override event chip surfaces a "View override reasoning" affordance. The override is not opaque.
9. **Named actors everywhere.** Every chain event displays the actor's role and name. No anonymous aggregations.
10. **Single-click verification.** The chain viewer recomputes hashes on click; pass/fail badge in <200ms.
11. **Citizen-ack silence is data.** When the ack window expires, the citizen sees a calm "We marked this closed because we haven't heard back. If something's still wrong, reopen within 30 days."
12. **Hotline intake is first-class.** Hotline-sourced incidents carry `reporter_kind: hotline_operator` on the chain; their reports don't disappear from operator views.
13. **Form errors use `--color-status-warn` (amber), not red.** Red is reserved.
14. **Surakkha opens to live data.** Sub-second projection lag is the design contract. Users see chain freshness at a glance via the top-chrome indicator.

---

## 13. Cross-references

- Visual identity, colour rationale, brand voice → `_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md`
- Behaviour, IA, voice, state patterns → `_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/EXPERIENCE.md`
- 18 dimension lockdowns → `_bmad-output/design/{01-color,02-typography,03-iconography,04-spacing-components,...}.md`
- Lockdown audit (this reconciliation) → `docs/D-UX-Design/decisions/00-lockdown-audit.md`

---

_Foundation bound to bmad lockdown system — Saga/Freya — 2026-09-11_
_Supersedes Phase 4 foundation written 2026-09-10 (git history)._
_Referenced by all specs in `docs/D-UX-Design/specs/`._
