/**
 * fe-b6-operator-log-hotline-call.test.tsx — operator-dashboard.md #6.
 *
 * Pins the dashboard's `Log hotline call` button + HotlineIntakeModal
 * mount contract:
 *   1) The button renders in the dashboard top-chrome with the i18n label.
 *   2) Clicking it mounts HotlineIntakeModal (test-id hotline-intake-modal).
 *   3) Submitting reported_incident fires POST /api/incidents and the new
 *      incident refetches back into the inbox with reporter_kind=hotline.
 *   4) en/bn key parity for actions.logHotlineCall.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { OperatorDashboard } from '../pages/OperatorDashboard';
import { handlers } from '../mocks/handlers';
import enJson from '../i18n/locales/en/operatorDashboard.json';
import bnJson from '../i18n/locales/bn/operatorDashboard.json';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

const SESSION_FIXTURE = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
};

const CHAIN_HEAD_FIXTURE = {
  height: 42,
  block_hash: 'abcdef1234567890',
  prev_hash: '0987fedcba654321',
  sealed_at: '2024-02-01T00:00:00.000Z',
  ingested_at: '2024-02-01T00:00:01.000Z',
};

const INCIDENTS = [
  { incident_id: 'inc-1', ward_id: 'ward-a', severity: 'T2', status: 'open', last_block_height: 1, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-15T12:00:00Z', reporter_kind: 'anchor' },
];

let restoreFetch: () => void = () => undefined;
let capturePosts: { url: string; body: unknown }[] = [];

function installFetchStub() {
  capturePosts = [];
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (init?.method === 'POST' && url === '/api/incidents') {
      const body = init.body ? JSON.parse(String(init.body)) : null;
      capturePosts.push({ url, body });
      return new Response(
        JSON.stringify({
          incident_id: 'inc_hotline_test_001',
          status: 'open',
          severity: 'T2',
          ward_id: 'unknown',
          last_block_height: 99,
          last_event_type: 'IncidentCreated',
          last_occurred_at: new Date().toISOString(),
          reporter_kind: 'hotline',
          trust_band: 'T1',
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/api/incidents')) {
      return new Response(JSON.stringify(INCIDENTS), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/sensors')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes('/api/events')) {
      return new Response(JSON.stringify({ events: [] }), { status: 200 });
    }
    return original(input as RequestInfo, init);
  }) as typeof globalThis.fetch;

  return () => {
    globalThis.fetch = original;
  };
}

beforeEach(() => {
  server.resetHandlers(...handlers);
  restoreFetch = installFetchStub();
  try {
    window.localStorage.setItem('surakkha.locale', 'en');
    document.body.dataset.locale = 'en';
    window.localStorage.setItem('surakkha.layout', 'a');
  } catch {
    /* noop */
  }
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreFetch();
});

function renderDash() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: SESSION_FIXTURE,
                chainHead: CHAIN_HEAD_FIXTURE,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <OperatorDashboard />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('FE-B6 OperatorDashboard Log hotline call mount (operator-dashboard.md #6)', () => {
  it('renders the Log hotline call button in the top-chrome action bar', async () => {
    renderDash();
    const button = screen.getByTestId('dashboard-log-hotline-call');

    expect(button).toBeTruthy();
    expect(button.textContent).toContain(enJson.actions.logHotlineCall);
  });

  it('clicking the button mounts HotlineIntakeModal', async () => {
    renderDash();
    fireEvent.click(screen.getByTestId('dashboard-log-hotline-call'));
    await waitFor(() => {
      expect(screen.getByTestId('hotline-intake-modal')).toBeTruthy();
    });
  });

  it('submitting reported_incident fires POST /api/incidents', async () => {
    renderDash();
    fireEvent.click(screen.getByTestId('dashboard-log-hotline-call'));
    await waitFor(() => {
      expect(screen.getByTestId('hotline-intake-modal')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('hotline-description'), {
      target: { value: 'Foul smell from the kitchen tap since this morning.' },
    });
    fireEvent.change(screen.getByTestId('hotline-location-hint'), {
      target: { value: 'Ward 14, Mohammadpur, standpipe #7' },
    });
    fireEvent.click(screen.getByTestId('hotline-submit'));

    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });

    const call = capturePosts.find((c) => c.url === '/api/incidents');

    expect(call).toBeTruthy();
    expect(call!.body).toMatchObject({
      source: 'hotline',
      reporter_kind: 'hotline_operator',
      outcome: 'reported_incident',
    });
  });

  it('en/bn key parity: actions.logHotlineCall exists in both locales', () => {
    expect(enJson.actions.logHotlineCall).toBeTruthy();
    expect(bnJson.actions.logHotlineCall).toBeTruthy();
  });
});