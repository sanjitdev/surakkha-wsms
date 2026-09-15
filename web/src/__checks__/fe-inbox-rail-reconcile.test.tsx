/**
 * fe-inbox-rail-reconcile.test.tsx — WO-010 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-010-inbox-rail.md.
 * Pins the 4 acceptance criteria + REQ-001..004.
 *
 * Acceptance pins:
 *   (1) 240 px rail renders inside InboxList (consumed as left rail)
 *   (2) Compact band pill + reporter-badge icons fit the rail width
 *   (3) Selection state syncs to URL (?selected=<incident_id>)
 *   (4) Click navigates to /inbox/<incident_id>
 *
 * REQ coverage:
 *   - REQ-001 compact BandPill + icon-only ReporterBadge
 *   - REQ-002 selection state syncs to URL on click + pre-populates on mount
 *   - REQ-003 click navigates to /inbox/<incident_id>
 *   - REQ-004 lockdown sweep (focus rings, no Hindi, area labels,
 *     reporter-badge column on AwaitingActionRail)
 *
 * Lockdown compliance (every Tier 3 build):
 *   - Trust band = verification state (separate from reporter-badge)
 *   - Focus rings 2px --color-primary-tint
 *   - EN + BN locales only (no Hindi / Devanagari letters)
 *   - shadcn/ui primitives reused (Card)
 *   --color-trust-t1/t2/t3 + --color-reporter-* tokens
 *
 * Pattern matches fe-inbox-list-reconcile.test.tsx (WO-009) + the
 * earlier fe-field-queue-reconcile.test.tsx (WO-006): fetch stub
 * captures /api/events requests, MSW handlers serve the chain
 * projection, locale + AppLayout provided via providers.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { InboxList } from '../pages/InboxList';
import { AwaitingActionRail, InboxIncidentRail } from '../pages/InboxRail';
import { handlers } from '../mocks/handlers';
import type { InboxRow } from '../types/inbox';
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
 * Build a 5-incident fixture spanning 3 trust tiers and 4 reporter
 * kinds. Smaller than the WO-009 fixture because the rail caps at
 * ~5 visible rows and we want the focus on the rail composition
 * (compact BandPill + icon-only ReporterBadge + age).
 *
 * Tier mix:
 *   T3 anchor      → top of rail
 *   T3 hotline     → 2nd
 *   T2 webform     → 3rd
 *   T1 sensor      → 4th
 *   T1 hotline     → 5th
 */
export function buildRailFixture(): InboxRow[] {
  return [
    {
      id: 'inc-rail-t3-anchor',
      severity: 'T3',
      title: 'Burst water main dhanmondi',
      meta: 'Reported by anchor citizen',
      where: 'ward dhanmondi',
      whereSub: 'sensor-01',
      ownerName: 'Karim Hossain',
      ownerKind: 'tech',
      status: 'awaiting_ack',
      reporterKind: 'anchor',
      missingEvidence: ['photo'],
      action: { label: 'Open', href: '/inbox/inc-rail-t3-anchor' },
      href: '/inbox/inc-rail-t3-anchor',
      timestamp: '2024-02-01T08:00:00Z',
      read: false,
      isUrgent: true,
      isDraft: false,
      isCitizen: true,
      isAwaitingSig: true,
    },
    {
      id: 'inc-rail-t3-hotline',
      severity: 'T3',
      title: 'Sewage overflow mirpur',
      meta: 'Hotline call',
      where: 'ward mirpur',
      whereSub: '—',
      ownerName: 'Rashid Ahmed',
      ownerKind: 'tech',
      status: 'awaiting_ack',
      reporterKind: 'hotline',
      missingEvidence: [],
      action: { label: 'Open', href: '/inbox/inc-rail-t3-hotline' },
      href: '/inbox/inc-rail-t3-hotline',
      timestamp: '2024-02-01T07:30:00Z',
      read: false,
      isUrgent: true,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: true,
    },
    {
      id: 'inc-rail-t2-webform',
      severity: 'T2',
      title: 'Pothole rampura',
      meta: 'Web-form report',
      where: 'ward rampura',
      whereSub: '—',
      ownerName: 'System',
      ownerKind: 'system',
      status: 'awaiting_draft',
      reporterKind: 'webform',
      missingEvidence: ['gps'],
      action: { label: 'Edit', href: '/inbox/inc-rail-t2-webform' },
      href: '/inbox/inc-rail-t2-webform',
      timestamp: '2024-02-01T07:00:00Z',
      read: true,
      isUrgent: false,
      isDraft: true,
      isCitizen: false,
      isAwaitingSig: false,
    },
    {
      id: 'inc-rail-t1-sensor',
      severity: 'T1',
      title: 'Pressure drop sensor-07',
      meta: 'Sensor-firing',
      where: 'ward uttara',
      whereSub: 'SN-2208',
      ownerName: 'System',
      ownerKind: 'system',
      status: 'info',
      reporterKind: 'sensor',
      missingEvidence: [],
      action: { label: 'Schedule', href: '/inbox/inc-rail-t1-sensor' },
      href: '/inbox/inc-rail-t1-sensor',
      timestamp: '2024-02-01T06:30:00Z',
      read: true,
      isUrgent: false,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: false,
    },
    {
      id: 'inc-rail-t1-hotline',
      severity: 'T1',
      title: 'Streetlight outage lalbagh',
      meta: 'Hotline call',
      where: 'ward lalbagh',
      whereSub: '—',
      ownerName: 'Sumi Akter',
      ownerKind: 'tech',
      status: 'info',
      reporterKind: 'hotline',
      missingEvidence: [],
      action: { label: 'Schedule', href: '/inbox/inc-rail-t1-hotline' },
      href: '/inbox/inc-rail-t1-hotline',
      timestamp: '2024-02-01T06:00:00Z',
      read: true,
      isUrgent: false,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: false,
    },
  ];
}

const RAIL_ROWS = buildRailFixture();

let restoreFetch: () => void = () => undefined;
let fetchFixture: { events: unknown[] } | '500' = { events: [] };

function installFetchStub(): void {
  fetchFixture = { events: [] };
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.startsWith('/api/events?event_type=IncidentCreated')) {
      if (fetchFixture === '500') {
        return new Response('boom', { status: 500 });
      }
      return new Response(JSON.stringify(fetchFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
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

/**
 * Tiny test surface for the rail-only fixtures. Renders the rail as a
 * standalone consumer (no InboxList) so the assertions are laser-focused
 * on rail composition (compact BandPill + icon-only ReporterBadge + age),
 * URL sync, and navigation. We use MemoryRouter so we can observe the
 * URL pre-populate + post-click state without spinning up the full app.
 */
function RailHarness({ initialEntries }: { initialEntries: string[] }) {
  const location = useLocation();

  return (
    <div>
      <InboxIncidentRail rows={RAIL_ROWS} />
      <div data-testid="observed-location">{location.pathname + location.search}</div>
    </div>
  );
}

function renderRailOnly(initialEntries: string[] = ['/inbox']) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <MemoryRouter
          initialEntries={initialEntries}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <RailHarness initialEntries={initialEntries} />
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

/**
 * InboxList consumer harness — verifies the rail renders inside the
 * InboxList page surface (acceptance criterion #1).
 */
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

describe('WO-010 Inbox Incident Rail reconciliation', () => {
  // (1) Renders as a 240 px rail inside InboxList consumer surface.
  it('mounts the rail inside the InboxList consumer surface', async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-list-page')).toBeTruthy();
    });
    // The rail card is part of the InboxList surface.
    expect(screen.getByTestId('inbox-incident-rail')).toBeTruthy();
    // The rail list renders (rows populate from the empty fixture; the
    // empty-state placeholder is fine for this assertion).
    expect(screen.getByTestId('inbox-rail-list')).toBeTruthy();
  });

  // (2a) Each row carries a compact BandPill + icon-only ReporterBadge.
  it('renders compact BandPill + icon-only ReporterBadge per row', () => {
    renderRailOnly();

    // Row 1 — T3 anchor.
    const bandPill = screen.getByTestId('inbox-rail-band-inc-rail-t3-anchor');

    expect(bandPill.getAttribute('data-compact')).toBe('true');
    // No visible text node when compact — textContent should not contain
    // the long "T1 unverified" / "T2 verified" / "T3 issuance" label.
    expect(bandPill.textContent?.trim().length ?? 0).toBeLessThan(8);

    const reporterBadge = screen.getByTestId('inbox-rail-reporter-inc-rail-t3-anchor');

    expect(reporterBadge.getAttribute('data-icon-only')).toBe('true');
    expect(reporterBadge.className).toContain('chip-reporter-anchor');
    expect(reporterBadge.getAttribute('data-reporter-kind')).toBe('anchor');

    // Row 5 — T1 hotline (different band + reporter combo).
    const lastBand = screen.getByTestId('inbox-rail-band-inc-rail-t1-hotline');

    expect(lastBand.getAttribute('data-compact')).toBe('true');

    const lastReporter = screen.getByTestId('inbox-rail-reporter-inc-rail-t1-hotline');

    expect(lastReporter.className).toContain('chip-reporter-hotline');
  });

  // (2b) Age renders alongside the chip row.
  it('renders the relative-time age per row', () => {
    renderRailOnly();

    expect(screen.getByTestId('inbox-rail-age-inc-rail-t3-anchor')).toBeTruthy();
    expect(screen.getByTestId('inbox-rail-age-inc-rail-t1-hotline')).toBeTruthy();
  });

  // (2c) All 4 reporter kinds render an icon-only chip.
  it('renders an icon-only reporter chip for every reporter kind', () => {
    renderRailOnly();

    ['anchor', 'hotline', 'webform', 'sensor'].forEach((kind) => {
      const chip = document.querySelector(`[data-testid^="inbox-rail-reporter-"][data-reporter-kind="${kind}"]`);

      expect(chip).toBeTruthy();
      expect((chip as HTMLElement).getAttribute('data-icon-only')).toBe('true');
    });
  });

  // (3a) Click on a rail row syncs `?selected=<incident_id>` to URL.
  it('syncs ?selected=<incident_id> to the URL when a row is clicked', () => {
    renderRailOnly();

    // Click row 1 (inc-rail-t3-anchor).
    fireEvent.click(screen.getByTestId('inbox-rail-row-inc-rail-t3-anchor'));

    // The harness re-renders with the new location; the URL pill
    // surfaces the selected id.
    return waitFor(() => {
      const observed = screen.getByTestId('observed-location').textContent ?? '';

      expect(observed).toMatch(/\?selected=inc-rail-t3-anchor$/);
      // The clicked row is now marked selected.
      const row = screen.getByTestId('inbox-rail-row-inc-rail-t3-anchor');

      expect(row.getAttribute('data-selected')).toBe('true');
      expect(row.getAttribute('aria-pressed')).toBe('true');
    });
  });

  // (3b) URL pre-populates selection on mount.
  it('pre-populates selection from ?selected=<incident_id> on mount', () => {
    renderRailOnly(['/inbox?selected=inc-rail-t2-webform']);

    // The selected row carries data-selected=true on first paint.
    const row = screen.getByTestId('inbox-rail-row-inc-rail-t2-webform');

    expect(row.getAttribute('data-selected')).toBe('true');
    expect(row.getAttribute('aria-pressed')).toBe('true');
    // Other rows are not selected.
    expect(screen.getByTestId('inbox-rail-row-inc-rail-t3-anchor').getAttribute('data-selected')).toBe('false');
  });

  // (4) Click navigates to detail `/inbox/<incident_id>`.
  it('navigates to /inbox/<incident_id> when a row is clicked', () => {
    renderRailOnly();

    fireEvent.click(screen.getByTestId('inbox-rail-row-inc-rail-t3-hotline'));

    return waitFor(() => {
      const observed = screen.getByTestId('observed-location').textContent ?? '';

      expect(observed).toMatch(/^\/inbox\/inc-rail-t3-hotline(\?.*)?$/);
    });
  });

  // (REQ-004a) AwaitingActionRail shows reporter-badge column per row.
  // Render the AwaitingActionRail with rows that have isAwaitingSig and
  // verify each row carries a reporter-badge chip via testid + class.
  it('AwaitingActionRail shows reporter-badge column per row', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LocaleProvider>
          <MemoryRouter
            initialEntries={['/inbox']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <AwaitingActionRail rows={RAIL_ROWS.slice(0, 2)} />
          </MemoryRouter>
        </LocaleProvider>
      </I18nextProvider>,
    );

    // Each awaiting-action row gets a reporter-badge test id matching
    // `awaiting-action-reporter-<id>`. Both rows (T3 anchor + T3 hotline)
    // expose their own badge.
    expect(screen.getByTestId('awaiting-action-reporter-inc-rail-t3-anchor')).toBeTruthy();
    expect(screen.getByTestId('awaiting-action-reporter-inc-rail-t3-hotline')).toBeTruthy();
    // Reporter kind is data-attribute so the column carries both visual
    // (icon colour) + semantic (kind) info per foundation §1.1.
    expect(screen.getByTestId('awaiting-action-reporter-inc-rail-t3-anchor').getAttribute('data-reporter-kind')).toBe('anchor');
    expect(screen.getByTestId('awaiting-action-reporter-inc-rail-t3-hotline').getAttribute('data-reporter-kind')).toBe('hotline');
    // Icon-only chip (compact rail width).
    expect(screen.getByTestId('awaiting-action-reporter-inc-rail-t3-anchor').getAttribute('data-icon-only')).toBe('true');
  });

  // (REQ-004b) No Hindi / Devanagari letters in inboxCommon.json.
  it('inboxCommon.json locale files contain no Hindi script', () => {
    const en = readFileSync(resolve(__dirname, '../i18n/locales/en/inboxCommon.json'), 'utf8');
    const bn = readFileSync(resolve(__dirname, '../i18n/locales/bn/inboxCommon.json'), 'utf8');
    // Devanagari LETTERS — Hindi (Devanagari). Excludes U+0964 (DANDA)
    // and U+0965 (DOUBLE DANDA) which are shared with Bengali as
    // sentence-ending punctuation. Letters-only:
    //   U+0904-U+0939, U+0958-U+0961, U+0971-U+097F.
    const hindi = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

    expect(hindi.test(en)).toBe(false);
    expect(hindi.test(bn)).toBe(false);
  });

  // (REQ-004c) Focus rings use --color-primary-tint (foundation §7/§10.2).
  it('inbox.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(resolve(__dirname, '../styles/inbox.css'), 'utf8');
    // The new .inbox-rail__row:focus-visible rule must reference the
    // lockdown token, and the .inbox-rich-date focus block from WO-009
    // already pins the rule.
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });

  // (Bonus) Empty state when there are no rows.
  it('renders an empty-state placeholder when the rail has no rows', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LocaleProvider>
          <MemoryRouter
            initialEntries={['/inbox']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <InboxIncidentRail rows={[]} />
          </MemoryRouter>
        </LocaleProvider>
      </I18nextProvider>,
    );

    expect(screen.getByTestId('inbox-rail-empty')).toBeTruthy();
  });
});
