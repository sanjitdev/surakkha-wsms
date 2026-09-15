/**
 * fe-verify-flow-reconcile.test.tsx — WO-017 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-017-verify-flow.md
 * (FINAL Tier 3 build, 9/9). Pins the 6 acceptance criteria + the
 * 10-case test plan from the WO brief.
 *
 * Acceptance pins:
 *   (1) Renders at /verify-flow for utility_operator role.
 *   (2) Single-click verify calls verifyBlock() via chain-verify.ts
 *       helper (NOT copy-paste) — pinned via source assertion.
 *   (3) Pass badge uses --color-safe-green; fail badge uses
 *       --color-alert-red-reserved. MSW handler returns
 *       { ok: true, ... } for pass and { ok: false, reason: '...' }
 *       for fail.
 *   (4) 3 s auto-dismiss toast + durable badge in row metadata.
 *       Toast auto-dismisses after 3 s; badge persists after toast is
 *       gone (vi.useFakeTimers + advanceTimersByTime(3000)).
 *   (5) Bangla toggle works — bn verify button label contains real
 *       Bengali (U+0980–U+09FF).
 *   (6) No Hindi strings in locale files (lockdown sweep over both
 *       en/verifyFlow.json and bn/verifyFlow.json).
 *
 * Additional pins:
 *   (7) Step indicator ArrowUp/Down keyboard nav advances/rewinds
 *       the active step.
 *   (8) aria-current="step" on the active step; absent on inactive.
 *   (9) Source-level: chain-verify.ts is imported in VerifyFlow.tsx;
 *       no inline copy-paste of fetch / AbortController logic.
 *
 * Lockdown compliance (every Tier 3 build):
 *   - Trust band = verification state (separate from reporter-badge).
 *   - Focus rings 2px --color-primary-tint.
 *   - EN + BN locales only (no Hindi / Devanagari letters).
 *   - shadcn/ui primitives reused.
 *   - VS15 (\uFE0E) mandatory on ✓ / ⚠ glyphs.
 *   - T3 = amber-bright in operator chrome; alert-red reserved for
 *     consumer-notice issuance surfaces ONLY (verify-fail badge is
 *     the lockdown safe use).
 *
 * Pattern matches fe-coming-soon-reconcile.test.tsx (WO-016),
 * fe-styleguide-reconcile.test.tsx (WO-015), and
 * fe-b6-audit-verify-row.test.tsx (FE-B6): MSW handlers serve the
 * /api/chain/verify endpoint, locale + AppLayout provided via
 * providers, fetch override for /api/chain/verify in pass/fail
 * branches.
 */

import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { VerifyFlow } from '../pages/VerifyFlow';
import { handlers } from '../mocks/handlers';
import type { SessionRow } from '../mocks/idb';

const server = setupServer(...handlers);

// Devanagari LETTERS only — DanDA (U+0964) is shared with Bengali as a
// period and excluded. This is the LOCKDOWN regex (cascade).
const HINDI_LETTERS_REGEX = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

const SESSION_FIXTURE: SessionRow = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya — Utility Operator',
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
  ingested_at: '2024-02-01T00:00:00.001Z',
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });

  if (!('matchMedia' in window)) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

beforeEach(() => {
  server.resetHandlers(...handlers);
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
  vi.useRealTimers();
  server.resetHandlers(...handlers);
});

interface RenderOpts {
  pathname?: string;
  logout?: () => Promise<void>;
}

function renderVerifyFlow({ pathname = '/verify-flow', logout = () => Promise.resolve() }: RenderOpts = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={[pathname]}
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
                logout,
              }}
            >
              <Routes>
                <Route path="/verify-flow" element={<VerifyFlow />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

/**
 * Patch globalThis.fetch so /api/chain/verify returns the supplied
 * response. The MSW handler at /api/chain/verify is wired to the IDB
 * mock; for pass/fail assertion determinism we override it here.
 * Restored in afterEach via vi.restoreAllMocks.
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

describe('WO-017 Verify Flow reconciliation (Tier 3 build 9/9 — FINAL)', () => {
  // (1) Renders at /verify-flow for utility_operator role.
  it('(1) renders the verify wizard at /verify-flow for utility_operator', async () => {
    renderVerifyFlow();
    await waitFor(() => {
      expect(screen.getByTestId('verify-flow-header')).toBeTruthy();
    });
    // The 3-step indicator renders all 3 steps.
    expect(screen.getByTestId('verify-step-sensor-cluster')).toBeTruthy();
    expect(screen.getByTestId('verify-step-anjali-corroboration')).toBeTruthy();
    expect(screen.getByTestId('verify-step-councillor-notify')).toBeTruthy();
    // The step card renders.
    expect(screen.getByTestId('verify-step-card')).toBeTruthy();
  });

  // (2) Single-click verify calls verifyBlockHash() via chain-verify.ts
  //     helper (no copy-paste).
  it('(2) single-click verify calls /api/chain/verify via the helper', async () => {
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
      renderVerifyFlow();
      await waitFor(() => {
        expect(screen.getByTestId('verify-row')).toBeTruthy();
      });

      const btn = screen.getByTestId('verify-row-btn');

      fireEvent.click(btn);

      await waitFor(() => {
        expect(verifyCalls).toBe(1);
      });
    } finally {
      restore();
    }
  });

  // (3a) Pass badge uses --color-safe-green.
  it('(3a) pass badge uses --color-safe-green token', async () => {
    const restore = stubVerifyEndpoint(async (body) =>
      new Response(
        JSON.stringify({ ok: true, block_hash: body.block_hash, height: 42, recomputed: body.block_hash }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    try {
      renderVerifyFlow();
      await waitFor(() => {
        expect(screen.getByTestId('verify-row-btn')).toBeTruthy();
      });
      fireEvent.click(screen.getByTestId('verify-row-btn'));

      await waitFor(() => {
        const badge = screen.getByTestId('verify-row-badge');

        expect(badge.getAttribute('data-verify-state')).toBe('ok');
        expect(badge.className).toContain('verify-badge--ok');
      });
      // CSS class lookup confirms the token binding.
      const style = getComputedStyle(screen.getByTestId('verify-row-badge'));

      // color-mix makes the test brittle to assert exact hex; assert
      // the class carries the --ok modifier (which is bound to
      // --color-safe-green in verify.css).
      expect(style.color).toBeTruthy();
    } finally {
      restore();
    }
  });

  // (3b) Fail badge uses --color-alert-red-reserved.
  it('(3b) fail badge uses --color-alert-red-reserved token', async () => {
    const restore = stubVerifyEndpoint(async () =>
      new Response(
        JSON.stringify({ ok: false, reason: 'unknown_hash', block_hash: 'hash-demo-verify-flow' }),
        { status: 404, headers: { 'content-type': 'application/json' } },
      ),
    );

    try {
      renderVerifyFlow();
      await waitFor(() => {
        expect(screen.getByTestId('verify-row-btn')).toBeTruthy();
      });
      fireEvent.click(screen.getByTestId('verify-row-btn'));

      await waitFor(() => {
        const badge = screen.getByTestId('verify-row-badge');

        expect(badge.getAttribute('data-verify-state')).toBe('fail');
        expect(badge.className).toContain('verify-badge--fail');
      });
    } finally {
      restore();
    }
  });

  // (4a) 3 s auto-dismiss toast — appears on click, then disappears
  //       after 3000 ms (vi.useFakeTimers + advanceTimersByTime(3000)).
  it('(4a) toast auto-dismisses after 3 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const restore = stubVerifyEndpoint(async (body) =>
      new Response(
        JSON.stringify({ ok: true, block_hash: body.block_hash, height: 42, recomputed: body.block_hash }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    try {
      renderVerifyFlow();
      // Flush initial render past microtasks.
      await act(async () => {
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(screen.getByTestId('verify-row-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('verify-row-btn'));

      // Wait for the async helper to resolve + the toast to be pushed.
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-testid^="toast-"]');

        expect(toasts.length).toBeGreaterThan(0);
      });

      // Advance 3 s — the toast's setTimeout fires and dismisses.
      await act(async () => {
        vi.advanceTimersByTime(3000);
        await vi.runAllTimersAsync();
      });

      // Toast should be gone.
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-testid^="toast-success"], [data-testid^="toast-"]:not([data-testid="toast-success"]):not([data-testid="toast-warning"]):not([data-testid="toast-danger"]):not([data-testid="toast-info"])');

        // Some toasts remain (danger / info etc.) — but the verify
        // success toast must be gone.
        expect(toasts.length).toBe(0);
      });
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  // (4b) Durable badge persists after toast dismisses.
  it('(4b) durable row badge persists after toast dismisses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const restore = stubVerifyEndpoint(async (body) =>
      new Response(
        JSON.stringify({ ok: true, block_hash: body.block_hash, height: 42, recomputed: body.block_hash }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    try {
      renderVerifyFlow();
      await act(async () => {
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(screen.getByTestId('verify-row-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('verify-row-btn'));
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      // Badge is present.
      await waitFor(() => {
        expect(screen.getByTestId('verify-row-badge').getAttribute('data-verify-state')).toBe('ok');
      });

      // Advance past 3 s toast auto-dismiss.
      await act(async () => {
        vi.advanceTimersByTime(3500);
        await vi.runAllTimersAsync();
      });

      // Badge is still present (durable).
      expect(screen.getByTestId('verify-row-badge').getAttribute('data-verify-state')).toBe('ok');
      expect(screen.getByTestId('verify-row-badge').className).toContain('verify-badge--ok');
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  // (5) Bangla toggle works — bn verify button contains real Bengali.
  it('(5) Bangla toggle renders real Bengali on the verify button', async () => {
    await act(async () => {
      await i18n.changeLanguage('bn');
      document.body.dataset.locale = 'bn';
      window.localStorage.setItem('surakkha.locale', 'bn');
    });

    renderVerifyFlow();
    await waitFor(() => {
      expect(screen.getByTestId('verify-row-btn')).toBeTruthy();
    });

    const btn = screen.getByTestId('verify-row-btn');

    expect(btn.textContent).toMatch(/[\u0980-\u09FF]/);

    // Reset locale to en for downstream tests.
    await act(async () => {
      await i18n.changeLanguage('en');
      document.body.dataset.locale = 'en';
      window.localStorage.setItem('surakkha.locale', 'en');
    });
  });

  // (6a) Hindi lockdown sweep — en/verifyFlow.json.
  it('(6a) en/verifyFlow.json contains no Hindi / Devanagari letters', () => {
    const en = readFileSync(
      resolve(__dirname, '../i18n/locales/en/verifyFlow.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(en)).toBe(false);
  });

  // (6b) Hindi lockdown sweep — bn/verifyFlow.json.
  it('(6b) bn/verifyFlow.json contains no Hindi / Devanagari letters', () => {
    const bn = readFileSync(
      resolve(__dirname, '../i18n/locales/bn/verifyFlow.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(bn)).toBe(false);
    // Sanity: bn still contains real Bengali script.
    expect(bn).toMatch(/[\u0980-\u09FF]/);
  });

  // (7) Step indicator keyboard nav — ArrowDown advances the step.
  it('(7) ArrowDown on step indicator advances the active step', async () => {
    renderVerifyFlow();
    await waitFor(() => {
      expect(screen.getByTestId('verify-steps')).toBeTruthy();
    });
    const activeBefore = screen.getByTestId('verify-step-sensor-cluster').getAttribute('data-step-active');

    expect(activeBefore).toBe('true');

    const ol = screen.getByTestId('verify-steps');

    fireEvent.keyDown(ol, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByTestId('verify-step-sensor-cluster').getAttribute('data-step-active')).toBe('false');
      expect(screen.getByTestId('verify-step-anjali-corroboration').getAttribute('data-step-active')).toBe('true');
    });
  });

  // (8) aria-current="step" on the active step; absent elsewhere.
  it('(8) aria-current="step" is set on the active step only', async () => {
    renderVerifyFlow();
    await waitFor(() => {
      expect(screen.getByTestId('verify-step-sensor-cluster')).toBeTruthy();
    });
    expect(screen.getByTestId('verify-step-sensor-cluster').getAttribute('aria-current')).toBe('step');
    expect(screen.getByTestId('verify-step-anjali-corroboration').getAttribute('aria-current')).toBeNull();
    expect(screen.getByTestId('verify-step-councillor-notify').getAttribute('aria-current')).toBeNull();
  });

  // (9) Source-level: chain-verify.ts is imported; no copy-paste.
  it('(9) VerifyFlow.tsx imports verifyBlockHash from chain-verify.ts', () => {
    const src = readFileSync(
      resolve(__dirname, '../pages/VerifyFlow.tsx'),
      'utf8',
    );
    // Strip block + line comments so docstring mentions of "fetch" /
    // "AbortController" don't trigger false positives.
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // Imports the helper.
    expect(src).toMatch(/from ['"]\.\.\/lib\/chain-verify['"]/);
    // Calls verifyBlockHash (not a copy-pasted fetch).
    expect(codeOnly).toMatch(/verifyBlockHash\s*\(/);
    // Does NOT contain a raw fetch to /api/chain/verify (no copy-paste).
    expect(codeOnly).not.toMatch(/fetch\s*\(\s*['"`][^'"`]*\/api\/chain\/verify/);
    // Does NOT use AbortController directly (helper owns it).
    expect(codeOnly).not.toMatch(/AbortController/);
  });

  // (Bonus) Lockdown sweep — verify.css focus + alert-red use.
  it('lockdown sweep: verify.css fail badge binds --color-alert-red-reserved', () => {
    const css = readFileSync(resolve(__dirname, '../styles/verify.css'), 'utf8');

    // The .verify-badge--fail rule must reference the lockdown token.
    const failBlock = css.match(/\.verify-badge--fail\s*\{[\s\S]*?\}/);

    expect(failBlock).not.toBeNull();
    expect(failBlock![0]).toContain('--color-alert-red-reserved');

    // No raw red-600 / bg-red outside of docstring comments (a doc
    // comment is allowed to *mention* the forbidden colour name to
    // explain why the lockdown rule forbids it).
    const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(cssNoComments).not.toMatch(/red-600/);
    expect(cssNoComments).not.toMatch(/bg-red/);

    // Pass badge binds safe-green.
    const okBlock = css.match(/\.verify-badge--ok\s*\{[\s\S]*?\}/);

    expect(okBlock).not.toBeNull();
    expect(okBlock![0]).toContain('--color-safe-green');
  });

  // (Bonus) Lockdown sweep — tech.css focus rings unchanged.
  it('lockdown sweep: tech.css :focus-visible uses --color-primary-tint', () => {
    const css = readFileSync(resolve(__dirname, '../styles/tech.css'), 'utf8');
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });

  // (Bonus) VerifyFlow.tsx contains no alert-red misuse — only the
  // lockdown-safe reserved token reference in the file header.
  it('lockdown sweep: VerifyFlow.tsx contains no raw alert-red / bg-red misuse', () => {
    const src = readFileSync(
      resolve(__dirname, '../pages/VerifyFlow.tsx'),
      'utf8',
    );
    // Strip block + line comments so docstring mentions of "alert-red"
    // don't trigger false positives.
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // No raw Tailwind / hex alert-red references in code.
    expect(codeOnly).not.toMatch(/red-600/);
    expect(codeOnly).not.toMatch(/bg-red/);
    // Does NOT use variant="danger" (reserved for T3+ issuance).
    expect(codeOnly).not.toMatch(/variant=['"]danger['"]/);
  });
});
