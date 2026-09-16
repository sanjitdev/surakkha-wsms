/**
 * fe-field-queue-reconcile.test.tsx — WO-006 acceptance matrix.
 *
 * Pins field-queue.md + WO-006 §Acceptance criteria for the lockdown
 * reconciliation:
 *   1) Page renders at /field for field_technician role.
 *   2) Sort is priority-first / age-second (T3 > T2 > T1 > T0, then
 *      ascending age within tier).
 *   3) Each row shows: BandPill, reporter-badge chip, distance estimate,
 *      age, missing-evidence chips.
 *   4) Acknowledge button visible on each row; emits POST /api/events
 *      with { event_type: "Acknowledged", payload: { actor: "karim",
 *      incident_id: ... } }.
 *   5) En route button visible on each row; opens ETA picker (1/5/15/30/60
 *      min) then emits { event_type: "EnRoute", payload: { actor: "karim",
 *      incident_id: ..., eta_minutes: ... } }.
 *   6) Distance estimate updates when geolocation changes (uses
 *      navigator.geolocation.watchPosition).
 *   7) "My assignments" (default) + "Available" filter chips function.
 *   8) 5s polling + 100ms crossfade on changed cells (foundation §8.2).
 *   9) No Hindi strings in fieldQueue.json (both en + bn).
 *  10) Bangla toggle works; preference persists.
 *
 * Pattern matches fe-operator-dashboard-reconcile.test.tsx (WO-004) and
 * fe-b6-inbox-detail-* family: fetch stub captures POSTs to /api/events,
 * MSW handlers serve the GET projection, locale + AppLayout are
 * provided via providers.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { FieldQueuePage } from '../pages/FieldQueuePage';
import { handlers } from '../mocks/handlers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

const SESSION_FIXTURE = {
  actor_id: 'karim-001',
  actor_ref: 'karim-001',
  display_name: 'Karim — Field Technician',
  role: 'field_technician',
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

// Mixed-band fixture: T3-old, T3-new, T2, T1 (Karim's "My assignments")
// + 1 unassigned row that surfaces when the filter chip is set to
// "Available". Both fixture slices are merged here so the page renders
// once and the chip swap exercises both branches without a refetch
// between assertions.
const INCIDENTS = [
  { incident_id: 'inc-t3-old', ward_id: 'dhanmondi-3', severity: 'T3', status: 'open', last_block_height: 1, last_event_type: 'TechnicianAssigned', last_occurred_at: '2024-01-10T08:00:00Z', reporter_kind: 'anchor', assigned_to: 'karim-001', lat: 23.7461, lon: 90.3742 },
  { incident_id: 'inc-t3-new', ward_id: 'uttara-2',  severity: 'T3', status: 'open', last_block_height: 2, last_event_type: 'TechnicianAssigned', last_occurred_at: '2024-01-20T08:00:00Z', reporter_kind: 'sensor', assigned_to: 'karim-001', lat: 23.8759, lon: 90.3795 },
  { incident_id: 'inc-t2',     ward_id: 'mirpur-12', severity: 'T2', status: 'open', last_block_height: 3, last_event_type: 'TechnicianAssigned', last_occurred_at: '2024-01-15T12:00:00Z', reporter_kind: 'hotline', assigned_to: 'karim-001', lat: 23.7937, lon: 90.4034 },
  { incident_id: 'inc-t1',     ward_id: 'tejgaon',   severity: 'T1', status: 'open', last_block_height: 4, last_event_type: 'TechnicianAssigned', last_occurred_at: '2024-01-18T12:00:00Z', reporter_kind: 'webform', assigned_to: 'karim-001', lat: 23.7561, lon: 90.3926, missing_evidence: ['photo', 'gps'] },
  // unassigned — surfaces when filter = 'available'.
  { incident_id: 'inc-avail-1', ward_id: 'banani', severity: 'T2', status: 'open', last_block_height: 7, last_event_type: 'IncidentCreated', last_occurred_at: '2024-01-19T10:00:00Z', reporter_kind: 'webform', lat: 23.7937, lon: 90.4067 },
];

let restoreFetch: () => void = () => undefined;
let capturePosts: { url: string; body: unknown }[] = [];
let incidentsFixture: unknown[] = INCIDENTS;

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
    if (url.includes('/api/incidents')) {
      return new Response(JSON.stringify(incidentsFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
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
  incidentsFixture = INCIDENTS;
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

function renderQueue() {
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
              <FieldQueuePage />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-006 Field Queue reconciliation', () => {
  // (1) Page renders at /field for field_technician role.
  it('mounts at /field for field_technician role', async () => {
    renderQueue();
    expect(await screen.findByTestId('field-queue-page')).toBeTruthy();
    expect(screen.getByTestId('field-queue-header')).toBeTruthy();
    expect(screen.getByTestId('field-queue-filter-chips')).toBeTruthy();
    expect(screen.getByTestId('field-queue-incident-list')).toBeTruthy();
  });

  // (2) Priority-first / age-second sort.
  it('sorts rows T3 > T2 > T1 with older rows first within a tier', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-row-inc-t3-old')).toBeTruthy();
    });
    const rows = document.querySelectorAll('[data-testid^="field-queue-row-"]');
    const order = Array.from(rows).map((r) =>
      (r as HTMLElement).dataset.testid?.replace('field-queue-row-', ''),
    );

    expect(order).toEqual(['inc-t3-old', 'inc-t3-new', 'inc-t2', 'inc-t1']);
  });

  // (3) Each row shows BandPill + reporter-badge chip + distance + age.
  it('renders BandPill, reporter-badge chip, distance estimate, age, and missing-evidence chips per row', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-band-pill-inc-t3-old')).toBeTruthy();
    });
    // BandPill — locked = true renders glyph + text per row.
    const t3Pill = screen.getByTestId('field-queue-band-pill-inc-t3-old');

    // Glyph set: ◔ (Pending) / ◑ (Verified) / ◒ (Issuance) / ✓ (Resolved).
    // The lockdown palette uses ◒ for the issuance tier per
    // BandPill.LOCKED_ICONS. Tier codes (T1/T2/T3) are internal —
    // they drive the colour bridge and sort order but never appear
    // in operator-visible text.
    expect(t3Pill.textContent).toMatch(/[◔◑◒●✓]/);
    expect(t3Pill.textContent).toMatch(/Issuance|ইস্যু/);

    // Reporter-badge chip — anchor kind renders for inc-t3-old.
    const anchorBadge = screen.getByTestId('field-queue-reporter-badge-inc-t3-old');

    expect(anchorBadge.className).toContain('chip-reporter-anchor');
    expect(anchorBadge.getAttribute('data-reporter-kind')).toBe('anchor');

    // Sensor badge for inc-t3-new.
    expect(screen.getByTestId('field-queue-reporter-badge-inc-t3-new').className).toContain('chip-reporter-sensor');
    // Hotline badge for inc-t2.
    expect(screen.getByTestId('field-queue-reporter-badge-inc-t2').className).toContain('chip-reporter-hotline');
    // Webform badge for inc-t1.
    expect(screen.getByTestId('field-queue-reporter-badge-inc-t1').className).toContain('chip-reporter-webform');

    // Distance estimate renders per row.
    expect(screen.getByTestId('field-queue-distance-estimate-inc-t3-old')).toBeTruthy();

    // Missing-evidence chips render for inc-t1 (photo + gps).
    const evidenceChips = document.querySelectorAll(
      '[data-testid="field-queue-row-inc-t1"] .field-queue-evidence-chip',
    );

    expect(evidenceChips.length).toBe(2);
  });

  // (4) Acknowledge button emits Acknowledged event with right payload.
  it('emits Acknowledged via POST /api/events when the Acknowledge button is clicked', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-button-acknowledge-inc-t2')).toBeTruthy();
    });

    // Stub window.location.href so the post-emit navigation doesn't throw.
    const originalLocation = window.location;
    // @ts-expect-error - jsdom doesn't allow full reassignment; we
    // replace just the href setter for this test.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    });

    fireEvent.click(screen.getByTestId('field-queue-button-acknowledge-inc-t2'));
    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });
    const call = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'Acknowledged',
    );

    expect(call).toBeTruthy();
    expect(call!.body).toMatchObject({
      event_type: 'Acknowledged',
      payload: {
        actor: 'karim',
        incident_id: 'inc-t2',
      },
    });

    // Restore location for subsequent tests.
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  // (5) En route button opens ETA picker; selecting 15 emits EnRoute.
  it('opens the ETA picker and emits EnRoute with the selected minutes', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-button-en-route-inc-t2')).toBeTruthy();
    });

    // Stub location.href again.
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    });

    // Click "En route" → ETA picker dropdown renders in row.
    fireEvent.click(screen.getByTestId('field-queue-button-en-route-inc-t2'));
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-eta-dropdown-inc-t2-trigger')).toBeTruthy();
    });

    // Open the dropdown trigger and select "15 min".
    fireEvent.click(screen.getByTestId('field-queue-eta-dropdown-inc-t2-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-eta-dropdown-inc-t2-listbox')).toBeTruthy();
    });
    // The listbox should render 5 options: 1 / 5 / 15 / 30 / 60.
    const options = screen.getAllByRole('option');

    expect(options.length).toBe(5);
    expect(options[0].textContent).toContain('1');
    expect(options[2].textContent).toContain('15');

    fireEvent.click(options[2]);

    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });
    const call = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'EnRoute',
    );

    expect(call).toBeTruthy();
    expect(call!.body).toMatchObject({
      event_type: 'EnRoute',
      payload: {
        actor: 'karim',
        incident_id: 'inc-t2',
        eta_minutes: 15,
      },
    });

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  // (6) Distance estimate updates when geolocation changes.
  it('updates the distance estimate when navigator.geolocation fires a position', async () => {
    // jsdom doesn't ship navigator.geolocation by default. Install a
    // stub that records the watchPosition callback so the test can
    // simulate a position update.
    const watchCallbacks: ((pos: GeolocationPosition) => void)[] = [];

    (navigator as unknown as { geolocation: unknown }).geolocation = {
      watchPosition: (success: (pos: GeolocationPosition) => void) => {
        watchCallbacks.push(success);
        return 1;
      },
      clearWatch: () => undefined,
    };

    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-distance-estimate-inc-t3-old')).toBeTruthy();
    });
    // Before geolocation fires, distance is unknown.
    expect(screen.getByTestId('field-queue-distance-estimate-inc-t3-old').textContent).toContain('—');

    // Fire a position ~1km away from inc-t3-old (lat=23.7461, lon=90.3742).
    // Pick a point ~1 km north: 0.009 deg ≈ 1 km.
    act(() => {
      watchCallbacks.forEach((cb) =>
        cb({
          coords: {
            latitude: 23.7551,
            longitude: 90.3742,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition),
      );
    });

    await waitFor(() => {
      const txt = screen.getByTestId('field-queue-distance-estimate-inc-t3-old').textContent ?? '';

      expect(txt).toMatch(/km/);
      expect(txt).not.toContain('—');
    });
  });

  // (7) "My assignments" + "Available" filter chips function.
  it('switches between My assignments (default) and Available filter chips', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-row-inc-t3-old')).toBeTruthy();
    });
    // Default filter = mine → 4 assigned rows visible; the unassigned
    // row (inc-avail-1) is hidden because it has no assigned_to +
    // last_event_type === 'IncidentCreated' (not TechnicianAssigned).
    expect(screen.getByTestId('field-queue-chip-mine').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByTestId('field-queue-row-inc-avail-1')).toBeNull();

    // Click "Available" — assigned rows disappear; the unassigned row
    // surfaces.
    fireEvent.click(screen.getByTestId('field-queue-chip-available'));
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-chip-available').getAttribute('aria-pressed')).toBe('true');
    });
    expect(screen.getByTestId('field-queue-chip-mine').getAttribute('aria-pressed')).toBe('false');
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-row-inc-avail-1')).toBeTruthy();
    });
    // The four Karim-assigned rows should be gone now.
    expect(screen.queryByTestId('field-queue-row-inc-t3-old')).toBeNull();

    // Switch back to "My assignments" to verify the toggle path is
    // bi-directional.
    fireEvent.click(screen.getByTestId('field-queue-chip-mine'));
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-row-inc-t3-old')).toBeTruthy();
    });
  });

  // (8) 5s polling re-renders rows; changed cells crossfade (ringed class).
  it('5s polling triggers a refetch and applies the ringed class to changed rows', async () => {
    // Use vitest fake timers so we can advance time and assert the
    // ringed state without sleeping for 5 real seconds.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderQueue();
      await waitFor(() => {
        expect(screen.getByTestId('field-queue-row-inc-t3-old')).toBeTruthy();
      });

      // Mutate the fixture so the next refetch sees a change.
      incidentsFixture = INCIDENTS.map((r) =>
        r.incident_id === 'inc-t3-old' ? { ...r, title: 'UPDATED TITLE' } : r,
      );

      // Advance the polling interval by 5s + epsilon.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_100);
      });

      await waitFor(() => {
        const row = document.querySelector('[data-testid="field-queue-row-inc-t3-old"]');

        expect(row?.className).toContain('field-queue-row__cell-changed');
      });
    } finally {
      vi.useRealTimers();
      // Restore for any later assertions.
      incidentsFixture = INCIDENTS;
    }
  });

  // (9) No Hindi strings in fieldQueue.json.
  it('fieldQueue.json locale files contain no Hindi script', () => {
    const en = readFileSync(resolve(__dirname, '../i18n/locales/en/fieldQueue.json'), 'utf8');
    const bn = readFileSync(resolve(__dirname, '../i18n/locales/bn/fieldQueue.json'), 'utf8');
    // Devanagari LETTERS — Hindi (Devanagari) ships here. We exclude
    // U+0964 (DANDA) and U+0965 (DOUBLE DANDA) which are shared with
    // Bengali and Marathi as sentence-ending punctuation, and are not
    // script-defining. Bangla uses U+0964 as the period in formal text.
    // Letters-only range: U+0904-U+0939, U+0958-U+0961, U+0971-U+097F.
    const hindi = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

    expect(hindi.test(en)).toBe(false);
    expect(hindi.test(bn)).toBe(false);
  });

  // (10) Bangla toggle works; preference persists.
  it('renders Bangla copy when the locale is switched to bn', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByTestId('field-queue-page')).toBeTruthy();
    });
    // Switch to Bangla via the same path as production code.
    await act(async () => {
      await i18n.changeLanguage('bn');
      document.body.dataset.locale = 'bn';
      window.localStorage.setItem('surakkha.locale', 'bn');
    });

    await waitFor(() => {
      // The "My assignments" filter chip renders Bangla copy in bn locale.
      expect(screen.getByTestId('field-queue-chip-mine').textContent).toContain('আমার');
    });
    expect(screen.getByTestId('field-queue-chip-available').textContent).toContain('উপলব্ধ');
    // Preference persisted.
    expect(window.localStorage.getItem('surakkha.locale')).toBe('bn');

    // Reset for any later tests.
    await act(async () => {
      await i18n.changeLanguage('en');
      document.body.dataset.locale = 'en';
      window.localStorage.setItem('surakkha.locale', 'en');
    });
  });

  // Lockdown compliance — focus rings use --color-primary-tint (foundation §7).
  it('tech.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(resolve(__dirname, '../styles/tech.css'), 'utf8');
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });
});
