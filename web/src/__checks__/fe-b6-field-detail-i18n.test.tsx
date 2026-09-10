/**
 * fe-b6-field-detail-i18n.test.tsx — FieldIncidentDetailPage locale coverage.
 *
 * Locks that Batch 4's migration routes every visible string through
 * `useTranslation('fieldIncidentDetail')`. Same pattern as
 * fe-b6-operator-dashboard-i18n.test.tsx — render under the i18next
 * provider, assert Bengali regex on the surface text.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FieldIncidentDetailPage } from '../pages/FieldIncidentDetailPage';
import i18n, { setLanguage } from '../i18n';
import { Locale } from '../types/domain';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';

function makeSession(role: string): SessionRow {
  return {
    actor_id: 'karim-001',
    actor_ref: 'karim-001',
    display_name: 'Karim — Field Technician',
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

const ASSIGNED_EVT = {
  event_id: 'evt_assigned_001',
  event_type: 'TechnicianAssigned',
  occurred_at: '2024-01-01T10:00:00.000Z',
  actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
  payload: {
    incident_id: 'inc_test_001',
    technician_id: 'karim-001',
    priority: 'P2',
    eta_target_minutes: 30,
    work_order_summary: 'Replace chlorine pump #4',
  },
};

vi.mock('../hooks/useIncidentActions', () => {
  return {
    useIncidentActions: () => ({
      busy: false,
      lastError: null,
      post: vi.fn(async () => ({ event_id: '01STUB' })),
      assignTech: vi.fn(async () => true),
      requestAck: vi.fn(async () => true),
      submitReport: vi.fn(async () => true),
      techArrived: vi.fn(async () => true),
      techDiagnosis: vi.fn(async () => true),
      techFix: vi.fn(async () => true),
      resolveIncident: vi.fn(async () => true),
      citizenAcknowledge: vi.fn(async () => true),
      markReviewed: vi.fn(async () => true),
    }),
  };
});

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: [ASSIGNED_EVT] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  setLanguage(Locale.En);
  delete document.body.dataset.locale;
});

function renderPage(locale: Locale, role: string, workOrderId: string) {
  setLanguage(locale);
  const search = workOrderId ? `?work_order=${workOrderId}` : '';
  const path = `/field/incident-detail${search}`;

  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={[path]}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: makeSession(role),
                chainHead: null,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <Routes>
                <Route path="/field/incident-detail" element={<FieldIncidentDetailPage />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

const BENGALI = /[\u0980-\u09FF]/;

describe('FE-B6 FieldIncidentDetail i18n', () => {
  it('not-found state surfaces Bengali heading + body when locale=bn', async () => {
    renderPage(Locale.Bn, 'field_technician', '');
    await waitFor(() => {
      expect(i18n.language).toBe('bn');
    });
    await waitFor(() => {
      expect(screen.getByTestId('back-to-field')).toBeTruthy();
    });
    // Back link + heading + body all bn.
    expect(screen.getByTestId('back-to-field').textContent ?? '').toMatch(BENGALI);
    // The not-found heading is rendered into the empty state (no testid
    // there) — check the whole document tree for the bn string
    // "কাজের আদেশ" (Work order).
    expect(document.body.textContent ?? '').toContain('কাজের আদেশ');
  });

  it('role-gate empty-state surfaces Bengali copy when locale=bn', async () => {
    renderPage(Locale.Bn, 'utility_operator', 'evt_assigned_001');
    await waitFor(() => {
      expect(i18n.language).toBe('bn');
    });
    await waitFor(() => {
      expect(document.body.textContent ?? '').toContain('ফিল্ড-টেক');
    });
    // Heading "ফিল্ড-টেক" present (bn fieldTechOnly.heading).
    expect(document.body.textContent ?? '').toMatch(BENGALI);
  });

  it('step ladder labels render in Bengali when locale=bn', async () => {
    renderPage(Locale.Bn, 'field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(i18n.language).toBe('bn');
    });
    await waitFor(() => {
      expect(screen.getByTestId('field-step-list')).toBeTruthy();
    });
    // At least one of the step labels is bn — "প্রেরিত" (Dispatched) is
    // the bn translation of `assigned`.
    expect(document.body.textContent ?? '').toContain('প্রেরিত');
  });

  it('en locale keeps English step labels (regression guard)', async () => {
    renderPage(Locale.En, 'field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-step-list')).toBeTruthy();
    });
    // English labels: "Dispatched", "On site", "Diagnosis", ...
    expect(document.body.textContent ?? '').toContain('Dispatched');
    expect(document.body.textContent ?? '').not.toMatch(BENGALI);
  });
});
