import { describe, it, expect, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { CallApi } from '../../screenplay/abilities/CallApi';
import { RegisterViaApi } from '../../screenplay/tasks/RegisterViaApi';
import { TheRegistrationResult } from '../../screenplay/questions/TheRegistrationResult';
import { buildValidRegistrationPayload } from '../../fixtures/registration.fixtures';

/**
 * Pruebas E2E — Validación del framework Screenplay para Registro
 *
 * Verifica que los componentes del patrón Screenplay específicos del
 * módulo de registro funcionan correctamente de forma aislada, sin
 * necesidad de servidores reales (Fast, Isolated — principio FIRST).
 *
 * Actores: ninguno real, se usan actores de prueba desconectados.
 *
 * Principios aplicados:
 *   - FIRST: Fast (sin red), Isolated (sin estado compartido), Repeatable,
 *     Self-validating (assertions automáticas), Timely
 *   - AAA: cada `it` sigue Arrange → Act → Assert
 *   - Fluent assertions: encadenamiento de expects para legibilidad
 *   - Screenplay: Actor, Task (RegisterViaApi), Question (TheRegistrationResult)
 */
describe('Registro — Validación del framework Screenplay (sin servidor)', () => {
  // ─── RegisterViaApi.lastResult ─────────────────────────────────────────────
  describe('RegisterViaApi — estado estático', () => {
    beforeEach(() => {
      // Arrange: limpiamos el estado entre tests para garantizar aislamiento
      RegisterViaApi.lastResult = null;
    });

    it('debería inicializarse con lastResult en null', () => {
      // Arrange (realizado en beforeEach)
      // Act (no se realiza ninguna acción)
      // Assert
      expect(RegisterViaApi.lastResult).toBeNull();
    });

    it('debería permitir asignar un resultado mock directamente', () => {
      // Arrange
      const mockResult = {
        status: 201,
        data: {
          data: {
            user: { id: 'u1', email: 'test@fubanking.test', firstName: 'Test', lastName: 'User' },
            token: 'jwt-mock-token',
          },
          message: 'Usuario registrado exitosamente',
        },
      };

      // Act
      RegisterViaApi.lastResult = mockResult;

      // Assert — fluent: encadenamos sobre el objeto recuperado
      expect(RegisterViaApi.lastResult).not.toBeNull();
      expect(RegisterViaApi.lastResult?.status).toBe(201);
      expect(RegisterViaApi.lastResult?.data).toHaveProperty('data');
    });

    it('debería crearse con el método estático withData', () => {
      // Arrange
      const payload = buildValidRegistrationPayload();

      // Act
      const task = RegisterViaApi.withData(payload);

      // Assert — la tarea existe y tiene la interfaz correcta
      expect(task).toBeDefined();
      expect(typeof task.performAs).toBe('function');
    });
  });

  // ─── TheRegistrationResult ────────────────────────────────────────────────
  describe('TheRegistrationResult — question', () => {
    beforeEach(() => {
      RegisterViaApi.lastResult = null;
    });

    it('debería crearse con el método estático fromLastAttempt', () => {
      // Arrange + Act
      const question = TheRegistrationResult.fromLastAttempt();

      // Assert
      expect(question).toBeDefined();
      expect(typeof question.answeredBy).toBe('function');
    });

    it('debería lanzar un error descriptivo cuando no hay resultado previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo').whoCan(
        CallApi.at('http://localhost:3001/api/v1'),
      );

      // Act + Assert — fluent: verificamos el mensaje del error
      await expect(
        actor.asks(TheRegistrationResult.fromLastAttempt()),
      ).rejects.toThrow('No hay resultado de registro disponible');
    });

    it('debería devolver el resultado cuando existe un intento previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo').whoCan(
        CallApi.at('http://localhost:3001/api/v1'),
      );
      const mockResult = {
        status: 201,
        data: {
          data: {
            user: {
              id: 'abc-123',
              email: 'maria@fubanking.test',
              firstName: 'María',
              lastName: 'García',
            },
            token: 'eyJhbGciOiJIUzI1NiJ9',
          },
          message: 'Usuario registrado exitosamente',
        },
      };
      RegisterViaApi.lastResult = mockResult;

      // Act
      const result = await actor.asks(TheRegistrationResult.fromLastAttempt());

      // Assert — fluent assertions sobre la estructura de respuesta
      expect(result).not.toBeNull();
      expect(result.status).toBe(201);
      expect(result.data).toHaveProperty('data');
    });

    it('debería devolver el resultado exactamente como fue almacenado', async () => {
      // Arrange
      const actor = Actor.named('Testigo').whoCan(
        CallApi.at('http://localhost:3001/api/v1'),
      );
      const expected = {
        status: 409,
        data: {
          error: { code: 'EMAIL_ALREADY_EXISTS', message: 'El correo ya está registrado' },
        },
      };
      RegisterViaApi.lastResult = expected;

      // Act
      const result = await actor.asks(TheRegistrationResult.fromLastAttempt());

      // Assert — el resultado es idéntico al almacenado
      expect(result).toStrictEqual(expected);
    });
  });

  // ─── buildValidRegistrationPayload ───────────────────────────────────────
  describe('buildValidRegistrationPayload — factoría de fixtures', () => {
    it('debería generar un payload con todos los campos obligatorios', () => {
      // Arrange + Act
      const payload = buildValidRegistrationPayload();

      // Assert — fluent: verificamos cada campo obligatorio
      expect(payload.firstName).toBeTruthy();
      expect(payload.lastName).toBeTruthy();
      expect(payload.document).toBeTruthy();
      expect(payload.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(payload.email).toContain('@fubanking.test');
      expect(payload.password).toBeTruthy();
      expect(payload.confirmPassword).toBe(payload.password);
      expect(payload.monthlyIncome).toBeGreaterThan(0);
    });

    it('debería generar emails únicos en llamadas sucesivas', () => {
      // Arrange + Act
      const payload1 = buildValidRegistrationPayload();
      const payload2 = buildValidRegistrationPayload();

      // Assert — dos llamadas no producen el mismo email
      expect(payload1.email).not.toBe(payload2.email);
    });

    it('debería aplicar overrides sobre los valores por defecto', () => {
      // Arrange
      const customEmail = 'custom.test@fubanking.test';

      // Act
      const payload = buildValidRegistrationPayload({ email: customEmail, monthlyIncome: 9999 });

      // Assert — los overrides prevalecen
      expect(payload.email).toBe(customEmail);
      expect(payload.monthlyIncome).toBe(9999);
      // Los campos no sobreescritos mantienen sus valores por defecto
      expect(payload.firstName).toBe('María');
    });
  });
});
