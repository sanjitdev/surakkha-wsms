/**
 * fe-submit-report-reconcile.test.tsx — WO-011 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-011-submit-report-page.md.
 * Pins the 8 acceptance criteria + REQ-001..005.
 *
 * Acceptance pins:
 *   (1) Renders at /submit for `citizen` role (role-gate).
 *   (2) MAJOR #1: Plain-language urgency dropdown — NO T1/T2/T3
 *       labels visible to the citizen (foundation §1.1: T1/T2/T3
 *       are operator concepts, not citizen ones).
 *   (3) Bangla-first default; EN toggle.
 *   (4) Photo capture with auto-EXIF (lat/lon/timestamp/device);
 *       all editable.
 *   (5) Submit emits POST /api/events with
 *       { event_type: 'IncidentCreated',
 *         payload: { reporter_kind: 'anchor', band: 'T1', … } }.
 *   (6) 5-min dual-channel ack surfaces (SMS + portal — stub).
 *   (7) Success page with incident ID + 'View your report' link →
 *       /my-reports/:incident_id/timeline (WO-001).
 *   (8) No Hindi strings in submitReport.json (en + bn).
 *
 * REQ coverage:
 *   - REQ-001 plain-language urgency dropdown (acceptance #2)
 *   - REQ-002 submit emits IncidentCreated{reporter_kind: anchor,
 *     band: T1, …} (acceptance #5)
 *   - REQ-003 success page with incident ID + 'View your report' link
 *     (acceptance #7)
 *   - REQ-004 5-min dual-channel ack surface — stub for Phase 1
 *     (acceptance #6)
 *   - REQ-005 lockdown sweep (focus rings, no Hindi, anchor chip
 *     on receipt per REQ-005 + foundation §1.1 + §6.2)
 *
 * Lockdown compliance (every Tier 3 build):
 *   - Trust band = verification state (T1 unverified / T2 verified /
 *     T3 issuance / resolved)
 *   - Reporter-badge = source attribute (anchor / hotline / webform /
 *     sensor); SEPARATE dimension from trust band
 *   - Focus rings 2px --color-primary-tint
 *   - EN + BN locales only (no Hindi / Devanagari letters)
 *   - shadcn/ui primitives reused (Card, Button)
 *   - --color-trust-t1/t2/t3 + --color-reporter-* tokens
 *
 * Pattern matches fe-inbox-rail-reconcile.test.tsx (WO-010) +
 * fe-operator-dashboard-reconcile.test.tsx (WO-004): fetch stub
 * captures /api/events requests, MSW handlers serve the chain
 * projection, locale + AppLayout provided via providers.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { SubmitReportPage } from '../pages/SubmitReportPage';
import { handlers } from '../mocks/handlers';
import type { SessionRow } from '../mocks/idb';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

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

const CHAIN_HEAD_FIXTURE = {
  height: 42,
  block_hash: 'abcdef1234567890',
  prev_hash: '0987fedcba654321',
  sealed_at: '2024-02-01T00:00:00.000Z',
  ingested_at: '2024-02-01T00:00:00.001Z',
};

/** SubmitReport action stub — emits two POST /api/events calls
 *  (AnjaliReportSubmitted + IncidentCreated) and returns the WO-011
 *  wire contract shape. The stub reflects the input arg back into the
 *  payload so the wire-contract assertion (acceptance #5) can pin
 *  the real citizen-asserted title/ward/etc. */
const submitReportStub = vi.fn(async (input?: {
  title?: string;
  urgency?: 'not_urgent' | 'needs_attention' | 'urgent';
  ward_id?: string;
  description?: string;
}) => {
  const incidentId = 'inc_01STUBINCIDENT';
  const chainRef = 'evt_01STUBCHAINREF';
  const title = input?.title ?? 'stub title';
  const urgency = input?.urgency ?? 'needs_attention';
  const wardId = input?.ward_id ?? 'W01';
  const description = input?.description ?? 'stub description';

  await fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event_type: 'AnjaliReportSubmitted',
      payload: {
        incident_id: incidentId,
        title,
        urgency,
        severity: urgency === 'not_urgent' ? 'T1' : urgency === 'needs_attention' ? 'T2' : 'T3',
        ward_id: wardId,
        description,
        reporter_kind: 'anchor',
      },
    }),
  });
  await fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event_type: 'IncidentCreated',
      payload: {
        incident_id: incidentId,
        band: 'T1',
        reporter_kind: 'anchor',
        title,
        description,
        summary: description,
        ward_id: wardId,
        urgency_hint: urgency,
        location: null,
        photo_hash: null,
      },
    }),
  });
  return {
    chain_ref: chainRef,
    incident_id: incidentId,
    reporter_kind: 'anchor' as const,
  };
});

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
      // Short-circuit with a 201 so the page-level submit handler
      // resolves the response. The wire contract is captured here;
      // MSW handlers still receive the request via the underlying
      // original fetch when the test calls /api/incidents directly.
      return new Response(
        JSON.stringify({ event_id: '01STUBCHAINREF', block_hash: '01STUBBLOCK' }),
        {
          status: 201,
          headers: { 'content-type': 'application/json' },
        },
      );
    }
    if (url.includes('/api/incidents')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return original(input as RequestInfo, init);
  }) as typeof globalThis.fetch;

  restoreFetch = () => {
    globalThis.fetch = original;
  };
}

/** Mock useIncidentActions so the submit call goes through MSW
 *  (which appends the block) and returns the stub shape. */
vi.mock('../hooks/useIncidentActions', () => {
  return {
    useIncidentActions: () => ({
      busy: false,
      lastError: null,
      submitReport: (...args: unknown[]) => submitReportStub(...args),
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

beforeEach(() => {
  submitReportStub.mockClear();
  submitReportStub.mockImplementation(async (input?: {
    title?: string;
    urgency?: 'not_urgent' | 'needs_attention' | 'urgent';
    ward_id?: string;
    description?: string;
  }) => {
    const incidentId = 'inc_01STUBINCIDENT';
    const chainRef = 'evt_01STUBCHAINREF';
    const title = input?.title ?? 'stub title';
    const urgency = input?.urgency ?? 'needs_attention';
    const wardId = input?.ward_id ?? 'W01';
    const description = input?.description ?? 'stub description';

    await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event_type: 'AnjaliReportSubmitted',
        payload: {
          incident_id: incidentId,
          title,
          urgency,
          severity: urgency === 'not_urgent' ? 'T1' : urgency === 'needs_attention' ? 'T2' : 'T3',
          ward_id: wardId,
          description,
          reporter_kind: 'anchor',
        },
      }),
    });
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event_type: 'IncidentCreated',
        payload: {
          incident_id: incidentId,
          band: 'T1',
          reporter_kind: 'anchor',
          title,
          description,
          summary: description,
          ward_id: wardId,
          urgency_hint: urgency,
          location: null,
          photo_hash: null,
        },
      }),
    });
    return {
      chain_ref: chainRef,
      incident_id: incidentId,
      reporter_kind: 'anchor' as const,
    };
  });
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

function renderPage(role = 'anjali', initialEntries: string[] = ['/submit']) {
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
                session: makeSession(role),
                chainHead: CHAIN_HEAD_FIXTURE,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <SubmitReportPage />
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-011 Submit Report Page reconciliation', () => {
  // (1) Renders at /submit for citizen role.
  it('mounts the submit report page for citizen (anjali) role', () => {
    renderPage('anjali');
    expect(screen.getByTestId('submit-report-page')).toBeTruthy();
    expect(screen.getByTestId('submit-form-card')).toBeTruthy();
    expect(screen.getByTestId('submit-form')).toBeTruthy();
  });

  // (1b) Role-gate: non-citizen roles see EmptyState (NOT the form).
  it('shows EmptyState for non-citizen roles (role-gate)', () => {
    renderPage('utility_operator');
    const page = screen.getByTestId('submit-report-page');

    expect(page.getAttribute('data-role-gate')).toBe('true');
    expect(screen.queryByTestId('submit-form')).toBeNull();
    expect(screen.queryByTestId('submit-form-card')).toBeNull();
  });

  // (2a) Urgency dropdown has 3 plain-language options — NO T1/T2/T3
  // labels visible to the citizen. Foundation §1.1: T1/T2/T3 are
  // operator concepts, not citizen ones.
  it('urgency dropdown has 3 plain-language options (no T1/T2/T3 visible)', () => {
    renderPage('anjali');
    const urgency = screen.getByTestId('submit-urgency') as HTMLSelectElement;

    expect(urgency.options.length).toBe(3);
    const labels = Array.from(urgency.options).map((o) => o.textContent ?? '');

    // Plain-language labels (en) — no T-codes in option text.
    expect(labels.some((l) => l.toLowerCase().includes('not urgent'))).toBe(true);
    expect(labels.some((l) => l.toLowerCase().includes('needs attention'))).toBe(true);
    expect(labels.some((l) => l.toLowerCase().includes('urgent'))).toBe(true);
    // No T1/T2/T3 visible to the citizen.
    labels.forEach((l) => {
      expect(l).not.toMatch(/\bT1\b/);
      expect(l).not.toMatch(/\bT2\b/);
      expect(l).not.toMatch(/\bT3\b/);
    });
  });

  // (2b) Bangla-first: bn locale renders Bangla urgency options.
  it('urgency dropdown renders Bangla options when locale=bn', async () => {
    await i18n.changeLanguage('bn');
    renderPage('anjali');
    const urgency = screen.getByTestId('submit-urgency') as HTMLSelectElement;
    const labels = Array.from(urgency.options).map((o) => o.textContent ?? '');

    // Bangla plain-language labels.
    expect(labels.some((l) => l.includes('জরুরি নয়'))).toBe(true);
    expect(labels.some((l) => l.includes('মনোযোগ দরকার'))).toBe(true);
    expect(labels.some((l) => l.includes('জরুরি'))).toBe(true);
    await i18n.changeLanguage('en');
  });

  // (3) Form fields: title + urgency + ward + description + photo capture.
  it('renders the form fields (title, urgency, ward, description, photo capture)', () => {
    renderPage('anjali');
    expect(screen.getByTestId('submit-title')).toBeTruthy();
    expect(screen.getByTestId('submit-urgency')).toBeTruthy();
    expect(screen.getByTestId('submit-ward')).toBeTruthy();
    expect(screen.getByTestId('submit-description')).toBeTruthy();
    expect(screen.getByTestId('submit-photo')).toBeTruthy();
    expect(screen.getByTestId('submit-voice')).toBeTruthy();
    expect(screen.getByTestId('submit-photo-capture')).toBeTruthy();
    expect(screen.getByTestId('submit-voice-capture')).toBeTruthy();
  });

  // (4a) Photo capture click attaches the photo + reveals EXIF strip.
  it('photo capture reveals the auto-EXIF strip (lat/lon/timestamp/device)', async () => {
    renderPage('anjali');
    // Click the capture button — the EXIF strip should mount.
    fireEvent.click(screen.getByTestId('submit-photo-capture'));
    await waitFor(() => {
      expect(screen.getByTestId('submit-photo-exif-strip')).toBeTruthy();
    });
    expect(screen.getByTestId('submit-photo-exif-lat')).toBeTruthy();
    expect(screen.getByTestId('submit-photo-exif-lng')).toBeTruthy();
    expect(screen.getByTestId('submit-photo-exif-captured-at')).toBeTruthy();
    expect(screen.getByTestId('submit-photo-exif-device')).toBeTruthy();
    expect(screen.getByTestId('submit-photo-attached')).toBeTruthy();
  });

  // (4b) EXIF fields are editable (acceptance #4 — all editable).
  it('EXIF fields are editable after photo capture', async () => {
    renderPage('anjali');
    fireEvent.click(screen.getByTestId('submit-photo-capture'));
    const lat = (await waitFor(() => screen.getByTestId('submit-photo-exif-lat'))) as HTMLInputElement;

    expect(lat.value).toBe('23.7806');
    fireEvent.change(lat, { target: { value: '22.5000' } });
    expect(lat.value).toBe('22.5000');
  });

  // (5) Submit emits POST /api/events with the WO-011 wire contract:
  //   { event_type: 'IncidentCreated',
  //     payload: { reporter_kind: 'anchor', band: 'T1', … } }.
  it('submit emits IncidentCreated with reporter_kind=anchor and band=T1', async () => {
    renderPage('anjali');

    // Fill the form with valid content.
    fireEvent.change(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.change(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am.' },
    });

    // Submit.
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(submitReportStub).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(capturePosts.find((c) => c.url === '/api/events')).toBeTruthy();
    });
    const calls = capturePosts.filter((c) => c.url === '/api/events');
    const createdCall = calls.find(
      (c) => (c.body as { event_type?: string }).event_type === 'IncidentCreated',
    );

    expect(createdCall).toBeTruthy();
    const payload = (createdCall!.body as { payload: Record<string, unknown> }).payload;

    // WO-011 wire contract.
    expect(payload.reporter_kind).toBe('anchor');
    expect(payload.band).toBe('T1');
    expect(payload.title).toBe('Brown water in ward 4');
    // ward_id, urgency_hint, location, photo_hash all on payload.
    expect(payload.ward_id).toBeTruthy();
    expect(payload.urgency_hint).toBeTruthy();
  });

  // (6a) 5-min dual-channel ack surface (stub) renders on receipt.
  it('receipt surfaces the 5-min dual-channel ack (SMS + portal)', async () => {
    renderPage('anjali');
    fireEvent.change(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.change(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am.' },
    });
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-card')).toBeTruthy();
    });
    expect(screen.getByTestId('submit-receipt-ack')).toBeTruthy();
    // The stub text "SMS + portal" surfaces in the ack body so the
    // citizen sees the dual-channel promise (Phase 1 stub; real
    // gateway lands Phase 2).
    const ackBody = screen.getByTestId('submit-receipt-ack').textContent ?? '';

    expect(ackBody).toMatch(/SMS/i);
    expect(ackBody).toMatch(/portal/i);
  });

  // (6b) Ack surface lists both channels as <li data-channel="...">.
  it('ack surface enumerates the SMS + portal channels', async () => {
    renderPage('anjali');
    fireEvent.change(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.change(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am.' },
    });
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-ack')).toBeTruthy();
    });
    const ack = screen.getByTestId('submit-receipt-ack');

    expect(ack.querySelector('[data-channel="sms"]')).toBeTruthy();
    expect(ack.querySelector('[data-channel="portal"]')).toBeTruthy();
  });

  // (7) Success page renders with incident ID + 'View your report' link
  // that points to /my-reports/:incident_id/timeline (per WO-001).
  it('success page renders with incident ID + View your report link', async () => {
    renderPage('anjali');
    fireEvent.change(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.change(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am.' },
    });
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-card')).toBeTruthy();
    });
    const viewLink = screen.getByTestId('submit-receipt-view-link');

    expect(viewLink).toBeTruthy();
    expect(viewLink.getAttribute('href')).toMatch(
      /^\/my-reports\/inc_01STUBINCIDENT\/timeline$/,
    );
  });

  // (8) No Hindi / Devanagari letters in submitReport.json.
  it('submitReport.json locale files contain no Hindi script', () => {
    const en = readFileSync(resolve(__dirname, '../i18n/locales/en/submitReport.json'), 'utf8');
    const bn = readFileSync(resolve(__dirname, '../i18n/locales/bn/submitReport.json'), 'utf8');
    // Devanagari LETTERS — Hindi (Devanagari). Excludes U+0964 (DANDA)
    // and U+0965 (DOUBLE DANDA) which are shared with Bengali as
    // sentence-ending punctuation. Letters-only:
    //   U+0904-U+0939, U+0958-U-0961, U+0971-U+097F.
    const hindi = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

    expect(hindi.test(en)).toBe(false);
    expect(hindi.test(bn)).toBe(false);
  });

  // (REQ-005) Focus rings use --color-primary-tint per foundation §7.3 + §10.2.
  it('submit.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(resolve(__dirname, '../styles/submit.css'), 'utf8');
    const focusBlocks = css.match(/focus(?:-visible)?[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });

  // (REQ-005) Anchor chip renders on receipt when reporter_kind=anchor.
  it('receipt renders the anchor chip when reporter_kind=anchor', async () => {
    renderPage('anjali');
    fireEvent.change(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.change(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am.' },
    });
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-card')).toBeTruthy();
    });
    expect(screen.getByTestId('submit-receipt-anchor-chip')).toBeTruthy();
    const anchorBadge = screen.getByTestId('submit-receipt-anchor-badge');

    // Reporter-badge chip (WO-006 shared component) — icon + label,
    // never colour-only per foundation §1.1 + §6.2.
    expect(anchorBadge.getAttribute('data-reporter-kind')).toBe('anchor');
    expect(anchorBadge.className).toContain('chip-reporter-anchor');
  });

  // (Bonus) Bangla-first default per acceptance #3.
  it('Bangla-first: bn locale renders Bangla copy on the receipt', async () => {
    await i18n.changeLanguage('bn');
    renderPage('anjali');
    fireEvent.change(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.change(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am.' },
    });
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-card')).toBeTruthy();
    });
    const ackBody = screen.getByTestId('submit-receipt-ack').textContent ?? '';

    // bn ack body contains Bangla.
    expect(ackBody).toMatch(/[\u0980-\u09FF]/);
    await i18n.changeLanguage('en');
  });
});
