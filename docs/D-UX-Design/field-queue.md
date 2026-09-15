# Field Queue (Karim) — Spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 2
> **Spec author:** Saga/Freya — 2026-09-11

---

## Meta

- **Target file:** `web/src/pages/FieldQueuePage.tsx`
- **Source scenario:** [Scenario 04 — Karim's shift](../C-UX-Scenarios/04-karim-the-technician-field-lane.md)
- **Lockdown binding:**
  - `docs/D-UX-Design/01-design-system-foundation.md` §1.1, §4.1, §4.2, §7, §8, §10, §11
  - `docs/D-UX-Design/decisions/00-lockdown-audit.md` §F Tier 2 page impact
  - `web/mockups/theme.css` (additive lockdown tokens)
- **Primary actor:** Karim (field technician; action lane; off-line-tolerant)
- **Secondary actors:** Priya (dispatch source — `Assigned`); Adi (proof destination — Scenario 02); Anjali (in-progress SMS receivers).
- **Sort contract (locked #1):** `due_at` first, then priority within `due_at`.

## Existing implementation inventory

`FieldQueuePage.tsx` is a React port of `web/mockups/04-technician/work-queue.html`. It reads `/api/events?event_type=TechnicianAssigned&limit=100` and `/api/events?event_type=IncidentResolved&limit=100`, then composes `WorkOrderRow` items filtered by `actor_ref` (Karim's actor id). Renders 4 KPI cells (today / in-progress / overdue / closed), 6 filter chips (all / P1 / P2 / P3 / enroute / onsite), and a list of jobs. SLA sort is opt-in via "Optimize route" button. Uses `dashboard.css` + `tech.css`. Priority chip uses `--band-*` mapping (P1=high/P2=medium/P3=low in the existing tokens). Does NOT implement offline-first, reporter-badge chips, trust-band glyph + text, or read-only lineage.

## Scenario alignment

Per Scenario 04 locked decisions:

- **Locked #1** — queue is assignments-only (not Priya's inbox, not Adi's queue); sorted `due_at` first then priority within `due_at`. Currently uses SLA sort (priority + overdue + status) as opt-in via "Optimize route". Spec must change default to `due_at` first.
- **Locked #2** — priority band colour = trust-band tier (T1/T2/T3 colour-coded by trust-band). Currently priority uses P1/P2/P3 chip with `--band-high/-medium/-low` mapping. Spec must re-bind to trust-band tokens.
- **Locked #3** — full offline mode. Queue cached locally; photos queued; submissions deferred; sync on reconnect with conflict resolution. Currently no offline layer. Spec marks offline-first as `MAJOR`.
- **Locked #4** — each row exposes assignment context inline (incident id + ward + address, priority band, time-since-assignment + due_at countdown, reporter context, original report, Priya's verification reasoning, pre-arrival sensor prep). Currently row exposes incident id + priority + status pill + ticket + title + subtitle (priority + ETA + age). Spec adds reporter-badge chip, Priya's reasoning preview, and due_at countdown chip.
- **Locked #5** — two pre-arrival actions per row (`Acknowledged` fires immediately on tap; `TechnicianArrived` on GPS-confirmed or manual tap). Currently status pill shows `assigned`/`enroute`/`onsite` but no per-row Acknowledge/Arrived buttons. Spec marks as `MEDIUM`.
- **Locked #11** — terse action-lane copy; English-first.

What this page MUST do:

1. Render assignments-only queue, sorted `due_at` first, priority within.
2. Each row: incident id (mono, copy-to-clipboard) + ward + address + trust-band priority chip (glyph + text) + reporter-badge chip (anchor/hotline/webform/sensor) + status chip + due_at countdown chip + age.
3. Persistent **sync-status chip** on the page (green online / amber syncing / grey-red offline) + tap-to-expand sheet showing last-sync timestamp + queued-event count + chain-confirmation-pending count (locked #3).
4. Two pre-arrival actions per row (Acknowledge / Mark arrived).
5. Inline preview of Priya's verification reasoning (one-line collapsed).
6. Offline-tolerant: queue cached locally; submissions queued; sync on reconnect; conflict-resolution by `timestamp + chain_hash`.
7. Reopened row chip (`REOPENED`) with verbatim `ProofInsufficient` feedback preview.

## Lockdown binding

- **Foundation §1.1** — trust band (T1 divider / T2 amber / T3 reserved alert-red / Resolved safe-green). T3 rarely visible to operator (issuance path only); T2 amber is the most common colour on this surface.
- **Foundation §1.1** — reporter-badge palette (`--color-reporter-anchor/hotline/webform/sensor`). **NEW dimension** — existing tokens have nothing analogous; spec marks as `MAJOR` (new component + new dimension).
- **Foundation §4.1** — trust band glyph + text (`◔/◑/●/✓`). Currently priority chip is text-only with colour. Spec adds glyph.
- **Foundation §4.1** — reporter-badge Lucide icon on top of band.
- **Foundation §6** — radii preserved.
- **Foundation §7** — focus rings 2px primary-tint on every interactive.
- **Foundation §8.2** — operator motion: 5s polling, instant row mount, status chip colour transition 300ms ease-out.
- **Foundation §10.2** — focus rings.
- **Foundation §10.3** — keyboard nav; j/k navigate rows.
- **Foundation §11** — i18n English + Bangla; this surface is operator-mode English-default (Scenario 04 locked #11 — terse English copy).
- **Foundation §12 #3** — glyph + text for trust bands.
- **Foundation §12 #9** — named actors everywhere.
- **Scenario 04 §"Pre-arrival sensor prep"** — row exposes inline mini-map of incident + nearest sensors. Current page does not render sensor prep. Spec marks as `MEDIUM`.

## Reconciliation diff

| # | Existing | Spec (lockdown-bound) | Severity |
|---|----------|----------------------|----------|
| 1 | Sort is opt-in SLA via "Optimize route" button; default is build order (insertion) | Default sort = `due_at` first, priority within `due_at` (locked #1); "Optimize route" replaced with "Sort: due_at" toggle | **MEDIUM** |
| 2 | Filter chips: all / P1 / P2 / P3 / enroute / onsite (6 chips) | Replace with: all / T1 / T2 / T3 / acked / on-site (6 chips; T1/T2/T3 = trust-band tier filter; acked = "Acknowledged" status; on-site = `TechnicianArrived` fired) | **MEDIUM** |
| 3 | Row shows `tech-job__priority--p1/p2/p3` (P1/P2/P3 priority label) | Re-bind to trust-band tier chip: `<TrustBandBadge tier={tier} />` with glyph + text per §4.1. P1/P2/P3 mapping is `priority` field on the dispatch payload — it remains a separate dimension from trust band; spec clarifies: row carries BOTH priority (P1/P2/P3 from dispatch) and trust-band tier (T1/T2/T3 from verification state) | **MEDIUM** |
| 4 | No reporter-badge chip on row | Add `<ReporterBadge kind={reporter_kind} />` per row | **MAJOR** |
| 5 | Row `status` pill: `assigned/enroute/onsite/resolved` | Status pill re-bound to Karim's surface state per Scenario 04 locked #5 (`NEW/ACKNOWLEDGED/EN_ROUTE/ON_SITE/DIAGNOSED/FIXED/AWAITING_PROOF/REOPENED`) | **MEDIUM** |
| 6 | `tech-job__time` shows age + overdue flag | Add `due_at` countdown chip alongside age; colour-shift warning at `due_at - 10 min`, "OVERDUE" past `due_at` | **MINOR** |
| 7 | No Acknowledge per-row button | Add `Acknowledge` per-row button (tertiary, compact); fires `Acknowledged{by: karim}` | **MEDIUM** |
| 8 | No `Mark arrived` per-row button | Add `Mark arrived` button (tertiary, compact, GPS-confirmed highlights when within 50m) | **MEDIUM** |
| 9 | No offline layer | Add offline-first layer: queue cached in IndexedDB; submission queue; sync on reconnect; conflict resolution | **MAJOR** |
| 10 | No sync-status chip | Add persistent sync-status chip (green / amber / grey-red) on the page header | **MEDIUM** |
| 11 | No Priya verification reasoning preview | Add collapsed-by-default preview of Priya's reasoning text (one-line + expand affordance) | **MEDIUM** |
| 12 | No pre-arrival sensor prep | Add inline mini-map showing incident pin + nearest 3 sensors + current readings + 24h trend micro-chart + last-sync caption (cached snapshot when offline) | **MAJOR** |
| 13 | No `REOPENED` chip on row | Add `REOPENED` chip + inline `ProofInsufficient` verbatim feedback preview when row is a reopen | **MAJOR** |
| 14 | No `PENDING_SYNC` indicator | Add `PENDING_SYNC` chip on rows with pending submissions; chip clears when gateway confirms; chain block hash appears (mono, copy-to-clipboard) | **MEDIUM** |
| 15 | KPI cells: today / in-progress / overdue / closed | Re-label per Scenario 04 morning brief: "open / due in <30 min / overdue / closed" | **MINOR** |
| 16 | No chain-freshness sub-second indicator | AppLayout top-chrome owns it; spec verifies presence | **OK** |
| 17 | i18n `fieldQueue.*` namespace | OK; aligned with lockdown namespace | **OK** |
| 18 | `tech-job__priority--p1/p2/p3` CSS classes use `--band-*` mapping | Re-bind to `--color-trust-t*` + glyph (additive migration path; existing `--band-*` kept) | **MEDIUM** |
| 19 | Row's CTA is `→` arrow; clicking opens `FieldIncidentDetailPage` | OK; spec marks row tap-target larger (≥48px floor per Scenario 04 — phone in pump-house) | **MINOR** |
| 20 | `tech-job` colour uses `var(--brand-500)` for active state | Swap to `--color-primary` for active-state indicator | **MEDIUM** |
| 21 | Filter chip `is-on` uses bg-subtle colour | OK (semantic — secondary surface) | **OK** |

## Spec for the lockdown-bound version

### Purpose

Karim's assignments-only queue. The page is his shift-start surface and his mid-shift return point. It pre-ranks work by `due_at` (locked #1), surfaces the sync-status chip (offline-first), and exposes inline assignment context (reporter + reasoning + sensor prep) so he can act without leaving the queue.

### User journeys

1. **Shift start:** Loads cached queue (offline-first). Sees top row = next due. Reads inline context (reporter badge, Priya's reasoning, sensor prep). Acknowledges row → `Acknowledged` fires.
2. **Mid-shift:** Rides motorbike to next assignment. Phone intermittently offline. Form submissions queue locally. On reconnect, sync fires silently (no blocking modal); `PENDING_SYNC` chips clear.
3. **Reopen path:** `REOPENED` row surfaces at top of queue. Inline verbatim `ProofInsufficient` feedback preview. Tapping row opens `FieldIncidentDetailPage` for re-submit.
4. **GPS-confirmed arrival:** When GPS detects within 50m of incident pin, `Mark arrived` button auto-highlights within 3 sec. Tap → `TechnicianArrived` fires.

### Layout (locked)

```
+--top-chrome----------------------------------------------------+
| SURAKKHA · ●chain-freshness-pulse    EN | বাংলা  Karim ▾       |
|                              [Sync: ●online] [Help] [Logout]    |
+----------------------------------------------------------------+
| PAGE HEADER: "My queue"  · 14 open · 3 due in 30m · 1 overdue  |
|              [Sort: due_at first ▾]    [Offline: cached snapshot 09:42]
+----------------------------------------------------------------+
| KPIs: open | due<30m | overdue | closed                         |
+----------------------------------------------------------------+
| Filter chips: All | T1 | T2 | T3 | Acked | On-site             |
+----------------------------------------------------------------+
| Queue list (sorted due_at first):                              |
|  ┌──────────────────────────────────────────────────────────┐ |
|  │ [◑ T2] [⚓ Anchor Anjali] inc_01HX... · dhanmondi-3 ·   │ |
|  │  14m · due in 16m · [Acknowledge] [Mark arrived]   →    │ |
|  │  Reasoning preview: "Two corroborating signals..." ▶     │ |
|  │  Sensor prep: S-04 NTU 2.3 ↗ S-07 CL 0.4 ✓             │ |
|  └──────────────────────────────────────────────────────────┘ |
|  ┌──────────────────────────────────────────────────────────┐ |
|  │ [◔ T1] [☎ Hotline] inc_01HX... · mirpur-12 · 31m · due │ |
|  │  in -1m · OVERDUE · [Acknowledge] [Mark arrived]   →    │ |
|  │  ⚠ Path C callout — hotline-sourced                     │ |
|  └──────────────────────────────────────────────────────────┘ |
|  ┌──────────────────────────────────────────────────────────┐ |
|  │ [REOPENED] [⚓ Anchor] inc_01HX... · uttara-2            │ |
|  │  ProofInsufficient verbatim: "Missing: GPS..."          │ |
|  │  → re-open detail page                                  │ |
|  └──────────────────────────────────────────────────────────┘ |
+----------------------------------------------------------------+
```

### Components

- `PageHeader` (foundation §3.1)
- `SortToggle` (dropdown: due_at first / SLA-priority / manual)
- `SyncStatusChip` (persistent top-right; green/amber/grey-red; tap → expand sheet)
- `OfflineBanner` (when offline; shows "Last sync: HH:MM" caption)
- `KPIRow` (4 cells; open / due<30m / overdue / closed)
- `FilterChip` × 6 (all / T1 / T2 / T3 / acked / on-site)
- `FieldQueueRow` (per row):
  - **Trust band priority chip:** glyph + text (`◔ T1` / `◑ T2` / `● T3` / `✓ resolved`)
  - **Reporter-badge chip:** `<ReporterBadge kind={reporter_kind} />` (anchor / hotline / webform / sensor)
  - **Incident id:** mono, copy-to-clipboard
  - **Ward + address:** one line
  - **Status pill:** `NEW/ACKNOWLEDGED/EN_ROUTE/ON_SITE/DIAGNOSED/FIXED/AWAITING_PROOF/REOPENED`
  - **`due_at` countdown chip:** relative time + colour-shift warning at -10min / "OVERDUE" past
  - **Reasoning preview:** one-line collapsed, expand affordance
  - **Sensor prep mini-map:** inline (incident pin + 3 nearest sensors; cached snapshot when offline; last-sync caption)
  - **Pre-arrival actions:** `Acknowledge` (tertiary) + `Mark arrived` (tertiary; GPS-confirmed highlight)
  - **`PENDING_SYNC` chip:** when row has pending submissions
  - **`REOPENED` chip + `ProofInsufficient` verbatim preview:** when row is a reopen

### State mapping

| State | Visible |
|-------|---------|
| Online | Sync chip green; KPI counts live (5s polling); sensor prep live |
| Syncing | Sync chip amber; "Syncing N events…" toast top-right |
| Offline | Sync chip grey-red; offline banner with "Last sync: HH:MM"; rows show cached snapshot; sensor prep cached snapshot; submissions queue locally |
| Conflict | Sync-conflict toast on reconnect; per-incident audit timeline surfaces both events with timestamps |
| Reopened | `REOPENED` chip on row; `ProofInsufficient` feedback preview verbatim |
| GPS-confirmed | `Mark arrived` button highlights when within 50m of incident pin (3 sec latency) |

### Wireframe (textual ASCII)

```
+--top-chrome--chain-freshness-pulse--EN|বাংলা--Karim▾--+
                                         ● Sync: online |

My queue · 14 open · 3 due in 30m · 1 overdue   [Sort: due_at ▾]

[14 open] [3 due<30m] [1 overdue] [22 closed]

[All] [T1] [T2] [T3] [Acked] [On-site]

+-Row 1 -----------------------------------------------+
| ◑ T2  ⚓ Anchor Anjali   inc_01HX... · dhanmondi-3    |
| 14m ago · due in 16m                                   |
| Reasoning ▶  Sensor prep: S-04 NTU 2.3 ↗ S-07 CL 0.4 ✓ |
| [Acknowledge] [Mark arrived]                          |
+------------------------------------------------------+

+-Row 2 -----------------------------------------------+
| ◔ T1  ☎ Hotline   inc_01HX... · mirpur-12             |
| 31m ago · OVERDUE (was due in -1m) ⚠                  |
| ⚠ Path C — hotline-sourced callout                   |
| [Acknowledge] [Mark arrived]                          |
+------------------------------------------------------+

+-Row 3 (REOPENED) -------------------------------------+
| [REOPENED] ⚓ Anchor Anjali · inc_01HX... · uttara-2  |
| Adi's feedback (verbatim):                            |
|   Missing: GPS                                         |
|   Need: re-take with confirmed GPS                    |
|   ETA: +15 min                                         |
| → open detail page to re-submit proof                 |
+------------------------------------------------------+
```

### Empty / loading / error states

- **Loading (first sync):** Skeleton row placeholders; KPI cells `—`.
- **Empty queue:** "No assignments right now. You're ahead of the work."
- **Offline:** Offline banner + cached snapshot timestamp.
- **Sync conflict:** Toast on reconnect "Sync complete — N conflict(s), see [Sync log]."

### i18n

Namespace `fieldQueue.*`. Operator-mode English-default per Scenario 04 locked #11. Bangla toggle available; trust-band labels localised plain language; reporter-badge labels localised; chain event types stay English; hash anchors stay English.

### A11y

- Tab order: sync chip → sort toggle → filter chips → row content (one tab-stop per row) → per-row Acknowledge / Mark arrived → tap-to-detail.
- Trust band badge `aria-label="Trust band T2, verified"`.
- Reporter badge `aria-label="Reporter: anchor citizen"`.
- Sync chip `aria-live="polite"` announces online/offline/syncing state changes.
- Focus rings 2px primary-tint.
- Keyboard: `j/k` navigate rows; `Enter` opens detail; `a` acknowledges focused row.
- Reduced motion: chip colour transitions instant; sensor prep micro-chart no animation.

### Implementation notes

- **Offline-first layer:** Wrap `useFieldQueue()` with `useOfflineCache()`. Queue stored in IndexedDB keyed by `actor_ref`. On `online` event, fire `useSync()` that pushes pending events to gateway; on conflict, fire `ConflictResolved{...}` toast.
- **`due_at` countdown:** `useRelativeTime()` with explicit threshold colour-shift. Component receives `due_at` ISO timestamp; renders countdown + applies `--color-amber` at `due_at - 10min` / `--color-alert-red-reserved` past (issuance path: this is a status warning, NOT a consumer-notice issuance — carve-out per foundation §1.3).
- **GPS detection:** `useGeolocation()` hook fires 30s interval while `FieldIncidentDetailPage` is open; on `<50m` from incident pin, dispatches `gps_confirmed_at` to queue row state.
- **Reporter-badge:** Shared component from dashboard spec.
- **Reopen detection:** Client-side filter on `IncidentReopened{parent}` events; rows matching sort to top.
- **Sensor prep mini-map:** Reuse `MiniMap` from InboxDetail spec.
- **Terscopy:** All buttons use imperative English (`Acknowledge`, `Mark arrived`, not "Acknowledge this assignment").

### Test scenarios

1. **Sort order:** Queue with 5 incidents (different `due_at` + priorities) renders sorted by `due_at` first; ties broken by priority within `due_at`.
2. **Reporter-badge rendering:** 4 incidents (anchor / hotline / webform / sensor reporter) show 4 distinct chips per row.
3. **Trust band priority chip:** T2 row shows `◑ T2 verified` chip; T1 row shows `◔ T1 not yet verified` chip; chip colour matches trust-band token.
4. **`due_at` countdown:** At `due_at - 10min`, chip shifts to amber; past `due_at`, chip shows "OVERDUE" in alert-red-reserved.
5. **Sync chip states:** Online → green; going offline → grey-red within 2 sec; reconnect → amber "Syncing N events…" → green when done.
6. **Offline form submit:** Toggle offline → tap Acknowledge on row → submission queues locally; row shows `PENDING_SYNC` chip; reconnect → chip clears, chain block hash appears (mono).
7. **Reopened row:** Incident with `IncidentReopened{parent}` event surfaces at top of queue with `REOPENED` chip + `ProofInsufficient` verbatim feedback preview.
8. **GPS-confirmed arrived:** With phone GPS at incident pin, `Mark arrived` button highlights within 3 sec; tap fires `TechnicianArrived{gps_confirmed: true}`.
9. **Bangla toggle:** All chips + reasoning preview labels render Bangla; chain refs stay English.
10. **Lockdown focus rings:** Tab through page; every interactive shows 2px deep-teal-tint ring.
11. **Conflict resolution:** Two simultaneous `Acknowledged` events for same incident from two devices → first kept by `prev_block_hash`; second logged as `DuplicateAcknowledged`.
12. **Action-lane terscopy:** All buttons are 1-2 word imperatives (English-first per Scenario 04 locked #11).

### Locked decisions (this spec)

- Sort: `due_at` first, priority within (Scenario 04 locked #1).
- Trust band priority chip = verification state tier (foundation §1.1, Scenario 04 locked #2).
- Reporter-badge = source attribute (anchor / hotline / webform / sensor), separate dimension (foundation §1.1).
- Full offline mode for this surface (Scenario 04 locked #3).
- Two pre-arrival actions per row: Acknowledge + Mark arrived (locked #5).
- Inline assignment context per row (locked #4).
- `REOPENED` row at top of queue (Scenario 04 reopen path).
- Terse English copy (Scenario 04 locked #11).
- Reopen row renders Adi's `ProofInsufficient` verbatim, no translation layer.

## Migration plan

| Order | Edit | Files | Effort |
|-------|------|-------|--------|
| 1 | Replace default sort with `due_at` first comparator | `FieldQueuePage.tsx` | **S** |
| 2 | Replace filter chips: P1/P2/P3 → T1/T2/T3 + acked/on-site | `FieldQueuePage.tsx` + `tech.css` | **M** |
| 3 | Re-bind priority chip to trust-band glyph + text + colour | `FieldQueuePage.tsx` + `tech.css` | **M** |
| 4 | Add `<ReporterBadge>` per row | `FieldQueuePage.tsx` (import shared component) | **S** |
| 5 | Add `due_at` countdown chip column | `FieldQueuePage.tsx` + `tech.css` | **M** |
| 6 | Add per-row `Acknowledge` + `Mark arrived` buttons | `FieldQueuePage.tsx` | **M** |
| 7 | Add offline-first layer (IndexedDB cache + sync layer) | `FieldQueuePage.tsx` + new `useOfflineCache` + `useSync` hooks | **L** |
| 8 | Add `SyncStatusChip` persistent top-right | `FieldQueuePage.tsx` + new component | **M** |
| 9 | Add reasoning preview collapsed-by-default | `FieldQueuePage.tsx` | **M** |
| 10 | Add sensor prep mini-map per row | `FieldQueuePage.tsx` + new `MiniMapRow` component | **L** |
| 11 | Add `REOPENED` chip + verbatim `ProofInsufficient` preview | `FieldQueuePage.tsx` | **M** |
| 12 | Add `PENDING_SYNC` chip on row + chain hash on confirmation | `FieldQueuePage.tsx` | **M** |
| 13 | Update KPI labels to "open / due<30m / overdue / closed" | `FieldQueuePage.tsx` + i18n | **S** |
| 14 | Add `useGeolocation` hook + GPS-confirmed `Mark arrived` highlight | new hook + `FieldQueuePage.tsx` | **M** |
| 15 | Add i18n keys: reporter-badge, sync chip states, reasoning preview, reopen preview | `fieldQueue.*` locales | **M** |
| 16 | Add aria-label strings + keyboard shortcuts (`a` for ack) | `FieldQueuePage.tsx` | **M** |
| 17 | Swap `--brand-500` → `--color-primary` for active-state indicator | `tech.css` | **S** |
| 18 | (Phase 1.7) Migrate `--band-*` → `--color-trust-*` | `tech.css` | **L** |

## Open questions

- **Q1:** Does the offline-first layer live in `FieldQueuePage.tsx` or in a shared `useOfflineCache` hook used by all Karim-side surfaces? Spec assumes shared hook; defer to refactor.
- **Q2:** Sync conflict resolution — when gateway and client disagree, which side wins? Spec assumes `prev_block_hash` wins (per Scenario 04); confirm with backend.
- **Q3:** GPS detection — 30s interval while detail page is open; does the queue page also poll? Spec says no (battery); GPS only fires on detail page.
- **Q4:** `due_at` countdown chip's alert-red at OVERDUE — does this violate the alert-red reservation rule? Carve-out per foundation §1.3: status warnings are NOT consumer-notice issuance; alert-red may be used for status warnings. Confirm.
- **Q5:** Sensor prep mini-map when offline — does it use the last cached snapshot or hide entirely? Spec assumes cached snapshot with "Last sync: HH:MM" caption.
- **Q6:** Reopened rows — does the `ProofInsufficient` feedback include `reviewer: adi` metadata? Spec says yes (verbatim, including reviewer name).
