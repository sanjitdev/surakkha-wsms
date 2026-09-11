/**
 * fe-b6-submit-report-i18n.test.tsx — SubmitReportPage locale coverage.
 *
 * Locks that Batch 5's migration routes every visible string through
 * `useTranslation('submitReport')`. Mirrors the pattern from
 * fe-b6-inbox-detail-i18n.test.tsx: I18nextProvider + bn-render +
 * Bengali-regex assertion.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { SubmitReportPage } from '../pages/SubmitReportPage';
import i18n, { setLanguage } from '../i18n';
import { Locale } from '../types/domain';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';

function makeSession(role: string, name = 'Anjali Devi'): SessionRow {
  return {
    actor_id: `${role}-001`,
    actor_ref: `${role}-001`,
    display_name: name,
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

vi.mock('../hooks/useIncidentActions', () => {
  return {
    useIncidentActions: () => ({
      busy: false,
      lastError: null,
      submitReport: vi.fn(async () => {return { chain_ref: '01STUBCHAINREF' }}),
      post: vi.fn(async () => ({ event_id: '01STUB' })),
      assignTech: vi.fn(async () => true),
      requestAck: vi.fn(async () => true),
      techArrived: vi.fn(async () => true),
      techDiagnosis: vi.fn(async () => true),
      techFix: vi.fn(async () => true),
      resolveIncident: vi.fn(async () => true),
      citizenAcknowledge: vi.fn(async () => true),
      markReviewed: vi.fn(async () => true),
    }),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  setLanguage(Locale.En);
  delete document.body.dataset.locale;
});

function renderPage(locale: Locale, role = 'anjali') {
  setLanguage(locale);
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
              session: makeSession(role),
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <SubmitReportPage />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

const BENGALI = /[\u0980-\u09FF]/;

describe('FE-B6 SubmitReport i18n', () => {
  it('form labels + submit button render in Bengali when locale=bn', async () => {
    renderPage(Locale.Bn);
    await waitFor(() => {
      expect(i18n.language).toBe('bn');
    });

    // Title + Description labels
    expect(screen.getByTestId('submit-form')).toBeTruthy();
    // Bengali strings should appear somewhere in the form document.
    expect(document.body.textContent ?? '').toMatch(BENGALI);
    // Urgency select options use bn copy: "জরুরি" ("urgent").
    const urgency = screen.getByTestId('submit-urgency');

    expect(urgency.textContent ?? '').toContain('জরুরি');
  });

  it('role-gate empty state renders Bengali heading when locale=bn', async () => {
    renderPage(Locale.Bn, 'utility_operator');
    await waitFor(() => {
      expect(i18n.language).toBe('bn');
    });
    // bn roleGate.heading = "ভুল পার্সোনা"
    expect(document.body.textContent ?? '').toContain('ভুল পার্সোনা');
  });

  it('en locale keeps English labels (regression guard)', () => {
    renderPage(Locale.En);
    // Urgency options use en copy: "Not urgent — no immediate risk".
    const urgency = screen.getByTestId('submit-urgency');

    expect(urgency.textContent ?? '').toContain('Not urgent');
    expect(document.body.textContent ?? '').not.toMatch(BENGALI);
  });
});
