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
import { getSession, setSession, clearSession, type SessionRow } from './idb';

export interface Persona {
  id: string;
  display_name: string;
  role: SessionRow['role'];     // dim 7 §2.5 closed enum
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
  };
  await setSession(row);
  return row;
}

/** Read current session, or null if not logged in. */
export async function currentSession(): Promise<SessionRow | null> {
  const row = await getSession();
  return row ?? null;
}

export async function logout(): Promise<void> {
  await clearSession();
}
