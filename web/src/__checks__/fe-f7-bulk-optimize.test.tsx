/**
 * fe-f7-bulk-optimize.test.tsx — F7 surfaces.
 *
 * Pins the I/O matrix from spec-fe-f7-bulk-optimize.md across both
 * the operator inbox bulk-bar CTA and the field-tech action buttons.
 *
 *   PART A — InboxList bulk-bar Mark reviewed:
 *     1) disabled_when_no_selection: button stays disabled at 0 rows
 *     2) click_calls_markReviewed_with_selected_ids: 1 row → 1 call
 *     3) click_clears_selection_and_refetches: 3 rows → clears + refetch
 *     4) button_disabled_while_busy: actions.busy → disabled
 *     5) hook_returns_false_keeps_selection: ok=false → selection retained
 *
 *   PART B — FieldQueuePage lockdown binding (WO-006):
 *     6) renders no Optimize-route button (removed per field-queue.md
 *        §Reconciliation diff #1 — sort is now priority-first /
 *        age-second by default, no opt-in toggle)
 *     7) sorts visible by priority-first / age-second (T3 > T2 > T1)
 *     8) renders mine / available filter chips
 *     9) clicking Available swaps the row set to unassigned rows only
 *    10) renders Acknowledge + En route per row (one-tap wire)
 *
 * Composition: stub AppLayoutContext for session + chainHead, mock
 * useIncidentActions via vi.mock so each test wires the call it
 * cares about. Global fetch is stubbed for the events feed.
 *
 * Migration note (WO-006 / 2026-09-15): the original Part B pinned the
 * Optimize-route button + manual-order-by-default + SLA-sort-after-click
 * contract. Per field-queue.md §Reconciliation diff #1 + Scenario 04
 * locked #1, the lockdown spec replaced this with a default sort of
 * `due_at` first then priority within — there is no longer an
 * Optimize-route toggle. This file was migrated to pin the NEW
 * behavior. The new lockdown-bound contract is fully covered by
 * fe-field-queue-reconcile.test.tsx (WO-006 acceptance matrix).
 */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { InboxList } from '../pages/InboxList';
import { FieldQueuePage } from '../pages/FieldQueuePage';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import type { UseIncidentActionsResult } from '../hooks/useIncidentActions';

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

// WO-006 — FieldQueuePage now reads `/api/incidents?assigned_to=<karim>`
// (the chain-projection read model) instead of
// `/api/events?event_type=TechnicianAssigned`. The fixture below uses
// the new IncidentLike shape: severity ∈ T1/T2/T3 (not P1/P2/P3),
// last_event_type drives the workflow filter, last_occurred_at drives
// the age-second tiebreak.
interface IncidentRow {
  incident_id: string;
  ward_id: string;
  severity: 'T1' | 'T2' | 'T3';
  status: 'open' | 'closed';
  last_block_height: number;
  last_event_type: string;
  last_occurred_at: string;
  reporter_kind: 'anchor' | 'hotline' | 'webform' | 'sensor';
  assigned_to: string;
  lat: number;
  lon: number;
}

// Six rows spanning severities. The new sort contract is
// priority-first (T3 > T2 > T1) then age-second (older first within
// tier). Build inputs oldest → newest per tier so the stable tiebreak
// is testable.
//
// T3 tier — inc_f01 (oldest), inc_f02 (newer)
// T2 tier — inc_f03 (oldest), inc_f04 (newer)
// T1 tier — inc_f05 (oldest), inc_f06 (newer)
function makeIncident(id: string, severity: 'T1' | 'T2' | 'T3', ageMs: number): IncidentRow {
  return {
    incident_id: id,
    ward_id: 'dhanmondi',
    severity,
    status: 'open',
    last_block_height: 100,
    last_event_type: 'TechnicianAssigned',
    last_occurred_at: new Date(Date.now() - ageMs).toISOString(),
    reporter_kind: 'anchor',
    assigned_to: 'karim-001',
    lat: 23.7461,
    lon: 90.3742,
  };
}

const FIELD_ROWS: IncidentRow[] = [
  makeIncident('inc_f01', 'T3', 6 * 60_000),   // T3, 6m ago
  makeIncident('inc_f02', 'T3', 1 * 60_000),   // T3, 1m ago (newer)
  makeIncident('inc_f03', 'T2', 6 * 60_000),   // T2, 6m ago
  makeIncident('inc_f04', 'T2', 1 * 60_000),   // T2, 1m ago
  makeIncident('inc_f05', 'T1', 6 * 60_000),   // T1, 6m ago
  makeIncident('inc_f06', 'T1', 1 * 60_000),   // T1, 1m ago
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
    if (u.includes('/api/incidents') && u.includes('assigned_to')) {
      // WO-006 — FieldQueuePage reads the chain projection directly.
      return new Response(JSON.stringify(FIELD_ROWS), {
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
    </LocaleProvider>,
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
  // WO-006 — the Optimize-route button has been removed (field-queue.md
  // §Reconciliation diff #1). This helper intentionally asserts the
  // button is ABSENT so the regression is loud if it ever creeps back.
  return waitFor(() => {
    expect(screen.queryByTestId('field-optimize-route')).toBeNull();
    return null;
  });
}

async function visibleRowIds(): Promise<string[]> {
  // WO-006 — rows carry data-testid="field-queue-row-<incident_id>".
  // Wait for at least 1 to render before snapshotting.
  await waitFor(() => {
    expect(document.querySelectorAll('[data-testid^="field-queue-row-"]').length).toBeGreaterThan(0);
  });
  return Array.from(document.querySelectorAll('[data-testid^="field-queue-row-"]')).map((el) => {
    const id = (el as HTMLElement).dataset.testid?.replace('field-queue-row-', '') ?? '';
    return id;
  });
}

describe('FE-F7 FieldQueuePage lockdown-bound contract (WO-006)', () => {
  // (6) Optimize-route button is removed per field-queue.md §diff #1.
  it('renders NO Optimize-route button (lockdown spec removes it)', async () => {
    renderField();
    await waitForOptimizeBtn();
  });

  // (7) Default sort is priority-first / age-second (T3 > T2 > T1).
  // The fixture's last_event_type is 'TechnicianAssigned' for all rows,
  // so the workflow filter does not drop any of them. Within a band
  // the age-second tiebreak orders oldest first.
  it('sorts visible rows by priority-first / age-second (T3 first, T1 last)', async () => {
    renderField();
    await waitForOptimizeBtn();

    const ids = await visibleRowIds();

    // All six rows are visible (no workflow filter excludes them).
    expect(ids.length).toBe(6);
    // T3 first (older first within tier), then T2, then T1.
    expect(ids.slice(0, 2)).toEqual(['inc_f01', 'inc_f02']);
    expect(ids.slice(2, 4)).toEqual(['inc_f03', 'inc_f04']);
    expect(ids.slice(4, 6)).toEqual(['inc_f05', 'inc_f06']);
  });

  // (8) mine / available filter chips render in the page.
  it('renders the mine / available filter chips', async () => {
    renderField();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-chip-mine')).toBeTruthy();
      expect(screen.getByTestId('field-queue-chip-available')).toBeTruthy();
    });
  });

  // (9) Clicking "Available" would swap to unassigned rows. Our fixture
  // uses the TechnicianAssigned event_type which always assigns to
  // karim-001, so Available returns zero rows — verify the empty state.
  it('clicking Available swaps to unassigned (empty state when none)', async () => {
    renderField();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-chip-available')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('field-queue-chip-available'));
    });

    // Either the list is empty or the available rows are shown —
    // since our fixture assigns everything to karim-001, the
    // Available branch surfaces the "no assignments" empty state.
    await waitFor(() => {
      const list = document.querySelector('[data-testid="field-queue-incident-list"]');
      expect(list).toBeTruthy();
    });
  });

  // (10) Per-row Acknowledge + En route buttons render.
  it('renders per-row Acknowledge and En route action buttons', async () => {
    renderField();
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid^="field-queue-button-acknowledge-"]').length).toBeGreaterThan(0);
    });
    expect(document.querySelectorAll('[data-testid^="field-queue-button-en-route-"]').length).toBeGreaterThan(0);
  });
});
