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
// Global styles — the lockdown tokens live here. Importing theme.css
// from `mockups/` means the React app and the static mockups share
// one source of truth for color, typography, spacing.
import '../mockups/theme.css';
import './styles/app.css';
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
      <App />
    </StrictMode>,
  );
}
void boot();
