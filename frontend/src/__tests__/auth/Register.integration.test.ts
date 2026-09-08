import { registerSchema } from '../../features/auth/schemas/auth.schemas';
import { RegisterInput } from '../../features/auth/schemas/auth.schemas';

interface FakeApiResponse {
  status: number;
  body: Record<string, unknown>;
}

function fakeRegisterApi(input: RegisterInput): FakeApiResponse {
  if (input.email === 'existing-email@test.com') {
    return { status: 409, body: { code: 'EMAIL_ALREADY_EXISTS', message: 'Ya existe una cuenta con este correo electrónico' } };
  }
  if (input.document === 'DOC99999') {
    return { status: 409, body: { code: 'DOCUMENT_ALREADY_EXISTS', message: 'Ya existe una cuenta con este documento' } };
  }
  return {
    status: 201,
    body: {
      user: {
        id: 'new-user-001',
        email: input.email,
        document: input.document,
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: `${input.firstName} ${input.lastName}`,
        middleName: input.middleName ?? null,
        secondLastName: input.secondLastName ?? null,
        birthDate: input.birthDate,
        phone: input.phone ?? null,
        avatarUrl: null,
        isActive: true,
        twoFactorEnabled: false,
        role: 'user',
        createdAt: new Date().toISOString(),
      },
      token: 'fake-jwt-token-registro',
    },
  };
}

async function handleRegister(rawInput: unknown): Promise<FakeApiResponse> {
  const parsed = registerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: 422, body: { code: 'VALIDATION_ERROR', errors: parsed.error.issues } };
  }
  return fakeRegisterApi(parsed.data);
}

const BASE_VALID_INPUT = {
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: '1990-01-01',
  email: 'juan@test.com',
  document: 'XYZ98765',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('Registro — Pruebas de integración (tabla de caminos Frontend↔Backend)', () => {
  describe('1,2,3,5,6,8,10,12,13,F', () => {
    it('1,2,3,5,6,8,10,12,13,F', async () => {
      const response = await handleRegister(BASE_VALID_INPUT);

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect((response.body.user as any).email).toBe('juan@test.com');
    });
  });

  describe('1,2,3,4,F', () => {
    it('1,2,3,4,F', async () => {
      const response = await handleRegister({ ...BASE_VALID_INPUT, firstName: 'J' });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      const errors = response.body.errors as Array<{ path: (string | number)[]; message: string }>;
      expect(errors.some((e) => e.path.includes('firstName'))).toBe(true);
    });
  });

  describe('1,2,3,5,6,7,F', () => {
    it('1,2,3,5,6,7,F', async () => {
      const response = await handleRegister({
        ...BASE_VALID_INPUT,
        password: 'Password123',
        confirmPassword: 'OtraPassword456',
      });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      const errors = response.body.errors as Array<{ path: (string | number)[]; message: string }>;
      expect(errors.some((e) => e.path.includes('confirmPassword'))).toBe(true);
    });
  });

  describe('1,2,3,5,6,8,9,F', () => {
    it('1,2,3,5,6,8,9,F', async () => {
      const response = await handleRegister({ ...BASE_VALID_INPUT, email: 'existing-email@test.com' });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('1,2,3,5,6,8,10,11,F', () => {
    it('1,2,3,5,6,8,10,11,F', async () => {
      const response = await handleRegister({ ...BASE_VALID_INPUT, document: 'DOC99999' });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('DOCUMENT_ALREADY_EXISTS');
    });
  });
});
