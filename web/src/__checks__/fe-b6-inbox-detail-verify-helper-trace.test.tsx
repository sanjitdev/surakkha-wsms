/**
 * fe-b6-inbox-detail-verify-helper-trace.test.tsx — REQ-010.
 *
 * Pins inbox-detail.md §"Single-click verification reuses chain-verify
 * helper" + tech-audit §7: the per-row Verify button on InboxDetail
 * MUST call into `verifyBlockHash()` from `web/src/lib/chain-verify.ts`
 * (never copy-pasted), and the helper MUST never throw — failures
 * resolve to a typed `VerifyState.fail` rather than propagating.
 *
 * Asserts:
 *   1) InboxDetail imports `verifyBlockHash` from `../lib/chain-verify`
 *      (import trace via module spy).
 *   2) Clicking a row Verify button fires the helper exactly once with
 *      the row's block_hash; the page never throws (network failure
 *      resolves to the typed fail badge).
 *   3) The helper itself never throws — verified by directly invoking
 *      `verifyBlockHash` against a 500 / abort path (mirrors the
 *      chain-segment REQ-002 helper contract; both surfaces share the
 *      same helper, so a single typed-fail guarantee propagates).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InboxDetail } from '../pages/InboxDetail';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
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
  { incident_id: 'inc_test_001', severity: 'T2', ward_id: 'W04', status: 'open', last_block_height: 12, last_event_type: 'IncidentCreated' },
];

vi.mock('../hooks/useIncidents', () => {
  return {
    useIncidents: () => ({
      incidents: incidentsFixture,
      loading: false,
      error: null,
    }),
  };
});

const chainEventsFixture = [
  {
    event_id: 'ev-1',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-15T12:00:00Z',
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: { incident_id: 'inc_test_001', ward_id: 'W04' },
    block_hash: 'helper-trace-hash-001',
    height: 12,
  },
];

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';

    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: chainEventsFixture }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (u.includes('/api/chain/verify')) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
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

function renderInboxDetail() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={['/inbox/inc_test_001']}
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
                <Route path="/inbox/:id" element={<InboxDetail />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('FE-B6 InboxDetail verify-helper trace (REQ-010)', () => {
  // (1) Import trace — InboxDetail imports verifyBlockHash from
  // ../lib/chain-verify (single source of truth). The static module
  // surface is checked at file-read time; the assertion below is a
  // belt-and-braces guard against accidental re-implementation.
  it('InboxDetail.tsx imports verifyBlockHash from the chain-verify helper', async () => {
    // Read the source file synchronously to assert the import is
    // present. This catches regressions where someone copy-pastes a
    // verify function into the page rather than reusing the helper.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const srcPath = path.join(
      process.cwd(),
      'src',
      'pages',
      'InboxDetail.tsx',
    );
    const src = fs.readFileSync(srcPath, 'utf8');

    expect(src).toMatch(
      /import\s*\{[^}]*verifyBlockHash[^}]*\}\s*from\s*['"]\.\.\/lib\/chain-verify['"]/,
    );
  });

  // (2) Click fires the helper (which posts to /api/chain/verify).
  it('clicking Verify invokes the chain-verify helper via /api/chain/verify', async () => {
    let verifyCalls: Array<{ url: string; body: unknown }> = [];

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = typeof input === 'string' ? input : input.toString();

      if (u.includes('/api/chain/verify')) {
        try {
          verifyCalls.push({ url: u, body: JSON.parse(String(init?.body)) });
        } catch {
          verifyCalls.push({ url: u, body: null });
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (u.startsWith('/api/events')) {
        return new Response(JSON.stringify({ events: chainEventsFixture }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    }) as typeof global.fetch;

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('inbox-verify-btn-ev-1'));
    await waitFor(() => {
      expect(screen.getByTestId('inbox-verify-ev-1')).toBeTruthy();
    });

    // Helper invoked exactly once for this row, with the row's block_hash.
    expect(verifyCalls.length).toBe(1);
    expect(verifyCalls[0].url).toContain('/api/chain/verify');
    const body = verifyCalls[0].body as { block_hash: string };

    expect(body.block_hash).toBe('helper-trace-hash-001');
  });

  // (3) Helper itself never throws — direct invocation against a
  // network failure surfaces a typed VerifyState.fail, never rejects.
  it('verifyBlockHash helper never throws on network failure (REQ-010 contract)', async () => {
    global.fetch = vi.fn(async () => new Response('{}', { status: 500 })) as typeof global.fetch;

    // Import the helper directly to exercise the wire contract
    // end-to-end without going through the React tree.
    const { verifyBlockHash } = await import('../lib/chain-verify');

    const result = await verifyBlockHash('any-hash');

    expect(result.status).toBe('fail');
    if (result.status === 'fail') {
      expect(result.reason).toBe('network');
    }
  });

  // (3b) Helper never throws on timeout — mirrors the chain-segment
  // REQ-002 contract so a single typed-fail guarantee propagates.
  it('verifyBlockHash helper never throws on abort (timeout path)', async () => {
    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      // Reject the AbortSignal trip like the real fetch does on timeout.
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          (err as Error & { name: string }).name = 'AbortError';
          reject(err);
        });
      });
    }) as typeof global.fetch;

    const { verifyBlockHash } = await import('../lib/chain-verify');

    const result = await verifyBlockHash('any-hash');

    expect(result.status).toBe('fail');
    if (result.status === 'fail') {
      expect(result.reason).toBe('timeout');
    }
  });
});
