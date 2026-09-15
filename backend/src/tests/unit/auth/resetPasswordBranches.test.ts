import { describe, it, expect, beforeEach } from 'vitest';
import { ResetPassword } from '../../../application/use-cases/auth/ResetPassword';
import { VerifyTwoFactorCode } from '../../../application/use-cases/auth/VerifyTwoFactorCode';
import { VerificationCode } from '../../../domain/entities/VerificationCode';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../../fakes/InMemoryVerificationCodeRepository';
import { InMemoryResetTokenRepository } from '../../fakes/InMemoryResetTokenRepository';
import { FakeTokenService } from '../../fakes/FakeTokenService';
import { FakePasswordService } from '../../fakes/FakePasswordService';
import { hashToken } from '../../../infrastructure/repositories/SupabaseResetTokenRepository';

function buildUser(): User {
  return new User({
    id: 'user-rp-01',
    email: new Email('rp@example.com'),
    document: new Document('1234567890'),
    firstName: 'Rp',
    middleName: null,
    lastName: 'User',
    secondLastName: null,
    birthDate: new Date('1995-01-01'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_old',
    monthlyIncome: 1800000,
    documentVerified: true,
    documentVerifiedAt: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ResetPassword branches', () => {
  let userRepository: InMemoryUserRepository;
  let resetTokenRepository: InMemoryResetTokenRepository;
  const passwordService = new FakePasswordService();
  const tokenService = new FakeTokenService();

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    resetTokenRepository = new InMemoryResetTokenRepository();
  });

  it('should reject a token without reset type', async () => {
    const useCase = new ResetPassword(userRepository, passwordService, tokenService, resetTokenRepository);
    const badToken = tokenService.generate({ userId: 'user-rp-01', email: 'rp@example.com' });

    await expect(
      useCase.execute({ token: badToken, newPassword: 'Segura123', confirmPassword: 'Segura123' }),
    ).rejects.toThrow(/inválido/i);
  });

  it('should throw TOKEN_INVALID if token not in DB', async () => {
    userRepository.seed(buildUser());
    const useCase = new ResetPassword(userRepository, passwordService, tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'user-rp-01', email: 'rp@example.com', type: 'reset' } as never);

    await expect(
      useCase.execute({ token, newPassword: 'Nueva123', confirmPassword: 'Nueva123' }),
    ).rejects.toThrow(/inválido/i);
  });

  it('should throw TOKEN_ALREADY_USED if token is marked as used', async () => {
    userRepository.seed(buildUser());
    const useCase = new ResetPassword(userRepository, passwordService, tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'user-rp-01', email: 'rp@example.com', type: 'reset' } as never);
    
    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'user-rp-01',
      used: true,
      expiresAt: new Date(Date.now() + 500000)
    });

    await expect(
      useCase.execute({ token, newPassword: 'Nueva123', confirmPassword: 'Nueva123' }),
    ).rejects.toThrow(/ya fue utilizado/i);
  });

  it('should throw TOKEN_EXPIRED if token has expired', async () => {
    userRepository.seed(buildUser());
    const useCase = new ResetPassword(userRepository, passwordService, tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'user-rp-01', email: 'rp@example.com', type: 'reset' } as never);
    
    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'user-rp-01',
      used: false,
      expiresAt: new Date(Date.now() - 1000) // Past date
    });

    await expect(
      useCase.execute({ token, newPassword: 'Nueva123', confirmPassword: 'Nueva123' }),
    ).rejects.toThrow(/ha expirado/i);
  });

  it('should throw USER_NOT_FOUND for an unknown email', async () => {
    const useCase = new ResetPassword(userRepository, passwordService, tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'ghost', email: 'ghost@x.co', type: 'reset' } as never);
    
    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'ghost',
      used: false,
      expiresAt: new Date(Date.now() + 500000)
    });

    await expect(
      useCase.execute({ token, newPassword: 'Nueva123', confirmPassword: 'Nueva123' }),
    ).rejects.toThrow(/no encontrado/i);
  });

  it('should reset with a typed token and mark it as used', async () => {
    userRepository.seed(buildUser());
    const useCase = new ResetPassword(userRepository, passwordService, tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'user-rp-01', email: 'rp@example.com', type: 'reset' } as never);

    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'user-rp-01',
      used: false,
      expiresAt: new Date(Date.now() + 500000)
    });

    await expect(
      useCase.execute({ token, newPassword: 'Nueva123', confirmPassword: 'Nueva123' }),
    ).resolves.toBeUndefined();
    
    expect(userRepository.getStoredPasswordHash('user-rp-01')).toBe('hashed_Nueva123');
    
    const storedToken = await resetTokenRepository.findByTokenHash(hashToken(token));
    expect(storedToken?.used).toBe(true);
  });
});

describe('VerifyTwoFactorCode branches', () => {
  let userRepository: InMemoryUserRepository;
  let verificationCodeRepository: InMemoryVerificationCodeRepository;
  const passwordService = new FakePasswordService();
  const tokenService = new FakeTokenService();

  function seedCode(userId: string, attempts = 3): string {
    const code = new VerificationCode({
      id: `vc-${userId}-${attempts}`,
      userId,
      codeHash: 'hashed_123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts,
      used: false,
      createdAt: new Date(),
    });
    verificationCodeRepository.seed(code);
    return tokenService.generate({ userId, email: `${userId}@x.co` });
  }

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    verificationCodeRepository = new InMemoryVerificationCodeRepository();
  });

  it('should use the singular message on the last attempt', async () => {
    userRepository.seed(buildUser());
    const temporaryToken = seedCode('user-rp-01');
    const useCase = new VerifyTwoFactorCode(
      verificationCodeRepository,
      userRepository,
      passwordService,
      tokenService,
    );

    await expect(
      useCase.execute({ temporaryToken, code: '000000' }),
    ).rejects.toThrow(/1 intento\./);
  });

  it('should throw USER_NOT_FOUND when the user is gone', async () => {
    const temporaryToken = seedCode('ghost-01', 0);
    const useCase = new VerifyTwoFactorCode(
      verificationCodeRepository,
      userRepository,
      passwordService,
      tokenService,
    );

    const code = await verificationCodeRepository.findLatestByUserId('ghost-01');
    code!.markAsUsed();
    const fresh = new VerificationCode({
      id: 'vc-ghost-2',
      userId: 'ghost-01',
      codeHash: 'hashed_123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      used: false,
      createdAt: new Date(Date.now() + 1000),
    });
    verificationCodeRepository.seed(fresh);

    await expect(
      useCase.execute({ temporaryToken, code: '123456' }),
    ).rejects.toThrow(/no encontrado/i);
  });
});
