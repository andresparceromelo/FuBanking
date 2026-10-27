import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  simulateLoanSchema,
  createLoanSchema,
  loanIdParamSchema,
} from '../../../presentation/validators/loan.validators';

describe('loan.validators — Restricciones Territoriales Colombia (SFC)', () => {
  describe('simulateLoanSchema', () => {
    it('debe aceptar montos y plazos dentro del rango colombiano permitido', () => {
      expect(
        simulateLoanSchema.parse({ amount: 5_000_000, installments: 12, annualRate: 18 }),
      ).toEqual({ amount: 5_000_000, installments: 12, annualRate: 18 });

      // Límites extremos permitidos: $500.000 a $30.000.000 COP, 3 a 60 cuotas, 10% a 32% EA
      expect(
        simulateLoanSchema.parse({ amount: 500_000, installments: 3, annualRate: 10 }),
      ).toEqual({ amount: 500_000, installments: 3, annualRate: 10 });

      expect(
        simulateLoanSchema.parse({ amount: 30_000_000, installments: 60, annualRate: 32 }),
      ).toEqual({ amount: 30_000_000, installments: 60, annualRate: 32 });
    });

    it('debe rechazar montos inferiores a $500.000 COP o superiores a $30.000.000 COP', () => {
      for (const amount of [0, -100, 499_999, 30_000_001]) {
        expect(() =>
          simulateLoanSchema.parse({ amount, installments: 12, annualRate: 18 }),
        ).toThrow();
      }
    });

    it('debe rechazar plazos inferiores a 3 meses, superiores a 60 meses o no enteros', () => {
      for (const installments of [0, 1, 2, 61, 100, 12.5]) {
        expect(() =>
          simulateLoanSchema.parse({ amount: 5_000_000, installments, annualRate: 18 }),
        ).toThrow();
      }
    });

    it('debe rechazar tasas fuera del rango regulado (menor a 10% o superior a tasa de usura 32%)', () => {
      for (const annualRate of [-5, 0, 9.9, 32.1, 40]) {
        expect(() =>
          simulateLoanSchema.parse({ amount: 5_000_000, installments: 12, annualRate }),
        ).toThrow();
      }
    });
  });

  describe('createLoanSchema', () => {
    it('debe aceptar payload válido con ingreso mensual positivo', () => {
      expect(
        createLoanSchema.parse({
          amount: 5_000_000,
          installments: 12,
          annualRate: 18,
          monthlyIncome: 1_800_000,
        }).monthlyIncome,
      ).toBe(1_800_000);
    });

    it('debe rechazar ingreso mensual no positivo', () => {
      for (const monthlyIncome of [0, -500_000]) {
        expect(() =>
          createLoanSchema.parse({
            amount: 5_000_000,
            installments: 12,
            annualRate: 18,
            monthlyIncome,
          }),
        ).toThrow();
      }
    });

    it('debe heredar las reglas de monto, cuotas y tasa de simulación', () => {
      expect(() =>
        createLoanSchema.parse({
          amount: 200_000, // Menor al mínimo de 500k
          installments: 1, // Menor a 3 cuotas
          annualRate: 5,   // Menor al 10%
          monthlyIncome: 1_800_000,
        }),
      ).toThrow();
    });
  });

  describe('loanIdParamSchema', () => {
    it('debe aceptar un uuid válido', () => {
      const id = randomUUID();
      expect(loanIdParamSchema.parse({ id })).toEqual({ id });
    });

    it('debe rechazar valores que no son uuid', () => {
      for (const id of ['123', '', 'not-a-uuid']) {
        expect(() => loanIdParamSchema.parse({ id })).toThrow();
      }
    });
  });
});
