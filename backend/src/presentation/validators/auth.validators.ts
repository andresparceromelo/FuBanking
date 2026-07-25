import { z } from 'zod';

/**
 * Schemas de validación Zod para los endpoints de autenticación.
 *
 * Cada schema valida el body del request antes de que llegue al caso de uso.
 * Los errores de Zod son capturados por el middleware y transformados
 * en respuestas HTTP 400 con los campos específicos que fallaron.
 */

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número');

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El primer nombre debe tener al menos 2 caracteres')
      .max(100, 'El primer nombre no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
    middleName: z
      .string()
      .max(100, 'El segundo nombre no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios')
      .optional(),
    lastName: z
      .string()
      .min(2, 'El primer apellido debe tener al menos 2 caracteres')
      .max(100, 'El primer apellido no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
    secondLastName: z
      .string()
      .max(100, 'El segundo apellido no puede superar los 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios')
      .optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe estar en formato YYYY-MM-DD')
      .refine((date) => new Date(date) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro'),
    email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
    document: z
      .string()
      .min(5, 'El documento debe tener al menos 5 caracteres')
      .max(20, 'El documento no puede superar los 20 caracteres')
      .regex(/^[a-zA-Z0-9]+$/, 'El documento solo puede contener letras y números'),
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

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

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

// ── 2FA ───────────────────────────────────────────────────────────────────

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type ResendTwoFactorInput = z.infer<typeof resendTwoFactorSchema>;

