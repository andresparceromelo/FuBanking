import { z } from 'zod';
import { isValidName } from '../../shared/utils/nameValidation';
import { isValidEmail } from '../../shared/utils/emailValidation';
import { parseDateLocal } from '../../shared/utils/dateUtils';

/**
 * Schemas de validación Zod para los endpoints de autenticación.
 *
 * Cada schema valida el body del request antes de que llegue al caso de uso.
 * Los errores de Zod son capturados por el middleware y transformados
 * en respuestas HTTP 400 con los campos específicos que fallaron.
 */

// ─── Constantes de política de contraseña ────────────────────────────────────
/** Longitud mínima de contraseña según política. */
const PASSWORD_MIN_LENGTH = 8;
/** Longitud máxima de contraseña según política (previene hash-flooding / DoS). */
const PASSWORD_MAX_LENGTH = 128;

// ─── Mensajes de validación de nombres ───────────────────────────────────────
const NAME_INVALID_CONSECUTIVE_MSG =
  'El nombre no puede contener 3 o más caracteres iguales consecutivos';

// ─── Schema de contraseña compartido ─────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número');

// ─── Schema de registro ───────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El primer nombre debe tener al menos 2 caracteres')
      .max(100, 'El primer nombre no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG }),
    middleName: z
      .string()
      .max(100, 'El segundo nombre no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG })
      .optional(),
    lastName: z
      .string()
      .min(2, 'El primer apellido debe tener al menos 2 caracteres')
      .max(100, 'El primer apellido no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG }),
    secondLastName: z
      .string()
      .max(100, 'El segundo apellido no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
      .refine(isValidName, { message: NAME_INVALID_CONSECUTIVE_MSG })
      .optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe estar en formato YYYY-MM-DD')
      .refine(
        (date) => parseDateLocal(date) <= new Date(),
        'La fecha de nacimiento no puede ser en el futuro',
      )
      .refine((date) => {
        const birth = parseDateLocal(date);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age >= 18;
      }, 'Debes ser mayor de 18 años para registrarte'),
    email: z.string()
      .email('Correo electrónico inválido')
      .max(254, 'El correo no puede superar los 254 caracteres')
      .toLowerCase()
      .trim(),
    document: z
      .string()
      .min(5, 'El documento debe tener al menos 5 caracteres')
      .max(20, 'El documento no puede superar los 20 caracteres')
      .regex(/^[a-zA-Z0-9]+$/, 'El documento solo puede contener letras y números'),
    monthlyIncome: z.number().positive('El ingreso mensual debe ser mayor a cero'),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Número de teléfono inválido')
      .or(z.literal(''))
      .optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// ─── Schema de login ──────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'El correo electrónico es requerido')
    .max(100, 'El correo electrónico no puede superar los 100 caracteres')
    .refine(isValidEmail, 'Correo electrónico inválido')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'La contraseña es requerida')
    .max(PASSWORD_MAX_LENGTH, `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`),
  rememberMe: z.boolean().optional(),
});

// ─── Schemas de recuperación de contraseña ───────────────────────────────────
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'El token es requerido'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/** Schema para el query param del endpoint de verificación de token. */
export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
});

// ─── Schemas de 2FA ───────────────────────────────────────────────────────────
export const verifyTwoFactorSchema = z.object({
  temporaryToken: z.string().min(1, 'El token temporal es requerido'),
  code: z
    .string()
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo dígitos'),
});

export const resendTwoFactorSchema = z.object({
  temporaryToken: z.string().min(1, 'El token temporal es requerido'),
});

// ─── Tipos inferidos ──────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type ResendTwoFactorInput = z.infer<typeof resendTwoFactorSchema>;
