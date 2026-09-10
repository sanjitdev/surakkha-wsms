/**
 * fe-b6-verify-flow-i18n.test.tsx — VerifyFlow localization.
 *
 * Pins the i18n contract for /verify-flow:
 *   1) en_render: page header, current-step subtitle, and the three
 *      step indicators render English literals.
 *   2) bn_render: same surface renders Bengali when locale flips.
 *   3) advance_uses_translated_continue_label: clicking "Continue" the
 *      next step's title is translated, not a raw key.
 *   4) key_parity: en and bn JSONs expose the same key paths.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { VerifyFlow } from '../pages/VerifyFlow';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import enJson from '../i18n/locales/en/verifyFlow.json';
import bnJson from '../i18n/locales/bn/verifyFlow.json';

const SESSION_FIXTURE = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
};

beforeEach(() => {
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

function renderVerify() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <MemoryRouter>
          <AppLayoutContext.Provider
            value={{
              session: SESSION_FIXTURE,
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <VerifyFlow />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

describe('FE-B6 VerifyFlow i18n', () => {
  // (1) English render — header, step indicators, current step.
  it('en_render: page chrome + step indicator translate', async () => {
    renderVerify();
    await waitFor(() => {
      expect(screen.getByText(enJson.header.title)).toBeTruthy();
    });
    expect(screen.getByText(enJson.sensorCluster.title)).toBeTruthy();
    expect(screen.getByText(enJson.anjaliCorroboration.title)).toBeTruthy();
    expect(screen.getByText(enJson.councillorNotify.title)).toBeTruthy();
    expect(screen.getByText(enJson.sensorCluster.subtitle)).toBeTruthy();
  });

  // (2) Bengali render — same surface renders Bengali script.
  it('bn_render: same surface renders Bengali when locale flips to bn', async () => {
    renderVerify();
    await waitFor(() => {
      expect(screen.getByText(enJson.header.title)).toBeTruthy();
    });
    void i18n.changeLanguage('bn');
    document.body.dataset.locale = 'bn';
    await waitFor(() => {
      expect(screen.getByText(bnJson.header.title)).toBeTruthy();
    });
    expect(screen.getByText(bnJson.header.title).textContent).toMatch(/[\u0980-\u09FF]/);
    expect(screen.getByText(bnJson.sensorCluster.title)).toBeTruthy();
    expect(screen.getByText(bnJson.councillorNotify.title)).toBeTruthy();
  });

  // (3) Advance uses the translated continue label — verifies the
  // "Continue to Step 2: <title>" interpolation actually substitutes
  // the next step's title (not a raw key).
  it('advance_uses_translated_continue_label: continue shows next step title', async () => {
    renderVerify();
    await waitFor(() => {
      expect(screen.getByText(enJson.sensorCluster.title)).toBeTruthy();
    });
    const continueBtn = await waitFor(() => {
      const btn = screen.getByTestId('verify-advance-anjali-corroboration') as HTMLButtonElement;

      expect(btn).toBeTruthy();
      return btn;
    });
    // The button's text interpolates Step num + next step's title.
    expect(continueBtn.textContent).toContain(`Step 2: ${enJson.anjaliCorroboration.title}`);

    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(screen.getByText(enJson.anjaliCorroboration.subtitle)).toBeTruthy();
    });
  });

  // (4) Key parity — en and bn JSONs expose the same key paths.
  it('key_parity_en_bn: every en key is also present (with non-empty string) in bn', () => {
    for (const section of Object.keys(enJson)) {
      const enSection = (enJson as unknown as Record<string, Record<string, string>>)[section];
      const bnSection = (bnJson as unknown as Record<string, Record<string, string>>)[section];

      // Skip bullets — they're object-shaped and asserted below.
      if (section === 'sensorCluster' || section === 'anjaliCorroboration' || section === 'councillorNotify') {
        // title/subtitle must match
        for (const key of Object.keys(enSection)) {
          if (key === 'bullets') continue;
          expect(bnSection?.[key], `bn.${section}.${key} missing`).toBeTruthy();
        }
        // bullets: every en bullet key must exist in bn
        const enBullets = enSection.bullets as unknown as Record<string, string>;
        const bnBullets = bnSection.bullets as unknown as Record<string, string>;
        for (const bk of Object.keys(enBullets)) {
          expect(bnBullets[bk], `bn.${section}.bullets.${bk} missing`).toBeTruthy();
        }
      } else {
        for (const key of Object.keys(enSection)) {
          expect(bnSection?.[key], `bn.${section}.${key} missing`).toBeTruthy();
        }
      }
    }
  });
});
