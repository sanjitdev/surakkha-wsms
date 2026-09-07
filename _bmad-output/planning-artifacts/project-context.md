---
title: Surakkha v1 — Project Context
type: project-context
status: final
created: 2026-09-07
updated: 2026-09-07
approvedBy: Sanjit (2026-09-07)
phase: Phase 1 MVP
companions:
  - ./workflow-phase1.html
  - ./architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
  - ./epics.md
  - ../implementation-artifacts/epic-1-context.md
---

# Surakkha v1 — Project Context

> **Purpose.** This is the canonical project-grounding doc for Surakkha v1. Every BMad skill that runs on this project loads this file as a persistent fact. Read it once at workflow start and carry it forward — it is the single source for *who the system serves, what Phase 1 must prove, what is deliberately deferred, and which decisions are already settled.* New decisions do not land here; they land in companion docs (`epics.md`, `ARCHITECTURE-SPINE.md`, spec files). Gaps are flagged `[GAP]` and resolved by the appropriate workflow — do not invent answers.

---

## 1. Identity

- **Name.** Surakkha v1 (Bengali: সুরক্ষা — *protection*).
- **One-line purpose.** A tamper-evident water-safety monitoring platform that turns sensor signals and citizen reports into verified incidents — without anyone driving across Dhaka to confirm a sensor is right.
- **Origin doc.** `docs/idea.md` (Sanjit, 2026-09-06): a device checks water quality on TDS and other WHO-grounded metrics; sends data to the app; operators monitor; if contamination is detected, a risk assessment is generated and operators act; ensures water stays safe.
- **Operational region.** Single-city Dhaka, Bangladesh. Single tenant `dhaka`. No multi-tenancy, no federation in Phase 1 (AD-9).
- **Funder.** World Bank–procurement–bound. C-16: no proprietary lock-in (vendor-neutral observability, WB procurement compatible). Active write path stays Bangladesh-resident.

---

## 2. Personas (4 + 1 non-persona)

| # | Persona | Lane | Phase 1 role | Phase 1 surface |
|---|---|---|---|---|
| 1 | **Sensor** | source | Auto-detects contamination above threshold. Cellular radio. | None (writes via `POST /v1/chain` adapter) |
| 2 | **Anjali** (school operator) | source | Submits reports — voice, photo, text, GPS — Bangla primary, English fallback. No login, no training app, no dashboard. | Anjali-mobile (React form-style surface — Phase 1 ships minimal form, no PWA polish) |
| 3 | **Admin** | decision | Verifies (overrides trust band), assigns operator, verifies resolution, closes. | Admin desktop (React, Vite + TanStack Query — Epic 3) |
| 4 | **Operator** (field operator) | action | Acks, dispatches team, submits resolution proof (photo + GPS + timestamp). | Operator mobile-friendly web UI (React — Epic 4) |
| — | **System** *(non-persona trust actor)* | trust | Runs cluster window (5 min), sensor cross-check, reporter-reputation lookup, trust-band computation, auto-routing, SLA monitors. | None (background asyncio tasks in gateway) |

> **Persona count is locked at 4.** Decided 2026-09-07. PHA regulator persona is Phase 2 (deferred).

---

## 3. Phase 1 success criteria (demo bar)

The system ships when a single end-to-end lifecycle is reproducible:

1. A sensor reading above threshold, or an Anjali report, lands in the gateway within 60 s.
2. The 5-minute cluster window, sensor cross-check, and reporter-reputation lookup all fire as chain events.
3. An `IncidentCreated` lands with a trust band (`high | medium | low`) and routes to the correct admin inbox bucket.
4. An admin acks, verifies (or rejects with `reason_category`), assigns an operator with structured `due_at`.
5. The operator acks, dispatches a team, and submits resolution proof with photo + GPS + device-clock timestamp.
6. The admin verifies the proof and closes; Anjali gets a closure notification with ✅ / ❌ taps.
7. A ❌ tap triggers `IncidentReopened{parent}` with full lineage preserved on the chain.
8. Any auditor can open the per-incident audit timeline and see every event anchored to a chain hash.

**Demo non-goals:** production scale, multi-region DR, federation, WB evidence export, PHA pane, public notice issuance, councillor routing, RTBF tombstones, multi-radio fallback.

---

## 4. Architecture spine (decision summary, not full text)

The full spine is at `./architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md`. The decisions that bind every Phase 1 implementation:

| AD | Phase 1 enforcement | Notes |
|---|---|---|
| **AD-1** Event store IS the audit chain | **Full** | Gateway is sole writer; chain is the database. |
| **AD-2** Hybrid aggregate (observation → incident) | **Phase 1 trim** | 1 source (sensor or Anjali) → 1 observation → Incident Aggregator creates incident after pre-triage. |
| **AD-4** Strict versioning + upcasters | Mechanism only | Schema-registry mechanism + per-version upcasters wired; dual-signature bump is Phase 2. |
| **AD-5** Per-tenant isolation | **Full** at gateway | Single tenant `dhaka`; cross-tenant read attempts logged as `CrossTenantAccessAttempted`. |
| **AD-6** RBAC defense-in-depth (3 layers) | **Full** | Gateway → service boundary → data access. |
| **AD-7** Three UIs as separate products | **Phase 1 ships 2** | Admin desktop + Operator mobile-friendly web. Anjali submits via minimal form. PHA-pane is Phase 2. |
| **AD-9** Single-region Dhaka deployment | **Full** | Local DB + replicated peer (out-of-region backup snapshots only). |
| **AD-10** Internal + vendor-neutral observability | **Full** for Phase 1 monitors | OpenTelemetry SDK + chain-integrity monitor + sensor-silence monitor. Override-anomaly monitor is logged only. |
| **AD-12** Closed role enum | **Phase 1 trim: 5 entries** | `{sensor, anjali, admin, operator, system}`. Full 8-entry enum (`pha_approver`, `councillor`, `utility_message_desk`) is Phase 2. |
| **AD-14** Idempotency by `(tenant_id, event_id)` | **Full** | SQLite UNIQUE constraint; rejection as `DuplicateEventRejected` (silent dedup forbidden). |
| **AD-1, AD-14, AD-15** | Mechanism only | Schema-registry and event-sourced config wired; dual-signature requirements are Phase 2. |

Deferred ADs (mechanism-only in Phase 1): AD-3 sealed components (Playbook Engine, Simulator, Multi-Radio deferred), AD-8 multi-radio, AD-11 two-person rule, AD-13 playbook versioning, AD-16 RTBF tombstones, AD-17 Public Notice channel contract.

---

## 5. Stack (locked 2026-09-07)

| Layer | Choice | Notes |
|---|---|---|
| Language | **Python 3.11+** | Decided 2026-09-07 user confirmation |
| API framework | **FastAPI** | Pydantic v2 for envelope validation |
| Storage | **SQLite (WAL mode)** single-node | Decided 2026-09-07; avoids KurrentDB v26.x Enterprise licensing question for demo. Hash chain computed in gateway. Same shape scales to Postgres later if Epic 4+ read concurrency demands it. |
| Async | **asyncio** for two background monitors | chain_integrity_monitor (60 s tick), sensor_silence_monitor (60 s tick) |
| Tests | **pytest + httpx + in-memory SQLite** | |
| Observability | **OpenTelemetry SDK** (CNCF Graduated) | Vendor-neutral OTLP exporter left as no-op in Phase 1; export wiring is Phase 2 |
| Frontend (Epic 3+) | **React** — Vite + React + TypeScript + TanStack Query | `frontend/` directory reserved; no scaffolding in Epic 1 |
| CORS | `CORSMiddleware` allowing `http://localhost:5173` (Vite dev server) | Local-dev only; production allowlist is Phase 2 |

> **Stack change protocol.** Stack swaps require explicit user approval and a fresh epic-context edit. The implementation does not silently re-decide these.

---

## 6. Workflow / event envelope (canonical shape)

Every event written through the gateway carries:

```
{
  tenant_id,         // closed: "dhaka" in Phase 1
  schema_version,    // int; per-event-type owner
  event_type,        // closed enum per epic-context
  event_id,          // ULID; client-minted at user-acknowledged submission time
  occurred_at,       // ISO8601 UTC; source-side time
  ingested_at,       // ISO8601 UTC; gateway-side time
  actor_identity,    // { role: <closed enum>, ref: <session-bound> }
  correlation_id,    // links events to a logical operation
  causation_id,      // links to the event that caused this one
  payload            // per-event-type body
}
```

**Identifiers:** ULID everywhere (lexicographically sortable, time-ordered). Tenant prefix: `{tenant_id}:{entity_id}`.

**Block hash:** `block_hash = sha256(canonical_json({prev_block_hash, tenant_id, schema_version, event_type, event_id, occurred_at, ingested_at, actor_identity, payload}))`. Tenant's first block has `prev_block_hash = "0" * 64`.

**Per-tenant chain:** `prev_block_hash` references the prior row's `block_hash` *for the same tenant*. Tenant isolation enforced at gateway admission.

---

## 7. Glossary

- **NTU** — Nephelometric Turbidity Units. Water clarity measurement. Phase 1 default threshold: NTU > 1.0.
- **TDS** — Total Dissolved Solids. Mentioned in `docs/idea.md`; not yet a Phase 1 sensor payload field (sensor emits NTU + conductivity + chlorine_residual).
- **Trust band** — `high | medium | low`. Computed by the system before any admin sees a report. Drives inbox routing.
- **Trust signals (T1–T11)** — eleven signals the cluster window, cross-check, and reputation lookup combine to produce a band. Defined in `workflow-phase1.html` §10.
- **Cluster window** — 5-minute hold per source event watching for matching reports in same ward + 200 m radius + same contaminant class. Two matches → auto-promote to `high`.
- **Sensor cross-check** — co-witness signal: nearest sensor within 500 m, latest reading within 30 min. `agrees_with_sensor | disagrees_with_sensor | no_signal`.
- **Reporter reputation** — `trusted | new | caution` badge derived from prior `IncidentVerified` / `IncidentRejected` outcomes for that `reporter_id`.
- **EXIF** — Exchangeable Image File Format metadata on photos (GPS, device, timestamp). Required on Anjali photo submissions and operator resolution proofs.
- **Anti-abuse guard (A1)** — soft-throttle: reporters with 2+ verified-false reports in 30 days get auto-tagged `bulk_triage_routed = true` on next submission (not blocked).
- **BR1, BR2, BR3, BR4, R1–R5** — payload-schema rules (referenced by `epics.md` and `workflow-phase1.html`). Example: R3 = `OperatorAssigned` payload must include `due_at: ISO8601`.
- **Citizen loop** — `NotificationSent` after `IncidentClosed` carries ✅ / ❌ taps. ❌ → `IncidentReopened{parent}` re-enters chain at `acknowledged`.
- **Closed Phase 1 role enum** — `{sensor, anjali, admin, operator, system}` (5 entries). Full 8-entry enum is Phase 2.
- **Chain head** — most recent block_hash for a tenant; cached in memory by gateway; verified by chain-integrity monitor.
- **Gateway** — `app/gateway/` in the source tree. The single write path (AD-1). The only module that touches the chain store.

---

## 8. Out of Phase 1 (deliberate non-goals)

The training-project rule: *if a requirement is in a planning document, it is in code; if not, it is not.* Items in this list are **not in Phase 1 code**, by explicit decision:

- PHA regulator persona + pane UI (Phase 2)
- Public notice / Ramesh channel (Phase 2) — no `PublicNoticeIssued` / `PublicNoticeRetracted`
- Dual-signature attestation (AD-11) — single-actor per gate
- Simulator harness (FR-3.3, FR-3.7, AD-13)
- Multi-tenancy beyond single `dhaka` tenant
- World Bank evidence export tooling (FR-6.6)
- Multi-radio fallback (cellular / LPWAN / SD-card tiers)
- Phone-as-network for ward sentinels
- Hybrid incentive (BDT 2,000/month stipend + ICDDR,B credential)
- Right-to-be-forgotten tombstones (AD-16) — kept in spec for Phase 2
- Councillor trust-bridging voice
- Playbook Engine + version-of-record playbook
- Override-anomaly enforcement (logged only)
- Multi-Pane T3 dual-signature amendments
- Operator UI Bangla locale (Bangla primary on Anjali + Admin; Operator stays English)
- Anjali-mobile as a separately-deployed product (Phase 1 ships minimal submission form only)

> **Re-scoping rule.** Pulling anything above into Phase 1 requires (a) updating `epics.md` with explicit story addition, (b) re-running the validation summary, (c) the user signing off on the scope expansion.

---

## 9. UX / design lockdown gate

> **Gate 0 — UX lockdown before any code.** The Phase 1 build is paused until the design lockdown artifact exists and is approved. No spec status flips to `ready-for-dev` before this gate.

The lockdown must commit on:

- **Color palette** — base, surface, on-surface, success, warning, danger, info, plus trust-band colors (`high`, `medium`, `low`)
- **Typography** — primary (Bangla-capable), fallback (system sans), display, body, caption, mono (for block_hash); Bangla punctuation rules; VS15 glyph handling
- **Spacing scale** — base unit (4 / 8 px), scale (xs / sm / md / lg / xl), responsive breakpoints
- **Iconography** — library choice (Material / Lucide / Heroicons / custom Bangla glyphs) + named icons for trust-band badges and event-type rows
- **Data display formats** — NTU (`0.31 NTU`), timestamps (ISO8601 UTC + local-timezone secondary), block_hash (truncated mono with copy-to-clipboard), incident IDs (ULID truncated), phone numbers (Bangla-style grouping)
- **Component patterns** — buttons (primary / secondary / tertiary / danger), modals (focus management on open + close), toast (dismiss + auto-cancel), retraction flow, dangling-preview auto-cancel
- **Per-persona wireframes** — Anjali submission form (3-5 screens), admin inbox + incident detail (5-7 screens), operator dispatch + resolution proof (3-5 screens), citizen ✅ / ❌ tap surface (1 screen)
- **Accessibility baseline** — contrast (WCAG AA), focus order, keyboard nav, shoulder-surfing redaction for citizen taps
- **Trust-band inbox layout** — pre-triage UX is the load-bearing screen; the band color and badge treatment must be visible without reading body text
- **Per-incident audit timeline** — chain-hash anchoring, mono-font hash cells, copy-to-clipboard, "chain verified intact as of [timestamp]" indicator
- **Bangla copy rules** — 160-char SMS budget (GSM-7) / 70-char (UCS-2); no free composition (chain fills the slots); `{CLASS}` slot must come from a pre-approved glossary; minimum 3 low-literacy readers per template before any template ships
- **SMS char budget enforcement** — gateway-enforced at write-time (EN ≤ 160, BN ≤ 70), one SMS is the hard cap, multi-segment rejected (Phase 2 will relax to 153 × N with documented trade-off)

> **Out of lockdown scope** — backend logic, event schemas, chain hash algorithm, projection rebuild rules, RBAC enforcement depth. Those live in `epics.md` and `ARCHITECTURE-SPINE.md`, not the lockdown artifact.

---

## 10. References & companions

| Doc | What it carries | When to load |
|---|---|---|
| `docs/idea.md` | Origin idea, one paragraph | One-time at workflow start |
| `_bmad/bmm/config.yaml` | Module config (user_name, project_name, languages, artifact folders) | Workflow activation |
| `planning-artifacts/workflow-phase1.html` | Phase 1 lifecycle diagram, trust scoring pre-triage, swimlanes, state machine, event table | Epic-context compilation, UX lockdown |
| `planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` | 17 architectural decisions (AD-1 through AD-17), consistency conventions, deferred items | Every epic story (read by epic-context compilation) |
| `planning-artifacts/epics.md` | 5 epics, 19 stories, persona map, Phase 1 FR/AD coverage matrix | Every epic story |
| `implementation-artifacts/epic-N-context.md` | Per-epic compiled context (goal, stories, requirements, technical decisions, UX patterns, dependencies) | Every story in that epic |
| `implementation-artifacts/spec-N-M-*.md` | Per-story Ready-for-Dev spec (Given/When/Then ACs, Code Map, I/O Matrix) | Story build (step-03) |
| `implementation-artifacts/sprint-status.yaml` | 5 epics + 19 stories + 5 retrospectives status | Every status check |

> **Companion ladder.** Spec kernel (`SPEC.md` + 7 companions) > Architecture spine > `epics.md` > `workflow-phase1.html` > per-epic context > per-story spec. Higher in the ladder binds; lower in the ladder elaborates.

---

## 11. Open gaps requiring resolution before Phase 1 ships

These `[GAP]`s must be closed by an explicit workflow — not invented:

- `[GAP]` Concrete event schemas for each of the 15 Phase 1 event types (owned by implementing code per AD-4; first event-schema design pass is the next step after UX lockdown).
- `[GAP]` Per-city config values: NTU threshold default (1.0 stated in epics.md, needs explicit projection-config landing), cluster window default (5 min), sensor cross-check threshold (NTU match ±15 min, 500 m radius), silence threshold (30 min), operator ack SLA (10 min), admin verify SLA, citizen ✅ / ❌ window.
- `[GAP]` WHO template library content (C-14 — deferred to PRD M1 milestone, not Phase 1).
- `[GAP]` WB evidence export format (operational, deferred).
- `[GAP]` Identity provider / RBAC implementation choice (deferred — Story 1.2 wires the mechanism with a placeholder auth session).

---

## 12. Change log

- **2026-09-07** — Initial draft. Compiled from `docs/idea.md`, `epics.md` (Phase 1 trim), `ARCHITECTURE-SPINE.md`, `_bmad/bmm/config.yaml`, in-flight `epic-1-context.md`. UX lockdown gate inserted per user directive ("nothing moves before that"). No new decisions invented; gaps flagged `[GAP]`.
