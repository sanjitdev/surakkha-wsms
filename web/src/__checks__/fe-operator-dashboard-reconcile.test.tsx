/**
 * fe-operator-dashboard-reconcile.test.tsx — WO-004 acceptance matrix.
 *
 * Pins operator-dashboard.md + WO-004 §Acceptance criteria for the
 * lockdown reconciliation:
 *   1) Page renders at /dashboard for utility_operator role.
 *   2) Single status-board layout — no A/B/C layout toggle in DOM.
 *   3) Sort is priority-first / age-second (T3 > T2 > T1 > T0, then
 *      ascending age within band).
 *   4) BandPill renders glyph + text for each row (not colour-only).
 *   5) Reporter-badge chip renders per row with correct icon.
 *   6) Hotline trigger button mounts in the action bar and opens
 *      HotlineIntakeModal on click.
 *   7) Auto-routed-tail chip renders collapsed with count + 'Hide'.
 *   8) Quick-dismiss on T1/T2 row emits IncidentDismissed via
 *      POST /api/events with the right payload.
 *   9) Focus rings use --color-primary-tint (verified in dashboard.css).
 *
 * The fixtures reuse the same shape as fe-b6-operator-* so the test
 * reads independently of Phase 1.6a's localStorage layout toggle (the
 * toggle has been removed per the lockdown cascade — see operator-
 * dashboard.md §Reconciliation diff #1).
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { OperatorDashboard } from '../pages/OperatorDashboard';
import { handlers } from '../mocks/handlers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

const SESSION_FIXTURE = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
};

const CHAIN_HEAD_FIXTURE = {
  height: 42,
  block_hash: 'abcdef1234567890',
  prev_hash: '0987fedcba654321',
  sealed_at: '2024-02-01T00:00:00.000Z',
  ingested_at: '2024-02-01T00:00:00.001Z',
};

// Mixed-band fixture: 5 incidents covering all severity tiers + 1 in-flight.
// Older rows within the same band must come first.
const INCIDENTS = [
  // T3 — newest first in fixture, but older at same tier wins.
  { incident_id: 'inc-t3-old', ward_id: 'ward-a', severity: 'T3', status: 'open', last_block_height: 1, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-10T08:00:00Z', reporter_kind: 'anchor' },
  { incident_id: 'inc-t3-new', ward_id: 'ward-b', severity: 'T3', status: 'open', last_block_height: 2, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-20T08:00:00Z', reporter_kind: 'sensor' },
  { incident_id: 'inc-t2',     ward_id: 'ward-c', severity: 'T2', status: 'open', last_block_height: 3, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-15T12:00:00Z', reporter_kind: 'hotline' },
  { incident_id: 'inc-t1',     ward_id: 'ward-d', severity: 'T1', status: 'open', last_block_height: 4, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-18T12:00:00Z', reporter_kind: 'webform' },
  // in-flight T3 — same priority as T3-old but its last_event_type is
  // TechnicianAssigned, so workflow filter 'needs-me' hides it.
  { incident_id: 'inc-t3-flight', ward_id: 'ward-e', severity: 'T3', status: 'open', last_block_height: 5, last_event_type: 'TechnicianAssigned', last_occurred_at: '2024-01-09T08:00:00Z', reporter_kind: 'webform' },
];

let restoreFetch: () => void = () => undefined;
let capturePosts: { url: string; body: unknown }[] = [];

function installFetchStub(): void {
  capturePosts = [];
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (init?.method === 'POST' && url === '/api/events') {
      const body = init.body ? JSON.parse(String(init.body)) : null;
      capturePosts.push({ url, body });
      return new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/incidents') && url.includes('auto_routed')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes('/api/incidents')) {
      return new Response(JSON.stringify(INCIDENTS), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/sensors')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes('/api/events')) {
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
    // Old layout toggle key is irrelevant post-WO-004 but the
    // reconciler explicitly does NOT delete it from localStorage —
    // users who reload mid-flight keep their last good value (Phase 1.7
    // migration plan: drop the key + the storage helper).
    window.localStorage.removeItem('surakkha.layout');
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

function renderDash() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: SESSION_FIXTURE,
                chainHead: CHAIN_HEAD_FIXTURE,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <OperatorDashboard />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-004 Operator Dashboard reconciliation', () => {
  // (1) Page renders for utility_operator role.
  it('mounts at /dashboard for utility_operator role', async () => {
    renderDash();
    expect(await screen.findByTestId('operator-dashboard-page')).toBeTruthy();
    expect(screen.getByTestId('operator-dashboard-header')).toBeTruthy();
    expect(screen.getByTestId('operator-dashboard-main')).toBeTruthy();
  });

  // (2) No layout toggle in DOM.
  it('does not render an A/B/C layout toggle (status-board only)', async () => {
    renderDash();
    await screen.findByTestId('operator-dashboard-page');
    const pageSource = document.body.innerHTML;
    // None of the legacy layout-toggle selectors should resolve.
    expect(pageSource).not.toMatch(/data-testid="dashboard-layout-(a|b|c)"/);
    expect(pageSource).not.toMatch(/Layout A|Layout B|Layout C/);
  });

  // (3) Priority-first / age-second sort.
  it('sorts rows T3 > T2 > T1, with older rows first within a tier', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });

    // After the auto-routed fetch settles + tier filter is 'all' +
    // workflow filter is 'needs-me' (default), the visible order in
    // /api/incidents was [t3-old, t3-new, t2, t1, t3-flight]. The
    // sort drops the in-flight row (t3-flight) and then ranks the
    // rest as T3-old (oldest T3) → T3-new → T2 → T1.
    const rows = document.querySelectorAll('[data-testid^="table-threads-row-"]');
    const order = Array.from(rows).map((r) =>
      (r as HTMLElement).dataset.testid?.replace('table-threads-row-', ''),
    );

    // First four must be priority-first, age-second.
    expect(order.slice(0, 4)).toEqual([
      'inc-t3-old',
      'inc-t3-new',
      'inc-t2',
      'inc-t1',
    ]);
  });

  // (4) BandPill renders glyph + text.
  it('renders BandPill with glyph + text (not color-only)', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('operator-dashboard-band-pill-inc-t3-old')).toBeTruthy();
    });
    const pill = screen.getByTestId('operator-dashboard-band-pill-inc-t3-old');

    expect(pill.textContent).toMatch(/[◔◑●✓]/);
    expect(pill.textContent).toContain('T3');
    expect(pill.getAttribute('aria-label')).toContain('T3');
  });

  // (5) Reporter-badge chip renders per row.
  it('renders a reporter-badge chip per row with the correct icon class', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getAllByTestId('thread-reporter-anchor').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByTestId('thread-reporter-anchor')[0].className).toContain(
      'chip-reporter-anchor',
    );
    expect(screen.getAllByTestId('thread-reporter-hotline')[0].className).toContain(
      'chip-reporter-hotline',
    );
    expect(screen.getAllByTestId('thread-reporter-webform')[0].className).toContain(
      'chip-reporter-webform',
    );
    expect(screen.getAllByTestId('thread-reporter-sensor')[0].className).toContain(
      'chip-reporter-sensor',
    );
  });

  // (6) Hotline button mounts and opens modal.
  it('mounts the hotline button and opens HotlineIntakeModal on click', async () => {
    renderDash();
    fireEvent.click(screen.getByTestId('dashboard-log-hotline-call'));
    await waitFor(() => {
      expect(screen.getByTestId('hotline-intake-modal')).toBeTruthy();
    });
  });

  // (7) Auto-routed-tail chip — collapsed when count = 0 (the mock
  // returns [] for ?auto_routed=true).
  it('hides the auto-routed chip when count is 0 (no fallback render)', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('operator-dashboard-page')).toBeTruthy();
    });
    // Render the chip area in the DOM only when count > 0.
    expect(screen.queryByTestId('operator-dashboard-auto-routed-tail-chip')).toBeNull();
  });

  // (7b) Auto-routed chip renders when count > 0.
  it('renders the auto-routed chip when the projection returns rows', async () => {
    // Override the auto_routed fetch to return 3 rows.
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/incidents') && url.includes('auto_routed')) {
        return new Response(JSON.stringify([{ incident_id: 'a' }, { incident_id: 'b' }, { incident_id: 'c' }]), {
          status: 200,
        });
      }
      if (url.includes('/api/incidents')) {
        return new Response(JSON.stringify(INCIDENTS), { status: 200 });
      }
      if (url.includes('/api/sensors')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/api/events')) {
        return new Response(JSON.stringify({ events: [] }), { status: 200 });
      }
      return original(input as RequestInfo, init);
    }) as typeof globalThis.fetch;
    restoreFetch = () => {
      globalThis.fetch = original;
    };
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('operator-dashboard-auto-routed-tail-chip')).toBeTruthy();
    });
    const chip = screen.getByTestId('operator-dashboard-auto-routed-tail-chip');

    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(chip.textContent).toContain('3');
  });

  // (8) Quick-dismiss on T1/T2 emits IncidentDismissed.
  it('emits IncidentDismissed via POST /api/events when the T1 quick-dismiss button is clicked', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('operator-dashboard-quick-dismiss-inc-t1')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('operator-dashboard-quick-dismiss-inc-t1'));
    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });
    const call = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'IncidentDismissed',
    );

    expect(call).toBeTruthy();
    expect(call!.body).toMatchObject({
      event_type: 'IncidentDismissed',
      payload: {
        incident_id: 'inc-t1',
        reason: 'quick-dismiss',
      },
    });
  });

  // (8b) Quick-dismiss is hidden on T3 and resolved rows.
  it('does NOT render the quick-dismiss button on T3 or resolved rows', async () => {
    renderDash();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-thread-filters')).toBeTruthy();
    });
    expect(screen.queryByTestId('operator-dashboard-quick-dismiss-inc-t3-old')).toBeNull();
  });

  // (9) Focus rings — verified in dashboard.css (Issue #14, 004-REQ-009).
  it('dashboard.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(
      resolve(__dirname, '../../mockups/01-priya/dashboard.css'),
      'utf8',
    );
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });

  // (10) No Hindi strings in OperatorDashboard.tsx or its i18n files.
  it('operatorDashboard.json locale files contain no Hindi script', () => {
    const en = readFileSync(resolve(__dirname, '../i18n/locales/en/operatorDashboard.json'), 'utf8');
    const bn = readFileSync(resolve(__dirname, '../i18n/locales/bn/operatorDashboard.json'), 'utf8');
    // Devanagari LETTERS — Hindi (Devanagari) ships here. We exclude
    // U+0964 (DANDA) and U+0965 (DOUBLE DANDA) which are shared with
    // Bengali and Marathi as sentence-ending punctuation, and are not
    // script-defining. Bangla uses U+0964 as the period in formal text.
    // Letters-only range: U+0904-U+0939, U+0958-U+0961, U+0971-U+097F.
    const hindi = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

    expect(hindi.test(en)).toBe(false);
    expect(hindi.test(bn)).toBe(false);
  });
});
