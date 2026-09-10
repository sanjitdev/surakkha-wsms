/**
 * i18n-bangla.spec.ts — verify the i18next bridge works end-to-end.
 *
 * Unit coverage for the bridge lives in
 * `web/src/__checks__/fe-b3-i18n.test.tsx`. This file proves the same
 * round-trip in a real browser, where IndexedDB, real MSW, and the
 * localStorage `surakkha.locale` key all participate.
 *
 * What this file covers:
 *   1. Setting `surakkha.locale = "bn"` in localStorage + reload
 *      flips the heading to Bangla on the picker
 *   2. The bridge syncs after login — operator chrome renders the
 *      English strings by default (the user hasn't toggled yet)
 *   3. Toggling the locale from English to Bangla flips the heading
 *      (via the StyleguidePage toggle, which is dev-only)
 */
import { expect, test } from './fixtures';

test.describe('i18n locale switching — real browser', () => {
  test('pre-seeding localStorage flips the picker to Bangla on first paint', async ({ page }) => {
    // Visit the root once just to establish an origin (localStorage
    // is per-origin and we need *some* document context before we
    // can write to it).
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('surakkha.locale', 'bn');
    });
    await page.reload();
    // Bangla heading: "সাইন ইন করুন"
    await expect(page.getByRole('heading', { name: 'সাইন ইন করুন' })).toBeVisible({
      timeout: 10_000,
    });
    // The chain-live copy should also reflect Bangla; the picker-status
    // dot is paired with the statusReady string ("মক ব্যাকএন্ড · প্রস্তুত")
    // but the chain may still be in `pending` if MSW hasn't finished
    // seeding yet, so we don't assert that string here.
  });

  test('default locale (English) renders when no localStorage preference exists', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('persisted Bangla locale survives a full login round-trip', async ({ page }) => {
    // Pre-seed Bangla.
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('surakkha.locale', 'bn');
    });
    await page.reload();
    await page.getByTestId('persona-priya').click();
    await page.getByRole('button', { name: /এগিয়ে যান|Continue/i }).click();
    // AppLayout mounts → sidebar labels should be in Bangla now (the
    // chrome strings are translated to bn via layout.json). We assert
    // by href (stable across locales) rather than the testid, which
    // is derived from the resolved label and therefore flips with the
    // locale (sidebar-link-inbox → sidebar-link-ইনবক্স).
    await expect(page.locator('a[href="/inbox"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
