import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateTwoFactorCode } from '../../../application/use-cases/auth/GenerateTwoFactorCode';
import { EnableTwoFactor } from '../../../application/use-cases/auth/EnableTwoFactor';
import { DisableTwoFactor } from '../../../application/use-cases/auth/DisableTwoFactor';
import { ResendTwoFactorCode } from '../../../application/use-cases/auth/ResendTwoFactorCode';
import { LogoutUser } from '../../../application/use-cases/auth/LogoutUser';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../../fakes/InMemoryVerificationCodeRepository';
import { FakeTokenService } from '../../fakes/FakeTokenService';
import { FakePasswordService } from '../../fakes/FakePasswordService';
import { FakeEmailService } from '../../fakes/FakeEmailService';

function buildUser(twoFactorEnabled = false): User {
  return new User({
    id: 'user-2fa-01',
    email: new Email('dosfa@example.com'),
    document: new Document('1234567890'),
    firstName: 'Dos',
    middleName: null,
    lastName: 'Fa',
    secondLastName: null,
    birthDate: new Date('1995-01-01'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_x',
    monthlyIncome: 1_800_000,
    documentVerified: true,
    documentVerifiedAt: null,
    isActive: true,
    twoFactorEnabled,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('Gestión 2FA', () => {
  let userRepository: InMemoryUserRepository;
  let verificationCodeRepository: InMemoryVerificationCodeRepository;
  let tokenService: FakeTokenService;
  let passwordService: FakePasswordService;
  let emailService: FakeEmailService;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    verificationCodeRepository = new InMemoryVerificationCodeRepository();
    tokenService = new FakeTokenService();
    passwordService = new FakePasswordService();
    emailService = new FakeEmailService();
  });

  describe('GenerateTwoFactorCode', () => {
    it('should generate a 6-digit code, persist its hash and email it', async () => {
      const useCase = new GenerateTwoFactorCode(
        verificationCodeRepository,
        emailService,
        tokenService,
        passwordService,
      );

      const result = await useCase.execute('user-2fa-01', 'dosfa@example.com');

      expect(result.temporaryToken).toContain('fake.');
      expect(result.maskedEmail).toContain('***');
      expect(emailService.sentTwoFactorCodes).toHaveLength(1);
      expect(emailService.sentTwoFactorCodes[0]!.code).toMatch(/^\d{6}$/);
      const latest = await verificationCodeRepository.findLatestByUserId('user-2fa-01');
      expect(latest).not.toBeNull();
    });

    it('should invalidate previous codes', async () => {
      const useCase = new GenerateTwoFactorCode(
        verificationCodeRepository,
        emailService,
        tokenService,
        passwordService,
      );

      await useCase.execute('user-2fa-01', 'dosfa@example.com');
      await useCase.execute('user-2fa-01', 'dosfa@example.com');

      expect(verificationCodeRepository.all()).toHaveLength(1);
      expect(emailService.sentTwoFactorCodes).toHaveLength(2);
    });
  });

  describe('EnableTwoFactor / DisableTwoFactor', () => {
    it('should enable 2FA for a user without it', async () => {
      userRepository.seed(buildUser(false));
      const useCase = new EnableTwoFactor(userRepository);

      const result = await useCase.execute('user-2fa-01');

      expect(result.twoFactorEnabled).toBe(true);
    });

    it('should throw when enabling for a missing user or already enabled', async () => {
      const useCase = new EnableTwoFactor(userRepository);

      await expect(useCase.execute('ghost')).rejects.toThrow(/no encontrado/i);

      userRepository.seed(buildUser(true));
      await expect(useCase.execute('user-2fa-01')).rejects.toThrow(/activada/i);
    });

    it('should disable 2FA for a user with it', async () => {
      userRepository.seed(buildUser(true));
      const useCase = new DisableTwoFactor(userRepository);

      const result = await useCase.execute('user-2fa-01');

      expect(result.twoFactorEnabled).toBe(false);
    });

    it('should throw when disabling for a missing user or already disabled', async () => {
      const useCase = new DisableTwoFactor(userRepository);

      await expect(useCase.execute('ghost')).rejects.toThrow(/no encontrado/i);

      userRepository.seed(buildUser(false));
      await expect(useCase.execute('user-2fa-01')).rejects.toThrow(/desactivada/i);
    });
  });

  describe('ResendTwoFactorCode', () => {
    function makeUseCase() {
      return new ResendTwoFactorCode(
        userRepository,
        verificationCodeRepository,
        emailService,
        tokenService,
        passwordService,
      );
    }

    it('should throw TOKEN_INVALID for a bad temporary token', async () => {
      await expect(
        makeUseCase().execute({ temporaryToken: FakeTokenService.makeInvalidToken() }),
      ).rejects.toThrow(/temporal/i);
    });

    it('should throw USER_NOT_FOUND when the user is gone', async () => {
      const temporaryToken = tokenService.generate({ userId: 'ghost', email: 'g@x.co' });

      await expect(
        makeUseCase().execute({ temporaryToken }),
      ).rejects.toThrow(/no encontrado/i);
    });

    it('should generate a new code and token for an existing user', async () => {
      userRepository.seed(buildUser(false));
      const temporaryToken = tokenService.generate({ userId: 'user-2fa-01', email: 'dosfa@example.com' });

      const result = await makeUseCase().execute({ temporaryToken });

      expect(result.temporaryToken).toContain('fake.');
      expect(emailService.sentTwoFactorCodes).toHaveLength(1);
    });
  });

  describe('GenerateTwoFactorCode without password service', () => {
    it('should fall back to real bcrypt hashing', async () => {
      const useCase = new GenerateTwoFactorCode(
        verificationCodeRepository,
        emailService,
        tokenService,
      );

      const result = await useCase.execute('user-2fa-01', 'invalid-email');

      expect(result.maskedEmail).toBe('invalid-email');

      const short = await useCase.execute('user-2fa-01', 'ab@x.co');
      expect(short.maskedEmail).toBe('***@x.co');
      expect(emailService.sentTwoFactorCodes).toHaveLength(2);
      expect(emailService.sentTwoFactorCodes[1]!.code).toMatch(/^\d{6}$/);
    }, 15000);
  });

  describe('LogoutUser', () => {
    it('should resolve without throwing', async () => {
      await expect(new LogoutUser().execute('user-2fa-01')).resolves.toBeUndefined();
    });
  });
});
