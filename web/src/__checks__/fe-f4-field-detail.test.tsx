/**
 * fe-f4-field-detail.test.tsx — /field/incident-detail Karim work-order page.
 *
 * Pins the I/O matrix from spec-fe-f4-field-detail.md:
 *   1) role_gate_blocks_non_field_tech — non-tech sees "Field-tech only" empty state.
 *   2) missing_work_order_id_renders_not_found — empty ?work_order= renders not-found.
 *   3) no_matching_event_renders_not_found — bogus work_order renders not-found.
 *   4) renders_step_timeline_assigned — page renders the 5-step ladder.
 *   5) initial_action_card_is_mark_arrived — onsite step is the default.
 *   6) onsite_submit_calls_techArrived — fires TechnicianArrived.
 *   7) diagnosis_step_renders_when_arrived_event_present — advances step.
 *   8) fix_step_renders_when_diagnosis_event_present — advances step.
 *   9) resolved_step_renders_when_fix_or_resolved_event_present — terminal state.
 *
 * Composition pattern matches F3: stub AppLayoutContext for the
 * session, mock useIncidentActions via vi.mock. Global fetch is
 * stubbed to return the events feed shaped to drive each test.
 */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FieldIncidentDetailPage } from '../pages/FieldIncidentDetailPage';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import type { UseIncidentActionsResult } from '../hooks/useIncidentActions';

function makeSession(role: string): SessionRow {
  return {
    actor_id: 'karim-001',
    actor_ref: 'karim-001',
    display_name: 'Karim — Field Technician',
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

interface EventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
}

const ASSIGNED_EVT: EventLite = {
  event_id: 'evt_assigned_001',
  event_type: 'TechnicianAssigned',
  occurred_at: '2024-01-01T10:00:00.000Z',
  actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
  payload: {
    incident_id: 'inc_test_001',
    technician_id: 'karim-001',
    priority: 'P2',
    eta_target_minutes: 30,
    work_order_summary: 'Replace chlorine pump #4',
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

let fixtureEvents: EventLite[] = [ASSIGNED_EVT];

vi.mock('../hooks/useIncidentActions', () => {return {
  useIncidentActions: () => currentActions,
}});

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: fixtureEvents }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  fixtureEvents = [ASSIGNED_EVT];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

function renderPage(role: string, workOrderId: string) {
  const search = workOrderId ? `?work_order=${workOrderId}` : '';
  const path = `/field/incident-detail${search}`;

  return render(
    <LocaleProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppLayoutContext.Provider
            value={{
              session: makeSession(role),
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <Routes>
              <Route path="/field/incident-detail" element={<FieldIncidentDetailPage />} />
            </Routes>
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </ToastProvider>
    </LocaleProvider>,
  );
}

describe('FE-F4 FieldIncidentDetailPage role gate', () => {
  // (1) Non-tech sees "Field-tech only" empty state.
  it('role_gate_blocks_non_field_tech: Priya sees Field-tech only', async () => {
    renderPage('utility_operator', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByText('Field-tech only')).toBeTruthy();
    });
    expect(screen.queryByTestId('field-detail-title')).toBeNull();
  });
});

describe('FE-F4 FieldIncidentDetailPage loading + missing', () => {
  // (2) Empty work_order renders not-found.
  it('missing_work_order_id_renders_not_found', async () => {
    renderPage('field_technician', '');
    await waitFor(() => {
      expect(screen.getByText('Work order not found')).toBeTruthy();
    });
  });

  // (3) Bogus work_order renders not-found.
  it('no_matching_event_renders_not_found', async () => {
    renderPage('field_technician', 'evt_bogus');
    await waitFor(() => {
      expect(screen.getByText('Work order not found')).toBeTruthy();
    });
  });
});

describe('FE-F4 FieldIncidentDetailPage step ladder', () => {
  // (4) Page renders the 5-step ladder with assigned as the active
  //     step (because there's no en-route / arrived / diagnosis /
  //     fix event yet).
  it('renders_step_timeline_assigned: 5 steps visible, first is active', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-detail-title')).toBeTruthy();
    });
    expect(screen.getByTestId('field-step-assigned')).toBeTruthy();
    expect(screen.getByTestId('field-step-onsite')).toBeTruthy();
    expect(screen.getByTestId('field-step-diagnosis')).toBeTruthy();
    expect(screen.getByTestId('field-step-fix')).toBeTruthy();
    expect(screen.getByTestId('field-step-resolved')).toBeTruthy();
    // First step is done (work dispatched), onsite is active (next
    // action is "Mark arrived on site").
    const assigned = screen.getByTestId('field-step-assigned');
    const onsite = screen.getByTestId('field-step-onsite');

    expect(assigned.className).toContain('verify-step--done');
    expect(onsite.className).toContain('verify-step--active');
  });
});

describe('FE-F4 FieldIncidentDetailPage step transitions', () => {
  // (5) Default action card is "Mark arrived on site".
  it('initial_action_card_is_mark_arrived: onsite card visible by default', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-step-onsite-card')).toBeTruthy();
    });
    expect(screen.getByTestId('field-mark-arrived')).toBeTruthy();
  });

  // (6) Clicking "Mark arrived" calls techArrived with the full payload.
  it('onsite_submit_calls_techArrived: post is dispatched', async () => {
    const techArrived = vi.fn(async () => true);

    currentActions = { ...currentActions, techArrived };
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-mark-arrived')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('field-mark-arrived'));
    });

    await waitFor(() => {
      expect(techArrived).toHaveBeenCalledTimes(1);
    });
    const calls = techArrived.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({
      incident_id: 'inc_test_001',
      technician_id: 'karim-001',
    });
  });

  // (7) When the chain has a TechnicianArrived event for this incident,
  //     the page renders the diagnosis card.
  it('diagnosis_step_renders_when_arrived_event_present: advances to fix-card-on-ack', async () => {
    fixtureEvents = [
      ASSIGNED_EVT,
      {
        event_id: 'evt_arrived_001',
        event_type: 'TechnicianArrived',
        occurred_at: '2024-01-01T10:05:00.000Z',
        actor_identity: { kind: 'technician', ref: 'karim-001', display: 'Karim' },
        payload: { incident_id: 'inc_test_001', technician_id: 'karim-001' },
      },
    ];
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-step-diagnosis-card')).toBeTruthy();
    });
    expect(screen.getByTestId('field-diagnosis-form')).toBeTruthy();
    // Submit disabled at start.
    expect((screen.getByTestId('field-submit-diagnosis') as HTMLButtonElement).disabled).toBe(true);
  });

  // (8) When the chain has a DiagnosisSubmitted event, the page renders
  //     the fix form.
  it('fix_step_renders_when_diagnosis_event_present: fix card visible', async () => {
    fixtureEvents = [
      ASSIGNED_EVT,
      {
        event_id: 'evt_arrived_001',
        event_type: 'TechnicianArrived',
        occurred_at: '2024-01-01T10:05:00.000Z',
        actor_identity: { kind: 'technician', ref: 'karim-001', display: 'Karim' },
        payload: { incident_id: 'inc_test_001', technician_id: 'karim-001' },
      },
      {
        event_id: 'evt_diag_001',
        event_type: 'DiagnosisSubmitted',
        occurred_at: '2024-01-01T10:10:00.000Z',
        actor_identity: { kind: 'technician', ref: 'karim-001', display: 'Karim' },
        payload: {
          incident_id: 'inc_test_001',
          technician_id: 'karim-001',
          diagnosis: 'Pump #4 dead — needs replacement',
        },
      },
    ];
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-step-fix-card')).toBeTruthy();
    });
    expect(screen.getByTestId('field-fix-form')).toBeTruthy();
  });

  // (9) When the chain has a FixSubmitted or IncidentResolved event,
  //     the page renders the operator-confirm card.
  it('resolved_step_renders_when_fix_or_resolved_event_present: terminal card visible', async () => {
    fixtureEvents = [
      ASSIGNED_EVT,
      {
        event_id: 'evt_fix_001',
        event_type: 'FixSubmitted',
        occurred_at: '2024-01-01T11:00:00.000Z',
        actor_identity: { kind: 'technician', ref: 'karim-001', display: 'Karim' },
        payload: {
          incident_id: 'inc_test_001',
          technician_id: 'karim-001',
          fix_summary: 'Replaced pump #4',
        },
      },
    ];
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-step-resolved-card')).toBeTruthy();
    });
    expect(screen.getByTestId('field-resolve')).toBeTruthy();
  });
});
