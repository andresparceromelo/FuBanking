import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/unit/setup.ts'],
    include: ['src/tests/unit/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      reportOnFailure: true,
      include: [
        'src/features/loans/**/*.{ts,tsx}',
        'src/features/admin/**/*.{ts,tsx}',
        'src/features/cards/**/*.{ts,tsx}',
        'src/features/auth/**/*.{ts,tsx}',
        'src/features/profile/**/*.{ts,tsx}',
        'src/features/pockets/**/*.{ts,tsx}',
        'src/shared/utils/*.{ts,tsx}',
        'src/shared/components/ui/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.types.ts',
        'src/features/loans/types/**',
        'src/features/admin/types/**',
        'src/features/cards/types/**',
        'src/features/auth/types/**',
        'src/features/profile/types/**',
        'src/features/pockets/types/**',
      ],
    },
  },
});
