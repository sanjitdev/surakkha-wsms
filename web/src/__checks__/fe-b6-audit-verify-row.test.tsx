/**
 * fe-b6-audit-verify-row.test.tsx — AuditLog per-row hash verification.
 *
 * Pins audit-log.md #13 — single-click independent hash verification per
 * row. Asserts:
 *   1) Each row renders a Verify button in idle state.
 *   2) Clicking Verify calls /api/chain/verify with the row's
 *      block_hash and flips the cell to the OK state when the
 *      recomputed hash matches the stored hash.
 *   3) An unknown hash returns the unknown_hash fail state.
 *   4) Per-row scope: state on row 1 does not leak into row 2.
 *   5) Key parity: en + bn auditLog.json expose the new verify keys.
 *
 * NOTE on the fetch override: MSW's runtime `server.use` override does
 * not reliably replace the original POST handler in this test runner,
 * so we patch globalThis.fetch directly for /api/chain/verify. All
 * other routes fall through to the original MSW-backed fetch (which
 * is required for /api/events to load the table rows in the first
 * place). The patch is restored in afterEach.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { AuditLog } from '../pages/AuditLog';
import { handlers } from '../mocks/handlers';
import enJson from '../i18n/locales/en/auditLog.json';
import bnJson from '../i18n/locales/bn/auditLog.json';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

const SESSION_FIXTURE = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
};

const CHAIN_HEAD_FIXTURE = {
  height: 42,
  block_hash: 'abcdef1234567890',
  prev_hash: '0987fedcba654321',
  sealed_at: '2024-02-01T00:00:00.000Z',
  ingested_at: '2024-02-01T00:00:01.000Z',
};

const AUDIT_EVENTS = [
  {
    event_id: 'evt-1',
    event_type: 'SensorReadingSubmitted',
    occurred_at: '2024-01-15T12:00:00.000Z',
    payload: { ward_id: 'ward-dhanmondi' },
    block_hash: 'hash-1',
    height: 42,
    actor_identity: { kind: 'sensor', ref: 's1', display: 'Sensor 1' },
  },
  {
    event_id: 'evt-2',
    event_type: 'IncidentEscalated',
    occurred_at: '2024-01-16T12:00:00.000Z',
    payload: { ward_id: 'ward-uttara' },
    block_hash: 'hash-2',
    height: 43,
    actor_identity: { kind: 'priya', ref: 'priya-001', display: 'Priya' },
  },
];

function installEventsHandler() {
  // Re-import the http helpers at the call site so this test stays
  // independent of how other tests in the file structure their imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const { HttpResponse, http } = require('msw') as typeof import('msw');

  server.use(
    http.get('/api/events', ({ request }) => {
      const url = new URL(request.url);

      if (url.searchParams.get('limit') === '200') {
        return HttpResponse.json({ events: AUDIT_EVENTS });
      }
      return HttpResponse.json({ events: [] });
    }),
  );
}

/**
 * Install a /api/chain/verify override on globalThis.fetch for this
 * test only. The MSW runtime override does not reliably take
 * precedence over the original handler in this runner, so we patch
 * fetch directly. The original fetch is restored in afterEach.
 */
function stubVerifyEndpoint(impl: (body: { block_hash: string }) => Promise<Response>) {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.includes('/api/chain/verify')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as { block_hash: string };

      return impl(body);
    }

    return original(input as RequestInfo, init);
  }) as typeof globalThis.fetch;

  return () => {
    globalThis.fetch = original;
  };
}

beforeEach(() => {
  server.resetHandlers(...handlers);
  installEventsHandler();
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
});

function renderAuditLog() {
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
              session: SESSION_FIXTURE,
              chainHead: CHAIN_HEAD_FIXTURE,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <AuditLog />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

async function waitForTable() {
  await waitFor(() => {
    expect(screen.queryByTestId('audit-table-loading')).toBeNull();
  });
}

describe('FE-B6 AuditLog per-row hash verification (audit-log.md #13)', () => {
  // (1) Idle state — every row renders a Verify button.
  it('renders a Verify button per row in idle state', async () => {
    renderAuditLog();
    await waitForTable();
    expect(screen.getByTestId('audit-verify-btn-evt-1').textContent).toContain(enJson.table.verify);
    expect(screen.getByTestId('audit-verify-btn-evt-2').textContent).toContain(enJson.table.verify);
    // Idle = no badges rendered.
    expect(screen.queryByTestId('audit-verify-evt-1')).toBeNull();
    expect(screen.queryByTestId('audit-verify-evt-2')).toBeNull();
  });

  // (2) OK path — clicking Verify calls /api/chain/verify and flips to OK.
  it('clicking Verify calls /api/chain/verify and renders OK on match', async () => {
    let verifyCalls = 0;

    const restore = stubVerifyEndpoint(async (body) => {
      verifyCalls += 1;

      return new Response(
        JSON.stringify({
          ok: true,
          block_hash: body.block_hash,
          height: 42,
          recomputed: body.block_hash,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    try {
      renderAuditLog();
      await waitForTable();

      const btn = screen.getByTestId('audit-verify-btn-evt-1');

      expect(btn).toBeTruthy();
      fireEvent.click(btn);

      await waitFor(() => {
        expect(verifyCalls).toBe(1);
      });

      await waitFor(() => {
        const badge = screen.getByTestId('audit-verify-evt-1');

        expect(badge.className).toContain('audit-verify--ok');
        expect(badge.textContent).toContain(enJson.table.verifyOk);
      });
      // Per-row scope — row 2 is still idle.
      expect(screen.queryByTestId('audit-verify-evt-2')).toBeNull();
      expect(screen.getByTestId('audit-verify-btn-evt-2')).toBeTruthy();
    } finally {
      restore();
    }
  });

  // (3) Fail path — unknown_hash returns the fail state.
  it('renders fail state when /api/chain/verify returns ok=false', async () => {
    const restore = stubVerifyEndpoint(async () =>
      new Response(JSON.stringify({ ok: false, reason: 'unknown_hash' }), { status: 404 }),
    );

    try {
      renderAuditLog();
      await waitForTable();

      fireEvent.click(screen.getByTestId('audit-verify-btn-evt-1'));

      await waitFor(() => {
        const badge = screen.getByTestId('audit-verify-evt-1');

        expect(badge.className).toContain('audit-verify--fail');
        expect(badge.textContent).toContain(enJson.table.verifyFail.label);
      });
    } finally {
      restore();
    }
  });

  // (4) Key parity — en + bn expose the new verify keys.
  it('en/bn key parity: every new verify key exists in both locales', () => {
    const en = enJson.table;
    const bn = bnJson.table;

    for (const k of [
      'verifyHeader',
      'verify',
      'verifyButtonTitle',
      'verifyPending',
      'verifyPendingAria',
      'verifyOk',
      'verifyOkTitle',
      'verifyOkAria',
      'verifyFail',
    ]) {
      expect(en[k], `en.table.${k}`).toBeTruthy();
      expect(bn[k], `bn.table.${k}`).toBeTruthy();
    }
    const enFail = en.verifyFail as Record<string, unknown>;
    const bnFail = bn.verifyFail as Record<string, unknown>;

    expect(enFail.label).toBeTruthy();
    expect(bnFail.label).toBeTruthy();
    for (const reason of ['unknown_hash', 'hash_mismatch', 'network', 'timeout']) {
      const enReason = enFail[reason] as Record<string, string>;
      const bnReason = bnFail[reason] as Record<string, string>;

      expect(enReason?.title, `en.table.verifyFail.${reason}.title`).toBeTruthy();
      expect(enReason?.aria, `en.table.verifyFail.${reason}.aria`).toBeTruthy();
      expect(bnReason?.title, `bn.table.verifyFail.${reason}.title`).toBeTruthy();
      expect(bnReason?.aria, `bn.table.verifyFail.${reason}.aria`).toBeTruthy();
    }
  });
});
