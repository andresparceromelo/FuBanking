import { Actor } from '../screenplay/actors/Actor';
import { CallApi } from '../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { getE2EConfig } from '../setup';

/**
 * Credenciales de prueba para los escenarios E2E de login.
 *
 * IMPORTANTE: Estas credenciales corresponden a usuarios de prueba
 * que deben existir en el entorno contra el que se ejecutan los tests.
 * En CI se crean vía seeders; en local deben registrarse manualmente
 * o usar el endpoint POST /auth/register.
 */
export const TEST_CREDENTIALS = {
  /** Usuario válido sin 2FA habilitado. */
  validUser: {
    email: 'e2e-user@fubanking.test',
    password: 'E2eSegura123!',
  },
  /** Usuario válido con 2FA habilitado. */
  twoFactorUser: {
    email: 'e2e-2fa@fubanking.test',
    password: 'E2eSegura123!',
  },
  /** Credenciales que no corresponden a ningún usuario. */
  invalidUser: {
    email: 'noexiste@fubanking.test',
    password: 'ContraseñaFalsa99!',
  },
  /** Email válido pero contraseña incorrecta. */
  wrongPassword: {
    email: 'e2e-user@fubanking.test',
    password: 'ContraseñaIncorrecta!',
  },
} as const;

/**
 * Crea un actor preconfigurado con las habilidades CallApi y BrowseTheWeb.
 *
 * Usa las URLs del entorno E2E definidas por variables de entorno o
 * los valores por defecto (localhost).
 */
export function createTestActor(name: string): Actor {
  const config = getE2EConfig();

  return Actor.named(name)
    .whoCan(CallApi.at(config.apiUrl))
    .whoCan(BrowseTheWeb.at(config.baseUrl));
}
