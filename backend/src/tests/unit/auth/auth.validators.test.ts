import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyTwoFactorSchema,
  resendTwoFactorSchema,
} from '../../../presentation/validators/auth.validators';

// ─── Constante exportada del validador ───────────────────────────────────────
const PASSWORD_MAX_LENGTH = 128;

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

    // ─── Defecto 2: Límite máximo de contraseña ─────────────────────────────

    it('should accept a password exactly at the maximum length', () => {
      const pwd = 'Abc1' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4);
      expect(() =>
        registerSchema.parse({ ...validRegister, password: pwd, confirmPassword: pwd }),
      ).not.toThrow();
    });

    it('should reject a password exceeding the maximum length', () => {
      const pwd = 'Abc1' + 'x'.repeat(PASSWORD_MAX_LENGTH - 3);
      expect(() =>
        registerSchema.parse({ ...validRegister, password: pwd, confirmPassword: pwd }),
      ).toThrow(new RegExp(`${PASSWORD_MAX_LENGTH}`));
    });

    // ─── Defecto 3: Validación semántica de nombres ──────────────────────────

    it('should reject firstName with 3+ consecutive identical characters', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, firstName: 'Joooohn' }),
      ).toThrow(/consecutivos/i);
    });

    it('should reject lastName with 3+ consecutive identical characters', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, lastName: 'Brrron' }),
      ).toThrow(/consecutivos/i);
    });

    it('should reject firstName composed only of consonants (no vowel)', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, firstName: 'Xyz' }),
      ).toThrow();
    });

    it('should reject firstName "xxxxx"', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, firstName: 'xxxxx' }),
      ).toThrow();
    });

    it('should accept a name with a valid double consonant (Lee)', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, firstName: 'Lee' }),
      ).not.toThrow();
    });

    it('should accept an optional empty middleName', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, middleName: '' }),
      ).not.toThrow();
    });

    // ─── Defecto 4: Zona horaria en fecha de nacimiento ─────────────────────

    it('should parse birthDate without UTC offset (date "1990-01-01" stays on Jan 1)', () => {
      const parsed = registerSchema.parse({ ...validRegister, birthDate: '1990-01-01' });
      expect(parsed.birthDate).toBe('1990-01-01');
    });

    it('should accept a user who turns 18 exactly today', () => {
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const birthDate = `${today.getFullYear() - 18}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      expect(() =>
        registerSchema.parse({ ...validRegister, birthDate }),
      ).not.toThrow();
    });

    it('should reject a future date regardless of timezone', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const futureStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;
      expect(() =>
        registerSchema.parse({ ...validRegister, birthDate: futureStr }),
      ).toThrow();
    });

    // ─── Defecto 5: Límites de longitud en campos generales ──────────────────

    it('should reject firstName exceeding 100 characters', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, firstName: 'a'.repeat(51) + 'b'.repeat(51) }),
      ).toThrow(/100/);
    });

    it('should reject document exceeding 20 characters', () => {
      expect(() =>
        registerSchema.parse({ ...validRegister, document: 'A'.repeat(21) }),
      ).toThrow(/20/);
    });
  });

  // ─── loginSchema ──────────────────────────────────────────────────────────

  describe('loginSchema', () => {
    it('should accept valid credentials and reject bad email or empty password', () => {
      expect(
        loginSchema.parse({ email: 'ANA@EXAMPLE.COM', password: 'x' }).email,
      ).toBe('ana@example.com');
      expect(() => loginSchema.parse({ email: 'bad', password: 'x' })).toThrow();
      expect(() => loginSchema.parse({ email: 'a@b.co', password: '' })).toThrow();
    });

    it('should reject a password exceeding the maximum length', () => {
      const overlong = 'x'.repeat(PASSWORD_MAX_LENGTH + 1);
      expect(() => loginSchema.parse({ email: 'a@b.co', password: overlong })).toThrow();
    });
  });

  // ─── password reset schemas ───────────────────────────────────────────────

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
