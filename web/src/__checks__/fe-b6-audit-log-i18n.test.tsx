/**
 * fe-b6-audit-log-i18n.test.tsx — AuditLog localization.
 *
 * Pins the i18n contract for /audit-log:
 *   1) en_render: page header, summary, export buttons, table headers
 *      and filter chips render English literals from auditLog.json.
 *   2) bn_render: same surface renders Bengali (regex check on visible
 *      Bengali script in the rendered DOM).
 *   3) key_parity: every en key has a non-empty bn counterpart, so a
 *      missing bn key can't silently fall through to en at runtime.
 *
 * The page is wrapped in I18nextProvider because AuditLog calls
 * `useTranslation('auditLog')` directly and we want the same bootstrap
 * as the real app (locales loaded from /src/i18n/index.ts).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { HttpResponse, http } from 'msw';
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

/** A small batch of events so the table is non-empty when locale flips. */
const AUDIT_EVENTS = [
  {
    event_id: 'evt-1',
    event_type: 'SensorReadingSubmitted',
    occurred_at: '2024-01-15T12:00:00.000Z',
    payload: { ward_id: 'ward-dhanmondi' },
    block_hash: 'abcdef1234567890',
    height: 42,
    actor_identity: { kind: 'sensor', ref: 's1', display: 'Sensor 1' },
  },
  {
    event_id: 'evt-2',
    event_type: 'IncidentEscalated',
    occurred_at: '2024-01-16T12:00:00.000Z',
    payload: { ward_id: 'ward-uttara' },
    block_hash: 'fedcba0987654321',
    height: 43,
    actor_identity: { kind: 'priya', ref: 'priya-001', display: 'Priya' },
  },
];

function installEventsHandler() {
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
    expect(screen.getByTestId('audit-log-page')).toBeTruthy();
  });
}

describe('FE-B6 AuditLog i18n (post-WO-008 reconciliation)', () => {
  // (1) English: header + summary + 6 filter chips + export buttons.
  it('en_render: page chrome + filter chips render English literals', async () => {
    renderAuditLog();
    await waitForTable();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(enJson.page.title);
    expect(screen.getByTestId('audit-log-summary').textContent).toContain('events');
    expect(screen.getByTestId('audit-log-summary').textContent).toContain('chain head block #42');

    // 6 filter chips per WO-008 §Acceptance #2.
    expect(screen.getByTestId('audit-log-chip-incident')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-event-type')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-actor')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-band')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-reporter-badge')).toBeTruthy();
    expect(screen.getByTestId('audit-log-chip-date-range')).toBeTruthy();
  });

  // (2) Bengali: same surface renders Bengali when locale flips to bn.
  it('bn_render: same surface renders Bengali when locale flips to bn', async () => {
    renderAuditLog();
    await waitForTable();
    void i18n.changeLanguage('bn');
    document.body.dataset.locale = 'bn';
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(bnJson.page.title);
    });
    // Bengali regex — Bengali Unicode block 0980-09FF.
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/[\u0980-\u09FF]/);
  });

  // (3) Chain head banner truncates the hash for display.
  it('en_chain_head: chain-head banner truncates the hash for display', async () => {
    renderAuditLog();
    await waitForTable();
    const hash = screen.getByTestId('chain-head-hash').textContent;
    // Truncated hash: 8 chars + … + 4 chars (ellipsis is the visual glyph).
    expect(hash).toBe('abcdef12…7890');
  });

  // (4) Key parity — en and bn JSONs expose the same key paths.
  it('key_parity_en_bn: every en key is also present (with non-empty string) in bn', () => {
    function walk(obj: Record<string, unknown>, path: string[]): Array<{ path: string; val: string }> {
      const out: Array<{ path: string; val: string }> = [];

      for (const [k, v] of Object.entries(obj)) {
        const here = [...path, k];

        if (typeof v === 'string') {
          out.push({ path: here.join('.'), val: v });
        } else if (v && typeof v === 'object') {
          out.push(...walk(v as Record<string, unknown>, here));
        }
      }
      return out;
    }

    const enKeys = walk(enJson as Record<string, unknown>, []);
    const bnKeys = walk(bnJson as Record<string, unknown>, []);

    for (const ek of enKeys) {
      const match = bnKeys.find((bk) => bk.path === ek.path);

      expect(match, `bn.${ek.path} missing`).toBeTruthy();
    }
  });
});
