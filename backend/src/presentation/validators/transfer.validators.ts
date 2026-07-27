import { z } from 'zod';

/**
 * Schemas de validacion Zod para el modulo de Transferencias.
 */

export const createTransferSchema = z.object({
  senderAccountId: z
    .string({ message: 'La cuenta de origen es requerida' })
    .uuid('El ID de la cuenta de origen no es valido'),
  receiverAccountNumber: z
    .string({ message: 'El numero de cuenta del destinatario es requerido' })
    .min(1, 'El numero de cuenta del destinatario es requerido')
    .trim(),
  amount: z
    .number({ message: 'El monto debe ser un numero valido' })
    .positive('El monto debe ser mayor a cero')
    .finite('El monto debe ser un numero valido'),
  description: z
    .string()
    .max(255, 'La descripcion no puede superar los 255 caracteres')
    .optional()
    .nullable(),
});

export const searchByAccountNumberSchema = z.object({
  accountNumber: z.string().min(1, 'El numero de cuenta es requerido').trim(),
});

export const searchByEmailSchema = z.object({
  email: z.string().email('Correo electronico invalido').toLowerCase().trim(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
