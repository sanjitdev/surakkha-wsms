/**
 * AppLayout.tsx
 *
 * The persistent shell for every authenticated route. Wraps its
 * children (a react-router <Outlet>) in:
 *
 *   <div className="app-shell">
 *     <Sidebar  navItems={navForRole} brandHref={landingFor(role)} brand="SURAKKHA" footer={<LogoutButton />} />
 *     <div className="main">
 *       <TopChrome personaLabel={chip} chainFreshSeconds={chainFreshSeconds} />
 *       {children}
 *     </div>
 *   </div>
 *
 * Responsibilities (the cross-cutting concerns every page used to
 * re-implement itself):
 *
 *   1. Read the session once and expose it via context. Pages call
 *      `useAppLayout().session` instead of `getSession()`.
 *
 *   2. Poll /api/chain/head every 5s and expose the freshness in
 *      seconds via context. Pre-Story-FE-1.6a, OperatorDashboard and
 *      InboxList each polled independently — on /inbox you saw two
 *      requests every 5s. AppLayout owns the single poll.
 *
 *   3. Resolve nav items for the persona via NAV_BY_ROLE. Pages
 *      no longer declare NAV arrays.
 *
 *   4. Render the logout button in .sidebar__foot. Pages no longer
 *      define inline `async function logout()` helpers.
 *
 *   5. Compute the persona chip label (`chip_label ?? display_name`)
 *      so Karim's "Karim · field tech · NE zone" survives the move
 *      from FieldQueuePage's inline top-chrome into the shared shell.
 *
 * Layout route vs Outlet:
 *   AppLayout is rendered as a react-router layout route (no `path`,
 *   no `element` page of its own — children mount via <Outlet>). Pages
 *   inside consume the context.
 */
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopChrome } from './TopChrome';
import { Sidebar } from './Sidebar';
import { AppLayoutContext } from './AppLayoutContext';
import { NAV_BY_ROLE, landingFor } from './nav-config';
import { type SessionRow, getSession } from '../../mocks/idb';
import { logoutAndRedirect } from '../../mocks/session';
import { LogoutIcon } from '../icons/sidebar-icons';

interface ChainHead {
  block_hash: string;
  height: number;
  ingested_at: string;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // (1) session — read once on mount. Pages don't fetch it.
  const [session, setSession] = useState<SessionRow | null>(null);

  useEffect(() => {
    void (async () => {
      const row = await getSession();

      setSession(row ?? null);
    })();
  }, []);

  // (2) chain freshness — single 5s polling loop for the whole shell.
  // null while the first poll is in flight; number after.
  const [chainFresh, setChainFresh] = useState<number | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch('/api/chain/head');

        if (!r.ok) return;
        const head = (await r.json()) as ChainHead;
        const t = new Date(head.ingested_at).getTime();

        if (Number.isNaN(t)) return;
        setChainFresh(Math.max(0, Math.round((Date.now() - t) / 100) / 10));
      } catch {
        // Swallow — the chrome dot stays at the last-known value rather
        // than flickering on every transient network blip.
      }
    };

    void tick();
    const id = window.setInterval(() => { void tick(); }, 5000);

    return () => { window.clearInterval(id); };
  }, []);

  // (3) logout — single source of truth from mocks/session.ts.
  // Wraps logoutAndRedirect so consumers don't need to know about
  // navigate() being injected.
  const logout = useCallback(async () => {
    await logoutAndRedirect(navigate);
  }, [navigate]);

  // Session still loading — render nothing rather than a flash of
  // unstyled chrome. (Should be <100ms in practice; IndexedDB is fast.)
  if (!session) return null;

  const navItems = NAV_BY_ROLE[session.role] ?? [];
  const chipLabel = session.chip_label ?? session.display_name;

  return (
    <AppLayoutContext.Provider value={{ session, chainFreshSeconds: chainFresh, logout }}>
      <div className="app-shell">
        <Sidebar
          navItems={[...navItems]}
          currentPath={window.location.pathname}
          brand="SURAKKHA"
          brandHref={landingFor(session.role)}
          footer={
            <button
              type="button"
              className="sidebar__logout"
              onClick={() => { void logout(); }}
              data-testid="sidebar-logout"
            >
              <span className="sidebar__icon" aria-hidden="true"><LogoutIcon /></span>
              <span>Logout</span>
            </button>
          }
        />
        <div className="main">
          <TopChrome personaLabel={chipLabel} chainFreshSeconds={chainFresh ?? undefined} />
          {children}
        </div>
      </div>
    </AppLayoutContext.Provider>
  );
}
