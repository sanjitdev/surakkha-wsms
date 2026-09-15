/**
 * fe-b6-inbox-detail-override-affordance.test.tsx — inbox-detail.md #15 / REQ-009.
 *
 * Pins foundation §12 #8: when the incident chain contains a band-override
 * event (current wire = `OverrideRecorded`, PRD name = `TrustBandOverridden`),
 * the detail page surfaces a "View override reasoning" affordance at the top
 * of the EventChain rail. Clicking the button expands the payload of every
 * override event for that incident (from/to band, reason_category, free-text
 * reasoning).
 *
 * Asserts:
 *   1) Override event in the chain → affordance test-id is rendered;
 *      button has aria-expanded="false" before click and toggles to "true".
 *   2) Payload renders per override event: from→to band, reason_category,
 *      free-text reasoning (each from the underlying chain event payload).
 *   3) Affordance is absent when the chain has no override events (no
 *      regression on the page header / EventChain layout).
 *   4) en/bn key parity for `override.*` keys.
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
import enJson from '../i18n/locales/en/inboxDetail.json';
import bnJson from '../i18n/locales/bn/inboxDetail.json';

function makeSession(): SessionRow {
  return {
    actor_id: 'priya-001',
    actor_ref: 'priya-001',
    display_name: 'Priya — Utility Operator',
    role: 'utility_operator',
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

let incidentsFixture: Array<Record<string, unknown>> = [];
let eventsFixture: Array<Record<string, unknown>> = [];

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
  incidentsFixture = [];
  eventsFixture = [];
});

function renderInboxDetail() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={['/inbox/inc_test_001']}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
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

describe('FE-B6 InboxDetail override-reasoning affordance (inbox-detail.md #15 / REQ-009)', () => {
  // (1) Override events on the chain → affordance present + toggles.
  it('renders the override-reasoning affordance when OverrideRecorded event exists', async () => {
    incidentsFixture = [
      {
        incident_id: 'inc_test_001',
        severity: 'T2',
        ward_id: 'W04',
        status: 'open',
        last_block_height: 13,
        last_event_type: 'OverrideRecorded',
        last_occurred_at: '2024-01-15T12:05:00Z',
      },
    ];
    eventsFixture = [
      {
        event_id: 'ev-1',
        event_type: 'IncidentCreated',
        occurred_at: '2024-01-15T12:00:00Z',
        actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
        payload: { incident_id: 'inc_test_001', ward_id: 'W04' },
        block_hash: 'aaaa',
        height: 12,
      },
      {
        event_id: 'ev-2',
        event_type: 'OverrideRecorded',
        occurred_at: '2024-01-15T12:05:00Z',
        actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
        payload: {
          incident_id: 'inc_test_001',
          from_band: 'T3',
          to_band: 'T2',
          reason_category: 'verification_followup',
          reason: 'Caller phoned back with sensor reading — downgrading pending second signal.',
        },
        block_hash: 'bbbb',
        height: 13,
      },
    ];

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-override-reasoning-affordance')).toBeTruthy();
    });

    const toggle = screen.getByTestId('inbox-detail-override-toggle');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    // Expand.
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(screen.getByTestId('inbox-detail-override-payload')).toBeTruthy();
    });

    // Per-event payload test-id.
    expect(screen.getByTestId('inbox-detail-override-payload-ev-2')).toBeTruthy();
    // Text content includes the free-text reasoning.
    const payloadEl = screen.getByTestId('inbox-detail-override-payload-ev-2');

    expect(payloadEl.textContent).toContain('T3');
    expect(payloadEl.textContent).toContain('T2');
    expect(payloadEl.textContent).toContain('verification_followup');
    expect(payloadEl.textContent).toContain('Caller phoned back with sensor reading');

    // Collapse again — payload unmounts.
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('inbox-detail-override-payload')).toBeNull();
  });

  // (1b) PRD-named override event also surfaces the affordance (forward
  // compatibility with foundation §12 #8 naming).
  it('matches TrustBandOverridden event names too (PRD lock-in)', async () => {
    incidentsFixture = [
      {
        incident_id: 'inc_test_001',
        severity: 'T2',
        ward_id: 'W04',
        status: 'open',
        last_block_height: 13,
        last_event_type: 'TrustBandOverridden',
      },
    ];
    eventsFixture = [
      {
        event_id: 'ev-2',
        event_type: 'TrustBandOverridden',
        occurred_at: '2024-01-15T12:05:00Z',
        payload: { incident_id: 'inc_test_001', from_band: 'T2', to_band: 'T1' },
        block_hash: 'cccc',
        height: 13,
      },
    ];

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-override-reasoning-affordance')).toBeTruthy();
    });
  });

  // (2) No override events → affordance absent.
  it('does not render the override affordance when no override events are present', async () => {
    incidentsFixture = [
      {
        incident_id: 'inc_test_001',
        severity: 'T2',
        ward_id: 'W04',
        status: 'open',
        last_block_height: 13,
        last_event_type: 'PublicNoticeIssued',
      },
    ];
    eventsFixture = [
      {
        event_id: 'ev-1',
        event_type: 'IncidentCreated',
        occurred_at: '2024-01-15T12:00:00Z',
        payload: { incident_id: 'inc_test_001' },
        block_hash: 'aaaa',
        height: 12,
      },
      {
        event_id: 'ev-2',
        event_type: 'PublicNoticeIssued',
        occurred_at: '2024-01-15T12:05:00Z',
        payload: { incident_id: 'inc_test_001' },
        block_hash: 'bbbb',
        height: 13,
      },
    ];

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    expect(screen.queryByTestId('inbox-detail-override-reasoning-affordance')).toBeNull();
    expect(screen.queryByTestId('inbox-detail-override-toggle')).toBeNull();
  });

  // (3) Key parity for override.* keys.
  it('en/bn key parity: override.* keys exist in both locales', () => {
    expect(enJson.override.viewReasoning_one, 'en.override.viewReasoning_one').toBeTruthy();
    expect(enJson.override.viewReasoning_other, 'en.override.viewReasoning_other').toBeTruthy();
    expect(bnJson.override.viewReasoning_one, 'bn.override.viewReasoning_one').toBeTruthy();
    expect(bnJson.override.viewReasoning_other, 'bn.override.viewReasoning_other').toBeTruthy();
    expect(enJson.override.fromTo, 'en.override.fromTo').toBeTruthy();
    expect(bnJson.override.fromTo, 'bn.override.fromTo').toBeTruthy();
    expect(enJson.override.reasonCategory, 'en.override.reasonCategory').toBeTruthy();
    expect(bnJson.override.reasonCategory, 'bn.override.reasonCategory').toBeTruthy();
    expect(enJson.override.blockRef, 'en.override.blockRef').toBeTruthy();
    expect(bnJson.override.blockRef, 'bn.override.blockRef').toBeTruthy();
  });
});
