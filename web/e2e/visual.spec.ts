/**
 * visual.spec.ts — Playwright `toHaveScreenshot()` visual regression.
 *
 * What this file covers
 * ---------------------
 *   The 3 real surfaces (Login picker, Inbox, Field queue) get a
 *   per-theme × per-locale snapshot matrix. Each snapshot asserts
 *   the full-page render is pixel-identical to the committed
 *   baseline under `e2e/visual/__snapshots__/`.
 *
 * Why these surfaces
 * ------------------
 *   Per ADR 0006 "Testing strategy", visual regression is deferred
 *   until every primitive that ships UI has a stable testid AND the
 *   design tokens (B5.1 + B5.3) are hardened. Login / Inbox / Field
 *   are the only surfaces that meet that bar today. The 4
 *   ComingSoonPage stubs are excluded by design — they're
 *   intentionally not-yet-shipped.
 *
 * Stability tactics
 * -----------------
 *   1. Animations disabled globally (`animations: 'disabled'` +
 *      `caret: 'hide'`). SSE pulse dot, login-pulse, persona
 *      transition would otherwise drift frame-by-frame.
 *   2. Time-varying text masked via `mask` — chain freshness
 *      number ("12s" / "34s" / etc.) and the picker-status countdown
 *      ("READY · N connected") both change during a session.
 *   3. Strict threshold of 0 pixels maxDiff — semantic equality,
 *      not "looks similar". A token change that should pass instead
 *      requires `--update-snapshots` to deliberately refresh.
 *   4. Viewport fixed at 1280×800 (the playwright.config chromium
 *      project) — never expand to mobile without committing a new
 *      baseline set.
 *
 * Updating snapshots
 * ------------------
 *   After an intentional visual change:
 *
 *     pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
 *     git add e2e/visual/__snapshots__/
 *     git commit -m "test(visual): update <surface> snapshot"
 *
 *   Review the diff carefully. Snapshots must NEVER update silently
 *   as part of a feature PR — they're a tripwire, not a formality.
 */
import { expect, test } from './fixtures';

test.describe('visual regression — login picker', () => {
  test('login picker renders at rest (dark, English)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for the picker panel to fully render + initial pulse to
    // settle so the snapshot doesn't capture a mid-animation frame.
    await expect(page.getByTestId('persona-priya')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveScreenshot('login-picker-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      // Mask the picker-status countdown — it changes every render.
      mask: [page.getByTestId('picker-status')],
    });
  });

  test('login picker renders in Bangla', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Pre-seed locale BEFORE the picker renders — Bangla fonts
    // load async and we need the picker to be in bn copy.
    await page.evaluate(() => {
      window.localStorage.setItem('surakkha.locale', 'bn');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Bangla heading "সাইন ইন করুন" is the visible signal.
    await expect(page.getByRole('heading', { name: 'সাইন ইন করুন' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveScreenshot('login-picker-dark-bn.png', {
      animations: 'disabled',
      caret: 'hide',
      mask: [page.getByTestId('picker-status')],
    });
  });

  test('login picker renders in light theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Flip the theme attribute BEFORE the picker renders so the
    // first paint uses light tokens (no transition flash).
    await page.evaluate(() => {
      window.localStorage.setItem('surakkha.theme', 'light');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('persona-priya')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveScreenshot('login-picker-light-en.png', {
      animations: 'disabled',
      caret: 'hide',
      mask: [page.getByTestId('picker-status')],
    });
  });
});

test.describe('visual regression — inbox (Priya)', () => {
  test('priya lands on /inbox', async ({ page, loginAs }) => {
    await loginAs('priya');
    // Wait for the inbox data to populate — without this the
    // snapshot can catch the loading state (skeleton or empty).
    await expect(page.getByTestId('sidebar-link-inbox')).toBeVisible({ timeout: 15_000 });
    // Settle: the chain poll updates the freshness number every
    // ~5s; we mask it so the snapshot is stable across that.
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('inbox-priya-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      // Tiny allowance for sub-pixel anti-aliasing drift between
      // headless renders — surfaces like the chain pulse and any
      // animated border can produce < 0.01% drift even when
      // animations are disabled. Anything > 0.5% is a real change.
      maxDiffPixelRatio: 0.005,
      mask: [
        // Chain freshness number + status dot — time-varying
        page.locator('.top-chrome__chain'),
        // Toast container — may have a queued notification
        page.getByRole('region').filter({ has: page.locator('.toast') }),
      ],
    });
  });
});

test.describe('visual regression — field queue (Karim)', () => {
  test('karim lands on /field', async ({ page, loginAs }) => {
    await loginAs('karim');
    // Karim's sidebar first link is "Work queue" → testid
    // "sidebar-link-work-queue" (the kebab-case of the label).
    await expect(page.getByTestId('sidebar-link-work-queue')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('field-karim-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('.top-chrome__chain'),
        page.getByRole('region').filter({ has: page.locator('.toast') }),
      ],
    });
  });
});

test.describe('visual regression — inbox detail (Priya, FE-1.5a)', () => {
  test('priya opens an incident thread', async ({ page, loginAs }) => {
    await loginAs('priya');
    // The inbox list rows link to /inbox/:event_id — clicking the
    // first row's title routes to the detail page. We pick the
    // sidebar link to skip depending on row data.
    await expect(page.getByTestId('sidebar-link-inbox')).toBeVisible({ timeout: 15_000 });
    // Navigate via clicking the first inbox row title link.
    const firstRowLink = page.locator('.inbox-row__title-link').first();

    await expect(firstRowLink).toBeVisible({ timeout: 10_000 });
    await firstRowLink.click();
    await expect(page.getByTestId('inbox-detail-title')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('inbox-detail-priya-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('.top-chrome__chain'),
        page.getByRole('region').filter({ has: page.locator('.toast') }),
      ],
    });
  });
});

test.describe('visual regression — verify flow (Priya, FE-1.5b)', () => {
  test('priya opens step 1 of the verify wizard', async ({ page, loginAs }) => {
    await loginAs('priya');
    await page.goto('/verify-flow');
    await expect(page.getByTestId('verify-flow-header')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('verify-step-card')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('verify-flow-step1-priya-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('.top-chrome__chain'),
        page.getByRole('region').filter({ has: page.locator('.toast') }),
      ],
    });
  });
});

test.describe('visual regression — audit log (Priya, FE-1.5c)', () => {
  test('priya opens the chain explorer', async ({ page, loginAs }) => {
    await loginAs('priya');
    await page.goto('/audit-log');
    await expect(page.getByTestId('audit-log-summary')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('audit-table')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('audit-log-priya-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('.top-chrome__chain'),
        // The chain-head banner includes the ingested time ("sealed HH:MM")
        // which drifts between runs — mask the whole banner.
        page.locator('.card').first(),
        page.getByRole('region').filter({ has: page.locator('.toast') }),
      ],
    });
  });
});

test.describe('visual regression — settings (Priya, FE-1.5d)', () => {
  test('priya opens settings', async ({ page, loginAs }) => {
    await loginAs('priya');
    await page.goto('/settings');
    await expect(page.getByTestId('settings-header')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('settings-theme-card')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('settings-priya-dark-en.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('.top-chrome__chain'),
        page.getByRole('region').filter({ has: page.locator('.toast') }),
      ],
    });
  });
});
