/**
 * main.tsx — React entry point.
 *
 * Boots in one of two modes:
 *   - VITE_USE_MOCKS=true  → MSW intercepts fetch, seeds IndexedDB chain.
 *                            Matches the mockups' localStorage.persona model.
 *   - otherwise            → real FastAPI gateway (Phase 2; placeholder).
 *
 * On boot failure (mocks not seeded, runtime error) we still render the
 * React tree so the user sees something — the failure is logged and the
 * session row from IndexedDB will simply be empty.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
// Global styles — load order matters.
//   theme.css              declares the dim 1-4 tokens (color, type, spacing,
//                          radii, motion). MUST load first; everything else
//                          references var(--brand-*) / var(--bg-*) etc.
//   lockdown-bridge.css    the legacy → lockdown alias block (lives at the
//                          bottom of theme.css as section 8 since 2026-09-16;
//                          kept here for backward compat with any consumer
//                          that may still grep for it).
//   layout.css             the app-shell chrome (sidebar + top-chrome +
//                          page-header + tabs + pulse dot). Promoted from
//                          web/mockups/01-priya/dashboard.css on 2026-09-16.
//   app.css                React-app composition (login picker, brand panel,
//                          persona radios, picker-status, error screen).
//
// Note: theme.css was promoted out of web/mockups/ on 2026-09-16 —
// no src/* file now imports anything from the mockups/ folder.
import './styles/theme.css';
import './styles/lockdown-bridge.css';
import './styles/layout.css';
import './styles/app.css';
import i18n from './i18n';
import { App } from './App';

async function boot() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    try {
      const { startMocks } = await import('./mocks/browser');

      await startMocks();
    } catch (err) {
      console.error('[surakkha] failed to start MSW mocks', err);
    }
  }

  const root = document.getElementById('root');

  if (!root) throw new Error('#root not found in index.html');
  createRoot(root).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </StrictMode>,
  );
}
void boot();
