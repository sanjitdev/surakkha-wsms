/**
 * i18n bootstrap — i18next + react-i18next.
 *
 * Loads namespaced JSON from /src/i18n/locales/{lng}/{ns}.json. Initial
 * language is read from the same localStorage key the existing useLocale
 * hook uses (`surakkha.locale`), so the dataset attribute on <body> and
 * the i18next active language stay in lockstep — see LocaleSync for the
 * bridge that re-syncs them when the user toggles.
 *
 * Defaults to English when nothing is stored. The bn (Bangla) resources
 * ship with this batch; further locales can be added by dropping a new
 * folder under /locales and importing it here.
 *
 * We deliberately don't wire `i18next-browser-languagedetector` — the
 * locale is an explicit in-app preference (the toggle in StyleguidePage),
 * not a sniffed browser value. The detector is still imported by some
 * transitive code paths in dev; the import here is just so we keep the
 * detection API available for future use without surprising consumers.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Locale } from '../types/domain';
import enCommon from './locales/en/common.json';
import bnCommon from './locales/bn/common.json';
import enLogin from './locales/en/login.json';
import bnLogin from './locales/bn/login.json';

export const SUPPORTED_LOCALES: readonly Locale[] = [Locale.En, Locale.Bn];
export const STORAGE_KEY = 'surakkha.locale';
function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return Locale.En;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === Locale.En || stored === Locale.Bn) return stored;
  } catch {
    return Locale.En;
  }
  return Locale.En;
}
void i18n.use(initReactI18next).init({
  resources: {
    [Locale.En]: { common: enCommon, login: enLogin },
    [Locale.Bn]: { common: bnCommon, login: bnLogin },
  },
  lng: readInitialLocale(),
  fallbackLng: Locale.En,
  defaultNS: 'common',
  ns: ['common', 'login'],
  // Stop i18next from trying to fetch /locales/{{lng}}/{{ns}}.json —
  // resources are bundled at build time via Vite's JSON import.
  partialBundledLanguages: true,
  interpolation: {
    // React already escapes by default; don't double-escape.
    escapeValue: false,
  },
  // We're a small app with two locales — no need for Suspense.
  react: { useSuspense: false },
  returnEmptyString: false,
});

/**
 * Switch the active language and persist the choice. Safe to call from
 * anywhere (UI toggle, deep link, test).
 */
export function setLanguage(locale: Locale): void {
  void i18n.changeLanguage(locale);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
      if (typeof document !== 'undefined') {
        document.body.dataset.locale = locale;
      }
    } catch {
      // Privacy mode / quota — silently ignore; in-memory state is fine.
    }
  }
}
export default i18n;
