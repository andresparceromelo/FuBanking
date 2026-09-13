import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@/features/auth/schemas/auth.schemas';

const validRegister = {
  firstName: 'Ana',
  lastName: 'Garcia',
  birthDate: '1995-06-15',
  email: 'ana@example.com',
  document: '1234567890',
  monthlyIncome: 1800000,
  password: 'Segura123',
  confirmPassword: 'Segura123',
};

describe('auth.schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid credentials and normalize the email', () => {
      expect(loginSchema.parse({ email: 'ANA@EXAMPLE.COM', password: 'x' }).email).toBe(
        'ana@example.com',
      );
    });

    it('should reject bad email or empty password', () => {
      expect(() => loginSchema.parse({ email: 'bad', password: 'x' })).toThrow();
      expect(() => loginSchema.parse({ email: 'a@b.co', password: '' })).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('should accept a valid payload', () => {
      expect(registerSchema.parse(validRegister).document).toBe('1234567890');
    });

    it('should reject weak or mismatched passwords', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, password: 'short', confirmPassword: 'short' }),
      ).toThrow(/8 caracteres/);
      expect(() =>
        registerSchema.parse({ ...validRegister, confirmPassword: 'Otra999' }),
      ).toThrow(/coinciden/i);
    });

    it('should reject future birthDate and bad document/income', () => {
      expect(() => registerSchema.parse({ ...validRegister, birthDate: '2030-01-01' })).toThrow(
        /futuro/i,
      );
      expect(() => registerSchema.parse({ ...validRegister, document: '12' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, monthlyIncome: 0 })).toThrow();
    });
  });

  describe('password reset schemas', () => {
    it('should validate request and reset payloads', () => {
      expect(requestPasswordResetSchema.parse({ email: 'a@b.co' }).email).toBe('a@b.co');
      expect(() => requestPasswordResetSchema.parse({ email: 'bad' })).toThrow();

      expect(
        resetPasswordSchema.parse({ token: 't', newPassword: 'Segura123', confirmPassword: 'Segura123' })
          .token,
      ).toBe('t');
      expect(() =>
        resetPasswordSchema.parse({ token: 't', newPassword: 'Segura123', confirmPassword: 'No1' }),
      ).toThrow(/coinciden/i);
    });
  });
});
