/**
 * visual-breakpoints.spec.ts — Playwright visual regression at 3 widths.
 *
 * The base visual.spec.ts only asserts at 1280×800 (the playwright
 * project's default viewport). That misses the bugs the team has
 * actually been chasing in the design log — sidebar width, persona
 * chip clipping, KPI grid collapse, chain-table overflow.
 *
 * This spec covers the 4 highest-traffic surfaces at 3 breakpoints:
 *
 *   - 1280×800  — the smallest "design" viewport. Catches sidebar
 *                  crowding, persona-chip clipping, and grid overflow
 *                  when chain tables go past their grid-allocated width.
 *   - 1440×900  — the most common dev-monitor viewport. Catches the
 *                  persona-chip end-clipping at 1440px that the
 *                  .top-chrome__persona { flex-shrink: 0 } rule was
 *                  added for.
 *   - 1920×1080 — the board-room viewport. Catches the .sidebar width
 *                  tier (256 / 280 / 304 at 1280 / 1440 / 1920) and
 *                  any layout that hard-codes a single column count.
 *
 * Each (surface, breakpoint) pair gets its own screenshot under
 * e2e/visual-breakpoints.spec.ts-snapshots/. Names follow:
 *
 *   <surface>-<persona>-w<width>.png
 *
 * Updating baselines:
 *
 *   pnpm exec playwright test e2e/visual-breakpoints.spec.ts \
 *     --update-snapshots
 *
 * Use a fresh check-out per update — never bundle a snapshot refresh
 * with a feature PR. The diff is the artefact; a clean tree makes the
 * reviewer able to spot accidental changes.
 */
import { expect, test } from './fixtures';

const BREAKPOINTS = [
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
] as const;

for (const bp of BREAKPOINTS) {
  test.describe(`visual breakpoints — login picker @ ${bp.name}`, () => {
    test(`renders at rest (dark, English, ${bp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('persona-priya')).toBeVisible({ timeout: 15_000 });
      // The login picker has a JS-timer-driven pulse on the persona
      // radios that survives the CSS `animations: 'disabled'` flag.
      // 0.02 ratio (was default 0.01) absorbs sub-pixel pulse drift
      // without catching real visual regressions.
      await expect(page).toHaveScreenshot(`login-picker-w${bp.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.02,
        // picker-status deliberately NOT masked — the 2026-09-16 redesign
        // turned it into a proper bordered pill (dot + uppercase label) so
        // regressions to its shape/border/background are worth catching.
      });
    });
  });

  test.describe(`visual breakpoints — inbox (Priya) @ ${bp.name}`, () => {
    test(`priya lands on /inbox @ ${bp.name}`, async ({ page, loginAs }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await loginAs('priya');
      await expect(page.getByTestId('sidebar-link-inbox')).toBeVisible({
        timeout: 15_000,
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`inbox-priya-w${bp.name}.png`, {
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

  test.describe(`visual breakpoints — operator dashboard (Priya) @ ${bp.name}`, () => {
    test(`priya lands on /dashboard @ ${bp.name}`, async ({ page, loginAs }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await loginAs('priya');
      // Priya's default landing is /inbox — navigate to /dashboard.
      await page.goto('/dashboard');
      await expect(page.getByTestId('sidebar-link-dashboard')).toBeVisible({
        timeout: 15_000,
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`operator-dashboard-priya-w${bp.name}.png`, {
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

  test.describe(`visual breakpoints — field queue (Karim) @ ${bp.name}`, () => {
    test(`karim lands on /field @ ${bp.name}`, async ({ page, loginAs }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await loginAs('karim');
      await expect(page.getByTestId('sidebar-link-work-queue')).toBeVisible({
        timeout: 15_000,
      });
      // Karim's persona uses app-shell--tech which narrows the
      // sidebar to 200px — the breakpoint spec specifically catches
      // whether that variant persists at wider viewports.
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`field-karim-w${bp.name}.png`, {
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
}
