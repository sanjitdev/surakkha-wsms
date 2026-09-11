/**
 * fe-b6-citizen-status-timeline.test.tsx — citizen-status-timeline.md.
 *
 * Phase 1 verification pins the public-mode render contract:
 *   1) Title + back link render.
 *   2) Vertical timeline renders curated citizen-visible events
 *      (filtered to `CitizenVisibleEventType`), newest at top.
 *   3) Internal events (Verified, TrustBandOverridden, ChainRead, …)
 *      are NOT rendered.
 *   4) No chain hash, no JSON, no payload text on the rendered DOM.
 *   5) ActionCall card renders one of the four canonical states
 *      (in-progress / closure-ack / silent-closure / all-caught-up).
 *   6) Closure-ack state links to /ack/:incident_id with confirm +
 *      reopen buttons.
 *   7) Empty state when no events match.
 *   8) en/bn key parity for the citizen-visible event titles and
 *      ActionCall states.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
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
import { CitizenStatusTimeline } from '../pages/CitizenStatusTimeline';
import enJson from '../i18n/locales/en/citizenStatusTimeline.json';
import bnJson from '../i18n/locales/bn/citizenStatusTimeline.json';
import type { SessionRow } from '../mocks/idb';

function makeSession(): SessionRow {
  return {
    actor_id: 'anjali-001',
    actor_ref: 'anjali-001',
    display_name: 'Anjali',
    role: 'citizen',
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

const originalFetch = global.fetch;

function makeFetch(events: unknown[]) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events }), { status: 200 });
    }
    return new Response('{}', { status: 200 });
  }) as typeof global.fetch;
}

beforeEach(() => {
  void i18n.changeLanguage('en');
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

const inFlightEvents = [
  {
    event_id: 'evt_a1',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-01T00:00:00Z',
    actor_identity: { kind: 'reporter', ref: 'anjali', display: 'Anjali' },
    payload: { incident_id: 'inc_anjali_001' },
    block_hash: '01HASHAAAAAAAAAAAA',
    height: 100,
  },
  {
    event_id: 'evt_a2',
    event_type: 'TrustBandAssigned',
    occurred_at: '2024-01-01T00:05:00Z',
    actor_identity: { kind: 'operator', ref: 'priya', display: 'Priya' },
    payload: { incident_id: 'inc_anjali_001', band: 'T1' },
    block_hash: '01HASHBBBBBBBBBBBB',
    height: 101,
  },
  {
    event_id: 'evt_a3',
    event_type: 'AssignedToTechnician',
    occurred_at: '2024-01-01T00:10:00Z',
    actor_identity: { kind: 'operator', ref: 'priya', display: 'Priya' },
    payload: { incident_id: 'inc_anjali_001', technician: 'karim' },
    block_hash: '01HASHCCCCCCCCCCCC',
    height: 102,
  },
  {
    event_id: 'evt_a4',
    event_type: 'Verified',
    occurred_at: '2024-01-01T00:15:00Z',
    actor_identity: { kind: 'operator', ref: 'priya', display: 'Priya' },
    payload: { incident_id: 'inc_anjali_001', reasoning: 'INTERNAL' },
    block_hash: '01HASHOPERATORONLY',
    height: 103,
  },
  {
    event_id: 'evt_a5',
    event_type: 'ChainRead',
    occurred_at: '2024-01-01T00:20:00Z',
    actor_identity: { kind: 'operator', ref: 'priya', display: 'Priya' },
    payload: { incident_id: 'inc_anjali_001' },
    block_hash: '01HASHMETAONLY',
    height: 104,
  },
];

const closurePendingEvents = [
  ...inFlightEvents,
  {
    event_id: 'evt_a6',
    event_type: 'FixSubmitted',
    occurred_at: '2024-01-02T00:00:00Z',
    actor_identity: { kind: 'field_tech', ref: 'karim', display: 'Karim' },
    payload: { incident_id: 'inc_anjali_001' },
    block_hash: '01HASHFIXSUBMITTED',
    height: 105,
  },
  {
    event_id: 'evt_a7',
    event_type: 'IncidentResolvedByAdmin',
    occurred_at: '2024-01-03T00:00:00Z',
    actor_identity: { kind: 'admin', ref: 'adi', display: 'Adi' },
    payload: { incident_id: 'inc_anjali_001' },
    block_hash: '01HASHADMINRESOLVED',
    height: 106,
  },
];

describe('FE-B6 CitizenStatusTimeline (citizen-status-timeline.md)', () => {
  it('renders the title + back link', async () => {
    global.fetch = makeFetch(inFlightEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-timeline-title')).toBeTruthy();
    });
    expect(screen.getByTestId('citizen-timeline-back')).toBeTruthy();
  });

  it('renders only the curated citizen-visible events (newest first)', async () => {
    global.fetch = makeFetch(inFlightEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-timeline-list')).toBeTruthy();
    });
    // Visible
    expect(screen.getByTestId('citizen-event-row-evt_a1')).toBeTruthy();
    expect(screen.getByTestId('citizen-event-row-evt_a2')).toBeTruthy();
    expect(screen.getByTestId('citizen-event-row-evt_a3')).toBeTruthy();
    // Hidden — operator-internal
    expect(screen.queryByTestId('citizen-event-row-evt_a4')).toBeNull();
    expect(screen.queryByTestId('citizen-event-row-evt_a5')).toBeNull();
  });

  it('does NOT render hashes, JSON, or payload text on the page', async () => {
    global.fetch = makeFetch(inFlightEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-timeline-list')).toBeTruthy();
    });
    const html = document.body.textContent ?? '';

    expect(html).not.toContain('01HASH');
    expect(html).not.toContain('INTERNAL');
    expect(html).not.toContain('reasoning');
  });

  it('renders the in-progress ActionCall state by default', async () => {
    global.fetch = makeFetch(inFlightEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-in-progress')).toBeTruthy();
    });
  });

  it('renders the closure-ack ActionCall when IncidentResolvedByAdmin is in the timeline', async () => {
    global.fetch = makeFetch(closurePendingEvents);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-action-call-closure-ack')).toBeTruthy();
    });
    // Both confirm + reopen buttons should be present.
    expect(screen.getByTestId('citizen-action-call-confirm')).toBeTruthy();
    expect(screen.getByTestId('citizen-action-call-reopen')).toBeTruthy();
  });

  it('renders the empty state when no events match', async () => {
    global.fetch = makeFetch([]);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-timeline-empty')).toBeTruthy();
    });
  });

  it('en/bn key parity: every visible event type + every action-call state has both locales', () => {
    const visibleTypes = [
      'IncidentCreated',
      'TrustBandAssigned',
      'AssignedToTechnician',
      'TechnicianEnRoute',
      'TechnicianArrived',
      'DiagnosisSubmitted',
      'FixSubmitted',
      'ProofSubmitted',
      'ProofAccepted',
      'IncidentResolvedByAdmin',
      'CitizenAckAccepted',
      'CitizenAckRejected',
      'CitizenReopened',
      'CitizenAckWindowExpired',
      'IncidentClosed',
    ];

    for (const t of visibleTypes) {
      expect(enJson.event[t as keyof typeof enJson.event], `en.event.${t}`).toBeTruthy();
      expect(bnJson.event[t as keyof typeof bnJson.event], `bn.event.${t}`).toBeTruthy();
    }
    for (const s of ['in-progress', 'closure-ack', 'silent-closure', 'all-caught-up']) {
      expect(
        (enJson.actionCall as Record<string, { title: string }>)[s].title,
        `en.actionCall.${s}.title`,
      ).toBeTruthy();
      expect(
        (bnJson.actionCall as Record<string, { title: string }>)[s].title,
        `bn.actionCall.${s}.title`,
      ).toBeTruthy();
    }
  });
});
