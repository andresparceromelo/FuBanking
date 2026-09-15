import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseResetTokenRepository, hashToken } from '../../../infrastructure/repositories/SupabaseResetTokenRepository';

function mockSupabase() {
  const single = vi.fn();
  const select = vi.fn().mockReturnValue({ single });
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select }), select }) });
  const eq = vi.fn().mockReturnValue({ single, eq: vi.fn().mockReturnValue({ select, single, eq: vi.fn().mockReturnValue({ select }) }) });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert, select: vi.fn().mockReturnValue({ eq }), update });
  
  return {
    client: { from } as unknown as SupabaseClient,
    from,
    insert,
    select,
    single,
    update,
    eq,
  };
}

describe('SupabaseResetTokenRepository', () => {
  let db: ReturnType<typeof mockSupabase>;
  let repo: SupabaseResetTokenRepository;

  beforeEach(() => {
    db = mockSupabase();
    repo = new SupabaseResetTokenRepository(db.client);
  });

  it('hashToken should return a SHA-256 hash', () => {
    const hash = hashToken('test-token');
    // SHA-256 in hex is 64 characters long
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('save should insert and return mapped record', async () => {
    const dbRecord = {
      id: 'uuid',
      token_hash: 'hash1',
      user_id: 'u1',
      used: false,
      expires_at: '2026-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
    };
    db.single.mockResolvedValue({ data: dbRecord, error: null });

    const result = await repo.save({
      tokenHash: 'hash1',
      userId: 'u1',
      used: false,
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(db.from).toHaveBeenCalledWith('reset_tokens');
    expect(db.insert).toHaveBeenCalled();
    expect(result.id).toBe('uuid');
    expect(result.tokenHash).toBe('hash1');
  });

  it('save should throw AppError on failure', async () => {
    db.single.mockResolvedValue({ data: null, error: { message: 'db error' } });

    await expect(repo.save({
      tokenHash: 'hash1',
      userId: 'u1',
      used: false,
      expiresAt: new Date(),
    })).rejects.toThrow(/Error al guardar token/);
  });

  it('invalidateAllByUserId should update rows', async () => {
    // The chain is from().update().eq().eq()
    const innerEq = vi.fn().mockResolvedValue({ error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: innerEq });
    db.update.mockReturnValue({ eq: firstEq });

    await repo.invalidateAllByUserId('u1');

    expect(db.from).toHaveBeenCalledWith('reset_tokens');
    expect(db.update).toHaveBeenCalledWith({ used: true });
    expect(firstEq).toHaveBeenCalledWith('user_id', 'u1');
    expect(innerEq).toHaveBeenCalledWith('used', false);
  });

  it('findByTokenHash should return a record', async () => {
    const dbRecord = {
      id: 'uuid',
      token_hash: 'hash1',
      user_id: 'u1',
      used: true,
      expires_at: '2026-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
    };
    db.single.mockResolvedValue({ data: dbRecord, error: null });

    const result = await repo.findByTokenHash('hash1');

    expect(db.from).toHaveBeenCalledWith('reset_tokens');
    expect(result?.used).toBe(true);
    expect(result?.userId).toBe('u1');
  });

  it('markAsUsed should update row', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    db.update.mockReturnValue({ eq });

    await repo.markAsUsed('hash1');

    expect(db.update).toHaveBeenCalledWith({ used: true });
    expect(eq).toHaveBeenCalledWith('token_hash', 'hash1');
  });
});
