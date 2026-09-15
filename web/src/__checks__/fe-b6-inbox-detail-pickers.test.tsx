/**
 * fe-b6-inbox-detail-pickers.test.tsx — WO-005 REQ-011.
 *
 * Pins the Karim picker (`inbox-detail-karim-picker`), `due_at` picker
 * (`inbox-detail-due-at-picker`), and priority override dropdown
 * (`inbox-detail-priority-override`) on the InlineActionForm. Per the
 * lockdown cascade the form is what ships for Phase 1; the pickers
 * ride on the existing tech/eta/priority inputs so the picker
 * testIds are queryable via `data-testid-picker` without breaking
 * the legacy `data-testid` contract.
 *
 * Asserts:
 *   1) All three picker testIds present on the form.
 *   2) Each picker carries the right `data-picker` attribute
 *      (`karim` / `due-at` / `priority-override`).
 *   3) Each picker has an aria-label (screen-reader nav).
 *   4) Labels resolve via i18n (`pickers.karim`/`dueAt`/`priorityOverride`).
 *   5) en/bn key parity for `pickers.*` keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InboxDetail } from '../pages/InboxDetail';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
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
  {
    incident_id: 'inc_pickers_001',
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

const eventsFixture = [
  {
    event_id: 'ev-pick-1',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-15T12:00:00Z',
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: { incident_id: 'inc_pickers_001', ward_id: 'W04' },
    block_hash: 'picker-hash-001',
    height: 12,
  },
];

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: eventsFixture }), {
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
            initialEntries={['/inbox/inc_pickers_001']}
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

describe('FE-B6 InboxDetail pickers (REQ-011)', () => {
  // Picker query helper — the picker testIds live on the
  // `data-testid-picker` attribute (custom attribute) so they don't
  // collide with the legacy `data-testid` contract. Using the raw
  // document.querySelector avoids any ambiguity with testing-library's
  // built-in testid resolution.
  function getPicker(name: 'inbox-detail-karim-picker' | 'inbox-detail-due-at-picker' | 'inbox-detail-priority-override'): HTMLElement {
    const el = document.querySelector(`[data-testid-picker="${name}"]`);

    if (!el) throw new Error(`picker not found: ${name}`);
    return el as HTMLElement;
  }

  it('renders the Karim, due_at, and priority-override pickers', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-inline-action-form')).toBeTruthy();
    });

    // All three pickers present.
    expect(getPicker('inbox-detail-karim-picker')).toBeTruthy();
    expect(getPicker('inbox-detail-due-at-picker')).toBeTruthy();
    expect(getPicker('inbox-detail-priority-override')).toBeTruthy();
  });

  it('each picker carries the correct data-picker discriminator', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-inline-action-form')).toBeTruthy();
    });

    expect(getPicker('inbox-detail-karim-picker').getAttribute('data-picker')).toBe('karim');
    expect(getPicker('inbox-detail-due-at-picker').getAttribute('data-picker')).toBe('due-at');
    expect(getPicker('inbox-detail-priority-override').getAttribute('data-picker')).toBe('priority-override');
  });

  it('each picker has an aria-label for screen-reader nav', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-inline-action-form')).toBeTruthy();
    });

    expect(getPicker('inbox-detail-karim-picker').getAttribute('aria-label')).toBeTruthy();
    expect(getPicker('inbox-detail-due-at-picker').getAttribute('aria-label')).toBeTruthy();
    expect(getPicker('inbox-detail-priority-override').getAttribute('aria-label')).toBeTruthy();
  });

  it('picker labels resolve via i18n (pickers.karim / dueAt / priorityOverride)', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-inline-action-form')).toBeTruthy();
    });

    // Visible <label> elements use the i18n keys.
    expect(screen.getByText(enJson.pickers.karim)).toBeTruthy();
    expect(screen.getByText(enJson.pickers.dueAt)).toBeTruthy();
    expect(screen.getByText(enJson.pickers.priorityOverride)).toBeTruthy();
  });

  it('en/bn key parity: pickers.* keys exist in both locales', () => {
    expect(enJson.pickers.karim, 'en.pickers.karim').toBeTruthy();
    expect(enJson.pickers.dueAt, 'en.pickers.dueAt').toBeTruthy();
    expect(enJson.pickers.priorityOverride, 'en.pickers.priorityOverride').toBeTruthy();
    expect(bnJson.pickers.karim, 'bn.pickers.karim').toBeTruthy();
    expect(bnJson.pickers.dueAt, 'bn.pickers.dueAt').toBeTruthy();
    expect(bnJson.pickers.priorityOverride, 'bn.pickers.priorityOverride').toBeTruthy();
  });
});
