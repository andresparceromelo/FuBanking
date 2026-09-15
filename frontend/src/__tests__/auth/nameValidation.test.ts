import { isValidName } from '../../features/auth/utils/nameValidation';

describe('isValidName — Validación semántica de nombres', () => {
  // ─── Casos válidos ────────────────────────────────────────────────────────

  describe('Casos válidos', () => {
    it('acepta un nombre simple', () => {
      expect(isValidName('Juan')).toBe(true);
    });

    it('acepta un nombre con tilde', () => {
      expect(isValidName('María')).toBe(true);
    });

    it('acepta un apellido compuesto con guion', () => {
      expect(isValidName('García-López')).toBe(true);
    });

    it('acepta nombre con apóstrofe (estilo anglosajón)', () => {
      expect(isValidName("O'Brien")).toBe(true);
    });

    it('acepta nombre con eñe', () => {
      expect(isValidName('Nuñez')).toBe(true);
    });

    it('acepta doble consonante corta (Lee, Ann)', () => {
      expect(isValidName('Lee')).toBe(true);
      expect(isValidName('Ann')).toBe(true);
    });

    it('acepta nombre con doble carácter seguido (no triple)', () => {
      // "aa" (2 repeticiones) → aceptado; "aaa" (3) → rechazado
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

  // ─── Casos inválidos ──────────────────────────────────────────────────────

  describe('Casos inválidos — 3 o más caracteres consecutivos', () => {
    it('rechaza "xxxxx"', () => {
      expect(isValidName('xxxxx')).toBe(false);
    });

    it('rechaza "aaaaaa"', () => {
      expect(isValidName('aaaaaa')).toBe(false);
    });

    it('rechaza "bbbbb"', () => {
      expect(isValidName('bbbbb')).toBe(false);
    });

    it('rechaza triple repetición dentro de un nombre', () => {
      expect(isValidName('Jooohn')).toBe(false);
    });

    it('rechaza triple repetición de consonante', () => {
      expect(isValidName('Brrron')).toBe(false);
    });

    it('rechaza triple repetición indiferente a mayúsculas', () => {
      // /(.)\1{2,}/i — la i hace que 'AAA' también sea detectado
      expect(isValidName('AAA')).toBe(false);
    });
  });

  describe('Casos inválidos — sin vocal', () => {
    it('rechaza cadena solo de consonantes "bcd"', () => {
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
