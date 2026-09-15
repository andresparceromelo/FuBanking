import {
  evaluatePasswordCriteria,
  calculateStrength,
  PasswordCriteria,
} from '../../features/auth/components/PasswordStrengthMeter';

// ─── evaluatePasswordCriteria ─────────────────────────────────────────────────

describe('evaluatePasswordCriteria', () => {
  it('detecta todos los criterios ausentes en cadena vacía', () => {
    const result = evaluatePasswordCriteria('');
    expect(result.hasMinLength).toBe(false);
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasNumber).toBe(false);
    expect(result.hasSymbol).toBe(false);
  });

  it('detecta longitud insuficiente', () => {
    expect(evaluatePasswordCriteria('Abc1!').hasMinLength).toBe(false);
  });

  it('detecta longitud suficiente', () => {
    expect(evaluatePasswordCriteria('Abcdefg1').hasMinLength).toBe(true);
  });

  it('detecta mayúscula', () => {
    expect(evaluatePasswordCriteria('A').hasUppercase).toBe(true);
    expect(evaluatePasswordCriteria('a').hasUppercase).toBe(false);
  });

  it('detecta minúscula', () => {
    expect(evaluatePasswordCriteria('a').hasLowercase).toBe(true);
    expect(evaluatePasswordCriteria('A').hasLowercase).toBe(false);
  });

  it('detecta número', () => {
    expect(evaluatePasswordCriteria('1').hasNumber).toBe(true);
    expect(evaluatePasswordCriteria('a').hasNumber).toBe(false);
  });

  it('detecta símbolo especial', () => {
    expect(evaluatePasswordCriteria('!').hasSymbol).toBe(true);
    expect(evaluatePasswordCriteria('@').hasSymbol).toBe(true);
    expect(evaluatePasswordCriteria('a').hasSymbol).toBe(false);
    expect(evaluatePasswordCriteria('1').hasSymbol).toBe(false);
  });

  it('evalúa correctamente una contraseña completa fuerte', () => {
    const result = evaluatePasswordCriteria('Segura1!xyz');
    expect(result.hasMinLength).toBe(true);
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSymbol).toBe(true);
  });
});

// ─── calculateStrength ────────────────────────────────────────────────────────

describe('calculateStrength', () => {
  const weakCriteria: PasswordCriteria = {
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
  };

  it('devuelve "weak" si no cumple los mínimos obligatorios', () => {
    expect(calculateStrength(weakCriteria)).toBe('weak');
  });

  it('devuelve "weak" si le falta la longitud mínima', () => {
    expect(
      calculateStrength({ ...weakCriteria, hasUppercase: true, hasLowercase: true, hasNumber: true }),
    ).toBe('weak');
  });

  it('devuelve "medium" si cumple mínimos pero sin símbolo', () => {
    const medium: PasswordCriteria = {
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: false,
    };
    expect(calculateStrength(medium)).toBe('medium');
  });

  it('devuelve "strong" si cumple todos los criterios', () => {
    const strong: PasswordCriteria = {
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSymbol: true,
    };
    expect(calculateStrength(strong)).toBe('strong');
  });

  it('clasifica "Password123" como medium (sin símbolo)', () => {
    const criteria = evaluatePasswordCriteria('Password123');
    expect(calculateStrength(criteria)).toBe('medium');
  });

  it('clasifica "Password123!" como strong', () => {
    const criteria = evaluatePasswordCriteria('Password123!');
    expect(calculateStrength(criteria)).toBe('strong');
  });

  it('clasifica "abc" como weak', () => {
    const criteria = evaluatePasswordCriteria('abc');
    expect(calculateStrength(criteria)).toBe('weak');
  });
});
