// Body-level theme switcher (NFR-FE6 + AD-FE-1). Reads localStorage,
// falls back to prefers-color-scheme, writes document.body.dataset.theme.
// Exported here but not yet called at mount — FE-1.1b wires App.tsx.

import { useCallback, useEffect, useState } from 'react';
import { Theme } from '../types/domain';

const STORAGE_KEY = 'surakkha.theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return Theme.Light;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === Theme.Light || stored === Theme.Dark) return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return prefersDark ? Theme.Dark : Theme.Light;
  } catch {
    return Theme.Light;
  }
}
export function useTheme(): {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
  } {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      document.body.dataset.theme = theme;
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may throw in privacy mode or quota-exceeded;
      // the in-memory theme state still drives the hook return shape.
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === Theme.Light ? Theme.Dark : Theme.Light));
  }, []);

  return { theme, setTheme, toggle };
}
