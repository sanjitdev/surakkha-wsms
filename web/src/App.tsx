/**
 * App.tsx — top-level shell.
 *
 * Phase 1 routing: role-based branching lives inside `<RoutedSurface>`.
 * The first segment of the URL decides what renders; the persona's
 * `session.landing` becomes the default for authenticated users.
 *
 * Routes (Story 1.5+ will replace the catch-all `<LoginPage />` with the
 * real persona landing surfaces):
 *   /           → <LoginPage />         (unauthenticated)
 *   /styleguide → <StyleguidePage />    (dev-only; stripped in production)
 *   /inbox      → <OperatorDashboard /> for utility_operator; else <LoginPage />
 *   /field      → <FieldQueuePage />   for field_technician; else <LoginPage />
 *   /dashboard  → <OperatorDashboard /> for utility_operator; else <LoginPage />
 *   *           → <LoginPage />         (default)
 *
 * FE-1.1b mounts useTheme + useLocale at the App root via `<AppShell>` so the
 * body-level dataset.theme / dataset.locale attributes are live before any
 * page renders. The persona branches in App.tsx are kept for backward
 * compat with Stories 1.2 + 1.3 until FE-1.5 owns full routing.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { FieldQueuePage } from './pages/FieldQueuePage';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { StyleguidePage } from './pages/StyleguidePage';
import { getSession, type SessionRow } from './mocks/idb';
import { useTheme } from './hooks/useTheme';
import { useLocale } from './hooks/useLocale';

/** Mounts body-level theme + locale hooks so dataset attrs are live. */
function AppShell({ children }: { children: ReactNode }) {
  // Mount side effect only — the hook return values aren't consumed here,
  // but the effect runs once at App boot and persists choice to localStorage.
  useTheme();
  useLocale();
  // useLocation is consumed to ensure BrowserRouter is the parent (TS check).
  useLocation();
  return <>{children}</>;
}

/** Persona-aware gate. Wraps the role branches in <RoutedSurface>. */
function RoutedSurface() {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const row = await getSession();
      setSession(row ?? null);
      setLoaded(true);
    })();
  }, []);

  // First render — IndexedDB hasn't returned yet. Show nothing to avoid
  // a flash of the login picker for an already-logged-in user.
  if (!loaded) return null;

  return (
    <Routes>
      {import.meta.env.DEV && (
        <Route path="/styleguide" element={<StyleguidePage />} />
      )}

      {/* Field-tech branch (Story 1.2). */}
      <Route
        path="/field"
        element={
          session?.role === 'field_technician' ? (
            <FieldQueuePage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Operator branch (Story 1.3). */}
      <Route
        path="/inbox"
        element={
          session?.role === 'utility_operator' ? (
            <OperatorDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          session?.role === 'utility_operator' ? (
            <OperatorDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Root + catch-all → LoginPage until FE-1.5 wires every persona. */}
      <Route path="/" element={<LoginPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <RoutedSurface />
      </AppShell>
    </BrowserRouter>
  );
}
