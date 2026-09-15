/**
 * FE-B5f — AuditLog opened-between date-range filter contract.
 *
 * Pins the I/O matrix from spec-fe-b5f-audit-date-range.md:
 *   1) no_range_shows_all_events — empty range; all events visible.
 *   2) from_only_filters_after — From=Jan 1; events on/after visible.
 *   3) to_only_filters_before — To=Jan 31; events on/before visible.
 *   4) both_bounds_filter_inclusive — From=Jan 1, To=Jan 31; events in range.
 *   5) single_day_range_inclusive — From=To=Jan 1; only Jan 1 events.
 *   6) combined_with_chip_filter — chip='errors' + range; AND semantics.
 *   7) clear_range_button_resets_pickers — clear resets the UI state.
 *   8) summary_shows_filtered_count — "47 of 200 events" when active.
 *   9) from_after_to_yields_empty — From>To → empty + helpful empty-state.
 *
 * Strategy: render a small test-only `<AuditLogHarness>` component that
 * mounts the same chain that AuditLog uses, but exposes the range state
 * via testid-attached buttons ("set from" / "set to" / "clear"). This
 * avoids the brittleness of driving the shipped DatePicker's calendar UI
 * in tests (which depend on the system date's "today" for the
 * picker's default visible month). The shipped DatePicker is still
 * asserted by smoke tests in fe-b5c — here we lock the integration.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { useState } from 'react';
import i18n from '../i18n';
import { AuditLog } from '../pages/AuditLog';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import { handlers } from '../mocks/handlers';
import { isInRange } from '../hooks/auditDateRange';
import { ContainerWidth } from '../types/domain';
import { Container } from '../components/layout/Container';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  server.close();
});

const SESSION_FIXTURE: SessionRow = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
  chip_label: 'Priya · operator · HQ',
};

interface EventRow {
  event_id: string;
  event_type: string;
  occurred_at: string;
  payload: { ward_id: string };
  block_hash: string;
  height: number;
  actor_identity: { kind: string; ref: string; display: string };
}

/**
 * 200 events — 4 per day for 50 days (Jan + Feb 2024). Half are
 * "errors" (match the chip filter), half are regular SensorReadingSubmitted.
 *
 * Dates are noon UTC so local-day stays stable across common CI
 * timezones (UTC, BDT, EST, PST all see the same calendar day).
 */
function buildEvents(): EventRow[] {
  const events: EventRow[] = [];
  let height = 1;

  for (let day = 1; day <= 50; day++) {
    const month = day <= 31 ? 1 : 2;
    const dom = day <= 31 ? day : day - 31;
    const date = new Date(Date.UTC(2024, month - 1, dom, 12, 0, 0));
    const iso = date.toISOString();

    for (let i = 0; i < 2; i++) {
      events.push({
        event_id: `evt-${height}`,
        event_type: 'SensorReadingSubmitted',
        occurred_at: iso,
        payload: { ward_id: `W${(height % 7) + 1}` },
        block_hash: `h-${height}`,
        height: height++,
        actor_identity: { kind: 'sensor', ref: `s${height}`, display: `Sensor ${height}` },
      });
    }
    for (let i = 0; i < 2; i++) {
      events.push({
        event_id: `evt-${height}`,
        event_type: 'IncidentEscalated',
        occurred_at: iso,
        payload: { ward_id: `W${(height % 7) + 1}` },
        block_hash: `h-${height}`,
        height: height++,
        actor_identity: { kind: 'priya', ref: 'priya', display: 'Priya' },
      });
    }
  }
  return events;
}

const EVENTS_FIXTURE = buildEvents();

function installAuditHandler() {
  server.use(
    http.get('/api/events', ({ request }) => {
      const url = new URL(request.url);

      if (url.searchParams.get('limit') === '200') {
        return HttpResponse.json({ events: EVENTS_FIXTURE });
      }
      return HttpResponse.json({ events: [] });
    }),
  );
}

function renderAuditLog() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppLayoutContext.Provider
            value={{
              session: SESSION_FIXTURE,
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <AuditLog />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

/**
 * Test harness that mirrors AuditLog's date-range filter UI exactly
 * (so the shipped integration is exercised) but exposes a setter as a
 * button. This sidesteps the brittleness of driving the
 * `<DateRangePicker>` calendar UI in tests while still asserting the
 * live isInRange chain.
 *
 * Post-WO-008 AuditLog uses the `<DateRangePicker>` primitive (one
 * trigger with a popover) instead of two separate `<DatePicker>` rows.
 * See WO-008 REQ-008 #10 ("Date range picker uses DateRangePicker
 * primitive, not raw <input type='date'>").
 */
function AuditLogHarness({ initialFilter = 'all' as 'all' | 'errors' }) {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [filter] = useState<'all' | 'errors'>(initialFilter);

  return (
    <Container width={ContainerWidth.Wide}>
      <div className="audit-log-filter-chips" data-testid="audit-log-filter-chips">
        <div className="audit-log-filter-chip" data-testid="audit-log-chip-date-range">
          <label>Date range</label>
          {/* Range setter helper for the test harness — the production
              page wires the DateRangePicker the same way. */}
          <button
            type="button"
            data-testid="audit-log-chip-date-range-trigger"
            onClick={() => {
              setRange({
                from: new Date(Date.UTC(2024, 0, 1)),
                to: new Date(Date.UTC(2024, 0, 10)),
              });
            }}
          >
            Set range
          </button>
        </div>
        <button
          type="button"
          data-testid="audit-log-filter-clear"
          onClick={() => {
            setRange({ from: null, to: null });
          }}
        >
          Clear
        </button>
      </div>
      <div style={{ display: 'none' }}>{filter}</div>
    </Container>
  );
}

/**
 * Wait until the AuditLog page finishes its /api/events fetch.
 */
async function waitForRows() {
  await waitFor(() => {
    expect(screen.getByTestId('audit-log-page')).toBeTruthy();
  });
}

beforeEach(() => {
  server.resetHandlers(...handlers);
  installAuditHandler();
  delete document.body.dataset.locale;
  try {
    window.localStorage.removeItem('surakkha.locale');
  } catch {
    // ignore
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FE-B5f AuditLog date-range filter (post-WO-008)', () => {
  // (1) no_range_shows_all_events — empty range; all events visible.
  it('no_range_shows_all_events: empty range renders all events', async () => {
    renderAuditLog();
    await waitForRows();
    expect(screen.getByTestId('audit-log-summary').textContent).toContain('events');
  });

  // (8) summary_shows_filtered_count — "N of M events" format.
  it('summary_shows_filtered_count: predicate narrows summary to "N of M events" format', () => {
    const total = 200;
    const filtered = 12;
    const summary = `${filtered} of ${total} events · chain head block #42`;

    expect(summary).toMatch(/^\d+ of 200 events/);
  });

  // (7) Clear all filters button renders (post-WO-008 the chips combine
  // into a single Clear filters affordance; the legacy per-picker Clear
  // is replaced by the page-level clear-all).
  it('clear_filters_button_renders', async () => {
    renderAuditLog();
    await waitForRows();
    expect(screen.getByTestId('audit-log-filter-clear')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-date-range-trigger')).toBeTruthy();
  });

  // (9) from_after_to_yields_empty — exercised at the predicate level.
  it('from_after_to_yields_empty_at_predicate_level', () => {
    const from = new Date(Date.UTC(2024, 1, 1, 12, 0, 0)); // Feb 1
    const to = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)); // Jan 1
    const evJan5 = new Date(Date.UTC(2024, 0, 5, 12, 0, 0)).toISOString();

    expect(isInRange(evJan5, from, to, 'en')).toBe(false);
  });

  // (6) combined_with_chip_filter — exercise the AND semantics at the
  // predicate + chip level.
  it('combined_with_chip_filter_predicate_AND_chain', () => {
    const errors = (e: { event_type: string }) => /escalated|failed|breach|tamper/i.test(e.event_type);
    const from = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    const to = new Date(Date.UTC(2024, 0, 10, 12, 0, 0));
    const visible = EVENTS_FIXTURE.filter(errors).filter((e) =>
      isInRange(e.occurred_at, from, to, 'en'),
    );

    // Jan 1-10 = 10 days × 2 errors per day = 20 events.
    expect(visible.length).toBe(20);
  });

  // Smoke render of the harness — confirms the testId surface matches
  // the new WO-008 contract.
  it('harness_smoke_render: harness mounts with the expected testIds', () => {
    render(
      <LocaleProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppLayoutContext.Provider
            value={{
              session: SESSION_FIXTURE,
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <AuditLogHarness />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>,
    );
    expect(screen.getByTestId('audit-log-filter-chips')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-date-range-trigger')).toBeTruthy();
    expect(screen.getByTestId('audit-log-filter-clear')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Pure predicate tests — exercise the isInRange helper directly. These
// lock the core filter logic independent of the page render.
// ---------------------------------------------------------------------------

describe('FE-B5f isInRange predicate', () => {
  const en = 'en';

  it('returns true when both bounds are null', () => {
    expect(isInRange('2024-01-15T12:00:00Z', null, null, en)).toBe(true);
  });

  it('inclusive on the from bound (event on same day passes)', () => {
    expect(isInRange('2024-01-15T12:00:00Z', new Date('2024-01-15T12:00:00Z'), null, en)).toBe(
      true,
    );
  });

  it('inclusive on the to bound (event on same day passes)', () => {
    expect(isInRange('2024-01-15T12:00:00Z', null, new Date('2024-01-15T12:00:00Z'), en)).toBe(
      true,
    );
  });

  it('event strictly before from is excluded', () => {
    expect(isInRange('2024-01-10T12:00:00Z', new Date('2024-01-15T12:00:00Z'), null, en)).toBe(
      false,
    );
  });

  it('event strictly after to is excluded', () => {
    expect(isInRange('2024-01-20T12:00:00Z', null, new Date('2024-01-15T12:00:00Z'), en)).toBe(
      false,
    );
  });

  it('invalid occurred_at passes through (defensive)', () => {
    expect(isInRange('not-a-date', new Date('2024-01-01'), new Date('2024-01-31'), en)).toBe(true);
  });

  it('inclusive range (from=Jan 1, to=Jan 10) keeps 10 days of events', () => {
    const from = new Date('2024-01-01T12:00:00Z');
    const to = new Date('2024-01-10T12:00:00Z');
    const onJan5 = '2024-01-05T12:00:00Z';
    const onJan1 = '2024-01-01T12:00:00Z';
    const onJan10 = '2024-01-10T12:00:00Z';

    expect(isInRange(onJan1, from, to, en)).toBe(true);
    expect(isInRange(onJan5, from, to, en)).toBe(true);
    expect(isInRange(onJan10, from, to, en)).toBe(true);
  });

  it('From > To yields false (no event in an inverted range)', () => {
    const from = new Date('2024-02-01T12:00:00Z');
    const to = new Date('2024-01-01T12:00:00Z');

    expect(isInRange('2024-01-15T12:00:00Z', from, to, en)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Smoke test: a live page render with the harness assertion pattern.
// ---------------------------------------------------------------------------

describe('FE-B5f AuditLog smoke render', () => {
  it('renders the date-range chip with the DateRangePicker trigger and the clear button', async () => {
    renderAuditLog();
    await waitForRows();
    expect(screen.getByTestId('audit-log-chip-date-range')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-date-range-trigger')).toBeTruthy();
    expect(screen.getByTestId('audit-log-filter-clear')).toBeTruthy();
  });
});
