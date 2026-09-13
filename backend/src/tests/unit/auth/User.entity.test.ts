import { describe, it, expect } from 'vitest';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';

function buildUser(overrides: Partial<{ birthDate: Date; monthlyIncome: number | null; role: string }> = {}): User {
  return User.create({
    id: 'user-1',
    email: new Email('ana@example.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    lastName: 'Garcia',
    birthDate: overrides.birthDate ?? new Date(1995, 0, 1),
    passwordHash: 'hash',
    monthlyIncome: 'monthlyIncome' in overrides ? (overrides.monthlyIncome as number | null) : 1800000,
    documentVerified: true,
  });
}

describe('User — Entity (auth scope)', () => {
  describe('isOfLegalAge', () => {
    it('should return true for an adult', () => {
      expect(buildUser().isOfLegalAge()).toBe(true);
    });

    it('should return false for a minor', () => {
      expect(buildUser({ birthDate: new Date('2020-01-01') }).isOfLegalAge()).toBe(false);
    });

    it('should handle birthdays later this year', () => {
      const t = new Date();
      const birth = new Date(t.getFullYear() - 20, t.getMonth() + 1, 15);
      const user = buildUser({ birthDate: birth });

      expect(user.isOfLegalAge()).toBe(true);
    });
  });

  describe('isIncomeValidated', () => {
    it('should require a positive income', () => {
      expect(buildUser().isIncomeValidated()).toBe(true);
      expect(buildUser({ monthlyIncome: 0 }).isIncomeValidated()).toBe(false);
      expect(buildUser({ monthlyIncome: null }).isIncomeValidated()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should detect the admin role', () => {
      expect(buildUser().isAdmin()).toBe(false);

      const admin = new User({
        id: 'admin-1',
        email: new Email('admin@example.com'),
        document: new Document('9999999999'),
        firstName: 'Admin',
        middleName: null,
        lastName: 'Root',
        secondLastName: null,
        birthDate: new Date('1990-01-01'),
        phone: null,
        avatarUrl: null,
        passwordHash: 'hash',
        monthlyIncome: null,
        documentVerified: false,
        documentVerifiedAt: null,
        isActive: true,
        twoFactorEnabled: false,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(admin.isAdmin()).toBe(true);
    });
  });

  describe('mutators', () => {
    it('should update profile fields selectively', () => {
      const user = buildUser();

      user.updateProfile({ firstName: 'Maria', middleName: 'L', lastName: 'Perez', secondLastName: 'G', birthDate: new Date(1990, 5, 5), phone: '+57', avatarUrl: 'http://x/y.png', monthlyIncome: 5 });
      user.updatePasswordHash('new-hash');
      user.markDocumentVerified();
      user.deactivate();
      user.enableTwoFactor();
      user.disableTwoFactor();

      expect(user.firstName).toBe('Maria');
      expect(user.getPasswordHash()).toBe('new-hash');
      expect(user.documentVerified).toBe(true);
      expect(user.isActive).toBe(false);
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.fullName).toContain('Maria');
    });

    it('should keep fields untouched when not provided', () => {
      const user = buildUser();
      user.updateProfile({});

      expect(user.firstName).toBe('Ana');
      expect(user.phone).toBeNull();
    });
  });

  describe('missing birthDate', () => {
    function birthless(): User {
      return new User({
        id: 'u9',
        email: new Email('x@y.co'),
        document: new Document('1234567890'),
        firstName: 'X',
        middleName: null,
        lastName: 'Y',
        secondLastName: null,
        birthDate: undefined as unknown as Date,
        phone: null,
        avatarUrl: null,
        passwordHash: 'h',
        monthlyIncome: null,
        documentVerified: false,
        documentVerifiedAt: null,
        isActive: true,
        twoFactorEnabled: false,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it('should age-fail and serialize empty birthDate', () => {
      const user = birthless();

      expect(user.isOfLegalAge()).toBe(false);
      expect(user.toPublic().birthDate).toBe('');
    });
  });

  describe('timestamps and verification date', () => {
    it('should expose createdAt/updatedAt and verified-at date', () => {
      const user = buildUser();
      user.markDocumentVerified();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      const dto = user.toPublic();
      expect(dto.documentVerified).toBe(true);
      expect(dto.documentVerifiedAt).not.toBeNull();
    });
  });

  describe('toPublic', () => {
    it('should omit the password hash and format the date', () => {
      const dto = buildUser().toPublic();

      expect(dto).not.toHaveProperty('passwordHash');
      expect(dto).not.toHaveProperty('password');
      expect(dto.email).toBe('ana@example.com');
      expect(dto.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dto.role).toBe('user');
    });
  });
});
