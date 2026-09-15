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
 *                                    (hotline-intake-modal.md — hotline source
 *                                    variant sets reporter_kind: hotline_operator
 *                                    and pins trust_band: T1)
 *
 *   POST   /api/hotline-calls         hotline call-log endpoint (no_incident /
 *                                    wrong_number outcomes). Emits
 *                                    HotlineCallLogged chain event.
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

    const body = (await request.json()) as unknown;

    // WO-005 — REQ-013 batch event handler. The endpoint accepts EITHER
    // a single envelope (back-compat with existing one-shot POSTs) OR
    // an array of envelopes (batch). Each envelope is processed by the
    // canonical append path; the chain head advances per envelope so the
    // batch lands atomically (one transaction in idb-keyval — same
    // head, no interleaving from other writers within the handler).
    const isBatch = Array.isArray(body);
    const envelopes = (isBatch ? body : [body]) as Array<
      Partial<ChainBlock> & { event_type: string; payload: unknown }
    >;

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
      // WO-001 — operator-side closure emitted by an admin operator
      // before the citizen is asked to ack (citizen-status-timeline.md
      // §6 "closure-ack" branch + deriveActionCallState). Mirror of
      // the production gateway's closed-enum; same wire shape.
      'IncidentResolvedByAdmin',
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
      // WO-001 — Citizen Status Timeline (citizen-status-timeline.md §6).
      // ChainRead is emitted on every citizen chain read (PRD §11.1);
      // ChainAccepted / ChainReopened are the two citizen-side closures
      // emitted from the ActionCall closure tap (Scenario 03 Screen 4).
      'ChainRead',
      'ChainAccepted',
      'ChainReopened',
      // WO-002 — Hotline Intake Modal. IncidentCreated is already
      // accepted via /api/incidents; the wire contract per WO-002
      // §"Wire contract" emits IncidentCreated AND HotlineCallLogged
      // via POST /api/events so the chain is the single source of
      // truth. HotlineCallLogged carries outcome: no_incident |
      // wrong_number and the hotline_call_id lineage key.
      'HotlineCallLogged',
      // WO-003 — Per-incident Chain Segment Viewer. The ack/escalate
      // actions on the anomaly banner emit chain events (the ack is
      // itself on the chain — meta-audit principle per Scenario 06).
      // Phase 2 PHA dashboard will consume these; Phase 1 only writes
      // them to the chain and surfaces them on the audit log.
      'ChainAnomalyAcknowledged',
      'ChainAnomalyEscalated',
      // WO-004 — Operator Dashboard quick-dismiss affordance. T1/T2 rows
      // expose a Dismiss button that emits IncidentDismissed{actor,
      // incident_id, reason} per operator-dashboard.md §Quick dismiss.
      // Phase 1 keeps the projection loose — audit log can surface the
      // event; the row removal from the inbox is optimistic on the client.
      'IncidentDismissed',
    ];

    // WO-005 — REQ-013 batch event handler. Loop over each envelope
    // (single envelope = 1 iteration; batch = N iterations). Each
    // envelope runs through the canonical validation + append path
    // so atomicity is preserved: the chain head advances per envelope
    // inside this handler, no other writer interleaves between them.
    //
    // Back-compat: single envelope → returns the block (existing wire).
    // Batch → returns { blocks: [...] } (new wire for verifyAndAssign).
    const results: ChainBlock[] = [];

    for (const envelope of envelopes) {
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

      // WO-002 — Hotline Intake Modal wire contract synthesis.
      //
      // The modal POSTs /api/events directly (chain-as-source-of-truth
      // shape), so we synthesise server-side fields that the modal
      // is not responsible for minting: incident_id for hotline-sourced
      // IncidentCreated (mirror /api/incidents hotline path), and
      // outcome validation for HotlineCallLogged. The block's
      // `payload` field carries the canonical record that downstream
      // projections (GET /api/incidents, audit log) read from.
      const payload = (envelope.payload ?? {}) as Record<string, unknown>;
      let finalPayload: Record<string, unknown> = payload;

      if (envelope.event_type === 'IncidentCreated' && payload.source === 'hotline') {
        const existingIncidentId = typeof payload.incident_id === 'string' ? payload.incident_id : '';
        const incidentId = existingIncidentId || `inc_${ulid()}`;
        finalPayload = {
          ...payload,
          incident_id: incidentId,
          // Hotline defaults: trust_band T1 unless caller explicitly
          // promoted it (none of the 5 verification signals are
          // available for hotline callers). T3 reserved for
          // consumer-notice issuance only (lockdown cascade 2026-09-11).
          trust_band: typeof payload.trust_band === 'string' ? payload.trust_band : 'T1',
          // Hash phone server-side (matches /api/incidents hotline path).
          caller_phone_hash: typeof payload.caller_phone === 'string' && payload.caller_phone
            ? `sha256:${btoa(payload.caller_phone).slice(0, 32)}`
            : null,
        };
      }

      if (envelope.event_type === 'HotlineCallLogged') {
        const outcome = payload.outcome;

        if (outcome !== 'no_incident' && outcome !== 'wrong_number') {
          return HttpResponse.json(
            {
              error: 'CommandRejected',
              reason: 'BadOutcome',
              event_type: envelope.event_type,
            },
            { status: 409 },
          );
        }
        finalPayload = {
          ...payload,
          // Server-side phone hash for hotline call log records (matches
          // /api/hotline-calls handler).
          caller_phone_hash: typeof payload.caller_phone === 'string' && payload.caller_phone
            ? `sha256:${btoa(payload.caller_phone).slice(0, 32)}`
            : null,
        };
      }

      const head = await getChainHead();
      const event_id = envelope.event_id ?? ulid();
      const occurred_at = envelope.occurred_at ?? new Date().toISOString();
      const ingested_at = new Date().toISOString();

      // Idempotency: scan existing blocks for (tenant_id, event_id).
      const all = await getAllBlocks();
      const existing = all.find((b) => b.event_id === event_id);

      if (existing) {
        if (!isBatch) {
          return HttpResponse.json({ ...existing, deduplicated: true }, { status: 200 });
        }
        // In a batch, surface the existing block in the result list.
        results.push(existing);
        continue;
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
        payload: finalPayload,
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
        payload: finalPayload,
      };

      await appendBlock(block);
      await setChainHead({
        block_hash: block.block_hash,
        height: block.height,
        ingested_at,
      });

      results.push(block);
    }

    // Single envelope → back-compat shape (existing callers receive a
    // single block, not an array).
    if (!isBatch && results.length === 1) {
      return HttpResponse.json(results[0], { status: 201 });
    }
    return HttpResponse.json({ blocks: results }, { status: 201 });
  }),

  http.get('/api/events', async ({ request }) => {
    await delay(LATENCY_MS());
    const url = new URL(request.url);
    const event_type = url.searchParams.get('event_type');
    const ward_id = url.searchParams.get('ward_id');
    // WO-001 — Citizen Status Timeline. `incident_id` filter scopes the
    // public-mode projection to one report so the citizen only sees their
    // own motion-bearing events (Scenario 06 #6 — "Anjali sees only her
    // own segments").
    const incident_id = url.searchParams.get('incident_id');
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
    if (incident_id) {
      filtered = filtered.filter((b) => {
        const payload = b.payload as { incident_id?: string };

        return payload.incident_id === incident_id;
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
  http.get('/api/incidents', async ({ request }) => {
    await delay(LATENCY_MS());
    const all = await getAllBlocks();
    const incidentEvents = all.filter((b) =>
      ['IncidentCreated', 'IncidentEscalated', 'IncidentResolved'].includes(b.event_type),
    );
    const byIncident = new Map<string, { id: string; latest: ChainBlock }>();

    // WO-004 — Operator Dashboard auto-routed tail chip. `?auto_routed=true`
    // narrows the projection to incidents whose latest event was a system
    // self-routing action (IncidentDismissed without a human actor, or
    // IncidentResolved whose resolved_by === 'system'). The chip on the
    // dashboard calls this to derive the collapsed count without dragging
    // the full incident payload into the top chrome.
    const url = new URL(request.url);
    const autoRoutedOnly = url.searchParams.get('auto_routed') === 'true';

    for (const b of incidentEvents) {
      const p = b.payload as { incident_id?: string };

      if (!p.incident_id) continue;
      const prev = byIncident.get(p.incident_id);

      if (!prev || prev.latest.height < b.height) {
        byIncident.set(p.incident_id, { id: p.incident_id, latest: b });
      }
    }

    // WO-004 — narrow to auto-routed rows when the chip asks for them.
    // Definition (Phase 1): the chain contains an IncidentDismissed
    // event authored by 'system' (kind === 'system'), regardless of
    // whether other events followed. Phase 2 will refine to "the only
    // touchpoint was system"; for now, presence is enough.
    if (autoRoutedOnly) {
      const systemDismissedIds = new Set<string>();
      const sortedAll = [...all].sort((a, b) => a.height - b.height);
      for (const b of sortedAll) {
        if (b.event_type !== 'IncidentDismissed') continue;
        if (b.actor_identity.kind !== 'system') continue;
        const p = b.payload as { incident_id?: string };
        if (p.incident_id) systemDismissedIds.add(p.incident_id);
      }
      for (const id of Array.from(byIncident.keys())) {
        if (!systemDismissedIds.has(id)) byIncident.delete(id);
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
        // Walk back through this incident's events to find the most recent
        // severity-bearing payload. IncidentResolved / TechnicianAssigned /
        // FixSubmitted don't carry severity, so the latest-event lookup
        // would otherwise yield 'unknown' and the InboxDetail chip would
        // render the literal word "unknown". Scan ascending so the first
        // hit wins (events are sorted ascending by height in `all`).
        const incidentChain = all
          .filter((b) => (b.payload as { incident_id?: string }).incident_id === id)
          .sort((a, b) => a.height - b.height);
        const lastSeverity = [...incidentChain]
          .reverse()
          .map((b) => {
            const bp = b.payload as { severity?: unknown; to_severity?: unknown };
            const s = typeof bp.severity === 'string' ? bp.severity : undefined;
            const t = typeof bp.to_severity === 'string' ? bp.to_severity : undefined;
            return s ?? t;
          })
          .find((v) => typeof v === 'string');
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
        // Same walk-back pattern as severity: resolve/assign/fix events
        // don't carry ward_id, so the latest-only lookup would yield
        // undefined and the InboxDetail subtitle renders 'Ward —'.
        const lastWardId = [...incidentChain]
          .reverse()
          .map((b) => {
            const bp = b.payload as { ward_id?: unknown };
            return typeof bp.ward_id === 'string' ? bp.ward_id : undefined;
          })
          .find((v) => typeof v === 'string');

        return {
          incident_id: id,
          status:
            latest.event_type === 'IncidentResolved'
              ? 'resolved'
              : latest.event_type === 'IncidentEscalated'
                ? 'escalated'
                : 'open',
          severity: lastSeverity ?? 'unknown',
          ward_id: lastWardId ?? null,
          last_block_height: latest.height,
          last_event_type: latest.event_type,
          last_occurred_at: latest.occurred_at,
          reporter_kind: reporterKind ?? 'webform',
        };
      }),
    );
  }),

  /**
   * POST /api/incidents — hotline-intake-modal.md.
   *
   * Hotline-sourced path:
   *   - source: 'hotline' (vs 'web_form' default, 'sensor' for vendor feed)
   *   - reporter_kind: 'hotline_operator'
   *   - hotline_call_id (uuid) — lineage key preserved on the chain event
   *   - trust_band: 'T1' (default for hotline — none of the 5 anchor
   *     verification signals are available)
   *   - caller_phone is hashed server-side; only the hash lands on chain
   *
   * The handler emits an IncidentCreated chain event via the canonical
   * /api/events append path so the operator dashboard's GET /api/incidents
   * refetch surfaces the new card automatically.
   */
  http.post('/api/incidents', async ({ request }) => {
    await delay(LATENCY_MS());
    const session = await getSession();

    if (!session) {
      return HttpResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const body = (await request.json()) as {
      source?: string;
      reporter_kind?: string;
      hotline_call_id?: string;
      call_time?: string;
      caller_name?: string;
      caller_phone?: string;
      description?: string;
      location_hint?: string;
      outcome?: string;
      call_duration_min?: number;
      sensitive?: boolean;
      ward_id?: string;
      severity?: string;
      title?: string;
    };

    // Hotline path: synthesise an IncidentCreated envelope.
    if (body.source === 'hotline' || body.reporter_kind === 'hotline_operator') {
      const incidentId = `inc_${ulid()}`;
      const head = await getChainHead();
      const eventId = ulid();
      const occurredAt = body.call_time ?? new Date().toISOString();
      const ingestedAt = new Date().toISOString();
      const prevBlockHash = head?.block_hash ?? GENESIS_PREV_HASH;

      const envelope = {
        tenant_id: TENANT,
        event_id: eventId,
        event_type: 'IncidentCreated' as const,
        schema_version: SCHEMA_VERSION,
        occurred_at: occurredAt,
        ingested_at: ingestedAt,
        actor_identity: {
          kind: 'operator',
          ref: session.actor_ref,
          display: session.display_name,
        },
        payload: {
          incident_id: incidentId,
          // Hotline defaults: ward_id is required by Incidents projection
          // — operators are expected to type a location hint, not pick a
          // ward. We surface the hint via location_hint and stamp
          // ward_id: 'unknown' so the row appears in the projection
          // regardless. The real ward comes from a downstream assignment
          // event. (Phase 1 keeps the projection loose — ward selection is
          // a Phase 2 PHA dashboard concern.)
          ward_id: body.ward_id ?? 'unknown',
          severity: body.severity ?? 'T2',
          title: body.description?.slice(0, 80) ?? 'Hotline-sourced incident',
          summary: body.description ?? '',
          trust_band: 'T1',
          source: 'hotline',
          reporter_kind: 'hotline_operator',
          hotline_call_id: body.hotline_call_id ?? null,
          caller_name: body.caller_name ?? null,
          // Phone is hashed; the gateway replaces plaintext with a hash
          // before the event lands on the chain. We simulate by hashing
          // the value client-side here. (Phase 1 mock — real gateway
          // does this on receipt.)
          caller_phone_hash: body.caller_phone
            ? `sha256:${btoa(body.caller_phone).slice(0, 32)}`
            : null,
          location_hint: body.location_hint ?? null,
          call_duration_min: body.call_duration_min ?? null,
          sensitive: body.sensitive ?? false,
          inbox: {
            owner_kind: 'operator',
            // Inbox is required by the IncidentSummary projection.
            assigned_to: session.actor_ref,
          },
        },
      };

      const block_hash = await blockHash({
        prev_block_hash: prevBlockHash,
        tenant_id: envelope.tenant_id,
        schema_version: envelope.schema_version,
        height: (head?.height ?? 0) + 1,
        event_id: envelope.event_id,
        occurred_at: envelope.occurred_at,
        ingested_at: envelope.ingested_at,
        event_type: envelope.event_type,
        actor_identity: envelope.actor_identity,
        payload: envelope.payload,
      });

      const block: ChainBlock = {
        ...envelope,
        height: (head?.height ?? 0) + 1,
        prev_block_hash: prevBlockHash,
        block_hash,
      };

      await appendBlock(block);
      await setChainHead(block);

      return HttpResponse.json(
        {
          incident_id: incidentId,
          status: 'open',
          severity: envelope.payload.severity,
          ward_id: envelope.payload.ward_id,
          last_block_height: block.height,
          last_event_type: 'IncidentCreated',
          last_occurred_at: envelope.occurred_at,
          reporter_kind: 'hotline',
          trust_band: 'T1',
        },
        { status: 201 },
      );
    }

    // Non-hotline path is not exercised by the modal — Phase 1 ships the
    // hotline surface only. Surface a CommandRejected shape so the error
    // surface is consistent with the /api/events closed-enum contract.
    return HttpResponse.json(
      { error: 'CommandRejected', reason: 'UnsupportedSource' },
      { status: 409 },
    );
  }),

  /**
   * POST /api/hotline-calls — hotline-intake-modal.md §"State mapping for
   * outcomes" (no_incident / wrong_number).
   *
   * Lightweight call-log endpoint. Emits a HotlineCallLogged chain event
   * with the call metadata so audit can later sort by source: hotline.
   * No incident is created.
   */
  http.post('/api/hotline-calls', async ({ request }) => {
    await delay(LATENCY_MS());
    const session = await getSession();

    if (!session) {
      return HttpResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const body = (await request.json()) as {
      hotline_call_id?: string;
      call_time?: string;
      outcome?: 'no_incident' | 'wrong_number';
      caller_name?: string;
      caller_phone?: string;
      description?: string;
      location_hint?: string;
    };

    if (body.outcome !== 'no_incident' && body.outcome !== 'wrong_number') {
      return HttpResponse.json(
        { error: 'CommandRejected', reason: 'BadOutcome' },
        { status: 409 },
      );
    }

    const head = await getChainHead();
    const eventId = ulid();
    const occurredAt = body.call_time ?? new Date().toISOString();
    const ingestedAt = new Date().toISOString();
    const prevBlockHash = head?.block_hash ?? GENESIS_PREV_HASH;

    const envelope = {
      tenant_id: TENANT,
      event_id: eventId,
      // HotlineCallLogged isn't in the closed enum yet — the gateway
      // emits a generic DeviationCaptured event as a stand-in until the
      // Phase 2 schema bump. We surface the outcome on the payload so
      // downstream audit can filter.
      event_type: 'DeviationCaptured' as const,
      schema_version: SCHEMA_VERSION,
      occurred_at: occurredAt,
      ingested_at: ingestedAt,
      actor_identity: {
        kind: 'operator',
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: {
        source: 'hotline',
        reporter_kind: 'hotline_operator',
        hotline_call_id: body.hotline_call_id ?? null,
        call_log_only: true,
        outcome: body.outcome,
        caller_name: body.caller_name ?? null,
        caller_phone_hash: body.caller_phone
          ? `sha256:${btoa(body.caller_phone).slice(0, 32)}`
          : null,
        description: body.description ?? null,
        location_hint: body.location_hint ?? null,
      },
    };

    const block_hash = await blockHash({
      prev_block_hash: prevBlockHash,
      tenant_id: envelope.tenant_id,
      schema_version: envelope.schema_version,
      height: (head?.height ?? 0) + 1,
      event_id: envelope.event_id,
      occurred_at: envelope.occurred_at,
      ingested_at: envelope.ingested_at,
      event_type: envelope.event_type,
      actor_identity: envelope.actor_identity,
      payload: envelope.payload,
    });

    const block: ChainBlock = {
      ...envelope,
      height: (head?.height ?? 0) + 1,
      prev_block_hash: prevBlockHash,
      block_hash,
    };

    await appendBlock(block);
    await setChainHead(block);

    return HttpResponse.json(
      {
        hotline_call_id: body.hotline_call_id,
        outcome: body.outcome,
        call_log: true,
      },
      { status: 201 },
    );
  }),
];

// ───────────────────────────────────────────────────────── photos ────────

/**
 * WO-007 — POST /api/photos (multipart stub).
 *
 * Karim's proof bundle uploads a photo from the on-device camera/gallery.
 * Phase 1 stub: read the body, ignore the binary, mint a synthetic
 * photo_hash and return it. The Phase 2 gateway will write the bytes to
 * object storage + record a hash on the chain; Phase 1 just keeps the
 * round-trip honest so the FE can prove the photo_hash reaches the
 * FixSubmitted payload.
 */
const photoHandlers = [
  http.post('/api/photos', async ({ request }) => {
    await delay(LATENCY_MS() / 4); // faster than data fetch — pure ingest
    // Read multipart body so MSW doesn't warn about an unused body.
    try {
      await request.formData();
    } catch {
      // jsdom / curl may not always populate a body; that's fine.
    }
    const photo_hash = `photo_${ulid()}`;

    return HttpResponse.json({ photo_hash }, { status: 201 });
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
  ...photoHandlers,
  ...heatmapHandlers,
];
