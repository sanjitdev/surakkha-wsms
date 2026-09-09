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
    // As we add tests in B3/B4, raise the thresholds and uncomment
    // `thresholds` + `throwOnThresholdDrop: true` below.
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
