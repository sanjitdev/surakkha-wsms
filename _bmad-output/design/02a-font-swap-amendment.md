# Dim-2 Amendment A — Font family swap to IBM Plex

**Status:** APPLIED (2026-09-07)
**Affected doc:** `02-typography-lockdown.md`
**Affected preview:** `typography-preview.html`
**Backreferences:** dim 2 §19 amendment log row A, dim 2 §18 sign-off re-opened

---

## What changed

Two token values updated. Token names unchanged.

| Token | Before | After |
|---|---|---|
| `--font-family-sans` | `'Noto Sans', 'Inter', system-ui, -apple-system, sans-serif` | `'IBM Plex Sans', 'Noto Sans', system-ui, -apple-system, sans-serif` |
| `--font-family-mono` | `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace` | `'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace` |
| `--font-family-bangla` | `'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif` | **unchanged** |

Plex Sans is primary; Noto Sans stays as fallback for environments where Plex has not loaded yet. Plex Mono is primary; JetBrains Mono stays as fallback.

## Why

The user directed that the previous typography choice (Noto Sans / Noto Sans Bengali / JetBrains Mono) felt "not crisp enough." IBM Plex was chosen because:

- **Family coherence** — IBM Plex ships Sans + Sans Arabic + Sans Devanagari + Sans Hebrew + Serif + Mono + Condensed as one design system. Future-locale additions are additive, not a re-fit.
- **Sharper terminals and joints** than Noto Sans. Plex has more pronounced geometric construction; reads as "operator tool," not "consumer app."
- **Mono family consistency** — Plex Mono and Plex Sans share design vocabulary, so chain references (mono) and surrounding text (sans) feel like one type family.
- **Bangla fallback path is clean** — Plex has no Bangla; Noto Sans Bengali stays as the Bangla family. Bangla is its own token (`--font-family-bangla`), so this is a single-line change in the Bangla fallback rule, not an architectural one.

## Bangla fallback path (unchanged in design)

A single row in Bangla locale now draws from **two font families**:

- English text → IBM Plex Sans
- Bangla text → Noto Sans Bengali

This is intentional. The Bangla degrade rule still holds: Bangla text degrades to a system Bangla font, never to a Latin glyph. Per-family line-heights (1.6 Bangla body, 1.3 Bangla headings) still apply. See dim 2 §9.4 for screen-reader parity and per-family line-height interaction.

## Impact assessment

**No component code change required.** Components consume `var(--font-family-sans)` and `var(--font-family-mono)`; they do not reference Noto Sans or JetBrains Mono by name. The only literal change is in the two token values in `tokens-typography.css` (when written).

**Affected surfaces:** every operator UI surface (Anjali-mobile, Priya-desktop, PHA-pane) renders Latin text in Plex Sans, chain references in Plex Mono. Ramesh-channel Bangla-locale consumer messages still render in Noto Sans Bengali; English-locale consumer messages now render in Plex Sans.

**Bangla body weight parity:** Noto Sans Bengali and IBM Plex Sans ship matching weight axes (400/500/600/700). When a Bangla-locale row mixes families, both render at the same `--font-weight-*` value. Plex ships a Light weight (300) — not used in v1 per dim 2 §4.

## Font loading

Production `tokens-typography.css` (when written) will make its own font-hosting decision. The preview HTML loads IBM Plex Sans + IBM Plex Mono + Noto Sans Bengali via Google Fonts CDN:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Subset: Latin Extended for Plex Sans/Mono; Bengali + Latin Extended for Noto Sans Bengali. No Arabic, Devanagari, Hebrew, or CJK subsets loaded — deferred per dim 2 §12.6.

## What was rejected in this amendment

| Considered | Rejected because |
|---|---|
| Geist Sans (Vercel) | Unclear Bangla fallback path; younger font with less weight-axis coverage than Plex. |
| Söhne / GT America / Neue Haas Grotesk | Commercial fonts requiring license; bmad's experience spine treats Bangla coverage as load-bearing, and commercial Latin fonts rarely ship with credible Bangla pairs. |
| Inter Tightened (letter-spacing only) | No family swap; deemed insufficient to address the "crispness" feedback. |
| Loading Plex Sans Arabic / Devanagari / Hebrew | Out of scope for v1 per `EXPERIENCE.md#surface-IA`; tracked in dim 2 §12.6. |

## Verification

- [x] `typography-preview.html` `<head>` links Google Fonts for Plex Sans + Plex Mono + Noto Sans Bengali
- [x] Preview `--font-family-sans` value updated to IBM Plex Sans primary
- [x] Preview `--font-family-mono` value updated to IBM Plex Mono primary
- [x] `02-typography-lockdown.md` §2 reflects new family values
- [x] `02-typography-lockdown.md` §9.4 added (Bangla/Latin family split)
- [x] `02-typography-lockdown.md` §10 anti-aliasing note updated (Plex + Bengali)
- [x] `02-typography-lockdown.md` §12.1–12.6 reflects Plex family
- [x] `02-typography-lockdown.md` §18 sign-off re-opened with note
- [x] `02-typography-lockdown.md` §19 amendment log row A appended
- [x] No component code changed; tokens only

## Hand-off to dim 3 (iconography)

IBM Plex Sans at small sizes has crisper glyphs for icons rendered as text characters (`%`, `$`, `@`, `#`). Dim-3 icon library choice should consider whether Plex Sans can substitute for an icon at the relevant size, or whether a dedicated icon library is still needed. Plex glyphs as icons saves a network request and guarantees visual coherence with the surrounding text.
