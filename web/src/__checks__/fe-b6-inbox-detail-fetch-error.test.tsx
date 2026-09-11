/**
 * fe-b6-inbox-detail-fetch-error.test.tsx — InboxDetail fetch-failure UI.
 *
 * Locks the FE-1.3c follow-up (deferred-work.md, Edge-Hunter finding):
 * when /api/incidents returns 500, InboxDetail renders a distinct
 * fetch-failure panel with a Retry button — NOT the "Incident not found"
 * panel. The two branches were conflated before this fix.
 *
 * Coverage:
 *   1) error=Error + incidents=[] + loading=false  → fetch-error panel
 *   2) Retry button (data-testid="inbox-detail-retry") is present and
 *      clickable; clicking calls useIncidents().refetch().
 *   3) "Incident not found" copy does NOT render when error is non-null
 *      (regression guard against the conflated branch).
 *   4) en/bn key parity for fetchError.{title, body, emptyHeading,
 *      emptyBody, retryCta}.
 */

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

const originalFetch = global.fetch;
const refetchSpy = vi.fn(async () => {});

vi.mock('../hooks/useIncidents', () => {
  return {
    useIncidents: () => {
      return {
        incidents: [],
        loading: false,
        error: new Error('useIncidents: /api/incidents returned 500'),
        refetch: refetchSpy,
      };
    },
  };
});

beforeEach(() => {
  refetchSpy.mockClear();
  global.fetch = vi.fn((url: RequestInfo | URL) => {
    let u = '';
    if (typeof url === 'string') {
      u = url;
    } else if (url instanceof URL) {
      u = url.toString();
    }
    if (u.startsWith('/api/events')) {
      return Promise.resolve(
        new Response(JSON.stringify({ events: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
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
            initialEntries={['/inbox/inc_missing_001']}
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

describe('FE-B6 InboxDetail fetch-failure UI', () => {
  it('renders the fetch-error panel (not "Incident not found") when useIncidents returns an error', async () => {
    renderInboxDetail(Locale.En);

    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-fetch-error')).toBeTruthy();
    });

    // The "Incident not found" panel must NOT render when error is non-null.
    expect(screen.queryByTestId('inbox-detail-not-found')).toBeNull();

    // Retry CTA is present.
    expect(screen.getByTestId('inbox-detail-retry')).toBeTruthy();
  });

  it('clicking the Retry button calls useIncidents().refetch()', async () => {
    renderInboxDetail(Locale.En);

    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-retry')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('inbox-detail-retry'));
    expect(refetchSpy).toHaveBeenCalledTimes(1);
  });

  it('bn locale: fetchError panel + retry CTA render Bengali copy', async () => {
    renderInboxDetail(Locale.Bn);

    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-fetch-error')).toBeTruthy();
    });

    const panel = screen.getByTestId('inbox-detail-fetch-error');
    expect(panel.textContent ?? '').toMatch(BENGALI);
    // Regression guard: bn copy is present.
    expect(panel.textContent ?? '').toContain('আবার চেষ্টা');
  });

  it('en/bn key parity for fetchError.{title, body, emptyHeading, emptyBody, retryCta}', () => {
    const en = enJson.fetchError as Record<string, string>;
    const bn = bnJson.fetchError as Record<string, string>;
    for (const k of ['title', 'body', 'emptyHeading', 'emptyBody', 'retryCta']) {
      expect(en[k], `en.fetchError.${k}`).toBeTruthy();
      expect(bn[k], `bn.fetchError.${k}`).toBeTruthy();
    }
  });
});
