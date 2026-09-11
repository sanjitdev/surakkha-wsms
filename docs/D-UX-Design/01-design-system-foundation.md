# Design System Foundation — Surakkha v1

> Phase 4 — UX Design
> Locked once here; referenced by every page spec
> Produced by Saga/Freya — 2026-09-10

This document locks the design tokens, components, and layout rules that all 23 Phase 1 screens use. Per-page specs in `docs/D-UX-Design/specs/` reference this document and don't re-spec its rules.

---

## 1. Colour system

### 1.1 Trust band palette (the only categorical colour encoding)

The trust band is the **only** colour-coded categorical signal in Surakkha Phase 1. Every other UI surface uses neutrals.

| Token | Name | Hex | Tailwind | Use |
|-------|------|-----|----------|-----|
| `--color-trust-t1` | T1 emerald | `#0E9F6E` | `emerald-600` | Anchor-priority incidents (T1 default band) |
| `--color-trust-t2` | T2 sky | `#1A73E8` | `blue-600` | Verified reporter incidents (T2 default band) |
| `--color-trust-t3` | T3 amber | `#D97706` | `amber-600` | Hotline-sourced or low-verification incidents (T3 default band) |
| `--color-trust-overridden` | T_overridden indigo | `#4F46E5` | `indigo-600` | Adi overrode from initial band; shown with shield-chevron-up icon |

**Background tints** (subtle backgrounds, never primary fills):
| Token | Hex | Tailwind |
|-------|-----|----------|
| `--color-trust-t1-bg` | `#E6F6F1` | `emerald-50` |
| `--color-trust-t2-bg` | `#E8F0FE` | `blue-50` |
| `--color-trust-t3-bg` | `#FEF3C7` | `amber-50` |
| `--color-trust-overridden-bg` | `#EEF2FF` | `indigo-50` |

**Rules:**
- Trust band badge must always pair colour with **text** (the band name T1/T2/T3 or "Overridden") AND an icon. Never colour alone.
- T_overridden always displays a hash-mark icon next to its colour to signal "this is an editor's verdict, not the system's".
- Citizens never see the T1/T2/T3 band label — they see "anchor reporter" / "verified reporter" / "hotline-sourced report" in plain language.

### 1.2 Neutrals (everywhere else)

Existing CSS variables in `dashboard.css` already define a slate-based neutral scale. Reference those. No new neutral tokens introduced in Phase 1.

### 1.3 Status colours

| Token | Use |
|-------|-----|
| `emerald-600` | Verified / ✅ / Resolved positively |
| `rose-600` | Anomaly / ❌ / Failed verification |
| `slate-500` | Pending / Silent / Awaiting |
| `amber-500` | In-progress / Warn |

### 1.4 Forbidden in Phase 1

- Red as primary CTA colour (CTA is emerald)
- Multiple categorical colour codings on one screen (trust band is the only categorical colour)
- Dark mode
- Gradients except on chain-event timeline accents (subtle, 8% alpha)

---

## 2. Typography

### 2.1 Operator surfaces (Priya / Adi / Karim)

| Role | Size | Weight | Line height | Use |
|------|------|--------|-------------|-----|
| `text-xs` | 12px | 400 | 16px | Timestamps, metadata |
| `text-sm` | 14px | 400 | 20px | Body text in lists |
| `text-sm-medium` | 14px | 500 | 20px | List rows, table cells |
| `text-base` | 16px | 400 | 24px | Detail pane body |
| `text-base-medium` | 16px | 500 | 24px | Field labels |
| `text-lg` | 18px | 500 | 28px | Section headings |
| `text-xl` | 20px | 600 | 28px | Page headers |
| `text-2xl` | 24px | 600 | 32px | KPI numbers |

### 2.2 Citizen surfaces (Anjali)

Larger, fewer weights:

| Role | Size | Weight | Use |
|------|------|--------|-----|
| `text-sm` | 14px | 400 | Metadata (timestamps) |
| `text-base` | 16px | 400 | Body |
| `text-lg` | 18px | 400 | Card body |
| `text-xl` | 22px | 600 | Card titles |
| `text-3xl` | 30px | 700 | Page titles |
| `text-5xl` | 48px | 700 | Hero numbers (e.g., "15 days since last contamination alert") |

### 2.3 Chain events (both modes)

| Role | Size | Font | Use |
|------|------|------|-----|
| `text-xs mono` | 12px | monospace | Hash anchors |
| `text-sm mono` | 14px | monospace | JSON payloads (operator mode expanded) |
| `text-sm` | 14px | sans | Plain-language event descriptions |

System monospace: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace`.

---

## 3. Layout primitives

### 3.1 AppLayout shell (operator surfaces)

Already shipped Phase 1.6a. Contains:
- Sidebar (role-specific nav)
- Top-chrome (logout, chain freshness pill, language switcher)
- 5s chain-freshness poll

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

Ratios: `240px / 1fr / 360px`. The right rail is collapsible to give DetailPane full width when an operator is in deep work.

### 3.3 Single-pane citizen surface (Anjali)

```
+------------------------------------------+
| App header (logo, language, logout)      |
+------------------------------------------+
|                                          |
|  <StatusTimeline /> (motion over data)   |
|                                          |
|  <ActionCall /> (the one thing to do)    |
|                                          |
|                                          |
+------------------------------------------+
```

Generous padding (`px-6 py-8` mobile, `px-12 py-12` desktop). Single-column until 768px, then card-stack layout for desktop.

### 3.4 Modal layer (hotline intake + dispute resolution)

Centred modal, max-width 640px (operator) / 480px (citizen), backdrop `rgba(15, 23, 42, 0.4)`. Trap focus, ESC to dismiss (with confirmation if data entered).

### 3.5 Inline form pattern

All forms use `<FieldRow>`:
- Label above input
- Helper text below in `text-sm slate-500`
- Error in `text-sm rose-600`
- Required indicator as asterisk after label, not as separate legend

---

## 4. Iconography

Use `lucide-react` (already a dep) for everything except the chain-anomaly icon.

### 4.1 Trust band icons

| Band | Icon |
|------|------|
| T1 | `Anchor` |
| T2 | `CheckCircle` |
| T3 | `Phone` |
| T_overridden | `ShieldCheck` (with hash overlay) |

### 4.2 Chain event icons

The 33 closed-enum event types per `01-business-goals.md` get icons from this palette:

| Event category | Icon |
|----------------|------|
| Incident created | `FilePlus` |
| Trust band set / overridden | `Tag` / `ShieldCheck` |
| Assigned | `UserPlus` |
| On-site | `MapPin` |
| Proof submitted | `Package` |
| Resolved | `CheckCircle2` |
| Closed | `Lock` |
| Citizen ack received | `MessageSquareCheck` |
| Ack window expired | `Clock` |
| Chain read | `Eye` |
| Chain anomaly | `AlertTriangle` |
| (everything else) | `ChevronRight` (default chevron) |

### 4.3 Status icons

| Status | Icon |
|--------|------|
| Verified ✅ | `CheckCircle2` emerald-600 |
| Failed ❌ | `XCircle` rose-600 |
| Pending / silent | `Clock` slate-500 |
| In-progress | `Loader2` (animated) amber-500 |

---

## 5. Spacing scale

4px base. Use Tailwind defaults: `1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px`. Don't introduce new spacing values.

---

## 6. Border radii

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 4px | Inline badges, hash anchors |
| `rounded` | 6px | Buttons, inputs |
| `rounded-md` | 8px | Cards, panels |
| `rounded-lg` | 12px | Modals, hero cards |
| `rounded-full` | 9999px | Pills, avatars |

---

## 7. Components (locked in `web/src/components/ui/`)

Already shipped in Phase 1.6a:

- `Button` — primary (emerald), secondary (slate outline), destructive (rose), ghost (text only)
- `Input`, `Textarea`, `Select` — same border/hover/focus tokens
- `Table` — generic typed table with sticky headers
- `Badge` — trust-band badges use colour + text + icon (never colour alone)
- `Tabs`, `Card`, `Modal`, `Toast`, `Tooltip`

**No new component primitives introduced in Phase 1.** New visual patterns compose from existing primitives.

---

## 8. Motion

Surakkha's citizen motion philosophy (per Scenario 03 and Goal 3) is **motion over data**: things should move so Anjali can see progress without reading state.

### 8.1 Citizen surfaces

- Timeline events enter with a 200ms ease-out fade-up on mount
- Status pill colour transitions over 300ms when state changes
- Closure celebration (✅ ack received): subtle confetti (1s) + green pulse (200ms)
- Respect `prefers-reduced-motion`: replace fades with instant state changes, omit confetti

### 8.2 Operator surfaces

- Status-board layout has live updates every 5s with a 100ms crossfade on changed cells
- Inbox list reorders with a 150ms ease-in-out
- Chain event rows mount instantly (no enter animation; chain reads should feel immediate)

---

## 9. Accessibility (locked rules)

- All trust band badges have `aria-label` with the band name spelled out (anchors never rely on colour alone)
- All interactive elements have visible focus rings (2px emerald-600 ring, 2px offset)
- Color contrast: WCAG AA on all text (operator surfaces can be AA+, citizen surfaces AA+)
- Keyboard nav: tab order matches visual order; all modals trap focus; ESC dismisses
- Screen reader: chain events emit `aria-live="polite"` updates when chain state changes (operator) / citizen's own incident updates (citizen)
- Form labels: always present, never placeholder-only

---

## 10. Internationalisation

- Three languages: English (default), Hindi, Bengali
- `i18n` keys at the page level; no string concatenation for sentences
- Trust band labels are localised: `T1` / `T2` / `T3` stay as code, but their *plain-language* citizen descriptions are translated ("verified citizen anchor" / "verified reporter" / "hotline-sourced report")
- Hash anchors and chain event types are not translated (they're technical identifiers)
- Citizen timeline event descriptions ARE translated (Scenario 03)

---

## 11. Rules that span all surfaces

1. **Chain is the source of truth.** No mutable state. Every UI surface reads from chain events.
2. **Trust band always shows.** Every incident row in every operator list shows its current band badge with colour + text + icon.
3. **Reasoning capture is structured, not freeform.** Where the spec requires reasoning, the form has fields (severity / category / tags / reasoning text). Never a single `<textarea>` for verification or override reasoning.
4. **Override surface is visible.** Any band shown as T_overridden surfaces a "View override reasoning" affordance. The override is not opaque.
5. **Named actors everywhere.** Every chain event displays the actor's role and name. No anonymous aggregations.
6. **Single-click verification.** The chain viewer recomputes hashes on click; pass/fail badge in <200ms.
7. **Citizen-ack silence is data.** When the ack window expires, the citizen sees a calm "We marked this closed because we haven't heard back. If something's still wrong, reopen within 30 days." Message, not an error.
8. **Hotline intake is first-class.** Hotline-sourced incidents are tagged in the chain; their reports don't disappear from operator views.

---

_Foundation locked by Saga/Freya — 2026-09-10_
_Referenced by all specs in `docs/D-UX-Design/specs/`_
