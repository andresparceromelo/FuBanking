import { z } from 'zod';

export const simulateLoanSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a cero'),
  installments: z.number().int().min(1, 'Las cuotas deben ser al menos 1'),
  annualRate: z.number().min(0, 'La tasa debe ser mayor o igual a cero'),
});

export const createLoanSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a cero'),
  installments: z.number().int().min(1, 'Las cuotas deben ser al menos 1'),
  annualRate: z.number().min(0, 'La tasa debe ser mayor o igual a cero'),
  monthlyIncome: z.number().positive('El ingreso mensual debe ser mayor a cero'),
  documentVerified: z.boolean(),
  ageVerified: z.boolean(),
  incomeVerified: z.boolean(),
  creditHistoryVerified: z.boolean(),
});

export const loanIdParamSchema = z.object({
  id: z.string().uuid('ID de préstamo inválido'),
});

export type SimulateLoanInput = z.infer<typeof simulateLoanSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
