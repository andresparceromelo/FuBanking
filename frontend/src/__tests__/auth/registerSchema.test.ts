import { registerSchema } from '../../features/auth/schemas/auth.schemas';

const BASE_VALID = {
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: '1990-01-01',
  email: 'juan@test.com',
  document: 'ABC12345',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('registerSchema — Pruebas de caja blanca (tabla de caminos Zod)', () => {
  describe('1,2,4,6,8,10,12,14,16,F', () => {
    it('1,2,4,6,8,10,12,14,16,F', () => {
      const result = registerSchema.safeParse(BASE_VALID);

      expect(result.success).toBe(true);
    });
  });

  describe('1,2,3,F', () => {
    it('1,2,3,F', () => {
      const result = registerSchema.safeParse({ ...BASE_VALID, firstName: 'J' });

      expect(result.success).toBe(false);
      if (!result.success) {
        const firstNameIssues = result.error.issues.filter((i) => i.path.includes('firstName'));
        expect(firstNameIssues.length).toBeGreaterThanOrEqual(1);
        expect(firstNameIssues[0]!.message).toBe('El primer nombre debe tener al menos 2 caracteres');
      }
    });
  });

  describe('1,2,4,5,F', () => {
    it('1,2,4,5,F', () => {
      const result = registerSchema.safeParse({ ...BASE_VALID, lastName: 'P3rez' });

      expect(result.success).toBe(false);
      if (!result.success) {
        const lastNameIssues = result.error.issues.filter((i) => i.path.includes('lastName'));
        expect(lastNameIssues.length).toBeGreaterThanOrEqual(1);
        expect(lastNameIssues[0]!.message).toBe('Solo se permiten letras y espacios');
      }
    });
  });

  describe('1,2,4,6,7,F', () => {
    it('1,2,4,6,7,F', () => {
      const result = registerSchema.safeParse({ ...BASE_VALID, birthDate: '2030-01-01' });

      expect(result.success).toBe(false);
      if (!result.success) {
        const birthDateIssues = result.error.issues.filter((i) => i.path.includes('birthDate'));
        expect(birthDateIssues.length).toBeGreaterThanOrEqual(1);
        expect(birthDateIssues[0]!.message).toBe('La fecha no puede ser en el futuro');
      }
    });
  });

  describe('1,2,4,6,8,9,F', () => {
    it('1,2,4,6,8,9,F', () => {
      const result = registerSchema.safeParse({ ...BASE_VALID, email: 'correo-invalido' });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssues = result.error.issues.filter((i) => i.path.includes('email'));
        expect(emailIssues.length).toBeGreaterThanOrEqual(1);
        expect(emailIssues[0]!.message).toBe('Correo electrónico inválido');
      }
    });
  });

  describe('1,2,4,6,8,10,11,F', () => {
    it('1,2,4,6,8,10,11,F', () => {
      const result = registerSchema.safeParse({ ...BASE_VALID, document: 'AB1' });

      expect(result.success).toBe(false);
      if (!result.success) {
        const documentIssues = result.error.issues.filter((i) => i.path.includes('document'));
        expect(documentIssues.length).toBeGreaterThanOrEqual(1);
        expect(documentIssues[0]!.message).toBe('Documento inválido');
      }
    });
  });

  describe('1,2,4,6,8,10,12,13,F', () => {
    it('1,2,4,6,8,10,12,13,F', () => {
      const result = registerSchema.safeParse({
        ...BASE_VALID,
        password: 'abcdefgh',
        confirmPassword: 'abcdefgh',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordIssues = result.error.issues.filter((i) => i.path.includes('password'));
        expect(passwordIssues.length).toBeGreaterThanOrEqual(1);
        expect(passwordIssues[0]!.message).toBe('Debe contener al menos una mayúscula');
      }
    });
  });

  describe('1,2,4,6,8,10,12,14,15,F', () => {
    it('1,2,4,6,8,10,12,14,15,F', () => {
      const result = registerSchema.safeParse({
        ...BASE_VALID,
        password: 'Password123',
        confirmPassword: 'Otra456X',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmIssues = result.error.issues.filter((i) => i.path.includes('confirmPassword'));
        expect(confirmIssues.length).toBeGreaterThanOrEqual(1);
        expect(confirmIssues[0]!.message).toBe('Las contraseñas no coinciden');
      }
    });
  });
});
