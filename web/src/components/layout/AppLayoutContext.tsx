/**
 * AppLayoutContext.tsx
 *
 * Read-only context exposed by <AppLayout> to every page rendered inside
 * the authenticated shell. Pages call `useAppLayout()` instead of
 * fetching their own session/chain-freshness.
 *
 * Why a context (not props): AppLayout wraps arbitrary child routes via
 * a react-router layout route. The `<Outlet>` is the page; passing
 * `session` and `chainFreshSeconds` through route props would force
 * every page to declare them. Context keeps pages focused on their own
 * data while AppLayout owns the cross-cutting concerns.
 *
 * Contract: `useAppLayout()` throws if called outside <AppLayout>. This
 * is intentional — pages that try to consume these values without the
 * shell are misuse (they should not be rendering as top-level routes).
 */
import { createContext, useContext } from 'react';
import type { SessionRow } from '../../mocks/idb';

export interface AppLayoutContextValue {
  session: SessionRow;
  /** Seconds since last block ingest. `null` while the first poll is in flight. */
  chainFreshSeconds: number | null;
  /** Hook called from the sidebar logout button. Clears session and
   *  navigates to `/` without a full-page reload. */
  logout: () => Promise<void>;
}
export const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);
export function useAppLayout(): AppLayoutContextValue {
  const v = useContext(AppLayoutContext);

  if (!v) {
    throw new Error(
      'useAppLayout must be used inside <AppLayout>. Pages rendered outside the authenticated shell cannot consume session/chainFreshSeconds.',
    );
  }
  return v;
}
