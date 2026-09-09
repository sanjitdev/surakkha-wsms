/**
 * session.ts
 *
 * Phase 1 login picker — lets the demo switch among the 6 personas needed
 * to exercise every template (dim 5 §18 role → template mapping):
 *
 *   Priya           → /inbox, /verify, /dashboard   (utility_operator + utility_message_desk)
 *   Anjali          → /submit                       (citizen-reporter; SMS/WhatsApp channel adapter)
 *   PHA Approver    → /approve                      (pha_approver)
 *   PHA Viewer      → /audit (read-only)            (pha_viewer)
 *   Vendor          → /vendor                       (vendor — sensor fleet)
 *   Karim           → /field                        (field_technician — utility field staff, dispatched)
 *
 * Each persona is a row in PERSONAS. `loginAs(persona)` mints a SessionRow
 * with a fresh ULID for actor_ref and a stable (per-persona) bearer token.
 * The token is checked by the MSW handlers via the `Authorization: Bearer …`
 * header per dim 7 §14 (auth + access-logged events).
 *
 * "Logout" = clearSession() + invalidate any cached fetch state.
 *
 * Note: persona strings are display labels only; the wire-level role follows
 * the closed 9-entry enum from AD-12 (vendor/pha_approver/utility_operator/
 * utility_message_desk/field_technician/anjali/priya/pha_viewer/system). The
 * mapping below is kept consistent with that enum.
 */

import { ulid } from './canonical';
import { type SessionRow, clearSession, getSession, setSession } from './idb';
import { notifySessionChanged } from './session-bus';

export interface Persona {
  id: string;
  display_name: string;
  role: SessionRow['role']; // dim 7 §2.5 closed enum
  /** Default landing route after login — dim 5 grid stack. */
  landing: string;
  /** Visual treatment on the picker. Pure CSS; not on the wire. */
  hint: string;
  /** Short label rendered in the top-chrome persona chip. Optional — falls back to `display_name`. */
  chip_label?: string;
}
/**
 * 5 personas — minimum needed to drive every dim 5 template.
 * Role values are EXACTLY the dim 7 §2.5 enum strings. Do not invent.
 */
export const PERSONAS: Persona[] = [
  {
    id: 'priya',
    display_name: 'Priya — Utility Operator',
    role: 'utility_operator',
    landing: '/inbox',
    hint: 'Verifies incidents, runs playbooks, sees Priya desktop.',
  },
  {
    id: 'anjali',
    display_name: 'Anjali — Citizen Reporter',
    role: 'anjali',
    landing: '/submit',
    hint: 'Submits reports via SMS/WhatsApp. Phase 1 mocks the submit UI.',
  },
  {
    id: 'pha_approver',
    display_name: 'PHA Approver (Dr. Karim)',
    role: 'pha_approver',
    landing: '/approve',
    hint: 'Dual-signs PublicNoticeIssued + PlaybookAmendmentApproved.',
  },
  {
    id: 'pha_viewer',
    display_name: 'PHA Viewer (audit only)',
    role: 'pha_viewer',
    landing: '/audit',
    hint: 'Read-only audit chain access; no write perm.',
  },
  {
    id: 'vendor',
    display_name: 'Vendor — Sensor Fleet',
    role: 'vendor',
    landing: '/vendor',
    hint: 'Submits SensorReadingSubmitted batches (sensor-side wire).',
  },
  {
    id: 'karim',
    display_name: 'Karim — Field Technician',
    role: 'field_technician',
    landing: '/field',
    hint: 'Picks up dispatched work orders; files diagnosis + fix on chain.',
    chip_label: 'Karim · field tech · NE zone',
  },
];
/** Bearer token style — opaque to mock; production mints server-side. */
function mintToken(personaId: string): string {
  return `mock.${personaId}.${ulid()}`;
}
/** Log in as a persona. Idempotent — re-calling refreshes the token. */
export async function loginAs(personaId: string): Promise<SessionRow> {
  const persona = PERSONAS.find((p) => p.id === personaId);

  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const row: SessionRow = {
    actor_id: persona.id,
    actor_ref: ulid(),
    display_name: persona.display_name,
    role: persona.role,
    token: mintToken(persona.id),
    logged_in_at: new Date().toISOString(),
    tenant_id: 'dhaka',
    // Optional persona chip — set on personas whose top-chrome label
    // differs from their raw display_name (Story 1.2 — Karim).
    // AppLayout falls back to display_name when unset.
    chip_label: persona.chip_label,
  };

  await setSession(row);
  return row;
}
/** Read current session, or null if not logged in. */
export async function currentSession(): Promise<SessionRow | null> {
  const row = await getSession();

  return row ?? null;
}
/**
 * Log out the current persona. Single source of truth — every persona
 * page (and the AppLayout footer button) calls this.
 *
 * Sequence:
 *   1. POST /api/auth/logout — emits the OperatorAccessLogged event
 *      on the chain and (in production) revokes the bearer token.
 *      Failure is non-fatal (we still clear locally).
 *   2. clearSession() — wipes the IndexedDB row.
 *   3. notifySessionChanged() — wakes up RoutedSurface so the route
 *      tree re-renders to / without a full-page reload.
 *
 * Why this matters: previously OperatorDashboard and FieldQueuePage
 * each defined their own inline logout() that used
 * `window.location.href = '/'` — the original login-flash bug we
 * already patched at commit abd7972. Consolidating removes the
 * chance to regress.
 */
export async function logout(): Promise<void> {
  await clearSession();
  // Wake up the route tree so it re-renders to / without a full-page
  // reload. session-bus is imported statically above (was a dynamic
  // import to dodge a circular dep, but the graph settled).
  notifySessionChanged();
}
/**
 * Convenience wrapper for the AppLayout logout button: fire the logout
 * endpoint (which in the mock also clears the IndexedDB session row +
 * emits the session-bus event), then navigate to the login picker.
 *
 * We call fetch FIRST so the MSW handler at POST /api/auth/logout
 * runs `logout()` — which is the canonical "clear session" path. The
 * previous implementation inlined `fetch` inside `logout()` itself,
 * which caused an infinite recursion (logout → fetch → MSW handler →
 * logout → fetch → …) when the handler delegated back into session.ts.
 *
 * Caller passes the react-router `useNavigate()` result.
 */
export async function logoutAndRedirect(
  navigate: (to: string, opts?: { replace?: boolean }) => void,
): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    // Production: the gateway would revoke the bearer token server-side.
    // In the mock, this only matters if the SW didn't intercept — but
    // even then the local clear below still gets us to /.
    console.error('[surakkha] /api/auth/logout POST failed (continuing local clear)', err);
  }
  navigate('/', { replace: true });
}
