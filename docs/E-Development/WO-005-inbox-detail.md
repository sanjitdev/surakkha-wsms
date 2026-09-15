# WO-005 — Inbox Detail

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.2 — Tier 2 (load-bearing).
> Date: 2026-09-15

---

## Objective

Reconcile the existing `InboxDetail.tsx` (904 LOC) to the three-column 240/flex/360 layout per Scenario 01 locked #5. Introduce structured per-decision reasoning capture (foundation §12 #7) and collapse the two-step verify+assign flow into one submit firing four downstream events (locked #2 + #6).

## Scope

**In:**
- Reconcile `web/src/pages/InboxDetail.tsx` to three-column layout
- Left rail: 240px `InboxRail` (ranked incidents with band pill + reporter badge + age + missing-evidence chips)
- Center: flex `DetailPane` — band pill, reporter badge, missing-evidence, five verification signal cards, photo viewer + EXIF, map (incident + nearest sensor)
- Right rail: 360px `EventChain` (the per-incident chain segment — extracted to dedicated page per WO-003; this rail links to it)
- Structured reasoning capture: path picker (A/B/C/D) → path-dependent reasoning fields (severity / category / tags / reasoning text — never single textarea)
- Single-click `Submit verify + assign` firing `Verified` + `Assigned` + `CitizenAckInProgress` + `TechnicianDispatched` in one transaction
- Secondary actions: `Defer with callback` + `Escalate to Pia` (ghost)
- Hotline reporter-badge chip on detail header when `reporter_kind = hotline`
- Override surface: any row with `TrustBandOverridden` event shows "View override reasoning" affordance
- Karim picker, `due_at` picker, priority override dropdown
- Single-click verification reuses `web/src/lib/chain-verify.ts`
- Modal enter/exit 200ms ease-out (foundation §8)

**Out:**
- Filter chips (live on AuditLogPage; this page is read-only linkage back to it via the chain-tab)
- Three-tab layout collapse (already removed in WO-004; this page is single-view)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/inbox-detail.md`
- **Scenario:** `docs/C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md` Screen 4
- **Tier 1 spec:** `per-incident-chain-segment.md` (right-rail chain-segment target)
- **Lockdown:** foundation §3.2, §4.1, §10.3, §12, §13; lockdown audit §F + §E.2
- **Helper:** `web/src/lib/chain-verify.ts`

## Acceptance criteria

1. Page renders at `/inbox/:id` for `utility_operator`
2. Three-column layout: 240px InboxRail / flex DetailPane / 360px EventChain
3. InboxRail shows ranked incidents with band pill + reporter-badge chip + age + missing-evidence chips
4. DetailPane shows band pill, reporter badge, missing-evidence, five verification signal cards, photo viewer + EXIF strip, map with incident + nearest sensor
5. Path picker renders A/B/C/D with path-dependent reasoning fields (not single textarea)
6. Single-click `Submit verify + assign` emits four events in one transaction:
   - `Verified{actor, incident_id, path, reasoning}`
   - `Assigned{actor, incident_id, to: karim_id, due_at}`
   - `CitizenAckInProgress{actor, incident_id}`
   - `TechnicianDispatched{actor, incident_id, technician_id}`
7. `Defer with callback` (ghost) opens a callback-time picker; emits `IncidentDeferred{actor, incident_id, callback_at}`
8. `Escalate to Pia` (ghost) emits `IncidentEscalatedToPha{actor, incident_id}`
9. Hotline-sourced incidents show hotline reporter-badge chip on detail header
10. Override surface: rows with `TrustBandOverridden` event show "View override reasoning" affordance
11. Single-click verification calls `verifyBlock()` from `web/src/lib/chain-verify.ts`; shows ✅ within 200ms
12. Module modal enter/exit 200ms ease-out
13. Tab order matches visual order; `?` opens help modal (foundation §10.3)
14. No Hindi strings; trust band + reporter labels localised; hash anchors NOT translated

## UI rules

- **Area Labels:**
  - `inbox-detail-page`, `…-header`, `…-main`
  - `inbox-detail-rail-inbox` (left), `…-detail-pane` (center), `…-event-chain` (right)
  - `inbox-detail-band-pill`, `…-reporter-badge-chip`
  - `inbox-detail-signal-card-{1..5}`, `…-photo-viewer`, `…-map`
  - `inbox-detail-reasoning-path-picker`, `…-path-{A,B,C,D}`
  - `inbox-detail-reasoning-field-{severity,category,tags,reasoning}`
  - `inbox-detail-karim-picker`, `…-due-at-picker`, `…-priority-override`
  - `inbox-detail-button-submit-verify-assign` (primary)
  - `inbox-detail-button-defer`, `…-escalate` (ghost)
  - `inbox-detail-override-reasoning-affordance`
- **Primitives:** `Card`, `Button`, `Dropdown`, `Modal`, `Toast`, `Tooltip`, `BandPill`, `Input`, `Pagination` (for InboxRail)

## Wire contract

- **Read:** `GET /api/incidents`, `GET /api/events?limit=200` (filtered client-side by `payload.incident_id`)
- **Verify:** `POST /api/chain/verify` (via chain-verify.ts helper)
- **Emit (single submit):** `POST /api/events` with the four-event array `{Verified, Assigned, CitizenAckInProgress, TechnicianDispatched}` — handler must accept batch
- **Emit (defer):** `POST /api/events` with `IncidentDeferred`
- **Emit (escalate):** `POST /api/events` with `IncidentEscalatedToPha`
- **Read (rail link):** link to `/incidents/:incident_id/chain` (WO-003 dedicated page)

`web/src/mocks/handlers.ts` additions:
- `POST /api/events` batch handler (currently single-event; extend to accept array)
- Reuse existing `handlers.ts` chain event fixtures

## i18n keys

Add to both `web/src/i18n/locales/en/inboxDetail.json` and `…/bn/`:

```
"subtitle.verification": "Verify and assign"
"pathPicker.label": "Verification path"
"pathPicker.A": "Path A — Direct corroboration"
"pathPicker.B": "Path B — Cross-reporter pattern"
"pathPicker.C": "Path C — Hotline proxy"
"pathPicker.D": "Path D — Sensor signal"
"reasoning.severity.label": "Severity"
"reasoning.category.label": "Category"
"reasoning.tags.label": "Tags (comma-separated)"
"reasoning.text.label": "Reasoning"
"button.submitVerifyAssign": "Submit verify + assign"
"button.defer": "Defer with callback"
"button.escalate": "Escalate to Pia"
"button.viewOverrideReasoning": "View override reasoning"
"karim.label": "Field technician"
"dueAt.label": "Due at"
"priorityOverride.label": "Priority override"
"toast.verified": "Verified and assigned"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-inbox-detail-reconcile.test.tsx`
  - Three-column layout proportions (240 / flex / 360)
  - Single-click submit fires four events atomically
  - Path picker reveals correct path-dependent fields
  - `verifyBlock()` called via helper (not copy-pasted)
  - Hotline reporter-badge chip shows when `reporter_kind = hotline`
  - Override affordance shows when `TrustBandOverridden` event exists
  - Defer + Escalate buttons emit correct events
  - Tab order matches visual order
  - `?` opens help modal
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with inbox → detail → verify-assign → field-dispatch round-trip

## Migration debt

- **95-step plan items applicable here:**
  - PR 1: 24 OK + 57 MINOR (band pill glyph + text)
  - PR 3: Three-column operator surface alignment (this WO is the main vehicle)
  - PR 4: AuditLog filter chips + chain-read logging (cross-cuts)
- **Phase 1.7+ (not blocking):**
  - `--band-*` → `--color-trust-*` migration across `InboxRow.tsx`, `InboxList.tsx`, `InboxRail.tsx`

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Both dimensions rendered on detail header |
| Closure confetti removed | ✅ N/A |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Card, Button, Dropdown, Modal, Toast, Tooltip, BandPill, Input, Pagination |
| Token names kept, hexes replaced | ✅ References `--color-trust-*`, `--color-reporter-*` |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
