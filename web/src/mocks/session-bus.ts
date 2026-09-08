/**
 * session-bus.ts — Cross-component session change signal.
 *
 * The login picker writes the session into IndexedDB (via session.ts),
 * but the `<RoutedSurface>` in App.tsx holds its `session` state in a
 * `useState` that's only populated at mount. Without a signal, a login
 * (or logout) wouldn't re-render the route tree — the user would stay
 * on the login screen even though the session row exists.
 *
 * The bus is a typed CustomEvent on `window`. Components that mutate
 * the session call `notifySessionChanged()`; `RoutedSurface` listens
 * via a `useEffect` and re-reads `getSession()`. Decoupled from any
 * single React tree; survives HMR.
 *
 * This is intentionally a tiny primitive — no event-target polyfill,
 * no observable library. Phase 2 may swap for a real store.
 */

export const SESSION_CHANGED_EVENT = 'surakkha:session-changed';

export function notifySessionChanged(): void {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
}