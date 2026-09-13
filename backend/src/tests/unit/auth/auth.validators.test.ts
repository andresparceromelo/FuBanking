import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyTwoFactorSchema,
  resendTwoFactorSchema,
} from '../../../presentation/validators/auth.validators';

const validRegister = {
  firstName: 'Ana',
  lastName: 'Garcia',
  email: 'ana@example.com',
  document: '1234567890',
  birthDate: '1995-06-15',
  monthlyIncome: 1800000,
  password: 'Segura123',
  confirmPassword: 'Segura123',
};

describe('auth.validators', () => {
  describe('registerSchema', () => {
    it('should accept a valid payload', () => {
      expect(registerSchema.parse(validRegister).email).toBe('ana@example.com');
    });

    it('should reject short names, bad email and weak passwords', () => {
      expect(() => registerSchema.parse({ ...validRegister, firstName: 'A' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, email: 'bad' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, password: 'short', confirmPassword: 'short' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, password: 'sinmayuscula1', confirmPassword: 'sinmayuscula1' })).toThrow();
    });

    it('should reject mismatched passwords', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, confirmPassword: 'Otra999' }),
      ).toThrow(/coinciden/i);
    });

    it('should reject future birthDate, minors and bad documents', () => {
      expect(() => registerSchema.parse({ ...validRegister, birthDate: '2030-01-01' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, birthDate: '2020-01-01' })).toThrow(/18/);
      const t = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const nextMonth = `${t.getFullYear() - 10}-${pad(((t.getMonth() + 1) % 12) + 1)}-15`;
      expect(() => registerSchema.parse({ ...validRegister, birthDate: nextMonth })).toThrow(/18/);
      const sameMonth = `${t.getFullYear() - 10}-${pad(t.getMonth() + 1)}-${pad(Math.min(t.getDate() + 1, 28))}`;
      expect(() => registerSchema.parse({ ...validRegister, birthDate: sameMonth })).toThrow(/18/);
      expect(() => registerSchema.parse({ ...validRegister, document: '123' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, document: 'ABC!!!' })).toThrow();
      expect(() => registerSchema.parse({ ...validRegister, monthlyIncome: 0 })).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should accept valid credentials and reject bad email or empty password', () => {
      expect(
        loginSchema.parse({ email: 'ANA@EXAMPLE.COM', password: 'x' }).email,
      ).toBe('ana@example.com');
      expect(() => loginSchema.parse({ email: 'bad', password: 'x' })).toThrow();
      expect(() => loginSchema.parse({ email: 'a@b.co', password: '' })).toThrow();
    });
  });

  describe('password reset schemas', () => {
    it('should validate request, reset, verify and resend payloads', () => {
      expect(requestPasswordResetSchema.parse({ email: 'a@b.co' }).email).toBe('a@b.co');
      expect(() => requestPasswordResetSchema.parse({ email: 'bad' })).toThrow();

      expect(
        resetPasswordSchema.parse({ token: 't', newPassword: 'Segura123', confirmPassword: 'Segura123' }).token,
      ).toBe('t');
      expect(() =>
        resetPasswordSchema.parse({ token: 't', newPassword: 'Segura123', confirmPassword: 'Otra1' }),
      ).toThrow(/coinciden/i);
      expect(() =>
        resetPasswordSchema.parse({ token: '', newPassword: 'Segura123', confirmPassword: 'Segura123' }),
      ).toThrow();

      expect(verifyTwoFactorSchema.parse({ temporaryToken: 't', code: '123456' }).code).toBe('123456');
      expect(() => verifyTwoFactorSchema.parse({ temporaryToken: 't', code: '12345' })).toThrow();
      expect(() => verifyTwoFactorSchema.parse({ temporaryToken: 't', code: 'abcdef' })).toThrow();
      expect(() => verifyTwoFactorSchema.parse({ temporaryToken: '', code: '123456' })).toThrow();

      expect(resendTwoFactorSchema.parse({ temporaryToken: 't' }).temporaryToken).toBe('t');
      expect(() => resendTwoFactorSchema.parse({ temporaryToken: '' })).toThrow();
    });
  });
});
