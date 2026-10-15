import { describe, it, expect, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { CallApi } from '../../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { RequestPasswordResetViaApi } from '../../screenplay/tasks/RequestPasswordResetViaApi';
import { ResetPasswordViaApi } from '../../screenplay/tasks/ResetPasswordViaApi';
import { VerifyResetTokenViaApi } from '../../screenplay/tasks/VerifyResetTokenViaApi';
import { ThePasswordResetRequestResult } from '../../screenplay/questions/ThePasswordResetRequestResult';
import { ThePasswordResetResult } from '../../screenplay/questions/ThePasswordResetResult';
import { TheTokenVerificationResult } from '../../screenplay/questions/TheTokenVerificationResult';

/**
 * Pruebas E2E — Validación del framework Screenplay para restablecimiento de contraseña
 *
 * Verifica que los componentes del patrón Screenplay específicos del módulo de
 * restablecimiento de contraseña funcionan correctamente de forma aislada,
 * sin necesidad de servidores reales (Fast, Isolated — principio FIRST).
 *
 * Actores:
 *   - Testigo: actor genérico usado para validar el framework sin lógica de negocio
 *
 * Principios FIRST:
 *   - Fast: sin peticiones HTTP, todas las aserciones son en memoria
 *   - Independent: cada test usa beforeEach para limpiar el estado estático
 *   - Repeatable: sin efectos secundarios externos
 *   - Self-validating: aserciones automáticas claras
 *   - Timely: cubren el contrato interno de cada componente Screenplay
 */
describe('Restablecimiento de contraseña — Validación del framework Screenplay (sin servidor)', () => {
  const API_URL = 'http://localhost:3001/api/v1';
  const BASE_URL = 'http://localhost:3000';

  // ── RequestPasswordResetViaApi ────────────────────────────────────────────

  describe('RequestPasswordResetViaApi — estado estático', () => {
    beforeEach(() => {
      RequestPasswordResetViaApi.lastResult = null;
    });

    it('debería inicializarse con lastResult en null', () => {
      // Arrange + Act implícito (beforeEach)
      // Assert
      expect(RequestPasswordResetViaApi.lastResult).toBeNull();
    });

    it('debería permitir asignar un resultado mock directamente', () => {
      // Arrange
      const mockResult = {
        status: 200,
        data: { message: 'Si el correo existe, recibirás un enlace de recuperación', data: null },
      };

      // Act
      RequestPasswordResetViaApi.lastResult = mockResult;

      // Assert — fluent assertions
      expect(RequestPasswordResetViaApi.lastResult).not.toBeNull();
      expect(RequestPasswordResetViaApi.lastResult?.status).toBe(200);
    });

    it('debería crearse con el método estático forEmail', () => {
      // Arrange + Act
      const task = RequestPasswordResetViaApi.forEmail('test@fubanking.test');

      // Assert
      expect(task).toBeDefined();
      expect(typeof task.performAs).toBe('function');
    });
  });

  // ── ResetPasswordViaApi ───────────────────────────────────────────────────

  describe('ResetPasswordViaApi — estado estático', () => {
    beforeEach(() => {
      ResetPasswordViaApi.lastResult = null;
    });

    it('debería inicializarse con lastResult en null', () => {
      // Arrange + Act implícito (beforeEach)
      // Assert
      expect(ResetPasswordViaApi.lastResult).toBeNull();
    });

    it('debería permitir asignar un resultado mock directamente', () => {
      // Arrange
      const mockResult = {
        status: 200,
        data: { message: 'Contraseña actualizada exitosamente', data: null },
      };

      // Act
      ResetPasswordViaApi.lastResult = mockResult;

      // Assert — fluent assertions
      expect(ResetPasswordViaApi.lastResult).not.toBeNull();
      expect(ResetPasswordViaApi.lastResult?.status).toBe(200);
    });

    it('debería crearse con el método estático with', () => {
      // Arrange + Act
      const task = ResetPasswordViaApi.with({
        token: 'fake-jwt-token',
        newPassword: 'NuevaClave123!',
        confirmPassword: 'NuevaClave123!',
      });

      // Assert
      expect(task).toBeDefined();
      expect(typeof task.performAs).toBe('function');
    });
  });

  // ── VerifyResetTokenViaApi ────────────────────────────────────────────────

  describe('VerifyResetTokenViaApi — estado estático', () => {
    beforeEach(() => {
      VerifyResetTokenViaApi.lastResult = null;
    });

    it('debería inicializarse con lastResult en null', () => {
      // Arrange + Act implícito (beforeEach)
      // Assert
      expect(VerifyResetTokenViaApi.lastResult).toBeNull();
    });

    it('debería permitir asignar un resultado mock directamente', () => {
      // Arrange
      const mockResult = {
        status: 200,
        data: { message: 'El enlace de recuperación es válido', data: null },
      };

      // Act
      VerifyResetTokenViaApi.lastResult = mockResult;

      // Assert — fluent assertions
      expect(VerifyResetTokenViaApi.lastResult).not.toBeNull();
      expect(VerifyResetTokenViaApi.lastResult?.status).toBe(200);
    });

    it('debería crearse con el método estático forToken', () => {
      // Arrange + Act
      const task = VerifyResetTokenViaApi.forToken('fake-jwt-token');

      // Assert
      expect(task).toBeDefined();
      expect(typeof task.performAs).toBe('function');
    });
  });

  // ── ThePasswordResetRequestResult ────────────────────────────────────────

  describe('ThePasswordResetRequestResult — question', () => {
    beforeEach(() => {
      RequestPasswordResetViaApi.lastResult = null;
    });

    it('debería lanzar un error descriptivo cuando no hay resultado previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));

      // Act + Assert — fluent assertion sobre el error
      await expect(
        actor.asks(ThePasswordResetRequestResult.fromLastAttempt()),
      ).rejects.toThrow('No hay resultado de solicitud de restablecimiento disponible');
    });

    it('debería devolver el resultado cuando existe un intento previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));
      const mockResult = {
        status: 200,
        data: { message: 'Si el correo existe, recibirás un enlace de recuperación', data: null },
      };
      RequestPasswordResetViaApi.lastResult = mockResult;

      // Act
      const result = await actor.asks(ThePasswordResetRequestResult.fromLastAttempt());

      // Assert — fluent assertions
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message');
    });
  });

  // ── ThePasswordResetResult ────────────────────────────────────────────────

  describe('ThePasswordResetResult — question', () => {
    beforeEach(() => {
      ResetPasswordViaApi.lastResult = null;
    });

    it('debería lanzar un error descriptivo cuando no hay resultado previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));

      // Act + Assert
      await expect(
        actor.asks(ThePasswordResetResult.fromLastAttempt()),
      ).rejects.toThrow('No hay resultado de restablecimiento de contraseña disponible');
    });

    it('debería devolver el resultado cuando existe un intento previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));
      const mockResult = {
        status: 200,
        data: { message: 'Contraseña actualizada exitosamente', data: null },
      };
      ResetPasswordViaApi.lastResult = mockResult;

      // Act
      const result = await actor.asks(ThePasswordResetResult.fromLastAttempt());

      // Assert — fluent assertions
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message');
    });
  });

  // ── TheTokenVerificationResult ────────────────────────────────────────────

  describe('TheTokenVerificationResult — question', () => {
    beforeEach(() => {
      VerifyResetTokenViaApi.lastResult = null;
    });

    it('debería lanzar un error descriptivo cuando no hay resultado previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));

      // Act + Assert
      await expect(
        actor.asks(TheTokenVerificationResult.fromLastAttempt()),
      ).rejects.toThrow('No hay resultado de verificación de token disponible');
    });

    it('debería devolver el resultado cuando existe un intento previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));
      const mockResult = {
        status: 200,
        data: { message: 'El enlace de recuperación es válido', data: null },
      };
      VerifyResetTokenViaApi.lastResult = mockResult;

      // Act
      const result = await actor.asks(TheTokenVerificationResult.fromLastAttempt());

      // Assert — fluent assertions
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message');
    });
  });
});
