/**
 * fe-b6-inbox-detail-area-labels.test.tsx — REQ-014 / foundation §13.
 *
 * Pins the area-label + container testId contract on the InboxDetail
 * page. The full Batch 5 Tier 1 surface (signal-card-{1..5}, photo-viewer,
 * map, reasoning-path-picker, path-{A,B,C,D}, reasoning-field-*, karim-picker,
 * due-at-picker, priority-override, button-submit-verify-assign, button-defer,
 * button-escalate) ships in Phase 5. Phase 1 pins the load-bearing
 * structural testIds + aria-labels so the surrounding markup is locked-in
 * and downstream consumers (screen readers, e2e) can rely on the
 * landmarks even before the inner widgets are implemented.
 *
 * Asserts:
 *   1) Page wrapper testId (`inbox-detail-page`) + Container testId prop.
 *   2) Header band testId (`inbox-detail-header`) + aria-label.
 *   3) Main body wrapper testId (`inbox-detail-main`) + aria-label.
 *   4) Left rail testId (`inbox-detail-rail-inbox`) + aria-label.
 *   5) Right detail pane testId (`inbox-detail-detail-pane`) + aria-label.
 *   6) Inner EventChain Card testId (`inbox-detail-event-chain`) + aria-label.
 *   7) Trust-band pill testId (`inbox-detail-band-pill`) + `data-band`
 *      attribute (foundation §1.1 separation).
 *   8) Override affordance + toggle testIds still present (REQ-009 carryover).
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
    incident_id: 'inc_area_labels_001',
    severity: 'T2',
    ward_id: 'W04',
    status: 'open',
    last_block_height: 12,
    last_event_type: 'IncidentCreated',
    reporter_kind: 'hotline',
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
    event_id: 'ev-area-1',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-15T12:00:00Z',
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: { incident_id: 'inc_area_labels_001', ward_id: 'W04' },
    block_hash: 'area-label-hash-001',
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
            initialEntries={['/inbox/inc_area_labels_001']}
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

describe('FE-B6 InboxDetail area labels (REQ-014 / foundation §13)', () => {
  // (1) Page wrapper carries the `inbox-detail-page` testId (set via
  // Container's `testId` prop) and the Container resolves to a div with
  // the bangla width class.
  it('page wrapper renders inbox-detail-page testId', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    const page = screen.getByTestId('inbox-detail-page');

    expect(page).toBeTruthy();
    expect(page.className).toContain('container--bangla');
  });

  // (2) Header band — wraps the title + chip row + meta line.
  it('header band carries inbox-detail-header testId + aria-label', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-header')).toBeTruthy();
    });

    const header = screen.getByTestId('inbox-detail-header');

    expect(header.getAttribute('aria-label')).toBeTruthy();
    expect(header.className).toContain('page-header');
  });

  // (3) Main body wrapper — `inbox-detail-main` (the grid-12 wrapper).
  it('main body wrapper carries inbox-detail-main testId + aria-label', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-main')).toBeTruthy();
    });

    const main = screen.getByTestId('inbox-detail-main');

    expect(main.getAttribute('aria-label')).toBeTruthy();
    expect(main.className).toContain('grid-12');
  });

  // (4) Left rail (related incidents) — area-label `inbox-detail-rail-inbox`
  // sits on the `inbox-detail-related` wrapper (legacy testId) so the
  // pane-swap test still finds it.
  it('left rail (related) carries inbox-detail-rail-inbox area-label', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-related')).toBeTruthy();
    });

    const rail = screen.getByTestId('inbox-detail-related');

    expect(rail.getAttribute('data-area-label')).toBe('inbox-detail-rail-inbox');
    expect(rail.getAttribute('aria-label')).toBeTruthy();
    expect(rail.className).toContain('col-7');
  });

  // (5) Right detail pane — area-label `inbox-detail-detail-pane` sits
  // on the `inbox-detail-timeline` wrapper (legacy testId).
  it('right detail pane carries inbox-detail-detail-pane area-label', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline')).toBeTruthy();
    });

    const pane = screen.getByTestId('inbox-detail-timeline');

    expect(pane.getAttribute('data-area-label')).toBe('inbox-detail-detail-pane');
    expect(pane.getAttribute('aria-label')).toBeTruthy();
    expect(pane.className).toContain('col-5');
  });

  // (6) Inner EventChain Card — `inbox-detail-event-chain`.
  it('inner EventChain Card carries inbox-detail-event-chain testId + aria-label', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-event-chain')).toBeTruthy();
    });

    const card = screen.getByTestId('inbox-detail-event-chain');

    expect(card.getAttribute('aria-label')).toBeTruthy();
    expect(card.className).toContain('card');
  });

  // (7) Trust-band pill carries its own testId + data-band so the
  // trust band is independently queryable (foundation §1.1 — band ×
  // reporter-badge separation).
  // FE-1.5d (2026-09-16): the pill now renders through the locked
  // BandPill primitive so the operator sees the resolved i18n label
  // (Pending / Verified / Issuance / Resolved) instead of the raw
  // tier code. The `data-band` attribute preserves the audit trail
  // for tooling + tests.
  it('trust-band pill carries inbox-detail-band-pill testId + data-band', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-band-pill')).toBeTruthy();
    });

    const pill = screen.getByTestId('inbox-detail-band-pill');

    expect(pill.getAttribute('data-band')).toBe('T2');
    expect(pill.className).toContain('band-pill');
    expect(pill.className).toContain('band-pill--t2-locked');
    // Operator-visible text resolves through the common i18n namespace,
    // not the wire tier code — this is the FE-1.5d invariant.
    expect(pill.textContent).toMatch(/Verified/i);
    expect(pill.textContent).not.toContain('T2');
  });

  // (8) Override affordance carry-over from REQ-009 — verify the
  // testId still resolves when an override event is on the chain
  // (no regression on the affordance after the area-label pass).
  it('override affordance testId is still present after the area-label pass', async () => {
    // Re-mock useIncidents with a chain that has an override event so
    // the affordance renders. We swap the mocked incidents fixture
    // (top-level let) then re-import the module so the factory picks
    // up the new value. The mock is hoisted, so we mutate the closure
    // variable instead.
    incidentsFixture.length = 0;
    incidentsFixture.push({
      incident_id: 'inc_area_labels_002',
      severity: 'T2',
      ward_id: 'W04',
      status: 'open',
      last_block_height: 13,
      last_event_type: 'OverrideRecorded',
      reporter_kind: 'hotline',
    });
    const overrideEventsFixture = [
      {
        event_id: 'ev-area-2',
        event_type: 'OverrideRecorded',
        occurred_at: '2024-01-15T12:05:00Z',
        actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
        payload: { incident_id: 'inc_area_labels_002', from_band: 'T3', to_band: 'T2' },
        block_hash: 'area-label-hash-002',
        height: 13,
      },
    ];
    global.fetch = vi.fn(async (url: RequestInfo | URL) => {
      const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
      if (u.startsWith('/api/events')) {
        return new Response(JSON.stringify({ events: overrideEventsFixture }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    }) as typeof global.fetch;

    // Re-render at the override incident.
    cleanup();
    render(
      <I18nextProvider i18n={i18n}>
        <LocaleProvider>
          <ToastProvider>
            <MemoryRouter
              initialEntries={['/inbox/inc_area_labels_002']}
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
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-override-reasoning-affordance')).toBeTruthy();
    });

    // Toggle also present.
    expect(screen.getByTestId('inbox-detail-override-toggle')).toBeTruthy();
  });
});
