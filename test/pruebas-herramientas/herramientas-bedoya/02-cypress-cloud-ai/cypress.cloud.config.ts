import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.resolve('test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/.env') });
dotenv.config({ path: path.resolve('backend/.env') });

export default defineConfig({
  projectId: 'ypgf2b',
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    experimentalStudio: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:3001/api/v1',
    },
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
      return config;
    },
  },
});
