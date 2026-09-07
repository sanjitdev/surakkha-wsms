# Dimension 2 — Typography · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/typography-preview.html`
**Target landing path:** `app/frontend/tokens-typography.css`
**Upstream authority:** bmad-method `DESIGN.md` (`_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md`)

---

## 1. Scope

This document locks the typography token set for the Surakkha v1 operator-facing surfaces (Anjali-mobile, Priya-desktop, PHA-pane) and the Ramesh consumer-message channel. It covers font families, scale, weights, line-heights, glyphs, numerals, locale handling, and dark-mode treatment.

Out of scope for this dimension: iconography (dim 3), component dimensions (dim 4), spacing scale (dim 4), data format strings (dim 6), motion (dim 7).

**Carry-forward from dim 1 (color):** the palette locked in `01-color-lockdown.md` is the surface this typography renders on. The deliberate palette divergence from bmad `DESIGN.md` is informational, not corrective — see dim 1 §11. This dim-2 lockdown honours bmad's typography choices while rendering on the dim-1 palette.

---

## 2. Font families

| Token | Value | Use |
|---|---|---|
| `--font-family-sans` | `'IBM Plex Sans', 'Noto Sans', system-ui, -apple-system, sans-serif` | Latin/English body and headings on all operator surfaces |
| `--font-family-bangla` | `'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif` | Bangla body and headings on Anjali-mobile and on Bangla-toggle operator surfaces; primary on Ramesh-channel Bangla locale |
| `--font-family-mono` | `'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace` | Chain hashes, event IDs, ISO timestamps, hex values, code blocks |

**Bangla degrade rule:** Bangla text MUST degrade to a system Bangla font, never to a Latin glyph. The stack ends at `system-ui`; if the system has no Bangla font, the gateway's feature-phone fallback path sends English-locale content instead (see §6.4).

**Mono digit rule:** `--font-family-mono` is Latin-only by design. It never carries Bangla glyphs. Chain hashes and event IDs are always Latin digits in mono, regardless of locale toggle. Bengali digit substitution never applies inside mono.

---

## 3. Type scale

Seven steps, all `rem`-based to scale with user font-size preferences.

| Token | Value | Use |
|---|---|---|
| `--font-size-xs` | `0.75rem` (12px) | Reserved for tertiary metadata (timestamps, footer lines, table heads). **Not** used for tier badges in v1 — see accessibility amendment in §9. |
| `--font-size-sm` | `0.875rem` (14px) | Tier badges, reporter badges, band pills, button labels, small UI text. **Default for badges in v1.** |
| `--font-size-md` | `1rem` (16px) | Body text. Default root font size. |
| `--font-size-lg` | `1.125rem` (18px) | Card titles, list-item primaries, button emphasis. |
| `--font-size-xl` | `1.375rem` (22px) | Section headers, panel titles. |
| `--font-size-xxl` | `1.75rem` (28px) | Page titles. |
| `--font-size-display` | `2.25rem` (36px) | Display, marketing-only surfaces. Reserved; not used in v1 operator UI. |

---

## 4. Weights

Four weights. Bangla family (Noto Sans Bengali) ships all four.

| Token | Value | Use |
|---|---|---|
| `--font-weight-regular` | `400` | Body text, descriptions, default. |
| `--font-weight-medium` | `500` | Metadata emphasis, button labels, badge text, inbox row primary. |
| `--font-weight-semibold` | `600` | Card titles, section headers, page titles. |
| `--font-weight-bold` | `700` | Display, marketing. Reserved; not used in v1 operator UI. |

**Weight pairing rule:** when rendering Bangla alongside Latin in the same row, both families use the **same weight token**, not weight-substituted equivalents. Don't try to "balance" by reducing Bangla weight — Noto Sans Bengali ships with proportional weight matching Noto Sans Latin.

---

## 5. Line-heights

Five tokens. Per-family application — Latin and Bangla get different values.

| Token | Value | Use |
|---|---|---|
| `--line-height-tight` | `1.2` | Card titles, section headers, page titles, display — applies identically across all surfaces and families |
| `--line-height-body` | `1.5` | Latin/English body text on Priya-desktop and PHA-pane. Default for English prose. |
| `--line-height-body-bangla` | `1.6` | All Bangla body text — on Anjali-mobile, on Bangla-toggle operator surfaces, on Bangla consumer messages. The 1.6 ratio gives Bangla glyphs room above their inherent ascenders, which sit higher than Latin. |
| `--line-height-heading-bangla` | `1.3` | Bangla headings — tighter than body-bangla, looser than Latin headings |
| `--line-height-loose` | `1.7` | PHA-pane aggregate tile text only. Where the operator reads many tiles in a row and density is the wrong optimisation. |

**Per-family application table:**

| Surface | Latin body | Bangla body | Latin heading | Bangla heading |
|---|---|---|---|---|
| Anjali-mobile | n/a | `body-bangla` (1.6) | n/a | `heading-bangla` (1.3) |
| Priya-desktop | `body` (1.5) | `body-bangla` (1.6) | `tight` (1.2) | `heading-bangla` (1.3) |
| PHA-pane | `body` (1.5) or `loose` (1.7) for aggregate tiles | `body-bangla` (1.6) | `tight` (1.2) | `heading-bangla` (1.3) |
| Ramesh Bangla | n/a | `body-bangla` (1.6) | n/a | `heading-bangla` (1.3) |

A Bangla sentence rendered at `line-height: body` (1.5) is a brand-voice failure — the glyphs crowd their ascenders and the trust-bridge cue weakens.

---

## 6. Glyphs and numerals

### 6.1 VS15 text-style glyphs on consumer messages

The consumer-message glyph set is restricted to two characters, each forced to text-style rendering:

| Glyph | Codepoints | Use |
|---|---|---|
| Check mark | `✓` (U+2713) + `U+FE0E` (VS15) | Resolution / safe-now confirmation |
| Warning sign | `⚠` (U+26A0) + `U+FE0E` (VS15) | Caution / contamination alert |

**Hard rule:** VS15 (`U+FE0E`) is **always** present in the source string. Without it, Android WhatsApp clients and feature-phone SMS gateways render these glyphs as colourful emoji, which:
- Injects colour into a system that intentionally has none on the consumer channel
- Defeats the brand-voice rule "no emoji on operator surfaces; one neutral glyph max on consumer messages"
- Causes screen readers to announce "warning sign" as a colourful emoji rather than text, breaking the screen-reader-phrase mapping

The template strings in `EXPERIENCE.md#voice-and-tone` are the source of truth. Any template that doesn't carry VS15 must be rejected at build time.

### 6.2 One neutral glyph max per message

No emoji stacking. A T3 message can carry either `✓` or `⚠`, not both. The action word is the signal — the glyph is a redundant cue.

### 6.3 Locale-driven numeral substitution

| Context | Locale | Numeral set |
|---|---|---|
| Body text — Bangla locale | BN | Bengali digits `০`–`৯` (U+09E6–U+09EF) |
| Body text — English locale | EN | Latin digits `0`–`9` |
| Mono contexts (chain hash, event ID, ISO timestamps) | both | Latin digits always |
| Operator surface numbers (ward, count, confidence percentage) | EN (default) | Latin digits always |

The mono family carries Latin digits only. The sans family carries both Latin and Bengali digits and switches per locale. The Bangla family renders Bengali digits naturally when text is Bangla.

### 6.4 Feature-phone Bangla fallback (Ramesh-channel)

When the gateway detects that the recipient's device lacks a Bangla font (legacy Nokia 105 / 2G feature phones, Android with Bangla font uninstalled), the gateway sends the English-locale body with a Bangla transliteration note appended in parentheses. This is a graceful-degradation path, not a default.

The detection mechanism (per `EXPERIENCE.md#accessibility-floor#internationalization`) is the recipient's locale preference profile + delivery-failure heuristic. Implementation lives in the gateway, not the typography layer.

### 6.5 Time format

| Surface / context | Locale | Format |
|---|---|---|
| Operator surfaces (Priya-desktop, PHA-pane) | both | ISO 8601 + 24-hour. `2026-09-07T14:01:00+06:00` or `14:01`. Never 12-hour with AM/PM. Never locale calendar. |
| Consumer messages — Bangla locale | BN | 12-hour with `বিকাল` (afternoon, 12:00–17:59) and `রাত` (night, 18:00–23:59) suffixes. `১৪:০০ বিকাল` not `2 PM`. |
| Consumer messages — English locale | EN | 24-hour ISO 8601. `14:00` not `2:00 PM`. |

---

## 7. Letter-spacing

| Token | Value | Use |
|---|---|---|
| `--letter-spacing-tight` | `-0.015em` | Display, page titles, section headers. Tightens optical gaps in large Latin text. Not applied to Bangla (Noto Sans Bengali has its own spacing). |
| `--letter-spacing-normal` | `0` | Body text default. |
| `--letter-spacing-wide` | `0.08em` | Uppercase metadata (table heads, button labels, section labels). |
| `--letter-spacing-tracked` | `0.1em` | Trust band labels (High/Medium/Low) and other all-caps UI badges where optical letter separation matters. |

**Locale rule:** `--letter-spacing-tight` and `--letter-spacing-wide` apply only to Latin text. Don't apply them to Bangla text — the letter-spacing values are calibrated for Latin glyph spacing and will look wrong on Bangla.

---

## 8. Tabular numerals

All operator-data display contexts use `font-variant-numeric: tabular-nums`:

| Context | Why |
|---|---|
| Timestamps in inbox rows, audit timelines, event logs | Columns of figures must line up at the decimal/second boundary |
| Confidence percentages | One-decimal-place display needs alignment |
| Ratios in contrast check, ratio tables | Decimal alignment |
| Ward numbers, counts, incident IDs | Multi-row alignment |
| Chain hashes, event IDs in mono | The mono family ships with proportional figures by default; force tabular |

**Implementation:** apply `font-variant-numeric: tabular-nums` to:

- `.inbox-time`, `.inbox-meta-sub` counts, all event-time displays
- `.ratio` and similar numeric comparison cells
- All `.mono` content (chain references, event IDs, version IDs)

**Bangla interaction:** Bengali digits in tabular mode render with consistent advance widths inside the same family. Don't mix Bengali and Latin digits in the same tabular column — pick one per column.

---

## 9. Accessibility amendments from bmad review

These were flagged in `review-accessibility.md` and are honoured in this lockdown:

### 9.1 Tier-badge text size — bumped to 14px (MEDIUM finding, resolved)

bmad `DESIGN.md#components#badge-status` specified `font-size: xs` (0.75rem / 12px) for status badges. The bmad accessibility reviewer flagged that 12px medium-weight text is hard to read for low-vision operators on long shifts.

**This lockdown bumps tier-badge text to `--font-size-sm` (0.875rem / 14px).** No other token change. Reviewer finding accepted as MEDIUM; resolved in v1.

### 9.2 Per-family line-heights — explicit (MEDIUM finding, resolved)

bmad `DESIGN.md` did not specify separate line-heights per family. EXPERIENCE.md noted Bangla needs 1.6 body and 1.3 headings.

**This lockdown makes it explicit** via `--line-height-body-bangla` (1.6) and `--line-height-heading-bangla` (1.3). Reviewer finding resolved.

### 9.3 VS15 text-style glyph (MEDIUM finding, resolved)

bmad allowed `✓` or `⚠` on consumer messages without specifying text-style rendering.

**This lockdown forces VS15** (`U+FE0E`) on both glyphs. Reviewer finding resolved.

### 9.4 Bangla / Latin family split — screen-reader and rendering parity

The font family swap to IBM Plex Sans + IBM Plex Mono (per amendment `02a-font-swap-amendment.md`, 2026-09-07) leaves `--font-family-bangla` as **Noto Sans Bengali** — IBM Plex Sans ships no Bangla glyphs. This means a single rendered row can contain text from two different font families when the locale is Bangla:

- English text → IBM Plex Sans
- Bangla text → Noto Sans Bengali

This is intentional and tested. Two implications:

- **Screen-reader behaviour:** SR engines read by glyph/word, not by family. Mixing families in one row does not affect the SR output; only the visible rendering. No accessibility finding introduced by the family split.
- **Per-family line-heights still apply.** When a row contains Bangla text, `--line-height-body-bangla` (1.6) governs the row's overall line height, regardless of which family a particular glyph came from. Components reading the locale must apply this.

### 9.5 Other accessibility findings deferred to later dimensions

These are tracked but not typography-layer concerns:

| Finding | Owner dimension |
|---|---|
| Modal focus management under-specification | dim 4 (components) |
| Bangla aria-label parity rules | dim 4 (components) |
| Voice-input TalkBack parity | dim 4 (components) |
| `prefers-reduced-motion` substitution for report-received pulse | dim 7 (motion) |
| `prefers-reduced-motion` substitution for chain-verification shake | dim 7 (motion) |
| Feature-phone Bangla fallback (gateway detection) | dim 6 (data formats) |
| SMS length budget (≤ 160 chars EN GSM-7, ≤ 70 chars BN UCS-2) | dim 6 (data formats) |
| Bangla calendar formatting in PHA monthly reports | dim 6 (data formats) |
| Bangla locale toggle discoverability (Ctrl+Shift+L) | dim 4 (components) |

---

## 10. Dark-mode treatment

**No font-weight change between modes.** The dim-1 colour palette lifts brand hues and band hues on dark (e.g., `--band-high` from `#1E6E47` to `#3E9B6E`), which provides the perceptual lifting. Fonts render at the same weight in both modes.

**Why this matters:** engineering should not "fix" perceived font thinness on dark by bumping weight on dark. This creates inconsistency between modes and breaks the weight-token system. If perceived thinness is a problem, the fix is in the colour palette (dim 1) or the type scale (dim 2), not in the mode switch.

**Anti-aliasing:** IBM Plex Sans, IBM Plex Mono, and Noto Sans Bengali ship with hinting tuned for both light and dark backgrounds. CSS `font-smoothing: antialiased` (already set in dim-1) carries through.

---

## 11. Open flags (deferred, not blockers)

### Flag A · Dark-mode `font-variant-numeric: tabular-nums` may interact unexpectedly with Bengali digits on dark surfaces

- Bengali digits at tabular width on dark `bg-subtle` may read slightly thicker than expected
- Fallback if flagged: bump `--font-weight-medium` for tabular contexts only (introduces a sub-token, `--font-weight-medium-tabular`)
- Decision owner: dim 9 (system integration review on real hardware)

### Flag B · Bangla `display` size not yet rendered

- `--font-size-display` (2.25rem / 36px) at Bangla `line-height-heading-bangla` (1.3) is reserved for marketing surfaces
- Noto Sans Bengali at 36px has not been visually tested in the v1 product context
- Decision owner: dim 9 (system integration review on real hardware)

### Flag C · Bangla `font-variant-numeric: tabular-nums` consistency across locales

- The dim-2 preview HTML demonstrates tabular figures on Latin digits in inbox times
- Bengali digit substitution + tabular figures interaction has not been visually QA'd
- If Bengali tabular digits look uneven, the fix is either: (a) drop tabular-nums inside Bangla-locale columns, or (b) re-test on real Noto Sans Bengali at production sizes
- Decision owner: dim 9 (system integration review on real hardware)

---

## 12. What was deliberately rejected

These were considered and explicitly **not** included in v1. Recording rejections prevents re-litigation.

### 12.1 Variable font weights
IBM Plex Sans ships as a variable font (Plex Sans VF). Tempting to use weight interpolation for finer control. **Rejected** for v1 — variable font loading is slower on low-end Android (Anjali-mobile's target hardware) and the four-step weight scale covers all current needs. Revisit in v2 if a finer ramp is required.

### 12.2 Bangla glyphs inside icon library
Icons are dim 3. Any decision on Bangla glyph rendering inside icons (e.g., a chart icon that displays "B" for Bangla vs Latin) is held for dim 3. This lockdown says only: Bangla inside icon glyphs is **not** a typography-layer concern.

### 12.3 Web-font subsetting beyond Latin/Bangla blocks
IBM Plex Sans ships ~600 glyphs per weight. v1 ships:
- IBM Plex Sans: Latin, Latin Extended, General Punctuation, Currency Symbols
- Noto Sans Bengali: Bengali, Latin Extended
- IBM Plex Mono: Latin, Latin Extended, General Punctuation

Other scripts (Arabic, Devanagari, CJK) are **not** loaded. RTL support is deferred to v2 (per bmad `EXPERIENCE.md#accessibility-floor#internationalization`).

### 12.4 System font stack as primary
Apple's `-apple-system` (San Francisco), Windows' `Segoe UI`, Android's `Roboto` are tempting as "no download" defaults. **Rejected** — the trust-bridge cue depends on consistent rendering across all operator devices. Loading IBM Plex Sans + IBM Plex Mono + Noto Sans Bengali once and caching ensures Priya in Dhaka and Dr. Mensah on PHA-pane see the same letterforms.

### 12.5 Optical sizing axis
IBM Plex Sans ships with an `opsz` axis. **Rejected** for v1 — the seven-step scale is enough; optical sizing adds complexity without addressing a current problem.

### 12.6 Plex Sans Arabic / Devanagari / Hebrew variants
IBM Plex family ships script-specific variants: Plex Sans Arabic, Plex Sans Devanagari, Plex Sans Hebrew. Tempting to load these for future-locale coverage. **Rejected** for v1 — only Bangla + Latin are in scope per `EXPERIENCE.md#surface-IA`. RTL and additional Indic scripts deferred to v2. Token names already use `--font-family-bangla` (not a generic `--font-family-other`), so adding Arabic in v2 means a new token, not a re-fit.

---

## 13. Token consumption rules (enforced in code review)

1. **No hardcoded font-family values in components.** Use `var(--font-family-sans)` / `--font-family-bangla` / `--font-family-mono`.
2. **No hardcoded font-size values outside the seven tokens.** No `14px` or `1rem` literals in component CSS. Use `var(--font-size-*)`.
3. **No hardcoded font-weight values outside the four tokens.** No `500` or `bold` literals. Use `var(--font-weight-*)`.
4. **No hardcoded line-height values outside the five tokens.** No `1.5` literals. Use `var(--line-height-*)`.
5. **No letter-spacing values outside the four tokens.** No `0.05em` literals. Use `var(--letter-spacing-*)`.
6. **Tabular numerals on operator data only.** Body prose uses default proportional figures.
7. **Bangla locale applies `--line-height-body-bangla` and `--line-height-heading-bangla`.** Components consuming Bangla text must read the locale, not hardcode 1.5.
8. **VS15 always present in consumer-message source strings.** No emoji rendering. Build-time test fails templates missing VS15.
9. **No font-weight change between light/dark modes.** If perceived thinness is a problem, fix in colour or scale, not in mode switch.

---

## 14. Verification checklist

Before any dimension-3 work begins, confirm:

- [ ] `tokens-typography.css` exists at `app/frontend/tokens-typography.css` with all 28 typography tokens (3 family + 7 size + 4 weight + 5 line-height + 4 letter-spacing + 5 reserved/named tokens)
- [ ] All components consume typography via tokens only — no hardcoded values outside `tokens-typography.css`
- [ ] `font-variant-numeric: tabular-nums` applied to: `.inbox-time`, `.inbox-meta-sub` count contexts, `.mono` content, `.ratio` cells, all timestamps in audit timelines
- [ ] Bangla body text renders at `--line-height-body-bangla` (1.6); Bangla headings at `--line-height-heading-bangla` (1.3) — verified on Chrome and on a real Android device
- [ ] Consumer-message template strings carry VS15 (`U+FE0E`) on `✓` and `⚠` — verified by build-time test
- [ ] Bangla fallback path verified: removing Noto Sans Bengali from the font stack still renders Bangla glyphs (via system-ui fallback to system Bangla font) — NOT Latin glyphs
- [ ] Locale switcher persists to `localStorage["surakkha-locale"]` ∈ `{"en", "bn"}`
- [ ] Tier-badge text size is 14px (`--font-size-sm`), not 12px — verified in component CSS audit
- [ ] No font-weight change between light and dark — verified by inspecting `tokens-typography.css` (mode switch lives only in colour tokens)

---

## 15. Hand-off to dimension 3 (iconography)

Carry these forward as constraints, not preferences:

- **Icon library choice** — Lucide / Phosphor / Heroicons / Tabler. Each has different stroke weight, optical sizing, Bangla compatibility. Decision requires the type scale to be locked (now) and the spacing scale (dim 4) to know icon padding budgets.
- **Icon size tokens** will share the same step scale as `--font-size-*` but with separate names (`--icon-size-sm`, etc.) to avoid coupling typography to iconography.
- **Bangla inside icons** — some icons carry letter glyphs (chart with a "%", zone marker with a "B"); for Bangla locale, the icon-or-glyph decision per icon needs to be made.
- **Stroke weight on dark** — `currentColor` icons on dark backgrounds need to be tested for AA contrast at the chosen stroke width. Flag for dim-3.

---

## 16. Hand-off to dimension 4 (spacing & components)

Carry these forward:

- **Tap targets ≥ 48×48 px** (operator surfaces), ≥ 44×44 px (Anjali-mobile, Bangla glyphs justify headroom). Spec'd in `EXPERIENCE.md#accessibility-floor`; enforced in dim-4.
- **Bangla toggle discoverability** — top-chrome globe icon, `aria-label` "Language / ভাষা", keyboard shortcut `Ctrl+Shift+L`. Spec'd in accessibility review; enforced in dim-4.
- **Badge text size** — 14px (`--font-size-sm`), confirmed here. dim-4 may need to define badge padding/spacing around this.
- **Letter-spacing** values are dim-2 territory; dim-4 components consume them via tokens, not literals.

---

## 17. Hand-off to dimension 6 (data formats)

- **SMS length budget** — ≤ 160 chars English GSM-7, ≤ 70 chars Bangla UCS-2. Per template. Build-time verification, not runtime. Spec'd in `EXPERIENCE.md#component-patterns#sms-length-budget`.
- **Time format rules** — operator 24-hour ISO 8601; Bangla consumer 12-hour with `বিকাল`/`রাত`; English consumer 24-hour. Per §6.5.
- **Numeral substitution rules** — Bangla body Bengali digits; English body Latin digits; mono always Latin. Per §6.3.
- **Bangla calendar in PHA monthly reports** — locale-driven, not UI-driven. Recipient's locale preference, not PHA's UI locale.

---

## 18. Sign-off

| Reviewer | Role | Status |
|---|---|---|
| (pending) | Design lead | — |
| (pending) | Engineering lead | — |
| (pending) | Accessibility reviewer | — |

**Sign-off status note (2026-09-07):** Sign-off re-opened under amendment A (Plex-swap). All three reviewers must re-confirm. Tokens affected: `--font-family-sans`, `--font-family-mono`. Tokens unaffected: everything else (28 typography tokens, of which 2 changed value).

Once all three sign off, this document becomes the single source of truth for v1 typography. Any further changes require an amendment appending this file, not an edit.

---

## 19. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Section 1 references dim-1 §11 for the colour divergence note. | Informational cross-reference. No token values changed. |
| 2026-09-07 | **Amendment A — Font family swap to IBM Plex Sans + IBM Plex Mono.** | User direction: "crisper fonts." Sans/mono token values updated; Bangla family unchanged (Plex Sans ships no Bangla); See `02a-font-swap-amendment.md`. §9.4 added (Bangla/Latin family split + SR parity). §12.1–12.5 updated (Noto Sans / JetBrains Mono references → Plex). §12.6 added (rejected Plex Sans Arabic/Devanagari/Hebrew variants for v1). §18 sign-off re-opened. |
