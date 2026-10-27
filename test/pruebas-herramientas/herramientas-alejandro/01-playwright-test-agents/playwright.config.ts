import { defineConfig, devices } from '@playwright/test';

/**
 * Proyecto Playwright de los Test Agents (planner / generator / healer) para
 * Bolsillos y Depositar. El servidor MCP de pruebas (`.mcp.json` en la raíz)
 * apunta a este archivo: el planner arranca desde `tests/seed.spec.ts` y el
 * generator escribe aquí los tests que salen de los planes de `specs/`.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './evidence/test-results',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: './evidence/html-report', open: 'never' }],
    ['json', { outputFile: './evidence/results.json' }],
  ],
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:3000',
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'on',
    navigationTimeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
