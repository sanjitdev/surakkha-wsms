# Dimension 5d — Priya Mobile · Lockdown

**Status:** DEFERRED TO PHASE 2 (2026-09-07)
**Source preview:** `_bmad-output/design/priya-mobile-preview.html` (kept for reference; not a v1 deliverable)
**Parent dim:** dim 5 (surface extension)
**Deferral rationale:** Priya-mobile (the central operator's on-shift mobile view) is not part of the v1 Phase 1 build. Phase 1 ships only the audit-chain gateway (Story 1.1) and the single-tenant SQLite store; the four operator surfaces land in Phase 2. This document is preserved as the design contract for when the surface is built, but its lockdown status is **DEFERRED**, not LOCKED.

---

## 1. Scope & non-goals

Priya-mobile is the **on-shift view of Priya's desktop dashboard** for the central city operator. Priya (mid-career water-safety professional, supervisor of Anjalis) uses the desktop dashboard at the office but needs to monitor and act on incidents from her phone when she steps away from the desk — at a pump-station visit, on a ward walk, on-call after hours. Per `EXPERIENCE.md` §67-75, the Priya-desktop IA is "Y-shaped on first login: Left pane: Handover brief / Right pane: Ranked action list / Detail pane (overlay) / Top chrome: Chain freshness clock / Footer: PHA monthly report button." The mobile surface must deliver the hot path (ranked action list) and a compressed handover brief — the full PHA report export and other dense features stay desktop-only.

**In scope:**
- 3 panes: Action list (home), Incident detail, Handover brief
- Tier badges (T0/T1/T2/T3/resolved) per `EXPERIENCE.md` §205-207
- Bottom nav with 4 destinations (Action · Handover · Map · Profile)
- Sensor board grid (3-col on phone, 6-col on tablet — per dim 5 §7.7)
- Fusion-score-ranked action list with source attribution
- Chain freshness clock + 3 status indicators (gateway, sensor-silence, override-anomaly) per `EXPERIENCE.md` §74
- Two-tap T3 issuance affordance (mobile-eligible per `EXPERIENCE.md` §294 — owner surface is Priya-desktop, but mobile MUST expose the same affordance on the same conditions)
- Light + dark parity
- Bangla primary on body copy; Latin on tier badges, chain refs, and timestamps (per dim 6 §8.3)
- Tap targets ≥ 48×48 px (operator-mobile floor per dim 4 §16.1)

**Out of scope (deferred):**
- Full audit log browser — desktop only (dim 5 §7.6). Mobile shows a 5-row "recent activity" sample with deep-link to desktop.
- PHA monthly report auto-generation — desktop only (`EXPERIENCE.md` §75). Mobile deep-links to it.
- Playbook editor — read-only preview only; editing stays desktop.
- Settings (full settings menu lives on Priya-desktop per dim 5 extension; mobile gets a 4-row subset — see §6.4).
- Sensor calibration UI — desktop only (dim 5 extension §1).

**Inherited from upstream dims (no re-litigation):**
- Dim 1 colors (light + dark), dim 2 typography (Hind Siliguri + Noto Sans Bengali for Bangla, Plex Sans for Latin), dim 3 icons (lucide, 4 sizes)
- Dim 4 spacing (4-pt grid), `--height-control-xl` (48 px) tap targets, dim 4 Amendment A Bangla row-pad modifier
- Dim 5 §2 breakpoints (Priya-mobile uses ≥0 / ≥480 / ≥768 — 3 of the 5)
- Dim 5 §3 container widths (mobile uses full-bleed; container tokens don't apply)
- Dim 5 §6 shadcn adoption (`<Sidebar>`, `<Dialog>`, `<Sheet>` — Sheet is the mobile-natural choice for detail overlay)
- Dim 6 §4.3 `Incident` shape, dim 6 §4.1 `KPI` shape, dim 6 §4.6 `AuditEntry` shape
- Dim 5b §6 chart primitives (sparkline renders inside KPI cards; donut renders in detail)
- Dim 5b §10 SSE event types (`reading`, `incident`) — extended in §10 below
- `EXPERIENCE.md` §67-76 (Priya-desktop IA), §205-207 (tier badge rules), §294-302 (two-tap confirmation), §375 (motion floor)

---

## 2. Breakpoint policy

Priya-mobile targets **3 breakpoints** (dim 5 §2 had 6, Priya uses the 3 smallest):

| Token | Min width | Layout |
|---|---|---|
| `--bp-sm` (≥0) | `0px` | Portrait phones (iPhone SE = 320 px, Priya's typical device) |
| `--bp-md` (≥480) | `480px` | Large phones in landscape (Pixel XL, iPhone Pro Max) |
| `--bp-lg` (≥768) | `768px` | Tablets in portrait (iPad mini) |

**Sensor-board column count scales with breakpoint:**

| Breakpoint | Sensor-board cols | Rationale |
|---|---|---|
| ≥0 (phone) | 3 | 320 / 380 px viewport ÷ ~120 px per sensor cell (status pill + last reading line). |
| ≥480 (large phone) | 4 | Slightly more horizontal real estate without losing the "glanceable grid" feel. |
| ≥768 (tablet) | 6 | Half of the desktop 12-col grid; preserves the dim-5 sensor-board density. |

Below 320 px viewport: surface is unusable; CSS renders a "this device is too small" notice (consistent with dim 5c §2 policy).

---

## 3. Container & layout

- **No container** in the dim-5 sense — Priya-mobile is full-width mobile. The viewport is the container.
- **Padding-inline:** `--space-md` (12 px) on `<480`, `--space-lg` (16 px) on `≥480`, `--space-xl` (24 px) on `≥768`.
- **Vertical rhythm:** `--space-lg` (16 px) between sections, `--space-md` (12 px) between rows inside a section.

```
┌─────────────────────────────────────────┐
│ TopChrome (h: 48 px)                    │
│   Surakkha · Priya · Ward 07            │
│   [chain] ✓ gateway ✓ sensors ✓ anomaly │
├─────────────────────────────────────────┤
│                                         │
│ Action list (home pane)                 │
│   ┌───────────────────────────────────┐ │
│   │ T3 ● Ward 7 · Chlorine smell      │ │
│   │ Anjali X + Sensor W · 14:01       │ │
│   │ Confidence: high · 3 min left     │ │
│   └───────────────────────────────────┘ │
│   ┌───────────────────────────────────┐ │
│   │ T2 ◑ Ward 3 · Lead drift           │ │
│   │ 2 Anjali + 1 cluster · 4 days ago │ │
│   └───────────────────────────────────┘ │
│                                         │
│ Sensor board (3 cols)                   │
│   ┌────┐ ┌────┐ ┌────┐                 │
│   │ W7 │ │ W3 │ │ W5 │                 │
│   │pH  │ │NTU │ │Cl₂ │                 │
│   └────┘ └────┘ └────┘                 │
│                                         │
├─────────────────────────────────────────┤
│ Bottom nav (h: 56 px, ≥48 px taps)      │
│  Action · Handover · Map · Profile      │
└─────────────────────────────────────────┘
```

---

## 4. Top chrome

| Slot | Property |
|---|---|
| Height | 48 px (`--height-control-xl`, same as dim 5c Anjali top-chrome) |
| Left | "Surakkha · Priya" wordmark (small) + ward badge |
| Right | Chain freshness clock + 3 status icons (gateway / sensor-silence / override-anomaly) |
| Background | `var(--bg-surface)` |
| Border-bottom | 1 px `var(--border-subtle)` |

**Chain freshness clock** is the single most important indicator on Priya-mobile — the operator lives or dies by projection lag. Format: "12s" or "lagging" with semantic color (`--fg-default` nominal, `--warning` if >30s, `--danger` if >60s, per dim 7 wire format §3.4). Tapping the clock opens a Sheet showing the last 10 chain-anchor events.

**Status icons:**
- `shield-check` (16 px) — gateway healthy. `--success` when nominal, `--warning` when degraded, `--danger` when offline.
- `activity` (16 px) — sensor-silence monitor. `--success` when all sensors reporting, `--warning` when any silent >1h, `--danger` when any silent >6h.
- `shield-alert` (16 px) — override-anomaly monitor. `--success` when no flags, `--warning` when 1-2 flags, `--danger` when ≥3 flags.

No locale toggle in top chrome (Priya's container has `data-locale` set elsewhere — likely desktop settings propagate to mobile via the same user). The locale attribute lives on `<body>`, not the chrome (per dim 5 §10.2).

---

## 5. Action list pane (home)

The hot path. Per `EXPERIENCE.md` §72: "Right pane: Ranked action list. The hot path. Ranked by fusion score (FR-5.1). Each row carries source attribution."

### 5.1 Action row anatomy

Each row is a card-style list item at `--height-row-comfortable` (56 px, per dim 4 Amendment A). For high-density incidents with longer source attribution, the row expands to 64 px or 72 px with multi-line truncation.

| Slot | Width | Content |
|---|---|---|
| Tier badge | 56 px (fixed) | T0/T1/T2/T3/resolved glyph + text per `EXPERIENCE.md` §363 (`○`/`◔`/`◑`/`●`/`✓`) |
| Title | 1fr (flex) | "{Ward} · {headline}" — `--font-size-md` `--fg-default` `--font-weight-medium` |
| Source attribution | below title, full width | "Anjali X + Sensor W · 14:01" — `--font-size-sm` `--fg-secondary` |
| Meta | right, auto | Confidence + SLA countdown — `--font-size-sm` `--fg-tertiary` |
| Time | right, auto | ISO HH:MM (24h, per dim 6 §8.3) — `--font-size-xs` `--fg-tertiary` `--font-family-mono` |

**Tier badge colors** follow `EXPERIENCE.md` §205 + dim 1 §2.5:

| Tier | Glyph | Light bg | Light fg | Dark bg | Dark fg |
|---|---|---|---|---|---|
| T0 (info) | ○ | `--bg-inset` | `--fg-tertiary` | `--bg-inset` | `--fg-tertiary` |
| T1 (caution) | ◔ | `--warning-bg` | `--fg-default` | `--warning-bg` | `--fg-default` |
| T2 (escalate) | ◑ | `--warning` | `#FFFFFF` | `--warning` | `#0E1013` |
| T3 (action) | ● | `--danger` | `#FFFFFF` | `--danger` | `#0E1013` |
| resolved | ✓ | `--success-bg` | `--fg-default` | `--success-bg` | `--fg-default` |

The glyph + text label pair satisfies dim 1 §7.4 ("alert-red is never the sole signal").

**Confidence scoring:** "low" / "med" / "high" badge rendered as a small text-only pill (no color, just `--fg-secondary` text + 11 px label). Color is not the only encoding — the text label is always present.

### 5.2 Sort + filter

- **Default sort:** fusion-score desc (highest priority first). `EXPERIENCE.md` §51.
- **Pinned to top:** T3 incidents always float to the top regardless of score — the operator must see acute-SLA items immediately.
- **Filter affordance:** a single "Filter" button in the section header opens a `<Sheet>` (dim 5 §6 shadcn primitive) with options:
  - Ward (multi-select chips, default: all wards in scope)
  - Tier (checkboxes T0-T3 + resolved)
  - Age (last 1h / 6h / 24h / 7d / 30d)
- No "create report" affordance — Priya is an operator, not a reporter.

### 5.3 Empty state

"No incidents. All clear." per the dim 5 §8.7 "All caught up" pattern. Icon: `check-circle-2` 24 px `--success`. No primary CTA. No "create report" affordance (Priya does not generate incidents, she resolves them).

### 5.4 SLA countdown

Acute-SLA timers are visible on T2/T3 rows. Format: "3 min left" or "overdue 47s". Color: `--fg-default` nominal, `--warning` if ≤25% of SLA window remains, `--danger` if overdue. **Per `EXPERIENCE.md` §394: "Time pressure cue: acute-SLA timers are visible on incident rows but never animate."** No blinking, no pulsing — the kinetic signal is the countdown text itself, not motion.

---

## 6. Sensor board grid

Per dim 5 §7.7: "Sensor board grid (3-col on phone, 6-col on tablet)." Each cell is a `SensorBoardCell` showing one sensor's last reading + status.

### 6.1 Cell anatomy (per dim 1 §6.3)

| Property | Value |
|---|---|
| Cell width | `(container-width - padding-inline - gap) / cols` — auto |
| Cell height | `--height-control-xl` (48 px) — tap target floor |
| Border | 1 px `--border-subtle` |
| Border-radius | `var(--radius-sm)` (4 px) |
| Padding | `--space-sm` (8 px) |
| Tap target | inner cell area ≥ 48×48 px |

**Cell content:**
- Top row: ward badge (left, 11 px text `--fg-secondary`) + status dot (right, 8 px circle, semantic color)
- Bottom row: parameter label + last reading value (e.g. "pH 7.2", "NTU 4.1", "Cl₂ 0.8")

**Status dot color** (single brand hue rule per dim 1 §6.3):

| Sensor status | Dot color |
|---|---|
| `online` + nominal reading | `--brand-500` |
| `online` + caution reading | `--warning` |
| `online` + breach reading | `--danger` |
| `degraded` | `--warning` |
| `offline` | `--fg-tertiary` (no color = inert) |

No second brand hue is introduced — only the existing `--brand-500` is used for the nominal state.

### 6.2 Grid breakpoints

| Breakpoint | Cols | Gap | Cell min-width |
|---|---|---|---|
| ≥0 (phone) | 3 | `--space-sm` (8 px) | 96 px |
| ≥480 (large phone) | 4 | `--space-sm` (8 px) | 104 px |
| ≥768 (tablet) | 6 | `--space-md` (12 px) | 112 px |

On ≥768, the sensor board sits alongside the action list in a 2-column layout (`col-span-8` action list + `col-span-4` sensor board). On <768, sensor board sits below the action list.

### 6.3 Tap interaction

Tap a cell → opens the Incident detail pane (§7) filtered to that sensor's last reading. Long-press → tooltip with sensor ID + last-seen timestamp.

---

## 7. Incident detail pane

Opened by tapping any action list row or sensor board cell. Replaces the home pane via a full-screen slide-in transition.

### 7.1 Layout

```
┌─────────────────────────────────────────┐
│ ← Back                [···]             │  ← top bar, 48 px
├─────────────────────────────────────────┤
│                                         │
│ T3 ● Ward 7 · Chlorine smell            │  ← headline + tier
│ Reported 14:01 · 5 min ago              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Source attribution                  │ │
│ │  Anjali X (school Y, 14:01)         │ │
│ │  Sensor W (pump station, 14:02)     │ │
│ │  Confidence: high · Fusion: 0.94    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Sensor history (7-day sparkline)    │ │
│ │  [inline TimeSeriesLine chart]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Playbook recommendation             │ │
│ │  Step 1: Confirm with sensor reading│ │
│ │  Step 2: Escalate to T2 (auto)     │ │
│ │  Step 3: Escalate to T3 (PHA gate) │ │
│ │  [Read-only preview]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Actions                             │ │
│ │  [Execute Step 1] [Deviate...]      │ │
│ │  [Issue public notice (T3 only)]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 7.2 Sections

| Section | Source field (dim 6) | Height |
|---|---|---|
| Headline + tier | `Incident.title`, `Incident.band` | 64 px |
| Source attribution | `Incident.relatedReports`, `Incident.sensorSnapshot` | variable (1-3 rows × 24 px each) |
| Sensor history chart | `IncidentDetailPage.clusterHistory` (dim 5b §14) | 180 px (TimeSeriesLine + axis labels) |
| Playbook recommendation | `VerifyFlowPage.step1` content (read-only) | variable (3 steps × 56 px) |
| Actions | `InboxDetailPage.actions[]` | 48 px button row(s) |

The `Actions` section is the source of the T3 two-tap affordance. See §9.

### 7.3 Read-only playbook view

Per `EXPERIENCE.md` §73: "Read-only playbook view + per-step execute/deviate buttons." Mobile shows the same 3 steps as the desktop verify flow but each step is collapsed by default with a "Show step" expand. **Editing playbook text is desktop-only.**

### 7.4 Deviation capture

The `[Deviate...]` button opens a `<Sheet>` (bottom-up slide-in, dim 5 §6) with:
- Reasoning text field (required per `EXPERIENCE.md` §200)
- "Submit deviation" button (`--warning` outline per dim 1 §7.3 — no filled danger)
- Cancel button (ghost variant)

On submit, the deviation logs to the chain and returns to the detail pane. No toast on success — the chain-event row appears in the audit log instead.

---

## 8. Handover brief pane

Per `EXPERIENCE.md` §71: "Left pane: Handover brief. Today's open threads — incidents still open, deviations still under review, threshold changes pending PHA approval, anomalies flagged by override-anomaly monitor."

### 8.1 Layout

```
┌─────────────────────────────────────────┐
│ TopChrome                               │
├─────────────────────────────────────────┤
│                                         │
│ Handover brief                          │
│   Priya (current) → Priya (next shift)  │
│                                         │
│ Open threads (4)                        │
│   ┌───────────────────────────────────┐ │
│   │ T3 ● Ward 7 — Priya 14:01        │ │
│   │ "Step 2 done, awaiting sensor..." │ │
│   └───────────────────────────────────┘ │
│                                         │
│ Deviations (2)                          │
│   ┌───────────────────────────────────┐ │
│   │ Ward 3 · Lead drift               │ │
│   │ Deviated: skipped lab confirm     │ │
│   │   — Priya 09:14                   │ │
│   └───────────────────────────────────┘ │
│                                         │
│ PHA approvals pending (1)               │
│   ┌───────────────────────────────────┐ │
│   │ Playbook v3.3 amendment           │ │
│   │   — vendor counter-sign pending   │ │
│   └───────────────────────────────────┘ │
│                                         │
│ Anomalies flagged (0)                   │
│                                         │
│ Recent activity (5) → [See all]         │
│   ┌───────────────────────────────────┐ │
│   │ 14:01 sensor_spike Ward 7         │ │
│   │ 13:42 incident_verified Ward 12   │ │
│   │ ... 3 more rows                   │ │
│   └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 8.2 Section rules

| Section | Source (dim 6) | Empty state |
|---|---|---|
| Open threads | `Incident[]` where `status === 'open'`, filtered to operator's scope | "No open threads. Quiet shift." (dim 5 §8.7) |
| Deviations | `AuditEntry[]` where `eventType === 'incident_verified'` AND reasoning is non-empty in the past 24h | "No deviations in the last 24 hours." |
| PHA approvals pending | `AuditEntry[]` where `eventType === 'councillor_notified'` AND `chainRef` shows dual-signature incomplete | "No PHA approvals pending." |
| Anomalies flagged | derived from `override-anomaly monitor` SSE stream | "No anomalies flagged." |
| Recent activity | `AuditEntry[]` last 5 entries (deep-link to full audit log on desktop) | "—" |

Each section uses the dim-5 §8 empty-state pattern when zero. No primary CTAs on empty sections (Priya is not creating these items — they surface automatically from the chain projection).

---

## 9. T3 two-tap issuance on mobile

Per `EXPERIENCE.md` §294: "The on-call operator with `utility_message_desk` role ... executes the two-tap from the Priya-desktop ranked action list — specifically, from a T3-confirmed incident row whose chain state has crossed the dual-signature threshold."

**Mobile eligibility:** the same affordance MUST appear on Priya-mobile under the same conditions (T3 confirmed + dual-signature present in chain). The user might be off-site when the T3 fires; they cannot wait until they get back to the desktop.

### 9.1 Affordance

On the Incident detail pane's Actions section, when the incident is T3-confirmed and dual-signature is verified:
- A primary button `[Issue public notice]` (dim-4 `button--primary`, 48 px tall) is visible.
- Tapping it opens a full-screen modal with the message preview.

### 9.2 Two-tap flow

1. **First tap** — message preview modal opens with:
   - Message body (with `EXPERIENCE.md` §337 redaction: `{REASON_LANG_FIELD}`, `{ZONE}` visible, `{RECIPIENT_LIST}` collapsed to count)
   - Recipient count summary ("→ Ward 7 · 12,400 recipients · WhatsApp + SMS")
   - `[Reveal full]` button with 750 ms hold (long-press on touch, click-and-hold on desktop equivalent)
   - `[Cancel]` + `[Preview issued]` buttons
2. **Second tap** — `[Issue public notice]` button with **5-second countdown ring** (`EXPERIENCE.md` §298). Countdown is a circular progress arc around the button using `--motion-chart-sse-pulse` style 1600 ms ease-out per dim 5b §3.7 (but compressed to a 5-second one-shot). Button is disabled while counting; enabled on countdown=0. Tapping fires `MessageIssuanceConfirmed`.
3. After confirmation: chain-event appears in detail pane, button disappears (issuance is one-shot per incident per `EXPERIENCE.md` §270-274 dangling-preview rule).

### 9.3 Mobile-specific motion

- Modal enter: slide up 240 ms ease-out (`--motion-pane-transition` from dim 5c §12).
- Countdown ring: stroke-dashoffset transition over 5 s ease-out (one-shot, not infinite).
- Reveal-full hold: 750 ms `setTimeout` on `touchstart` / `mousedown`.
- Per `EXPERIENCE.md` §375: "No motion on routine updates." This is an acute-SLA action — motion is permitted because the kinetic signal of urgency is the countdown itself.

### 9.4 Bangla body text

The consumer-message body is in Bangla (per `EXPERIENCE.md` §127-128 Ramesh-channel register). On Priya-mobile's preview modal, the body is rendered in `--font-family-bangla` with `--line-height-body-bangla: 1.6`. The redaction tokens (`{ZONE}`, `{REASON_LANG_FIELD}`) render Latin in `--font-family-mono` for unambiguous token identity.

---

## 10. Real-time updates (SSE)

The action list and sensor board MUST be live-updating via SSE. Per dim 5b §10/§11 SSE contract:

```ts
type SSEEvent =
  | { type: 'reading'; payload: { sensorId: SensorId; t: ISOTimestamp; value: number; band: Band } }
  | { type: 'incident'; payload: Incident }
  | { type: 'chain_anchored'; payload: { chainRef: ChainRef; t: ISOTimestamp } }
  | { type: 'override_anomaly'; payload: { count: number; lastFlaggedAt: ISOTimestamp } };
```

### 10.1 Connection state machine

| State | Indicator | Behavior |
|---|---|---|
| `connecting` | Top chrome status dot: pulsing `--brand-500` 1.6 s infinite | First connect attempt. |
| `connected` | Status dot: solid `--success` | Receiving events. |
| `reconnecting` | Status dot: pulsing `--warning` 1.6 s | One disconnect; auto-retry with exponential backoff 1s/2s/4s/8s (cap 30s). |
| `fallback-poll` | Status dot: solid `--warning` + "Polling" label | After 3 failed reconnect attempts; chart reverts to 30s polling per dim 5b §10. |
| `offline` | Status dot: solid `--danger` + "Offline" label | Explicit offline; show queued-actions indicator. |

### 10.2 New-data flash

When a `reading` or `incident` event arrives for an item already in the action list or sensor board:
- **Action list row:** background-color keyframe `var(--bg-base)` → `transparent` over 400 ms ease-out (`--motion-chart-new-point-flash` from dim 5b §3.7). One-shot per row.
- **Sensor board cell:** status dot pulses once (`--brand-500` 1× to `--success-bg` and back, 400 ms ease-out).

Both animations respect `prefers-reduced-motion: reduce` — replaced with a 1-second solid border highlight.

### 10.3 New incident insertion

When an `incident` event arrives that is NOT in the current list:
- The new row slides in from the top (240 ms ease-out, translateY -16px → 0).
- Row plays the same new-data flash as above.
- If T3: a brief haptic buzz (where supported) + the SLA countdown starts immediately.

### 10.4 Connection lifecycle

- Opens on app foreground.
- Closes on app background (no battery-drain).
- Re-opens on next foreground.
- Background sync (v1.1): Service Worker queues missed events for offline catch-up.

---

## 11. Map pane

A compressed view of dim 5b's `<SensorMap>` (chart type #9) tuned for mobile.

| Property | Value |
|---|---|
| Map width | full viewport minus bottom nav |
| Map height | viewport minus top chrome (48 px) minus bottom nav (56 px) |
| Tile layer | OSM raster (per dim 5b §13) — Leaflet |
| Markers | `L.divIcon` 24 px circles, band-tinted per dim 5b §13 |
| Attribution | `© OpenStreetMap contributors` — fixed bottom-right, always visible |
| Tap marker | opens sensor detail (deep-link from map to detail pane via sensorId) |

Map is **read-only** on mobile — no drawing, no routing, no overlay editing (per dim 5b scope).

---

## 12. Bottom nav

Per dim 4 §8.2 (mobile-nav rules).

| Slot | Width | Tap target |
|---|---|---|
| Height | 56 px container, 48 px inner cells (per dim 4 §8.2 tap-target floor) | ≥48 px |
| Cells | 4 (Action · Handover · Map · Profile) | even split |
| Active indicator | 3 px `--brand-500` top border on the active cell | dim 4 §8.5 |
| Icon | dim-3 20 px icon per slot (`list`, `clipboard-list`, `map`, `user`) |
| Label | 11 px text below icon (`--font-size-xs` minus 1 px) |

**Profile cell** opens a bottom Sheet (per dim 5 §6 shadcn `<Sheet>`) with:
- Display name + role
- Ward scope
- Theme toggle (light / dark / system)
- Locale display (read-only — locale is set on Priya's container, not here)
- "Open desktop settings" deep-link (out-of-app on mobile)
- Sign out

---

## 13. Bangla-primary rendering

Per dim 2 §9.4 + dim 6 §8 + dim 5 §10:

| Element | Default locale |
|---|---|
| Action row title / source attribution | Bangla primary, Latin secondary |
| Handover brief section headings | Bangla primary |
| Empty state copy | Bangla primary |
| Tier badge labels (T0/T1/T2/T3/resolved) | **Latin always** — tier is operational metadata, not user-facing prose (per dim 6 §8.3) |
| Chain refs | **Latin always** in `--font-family-mono` (cryptographic identifiers per dim 6 §8.3) |
| Timestamps | **Latin always** in ISO 24-hour format |
| Top chrome wordmark "Surakkha" | Latin (brand name) |
| Status indicator labels ("Polling", "Offline") | English (per `EXPERIENCE.md` §232 — feature-phone fallback rule applies on consumer channel only, not operator surfaces) |

Bangla row-pad modifier (dim 4 Amendment A): all Bangla rows auto-add 4 px block padding. Effective Bangla row height: 60 px (56 + 4).

---

## 14. Accessibility

- **Tap targets:** ≥ 48×48 px on every interactive element (operator-mobile floor per dim 4 §16.1).
- **Voice-over priority:** the action list's top item (highest fusion score) is announced on app foreground via `aria-live="polite"`. New incidents that arrive are announced via `aria-live="assertive"`.
- **SLA countdown** is announced every minute on T2/T3 rows via `aria-live="polite"` (not assertive — would be too noisy).
- **Reduced motion:** the new-data flash + slide-in are replaced with a solid border highlight when `prefers-reduced-motion: reduce` is set. The countdown ring is replaced with text "5s" → "0s" countdown (no arc).
- **Offline state is announced:** when SSE drops to `fallback-poll` or `offline`, an `aria-live="assertive"` region reads "Connection degraded. Showing polled data."
- **Color is never the only encoding:** tier badges always have text + glyph (per `EXPERIENCE.md` §363). Confidence pills always have text labels. Status dots are paired with the cell text content.
- **No motion on routine updates** (per `EXPERIENCE.md` §375): the SLA countdown text changes but does not animate. New-data flash is reserved for chain events.

---

## 15. Hand-offs

### To dim 6 (data formats)

The `Incident` shape from dim 6 §4.3 already covers Priya-mobile's needs. Add for v1.1:

```ts
interface Incident {
  // ... existing
  fusionScore: number;             // 0..1, drives rank order
  slaDeadline?: ISOTimestamp;       // when this incident must be actioned by
  dualSignatureComplete?: boolean;  // gates T3 issuance affordance
}
```

The `handoverBrief` shape is dim-6 territory too:

```ts
interface HandoverBrief {
  openThreads: Incident[];
  deviations: AuditEntry[];        // last 24h
  pendingPhaApprovals: AuditEntry[];
  anomaliesCount: number;
  recentActivity: AuditEntry[];    // last 5 entries
}
```

### To dim 7 (sensor wire format)

- SSE event types extended to include `chain_anchored` and `override_anomaly` (dim 5d §10) on top of dim 5b's `reading` + `incident`.
- Chain freshness clock format: `lag_ms` integer. Thresholds: ≤5000ms nominal (green), 5000-30000ms caution (`--warning`), >30000ms degraded (`--danger`). Same threshold on operator mobile and Priya-desktop top chrome.
- Sensor status thresholds (per dim 1 §6.3):
  - `online` + nominal: reading within ±1σ of trailing 24h mean.
  - `online` + caution: reading within 1σ-2σ.
  - `online` + breach: reading >2σ from mean OR cross absolute threshold (e.g. pH <6.5, turbidity >4 NTU).
  - `degraded`: signal present but quality <0.7 (per sensor firmware flag).
  - `offline`: no reading in last 6 minutes.

### To dim 8 (motion)

4 mobile-specific motion tokens (referenced, not invented in dim 5d):

- `--motion-pane-transition: 240ms ease-out` (slide-in for detail pane; same as dim 5c §12)
- `--motion-tab-switch: 160ms ease-out` (bottom-nav switching)
- `--motion-new-data-flash: 400ms ease-out` (background-color keyframe on new row; same as dim 5b chart flash)
- `--motion-countdown-ring: 5000ms ease-out` (T3 issuance countdown, one-shot; reference value — actual duration is fixed 5s)

Plus inherited from dim 5b:
- `--motion-chart-tooltip-in: 120ms ease-out`
- `--motion-chart-new-point-flash: 400ms ease-out`

### To engineering-setup workstream

- React Native (per dim 5 §16 deferred decision) OR PWA / Vite + Capacitor (lighter path, single codebase for Priya desktop + mobile). Capacitor wins on bundle reuse: same React components, same dim-1–5 tokens, mobile is a Capacitor-wrapped PWA.
- Leaflet + leaflet.markercluster (same as dim 5b §13)
- EventSource polyfill for older WebViews (eventsource-polyfill npm package)
- Local notification permission flow for SLA-countdown voice-over (iOS Safari requires user gesture)
- Background sync (v1.1): Service Worker or Capacitor Background Sync plugin

---

## 16. Verification checklist

### Ships in dim 5d

- [ ] `priya-mobile-preview.html` renders the 4 panes (action list, incident detail, handover brief, map) at 375 px and 768 px viewports
- [ ] Bottom nav has 4 cells (Action · Handover · Map · Profile), each with ≥48 px tap target
- [ ] Action list rows render tier badge + source attribution + confidence pill + SLA countdown
- [ ] Tier badges use the locked 5-tier glyph set (`○`/`◔`/`◑`/`●`/`✓`) with semantic color from dim 1
- [ ] Sensor board renders as 3-col on phone, 6-col on tablet (768+)
- [ ] Sensor cells show ward + status dot + reading value
- [ ] T3 two-tap modal opens from a T3 incident row; first tap shows redacted preview, second tap shows countdown ring
- [ ] Handover brief shows 5 sections: open threads / deviations / PHA approvals / anomalies / recent activity
- [ ] Top chrome shows chain freshness clock + 3 status indicators (gateway / sensor-silence / override-anomaly)
- [ ] Light + dark parity (theme toggle at top of preview)
- [ ] Bangla label demo: action list rows in Bangla with row-pad modifier applied
- [ ] Map pane shows Leaflet mock with OSM-style markers + attribution
- [ ] `05d-priya-mobile-lockdown.md` has 16 sections matching this lockdown

### Deferred to engineering-setup

- [ ] Capacitor wrap + iOS/Android build pipeline
- [ ] Leaflet tile cache + offline fallback
- [ ] SSE EventSource auth header refresh
- [ ] Local notification permission flow for SLA countdown
- [ ] Background sync (v1.1)
- [ ] Haptic feedback on T3 arrival (where supported)
- [ ] Tablet landscape layout split (action list 60% + sensor board 40%)
- [ ] Bangla keyboard input (if Priya ever types notes from mobile — currently read-only)

---

## 17. Amendment log

- **v1 (2026-09-07):** Initial lockdown. 4 panes (action list, incident detail, handover brief, map), tier-badge system, T3 two-tap mobile eligibility, sensor board 3/6 col grid, SSE live-update state machine. Closes the dim 5 §7.7 operator-mobile gap.
- **2026-09-07 — DEFERRED TO PHASE 2:** Priya-mobile is removed from the v1 Phase 1 build. Phase 1 ships only the audit-chain gateway (Story 1.1) plus its monitor companions. The four operator surfaces (Anjali-mobile, Priya-desktop, Priya-mobile, PHA-pane) land in Phase 2. This document is preserved verbatim as the design contract for that work; preview HTML is kept for reference. **Verification checklist (§16) and engineering-setup hand-offs (§15) are deferred with the surface.**
