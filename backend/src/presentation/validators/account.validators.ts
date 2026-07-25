import { z } from 'zod';
import { AccountType } from '../../domain/entities/Account';

/**
 * Schemas de validación Zod para los endpoints de cuentas.
 *
 * Cada schema valida el body del request antes de que llegue al caso de uso.
 */

export const createAccountSchema = z.object({
  type: z.enum(
    [AccountType.AHORROS, AccountType.CORRIENTE, AccountType.NOMINA],
    { errorMap: () => ({ message: `El tipo de cuenta debe ser: ${Object.values(AccountType).join(', ')}` }) }
  ),
  // Campos opcionales — solo aplican según el tipo
  requestCheckbook: z.boolean().optional(),
  companyName: z
    .string()
    .max(150, 'El nombre de la empresa no puede superar 150 caracteres')
    .optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
