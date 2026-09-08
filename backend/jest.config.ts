// jest.config.ts
// Configuración de Jest para el backend (TypeScript + módulos ESM/CJS)
import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.integration.test.ts'],
  moduleNameMapper: {
    // Ajusta si usas path aliases en tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/application/use-cases/**/*.ts',
    'src/presentation/controllers/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

export default config;
