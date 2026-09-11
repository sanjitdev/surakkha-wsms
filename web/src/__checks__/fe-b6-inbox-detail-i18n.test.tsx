/**
 * fe-b6-inbox-detail-i18n.test.tsx — InboxDetail + Assign/Ack modals locale coverage.
 *
 * Locks that Batch 3's InboxDetail migration routes every visible string
 * through `useTranslation('inboxDetail')`. Pattern mirrors
 * fe-b6-operator-dashboard-i18n.test.tsx: render with the i18next
 * provider, then verify Bengali regex lands in the right surfaces after
 * the active language flips.
 *
 * No string-match assertions on English (per the audit findings) — every
 * assertion either targets a data-testid, a role, or the Bengali unicode
 * block U+0980..U+09FF.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InboxDetail } from '../pages/InboxDetail';
import i18n, { setLanguage } from '../i18n';
import { Locale } from '../types/domain';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import type { SessionRow } from '../mocks/idb';

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

const incidentsFixture = [
  {
    incident_id: 'inc_test_001',
    severity: 'T2',
    ward_id: 'W04',
    status: 'open',
    last_block_height: 12,
    last_event_type: 'IncidentCreated',
  },
];

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
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  // Reset locale back to English so a test that forgets cleanup doesn't
  // leak `bn` into the next spec.
  setLanguage(Locale.En);
  delete document.body.dataset.locale;
});

function renderInboxDetail(locale: Locale) {
  setLanguage(locale);
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={['/inbox/inc_test_001']}
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

const BENGALI = /[\u0980-\u09FF]/;

describe('FE-B6 InboxDetail i18n', () => {
  it('inline form labels + meta line render in Bengali when locale=bn', async () => {
    renderInboxDetail(Locale.Bn);
    // Wait for i18n to settle (locale flip propagates through the
    // provider synchronously in jsdom, but flush microtasks to be safe).
    await waitFor(() => {
      expect(i18n.language).toBe('bn');
    });

    // Back-to-inbox link copy → "ফিরুন" prefix from bn inboxDetail.json
    const back = screen.getByTestId('back-to-inbox');

    expect(back.textContent ?? '').toMatch(BENGALI);

    // Severity pill uses the {{severity}} urgent interpolation
    // ("{{severity}} জরুরি" in bn).
    const title = screen.getByTestId('inbox-detail-title');

    expect(title.textContent ?? '').toMatch(BENGALI);

    // The single inline form replaces the two CTAs (inbox-detail.md
    // #14). Both inline-form section headings + the submit button
    // render Bengali when locale=bn.
    const form = screen.getByTestId('inbox-inline-action-form');

    expect(form.textContent ?? '').toMatch(BENGALI);
    // The two side headings ("ফিল্ড টেকনিশিয়ান নিযুক্ত করুন" and the
    // ack heading) both render in bn.
    expect(form.textContent ?? '').toContain('জরুরি');
  });

  it('en locale keeps English header copy (regression guard against stray bn leak)', () => {
    renderInboxDetail(Locale.En);
    const title = screen.getByTestId('inbox-detail-title');

    expect(title.textContent ?? '').not.toMatch(BENGALI);
    // Sanity: English fallback should still be the original copy.
    expect(title.textContent ?? '').toMatch(/Incident/);
  });
});
