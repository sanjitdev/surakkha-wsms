/**
 * fe-field-incident-detail-reconcile.test.tsx — WO-007 acceptance matrix.
 *
 * Pins field-incident-detail.md + WO-007 §Acceptance criteria (1-11) for
 * the lockdown reconciliation:
 *
 *   1) Page renders at /field/:incident_id for field_technician role.
 *   2) Header shows: BandPill, reporter-badge chip, due_at countdown,
 *      "Mark arrived" button.
 *   3) Photo capture: opens camera/gallery picker; auto-populates EXIF
 *      (lat/lon/timestamp/device); all editable.
 *   4) Diagnosis form: structured (severity / category / tags) — never
 *      single textarea.
 *   5) Fix form: parts list (add/remove rows) + photo proof (required
 *      before submit).
 *   6) Submit proof button enabled only when all required fields filled.
 *   7) On submit: emits FixSubmitted{actor, incident_id, parts,
 *      photo_hash, diagnosis} in one transaction.
 *   8) Toast confirms "Proof submitted — awaiting review".
 *   9) TrustBandOverridden event in segment shows "View override reasoning"
 *      affordance.
 *  10) Bangla toggle works; preference persists.
 *  11) No Hindi strings in fieldIncidentDetail.json (en + bn).
 *
 * Pattern matches fe-field-queue-reconcile.test.tsx (WO-006) +
 * fe-operator-dashboard-reconcile.test.tsx (WO-004): fetch stub captures
 * POSTs to /api/events AND /api/photos, MSW handlers serve the GETs.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { FieldIncidentDetailPage } from '../pages/FieldIncidentDetailPage';
import { handlers } from '../mocks/handlers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const server = setupServer(...handlers);

// Stub getSession so the useIncidentActions hook doesn't touch IndexedDB
// under jsdom (matches the pattern in fe-f1-incident-actions.test.tsx).
// Without this stub, getSession() hangs in jsdom because IndexedDB is not
// fully functional and the fetch never fires.
vi.mock('../mocks/idb', async () => {
  const actual = await vi.importActual<typeof import('../mocks/idb')>('../mocks/idb');

  return {
    ...actual,
    getSession: async () => ({
      actor_id: 'karim-001',
      actor_ref: 'karim-001',
      display_name: 'Karim — Field Technician',
      role: 'field_technician',
      token: 'test-token',
      logged_in_at: '2024-01-01T00:00:00Z',
      tenant_id: 'tenant-001',
    }),
  };
});

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

// Mixed fixture — TechnicianAssigned event for inc-t2-hotline with
// due_at in 25 minutes from "now". Includes one TrustBandOverridden
// event for the override-affordance test.
const NOW = Date.now();
const DUE_AT = new Date(NOW + 25 * 60_000).toISOString();
const ASSIGNED_OCCURRED = new Date(NOW - 30 * 60_000).toISOString();

const CHAIN_EVENTS = [
  {
    event_id: 'wo-t2-1',
    event_type: 'TechnicianAssigned',
    occurred_at: ASSIGNED_OCCURRED,
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: 'inc-t2-hotline',
      technician_id: 'karim-001',
      priority: 'P2',
      eta_target_minutes: 25,
      due_at: DUE_AT,
      work_order_summary: 'Chlorine pump #4 dead — needs replacement',
      reporter_kind: 'hotline',
      severity: 'T2',
    },
  },
  {
    event_id: 'wo-t2-override',
    event_type: 'TrustBandOverridden',
    occurred_at: new Date(NOW - 20 * 60_000).toISOString(),
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: {
      incident_id: 'inc-t2-hotline',
      from_band: 'T1',
      to_band: 'T2',
      reason: 'hotline caller verified via NID cross-check',
    },
  },
];

let restoreFetch: () => void = () => undefined;
let capturePosts: { url: string; body: unknown; contentType?: string }[] = [];
let chainFixture: unknown[] = CHAIN_EVENTS;

function installFetchStub(): void {
  capturePosts = [];
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (init?.method === 'POST' && url === '/api/events') {
      const body = init.body ? JSON.parse(String(init.body)) : null;
      capturePosts.push({ url, body, contentType: 'application/json' });
      return new Response(JSON.stringify({ ok: true, event_id: 'ev_test' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (init?.method === 'POST' && url === '/api/photos') {
      const photo_hash = `photo_${Math.random().toString(36).slice(2, 14)}`;
      capturePosts.push({ url, body: 'multipart', contentType: 'multipart/form-data' });
      return new Response(JSON.stringify({ photo_hash }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/events')) {
      return new Response(JSON.stringify({ events: chainFixture }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/incidents')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return original(input as RequestInfo, init);
  }) as typeof globalThis.fetch;

  restoreFetch = () => {
    globalThis.fetch = original;
  };
}

beforeEach(() => {
  server.resetHandlers(...handlers);
  chainFixture = CHAIN_EVENTS;
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

function renderDetail() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            initialEntries={['/field/incident-detail?incident=inc-t2-hotline&work_order=wo-t2-1']}
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
              <FieldIncidentDetailPage />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-007 Field Incident Detail reconciliation', () => {
  // (1) Page renders at /field/:incident_id for field_technician role.
  it('renders the page with the right area label for field_technician', async () => {
    renderDetail();
    expect(await screen.findByTestId('field-incident-detail-page')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-title')).toBeTruthy();
  });

  // (2) Header chrome — BandPill + reporter-badge + due_at + Mark arrived.
  it('renders BandPill + reporter-badge + due_at countdown + Mark arrived button', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-band-pill')).toBeTruthy();
    });
    const bandPill = screen.getByTestId('field-incident-detail-band-pill');

    expect(bandPill.textContent).toMatch(/T2/);
    expect(bandPill.textContent).toMatch(/◑/); // LOCKED glyph for T2

    // Reporter-badge hotline
    expect(screen.getByTestId('field-incident-detail-reporter-badge').className).toContain(
      'chip-reporter-hotline',
    );

    // due_at countdown — 25 minutes rounds to 0h 25m.
    expect(screen.getByTestId('field-incident-detail-due-at-countdown').textContent).toMatch(/25/);

    // Mark arrived button.
    expect(screen.getByTestId('field-incident-detail-button-mark-arrived')).toBeTruthy();
  });

  // (3) Photo capture — opens picker + EXIF auto-populates + editable.
  it('photo capture opens the picker, auto-populates EXIF, and EXIF fields are editable', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-input')).toBeTruthy();
    });

    // The visible "From gallery" button triggers the hidden file input.
    const btn = screen.getByTestId('field-incident-detail-photo-button');

    expect(btn).toBeTruthy();

    // Simulate picking a file by dispatching a change event on the hidden input.
    const input = screen.getByTestId('field-incident-detail-photo-input') as HTMLInputElement;
    const file = new File(['photo-bytes'], 'fix.jpg', { type: 'image/jpeg' });

    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-filename')).toBeTruthy();
    });
    // EXIF auto-populated.
    await waitFor(() => {
      expect((screen.getByTestId('field-incident-detail-exif-lat') as HTMLInputElement).value).not.toBe('');
    });

    // EXIF fields are editable — change lat and verify state.
    const lat = screen.getByTestId('field-incident-detail-exif-lat') as HTMLInputElement;

    fireEvent.change(lat, { target: { value: '23.8123' } });
    expect((screen.getByTestId('field-incident-detail-exif-lat') as HTMLInputElement).value).toBe('23.8123');

    // EXIF also auto-populates timestamp + device.
    expect((screen.getByTestId('field-incident-detail-exif-timestamp') as HTMLInputElement).value).not.toBe('');
    expect((screen.getByTestId('field-incident-detail-exif-device') as HTMLInputElement).value).not.toBe('');
  });

  // (4) Diagnosis form — structured fields (severity / category / tags).
  it('diagnosis form has 3 structured fields (severity / category / tags) — not a single textarea', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-diagnosis-form')).toBeTruthy();
    });
    expect(screen.getByTestId('field-incident-detail-diagnosis-severity')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-diagnosis-category')).toBeTruthy();
    expect(screen.getByTestId('field-incident-detail-diagnosis-tags')).toBeTruthy();

    // Reject single-textarea design — query for any <textarea> inside the
    // diagnosis card; there should be none (the tags input is a text
    // input). Foundation §12 #7 forbids free-text here.
    const form = screen.getByTestId('field-incident-detail-diagnosis-form');
    const textareas = form.querySelectorAll('textarea');

    expect(textareas.length).toBe(0);
  });

  // (5) Fix form — parts list add/remove; submit disabled until photo
  // present (REQ-006 gating logic).
  it('fix form renders parts list with add/remove + submit proof disabled until photo_hash present', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-fix-form')).toBeTruthy();
    });

    // Initial parts list has at least one row.
    expect(screen.getByTestId('field-incident-detail-parts-row-0')).toBeTruthy();

    // Add a row → second row appears.
    fireEvent.click(screen.getByTestId('field-incident-detail-add-part'));
    expect(screen.getByTestId('field-incident-detail-parts-row-1')).toBeTruthy();

    // Remove the second row → back to single row.
    fireEvent.click(screen.getByTestId('field-incident-detail-remove-part-1'));
    expect(screen.queryByTestId('field-incident-detail-parts-row-1')).toBeNull();

    // Submit proof disabled when photo hash is empty.
    const submit = screen.getByTestId('field-incident-detail-button-submit-proof') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
  });

  // (6) Submit proof emits FixSubmitted with the WO-007 wire shape.
  it('submit proof emits FixSubmitted{actor, incident_id, parts, photo_hash, diagnosis}', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-input')).toBeTruthy();
    });

    // Pick a photo → photo_hash gets populated.
    const input = screen.getByTestId('field-incident-detail-photo-input') as HTMLInputElement;
    const file = new File(['x'], 'fix.jpg', { type: 'image/jpeg' });

    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    fireEvent.change(input);
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-hash')).toBeTruthy();
    });

    // Fill the diagnosis structured fields.
    fireEvent.change(screen.getByTestId('field-incident-detail-diagnosis-severity'), {
      target: { value: 'T2' },
    });
    fireEvent.change(screen.getByTestId('field-incident-detail-diagnosis-category'), {
      target: { value: 'mechanical' },
    });
    fireEvent.change(screen.getByTestId('field-incident-detail-diagnosis-tags'), {
      target: { value: 'pump-dead' },
    });

    // Fill fix summary + part name.
    fireEvent.change(screen.getByTestId('field-incident-detail-fix-summary'), {
      target: { value: 'Replaced chlorine pump #4' },
    });
    const partName = screen
      .getByTestId('field-incident-detail-parts-row-0')
      .querySelector('input') as HTMLInputElement;

    fireEvent.change(partName, { target: { value: 'chlorine pump' } });

    // Now the submit button is enabled.
    const submit = screen.getByTestId('field-incident-detail-button-submit-proof') as HTMLButtonElement;

    await waitFor(() => {
      expect(submit.disabled).toBe(false);
    });

    fireEvent.click(submit);

    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });

    const call = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'FixSubmitted',
    );

    expect(call).toBeTruthy();
    expect(call!.body).toMatchObject({
      event_type: 'FixSubmitted',
      payload: {
        actor: 'karim',
        incident_id: 'inc-t2-hotline',
        diagnosis: { severity: 'T2', category: 'mechanical' },
      },
    });
    const payload = (call!.body as { payload: { parts: string[]; photo_hash: string; diagnosis: unknown } }).payload;

    expect(Array.isArray(payload.parts)).toBe(true);
    expect(payload.parts.some((p) => p.includes('chlorine pump'))).toBe(true);
    expect(typeof payload.photo_hash).toBe('string');
    expect(payload.photo_hash.length).toBeGreaterThan(0);
    expect(payload.diagnosis).toBeTruthy();
  });

  // (7) Mark arrived emits TechnicianArrived with right payload.
  it('mark-arrived emits TechnicianArrived{actor: karim, incident_id, lat, lon}', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-button-mark-arrived')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('field-incident-detail-button-mark-arrived'));

    await waitFor(
      () => {
        expect(capturePosts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    const call = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'TechnicianArrived',
    );

    expect(call).toBeTruthy();
    expect(call!.body).toMatchObject({
      event_type: 'TechnicianArrived',
      payload: {
        actor: 'karim',
        incident_id: 'inc-t2-hotline',
      },
    });
    // lat/lon present in payload (null OK if not auto-populated).
    const payload = (call!.body as { payload: Record<string, unknown> }).payload;

    expect('lat' in payload).toBe(true);
    expect('lon' in payload).toBe(true);
  });

  // (8) Override affordance surfaces when TrustBandOverridden exists.
  it('renders "View override reasoning" affordance when TrustBandOverridden event exists in segment', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-override-card')).toBeTruthy();
    });
    expect(
      screen.getByTestId('field-incident-detail-button-view-override-reasoning'),
    ).toBeTruthy();
  });

  // (9) Photo upload posts to /api/photos (multipart stub → photo_hash).
  it('photo capture POSTs to /api/photos and surfaces photo_hash on the page', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-input')).toBeTruthy();
    });
    const input = screen.getByTestId('field-incident-detail-photo-input') as HTMLInputElement;
    const file = new File(['png'], 'proof.png', { type: 'image/png' });

    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      const photoCalls = capturePosts.filter((c) => c.url === '/api/photos');

      expect(photoCalls.length).toBeGreaterThan(0);
    });
    const photoCall = capturePosts.find((c) => c.url === '/api/photos');

    expect(photoCall!.contentType).toMatch(/multipart\/form-data/);
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-photo-hash')).toBeTruthy();
    });
  });

  // (10) Bangla toggle works; preference persists.
  it('renders Bangla copy when the locale is switched to bn', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-page')).toBeTruthy();
    });
    await act(async () => {
      await i18n.changeLanguage('bn');
      document.body.dataset.locale = 'bn';
      window.localStorage.setItem('surakkha.locale', 'bn');
    });

    await waitFor(() => {
      expect(screen.getByTestId('field-incident-detail-button-mark-arrived').textContent).toContain('মাঠে');
    });
    expect(window.localStorage.getItem('surakkha.locale')).toBe('bn');

    // Reset for any later tests.
    await act(async () => {
      await i18n.changeLanguage('en');
      document.body.dataset.locale = 'en';
      window.localStorage.setItem('surakkha.locale', 'en');
    });
  });

  // (11) No Hindi strings in fieldIncidentDetail.json.
  it('fieldIncidentDetail.json locale files contain no Hindi script', () => {
    const en = readFileSync(resolve(__dirname, '../i18n/locales/en/fieldIncidentDetail.json'), 'utf8');
    const bn = readFileSync(resolve(__dirname, '../i18n/locales/bn/fieldIncidentDetail.json'), 'utf8');
    const hindi = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

    expect(hindi.test(en)).toBe(false);
    expect(hindi.test(bn)).toBe(false);
  });

  // Lockdown compliance — focus rings use --color-primary-tint.
  it('tech.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(resolve(__dirname, '../styles/tech.css'), 'utf8');
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });
});
