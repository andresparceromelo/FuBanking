import { describe, it, expect, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { CallApi } from '../../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { WithdrawMoneyViaApi } from '../../screenplay/tasks/WithdrawMoneyViaApi';
import { TheWithdrawalResult } from '../../screenplay/questions/TheWithdrawalResult';

/**
 * Pruebas E2E — Validación del framework Screenplay para Retiro
 *
 * Verifica que los componentes del patrón Screenplay específicos del módulo de
 * retiro funcionan correctamente de forma aislada,
 * sin necesidad de servidores reales (Fast, Isolated — principio FIRST).
 *
 * Actores:
 *   - Testigo: actor genérico usado para validar el framework sin lógica de negocio
 */
describe('Retiro — Validación del framework Screenplay (sin servidor)', () => {
  const API_URL = 'http://localhost:3001/api/v1';
  const BASE_URL = 'http://localhost:3000';

  // ── WithdrawMoneyViaApi ──────────────────────────────────────────────────

  describe('WithdrawMoneyViaApi — estado estático', () => {
    beforeEach(() => {
      WithdrawMoneyViaApi.lastResult = null;
    });

    it('debería inicializarse con lastResult en null', () => {
      // Arrange + Act implícito (beforeEach)
      // Assert
      expect(WithdrawMoneyViaApi.lastResult).toBeNull();
    });

    it('debería permitir asignar un resultado mock directamente', () => {
      // Arrange
      const mockResult = {
        status: 200,
        data: { message: 'Retiro realizado exitosamente', data: {} },
      };

      // Act
      WithdrawMoneyViaApi.lastResult = mockResult;

      // Assert — fluent assertions
      expect(WithdrawMoneyViaApi.lastResult).not.toBeNull();
      expect(WithdrawMoneyViaApi.lastResult?.status).toBe(200);
    });

    it('debería crearse con el método estático withData', () => {
      // Arrange + Act
      const task = WithdrawMoneyViaApi.withData({ accountId: '123', amount: 500 });

      // Assert
      expect(task).toBeDefined();
      expect(typeof task.performAs).toBe('function');
    });
  });

  // ── TheWithdrawalResult ──────────────────────────────────────────────────

  describe('TheWithdrawalResult — question', () => {
    beforeEach(() => {
      WithdrawMoneyViaApi.lastResult = null;
    });

    it('debería lanzar un error descriptivo cuando no hay resultado previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));

      // Act + Assert
      await expect(
        actor.asks(TheWithdrawalResult.fromLastAttempt()),
      ).rejects.toThrow('No hay resultado de retiro de dinero disponible');
    });

    it('debería devolver el resultado cuando existe un intento previo', async () => {
      // Arrange
      const actor = Actor.named('Testigo')
        .whoCan(CallApi.at(API_URL))
        .whoCan(BrowseTheWeb.at(BASE_URL));
      const mockResult = {
        status: 200,
        data: { message: 'Retiro realizado exitosamente', data: {} },
      };
      WithdrawMoneyViaApi.lastResult = mockResult;

      // Act
      const result = await actor.asks(TheWithdrawalResult.fromLastAttempt());

      // Assert — fluent assertions
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message', 'Retiro realizado exitosamente');
    });
  });
});
