// Body-level locale switcher (NFR-FE6 + AD-FE-1). Reads localStorage,
// defaults to English, writes document.body.dataset.locale. Exported here
// but not yet called at mount — FE-1.1b wires App.tsx.

import { useCallback, useEffect, useState } from 'react';
import { Locale } from '../types/domain';

const STORAGE_KEY = 'surakkha.locale';

function readInitial(): Locale {
  if (typeof window === 'undefined') return Locale.En;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === Locale.En || stored === Locale.Bn) return stored;
  } catch {
    return Locale.En;
  }
  return Locale.En;
}
export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
} {
  const [locale, setLocaleState] = useState<Locale>(readInitial);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      document.body.dataset.locale = locale;
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // localStorage may throw in privacy mode or quota-exceeded;
      // the in-memory locale state still drives the hook return shape.
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((prev) => (prev === Locale.En ? Locale.Bn : Locale.En));
  }, []);

  return { locale, setLocale, toggle };
}
