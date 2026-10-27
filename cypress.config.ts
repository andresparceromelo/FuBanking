import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.resolve('backend/.env') });

export default defineConfig({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports/mochawesome',
    overwrite: false,
    html: true,
    json: true,
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:3001/api/v1',
    },
    setupNodeEvents(on, config) {
      on('task', {
        generateToken({ userId, email, role = 'client' }: { userId: string; email: string; role?: string }) {
          const secret = process.env.JWT_SECRET || 'fubanking_jwt_secret_dev';
          const token = jwt.sign(
            { userId, email, role, type: 'auth' },
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
