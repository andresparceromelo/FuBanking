import { z } from 'zod';
import { isValidName } from '../../shared/utils/nameValidation';
import { parseDateLocal } from '../../shared/utils/dateUtils';

/**
 * Schemas de validación Zod para los endpoints de perfil.
 *
 * Defectos corregidos:
 *  1. Límites de longitud consistentes (.max) en todos los campos de texto.
 *  2. Parseo de fecha sin desfase UTC (parseDateLocal importado de shared).
 *  4. Validación semántica de nombres (isValidName reutilizado de nameValidation).
 *  7. Mensajes de error diferenciados por tipo (longitud, formato, semántica).
 *  9. birthDate eliminado del schema — el campo es inmutable tras el registro.
 */

// ─── Mensajes de validación de nombres ───────────────────────────────────────
const NAME_INVALID_CONSECUTIVE_MSG =
  'El nombre no puede contener 3 o más caracteres iguales consecutivos ni carecer de vocales';

// ─── Constantes de longitud de nombres ───────────────────────────────────────
const NAME_MAX_LENGTH = 100;

export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El primer nombre debe tener al menos 2 caracteres')
      .max(NAME_MAX_LENGTH, 'El primer nombre no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG })
      .optional(),
    middleName: z
      .string()
      .max(NAME_MAX_LENGTH, 'El segundo nombre no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG })
      .nullable()
      .optional(),
    lastName: z
      .string()
      .min(2, 'El primer apellido debe tener al menos 2 caracteres')
      .max(NAME_MAX_LENGTH, 'El primer apellido no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG })
      .optional(),
    secondLastName: z
      .string()
      .max(NAME_MAX_LENGTH, 'El segundo apellido no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG })
      .nullable()
      .optional(),
    // ─── birthDate: campo INMUTABLE (defecto #9) ─────────────────────────────
    // La fecha de nacimiento no es editable una vez registrado el usuario.
    // El campo no se incluye en este schema; si llega en el payload, Zod lo
    // descartará con `stripUnknown` o el controller lo ignorará.
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Número de teléfono inválido')
      .or(z.literal(''))
      .nullable()
      .optional(),
    avatarUrl: z.string().url('URL de avatar inválida').or(z.literal('')).nullable().optional(),
    monthlyIncome: z.number().positive('El ingreso mensual debe ser mayor a cero').nullable().optional(),
  })
  .refine(
    (data) =>
      data.firstName !== undefined ||
      data.middleName !== undefined ||
      data.lastName !== undefined ||
      data.secondLastName !== undefined ||
      data.phone !== undefined ||
      data.avatarUrl !== undefined ||
      data.monthlyIncome !== undefined,
    { message: 'Debe proporcionar al menos un campo para actualizar' },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Helper re-exportado para uso en tests: verifica que una fecha esté
 * dentro del rango válido (no futura, no más de 120 años atrás).
 * Se mantiene aquí como referencia de la lógica de negocio,
 * aunque birthDate ya no es editable en este endpoint.
 */
export { parseDateLocal };
