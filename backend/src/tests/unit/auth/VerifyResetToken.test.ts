import { describe, it, expect, beforeEach } from 'vitest';
import { VerifyResetToken } from '../../../application/use-cases/auth/VerifyResetToken';
import { InMemoryResetTokenRepository } from '../../fakes/InMemoryResetTokenRepository';
import { FakeTokenService } from '../../fakes/FakeTokenService';
import { hashToken } from '../../../infrastructure/repositories/SupabaseResetTokenRepository';

describe('VerifyResetToken', () => {
  let resetTokenRepository: InMemoryResetTokenRepository;
  const tokenService = new FakeTokenService();

  beforeEach(() => {
    resetTokenRepository = new InMemoryResetTokenRepository();
  });

  it('should resolve for a valid token', async () => {
    const useCase = new VerifyResetToken(tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'u1', email: 'u1@example.com', type: 'reset' } as never);

    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'u1',
      used: false,
      expiresAt: new Date(Date.now() + 500000),
    });

    await expect(useCase.execute({ token })).resolves.toBeUndefined();
    
    // Debería seguir sin usarse
    const stored = await resetTokenRepository.findByTokenHash(hashToken(token));
    expect(stored?.used).toBe(false);
  });

  it('should throw TOKEN_INVALID if token is not reset type', async () => {
    const useCase = new VerifyResetToken(tokenService, resetTokenRepository);
    const badToken = tokenService.generate({ userId: 'u1', email: 'u1@example.com' });

    await expect(useCase.execute({ token: badToken })).rejects.toThrow(/inválido/i);
  });

  it('should throw TOKEN_INVALID if token is not found in database', async () => {
    const useCase = new VerifyResetToken(tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'u1', email: 'u1@example.com', type: 'reset' } as never);

    await expect(useCase.execute({ token })).rejects.toThrow(/inválido/i);
  });

  it('should throw TOKEN_ALREADY_USED if token is marked as used', async () => {
    const useCase = new VerifyResetToken(tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'u1', email: 'u1@example.com', type: 'reset' } as never);

    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'u1',
      used: true,
      expiresAt: new Date(Date.now() + 500000),
    });

    await expect(useCase.execute({ token })).rejects.toThrow(/ya fue utilizado/i);
    await expect(useCase.execute({ token })).rejects.toMatchObject({ code: 'TOKEN_ALREADY_USED' });
  });

  it('should throw TOKEN_EXPIRED if token is expired in database', async () => {
    const useCase = new VerifyResetToken(tokenService, resetTokenRepository);
    const token = tokenService.generate({ userId: 'u1', email: 'u1@example.com', type: 'reset' } as never);

    await resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: 'u1',
      used: false,
      expiresAt: new Date(Date.now() - 1000), // Past
    });

    await expect(useCase.execute({ token })).rejects.toThrow(/ha expirado/i);
    await expect(useCase.execute({ token })).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
  });
});
