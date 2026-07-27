import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const registerSchema = z.object({
  firstName: z.string().min(2, 'El primer nombre debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  middleName: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios').optional(),
  lastName: z.string().min(2, 'El primer apellido debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  secondLastName: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios').optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)').refine((date) => new Date(date) <= new Date(), 'La fecha no puede ser en el futuro'),
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  document: z.string().min(5, 'Documento inválido').regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números'),
  phone: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
