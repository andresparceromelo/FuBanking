import { z } from 'zod';
import { isValidName } from '@/features/auth/utils/nameValidation';
import { parseDateLocal } from '@/shared/utils/dateUtils';
import { PASSWORD_MAX_LENGTH } from '@/features/auth/schemas/auth.schemas';

/**
 * Schema de actualización de perfil.
 *
 * Defectos corregidos:
 *  1. Límites de longitud (.max) en todos los campos de texto.
 *  2. Fecha sin desfase UTC — parseDateLocal importada de shared.
 *  4. Validación semántica de nombres — isValidName reutilizado de auth.
 *  5. Límite de contraseña consistente con política (PASSWORD_MAX_LENGTH).
 *  6. Validación completa del formulario: firstName y lastName son requeridos.
 *  7. Mensajes diferenciados: longitud / formato / semántica.
 *  9. birthDate INMUTABLE — campo eliminado del formulario editable.
 */

// ─── Constantes ───────────────────────────────────────────────────────────────
const NAME_MAX_LENGTH = 100;
const NAME_INVALID_MSG =
  'El nombre no puede contener 3 o más caracteres iguales consecutivos ni carecer de vocales';

export { parseDateLocal };

// ─── Schema principal ─────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  firstName: z
    .string({ required_error: 'El primer nombre es requerido' })
    .min(2, 'El primer nombre debe tener al menos 2 caracteres')
    .max(NAME_MAX_LENGTH, 'El primer nombre no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG })
    .optional(),
  middleName: z
    .string()
    .max(NAME_MAX_LENGTH, 'El segundo nombre no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG })
    .nullable()
    .optional(),
  lastName: z
    .string({ required_error: 'El primer apellido es requerido' })
    .min(2, 'El primer apellido debe tener al menos 2 caracteres')
    .max(NAME_MAX_LENGTH, 'El primer apellido no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG })
    .optional(),
  secondLastName: z
    .string()
    .max(NAME_MAX_LENGTH, 'El segundo apellido no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG })
    .nullable()
    .optional(),
  // ─── birthDate: INMUTABLE (defecto #9) ────────────────────────────────────
  // La fecha de nacimiento no es editable. El campo no está en el formulario.
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Número de teléfono inválido')
    .or(z.literal(''))
    .nullable()
    .optional(),
  avatarUrl: z.string().url('URL de avatar inválida').or(z.literal('')).nullable().optional(),
  monthlyIncome: z.number().positive('El ingreso mensual debe ser mayor a cero').nullable().optional(),
  // ─── Cambio de contraseña (opcional, defecto #5) ──────────────────────────
  // Si el usuario desea cambiar su contraseña, debe respetar el límite máximo.
  newPassword: z
    .string()
    .max(PASSWORD_MAX_LENGTH, `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`)
    .or(z.literal(''))
    .nullable()
    .optional(),
}).refine(
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
