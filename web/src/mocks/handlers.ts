/**
 * handlers.ts
 *
 * Phase 1 MSW request handlers — every endpoint here mirrors the dim-7 wire
 * contract exactly. The mock never invents routes; when Phase 2 swaps the
 * mock for the real FastAPI gateway, the React components keep the same
 * fetch paths and same JSON shapes.
 *
 * Routes (matching dim 7 §5 + §14):
 *
 *   POST   /api/auth/login            mock login (no real password check)
 *   POST   /api/auth/logout           clear session
 *   GET    /api/auth/me               current session row (or 401)
 *
 *   GET    /api/chain/head            chain head pointer (for SSE pulse + tamper demo)
 *   GET    /api/chain/blocks          paginated chain scan
 *   POST   /api/events                append a new envelope to the chain
 *   GET    /api/events                list events (read-model projection)
 *
 *   GET    /api/sensors               sensor inventory
 *   GET    /api/sensors/:id/readings  per-sensor reading history
 *   POST   /api/sensors/:id/readings  vendor submits a SensorReadingSubmitted batch
 *
 *   GET    /api/incidents             list (CQRS read model)
 *   POST   /api/incidents             append IncidentCreated / Resolved / Escalated
 *
 *   POST   /api/field/work-orders     field-tech submits TechnicianAssigned / Arrived /
 *                                    DiagnosisSubmitted / FixSubmitted / IncidentResolved
 *                                    (Story 1.2 — dim 7 §3 event-type 33-entry closed enum)
 *
 *   GET    /api/audit/heatmap         7×24 heatmap (server-aggregated per dim 7 §9)
 *
 * Network latency: 200-400ms random (per dim 6 §6.4) to make loading
 * spinners visible. Error rate: 0 (deterministic mock — errors are scripted
 * only via CommandRejected or ChainVerificationFailed events).
 */

import { HttpResponse, delay, http } from 'msw';
import { GENESIS_PREV_HASH, blockHash, ulid } from './canonical';
import {
  type ChainBlock,
  appendBlock,
  getAllBlocks,
  getChainHead,
  getSession,
  setChainHead,
} from './idb';
import { PERSONAS, loginAs, logout } from './session';

const TENANT = 'dhaka';
const SCHEMA_VERSION = 1;

const LATENCY_MS = () => 200 + Math.floor(Math.random() * 200);

// ───────────────────────────────────────────────────────── auth ──────────

const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(LATENCY_MS());
    const body = (await request.json()) as { persona_id?: string };

    if (!body.persona_id) {
      return HttpResponse.json({ error: 'persona_id required' }, { status: 400 });
    }
    try {
      const session = await loginAs(body.persona_id);

      return HttpResponse.json(session);
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 404 });
    }
  }),

  http.post('/api/auth/logout', async () => {
    await delay(LATENCY_MS());
    await logout();
    return HttpResponse.json({ ok: true });
  }),

  http.get('/api/auth/me', async () => {
    await delay(LATENCY_MS() / 2); // faster — header check, not data fetch
    const session = await getSession();

    if (!session) return HttpResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return HttpResponse.json(session);
  }),

  http.get('/api/auth/personas', async () => {
    await delay(LATENCY_MS() / 2);
    return HttpResponse.json(PERSONAS);
  }),
];

// ───────────────────────────────────────────────────────── chain ─────────

const chainHandlers = [
  http.get('/api/chain/head', async () => {
    await delay(LATENCY_MS() / 2);
    const head = await getChainHead();

    if (!head) return HttpResponse.json({ error: 'chain empty' }, { status: 404 });
    return HttpResponse.json(head);
  }),

  http.get('/api/chain/blocks', async ({ request }) => {
    await delay(LATENCY_MS());
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const all = await getAllBlocks();
    const sorted = all.sort((a, b) => a.height - b.height);

    return HttpResponse.json({
      total: sorted.length,
      offset,
      limit,
      blocks: sorted.slice(offset, offset + limit),
    });
  }),

  /**
   * Independent hash verification — per audit-log.md #13.
   *
   * POST /api/chain/verify  body: { block_hash: "0x…" }
   *
   * Recomputes the canonical hash from the block's stored fields and
   * compares it to the supplied block_hash. This is the same canonical
   * form dim 7 §6 uses for chain linking, so a passing result proves
   * the block was not tampered with after append. Designed to complete
   * within 200 ms (foundation §12 #10) — IndexedDB lookup + one
   * SHA-256 call.
   *
   * Response:
   *   { ok: true,  block_hash, height, recomputed: block_hash }
   *   { ok: false, block_hash, reason: 'unknown_hash' | 'hash_mismatch' }
   *
   * This is the operator-side equivalent of a full chain-scan; we keep
   * it single-block so a UI row can verify one event without blocking
   * the table.
   */
  http.post('/api/chain/verify', async ({ request }) => {
    await delay(LATENCY_MS() / 4); // faster than data fetch — pure compute
    const body = (await request.json()) as { block_hash?: string };
    const target = body.block_hash;

    if (!target || typeof target !== 'string') {
      return HttpResponse.json({ ok: false, reason: 'missing_block_hash' }, { status: 400 });
    }
    const all = await getAllBlocks();
    const block = all.find((b) => b.block_hash === target);

    if (!block) {
      return HttpResponse.json({ ok: false, block_hash: target, reason: 'unknown_hash' }, { status: 404 });
    }

    const recomputed = await blockHash({
      prev_block_hash: block.prev_block_hash,
      tenant_id: block.tenant_id,
      schema_version: block.schema_version,
      event_type: block.event_type,
      event_id: block.event_id,
      occurred_at: block.occurred_at,
      ingested_at: block.ingested_at,
      actor_identity: block.actor_identity,
      payload: block.payload,
    });

    if (recomputed !== block.block_hash) {
      return HttpResponse.json({
        ok: false,
        block_hash: block.block_hash,
        recomputed,
        reason: 'hash_mismatch',
      });
    }

    return HttpResponse.json({
      ok: true,
      block_hash: block.block_hash,
      height: block.height,
      recomputed,
    });
  }),

  /**
   * Append a new envelope. The mock:
   *   1. validates envelope shape (event_type in closed set; required fields)
   *   2. computes block_hash via canonical.ts
   *   3. appends to chain_blocks + advances chain_head
   *   4. returns the new block (status 201) or CommandRejected (status 409)
   *
   * Idempotency by (tenant_id, event_id) is enforced: re-posting the same
   * event_id returns the existing block (200) — silent dedup is forbidden
   * (AD-14), so the response carries a `deduplicated: true` flag.
   */
  http.post('/api/events', async ({ request }) => {
    await delay(LATENCY_MS());
    const session = await getSession();

    if (!session) return HttpResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const envelope = (await request.json()) as Partial<ChainBlock> & {
      event_type: string;
      payload: unknown;
    };

    // Closed enum check (dim 7 §3 — 33 event types as of 2026-09-08).
    // Field-tech side events added: TechnicianAssigned, TechnicianArrived,
    // DiagnosisSubmitted, FixSubmitted.
    const ALLOWED = [
      'SensorReadingSubmitted',
      'SensorSilenceObserved',
      'SensorStatusChanged',
      'AnjaliReportSubmitted',
      'AnjaliSentinelReadingSubmitted',
      'AnjaliAcknowledgeDelivered',
      'CitizenAcknowledgement',
      'IncidentCreated',
      'IncidentEscalated',
      'IncidentResolved',
      'PlaybookStepExecuted',
      'DeviationCaptured',
      'OverrideRecorded',
      'ShiftCoverageActivated',
      'ShiftCoverageEnded',
      'TechnicianAssigned',
      'TechnicianArrived',
      'DiagnosisSubmitted',
      'FixSubmitted',
      'PlaybookVersionDrafted',
      'PlaybookVersionPublished',
      'PlaybookVersionAbandoned',
      'PlaybookAmendmentApproved',
      'PublicNoticeIssued',
      'PublicNoticeRetracted',
      'CouncillorEndorsementRecorded',
      'CouncillorRelayMissed',
      'CouncillorQualityFlagged',
      'CouncillorBypassActivated',
      'ChannelDeliveryFailed',
      'SignatureAttestation',
      'CityConfigChanged',
      'SchemaVersionBumped',
      'OperatorAuthenticated',
      'OperatorAccessLogged',
      'ChainVerificationFailed',
      'CommandRejected',
      'ProjectionFailed',
    ];

    if (!ALLOWED.includes(envelope.event_type)) {
      return HttpResponse.json(
        {
          error: 'CommandRejected',
          reason: 'UnknownEventType',
          event_type: envelope.event_type,
        },
        { status: 409 },
      );
    }

    const head = await getChainHead();
    const event_id = envelope.event_id ?? ulid();
    const occurred_at = envelope.occurred_at ?? new Date().toISOString();
    const ingested_at = new Date().toISOString();

    // Idempotency: scan existing blocks for (tenant_id, event_id).
    const all = await getAllBlocks();
    const existing = all.find((b) => b.event_id === event_id);

    if (existing) {
      return HttpResponse.json({ ...existing, deduplicated: true }, { status: 200 });
    }

    const prev_block_hash = head?.block_hash ?? GENESIS_PREV_HASH;
    const block_hash = await blockHash({
      prev_block_hash,
      tenant_id: TENANT,
      schema_version: SCHEMA_VERSION,
      event_type: envelope.event_type,
      event_id,
      occurred_at,
      ingested_at,
      actor_identity: envelope.actor_identity ?? {
        kind: 'operator',
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: envelope.payload,
    });

    const block: ChainBlock = {
      block_hash,
      height: (head?.height ?? 0) + 1,
      prev_block_hash,
      tenant_id: TENANT,
      schema_version: SCHEMA_VERSION,
      event_type: envelope.event_type,
      event_id,
      occurred_at,
      ingested_at,
      actor_identity: envelope.actor_identity ?? {
        kind: 'operator',
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: envelope.payload,
    };

    await appendBlock(block);
    await setChainHead({
      block_hash: block.block_hash,
      height: block.height,
      ingested_at,
    });

    return HttpResponse.json(block, { status: 201 });
  }),

  http.get('/api/events', async ({ request }) => {
    await delay(LATENCY_MS());
    const url = new URL(request.url);
    const event_type = url.searchParams.get('event_type');
    const ward_id = url.searchParams.get('ward_id');
    const limit = Number(url.searchParams.get('limit') ?? '100');

    const all = await getAllBlocks();
    let filtered = all;

    if (event_type) filtered = filtered.filter((b) => b.event_type === event_type);
    if (ward_id) {
      filtered = filtered.filter((b) => {
        const payload = b.payload as { ward_id?: string };

        return payload.ward_id === ward_id;
      });
    }
    const sorted = filtered.sort((a, b) => a.height - b.height).slice(0, limit);

    return HttpResponse.json({
      total: filtered.length,
      events: sorted.map((b) => {
        return {
          event_id: b.event_id,
          event_type: b.event_type,
          occurred_at: b.occurred_at,
          ingested_at: b.ingested_at,
          actor_identity: b.actor_identity,
          payload: b.payload,
          block_hash: b.block_hash,
          height: b.height,
        };
      }),
    });
  }),
];

// ───────────────────────────────────────────────────────── sensors ───────

const sensorHandlers = [
  http.get('/api/sensors', async () => {
    await delay(LATENCY_MS());
    const all = await getAllBlocks();
    const readings = all.filter((b) => b.event_type === 'SensorReadingSubmitted');
    const bySensor = new Map<
      string,
      { sensor_id: string; ward_id: string; parameter: string; last_value: number; last_at: string }
    >();

    for (const b of readings) {
      const p = b.payload as {
        sensor_id: string;
        ward_id: string;
        parameter: string;
        value: number;
      };
      const prev = bySensor.get(p.sensor_id);

      if (!prev || prev.last_at < b.occurred_at) {
        bySensor.set(p.sensor_id, {
          sensor_id: p.sensor_id,
          ward_id: p.ward_id,
          parameter: p.parameter,
          last_value: p.value,
          last_at: b.occurred_at,
        });
      }
    }
    return HttpResponse.json(Array.from(bySensor.values()));
  }),

  http.get('/api/sensors/:id/readings', async ({ params, request }) => {
    await delay(LATENCY_MS());
    const url = new URL(request.url);
    const sinceMinutes = Number(url.searchParams.get('since_minutes') ?? '1440'); // 24h default
    const sinceTs = Date.now() - sinceMinutes * 60 * 1000;
    const all = await getAllBlocks();
    const readings = all
      .filter((b) => b.event_type === 'SensorReadingSubmitted')
      .filter((b) => (b.payload as { sensor_id: string }).sensor_id === params.id)
      .filter((b) => new Date(b.occurred_at).getTime() >= sinceTs)
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
      .map((b) => {
        return {
          t: b.occurred_at,
          value: (b.payload as { value: number }).value,
          seriesId: (b.payload as { sensor_id: string }).sensor_id,
        };
      });

    return HttpResponse.json(readings);
  }),

  http.post('/api/sensors/:id/readings', async ({ params, request }) => {
    // Vendor sensor submission — append SensorReadingSubmitted to chain.
    await delay(LATENCY_MS());
    const body = (await request.json()) as { value: number; captured_at?: string };
    const session = await getSession();

    if (session?.role !== 'vendor') {
      return HttpResponse.json({ error: 'vendor role required' }, { status: 403 });
    }
    // Forward to /api/events handler logic via reuse:
    const head = await getChainHead();
    const event_id = ulid();
    const occurred_at = body.captured_at ?? new Date().toISOString();
    const ingested_at = new Date().toISOString();
    const block_hash = await blockHash({
      prev_block_hash: head?.block_hash ?? GENESIS_PREV_HASH,
      tenant_id: TENANT,
      schema_version: SCHEMA_VERSION,
      event_type: 'SensorReadingSubmitted',
      event_id,
      occurred_at,
      ingested_at,
      actor_identity: {
        kind: 'vendor',
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: {
        sensor_id: params.id,
        ward_id: 'ward-dhanmondi',
        parameter: 'pH',
        value: body.value,
        unit: 'pH',
        captured_at: occurred_at,
        ingestion_window_id: `iw-${Math.floor(Date.now() / 900000)}`,
      },
    });
    const block: ChainBlock = {
      block_hash,
      height: (head?.height ?? 0) + 1,
      prev_block_hash: head?.block_hash ?? GENESIS_PREV_HASH,
      tenant_id: TENANT,
      schema_version: SCHEMA_VERSION,
      event_type: 'SensorReadingSubmitted',
      event_id,
      occurred_at,
      ingested_at,
      actor_identity: {
        kind: 'vendor',
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: {
        sensor_id: params.id,
        ward_id: 'ward-dhanmondi',
        parameter: 'pH',
        value: body.value,
        unit: 'pH',
        captured_at: occurred_at,
        ingestion_window_id: `iw-${Math.floor(Date.now() / 900000)}`,
      },
    };

    await appendBlock(block);
    await setChainHead({
      block_hash: block.block_hash,
      height: block.height,
      ingested_at,
    });
    return HttpResponse.json(block, { status: 201 });
  }),
];

// ───────────────────────────────────────────────────────── incidents ─────

const incidentHandlers = [
  http.get('/api/incidents', async () => {
    await delay(LATENCY_MS());
    const all = await getAllBlocks();
    const incidentEvents = all.filter((b) =>
      ['IncidentCreated', 'IncidentEscalated', 'IncidentResolved'].includes(b.event_type),
    );
    const byIncident = new Map<string, { id: string; latest: ChainBlock }>();

    for (const b of incidentEvents) {
      const p = b.payload as { incident_id?: string };

      if (!p.incident_id) continue;
      const prev = byIncident.get(p.incident_id);

      if (!prev || prev.latest.height < b.height) {
        byIncident.set(p.incident_id, { id: p.incident_id, latest: b });
      }
    }
    return HttpResponse.json(
      Array.from(byIncident.values()).map(({ id, latest }) => {
        const p = latest.payload as Record<string, unknown>;

        // operator-dashboard.md #9 — reporter_kind projects onto the row
        // as a source-attribute chip. Derive from the incident payload:
        //   - explicit payload.reporter_kind wins (Tier 1 hotline spec uses
        //     it for hotline-sourced incidents)
        //   - else fall back to inbox.owner_kind from the FE-1.5b fixture
        //     shape (operator → anchor, citizen → anchor, system/vendor →
        //     sensor, technician → webform)
        //   - else default 'webform' (foundation §6.2 — most common source)
        const inbox = p.inbox as { owner_kind?: string } | undefined;
        const ownerKind = inbox?.owner_kind;
        const explicit = typeof p.reporter_kind === 'string' ? p.reporter_kind : undefined;
        let reporterKind: 'anchor' | 'hotline' | 'webform' | 'sensor' | undefined;

        if (explicit === 'anchor' || explicit === 'hotline' || explicit === 'webform' || explicit === 'sensor') {
          reporterKind = explicit;
        } else if (ownerKind === 'citizen' || ownerKind === 'operator') {
          reporterKind = 'anchor';
        } else if (ownerKind === 'system' || ownerKind === 'vendor') {
          reporterKind = 'sensor';
        } else if (ownerKind === 'technician') {
          reporterKind = 'webform';
        }
        return {
          incident_id: id,
          status:
            latest.event_type === 'IncidentResolved'
              ? 'resolved'
              : latest.event_type === 'IncidentEscalated'
                ? 'escalated'
                : 'open',
          severity: p.severity ?? p.to_severity ?? 'unknown',
          ward_id: p.ward_id,
          last_block_height: latest.height,
          last_event_type: latest.event_type,
          last_occurred_at: latest.occurred_at,
          reporter_kind: reporterKind ?? 'webform',
        };
      }),
    );
  }),
];

// ───────────────────────────────────────────────────────── heatmap ───────

const heatmapHandlers = [
  /**
   * Server-aggregated 7×24 heatmap (per dim 7 §9). Mock computes the same
   * way the production server will: scan all events, bucket by
   * (UTC day-of-week, UTC hour), return count per cell. Clients do NOT
   * compute heatmaps — they receive the matrix.
   */
  http.get('/api/audit/heatmap', async () => {
    await delay(LATENCY_MS());
    const all = await getAllBlocks();
    const cells: { day: number; hour: number; count: number }[] = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const count = all.filter((b) => {
          const d = new Date(b.occurred_at);

          return d.getUTCDay() === day && d.getUTCHours() === hour;
        }).length;

        cells.push({ day, hour, count });
      }
    }
    return HttpResponse.json({ cells, total: all.length });
  }),
];

// ───────────────────────────────────────────────────────── export ────────

export const handlers = [
  ...authHandlers,
  ...chainHandlers,
  ...sensorHandlers,
  ...incidentHandlers,
  ...heatmapHandlers,
];
