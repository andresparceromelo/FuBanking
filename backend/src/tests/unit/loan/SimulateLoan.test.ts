import { describe, it, expect } from 'vitest';
import { SimulateLoan } from '../../../application/use-cases/loan/SimulateLoan';

describe('SimulateLoan', () => {
  const useCase = new SimulateLoan();

  describe('Happy path — tasa positiva', () => {
    it('should calculate monthly payment, total and interest correctly', async () => {
      const result = await useCase.execute({
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
      });

      expect(result.amount).toBe(5_000_000);
      expect(result.installments).toBe(12);
      expect(result.annualRate).toBe(24);
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalToPay).toBeGreaterThan(result.amount);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalToPay).toBeCloseTo(result.monthlyPayment * 12, 2);
      expect(result.totalInterest).toBeCloseTo(result.totalToPay - result.amount, 2);
    });
  });

  describe('Tasa cero', () => {
    it('should return equal payments with zero interest', async () => {
      const result = await useCase.execute({
        amount: 600_000,
        installments: 6,
        annualRate: 0,
      });

      expect(result.monthlyPayment).toBeCloseTo(100_000, 2);
      expect(result.totalInterest).toBeCloseTo(0, 2);
      expect(result.totalToPay).toBeCloseTo(600_000, 2);
    });
  });

  describe('Valores límite', () => {
    it('should normalize installments to 1 when 0 is provided', async () => {
      const result = await useCase.execute({
        amount: 1_000_000,
        installments: 0,
        annualRate: 24,
      });

      expect(result.installments).toBe(1);
      expect(result.totalToPay).toBeCloseTo(result.monthlyPayment, 2);
    });

    it('should handle 1 installment correctly', async () => {
      const result = await useCase.execute({
        amount: 2_000_000,
        installments: 1,
        annualRate: 24,
      });

      expect(result.installments).toBe(1);
      expect(result.totalToPay).toBeGreaterThan(result.amount);
    });

    it('should handle large amount (100M) without precision issues', async () => {
      const result = await useCase.execute({
        amount: 100_000_000,
        installments: 60,
        annualRate: 18,
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(Number.isFinite(result.monthlyPayment)).toBe(true);
      expect(Number.isFinite(result.totalToPay)).toBe(true);
    });
  });

  describe('Fórmula French — verificación contra valor conocido', () => {
    it('should match manual calculation for a known scenario', async () => {
      const amount = 10_000_000;
      const installments = 24;
      const annualRate = 30;
      const monthlyRate = annualRate / 100 / 12;

      const expectedMonthly =
        (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));

      const result = await useCase.execute({ amount, installments, annualRate });

      expect(result.monthlyPayment).toBeCloseTo(expectedMonthly, 4);
    });
  });
});
