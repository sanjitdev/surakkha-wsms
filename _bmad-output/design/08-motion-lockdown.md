# Dimension 8 — Motion · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/motion-preview.html`
**Target landing path:** `surakkha-app/src/styles/tokens-motion.css`

---

## 1. Scope & non-goals

This document locks every motion token (duration, easing, transition property) and motion pattern used across the four Surakkha v1 surfaces. Per `EXPERIENCE.md` §375: "No motion on operator surfaces for routine updates. Motion is reserved for: (1) Anjali acknowledgement ('report received' pulse, 200ms ease-out, one-shot), (2) chain-verification failure (full-screen banner with shake, 300ms one-shot). No animation flourishes elsewhere."

The motion contract is small because Surakkha is a public-trust surface — motion that draws the eye away from a real signal (T3 SLA, sensor breach) is a liability, not a feature. Everything in dim 8 follows the rule: motion exists to communicate state change, never to decorate.

**In scope:**
- 3 motion categories: state-change (transitions, flashes), data-arrival (chart new-point, action-list new-row), error/critical (ack-pulse, chain-fail shake)
- All durations, easings, and properties used in dim 5b / 5c / 5d / 5e previews
- `prefers-reduced-motion: reduce` fallback rules per surface
- Tap-target press states
- Modal/Sheet/pane enter/exit transitions
- Spinner rules (sub-second = none, >2s = inline, >30s = chain monitor)

**Out of scope (deliberately):**
- **Decorative animation** (parallax, hover-zoom, marquee, progress confetti) — banned per `EXPERIENCE.md` §375.
- **Page-load animations** (fade-in on mount, content reveal) — banned. Surakkha opens to live data; there is no "load" state, only "projection lag" (per `EXPERIENCE.md` §246-248).
- **Loading spinners < 2s** — banned per `EXPERIENCE.md` §246. Sub-second projection lag shows a chain freshness clock in the top chrome, not a spinner.
- **Continuous/infinite motion** on operator surfaces — banned. All motion is one-shot or duration-bounded. The only infinite motion is the SSE-pulse dot (signals live connection, identical to a heartbeat LED).
- **Spring physics / bouncy easing** — banned. Civic-steady means ease-out for state-change and ease-in for state-loss; never overshoot.

**Inherited from upstream dims (referenced, not redefined):**
- Dim 1 §7.6: "No `transition` on colour tokens. Colour tokens are static; transitions belong on properties that derive from them. Exception: theme-switch transition on body background/text for smooth mode change (≤150ms)."
- Dim 4 §13: pressed-state rules for buttons (deep-teal-tint for 120ms).
- Dim 5b §3.7: chart motion tokens (consolidated here, no new tokens invented).
- Dim 5c §12: Anjali mobile motion tokens (consolidated here).
- Dim 5d §10: Priya mobile motion tokens (consolidated here).
- Dim 5e §14: PHA pane motion tokens (consolidated here).
- `EXPERIENCE.md` §375 (motion floor), §394 (SLA no-animation), §179 (button pressed 120ms), §312 (countdown aria-live).

---

## 2. Motion principles (the why)

| # | Principle | Source |
|---|---|---|
| 1 | Motion communicates state change, never decorates. | `EXPERIENCE.md` §375 |
| 2 | Acute-SLA timers are visible but never animate. | `EXPERIENCE.md` §394 |
| 3 | No animation flourishes. | `EXPERIENCE.md` §375 |
| 4 | `prefers-reduced-motion: reduce` is honored globally; motion replaced with non-motion cues (color shift, text label). | `EXPERIENCE.md` §376 |
| 5 | Color tokens do not transition; properties derived from them may. | Dim 1 §7.6 |
| 6 | Easing is ease-out for state-gain, ease-in for state-loss; never overshoot. | Public-trust tone |
| 7 | All motion is one-shot or duration-bounded. The only infinite motion is the SSE heartbeat LED. | Civic-steady |
| 8 | No motion on routine updates. | `EXPERIENCE.md` §375 |

---

## 3. The motion token set

14 motion tokens. Each is a `--motion-*` CSS custom property under `:root`. Each is consumed by a single component class or surface rule (no shared motion tokens that get repurposed in confusing ways).

### 3.1 Duration tokens (ms)

| Token | Duration | Use |
|---|---|---|
| `--motion-press-120` | `120ms` | Button press state (deep-teal-tint, per `EXPERIENCE.md` §179) |
| `--motion-tab-switch` | `160ms` | Bottom-nav tab switch on mobile (dim 5c §12, dim 5d §10) |
| `--motion-toast-pane-in` | `160ms` | Institutional toast fade-in (dim 5e §14) |
| `--motion-modal-in` | `200ms` | Modal enter (Anjali acknowledgement sheet, Priya detail overlay) |
| `--motion-ack-pulse` | `200ms` | Anjali "report received" pulse (per `EXPERIENCE.md` §375) |
| `--motion-pane-transition` | `240ms` | Detail pane slide-in (dim 5c §12, dim 5d §10) |
| `--motion-aggregate-flash` | `400ms` | Aggregate tile background flash on SSE update (dim 5e §14) |
| `--motion-new-data-flash` | `400ms` | Action list row / sensor cell flash on new data (dim 5d §10) |
| `--motion-chart-tooltip-in` | `120ms` | Chart tooltip fade-in (dim 5b §3.7) |
| `--motion-chart-new-point-flash` | `400ms` | Chart new-point flash (dim 5b §3.7) |
| `--motion-chart-axis-in` | `160ms` | Chart axis fade-in (dim 5b §3.7) |
| `--motion-chart-grid-in` | `160ms` | Chart grid fade-in (dim 5b §3.7) |
| `--motion-shake-300` | `300ms` | Chain-verification failure shake (per `EXPERIENCE.md` §375) |
| `--motion-amendment-signed-flash` | `600ms` | Amendment row success-bg flash (dim 5e §14) |

The 5-second countdown ring on T3 issuance (dim 5d §9.2) is a fixed `5000ms` stroke-dashoffset transition, not a token — it has no other consumer.

### 3.2 Easing tokens

Surakkha uses 3 easings. All defined as CSS `cubic-bezier` values.

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.4, 1)` | State-gain: opening, appearing, gaining attention. Default for 80% of motion. |
| `--ease-in` | `cubic-bezier(0.6, 0, 0.8, 0.2)` | State-loss: closing, dismissing, deprecating. Used for exit transitions. |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.6, 1)` | Symmetric state-change: theme toggle, dim switch. |

**Why three (not five):**
- **1 easing** (ease-out for everything) creates a feel where dismissals "bounce" — wrong for civic-steady.
- **5 easings** (spring, anticipate, overshoot, etc.) is bouncy and decorative — wrong for public-trust.
- **3 easings** maps to: gain / loss / symmetric. Three is the minimum that distinguishes the three semantic classes.

The CSS shorthand `ease-out` / `ease-in` / `ease-in-out` map to these tokens:

```css
:root {
  --ease-out: cubic-bezier(0.2, 0.8, 0.4, 1);
  --ease-in: cubic-bezier(0.6, 0, 0.8, 0.2);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
}
```

### 3.3 Property tokens (which CSS properties are allowed to transition)

| Token | Property | Notes |
|---|---|---|
| `--motion-property-bg` | `background-color` | For flashes (new-data, aggregate, ack-pulse). **NOT** the colour token itself. |
| `--motion-property-transform` | `transform` | For slide-ins (modal, pane, sheet). |
| `--motion-property-opacity` | `opacity` | For fade-ins (toast, tooltip). |
| `--motion-property-stroke` | `stroke-dashoffset` | For chart sparkline + countdown ring. |

**Banned properties** (per dim 1 §7.6 + dim 5 §14.4):
- `color` (the colour token — never transitions)
- `background-color` of theme tokens (the theme-switch is the only exception, ≤150ms; see §6.4)
- `grid-template-columns` / `container` / breakpoint-driven properties (dim 5 §14.4)
- `width` / `height` (except on `<circle>` SVG countdown ring)
- `top` / `left` / `right` / `bottom` for layout (use `transform: translateY/X` instead — `top/left` triggers layout)
- `z-index` (per dim 4 §13)

---

## 4. Motion patterns (the how)

### 4.1 Press state (button, nav cell, link)

Per `EXPERIENCE.md` §179: "Pressed state: deep-teal-tint for 120ms then back to primary. No animation flourishes."

```css
.btn-p:active,
.priya-nav button:active,
.tier:active {
  background: var(--brand-600); /* deep-teal-tint */
  transition: background-color var(--motion-press-120) var(--ease-out);
}
```

The press state is a single transition on `background-color` only. No `transform: scale()`. No ripple. No animation. Civic-steady means the button visually "dents" for 120ms and that's all.

**Reduced-motion fallback:** same color shift; same 120ms; no change. (Press state is too brief to be considered "motion" for `prefers-reduced-motion`.)

### 4.2 Modal / Sheet / Detail pane enter

```css
@keyframes slide-up {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal, .sheet, .pane-detail {
  animation: slide-up var(--motion-modal-in) var(--ease-out);
}
```

For dim 5d's detail pane (full-screen slide-in from the right), use `translateX` instead:

```css
@keyframes slide-in-right {
  from { transform: translateX(16px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.pane-detail {
  animation: slide-in-right var(--motion-pane-transition) var(--ease-out);
}
```

For Anjali's composer modal (dim 5c §12), use `translateY` for a bottom-sheet feel:

```css
.composer {
  animation: slide-up var(--motion-pane-transition) var(--ease-out);
}
```

**Reduced-motion fallback:** `opacity: 0` → `opacity: 1` only (no translate). The element appears in place without sliding.

### 4.3 Modal / Sheet / Detail pane exit

Exit is faster than enter (per UX convention) and uses `ease-in` (state-loss):

```css
@keyframes slide-down {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(8px); opacity: 0; }
}

.modal.is-closing {
  animation: slide-down 120ms var(--ease-in) forwards;
}
```

`120ms` exit is short enough that the user perceives the modal as "gone" while still seeing the dismissal motion. Exits shorter than 100ms feel like a glitch; exits longer than 200ms feel like a delay.

**Reduced-motion fallback:** `opacity: 1` → `opacity: 0` only, 80ms.

### 4.4 Ack-pulse (Anjali "report received")

Per `EXPERIENCE.md` §375: "Anjali acknowledgement ('report received' pulse, 200ms ease-out, one-shot)."

```css
@keyframes ack-pulse {
  0% { background-color: var(--brand-100); }
  100% { background-color: var(--bg-surface); }
}

.status-row.acked {
  animation: ack-pulse var(--motion-ack-pulse) var(--ease-out) forwards;
}
```

One-shot. Plays once on the status row when the chain-event lands. The color shift from `--brand-100` (tinted) to `--bg-surface` (default) over 200ms is the visual confirmation.

**Reduced-motion fallback:** the row gets a 1-second solid `--brand-100` border highlight, then removes. No background-color keyframe.

### 4.5 New-data flash (action list row / sensor cell / aggregate tile)

When an SSE event updates an existing row:

```css
@keyframes flash-bg {
  0% { background-color: var(--brand-100); }
  100% { background-color: var(--bg-surface); }
}

.action-row.flash, .sensor-cell.flash, .aggregate-tile.flash {
  animation: flash-bg var(--motion-new-data-flash) var(--ease-out);
}
```

For sensor board cells, the status dot pulses instead of the cell background:

```css
@keyframes dot-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.4); }
}

.sensor-cell.flash .dot {
  animation: dot-pulse var(--motion-new-data-flash) var(--ease-out);
}
```

**Reduced-motion fallback:** 1-second solid `--brand-400` border on the row, no background-color keyframe. The dot does not pulse.

### 4.6 New-row slide-in (action list / inbox / audit)

When a new item arrives (not an update to an existing one):

```css
@keyframes slide-down-in {
  from { transform: translateY(-16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.action-row.is-new {
  animation: slide-down-in var(--motion-pane-transition) var(--ease-out);
  /* Then plays the new-data flash after settling */
  animation: slide-down-in var(--motion-pane-transition) var(--ease-out),
             flash-bg var(--motion-new-data-flash) var(--ease-out) 240ms;
}
```

The slide-in plays first (240ms), then the flash plays 240ms later. The cascade reinforces that the row is genuinely new, not just updated.

**Reduced-motion fallback:** opacity-only fade-in (200ms ease-out); no flash background.

### 4.7 T3 countdown ring (Priya mobile / desktop)

The 5-second ring around the `[Issue public notice]` button (per dim 5d §9.2 + `EXPERIENCE.md` §298):

```css
@keyframes ring-deplete {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 283; } /* full circumference of r=45 */
}

.countdown-btn circle.deplete {
  stroke: #fff;
  stroke-dasharray: 283;
  animation: ring-deplete 5000ms var(--ease-out) forwards;
}
```

`5000ms` is fixed (not a token) because the T3 SLA window is operationally fixed at 5 seconds. The ring is one-shot and lands on `forwards` so the button stays in "depleted" state until the user lifts their finger.

**Reduced-motion fallback:** text "5s" → "0s" countdown (no ring). The text is the redundant signal per `EXPERIENCE.md` §312.

### 4.8 SSE heartbeat (status dot)

The only infinite motion in v1. The status dot pulses to signal "live connection":

```css
@keyframes heartbeat {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.si-connecting .dot {
  animation: heartbeat 1600ms var(--ease-in-out) infinite;
}
```

`1600ms` is the human breath rate — it's the cadence a calm human uses, and it signals "alive" without being frenetic. Only used on the `connecting` and `reconnecting` states; the `connected` state has a static dot.

**Reduced-motion fallback:** static dot with `--brand-500` color. No opacity pulse.

### 4.9 Chain-verification failure (full-screen shake)

Per `EXPERIENCE.md` §375: "chain-verification failure (full-screen banner with shake, 300ms one-shot)."

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.chain-fail-banner {
  animation: shake var(--motion-shake-300) var(--ease-in-out);
}
```

The shake is symmetric (4 oscillations). The banner content is a colored strip at the top of the viewport: `--danger-bg` background, `--danger` text, "Chain verification failed. Last good anchor 14:01:32. Reference: evt_01HXYZ…"

**Reduced-motion fallback:** static `--danger-bg` strip; no shake. The text is the signal.

### 4.10 Toast enter (Sonner)

```css
.toast {
  animation: slide-up var(--motion-toast-pane-in) var(--ease-out);
}
```

`160ms` is the institutional default (per dim 5e §14). For Anjali's warmer register, the toast can use `200ms` (ack-pulse token) for slightly more presence — both are acceptable.

**Reduced-motion fallback:** opacity-only fade (120ms).

### 4.11 Theme switch (color token flip)

Per dim 1 §7.6: "theme-switch transition on body background/text for smooth mode change (≤150ms)."

```css
:root {
  --motion-theme-switch: 150ms ease-in-out;
}

body {
  transition: background-color var(--motion-theme-switch),
              color var(--motion-theme-switch);
}
```

The transition is on `body` only (the root surface). Child surfaces (cards, modals) do not transition — they snap to the new theme. This avoids the "stagger" effect that makes theme-switch feel slow.

`150ms` is the longest acceptable — anything longer is perceptible as a flash. Anything shorter is invisible.

**Reduced-motion fallback:** no transition; instant flip.

### 4.12 Chart motion (dim 5b §3.7)

| Pattern | Token | Property | Notes |
|---|---|---|---|
| Axis fade-in | `--motion-chart-axis-in` | `opacity` | On mount. |
| Grid fade-in | `--motion-chart-grid-in` | `opacity` | After axis. |
| Tooltip enter | `--motion-chart-tooltip-in` | `opacity` | On hover/tap. |
| New-point flash | `--motion-chart-new-point-flash` | `background-color` (on the data dot) | One-shot per new point. |
| SSE pulse (live mode) | `--motion-chart-sse-pulse` | `opacity` (status dot) | Infinite, like heartbeat. |

```css
@keyframes chart-new-point {
  0% { r: 4; opacity: 1; }
  100% { r: 8; opacity: 0; }
}

.chart-point.is-new {
  animation: chart-new-point var(--motion-chart-new-point-flash) var(--ease-out) forwards;
}
```

Note: animating SVG `r` requires SMIL or CSS attribute animation; if not supported, fall back to a wrapper circle with `transform: scale()`.

**Reduced-motion fallback:** new-point dot appears at full size instantly, no expansion. No tooltip fade — tooltip is always present.

### 4.13 Loading indicators (per `EXPERIENCE.md` §246-248)

| Lag | Indicator |
|---|---|
| < 2s | Nothing. Show the most-recent committed state. The chain freshness clock in the top chrome is the only lag indicator. |
| 2-30s | Small inline indicator on the affected panel only. "Stale as of {TIME}" badge. |
| > 30s | Chain-verification monitor surfaces in the chrome. The projection is stuck. |

```css
.stale-badge {
  /* No animation. Static text. */
  background: var(--warning-bg);
  color: var(--fg-default);
  font-size: var(--font-size-xs);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-xs);
}
```

No spinner. No pulse. No fade. The badge is a static text element with semantic color. The clock in the top chrome is the only running indicator on operator surfaces.

**Reduced-motion fallback:** unchanged (already static).

### 4.14 Map pin pulse (dim 5d §11)

The breach-status pin on the map pane pulses a halo to draw attention:

```css
@keyframes pin-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

.map-pin.breach .pulse {
  animation: pin-pulse 2000ms var(--ease-out) infinite;
}
```

`2000ms` cadence, infinite. The pin itself does NOT pulse — only the halo. The pulse is the only place a map element animates.

**Reduced-motion fallback:** static halo (no scale, full opacity at default size).

---

## 5. The motion matrix (per surface, per element)

The complete inventory of motion, scoped to surface + element.

### 5.1 Anjali-mobile (dim 5c)

| Element | Motion | Token | Reduced-motion fallback |
|---|---|---|---|
| Submit button press | bg color → `--brand-600` | `--motion-press-120` | unchanged |
| Composer modal enter | `translateY(16px)` → `0`, opacity 0 → 1 | `--motion-pane-transition` | opacity only |
| Composer modal exit | `translateY(0)` → `8px`, opacity 1 → 0 | 120ms exit (state-loss) | opacity only |
| Status row "acked" | bg `--brand-100` → `--bg-surface` | `--motion-ack-pulse` | 1s border highlight |
| Bottom-nav tab switch | (instant — no slide) | `--motion-tab-switch` | n/a |
| Toast enter | opacity 0 → 1 | `--motion-toast-pane-in` (160ms) | opacity only |
| Queued badge update | (instant — no motion) | n/a | n/a |

### 5.2 Priya-mobile (dim 5d)

| Element | Motion | Token | Reduced-motion fallback |
|---|---|---|---|
| Action list row press | bg color → `--bg-subtle` | `--motion-press-120` | unchanged |
| Action list row new data | bg flash `--brand-100` → `--bg-surface` | `--motion-new-data-flash` | 1s border highlight |
| New row insertion | slide-down + flash cascade | `--motion-pane-transition` + `--motion-new-data-flash` | opacity only |
| Sensor cell update | dot scale 1 → 1.4 → 1 | `--motion-new-data-flash` | static border |
| Detail pane enter | `translateX(16px)` → `0`, opacity 0 → 1 | `--motion-pane-transition` | opacity only |
| Sheet (deviation capture) enter | slide-up | `--motion-pane-transition` | opacity only |
| T3 countdown ring | `stroke-dashoffset: 0 → 283` | 5000ms fixed | text countdown only |
| SSE heartbeat (connecting) | opacity 1 → 0.5 → 1 | 1600ms infinite | static |
| T3 arrival haptic | (where supported) | n/a | n/a (already fallback) |

### 5.3 Priya-desktop (dim 5 page templates)

| Element | Motion | Token | Reduced-motion fallback |
|---|---|---|---|
| Button press | bg color → `--brand-600` | `--motion-press-120` | unchanged |
| Action list row hover | bg color → `--bg-subtle` | `--motion-press-120` (120ms) | unchanged |
| Detail pane enter (overlay) | slide-in + opacity | `--motion-modal-in` | opacity only |
| Two-tap modal enter | scale 0.95 → 1 + opacity 0 → 1 | `--motion-modal-in` | opacity only |
| Countdown ring | stroke-dashoffset | 5000ms fixed | text countdown |
| Toast enter (Sonner) | slide-up | `--motion-toast-pane-in` | opacity only |
| SLA countdown text | (no animation — text changes only) | n/a | n/a |

### 5.4 PHA-pane (dim 5e)

| Element | Motion | Token | Reduced-motion fallback |
|---|---|---|---|
| Aggregate tile update | bg flash `--brand-100` → `--bg-surface` | `--motion-aggregate-flash` | 1s border highlight |
| Amendment row "signed" | bg flash `--success-bg` → `--bg-surface` | `--motion-amendment-signed-flash` (600ms) | 1s border highlight |
| Diff dialog enter | slide-up + opacity | `--motion-modal-in` | opacity only |
| Toast (institutional) | opacity 0 → 1 | `--motion-toast-pane-in` (160ms) | opacity only |
| Print mode toggle | (instant — no transition) | n/a | n/a |

### 5.5 Charts (dim 5b)

| Element | Motion | Token | Reduced-motion fallback |
|---|---|---|---|
| Axis fade-in | opacity | `--motion-chart-axis-in` (160ms) | static |
| Grid fade-in | opacity | `--motion-chart-grid-in` (160ms) | static |
| Tooltip enter | opacity | `--motion-chart-tooltip-in` (120ms) | static |
| New-point flash | background-color + radius | `--motion-chart-new-point-flash` (400ms) | static at full size |
| SSE pulse (status dot) | opacity | `--motion-chart-sse-pulse` (1600ms infinite) | static |
| Print-mode chart render | (instant — no animation) | n/a | n/a |

### 5.6 Cross-surface

| Element | Motion | Token | Reduced-motion fallback |
|---|---|---|---|
| Theme switch | bg + color on body | `--motion-theme-switch` (150ms) | instant |
| Chain-verification fail banner | shake (4 oscillations) | `--motion-shake-300` | static strip |
| Map pin breach halo | scale + opacity | pin-pulse 2000ms infinite | static halo |

---

## 6. Reduced-motion rules

Per `EXPERIENCE.md` §376: `prefers-reduced-motion: reduce` is honored globally. The implementation:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

This nukes all animations and transitions to a near-zero duration. Then per-pattern fallbacks (above) provide the non-motion replacement: border highlights instead of flashes, opacity-only fades instead of slides, text countdowns instead of rings, static halos instead of pulses.

**What is NOT reduced:**
- Press state color shift (120ms is too brief to be considered motion)
- Theme switch (150ms is the only color transition allowed; reducing it would feel like a glitch)
- Text updates (the SLA countdown text changes are not motion)

**What IS reduced:**
- All background-color keyframes (ack-pulse, new-data-flash, aggregate-flash, amendment-signed-flash)
- All transform animations (slide-in, scale, shake, pin-pulse)
- All opacity animations longer than 150ms (toast enter, tooltip enter, chart axis/grid fade-in)
- All infinite animations (SSE heartbeat, pin halo)

### 6.1 Why `0.001ms` and not `0s`

`0s` would still let the browser evaluate `transition: none` (CSS shorthand), which can cause some browsers to skip the final state of the transition. `0.001ms` ensures the transition is "instant but not skipped" — the final state of the keyframe is applied without any visual ramp.

### 6.2 JavaScript-driven motion

Some Priya-mobile and PHA-pane patterns use JS to drive the animation (e.g., SSE event triggers a `flash` class add/remove). The class toggle is the motion trigger; the CSS keyframe is the motion itself. When `prefers-reduced-motion: reduce` is active, the CSS keyframe is the no-op (per §6.1). The class toggle still happens — but the user sees no motion.

If the motion is "load this row's data" and the data load is itself a 200ms network call, the row appears with the new data and the motion cue is suppressed. The non-motion cue is "the new data is in the row."

### 6.3 No JavaScript motion detection required

The CSS media query handles all reduced-motion cases. No JS reads `window.matchMedia('(prefers-reduced-motion: reduce)')`. This is intentional — keeping motion in CSS makes the contract testable in isolation.

---

## 7. Motion budget per page

To prevent motion overload on any single surface, each page has a cap on simultaneous motion events:

| Surface | Max simultaneous motion events |
|---|---|
| Anjali-mobile | 2 (submit + ack, OR ack + new report, not all three) |
| Priya-mobile | 5 (top chrome heartbeat + 1 new-data flash + 1 sensor pulse + 1 SLA text + 1 countdown if T3) |
| Priya-desktop | 3 (one row hover + one modal enter + one toast at most) |
| PHA-pane | 3 (one tile flash + one toast + one diff dialog at most) |
| Charts | 1 per chart (one new-point flash per data point, staggered by 200ms if multiple) |

If a second motion event would exceed the budget, it queues and replays after the first finishes. This prevents a "cascading visual storm" during acute incidents when 5+ sensor readings might land simultaneously.

Implementation note: queue is JS-side; only one class is added at a time. The simplest implementation is a per-page motion coordinator that listens for `animationend` events.

---

## 8. Animation isolation (z-index + pointer-events)

Some motion patterns need to play above other content (toast, chain-fail banner). The z-index token stack:

| Layer | z-index | Element |
|---|---|---|
| Base content | `0` | All page content |
| Sticky chrome | `var(--z-sticky)` (100) | Top chrome |
| Dropdown / popover | `var(--z-dropdown)` (200) | Menus, tooltips |
| Modal backdrop | `var(--z-modal)` (300) - 1 | scrim behind modal |
| Modal content | `var(--z-modal)` (300) | modal sheet |
| Toast | `var(--z-modal)` (300) + 10 | toast above modals |
| Chain-fail banner | `var(--z-modal)` (300) + 20 | full-screen banner |

Toast and chain-fail banner are intentionally above modals because they carry critical signals that the user must see even when a modal is open (e.g., toast announces "T3 escalation" while a detail pane is showing).

Pointer-events: the chain-fail banner captures pointer events for the duration of the shake. After 300ms, it dismisses to a static strip (or auto-dismisses after 8s, per dim 4 §11.3 toast pattern).

---

## 9. Print-mode motion rules

Per dim 5b §3.8 and dim 5e §12: in `@media print`, all motion is suppressed.

```css
@media print {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

This is in addition to the `[data-print="true"]` attribute gate — the print stylesheet activates only when the attribute is set, but once activated, motion is suppressed regardless of the user's `prefers-reduced-motion` setting (because print is not a user-facing motion context).

---

## 10. What was deliberately rejected

| Considered | Rejected because |
|---|---|
| Spring physics (e.g. `cubic-bezier(0.5, 1.5, 0.5, -0.5)`) | Overshoots. Reads as bouncy. Wrong for civic-steady. |
| 5+ easing curves | Bloat. Three is the minimum that distinguishes gain/loss/symmetric. |
| Hover-zoom on cards | Distracts from the data. The card is a data surface, not a button. |
| Page-load fade-in on route change | Banned per `EXPERIENCE.md` §246. Surakkha opens to live data. |
| Skeleton screens (gray blocks while loading) | Sub-second lag is normal; sub-second skeletons flash too fast to read. Use stale-badge instead. |
| Spinner on every async action | Per `EXPERIENCE.md` §246, banned for < 2s. And the chain freshness clock is the only lag indicator on operator surfaces. |
| Auto-dismiss countdown ring at end of 5s (button vanishes) | Disorienting. The button stays in "depleted" state until the user lifts their finger. The aria-live text countdown is the cue. |
| Confetti on successful T3 issuance | "Public notice issued" is not a celebration. It's a state change. The toast is the signal. |
| `transform: scale(1.05)` on hover | Reads as playful. Surakkha is civic-steady. |
| Subtle parallax on scroll | Visual flourish; banned per `EXPERIENCE.md` §375. |
| Per-card spring physics on PHA amendment row sign | The amendment row is a regulatory artifact; spring motion reads as trivializing. |
| Lottie / Bodymovin animation for illustrations | Decorative; banned. The illustrations are static. |
| `requestAnimationFrame` for chart new-point | CSS `animation` + `animationend` is sufficient; rAF is overkill for a 1-shot flash. |
| Motion triggered on `mousemove` | High-frequency motion is a distraction. The only motion-on-mouse is hover bg shift (per dim 4 §13). |
| Stagger animations on list load (cascade) | Reads as decorative. New rows slide in individually, not in a cascade. |
| Animate everything in dark-mode toggle | Theme switch is body-only (per §4.11). Child surfaces snap. |

---

## 11. Token consumption rules (enforced in code review)

1. **No motion without a token.** Every `transition: <property> <duration>` declaration must reference a `--motion-*` duration token. No raw ms values in component code.
2. **No easings outside the 3 tokens.** Use `var(--ease-out)`, `var(--ease-in)`, `var(--ease-in-out)`. No raw `cubic-bezier()` or shorthand `ease` keyword in component code.
3. **No transition on color tokens.** Per dim 1 §7.6. Theme-switch on `body` is the only exception.
4. **No transition on `grid-template-columns` / `container` / breakpoint-driven properties.** Per dim 5 §14.4.
5. **No infinite motion except the SSE heartbeat and map pin breach halo.** All other animations are one-shot or duration-bounded.
6. **No decorative animation.** Every animation must serve a state-change purpose. Baffling flourishes are dim 8 violations.
7. **No animation on acute-SLA timers.** Per `EXPERIENCE.md` §394. The countdown text is the signal; the countdown ring is decoration.
8. **No spinner for sub-2s loading.** Per `EXPERIENCE.md` §246. Use chain freshness clock + stale badge.
9. **No spring physics, no overshoot, no bounce.** Civic-steady.
10. **No motion that hides, masks, or delays a critical signal.** If a state change is critical (T3 escalation, chain-fail), the text/icon/color is the primary signal; motion is decoration.
11. **`prefers-reduced-motion: reduce` must be honored.** Every new motion pattern must declare its reduced-motion fallback in code review.
12. **Print-mode motion must be suppressed.** `@media print` always wins.

---

## 12. Hand-offs

### To dim 5b (charts) — already consumed dim 8 tokens
### To dim 5c (Anjali mobile) — already consumed dim 8 tokens
### To dim 5d (Priya mobile) — already consumed dim 8 tokens
### To dim 5e (PHA pane) — already consumed dim 8 tokens

### To dim 6 (data formats)
No new fields. Motion is dim 8 territory; data shapes are motion-agnostic (per dim 6 §10).

### To dim 7 (sensor wire format)
Add to the SSE envelope (extending dim 5b §10 + dim 5d §10):

```ts
interface SseEventEnvelope<T> {
  type: T;
  payload: T extends 'reading' ? SensorReading
          : T extends 'incident' ? Incident
          : T extends 'amendment_state' ? AmendmentState
          : T extends 'aggregate_update' ? AggregateUpdate
          : T extends 'chain_anchored' ? ChainAnchor
          : unknown;
  // `client_received_at: ISOTimestamp` is set by the client for jitter compensation
  // (so the new-data flash starts from the client-clock not the server-clock).
  client_received_at?: ISOTimestamp;
}
```

The `client_received_at` field is the timing anchor for the new-data flash — without it, the flash would start when the SSE event was emitted from the server (which may be 200-500ms before the client receives it).

### To dim 9 (system integration review)
Real-device verification of:
- `[motion-press-120]` is perceptible on slow CPUs (i.e., not "instant" on a 2G phone)
- The chain-fail shake is observable from ≥1m viewing distance (it's a banner at the top of the viewport)
- The T3 countdown ring renders correctly on iOS Safari (some SVG `stroke-dashoffset` quirks)
- The SSE heartbeat dot is visible on cheap laptop panels (luminance check)
- The new-data flash doesn't bleed into adjacent rows due to compositing issues
- The reduced-motion fallbacks are visually distinct (border highlight is clearly different from the flash)

---

## 13. Verification checklist

### Ships in dim 8

- [ ] `motion-preview.html` renders all 14 motion tokens with side-by-side reduced-motion comparisons
- [ ] All 5 surfaces (Anjali mobile, Priya mobile, Priya desktop, PHA pane, charts) demonstrate their motion patterns
- [ ] Theme-switch transition is visible (≤150ms body bg)
- [ ] Chain-fail shake is replayable on a button
- [ ] T3 countdown ring demo with text + ring side-by-side
- [ ] SSE heartbeat dot (static vs pulsing toggle)
- [ ] Map pin breach halo (static vs pulsing toggle)
- [ ] Print-mode toggle suppresses all motion
- [ ] `prefers-reduced-motion: reduce` toggle simulates the OS preference and shows the fallback
- [ ] All motion is documented in the matrix (§5)
- [ ] `08-motion-lockdown.md` has 14 sections (matching dim 1/5 conventions)

### Deferred to engineering-setup

- [ ] Motion budget coordinator (per-surface cap) wired in JS
- [ ] SSE event timing uses `client_received_at` for flash start
- [ ] Real-device review of every pattern on iOS Safari + Android Chrome (low-end)
- [ ] Storybook (or equivalent) renders each motion pattern with `prefers-reduced-motion` toggle
- [ ] ESLint rule blocks raw `ms` values in `transition:` declarations

---

## 14. Amendment log

- **v1 (2026-09-07):** Initial lockdown. 14 motion tokens (13 duration + 1 theme-switch, plus 3 easing tokens + 4 property tokens). All motion patterns from dim 5b/5c/5d/5e consolidated. Reduced-motion rules codified. Print-mode rules codified. Motion budget per surface locked. Closes the motion gap in Gate 0.

This is the last "design-only" dim to close before Gate 0 is complete. With dim 8 locked, the design surface is fully spec'd. The remaining dims are dim 7 (sensor wire format — engineering contract) and the engineering-setup workstream (which produces the actual scaffold and tokens.css).
