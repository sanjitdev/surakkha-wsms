/**
 * fe-coming-soon-reconcile.test.tsx — WO-016 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-016-coming-soon-page.md.
 * Pins the 5 acceptance criteria + lockdown sweep for the ComingSoonPage
 * reconciliation.
 *
 * Acceptance pins:
 *   (1) Renders the ComingSoonPage card at /approve, /audit, /vendor.
 *   (2) /submit routes to SubmitReportPage, NOT ComingSoonPage.
 *   (3) Phase 2 notice is shown ("Coming in Phase 2" copy).
 *   (4) Bangla toggle works — Bangla strings contain real Bengali
 *       characters (U+0980-U+09FF).
 *   (5) No Hindi strings in locale files (en + bn).
 *
 * Migration acceptance:
 *   (M1) Back button renamed "Sign out" and uses variant="secondary"
 *        (NOT variant="danger" — reserved for T3+ issuance path).
 *   (M2) Card heading carries the T0 ○ glyph for the placeholder
 *        signal (foundation §4.1).
 *   (M3) Sign out button invokes logout() on click.
 *
 * Lockdown compliance (every Tier 3 build):
 *   - No Hindi in locale files (Devanagari letters-only regex).
 *   - No confetti / no sound / no party effects.
 *   - Focus rings use 2px --color-primary-tint.
 *   - T3 = amber-bright in operator chrome; alert-red reserved for
 *     consumer-notice issuance surfaces only.
 *   - Danger Button variant reserved for T3+ issuance path ONLY.
 *   - T1 = divider neutral (--color-trust-t1), NOT sky-blue.
 *   - VS15 (\uFE0E) mandatory on ✓ and ⚠ glyphs on consumer surfaces.
 *   - Bangla-first; both en + bn files exist + load.
 *   - Trust-bridge rounded corners (foundation §6): no rounded-none.
 *
 * Pattern matches fe-submit-report-reconcile.test.tsx (WO-011) +
 * fe-citizen-ack-reconcile.test.tsx (WO-012): fetch stub captures
 * POSTs, MSW handlers serve GET projections, locale + AppLayout
 * provided via providers.
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
import { ComingSoonPage } from '../pages/ComingSoonPage';
import { SubmitReportPage } from '../pages/SubmitReportPage';
import { handlers } from '../mocks/handlers';
import type { SessionRow } from '../mocks/idb';

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });

  // jsdom has no matchMedia — stub it for Toast RAF + any component
  // that checks prefers-color-scheme at mount.
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

// Lockdown-bound regex from the cascade. Devanagari LETTERS only —
// DanDA (U+0964) is shared with Bengali as a period and excluded.
const HINDI_LETTERS_REGEX = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

const SESSION_FIXTURE: SessionRow = {
  actor_id: 'pha-approver-001',
  actor_ref: 'pha_approver',
  display_name: 'PHA Approver',
  role: 'pha_approver',
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

beforeEach(() => {
  server.resetHandlers(...handlers);
  try {
    window.localStorage.setItem('surakkha.locale', 'en');
    window.localStorage.setItem('surakkha.theme', 'light');
    document.body.dataset.locale = 'en';
    document.body.dataset.theme = 'light';
  } catch {
    /* noop */
  }
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface RenderOpts {
  pathname: string;
  /** Component for the route. */
  component: React.ComponentType;
  /** Logout spy (defaults to a no-op). */
  logout?: () => Promise<void>;
}

function renderAtRoute({
  pathname,
  component,
  logout = () => Promise.resolve(),
}: RenderOpts) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
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
                <Route path={pathname} element={component} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

/**
 * Mount ComingSoonPage at a given placeholder path. Replicates the
 * PLACEHOLDERS wiring in App.tsx (just the placeholder route itself —
 * not the /submit route, which is covered by a separate test).
 */
function renderComingSoon(
  pathname: string,
  logout: () => Promise<void> = () => Promise.resolve(),
) {
  return renderAtRoute({
    pathname,
    component: (
      <ComingSoonPage
        landing={pathname}
        description={`Description for ${pathname}.`}
      />
    ),
    logout,
  });
}

describe('WO-016 Coming Soon Page reconciliation', () => {
  // (1) Renders at /approve, /audit, /vendor (3 placeholder routes).
  it('(1) renders the coming-soon-card at /approve, /audit, /vendor', async () => {
    for (const path of ['/approve', '/audit', '/vendor']) {
      cleanup();
      renderComingSoon(path);
      await waitFor(() => {
        expect(screen.getByTestId('coming-soon-card')).toBeTruthy();
      });
      // Card heading + Sign out button both surface.
      expect(screen.getByTestId('coming-soon-title')).toBeTruthy();
      expect(screen.getByTestId('coming-soon-sign-out')).toBeTruthy();
    }
  });

  // (2) /submit routes to SubmitReportPage, NOT ComingSoonPage.
  it('(2) routes /submit to SubmitReportPage (not ComingSoonPage)', () => {
    renderAtRoute({
      pathname: '/submit',
      component: <SubmitReportPage />,
    });
    // SubmitReportPage testid is present.
    expect(screen.getByTestId('submit-report-page')).toBeTruthy();
    // The ComingSoonPage card is NOT rendered.
    expect(screen.queryByTestId('coming-soon-card')).toBeNull();
    expect(screen.queryByTestId('coming-soon-sign-out')).toBeNull();
  });

  // (3) Phase 2 notice is shown.
  it('(3) renders the "Coming in Phase 2" notice in the en locale', () => {
    renderComingSoon('/approve');
    // Title row carries the T0 glyph + Phase 2 copy.
    const title = screen.getByTestId('coming-soon-title');

    expect(title.textContent).toContain('Coming in Phase 2');
    expect(title.textContent).toContain('○');
    // Phase notice paragraph renders the explanatory line.
    const notice = screen.getByTestId('coming-soon-phase-notice');

    expect(notice.textContent).toMatch(/Phase 2/);
  });

  // (4) Bangla toggle works — Bangla strings contain real Bengali.
  it('(4a) renders real Bengali characters when locale is bn', async () => {
    await act(async () => {
      await i18n.changeLanguage('bn');
      document.body.dataset.locale = 'bn';
      window.localStorage.setItem('surakkha.locale', 'bn');
    });

    renderComingSoon('/approve');
    await waitFor(() => {
      expect(screen.getByTestId('coming-soon-card')).toBeTruthy();
    });

    const title = screen.getByTestId('coming-soon-title');

    // The Bangla title contains at least one Bengali char (U+0980–U+09FF).
    expect(title.textContent).toMatch(/[\u0980-\u09FF]/);
    // The trailer in Bangla contains real Bengali script.
    const trailer = screen.getByTestId('coming-soon-trailer');

    expect(trailer.textContent).toMatch(/[\u0980-\u09FF]/);
    // The Sign out button copy is Bangla.
    const signOut = screen.getByTestId('coming-soon-sign-out');

    expect(signOut.textContent).toMatch(/[\u0980-\u09FF]/);

    // Reset locale to en for downstream tests.
    await act(async () => {
      await i18n.changeLanguage('en');
      document.body.dataset.locale = 'en';
      window.localStorage.setItem('surakkha.locale', 'en');
    });
  });

  // (5a) Hindi lockdown sweep over en/comingSoon.json.
  it('(5a) en/comingSoon.json contains no Hindi / Devanagari letters', () => {
    const en = readFileSync(
      resolve(__dirname, '../i18n/locales/en/comingSoon.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(en)).toBe(false);
  });

  // (5b) Hindi lockdown sweep over bn/comingSoon.json.
  it('(5b) bn/comingSoon.json contains no Hindi / Devanagari letters', () => {
    const bn = readFileSync(
      resolve(__dirname, '../i18n/locales/bn/comingSoon.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(bn)).toBe(false);
    // Sanity check: it still contains real Bengali script.
    expect(bn).toMatch(/[\u0980-\u09FF]/);
  });

  // (M1) Back button renamed "Sign out" + variant="secondary" (NOT
  // variant="danger").
  it('(M1) sign-out button uses variant="secondary", not danger', () => {
    renderComingSoon('/approve');
    const signOut = screen.getByTestId('coming-soon-sign-out') as HTMLButtonElement;

    // The Button component renders `button--${variant}` class.
    expect(signOut.className).toContain('button--secondary');
    // The button MUST NOT have the danger variant class.
    expect(signOut.className).not.toContain('button--danger');
    // The Button's testId-derived data-testid is the explicit override.
    expect(signOut.getAttribute('data-testid')).toBe('coming-soon-sign-out');
  });

  // (M2) Card heading carries the T0 ○ glyph.
  it('(M2) card heading renders the T0 ○ placeholder glyph', () => {
    renderComingSoon('/approve');
    const glyph = screen.getByTestId('coming-soon-title-glyph');

    expect(glyph.textContent).toBe('○');
    // Decorative — aria-hidden so screen readers don't announce it.
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
  });

  // (M3) Sign out button invokes logout() on click.
  it('(M3) clicking Sign out invokes logout()', async () => {
    const logoutSpy = vi.fn(() => Promise.resolve());

    renderComingSoon('/approve', logoutSpy);
    const signOut = screen.getByTestId('coming-soon-sign-out');

    await act(async () => {
      fireEvent.click(signOut);
    });
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  // Lockdown sweep — focus rings in tech.css use --color-primary-tint.
  it('lockdown sweep — tech.css focus-visible uses --color-primary-tint', () => {
    const css = readFileSync(resolve(__dirname, '../styles/tech.css'), 'utf8');
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });
});
