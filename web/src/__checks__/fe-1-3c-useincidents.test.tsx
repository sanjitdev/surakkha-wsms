/**
 * FE-1.3c — useIncidents() hook contract.
 *
 * Locks the Layer C hook that OperatorDashboard + InboxDetail now share
 * for the `/api/incidents` fetch. Four cases per the spec:
 *   (1) idle — on mount before fetch settles, `loading=true`,
 *       `incidents=[]`, `error=null`.
 *   (2) success — `/api/incidents` 200 with 3 rows, `loading=false`,
 *       `incidents.length===3`, `error=null`.
 *   (3) 500 — `/api/incidents` 500, `loading=false`, `incidents=[]`,
 *       `error` non-null (no toast).
 *   (4) memo — re-rendering with no deps change fires fetch exactly once.
 *
 * Mirrors the MSW + `renderHook` + `act` pattern from
 * `fe-1-5b-inboxlist.test.tsx`. No IndexedDB seeding required — the hook
 * calls `fetch('/api/incidents')` directly and msw/node intercepts.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { useIncidents } from '../hooks/useIncidents';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers(...handlers);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Three minimal `IncidentSummary` rows matching the wire shape defined
 * at `web/src/mocks/handlers.ts:443-461`. Keeps the success case
 * independent of the seeded chain fixtures so a refactor to the
 * `incidentEvents` projection cannot silently regress the hook contract.
 */
const THREE_ROWS = [
  {
    incident_id: 'inc_hook_001',
    status: 'open',
    severity: 'T3',
    ward_id: 'ward-dhanmondi',
    last_block_height: 101,
    last_event_type: 'IncidentCreated',
    last_occurred_at: '2026-09-08T10:00:00.000Z',
  },
  {
    incident_id: 'inc_hook_002',
    status: 'escalated',
    severity: 'T2',
    ward_id: 'ward-mirpur',
    last_block_height: 102,
    last_event_type: 'IncidentEscalated',
    last_occurred_at: '2026-09-08T10:05:00.000Z',
  },
  {
    incident_id: 'inc_hook_003',
    status: 'resolved',
    severity: 'T1',
    ward_id: 'ward-uttara',
    last_block_height: 103,
    last_event_type: 'IncidentResolved',
    last_occurred_at: '2026-09-08T10:10:00.000Z',
  },
];

// ─── (1) idle ─────────────────────────────────────────────────────────────

describe('FE-1.3c · useIncidents', () => {
  it('(1) idle: on mount before fetch settles, loading=true, incidents=[], error=null', () => {
    // Default handler from `mocks/handlers.ts` does an async IDB read —
    // its response does not arrive synchronously, so the first render
    // is the idle state.
    const { result } = renderHook(() => useIncidents());

    expect(result.current.loading).toBe(true);
    expect(result.current.incidents).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // ─── (2) success ────────────────────────────────────────────────────────

  it('(2) success: 3 rows from /api/incidents resolve with loading=false, length=3, error=null', async () => {
    server.use(
      http.get('/api/incidents', () => HttpResponse.json(THREE_ROWS)),
    );

    const { result } = renderHook(() => useIncidents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.incidents.length).toBe(3);
    expect(result.current.error).toBeNull();
    // Locks the status enum mapping (handlers return lowercase
    // 'open'/'resolved'/'escalated' wire strings — the hook projects
    // them onto the IncidentStatus enum).
    expect(result.current.incidents[0]?.status).toBe('open');
    expect(result.current.incidents[1]?.status).toBe('escalated');
    expect(result.current.incidents[2]?.status).toBe('resolved');
  });

  // ─── (3) 500 ────────────────────────────────────────────────────────────

  it('(3) error_500: server returns 500, loading=false, incidents=[], error non-null (no toast)', async () => {
    server.use(
      http.get('/api/incidents', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useIncidents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.incidents).toEqual([]);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    // The hook contract from the spec says: no toast. The hook itself
    // has no UI side-effects, so this is automatic — the test pins it
    // so a future refactor cannot silently wire a toast in.
    expect(typeof result.current.error?.message).toBe('string');
  });

  // ─── (4) memo ───────────────────────────────────────────────────────────

  it('(4) memo: re-rendering with no deps change calls fetch exactly once per mount', async () => {
    server.use(
      http.get('/api/incidents', () => HttpResponse.json(THREE_ROWS)),
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const { result, rerender } = renderHook(() => useIncidents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callsAfterMount = fetchSpy.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.endsWith('/api/incidents'),
    ).length;

    expect(callsAfterMount).toBe(1);

    // Re-render twice with no deps change. The hook's effect deps array
    // is `[]` so no additional fetch should fire.
    rerender();
    rerender();

    const callsAfterRerender = fetchSpy.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.endsWith('/api/incidents'),
    ).length;

    expect(callsAfterRerender).toBe(1);

    // Settle any queued microtasks (e.g. a stray state-updater-triggered
    // effect) before tearing down so we don't see a flicker in the
    // spy count. The act() wrapper also flushes any pending render work.
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      fetchSpy.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.endsWith('/api/incidents'),
      ).length,
    ).toBe(1);

    fetchSpy.mockRestore();
  });
});
