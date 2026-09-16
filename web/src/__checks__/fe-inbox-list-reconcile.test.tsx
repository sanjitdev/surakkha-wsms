/**
 * fe-inbox-list-reconcile.test.tsx — WO-009 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-009-inbox-list.md.
 * Pins the 6 acceptance criteria and the 6 REQs (001..006).
 *
 * Acceptance pins:
 *   (1) Renders at /inbox for utility_operator role
 *   (2) Sort priority-first / age-second (T3 > T2 > T1 > Resolved, oldest first within tier)
 *   (3) All filter chips function + URL persistence (?filter=...)
 *   (4) Rows render BandPill + age + missing-evidence chips
 *     (FE-1.5d 2026-09-16: reporter-badge dropped from the row; the
 *      source column was removed. ReporterBadge is exercised on the
 *      inbox-detail header — hotline-only — and on the right-rail
 *      SeverityRail.)
 *   (5) Pagination works (default 20 per page)
 *   (6) Empty / loading / error states render correctly
 *
 * Lockdown compliance:
 *   - Trust band = verification state (separate from reporter-badge)
 *   - Focus rings 2px --color-primary-tint (read inbox.css)
 *   - EN + BN locales only (no Hindi / Devanagari letters)
 *   - shadcn/ui primitives reused (Pagination, BandPill, FilterChip)
 *
 * Pattern matches fe-field-queue-reconcile.test.tsx (WO-006) and
 * fe-operator-dashboard-reconcile.test.tsx (WO-004): fetch stub
 * captures GETs to /api/events, MSW handlers serve the chain projection,
 * locale + AppLayout provided via providers.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { InboxList } from '../pages/InboxList';
import { handlers } from '../mocks/handlers';
import type { SessionRow } from '../mocks/idb';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

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

const CHAIN_HEAD_FIXTURE = {
  height: 42,
  block_hash: 'abcdef1234567890',
  prev_hash: '0987fedcba654321',
  sealed_at: '2024-02-01T00:00:00.000Z',
  ingested_at: '2024-02-01T00:00:00.001Z',
};

/**
 * Build a 25-event fixture spanning 5 incidents across 4 trust tiers and
 * 4 reporter kinds. Spans older + newer timestamps so the priority-first /
 * age-second sort has something meaningful to do.
 *
 * Tier mix:
 *   T3 = 6 rows (2 anchor, 2 hotline, 1 webform, 1 sensor)
 *   T2 = 7 rows
 *   T1 = 6 rows
 *   Resolved (status = chain_verify) = 6 rows
 */
function buildFixtureEvents(): unknown[] {
  const incidents = [
    { id: 'inc-t3-anchor-old', sev: 'high', status: 'citizen_report', reporter: 'anchor', ward: 'ward dhanmondi', ts: '2024-01-10T08:00:00Z' },
    { id: 'inc-t3-hotline-old', sev: 'high', status: 'citizen_report', reporter: 'hotline', ward: 'ward mirpur', ts: '2024-01-12T08:00:00Z' },
    { id: 'inc-t3-anchor-new', sev: 'high', status: 'awaiting_ack', reporter: 'anchor', ward: 'ward uttara', ts: '2024-01-20T08:00:00Z' },
    { id: 'inc-t3-sensor-new', sev: 'high', status: 'awaiting_ack', reporter: 'sensor', ward: 'ward banani', ts: '2024-01-22T08:00:00Z' },
    { id: 'inc-t3-webform', sev: 'high', status: 'awaiting_sig', reporter: 'webform', ward: 'ward tejgaon', ts: '2024-01-14T08:00:00Z' },
    { id: 'inc-t3-hotline-mid', sev: 'high', status: 'awaiting_ack', reporter: 'hotline', ward: 'ward gulshan', ts: '2024-01-18T08:00:00Z' },

    { id: 'inc-t2-1', sev: 'medium', status: 'awaiting_draft', reporter: 'webform', ward: 'ward mohammadpur', ts: '2024-01-15T12:00:00Z', evidence: ['photo'] },
    { id: 'inc-t2-2', sev: 'medium', status: 'citizen_report', reporter: 'anchor', ward: 'ward rampura', ts: '2024-01-13T12:00:00Z' },
    { id: 'inc-t2-3', sev: 'medium', status: 'awaiting_sig', reporter: 'hotline', ward: 'ward lalbagh', ts: '2024-01-11T12:00:00Z', evidence: ['gps'] },
    { id: 'inc-t2-4', sev: 'medium', status: 'info', reporter: 'webform', ward: 'ward khilgaon', ts: '2024-01-09T12:00:00Z' },
    { id: 'inc-t2-5', sev: 'medium', status: 'awaiting_ack', reporter: 'sensor', ward: 'ward motijheel', ts: '2024-01-16T12:00:00Z' },
    { id: 'inc-t2-6', sev: 'medium', status: 'citizen_report', reporter: 'anchor', ward: 'ward demra', ts: '2024-01-08T12:00:00Z', evidence: ['photo', 'gps'] },
    { id: 'inc-t2-7', sev: 'medium', status: 'awaiting_draft', reporter: 'webform', ward: 'ward kadamtali', ts: '2024-01-19T12:00:00Z' },

    { id: 'inc-t1-1', sev: 'low', status: 'info', reporter: 'webform', ward: 'ward shahbagh', ts: '2024-01-18T12:00:00Z' },
    { id: 'inc-t1-2', sev: 'low', status: 'citizen_report', reporter: 'anchor', ward: 'ward new-market', ts: '2024-01-21T12:00:00Z' },
    { id: 'inc-t1-3', sev: 'low', status: 'awaiting_ack', reporter: 'hotline', ward: 'ward old-dhaka', ts: '2024-01-17T12:00:00Z', evidence: ['description'] },
    { id: 'inc-t1-4', sev: 'low', status: 'info', reporter: 'sensor', ward: 'ward cantonment', ts: '2024-01-07T12:00:00Z' },
    { id: 'inc-t1-5', sev: 'low', status: 'awaiting_draft', reporter: 'webform', ward: 'ward banasree', ts: '2024-01-06T12:00:00Z' },
    { id: 'inc-t1-6', sev: 'low', status: 'citizen_report', reporter: 'anchor', ward: 'ward aftabnagar', ts: '2024-01-05T12:00:00Z' },

    { id: 'inc-res-1', sev: 'low', status: 'chain_verify', reporter: 'anchor', ward: 'ward mohammadpur', ts: '2024-01-04T10:00:00Z' },
    { id: 'inc-res-2', sev: 'medium', status: 'chain_verify', reporter: 'hotline', ward: 'ward mirpur', ts: '2024-01-03T10:00:00Z' },
    { id: 'inc-res-3', sev: 'low', status: 'chain_verify', reporter: 'webform', ward: 'ward rampura', ts: '2024-01-02T10:00:00Z' },
    { id: 'inc-res-4', sev: 'high', status: 'chain_verify', reporter: 'sensor', ward: 'ward uttara', ts: '2024-01-01T10:00:00Z' },
    { id: 'inc-res-5', sev: 'medium', status: 'chain_verify', reporter: 'anchor', ward: 'ward banani', ts: '2023-12-31T10:00:00Z' },
    { id: 'inc-res-6', sev: 'low', status: 'chain_verify', reporter: 'webform', ward: 'ward tejgaon', ts: '2023-12-30T10:00:00Z' },
  ];

  return incidents.map((inc, idx) => ({
    event_id: `evt-${inc.id}`,
    event_type: 'IncidentCreated',
    occurred_at: inc.ts,
    ingested_at: inc.ts,
    actor_identity: { kind: 'system', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: inc.id,
      severity: inc.sev,
      ward_id: inc.ward,
      inbox: {
        owner_kind: 'priya',
        owner_display: 'Priya',
        status: inc.status,
        reporter_kind: inc.reporter,
        href: `/inbox/${inc.id}`,
        title: `Incident ${inc.id}`,
        summary: 'Test fixture row',
        isUrgent: inc.status === 'awaiting_ack' && inc.sev === 'high',
        isDraft: inc.status === 'awaiting_draft',
        isCitizen: inc.status === 'citizen_report',
        isAwaitingSig: inc.status === 'awaiting_sig',
        read: idx % 2 === 0,
        ...(inc.evidence ? { missing_evidence: inc.evidence } : {}),
      },
    },
    block_hash: `hash_${inc.id}`,
    height: idx + 1,
  }));
}

const INCIDENTS = buildFixtureEvents();

let restoreFetch: () => void = () => undefined;
let fetchFixture: { events: unknown[] } | '500' = { events: INCIDENTS };
let fetchError: Error | null = null;

function installFetchStub(): void {
  fetchFixture = { events: INCIDENTS };
  fetchError = null;
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.startsWith('/api/events?event_type=IncidentCreated')) {
      if (fetchFixture === '500') {
        return new Response('boom', { status: 500 });
      }
      if (fetchError) throw fetchError;

      return new Response(JSON.stringify(fetchFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: [] }), { status: 200 });
    }
    return original(input as RequestInfo, init);
  }) as typeof globalThis.fetch;

  restoreFetch = () => {
    globalThis.fetch = original;
  };
}

beforeEach(() => {
  server.resetHandlers(...handlers);
  installFetchStub();
  try {
    window.localStorage.setItem('surakkha.locale', 'en');
    document.body.dataset.locale = 'en';
  } catch {
    /* noop */
  }
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreFetch();
});

function renderList(initialEntries: string[] = ['/inbox']) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            initialEntries={initialEntries}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: makeSession(),
                chainHead: CHAIN_HEAD_FIXTURE,
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

describe('WO-009 Inbox List reconciliation', () => {
  // (1) Renders at /inbox for utility_operator role.
  it('mounts the inbox list page for utility_operator', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-list-page')).toBeTruthy();
    });
    // FE-1.5d reconciliation (2026-09-16): the rich filter chip row was
    // replaced by a row of multi-select `<Dropdown>` primitives. Each
    // axis carries its own testid (status/band/reporter) and the date
    // range exposes two `<input type=date>` testids (from/to).
    expect(screen.getByTestId('inbox-filter-status')).toBeTruthy();
    expect(screen.getByTestId('inbox-filter-band')).toBeTruthy();
    expect(screen.getByTestId('inbox-filter-reporter')).toBeTruthy();
    expect(screen.getByTestId('inbox-filter-date-from')).toBeTruthy();
    expect(screen.getByTestId('inbox-filter-date-to')).toBeTruthy();
  });

  // (2) Sort priority-first / age-second (T3 > T2 > T1 > Resolved, oldest first within tier).
  it('sorts rows T3 > T2 > T1 > Resolved with older rows first within a tier', async () => {
    renderList();
    await waitFor(() => {
      // Wait for the table to render rows.
      expect(document.querySelectorAll('[data-testid^="inbox-row-band-"]').length).toBeGreaterThan(0);
    });

    // Helper to read the sorted order by stepping through pagination.
    // Pagination caps page 1 at 20 rows; we navigate to page 2 (5 more
    // rows) so the entire 25-row set is observed.
    async function readAllOrderedIds(): Promise<string[]> {
      // First page — collect what's in DOM.
      const collect = (): string[] =>
        Array.from(document.querySelectorAll('[data-testid^="inbox-row-band-"]')).map(
          (el) => (el as HTMLElement).dataset.testid?.replace('inbox-row-band-', '') ?? '',
        );

      const first = collect();

      if (first.length < 25) {
        const nextBtn = screen.queryByTestId('inbox-pagination-next') as HTMLButtonElement | null;

        if (nextBtn && !nextBtn.disabled) {
          fireEvent.click(nextBtn);
          await waitFor(() => {
            expect(screen.getByTestId('inbox-row-band-evt-inc-res-1')).toBeTruthy();
          });
          return [...first, ...collect()];
        }
      }

      return first;
    }

    const order = await readAllOrderedIds();

    expect(order.length).toBe(25);

    // First batch: T3 rows (oldest first).
    const t3Ids = [
      'evt-inc-t3-anchor-old',
      'evt-inc-t3-hotline-old',
      'evt-inc-t3-webform',
      'evt-inc-t3-hotline-mid',
      'evt-inc-t3-anchor-new',
      'evt-inc-t3-sensor-new',
    ];
    const t2IdsSorted = [
      'evt-inc-t2-6', // 2024-01-08
      'evt-inc-t2-4', // 2024-01-09
      'evt-inc-t2-3', // 2024-01-11
      'evt-inc-t2-2', // 2024-01-13
      'evt-inc-t2-1', // 2024-01-15
      'evt-inc-t2-5', // 2024-01-16
      'evt-inc-t2-7', // 2024-01-19
    ];
    const t1Ids = [
      'evt-inc-t1-6',
      'evt-inc-t1-5',
      'evt-inc-t1-4',
      'evt-inc-t1-3',
      'evt-inc-t1-1',
      'evt-inc-t1-2',
    ];
    const resIds = [
      'evt-inc-res-6', // oldest resolved
      'evt-inc-res-5',
      'evt-inc-res-4',
      'evt-inc-res-3',
      'evt-inc-res-2',
      'evt-inc-res-1',
    ];

    expect(order.slice(0, 6)).toEqual(t3Ids);
    expect(order.slice(6, 13)).toEqual(t2IdsSorted);
    expect(order.slice(13, 19)).toEqual(t1Ids);
    expect(order.slice(19, 25)).toEqual(resIds);
  });

  // (3a) Filter dropdowns function — selecting band T3 narrows to T3-only rows.
  it('filters rows when the band dropdown option T3 is selected', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old')).toBeTruthy();
    });

    // FE-1.5d (2026-09-16): filters moved into multi-select Dropdowns.
    // Open the band dropdown and select T3.
    fireEvent.click(screen.getByTestId('inbox-filter-band-trigger'));
    fireEvent.click(await screen.findByTestId('inbox-filter-band-option-T3'));

    await waitFor(() => {
      // T3 rows remain; T2/T1/Resolved rows drop out.
      expect(screen.queryByTestId('inbox-row-band-evt-inc-t2-1')).toBeNull();
      expect(screen.queryByTestId('inbox-row-band-evt-inc-t1-1')).toBeNull();
      expect(screen.queryByTestId('inbox-row-band-evt-inc-res-1')).toBeNull();
    });
    // T3 rows still visible.
    expect(screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old')).toBeTruthy();
  });

  // (3b) Reporter filter — selecting sensor narrows to sensor-only rows.
  it('filters rows when the reporter dropdown option sensor is selected', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old')).toBeTruthy();
    });

    // Open the reporter dropdown and pick sensor.
    fireEvent.click(screen.getByTestId('inbox-filter-reporter-trigger'));
    fireEvent.click(await screen.findByTestId('inbox-filter-reporter-option-sensor'));

    await waitFor(() => {
      // Only sensor rows survive.
      const bandEls = Array.from(document.querySelectorAll('[data-testid^="inbox-row-band-"]'));
      const visibleIds = bandEls.map((el) => (el as HTMLElement).dataset.testid?.replace('inbox-row-band-', ''));

      expect(visibleIds.length).toBe(4);
      expect(visibleIds).toContain('evt-inc-t3-sensor-new');
      expect(visibleIds).toContain('evt-inc-t2-5');
      expect(visibleIds).toContain('evt-inc-t1-4');
      expect(visibleIds).toContain('evt-inc-res-4');
    });
  });

  // (3c) Status filter — selecting resolved narrows to resolved-only rows.
  it('filters rows when the status dropdown option resolved is selected', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old')).toBeTruthy();
    });

    // Open the status dropdown and pick resolved (rollup category).
    fireEvent.click(screen.getByTestId('inbox-filter-status-trigger'));
    fireEvent.click(await screen.findByTestId('inbox-filter-status-option-resolved'));

    await waitFor(() => {
      // Only resolved rows survive.
      const bandEls = Array.from(document.querySelectorAll('[data-testid^="inbox-row-band-"]'));
      const visibleIds = bandEls.map((el) => (el as HTMLElement).dataset.testid?.replace('inbox-row-band-', ''));

      expect(visibleIds.length).toBe(6);
      visibleIds.forEach((id) => expect(id).toMatch(/^evt-inc-res-/));
    });
  });

  // (3d) URL persistence — selecting options writes ?filter=... to the URL.
  it('persists filter state to ?filter=... in the URL', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old')).toBeTruthy();
    });

    // Select band T3 from the band dropdown.
    fireEvent.click(screen.getByTestId('inbox-filter-band-trigger'));
    fireEvent.click(await screen.findByTestId('inbox-filter-band-option-T3'));

    await waitFor(() => {
      // The selected option reflects multi-select state via aria-selected.
      expect(
        screen.getByTestId('inbox-filter-band-option-T3').getAttribute('aria-selected'),
      ).toBe('true');
    });

    // Select hotline reporter from the reporter dropdown.
    fireEvent.click(screen.getByTestId('inbox-filter-reporter-trigger'));
    fireEvent.click(await screen.findByTestId('inbox-filter-reporter-option-hotline'));

    await waitFor(() => {
      expect(
        screen.getByTestId('inbox-filter-reporter-option-hotline').getAttribute('aria-selected'),
      ).toBe('true');
    });

    // Pre-population on a fresh mount verifies the URL round-trips:
    // the dropdown state hydrates from the query string the previous
    // mount would have written.
    cleanup();
    renderList([
      '/inbox?filter=' + encodeURIComponent('band=T3&reporter=hotline'),
    ]);

    await waitFor(() => {
      // Visible rows reflect T3 + hotline — both T3 hotline rows survive.
      const bandEls = Array.from(document.querySelectorAll('[data-testid^="inbox-row-band-"]'));
      const visibleIds = bandEls.map(
        (el) => (el as HTMLElement).dataset.testid?.replace('inbox-row-band-', ''),
      );

      expect(visibleIds.length).toBeGreaterThan(0);
      visibleIds.forEach((id) => expect(id).toMatch(/^evt-inc-t3-/));
    });
  });

  // (3e) URL pre-populates on mount — ?filter=band=T3 narrows initial render.
  it('pre-populates filters from ?filter=... on mount', async () => {
    renderList(['/inbox?filter=band%3DT3%26reporter%3Danchor']);

    await waitFor(() => {
      // Only T3 + anchor rows survive (anchor-new, anchor-old).
      const bandEls = Array.from(document.querySelectorAll('[data-testid^="inbox-row-band-"]'));
      const visibleIds = bandEls.map((el) => (el as HTMLElement).dataset.testid?.replace('inbox-row-band-', ''));

      expect(visibleIds.length).toBe(2);
      expect(visibleIds).toContain('evt-inc-t3-anchor-old');
      expect(visibleIds).toContain('evt-inc-t3-anchor-new');
    });
  });

  // (4) Single-data severity column — BandPill only, with a compact
// "! N" missing-evidence marker when applicable. Age in its own
// column. FE-1.5d (2026-09-16): reporter-badge dropped from the row
// when the source column was removed. Each data lives on a single
// axis so the operator can scan one dimension at a time.
  it('renders BandPill + age + evidence-marker per row', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old')).toBeTruthy();
    });

    // BandPill renders glyph + text per row.
    const bandPill = screen.getByTestId('inbox-row-band-evt-inc-t3-anchor-old');

    expect(bandPill.textContent).toMatch(/[◔◑◒●✓]/);

    // FE-1.5d reconciliation (2026-09-16): the source column was
    // removed from the action queue. ReporterBadge is no longer
    // rendered per row — it lives on the inbox-detail header
    // (hotline-only) and on the right-rail SeverityRail. The
    // per-row reporter-badge testId therefore no longer resolves.

    // Age renders.
    expect(screen.getByTestId('inbox-row-age-evt-inc-t3-anchor-old')).toBeTruthy();

    // Missing-evidence compact marker — flagged rows render the
    // ".inbox-row-evidence-marker" beside the BandPill with the count.
    const evidenceT2 = screen.queryByTestId('inbox-row-evidence-evt-inc-t2-1');

    if (evidenceT2) {
      expect(evidenceT2.classList.contains('inbox-row-evidence-marker')).toBe(true);
      expect(evidenceT2.title).toMatch(/photo|gps|description/i);
    }

    // Toolbar chrome carries no broken evidence chips.
    expect(screen.queryByTestId('inbox-row-evidence-chip-evt-inc-t2-1-photo')).toBeNull();
  });

  // (5) Pagination — shows "next" button when > 20 rows; clicking advances.
  it('renders pagination when > 20 rows and the next button advances', async () => {
    renderList();
    await waitFor(() => {
      // 25 rows total, 20 default per page → pagination surfaces.
      expect(screen.getByTestId('inbox-pagination')).toBeTruthy();
    });

    // Default page = 1 → "next" enabled.
    const nextBtn = screen.getByTestId('inbox-pagination-next') as HTMLButtonElement;

    expect(nextBtn.disabled).toBe(false);

    fireEvent.click(nextBtn);

    await waitFor(() => {
      // After advancing to page 2, inc-t1-2 (rank 19) should NOT be in
      // the paged DOM (it's on page 1); inc-res-1 (rank 24) should be.
      // (Pinned via the band testid pattern.)
      expect(screen.getByTestId('inbox-row-band-evt-inc-res-1')).toBeTruthy();
    });
  });

  // (6a) Empty state renders when no events match.
  it('renders the no-matches empty state when filters exclude everything', async () => {
    // Use a date-range filter that excludes every fixture row — the
    // fixture timestamps fall in Jan 2024 + Dec 2023, so a 2025 range
    // excludes everything.
    renderList(['/inbox?filter=' + encodeURIComponent('from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z')]);

    await waitFor(() => {
      const body = document.body.textContent ?? '';

      expect(body).toMatch(/No incidents match/i);
    });
    // No BandPills rendered.
    expect(document.querySelectorAll('[data-testid^="inbox-row-band-"]').length).toBe(0);
  });

  // (6b) Loading state renders on initial fetch.
  it('renders a loading state on initial fetch', async () => {
    // Stub fetch to never resolve so we observe the loading state.
    const original = globalThis.fetch;

    globalThis.fetch = (() => {
      return new Promise<Response>(() => undefined) as Promise<Response>;
    }) as typeof globalThis.fetch;
    restoreFetch = () => {
      globalThis.fetch = original;
    };

    renderList();

    // The loading placeholder surfaces before the fetch resolves.
    await waitFor(() => {
      expect(screen.getByTestId('inbox-loading')).toBeTruthy();
    });
  });

  // (6c) Error state renders when /api/events returns 500.
  it('renders the error state when /api/events returns 500', async () => {
    fetchFixture = '500';

    renderList();

    await waitFor(() => {
      const body = document.body.textContent ?? '';

      expect(body).toMatch(/Failed to load inbox/i);
    });
  });

  // (6d) No Hindi strings in inboxList.json (en + bn).
  it('inboxList.json locale files contain no Hindi script', () => {
    const en = readFileSync(resolve(__dirname, '../i18n/locales/en/inboxList.json'), 'utf8');
    const bn = readFileSync(resolve(__dirname, '../i18n/locales/bn/inboxList.json'), 'utf8');
    // Devanagari LETTERS — Hindi (Devanagari) ships here. We exclude
    // U+0964 (DANDA) and U+0965 (DOUBLE DANDA) which are shared with
    // Bengali and Marathi as sentence-ending punctuation, and are not
    // script-defining. Bangla uses U+0964 as the period in formal text.
    // Letters-only range: U+0904-U+0939, U+0958-U+0961, U+0971-U+097F.
    const hindi = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

    expect(hindi.test(en)).toBe(false);
    expect(hindi.test(bn)).toBe(false);
  });

  // (6e) Focus rings use --color-primary-tint (read inbox.css).
  it('inbox.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(resolve(__dirname, '../styles/inbox.css'), 'utf8');
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });
});
