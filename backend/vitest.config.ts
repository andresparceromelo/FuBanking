import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'src/tests/unit/**/*.test.ts',
      'src/tests/auth/**/*.test.ts',
      'src/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'html', 'text'],
      include: [
        'src/domain/entities/LoanApplication.ts',
        'src/application/use-cases/loan/*.ts',
        'src/application/use-cases/auth/LoginUser.ts',
        'src/application/use-cases/auth/RegisterUser.ts',
        'src/application/use-cases/auth/GenerateTwoFactorCode.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
});
