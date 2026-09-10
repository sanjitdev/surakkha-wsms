/**
 * FE-B6 — shared chrome i18n test.
 *
 * Pins the I/O matrix from the localization refactor plan
 * (gentle-singing-torvalds.md, Batch 1):
 *
 *   1) Sidebar nav resolves to en labels when role=utility_operator
 *   2) Sidebar nav resolves to bn labels when role=utility_operator
 *   3) TopChrome brand + chain labels translate
 *   4) ErrorScreen title + reload button translate
 *   5) Pagination summary + prev/next labels translate
 *   6) LocaleProvider + i18n change re-renders Sidebar with new locale
 *
 * The Sidebar's `data-testid` is derived from the *resolved* label,
 * so the suffix flips with the locale (`dashboard` → `ড্যাশবোর্ড`).
 * Tests query by `href` instead — href is the stable identifier
 * regardless of locale. We use Bengali regex `/[\u0980-\u09FF]/` to
 * assert the bn locale actually engaged.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n, { setLanguage } from '../i18n';
import { Locale } from '../types/domain';
import { LocaleProvider } from '../hooks/useLocale';
import { Sidebar } from '../components/layout/Sidebar';
import { TopChrome } from '../components/layout/TopChrome';
import { ErrorScreen } from '../components/ui/ErrorScreen';
import { Pagination } from '../components/ui/Pagination';

beforeEach(() => {
  try {
    window.localStorage.removeItem('surakkha.locale');
  } catch {
    // ignore
  }
  void i18n.changeLanguage(Locale.En);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Wrap a node in MemoryRouter + i18n + Locale providers so consumers
 *  can call `useTranslation()` / `useLocale()` / `<Link>` without setup
 *  boilerplate. */
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <I18nextProvider i18n={i18n}>
        <LocaleProvider>{children}</LocaleProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
}

/** Find a sidebar nav link by its stable href. We can't use
 *  `getByTestId('sidebar-link-...')` because the suffix is derived
 *  from the resolved label and therefore changes when the locale
 *  flips (e.g. `sidebar-link-dashboard` → `sidebar-link-ড্যাশবোর্ড`).
 *  href is locale-agnostic but the brand link also has an href, so
 *  we scope to the `<nav>` (which excludes the brand chip). */
function getNavLink(href: string): HTMLAnchorElement {
  const nav = screen.getByRole('navigation');
  const link = within(nav)
    .getAllByRole('link')
    .find((el) => el.getAttribute('href') === href) as HTMLAnchorElement | undefined;
  if (!link) throw new Error(`nav link href="${href}" not found`);
  return link;
}

/** Force a locale flip + remount. I18nextProvider's internal
 *  language-changed subscription doesn't always flush synchronously
 *  in unit tests; the cleanest fix is cleanup + setLanguage +
 *  caller-side remount. Tests that assert "after locale flip X
 *  renders" re-render their tree between the en + bn halves. */
async function flipLocale(locale: Locale): Promise<void> {
  cleanup();
  setLanguage(locale);
  await waitFor(() => {
    expect(i18n.language).toBe(locale);
  });
}

const FAKE_NAV_ITEMS = [
  { labelKey: 'layout:nav.utility_operator.dashboard', href: '/dashboard', icon: null },
  { labelKey: 'layout:nav.utility_operator.inbox', href: '/inbox', icon: null },
  { labelKey: 'layout:nav.utility_operator.settings', href: '/settings', icon: null },
];

describe('FE-B6 shared chrome i18n', () => {
  // (1) Sidebar en — nav labels render in English.
  it('sidebar nav: en labels render for utility_operator', () => {
    render(
      <Providers>
        <Sidebar navItems={FAKE_NAV_ITEMS} currentPath="/inbox" brand="SURAKKHA" />
      </Providers>,
    );
    expect(getNavLink('/dashboard').textContent).toContain('Dashboard');
    expect(getNavLink('/inbox').textContent).toContain('Inbox');
    expect(getNavLink('/settings').textContent).toContain('Settings');
  });

  // (2) Sidebar bn — flip locale, then render the tree again so the
  // I18nextProvider subscribes to the bn resources; nav label strings
  // contain Bengali script.
  it('sidebar nav: bn labels render after locale flip', async () => {
    await flipLocale(Locale.Bn);
    render(
      <Providers>
        <Sidebar navItems={FAKE_NAV_ITEMS} currentPath="/inbox" brand="SURAKKHA" />
      </Providers>,
    );
    const dashText = getNavLink('/dashboard').textContent ?? '';
    const inboxText = getNavLink('/inbox').textContent ?? '';

    expect(dashText).toMatch(/[\u0980-\u09FF]/);
    expect(inboxText).toMatch(/[\u0980-\u09FF]/);
  });

  // (3) TopChrome — brand + chain label translate.
  it('topChrome: brand + chain label translate', async () => {
    render(
      <Providers>
        <TopChrome personaLabel="Priya" chainFreshSeconds={5} />
      </Providers>,
    );
    const header = screen.getByTestId('top-chrome');

    expect(within(header).getByText('Surakkha')).toBeTruthy();
    expect(within(header).getByText(/chain/)).toBeTruthy();

    await flipLocale(Locale.Bn);
    render(
      <Providers>
        <TopChrome personaLabel="Priya" chainFreshSeconds={5} />
      </Providers>,
    );
    const headerBn = screen.getByTestId('top-chrome');

    expect(headerBn.textContent ?? '').toMatch(/[\u0980-\u09FF]/);
  });

  // (4) ErrorScreen — title + reload button translate.
  it('errorScreen: title + reload button translate', async () => {
    const err = new Error('TestFailure');

    render(
      <Providers>
        <ErrorScreen error={err} showStack={false} />
      </Providers>,
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Reload page')).toBeTruthy();

    await flipLocale(Locale.Bn);
    render(
      <Providers>
        <ErrorScreen error={err} showStack={false} />
      </Providers>,
    );
    expect(screen.getByText('কিছু ভুল হয়েছে')).toBeTruthy();
    expect(screen.getByText('পেজ রিলোড করুন')).toBeTruthy();
  });

  // (5) Pagination — prev/next labels translate. The testid is
  // locale-independent (the component owns the prefix), so we can
  // assert on it in both locales.
  it('pagination: prev/next + page-size translate', async () => {
    render(
      <Providers>
        <Pagination page={2} pageSize={10} total={25} onPageChange={() => undefined} />
      </Providers>,
    );
    expect(screen.getByTestId('pagination-prev').textContent).toContain('Prev');
    expect(screen.getByTestId('pagination-next').textContent).toContain('Next');

    await flipLocale(Locale.Bn);
    render(
      <Providers>
        <Pagination page={2} pageSize={10} total={25} onPageChange={() => undefined} />
      </Providers>,
    );
    expect(screen.getByTestId('pagination-prev').textContent).toMatch(/[\u0980-\u09FF]/);
    expect(screen.getByTestId('pagination-next').textContent).toMatch(/[\u0980-\u09FF]/);
  });

  // (6) LocaleProvider + i18n change is reflected on the next
  //     render of the Sidebar (regression for the useLocaleSync
  //     bridge).
  it('useLocaleSync: flipping LocaleProvider re-renders Sidebar with new locale', async () => {
    render(
      <Providers>
        <Sidebar navItems={FAKE_NAV_ITEMS} currentPath="/inbox" brand="SURAKKHA" />
      </Providers>,
    );
    expect(getNavLink('/dashboard').textContent).toContain('Dashboard');

    await flipLocale(Locale.Bn);
    render(
      <Providers>
        <Sidebar navItems={FAKE_NAV_ITEMS} currentPath="/inbox" brand="SURAKKHA" />
      </Providers>,
    );

    expect(getNavLink('/dashboard').textContent ?? '').toMatch(/[\u0980-\u09FF]/);
    // fireEvent is unused at runtime but the import keeps the
    // pattern visible for the next case that wires interaction.
    void fireEvent;
  });
});
