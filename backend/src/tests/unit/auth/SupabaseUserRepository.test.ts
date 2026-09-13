import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseUserRepository } from '../../../infrastructure/repositories/SupabaseUserRepository';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { AppError } from '../../../shared/errors/AppError';

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    first_name: 'Ana',
    middle_name: null,
    last_name: 'Garcia',
    second_last_name: null,
    birth_date: '1995-06-15',
    email: 'ana@example.com',
    document: '1234567890',
    phone: null,
    avatar_url: null,
    monthly_income: 1800000,
    document_verified: true,
    document_verified_at: null,
    password: 'hash',
    is_active: true,
    two_factor_enabled: false,
    role: 'user',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function mockClient() {
  const state: { result: { data: unknown; error: unknown } } = {
    result: { data: null, error: null },
  };
  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    then: (resolve: (v: unknown) => void) => void;
  } = {
    from: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    then: (resolve: (v: unknown) => void) => resolve(state.result),
  } as never;
  for (const k of ['from', 'insert', 'select', 'eq', 'order', 'update', 'delete'] as const) {
    (builder[k] as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  }
  (builder.single as ReturnType<typeof vi.fn>).mockImplementation(async () => state.result);
  return { builder, state };
}

function buildUser(): User {
  return new User({
    id: 'user-1',
    email: new Email('ana@example.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'Garcia',
    secondLastName: null,
    birthDate: new Date(1995, 5, 15),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hash',
    monthlyIncome: 1800000,
    documentVerified: true,
    documentVerifiedAt: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SupabaseUserRepository', () => {
  let client: ReturnType<typeof mockClient>;
  let repo: SupabaseUserRepository;

  beforeEach(() => {
    client = mockClient();
    repo = new SupabaseUserRepository(client.builder as never);
  });

  it('should map rows on findById/findByEmail/findByDocument', async () => {
    client.state.result = { data: userRow(), error: null };

    const byId = await repo.findById('user-1');
    expect(byId?.email.toString()).toBe('ana@example.com');
    expect(client.builder.eq).toHaveBeenCalledWith('id', 'user-1');

    const byEmail = await repo.findByEmail('  ANA@EXAMPLE.COM ');
    expect(byEmail?.id).toBe('user-1');
    expect(client.builder.eq).toHaveBeenCalledWith('email', 'ana@example.com');

    const byDoc = await repo.findByDocument(' 1234567890 ');
    expect(byDoc?.id).toBe('user-1');
  });

  it('should return null on error or missing data', async () => {
    client.state.result = { data: null, error: { message: 'x' } };
    await expect(repo.findById('u')).resolves.toBeNull();
    await expect(repo.findByEmail('a@b.co')).resolves.toBeNull();
    await expect(repo.findByDocument('1')).resolves.toBeNull();

    client.state.result = { data: null, error: null };
    await expect(repo.findById('u')).resolves.toBeNull();
  });

  it('should map verified-at dates', async () => {
    const at = new Date('2026-02-02T00:00:00.000Z').toISOString();
    client.state.result = { data: userRow({ document_verified_at: at }), error: null };

    const result = await repo.findById('user-1');

    expect(result?.documentVerifiedAt).toBeInstanceOf(Date);
  });

  it('should persist verified-at on save', async () => {
    const user = buildUser();
    user.markDocumentVerified();
    client.state.result = {
      data: userRow({ document_verified_at: new Date().toISOString() }),
      error: null,
    };

    await repo.save(user);

    expect(client.builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ document_verified_at: expect.any(String) }),
    );
  });

  it('should map nullables with defaults', async () => {
    client.state.result = {
      data: userRow({ monthly_income: null, document_verified: null, two_factor_enabled: null, role: null }),
      error: null,
    };

    const result = await repo.findById('user-1');

    expect(result?.monthlyIncome).toBeNull();
    expect(result?.role).toBe('user');
  });

  it('should save with formatted birth_date', async () => {
    client.state.result = { data: userRow(), error: null };

    const result = await repo.save(buildUser());

    expect(client.builder.from).toHaveBeenCalledWith('users');
    expect(client.builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ birth_date: '1995-06-15', document_verified_at: null }),
    );
    expect(result.id).toBe('user-1');
  });

  it('should throw DB_ERROR on save/update/delete failures', async () => {
    client.state.result = { data: null, error: { message: 'dup' } };

    await expect(repo.save(buildUser())).rejects.toBeInstanceOf(AppError);
    await expect(repo.update('user-1', { firstName: 'X' })).rejects.toMatchObject({ code: 'DB_ERROR' });
    await expect(repo.updatePassword('user-1', 'h')).rejects.toMatchObject({ code: 'DB_ERROR' });
    await expect(repo.updateTwoFactor('user-1', true)).rejects.toMatchObject({ code: 'DB_ERROR' });
    await expect(repo.delete('user-1')).rejects.toMatchObject({ code: 'DB_ERROR' });

    client.state.result = { data: null, error: null };
    await expect(repo.save(buildUser())).rejects.toThrow('Desconocido');
  });

  it('should fall back to Desconocido without error message', async () => {
    client.state.result = { data: null, error: {} };

    await expect(repo.update('user-1', { firstName: 'X' })).rejects.toThrow('Desconocido');
    await expect(repo.updatePassword('user-1', 'h')).rejects.toThrow('Desconocido');
    await expect(repo.updateTwoFactor('user-1', true)).rejects.toThrow('Desconocido');
    await expect(repo.delete('user-1')).rejects.toThrow(/eliminar el usuario/);
  });

  it('should build partial changes on update', async () => {
    client.state.result = { data: userRow(), error: null };

    await repo.update('user-1', {
      firstName: 'Maria',
      middleName: 'L',
      lastName: 'Perez',
      secondLastName: 'G',
      birthDate: new Date(1995, 2, 20),
      phone: '+57',
      avatarUrl: 'http://x/y.png',
      monthlyIncome: 5,
      documentVerified: true,
    });

    expect(client.builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Maria',
        middle_name: 'L',
        last_name: 'Perez',
        second_last_name: 'G',
        birth_date: '1995-03-20',
        phone: '+57',
        avatar_url: 'http://x/y.png',
        monthly_income: 5,
        document_verified: true,
        document_verified_at: expect.any(String),
      }),
    );
  });

  it('should clear verification date when unverifying', async () => {
    client.state.result = { data: userRow(), error: null };

    await repo.update('user-1', { documentVerified: false });

    expect(client.builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ document_verified: false, document_verified_at: null }),
    );
  });

  it('should soft-delete and update password/2fa', async () => {
    client.state.result = { data: userRow(), error: null };

    await repo.delete('user-1');
    expect(client.builder.update).toHaveBeenCalledWith({ is_active: false });

    await repo.updatePassword('user-1', 'new-hash');
    expect(client.builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'new-hash' }),
    );

    client.state.result = { data: userRow({ two_factor_enabled: true }), error: null };
    const updated = await repo.updateTwoFactor('user-1', true);
    expect(client.builder.update).toHaveBeenCalledWith({ two_factor_enabled: true });
    expect(updated.twoFactorEnabled).toBe(true);
  });

  it('should list by role or [] on error', async () => {
    client.state.result = { data: [userRow()], error: null };
    const admins = await repo.findByRole('admin');
    expect(admins).toHaveLength(1);

    client.state.result = { data: null, error: { message: 'x' } };
    await expect(repo.findByRole('admin')).resolves.toEqual([]);
  });
});
