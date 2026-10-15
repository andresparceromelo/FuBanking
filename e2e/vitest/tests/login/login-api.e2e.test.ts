import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { LoginViaApi } from '../../screenplay/tasks/LoginViaApi';
import { TheLoginResult } from '../../screenplay/questions/TheLoginResult';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import { createTestActor, TEST_CREDENTIALS } from '../../fixtures/login.fixtures';

/**
 * Pruebas E2E — Login vía API (Patrón Screenplay)
 *
 * Estas pruebas validan el flujo completo de autenticación
 * contra el backend real (o entorno de staging).
 *
 * Actores:
 *   - Ana: usuario estándar que intenta iniciar sesión
 *
 * Precondiciones:
 *   - Backend levantado y accesible en E2E_API_URL
 *   - Usuarios de prueba registrados (ver fixtures/login.fixtures.ts)
 */
describe('Login E2E — API Backend (Screenplay)', () => {
  let ana: Actor;

  beforeAll(async () => {
    ana = createTestActor('Ana');

    const health = await ana.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas E2E que requieren ' +
          'conexión al backend se omitirán automáticamente.',
      );
    }
  });

  beforeEach(() => {
    LoginViaApi.lastResult = null;
  });

  describe('Escenario: Login exitoso sin 2FA', () => {
    it('debería autenticar al usuario y recibir un token JWT', async () => {
      const health = await ana.asks(TheBackendHealth.check());

      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }

      await ana.attemptsTo(
        LoginViaApi.withCredentials(
          TEST_CREDENTIALS.validUser.email,
          TEST_CREDENTIALS.validUser.password,
        ),
      );

      const result = await ana.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBe(200);
      expect(result.data.data).toHaveProperty('requiresTwoFactor', false);
      expect(result.data.data).toHaveProperty('token');
      expect(result.data.data).toHaveProperty('user');

      if ('user' in (result.data.data as any)) {
        expect((result.data.data as any).user).toHaveProperty('id');
        expect((result.data.data as any).user).toHaveProperty('email');
      }
    });
  });

  describe('Escenario: Login con credenciales inválidas', () => {
    it('debería rechazar un email que no existe en el sistema', async () => {
      const health = await ana.asks(TheBackendHealth.check());

      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }

      await ana.attemptsTo(
        LoginViaApi.withCredentials(
          TEST_CREDENTIALS.invalidUser.email,
          TEST_CREDENTIALS.invalidUser.password,
        ),
      );

      const result = await ana.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBe(401);
      expect(result.data.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('debería rechazar una contraseña incorrecta', async () => {
      const health = await ana.asks(TheBackendHealth.check());

      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }

      await ana.attemptsTo(
        LoginViaApi.withCredentials(
          TEST_CREDENTIALS.wrongPassword.email,
          TEST_CREDENTIALS.wrongPassword.password,
        ),
      );

      const result = await ana.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBe(401);
      expect(result.data.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  describe('Escenario: Login con 2FA habilitado', () => {
    it('debería requerir verificación de segundo factor', async () => {
      const health = await ana.asks(TheBackendHealth.check());

      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }

      await ana.attemptsTo(
        LoginViaApi.withCredentials(
          TEST_CREDENTIALS.twoFactorUser.email,
          TEST_CREDENTIALS.twoFactorUser.password,
        ),
      );

      const result = await ana.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBe(200);
      expect(result.data.data).toHaveProperty('requiresTwoFactor', true);
      expect(result.data.data).toHaveProperty('temporaryToken');
      expect(result.data.data).toHaveProperty('maskedEmail');
    });
  });

  describe('Escenario: Validación de datos de entrada', () => {
    it('debería rechazar un cuerpo con email vacío', async () => {
      const health = await ana.asks(TheBackendHealth.check());

      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }

      await ana.attemptsTo(
        LoginViaApi.withCredentials('', TEST_CREDENTIALS.validUser.password),
      );

      const result = await ana.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar un cuerpo con contraseña vacía', async () => {
      const health = await ana.asks(TheBackendHealth.check());

      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }

      await ana.attemptsTo(
        LoginViaApi.withCredentials(TEST_CREDENTIALS.validUser.email, ''),
      );

      const result = await ana.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });
});
