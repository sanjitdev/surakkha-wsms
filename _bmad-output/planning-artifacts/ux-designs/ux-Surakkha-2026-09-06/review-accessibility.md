# Surakkha v1 — Accessibility Review (UX Spines)

- **Reviewer lens:** accessibility only (WCAG 2.1 AA / AAA, inclusive design, locale & channel reach).
- **Spines reviewed:** `DESIGN.md`, `EXPERIENCE.md` (`ux-Surakkha-2026-09-06/`).
- **Companions consulted:** `personas.md`, `escalation-policy.md`, `architecture-invariants.md`, `SPEC.md`, `epics.md`.
- **Verdict:** **CONCERNS** — strong accessibility floor and a credible inclusive-design stance, but two real gaps (badge color independence on small text, SMS channel accessibility) and several medium-tier items need to land in stories before the design is shippable.

---

## 1. WCAG contrast compliance — named color combinations

Relative luminance computed with the WCAG 2.1 sRGB formula; ratios given as `L1:L2` where the higher number is foreground.

| Pair (foreground on background) | Ratio | AA normal text (≥4.5) | AAA normal text (≥7) | AA large/UI (≥3) | Used by |
|---|---|---|---|---|---|
| `ink` (#1B2026) on `surface` (#FAF7F2) | **16.9:1** | ✓ | ✓ | ✓ | Body text, secondary button label |
| `surface` on `primary` (#0F4C5C) | **8.2:1** | ✓ | ✓ | ✓ | Primary button label (spine claims 7.4:1 — actually higher) |
| `surface` on `alert-red` (#B23A2A) | **8.0:1** | ✓ | ✓ | ✓ | Danger button — T3+ issuance only |
| `ink` on `divider` (#E1DDD4) | **13.3:1** | ✓ | ✓ | ✓ | T0/T1 badges, disabled primary label |
| `ink` on `primary-tint` (#5A8A98) | **4.9:1** | ✓ | ✗ (AAA) | ✓ | Focus ring fills, secondary actions |
| **`ink` on `amber` (#E9A23B)** | **4.0:1** | **✗ FAILS AA** | ✗ | ✓ (large/UI only) | **T2 tier badge text** |
| **`ink` on `safe-green` (#3F8F5C)** | **3.8:1** | **✗ FAILS AA** | ✗ | ✓ (large/UI only) | **Resolved-tier badge text** |
| `surface` on `amber` | 2.6:1 | ✗ | ✗ | ✗ | (would be wrong combo — confirm not used as text pair) |

### Findings — contrast

- **HIGH — T2 amber and `resolved` safe-green badges do not meet WCAG 2.1 AA for normal text.** Badge text is `xs` (0.75 rem / ~12 px) per DESIGN.md, which is normal text (not large). `ink` on `amber` = 4.0:1 and `ink` on `safe-green` = 3.8:1 — both **fail** the 4.5:1 AA threshold. The spine asserts "tier color combinations tested at 4.5:1 minimum against surface" — this appears to have been tested *with surface as the background*, not on the colored badge fills themselves. **T3 (`alert-red`) is fine** because the spine uses `surface` (white) text on red, not `ink`. **Fix:** for T2 and resolved badges, either (a) switch the badge text to `surface`/`ink` at a darker shade, (b) use a darker amber/safe-green swatch (e.g., amber `#B8801E`, safe-green `#2F6E45`), or (c) gate T2/resolved on size ≥18 pt so the 3:1 large-text rule applies. The leading glyph + text-label redundancy called out in §3 below is good, but the contrast ratio is independent of the redundancy — text must still pass.
- **MEDIUM — `primary-tint` fails AAA at 4.9:1.** AAA threshold is 7.0:1. Acceptable for AA but the spine's color-tone reads "AAA-grade"; either tighten the tint (e.g., `#3F6E7C`) or call out that focus-ring backgrounds are AA only.
- **LOW — spine understates some ratios.** Body text on surface is 16.9:1, not the stated 12.6:1; primary button is 8.2:1, not 7.4:1. Not a defect — the floors are higher than claimed — but update the numbers so implementation reviews can rely on the spine.

---

## 2. Tap target sizes

- **Operator surfaces ≥ 48×48 px ✓** (matches WCAG 2.5.5 AAA and Material Design).
- **Anjali-mobile ≥ 44×48 px ✓** (44 px meets WCAG 2.5.5 AA; Bangla glyphs justify the headroom claim).
- **MEDIUM — Bangla toggle on Priya-desktop and PHA-pane not explicitly bound to 48×48.** A locale toggle is a small control and easy to ship at 32×32. Make the 48×48 rule apply to *every* interactive element on operator surfaces, including the locale switcher, the chain-freshness clock (if clickable), and audit-browser filter chips.
- **MEDIUM — Badges are not interactive; their text is.** `xs` (12 px) at medium weight at body line-height is small. Even though the badge isn't a tap target, low-vision operators will struggle to read `T2` / `resolved` at 12 px. Recommend bumping tier badges to `sm` (14 px) — does not change the brand cue, materially improves legibility, and stays within Material/Anjali-mobile density.

---

## 3. Keyboard navigation

- Tab-order matches visual order ✓
- Focus ring `2px solid primary-tint` ✓ (visible against both surface and card backgrounds; primary-tint on surface is ~3.5:1 which is fine for a non-text indicator).
- **MEDIUM — audit-browser modal non-focus-trap is a real risk.** EXPERIENCE.md says the PHA audit-browser modal does *not* trap focus because "operators drill in and out frequently." That is a fair product call, but it must come paired with: (a) ESC always closes; (b) return-focus to the originating tile on close; (c) `inert` on the rest of the pane so screen readers and keyboard users can't wander into background chrome. As written, ESC and return-focus are not mentioned — please add.
- **MEDIUM — voice-input tap-and-hold on Anjali-mobile is not keyboard-operable.** A screen-reader user on TalkBack cannot easily hold a button for 8 seconds while dictating. Provide an equivalent "press once to start, press again to stop" or a "stop recording" affordance that is reachable via TalkBack swipe gestures and produces the same `AnjaliReportSubmitted` payload.
- **LOW — `Tab` to skip from chain-freshness clock in top chrome.** The clock is informational; mark it `aria-hidden="true"` or `role="status"` `aria-live="polite"` so it doesn't trap Tab order.

---

## 4. Screen-reader semantics

- `aria-label`s in English + Bangla with per-surface toggle ✓
- `event_id` and chain hash exposed as text with chain-reference role ✓
- **HIGH — modal focus management under-specified.** EXPERIENCE.md names "modal traps focus; ESC releases" and audit-browser as exception, but does not specify: (a) where focus lands on open (the primary action, the close button, or the modal title); (b) whether the modal announces its title and purpose on open (a screen-reader user opening the T3 issuance preview needs to hear "Tier 3 message preview — Boil water in Ward 7"); (c) whether focus returns to the originating button on close. Without these, two-tap confirmation becomes a screen-reader nightmare. Add a short sub-bullet to Interaction Primitives §2-tap-confirmation.
- **MEDIUM — Bangla aria-label parity.** The spine says "in both English and Bangla" but does not specify what governs label choice when only one is shown (e.g., when locale is Bangla, do aria-labels match the locale?). Recommend: aria-labels follow the visible UI locale; SR-only labels in the alternate locale are not needed and can confuse when read by mixed-language SR.
- **MEDIUM — voice-input affordance priority.** The spine promises "highest screen-reader priority on the Anjali-mobile first pane." That phrasing is ambiguous. Specify: TalkBack `accessibilityFocus` lands on the Report action card on first launch; on Voice Access / Switch Access the Report card is the first actionable element.
- **LOW — chain-reference role not in the WAI-ARIA spec.** `role="chain-reference"` is not a defined ARIA role. Use `role="text"` plus `aria-description="chain reference {hash}"`, or a `<code>` element with a screen-reader-friendly announcement, instead of a made-up role.
- **LOW — error copy exposes `evt_01HXYZ…` truncated.** A screen-reader user will hear "event reference evt zero one H X Y Z" — painful. Add a spelled-out form (`aria-label="chain reference {full hash}"`) for the truncated copy.

---

## 5. Color independence

- Tier badges carry a text label *and* a leading glyph (`○` `◔` `◑` `●` `✓`) ✓ — strong redundancy.
- Alert-red never the sole signal ✓
- **MEDIUM — `surakkha-alert-red` "reserved" rule is enforced by copy, not by token architecture.** Color reservation works in design review but not in code: nothing prevents a future story from using `alert-red` on a Priya error toast. Recommend: ship two CSS tokens (`--alert-red: #B23A2A;` and `--alert-red-reserved: #B23A2A;`) where the reserved variant is wired through a build-time lint rule (e.g., stylelint custom property) that fails any non-T3-issuance consumer.
- **MEDIUM — "queued" badge on Anjali-mobile is the only non-color state signal that is missing a glyph.** "queued — will send when online" is text-only (good), but the offline state elsewhere ("stale as of {TIME}", "chain fresh as of {TIME}") relies on text alone — which is fine for accessibility, but be consistent: never let a status rely on a colored dot alone, and never rely on text alone for urgency hierarchy. The spine is mostly good here; just codify it in the do/don't list.

---

## 6. Motion

- `prefers-reduced-motion` honored globally ✓ — motion replaced with non-motion cues (color shift, text label) ✓
- Motion reserved for two surfaces: report-received pulse (200 ms ease-out) and chain-verification failure shake (300 ms) ✓
- **MEDIUM — "report received" pulse is the wrong cue under reduced-motion.** A 200 ms color shift or text change is fine, but make the cue a static `Toast` or `role="status"` `"Report received"` string — *not* a color shift on the same Report button (which a screen reader will not announce). Specify the reduced-motion substitution in DESIGN.md's Do's, not only EXPERIENCE.md.
- **LOW — chain-verification shake duration.** 300 ms is short but enough to trigger vestibular discomfort for some users even without `prefers-reduced-motion`. Recommend 200 ms with a softer easing curve, or a glow/border flash instead of shake.

---

## 7. Internationalization

### Bangla glyph coverage

- `family-bangla: 'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif` ✓ — both Noto Sans Bengali and Hind Siliguri cover the full Bangla Unicode block (U+0980–U+09FF).
- "Degrade to a system Bangla font, not to Latin" — explicit in Don't list ✓ (this is the right call; many systems silently fall back to Latin glyphs and break trust).
- **MEDIUM — Bangla punctuation pairing.** Bangla uses `।` (U+0964) as full stop and `,` differently than Latin. The message template uses `—` (em-dash) as divider, which renders correctly in Bangla fonts, but the verification-horizon parentheses in `(verification_horizon)` are Latin — that breaks visual unity. Recommend using Bangla full-stop at message end and Bangla parentheses where the locale is Bangla.
- **MEDIUM — Bangla locale numerals.** The spine commits to "Bengali digits where culturally appropriate, but event_id and chain hash always render in Latin digits + `family-mono`." Good. But Bengali digits (`০`–`৯`) are taller than Latin digits; in `family-sans` Bangla, mixing digits (e.g., a ward number `৭`) with Latin punctuation can look uneven. Specify: when the locale is Bangla, all numeric tokens (zone, time, count) render in Bengali digits in body text; chain references and `event_id` always Latin in mono.
- **MEDIUM — Bangla calendar & 12-hour suffixes.** "বিকাল/রাত suffixes" (afternoon/night) are correct cultural choices. But 12-hour clock conflicts with operational reality. Priya-desktop needs unambiguous 24-hour time on shift handover (handover at "14:00" not "2 বিকাল"). Recommend: Bangla consumer messages can use 12-hour with বিকাল/রাত; operator surfaces always 24-hour ISO 8601 regardless of locale toggle. As written, the spine is ambiguous on this point.
- **LOW — RTL is not in scope but plan for it.** A future Urdu/Hindi deployment would need RTL handling; the spine does not claim i18n completeness but should add a note that RTL is deferred to v2.

### Number/date formatting

- Locale-driven ✓
- **MEDIUM — mixed-locale failures on WhatsApp/SMS.** WhatsApp Business API renders Unicode; SMS gateways segment on Unicode boundaries (UCS-2 at 70 chars per segment, GSM-7 at 160). A Bangla message in UCS-2 is ~70 chars per SMS segment; in English GSM-7 it is 160. The spine's 64-char line-length rule is right for WhatsApp rendering, but SMS costs and delivery reliability are 2–3× worse in UCS-2. Specify that the gateway picks SMS encoding per locale and that an English-locale SMS must carry the same authoritative content but in the gateway's most efficient encoding. The consumer-message contract (FR-7.3) should require identical meaning across channels, not byte-identical strings.

---

## 8. Bangla toggle and Latin/Bangla typography split

- Per-surface toggle on Priya-desktop and PHA-pane ✓
- Bangla primary on Anjali-mobile, English fallback ✓
- **MEDIUM — toggle discoverability.** No statement on where the toggle lives (top chrome? settings drawer? keyboard shortcut?). Specify in EXPERIENCE.md; ideally a single globe icon in the top chrome with `aria-label` in both locales ("Language / ভাষা") and a keyboard shortcut (`Ctrl+Shift+L` or locale-aware equivalent).
- **MEDIUM — line-height parity across families.** Bangla glyphs sit higher in the x-height than Latin, and `family-bangla` at `line-height: 1.5` will look tighter than `family-sans` at the same setting. Recommend: Bangla `line-height: 1.6` minimum in body, 1.3 in headings — explicit per-family line-height in DESIGN.md, not a shared `body` token.
- **LOW — `family-mono` for chain hashes in Bangla locale.** The mono family (`JetBrains Mono` / `IBM Plex Mono`) does not ship Bangla glyphs. If a Bangla-locale operator is reading a chain reference, the mono digits and Bengali digits in surrounding text will mix. Acceptable (digits stay Latin in mono per the spine), but call it out: the mono family is digits-and-Latin-only by design.

---

## 9. Ramesh-channel accessibility (feature phones, SMS length, WhatsApp rendering)

- WhatsApp + SMS redundancy ✓
- 64-char line-length max ✓
- One neutral glyph max (`✓` or `⚠`) ✓
- **HIGH — feature-phone SMS length budget not specified.** The spine gives a line-length rule (≤ 64 chars) but the *total* SMS length is what governs segmentation. A Bangla-locale safe-now notice in the template (`Water in {ZONE} is safe to drink. Resolves prior notice from {TIME}. Tested at {TIME}. Next routine update at {TIME}. — Dhaka PHA.`) is ~145–165 chars in English GSM-7 (1 segment) or ~80 chars in Bangla UCS-2 (2 segments). The Do-not-drink variant (`Do not drink water in {ZONE}. Use bottled or tanker-supplied water. Boil does not remove this contaminant: {CLASS}. Next update by {TIME}. — Dhaka PHA.`) is ~175–200 chars English (2 segments) or ~100 chars Bangla UCS-2 (2 segments). **Add a total-character budget per message** (≤ 160 chars English GSM-7, ≤ 70 chars Bangla UCS-2) and verify every template fits in 1 SMS segment after the gateway fills the slots. Failure mode: a 3-segment Bangla SMS in low-signal areas fails to deliver in one piece, and Ramesh reads a partial notice ("Use bottled" without "Boil does not remove this contaminant").
- **HIGH — feature phones cannot render Bangla on legacy networks.** A Nokia 105 or similar ₹1,500 feature phone on a 2G network in a Dhaka ward may not have a Bangla font installed. The SMS gateway sends Bangla as Unicode; the phone displays `????` or empty boxes. Mitigation: (a) the gateway detects recipient locale preference (from prior message or operator-issued profile) and sends English to feature-phone recipients with a Bangla follow-up if the recipient's WhatsApp supports it; (b) include a "Bangla help: tap here" link in English notices that opens WhatsApp. Add this as an explicit cross-channel fallback in EXPERIENCE.md's Channel IA or as a new sub-section.
- **MEDIUM — councillor-routed voice messages are not accessibility-tested.** A voice message from the councillor is good for low-literacy consumers, but: (a) the spine does not say the voice is *repeatable* (Ramesh may want to hear it again); (b) no text alternative is provided for deaf/hard-of-hearing consumers; (c) Bangla voice messages with Bangla dialect variance (Sylheti, Chittagonian) may not be intelligible to Ramesh. Recommend: voice messages include a `— text follows in WhatsApp` follow-up, and the gateway records the councillor voice clip with `transcript_stored: true` for future re-broadcast.
- **MEDIUM — WhatsApp rendering of the em-dash divider and `⚠`.** Em-dash (`—`) renders correctly across clients; `⚠` is a VS16 emoji and may show as text on older Android WhatsApp clients, which is acceptable (the spine allows neutral glyphs). However, the `✓` glyph is text-style on older clients and emoji-style on iOS — inconsistent. Specify: use VS15 (text-style) `✓ U+FE0E` and `⚠ U+FE0E` so the glyph always renders as text and never as a colored emoji (which would inject color into a system that intentionally has none).
- **MEDIUM — emoji / accessibility scope creep.** The spine allows `✓` or `⚠` on consumer messages. Screen readers on Android/iOS announce `⚠` as "warning sign" — which is the intended signal — but announce `✓` as "check mark" or "heavy check mark" depending on VS16/VS15. Make the SR announcement explicit: in English locale, `✓` reads "confirmed"; in Bangla, the word "নিরাপদ" (safe) is the signal, not the glyph. Spec the glyph-to-SR-phrase mapping.
- **LOW — message idempotency on SMS retry.** SMS gateways retry on no-ACK; if Ramesh receives the same notice twice in 5 minutes, he may panic ("is it worse?"). The spine says "failed delivery retries and escalates" but does not say "successful delivery does not retry." Make the idempotency window explicit (e.g., `message_id` deduped for 60 minutes per channel).
- **LOW — phone-as-network for Anjali offline.** When Anjali's queue drains, she sees "X queued, Y sent." This is great accessibility info, but the screen reader will read `X queued` as the literal letter X. Spell the variable: `aria-label="{n} queued, {m} sent"`.

---

## 10. Other accessibility findings

- **LOW — color-cue radius.** The spine says "rounded components carry the humane-trust-bridge cue; sharp corners read as corporate-formal." Rounded corners do not affect WCAG compliance, but the brand decision is sound. Note: WCAG 2.2 added "Focus Not Obscured (Minimum)" — focus rings must not be obscured by adjacent rounded surfaces. With 16px rounded corners and a 2px focus ring, the ring can clip against the corner; recommend focus rings be outset (3–4 px) so the full ring renders outside the rounded edge.
- **LOW — operator "tooltip on long-press" for disabled button reason is mobile-only.** WCAG 2.1 SC 1.4.13 (Content on Hover or Focus) requires the tooltip to be dismissable, hoverable, and persistent. Long-press on mobile is *not* hover or focus in the WCAG sense; the disabled-reason tooltip should also fire on keyboard focus, not only long-press.
- **LOW — chain-freshness clock as "live status."** If the clock is `role="status"`, screen readers will announce every update (every 0.3 s — too chatty). Use `aria-live="off"` for the clock and only set `role="status" aria-live="polite"` when freshness crosses a threshold (e.g., > 2 s stale).
- **LOW — Bengali calendar formatting in PHA reports.** The spine says Bengali calendar where appropriate. Bengali calendar months (Boishakh, Joishtho, etc.) need explicit Unicode CLDR data; the message template uses ISO 8601 for English locale and Bengali calendar for Bangla locale — make sure PHA monthly reports (auto-generated) use the locale that matches the recipient's preference, not the PHA's UI locale.
- **LOW — audit-chain browser keyboard shortcuts.** Power-user feature on PHA-pane should advertise them in an `aria-keyshortcuts` attribute (e.g., `aria-keyshortcuts="Alt+ArrowDown"`).

---

## 11. Story-level actions (recommendations, not blockers)

1. **Tier-badge contrast** — bump T2 amber and resolved safe-green to darker swatches OR use `surface` text on the badge fill. Required before any operator-screen story ships.
2. **Modal focus spec** — add a short Accessibility sub-section to the Two-tap confirmation primitive specifying focus-on-open, ESC, return-focus, and SR announcement of message title.
3. **SMS total-character budget** — add to Ramesh-channel IA a hard cap (≤ 160 chars English, ≤ 70 chars Bangla UCS-2) with a per-template verification step in the message-template story.
4. **Feature-phone Bangla fallback** — add to Channel IA an explicit Bangla→English fallback for feature-phone recipients without Bangla fonts, with the same authoritative content.
5. **Per-family line-height** — Bangla gets explicit `line-height: 1.6` body, `1.3` headings in DESIGN.md.
6. **Tier-badge text size** — bump from `xs` (12 px) to `sm` (14 px).
7. **Voice-input TalkBack parity** — add "press twice" or "press again to stop" alternative to tap-and-hold; flag in the voice-input primitive.
8. **Audit-browser modal non-focus-trap** — add `inert` on background pane and return-focus on close.
9. **Glyph VS15/VS16 spec** — force VS15 on consumer-message glyphs (`✓ U+FE0E`, `⚠ U+FE0E`); spec the SR phrase mapping.
10. **Voice-message text fallback** — every councillor-routed voice message emits a WhatsApp/SMS text follow-up.

---

## 12. Summary

The spines take accessibility seriously and avoid most of the common civic-tech traps (no login, no app install, no dashboard, voice-first on mobile, locale toggle, SMS as first-class). The contrast story is mostly excellent and the inclusive-design posture is real, not theater.

The two **HIGH** findings (tier-badge contrast on small text; SMS length + feature-phone Bangla fallback) and the modal-focus and Bangla-aria-label gaps are the items that need to land in stories before this design is shippable to a lighthouse city. Everything else is polish that can land alongside the implementation stories.

**Verdict:** CONCERNS — shippable after the two HIGH items are addressed in the relevant stories (Anjali-mobile tier-badge accessibility, Ramesh-channel SMS budget + feature-phone fallback, modal-focus spec for T3 confirmation).