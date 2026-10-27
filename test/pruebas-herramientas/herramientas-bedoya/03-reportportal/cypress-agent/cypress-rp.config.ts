import { defineConfig } from 'cypress';
import registerReportPortalPlugin from '@reportportal/agent-js-cypress/lib/plugin';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.resolve('test/pruebas-herramientas/herramientas-bedoya/03-reportportal/reportportal.env') });
dotenv.config({ path: path.resolve('backend/.env') });

const rpEndpoint = process.env.RP_ENDPOINT || 'http://localhost:8088/api/v1';
const rpApiKey = process.env.RP_API_KEY || 'fubanking_rp_api_key_placeholder';
const rpProject = process.env.RP_PROJECT || 'superadmin_personal';

export default defineConfig({
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: {
    apiKey: rpApiKey,
    endpoint: rpEndpoint,
    project: rpProject,
    launch: 'FuBanking - Cypress Creditos Suite',
    description: 'Reporte Independiente Cypress E2E — Simulación de Créditos (Andres Bedoya)',
    attributes: [
      { key: 'framework', value: 'cypress' },
      { key: 'module', value: 'creditos' },
      { key: 'author', value: 'Andres Bedoya' },
      { key: 'env', value: 'local' },
    ],
    skippedIssue: false,
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      on('task', {
        generateToken({ userId, email, role = 'client' }: { userId: string; email: string; role?: string }) {
          const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-for-development-32-chars-min';
          const token = jwt.sign(
            { sub: userId, userId, email, role, type: 'auth' },
            secret,
            { expiresIn: '7d' }
          );
          return token;
        },
      });
      return registerReportPortalPlugin(on, config);
    },
  },
});
