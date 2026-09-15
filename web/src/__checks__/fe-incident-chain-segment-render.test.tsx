/**
 * fe-incident-chain-segment-render.test.tsx — WO-003 per-incident-chain-segment.
 *
 * Companion to fe-b6-incident-chain-segment.test.tsx (which pins the
 * per-row verify + full-segment verify UX). This file covers the
 * *additional* REQs the spec wires up:
 *   - REQ-002 verifyChainSegment cache helper (60s TTL)
 *   - REQ-004 cache hit / cache miss behaviour
 *   - REQ-007 ChainRead emitted on mount exactly once
 *   - REQ-011 ChainAnomalyAcknowledged event lands on chain
 *
 * Plus cross-cutting coverage:
 *   - helper typed VerifyState (verifyBlockHash never throws)
 *   - public-mode projection lives on CitizenStatusTimeline (so this
 *     page is operator-mode only in Phase 1)
 *   - area-labels present (data-area-id) per foundation §13
 *
 * The earlier fe-b6 test continues to assert the per-row verify UX;
 * we deliberately don't duplicate those assertions here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { IncidentChainSegmentPage } from '../pages/IncidentChainSegmentPage';
import {
  clearSegmentVerifyCache,
  verifyBlockHash,
  verifyChainSegment,
} from '../lib/chain-verify';
import type { SessionRow } from '../mocks/idb';

function makeSession(): SessionRow {
  return {
    actor_id: 'priya-001',
    actor_ref: 'priya-001',
    display_name: 'Priya',
    role: 'utility_operator',
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

const incidentsFixture = [
  {
    incident_id: 'inc_chain_002',
    severity: 'T2',
    ward_id: 'W04',
    status: 'open',
    last_block_height: 12,
    last_event_type: 'IncidentCreated',
  },
];

vi.mock('../hooks/useIncidents', () => ({
  useIncidents: () => ({
    incidents: incidentsFixture,
    loading: false,
    error: null,
  }),
}));

// 4 events — three valid + one tampered. The tampered block_hash triggers
// the anomaly branch in verifyChainSegment.
const eventsFixture = [
  {
    event_id: 'evt_a01',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-01T00:00:00Z',
    actor_identity: { kind: 'reporter', ref: 'anjali', display: 'Anjali' },
    payload: { incident_id: 'inc_chain_002' },
    block_hash: '01HVALID00000000000000A01',
    height: 10,
  },
  {
    event_id: 'evt_a02',
    event_type: 'TechnicianAssigned',
    occurred_at: '2024-01-01T00:30:00Z',
    actor_identity: { kind: 'operator', ref: 'priya', display: 'Priya' },
    payload: { incident_id: 'inc_chain_002' },
    block_hash: '01HVALID00000000000000A02',
    height: 11,
  },
  {
    event_id: 'evt_a03',
    event_type: 'TechnicianArrived',
    occurred_at: '2024-01-01T01:00:00Z',
    actor_identity: { kind: 'field_tech', ref: 'karim', display: 'Karim' },
    payload: { incident_id: 'inc_chain_002' },
    block_hash: '01HVALID00000000000000A03',
    height: 12,
  },
  {
    event_id: 'evt_a04',
    event_type: 'DiagnosisSubmitted',
    occurred_at: '2024-01-01T01:30:00Z',
    actor_identity: { kind: 'field_tech', ref: 'karim', display: 'Karim' },
    payload: { incident_id: 'inc_chain_002' },
    // TAMPERED — server returns ok:false for this hash
    block_hash: '01HTAMPEREDHASHMISMATCH9',
    height: 13,
  },
];

let verifyResponses = new Map<string, { ok: boolean; status: number }>();
let eventEmissions: Array<Record<string, unknown>> = [];
const originalFetch = global.fetch;

beforeEach(() => {
  clearSegmentVerifyCache();
  verifyResponses = new Map([
    ['01HVALID00000000000000A01', { ok: true, status: 200 }],
    ['01HVALID00000000000000A02', { ok: true, status: 200 }],
    ['01HVALID00000000000000A03', { ok: true, status: 200 }],
    ['01HTAMPEREDHASHMISMATCH9', { ok: false, status: 200 }],
  ]);
  eventEmissions = [];

  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
    const method = (init?.method ?? 'GET').toUpperCase();
    if (u.startsWith('/api/events') && method === 'GET') {
      return new Response(JSON.stringify({ events: eventsFixture }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (u === '/api/chain/verify' && method === 'POST') {
      const body = JSON.parse(String(init?.body ?? '{}')) as { block_hash: string };
      const r = verifyResponses.get(body.block_hash) ?? { ok: false, status: 404 };
      return new Response(JSON.stringify({ ok: r.ok }), {
        status: r.status,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (u === '/api/events' && method === 'POST') {
      const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      eventEmissions.push(body);
      return new Response(JSON.stringify({ ok: true, event_id: 'mock' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof global.fetch;
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  void i18n.changeLanguage('en');
});

function renderChainSegment() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            initialEntries={['/incidents/inc_chain_002/chain']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <AppLayoutContext.Provider
              value={{
                session: makeSession(),
                chainHead: null,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <Routes>
                <Route path="/incidents/:incident_id/chain" element={<IncidentChainSegmentPage />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-003 IncidentChainSegmentPage — extended REQs', () => {
  // ──────────────────────────────────────────── REQ-007 ChainRead on mount
  it('emits ChainRead exactly once on mount (REQ-007)', async () => {
    renderChainSegment();
    await waitFor(() => {
      expect(screen.getByTestId('chain-segment-title')).toBeTruthy();
    });
    // Wait for the effect to flush.
    await new Promise((r) => setTimeout(r, 50));
    const chainReads = eventEmissions.filter((e) => e.event_type === 'ChainRead');
    expect(chainReads.length).toBe(1);
    expect(chainReads[0]).toMatchObject({
      event_type: 'ChainRead',
      payload: { incident_id: 'inc_chain_002', filter_combo: ['all'] },
    });
  });

  // ─────────────────────────────── REQ-004 cache-backed verifyChainSegment
  it('verifyChainSegment returns verified when all hashes match', async () => {
    const cleanEvents = eventsFixture.filter((e) => e.block_hash !== '01HTAMPEREDHASHMISMATCH9');
    const result = await verifyChainSegment('inc_chain_002', 13, cleanEvents);
    expect(result.status).toBe('verified');
    if (result.status === 'verified') {
      expect(result.finalHash).toBe('01HVALID00000000000000A03');
      expect(result.recomputedHashes).toHaveLength(3);
    }
  });

  it('verifyChainSegment returns anomaly when any hash mismatches', async () => {
    const result = await verifyChainSegment('inc_chain_002', 13, eventsFixture);
    expect(result.status).toBe('anomaly');
    if (result.status === 'anomaly') {
      expect(result.anomalyAtSeq).toBe(13);
      expect(result.actualHash).toBe('01HTAMPEREDHASHMISMATCH9');
    }
  });

  it('verifyChainSegment returns unknown when a block is missing on the wire', async () => {
    // target_seq must be ≥ event.height for the walk to actually run.
    const result = await verifyChainSegment('inc_chain_002', 14, [
      {
        event_id: 'evt_missing',
        event_type: 'X',
        occurred_at: '2024-01-01T00:00:00Z',
        payload: {},
        block_hash: '01HNEVERSEENBEFORE0000000',
        height: 14,
      },
    ]);
    expect(result.status).toBe('unknown');
  });

  it('verifyChainSegment returns empty for no events', async () => {
    const result = await verifyChainSegment('inc_chain_002', 13, []);
    expect(result.status).toBe('empty');
  });

  it('cache hit returns identical result on second call (REQ-004)', async () => {
    // First call: cache miss — populates cache.
    const first = await verifyChainSegment('inc_chain_002', 12, eventsFixture.slice(0, 3));
    expect(first.status).toBe('verified');

    // Force verifyBlockHash to fail on a hash that the cache should ignore.
    verifyResponses.set('01HVALID00000000000000A03', { ok: false, status: 500 });
    const second = await verifyChainSegment('inc_chain_002', 12, eventsFixture.slice(0, 3));
    // Cache hit returns the same verified result — proves the 60s TTL
    // is doing its job (no re-fetch, no fail on the new override).
    expect(second.status).toBe('verified');
    if (second.status === 'verified') {
      expect(second.finalHash).toBe(first.status === 'verified' ? first.finalHash : null);
    }
  });

  it('cache invalidates when last_event_hash changes (REQ-004 locked #9)', async () => {
    // Populate cache for hash A.
    const resultA = await verifyChainSegment('inc_chain_002', 13, eventsFixture);
    expect(resultA.status).toBe('anomaly');

    // Build a new segment whose last hash differs → cache miss → fresh walk.
    const altEvents = [
      ...eventsFixture.slice(0, 3),
      {
        ...eventsFixture[3],
        block_hash: '01HVALID00000000000000A04',
        height: 13,
      },
    ];
    verifyResponses.set('01HVALID00000000000000A04', { ok: true, status: 200 });
    const resultB = await verifyChainSegment('inc_chain_002', 13, altEvents);
    expect(resultB.status).toBe('verified');
  });

  // ────────────────────────────────────────── REQ-006 anomaly ack emission
  it('acknowledge emits ChainAnomalyAcknowledged (REQ-006 + REQ-011)', async () => {
    renderChainSegment();
    await waitFor(() => {
      expect(screen.getByTestId('chain-segment-verify-full')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('chain-segment-verify-full'));
    await waitFor(() => {
      expect(screen.getByTestId('chain-anomaly-banner')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('chain-anomaly-acknowledge'));
    await waitFor(() => {
      expect(screen.queryByTestId('chain-anomaly-banner')).toBeNull();
    });
    // Wait for emission to flush.
    await new Promise((r) => setTimeout(r, 50));
    const acks = eventEmissions.filter((e) => e.event_type === 'ChainAnomalyAcknowledged');
    expect(acks.length).toBe(1);
    expect(acks[0]).toMatchObject({
      event_type: 'ChainAnomalyAcknowledged',
      payload: { incident_id: 'inc_chain_002' },
    });
  });

  it('escalate button is disabled with Phase 2 tooltip (REQ-006)', async () => {
    renderChainSegment();
    await waitFor(() => {
      expect(screen.getByTestId('chain-segment-verify-full')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('chain-segment-verify-full'));
    await waitFor(() => {
      expect(screen.getByTestId('chain-anomaly-banner')).toBeTruthy();
    });
    const escalate = screen.getByTestId('chain-anomaly-escalate') as HTMLButtonElement;
    expect(escalate.disabled).toBe(true);
    expect((escalate.getAttribute('title') ?? '').toLowerCase()).toMatch(/phase 2/);
  });

  // ───────────────────────────────────── REQ-009 area-labels are present
  it('renders data-area-id for the page + timeline (REQ-009)', async () => {
    renderChainSegment();
    await waitFor(() => {
      expect(screen.getByTestId('chain-segment-timeline')).toBeTruthy();
    });
    expect(
      document.querySelector('[data-area-id="incident-chain-segment-page"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-area-id="incident-chain-segment-timeline"]'),
    ).toBeTruthy();
    // Per-row area-label
    expect(
      document
        .querySelector('[data-testid="chain-event-row-evt_a01"]')
        ?.getAttribute('data-area-id'),
    ).toBe('incident-chain-segment-event-row');
  });

  // ───────────────────────────────────── REQ-002 verifyBlockHash never throws
  it('verifyBlockHash never throws on network failure (REQ-002)', async () => {
    global.fetch = vi.fn(async () => {
      return new Response('boom', { status: 500 });
    }) as typeof global.fetch;
    const result = await verifyBlockHash('01HVALID00000000000000A01');
    expect(result.status).toBe('fail');
    if (result.status === 'fail') expect(result.reason).toBe('network');
  });

  it('verifyBlockHash never throws on timeout (REQ-002)', async () => {
    global.fetch = vi.fn(async (_input, init) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const e = new Error('aborted');
            e.name = 'AbortError';
            reject(e);
          });
        }
      });
    }) as unknown as typeof global.fetch;
    const result = await verifyBlockHash('01HVALID00000000000000A01');
    expect(result.status).toBe('fail');
    if (result.status === 'fail') expect(result.reason).toBe('timeout');
  });
});
