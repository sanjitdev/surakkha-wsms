# Dimension 5c — Anjali Mobile · Lockdown

**Status:** DEFERRED TO PHASE 2 (2026-09-07)
**Source preview:** `_bmad-output/design/anjali-mobile-preview.html` (kept for reference; not a v1 deliverable)
**Parent dim:** dim 5 (surface extension)
**Deferral rationale:** Anjali-mobile is not part of the v1 Phase 1 build. Phase 1 ships only the audit-chain gateway (Story 1.1) and the single-tenant SQLite store; the four operator surfaces land in Phase 2. This document is preserved as the design contract for when the surface is built, but its lockdown status is **DEFERRED**, not LOCKED.

---

## 1. Scope & non-goals

Anjali-mobile is the **reporter surface** for Surakkha v1 — the only mobile surface Anjali (school principal, local operator) sees. It is the thinnest of the four surfaces because Anjali's job is to submit reports fast (≤ 60 seconds, FR-4 success criterion) and to see that her reports mattered (FR-4.7).

**In scope:**
- 3 panes: Report, Status feed, Profile
- 4 input modes: voice note, sentinel-strip photo, free-text, weekly check-in
- Offline persistence (queue across app restarts + connectivity changes)
- One action card on first pane (FR-4.5)
- Light theme only (per dim 1 §3 first-time-visitor default + field-condition rationale)
- Bangla primary with Latin secondary
- Tap targets ≥ 48×48 px (≥ 44×44 px for Bangla glyphs per `EXPERIENCE.md` §348)
- Acknowledgement pulse (200 ms ease-out, one-shot per dim 8 spec)
- Status feed with no "create report" CTA (the report affordance is the home screen)

**Out of scope (deferred):**
- Anjali dashboard / analytics — Anjali is a reporter, not an analyst. No charts.
- Dark mode — light only (per dim 1 §3 + field conditions: sun glare).
- Multi-language picker — Bangla primary, English visible on toggle in settings (out of scope for v1 — Bangla only for v1.1).
- Video input — voice + photo + text only.
- Web push notifications — WhatsApp + SMS consumer channel is the notification path.
- Operator-side reverse flow — Anjali never sees other reporters' data.

**Inherited from upstream dims (no re-litigation):**
- Dim 1 colors (light-only subset), dim 2 typography (Bangla primary, Hind Siliguri + Noto Sans Bengali), dim 3 icons (lucide, 4 sizes)
- Dim 4 spacing (4-pt grid), control heights (input 36 px but bumped to 48 px on Anjali-mobile per accessibility floor)
- Dim 5 §2 breakpoints (Anjali-mobile targets ≥0 / ≥480 only)
- Dim 6 §6.2 `AnjaliReport` data shape
- Dim 4 Amendment A Bangla row-pad modifier
- EXPERIENCE.md §178, §348, §375, §380, §402-403, §412-440 (Flow 1)

---

## 2. Breakpoint policy

Anjali-mobile targets **2 breakpoints only** (dim 5 §2 had 6, Anjali uses the 2 smallest):

| Token | Min width | Layout |
|---|---|---|
| `--bp-sm` (≥0) | `0px` | Portrait phones (iPhone SE = 320 px wide, Anjali's typical device) |
| `--bp-md` (≥480) | `480px` | Large phones in landscape (Pixel XL, iPhone Pro Max) |

Operator mobile (dim 5d) uses 3 breakpoints; PHA pane (dim 5e) uses the desktop 5. Anjali-mobile deliberately keeps it to 2 because the surface has no horizontal navigation to rearrange.

Below 320 px viewport width: surface is unusable; CSS renders a "this device is too small" notice. (No actual users below 320 px in v1 scope.)

---

## 3. Container & layout

- **No container** in the dim-5 sense — Anjali-mobile is full-width mobile. The viewport is the container.
- **1 column, single linear flow.** No grid. No col-span vocabulary.
- **Padding-inline:** `--space-md` (12 px) on `<480`, `--space-lg` (16 px) on `≥480`.
- **Vertical rhythm:** `--space-xl` (24 px) between sections, `--space-lg` (16 px) between rows inside a section.

```
┌─────────────────────────────────────┐
│ TopChrome (h: 56px)                 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Action card: "Report"           │ │  ← single CTA, full-width
│ │  (FR-4.5: one action card)      │ │     h: 96 px, tap ≥48 px
│ └─────────────────────────────────┘ │
│                                     │
│ Status feed section                 │
│   ┌───────────────────────────────┐│
│   │ Yesterday's report            ││
│   │ Ward 7 school · chlorine smell││
│   │ Status: Verified ✓            ││
│   │ └ queued → sent → acknowledged││
│   └───────────────────────────────┘│
│                                     │
│ Offline indicator (when offline)    │
│ "X queued, Y sent"                  │
│                                     │
├─────────────────────────────────────┤
│ Bottom nav (h: 56 px, ≥48 px taps)  │
│   Home · Status · Profile           │
└─────────────────────────────────────┘
```

---

## 4. Top chrome

| Slot | Property |
|---|---|
| Height | 56 px (same as dim 4 top-chrome, but `min-height: 48 px` for accessibility) |
| Left | App title "Surakkha" + small ward badge (e.g. "Ward 7") |
| Right | Offline indicator (wifi-off icon when offline, queued count text) |
| Background | `var(--bg-surface)` |
| Border-bottom | 1 px `var(--border-subtle)` |
| Bangla glyph headroom | 4 px top padding inside the chrome to clear Bangla ascenders |

No locale toggle in top chrome (Anjali is Bangla-primary by default; the secondary English version is reached via the Profile pane's `App language` setting — which is itself a v1.1 feature, not v1).

---

## 5. Action card (FR-4.5)

The single action card on the home pane. It is the only "create report" affordance on the surface.

| Property | Value |
|---|---|
| Width | 100% of container minus `--space-md` inline padding |
| Height | 96 px |
| Padding-block | `--space-lg` (16 px) |
| Padding-inline | `--space-xl` (24 px) |
| Background | `var(--brand-500)` |
| Foreground | `#FFFFFF` (per dim 1 §2.8 text-on-coloured-surface rule) |
| Border-radius | `var(--radius-lg)` (6 px) |
| Tap target | inner button area ≥ 48 px tall |
| Icon | dim-3 `megaphone` 24 px, `--stroke-base` (2 px) |
| Title | "Report" — `--font-size-xl` (22 px) `--font-weight-bold` |
| Subtitle | "What did you notice today?" — `--font-size-sm` `--font-size-bangla` line-height 1.6 |

The card opens the **Report composer** pane (full-screen modal, §6). It is a single action card — no secondary CTAs on the home pane. The card itself is the button; the entire 96 px surface is the tap target.

---

## 6. Report composer (modal pane)

When the action card is tapped, the composer opens as a full-screen modal (replaces the bottom nav for the duration). It has 4 input modes stacked vertically:

1. **Voice note** (priority 1 per `EXPERIENCE.md` §358 — voice-first)
2. **Sentinel-strip photo** (CV-read color strip per `EXPERIENCE.md` §289)
3. **Free text**
4. **Weekly check-in toggle** (binary: "Everything OK this week?" / "Something to report")

```
┌─────────────────────────────────────┐
│ ← Cancel          Submit            │  ← top bar, 56 px
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎤 Voice note                   │ │
│ │   Tap to record (max 60s)       │ │  ← ≥48 px row
│ │   [audio waveform visualizer]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📷 Sentinel strip               │ │
│ │   Tap to photograph             │ │  ← ≥48 px row
│ │   [camera preview]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✎ Free text                     │ │
│ │   [multi-line text input]       │ │  ← ≥48 px row, h: 120 px
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☑ Weekly check-in               │ │
│ │   "Everything OK this week?"    │ │  ← ≥48 px toggle row
│ └─────────────────────────────────┘ │
│                                     │
│ Ward (auto-filled from profile)     │
│ [Ward 7 — সদর / Sadar ▾]           │  ← read-only select
│                                     │
└─────────────────────────────────────┘
```

| Element | Property |
|---|---|
| Top bar | 56 px, dim-4 `.top-chrome` variant, Cancel (left, ghost) + Submit (right, primary); Submit disabled until at least 1 input has data |
| Voice row | h ≥ 48 px, dim-3 `mic` 24 px icon, tap-to-record (60 s cap per `EXPERIENCE.md` §281) |
| Photo row | h ≥ 48 px, dim-3 `camera` 24 px icon, opens native camera, CV-read on-device |
| Free text | h: 120 px textarea, dim-4 `.input` variant with `min-height: 120 px` |
| Weekly toggle | h ≥ 48 px, shadcn Switch equivalent (toggle), Bangla label "এই সপ্তাহে সব ঠিক আছে?" |
| Ward select | read-only, prefilled from user profile; tap to switch if Anjali covers multiple wards |
| Submit | dim-4 `button--primary` 48 px tall; offline-tap queues the report, shows "queued — will send when online" badge |

**Input order** matches `EXPERIENCE.md` §60-66 (FR-4.5 inputs: voice, sentinel-strip photo, free-text, weekly check-in).

---

## 7. Status feed pane

Below the action card on the home pane. Shows the last 30 days of submitted reports by Anjali. Each report is a row at `--height-row-comfortable` (56 px).

| Slot | Property |
|---|---|
| Row height | `--height-row-comfortable` (56 px) |
| Padding-inline | `--space-md` (12 px) |
| Date | `--font-size-sm` `--fg-default`, Bangla locale preferred |
| Description | `--font-size-sm` `--fg-secondary`, single line, truncate with ellipsis |
| Status | dim-4 `.band-pill` (small, 14 px), one of: queued / sent / verified / dismissed / acknowledged |
| Offline state | "X queued, Y sent" counter below the list (per `EXPERIENCE.md` §262) |

Status mapping to dim-6 `AnjaliReport` lifecycle:
- `queued` → local-only, not yet on server
- `sent` → received by server, awaiting operator review
- `verified` → operator confirmed, awaiting councillor
- `dismissed` → operator did not act (rare; should be communicated with care)
- `acknowledged` → Anjali received the FR-4.7 thank-you message

**Empty state:** "No reports yet. Your first report lands here." (per `EXPERIENCE.md` §239). No "create report" CTA — the action card on the home pane is the affordance.

---

## 8. Offline persistence

Reports queued locally persist across app restarts AND connectivity changes (per `EXPERIENCE.md` §262).

| Trigger | Behavior |
|---|---|
| Report submitted while offline | Queued in IndexedDB (or equivalent local store). Status pill: `queued` with wifi-off icon. Counter increments: "X queued, Y sent". |
| Connectivity restored | Queue drains in FIFO order. Each report fires its submit handler. Status pill flips to `sent` when ack received. |
| App killed while reports queued | On next launch, queue is restored. Counter re-renders. |
| Report rejected by server (validation) | Status pill: `failed` with retry icon. Tap → re-edit and re-submit. Counter unchanged. |
| Queue size > 50 | Oldest queued reports get a "stale" badge (>24h old). User can tap to delete or retry. |

No background sync worker in v1 — sync happens on app foreground + connectivity events. v1.1 adds Service Worker background sync.

---

## 9. Acknowledgement pulse

When Anjali receives the FR-4.7 acknowledgement ("Your report on Tuesday 14:01 at Ward 7 triggered action X. Thank you."), the corresponding row in the status feed plays a **200 ms ease-out, one-shot pulse** (per `EXPERIENCE.md` §375).

- Background-color keyframe: `var(--success-bg)` → `transparent` over 200 ms
- Single fire per row — repeated acks don't replay the animation
- Triggered by SSE/push event from the server (dim 7 wire format)
- Pulse token: `--motion-ack-pulse: 200ms ease-out` (referenced from dim 8)

---

## 10. Bangla-primary rendering

Per `EXPERIENCE.md` §380 + dim 2 §9.4:

| Element | Default locale |
|---|---|
| Action card title "Report" / "রিপোর্ট করুন" | Bangla |
| Status feed labels | Bangla (date + status pills) |
| Empty state copy | Bangla |
| Submit button "জমা দিন" | Bangla |
| Cancel button "বাতিল" | Bangla |
| Top chrome app title "Surakkha" | Latin (brand name, always Latin per dim 2) |

Bangla fonts: Hind Siliguri (primary) → Noto Sans Bengali (fallback) → system Bengali font. Font token: `--font-family-bangla`.

Line-heights: dim 2 sets `--line-height-body-bangla: 1.6` and `--line-height-heading-bangla: 1.3` — both apply on Anjali-mobile (unlike Priya which uses Latin default).

Bangla row-pad modifier (dim 4 Amendment A): all Bangla rows auto-add 4 px block padding inside the row, on top of the standard `--height-row-comfortable` (56 px). Effective Bangla row height: 64 px.

---

## 11. Accessibility

- **Tap targets:** ≥ 48×48 px on every interactive element (per `EXPERIENCE.md` §178). Bangla glyphs get the 44×44 px floor per `EXPERIENCE.md` §348 — but 48 px is the Anjali floor, not the Bangla glyph floor.
- **Voice-first screen reader priority:** per `EXPERIENCE.md` §358, the voice input affordance has the highest screen-reader priority on the first pane. `<button aria-label="Record voice note">` with `aria-describedby` pointing to the recording-state text.
- **Reduced motion:** the acknowledgement pulse respects `prefers-reduced-motion: reduce` — replaces with a single solid border highlight, no keyframe.
- **Offline state is announced:** when offline, `aria-live="polite"` region reads "Offline. X reports queued."
- **Color is never the only encoding:** status pills have text + icon (queued has wifi-off icon, sent has check icon, etc.) per dim 1 §7 + dim 3 conventions.
- **No motion on routine updates** (per `EXPERIENCE.md` §375). Pulse only on acknowledgement events.

---

## 12. Hand-offs

### To dim 6 (data formats)

`AnjaliReport` shape from dim 6 §6.2 covers:
```ts
interface AnjaliReport {
  id: string;
  receivedAt: ISOTimestamp;
  ward: WardId;
  message: string;                       // free text
  voiceNoteBlobRef?: string;             // blob ref to voice payload
  sentinelReading?: { value: number; confidence: number; photoBlobRef?: string };
  weeklyCheckIn?: boolean;
  gpxCoords?: { lat: number; lng: number };
  corroboratedBy?: SensorReading[];
  status: 'queued' | 'sent' | 'verified' | 'dismissed' | 'acknowledged';
}
```

Add to dim 6 §6.2 (v1.1):
```ts
interface AnjaliReport {
  // ... existing
  clientSubmittedAt: ISOTimestamp;       // when Anjali hit Submit (vs server receivedAt)
  clientDevice?: string;                 // for offline-queue diagnostics
}
```

### To dim 7 (sensor wire format)

- Offline queue drain protocol: when Anjali comes back online, queued reports submit as a batch with `BatchEnvelope { reports: AnjaliReport[], clientSubmittedAt: ISOTimestamp[] }` for replay safety.
- SSE event for Anjali acknowledgement: `SSEEvent = { type: 'anjali_acknowledgement', payload: { reportId: AnjaliReportId, message: string, triggeredAction: IncidentSummary | null } }`. Extends the dim 5b §11 SSE union.
- CV sentinel-strip payload: `{ stripReading: { r: number; g: number; b: number }, confidence: number, deviceCVVersion: string }`.

### To dim 8 (motion)

- `--motion-ack-pulse: 200ms ease-out` (one-shot, background-color keyframe per `EXPERIENCE.md` §375)
- `--motion-pane-transition: 240ms ease-out` for the composer modal enter/exit
- `--motion-tab-switch: 160ms ease-out` for bottom-nav switching

### To engineering-setup workstream

- React Native OR Kotlin (deferred decision per dim 5 §16 / rejected-options table). Dim 5c uses CSS-var tokens, so either path works.
- Camera access + on-device CV read (TensorFlow Lite or MediaPipe)
- IndexedDB persistence layer for offline queue
- Audio recording with 60 s cap and waveform visualizer
- Service Worker (or App-Background sync for React Native) for v1.1 background queue drain

---

## 13. Verification checklist

### Ships in dim 5c

- [ ] `anjali-mobile-preview.html` renders the 3 panes (home with action card + status feed, composer with 4 input modes, profile placeholder)
- [ ] Action card is single, full-width, ≥48 px tap target
- [ ] Composer modal top bar shows Cancel + Submit; Submit disabled until input present
- [ ] Voice row, photo row, free-text row, weekly toggle row each ≥48 px tall
- [ ] Status feed row renders with date + description + status pill
- [ ] Offline indicator (wifi-off icon + queue counter) visible in chrome
- [ ] Light theme only — no dark toggle on Anjali preview
- [ ] Bangla labels render correctly with `--line-height-body-bangla: 1.6`
- [ ] Bangla row-pad modifier adds 4 px block padding to Bangla rows
- [ ] Acknowledgement pulse demo (animate on click, single fire per row)
- [ ] Empty state copy: "No reports yet. Your first report lands here." — no "create report" CTA in feed
- [ ] `05c-anjali-mobile-lockdown.md` has 13 sections matching this lockdown

### Deferred to engineering-setup

- [ ] Camera + CV sentinel-strip read
- [ ] Audio recording + waveform visualizer
- [ ] IndexedDB offline queue
- [ ] Service Worker background sync (v1.1)
- [ ] SSE acknowledgement delivery
- [ ] Onboarding flow (first-time Anjali profile setup)
- [ ] Push notification permission flow
- [ ] Low-end-Android perf benchmark (dim 9)

---

## 14. Amendment log

- **v1 (2026-09-07):** Initial lockdown. 3 panes, 4 input modes, offline queue, acknowledgement pulse, Bangla primary, light-only. Closes the surface IA gap from dim 5 §16.
- **2026-09-07 — DEFERRED TO PHASE 2:** Anjali-mobile is removed from the v1 Phase 1 build. Phase 1 ships only the audit-chain gateway (Story 1.1) plus its monitor companions. The four operator surfaces (Anjali-mobile, Priya-desktop, Priya-mobile, PHA-pane) land in Phase 2. This document is preserved verbatim as the design contract for that work; preview HTML is kept for reference. **Verification checklist (§13) and engineering-setup hand-offs are deferred with the surface.**
