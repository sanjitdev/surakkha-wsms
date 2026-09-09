/**
 * FE-1.5b review-loop D1 — InboxList bulk-bar state coverage.
 *
 * Locks the bulk-bar's `hidden={selectedRows.size === 0}` lifecycle and
 * the per-row + select-all toggle semantics. FE-1.5b shipped with these
 * untested (review-loop-1 change log D1); this file covers them so a
 * future refactor cannot silently regress either.
 *
 * Why this file overrides the /api/events handler instead of seeding
 * IndexedDB: vitest's jsdom env has no fake-indexeddb polyfill, so the
 * real handler's `await getAllBlocks()` resolves to an empty array in
 * tests, and the page renders the `<EmptyState>` instead of rows. The
 * override returns 3 hardcoded `IncidentCreated` events with the
 * minimal inbox-payload shape the page's `buildRows` parser consumes —
 * enough rows to exercise bulk-bar selection and select-all without
 * dragging in the full 7-row fixture set.
 *
 * D2 (I/O matrix), D3 (route assertion), D4 (CSS verification) ship as
 * a follow-up spec; this file will gain more `describe` groups then.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { InboxList } from '../pages/InboxList';
import { LocaleProvider } from '../hooks/useLocale';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers(...handlers);
  // Clear body-level locale reset so any test that mutates body[data-locale]
  // (e.g. locale_bangla) cannot leak across the suite. The locale_bangla case
  // sets + restores the attribute inside try/finally; this guard catches any
  // future test that forgets the cleanup.
  delete document.body.dataset.locale;
});

afterEach(() => {
  cleanup();
});

/**
 * Three minimal `IncidentCreated` events covering the inbox.payload shape
 * the page's `buildRows` parser reads. Keeps the test independent of the
 * 7-row fixture set so a refactor to the seeded data won't break this
 * coverage.
 */
const ROWS = [
  {
    event_id: 'evt_test_001',
    event_type: 'IncidentCreated',
    occurred_at: '2026-09-08T10:00:00.000Z',
    ingested_at: '2026-09-08T10:00:01.000Z',
    actor_identity: { kind: 'priya', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: 'inc_test_001',
      severity: 'high',
      ward_id: 'ward-dhanmondi',
      inbox: {
        owner_kind: 'priya',
        owner_display: 'Priya',
        status: 'awaiting_ack',
        href: '/inbox/inc_test_001',
        title: 'Ward 7 chlorination spike',
        summary: 'citizen-ack request sent · Anjali (reporter) · SN-2208 silent 8 min',
        isUrgent: true,
        isDraft: false,
        isCitizen: false,
        isAwaitingSig: true,
        read: false,
      },
    },
    block_hash: 'hash_001',
    height: 1,
  },
  {
    event_id: 'evt_test_002',
    event_type: 'IncidentCreated',
    occurred_at: '2026-09-08T10:05:00.000Z',
    ingested_at: '2026-09-08T10:05:01.000Z',
    actor_identity: { kind: 'priya', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: 'inc_test_002',
      severity: 'medium',
      ward_id: 'ward-mohammadpur',
      inbox: {
        owner_kind: 'priya',
        owner_display: 'Priya',
        status: 'awaiting_sig',
        href: '/inbox/inc_test_002',
        title: 'Ward 5 lead-leach watch',
        summary: 'SN-3301 above advisory · pending counter-sign',
        isUrgent: false,
        isDraft: false,
        isCitizen: false,
        isAwaitingSig: true,
        read: false,
      },
    },
    block_hash: 'hash_002',
    height: 2,
  },
  {
    event_id: 'evt_test_003',
    event_type: 'IncidentCreated',
    occurred_at: '2026-09-08T10:10:00.000Z',
    ingested_at: '2026-09-08T10:10:01.000Z',
    actor_identity: { kind: 'citizen', ref: 'citizen-007', display: 'Anjali' },
    payload: {
      incident_id: 'inc_test_003',
      severity: 'low',
      ward_id: 'ward-mirpur',
      inbox: {
        owner_kind: 'citizen',
        owner_display: 'Anjali',
        status: 'citizen_report',
        href: '/inbox/inc_test_003',
        title: 'Citizen report — discoloured water',
        summary: 'Reported by Anjali (citizen) · 2 photos attached',
        isUrgent: false,
        isDraft: false,
        isCitizen: true,
        isAwaitingSig: false,
        read: false,
      },
    },
    block_hash: 'hash_003',
    height: 3,
  },
];

function overrideEventsHandler() {
  // Only intercept /api/events?event_type=IncidentCreated (the page's main
  // inbox-rows fetch). The page also fires 4 parallel recent-decisions
  // fetches (PublicNoticeIssued, IncidentEscalated, CouncillorEndorsement-
  // Recorded, SignatureAttestation); for those we return an explicit empty
  // array so the recent-decisions rail renders the "No decisions yet"
  // placeholder instead of mirroring IncidentCreated rows. Returning
  // `passthrough()` here would surface a noisy `ECONNREFUSED` stderr
  // because there's no dev server in the test env.
  server.use(
    http.get('/api/events', ({ request }) => {
      const eventType = new URL(request.url).searchParams.get('event_type');

      if (eventType === 'IncidentCreated') {
        return HttpResponse.json({ total: ROWS.length, events: ROWS });
      }
      return HttpResponse.json({ total: 0, events: [] });
    }),
  );
}

/**
 * Render InboxList inside MemoryRouter + LocaleProvider (FE-B5d added
 * `useDateFormatter` to InboxList which subscribes to `useLocale()`,
 * so the provider must wrap every render). The /api/events handler is
 * overridden to return 3 hardcoded rows. Waits for the rows to mount
 * before returning so the caller can assert on them directly.
 */
async function renderInboxAndWaitForRows() {
  overrideEventsHandler();
  render(
    <LocaleProvider>
      <MemoryRouter>
        <InboxList />
      </MemoryRouter>
    </LocaleProvider>,
  );
  await waitFor(() => {
    expect(screen.queryAllByTestId('inbox-row').length).toBeGreaterThan(0);
  });
}

describe('InboxList bulk-bar', () => {
  it('hides the bulk-bar by default, shows <strong>1</strong> after one row check, hides again on second click', async () => {
    await renderInboxAndWaitForRows();

    const bulkbar = document.querySelector('.inbox-bulkbar');

    expect(bulkbar).not.toBeNull();
    // Defensive: the bulk-bar renders exactly one `<strong>` count cell.
    // FE-1.5b shipped with a duplicate `<span className="inbox-bulkbar__count">`
    // (copy-paste leftover) — fixed in this same patch. If a future refactor
    // re-introduces the duplicate, the count text would still render but
    // `querySelectorAll('strong').length` would jump to 2.
    expect(bulkbar?.querySelectorAll('strong').length).toBe(1);
    // Initially hidden — no rows selected.
    expect(bulkbar?.hasAttribute('hidden')).toBe(true);

    const firstRowCheck = screen.getAllByTestId(/^inbox-row-check-/).at(0);

    expect(firstRowCheck).toBeDefined();
    act(() => {
      fireEvent.click(firstRowCheck!);
    });
    expect(bulkbar?.hasAttribute('hidden')).toBe(false);
    expect(bulkbar?.querySelector('strong')?.textContent).toBe('1');
    expect(bulkbar?.textContent).toContain('selected');

    // Click the same checkbox again — toggle off, bulk-bar hides.
    act(() => {
      fireEvent.click(firstRowCheck!);
    });
    expect(bulkbar?.hasAttribute('hidden')).toBe(true);
  });

  it('select-all toggles every visible row on click, deselects them on a second click', async () => {
    await renderInboxAndWaitForRows();

    const selectAll: HTMLInputElement = screen.getByRole('checkbox', { name: 'Select all' });

    expect(selectAll.checked).toBe(false);

    // First click — select-all: every visible row gets is-selected, bulk-bar
    // becomes visible with the row count, and the select-all checkbox flips
    // to checked. Locks the `else visibleRows.forEach((r) => next.add(r.id))`
    // branch in `InboxList.tsx:117`.
    act(() => {
      fireEvent.click(selectAll);
    });

    const visibleRows = screen.queryAllByTestId('inbox-row');

    expect(visibleRows.length).toBeGreaterThan(0);
    visibleRows.forEach((row) => {
      expect(row.classList.contains('is-selected')).toBe(true);
    });

    const bulkbar = document.querySelector('.inbox-bulkbar');

    expect(bulkbar?.hasAttribute('hidden')).toBe(false);
    expect(bulkbar?.querySelector('strong')?.textContent).toBe(String(visibleRows.length));
    expect(selectAll.checked).toBe(true);

    // Second click — deselect-all: every row loses is-selected, bulk-bar
    // hides, and the select-all checkbox returns to unchecked. Locks the
    // `if (allSelected) visibleRows.forEach((r) => next.delete(r.id))`
    // branch in `InboxList.tsx:117`. Without this assertion a regression
    // that removed the deselect branch would silently pass the first
    // half of this test (Set semantics make the missing delete a no-op).
    act(() => {
      fireEvent.click(selectAll);
    });

    visibleRows.forEach((row) => {
      expect(row.classList.contains('is-selected')).toBe(false);
    });
    expect(bulkbar?.hasAttribute('hidden')).toBe(true);
    expect(selectAll.checked).toBe(false);
  });
});

/**
 * FE-1.5b review-loop D2/D3/D4 — I/O matrix + route + CSS lockdown.
 * Locks 4 unwritten I/O rows + route wiring + dim-4 colour lockdown.
 */
describe('InboxList I/O matrix', () => {
  it('filter_T3: clicking the T3 urgent chip shows only T3 rows; chip is active', async () => {
    await renderInboxAndWaitForRows();
    const t3Chip = screen.getByTestId('filter-chip-t3-urgent');

    expect(t3Chip.getAttribute('aria-selected')).toBe('false');
    expect(t3Chip.className).not.toContain('is-active');

    act(() => {
      fireEvent.click(t3Chip);
    });

    expect(t3Chip.getAttribute('aria-selected')).toBe('true');
    expect(t3Chip.className).toContain('is-active');

    // Only the T3 row (high → T3 per SEVERITY_FROM_WIRE) remains.
    const visibleRows = screen.queryAllByTestId('inbox-row');

    expect(visibleRows.length).toBe(1);
    expect(visibleRows[0]?.textContent).toContain('Ward 7 chlorination spike');
  });

  it('fetch_fail: 500 from /api/events renders <EmptyState heading="No incidents" />', async () => {
    // Override /api/events: IncidentCreated → 500 (triggers the catch path),
    // everything else → empty array (so the recent-decisions rail stays
    // honest instead of mirroring the failed fetch). The `beforeEach`
    // already reset handlers to the base set, so this single `server.use()`
    // call replaces the chain for this test only.
    server.use(
      http.get('/api/events', ({ request }) => {
        if (new URL(request.url).searchParams.get('event_type') === 'IncidentCreated') {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ total: 0, events: [] });
      }),
    );

    render(
      <LocaleProvider>
        <MemoryRouter>
          <InboxList />
        </MemoryRouter>
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeTruthy();
    });

    expect(screen.getByRole('heading', { level: 2, name: 'No incidents' })).toBeTruthy();
    expect(screen.queryAllByTestId('inbox-row').length).toBe(0);
    expect(document.querySelector('.inbox-bulkbar')?.hasAttribute('hidden')).toBe(true);
  });

  it('locale_bangla: setting body[data-locale=bn] before render leaves it set and renders rows', async () => {
    // FE-B5d: InboxList now consumes `useLocale()` via `useDateFormatter`,
    // so the LocaleProvider reads `localStorage['surakkha.locale']` at
    // mount. Seed that before render so the in-memory locale + the body
    // attribute both end up at 'bn' after the provider's useEffect runs.
    try {
      window.localStorage.setItem('surakkha.locale', 'bn');
      await renderInboxAndWaitForRows();

      expect(document.body.getAttribute('data-locale')).toBe('bn');
      expect(screen.queryAllByTestId('inbox-row').length).toBeGreaterThan(0);
    } finally {
      window.localStorage.removeItem('surakkha.locale');
      delete document.body.dataset.locale;
    }
  });

  it('severity_rail: with 1×T3, 1×T2, 1×T1 rows the rail reads T3=1, T2=1, T1=1, T0=0', async () => {
    await renderInboxAndWaitForRows();
    const sevCard = Array.from(document.querySelectorAll('.card')).find(
      (c) => c.querySelector('.card-heading')?.textContent === 'Queue by severity',
    );

    expect(sevCard).toBeDefined();

    const rows = Array.from(sevCard!.querySelectorAll('.hbar-row'));

    expect(rows.length).toBe(4);
    // Each Hbar: `<label> <track/> <value/total>`.
    const summary = rows.map(
      (r) =>
        `${r.querySelector('.hbar-label')?.textContent} ${r.querySelector('.hbar-value')?.textContent}`,
    );

    expect(summary).toEqual([
      'T3 urgent 1 / 3',
      'T2 elevated 1 / 3',
      'T1 review 1 / 3',
      'T0 info 0 / 3',
    ]);
  });
});

/**
 * D3 — source-assert `<InboxList />` is wired at `/inbox` in App.tsx.
 */
describe('InboxList /inbox route', () => {
  it('App.tsx wires path="/inbox" + element={<InboxList />} within 3 lines', () => {
    const appSrc = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const lines = appSrc.split(/\r?\n/);
    const pathIdx = lines.findIndex((l) => l.includes('path="/inbox"'));

    expect(pathIdx).toBeGreaterThan(-1);
    // 3 lines of slack covers prettier wrap variants.
    const window = lines.slice(pathIdx, pathIdx + 3).join('\n');

    expect(window).toContain('element={<InboxList />}');
  });
});

/**
 * D4 — inbox.css stays token-only per dim 4 lockdown (no hex / rgb()).
 */
describe('InboxList CSS lockdown', () => {
  it('inbox.css contains zero hex literals or rgb( calls', () => {
    const css = readFileSync(resolve(__dirname, '../styles/inbox.css'), 'utf8');
    const matches = css.match(/#[0-9a-fA-F]{3,8}|rgb\(/g);

    expect(matches ?? []).toEqual([]);
  });
});
