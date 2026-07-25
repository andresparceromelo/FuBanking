import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'El primer nombre debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios').optional(),
  middleName: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios').nullable().optional(),
  lastName: z.string().min(2, 'El primer apellido debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios').optional(),
  secondLastName: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios').nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)').refine((date) => !date || new Date(date) <= new Date(), 'La fecha no puede ser en el futuro').or(z.literal('')).nullable().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Número de teléfono inválido')
    .or(z.literal(''))
    .nullable()
    .optional(),
  avatarUrl: z.string().url('URL de avatar inválida').or(z.literal('')).nullable().optional(),
}).refine(
  (data) =>
    data.firstName !== undefined ||
    data.middleName !== undefined ||
    data.lastName !== undefined ||
    data.secondLastName !== undefined ||
    data.birthDate !== undefined ||
    data.phone !== undefined ||
    data.avatarUrl !== undefined,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
