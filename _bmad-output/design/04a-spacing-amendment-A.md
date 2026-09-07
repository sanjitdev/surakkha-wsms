# Dim-4 Amendment A — Pro-grade spacing refinement

**Status:** APPLIED (2026-09-07)
**Affected doc:** `04-spacing-components-lockdown.md`
**Affected preview:** `spacing-preview.html`
**Backreferences:** dim 4 §21 (carry-forward to dim 5), dim 2 §9.4 (Bangla fallback)
**Re-opens:** dim 4 §24 sign-off

---

## What changed

Three refinements in a single pass, all driven by the user's "professional grade / soothing to the eye" criterion. Token names are new where required; existing tokens are unchanged.

### A.1 Card heading + body padding rule

Added a refinement to dim-4 §9 — cards **with a heading** now use `--space-xl` (24 px) block padding, while **body-only** cards keep `--space-lg` (16 px) all sides. Existing token values, just one new behavioural rule.

| Card type | Block padding | Inline padding |
|---|---|---|
| Heading + meta + body (most cards) | `--space-xl` (24 px) | `--space-lg` (16 px) |
| Body-only / compact card | `--space-lg` (16 px) | `--space-lg` (16 px) |

**Rule of thumb:** a card with `.card-title` is `card--with-heading`. A card without is `card--compact` (inline advisor notes, status blocks, call-outs). The visual rhythm for "I am a content region with structure" is airier than "I am a content block".

### A.2 Row height tokens (two new tokens)

Pulled forward from deferred dim-5 (grid) decisions. Two row-height tokens, no third.

| Token | Value | Use |
|---|---|---|
| `--height-row-default` | `40px` | Compact scan rows: sensor-status board, single-line logs, voice-relay call-logs where Priya scans 80+/hour. |
| `--height-row-comfortable` | `56px` | Sustained-reading rows: inbox rows with two-line Bangla previews, Anjali report inbox where each row is read in full. |

The 32 px dense row (proposed earlier) is **not added** — `40 px` is the new floor for compact scan. Anything tighter than 40 px forces truncation on Bangla text and reduces icon-to-text legibility on tablet viewports.

**Default vs comfortable choice rule:** if a row contains both a title and a meta line, it is `comfortable` (56 px). If it contains only a single line of text, it is `default` (40 px).

### A.3 Bangla-aware spacing rules

Three component-level rules added to dim-4 §15 — these are the *spacing* consequences of dim-2's *font-family* decisions. Bangla fallback path is locked; this amendment pins down the spacing behaviour within that path.

| Component | Latin behaviour (existing) | Bangla behaviour (new) |
|---|---|---|
| Inbox row | `height: --height-row-default/comfortable` | `[data-locale="bn"] .row-row { padding-block: calc(var(--space-md) + var(--space-xs)); }` — adds one `--space-xs` (4 px) tier of block padding per row to absorb Bengali descender height. |
| Toast | `gap: --space-md` (12 px) between icon and text | `.toast--bangla { min-width: 280px; gap: 0.5em; }` — em-based gap so it tracks the Bangla line-height; min-width prevents short messages like "জমা হয়েছে" from rendering as a cramped ribbon. |
| Icon+text gap (when icon leads Bangla text) | `--space-sm` (8 px), per dim 3 §6.4 | `gap: 0.5em` (em-based) inside Bangla-locale containers — see rule below. |

**The em-based gap rule:** when a container is `[data-locale="bn"]` AND it contains an icon followed by Bangla text, the gap becomes `0.5em` instead of `--space-sm`. This is implemented via:

```css
[data-locale="bn"] .icon-text-pair { gap: 0.5em; }
.icon-text-pair { gap: var(--space-sm); }  /* default Latin = 8 px */
```

`em` is unit-of-line-height. `0.5em` of Bangla body text (`--font-size-sm` = 13 px × `--line-height-body-bangla` = 1.6) gives ~10 px of vertical breathing room around the icon — visually proportional to a Latin 8 px gap but never fighting the line-height.

## Why one pass

The three refinements are coupled: heading-padding airiness reads as wrong if rows beneath are cramped; Bangla row descender padding is half the value of a comfortable row, not a separate token; toast min-width is the toast-specific application of the "row/body needs vertical air for the script it carries" principle. Codifying them together keeps the spacing language consistent.

## What was rejected in this amendment

| Considered | Rejected because |
|---|---|
| 32 px dense row token | Forces Bangla descender truncation; below WCAG line-height minimum for `--line-height-body-bangla` (1.6) at any font size. |
| Per-locale padding tokens (`--space-row-bn`) | Couples spacing scale to locale; Bangla rule lives in §15 as a behavioural modifier of existing tokens, not a new token. |
| `gap: 0.4em` or `gap: 0.6em` for icon+text | `0.5em` is the midpoint that visually matches `--space-sm` (8 px) at the dominant Latin body size. 0.4 reads cramped; 0.6 reads loose. |
| Card padding `--space-2xl` (32 px) | Too airy for a 360 px-wide column — produces > 12 % vertical ratio of padding to body. 24 px (xl) sits at the acceptable ~9 % ratio. |
| Toast min-width 320 px | Empirically makes long-Latin and short-Bangla toasts look the same width, which is a *good* thing for muscle-memory targets. But 320 px forces ellipsis on some Bangla titles that wrap to 2 lines — 280 px was the right floor. |
| Conditionally applying heading-padding only when card has both heading AND meta | One heading + body (no meta) is rare in v1; the rule "card with a title uses xl padding" is the simple, mechanical version of the more complex rule. Complexity deferred until v1.1 if data shows it matters. |

## Impact assessment

**Components touched (CSS only):**
- `.card` — added `.card--with-heading` modifier class with `--space-xl` block padding
- New `.row-row` / `.row-row--default` / `.row-row--comfortable` classes for inbox rows; previously implicit in §8 nav-row class
- `.toast--bangla` modifier class with `min-width: 280px; gap: 0.5em;`

**No component data shape change.** Dim 6 still describes buttons, inputs, toasts, band-pills. **Inbox rows are NOT a v1 dim-6 component** — they are an *instance* of repeated composition of card + meta + badge, and Dim 6 describes that as a generic "list item" pattern rather than a component.

**New tokens:** 2 (`--height-row-default`, `--height-row-comfortable`). Total dim-4 token count moves from 20 to 22.

**No motion change.** Heading-padding switch is instantaneous (no transition). Bangla row padding switch is also instantaneous — locale switches are user-initiated and infrequent.

## Verification

- [x] `spacing-preview.html` §8 cards section now shows 3 `.card--with-heading` + 1 `.card--compact` with a labelled note explaining the split
- [x] `spacing-preview.html` §8.5 row heights section added (5 rows: default, comfortable, comfortable-Bangla, comfortable-Bangla-with-block-pad, plus 2 visual row-height chips for `--height-row-default` and `--height-row-comfortable`)
- [x] `spacing-preview.html` §10.5 Bangla toast sizing section added (3 toasts: short Bangla with min-width, long Bangla with em-based gap, Latin baseline)
- [x] `--height-row-default: 40px;` and `--height-row-comfortable: 56px;` added to preview `<style>` token block (light only — no dark variant needed)
- [x] `.card--with-heading` and `.toast--bangla` CSS rules added to preview `<style>`
- [x] `[data-locale="bn"] .row-row` rule added to preview `<style>`
- [x] No hardcoded px values in any new component sample
- [x] Bangla sample rows use real Bengali content (অঞ্জলি, ধানমন্ডি, মিরপুর, "পানিতে গন্ধ পাচ্ছি", etc.)

## Hand-off to dim 5 (grid & responsive) — updated

- **Row heights are now locked in dim 4** (40 px / 56 px). Dim 5 does not need to re-litigate row sizing.
- **Container max-width for dense tables:** 1280 px is fine for default rows; comfortable rows + Bangla content perform better at 1080 px max-width — flag for dim 5 review.
- **Mobile row treatment:** on viewports < 480 px, comfortable rows (56 px) feel generous — consider collapsing meta line into a single-line subtitle using `text-overflow: ellipsis` rather than removing row height. This is a dim-5/9 decision.

## Hand-off to dim 6 (data formats) — updated

- **Inbox-row data shape (NEW):** `[data-locale="bn"]` containers carry Bangla text — data shapes must accommodate the locale attribute at the container level, not per-text-field. Dim 6 codifies `{ locale: "en" | "bn" }` on inbox-row payloads, but the *rendering* is locale-driven via attribute selectors (no per-string locale tag in data).
- **Toast data shape (updated):** `{ variant, title, message?, durationMs?, locale? }` — `locale` is optional; if absent, defaults to current document locale (`<html lang>` or `data-locale` on body).

## Hand-off to dim 8 (motion) — unchanged

Row-height transitions are disabled (per dim 1 §7.6 — no transition on sizing tokens). When a row expands from `default` to `comfortable` (e.g. on hover-to-expand interaction in v1.1), the transition must be on a non-token property (e.g. `transform: scaleY` or direct height animation), not on the `height` property referencing a token.
