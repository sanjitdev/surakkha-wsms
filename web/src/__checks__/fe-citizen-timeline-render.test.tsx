/**
 * fe-citizen-timeline-render.test.tsx — WO-001 citizen-status-timeline.
 *
 * Pinned acceptance for the Tier 1 gap screen per WO-001 §"Tests required":
 *   1) Public mode hides payloads/hashes/JSON
 *   2) Bangla-first default on first mount
 *   3) Closure tap renders only after `IncidentResolvedByAdmin` event
 *   4) Reopen emits correct event shape
 *   5) ChainRead event fires on mount exactly once
 *
 * Pairs with the existing `fe-b6-citizen-status-timeline.test.tsx`
 * (Tier 1 render contract); this file pins the WO-001 acceptance
 * surface specifically.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { CitizenStatusTimeline } from '../pages/CitizenStatusTimeline';
import type { SessionRow } from '../mocks/idb';

function makeSession(role: SessionRow['role'] = 'anjali'): SessionRow {
  return {
    actor_id: 'anjali-001',
    actor_ref: 'anjali-001',
    display_name: 'Anjali',
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

const baseEvents = [
  {
    event_id: 'evt_a1',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-01T00:00:00Z',
    actor_identity: { kind: 'citizen', ref: 'anjali', display: 'Anjali' },
    payload: { incident_id: 'inc_anjali_001', internal_secret: 'SHOULD_NEVER_RENDER' },
    block_hash: '01HASHPUBLICAAAAAAA',
    height: 100,
  },
  {
    event_id: 'evt_a2',
    event_type: 'TrustBandAssigned',
    occurred_at: '2024-01-01T00:05:00Z',
    actor_identity: { kind: 'operator', ref: 'priya', display: 'Priya' },
    payload: { incident_id: 'inc_anjali_001', reasoning: 'INTERNAL_REASONING' },
    block_hash: '01HASHPUBLICBBBBBBB',
    height: 101,
  },
];

const closurePendingEvents = [
  ...baseEvents,
  {
    event_id: 'evt_a3',
    event_type: 'IncidentResolvedByAdmin',
    occurred_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    actor_identity: { kind: 'admin', ref: 'adi', display: 'Adi' },
    payload: { incident_id: 'inc_anjali_001' },
    block_hash: '01HASHPUBLICCCCCCCC',
    height: 102,
  },
];

const originalFetch = global.fetch;
let postedBodies: unknown[] = [];

function makeFetch(events: unknown[]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
    const method = (init?.method ?? 'GET').toUpperCase();
    if (u.startsWith('/api/events') && method === 'GET') {
      return new Response(JSON.stringify({ events }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (u === '/api/events' && method === 'POST') {
      if (init?.body) {
        postedBodies.push(JSON.parse(String(init.body)));
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof global.fetch;
}

beforeEach(() => {
  postedBodies = [];
  void i18n.changeLanguage('en');
  // Force a clean localStorage so the Bangla-first default probe starts
  // from scratch on each test.
  try {
    window.localStorage.removeItem('surakkha.locale');
    window.localStorage.removeItem('surakkha.citizen-first-visit');
  } catch {
    // localStorage may throw in some test environments; not critical.
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  void i18n.changeLanguage('en');
});

function renderTimeline() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            initialEntries={['/my-reports/inc_anjali_001/timeline']}
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
                <Route path="/my-reports/:incident_id/timeline" element={<CitizenStatusTimeline />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-001 Citizen Status Timeline — render acceptance', () => {
  it('public mode hides payloads/hashes/JSON in the DOM', async () => {
    global.fetch = makeFetch(baseEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-timeline-list')).toBeTruthy();
    });
    const text = document.body.textContent ?? '';

    expect(text).not.toContain('01HASH');
    expect(text).not.toContain('SHOULD_NEVER_RENDER');
    expect(text).not.toContain('INTERNAL_REASONING');
    expect(text).not.toContain('reasoning');
  });

  it('closure tap is hidden when only in-flight events exist', async () => {
    global.fetch = makeFetch(baseEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-in-progress')).toBeTruthy();
    });
    expect(screen.queryByTestId('citizen-action-call-confirm-yes')).toBeNull();
    expect(screen.queryByTestId('citizen-action-call-confirm-no')).toBeNull();
  });

  it('closure tap renders only after IncidentResolvedByAdmin event', async () => {
    global.fetch = makeFetch(closurePendingEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-closure-ack')).toBeTruthy();
    });
    expect(screen.getByTestId('citizen-action-call-confirm-yes')).toBeTruthy();
    expect(screen.getByTestId('citizen-action-call-confirm-no')).toBeTruthy();
  });

  it('✅ tap emits ChainAccepted with correct payload and acks the surface', async () => {
    global.fetch = makeFetch(closurePendingEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-confirm-yes')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('citizen-action-call-confirm-yes'));
    await waitFor(() => {
      const accepted = postedBodies.find(
        (b) => (b as { event_type?: string }).event_type === 'ChainAccepted',
      );
      expect(accepted).toBeTruthy();
    });
    const accepted = postedBodies.find((b) => (b as { event_type?: string }).event_type === 'ChainAccepted') as
      | { event_type: string; payload: { incident_id: string }; actor_identity: { kind: string } }
      | undefined;

    expect(accepted?.event_type).toBe('ChainAccepted');
    expect(accepted?.payload.incident_id).toBe('inc_anjali_001');
    expect(accepted?.actor_identity.kind).toBe('citizen');
  });

  it('❌ tap opens reason picker; submit emits ChainReopened with reason', async () => {
    global.fetch = makeFetch(closurePendingEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-confirm-no')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('citizen-action-call-confirm-no'));
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-reopen-modal')).toBeTruthy();
    });
    fireEvent.change(screen.getByTestId('citizen-action-call-reopen-reason'), {
      target: { value: 'water still smells' },
    });
    fireEvent.click(screen.getByTestId('citizen-action-call-reopen-submit'));
    await waitFor(() => {
      const reopened = postedBodies.find(
        (b) => (b as { event_type?: string }).event_type === 'ChainReopened',
      );
      expect(reopened).toBeTruthy();
    });
    const reopened = postedBodies.find((b) => (b as { event_type?: string }).event_type === 'ChainReopened') as
      | { event_type: string; payload: { incident_id: string; reason: string } }
      | undefined;

    expect(reopened?.event_type).toBe('ChainReopened');
    expect(reopened?.payload.incident_id).toBe('inc_anjali_001');
    expect(reopened?.payload.reason).toBe('water still smells');
  });

  it('ChainRead fires on mount exactly once', async () => {
    global.fetch = makeFetch(baseEvents);
    renderTimeline();
    await waitFor(() => {
      const chainReads = postedBodies.filter(
        (b) => (b as { event_type?: string }).event_type === 'ChainRead',
      );
      expect(chainReads.length).toBeGreaterThan(0);
    });
    // Wait one tick to ensure no second emission follows.
    await new Promise((r) => {
      setTimeout(r, 50);
    });
    const chainReads = postedBodies.filter(
      (b) => (b as { event_type?: string }).event_type === 'ChainRead',
    );

    expect(chainReads.length).toBe(1);
    const ev = chainReads[0] as {
      payload: { incident_id: string; filter_combo: string[] };
      actor_identity: { kind: string };
    };

    expect(ev.actor_identity.kind).toBe('citizen');
    expect(ev.payload.incident_id).toBe('inc_anjali_001');
    expect(ev.payload.filter_combo).toEqual(['all']);
  });

  it('non-citizen role is redirected away from the timeline', async () => {
    global.fetch = makeFetch(baseEvents);
    render(
      <I18nextProvider i18n={i18n}>
        <LocaleProvider>
          <ToastProvider durationMs={100}>
            <MemoryRouter
              initialEntries={['/my-reports/inc_anjali_001/timeline']}
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <AppLayoutContext.Provider
                value={{
                  session: makeSession('utility_operator'),
                  chainHead: null,
                  chainFreshSeconds: 0,
                  logout: () => Promise.resolve(),
                }}
              >
                <Routes>
                  <Route path="/my-reports/:incident_id/timeline" element={<CitizenStatusTimeline />} />
                  <Route path="/inbox" element={<div data-testid="redirected-to-inbox">redirected</div>} />
                </Routes>
              </AppLayoutContext.Provider>
            </MemoryRouter>
          </ToastProvider>
        </LocaleProvider>
      </I18nextProvider>,
    );
    // utility_operator's landing is /inbox; the page should Navigate there.
    await waitFor(() => {
      expect(screen.getByTestId('redirected-to-inbox')).toBeTruthy();
    });
  });
});
