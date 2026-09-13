import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      reportOnFailure: true,
      include: [
        'src/domain/entities/LoanApplication.ts',
        'src/domain/entities/VirtualCard.ts',
        'src/application/use-cases/loan/*.ts',
        'src/application/use-cases/card/*.ts',
        'src/presentation/controllers/LoanController.ts',
        'src/presentation/controllers/CardController.ts',
        'src/presentation/validators/loan.validators.ts',
        'src/presentation/middlewares/adminMiddleware.ts',
        'src/infrastructure/repositories/SupabaseLoanApplicationRepository.ts',
        'src/infrastructure/repositories/SupabaseVirtualCardRepository.ts',
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
