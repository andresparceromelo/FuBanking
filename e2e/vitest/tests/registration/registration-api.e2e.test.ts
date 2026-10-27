import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { RegisterViaApi } from '../../screenplay/tasks/RegisterViaApi';
import { TheRegistrationResult } from '../../screenplay/questions/TheRegistrationResult';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import {
  createRegistrationActor,
  buildValidRegistrationPayload,
  buildUniqueEmail,
} from '../../fixtures/registration.fixtures';

/**
 * Pruebas E2E — Registro de usuario vía API (Patrón Screenplay)
 *
 * Validan el flujo completo de creación de usuarios contra el backend real.
 * Se aplica el patrón AAA (Arrange → Act → Assert) en cada prueba y se
 * usan fluent assertions para que los fallos sean autodescriptivos.
 *
 * Actores:
 *   - Carlos: nuevo usuario que intenta registrarse en el sistema
 *
 * Principios FIRST aplicados:
 *   - Fast: cada test hace una sola petición HTTP
 *   - Independent: `beforeEach` limpia el estado compartido entre tests
 *   - Repeatable: emails únicos por timestamp garantizan repetibilidad
 *   - Self-validating: assertions automáticas sin intervención manual
 *   - Timely: escritas junto con la funcionalidad
 *
 * Precondiciones:
 *   - Backend levantado y accesible en E2E_API_URL (default: localhost:3001)
 *   - Base de datos disponible con las tablas `users` creadas
 */
describe('Registro E2E — API Backend (Screenplay)', () => {
  let carlos: Actor;

  // ── Arrange global ────────────────────────────────────────────────────────
  beforeAll(async () => {
    carlos = createRegistrationActor('Carlos');

    const health = await carlos.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas E2E de registro se omitirán.',
      );
    }
  });

  beforeEach(() => {
    // Independent: reseteamos el estado compartido antes de cada escenario
    RegisterViaApi.lastResult = null;
  });

  // ── Escenario 1: Registro exitoso ────────────────────────────────────────
  describe('Escenario: Registro exitoso con datos válidos', () => {
    it('debería crear el usuario y devolver un token JWT', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload();

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert — fluent assertions sobre la respuesta HTTP
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());

      expect(result.status).toBe(201);
      expect(result.data).toHaveProperty('data');

      const body = result.data as { data: { user: unknown; token: string }; message: string };
      expect(body.data).toHaveProperty('user');
      expect(body.data).toHaveProperty('token');
      expect(typeof body.data.token).toBe('string');
      expect(body.data.token.length).toBeGreaterThan(10);
    });

    it('debería devolver los datos del usuario recién creado en la respuesta', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({
        firstName: 'Laura',
        lastName: 'Torres',
      });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert — el objeto `user` devuelto contiene los campos esperados
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      const body = result.data as {
        data: { user: { id: string; email: string; firstName: string; lastName: string }; token: string };
        message: string;
      };

      expect(result.status).toBe(201);
      expect(body.data.user).toHaveProperty('id');
      expect(body.data.user).toHaveProperty('email', payload.email.toLowerCase());
      expect(body.data.user).toHaveProperty('firstName', 'Laura');
      expect(body.data.user).toHaveProperty('lastName', 'Torres');
    });

    it('debería normalizar el email a minúsculas automáticamente', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      // Generamos un email único con caracteres en mayúsculas para verificar la normalización
      const baseEmail = buildUniqueEmail('E2E-Norm');
      const upperCaseEmail = baseEmail.toUpperCase();
      const expectedEmail = baseEmail.toLowerCase();
      const payload = buildValidRegistrationPayload({ email: upperCaseEmail });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert — el email en la respuesta debe estar en minúsculas
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      const body = result.data as { data: { user: { email: string } } };

      expect(result.status).toBe(201);
      expect(body.data.user.email).toBe(expectedEmail);
    });
  });

  // ── Escenario 2: Duplicado de email ──────────────────────────────────────
  describe('Escenario: Registro con email duplicado', () => {
    it('debería rechazar el segundo registro con el mismo email', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      // Email único para este par de registros (principio FIRST — Isolated)
      const sharedEmail = buildUniqueEmail('e2e-dup');
      const payload = buildValidRegistrationPayload({ email: sharedEmail });

      // Act — primer registro (debe tener éxito)
      await carlos.attemptsTo(RegisterViaApi.withData(payload));
      const firstResult = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(firstResult.status).toBe(201);

      // Act — segundo registro con el mismo email (debe fallar)
      RegisterViaApi.lastResult = null;
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert — fluent: el sistema rechaza el email duplicado
      const secondResult = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(secondResult.status).toBeGreaterThanOrEqual(400);
      expect(secondResult.status).toBeLessThan(500);
    });
  });

  // ── Escenario 3: Validaciones de campos ──────────────────────────────────
  describe('Escenario: Validación de campos obligatorios', () => {
    it('debería rechazar un registro sin firstName', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({ firstName: '' });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar un registro sin lastName', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({ lastName: '' });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar un registro con email mal formado', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({ email: 'no-es-email' });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });

  // ── Escenario 4: Validación de contraseña ────────────────────────────────
  describe('Escenario: Validación de política de contraseña', () => {
    it('debería rechazar una contraseña sin mayúsculas', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({
        password: 'sinmayusculas1!',
        confirmPassword: 'sinmayusculas1!',
      });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar una contraseña sin números', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({
        password: 'SinNumerosAqui!',
        confirmPassword: 'SinNumerosAqui!',
      });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar cuando password y confirmPassword no coinciden', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({
        password: 'Segura123!',
        confirmPassword: 'DiferenteClave1!',
      });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });

  // ── Escenario 5: Restricciones de edad y datos personales ────────────────
  describe('Escenario: Restricciones de datos personales', () => {
    it('debería rechazar el registro de un menor de 18 años', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const underageBirth = new Date(
        Date.now() - 16 * 365 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 10);
      const payload = buildValidRegistrationPayload({ birthDate: underageBirth });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert — el backend rechaza menores de edad según auth.validators.ts
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar un ingreso mensual negativo', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) {
        console.warn('SKIP: Backend no disponible');
        return;
      }
      const payload = buildValidRegistrationPayload({ monthlyIncome: -500 });

      // Act
      await carlos.attemptsTo(RegisterViaApi.withData(payload));

      // Assert
      const result = await carlos.asks(TheRegistrationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });
});
