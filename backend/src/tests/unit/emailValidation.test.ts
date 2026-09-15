import { describe, it, expect } from 'vitest';
import { isValidEmail } from '../../shared/utils/emailValidation';

describe('isValidEmail (Backend)', () => {
  it('should accept valid emails', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user@sub.domain.co',
      'user@example.technology',
    ];

    for (const email of validEmails) {
      expect(isValidEmail(email)).toBe(true);
    }
  });

  it('should reject empty or missing emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidEmail(undefined)).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidEmail(null)).toBe(false);
  });

  it('should reject emails with multiple @', () => {
    expect(isValidEmail('test@gmail.com@gmail.con')).toBe(false);
    expect(isValidEmail('user@@example.com')).toBe(false);
  });

  it('should reject emails without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('should reject emails with empty local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('should reject emails with malformed domains', () => {
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false); // No dot
    expect(isValidEmail('user@.com')).toBe(false); // Starts with dot
    expect(isValidEmail('user@example.')).toBe(false); // Ends with dot
    expect(isValidEmail('user@exam..ple.com')).toBe(false); // Consecutive dots
  });

  it('should reject emails with short TLDs', () => {
    expect(isValidEmail('user@example.c')).toBe(false);
  });
});
