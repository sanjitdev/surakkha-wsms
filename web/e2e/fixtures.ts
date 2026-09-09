/**
 * Shared Playwright fixtures for the Surakkha E2E suite.
 *
 * One helper every spec can lean on:
 *
 *   - `loginAs(page, personaId)` — navigates to /, clicks the persona
 *     radio by `data-testid="persona-{id}"`, clicks Continue, and
 *     waits for the AppLayout chrome to mount (which only happens
 *     after the session row is written + the event fires +
 *     <RoutedSurface> re-renders). Use this for any spec that
 *     needs an authenticated context.
 *
 * State isolation
 * ---------------
 *   Playwright gives each test a fresh BrowserContext, which means
 *   cookies, localStorage, sessionStorage, AND IndexedDB are
 *   already isolated per spec. We deliberately do NOT wipe IndexedDB
 *   ourselves — doing so from inside the page (deleteDatabase)
 *   breaks any open handles MSW + idb-keyval are holding, and the
 *   next transaction throws "object store not found". The fresh
 *   BrowserContext is the isolation boundary; no extra cleanup
 *   needed.
 */
import { type Page, test as base, expect } from '@playwright/test';

// PersonaId is a closed tuple — every value is one of the 6 personas
// in mocks/session.ts. The runtime array is here for IDE autocomplete;
// the type alone is what the rest of the suite depends on.
type PersonaId = 'priya' | 'anjali' | 'pha_approver' | 'pha_viewer' | 'vendor' | 'karim';

async function loginAs(page: Page, personaId: PersonaId): Promise<void> {
  // Land on the picker. RequireSession's <Navigate> bounces any
  // already-authenticated user to their landing, but a fresh
  // BrowserContext has no session row, so / always lands here.
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId(`persona-${personaId}`)).toBeVisible({ timeout: 15_000 });
  await page.getByTestId(`persona-${personaId}`).click();
  // Continue button has no testid; it's the only primary button
  // in the picker-actions row. The "Signing in…" disabled state
  // races the navigation; we wait for AppLayout to mount instead.
  await page.getByRole('button', { name: /Continue|Signing in/i }).click();
  // AppLayout mounts → sidebar + topchrome visible. This proves the
  // session round-trip completed (loginAs() wrote the row, the
  // event fired, RoutedSurface re-rendered, RequireSession let us
  // through, AppLayout read the session).
  await expect(page.getByTestId('app-layout')).toBeVisible({ timeout: 15_000 });
}
export const test = base.extend<{
  loginAs: (personaId: PersonaId) => Promise<void>;
}>({
  loginAs: async ({ page }, use) => {
    await use(async (personaId: PersonaId) => {
      await loginAs(page, personaId);
    });
  },
});
export { expect };
export type { PersonaId };
