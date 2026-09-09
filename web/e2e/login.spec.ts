/**
 * login.spec.ts — login round-trip.
 *
 * The login picker is the gating step for every authenticated
 * surface. Every bug here means the whole app is unreachable, so
 * these specs are the most important in the E2E suite.
 *
 * What this file covers:
 *   1. Picker renders 6 personas on a cold visit
 *   2. Priya lands on /inbox (the operator landing per nav-config)
 *   3. Karim lands on /field (the field-tech landing)
 *   4. Logout clears the session and bounces back to /
 *   5. A malformed session row in IndexedDB does NOT crash the
 *      app — it falls back to the picker
 *   6. Direct navigation to an authenticated route without a
 *      session redirects to /
 */
import { expect, test } from './fixtures';

test.describe('login round-trip', () => {
  test('picker renders 6 personas on a cold visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    // 6 personas = 6 radios. Sorted by PERSONAS order in mocks/session.ts.
    for (const id of ['priya', 'anjali', 'pha_approver', 'pha_viewer', 'vendor', 'karim']) {
      await expect(page.getByTestId(`persona-${id}`)).toBeVisible();
    }
  });

  test('Priya logs in and lands on /inbox', async ({ page, loginAs }) => {
    await loginAs('priya');
    await expect(page).toHaveURL(/\/inbox/);
    // Operator sidebar = 8 items per NAV_BY_ROLE in nav-config.
    await expect(page.getByTestId('sidebar-link-dashboard')).toBeVisible();
    await expect(page.getByTestId('sidebar-link-inbox')).toBeVisible();
    await expect(page.getByTestId('sidebar-link-settings')).toBeVisible();
    // Persona chip should reflect Priya's display_name.
    await expect(page.getByTestId('persona-chip')).toContainText(/Priya/);
  });

  test('Karim logs in and lands on /field with field-tech nav', async ({ page, loginAs }) => {
    await loginAs('karim');
    await expect(page).toHaveURL(/\/field/);
    // Field-tech sidebar = 4 items per NAV_BY_ROLE.
    await expect(page.getByTestId('sidebar-link-work-queue')).toBeVisible();
    await expect(page.getByTestId('sidebar-link-my-day')).toBeVisible();
    await expect(page.getByTestId('sidebar-link-incident-detail')).toBeVisible();
    await expect(page.getByTestId('sidebar-link-history')).toBeVisible();
    // Operator-only nav items must NOT be present for Karim.
    await expect(page.getByTestId('sidebar-link-inbox')).toHaveCount(0);
    // Persona chip uses Karim's chip_label ("Karim · field tech · NE zone").
    await expect(page.getByTestId('persona-chip')).toContainText('Karim · field tech · NE zone');
  });

  test('logout clears the session and bounces to /', async ({ page, loginAs }) => {
    await loginAs('priya');
    await expect(page.getByTestId('sidebar-logout')).toBeVisible();
    await page.getByTestId('sidebar-logout').click();
    // The logout handler runs ~200-400ms (MSW delay) + IndexedDB write +
    // session-bus dispatch + RequireSession re-render → <Navigate to="/">.
    // 10s timeout is generous; in practice <2s.
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });
  });

  test('malformed session row falls back to the picker without crashing', async ({ page }) => {
    // Pre-write a malformed blob directly into the surakkha-mock DB
    // (the DB name known to mocks/idb.ts) so getSession() returns
    // a bogus row on next mount. The session reader should treat
    // invalid rows as "not logged in" and the user lands on /.
    //
    // Why not indexedDB.databases()? Chromium gates that API behind
    // a permission prompt in some contexts (it threw SecurityError
    // during the first attempt at this spec) — better to write to
    // the known DB name directly.
    await page.goto('/');
    // Force the DB to be created at v1+ by hitting any page that
    // triggers the boot. Then we open the same DB from page context
    // and overwrite the 'current' key in the 'session' store with
    // a garbage value.
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const open = indexedDB.open('surakkha-mock');

        open.onsuccess = () => {
          const db = open.result;

          if (!db.objectStoreNames.contains('session')) {
            db.close();
            resolve();
            return;
          }
          try {
            const tx = db.transaction('session', 'readwrite');
            const os = tx.objectStore('session');

            os.put({ not: 'a real session row' }, 'current');
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              resolve();
            };
          } catch {
            db.close();
            resolve();
          }
        };
        open.onerror = () => {
          resolve();
        };
        open.onblocked = () => {
          resolve();
        };
      });
    });

    await page.reload();
    // The picker should render. If getSession() threw and we weren't
    // resilient, we'd see a blank screen or ErrorBoundary.
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated visit to /inbox redirects to /', async ({ page }) => {
    await page.goto('/inbox');
    // RequireSession's <Navigate to="/" replace> fires immediately
    // when no session row exists in IndexedDB.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
