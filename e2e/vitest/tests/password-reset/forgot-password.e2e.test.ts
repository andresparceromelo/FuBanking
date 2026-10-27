import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import { RequestPasswordResetViaApi } from '../../screenplay/tasks/RequestPasswordResetViaApi';
import { ThePasswordResetRequestResult } from '../../screenplay/questions/ThePasswordResetRequestResult';
import {
  createPasswordResetActor,
  PASSWORD_RESET_CREDENTIALS,
} from '../../fixtures/password-reset.fixtures';

/**
 * Pruebas E2E — Solicitud de restablecimiento de contraseña (Patrón Screenplay)
 *
 * Valida el flujo del endpoint POST /auth/forgot-password contra el backend real.
 * Por seguridad, el backend siempre responde 200 aunque el email no exista.
 *
 * Actores:
 *   - Laura: usuaria que solicita restablecer su contraseña
 *
 * Principios FIRST:
 *   - Fast: una sola petición HTTP por test
 *   - Independent: cada test limpia lastResult en beforeEach
 *   - Repeatable: no depende de estado externo mutable
 *   - Self-validating: assertions automáticas con fluent assertions
 *   - Timely: cobertura completa del endpoint forgot-password
 */
describe('Restablecimiento de contraseña E2E — Solicitud (Screenplay)', () => {
  let laura: Actor;

  // ── Arrange global ───────────────────────────────────────────────────────
  beforeAll(async () => {
    laura = createPasswordResetActor('Laura');

    const health = await laura.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas E2E que requieren ' +
          'conexión al backend se omitirán automáticamente.',
      );
    }
  });

  beforeEach(() => {
    RequestPasswordResetViaApi.lastResult = null;
  });

  // ── Escenarios principales ───────────────────────────────────────────────

  describe('Escenario: Solicitud con email de usuario existente', () => {
    it('debería responder 200 y retornar el mensaje de éxito estándar', async () => {
      // Arrange
      const health = await laura.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await laura.attemptsTo(
        RequestPasswordResetViaApi.forEmail(PASSWORD_RESET_CREDENTIALS.existingUser.email),
      );

      // Assert — fluent assertions
      const result = await laura.asks(ThePasswordResetRequestResult.fromLastAttempt());
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message');
    });
  });

  describe('Escenario: Solicitud con email de usuario inexistente (seguridad anti-enumeración)', () => {
    it('debería responder 200 para evitar revelar si el email existe', async () => {
      // Arrange
      const health = await laura.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await laura.attemptsTo(
        RequestPasswordResetViaApi.forEmail(PASSWORD_RESET_CREDENTIALS.nonExistentUser.email),
      );

      // Assert — el backend nunca revela si el email existe (OWASP)
      const result = await laura.asks(ThePasswordResetRequestResult.fromLastAttempt());
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message');
    });
  });

  describe('Escenario: Validación del campo email', () => {
    it('debería rechazar una solicitud con email vacío', async () => {
      // Arrange
      const health = await laura.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await laura.attemptsTo(RequestPasswordResetViaApi.forEmail(''));

      // Assert — el validador Zod debe rechazar el email vacío
      const result = await laura.asks(ThePasswordResetRequestResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });

    it('debería rechazar una solicitud con formato de email inválido', async () => {
      // Arrange
      const health = await laura.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await laura.attemptsTo(RequestPasswordResetViaApi.forEmail('no-es-un-email'));

      // Assert — el validador Zod debe rechazar emails malformados
      const result = await laura.asks(ThePasswordResetRequestResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });
});
