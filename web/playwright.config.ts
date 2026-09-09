/**
 * Playwright config for Surakkha end-to-end tests.
 *
 * What this config does
 * ---------------------
 *   - Targets Chromium only for Phase 1. Firefox + WebKit deferred —
 *     we have no Safari/Firefox-specific CSS to validate today, and
 *     adding two more projects doubles the browser-install budget
 *     on CI. Re-open if a Safari bug bites in production.
 *   - Boots `vite dev` with `VITE_USE_MOCKS=true` so the MSW service
 *     worker at /mockServiceWorker.js intercepts every /api/* call
 *     and the IndexedDB chain fixtures seed on first load. The test
 *     app behaves exactly like the local demo.
 *   - Persists trace + screenshot + video on failure so flaky specs
 *     can be debugged from the Playwright HTML report artifact
 *     uploaded by .github/workflows/e2e.yml.
 *
 * Why a separate workflow (not a job in ci.yml)
 * ---------------------------------------------
 *   Playwright is slow (~30s for the suite, plus ~60-90s for the
 *   Chromium download on a cold runner). The existing `CI` workflow
 *   is the fast feedback loop for typecheck/lint/test/build — adding
 *   Playwright there would inflate the "green check on a typo fix"
 *   time from ~90s to ~3min. The `E2E` workflow runs in parallel
 *   and is allowed to fail independently.
 *
 * MSW timing caveat
 * -----------------
 *   The service worker registration in `main.tsx` is async. The
 *   first page load may render before MSW is intercepting fetch.
 *   Specs always wait for a stable testid (e.g. `persona-priya`)
 *   which only renders after React has mounted, by which point MSW
 *   is ready. We don't `await page.waitForLoadState('networkidle')`
 *   — the MSW SW keeps an open connection to /api/chain/head.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      VITE_USE_MOCKS: 'true',
    },
  },
});
