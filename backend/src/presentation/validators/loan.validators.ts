import { z } from 'zod';

export const simulateLoanSchema = z.object({
  amount: z
    .number()
    .min(500_000, 'El monto mínimo de crédito es de $500.000 COP')
    .max(30_000_000, 'El monto máximo de crédito es de $30.000.000 COP'),
  installments: z
    .number()
    .int('El número de cuotas debe ser un número entero')
    .min(3, 'El plazo mínimo es de 3 meses')
    .max(60, 'El plazo máximo es de 60 meses'),
  annualRate: z
    .number()
    .min(10, 'La tasa mínima es del 10% E.A.')
    .max(32, 'La tasa máxima permitida por regulación SFC es del 32% E.A.'),
});

export const createLoanSchema = z.object({
  amount: z
    .number()
    .min(500_000, 'El monto mínimo de crédito es de $500.000 COP')
    .max(30_000_000, 'El monto máximo de crédito es de $30.000.000 COP'),
  installments: z
    .number()
    .int('El número de cuotas debe ser un número entero')
    .min(3, 'El plazo mínimo es de 3 meses')
    .max(60, 'El plazo máximo es de 60 meses'),
  annualRate: z
    .number()
    .min(10, 'La tasa mínima es del 10% E.A.')
    .max(32, 'La tasa máxima permitida por regulación SFC es del 32% E.A.'),
  monthlyIncome: z.number().positive('El ingreso mensual debe ser mayor a cero'),
});

export const loanIdParamSchema = z.object({
  id: z.uuid('ID de préstamo inválido'),
});

export type SimulateLoanInput = z.infer<typeof simulateLoanSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
