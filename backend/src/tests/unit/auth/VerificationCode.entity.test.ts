import { describe, it, expect } from 'vitest';
import { VerificationCode } from '../../../domain/entities/VerificationCode';

describe('VerificationCode — Entity', () => {
  it('should create a fresh unused code', () => {
    const code = VerificationCode.create({ id: 'vc-1', userId: 'u1', codeHash: 'h' });

    expect(code.isUsed()).toBe(false);
    expect(code.isExpired()).toBe(false);
    expect(code.hasExceededAttempts()).toBe(false);
    expect(code.attempts).toBe(0);
  });

  it('should track attempts and cap at 5', () => {
    const code = VerificationCode.create({ id: 'vc-1', userId: 'u1', codeHash: 'h' });

    for (let i = 0; i < 4; i += 1) {
      code.incrementAttempts();
      expect(code.hasExceededAttempts()).toBe(false);
    }
    code.incrementAttempts();
    expect(code.attempts).toBe(5);
    expect(code.hasExceededAttempts()).toBe(true);
  });

  it('should mark as used and detect expiry', () => {
    const code = VerificationCode.create({ id: 'vc-1', userId: 'u1', codeHash: 'h' });
    code.markAsUsed();

    expect(code.isUsed()).toBe(true);
  });
});
