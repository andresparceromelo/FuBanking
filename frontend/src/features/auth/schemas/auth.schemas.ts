import { z } from 'zod';
import { isValidName } from '../utils/nameValidation';
import { isValidEmail } from '../utils/emailValidation';
import { parseDateLocal } from '@/shared/utils/dateUtils';

// ─── Constantes de política de contraseña ────────────────────────────────────
/** Longitud mínima de contraseña según política. */
export const PASSWORD_MIN_LENGTH = 8;
/** Longitud máxima de contraseña según política (previene hash-flooding / DoS). */
export const PASSWORD_MAX_LENGTH = 128;

// ─── Mensajes de validación de nombres ───────────────────────────────────────
const NAME_INVALID_MSG =
  'El nombre no puede contener 3 o más caracteres iguales consecutivos ni carecer de vocales';

// ─── Schema de contraseña compartido ─────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

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
    .max(64, 'La contraseña no puede superar los 64 caracteres'),
  rememberMe: z.boolean().optional(),
});

// ─── Schema de registro ───────────────────────────────────────────────────────
export const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'El primer nombre debe tener al menos 2 caracteres')
    .max(100, 'El primer nombre no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG }),
  middleName: z.string()
    .max(100, 'El segundo nombre no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG })
    .optional(),
  lastName: z.string()
    .min(2, 'El primer apellido debe tener al menos 2 caracteres')
    .max(100, 'El primer apellido no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG }),
  secondLastName: z.string()
    .max(100, 'El segundo apellido no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']*$/, 'Solo se permiten letras, espacios, guiones y apóstrofes')
    .refine(isValidName, { message: NAME_INVALID_MSG })
    .optional(),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)')
    .refine(
      (date) => parseDateLocal(date) <= new Date(),
      'La fecha no puede ser en el futuro',
    ),
  email: z.string()
    .email('Correo electrónico inválido')
    .max(254, 'El correo no puede superar los 254 caracteres')
    .toLowerCase()
    .trim(),
  document: z.string()
    .min(5, 'Documento inválido')
    .max(20, 'El documento no puede superar los 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números'),
  monthlyIncome: z.number().positive('El ingreso mensual debe ser mayor a cero').optional(),
  phone: z.string()
    .max(20, 'El teléfono no puede superar los 20 caracteres')
    .optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ─── Schemas de recuperación de contraseña ───────────────────────────────────
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ─── Tipos inferidos ──────────────────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
