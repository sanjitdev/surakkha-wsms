/**
 * App.tsx — top-level shell.
 *
 * Phase 1 routing: role-based branching lives inside `<RoutedSurface>`.
 * The first segment of the URL decides what renders; the persona's
 * `session.landing` becomes the default for authenticated users.
 *
 * Login/logout round-trip:
 *   - LoginPage writes the session into IndexedDB then emits
 *     `surakkha:session-changed` (see mocks/session-bus.ts).
 *   - RoutedSurface listens for that event and re-reads getSession().
 *   - The `<Routes>` tree naturally re-renders with the new role
 *     guard, landing the user on the persona's `landing` URL — no
 *     full-page reload, no flash of unstyled content.
 *
 * Routes (FE-1.5b wires InboxList + Karim's FieldQueuePage):
 *   /                → <LoginPage /> (when no session) / <Navigate to landing> (when session)
 *   /login           → alias for /
 *   /styleguide      → <StyleguidePage /> (dev-only)
 *   /inbox           → <InboxList />      for utility_operator
 *   /field           → <FieldQueuePage /> for field_technician
 *   /dashboard       → <OperatorDashboard /> for utility_operator
 *   /submit|/approve|/audit|/vendor
 *                   → <ComingSoonPage />  for the matching role
 *   *                → <LoginPage /> if no session, else <Navigate to landing>
 */
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { FieldQueuePage } from './pages/FieldQueuePage';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { StyleguidePage } from './pages/StyleguidePage';
import { InboxList } from './pages/InboxList';
import { type SessionRow, getSession } from './mocks/idb';
import { SESSION_CHANGED_EVENT } from './mocks/session-bus';
import { useTheme } from './hooks/useTheme';
import { useLocale } from './hooks/useLocale';

/** Mounts body-level theme + locale hooks so dataset attrs are live. */
function AppShell({ children }: { children: ReactNode }) {
  useTheme();
  useLocale();
  useLocation();
  return <>{children}</>;
}
/** Persona-aware gate. Wraps the role branches in <RoutedSurface>. */
function RoutedSurface() {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const row = await getSession();

    setSession(row ?? null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
    // Listen for cross-component session changes (login/logout).
    const onChange = () => { void refresh(); };

    window.addEventListener(SESSION_CHANGED_EVENT, onChange);
    return () => { window.removeEventListener(SESSION_CHANGED_EVENT, onChange); };
  }, [refresh]);

  // First render — IndexedDB hasn't returned yet. Show nothing to avoid
  // a flash of the login picker for an already-logged-in user.
  if (!loaded) return null;

  // Persona landings with descriptions for the ComingSoon placeholder.
  const placeholders: Record<string, { landing: string; description: string }> = {
    '/submit': { landing: '/submit', description: 'Anjali submits a citizen water-safety report (SMS / WhatsApp / voice / photo).' },
    '/approve': { landing: '/approve', description: 'PHA Approver dual-signs PublicNoticeIssued + PlaybookAmendmentApproved.' },
    '/audit': { landing: '/audit', description: 'Read-only audit chain explorer (PHA Viewer).' },
    '/vendor': { landing: '/vendor', description: 'Vendor sensor-fleet batch submission (SensorReadingSubmitted).' },
  };

  return (
    <Routes>
      {import.meta.env.DEV && (
        <Route path="/styleguide" element={<StyleguidePage />} />
      )}

      {/* Login is always reachable. */}
      <Route path="/" element={session ? <Navigate to={landingFor(session)} replace /> : <LoginPage />} />
      <Route path="/login" element={session ? <Navigate to={landingFor(session)} replace /> : <LoginPage />} />

      {/* Built persona surfaces. */}
      <Route
        path="/field"
        element={
          session?.role === 'field_technician' ? (
            <FieldQueuePage />
          ) : session ? (
            <Navigate to={landingFor(session)} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/inbox"
        element={
          session?.role === 'utility_operator' ? (
            <InboxList />
          ) : session ? (
            <Navigate to={landingFor(session)} replace />
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
          ) : session ? (
            <Navigate to={landingFor(session)} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Placeholder for unbuilt persona landings. */}
      {session && Object.entries(placeholders).map(([path, info]) => (
        <Route
          key={path}
          path={path}
          element={
            roleMatchesLanding(session.role, path) ? (
              <ComingSoonPage persona={session} landing={info.landing} description={info.description} />
            ) : (
              <Navigate to={landingFor(session)} replace />
            )
          }
        />
      ))}

      {/* Catch-all → if no session, login. Otherwise, send to landing. */}
      <Route
        path="*"
        element={
          session ? (
            <Navigate to={landingFor(session)} replace />
          ) : (
            <LoginPage />
          )
        }
      />
    </Routes>
  );
}
/** Derive the default landing URL for a given session role. */
function landingFor(session: SessionRow): string {
  switch (session.role) {
    case 'field_technician': return '/field';
    case 'utility_operator':
    case 'utility_message_desk': return '/inbox';
    case 'anjali': return '/submit';
    case 'pha_approver': return '/approve';
    case 'pha_viewer': return '/audit';
    case 'vendor': return '/vendor';
    default: return '/';
  }
}
/** Role → path match check for the placeholder routes. */
function roleMatchesLanding(role: string, path: string): boolean {
  return landingFor({ role } as SessionRow) === path;
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
