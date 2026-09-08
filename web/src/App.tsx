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
 * Story 1.2 — adds one role-aware branch: `session.role === 'field_technician'`
 * routes to FieldQueuePage. All other roles still land on LoginPage until
 * Story #49 (full router wiring) lands.
 */
import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { FieldQueuePage } from './pages/FieldQueuePage';
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

  // Story 1.2 — field-tech branch. FieldQueuePage itself re-checks the
  // session role on mount and bounces non-Karim sessions back to /, so
  // this branch is the only entry point for the technician persona in
  // Phase 1. Other 5 personas still land on LoginPage (Story #49's job).
  if (session?.role === 'field_technician') return <FieldQueuePage />;

  return <LoginPage />;
}
