/**
 * App.tsx — top-level shell + routes.
 *
 * Phase 1 routing: every persona page is wrapped in <AppLayout> via a
 * react-router layout route. Login, ComingSoonPage placeholders, and
 * Styleguide (dev-only) all live outside the chrome.
 *
 * Login/logout round-trip:
 *   - LoginPage writes the session into IndexedDB then emits
 *     `surakkha:session-changed` (see mocks/session-bus.ts).
 *   - RequireSession listens for that event and re-reads getSession().
 *   - The <Routes> tree naturally re-renders; the catch-all redirects
 *     to landingFor(session.role) when no other route matches.
 *
 * Routes (FE-1.6a wires AppLayout):
 *   /                → <LoginPage />
 *   /login           → alias for /
 *   /styleguide      → <StyleguidePage /> (dev-only, outside the shell)
 *   <AppLayout>      → wraps every authenticated route:
 *     /dashboard     → <OperatorDashboard />    (utility_operator)
 *     /inbox         → <InboxList />            (utility_operator)
 *     /field/*       → <FieldQueuePage />       (field_technician)
 *     /submit        → <ComingSoonPage />       (anjali)
 *     /approve       → <ComingSoonPage />       (pha_approver)
 *     /audit         → <ComingSoonPage />       (pha_viewer)
 *     /vendor        → <ComingSoonPage />       (vendor)
 *   *                → <Navigate to="/" replace />
 */
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
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
import { AppLayout } from './components/layout/AppLayout';
import { useAppLayout } from './components/layout/AppLayoutContext';
import { landingFor } from './components/layout/nav-config';

/** Mounts body-level theme + locale hooks so dataset attrs are live. */
function AppShell({ children }: { children: ReactNode }) {
  useTheme();
  useLocale();
  useLocation();
  return <>{children}</>;
}
/** Placeholder route definitions for unbuilt persona landings. */
interface Placeholder { path: string; landing: string; description: string; }
const PLACEHOLDERS: Placeholder[] = [
  { path: '/submit', landing: '/submit', description: 'Anjali submits a citizen water-safety report (SMS / WhatsApp / voice / photo).' },
  { path: '/approve', landing: '/approve', description: 'PHA Approver dual-signs PublicNoticeIssued + PlaybookAmendmentApproved.' },
  { path: '/audit', landing: '/audit', description: 'Read-only audit chain explorer (PHA Viewer).' },
  { path: '/vendor', landing: '/vendor', description: 'Vendor sensor-fleet batch submission (SensorReadingSubmitted).' },
];

/**
 * Persona-aware gate. Reads the session, listens for cross-component
 * changes (login/logout), and renders children only when a session
 * exists. The <Outlet> children are the AppLayout's page routes.
 */
function RequireSession() {
  const [session, setSession] = useState<SessionRow | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    const row = await getSession();

    setSession(row ?? null);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => { void refresh(); };

    window.addEventListener(SESSION_CHANGED_EVENT, onChange);
    return () => { window.removeEventListener(SESSION_CHANGED_EVENT, onChange); };
  }, [refresh]);

  // First render — IndexedDB hasn't returned yet. Render nothing to
  // avoid flashing the login picker for an already-logged-in user.
  if (session === undefined) return null;
  if (!session) return <Navigate to="/" replace />;

  // Wrapping <Outlet /> in <AppLayout> here means every nested route
  // (/dashboard, /inbox, /field, …) renders inside the persistent
  // chrome. AppLayout owns session + chain freshness + logout; pages
  // consume via useAppLayout().
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
function RoutedSurface() {
  return (
    <Routes>
      {/* Login is always reachable. */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Dev-only styleguide stays outside the chrome (it's a primitive
          showcase, not a persona page). */}
      {import.meta.env.DEV && (
        <Route path="/styleguide" element={<StyleguidePage />} />
      )}

      {/* Authenticated shell — every nested route is wrapped in
          <AppLayout>. <Outlet /> is the page rendered for the matched
          child <Route>. */}
      <Route element={<RequireSession />}>
        <Route path="/dashboard" element={<OperatorDashboard />} />
        <Route path="/inbox" element={<InboxList />} />
        <Route path="/field" element={<FieldQueuePage />} />
        <Route path="/field/*" element={<FieldQueuePage />} />

        {/* Placeholder persona landings — ComingSoonPage reads session
            from useAppLayout() inside the shell. */}
        {PLACEHOLDERS.map((p) => (
          <Route
            key={p.path}
            path={p.path}
            element={
              <ComingSoonPage landing={p.landing} description={p.description} />
            }
          />
        ))}

        {/* Catch-all inside the shell: any unmatched authenticated
            route bounces the user to their persona's landing. */}
        <Route path="*" element={<RoleAwareRedirect />} />
      </Route>

      {/* Catch-all outside the shell: if no session, the user lands
          on the login picker. (RequireSession's <Navigate> already
          handles the authenticated case; this only fires for
          unauthenticated visits to /something-unknown.) */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
/**
 * Catch-all element for the authenticated shell. Reads the session
 * via context (it's inside <AppLayout>) and navigates to the persona's
 * landing route. Renders nothing while navigating.
 */
function RoleAwareRedirect() {
  const { session } = useAppLayout();

  return <Navigate to={landingFor(session.role)} replace />;
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
