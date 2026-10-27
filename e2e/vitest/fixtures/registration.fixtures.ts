import { Actor } from '../screenplay/actors/Actor';
import { CallApi } from '../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { getE2EConfig } from '../setup';
import type { RegisterPayload } from '../screenplay/tasks/RegisterViaApi';

/** Contador monotónico para evitar colisiones dentro del mismo milisegundo. */
let _counter = 0;

/**
 * Genera un sufijo único combinando timestamp y contador monotónico para
 * garantizar emails únicos en cada llamada, incluso dentro del mismo ms.
 * Cumple el principio FIRST (Isolated): nunca dos tests comparten email.
 */
function uniqueSuffix(): string {
  _counter += 1;
  return `${Date.now().toString(36)}${_counter.toString(36)}`;
}

/**
 * Construye un email único de prueba con el dominio @fubanking.test.
 * Se usa el prefijo `e2e-reg` para que el script clean-e2e-users.mjs
 * pueda identificarlo y borrarlo automáticamente.
 */
export function buildUniqueEmail(prefix = 'e2e-reg'): string {
  return `${prefix}.${uniqueSuffix()}@fubanking.test`;
}

/**
 * Datos de un usuario de prueba válido para los escenarios E2E de registro.
 * El email es generado dinámicamente en cada llamada para garantizar
 * aislamiento entre pruebas (principio FIRST — Isolated).
 */
export function buildValidRegistrationPayload(
  overrides: Partial<RegisterPayload> = {},
): RegisterPayload {
  return {
    firstName: 'María',
    lastName: 'García',
    document: Math.floor(10000000 + Math.random() * 89999999).toString(),
    birthDate: '1995-06-15',
    email: buildUniqueEmail(),
    password: 'Segura123!',
    confirmPassword: 'Segura123!',
    phone: '3001234567',
    monthlyIncome: 3000000,
    ...overrides,
  };
}

/**
 * Crea un actor preconfigurado con las habilidades CallApi y BrowseTheWeb.
 *
 * Reutiliza la misma factoría que `createTestActor` de login.fixtures,
 * pero con un nombre diferente para mantener la semántica del escenario
 * de registro.
 */
export function createRegistrationActor(name: string): Actor {
  const config = getE2EConfig();

  return Actor.named(name)
    .whoCan(CallApi.at(config.apiUrl))
    .whoCan(BrowseTheWeb.at(config.baseUrl));
}

/**
 * Payloads de prueba para los escenarios de validación de campos.
 * Cada entrada corresponde a un caso de borde específico del endpoint
 * POST /auth/register definido en auth.validators.ts.
 */
export const INVALID_REGISTRATION_CASES = {
  /** Nombre demasiado corto (< 2 caracteres). */
  shortFirstName: buildValidRegistrationPayload({ firstName: 'A' }),
  /** Apellido demasiado corto (< 2 caracteres). */
  shortLastName: buildValidRegistrationPayload({ lastName: 'B' }),
  /** Email con formato inválido. */
  invalidEmail: buildValidRegistrationPayload({
    email: 'no-es-un-email-valido',
  }),
  /** Contraseña sin mayúsculas. */
  passwordNoUppercase: buildValidRegistrationPayload({
    password: 'segura123!',
    confirmPassword: 'segura123!',
  }),
  /** Contraseña sin números. */
  passwordNoDigit: buildValidRegistrationPayload({
    password: 'Seguraaaaaa!',
    confirmPassword: 'Seguraaaaaa!',
  }),
  /** Contraseñas que no coinciden. */
  passwordMismatch: buildValidRegistrationPayload({
    password: 'Segura123!',
    confirmPassword: 'OtraClave123!',
  }),
  /** Fecha de nacimiento de un menor de 18 años. */
  underage: buildValidRegistrationPayload({
    birthDate: new Date(Date.now() - 17 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  }),
  /** Ingreso mensual negativo. */
  negativeIncome: buildValidRegistrationPayload({ monthlyIncome: -1000 }),
} as const;
