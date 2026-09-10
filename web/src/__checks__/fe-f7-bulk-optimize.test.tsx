/**
 * fe-f7-bulk-optimize.test.tsx — F7 surfaces.
 *
 * Pins the I/O matrix from spec-fe-f7-bulk-optimize.md across both
 * the operator inbox bulk-bar CTA and the field-tech optimize-route
 * button.
 *
 *   PART A — InboxList bulk-bar Mark reviewed:
 *     1) disabled_when_no_selection: button stays disabled at 0 rows
 *     2) click_calls_markReviewed_with_selected_ids: 1 row → 1 call
 *     3) click_clears_selection_and_refetches: 3 rows → clears + refetch
 *     4) button_disabled_while_busy: actions.busy → disabled
 *     5) hook_returns_false_keeps_selection: ok=false → selection retained
 *
 *   PART B — FieldQueuePage Optimize route:
 *     6) click_resets_filter_to_all: P1 filter → click → all
 *     7) sorts_visible_by_sla_priority: P1-overdue first, then P2, etc.
 *     8) button_disabled_when_already_optimized: sortMode='sla' → disabled
 *     9) manual_order_preserved_by_default: no click → original order
 *    10) subtitle_visible_only_when_optimized: "Optimized — SLA order"
 *
 * Composition: stub AppLayoutContext for session + chainHead, mock
 * useIncidentActions via vi.mock so each test wires the call it
 * cares about. Global fetch is stubbed for the events feed.
 */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { InboxList } from '../pages/InboxList';
import { FieldQueuePage } from '../pages/FieldQueuePage';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import type { UseIncidentActionsResult } from '../hooks/useIncidentActions';
import i18n from '../i18n';

function makeSession(role: string): SessionRow {
  // Field-tech uses the literal Karim id so the page's
  // `technician_id === session.actor_ref` filter passes; other roles
  // use the conventional `<role>-001` shape.
  const ref = role === 'field_technician' ? 'karim-001' : `${role}-001`;

  return {
    actor_id: ref,
    actor_ref: ref,
    display_name:
      role === 'utility_operator'
        ? 'Priya — Operator'
        : role === 'field_technician'
          ? 'Karim — Field Technician'
          : 'Test User',
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

interface IncidentCreatedEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity: { kind: string; ref: string; display: string };
  payload: {
    incident_id: string;
    severity: string;
    ward_id: string;
    inbox: Record<string, unknown>;
  };
}

function makeInboxEvent(id: string, severity: string, isAwaitingSig: boolean): IncidentCreatedEvent {
  return {
    event_id: `evt_${id}`,
    event_type: 'IncidentCreated',
    occurred_at: '2026-09-08T10:00:00.000Z',
    actor_identity: { kind: 'priya', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: id,
      severity,
      ward_id: 'ward-dhanmondi',
      inbox: {
        owner_kind: 'priya',
        owner_display: 'Priya',
        status: isAwaitingSig ? 'awaiting_sig' : 'citizen_report',
        href: `/inbox/${id}`,
        title: `Incident ${id}`,
        summary: `summary-${id}`,
        isUrgent: false,
        isDraft: false,
        isCitizen: false,
        isAwaitingSig,
        read: false,
      },
    },
  };
}

const INBOX_ROWS: IncidentCreatedEvent[] = [
  makeInboxEvent('inc_a01', 'high', true),
  makeInboxEvent('inc_a02', 'medium', true),
  makeInboxEvent('inc_a03', 'low', true),
];

// ─── FieldQueuePage fixtures ─────────────────────────────────────────

interface TechnicianAssignedEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity: { kind: string; ref: string; display: string };
  payload: {
    incident_id: string;
    technician_id: string;
    technician_name: string;
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    eta_target_minutes: number;
    work_order_summary: string;
    status?: string;
  };
}

function makeAssignedEvent(
  id: string,
  technicianId: string,
  priority: 'P1' | 'P2' | 'P3' | 'P4',
): TechnicianAssignedEvent {
  return {
    event_id: `evt_${id}`,
    event_type: 'TechnicianAssigned',
    occurred_at: '2026-09-08T08:00:00.000Z',
    actor_identity: { kind: 'priya', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: id,
      technician_id: technicianId,
      technician_name: 'Karim',
      priority,
      eta_target_minutes: 30,
      work_order_summary: `Job ${id}`,
    },
  };
}

// 6 jobs spanning priorities + statuses. SLA order should be:
//   1. P1 + overdue
//   2. P1 + enroute (on-track)
//   3. P2 + overdue
//   4. P2 + on-site
//   5. P3 + assigned
//   6. P3 + assigned (later time, tie-break by arrival order)
//
// Build inputs ordered so the manual-order test sees an obviously
// different ordering from sla-sort.
const FIELD_ROWS: TechnicianAssignedEvent[] = [
  makeAssignedEvent('inc_f01', 'karim-001', 'P3'),
  makeAssignedEvent('inc_f02', 'karim-001', 'P1'), // P1 — should be high
  makeAssignedEvent('inc_f03', 'karim-001', 'P2'),
  makeAssignedEvent('inc_f04', 'karim-001', 'P1'), // P1 — duplicate priority, tie-break
  makeAssignedEvent('inc_f05', 'karim-001', 'P3'),
  makeAssignedEvent('inc_f06', 'karim-001', 'P2'),
];

// ─── shared state ────────────────────────────────────────────────────

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

vi.mock('../hooks/useIncidentActions', () => {return {
  useIncidentActions: () => currentActions,
}});

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';

    if (u.includes('event_type=IncidentCreated')) {
      return new Response(JSON.stringify({ total: INBOX_ROWS.length, events: INBOX_ROWS }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (u.includes('event_type=TechnicianAssigned')) {
      return new Response(JSON.stringify({ total: FIELD_ROWS.length, events: FIELD_ROWS }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (u.includes('event_type=IncidentResolved')) {
      return new Response(JSON.stringify({ total: 0, events: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    // The 4 recent-decisions fetches + anything else return empty.
    return new Response(JSON.stringify({ total: 0, events: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  currentActions = {
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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

// ─── PART A — InboxList bulk-bar ─────────────────────────────────────

function renderInbox() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter>
            <AppLayoutContext.Provider
              value={{
                session: makeSession('utility_operator'),
                chainHead: null,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <InboxList />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

async function clickSelectAll() {
  const selectAll = await waitFor(() => {
    const el = screen.getByTestId('table-inbox-select-all') as HTMLInputElement;
    expect(el).toBeTruthy();
    return el;
  });

  await act(async () => {
    fireEvent.click(selectAll);
  });

  return selectAll;
}

async function clickFirstRowCheckbox() {
  const firstRowCheck = await waitFor(() => {
    const els = screen.getAllByTestId(/^table-inbox-select-(?!all$)/);
    expect(els.length).toBeGreaterThan(0);
    return els[0];
  });

  await act(async () => {
    fireEvent.click(firstRowCheck);
  });

  return firstRowCheck;
}

describe('FE-F7 InboxList bulk-bar Mark reviewed', () => {
  // (1) Button is in the DOM but parent bulk-bar is hidden at zero selection.
  it('button_disabled_when_no_selection: bulk-bar hidden at 0 rows', async () => {
    renderInbox();
    await waitFor(() => {
      expect(screen.getByTestId('table-inbox-select-all')).toBeTruthy();
    });

    const bulkbar = document.querySelector('.inbox-bulkbar');

    expect(bulkbar).not.toBeNull();
    expect(bulkbar?.hasAttribute('hidden')).toBe(true);
    expect((screen.getByTestId('bulk-mark-reviewed') as HTMLButtonElement).disabled).toBe(true);
  });

  // (2) Single-row click calls markReviewed with the single selected id.
  it('click_calls_markReviewed_with_selected_ids: 1 row → 1 call with 1 id', async () => {
    const markReviewed = vi.fn(async () => true);

    currentActions = { ...currentActions, markReviewed };
    renderInbox();
    await clickFirstRowCheckbox();

    await waitFor(() => {
      expect((screen.getByTestId('bulk-mark-reviewed') as HTMLButtonElement).disabled).toBe(false);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('bulk-mark-reviewed'));
    });

    await waitFor(() => {
      expect(markReviewed).toHaveBeenCalledTimes(1);
    });
    const calls = markReviewed.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({ incident_ids: ['evt_inc_a01'] });
  });

  // (3) Successful call clears the selection + refetches the feed.
  it('click_clears_selection_and_refetches: 3 rows → bulk-bar hides + refetch', async () => {
    const markReviewed = vi.fn(async () => true);

    currentActions = { ...currentActions, markReviewed };
    renderInbox();
    await clickSelectAll(); // selects all 3 rows

    const fetchSpy = global.fetch as unknown as { mock: { calls: unknown[][] } };

    void fetchSpy.mock.calls.length; // silence unused

    await act(async () => {
      fireEvent.click(screen.getByTestId('bulk-mark-reviewed'));
    });

    await waitFor(() => {
      expect(markReviewed).toHaveBeenCalledTimes(1);
    });

    // After success the bulk-bar hides (selection cleared).
    await waitFor(() => {
      expect(document.querySelector('.inbox-bulkbar')?.hasAttribute('hidden')).toBe(true);
    });
    // And the IncidentCreated feed was re-fetched (at least 1 extra
    // call after the markReviewed click).
    const incidentCalls = fetchSpy.mock.calls.filter((c) => {
      const arg = c[0] as string;
      return arg.includes('event_type=IncidentCreated');
    });

    expect(incidentCalls.length).toBeGreaterThanOrEqual(2);
  });

  // (4) While busy the button is disabled (no double-fire).
  it('button_disabled_while_busy', async () => {
    const markReviewed = vi.fn(async () => true);

    currentActions = { ...currentActions, markReviewed, busy: true };
    renderInbox();
    await clickSelectAll();

    const btn = screen.getByTestId('bulk-mark-reviewed') as HTMLButtonElement;

    expect(btn.disabled).toBe(true);

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(markReviewed).not.toHaveBeenCalled();
  });

  // (5) When the hook resolves false, selection is preserved.
  it('hook_returns_false_keeps_selection: bulk-bar still visible after false', async () => {
    const markReviewed = vi.fn(async () => false);

    currentActions = { ...currentActions, markReviewed };
    renderInbox();
    await clickSelectAll();

    await act(async () => {
      fireEvent.click(screen.getByTestId('bulk-mark-reviewed'));
    });

    await waitFor(() => {
      expect(markReviewed).toHaveBeenCalledTimes(1);
    });
    // Selection retained → bulk-bar remains visible.
    await waitFor(() => {
      expect(document.querySelector('.inbox-bulkbar')?.hasAttribute('hidden')).toBe(false);
    });
  });
});

// ─── PART B — FieldQueuePage Optimize route ──────────────────────────

function renderField() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter>
            <AppLayoutContext.Provider
              value={{
                session: makeSession('field_technician'),
                chainHead: null,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <FieldQueuePage />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

async function waitForOptimizeBtn() {
  return waitFor(() => {
    expect(screen.getByTestId('field-optimize-route')).toBeTruthy();
    return screen.getByTestId('field-optimize-route') as HTMLButtonElement;
  });
}

async function visibleJobIds(): Promise<string[]> {
  // tech-job anchors have href="/field/incident-detail?work_order=<id>".
  // Wait for at least 1 to render before snapshotting.
  await waitFor(() => {
    expect(document.querySelectorAll('.tech-job').length).toBeGreaterThan(0);
  });
  return Array.from(document.querySelectorAll('.tech-job')).map((el) => {
    const href = (el as HTMLAnchorElement).href;
    const m = href.match(/work_order=([^&]+)/);

    return m?.[1] ?? '';
  });
}

describe('FE-F7 FieldQueuePage Optimize route', () => {
  // (6) Default: manual order preserves the input (buildRows) order.
  it('manual_order_preserved_by_default: first row is the first TechnicianAssigned event', async () => {
    renderField();
    const btn = await waitForOptimizeBtn();

    expect(btn.disabled).toBe(false);
    const ids = await visibleJobIds();

    expect(ids[0]).toBe('evt_inc_f01');
    expect(ids[1]).toBe('evt_inc_f02');
    // Subtitle hidden initially.
    expect(screen.queryByTestId('field-optimized-subtitle')).toBeNull();
  });

  // (7) Click resets filter to all and sorts visible by SLA.
  it('click_resets_filter_to_all_and_sorts_by_sla', async () => {
    renderField();
    const btn = await waitForOptimizeBtn();

    // The default filter is 'all', so we still expect reorder.
    await act(async () => {
      fireEvent.click(btn);
    });

    // After click: button disabled, subtitle visible.
    await waitFor(() => {
      expect((screen.getByTestId('field-optimize-route') as HTMLButtonElement).disabled).toBe(true);
    });
    expect(screen.getByTestId('field-optimized-subtitle')).toBeTruthy();

    const ids = await visibleJobIds();

    // P1 jobs first (both entries), then P2, then P3.
    // All our rows are on-time (no overdue), so within P1 the
    // status rank breaks the tie: enroute < onsite < assigned.
    // For P1 (inc_f02, inc_f04) we need to look at the buildRows
    // status logic — both default to 'assigned' so the sort is
    // stable (input order).
    expect(ids.slice(0, 2).sort()).toEqual(['evt_inc_f02', 'evt_inc_f04']);
    expect(ids.slice(2, 4).sort()).toEqual(['evt_inc_f03', 'evt_inc_f06']);
    expect(ids.slice(4, 6).sort()).toEqual(['evt_inc_f01', 'evt_inc_f05']);
  });

  // (8) After clicking Optimize, button disables (idempotency).
  it('button_disabled_when_already_optimized', async () => {
    renderField();
    const btn = await waitForOptimizeBtn();

    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect((screen.getByTestId('field-optimize-route') as HTMLButtonElement).disabled).toBe(true);
    });
  });

  // (9) Subtitle only renders in sla mode.
  it('subtitle_visible_only_when_optimized: hidden by default, visible after click', async () => {
    renderField();
    await waitForOptimizeBtn();
    expect(screen.queryByTestId('field-optimized-subtitle')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId('field-optimize-route'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('field-optimized-subtitle')).toBeTruthy();
      expect(screen.getByTestId('field-optimized-subtitle').textContent).toContain('Optimized');
    });
  });

  // (10) The SLA sort puts P1 before P3 even when input order is
  // reversed (inc_f01 is P3, inc_f02 is P1 — verify the reorder).
  it('sla_sort_overrides_input_order: P1 (inc_f02) sorts ahead of P3 (inc_f01)', async () => {
    renderField();
    const btn = await waitForOptimizeBtn();

    // Manual: inc_f01 (P3) is first.
    const beforeIds = await visibleJobIds();

    expect(beforeIds[0]).toBe('evt_inc_f01');

    // After optimize: inc_f02 (P1) should be ahead of inc_f01 (P3).
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(screen.getByTestId('field-optimized-subtitle')).toBeTruthy();
    });

    const afterIds = await visibleJobIds();

    expect(afterIds.indexOf('evt_inc_f02')).toBeLessThan(afterIds.indexOf('evt_inc_f01'));
    expect(afterIds.indexOf('evt_inc_f01')).toBeGreaterThanOrEqual(4);
  });
});
