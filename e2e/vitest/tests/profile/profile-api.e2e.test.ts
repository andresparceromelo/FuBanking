import { describe, it, expect, beforeAll } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { RegisterViaApi } from '../../screenplay/tasks/RegisterViaApi';
import { UpdateProfileViaApi } from '../../screenplay/tasks/UpdateProfileViaApi';
import { TheProfileUpdateResult } from '../../screenplay/questions/TheProfileUpdateResult';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import {
  createRegistrationActor,
  buildValidRegistrationPayload,
  buildUniqueEmail,
} from '../../fixtures/registration.fixtures';

/**
 * Pruebas E2E — Actualización de Perfil (Patrón Screenplay)
 *
 * Validan el flujo completo de actualización de usuarios contra el backend real.
 * Se aplica el patrón AAA y se usan fluent assertions.
 *
 * Principios FIRST:
 *   - Fast: cada test hace peticiones directas HTTP
 *   - Independent: cada test crea su propio usuario de prueba aislado (FIRST)
 */
describe('Perfil E2E — API Backend (Screenplay)', () => {
  let admin: Actor;

  beforeAll(async () => {
    // Usamos el actor factory de registro para crear el entorno base
    admin = createRegistrationActor('Admin');
    const health = await admin.asks(TheBackendHealth.check());
    if (!health.isHealthy) {
      console.warn('⚠ Backend no disponible. Pruebas de perfil omitidas.');
    }
  });

  /**
   * Helper: crea un actor nuevo y lo registra en el sistema.
   * Esto garantiza aislamiento total (Independent) para cada test,
   * cumpliendo el principio FIRST sin ensuciar el estado global.
   */
  async function createAuthenticatedActor(name: string): Promise<Actor> {
    const actor = createRegistrationActor(name);
    const payload = buildValidRegistrationPayload({
      email: buildUniqueEmail(`e2e-prof-${name.toLowerCase()}`),
    });
    
    // RegisterViaApi ahora configura el token automáticamente tras el registro
    await actor.attemptsTo(RegisterViaApi.withData(payload));
    return actor;
  }

  describe('Escenario: Actualización exitosa (Happy Paths)', () => {
    it('debería actualizar un solo campo (firstName) correctamente', async () => {
      // Arrange
      const health = await admin.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }
      const actor = await createAuthenticatedActor('Juan');

      // Act
      await actor.attemptsTo(
        UpdateProfileViaApi.withData({ firstName: 'Juanito' })
      );

      // Assert
      const result = await actor.asks(TheProfileUpdateResult.fromLastAttempt());
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('message', 'Perfil actualizado exitosamente');
      expect(result.data.data.firstName).toBe('Juanito');
    });

    it('debería actualizar múltiples campos simultáneamente', async () => {
      // Arrange
      const health = await admin.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }
      const actor = await createAuthenticatedActor('Multiple');

      // Act
      await actor.attemptsTo(
        UpdateProfileViaApi.withData({
          middleName: 'Alonso',
          phone: '3009998877',
          monthlyIncome: 8000000,
        })
      );

      // Assert
      const result = await actor.asks(TheProfileUpdateResult.fromLastAttempt());
      expect(result.status).toBe(200);
      expect(result.data.data.middleName).toBe('Alonso');
      expect(result.data.data.phone).toBe('3009998877');
      expect(result.data.data.monthlyIncome).toBe(8000000);
    });

    it('debería ignorar intentos de modificar el birthDate (campo inmutable)', async () => {
      // Arrange
      const health = await admin.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }
      const actor = await createAuthenticatedActor('Inmutable');

      // Act — se intenta pasar un birthDate, aunque Zod no lo recibe
      await actor.attemptsTo(
        UpdateProfileViaApi.withData({
          firstName: 'Cambiado',
          birthDate: '1900-01-01', 
        } as any)
      );

      // Assert — el request pasa, pero el birthDate no debe haber cambiado
      // y la API debe responder con 200 ya que 'firstName' sí es válido.
      const result = await actor.asks(TheProfileUpdateResult.fromLastAttempt());
      expect(result.status).toBe(200);
      expect(result.data.data.firstName).toBe('Cambiado');
      
      // Asegurarse de que no cambió la fecha (buildValidRegistrationPayload usa '1995-06-15')
      expect(result.data.data.birthDate).toBe('1995-06-15');
    });
  });

  describe('Escenario: Autenticación requerida', () => {
    it('debería rechazar la actualización si el actor no está autenticado', async () => {
      // Arrange
      const health = await admin.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }
      
      // Creamos un actor pero NUNCA lo registramos (no tiene token en CallApi)
      const anonymous = createRegistrationActor('Anonimo');

      // Act
      await anonymous.attemptsTo(
        UpdateProfileViaApi.withData({ firstName: 'Hack' })
      );

      // Assert
      const result = await anonymous.asks(TheProfileUpdateResult.fromLastAttempt());
      expect(result.status).toBe(401);
    });
  });
});
