/**
 * fe-b6-operator-thread-reporter-chip.test.tsx — Operator dashboard
 * reporter-badge chip per row (operator-dashboard.md #9).
 *
 * Pins:
 *   1) Each row renders a chip with one of four reporter_kind classes
 *      (anchor / hotline / webform / sensor).
 *   2) The reporter chip uses the lockdown reporter palette
 *      (.chip-reporter-{kind}) — distinct from severity dot colour.
 *   3) aria-label is localized (en + bn) and spells out the source.
 *   4) Default kind when reporter_kind is absent falls back to webform
 *      (no chip is missing — every row shows a chip).
 *   5) en/bn key parity for threads.reporter.{kind,ariaLabel.{kind}}.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { OperatorDashboard } from '../pages/OperatorDashboard';
import { handlers } from '../mocks/handlers';
import enJson from '../i18n/locales/en/operatorDashboard.json';
import bnJson from '../i18n/locales/bn/operatorDashboard.json';

const server = require('msw/node').setupServer(...handlers);

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

// 3 incidents — covers all 3 reporter_kind variants in our fixture.
// The threads table caps at 3 rows per layout, so top 3 = anchor,
// hotline, default (no reporter_kind → fallback webform). Result:
// webform chips render both as explicit and as fallback.
const INCIDENTS = [
  { incident_id: 'inc-anchor', ward_id: 'ward-a', severity: 'T3', status: 'open', last_block_height: 1, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-15T12:00:00Z', reporter_kind: 'anchor' },
  { incident_id: 'inc-hotline', ward_id: 'ward-b', severity: 'T2', status: 'open', last_block_height: 2, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-16T12:00:00Z', reporter_kind: 'hotline' },
  // No reporter_kind — falls back to 'webform' (renders as webform chip).
  { incident_id: 'inc-default', ward_id: 'ward-e', severity: 'T3', status: 'open', last_block_height: 5, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-19T12:00:00Z' },
];

let restoreFetch: () => void = () => undefined;

function installFetchStub() {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

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

describe('FE-B6 OperatorDashboard reporter-badge chips (operator-dashboard.md #9)', () => {
  // (1) The 3 reporter_kind variants in our fixture each render a chip.
  // The dashboard renders BOTH layout A and layout B (toggled via `hidden`
  // attribute) so each chip appears twice in DOM.
  it('renders a chip per row for each reporter_kind', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });

    expect(screen.getAllByTestId('thread-reporter-anchor').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('thread-reporter-hotline').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('thread-reporter-webform').length).toBeGreaterThan(0);
  });

  // (2) Each chip uses the lockdown reporter palette class.
  it('chips use .chip-reporter-{kind} palette classes', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getAllByTestId('thread-reporter-anchor').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByTestId('thread-reporter-anchor')[0].className).toContain('chip-reporter-anchor');
    expect(screen.getAllByTestId('thread-reporter-anchor')[0].className).toContain('badge--reporter-anchor');
    expect(screen.getAllByTestId('thread-reporter-hotline')[0].className).toContain('chip-reporter-hotline');
    expect(screen.getAllByTestId('thread-reporter-hotline')[0].className).toContain('badge--reporter-hotline');
    expect(screen.getAllByTestId('thread-reporter-webform')[0].className).toContain('chip-reporter-webform');
    expect(screen.getAllByTestId('thread-reporter-webform')[0].className).toContain('badge--reporter-webform');
  });

  // (3) aria-label is localized and spelled out.
  it('chips expose spelled-out aria-label per source', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getAllByTestId('thread-reporter-anchor').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByTestId('thread-reporter-anchor')[0].getAttribute('aria-label')).toBe(
      enJson.threads.reporter.ariaLabel.anchor,
    );
    expect(screen.getAllByTestId('thread-reporter-hotline')[0].getAttribute('aria-label')).toBe(
      enJson.threads.reporter.ariaLabel.hotline,
    );
    expect(screen.getAllByTestId('thread-reporter-webform')[0].getAttribute('aria-label')).toBe(
      enJson.threads.reporter.ariaLabel.webform,
    );
  });

  // (4) Default kind fallback (inc-default has no reporter_kind → webform).
  // Top 3 of 3 incidents render per layout; 1 of those 3 is webform
  // (inc-default fallback). 2 layouts × 1 = 2 webform chips minimum.
  it('defaults missing reporter_kind to webform chip', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });

    const webformChips = document.querySelectorAll('[data-testid="thread-reporter-webform"]');

    // 2 layouts × 1 webform chip per layout (inc-default fallback) = 2.
    expect(webformChips.length).toBeGreaterThanOrEqual(2);
  });

  // (5) Key parity (still includes sensor — even though fixture doesn't
  // render it, the i18n keys must exist for the Tier 1 hotline spec
  // when it ships).
  it('en/bn key parity: threads.reporter.* keys exist in both locales', () => {
    for (const k of ['anchor', 'hotline', 'webform', 'sensor']) {
      expect(enJson.threads.reporter[k], `en.threads.reporter.${k}`).toBeTruthy();
      expect(bnJson.threads.reporter[k], `bn.threads.reporter.${k}`).toBeTruthy();
      expect(enJson.threads.reporter.ariaLabel[k], `en.threads.reporter.ariaLabel.${k}`).toBeTruthy();
      expect(bnJson.threads.reporter.ariaLabel[k], `bn.threads.reporter.ariaLabel.${k}`).toBeTruthy();
    }
  });
});
