# Design Log — Surakkha WSMS

> WDS Phase 4 / 5 progress.
> Maintained by Freya (Phase 4) and Mimir (Phase 5).
> Last updated: 2026-09-15 (Stage 9 complete — ready-for-build; WDS audit complete, GAP-1 closed; GAP-TRIG-KARIM closed; wireframe convention migrated to Mermaid + mmdc; outline rendering-tool updated; WO-008 audit-log reconciled — **Tier 2 DONE**: WO-004 · WO-005 · WO-006 · WO-007 · WO-008; **Tier 3 builds**: WO-009 inbox-list · WO-010 inbox-rail · WO-011 submit-report-page).
>
> **Handoff status:** All 17 PRDs in `docs/E-Development/NNN-[slug].xml` are
> `status="planned"` and ready for `mimir build`. Master PRD at
> `docs/E-Development/000-PRD.md`. Open-question resolutions at
> `docs/E-Development/000-STAGE-7-RESOLUTIONS.md`. Wireframes at
> `docs/D-UX-Design/wireframes/*.mmd` (rendered via mmdc 11.17.0).

---

## 1. Phase status

| Phase | Name | Status |
|---|---|---|
| 0 | Alignment & Signoff | ✓ complete (2026-09-09) |
| 1 | Product Brief | ✓ complete (2026-09-10) |
| 2 | Trigger Map | ✓ complete (2026-09-10) |
| 3 | UX Scenarios | ✓ complete (2026-09-10) |
| 4 | UX Design | ✓ complete (2026-09-11, lockdown-bound) |
| 5 | Agentic Development | ✓ ready-for-build (17 WO + 17 PRD + 51 questions resolved + 4 MAJOR closed 2026-09-15) |
| 6 | Asset Generation | ○ not started |
| 7 | Design System | 🔄 partial (foundation + tokens extracted; full atomic library deferred) |
| 8 | Product Evolution | ○ not started |

---

## 2. Design Loop Status

Per WDS `references/ux-design-workflow.md`:

`○` not started · `S` speccing · `S✓` spec approved · `W` wireframed · `✓` approved · `✓S` spec synced · `B` building · `B✓` built · `R` reviewed · `T` tokens extracted

### 2.1 Tier 1 — gap screens

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| citizen-status-timeline.md | S✓ | ○ | ○ | ○ | ○ | ○ | ✓ | S✓ |
| hotline-intake-modal.md | S✓ | ○ | ○ | ○ | ○ | ○ | ✓ | S✓ |
| per-incident-chain-segment.md | S✓ | ○ | ○ | ○ | ○ | ○ | ✓ | S✓ |

### 2.2 Tier 2 — load-bearing existing pages

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| operator-dashboard.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| inbox-detail.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| field-queue.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |
| field-incident-detail.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |
| audit-log.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |

### 2.3 Tier 3 — light infrastructure pages

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| inbox-list.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |
| inbox-rail.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| submit-report-page.md | S✓ | ○ | ○ | ✓ | ○ | T | ✓ | S✓ |
| citizen-ack-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| login-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| settings-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| styleguide-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| coming-soon-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| verify-flow.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |

---

## 3. Phase 5 prep — open items

Tracked in `docs/D-UX-Design/04-phase-5-prep-todo.md`.

| Stage | Description | Status |
|---|---|---|
| 1 | Convention cleanup (flatten specs/) | ✓ complete (2026-09-15) |
| 2 | WDS scaffolding (E-Development/ + design log) | ✓ complete (2026-09-15) |
| 3 | Brownfield tech audit (Mimir) | ✓ complete (2026-09-15) |
| 4 | Master PRD (Saga) | ✓ complete (2026-09-15) |
| 5 | 17 Work Orders (Freya) | ✓ complete (2026-09-15; 3 Tier 1, 5 Tier 2, 9 Tier 3) |
| 6 | 17 feature PRDs (Mimir) | ✓ complete (2026-09-15) |
| 7 | Resolve open questions + 5 MAJOR items | ✓ complete (2026-09-15; 51 questions + 4 MAJOR items via `000-STAGE-7-RESOLUTIONS.md`) |
| 9 | Ready-for-build handoff | ✓ complete (2026-09-15) |

---

## 4. Lockdown binding (Phase 4 closeout cascade)

From `02-phase-4-closeout.md`:

| Layer | Status |
|---|---|
| Foundation (`01-design-system-foundation.md`) | Lockdown-bound 2026-09-11 |
| Scenarios (03 / 04 / 05) | Re-read; reporter-badge separated from trust band |
| Tier 1 specs | Re-edited; lockdown tokens applied; no Hindi; no confetti; shadcn/ui referenced |
| Tier 2 specs | 114 reconciliation items; 95-step migration plan |
| Tier 3 specs | 5 MAJOR items flagged for fix |
| CSS bridge (`web/mockups/theme.css`) | Lockdown tokens added additively |
| Decision documents | `decisions/00-lockdown-audit.md`, `decisions/01-token-deconfliction-plan.md` |

---

## 5. Cascade shift — trust band × reporter badge

**Before:** trust band carried all semantic load (T1 = anchor-priority, T3 = hotline-sourced lowest).

**After (lockdown, binding):**
- Trust band = verification state: T1 unverified · T2 verified · T3 issuance · resolved
- Reporter badge = separate source attribute: anchor · hotline · webform · sensor
- A reporter can be an anchor at any trust band.
- Hotline-sourced = T1 default + hotline reporter-badge (not T3).
- T3 is reserved for consumer-notice issuance path (build-time lint-enforced).

---

## 6. Tier 3 build log

### WO-009 inbox-list — Mimir 2026-09-15

Built. 6 REQs (001..006) + 6 acceptance criteria + lockdown sweep pinned via `web/src/__checks__/fe-inbox-list-reconcile.test.tsx` (14 tests, all green).

Key reconciliations:
- Trust band = verification state; reporter-badge = source attribute. Both chips land on every row in a new `chrome` column (BandPill locked + ReporterBadge from WO-006 + age + missing-evidence chips).
- URL persistence: `?filter=band=…&reporter=…&status=…&from=…&to=…` round-trips on mount + every chip toggle.
- Loading / error / empty states split into 3 branches: chain-unreachable vs fetch-error vs no-matches.
- Pagination via `<Pagination>` primitive, default 20/page.

Files: `web/src/pages/InboxList.tsx` (+258 LOC), `web/src/pages/inboxListModel.ts` (+45), `web/src/types/inbox.ts` (+150), `web/src/styles/inbox.css` (+90), i18n en+bn (+60 LOC), test file new (561 LOC).

### WO-010 inbox-rail — Mimir 2026-09-15

Built ✓. 4 REQs (001..004) + 4 acceptance criteria + lockdown sweep pinned via `web/src/__checks__/fe-inbox-rail-reconcile.test.tsx` (11 tests, all green).

Key reconciliations:
- New `InboxIncidentRail` — a 240 px compact ranked-incident list per foundation §3.2. Lives inside the `InboxList` consumer surface (left rail of the operator three-column layout).
- Compact BandPill (glyph only, ~18 px wide) + icon-only ReporterBadge (WO-006 shared chip). Trust band stays a SEPARATE dimension from the reporter badge (foundation §1.1).
- URL sync (`?selected=<incident_id>`) on click + pre-populate on mount via `useSearchParams`. Click navigates to `/inbox/:id` carrying the selected param.
- AwaitingActionRail gains a reporter-badge column per row (icon-only chip, data-reporter-kind attribute).
- Lockdown sweep: focus rings 2px `--color-primary-tint`, EN + BN locales (no Hindi), area labels on the rail card.

Files: `web/src/pages/InboxRail.tsx` (+185 LOC), `web/src/pages/InboxList.tsx` (+5), `web/src/components/ui/BandPill.tsx` (+12), `web/src/components/operator/ReporterBadge.tsx` (+14), `web/src/styles/inbox.css` (+80), i18n en+bn inboxCommon.json (+12 LOC), test file new (~390 LOC).

### WO-011 submit-report-page — Mimir 2026-09-15

Built ✓. 5 REQs (001..005) + 8 acceptance criteria + lockdown sweep pinned via `web/src/__checks__/fe-submit-report-reconcile.test.tsx` (15 tests, all green).

Key reconciliations:
- Plain-language urgency dropdown (3 Bangla-first options: "জরুরি নয় / মনোযোগ দরকার / জরুরি"). T-codes stay on the chain payload for operator surfaces but never surface to the citizen (foundation §1.1 — trust band is verification state, an operator concept).
- Wire contract: `POST /api/events` with `IncidentCreated{reporter_kind: 'anchor', band: 'T1', …}` per the WO-011 §"Wire contract". Trust band defaults to T1 (unverified) — operators promote to T2 when anchor NID + photo + hotline verification line up. Reporter-badge dimension (anchor) is separate from trust band.
- Success page renders the real chain `event_id` from projection + a "View your report" link to `/my-reports/:incident_id/timeline` (WO-001).
- 5-min dual-channel ack surface (stub for Phase 1) — `SMS + portal` channels enumerated on the receipt; Phase 2 ships the real gateway.
- Photo capture with auto-EXIF strip (lat/lon/timestamp/device, all editable). Phase 1 desktop demo stubs the capture; Phase 2 mobile lockdown swaps for a real camera bridge.
- Anchor chip on receipt when chain projection reports `reporter_kind: anchor` — reuses the shared `<ReporterBadge />` from WO-006 (icon + label per foundation §6.2).
- Lockdown sweep: focus rings 2px `--color-primary-tint` (binding), EN + BN locales only (no Hindi / Devanagari), area labels, reporter-badge chip on the receipt when applicable.

Files: `web/src/pages/SubmitReportPage.tsx` (+~110 LOC), `web/src/hooks/useIncidentActions.ts` (wire contract extended; +reporter_kind/incident_id in return), `web/src/styles/submit.css` (+110), i18n en+bn submitReport.json (+~30 LOC), test file new (~580 LOC).

### WO-012 citizen-ack — Mimir 2026-09-15

Built = ✓  (Tier 3 build 4/9)

### WO-013 login-page — Mimir 2026-09-15

Built = ✓  (Tier 3 build 5/9)

Reconciliation summary:
- Persona count: kept all 6 personas (priya, anjali, pha_approver, pha_viewer, vendor, karim) — the WO's "5 personas" is a stale count; the MSW `/api/auth/personas` handler returns all 6 and the existing test fixtures reference them. Per WO guidance: "PREFER keeping all 6 personas from the existing implementation UNLESS the WO is explicit."
- LoginPage calls `loginAs(selected.id)` directly from `mocks/session.ts` rather than POSTing `/api/auth/login` first; the MSW handler at `/api/auth/login` delegates back to `loginAs()` so the wire contract + page path both terminate in the same `setSession()` write. The page wires `surakkha:session-changed` via `notifySessionChanged()` from session-bus.
- Locale files: en/login.json holds English, bn/login.json holds Bangla (the previous state had them swapped). Hindi lockdown sweep returns no matches in either file.
- Brand mark glyph binds to `--color-primary` (deep teal) per foundation §7.1.
- Focus rings (`persona`, `.button`) bind to `--color-primary-tint` 2px solid replacing the audit-flagged emerald-600 ring.
- `.picker-status--error` dot binds to `--color-status-warn` (amber) — alert-red is reserved for T3+ issuance surfaces per cascade rule.
- `.button--primary` background binds to `--color-primary` (deep teal) replacing the legacy `--brand-500` blue.
- Bind to `useTranslation('login')` explicit namespace; the cascade allows `useTranslation()` implicit-ns but explicit is the more defensive binding.
- Added `.brand-panel__live-dot--error` and `--pending` modifiers wiring to `--color-status-warn` for parity; not yet wired in JSX (the design spec marks it out-of-scope).

Files: `web/src/pages/LoginPage.tsx` (+7 LOC ns binding + testid), `web/src/styles/app.css` (+18 lines lockdown binding), `web/src/styles/components.css` (+5 lines --color-primary-tint focus ring + button--primary deep teal), en+bn login.json (verified parallel keys), test file new (454 LOC, 13 tests).

### WO-014 settings-page — Mimir 2026-09-15

Built = ✓  (Tier 3 build 6/9)

Reconciliation summary:
- Wire contract landed: `POST /api/events` with `{ event_type: "SettingsReset", actor_identity: { kind, ref, display }, payload: { actor: <actor_ref> } }` fires BEFORE `wipeAll()` + `window.location.reload()`. The previous `resetEverything()` helper (which only did wipe + reload) was split into the explicit emit-then-wipe flow so the audit log captures the reset before the IDB is cleared. Added `'SettingsReset'` to the dim-7 §3 closed enum in `mocks/handlers.ts`.
- `variant="ghost"` + confirm-modal pattern (lockdown §3.4) already in place from the 2026-09-11 cascade — kept as-is. Confirmation modal copy updated to "Reset all settings? This cannot be undone." (en) + "সমস্ত সেটিংস রিসেট করবেন? … এটি ফিরিয়ে আনা যাবে না।" (bn).
- Cards now wrapped in a `.settings-page__stack` div with `gap: var(--space-xl)` (foundation §4 spacing). The shared `.card` primitive has no built-in margin, so the page wrapper owns the rhythm.
- Persona readout already uses `badge--t1-locked` (divider neutral `--color-trust-t1`) — no migration needed; verified that `.badge--t1-locked` in `inbox.css` binds to `var(--color-trust-t1)`.
- `fe-settings-reconcile.test.tsx` new (16 tests, all green): pins the 7 acceptance criteria + Hindi lockdown sweep + focus-ring colour audit + sky-blue audit.
- `fe-b6-settings-reset-modal.test.tsx` updated to assert the new wire contract: POST `SettingsReset{actor}` lands before `wipeAll()`; cancel is a clean no-op.

Files: `web/src/pages/Settings.tsx` (+50 LOC wire emit + stack wrapper), `web/src/styles/settings.css` (+9 lines `.settings-page__stack`), `web/src/mocks/handlers.ts` (+6 lines `'SettingsReset'` enum entry), en+bn `settings.json` (1-line heading update each), test files (+655 LOC net).

Lockdown sweep (4 checks):
- `tech.css` focus rings all use `--color-primary-tint` ✓
- No Hindi letters in en/bn `settings.json` ✓
- `Settings.tsx` contains no `variant="danger"` literal (only in migration comment) ✓
- `tech.css` contains no `#0EA5E9` / `sky-` / `sky-blue` ✓

Net test count: 504 baseline → 520 passing (+16 new settings tests; 0 regression).

---

_End of design log. Updated by Freya at each Design Loop step; by Mimir at each build step._
