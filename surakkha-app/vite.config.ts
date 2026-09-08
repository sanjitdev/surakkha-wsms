import { defineConfig } from 'vite';
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
  server: {
    port: 5173,
    strictPort: false,
  },
});
