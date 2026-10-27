import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('test/pruebas-herramientas/herramientas-bedoya/03-reportportal/reportportal.env') });
dotenv.config({ path: path.resolve('backend/.env') });

const rpEndpoint = process.env.RP_ENDPOINT || 'http://localhost:8088/api/v1';
const rpApiKey = process.env.RP_API_KEY || 'fubanking_rp_api_key_placeholder';
const rpProject = process.env.RP_PROJECT || 'superadmin_personal';

const rpConfig = {
  apiKey: rpApiKey,
  endpoint: rpEndpoint,
  project: rpProject,
  launch: 'FuBanking - Playwright Creditos Suite',
  description: 'Reporte Independiente Playwright E2E — Simulación de Créditos (Andres Bedoya)',
  attributes: [
    { key: 'framework', value: 'playwright' },
    { key: 'module', value: 'creditos' },
    { key: 'author', value: 'Andres Bedoya' },
    { key: 'env', value: 'local' },
  ],
  skippedIssue: false,
};

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['@reportportal/agent-js-playwright', rpConfig],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
