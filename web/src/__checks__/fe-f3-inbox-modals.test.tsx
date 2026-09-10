/**
 * fe-f3-inbox-modals.test.tsx — InboxDetail Assign + Ack modals.
 *
 * Pins the I/O matrix from spec-fe-f3-inbox-modals.md:
 *   1) header buttons render on a valid incident detail page.
 *   2) Assign click opens the modal with the tech roster.
 *   3) Assign submit calls actions.assignTech with the full payload.
 *   4) Assign submit disables the form when summary < 5 chars or eta <= 0.
 *   5) Assign modal closes on cancel.
 *   6) Request-ack click opens the modal with channel + summary.
 *   7) Request-ack submit calls actions.requestAck with channel + summary.
 *   8) Request-ack submit disables the form until summary >= 5 chars.
 *
 * Composition pattern mirrors fe-b5g + fe-f2: stub AppLayoutContext for
 * the session and stub useIncidentActions so the test does not touch
 * the MSW event-envelope contract (that's covered by F1).
 *
 * Mocking useIncidents + fetch('/api/events') avoids the page's
 * loading-guard; we render with the page-ready flag flipped on.
 */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InboxDetail } from '../pages/InboxDetail';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import type { SessionRow } from '../mocks/idb';
import type { UseIncidentActionsResult } from '../hooks/useIncidentActions';

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

interface IncidentRow {
  incident_id: string;
  severity: 'T1' | 'T2' | 'T3';
  ward_id: string;
  status: string;
  last_block_height: number;
  last_event_type: string;
}

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

const incidentsFixture: IncidentRow[] = [
  {
    incident_id: 'inc_test_001',
    severity: 'T2',
    ward_id: 'W04',
    status: 'open',
    last_block_height: 12,
    last_event_type: 'IncidentCreated',
  },
];

vi.mock('../hooks/useIncidentActions', () => {return {
  useIncidentActions: () => currentActions,
}});

vi.mock('../hooks/useIncidents', () => {return {
  useIncidents: () => {return {
    incidents: incidentsFixture,
    loading: false,
    error: null,
  }},
}});

// Stub fetch('/api/events?limit=200') so the page's timeline feed
// loads empty without hitting MSW. The test cares about modal wires,
// not the timeline contents.
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

function renderInboxDetail() {
  return render(
    <LocaleProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/inbox/inc_test_001']}>
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
    </LocaleProvider>,
  );
}

describe('FE-F3 InboxDetail modals', () => {
  // (1) Header CTA buttons render on a valid incident.
  it('header_buttons_render: Assign + Request-ack CTAs are visible', () => {
    renderInboxDetail();
    expect(screen.getByTestId('inbox-assign-tech')).toBeTruthy();
    expect(screen.getByTestId('inbox-request-ack')).toBeTruthy();
  });

  // (2) Click Assign opens the modal with the tech roster.
  it('assign_click_opens_modal: tech roster + priority + eta + summary', () => {
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-assign-tech'));

    const modal = screen.getByTestId('assign-tech-modal');

    expect(modal).toBeTruthy();
    expect(screen.getByTestId('assign-tech-tech')).toBeTruthy();
    expect(screen.getByTestId('assign-tech-priority')).toBeTruthy();
    expect(screen.getByTestId('assign-tech-eta')).toBeTruthy();
    expect(screen.getByTestId('assign-tech-summary')).toBeTruthy();

    const tech = screen.getByTestId('assign-tech-tech') as HTMLSelectElement;

    expect(tech.options.length).toBe(3);
    expect(tech.value).toBe('karim_actor');
    // Submit disabled at start.
    expect((screen.getByTestId('assign-tech-submit') as HTMLButtonElement).disabled).toBe(true);
  });

  // (3) Submit calls assignTech with the full payload.
  it('assign_submit_calls_assignTech_with_full_payload', async () => {
    const assignTech = vi.fn(async () => true);

    currentActions = { ...currentActions, assignTech };
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-assign-tech'));

    fireEvent.change(screen.getByTestId('assign-tech-tech'), {
      target: { value: 'sumi_actor' },
    });
    fireEvent.change(screen.getByTestId('assign-tech-priority'), {
      target: { value: 'P2' },
    });
    fireEvent.change(screen.getByTestId('assign-tech-eta'), {
      target: { value: '45' },
    });
    fireEvent.input(screen.getByTestId('assign-tech-summary'), {
      target: { value: 'Replace chlorine pump #4' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('assign-tech-submit'));
    });

    await waitFor(() => {
      expect(assignTech).toHaveBeenCalledTimes(1);
    });
    const calls = assignTech.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({
      incident_id: 'inc_test_001',
      technician_id: 'sumi_actor',
      technician_name: 'Sumi Akter',
      priority: 'P2',
      eta_target_minutes: 45,
      work_order_summary: 'Replace chlorine pump #4',
    });
  });

  // (4) Submit disabled when summary < 5 OR eta <= 0.
  it('assign_submit_disabled_until_summary_min_or_eta_invalid', () => {
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-assign-tech'));
    const submit = screen.getByTestId('assign-tech-submit') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);

    // Short summary — still disabled.
    fireEvent.input(screen.getByTestId('assign-tech-summary'), {
      target: { value: 'hi' },
    });
    expect(submit.disabled).toBe(true);

    // Valid summary, invalid ETA — disabled.
    fireEvent.input(screen.getByTestId('assign-tech-summary'), {
      target: { value: 'Replace chlorine pump #4' },
    });
    fireEvent.change(screen.getByTestId('assign-tech-eta'), {
      target: { value: '0' },
    });
    expect(submit.disabled).toBe(true);

    // Valid summary, valid ETA — enabled.
    fireEvent.change(screen.getByTestId('assign-tech-eta'), {
      target: { value: '30' },
    });
    expect(submit.disabled).toBe(false);
  });

  // (5) Cancel closes the assign modal.
  it('assign_cancel_closes_modal', async () => {
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-assign-tech'));
    expect(screen.getByTestId('assign-tech-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('assign-tech-cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('assign-tech-modal')).toBeNull();
    });
  });

  // (6) Click Request-ack opens the modal with channel + summary.
  it('ack_click_opens_modal: channel selector + summary textarea', () => {
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-request-ack'));

    const modal = screen.getByTestId('request-ack-modal');

    expect(modal).toBeTruthy();
    expect(screen.getByTestId('request-ack-channel')).toBeTruthy();
    expect(screen.getByTestId('request-ack-summary')).toBeTruthy();

    const channel = screen.getByTestId('request-ack-channel') as HTMLSelectElement;

    expect(channel.value).toBe('sms');
    expect((screen.getByTestId('request-ack-submit') as HTMLButtonElement).disabled).toBe(true);
  });

  // (7) Submit calls requestAck with channel + summary.
  it('ack_submit_calls_requestAck_with_payload', async () => {
    const requestAck = vi.fn(async () => true);

    currentActions = { ...currentActions, requestAck };
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-request-ack'));

    fireEvent.change(screen.getByTestId('request-ack-channel'), {
      target: { value: 'whatsapp' },
    });
    fireEvent.input(screen.getByTestId('request-ack-summary'), {
      target: { value: 'Please confirm your tap water is now safe.' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('request-ack-submit'));
    });

    await waitFor(() => {
      expect(requestAck).toHaveBeenCalledTimes(1);
    });
    const calls = requestAck.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({
      incident_id: 'inc_test_001',
      channel: 'whatsapp',
      summary: 'Please confirm your tap water is now safe.',
    });
  });

  // (8) Submit disabled until summary >= 5 chars.
  it('ack_submit_disabled_until_summary_min', () => {
    renderInboxDetail();
    fireEvent.click(screen.getByTestId('inbox-request-ack'));
    const submit = screen.getByTestId('request-ack-submit') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    fireEvent.input(screen.getByTestId('request-ack-summary'), {
      target: { value: 'hi' },
    });
    expect(submit.disabled).toBe(true);
    fireEvent.input(screen.getByTestId('request-ack-summary'), {
      target: { value: 'Please confirm your tap water is now safe.' },
    });
    expect(submit.disabled).toBe(false);
  });
});
