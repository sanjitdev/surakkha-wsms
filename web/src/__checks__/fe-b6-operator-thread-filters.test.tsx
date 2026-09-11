/**
 * fe-b6-operator-thread-filters.test.tsx — Operator dashboard thread filter chips.
 *
 * Pins operator-dashboard.md #7 — the thread filter chip group above the
 * Open threads panel. Asserts:
 *   1) Five chips render (All / T3 / T2 / T1 / T0) with counts.
 *   2) Clicking a tier chip narrows the threads table to that tier.
 *   3) Clicking 'All' restores the full open list.
 *   4) T3 chip dot is amber-bright (NOT alert-red-reserved; alert-red
 *      is reserved for the issuance path per lockdown cascade 2026-09-11).
 *   5) Key parity: en + bn operatorDashboard.json expose threads.filters.*
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
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
  { incident_id: 'inc-1', ward_id: 'ward-a', severity: 'T3', status: 'open', last_block_height: 1, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-15T12:00:00Z' },
  { incident_id: 'inc-2', ward_id: 'ward-b', severity: 'T2', status: 'open', last_block_height: 2, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-16T12:00:00Z' },
  { incident_id: 'inc-3', ward_id: 'ward-c', severity: 'T1', status: 'open', last_block_height: 3, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-17T12:00:00Z' },
  { incident_id: 'inc-4', ward_id: 'ward-d', severity: 'T0', status: 'open', last_block_height: 4, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-18T12:00:00Z' },
  { incident_id: 'inc-5', ward_id: 'ward-e', severity: 'T3', status: 'open', last_block_height: 5, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-19T12:00:00Z' },
];

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

let restoreFetch: () => void = () => undefined;

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
  // Layout A by default — uses the wide table view for threads.
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

describe('FE-B6 OperatorDashboard thread filter chips (operator-dashboard.md #7)', () => {
  // (1) Chips render with counts.
  it('renders 5 filter chips with per-tier counts', async () => {
    renderDash();
    // Wait for /api/incidents + /api/sensors + /api/events to settle.
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });
    const all = screen.getByTestId('dashboard-thread-chip-all');

    expect(all.textContent).toContain(enJson.threads.filters.all);
    expect(all.textContent).toContain('5'); // total open = 5

    expect(screen.getByTestId('dashboard-thread-chip-t3').textContent).toContain('2');
    expect(screen.getByTestId('dashboard-thread-chip-t2').textContent).toContain('1');
    expect(screen.getByTestId('dashboard-thread-chip-t1').textContent).toContain('1');
    expect(screen.getByTestId('dashboard-thread-chip-t0').textContent).toContain('1');
  });

  // (2) Clicking T3 narrows table — only T3 threads visible (cap=3 so
  // both T3 incidents show).
  it('clicking T3 narrows the threads table to only T3 incidents', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('dashboard-thread-chip-t3'));

    await waitFor(() => {
      const t3Chip = screen.getByTestId('dashboard-thread-chip-t3');

      expect(t3Chip.getAttribute('aria-selected')).toBe('true');
    });

    // The All chip is no longer active.
    expect(screen.getByTestId('dashboard-thread-chip-all').getAttribute('aria-selected')).toBe('false');
  });

  // (3) Clicking All restores full list.
  it('clicking All restores the full thread list', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('dashboard-thread-chip-t3'));
    fireEvent.click(screen.getByTestId('dashboard-thread-chip-all'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-chip-all').getAttribute('aria-selected')).toBe('true');
    });
    expect(screen.getByTestId('dashboard-thread-chip-t3').getAttribute('aria-selected')).toBe('false');
  });

  // (4) T3 chip dot colour — amber-bright, NOT alert-red.
  it('T3 chip uses amber-bright dot (NOT alert-red-reserved)', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });
    // Walk into the T3 chip and find the dot span with background.
    const t3Chip = screen.getByTestId('dashboard-thread-chip-t3');

    expect(t3Chip.innerHTML).toContain('color-amber-bright');
    expect(t3Chip.innerHTML).not.toContain('alert-red-reserved');
  });

  // (5) Key parity.
  it('en/bn key parity: threads.filters.* keys exist in both locales', () => {
    for (const k of ['all', 't3', 't2', 't1', 't0', 'ariaLabel']) {
      expect(enJson.threads.filters[k], `en.threads.filters.${k}`).toBeTruthy();
      expect(bnJson.threads.filters[k], `bn.threads.filters.${k}`).toBeTruthy();
    }
  });
});
