import type { UpdateProfileInput } from '../../../backend/src/presentation/validators/profile.validators';

/**
 * Payloads de prueba para los escenarios de validación de campos
 * al editar el perfil de usuario.
 * Cada entrada corresponde a un caso de borde específico del endpoint
 * PATCH /profile definido en profile.validators.ts.
 */
export const INVALID_PROFILE_CASES = {
  /** Primer nombre demasiado corto (< 2 caracteres). */
  shortFirstName: { firstName: 'A' },
  /** Primer apellido demasiado corto (< 2 caracteres). */
  shortLastName: { lastName: 'B' },
  /** Nombre con 3 caracteres idénticos consecutivos (ej. error de tipado). */
  consecutiveCharsName: { firstName: 'Maaaria' },
  /** Nombre sin vocales (invalido semánticamente según la regla de negocio). */
  noVowelsName: { firstName: 'Mrcl' },
  /** Nombre con caracteres especiales no permitidos (ej. números o símbolos). */
  invalidCharsName: { firstName: 'Maria123' },
  /** Teléfono con formato inválido (ej. letras). */
  invalidPhone: { phone: 'telefono-invalido' },
  /** URL de avatar con formato incorrecto. */
  invalidAvatarUrl: { avatarUrl: 'no-es-una-url' },
  /** Ingreso mensual negativo o cero. */
  negativeIncome: { monthlyIncome: -500 },
  zeroIncome: { monthlyIncome: 0 },
  /** Payload vacío (se requiere al menos un campo). */
  emptyPayload: {},
} as const;
