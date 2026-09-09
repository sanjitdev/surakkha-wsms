import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

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
    include: ['src/**/*.test.{ts,tsx}'],
    // B1.5 — coverage is reported but does NOT fail the run.
    // We don't enforce a threshold yet because the existing test surface
    // only covers ~12% of lines (src/__checks__/* + a handful of hooks).
    // B4 added a Playwright E2E suite which DOES exercise full routes
    // (login, persona nav, ErrorBoundary recovery, i18n bridge round-trip),
    // but @vitest/coverage-v8 only sees the Vitest run — Playwright specs
    // run in real Chromium and aren't picked up. Promote to a hard gate
    // in B5: either add Vitest route-level tests with MemoryRouter + mocked
    // idb, or wire @playwright/test's coverage collection. See ADR 0006.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/__checks__/**',
        'src/mocks/**',
        'src/types/**',
        'src/**/*.d.ts',
      ],
      // Soft gate — report only, do not fail.
      // To promote to a hard gate, uncomment and set:
      //   throwOnThresholdDrop: true,
      //   thresholds: { lines: 60, statements: 60, functions: 60, branches: 50 },
      // We currently sit at ~12% lines / 50% branches / 55% functions
      // because most of src/pages/* and src/components/* are uncovered.
    },
  },
});
