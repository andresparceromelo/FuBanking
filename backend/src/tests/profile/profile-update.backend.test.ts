import { UpdateProfile } from '../../application/use-cases/profile/UpdateProfile';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { updateProfileSchema } from '../../presentation/validators/profile.validators';
import { UpdateUserData } from '../../domain/repositories/IUserRepository';

/**
 * Tests de integración del use-case UpdateProfile.
 *
 * Defectos cubiertos:
 *  #1  — Límites de longitud en campos del validator.
 *  #4  — Validación semántica de nombres (isValidName en validator).
 *  #7  — Mensajes de error diferenciados.
 *  #9  — birthDate ya no es un campo editable (eliminado del schema y use-case).
 */

class InMemoryUserRepositoryWithUpdate extends InMemoryUserRepository {
  override async update(id: string, data: UpdateUserData): Promise<User> {
    const existing = this.all().find((u) => u.id === id);
    if (!existing) throw new Error(`usuario ${id} no encontrado`);
    existing.updateProfile({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      secondLastName: data.secondLastName,
      birthDate: data.birthDate ?? undefined,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
    });
    return existing;
  }
}

function buildUser(overrides: {
  phone?: string | null;
  birthDate?: Date;
} = {}): User {
  return new User({
    id: 'user-perfil-01',
    email: new Email('ana@example.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'Garcia',
    secondLastName: null,
    birthDate: overrides.birthDate ?? new Date('1995-01-01'),
    phone: overrides.phone !== undefined ? overrides.phone : null,
    avatarUrl: null,
    passwordHash: 'hashed_Segura123!',
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('UpdateProfile', () => {
  let userRepository: InMemoryUserRepositoryWithUpdate;
  let updateProfile: UpdateProfile;

  beforeEach(() => {
    userRepository = new InMemoryUserRepositoryWithUpdate();
    updateProfile = new UpdateProfile(userRepository);
  });

  /**
   * Camino 1: Actualiza phone válido → éxito.
   */
  test('Camino 1 — actualiza phone válido', async () => {
    const user = buildUser({ phone: null });
    userRepository.seed(user);

    const dto = { phone: '+57 310 000 0000' };

    const result = await updateProfile.execute('user-perfil-01', dto);

    expect(result.phone).toBe('+57 310 000 0000');
    expect(result.id).toBe('user-perfil-01');
    expect(result.email).toBe('ana@example.com');
  });

  /**
   * Camino 2: Phone inválido → el validator lo rechaza.
   * Cubre defecto #7: mensaje diferenciado para formato inválido.
   */
  test('Camino 2 — phone inválido es rechazado por el schema', () => {
    const body = { phone: '123' };

    expect(() => updateProfileSchema.parse(body)).toThrow();

    let errorMessage = '';
    try {
      updateProfileSchema.parse(body);
    } catch (e: any) {
      const issues: any[] = e.issues ?? e.errors ?? [];
      errorMessage = issues[0]?.message ?? '';
    }

    expect(errorMessage).toMatch(/tel[eé]fono|inv[aá]lid/i);
  });

  /**
   * Camino 3: Actualiza firstName y verifica que birthDate no cambia.
   * Cubre defecto #9: la fecha de nacimiento del usuario original se preserva.
   */
  test('Camino 3 — actualiza firstName, birthDate original se preserva', async () => {
    // Usamos una hora al mediodía UTC para evitar desfases de zona horaria en el test runner
    const originalBirth = new Date('1990-05-15T12:00:00Z');
    const user = buildUser({ birthDate: originalBirth });
    userRepository.seed(user);

    const dto = { firstName: 'Maria' };

    const result = await updateProfile.execute('user-perfil-01', dto);

    expect(result.firstName).toBe('Maria');
    // birthDate original se preserva (1990-05-15)
    expect(result.birthDate).toContain('1990-05-15');
  });

  /**
   * Camino 4: Payload vacío → error NO_CHANGES.
   * Cubre defecto #6: el use-case valida que haya al menos un campo.
   */
  test('Camino 4 — payload vacío → NO_CHANGES', async () => {
    const user = buildUser({ birthDate: new Date('1990-01-01') });
    userRepository.seed(user);

    const dto = {};

    await expect(updateProfile.execute('user-perfil-01', dto)).rejects.toMatchObject({
      code: 'NO_CHANGES',
      statusCode: 400,
    });
  });

  /**
   * Camino 5: birthDate en el payload es ignorado por el schema (defecto #9).
   * El schema no incluye birthDate → Zod lo descarta (strip mode).
   */
  test('Camino 5 — birthDate en payload es descartado silenciosamente por el schema', () => {
    const body = {
      firstName: 'Maria',
      birthDate: '2000-01-01', // campo desconocido — descartado por Zod
    };

    const parsed = updateProfileSchema.parse(body);

    expect('birthDate' in parsed).toBe(false);
    expect(parsed.firstName).toBe('Maria');
  });

  /**
   * Camino 6: Nombre con 3+ caracteres consecutivos → rechazado (defecto #4).
   * Cubre defecto #7: mensaje específico de validación semántica.
   */
  test('Camino 6 — nombre con caracteres repetidos rechazado por el schema', () => {
    const body = { firstName: 'Joooohn' };

    expect(() => updateProfileSchema.parse(body)).toThrow();

    let errorMessage = '';
    try {
      updateProfileSchema.parse(body);
    } catch (e: any) {
      const issues: any[] = e.issues ?? e.errors ?? [];
      errorMessage = issues.map((i: any) => i.message).join('; ');
    }

    expect(errorMessage).toMatch(/consecutivos/i);
  });

  /**
   * Camino 7: Nombre que supera 100 caracteres → mensaje específico de longitud (defecto #1 y #7).
   */
  test('Camino 7 — firstName > 100 caracteres → mensaje de longitud específico', () => {
    const body = { firstName: 'A'.repeat(101) };

    expect(() => updateProfileSchema.parse(body)).toThrow();

    let errorMessage = '';
    try {
      updateProfileSchema.parse(body);
    } catch (e: any) {
      const issues: any[] = e.issues ?? e.errors ?? [];
      errorMessage = issues.map((i: any) => i.message).join('; ');
    }

    expect(errorMessage).toMatch(/100/);
    // El mensaje de longitud NO es el mismo que el de formato
    expect(errorMessage).not.toMatch(/letras/);
  });
});
