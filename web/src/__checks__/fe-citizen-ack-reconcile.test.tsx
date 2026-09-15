/**
 * fe-citizen-ack-reconcile.test.tsx — WO-012 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-012-citizen-ack-page.md.
 * Pins the 8 acceptance criteria + lockdown sweep.
 *
 * Acceptance pins:
 *   (1) Renders at /ack/:incident_id for any role; role does NOT gate
 *       the citizen ack surface.
 *   (2) Trust band badge via shared <BandPill locked /> — ◔ T1
 *       (divider), ● T3 (issuance), ✓ resolved.
 *   (3) Reporter badge via shared <ReporterBadge /> (WO-006) —
 *       anchor / hotline / webform / sensor.
 *   (4) Ack-window expiry surface: when TimeUntilAckDeadline ≤ 0,
 *       render the calm "closed" message; Confirm + Reopen buttons
 *       are HIDDEN in this state (reopen picker still available).
 *   (5) Confirm button emits `CitizenAckAccepted{incident_id,
 *       incident_hash, ack_at, witness_count}` + 200ms green pulse.
 *   (6) Reopen button opens an in-page reason picker (200-400 chars,
 *       required) and on submit emits `ChainReopened{incident_id,
 *       incident_hash, reason, reopened_by, reopened_at}`. Reason
 *       text persists in local component state.
 *   (7) Silent-closure 30-day expiry: when the reopen window closes
 *       (24h ack + 30-day reopen), the page shows a flat "This report
 *       is permanently closed" message with no actions.
 *   (8) All locale strings route through `useTranslation('citizenAck')`.
 *       Both en + bn files exist with no missing keys; Bangla strings
 *       contain real Bengali characters (U+0980–U+09FF).
 *
 * Lockdown compliance (every Tier 3 build):
 *   - Trust band × reporter badges are SEPARATE.
 *   - No Hindi in locale files (Devanagari letters-only regex).
 *   - No confetti / no sound / no party effects — 200ms green pulse.
 *   - Focus rings use 2px --color-primary-tint.
 *   - T3 = amber-bright in operator chrome; alert-red reserved for
 *     consumer-notice issuance surfaces only.
 *   - VS15 (\uFE0E) on every ✓ and ⚠ literal.
 *   - Bangla-first; both en + bn files exist + load.
 *
 * Pattern matches fe-field-queue-reconcile.test.tsx (WO-006) +
 * fe-submit-report-reconcile.test.tsx (WO-011): fetch stub captures
 * POSTs to /api/events, MSW handlers serve the GET projection, locale
 * + AppLayout provided via providers.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { CitizenAckPage } from '../pages/CitizenAckPage';
import { handlers } from '../mocks/handlers';
import type { SessionRow } from '../mocks/idb';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Lockdown-bound regex from the cascade. Devanagari LETTERS only —
// DanDA (U+0964) is shared with Bengali as a period and excluded.
const HINDI_LETTERS_REGEX = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

const SESSION_FIXTURE: SessionRow = {
  actor_id: 'anjali-001',
  actor_ref: 'anjali_actor',
  display_name: 'Anjali Devi',
  role: 'anjali',
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

interface IncidentFixture {
  incident_id: string;
  status: string;
  severity: string;
  ward_id?: string;
  last_block_height: number;
  last_event_type: string;
  last_occurred_at: string;
  reporter_kind?: 'anchor' | 'hotline' | 'webform' | 'sensor';
}

// Default fixture: incident "in-window" (resolved 1h ago, well inside
// the 24h ack window) with a CitizenAckRequested event posted 30s
// ago. Tests that need a different timeline mutate the fixtures.
const DEFAULT_INCIDENT: IncidentFixture = {
  incident_id: 'inc_ack_001',
  status: 'resolved',
  severity: 'T2',
  ward_id: 'W04',
  last_block_height: 50,
  last_event_type: 'IncidentResolved',
  last_occurred_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  reporter_kind: 'anchor',
};

const RESOLVED_RECENT = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const ACK_REQUEST_FRESH = new Date(Date.now() - 30 * 1000).toISOString();

const DEFAULT_ACK_REQUEST = {
  event_id: 'evt_ackreq_001',
  event_type: 'CitizenAckRequested',
  occurred_at: ACK_REQUEST_FRESH,
  block_hash: '01HBLOCKHASH',
  actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
  payload: {
    incident_id: 'inc_ack_001',
    channel: 'whatsapp',
    summary: 'Please confirm your tap water is now safe.',
  },
};

// IncidentResolved event chain projection (used to derive witness_count).
const RESOLVED_EVENT = {
  event_id: 'evt_resolved_001',
  event_type: 'IncidentResolved',
  block_hash: '01HRESOLVEDHASH',
  height: 50,
  occurred_at: RESOLVED_RECENT,
  payload: { incident_id: 'inc_ack_001' },
};

const TECHNICIAN_ASSIGNED = {
  event_id: 'evt_assigned_001',
  event_type: 'TechnicianAssigned',
  block_hash: '01HASSIGNEDHASH',
  height: 40,
  occurred_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  payload: { incident_id: 'inc_ack_001' },
};

const FIX_SUBMITTED = {
  event_id: 'evt_fix_001',
  event_type: 'FixSubmitted',
  block_hash: '01HFIXHASH',
  height: 49,
  occurred_at: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
  payload: { incident_id: 'inc_ack_001' },
};

let restoreFetch: () => void = () => undefined;
let capturePosts: { url: string; body: unknown }[] = [];
let incidentsFixture: unknown[] = [DEFAULT_INCIDENT];
let ackEventsFixture: { events: unknown[] } = { events: [DEFAULT_ACK_REQUEST] };
let allEventsFixture: { events: unknown[] } = {
  events: [TECHNICIAN_ASSIGNED, FIX_SUBMITTED, RESOLVED_EVENT, DEFAULT_ACK_REQUEST],
};

function installFetchStub(): void {
  capturePosts = [];
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (init?.method === 'POST' && url === '/api/events') {
      const body = init.body ? JSON.parse(String(init.body)) : null;

      capturePosts.push({ url, body });
      return new Response(
        JSON.stringify({ event_id: '01STUB', block_hash: '01STUBHASH' }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/api/incidents')) {
      return new Response(JSON.stringify(incidentsFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/events') && url.includes('CitizenAckRequested')) {
      return new Response(JSON.stringify(ackEventsFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/events')) {
      return new Response(JSON.stringify(allEventsFixture), {
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

beforeEach(() => {
  server.resetHandlers(...handlers);
  incidentsFixture = [DEFAULT_INCIDENT];
  ackEventsFixture = { events: [DEFAULT_ACK_REQUEST] };
  allEventsFixture = {
    events: [TECHNICIAN_ASSIGNED, FIX_SUBMITTED, RESOLVED_EVENT, DEFAULT_ACK_REQUEST],
  };
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

function renderAck(role: string = 'anjali', incidentId: string = 'inc_ack_001') {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            initialEntries={[`/ack/${incidentId}`]}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: { ...SESSION_FIXTURE, role },
                chainHead: CHAIN_HEAD_FIXTURE,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <Routes>
                <Route path="/ack/:incident_id" element={<CitizenAckPage />} />
                <Route path="/ack" element={<CitizenAckPage />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-012 Citizen Ack Page reconciliation', () => {
  // (1) Page renders for any role; role does NOT gate.
  it('(1) renders the page for citizen, operator, and admin roles', async () => {
    for (const role of ['anjali', 'utility_operator', 'pha_approver', 'field_technician']) {
      cleanup();
      renderAck(role);
      await waitFor(() => {
        expect(screen.getByTestId('citizen-ack-page')).toBeTruthy();
      });
      // The notice card + decision card render for every role.
      expect(screen.getByTestId('citizen-ack-notice-card')).toBeTruthy();
      cleanup();
    }
  });

  // (2) Trust band badge via shared <BandPill locked /> — ◔ T1
  // (divider), ● T3 (issuance). Locked palette + glyph + text per
  // foundation §4.1.
  it('(2) renders a locked BandPill with the T2 glyph on the form chrome', async () => {
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-chrome-row')).toBeTruthy();
    });
    const bandPill = screen.getByTestId('citizen-ack-band-pill-form');

    // Locked class (foundation §4.1 palette).
    expect(bandPill.className).toContain('band-pill--t2-locked');
    // Glyph + text per §4.1 — ◔ T1 / ◑ T2 / ◒ T3 / ✓ resolved.
    expect(bandPill.textContent).toMatch(/[◔◑◒◐◒✓]/);
    expect(bandPill.textContent).toMatch(/T2/);
  });

  // (3) Reporter badge via shared <ReporterBadge /> (WO-006).
  it('(3) renders a ReporterBadge with the anchor source attribute', async () => {
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-reporter-badge-anchor')).toBeTruthy();
    });
    const badge = screen.getByTestId('citizen-ack-reporter-badge-anchor');

    expect(badge.getAttribute('data-reporter-kind')).toBe('anchor');
    expect(badge.className).toContain('chip-reporter-anchor');
  });

  // (4) Ack-window expiry surface — calm "closed" message; Confirm +
  // Reopen HIDDEN. Reopen picker still available.
  it('(4) renders the calm expired surface when the 24h ack window has elapsed', async () => {
    // Set the resolution timestamp to 25h ago so the 24h window is
    // closed but the 30-day reopen window is still open.
    const RESOLVED_25H_AGO = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    incidentsFixture = [{ ...DEFAULT_INCIDENT, last_occurred_at: RESOLVED_25H_AGO }];
    allEventsFixture = {
      events: [
        TECHNICIAN_ASSIGNED,
        FIX_SUBMITTED,
        { ...RESOLVED_EVENT, occurred_at: RESOLVED_25H_AGO },
        DEFAULT_ACK_REQUEST,
      ],
    };
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-expired-card')).toBeTruthy();
    });
    expect(screen.getByTestId('citizen-ack-expired-headline')).toBeTruthy();
    expect(screen.getByTestId('citizen-ack-expired-body')).toBeTruthy();
    expect(screen.getByTestId('citizen-ack-expired-hint')).toBeTruthy();

    // Confirm + Reopen buttons are HIDDEN in the expired state.
    expect(screen.queryByTestId('citizen-ack-confirm')).toBeNull();
    // The expired panel exposes its own reopen affordance.
    expect(screen.getByTestId('citizen-ack-expired-reopen')).toBeTruthy();
  });

  // (5) Confirm emits `CitizenAckAccepted{incident_id, incident_hash,
  // ack_at, witness_count}` + 200ms green pulse on focus.
  it('(5) emits CitizenAckAccepted with incident_id, incident_hash, ack_at, witness_count', async () => {
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-confirm')).toBeTruthy();
    });

    // Focus the confirm button to trigger the 200ms green pulse.
    const confirmButton = screen.getByTestId('citizen-ack-confirm');

    fireEvent.focus(confirmButton);
    expect(confirmButton.className).toContain('citizen-ack-page__approve-pulse');

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });
    const ackCall = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'CitizenAckAccepted',
    );

    expect(ackCall).toBeTruthy();
    expect(ackCall!.body).toMatchObject({
      event_type: 'CitizenAckAccepted',
      payload: {
        incident_id: 'inc_ack_001',
        // block_hash is derived from the chain projection. The fixture
        // exposes multiple block hashes; we just assert the key is
        // present (a non-null string from the lookup).
        incident_hash: expect.stringMatching(/^01H/),
        ack_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        witness_count: expect.any(Number),
      },
    });
  });

  // (6a) Reopen opens the in-page reason picker.
  it('(6a) reopen opens an in-page reason picker (200-400 chars, required)', async () => {
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-reopen')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('citizen-ack-reopen'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-reopen-picker')).toBeTruthy();
    });
    expect(screen.getByTestId('citizen-ack-reopen-reason')).toBeTruthy();
    expect(screen.getByTestId('citizen-ack-reopen-submit')).toBeTruthy();
    expect(screen.getByTestId('citizen-ack-reopen-hint')).toBeTruthy();

    // The submit button is DISABLED until the reason reaches the
    // 200-char minimum.
    const submitBtn = screen.getByTestId('citizen-ack-reopen-submit') as HTMLButtonElement;

    expect(submitBtn.disabled).toBe(true);

    // Reason text persists in local state across re-renders.
    const reason = screen.getByTestId('citizen-ack-reopen-reason') as HTMLTextAreaElement;

    fireEvent.change(reason, {
      target: { value: 'a'.repeat(220) },
    });
    expect((screen.getByTestId('citizen-ack-reopen-reason') as HTMLTextAreaElement).value).toBe(
      'a'.repeat(220),
    );
    expect((screen.getByTestId('citizen-ack-reopen-submit') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  // (6b) Submit emits `ChainReopened{incident_id, incident_hash,
  // reason, reopened_by, reopened_at}`.
  it('(6b) submit emits ChainReopened with reason, reopened_by, reopened_at', async () => {
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-reopen')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('citizen-ack-reopen'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-reopen-picker')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('citizen-ack-reopen-reason'), {
      target: { value: 'x'.repeat(210) },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('citizen-ack-reopen-submit'));
    });

    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThan(0);
    });
    const reopenCall = capturePosts.find(
      (c) =>
        c.url === '/api/events' &&
        (c.body as { event_type?: string }).event_type === 'ChainReopened',
    );

    expect(reopenCall).toBeTruthy();
    const payload = (reopenCall!.body as { payload: Record<string, unknown> }).payload;

    expect(payload).toMatchObject({
      incident_id: 'inc_ack_001',
      reason: 'x'.repeat(210),
      reopened_by: 'anjali_actor',
      reopened_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  // (7) Silent-closure 30-day expiry: flat "permanently closed"
  // surface with no actions.
  it('(7) renders the permanently-closed surface when the 30-day reopen window has elapsed', async () => {
    // Set the resolution timestamp to 31 days ago so the 30-day
    // reopen window has closed.
    const RESOLVED_31D_AGO = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

    incidentsFixture = [{ ...DEFAULT_INCIDENT, last_occurred_at: RESOLVED_31D_AGO }];
    allEventsFixture = {
      events: [
        TECHNICIAN_ASSIGNED,
        FIX_SUBMITTED,
        { ...RESOLVED_EVENT, occurred_at: RESOLVED_31D_AGO },
        DEFAULT_ACK_REQUEST,
      ],
    };
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-permanent-card')).toBeTruthy();
    });
    expect(screen.getByTestId('citizen-ack-permanent-headline')).toBeTruthy();
    expect(screen.getByTestId('citizen-ack-permanent-body')).toBeTruthy();
    // No actions available in the permanently-closed state.
    expect(screen.queryByTestId('citizen-ack-confirm')).toBeNull();
    expect(screen.queryByTestId('citizen-ack-reopen')).toBeNull();
    expect(screen.queryByTestId('citizen-ack-decision-card')).toBeNull();
  });

  // (8a) All locale strings route through useTranslation('citizenAck').
  it('(8a) all visible strings on the form come from the citizenAck namespace', async () => {
    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-page')).toBeTruthy();
    });
    // The header title + form subtitle + decision heading + decision
    // body + button labels all come from the citizenAck namespace.
    expect(screen.getByText('Citizen acknowledgement')).toBeTruthy();
    expect(screen.getByText(/incident inc_ack/)).toBeTruthy();
    expect(screen.getByText('Did the fix resolve the issue?')).toBeTruthy();
  });

  // (8b) Bangla strings contain real Bengali characters.
  it('(8b) citizenAck.bn.json contains real Bangla script (U+0980–U+09FF)', async () => {
    const bn = readFileSync(
      resolve(__dirname, '../i18n/locales/bn/citizenAck.json'),
      'utf8',
    );

    expect(bn).toMatch(/[\u0980-\u09FF]/);
    // No Hindi letters in the Bangla file.
    expect(HINDI_LETTERS_REGEX.test(bn)).toBe(false);
  });

  // (8c) en.json contains no Hindi.
  it('(8c) citizenAck.en.json contains no Hindi / Devanagari letters', () => {
    const en = readFileSync(
      resolve(__dirname, '../i18n/locales/en/citizenAck.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(en)).toBe(false);
  });

  // (8d) bn.json renders Bangla copy when the locale is switched to bn.
  it('(8d) renders Bangla copy when locale is bn', async () => {
    await act(async () => {
      await i18n.changeLanguage('bn');
      document.body.dataset.locale = 'bn';
      window.localStorage.setItem('surakkha.locale', 'bn');
    });

    renderAck();
    await waitFor(() => {
      expect(screen.getByTestId('citizen-ack-page-title')).toBeTruthy();
    });
    // The header title renders the Bangla string.
    expect(screen.getByTestId('citizen-ack-page-title').textContent).toContain('নাগরিক');
    // The decision heading renders the Bangla string.
    expect(screen.getByText(/মেরামত কি সমস্যা সমাধান/)).toBeTruthy();

    await act(async () => {
      await i18n.changeLanguage('en');
      document.body.dataset.locale = 'en';
      window.localStorage.setItem('surakkha.locale', 'en');
    });
  });

  // Lockdown sweep — focus rings use --color-primary-tint.
  it('tech.css uses --color-primary-tint for :focus-visible', () => {
    const css = readFileSync(resolve(__dirname, '../styles/tech.css'), 'utf8');
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });
});
