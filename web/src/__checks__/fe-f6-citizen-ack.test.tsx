/**
 * fe-f6-citizen-ack.test.tsx — /ack/:incident_id citizen ack page.
 *
 * Pins the I/O matrix from spec-fe-f6-citizen-ack.md:
 *   1) role_gate_blocks_non_anjali — non-anjali sees "Wrong persona".
 *   2) missing_incident_id_renders_not_found — no match in useIncidents.
 *   3) page_renders_decision_card_when_incident_known — initial form.
 *   4) approve_calls_citizenAcknowledge_with_true — wire contract.
 *   5) dispute_calls_citizenAcknowledge_with_false — wire contract.
 *   6) approve_success_renders_receipt — submitted card.
 *   7) dispute_success_renders_receipt — submitted card with DISPUTED.
 *
 * Composition mirrors F4: stub AppLayoutContext, mock
 * useIncidentActions + useIncidents (so the page renders directly
 * without MSW), stub global.fetch to return the ack-events feed.
 */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { CitizenAckPage } from '../pages/CitizenAckPage';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import type { UseIncidentActionsResult } from '../hooks/useIncidentActions';
import i18n from '../i18n';

function makeSession(role: string): SessionRow {
  return {
    actor_id: `${role}-001`,
    actor_ref: `${role}-001`,
    display_name: role === 'anjali' ? 'Anjali Devi' : 'Priya',
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

interface IncidentRow {
  incident_id: string;
  status: string;
  severity: string;
  ward_id?: string;
  last_block_height: number;
  last_event_type: string;
  last_occurred_at: string;
}

const INCIDENT: IncidentRow = {
  incident_id: 'inc_ack_001',
  status: 'resolved',
  severity: 'T2',
  ward_id: 'W04',
  last_block_height: 50,
  last_event_type: 'IncidentResolved',
  last_occurred_at: '2024-01-01T12:00:00.000Z',
};

const ACK_REQUEST_EVENT = {
  event_id: 'evt_ackreq_001',
  event_type: 'CitizenAckRequested',
  occurred_at: '2024-01-01T12:05:00.000Z',
  actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
  payload: {
    incident_id: 'inc_ack_001',
    channel: 'whatsapp',
    summary: 'Please confirm your tap water is now safe.',
  },
};

let currentActions: UseIncidentActionsResult = {
  busy: false,
  lastError: null,
  post: vi.fn(async () => {return { event_id: '01STUB' }}),
  assignTech: vi.fn(async () => true),
  requestAck: vi.fn(async () => true),
  submitReport: vi.fn(async () => true),
  techArrived: vi.fn(async () => true),
  techDiagnosis: vi.fn(async () => true),
  techFix: vi.fn(async () => true),
  resolveIncident: vi.fn(async () => true),
  citizenAcknowledge: vi.fn(async () => true),
  markReviewed: vi.fn(async () => true),
};

let fixtureIncidents: IncidentRow[] = [INCIDENT];
let fixtureAckEvents: { events: typeof ACK_REQUEST_EVENT[] } = { events: [ACK_REQUEST_EVENT] };

vi.mock('../hooks/useIncidentActions', () => {return {
  useIncidentActions: () => currentActions,
}});

vi.mock('../hooks/useIncidents', () => {return {
  useIncidents: () => {return {
    incidents: fixtureIncidents,
    loading: false,
    error: null,
  }},
}});

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
    if (u.includes('CitizenAckRequested')) {
      return new Response(JSON.stringify(fixtureAckEvents), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  fixtureIncidents = [INCIDENT];
  fixtureAckEvents = { events: [ACK_REQUEST_EVENT] };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

function renderAck(role: string, incidentId: string) {
  const path = incidentId ? `/ack/${incidentId}` : '/ack';

  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={[path]}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: makeSession(role),
                chainHead: null,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <Routes>
                <Route path="/ack/:incident_id" element={<CitizenAckPage />} />
                <Route path="/ack" element={<CitizenAckPage />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('FE-F6 /ack/:incident_id role gate', () => {
  // (1) Non-anjali sees "Wrong persona".
  it('role_gate_blocks_non_anjali: Priya sees Wrong persona', () => {
    renderAck('utility_operator', 'inc_ack_001');
    expect(screen.getByText('Wrong persona')).toBeTruthy();
    expect(screen.queryByTestId('ack-decision-card')).toBeNull();
  });
});

describe('FE-F6 /ack/:incident_id initial form', () => {
  // (2) Missing incident renders not-found.
  it('missing_incident_id_renders_not_found: empty fixture', () => {
    fixtureIncidents = [];
    renderAck('anjali', 'inc_ack_001');
    expect(screen.getByText('Incident not found')).toBeTruthy();
  });

  // (3) Initial form renders with the operator's notice copy.
  it('page_renders_decision_card_when_incident_known', async () => {
    renderAck('anjali', 'inc_ack_001');
    await waitFor(() => {
      expect(screen.getByTestId('ack-page-title')).toBeTruthy();
    });
    expect(screen.getByTestId('ack-notice-card')).toBeTruthy();
    expect(screen.getByTestId('ack-notice-body').textContent).toContain('Please confirm');
    expect(screen.getByTestId('ack-decision-card')).toBeTruthy();
    expect(screen.getByTestId('ack-approve')).toBeTruthy();
    expect(screen.getByTestId('ack-dispute')).toBeTruthy();
  });
});

describe('FE-F6 /ack/:incident_id decision', () => {
  // (4) Approve fires citizenAcknowledge with approve=true.
  it('approve_calls_citizenAcknowledge_with_true', async () => {
    const citizenAcknowledge = vi.fn(async () => true);

    currentActions = { ...currentActions, citizenAcknowledge };
    renderAck('anjali', 'inc_ack_001');
    await waitFor(() => {
      expect(screen.getByTestId('ack-approve')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('ack-approve'));
    });

    await waitFor(() => {
      expect(citizenAcknowledge).toHaveBeenCalledTimes(1);
    });
    const calls = citizenAcknowledge.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({
      incident_id: 'inc_ack_001',
      method: 'whatsapp',
      approve: true,
    });
  });

  // (5) Dispute fires citizenAcknowledge with approve=false.
  it('dispute_calls_citizenAcknowledge_with_false', async () => {
    const citizenAcknowledge = vi.fn(async () => true);

    currentActions = { ...currentActions, citizenAcknowledge };
    renderAck('anjali', 'inc_ack_001');
    await waitFor(() => {
      expect(screen.getByTestId('ack-dispute')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('ack-dispute'));
    });

    await waitFor(() => {
      expect(citizenAcknowledge).toHaveBeenCalledTimes(1);
    });
    const calls = citizenAcknowledge.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({
      incident_id: 'inc_ack_001',
      method: 'whatsapp',
      approve: false,
    });
  });
});

describe('FE-F6 /ack/:incident_id submitted state', () => {
  // (6) Approve success renders APPROVED receipt.
  it('approve_success_renders_receipt', async () => {
    renderAck('anjali', 'inc_ack_001');
    await waitFor(() => {
      expect(screen.getByTestId('ack-approve')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('ack-approve'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('ack-submitted-card')).toBeTruthy();
    });
    expect(screen.getByText('APPROVED')).toBeTruthy();
    expect(screen.getByText('You approved the fix')).toBeTruthy();
    expect(screen.queryByTestId('ack-decision-card')).toBeNull();
  });

  // (7) Dispute success renders DISPUTED receipt.
  it('dispute_success_renders_receipt', async () => {
    renderAck('anjali', 'inc_ack_001');
    await waitFor(() => {
      expect(screen.getByTestId('ack-dispute')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('ack-dispute'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('ack-submitted-card')).toBeTruthy();
    });
    expect(screen.getByText('DISPUTED')).toBeTruthy();
    expect(screen.getByText('You disputed the fix')).toBeTruthy();
  });
});
