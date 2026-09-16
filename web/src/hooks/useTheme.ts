// Theme switcher (NFR-FE6 + AD-FE-1). Reads localStorage,
// falls back to prefers-color-scheme, writes the data-theme attribute
// to BOTH <html> and <body> so the cascade matches every selector in
// src/styles/theme.css.
//
// Why both:
//   - `[data-theme="dark"]` / `[data-theme="light"]` in theme.css match
//     any element with the attribute, including <html> and <body>.
//   - Writing to <body> alone leaves :root (which is <html>) on its
//     declared dark defaults, so <html>-scoped CSS variables resolve
//     to dark while body-scoped ones resolve to the chosen theme —
//     producing split-theme rendering.
//   - The first mount sets both before paint to avoid a flash.
//
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

// Apply theme synchronously on module load so the first paint already
// has the correct <html data-theme>. Without this, the page renders
// with theme.css's :root dark defaults for ~50ms before useEffect
// runs, causing a flash on light-theme reloads.
function applyToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
}
if (typeof document !== 'undefined') {
  applyToDocument(readInitial());
}
export function useTheme(): {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
} {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    try {
      applyToDocument(theme);
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
