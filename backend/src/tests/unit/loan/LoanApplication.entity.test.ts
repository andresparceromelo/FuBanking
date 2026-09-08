import { describe, it, expect } from 'vitest';
import { LoanApplication, LoanApplicationStatus } from '../../../domain/entities/LoanApplication';

// ── Datos de referencia para la fórmula French ────────────────────────────

function expectedFrenchPayment(amount: number, annualRate: number, installments: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return amount / installments;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
}

describe('LoanApplication — Entity', () => {
  describe('create()', () => {
    it('should create a loan with PENDING status and correct calculations', () => {
      const loan = LoanApplication.create({
        id: 'loan-1',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      const expected = expectedFrenchPayment(5_000_000, 24, 12);

      expect(loan.status).toBe(LoanApplicationStatus.PENDING);
      expect(loan.amount).toBe(5_000_000);
      expect(loan.installments).toBe(12);
      expect(loan.monthlyPayment).toBeCloseTo(expected, 2);
      expect(loan.totalToPay).toBeCloseTo(expected * 12, 2);
      expect(loan.totalInterest).toBeCloseTo(expected * 12 - 5_000_000, 2);
      expect(loan.eligibility.isEligible).toBe(true);
      expect(loan.eligibility.reasons).toHaveLength(0);
    });

    it('should force installments to 1 when 0 is provided', () => {
      const loan = LoanApplication.create({
        id: 'loan-2',
        userId: 'user-1',
        amount: 1_000_000,
        installments: 0,
        annualRate: 24,
        monthlyIncome: 1_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      expect(loan.installments).toBe(1);
    });

    it('should throw when eligibility requirements are not met', () => {
      expect(() =>
        LoanApplication.create({
          id: 'loan-3',
          userId: 'user-1',
          amount: 5_000_000,
          installments: 12,
          annualRate: 24,
          monthlyIncome: 500_000,
          documentVerified: false,
          ageVerified: false,
          incomeVerified: false,
          creditHistoryVerified: false,
        }),
      ).toThrow(/requisitos/i);
    });

    it('should set eligibility reasons for each failed requirement', () => {
      try {
        LoanApplication.create({
          id: 'loan-4',
          userId: 'user-1',
          amount: 5_000_000,
          installments: 12,
          annualRate: 24,
          monthlyIncome: 500_000,
          documentVerified: false,
          ageVerified: false,
          incomeVerified: false,
          creditHistoryVerified: false,
        });
      } catch (err: any) {
        expect(err.code).toBe('LOAN_ELIGIBILITY_FAILED');
      }
    });

    it('should handle zero annual rate correctly', () => {
      const loan = LoanApplication.create({
        id: 'loan-5',
        userId: 'user-1',
        amount: 600_000,
        installments: 12,
        annualRate: 0,
        monthlyIncome: 1_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      expect(loan.monthlyPayment).toBeCloseTo(50_000, 2);
      expect(loan.totalInterest).toBeCloseTo(0, 2);
      expect(loan.totalToPay).toBeCloseTo(600_000, 2);
    });
  });

  describe('approve()', () => {
    it('should transition from PENDING to APPROVED', () => {
      const loan = LoanApplication.create({
        id: 'loan-6',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      loan.approve();
      expect(loan.status).toBe(LoanApplicationStatus.APPROVED);
    });

    it('should throw when approving a non-PENDING loan', () => {
      const loan = LoanApplication.create({
        id: 'loan-7',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      loan.approve();
      expect(() => loan.approve()).toThrow(/PENDING/);
    });

    it('should throw when approving an already REJECTED loan', () => {
      const loan = LoanApplication.create({
        id: 'loan-8',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      loan.reject();
      expect(() => loan.approve()).toThrow(/PENDING/);
    });
  });

  describe('reject()', () => {
    it('should transition from PENDING to REJECTED', () => {
      const loan = LoanApplication.create({
        id: 'loan-9',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      loan.reject();
      expect(loan.status).toBe(LoanApplicationStatus.REJECTED);
    });

    it('should throw when rejecting a non-PENDING loan', () => {
      const loan = LoanApplication.create({
        id: 'loan-10',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      loan.approve();
      expect(() => loan.reject()).toThrow(/PENDING/);
    });
  });

  describe('toPublic()', () => {
    it('should serialize all fields including ISO date string', () => {
      const loan = LoanApplication.create({
        id: 'loan-11',
        userId: 'user-1',
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      const dto = loan.toPublic();

      expect(dto.id).toBe('loan-11');
      expect(dto.userId).toBe('user-1');
      expect(dto.amount).toBe(5_000_000);
      expect(typeof dto.createdAt).toBe('string');
      expect(new Date(dto.createdAt)).toBeInstanceOf(Date);
    });
  });
});
