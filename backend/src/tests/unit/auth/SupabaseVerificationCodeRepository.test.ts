import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseVerificationCodeRepository } from '../../../infrastructure/repositories/SupabaseVerificationCodeRepository';
import { VerificationCode } from '../../../domain/entities/VerificationCode';
import { AppError } from '../../../shared/errors/AppError';

function codeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vc-1',
    user_id: 'user-1',
    code_hash: 'hashed_123456',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    attempts: 0,
    used: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildCode(): VerificationCode {
  return VerificationCode.create({ id: 'vc-1', userId: 'user-1', codeHash: 'hashed_123456' });
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
    limit: vi.fn(),
    update: vi.fn(),
    single: vi.fn(),
    then: (resolve: (v: unknown) => void) => resolve(state.result),
  } as never;
  for (const k of ['from', 'insert', 'select', 'eq', 'order', 'limit', 'update'] as const) {
    (builder[k] as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  }
  (builder.single as ReturnType<typeof vi.fn>).mockImplementation(async () => state.result);
  return { builder, state };
}

describe('SupabaseVerificationCodeRepository', () => {
  let client: ReturnType<typeof mockClient>;
  let repo: SupabaseVerificationCodeRepository;

  beforeEach(() => {
    client = mockClient();
    repo = new SupabaseVerificationCodeRepository(client.builder as never);
  });

  it('should find the latest code', async () => {
    client.state.result = { data: codeRow(), error: null };

    const result = await repo.findLatestByUserId('user-1');

    expect(result?.codeHash).toBe('hashed_123456');
    expect(client.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(client.builder.limit).toHaveBeenCalledWith(1);
  });

  it('should return null on error or missing data', async () => {
    client.state.result = { data: null, error: { message: 'x' } };
    await expect(repo.findLatestByUserId('user-1')).resolves.toBeNull();

    client.state.result = { data: null, error: null };
    await expect(repo.findLatestByUserId('user-1')).resolves.toBeNull();
  });

  it('should save and map the row', async () => {
    client.state.result = { data: codeRow(), error: null };

    const result = await repo.save(buildCode());

    expect(client.builder.from).toHaveBeenCalledWith('verification_codes');
    expect(result.attempts).toBe(0);
  });

  it('should throw DB_ERROR on save failure', async () => {
    client.state.result = { data: null, error: { message: 'dup' } };
    await expect(repo.save(buildCode())).rejects.toBeInstanceOf(AppError);

    client.state.result = { data: null, error: null };
    await expect(repo.save(buildCode())).rejects.toThrow('Desconocido');
  });

  it('should update attempts and invalidate by user', async () => {
    client.state.result = { data: null, error: null };

    await expect(repo.update(buildCode())).resolves.toBeUndefined();
    expect(client.builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 0, used: false }),
    );

    await expect(repo.invalidateAllByUserId('user-1')).resolves.toBeUndefined();
    expect(client.builder.update).toHaveBeenCalledWith({ used: true });
  });

  it('should throw DB_ERROR on update/invalidate failures', async () => {
    client.state.result = { data: null, error: { message: 'x' } };

    await expect(repo.update(buildCode())).rejects.toMatchObject({ code: 'DB_ERROR' });
    await expect(repo.invalidateAllByUserId('user-1')).rejects.toMatchObject({ code: 'DB_ERROR' });
  });
});
