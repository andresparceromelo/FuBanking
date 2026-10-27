import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@e2e': path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    root: __dirname,
    envDir: __dirname,
    envPrefix: ['VITE_', 'E2E_'],
    environment: 'node',
    setupFiles: ['./setup.ts'],
    include: ['tests/**/*.e2e.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    coverage: {
      enabled: false,
    },
  },
});
