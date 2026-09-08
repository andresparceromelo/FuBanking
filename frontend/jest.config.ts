// jest.config.ts
// Configuración de Jest para el frontend (Next.js + React Testing Library)
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Ruta al directorio raíz de Next.js (donde está next.config.ts)
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};

export default createJestConfig(config);
