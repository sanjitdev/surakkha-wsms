/**
 * fe-b6-inbox-detail-hotline-reporter-chip.test.tsx — inbox-detail.md #8 / REQ-008.
 *
 * Pins the load-bearing foundation §1.1 rule on the InboxDetail header:
 * the reporter-badge chip is a SEPARATE dimension from the band pill.
 * When `incident.reporter_kind === 'hotline'`, the detail header renders
 * the hotline chip (☎ + 'Hotline' + reporter-hotline color); when the
 * source is anything else (or undefined), the chip is absent.
 *
 * Asserts:
 *   1) Hotline-sourced fixture → chip test-id is present, kind = 'hotline',
 *      aria-label is the localized spelled-out text, and the icon Lucide
 *      shape (ReporterPhoneIcon) is rendered.
 *   2) Non-hotline fixture → chip test-id is absent (no regression on the
 *      page-header layout when reporter_kind is webform/anchor/sensor or
 *      absent).
 *   3) en/bn key parity for header.reporterChip.* in both locales.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InboxDetail } from '../pages/InboxDetail';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import type { SessionRow } from '../mocks/idb';
import enJson from '../i18n/locales/en/inboxDetail.json';
import bnJson from '../i18n/locales/bn/inboxDetail.json';

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

// Mocked per-test — caller swaps incidentsFixture before render.
let incidentsFixture: Array<Record<string, unknown>> = [];

vi.mock('../hooks/useIncidents', () => {
  return {
    useIncidents: () => ({
      incidents: incidentsFixture,
      loading: false,
      error: null,
    }),
  };
});

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
  }) as typeof global.fetch;
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  void i18n.changeLanguage('en');
});

function renderInboxDetail() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={['/inbox/inc_hotline_001']}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
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
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('FE-B6 InboxDetail hotline reporter-badge chip (inbox-detail.md #8 / REQ-008)', () => {
  // (1) Hotline fixture renders the chip with kind = 'hotline'.
  it('renders the hotline reporter-badge chip when reporter_kind = hotline', async () => {
    incidentsFixture = [
      {
        incident_id: 'inc_hotline_001',
        severity: 'T1',
        ward_id: 'W04',
        status: 'open',
        last_block_height: 1,
        last_event_type: 'IncidentCreated',
        last_occurred_at: '2024-01-15T12:00:00Z',
        reporter_kind: 'hotline',
      },
    ];

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-reporter-badge-chip')).toBeTruthy();
    });

    const chip = screen.getByTestId('inbox-detail-reporter-badge-chip');

    expect(chip.getAttribute('data-reporter-kind')).toBe('hotline');
    expect(chip.className).toContain('chip-reporter-hotline');
    expect(chip.className).toContain('badge--reporter-hotline');
    expect(chip.getAttribute('aria-label')).toBe(enJson.header.reporterChip.hotlineAria);
    // Icon Lucide shape — phone (svg).
    expect(chip.querySelector('svg')).toBeTruthy();
    // Localized label text rendered.
    expect(chip.textContent).toContain(enJson.header.reporterChip.hotline);
  });

  // (2) Non-hotline fixture → no chip (foundation §1.1 separation).
  it('does not render the reporter-badge chip when reporter_kind != hotline', async () => {
    incidentsFixture = [
      {
        incident_id: 'inc_hotline_001',
        severity: 'T2',
        ward_id: 'W04',
        status: 'open',
        last_block_height: 1,
        last_event_type: 'IncidentCreated',
        last_occurred_at: '2024-01-15T12:00:00Z',
        reporter_kind: 'anchor',
      },
    ];

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-title')).toBeTruthy();
    });

    expect(screen.queryByTestId('inbox-detail-reporter-badge-chip')).toBeNull();
  });

  // (2b) reporter_kind absent → no chip (defaults are projected on the
  // dashboard but the detail header keeps the chip scoped to hotline per
  // inbox-detail.md #8 lock-in).
  it('does not render the chip when reporter_kind is absent', async () => {
    incidentsFixture = [
      {
        incident_id: 'inc_hotline_001',
        severity: 'T2',
        ward_id: 'W04',
        status: 'open',
        last_block_height: 1,
        last_event_type: 'IncidentCreated',
        last_occurred_at: '2024-01-15T12:00:00Z',
        // no reporter_kind
      },
    ];

    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-title')).toBeTruthy();
    });

    expect(screen.queryByTestId('inbox-detail-reporter-badge-chip')).toBeNull();
  });

  // (3) en/bn key parity for header.reporterChip.*.
  it('en/bn key parity: header.reporterChip.* keys exist in both locales', () => {
    expect(enJson.header.reporterChip.hotline, 'en.header.reporterChip.hotline').toBeTruthy();
    expect(bnJson.header.reporterChip.hotline, 'bn.header.reporterChip.hotline').toBeTruthy();
    expect(enJson.header.reporterChip.hotlineAria, 'en.header.reporterChip.hotlineAria').toBeTruthy();
    expect(bnJson.header.reporterChip.hotlineAria, 'bn.header.reporterChip.hotlineAria').toBeTruthy();
  });
});
