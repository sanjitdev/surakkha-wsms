---
title: 'Story 1.1 — Single-gateway content-addressed chain with per-tenant namespace'
type: 'feature'
created: '2026-09-07'
status: 'draft'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/workflow-phase1.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every Phase 1 event must be written through one tamper-evident gateway. There is no code yet — no language chosen, no source tree. Without the gateway, no later epic (sensor ingestion, Anjali submission, admin verification, operator dispatch) can write to the chain. Every Phase 1 acceptance criterion for cross-tenant isolation, content addressing, and chain-integrity verification depends on this gateway existing.

**Approach:** Land a FastAPI service backed by a SQLite append-only store. The gateway computes the content-addressed block header (prev_block_hash, block_hash = sha256(canonical(header || event))) and is the only module that touches the chain store. Story 1.1 covers the gateway, the store, and the two background monitors (chain-integrity and sensor-silence). RBAC (Story 1.2) and idempotency by `(tenant_id, event_id)` (Story 1.3) layer on top of this in subsequent stories; Story 1.1 ships the placeholder rejection paths so the contracts are visible.

## Boundaries & Constraints

**Always:**
- Single-process FastAPI service listening on `127.0.0.1:8000` for Phase 1 demo.
- SQLite database file at `data/surakkha.db` — gitignored, regenerated on first run for the demo.
- Single append-only table `chain_blocks(id, prev_block_hash, block_hash, tenant_id, event_type, event_id, schema_version, occurred_at, ingested_at, actor_role, actor_ref, payload_json)` with a uniqueness constraint on `(tenant_id, event_id)` (used by Story 1.3) and an index on `tenant_id`.
- `prev_block_hash` is the previous row's `block_hash` for the same tenant (per-tenant chain); tenant's first block has `prev_block_hash = "0" * 64`.
- `block_hash = sha256(canonical_json({prev_block_hash, tenant_id, schema_version, event_type, event_id, occurred_at, ingested_at, actor_identity, payload}))`. `canonical_json` is sorted-keys, no whitespace.
- All writes go through the gateway. No code path may INSERT into `chain_blocks` outside `app/gateway/store.py`.
- One Phase 1 tenant provisioned at startup: `tenant_id = "dhaka"`.
- Two background asyncio tasks started by the FastAPI `lifespan` handler:
  - `chain_integrity_monitor` — recomputes the hash chain forward and back every 60 s; on mismatch, emits `ChainVerificationFailed` via the gateway write path and logs a high-severity alert.
  - `sensor_silence_monitor` — every 60 s checks the latest reading per registered sensor against a configurable threshold (default 30 min); on breach, emits `SensorSilenceObserved` via the gateway.
- `actor_role` accepted by the write endpoint is constrained to the closed Phase 1 enum `{sensor, anjali, admin, operator, system}`; values outside the enum are rejected with `CommandRejected{reason: "role_not_in_enum"}` and HTTP 400.
- OpenTelemetry SDK initialised in the gateway process with the `chain-integrity` and `sensor-silence` monitors instrumented; vendor-neutral OTLP exporter left as a no-op for Phase 1 (export wiring is Phase 2).
- CORS middleware enabled on the FastAPI app, allowing `http://localhost:5173` (Vite dev server) for local development so the React admin UI can call the API from a different origin. Production allowlist is Phase 2 — leaving `allow_origins=["http://localhost:5173"]` is explicit and temporary.

**Ask First:**
- Switching storage backend away from SQLite (would re-open the KurrentDB-vs-Postgres question).
- Adding an HTTP write endpoint that bypasses the gateway (forbidden — this is the seam).
- Changing the closed Phase 1 role enum (Story 1.2 territory; do not expand here).

**Never:**
- No out-of-band writes to `chain_blocks`. Every row enters via the gateway.
- No background rewrite / migration of past blocks (append-only, content-addressed).
- No multi-tenant schema isolation in SQLite — single DB file, per-tenant chain heads in memory, isolation enforced at gateway admission.
- No PHA / councillor / utility_message_desk roles in Phase 1 (8-entry enum is Phase 2).
- No dual-signature schema bumps in Phase 1 (mechanism is wired in 1.1; the dual-sig is Story 1.2+ work).
- No edit / delete of past rows.
- No auth provider integration in 1.1 (Story 1.2 wires the session-bound `actor_ref` validation; for 1.1 the write endpoint accepts the role + ref as request fields and trusts the value).
- No React UI scaffolding inside `frontend/` in 1.1 — that directory is reserved for Epic 3 only. Do not run `npm create vite@latest` here.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH_WRITE | `POST /v1/chain` with a valid envelope for tenant `dhaka`, role `admin`, payload `{ "hello": "world" }` | Gateway validates role-in-enum, computes header, INSERTs row, returns `201` with `{block_hash, prev_block_hash, event_id}`. Chain head advances. | N/A |
| EMPTY_CHAIN_FIRST_BLOCK | First write to a tenant | `prev_block_hash = "0" * 64`, `block_hash` computed normally, row inserted. | N/A |
| ROLE_OUTSIDE_ENUM | Write with `actor_role = "pha_approver"` | Gateway rejects with `CommandRejected{reason: "role_not_in_enum"}` and HTTP 400. No row inserted. | Logged at WARN level. |
| MISSING_TENANT | Write without `tenant_id` | Gateway rejects with `CommandRejected{reason: "missing_tenant_id"}` and HTTP 400. | Logged at WARN level. |
| CROSS_TENANT_READ | `GET /v1/chain?tenant_id=other` called from a session scoped to `dhaka` | Empty result (filter excludes other tenants); `CrossTenantAccessAttempted` audit event written via the gateway. | Logged at WARN. |
| CHAIN_INTEGRITY_OK | Monitor tick: chain is intact | No action. `chain.verify.last_ok_at` metric updated. | N/A |
| CHAIN_INTEGRITY_FAIL | Monitor tick: tamper detected (recomputed hash ≠ stored hash) | `ChainVerificationFailed` written to the chain via the gateway write path with `actor_role = system`; alert logged at ERROR. | The failed monitor does NOT halt the chain — subsequent writes continue; the failure is itself a chain event. |
| SENSOR_SILENT | No `SensorReadingSubmitted` from `sensor_id = S1` for >30 min when monitor last saw one at T | `SensorSilenceObserved` written to the chain via the gateway write path with `{sensor_id, tenant_id, last_observed_at, silent_since}`. | Idempotent: re-emit only if the silence window has lengthened. |
| PROCESS_RESTART | Gateway process killed mid-write | SQLite write either committed (durable) or not at all; no half-written row. The transaction wraps the INSERT. | WAL mode enabled. |
| DUPLICATE_EVENT_ID | Same `(tenant_id, event_id)` written twice | INSERT fails on uniqueness constraint; gateway catches and returns `DuplicateEventRejected` with HTTP 409. (Full idempotency contract is Story 1.3; 1.1 ships the constraint + the rejection so the contract is visible end-to-end.) | Logged at INFO; client surfaces stable state. |
| BROWSER_CORS | React admin UI on `http://localhost:5173` calls `POST /v1/chain` cross-origin during local dev | `CORSMiddleware` allows the request; gateway responds normally; browser receives the response. | CORS allow-origin is `http://localhost:5173` only in dev; production allowlist is Phase 2. |

</frozen-after-approval>

## Code Map

- `pyproject.toml` — Python project manifest (fastapi, uvicorn[standard], pydantic, sqlite3 stdlib, opentelemetry packages).
- `frontend/` — placeholder for the React admin UI (Epic 3 Story 3.1+). Story 1.1 ships nothing inside this directory; it exists only to reserve the project root namespace. Vite + React + TypeScript + TanStack Query is the planned landing stack; do not scaffold Vite here (out of 1.1 scope).
- `app/__init__.py` — empty marker.
- `app/main.py` — FastAPI app factory, lifespan handler that initialises DB, provisions tenant `dhaka`, and starts the two monitor asyncio tasks. Adds `CORSMiddleware` allowing `http://localhost:5173` (Vite dev server) so the React admin UI in Epic 3 can call the API from a different origin during local development.
- `app/gateway/__init__.py` — empty marker.
- `app/gateway/store.py` — sole writer of `chain_blocks`. Exposes `append_event(envelope)`, `get_chain_head(tenant_id)`, `verify_chain(tenant_id)`. Wraps every write in a SQLite transaction; commits or rolls back atomically.
- `app/gateway/canonical.py` — `canonical_json(obj)` (sorted-keys, no whitespace, stable UTF-8) and `compute_block_hash(header, event)` helpers.
- `app/gateway/envelope.py` — Pydantic models for the request envelope and the closed Phase 1 role enum (`Literal["sensor", "anjali", "admin", "operator", "system"]`).
- `app/gateway/api.py` — FastAPI router. Endpoints: `POST /v1/chain` (write), `GET /v1/chain` (read scoped by tenant + role), `GET /v1/chain/head/{tenant_id}` (last block), `GET /v1/healthz`. Emits the rejection-event shape on every `CommandRejected` decision.
- `app/monitors/__init__.py` — empty marker.
- `app/monitors/integrity.py` — `chain_integrity_monitor(app)` asyncio task. Every 60 s: walk the chain for tenant `dhaka`, recompute each block_hash, compare. On mismatch, build a `ChainVerificationFailed` event envelope and call into the gateway write path.
- `app/monitors/silence.py` — `sensor_silence_monitor(app)` asyncio task. Tracks the latest `SensorReadingSubmitted` per `sensor_id`; on threshold breach, build a `SensorSilenceObserved` event envelope and call into the gateway write path.
- `app/telemetry.py` — OpenTelemetry SDK setup; meter + tracer providers; `chain.verify.last_ok_at`, `chain.verify.failures`, `sensor.silence.events_emitted` instruments.
- `data/.gitkeep` — keep the `data/` directory in git; `data/surakkha.db` is gitignored.
- `.gitignore` — root file; excludes `data/*.db`, `__pycache__/`, `.venv/`.
- `tests/test_chain_write.py` — happy-path POST `/v1/chain`, role-outside-enum rejection, missing-tenant rejection, first-block prev_block_hash, duplicate `(tenant_id, event_id)` rejection, chain-integrity success path, CORS preflight from `http://localhost:5173`.
- `tests/test_monitors.py` — chain-integrity monitor detects a tampered block and emits `ChainVerificationFailed`; sensor-silence monitor detects stale sensor and emits `SensorSilenceObserved`.

## Tasks & Acceptance

**Execution:**
- [ ] `pyproject.toml` -- add fastapi, uvicorn[standard], pydantic, opentelemetry-api, opentelemetry-sdk, pytest, httpx, pytest-asyncio -- establishes the dependency surface so the gateway runs.
- [ ] `.gitignore` -- add `data/*.db`, `__pycache__/`, `.venv/` -- keeps runtime state out of git.
- [ ] `app/gateway/canonical.py` -- implement `canonical_json` + `compute_block_hash` -- the content-addressed header is the spine of the audit chain.
- [ ] `app/gateway/store.py` -- implement the append-only store with WAL mode + the `chain_blocks` schema + uniqueness on `(tenant_id, event_id)` -- sole writer of the chain; idempotency constraint lands here so 1.3 inherits it.
- [ ] `app/gateway/envelope.py` -- implement Pydantic envelope + the closed Phase 1 role enum -- boundary contract for every later epic.
- [ ] `app/gateway/api.py` -- implement `POST /v1/chain`, `GET /v1/chain`, `GET /v1/chain/head/{tenant_id}`, `GET /v1/healthz` -- the single write path; every rejection emits a chain event (role-outside-enum, missing-tenant, cross-tenant read).
- [ ] `app/monitors/integrity.py` -- implement `chain_integrity_monitor` -- 60 s tick; on mismatch emits `ChainVerificationFailed` via the gateway write path.
- [ ] `app/monitors/silence.py` -- implement `sensor_silence_monitor` -- 60 s tick; tracks latest reading per sensor; on breach emits `SensorSilenceObserved`.
- [ ] `app/telemetry.py` -- initialise OpenTelemetry SDK + meters/tracers + instrument the monitors -- Phase 1 wires the SDK; Phase 2 wires the export.
- [ ] `app/main.py` -- wire the FastAPI app + lifespan (DB init, tenant provisioning, monitor task start) + `CORSMiddleware` allowing `http://localhost:5173` -- the seam every later epic starts from.
- [ ] `tests/test_chain_write.py` -- cover the I/O Matrix happy + rejection rows -- proves the gateway contract before 1.2 and 1.3 build on it.
- [ ] `tests/test_monitors.py` -- cover the I/O Matrix monitor rows -- proves the chain self-monitors.

**Acceptance Criteria:**
- Given the gateway is running and tenant `dhaka` is provisioned, when a client POSTs a valid event envelope, then the gateway appends one row to `chain_blocks`, advances the tenant chain head, and returns `201` with `{block_hash, prev_block_hash, event_id}`.
- Given a write request with `actor_role = "pha_approver"` (outside Phase 1 enum), when the request reaches the gateway, then the gateway rejects with `CommandRejected{reason: "role_not_in_enum"}` and HTTP 400, and no row is inserted.
- Given a write request without `tenant_id`, when the request reaches the gateway, then the gateway rejects with `CommandRejected{reason: "missing_tenant_id"}` and HTTP 400.
- Given a tenant chain with N blocks, when `verify_chain(tenant_id)` runs, then it recomputes every `block_hash` from the genesis and they all match the stored values.
- Given a block's stored `block_hash` is tampered with, when the integrity monitor ticks, then the recomputation diverges and `ChainVerificationFailed` is written to the chain via the gateway write path with `actor_role = system`.
- Given a sensor's last reading is older than 30 minutes when the silence monitor ticks, then `SensorSilenceObserved` is written to the chain via the gateway write path with `{sensor_id, tenant_id, last_observed_at, silent_since}`.
- Given the same `(tenant_id, event_id)` is submitted twice, when the second submission reaches the gateway, then the SQLite uniqueness constraint rejects the INSERT, the gateway returns `DuplicateEventRejected` with HTTP 409, and only one row exists in `chain_blocks`.

## Spec Change Log

## Verification

**Commands:**
- `uv run pytest tests/test_chain_write.py -v` -- expected: all I/O Matrix rows pass.
- `uv run pytest tests/test_monitors.py -v` -- expected: tamper detection + silence emission pass.
- `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000` -- expected: server starts, `GET /v1/healthz` returns 200, lifespan provisions tenant `dhaka`, both monitors log "started".
- `curl -X POST http://127.0.0.1:8000/v1/chain -H 'content-type: application/json' -d '{ "tenant_id":"dhaka", "schema_version":1, "event_type":"SensorReadingSubmitted", "event_id":"01J0A0A0A0A0A0A0A0A0A0A0A0", "occurred_at":"2026-09-07T10:00:00Z", "actor_identity":{"role":"sensor","ref":"sensor-S1"}, "payload":{"ntu":0.31} }'` -- expected: 201 response with `{block_hash, prev_block_hash, event_id}`; SQLite row count +1.

**Manual checks (if no CLI):**
- Open `data/surakkha.db` in any SQLite browser; confirm `chain_blocks` table exists, has the columns + uniqueness constraint described in `app/gateway/store.py`, and the first write produced a row with `prev_block_hash = "0" * 64`.
- Confirm `.gitignore` keeps `data/surakkha.db` out of `git status` after a successful write.
- Confirm a `curl -i -X OPTIONS http://127.0.0.1:8000/v1/chain -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'` returns `Access-Control-Allow-Origin: http://localhost:5173` so the React admin UI (Epic 3) can call the API from a different origin in dev.
