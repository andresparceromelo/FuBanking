/**
 * loginSchema.test.ts
 * Pruebas unitarias de caja blanca — Frontend / Esquema Zod
 * Esquema: loginSchema
 *
 * Tabla de caminos cubierta (V(G) = 4):
 *   Camino 1,2,4,6,8,9,F     – email válido + password no vacía → { success:true, data }
 *   Camino 1,2,3,4,6,7,9,F   – email inválido + password no vacía → error en email únicamente
 *   Camino 1,2,4,5,6,7,9,F   – email válido + password vacía → error en password únicamente
 *   Camino 1,2,3,4,5,6,7,9,F – email inválido + password vacía → errores en ambos campos
 *
 * No requiere mocks: loginSchema es validación pura declarativa (Zod).
 * Se usa loginSchema.safeParse(input) para verificar éxito/fallo sin lanzar excepciones.
 *
 * Ejecutar: npx jest src/__tests__/auth/loginSchema.test.ts
 */

import { loginSchema } from '../../features/auth/schemas/auth.schemas';

describe('loginSchema — Pruebas de caja blanca (tabla de caminos Zod)', () => {

  // ── Camino 1,2,4,6,8,9,F ─────────────────────────────────────────────────────
  describe("Camino 1,2,4,6,8,9,F — email válido + password no vacía", () => {
    it('retorna success:true con los datos parseados correctamente', () => {
      // Arrange
      const input = { email: 'ana@mail.com', password: 'abc123' };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // email debe ser transformado a lowercase y trimmed
        expect(result.data.email).toBe('ana@mail.com');
        expect(result.data.password).toBe('abc123');
        // rememberMe es opcional, por defecto undefined
        expect(result.data.rememberMe).toBeUndefined();
      }
    });

    it('[caso extra] email en mayúsculas es normalizado a minúsculas', () => {
      const input = { email: 'ANA@MAIL.COM', password: 'abc123' };
      const result = loginSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('ana@mail.com');
      }
    });

    it('[caso extra] rememberMe=true es preservado', () => {
      const input = { email: 'ana@mail.com', password: 'abc123', rememberMe: true };
      const result = loginSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(true);
      }
    });
  });

  // ── Camino 1,2,3,4,6,7,9,F ───────────────────────────────────────────────────
  describe("Camino 1,2,3,4,6,7,9,F — email con formato inválido + password no vacía", () => {
    it('retorna success:false con issue únicamente en el campo email', () => {
      // Arrange: email sin arroba (formato inválido)
      const input = { email: 'ana-arroba-mail', password: 'abc123' };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        // Solo debe haber un issue y debe ser del campo email
        const emailIssues = issues.filter((i) => i.path.includes('email'));
        const passwordIssues = issues.filter((i) => i.path.includes('password'));

        expect(emailIssues.length).toBeGreaterThanOrEqual(1);
        expect(emailIssues[0].message).toBe('Correo electrónico inválido');
        expect(passwordIssues.length).toBe(0);
      }
    });
  });

  // ── Camino 1,2,4,5,6,7,9,F ───────────────────────────────────────────────────
  describe("Camino 1,2,4,5,6,7,9,F — email válido + password vacía", () => {
    it('retorna success:false con issue únicamente en el campo password', () => {
      // Arrange: password vacía (longitud 0 < mínimo 1)
      const input = { email: 'ana@mail.com', password: '' };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        const emailIssues = issues.filter((i) => i.path.includes('email'));
        const passwordIssues = issues.filter((i) => i.path.includes('password'));

        expect(passwordIssues.length).toBeGreaterThanOrEqual(1);
        expect(passwordIssues[0].message).toBe('La contraseña es requerida');
        expect(emailIssues.length).toBe(0);
      }
    });
  });

  // ── Camino 1,2,3,4,5,6,7,9,F ─────────────────────────────────────────────────
  describe("Camino 1,2,3,4,5,6,7,9,F — email inválido + password vacía (ambos campos fallan)", () => {
    it('retorna success:false con issues en email Y password simultáneamente', () => {
      // Arrange: ambos campos inválidos
      const input = { email: 'ana-arroba-mail', password: '' };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        const emailIssues = issues.filter((i) => i.path.includes('email'));
        const passwordIssues = issues.filter((i) => i.path.includes('password'));

        // Ambos issues deben estar presentes simultáneamente
        expect(emailIssues.length).toBeGreaterThanOrEqual(1);
        expect(passwordIssues.length).toBeGreaterThanOrEqual(1);

        expect(emailIssues[0].message).toBe('Correo electrónico inválido');
        expect(passwordIssues[0].message).toBe('La contraseña es requerida');
      }
    });
  });
});
