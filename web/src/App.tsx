/**
 * App.tsx — top-level shell.
 *
 * Phase 1 routing is intentionally minimal: a single LoginPage until the
 * post-login persona redirect lands on the right surface (Inbox, Submit,
 * Audit, etc.). When Story 1.1 wires its first real screen, this becomes
 * the routing root.
 *
 * No router library yet — pathname is enough for one screen. Add React
 * Router when a second screen needs to share chrome.
 *
 * Story 1.2 — adds the field-tech branch (Karim → FieldQueuePage).
 * Story 1.3 — adds the operator branch (Priya → OperatorDashboard).
 * Other roles still land on LoginPage until Story #49 (full router wiring)
 * brings up React Router and routes every persona's `landing` path.
 */
import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { FieldQueuePage } from './pages/FieldQueuePage';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { getSession, type SessionRow } from './mocks/idb';

export function App() {
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

  // Story 1.2 — field-tech branch.
  if (session?.role === 'field_technician') return <FieldQueuePage />;

  // Story 1.3 — operator branch. OperatorDashboard re-checks the session
  // role on mount and bounces non-operator sessions back to /.
  if (session?.role === 'utility_operator') return <OperatorDashboard />;

  return <LoginPage />;
}
