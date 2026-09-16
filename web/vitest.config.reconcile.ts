import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Reconciliation-only test config.
 *
 * Runs only the 13 fe-*-reconcile.test.tsx suites (one per work-order
 * WO-005 through WO-017). These grep over source files for lockdown
 * invariants (banned substrings like `red-600`, `bg-red`, Hindi letters
 * in en/, focus-ring bindings, helper-reuse assertions). They're
 * expensive (~10s) and noisy in the default `pnpm test` run, so the
 * default vitest.config.ts excludes them.
 *
 * Run on demand:
 *   pnpm test:reconcile
 *
 * Use cases: nightly CI, before a release tag, after a lockdown-token
 * rename, after pulling in a dependency upgrade that might re-introduce
 * raw colour literals.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/__checks__/setup.ts'],
    include: ['**/fe-*-reconcile.test.tsx'],
    reporters: ['default'],
  },
});
