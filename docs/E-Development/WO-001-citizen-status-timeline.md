# WO-001 — Citizen Status Timeline

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.1.a — Tier 1 (gap screen).
> Date: 2026-09-15

---

## Objective

Build the citizen-facing status timeline that answers Anjali's "Did anyone come?" question after she submits a water-safety report. The page is informational, not a workflow; the only decision it surfaces is the closure tap when one is due.

## Scope

**In:**
- New page at `web/src/pages/CitizenStatusTimeline.tsx` (already exists as pre-lockdown draft; needs reconciliation)
- Vertical timeline rendering of chain events for one `incident_id`, projected to citizen-relevant subset
- ActionCall component for the closure tap (✅/❌) when due
- Bangla-first locale default (lockdown §11.2)
- Two render modes (public-mode for Anjali = motion-only, no JSON/hashes/payload)
- All chain reads logged as `ChainRead{actor: citizen, incident_id, filter_combo}`

**Out:**
- Chain anomaly surfacing (operator surface, not citizen)
- Hash recomputation (operator-only)
- Filter chips (AuditLogPage only)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/citizen-status-timeline.md` (spec source of truth)
- **Scenario:** `docs/C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md` Screen 3
- **Cross-cutting:** `docs/C-UX-Scenarios/06-audit-chain-timeline-cross-cutting.md` Use Case C
- **Foundation:** `docs/D-UX-Design/01-design-system-foundation.md` (Bangla locale, motion tokens)
- **Master PRD:** `docs/E-Development/000-PRD.md` §3 (trust-band × reporter-badge), §5 (i18n), §11 (logging)

## Acceptance criteria

1. Page renders at `/my-reports/:incident_id/timeline` for `citizen` role
2. Public mode hides payloads/hashes/JSON; shows motion-only event rows (icon + relative time + actor chip)
3. Bangla is default on first visit; user toggle persists in IDB
4. Bangla numerals for all timestamps (`06-data-formats-lockdown.md`)
5. ActionCall renders closure tap (✅/❌) only when `IncidentResolvedByAdmin` event exists and ack is pending
6. Reopen flow opens `ChainReopened{actor: citizen, reason}` event
7. 100% of chain reads write `ChainRead` event (PRD §11.1)
8. No T3 incidents rendered (consumer-notice path; lint-enforced per PRD §3.3)

## UI rules

- **Area Labels** (per foundation §13, spec §1.x):
  - `citizen-status-timeline-page`, `citizen-status-timeline-header`, `citizen-status-timeline-main`
  - `citizen-status-timeline-timeline` (the list)
  - `citizen-status-timeline-event-row` (per event)
  - `citizen-status-timeline-actor-chip` (reporter/operator/field)
  - `citizen-status-timeline-action-call` (closure tap)
  - `citizen-status-timeline-action-call-confirm-yes`, `…-no` (buttons)
- **Primitives used:** `Card`, `Button` (ghost variant for ❌, primary for ✅), `Toast` (post-closure)
- **Layout:** single-pane citizen layout from foundation §3.3
- **Typography:** `--font-family-bangla` (Noto Sans Bengali) primary, `--line-height-body-bangla: 1.6`
- **Motion:** per lockdown `08-motion-lockdown.md`; max 200ms transitions

## Wire contract

- **Read:** `GET /api/chain/blocks?incident_id=…` — already exists; returns paginated blocks filtered by `incident_id`
- **Emit (closure ack):** `POST /api/events` with `ChainAccepted{actor, incident_id}` body
- **Emit (reopen):** `POST /api/events` with `ChainReopened{actor, incident_id, reason}` body
- **Emit (chain read):** `POST /api/events` with `ChainRead{actor: citizen, incident_id, filter_combo: ['all']}` body on mount

No new endpoints required.

## i18n keys

Add to both `web/src/i18n/locales/en/citizenStatusTimeline.json` and `…/bn/`:

```
"page.title": "Your report",
"page.subtitle": "Here's what's happened since you reported.",
"timeline.empty": "Nothing yet — we'll update this page when there's news.",
"timeline.relative.justNow": "just now",
"timeline.relative.minutesAgo": "{n} min ago",
"timeline.relative.hoursAgo": "{n} hr ago",
"timeline.relative.daysAgo": "{n} day ago",
"actionCall.closurePrompt": "Is the issue resolved?",
"actionCall.confirm": "Yes, resolved",
"actionCall.reopen": "No, reopen",
"actionCall.thanks": "Thanks for confirming. All set.",
"actor.reporter": "You",
"actor.operator": "City operator",
"actor.field": "Field crew"
```

Bangla numerals are a render concern, not a key change — handled in component via `Intl.NumberFormat('bn-BD')`.

## Tests required

- **Vitest:** `web/src/__checks__/fe-citizen-timeline-render.test.tsx`
  - Public mode hides payloads/hashes
  - Bangla-first default on first mount
  - Closure tap renders only after `IncidentResolvedByAdmin` event
  - Reopen emits correct event shape
  - Chain read event fires on mount exactly once
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with citizen-timeline journey
- **Visual snapshot:** add to `web/e2e/_tier8-snap/citizen-timeline.png`

## Migration debt

- None (this is a Tier 1 gap screen; no legacy `--band-*` references expected)
- Verify pre-lockdown draft at `web/src/pages/CitizenStatusTimeline.tsx` doesn't contain Hindi strings

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Public-mode projection hides T3, reporter-badge shown via actor chip |
| Closure confetti removed | ✅ 200ms green pulse only (no confetti animation) |
| Hindi locale removed | ✅ EN + BN only; no `hi` key added |
| shadcn/ui adopted | ✅ Uses `Card`, `Button`, `Toast` from `web/src/components/ui/` |
| Token names kept, hexes replaced | ✅ References `--color-trust-*`, `--color-reporter-*` only |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
