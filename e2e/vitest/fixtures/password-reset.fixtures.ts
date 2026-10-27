import { Actor } from '../screenplay/actors/Actor';
import { CallApi } from '../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { getE2EConfig } from '../setup';

/**
 * Credenciales de prueba para los escenarios E2E de restablecimiento de contraseña.
 *
 * IMPORTANTE: `existingUser` debe corresponder a un usuario real en el entorno
 * de pruebas. En CI se crea vía seeders; en local debe existir previamente.
 */
export const PASSWORD_RESET_CREDENTIALS = {
  /** Usuario existente cuyo email recibirá el enlace de reset. */
  existingUser: {
    email: 'e2e-user@fubanking.test',
  },
  /** Email que no corresponde a ningún usuario registrado. */
  nonExistentUser: {
    email: 'noexiste-reset@fubanking.test',
  },
} as const;

/**
 * Tokens de prueba que representan estados inválidos del token de reset.
 * Se usan para validar el comportamiento del backend ante tokens malformados.
 */
export const INVALID_RESET_TOKENS = {
  /** Cadena vacía — no supera la validación mínima. */
  empty: '',
  /** Token con formato JWT incorrecto (no tiene las 3 partes). */
  malformed: 'esto-no-es-un-jwt',
  /** Token JWT válido en formato pero con firma incorrecta. */
  invalidSignature: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0ZXN0In0.firma-incorrecta',
} as const;

/**
 * Payloads de contraseña inválidos para validar la política de seguridad
 * en el endpoint POST /auth/reset-password.
 */
export const INVALID_PASSWORD_RESET_CASES = {
  /** Contraseña demasiado corta (menos de 8 caracteres). */
  tooShort: {
    newPassword: 'Abc1!',
    confirmPassword: 'Abc1!',
  },
  /** Contraseña sin letra mayúscula. */
  noUppercase: {
    newPassword: 'nuevaclave123!',
    confirmPassword: 'nuevaclave123!',
  },
  /** Contraseña sin dígito numérico. */
  noDigit: {
    newPassword: 'NuevaClaveSegura!',
    confirmPassword: 'NuevaClaveSegura!',
  },
  /** Confirmación de contraseña que no coincide con la nueva. */
  mismatch: {
    newPassword: 'NuevaClave123!',
    confirmPassword: 'OtraClave456!',
  },
} as const;

/**
 * Crea un actor preconfigurado para los escenarios E2E de restablecimiento de contraseña.
 *
 * Usa las URLs del entorno E2E definidas por variables de entorno o
 * los valores por defecto (localhost).
 */
export function createPasswordResetActor(name: string): Actor {
  const config = getE2EConfig();

  return Actor.named(name)
    .whoCan(CallApi.at(config.apiUrl))
    .whoCan(BrowseTheWeb.at(config.baseUrl));
}
