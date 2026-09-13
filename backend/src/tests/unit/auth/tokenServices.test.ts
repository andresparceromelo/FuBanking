import { describe, it, expect } from 'vitest';
import { JwtTokenService } from '../../../infrastructure/services/JwtTokenService';
import { BcryptPasswordService } from '../../../infrastructure/services/BcryptPasswordService';

describe('JwtTokenService', () => {
  const service = new JwtTokenService();

  it('should generate and verify a token', () => {
    const token = service.generate({ userId: 'u1', email: 'a@b.co' });

    expect(typeof token).toBe('string');
    expect(service.verify(token)).toMatchObject({ userId: 'u1', email: 'a@b.co' });
  });

  it('should throw TOKEN_INVALID for garbage', () => {
    expect(() => service.verify('not-a-token')).toThrow(/inválido/i);
  });

  it('should throw TOKEN_EXPIRED for an expired token', () => {
    const token = service.generate(
      { userId: 'u1', email: 'a@b.co' },
      { expiresIn: '-1s' } as never,
    );

    expect(() => service.verify(token)).toThrow(/expirado/i);
  });
});

describe('BcryptPasswordService', () => {
  const service = new BcryptPasswordService();

  it('should hash and compare successfully', async () => {
    const hash = await service.hash('Segura123');

    expect(hash).not.toBe('Segura123');
    await expect(service.compare('Segura123', hash)).resolves.toBe(true);
  });

  it('should reject a wrong password', async () => {
    const hash = await service.hash('Segura123');

    await expect(service.compare('Otra999', hash)).resolves.toBe(false);
  });
});
