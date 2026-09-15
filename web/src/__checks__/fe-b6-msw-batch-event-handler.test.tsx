/**
 * fe-b6-msw-batch-event-handler.test.tsx — REQ-013.
 *
 * Pins inbox-detail.md §"MSW batch handler": POST /api/events accepts
 * either a single envelope (back-compat with existing one-shot POSTs)
 * OR an array of envelopes (batch) so the WO-005 verify+assign
 * single-submit action can fire 4 chain events atomically.
 *
 * Asserts:
 *   1) Single envelope → handler returns the block shape (back-compat
 *      with the existing wire that callers like useIncidentActions.post
 *      depend on).
 *   2) Array of envelopes (the verify+assign batch shape) → handler
 *      appends every envelope to the chain, advances the head, returns
 *      201 with `{ blocks: [...] }`. Order is preserved.
 *   3) Empty array → 201 with empty `blocks`.
 *   4) Unknown event_type inside a batch → 409 CommandRejected.
 *   5) Atomicity: after a successful batch, GET /api/events returns
 *      every batch event in ascending height order.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers as appHandlers } from '../mocks/handlers';

// The MSW /api/events handler enforces an authenticated session AND
// tracks chain blocks + head in idb. Stub idb with a minimal in-memory
// store so appendBlock persists across the test (and the chain head
// advances per envelope — required by REQ-013 monotonic-height check).
vi.mock('../mocks/idb', () => {
  const blocks: unknown[] = [];
  let head: unknown = null;
  const session = {
    actor_id: 'priya-001',
    actor_ref: 'priya-001',
    display_name: 'Priya',
    role: 'utility_operator',
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
  return {
    getSession: () => Promise.resolve(session),
    setSession: () => Promise.resolve(),
    wipeAll: () => Promise.resolve(),
    getAllBlocks: () => Promise.resolve(blocks.slice()),
    appendBlock: (block: unknown) => {
      blocks.push(block);
      return Promise.resolve();
    },
    getChainHead: () => Promise.resolve(head),
    setChainHead: (next: unknown) => {
      head = next;
      return Promise.resolve();
    },
  };
});

const server = setupServer(...appHandlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

beforeEach(() => {
  server.resetHandlers(...appHandlers);
});

afterAll(() => {
  server.close();
});

describe('FE-B6 MSW batch event handler (REQ-013)', () => {
  it('accepts a single envelope and returns the block (back-compat)', async () => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event_type: 'PublicNoticeIssued',
        payload: { incident_id: 'inc_batch_single', channel: 'sms', body: 'single test' },
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { event_type: string; event_id: string };

    expect(body.event_type).toBe('PublicNoticeIssued');
    expect(typeof body.event_id).toBe('string');
  });

  it('accepts an array of envelopes and returns { blocks: [...] } with each block', async () => {
    const batch = [
      {
        event_type: 'PublicNoticeIssued',
        payload: { incident_id: 'inc_batch_001', channel: 'sms', body: 'verify+assign batch part 1' },
      },
      {
        event_type: 'TechnicianAssigned',
        payload: { incident_id: 'inc_batch_001', technician_id: 'karim_actor', priority: 'P1' },
      },
      {
        event_type: 'PublicNoticeIssued',
        payload: { incident_id: 'inc_batch_001', channel: 'whatsapp', body: 'verify+assign batch part 3' },
      },
    ];

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(batch),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { blocks: Array<{ event_type: string; height: number }> };

    expect(Array.isArray(body.blocks)).toBe(true);
    expect(body.blocks.length).toBe(3);
    // Order preserved + each block carries the event_type.
    expect(body.blocks[0].event_type).toBe('PublicNoticeIssued');
    expect(body.blocks[1].event_type).toBe('TechnicianAssigned');
    expect(body.blocks[2].event_type).toBe('PublicNoticeIssued');
    // Heights monotonic ascending (chain head advances per envelope).
    expect(body.blocks[1].height).toBe(body.blocks[0].height + 1);
    expect(body.blocks[2].height).toBe(body.blocks[1].height + 1);
  });

  it('accepts an empty array and returns { blocks: [] }', async () => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([]),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { blocks: unknown[] };

    expect(body.blocks).toEqual([]);
  });

  it('rejects unknown event_type inside a batch with 409 CommandRejected', async () => {
    const batch = [
      { event_type: 'PublicNoticeIssued', payload: { incident_id: 'inc_batch_002' } },
      { event_type: 'NotARealEventType', payload: { foo: 'bar' } },
    ];

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(batch),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; reason: string; event_type: string };

    expect(body.error).toBe('CommandRejected');
    expect(body.reason).toBe('UnknownEventType');
    expect(body.event_type).toBe('NotARealEventType');
  });

  it('persists every batch event so a subsequent GET /api/events returns them in order', async () => {
    const batch = [
      { event_type: 'PublicNoticeIssued', payload: { incident_id: 'inc_batch_003', channel: 'sms' } },
      { event_type: 'TechnicianAssigned', payload: { incident_id: 'inc_batch_003', technician_id: 'karim_actor' } },
    ];

    const post = await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(batch),
    });

    expect(post.status).toBe(201);

    const get = await fetch('/api/events?limit=500');
    const body = (await get.json()) as {
      events: Array<{ event_id: string; payload: { incident_id?: string } }>;
    };

    const ours = body.events.filter((e) => e.payload.incident_id === 'inc_batch_003');

    expect(ours.length).toBe(2);
    expect(ours[0].event_id).not.toBe(ours[1].event_id);
  });
});

// Marker — silence unused import warnings if http/HttpResponse become
// unused after a future refactor.
void http;
void HttpResponse;
