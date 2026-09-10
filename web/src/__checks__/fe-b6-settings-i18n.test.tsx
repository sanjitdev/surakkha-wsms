/**
 * fe-b6-settings-i18n.test.tsx — Settings localization.
 *
 * Pins the i18n contract for /settings:
 *   1) en_render: all 4 cards (theme, language, persona, reset) and
 *      the page header render English literals from settings.json.
 *   2) bn_render: same surface renders Bengali when locale flips.
 *   3) anjali_card_translates: the role-gated Anjali card translates
 *      when locale flips AND session.role === 'anjali'.
 *   4) key_parity: en and bn JSONs expose the same key paths.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { Settings } from '../pages/Settings';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import enJson from '../i18n/locales/en/settings.json';
import bnJson from '../i18n/locales/bn/settings.json';

const SESSION_PRIYA = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
};

const SESSION_ANJALI = {
  ...SESSION_PRIYA,
  actor_id: 'anjali-001',
  actor_ref: 'anjali-001',
  display_name: 'Anjali',
  role: 'anjali',
};

function renderSettings(role: 'priya' | 'anjali' = 'priya') {
  const session = role === 'anjali' ? SESSION_ANJALI : SESSION_PRIYA;
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
              session,
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <Settings />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

beforeEach(() => {
  try {
    window.localStorage.setItem('surakkha.locale', 'en');
    document.body.dataset.locale = 'en';
    window.localStorage.removeItem('surakkha.anjali.incidentDateFrom');
  } catch {
    /* noop */
  }
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FE-B6 Settings i18n', () => {
  // (1) English render — all 4 cards + header.
  it('en_render: header + theme + language + persona + reset cards translate', () => {
    renderSettings();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(enJson.header.title);
    expect(screen.getByText(enJson.theme.title)).toBeTruthy();
    expect(screen.getByText(enJson.theme.subtitle)).toBeTruthy();
    expect(screen.getByText(enJson.language.title)).toBeTruthy();
    expect(screen.getByText(enJson.persona.title)).toBeTruthy();
    expect(screen.getByText(enJson.reset.title)).toBeTruthy();
    // Theme buttons.
    expect(screen.getByText(enJson.theme.light)).toBeTruthy();
    expect(screen.getByText(enJson.theme.dark)).toBeTruthy();
    // Locale buttons — English (en button label) + native Bangla (bn).
    expect(screen.getByText(enJson.language.english)).toBeTruthy();
    expect(screen.getByText(enJson.language.bangla)).toBeTruthy();
    // Reset button idle.
    expect(screen.getByText(enJson.reset.buttonIdle)).toBeTruthy();
  });

  // (2) Bengali render — same surface in Bengali.
  it('bn_render: same surface renders Bengali when locale flips to bn', async () => {
    renderSettings();
    void i18n.changeLanguage('bn');
    document.body.dataset.locale = 'bn';
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(bnJson.header.title);
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/[\u0980-\u09FF]/);
    expect(screen.getByText(bnJson.theme.title)).toBeTruthy();
    expect(screen.getByText(bnJson.theme.light)).toBeTruthy();
    expect(screen.getByText(bnJson.theme.dark)).toBeTruthy();
    expect(screen.getByText(bnJson.language.title)).toBeTruthy();
    expect(screen.getByText(bnJson.persona.title)).toBeTruthy();
    expect(screen.getByText(bnJson.reset.buttonIdle)).toBeTruthy();
  });

  // (3) Anjali card translates when locale flips.
  it('anjali_card_translates: Anjali sees Citizen reports card with bn title after flip', async () => {
    renderSettings('anjali');
    expect(screen.getByText(enJson.anjali.title)).toBeTruthy();
    void i18n.changeLanguage('bn');
    document.body.dataset.locale = 'bn';
    await waitFor(() => {
      expect(screen.getByText(bnJson.anjali.title)).toBeTruthy();
    });
    expect(screen.getByText(bnJson.anjali.title).textContent).toMatch(/[\u0980-\u09FF]/);
    expect(screen.getByText(bnJson.anjali.clear)).toBeTruthy();
  });

  // (4) Key parity — en and bn JSONs expose the same key paths.
  it('key_parity_en_bn: every en key is also present (with non-empty string) in bn', () => {
    for (const section of Object.keys(enJson)) {
      const enSection = (enJson as Record<string, Record<string, string>>)[section];
      const bnSection = (bnJson as Record<string, Record<string, string>>)[section];

      for (const key of Object.keys(enSection)) {
        expect(bnSection?.[key], `bn.${section}.${key} missing`).toBeTruthy();
      }
    }
  });
});
