# Surakkha v1 — UX Flow Map

**Status:** DRAFT (2026-09-07) — pending review
**Purpose:** Bridge between `EXPERIENCE.md` (narrative) and the mockup pass. Maps each persona's journey screen-by-screen with: trigger → screen (dim-5 template) → user action → chain event landed → next screen. Designed so the mockup pass is mechanical, not invented.
**Companion files:**
- `EXPERIENCE.md` (governs voice + state + flows) — wins on conflict
- `01-color-lockdown.md` … `08-motion-lockdown.md` (governs tokens) — wins on visual conflict
- `06-data-formats-lockdown.md` (governs shapes on each screen) — wins on data conflict
- This file wins on **screen sequence** — if a step needs a screen the lockdown doesn't name, it's named here and the lockdown contract gets a hand-off note.

---

## 0. How to read this document

Every persona section is structured as:

1. **Persona + role + win condition** (1 sentence from `personas.md`)
2. **Surfaces used** (which dim-5 templates apply)
3. **Journey steps** — a numbered table per journey. Columns:
   - **#** — step number
   - **Trigger** — what causes this step
   - **Screen** — the dim-5 template OR a named screen this file invents
   - **User does** — the action verb + object
   - **Chain event** — event type that lands (or "— (read-only projection)")
   - **Next** — what shows next (branch or transition)

Branches are explicit: every step has 2-3 listed next-states (happy, error, alt). Error paths name the screen — they are not skipped.

---

## 1. Cross-persona screens (shared by everyone)

These are the screens every persona touches, including the citizens/Ramesh who never log in.

### 1.1 Public safety notice (Ramesh / citizens · no login)

> "I get a clear 'is the water safe to drink right now' answer without downloading anything." — Ramesh

**Surface:** WhatsApp thread + SMS thread + (sometimes) councillor voice call. **No app.** The "screen" is the message body.

| # | Trigger | Screen | User does | Chain event |
|---|---|---|---|---|
| 1 | T3+ incident confirmed + dual-signed | `WhatsApp bubble` (rendered by Meta) | Reads 6-shape message — header + body + action + zone + verification horizon + issuer | — (receipt is a transport-level ack, not chain) |
| 2 | Next-in-channel race | `SMS bubble` (rendered by carrier) | Reads same content | — |
| 3 | Councillor-routed (optional) | Voice call | Hears message in councillor's voice | — |
| 4 | Incident resolves | `WhatsApp bubble` | Reads "Safe now ✓" message | — |
| 5 | Her report triggers action (Anjali only) | `WhatsApp bubble` | Reads "Your report on {date} at {ward} triggered action X. Thank you." | — |
| 6 | Quarterly | WhatsApp / voice | Receives councillor citation by name | — |

**Ramesh screen design:** We do NOT mockup WhatsApp — we mockup the **message-string template output** (the body of the bubble) so engineering knows exactly what shape lands.

### 1.2 Anjali submit (Citizen-Reporter surface · no login)

> "I report fast, my reports matter, my effort earns status." — Anjali

**Surfaces:** Anjali-mobile (deferred to Phase 2 per dim 5c). For Phase 1 mockup pass, we render these screens as the **what-it-will-look-like** preview so the v1 deliverable still demonstrates the surface exists, even though the Phase-1 demo backend writes to a simpler path.

| # | Trigger | Screen | User does | Chain event |
|---|---|---|---|---|
| 1 | Phone notification / opens app | `Anjali home` (single CTA: Report) | Sees "Report" card; sees acknowledgement feed below | — |
| 2 | Taps Report | `Anjali report sheet` (3-modality input) | Holds mic + records 8s voice; takes photo (sentinel strip); optionally types | — (draft) |
| 3 | Taps Submit | `Anjali report sheet` (submitting state) | Sees brief spinner then "report received" pulse | `AnjaliReportSubmitted` (queued if offline) |
| 4 | Network returns | — (background) | Queue drains, replayed with same `event_id` (AD-14) | `AnjaliReportSubmitted` lands |
| 5 | Report triggers action | `Anjali home` (acknowledgement) | Reads "your report triggered action X" | — (projection update) |

### 1.3 Priya desktop (Utility operator · authenticated)

> "I resolve incidents; I pass shift cleanly." — Priya

**Surfaces:** All 7 Priya page templates (Login, Dashboard, InboxList, InboxDetail, VerifyFlow, AuditLog, Settings).

| # | Trigger | Screen | User does | Chain event |
|---|---|---|---|---|
| 1 | Opens app | **Login** | Enters persona (mock: picks from 5-persona picker) | `OperatorAuthenticated` (on submit) |
| 2 | Login success → landing | **Dashboard** | Sees KPI cards + 24h sensor history + band distribution + slowest wards | — (projection) |
| 3 | Notices anomalous KPI | **InboxList** | Sees ranked incident rows | — (projection) |
| 4 | Picks an incident | **InboxDetail** | Reads source attribution + corroborated confidence | — |
| 5 | Confirms playbook step | **InboxDetail** | Executes Step 1 (confirm with sensor reading) | `PlaybookStepExecuted` |
| 6 | Crosses T2 threshold | **InboxDetail** | Escalates to T2 | `IncidentEscalated{from_tier:T1, to_tier:T2}` |
| 7 | Crosses T3 threshold (after PHA dual-sig) | **InboxDetail** | Two-tap confirms public notice issuance | `MessagePreviewRendered` → `MessageIssuanceConfirmed` → `PublicNoticeIssued` |
| 8 | Deviates from playbook | **InboxDetail** | Captures override-with-reasoning | `DeviationCaptured` |
| 9 | Approves a sensor reading | **VerifyFlow** | Confirms Anjali-attached photo matches reading | `SensorReadingVerified` (or anchored review event) |
| 10 | Reviews the week | **AuditLog** | Filters by ward/time/actor | — (projection) |
| 11 | Shift change | **Dashboard** (handover brief embedded top-left) | Reads "today's open threads" | — |
| 12 | Tweak preferences | **Settings** | Flips a toggle | `AuditEntry{eventType: 'setting_changed'}` |
| 13 | Logout | Login (redirect) | — | `OperatorAccessLogged{type: 'logout'}` |

### 1.4 PHA Approver (Dual-sig · authenticated)

> "I deliver clean water without political blowback; I cross-utility benchmark; I have early-warning." — Dr. Mensah

**Surfaces:** PHA-pane (deferred to Phase 2 per dim 5e). Phase 1 mockup: **rendered as a single "Approve" surface inside Priya's chrome** — the role switch is the only thing that needs to differ, so v1 keeps the demo small.

| # | Trigger | Screen | User does | Chain event |
|---|---|---|---|---|
| 1 | Login as pha_approver | **Login → /approve** | Persona picker → submit | `OperatorAuthenticated` |
| 2 | Lands on approval queue | `Approve queue` (single list) | Sees pending dual-sig items: PublicNoticeIssuances, PlaybookAmendmentApprovals | — |
| 3 | Picks one | `Approve detail` | Reviews diff (for amendments) OR message body (for notices); signs with payload_hash check | `SignatureAttestation` |
| 4 | Vendor countersigns elsewhere | — | — | `SignatureAttestation` (second one) |
| 5 | Both signatures on chain | `Approve queue` | Affordance flips from "pending" to "approved" | `PublicNoticeIssued` (auto-fires once both signatures land and utility_message_desk on-call confirms) OR `PlaybookAmendmentApproved` |
| 6 | Chronic-class review | `PHA aggregate tiles` | Reads deviation dashboard + time-to-T3 medians | — |

### 1.5 PHA Viewer (Audit-only · authenticated, read-only)

> "I have early-warning before hospitals see cases; my decisions are defensible in press conferences." — Dr. Mensah in viewer mode

**Surfaces:** Same Priya chrome but `Verify` and `Approve` are disabled; `Settings` is read-only; **`AuditLog` is the home screen**.

| # | Trigger | Screen | User does | Chain event |
|---|---|---|---|---|
| 1 | Login as pha_viewer | **Login → /audit** | Persona picker → submit | `OperatorAuthenticated{role: 'pha_viewer'}` |
| 2 | Lands on audit | **AuditLog** | Sees full event stream | — |
| 3 | Filters by `event_type`, `ward_id`, `actor_role` | **AuditLog** (filtered) | Reads filtered slice | `OperatorAccessLogged{type: 'audit_filter'}` (every filter is logged) |
| 4 | Drills into one event | **AuditLog** (event detail modal) | Reads full envelope + chain hash | `OperatorAccessLogged{type: 'audit_drilldown'}` |
| 5 | Weekly review | **AuditLog** heatmap view | Sees 7×24 activity heatmap | — |

### 1.6 Vendor (Sensor-fleet · authenticated)

> "My readings are accepted, my sensors stay calibrated, my retail relationship is healthy." (vendor perspective — names per Phase-2 sales motion)

**Surfaces:** **Vendor page** (new screen — needs dim-5 extension in v1.1). For Phase 1 mockup, we render it as a sub-page inside Priya chrome with role switch.

| # | Trigger | Screen | User does | Chain event |
|---|---|---|---|---|
| 1 | Login as vendor | **Login → /vendor** | Persona picker → submit | `OperatorAuthenticated{role: 'vendor'}` |
| 2 | Lands on fleet status | `Vendor dashboard` | Sees per-sensor status (5 states from dim 7 §8): online · late · offline · uncalibrated · tampering-flagged | — |
| 3 | Picks a sensor | `Vendor sensor detail` | Sees recent readings + sensor metadata + last calibration date | — |
| 4 | Submits a batch | `Vendor submit batch` | Picks parameter (pH/turbidity/chlorine), enters value, picks captured_at | `SensorReadingSubmitted` (vendor role) |
| 5 | Replay attempt (same `event_id`) | `Vendor submit batch` (success) | — | second submission returns existing event with `deduplicated: true` (AD-14) |
| 6 | Pushes config update | `Vendor sensor detail` | Flips a sensor config field | `SensorConfigChanged` (extending dim 7 §3 if needed in v1.1) |

---

## 2. Login screen (cross-persona, dim-5 template #1)

This is the **first real mockup we produce**. Defined in detail here so the design is locked before pixels are drawn.

### 2.1 Layout

Single column. Centred card. No nav chrome. Used by all 5 personas.

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│       ┌────────────────────────────────────┐       │
│       │                                    │       │
│       │      [Surakkha logo lockup]        │       │
│       │      Civic water-safety            │       │
│       │                                    │       │
│       │      ─────────────────────         │       │
│       │                                    │       │
│       │      Pick a persona (Phase 1 demo) │       │
│       │      ┌──────────────────────┐      │       │
│       │      │ ● Priya — Operator  │      │       │
│       │      │ ○ Anjali — Reporter │      │       │
│       │      │ ○ PHA Approver      │      │       │
│       │      │ ○ PHA Viewer        │      │       │
│       │      │ ○ Vendor            │      │       │
│       │      └──────────────────────┘      │       │
│       │                                    │       │
│       │      [ Continue →  ]               │       │
│       │                                    │       │
│       │      Demo controls (top-right):    │       │
│       │      Reset • Reseed • Tamper       │       │
│       │                                    │       │
│       └────────────────────────────────────┘       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 2.2 States

| State | Trigger | What shows |
|---|---|---|
| **Initial** | Page load | Persona picker, no selection, Continue disabled |
| **Selected** | Tap a persona | Card highlights (`--brand-50` background, `--brand-500` border); hint text below the picker ("Verifies incidents, runs playbooks, sees Priya desktop."); Continue enabled |
| **Submitting** | Tap Continue | Button shows spinner; persona picker disabled |
| **Success** | POST /api/auth/login returns 200 | Redirect to persona's `landing` route |
| **Error — persona missing** | Tampering | Toast: "Persona data missing. Reset chain and try again." |
| **Error — network** | Mock disabled / fetch fails | Toast: "Couldn't reach auth. Reference: evt_local_{ulid()} — retry." |

### 2.3 Tokens used (from lockdowns)

- Container: dim-5 §2 (`--container-narrow` 720 px, since this is single-column)
- Background: `var(--bg-base)`
- Card: `var(--bg-surface)` with `var(--border-subtle)` outline, `var(--shadow-modal)` elevation
- Logo lockup: dim-2 §6 type pairing (display + system sans)
- Radio buttons: dim-4 toggle component re-skinned as radio
- Submit button: dim-4 button--primary
- Toast: dim-4 toast component
- Demo controls: dim-5 settings-menu pattern, top-right

---

## 3. Dashboard (dim-5 template #2)

Priya + Anjali-landscape-on-desktop only. PHA-Viewer doesn't land here.

### 3.1 Layout

12-col grid, 2-row layout. Top row: 4 KPI tiles + handover brief strip. Bottom row: time-series chart + 2 small charts (donut + horizontal bar).

| Slot | col-span | Map of what shows |
|---|---|---|
| Handover brief strip | col-span-12 | "Today's open threads: 3 open, 1 deviation pending review" + last-update-clock |
| KPI: Active incidents | col-span-3 | Card with sparkline from `DashboardPage.kpiTrends[incidentCount]` |
| KPI: pH drift | col-span-3 | Card with sparkline from `DashboardPage.kpiTrends[phAvg]` |
| KPI: Turbidity | col-span-3 | Card with sparkline from `DashboardPage.kpiTrends[turbidityAvg]` |
| KPI: Response time | col-span-3 | Card with sparkline from `DashboardPage.kpiTrends[responseTimeMin]` |
| 24h sensor history | col-span-8 | `<TimeSeriesLine>` (5b §B.1) |
| Band distribution | col-span-4 | `<Donut>` (5b §B.4) |
| Slowest wards | col-span-12 | `<HorizontalBar>` (5b §B.3) |

### 3.2 States

| State | Trigger | What shows |
|---|---|---|
| **No incidents** | Empty projection | "No open incidents. Last incident resolved 2h ago." + sparklines all showing flat lines |
| **1+ open incidents** | Projection has rows | KPIs + ranked snippet top-3 (links to /inbox) |
| **Projection lag > 30s** | Chain monitor shows lag | Top-chrome `Chain fresh as of {TIME}`; KPIs grayed |
| **Chain verification fail** | Mock tamper or real | Full-screen banner with shake (dim-4 motion) + dim-5 amber top-border |

---

## 4. InboxList (dim-5 template #3)

### 4.1 Layout

12-col grid. Two columns: ranked action list (col-span-8) + filter rail (col-span-4).

| Slot | col-span | Map of what shows |
|---|---|---|
| Filter rail | col-span-4 | Filter by ward, by tier (T0/T1/T2/T3/resolved), by source (Anjali/sensor/PHA) |
| Ranked action list header | col-span-8 | "Open incidents" + count + sort dropdown (Fusion score / Time / Ward) |
| Incident row × N | col-span-8 | Card per row: source attribution + corroborated confidence + tier badge |
| Bottom charts strip | col-span-12 | `<VerticalBar>` (per-ward count) + `<StackedBar>` (verified/dismissed/resolved per ward) |

### 4.2 States

| State | Trigger | What shows |
|---|---|---|
| **Empty** | All incidents resolved | "No open incidents. Last resolved 2h ago." (projection-driven empty state) |
| **Default** | Has rows | Ranked list + filters + charts |
| **Filtered** | Filter applied | Same list, subset, filter pills appear at top |
| **All filters = 0** | Filter eliminates all rows | "0 incidents match these filters. Try widening." + clear-filters button |

---

## 5. InboxDetail (dim-5 template #4)

### 5.1 Layout

12-col. Two-pane: left = incident summary (col-span-5), right = playbook panel (col-span-7). Bottom strip = audit timeline.

| Slot | col-span | Map of what shows |
|---|---|---|
| Incident summary | col-span-5 | Source attribution, fusion score, sensor snapshot, tier badge |
| Playbook panel | col-span-7 | Step-by-step: Read, Execute, Capture-deviation |
| Audit timeline | col-span-12 | Expandable list of chain events for this incident |

### 5.2 Per-step interaction (the operator's hot path)

Each step has:
- **Title** (1 line)
- **Action verb** (1 button: Read / Execute / Deviate)
- **Status** (pending / in-progress / done / deviated)
- **Outputs** (chain event when fired)

| Step | Action verb | Chain event on click |
|---|---|---|
| Confirm with sensor reading | Execute | `PlaybookStepExecuted` |
| Escalate to T2 | Execute | `IncidentEscalated{from_tier, to_tier}` |
| Two-tap T3 (after dual-sig on chain) | First tap → preview, second → confirm | `MessagePreviewRendered` → (5s) → `MessageIssuanceConfirmed` → `PublicNoticeIssued` |
| Capture deviation | Open text input → submit | `DeviationCaptured{reasoning}` |

### 5.3 Two-tap modal states (from EXPERIENCE.md §"Two-tap confirmation")

| State | Trigger | What shows |
|---|---|---|
| **Inaccessible** | Either dual-sig missing | Button disabled with reason "PHA approval pending — {actor} attested at {TIME}, vendor attestation missing" |
| **First tap** | Click | Modal opens: redacted body + recipient zone count + verification horizon + Bangla/English toggle + Cancel + Issue |
| **Reveal full** | 750ms click-and-hold on "Reveal full" | Body un-redacted |
| **5s countdown** | First tap | Ring around Issue button + aria-live countdown text |
| **Confirmed** | Second tap | Modal collapses, chain-link chip appears on incident row |
| **Auto-cancel** | 30min untouched | Chain shows `MessageIssuanceCancelled{reason: 'dangling_preview_timeout'}` |

---

## 6. VerifyFlow (dim-5 template #5)

### 6.1 Layout

Single column (the verify hot path is one thing at a time). Priya walks a queue of pending verifications.

| Slot | col-span | Map of what shows |
|---|---|---|
| Verify card | col-span-12 | Anjali report photo + photo's CV-computed reading + manual color-match swatches |
| Past verification donut | col-span-12 | `<Donut>` of last 30 days: confirmed / flagged / passed-through |

### 6.2 States

| State | Trigger | What shows |
|---|---|---|
| **CV-confident** | phone CV confidence > 0.85 | Reads CV reading; tap to confirm or flag |
| **CV-uncertain** | 0.5 < conf < 0.85 | Manual color-match swatches appear; tap one |
| **CV-failed** | conf < 0.5 | "Tap the closest color (manual mode)"; all 5 swatches shown larger |
| **All clear** | Queue empty | "No verifications pending." |

---

## 7. AuditLog (dim-5 template #6)

### 7.1 Layout

12-col. Heatmap on top (col-span-12). Filterable event list below (6-column table).

| Slot | col-span | Map of what shows |
|---|---|---|
| Activity heatmap | col-span-12 | `<Heatmap>` 7×24 |
| Event type weekly stack | col-span-12 | `<StackedBar>` normalized, last 12 weeks |
| Event list | col-span-12 | Table: time (80) + chain-ref (1fr) + actor (96) + event-type (auto) + action (auto) |

### 7.2 States

| State | Trigger | What shows |
|---|---|---|
| **No filters** | Initial | All events, sorted descending time |
| **Filtered** | Filter applied | Filtered list, filter pills |
| **Event drilldown** | Click row | Modal: full envelope in mono + chain hash link |
| **Empty (after filter)** | 0 matches | "0 events match. Clear filters to see all." |

---

## 8. Settings (dim-5 extension · dim 5 §5-settings)

### 8.1 Layout

12-col. Sticky section nav (col-span-3) + section cards (col-span-9).

| Slot | col-span | Map of what shows |
|---|---|---|
| Sticky nav | col-span-3 | Account · Notifications · Display · Bangla · Chain · Danger zone |
| Section cards | col-span-9 | 5 cards, last is Danger zone |

### 8.2 Mobile collapse

`xl+` (≥1024): 2-column with sticky nav. `<1024`: section nav becomes anchor pills at top.

---

## 9. Vendor (new · not in dim-5 yet — needs v1.1 extension)

### 9.1 Layout

12-col. Per-sensor status table (col-span-12) + submit panel (modal-triggered).

| Slot | col-span | Map |
|---|---|---|
| Fleet status table | col-span-12 | Sensor ID + ward + parameter + last reading + last-update delta + state badge |
| Submit batch modal | overlay | Parameter + value (numeric) + captured_at (ISO) + Submit |

### 9.2 State machine (per dim 7 §8)

| State | Trigger | What shows |
|---|---|---|
| **online** | last reading < 5min ago | Green dot + last-update timestamp |
| **late** | 5min–1h stale | Amber dot + "Last update X min ago" |
| **offline** | > 1h silent | Red dot + "Sensor offline — last at {TIME}" |
| **uncalibrated** | calibration_due_at < now | Amber text "Recalibrate by {DATE}" |
| **tampering-flagged** | reading inconsistent with neighbours | Red badge + drilldown link to chain event |

---

## 10. PHA Approver / Viewer queue (new · not in dim-5 yet — needs v1.1 extension)

### 10.1 Approve queue (PHA Approver only)

| Slot | col-span | Map |
|---|---|---|
| Filter pills | col-span-12 | All · Public notices · Playbook amendments |
| Approval row × N | col-span-12 | Title + tier + payload_hash + Sign button |

### 10.2 PHA aggregate tiles (PHA Approver + Viewer)

Same Priya chrome but no operator-specific content — instead the dashboard row is replaced with `<KPI tile>` per ward with deviation/history.

---

## 11. Cross-screen transition matrix

For mockup-builder reference: every screen-to-screen transition with the event/state that triggers it.

| From | To | Trigger |
|---|---|---|
| Login | Dashboard (Priya) | `OperatorAuthenticated` lands |
| Login | Submit (Anjali) | `OperatorAuthenticated` lands |
| Login | Approve (PHA Approver) | `OperatorAuthenticated` lands |
| Login | Audit (PHA Viewer) | `OperatorAuthenticated` lands |
| Login | Vendor (Vendor) | `OperatorAuthenticated` lands |
| Dashboard | InboxList | Click "Open incidents" card or KPI tile |
| InboxList | InboxDetail | Click incident row |
| InboxDetail | InboxList | Back button OR Escape (modal close) |
| InboxDetail | (T3 two-tap) | Click Issue → preview modal → confirm |
| InboxDetail | Deviation capture | Click Capture deviation → inline form → submit |
| Dashboard | VerifyFlow | Sidebar nav |
| InboxList | VerifyFlow | Sidebar nav |
| VerifyFlow | InboxList | Sidebar nav (after resolving queue) |
| Dashboard | AuditLog | Sidebar nav |
| InboxList | AuditLog | Sidebar nav |
| (any) | Settings | Top-chrome avatar menu |
| Settings | (any) | Sidebar nav OR click logo |
| (any) | Login | Avatar menu → Logout |

---

## 12. Per-persona journey narratives (single-page summaries)

Use these as the "executive summary" of each persona's day in the product.

### 12.1 Priya's day

1. 09:00 — Login → Dashboard. Sees 2 open incidents from overnight.
2. 09:05 — InboxList → InboxDetail on the chlorination-spike row.
3. 09:06 — Execute "Confirm with sensor reading" → `PlaybookStepExecuted`.
4. 09:08 — Sensor confirms; escalate to T2 → `IncidentEscalated`. Sends for PHA dual-sig queue (parallel track).
5. 09:13 — PHA signs. Utility_message_desk signs. Notification lands on Priya's chrome "dual-sig complete, can issue."
6. 09:14 — Two-tap confirm → `PublicNoticeIssued`. Ramesh gets notice in WhatsApp + SMS. Anjali gets "your report mattered" ack.
7. 09:25 — Sensor normalizes; safe-now issued.
8. 09:30 — Dashboard's handover brief is clean.
9. 17:30 — Slight pH drift on Ward 12. Captures deviation; sets a follow-up note for next operator.
10. 17:55 — Handovers to night's operator via the same handover brief; the dashboard is their starting state.
11. 18:00 — Settings → flip "auto-acknowledge Anjali reports" on. (Save is immediate; audit entry lands.)
12. 18:01 — Logout. `OperatorAccessLogged{type:logout}`.

### 12.2 Anjali's flow (Tuesday)

1. 14:00 — Opens Anjali-mobile. Sees Report card.
2. 14:01 — Taps Report. Voice: "Ward 7 school, chlorine smell, kids about to drink." (8s) + photo of sentinel strip (yellow).
3. 14:01 — Submit. "Report received" pulse. Lands `AnjaliReportSubmitted` event.
4. 14:01 — Closes app.
5. 17:30 — Notification: "Your report on Tuesday 14:01 at Ward 7 contributed to the safe-now notice. Thank you."
6. Friday — Councillor cites her by name at the school.

### 12.3 PHA Approver's flow (Tuesday)

1. 09:30 — Login → /approve.
2. 09:31 — 1 pending: T3 public notice for Ward 7 chlorination. Same incident Priya is about to confirm.
3. 09:32 — Reviews body + diff. Signs → `SignatureAttestation` (first of two). Payload_hash visible in mono.
4. 09:35 — Vendor countersigns (off-site, async). `SignatureAttestation` (second).
5. 09:36 — Affordance on Priya's chrome flips from "pending" to "approved."

### 12.4 PHA Viewer's flow (Friday)

1. 09:00 — Login → /audit.
2. 09:05 — Filters to `event_type: IncidentEscalated`, `actor_role: utility_operator`, last 7 days. Sees 14 events.
3. 09:10 — Drills into 1 event. Reads full envelope. (Access logged.)
4. 09:15 — Looks at 7×24 heatmap. Sees spikes at 09:00 + 17:00 (operator shift-change SLOs).
5. 09:20 — Logs out.

### 12.5 Vendor's flow (Monday)

1. 08:00 — Login as vendor → /vendor.
2. 08:01 — Sees fleet: 18 online, 2 late, 1 offline. (The offline is Ward 5 pump station.)
3. 08:05 — Picks the offline. Re-calibrates on-device. Submits new batch of readings from last 24h.
4. 08:06 — Submits: `SensorReadingSubmitted` × 96 (24h × 4 readings/hour).
5. 08:07 — Last batch lands as `deduplicated: true` (because same `event_id` got replayed by a re-sync). No double-write.
6. 08:10 — Logs out.

---

## 13. Decisions locked (review responses 2026-09-07)

> All 7 review questions resolved. The mockup pass uses these as locked inputs.

### 13.1 Login: persona-picker only ✅
Phase 1 mockup renders a clean 5-persona picker — no username/password fields. Phase 2 swaps the entire picker for a real auth form (zero changes to other components). The flow-map ASCII in §2.1 is the canonical layout.

### 13.2 Two-tap T3 modal: two entry points ✅
Accessible from BOTH:
- **Incident row's "Issue" button** — for operators actively watching the row
- **Top-chrome notification badge** — for "PHA just signed, finish it" state (badge is the dual-sig-complete signal)

Both routes open the same modal. Operator self-defense: no missed issuances because the badge was the only signal.

### 13.3 App shell: shared Priya chrome with role-aware variants ✅
Single shell with role-switch:
- **Priya (utility_operator):** full chrome (Dashboard, InboxList, InboxDetail, VerifyFlow, AuditLog, Settings)
- **PHA Approver (pha_approver):** chrome hides VerifyFlow; replaces Dashboard with Approve queue; Settings stays for prefs
- **PHA Viewer (pha_viewer):** chrome hides VerifyFlow + InboxDetail writes; home is AuditLog; Settings is read-only
- **Vendor (vendor):** chrome hides Dashboard/Inbox/Verify/Audit; home is Vendor fleet page
- **Anjali (anjali):** chrome is intentionally minimal (Phase 2 mobile) — for Phase 1 mockup render as a single "Submit a report" card with the acknowledgement feed below

Phase 2 can re-shell per persona without touching screen content.

### 13.4 Verification RBAC: Priya-only ✅
Only `utility_operator` (Priya) can verify. PHA-Viewer sees Verify queue read-only for cross-checks. PHA Approver does NOT verify.

### 13.5 Anjali acknowledgement: feed + passive notification ✅
Belt-and-suspenders:
- **Feed:** Tap "Your reports" card on home → chronological feed of her reports with lifecycle status (submitted → received-by-Priya → action-taken → safe-now ack)
- **Passive notification:** WhatsApp message from Surakkha arrives when her report triggers action. Always. Even if she misses the feed, she sees the message.

### 13.6 Settings persistence: IndexedDB ✅
- Adds `settings` object store to `mocks/idb.ts`
- Each setting change emits `AuditEntry{eventType: 'setting_changed'}` to the chain (per dim 5 §8 hand-off)
- Phase 2 swap = move from IDB to server persistence; the AuditEntry emission stays

### 13.7 Demo controls: visible + confirm modal ✅
- **Location 1:** Top-right of Login screen (visible from persona picker)
- **Location 2:** Settings → Danger zone (mirror)
- **Each button has a confirm modal** — especially Tamper and Reset (Reseed is benign)
- No hash-key gating — reviewers see the controls, but accidental triggers require explicit confirmation

---

## 14. Hand-offs

### 14.1 To dim 5 (grid/pages/stack)

- Add **Vendor page template** (proposed §9) to v1.1 — not in v1 lockdown but documented here so the mockup can render it
- Add **PHA Approver queue page template** (proposed §10.1) to v1.1
- Add **PHA aggregate tiles** (proposed §10.2) to v1.1

These three are *additive* — they don't disturb the existing 7. They're candidates for a dim-5 follow-up contract, not blockers for v1 lockdown.

### 14.2 To dim 6 (data formats)

- Settings page data shape already exists (dim 6 §4.5). No new fields needed for v1.
- Need new shape for "approval queue row": `{ kind: 'public_notice' | 'playbook_amendment', title, tier, payload_hash, attestation_event_ids: ULID[] }`. Hand-off to dim 6 §6 candidates.
- New Vendor shape: `SensorConfigChanged` event payload (extends dim 7 §3 — also a hand-off to dim 7).

### 14.3 To dim 7 (wire format)

- `SensorConfigChanged` event (vendor-side) needs adding to the closed enum in v1.1.
- `SensorReadingVerified` (Priya confirms an Anjali photo) needs adding to the closed enum in v1.1.
- AD-14 idempotency already in dim 7; mock handler already implements it.

### 14.4 To mockup pass

- One folder per persona: `surakkha-app/mockups/01-priya/`, `02-anjali/`, `03-pha-approver/`, `04-pha-viewer/`, `05-vendor/`
- Each folder = N HTML files (one per screen) + a `theme.css` shared with the locked dim 1-4 tokens
- Login is `surakkha-app/mockups/00-login/` (cross-persona)
- Each screen's HTML file names: `login.html`, `dashboard.html`, `inbox-list.html`, `inbox-detail.html`, `verify-flow.html`, `audit-log.html`, `settings.html`

### 14.5 To engineering-setup workstream

- React Router routes: `/login`, `/dashboard`, `/inbox`, `/inbox/:incidentId`, `/verify`, `/audit`, `/settings`, `/approve` (PHA), `/vendor` (vendor)
- TanStack Query: one query key per screen; mutation keys per command event type; refetch on chain-event-arrival (mock SSE-poll equivalent)
- The Login form will be a single component that branches to one of 5 landing routes by persona.id

---

## 15. Verification checklist

### Ships in this document (00-ux-flow-map.md)

- [ ] Every persona has a journey summary (§12)
- [ ] Every screen named in dim-5 (and its extension) maps to ≥ 1 journey step
- [ ] Every chain-event-type from dim 7 §3 appears in ≥ 1 journey step (or is explicitly noted as "background / monitor-emitted")
- [ ] Login screen layout sketched (§2.1)
- [ ] Two-tap modal states enumerated (§5.3)
- [ ] Anjali's status feed clarified (notification vs surface — §13.5)
- [ ] Cross-screen transition matrix complete (§11)
- [ ] Open questions for review listed (§13)

### Deferred to v1.1 (after mockup review)

- [ ] Vendor page template lockdown (uses proposed §9)
- [ ] PHA Approver queue template lockdown (uses proposed §10.1)
- [ ] PHA aggregate tiles template lockdown (uses proposed §10.2)
- [ ] `SensorConfigChanged` + `SensorReadingVerified` events added to dim 7 closed enum

### Locked already, referenced but not re-litigated

- All 8 dim-1-8 lockdown contracts — referenced for tokens, components, shapes, motion, wire format

---

## 16. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Document created. UX flow map covering all 5 personas + Ramesh-channel (no UI). 5 new screens proposed for v1.1 (Vendor, PHA Approver queue, PHA aggregate tiles). Login layout + two-tap states enumerated. Cross-screen transition matrix complete. Open questions for review (§13). | Phase 1 mockup pass needs an explicit screen-by-screen contract before pixels are drawn. EXPERIENCE.md owns narrative; this file owns screen sequence. |
| 2026-09-07 | §13 decisions locked. Persona-picker login (no password fields). Two entry points for T3 modal (row button + chrome badge). Shared Priya chrome with role-aware variants (Vendor/PHA Approver/PHA Viewer hide nav items + render role-specific home). Verify is Priya-only. Anjali gets feed + passive notification. Settings persist to IDB + emit chain audit event. Demo controls visible + confirm modal. | User reviewed and locked all 7 open questions in one pass. Mockup batch 1 (Priya) now has zero open inputs. |
