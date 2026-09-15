/**
 * fe-styleguide-reconcile.test.tsx — WO-015 acceptance matrix.
 *
 * Tier 3 (light) build per docs/E-Development/WO-015-styleguide-page.md.
 * Pins the 7 acceptance criteria + lockdown sweep for the StyleguidePage
 * reconciliation. The styleguide is dev-only (gated by import.meta.env.DEV
 * in App.tsx) — the test mounts <StyleguidePage /> directly without
 * routing.
 *
 * Acceptance pins:
 *   (1) The page mounts and renders its container (`sg-shell`).
 *   (2) Trust band section renders the 5-band lockdown palette
 *       (T0 / T1 / T2 / T3 / resolved) per foundation §1.1 / §4.1,
 *       each with its dedicated testid + glyph + text label.
 *   (3) Trust band section does NOT contain the legacy 3-band vocab
 *       ("High" / "Medium" / "Low") inside its 5-band showcase row.
 *   (4) Danger button showcase: at least one button with
 *       variant="danger" whose label is issuance-related
 *       ("Confirm consumer notice" or similar) — the danger is
 *       RESERVED for T3+ consumer-notice issuance per lockdown §7.1.
 *   (5) Destructive operator action showcase: at least one button
 *       with variant="secondary" + warning icon, NOT variant="danger".
 *   (6) Reporter-badge section renders all 4 kinds (anchor / hotline /
 *       webform / sensor), each via the shared <ReporterBadge /> chip.
 *   (7a) Focus-ring section renders a primary button demo.
 *   (7b) Focus-ring section renders an input demo.
 *   (7c) The :focus-visible rule uses --color-primary-tint
 *        (lockdown §10.2).
 *   (8)  VS15 demo renders both a plain `✓` and a `✓\uFE0E` literal.
 *   (9)  Bangla line-height demo renders two columns (1.5 vs 1.6).
 *   (10) Locale + theme toggles update document.body.dataset.locale
 *        and document.body.dataset.theme via the header controls.
 *   (11) Hindi lockdown regex over both locale files (en + bn)
 *        returns no matches.
 *
 * Lockdown compliance (every Tier 3 build):
 *   - No Hindi in locale files (Devanagari letters-only regex).
 *   - Focus rings use 2px --color-primary-tint.
 *   - alert-red reserved for consumer-notice issuance; danger
 *     variant reserved for T3+ issuance path only.
 *   - Bangla-first; both en + bn files exist + load.
 *   - No confetti / no sound / no party effects.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { StyleguidePage } from '../pages/StyleguidePage';
import { handlers } from '../mocks/handlers';

// jsdom has no matchMedia — stub it for Toast RAF + any component that
// checks prefers-color-scheme at mount.
beforeAll(() => {
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

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Lockdown-bound regex from the cascade. Devanagari LETTERS only —
// DanDA (U+0964) is shared with Bengali as a period and excluded.
const HINDI_LETTERS_REGEX = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;

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

/**
 * Wrapper that mounts the StyleguidePage directly (the route is
 * dev-only) so the test does not have to drive react-router and
 * import.meta.env.DEV. Wraps in LocaleProvider + ToastProvider +
 * MemoryRouter so the page's <Link to="/"> link doesn't crash.
 */
function renderStyleguide() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <MemoryRouter
            initialEntries={['/styleguide']}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <StyleguidePage />
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('WO-015 Styleguide Page reconciliation', () => {
  // (1) Page renders with its shell wrapper.
  it('(1) mounts and renders the styleguide shell', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('sg-section-trust-band')).toBeTruthy();
    });
    // Header control row is rendered.
    expect(screen.getByText(/back to login/i)).toBeTruthy();
  });

  // (2) Trust band section renders 5 distinct bands: T0, T1, T2, T3,
  //     resolved.
  it('(2) trust band section renders all 5 lockdown bands', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('styleguide-band-t0')).toBeTruthy();
    });
    // Every band must render with its own testid.
    expect(screen.getByTestId('styleguide-band-t0')).toBeTruthy();
    expect(screen.getByTestId('styleguide-band-t1')).toBeTruthy();
    expect(screen.getByTestId('styleguide-band-t2')).toBeTruthy();
    expect(screen.getByTestId('styleguide-band-t3')).toBeTruthy();
    expect(screen.getByTestId('styleguide-band-resolved')).toBeTruthy();
    // Each band has a glyph + a text label (textContent non-empty +
    // includes the band token).
    const t0 = screen.getByTestId('styleguide-band-t0');

    expect(t0.textContent).toMatch(/T0/);
    const t1 = screen.getByTestId('styleguide-band-t1');

    expect(t1.textContent).toMatch(/T1/);
    const t2 = screen.getByTestId('styleguide-band-t2');

    expect(t2.textContent).toMatch(/T2/);
    const t3 = screen.getByTestId('styleguide-band-t3');

    expect(t3.textContent).toMatch(/T3/);
    const resolved = screen.getByTestId('styleguide-band-resolved');

    expect(resolved.textContent).toMatch(/RESOLVED/);
  });

  // (3) The trust-band section's 5-band showcase row does NOT contain
  //     the legacy 3-band vocab "High" / "Medium" / "Low". (The legacy
  //     BandPill 3-band is preserved on a separate row below.)
  it('(3) trust band 5-band showcase does NOT contain High/Medium/Low vocabulary', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('styleguide-band-t0')).toBeTruthy();
    });
    // The 5-band lockdown badges must not include the legacy trio.
    const t0Badge = screen.getByTestId('styleguide-band-t0');
    const t1Badge = screen.getByTestId('styleguide-band-t1');
    const t2Badge = screen.getByTestId('styleguide-band-t2');
    const t3Badge = screen.getByTestId('styleguide-band-t3');
    const resolvedBadge = screen.getByTestId('styleguide-band-resolved');

    for (const b of [t0Badge, t1Badge, t2Badge, t3Badge, resolvedBadge]) {
      expect(b.textContent).not.toMatch(/^High\b|^Medium\b|^Low\b|\bHigh\s|\bMedium\s|\bLow\s/);
    }
  });

  // (4) Danger button showcase: row with variant="danger" whose
  //     label is "Confirm consumer notice" (the single sanctioned
  //     use site per lockdown §7.1).
  it('(4) danger row has variant="danger" + issuance label "Confirm consumer notice"', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('styleguide-button-danger-issuance')).toBeTruthy();
    });
    const dangerRow = screen.getByTestId('styleguide-button-danger-issuance');
    // The row contains at least one button labelled "Confirm consumer notice".
    const confirmButtons = dangerRow.querySelectorAll('button.button--danger');

    expect(confirmButtons.length).toBeGreaterThan(0);
    for (const b of Array.from(confirmButtons)) {
      expect((b as HTMLElement).textContent).toMatch(/Confirm consumer notice/);
    }
  });

  // (5) Destructive operator action row uses variant="secondary" +
  //     warning icon, NOT variant="danger".
  it('(5) destructive operator action uses variant="secondary" + warn icon, NOT danger', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('styleguide-button-destructive-secondary')).toBeTruthy();
    });
    const destructiveRow = screen.getByTestId('styleguide-button-destructive-secondary');
    // The row uses secondary buttons — must contain .button--secondary.
    const secondaryButtons = destructiveRow.querySelectorAll('button.button--secondary');

    expect(secondaryButtons.length).toBeGreaterThan(0);
    // The row must NOT contain any danger buttons.
    const dangerButtons = destructiveRow.querySelectorAll('button.button--danger');

    expect(dangerButtons.length).toBe(0);
    // Each secondary button has the warning glyph (⚠ + VS15) + one of
    // (Reject / Override / Force resolve).
    for (const b of Array.from(secondaryButtons)) {
      const text = (b as HTMLElement).textContent ?? '';
      const html = (b as HTMLElement).innerHTML ?? '';

      expect(text).toMatch(/Reject|Override|Force resolve/);
      expect(html).toMatch(/\u26A0\uFE0E|\u26A0/);
    }
  });

  // (6) Reporter-badge section renders all 4 kinds via the shared
  //     <ReporterBadge /> component.
  it('(6) reporter-badge section renders all 4 reporter kinds', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('sg-section-reporter-badge')).toBeTruthy();
    });
    // Each kind renders with a data-reporter-kind attribute.
    const anchor = screen.getByTestId('styleguide-reporter-anchor');

    expect(anchor.getAttribute('data-reporter-kind')).toBe('anchor');
    const hotline = screen.getByTestId('styleguide-reporter-hotline');

    expect(hotline.getAttribute('data-reporter-kind')).toBe('hotline');
    const webform = screen.getByTestId('styleguide-reporter-webform');

    expect(webform.getAttribute('data-reporter-kind')).toBe('webform');
    const sensor = screen.getByTestId('styleguide-reporter-sensor');

    expect(sensor.getAttribute('data-reporter-kind')).toBe('sensor');
  });

  // (7a) Focus-ring section renders a button demo.
  it('(7a) focus-ring section renders a focus-ring button demo', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('sg-section-focus-ring')).toBeTruthy();
    });
    expect(screen.getByTestId('styleguide-focus-ring-button')).toBeTruthy();
  });

  // (7b) Focus-ring section renders an input demo.
  it('(7b) focus-ring section renders a focus-ring input demo', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('sg-section-focus-ring')).toBeTruthy();
    });
    expect(screen.getByTestId('styleguide-focus-ring-input')).toBeTruthy();
  });

  // (7c) The :focus-visible rule uses --color-primary-tint.
  it('(7c) styleguide.css :focus-visible rule binds to --color-primary-tint', () => {
    const css = readFileSync(
      resolve(__dirname, '../styles/styleguide.css'),
      'utf8',
    );
    const focusBlocks = css.match(/focus-visible[\s\S]{0,400}/g) ?? [];

    expect(focusBlocks.length).toBeGreaterThan(0);
    const usesTint = focusBlocks.some((b) => b.includes('--color-primary-tint'));

    expect(usesTint).toBe(true);
  });

  // (8) VS15 demo renders both a plain `✓` and a `✓\uFE0E` literal.
  it('(8) VS15 demo renders both plain ✓ and ✓\\uFE0E literals', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('styleguide-vs15-demo')).toBeTruthy();
    });
    const plain = screen.getByTestId('styleguide-vs15-plain');
    const forced = screen.getByTestId('styleguide-vs15-forced');

    expect(plain.textContent).toContain('✓');
    expect(forced.textContent).toContain('\u2713\uFE0E');
    // The forced column must NOT contain a plain ✓ without VS15.
    expect(forced.textContent).not.toMatch(/✓(?!\uFE0E)/);
    // The plain column must NOT contain a ✓ with VS15.
    expect(plain.textContent).not.toMatch(/✓\uFE0E/);
  });

  // (9) Bangla line-height demo renders two columns (1.5 vs 1.6).
  it('(9) Bangla line-height demo renders two columns (1.5 vs 1.6)', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByTestId('styleguide-bangla-line-height-demo')).toBeTruthy();
    });
    expect(screen.getByTestId('styleguide-bangla-line-height-1-5')).toBeTruthy();
    expect(screen.getByTestId('styleguide-bangla-line-height-1-6')).toBeTruthy();
    // Each column has the line-height class.
    const col15 = screen.getByTestId('styleguide-bangla-line-height-1-5');

    expect(col15.className).toContain('sg-line-height-col--1-5');
    const col16 = screen.getByTestId('styleguide-bangla-line-height-1-6');

    expect(col16.className).toContain('sg-line-height-col--1-6');
  });

  // (10a) Theme toggle changes body.dataset.theme and persists to
  //      localStorage.
  it('(10a) theme toggle changes body.dataset.theme and persists', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByText(/back to login/i)).toBeTruthy();
    });
    // Initial: light.
    expect(document.body.dataset.theme).toBe('light');
    // The header has a theme button that toggles between light/dark.
    const themeBtn = screen.getByRole('button', { name: /theme:/i });

    await act(async () => {
      fireEvent.click(themeBtn);
    });
    await waitFor(() => {
      expect(document.body.dataset.theme).toBe('dark');
    });
    expect(window.localStorage.getItem('surakkha.theme')).toBe('dark');
  });

  // (10b) Locale toggle changes body.dataset.locale and persists.
  it('(10b) locale toggle changes body.dataset.locale and persists', async () => {
    renderStyleguide();
    await waitFor(() => {
      expect(screen.getByText(/back to login/i)).toBeTruthy();
    });
    // Initial: en.
    expect(document.body.dataset.locale).toBe('en');
    // Use getAllByRole since the styleguide renders multiple locale
    // toggles (header + DatePicker live readout). All of them call the
    // same toggleLocale handler; clicking either one flips
    // body.dataset.locale.
    const localeBtns = screen.getAllByRole('button', { name: /locale:/i });

    expect(localeBtns.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(localeBtns[0]);
    });
    await waitFor(() => {
      expect(document.body.dataset.locale).toBe('bn');
    });
    expect(window.localStorage.getItem('surakkha.locale')).toBe('bn');
  });

  // (11a) en/styleguide.json contains no Hindi / Devanagari letters.
  it('(11a) en/styleguide.json contains no Hindi letters', () => {
    const en = readFileSync(
      resolve(__dirname, '../i18n/locales/en/styleguide.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(en)).toBe(false);
  });

  // (11b) bn/styleguide.json contains no Hindi / Devanagari letters.
  it('(11b) bn/styleguide.json contains no Hindi letters', () => {
    const bn = readFileSync(
      resolve(__dirname, '../i18n/locales/bn/styleguide.json'),
      'utf8',
    );

    expect(HINDI_LETTERS_REGEX.test(bn)).toBe(false);
  });

  // (11c) bn/styleguide.json contains real Bengali script (U+0980–U+09FF).
  it('(11c) bn/styleguide.json contains real Bengali script (U+0980–U+09FF)', () => {
    const bn = readFileSync(
      resolve(__dirname, '../i18n/locales/bn/styleguide.json'),
      'utf8',
    );

    expect(bn).toMatch(/[\u0980-\u09FF]/);
  });

  // (12) StyleguidePage source sanity — the .mono class binding in
  // styleguide.css uses --font-family-mono (IBM Plex Mono), not the
  // system-mono fallback that the migration replaced.
  it('(12) StyleguidePage binds .mono to --font-family-mono (IBM Plex Mono)', async () => {
    const css = readFileSync(
      resolve(__dirname, '../styles/styleguide.css'),
      'utf8',
    );

    // (a) .mono class binds to --font-family-mono.
    expect(css).toMatch(/\.mono\s*\{[\s\S]{0,200}var\(--font-family-mono\)/);
    // (b) The styleguide CSS does NOT use the legacy `ui-monospace`
    // system fallback on the .mono class binding — the migration
    // replaced that with the lockdown token.
    const monoBlock = css.match(/\.mono\s*\{[\s\S]{0,400}\}/);

    expect(monoBlock).not.toBeNull();
    expect(monoBlock![0]).toContain('var(--font-family-mono)');
    expect(monoBlock![0]).not.toMatch(/ui-monospace/);
  });
});
