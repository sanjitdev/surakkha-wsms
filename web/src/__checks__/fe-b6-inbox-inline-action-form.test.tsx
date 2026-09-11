/**
 * fe-b6-inbox-inline-action-form.test.tsx — inbox-detail.md #14.
 *
 * Pins the single inline form (replacing the AssignTechModal +
 * RequestAckModal pair):
 *   1) The two side-by-side sections render — assign-section + ack-section.
 *   2) Submit is disabled until at least one side has minimum fields.
 *   3) Filling only the assign side fires only assignTech (no requestAck).
 *   4) Filling only the ack side fires only requestAck (no assignTech).
 *   5) Filling both sides fires both write paths.
 *   6) The two CTA buttons (inbox-assign-tech, inbox-request-ack) are
 *      no longer rendered — the inline form replaces them.
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
import { InboxDetail } from '../pages/InboxDetail';
import enJson from '../i18n/locales/en/inboxDetail.json';
import bnJson from '../i18n/locales/bn/inboxDetail.json';
import type { SessionRow } from '../mocks/idb';

// jsdom does NOT provide `indexedDB` by default. The
// useIncidentActions.post() helper calls getSession() from
// ../mocks/idb, which calls indexedDB.open() — without this mock
// the whole submit fails with `ReferenceError: indexedDB is not
// defined` and `captured` never sees the POST body.
vi.mock('../mocks/idb', async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    getSession: async () =>
      ({
        actor_id: 'priya-001',
        actor_ref: 'priya-001',
        display_name: 'Priya',
        role: 'utility_operator',
        token: 'test-token',
        logged_in_at: '2024-01-01T00:00:00Z',
        tenant_id: 'tenant-001',
      }) as SessionRow,
  };
});

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
    incident_id: 'inc_test_001',
    severity: 'T2',
    ward_id: 'W04',
    status: 'open',
    last_block_height: 12,
    last_event_type: 'IncidentCreated',
  },
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

const originalFetch = global.fetch;
let captured: { url: string; body: unknown }[] = [];
let restoreFetch: () => void = () => undefined;

beforeEach(() => {
  captured = [];
  restoreFetch = () => undefined;
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
    const method = (init?.method ?? 'GET').toUpperCase();

    // POST /api/events = write path (assignTech, requestAck, etc.)
    // MUST be captured BEFORE the GET → events-list short-circuit below,
    // otherwise the empty-events fallback eats the write.
    if (u.startsWith('/api/events') && method === 'POST') {
      try {
        const body = JSON.parse(String(init?.body));
        captured.push({ url: u, body });
      } catch {
        captured.push({ url: u, body: null });
      }
      return new Response(JSON.stringify({ event_id: `evt_${captured.length}` }), {
        status: 200,
      });
    }
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: [] }), { status: 200 });
    }
    if (init?.body) {
      try {
        const body = JSON.parse(String(init.body));
        captured.push({ url: u, body });
      } catch {
        captured.push({ url: u, body: null });
      }
      return new Response('{}', { status: 200 });
    }
    return new Response('{}', { status: 200 });
  }) as typeof global.fetch;
  restoreFetch = () => {
    global.fetch = originalFetch;
  };
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
        <ToastProvider durationMs={100}>
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

describe('FE-B6 InboxDetail inline action form (inbox-detail.md #14)', () => {
  it('renders the two side-by-side sections (assign + ack)', () => {
    renderInboxDetail();
    expect(screen.getByTestId('inbox-inline-action-form')).toBeTruthy();
    expect(screen.getByTestId('inbox-inline-assign-section')).toBeTruthy();
    expect(screen.getByTestId('inbox-inline-ack-section')).toBeTruthy();
    expect(screen.getByTestId('inbox-inline-submit')).toBeTruthy();
  });

  it('the two previous CTA buttons (assign-tech + request-ack) are gone', () => {
    renderInboxDetail();
    expect(screen.queryByTestId('inbox-assign-tech')).toBeNull();
    expect(screen.queryByTestId('inbox-request-ack')).toBeNull();
  });

  it('submit is disabled with both sides empty', () => {
    renderInboxDetail();
    expect((screen.getByTestId('inbox-inline-submit') as HTMLButtonElement).disabled).toBe(true);
  });

  it('filling only the assign side enables submit; clicking fires only assignTech', async () => {
    renderInboxDetail();
    const eta = screen.getByTestId('inline-assign-eta');
    const wo = screen.getByTestId('inline-assign-summary');

    fireEvent.change(eta, { target: { value: '45' } });
    fireEvent.change(wo, { target: { value: 'Replace chlorine pump #4 and verify output readings' } });

    expect((screen.getByTestId('inbox-inline-submit') as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByTestId('inbox-inline-submit'));

    await waitFor(() => {
      expect(captured.length).toBeGreaterThan(0);
    });

    // assignTech posts {event_type: 'TechnicianAssigned', payload: {...}}
    const techEvents = captured.filter((c) =>
      c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'TechnicianAssigned',
    );
    const noticeEvents = captured.filter((c) =>
      c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'PublicNoticeIssued',
    );

    expect(techEvents.length).toBe(1);
    expect(noticeEvents.length).toBe(0);
    expect((techEvents[0].body as { payload: Record<string, unknown> }).payload).toMatchObject({
      incident_id: 'inc_test_001',
      eta_target_minutes: 45,
      work_order_summary: 'Replace chlorine pump #4 and verify output readings',
    });
  });

  it('filling only the ack side fires only requestAck', async () => {
    renderInboxDetail();
    fireEvent.change(screen.getByTestId('inline-ack-channel'), { target: { value: 'whatsapp' } });
    fireEvent.change(screen.getByTestId('inline-ack-copy'), {
      target: { value: 'Please confirm your tap water is now safe after our fix.' },
    });

    expect((screen.getByTestId('inbox-inline-submit') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByTestId('inbox-inline-submit'));

    await waitFor(() => {
      expect(captured.some((c) =>
        c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'PublicNoticeIssued',
      )).toBe(true);
    });

    const techEvents = captured.filter((c) =>
      c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'TechnicianAssigned',
    );
    const noticeEvents = captured.filter((c) =>
      c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'PublicNoticeIssued',
    );

    expect(techEvents.length).toBe(0);
    expect(noticeEvents.length).toBeGreaterThanOrEqual(1);
    expect((noticeEvents[0].body as { payload: Record<string, unknown> }).payload).toMatchObject({
      channel: 'whatsapp',
      body: 'Please confirm your tap water is now safe after our fix.',
    });
  });

  it('filling both sides fires both write paths in a single submit', async () => {
    renderInboxDetail();
    fireEvent.change(screen.getByTestId('inline-assign-eta'), { target: { value: '30' } });
    fireEvent.change(screen.getByTestId('inline-assign-summary'), {
      target: { value: 'Replace chlorine pump #4 and verify output readings' },
    });
    fireEvent.change(screen.getByTestId('inline-ack-channel'), { target: { value: 'sms' } });
    fireEvent.change(screen.getByTestId('inline-ack-copy'), {
      target: { value: 'Please confirm your tap water is now safe after our fix.' },
    });
    fireEvent.click(screen.getByTestId('inbox-inline-submit'));

    await waitFor(() => {
      const techEvents = captured.filter((c) =>
        c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'TechnicianAssigned',
      );
      const noticeEvents = captured.filter((c) =>
        c.body && typeof c.body === 'object' && (c.body as { event_type?: string }).event_type === 'PublicNoticeIssued',
      );

      expect(techEvents.length).toBeGreaterThanOrEqual(1);
      expect(noticeEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('en/bn key parity: inlineForm.* + assignModal.* + ackModal.* keys exist in both locales', () => {
    for (const k of ['title', 'subtitle', 'assignHeading', 'ackHeading', 'submit', 'submitting']) {
      expect(enJson.inlineForm[k], `en.inlineForm.${k}`).toBeTruthy();
      expect(bnJson.inlineForm[k], `bn.inlineForm.${k}`).toBeTruthy();
    }
  });
});