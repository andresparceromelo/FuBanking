import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetProfile } from '../../../application/use-cases/profile/GetProfile';
import { UpdateProfile } from '../../../application/use-cases/profile/UpdateProfile';
import { UploadDocument } from '../../../application/use-cases/profile/UploadDocument';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';

function buildUser(): User {
  return new User({
    id: 'user-perfil-02',
    email: new Email('perfil@example.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'Garcia',
    secondLastName: null,
    birthDate: new Date('1995-01-01'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hash',
    monthlyIncome: 1800000,
    documentVerified: false,
    documentVerifiedAt: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function mockStorage(result: { error: { message?: string } | null }) {
  const upload = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ upload });
  return { storage: { from }, upload, from };
}

describe('GetProfile', () => {
  it('should return the public profile', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed(buildUser());

    const result = await new GetProfile(repo).execute('user-perfil-02');

    expect(result.id).toBe('user-perfil-02');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should throw USER_NOT_FOUND for a missing user', async () => {
    const repo = new InMemoryUserRepository();

    await expect(new GetProfile(repo).execute('ghost')).rejects.toThrow(/no encontrado/i);
  });
});

describe('UpdateProfile sin cambios', () => {
  it('should throw NO_CHANGES with an empty dto', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed(buildUser());

    await expect(new UpdateProfile(repo).execute('user-perfil-02', {})).rejects.toThrow(
      /ningún campo/i,
    );
  });

  it('should throw USER_NOT_FOUND for a missing user', async () => {
    const repo = new InMemoryUserRepository();

    await expect(
      new UpdateProfile(repo).execute('ghost', { firstName: 'X' }),
    ).rejects.toThrow(/no encontrado/i);
  });
});

describe('UploadDocument', () => {
  it('should upload the pdf and return the profile', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed(buildUser());
    const storage = mockStorage({ error: null });

    const result = await new UploadDocument(repo, storage as never).execute(
      'user-perfil-02',
      Buffer.from('%PDF-1.4'),
      'cedula.pdf',
    );

    expect(storage.from).toHaveBeenCalledWith('documents');
    expect(storage.upload).toHaveBeenCalledWith(
      'user-perfil-02.pdf',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'application/pdf', upsert: true }),
    );
    expect(result.id).toBe('user-perfil-02');
  });

  it('should throw USER_NOT_FOUND for a missing user', async () => {
    const repo = new InMemoryUserRepository();
    const storage = mockStorage({ error: null });

    await expect(
      new UploadDocument(repo, storage as never).execute('ghost', Buffer.from('x'), 'a.pdf'),
    ).rejects.toThrow(/no encontrado/i);
  });

  it('should throw EMPTY_FILE for an empty buffer', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed(buildUser());
    const storage = mockStorage({ error: null });

    await expect(
      new UploadDocument(repo, storage as never).execute('user-perfil-02', Buffer.from([]), 'a.pdf'),
    ).rejects.toThrow(/vacío/i);
  });

  it('should throw DOCUMENT_UPLOAD_FAILED on storage error', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed(buildUser());
    const storage = mockStorage({ error: { message: 'quota' } });

    await expect(
      new UploadDocument(repo, storage as never).execute(
        'user-perfil-02',
        Buffer.from('%PDF'),
        'a.pdf',
      ),
    ).rejects.toThrow(/No se pudo subir/i);
  });

  it('should fall back to Desconocido without error message', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed(buildUser());
    const storage = mockStorage({ error: {} as { message?: string } });

    await expect(
      new UploadDocument(repo, storage as never).execute(
        'user-perfil-02',
        Buffer.from('%PDF'),
        'a.pdf',
      ),
    ).rejects.toThrow('Desconocido');
  });
});
