# Epic 1 Context: Trust Foundation

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the single audit-chain gateway through which every Phase 1 event is written, plus the closed Phase 1 role enum and idempotency contract that bind every later epic. After this epic, no later epic needs to defend its own trust model — it just writes events through the gateway and consumes projections. Phase 1 ships a single tenant (`dhaka`); federation and multi-tenancy are explicitly Phase 2. The chain is the source of truth and the audit trail; sensor silence is a recorded event, not silent drop.

## Stories

- Story 1.1: Single-gateway content-addressed chain writes with per-tenant namespace
- Story 1.2: RBAC defense-in-depth with closed Phase 1 role enum `{sensor, anjali, admin, operator, system}`
- Story 1.3: Idempotency by `(tenant_id, event_id)` + sensor silence as chain event

## Requirements & Constraints

**Hard requirements (must be true for Phase 1 demo):**

- Every audit-relevant event is written through one gateway; no component writes to operational storage directly. The gateway is the only component that may depend on storage.
- Each chain block is content-addressed: `block_hash = sha256(canonical(header || event))`; each block references `prev_block_hash`.
- The chain is gateway-computed (the underlying store is unaware of chaining).
- Cross-tenant queries are impossible — gateway rejects events without a tenant_id and rejects cross-tenant reads (logged as `CrossTenantAccessAttempted`).
- Three-layer RBAC enforcement: gateway admission → service boundary → data-access layer.
- `actor_identity.role` MUST be one of the closed Phase 1 enum `{sensor, anjali, admin, operator, system}` (5 entries; full 8-entry enum with `pha_approver`, `councillor`, `utility_message_desk` is Phase 2).
- `actor_identity.ref` MUST be resolvable to a live auth-session reference at write time; gateway rejects free-form role strings or self-minted actor refs.
- Idempotency by `(tenant_id, event_id)`: gateway rejects duplicate pairs with `DuplicateEventRejected` (silent dedup is forbidden — the chain shows the attempt).
- Sensor silence beyond configurable threshold (Phase 1 default: 30 min) emits `SensorSilenceObserved` to the chain.
- Chain-integrity monitor recomputes hash forward and back from a checkpoint every ≤60 minutes; mismatch raises `ChainVerificationFailed` and a high-severity alert.
- Schema-versioning mechanism (upcasters) is wired in Phase 1; the schema-registry mechanism is in scope. Dual-signature schema bumps are Phase 2.
- OpenTelemetry instrumentation (CNCF Graduated) for chain-integrity and sensor-silence monitors; vendor-neutral backend.

**Performance / reliability:**

- Gateway is no-data-loss for chain writes.
- Reads are projections of the event stream; no component reads from chain storage directly for serving UI queries.

## Technical Decisions

**Architectural paradigm:** Event store IS the audit chain (AD-1). All state changes are events written through the gateway. Append-only, content-addressed, hash-chained.

**Stack (decided 2026-09-07):** Python 3.11+ / FastAPI / SQLite (WAL) / OpenTelemetry SDK / pytest + httpx / asyncio for the two background monitors. **Frontend: React** (Vite + React + TypeScript + TanStack Query, scaffolded in Epic 3 — `frontend/` directory is reserved but stays empty in Epic 1).

**Layering:**

```
adapter (sensor / mobile / admin UI / cron)
   |
   v
Gateway  ← single write path; enforces tenant, RBAC, idempotency, schema
   |
   v
Content-Addressed Store  ← block-anchored; append-only
   |
   v
Projection(s)  ← derived from event stream; serve UI queries; rebuilt by replay

React admin UI (Epic 3)  ← reads via /v1/* projection endpoints; CORS allowlist includes the Vite dev server origin.
```

**Event envelope (Phase 1):** every chain event carries `{tenant_id, schema_version, event_type, event_id, occurred_at, ingested_at, actor_identity, correlation_id, causation_id, payload}`. `actor_identity` carries `{role, ref}` where `role` is the closed Phase 1 enum and `ref` is a session-bound identifier resolved from the auth service.

**Closed Phase 1 role enum (AD-12 trim):** `{sensor, anjali, admin, operator, system}`. Phase 2 adds `pha_approver`, `councillor`, `utility_message_desk`.

**Idempotency contract (AD-14):** adapters mint `event_id` (ULID) at user-acknowledged submission time. The client tracks logical event identity, not network attempt identity — same `event_id` is reused across retries. Gateway accepts the first submission and rejects duplicates with `DuplicateEventRejected`.

**RBAC defense-in-depth (AD-6):** three layers. Layer 1 — gateway admission validates `tenant_id`, role-in-enum, ref-session-bound. Layer 2 — service boundary checks role-permitted-for-event_type and emits `CommandRejected{reason}` on rejection. Layer 3 — data-access layer filters by `tenant_id` and role scope.

**Cross-tenant guard (AD-5):** logged as `CrossTenantAccessAttempted` audit event on any rejection.

**Observability (AD-10):** OpenTelemetry for instrumentation. Two monitors in Phase 1: chain-integrity monitor and sensor-silence monitor. Override-anomaly monitor is Phase 2 (logged only).

**Schema evolution (AD-4):** per-version upcaster functions owned by the event-type owner; old events upcasted on read; chain itself never migrates.

**Storage choice (decided 2026-09-07):** SQLite single-node, hash chain computed in the gateway. Avoids the KurrentDB v26.x Enterprise-licensing question for the demo. Same shape scales to Postgres later if Epic 4+ read concurrency demands it.

## UX & Interaction Patterns

No UX surface ships in Epic 1. The gateway is server-side infrastructure consumed by every later epic. The `frontend/` directory is reserved for the React admin UI (Epic 3) but stays empty in Epic 1. Anjali-mobile (Epic 2), admin UI (Epic 3), and operator UI (Epic 4) all write through this gateway; they do not bypass it. The gateway enables CORS for `http://localhost:5173` so the React dev server can call it during local development.

## Cross-Story Dependencies

- **Within Epic 1:** Story 1.2 (RBAC) and Story 1.3 (idempotency) both depend on Story 1.1's gateway existing — the gateway is the single point that enforces both. Story 1.1 should land first.
- **To later epics:** every Epic 2+ story writes through the gateway. The `CommandRejected` and `DuplicateEventRejected` rejection contract defined in Epic 1 is the contract Epic 2+ adapters handle. The closed Phase 1 role enum from Story 1.2 constrains every actor identity in Epic 2+.
- **To Phase 2 (deferred, no Phase 1 dependency):** `SubjectRedacted` tombstones (AD-16), dual-signature schema bumps (AD-4 Phase 2), federation (AD-5 Phase 2).
