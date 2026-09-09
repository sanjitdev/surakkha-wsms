// Body-level locale switcher (NFR-FE6 + AD-FE-1). Reads localStorage,
// defaults to English, writes document.body.dataset.locale. Exported here
// but not yet called at mount — FE-1.1b wires App.tsx.
//
// State lives in a React context so every consumer sees the same value.
// This matters because the i18n bridge (useLocaleSync) and the picker UI
// both subscribe — if each called useLocale independently they'd each
// create their own state and the bridge would never see the picker's
// updates. The context guarantees a single source of truth.

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }): ReactNode {
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

  const value = useMemo<LocaleContextValue>(() => {
    return { locale, setLocale, toggle };
  }, [locale, setLocale, toggle]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);

  if (!ctx) {
    throw new Error('useLocale must be used inside <LocaleProvider>');
  }
  return ctx;
}
