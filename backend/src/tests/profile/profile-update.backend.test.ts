import { UpdateProfile } from '../../application/use-cases/profile/UpdateProfile';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { updateProfileSchema } from '../../presentation/validators/profile.validators';
import { UpdateUserData } from '../../domain/repositories/IUserRepository';

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

  test('Camino 1', async () => {
    const user = buildUser({ phone: null });
    userRepository.seed(user);

    const dto = { phone: '+57 310 000 0000' };

    const result = await updateProfile.execute('user-perfil-01', dto);

    expect(result.phone).toBe('+57 310 000 0000');
    expect(result.id).toBe('user-perfil-01');
    expect(result.email).toBe('ana@example.com');
  });

  test('Camino 2', () => {
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

  test('Camino 3', async () => {
    const user = buildUser({ birthDate: new Date('1990-05-15') });
    userRepository.seed(user);

    const dto = {
      firstName: 'Maria',
      birthDate: new Date('1995-03-20'),
    };

    const result = await updateProfile.execute('user-perfil-01', dto);

    expect(result.firstName).toBe('Maria');
    expect(result.birthDate).toContain('1995-03-20');
  });

  test('Camino 4', async () => {
    const user = buildUser({ birthDate: new Date('1990-01-01') });
    userRepository.seed(user);

    const dto = { birthDate: null as any };

    const result = await updateProfile.execute('user-perfil-01', dto);

    expect(result.id).toBe('user-perfil-01');
  });

  test('Camino 5', async () => {
    const user = buildUser({ phone: '+57 300 000 0000' });
    userRepository.seed(user);

    const dto = {};

    await expect(updateProfile.execute('user-perfil-01', dto)).rejects.toMatchObject({
      code: 'NO_CHANGES',
      statusCode: 400,
    });
  });

  test('Camino 6', async () => {
    const user = buildUser({ birthDate: new Date('1990-05-15') });
    userRepository.seed(user);

    const dto = {};

    await expect(updateProfile.execute('user-perfil-01', dto)).rejects.toMatchObject({
      code: 'NO_CHANGES',
      statusCode: 400,
    });
  });

  test('Camino 7', async () => {
    const user = buildUser({ phone: null });
    userRepository.seed(user);

    const dto = {};

    await expect(updateProfile.execute('user-perfil-01', dto)).rejects.toMatchObject({
      code: 'NO_CHANGES',
      statusCode: 400,
    });
  });
});
