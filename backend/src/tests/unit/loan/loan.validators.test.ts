import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  simulateLoanSchema,
  createLoanSchema,
  loanIdParamSchema,
} from '../../../presentation/validators/loan.validators';

describe('loan.validators', () => {
  describe('simulateLoanSchema', () => {
    it('should accept a valid payload', () => {
      expect(
        simulateLoanSchema.parse({ amount: 5_000_000, installments: 12, annualRate: 24 }),
      ).toEqual({ amount: 5_000_000, installments: 12, annualRate: 24 });
    });

    it('should reject non-positive amount', () => {
      for (const amount of [0, -100]) {
        expect(() =>
          simulateLoanSchema.parse({ amount, installments: 12, annualRate: 24 }),
        ).toThrow();
      }
    });

    it('should reject installments below 1 or non-integer', () => {
      for (const installments of [0, -3, 1.5]) {
        expect(() =>
          simulateLoanSchema.parse({ amount: 5_000_000, installments, annualRate: 24 }),
        ).toThrow();
      }
    });

    it('should reject negative annualRate but accept zero', () => {
      expect(() =>
        simulateLoanSchema.parse({ amount: 5_000_000, installments: 12, annualRate: -1 }),
      ).toThrow();
      expect(
        simulateLoanSchema.parse({ amount: 5_000_000, installments: 12, annualRate: 0 }).annualRate,
      ).toBe(0);
    });
  });

  describe('createLoanSchema', () => {
    it('should accept a valid payload', () => {
      expect(
        createLoanSchema.parse({
          amount: 5_000_000,
          installments: 12,
          annualRate: 24,
          monthlyIncome: 1_800_000,
        }).monthlyIncome,
      ).toBe(1_800_000);
    });

    it('should reject non-positive monthlyIncome', () => {
      for (const monthlyIncome of [0, -500_000]) {
        expect(() =>
          createLoanSchema.parse({
            amount: 5_000_000,
            installments: 12,
            annualRate: 24,
            monthlyIncome,
          }),
        ).toThrow();
      }
    });

    it('should inherit simulate rules for amount/installments/annualRate', () => {
      expect(() =>
        createLoanSchema.parse({
          amount: -1,
          installments: 0,
          annualRate: -5,
          monthlyIncome: 1_800_000,
        }),
      ).toThrow();
    });
  });

  describe('loanIdParamSchema', () => {
    it('should accept a uuid', () => {
      const id = randomUUID();
      expect(loanIdParamSchema.parse({ id })).toEqual({ id });
    });

    it('should reject a non-uuid id', () => {
      for (const id of ['123', '', 'not-a-uuid']) {
        expect(() => loanIdParamSchema.parse({ id })).toThrow();
      }
    });
  });
});
