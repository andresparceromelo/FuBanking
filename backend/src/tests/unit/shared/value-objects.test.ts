import { describe, it, expect } from 'vitest';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { AuthError } from '../../../shared/errors/AuthError';
import { AppError } from '../../../shared/errors/AppError';
import { ValidationError } from '../../../shared/errors/ValidationError';

describe('Email value object', () => {
  it('should normalize and validate', () => {
    const email = new Email('  ANA@EXAMPLE.COM ');

    expect(email.toString()).toBe('ana@example.com');
    expect(email.equals(new Email('ana@example.com'))).toBe(true);
    expect(email.equals(new Email('otra@example.com'))).toBe(false);
  });

  it('should reject empty, short and malformed emails', () => {
    expect(() => new Email('')).toThrow();
    expect(() => new Email('   ')).toThrow();
    expect(() => new Email('sin-arroba')).toThrow();
    expect(() => new Email('a@b')).toThrow();
  });
});

describe('Document value object', () => {
  it('should trim and accept 5-20 chars', () => {
    const doc = new Document('  1234567890  ');

    expect(doc.toString()).toBe('1234567890');
    expect(doc.equals(new Document('1234567890'))).toBe(true);
    expect(doc.equals(new Document('0987654321'))).toBe(false);
  });

  it('should reject empty, short and long documents', () => {
    expect(() => new Document('')).toThrow(/requerido/i);
    expect(() => new Document('1234')).toThrow(/5.*20|entre/i);
    expect(() => new Document('1'.repeat(21))).toThrow(/5.*20|entre/i);
  });
});

describe('AuthError', () => {
  it('should default to 401 UNAUTHORIZED', () => {
    const err = new AuthError('No');

    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err).toBeInstanceOf(AppError);
    expect(err.isOperational).toBe(true);
  });

  it('should map FORBIDDEN to 403', () => {
    const err = new AuthError('No', 'FORBIDDEN');

    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ValidationError', () => {
  it('should default to 400 with empty fields', () => {
    const err = new ValidationError('Bad');

    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.fields).toEqual({});
  });

  it('should keep provided fields', () => {
    const err = new ValidationError('Bad', { email: ['inválido'] });

    expect(err.fields).toEqual({ email: ['inválido'] });
  });
});
