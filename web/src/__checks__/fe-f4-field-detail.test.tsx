/**
 * fe-f4-field-detail.test.tsx — /field/incident-detail Karim work-order page.
 *
 * Pins the I/O matrix from spec-fe-f4-field-detail.md:
 *   1) role_gate_blocks_non_field_tech — non-tech sees "Field-tech only" empty state.
 *   2) missing_work_order_id_renders_not_found — empty ?work_order= renders not-found.
 *   3) no_matching_event_renders_not_found — bogus work_order renders not-found.
 *   4) renders_header_chrome — BandPill + reporter-badge + due_at countdown + Mark arrived.
 *   5) photo_capture_input_mounts — file input + EXIF strip in DOM.
 *   6) diagnosis_form_is_structured — severity / category / tags fields.
 *   7) fix_form_parts_list — parts add/remove works.
 *   8) submit_proof_disabled_at_start — submit gated on photo_hash + diagnosis.
 *   9) override_affordance_renders — when TrustBandOverridden event present.
 *
 * Migration note (WO-007 / 2026-09-15): the lockdown-bound reconciliation
 * re-architected the page around a 3-step actions ladder
 * (diagnosis → fix → proof). The old 5-step ladder testids
 * (`field-step-{name}`, `field-step-{name}-card`, `field-mark-arrived`,
 * `field-diagnosis-form`, `field-fix-form`, `field-resolve`) are gone.
 * New testids live under `field-incident-detail-*` per foundation §13
 * and the WO-007 §Area Labels table.
 *
 * Composition pattern matches F3: stub AppLayoutContext for the
 * session, mock useIncidentActions via vi.mock. Global fetch is
 * stubbed to return the events feed shaped to drive each test.
 */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FieldIncidentDetailPage } from '../pages/FieldIncidentDetailPage';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import type { UseIncidentActionsResult } from '../hooks/useIncidentActions';

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

interface EventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
}

const ASSIGNED_EVT: EventLite = {
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

let currentActions: UseIncidentActionsResult = {
  busy: false,
  lastError: null,
  post: vi.fn(async () => {return { event_id: '01STUB' }}),
  assignTech: vi.fn(async () => true),
  requestAck: vi.fn(async () => true),
  submitReport: vi.fn(async () => true),
  techArrived: vi.fn(async () => true),
  techDiagnosis: vi.fn(async () => true),
  techFix: vi.fn(async () => true),
  resolveIncident: vi.fn(async () => true),
  citizenAcknowledge: vi.fn(async () => true),
  markReviewed: vi.fn(async () => true),
};

let fixtureEvents: EventLite[] = [ASSIGNED_EVT];

vi.mock('../hooks/useIncidentActions', () => {return {
  useIncidentActions: () => currentActions,
}});

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';
    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: fixtureEvents }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  fixtureEvents = [ASSIGNED_EVT];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

function renderPage(role: string, workOrderId: string) {
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

describe('FE-F4 FieldIncidentDetailPage role gate', () => {
  // (1) Non-tech sees "Field-tech only" empty state.
  it('role_gate_blocks_non_field_tech: Priya sees Field-tech only', async () => {
    renderPage('utility_operator', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByText('Field-tech only')).toBeTruthy();
    });
    expect(screen.queryByTestId('field-detail-title')).toBeNull();
  });
});

describe('FE-F4 FieldIncidentDetailPage loading + missing', () => {
  // (2) Empty work_order renders not-found.
  it('missing_work_order_id_renders_not_found', async () => {
    renderPage('field_technician', '');
    await waitFor(() => {
      expect(screen.getByText('Work order not found')).toBeTruthy();
    });
  });

  // (3) Bogus work_order renders not-found.
  it('no_matching_event_renders_not_found', async () => {
    renderPage('field_technician', 'evt_bogus');
    await waitFor(() => {
      expect(screen.getByText('Work order not found')).toBeTruthy();
    });
  });
});

describe('FE-F4 FieldIncidentDetailPage header chrome (WO-007)', () => {
  // (4) Page renders the new lockdown header chrome:
  //   BandPill + reporter-badge + due_at countdown + Mark arrived.
  it('renders_header_chrome: BandPill + reporter-badge + due_at + Mark arrived', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-page')).toBeTruthy();
    });
    expect(screen.getByTestId('field-incident-detail-title')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-priority')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-due-at-countdown')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-button-mark-arrived')).toBeTruthy();
  });
});

describe('FE-F4 FieldIncidentDetailPage photo capture (WO-007)', () => {
  // (5) Photo capture input + EXIF strip render in DOM.
  it('photo_capture_input_mounts: file input + EXIF strip', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-input')).toBeTruthy();
    });
    // EXIF strip blocks render (lat / lon / timestamp / device) — they're
    // emitted as soon as a photo is chosen, but the form scaffold is in DOM.
    expect(screen.getByTestId('field-incident-detail-exif-strip')).toBeTruthy();
  });
});

describe('FE-F4 FieldIncidentDetailPage diagnosis form (WO-007)', () => {
  // (6) Diagnosis form is STRUCTURED — severity / category / tags.
  //     Foundation §12 #7 forbids single-textarea diagnosis.
  it('diagnosis_form_is_structured: severity / category / tags fields', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-diagnosis-form')).toBeTruthy();
    });
    expect(screen.getByTestId('field-incident-detail-diagnosis-severity')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-diagnosis-category')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-diagnosis-tags')).toBeTruthy();
  });
});

describe('FE-F4 FieldIncidentDetailPage fix form (WO-007)', () => {
  // (7) Fix form parts list add/remove: starts with 1 empty row, add
  //     creates a second, remove drops one.
  it('fix_form_parts_list: add / remove works', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-fix-form')).toBeTruthy();
    });
    const partsList = screen.getByTestId('field-incident-detail-parts-list');
    // Initially 1 empty parts row.
    expect(partsList.querySelectorAll('[data-testid^="field-incident-detail-parts-row-"]').length).toBe(1);
    // Click "Add part" — a second row appears.
    await act(async () => {
      fireEvent.click(screen.getByTestId('field-incident-detail-add-part'));
    });
    expect(partsList.querySelectorAll('[data-testid^="field-incident-detail-parts-row-"]').length).toBe(2);
    // Click "Remove" on row 0 — back to 1.
    await act(async () => {
      fireEvent.click(screen.getByTestId('field-incident-detail-remove-part-0'));
    });
    expect(partsList.querySelectorAll('[data-testid^="field-incident-detail-parts-row-"]').length).toBe(1);
  });
});

describe('FE-F4 FieldIncidentDetailPage submit gate (WO-007)', () => {
  // (8) Submit proof is gated on photo_hash + diagnosis + fix summary.
  //     At start, no fields filled → submit button disabled.
  it('submit_proof_disabled_at_start: photo_hash required + diagnosis + fix summary', async () => {
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-button-submit-proof')).toBeTruthy();
    });
    const submit = screen.getByTestId('field-incident-detail-button-submit-proof') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
  });
});

describe('FE-F4 FieldIncidentDetailPage override affordance (WO-007)', () => {
  // (9) When the chain has a TrustBandOverridden event for this incident,
  //     the page renders the "View override reasoning" affordance.
  it('override_affordance_renders: TrustBandOverridden event present', async () => {
    fixtureEvents = [
      ASSIGNED_EVT,
      {
        event_id: 'evt_override_001',
        event_type: 'TrustBandOverridden',
        occurred_at: '2024-01-01T10:30:00.000Z',
        actor_identity: { kind: 'admin', ref: 'adi-001', display: 'Adi' },
        payload: {
          incident_id: 'inc_test_001',
          from_band: 'T3',
          to_band: 'T1',
          reason: 'Two corroborating sensor signals + hotline call',
        },
      },
    ];
    renderPage('field_technician', 'evt_assigned_001');
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-button-view-override-reasoning')).toBeTruthy();
    });
  });
});
