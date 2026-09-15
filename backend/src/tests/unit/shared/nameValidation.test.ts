import { describe, it, expect } from 'vitest';
import { isValidName } from '../../../shared/utils/nameValidation';

describe('isValidName — Validación semántica de nombres (backend)', () => {
  // ─── Casos válidos ──────────────────────────────────────────────────────────

  describe('Casos válidos', () => {
    it('acepta un nombre simple', () => {
      expect(isValidName('Ana')).toBe(true);
    });

    it('acepta un nombre con tilde', () => {
      expect(isValidName('María')).toBe(true);
    });

    it('acepta apellido compuesto con guion', () => {
      expect(isValidName('García-López')).toBe(true);
    });

    it('acepta nombre con apóstrofe', () => {
      expect(isValidName("O'Brien")).toBe(true);
    });

    it('acepta nombre con eñe', () => {
      expect(isValidName('Núñez')).toBe(true);
    });

    it('acepta doble consonante corta (Lee, Ann)', () => {
      expect(isValidName('Lee')).toBe(true);
      expect(isValidName('Ann')).toBe(true);
    });

    it('acepta doble carácter (no triple)', () => {
      expect(isValidName('Aabria')).toBe(true);
    });

    it('devuelve true para cadena vacía (campo opcional)', () => {
      expect(isValidName('')).toBe(true);
      expect(isValidName('   ')).toBe(true);
    });

    it('devuelve true para undefined (campo opcional)', () => {
      expect(isValidName(undefined)).toBe(true);
    });

    it('acepta nombre completo con múltiples palabras', () => {
      expect(isValidName('Ana María')).toBe(true);
    });
  });

  // ─── Casos inválidos — 3+ consecutivos ─────────────────────────────────────

  describe('Casos inválidos — 3 o más caracteres consecutivos iguales', () => {
    it('rechaza "xxxxx"', () => {
      expect(isValidName('xxxxx')).toBe(false);
    });

    it('rechaza "aaaaaa"', () => {
      expect(isValidName('aaaaaa')).toBe(false);
    });

    it('rechaza "bbbbb"', () => {
      expect(isValidName('bbbbb')).toBe(false);
    });

    it('rechaza triple repetición dentro de nombre', () => {
      expect(isValidName('Jooohn')).toBe(false);
    });

    it('rechaza triple consonante repetida', () => {
      expect(isValidName('Brrron')).toBe(false);
    });

    it('rechaza triple repetición de mayúscula (case-insensitive)', () => {
      expect(isValidName('AAA')).toBe(false);
    });
  });

  // ─── Casos inválidos — sin vocal ───────────────────────────────────────────

  describe('Casos inválidos — sin vocal', () => {
    it('rechaza cadena de consonantes "Bcd"', () => {
      expect(isValidName('Bcd')).toBe(false);
    });

    it('rechaza cadena de consonantes largas "QRSTZ"', () => {
      expect(isValidName('QRSTZ')).toBe(false);
    });

    it('rechaza "Xyz"', () => {
      expect(isValidName('Xyz')).toBe(false);
    });
  });
});
