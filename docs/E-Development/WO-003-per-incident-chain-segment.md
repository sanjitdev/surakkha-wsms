# WO-003 — Per-Incident Chain Segment Viewer

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.1.c — Tier 1 (gap screen).
> Date: 2026-09-15

---

## Objective

Extract the chain-segment viewer from `InboxDetail.tsx`'s chain-tab into a dedicated page so operators (Priya/Adi/Karim) and Phase 2's Pia can verify chain integrity per-incident in one click. This is the load-bearing surface for **Goal 2.1** (chain verifiable by independent hash recomputation) and **Goal 2.3** (100% of chain reads logged).

## Scope

**In:**
- New page at `web/src/pages/IncidentChainSegmentPage.tsx` (file may already exist as pre-lockdown draft; needs reconciliation)
- Route: `/incidents/:incident_id/chain` for `utility_operator`
- Vertical timeline rendering of full chain segment for one `incident_id`, ordered by `seq` ascending
- Single-click independent verification (no two-click confirm, no captcha) using `web/src/lib/chain-verify.ts` (MUST import; closes the gap noted in tech audit §7)
- Operator-mode render only (full payloads, hashes, JSON)
- Anomaly surfacing: row ⚠️ + top-banner warning; acknowledge/escalate buttons emit chain events
- Cached hash recomputation: `(incident_id, last_known_seq)` cached for 60s
- 100% of chain reads write `ChainRead{actor, incident_id, filter_combo}` event

**Out:**
- Filter chips (AuditLogPage only per spec locked-decision #8)
- Cross-incident view (AuditLogPage)
- Public/citizen render mode (CitizenStatusTimeline handles that)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/per-incident-chain-segment.md`
- **Scenario:** `docs/C-UX-Scenarios/06-audit-chain-timeline-cross-cutting.md` Screen 2
- **Cross-scenario:** Scenarios 01, 02, 04, 05 (consumers of the chain-segment surface)
- **Helper:** `web/src/lib/chain-verify.ts` (existing; MUST be imported)
- **Foundation:** `docs/D-UX-Design/01-design-system-foundation.md` (motion, color)
- **Master PRD:** `docs/E-Development/000-PRD.md` §6 (chain-verify contract), §11 (logging)

## Acceptance criteria

1. Page renders at `/incidents/:incident_id/chain` for `utility_operator`
2. Vertical timeline shows ALL chain events for the incident, ordered by `seq` ascending
3. Single-click "Independent verification" button (no two-click confirm) calls `verifyBlock()` for the latest block; shows ✅ badge within 200ms
4. ✅ badge color: `--color-safe-green` (`#2F6E45`); icon: `CheckCircle2`; 3s auto-dismiss toast + durable in row metadata column
5. Anomaly (recomputed hash ≠ stored hash) shows row ⚠️ + persistent top banner ("Chain anomaly detected on `inc_…` — escalate to Pia")
6. Top banner is `aria-live="polite"`; persists across page navigations until acknowledged
7. "Acknowledge" button emits `ChainAnomalyAcknowledged{actor, incident_id, seq}` event
8. "Escalate to Pia" button emits `ChainAnomalyEscalated{actor, incident_id, seq}` event (routes to placeholder Phase 2 queue)
9. Row expansion shows structured payload as JSON; copy-to-clipboard on hash anchor
10. Verification cache: `(incident_id, last_known_seq)` for 60s
11. Every page mount writes `ChainRead{actor, incident_id, filter_combo: ['all']}` exactly once (PRD §11.1)
12. Reads imported from `web/src/lib/chain-verify.ts`; no copy-paste verify logic
13. `verifyBlock()` always returns typed `VerifyState`; never throws

## UI rules

- **Area Labels** (per foundation §13):
  - `incident-chain-segment-page`, `…-header`, `…-main`
  - `incident-chain-segment-timeline`
  - `incident-chain-segment-event-row`, `…-actor-chip`, `…-seq-marker`, `…-hash-anchor`
  - `incident-chain-segment-verify-button`
  - `incident-chain-segment-verify-badge`
  - `incident-chain-segment-anomaly-banner`
  - `incident-chain-segment-anomaly-acknowledge`, `…-escalate`
- **Primitives used:** `Card` (row container), `Button`, `Tooltip` (hash copy hint), `Toast` (auto-dismiss), `Modal` (anomaly expansion JSON)
- **Anomaly colors:** `--color-alert-red-reserved` (`#B23A2A`) — issuance path; build-time lint-enforced (PRD §3.3)
- **Verified colors:** `--color-safe-green` (`#2F6E45`)
- **Motion:** per lockdown `08-motion-lockdown.md`

## Wire contract

- **Read:** `GET /api/chain/blocks?incident_id=…&from=…&to=…` (paginated; already exists)
- **Read (head):** `GET /api/chain/head` (cache key)
- **Verify:** `POST /api/chain/verify` with `{ block_hash }` (existing helper routes here)
- **Emit (read):** `POST /api/events` with `ChainRead{actor, incident_id, filter_combo: ['all']}` on mount
- **Emit (acknowledge anomaly):** `POST /api/events` with `ChainAnomalyAcknowledged{actor, incident_id, seq}`
- **Emit (escalate anomaly):** `POST /api/events` with `ChainAnomalyEscalated{actor, incident_id, seq}`

`web/src/mocks/handlers.ts` additions:
- `POST /api/events` handler variants for `ChainRead`, `ChainAnomalyAcknowledged`, `ChainAnomalyEscalated`
- `web/src/mocks/fixtures.ts`: sample anomaly block (recomputed hash differs) for test coverage

## i18n keys

Add to both `web/src/i18n/locales/en/chainSegment.json` and `…/bn/`:

```
"page.title": "Chain segment"
"page.subtitle": "Verified chain events for this incident."
"button.verify": "Independent verification"
"button.acknowledge": "Acknowledge"
"button.escalate": "Escalate to Pia"
"button.copyHash": "Copy hash"
"badge.verified": "Verified"
"badge.anomaly": "Anomaly"
"banner.anomaly.title": "Chain anomaly detected on {incidentId}"
"banner.anomaly.body": "Escalate to Pia."
"actor.operator": "Operator"
"actor.field": "Field crew"
"actor.citizen": "Citizen"
"actor.pha": "Public Health Authority"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-incident-chain-segment.test.tsx`
  - Page renders at correct route
  - Single-click verify shows ✅ within 200ms (mock)
  - `verifyBlock()` is called via `web/src/lib/chain-verify.ts` (not copy-pasted)
  - Anomaly triggers row ⚠️ + top banner
  - Acknowledge emits `ChainAnomalyAcknowledged` event
  - Escalate emits `ChainAnomalyEscalated` event
  - Cache hit returns same result within 60s
  - Cache miss after 60s recomputes
  - Mount fires `ChainRead` event exactly once
  - `verifyBlock()` never throws (force network/timeout failure → typed `VerifyState.fail`)
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with inbox → incident → chain-segment → verify journey
- **Visual snapshot:** add to `web/e2e/_tier8-snap/chain-segment.png`

## Migration debt

- None directly, but ensure the extracted page doesn't re-introduce any of the 95-step migration items
- The `InboxDetail.tsx` chain-tab must be updated to link to this dedicated page (covered by WO-005)

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Reads both dimensions independently; renders reporter-badge actor chips + trust-band rows |
| Closure confetti removed | ✅ N/A |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Card, Button, Tooltip, Toast, Modal from `web/src/components/ui/` |
| Token names kept, hexes replaced | ✅ References `--color-safe-green`, `--color-alert-red-reserved` |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
