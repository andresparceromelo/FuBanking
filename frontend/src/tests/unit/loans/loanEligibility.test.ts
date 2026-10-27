import { describe, it, expect } from 'vitest';
import {
  isOfLegalAge,
  isLoanParamValid,
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  MIN_INSTALLMENTS,
  MAX_INSTALLMENTS,
  MIN_ANNUAL_RATE,
  MAX_ANNUAL_RATE,
} from '@/features/loans/utils/loanEligibility';

describe('loanEligibility — Dominio territorial Colombia (SFC)', () => {
  describe('isOfLegalAge', () => {
    it('retorna true para persona con 18 años cumplidos', () => {
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const dateStr = eighteenYearsAgo.toISOString().split('T')[0];
      expect(isOfLegalAge(dateStr)).toBe(true);
    });

    it('retorna false para menores de edad', () => {
      const today = new Date();
      const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      const dateStr = seventeenYearsAgo.toISOString().split('T')[0];
      expect(isOfLegalAge(dateStr)).toBe(false);
    });

    it('retorna false si birthDate está vacío o inválido', () => {
      expect(isOfLegalAge('')).toBe(false);
      expect(isOfLegalAge('fecha-invalida')).toBe(false);
    });
  });

  describe('isLoanParamValid', () => {
    it('retorna true para parámetros dentro del rango regulatorio', () => {
      expect(isLoanParamValid(5_000_000, 12, 18)).toEqual({ isValid: true });
      expect(isLoanParamValid(MIN_LOAN_AMOUNT, MIN_INSTALLMENTS, MIN_ANNUAL_RATE)).toEqual({ isValid: true });
      expect(isLoanParamValid(MAX_LOAN_AMOUNT, MAX_INSTALLMENTS, MAX_ANNUAL_RATE)).toEqual({ isValid: true });
    });

    it('retorna false si el monto está fuera del rango', () => {
      const low = isLoanParamValid(499_999, 12, 18);
      expect(low.isValid).toBe(false);
      expect(low.error).toContain('monto debe estar entre');

      const high = isLoanParamValid(30_000_001, 12, 18);
      expect(high.isValid).toBe(false);
      expect(high.error).toContain('monto debe estar entre');
    });

    it('retorna false si las cuotas están fuera de 3 a 60', () => {
      const low = isLoanParamValid(5_000_000, 2, 18);
      expect(low.isValid).toBe(false);
      expect(low.error).toContain('plazo debe estar entre');

      const high = isLoanParamValid(5_000_000, 61, 18);
      expect(high.isValid).toBe(false);
      expect(high.error).toContain('plazo debe estar entre');
    });

    it('retorna false si la tasa está fuera de 10% a 32%', () => {
      const low = isLoanParamValid(5_000_000, 12, 9);
      expect(low.isValid).toBe(false);
      expect(low.error).toContain('tasa debe estar entre');

      const high = isLoanParamValid(5_000_000, 12, 33);
      expect(high.isValid).toBe(false);
      expect(high.error).toContain('tasa debe estar entre');
    });
  });
});
