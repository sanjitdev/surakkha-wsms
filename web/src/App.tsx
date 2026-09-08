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
 */
import { LoginPage } from './pages/LoginPage';

export function App() {
  return <LoginPage />;
}
