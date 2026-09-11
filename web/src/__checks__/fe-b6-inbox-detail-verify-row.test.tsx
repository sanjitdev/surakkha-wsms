/**
 * fe-b6-inbox-detail-verify-row.test.tsx — InboxDetail per-row verify.
 *
 * Pins inbox-detail.md #16: the right-rail chain-event timeline (now
 * right-rail per the pane swap from inbox-detail.md #6) carries a
 * per-row "Verify" button. Click recomputes the block hash via
 * /api/chain/verify and renders a typed badge within 200ms.
 *
 * Same surface contract as AuditLog.tsx audit-log.md #13 — the
 * operator's spot-check workflow is identical across surfaces.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { InboxDetail } from '../pages/InboxDetail';
import type { SessionRow } from '../mocks/idb';
import enJson from '../i18n/locales/en/inboxDetail.json';
import bnJson from '../i18n/locales/bn/inboxDetail.json';

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
    block_hash: 'abcdef1234567890',
    height: 12,
  },
  {
    event_id: 'ev-2',
    event_type: 'PublicNoticeIssued',
    occurred_at: '2024-01-15T12:05:00Z',
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: { incident_id: 'inc_test_001' },
    block_hash: 'fedcba0987654321',
    height: 13,
  },
];

function stubVerifyEndpoint(impl: (body: { block_hash: string }) => Promise<Response>) {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.includes('/api/chain/verify')) {
      // Match MSW contract: POST + JSON body { block_hash }.
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return impl(body);
    }
    if (url.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: chainEventsFixture }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof globalThis.fetch;

  return () => {
    globalThis.fetch = original;
  };
}

let restoreFetch: () => void = () => undefined;

beforeEach(() => {
  restoreFetch = stubVerifyEndpoint(async () => new Response('{}', { status: 500 }));
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreFetch();
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

describe('FE-B6 InboxDetail per-row verify (inbox-detail.md #16)', () => {
  it('renders one Verify button per timeline row', async () => {
    restoreFetch();
    restoreFetch = stubVerifyEndpoint(async () => new Response('{}', { status: 500 }));
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    expect(screen.getByTestId('inbox-verify-btn-ev-1')).toBeTruthy();
    expect(screen.getByTestId('inbox-verify-btn-ev-2')).toBeTruthy();
    // Idle state — no badges rendered yet.
    expect(screen.queryByTestId('inbox-verify-ev-1')).toBeNull();
  });

  it('clicking a Verify button renders the OK badge on success', async () => {
    restoreFetch();
    restoreFetch = stubVerifyEndpoint(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('inbox-verify-btn-ev-1'));

    await waitFor(() => {
      expect(screen.getByTestId('inbox-verify-ev-1')).toBeTruthy();
    });
    expect(screen.getByTestId('inbox-verify-ev-1').className).toContain('audit-verify--ok');
    // OK aria-label is spelled out.
    expect(screen.getByTestId('inbox-verify-ev-1').getAttribute('aria-label')).toBe(
      enJson.timeline.verifyOkAria,
    );
  });

  it('clicking a Verify button renders the fail badge on 404 (unknown_hash)', async () => {
    restoreFetch();
    restoreFetch = stubVerifyEndpoint(async () => {
      return new Response(JSON.stringify({ ok: false, reason: 'unknown_hash' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    });
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('inbox-verify-btn-ev-2'));

    await waitFor(() => {
      expect(screen.getByTestId('inbox-verify-ev-2')).toBeTruthy();
    });
    expect(screen.getByTestId('inbox-verify-ev-2').className).toContain('audit-verify--fail');
    expect(screen.getByTestId('inbox-verify-ev-2').getAttribute('aria-label')).toBe(
      enJson.timeline.verifyFail.unknown_hash.aria,
    );
  });

  it('en/bn key parity: timeline.verify* keys exist in both locales', () => {
    expect(enJson.timeline.verify).toBeTruthy();
    expect(bnJson.timeline.verify).toBeTruthy();
    expect(enJson.timeline.verifyOk).toBeTruthy();
    expect(bnJson.timeline.verifyOk).toBeTruthy();
    expect(enJson.timeline.verifyPending).toBeTruthy();
    expect(bnJson.timeline.verifyPending).toBeTruthy();
    expect(enJson.timeline.verifyFail.label).toBeTruthy();
    expect(bnJson.timeline.verifyFail.label).toBeTruthy();
    for (const k of ['unknown_hash', 'hash_mismatch', 'network', 'timeout']) {
      expect(enJson.timeline.verifyFail[k].title, `en.timeline.verifyFail.${k}.title`).toBeTruthy();
      expect(enJson.timeline.verifyFail[k].aria, `en.timeline.verifyFail.${k}.aria`).toBeTruthy();
      expect(bnJson.timeline.verifyFail[k].title, `bn.timeline.verifyFail.${k}.title`).toBeTruthy();
      expect(bnJson.timeline.verifyFail[k].aria, `bn.timeline.verifyFail.${k}.aria`).toBeTruthy();
    }
  });
});
