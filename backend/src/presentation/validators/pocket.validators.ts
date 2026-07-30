import { z } from 'zod';

export const createPocketSchema = z.object({
  accountId: z.string().uuid({ message: 'accountId debe ser un UUID válido' }),
  name: z.string().min(1, 'El nombre del bolsillo es obligatorio').max(150, 'El nombre del bolsillo no puede superar 150 caracteres'),
  amount: z.coerce.number().min(0, 'El monto del bolsillo no puede ser negativo'),
});

export const updatePocketSchema = z.object({
  name: z.string().min(1, 'El nombre del bolsillo no puede estar vacío').max(150, 'El nombre del bolsillo no puede superar 150 caracteres').optional(),
  amount: z.number().min(0, 'El monto del bolsillo no puede ser negativo').optional(),
}).refine((data) => data.name !== undefined || data.amount !== undefined, {
  message: 'Debes enviar al menos un campo para actualizar',
});

export const transferPocketSchema = z.object({
  fromPocketId: z.string().uuid({ message: 'fromPocketId debe ser un UUID válido' }),
  toPocketId: z.string().uuid({ message: 'toPocketId debe ser un UUID válido' }),
  amount: z.number().gt(0, 'El monto de transferencia debe ser mayor que cero'),
});
