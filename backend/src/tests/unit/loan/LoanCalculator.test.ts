import { describe, it, expect } from 'vitest';
import { LoanCalculator } from '../../../domain/services/LoanCalculator';

describe('LoanCalculator (Domain Service)', () => {
  it('should calculate fixed monthly installment correctly with interest', () => {
    // Arrange: 1.000.000 COP a 12 meses al 12% EA
    const input = {
      amount: 1_000_000,
      installments: 12,
      annualRate: 12,
    };

    // Act
    const result = LoanCalculator.calculate(input);

    // Assert
    // monthlyRate = 12 / 100 / 12 = 0.01 (1% mensual)
    expect(result.monthlyRate).toBeCloseTo(0.01, 5);
    expect(result.installments).toBe(12);
    // Cuota fija: 1.000.000 * 0.01 / (1 - (1.01)^-12) ≈ 88.848,78 COP
    expect(result.monthlyPayment).toBeCloseTo(88848.788, 1);
    expect(result.totalToPay).toBeCloseTo(88848.788 * 12, 1);
    expect(result.totalInterest).toBeCloseTo(result.totalToPay - 1_000_000, 1);
  });

  it('should handle 0% annual rate by simply dividing amount by installments', () => {
    // Arrange: sin intereses
    const input = {
      amount: 600_000,
      installments: 6,
      annualRate: 0,
    };

    // Act
    const result = LoanCalculator.calculate(input);

    // Assert
    expect(result.monthlyPayment).toBe(100_000);
    expect(result.totalToPay).toBe(600_000);
    expect(result.totalInterest).toBe(0);
  });

  it('should enforce at least 1 installment if 0 or negative is passed', () => {
    // Arrange
    const input = {
      amount: 500_000,
      installments: 0,
      annualRate: 0,
    };

    // Act
    const result = LoanCalculator.calculate(input);

    // Assert
    expect(result.installments).toBe(1);
    expect(result.monthlyPayment).toBe(500_000);
  });
});
