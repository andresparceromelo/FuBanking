import { describe, it, expect, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { CallApi } from '../../screenplay/abilities/CallApi';
import { UpdateProfileViaApi } from '../../screenplay/tasks/UpdateProfileViaApi';
import { TheProfileUpdateResult } from '../../screenplay/questions/TheProfileUpdateResult';
import { INVALID_PROFILE_CASES } from '../../fixtures/profile.fixtures';

/**
 * Pruebas E2E — Validación del framework Screenplay para Perfil
 *
 * Verifica que los componentes del patrón Screenplay específicos del
 * módulo de perfil funcionan correctamente de forma aislada, sin
 * necesidad de servidores reales (Fast, Isolated — principio FIRST).
 */
describe('Perfil — Validación del framework Screenplay (sin servidor)', () => {
  describe('UpdateProfileViaApi — estado estático', () => {
    beforeEach(() => {
      UpdateProfileViaApi.lastResult = null;
    });

    it('debería inicializarse con lastResult en null', () => {
      expect(UpdateProfileViaApi.lastResult).toBeNull();
    });

    it('debería permitir asignar un resultado mock directamente', () => {
      const mockResult = {
        status: 200,
        data: { message: 'Perfil actualizado' },
      };
      UpdateProfileViaApi.lastResult = mockResult;

      expect(UpdateProfileViaApi.lastResult).not.toBeNull();
      expect(UpdateProfileViaApi.lastResult?.status).toBe(200);
    });

    it('debería crearse con el método estático withData', () => {
      const task = UpdateProfileViaApi.withData({ firstName: 'Prueba' });
      expect(task).toBeDefined();
      expect(typeof task.performAs).toBe('function');
    });
  });

  describe('TheProfileUpdateResult — question', () => {
    beforeEach(() => {
      UpdateProfileViaApi.lastResult = null;
    });

    it('debería lanzar un error descriptivo cuando no hay resultado previo', async () => {
      const actor = Actor.named('Testigo').whoCan(
        CallApi.at('http://localhost:3001/api/v1'),
      );

      await expect(
        actor.asks(TheProfileUpdateResult.fromLastAttempt()),
      ).rejects.toThrow('No hay resultado de actualización de perfil disponible');
    });

    it('debería devolver el resultado cuando existe un intento previo', async () => {
      const actor = Actor.named('Testigo').whoCan(
        CallApi.at('http://localhost:3001/api/v1'),
      );
      const mockResult = {
        status: 200,
        data: { message: 'Exito' },
      };
      UpdateProfileViaApi.lastResult = mockResult;

      const result = await actor.asks(TheProfileUpdateResult.fromLastAttempt());

      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Exito');
    });
  });

  describe('INVALID_PROFILE_CASES — factoría de fixtures', () => {
    it('debería contener los casos de prueba de validación definidos', () => {
      expect(INVALID_PROFILE_CASES.shortFirstName).toBeDefined();
      expect(INVALID_PROFILE_CASES.invalidPhone).toBeDefined();
      expect(INVALID_PROFILE_CASES.negativeIncome).toBeDefined();
    });
  });
});
