import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabasePocketRepository as SupabasePocketRepositoryType } from '../../../infrastructure/repositories/SupabasePocketRepository';
import { Pocket } from '../../../domain/entities/Pocket';

function pocketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pocket-1',
    account_id: 'acc-1',
    name: 'Viaje',
    amount: 50000,
    created_at: new Date('2026-08-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-08-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function buildPocket(): Pocket {
  return new Pocket({
    id: 'pocket-1',
    accountId: 'acc-1',
    name: 'Viaje',
    amount: 50000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
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

describe('SupabasePocketRepository', () => {
  let client: ReturnType<typeof mockClient>;
  let repo: SupabasePocketRepositoryType;

  beforeEach(async () => {
    // El flag fallbackEnabled es global al modulo: modulo fresco por test
    // para que el orden no afecte (cada test observa el flag apagado).
    vi.resetModules();
    const mod = await import(
      '../../../infrastructure/repositories/SupabasePocketRepository'
    );
    client = mockClient();
    repo = new mod.SupabasePocketRepository(client.builder as never);
  });

  describe('CRUD happy path', () => {
    it('should save and map the row', async () => {
      client.state.result = { data: pocketRow(), error: null };

      const result = await repo.save(buildPocket());

      expect(client.builder.from).toHaveBeenCalledWith('pockets');
      expect(result.name).toBe('Viaje');
      expect(result.amount).toBe(50000);
    });

    it('should find by id, account and total amounts', async () => {
      client.state.result = { data: pocketRow(), error: null };
      const found = await repo.findById('pocket-1');
      expect(found?.id).toBe('pocket-1');
      expect(client.builder.eq).toHaveBeenCalledWith('id', 'pocket-1');

      client.state.result = { data: [pocketRow(), pocketRow({ id: 'pocket-2', amount: 30000 })], error: null };
      const list = await repo.findByAccountId('acc-1');
      expect(list).toHaveLength(2);

      client.state.result = { data: [{ amount: 50000 }, { amount: '30000' }], error: null };
      await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(80000);
    });

    it('should update and delete', async () => {
      client.state.result = { data: pocketRow(), error: null };
      const updated = await repo.update(buildPocket());
      expect(updated.id).toBe('pocket-1');
      expect(client.builder.update).toHaveBeenCalled();

      client.state.result = { data: null, error: null };
      await expect(repo.delete('pocket-1')).resolves.toBeUndefined();
    });

    it('should throw DB_ERROR on save/update/delete failures', async () => {
      client.state.result = { data: null, error: { message: 'dup' } };

      await expect(repo.save(buildPocket())).rejects.toMatchObject({
        code: 'DB_ERROR',
        message: expect.stringContaining('crear bolsillo'),
      });
      await expect(repo.update(buildPocket())).rejects.toMatchObject({ code: 'DB_ERROR' });
      await expect(repo.delete('pocket-1')).rejects.toMatchObject({ code: 'DB_ERROR' });
      await expect(repo.findById('pocket-1')).resolves.toBeNull();
      await expect(repo.findByAccountId('acc-1')).resolves.toEqual([]);
    });

    it('should throw Desconocido on empty save result', async () => {
      client.state.result = { data: null, error: null };

      await expect(repo.save(buildPocket())).rejects.toThrow('Desconocido');
    });

    it('should fall back to Desconocido on messageless update error', async () => {
      client.state.result = { data: null, error: {} };

      await expect(repo.update(buildPocket())).rejects.toThrow('Desconocido');
    });

    it('should return 0 totals on error or empty data', async () => {
      client.state.result = { data: null, error: { message: 'timeout' } };
      await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(0);

      client.state.result = { data: null, error: null };
      await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(0);
    });
  });

  describe('client rejections', () => {
    it('should rethrow non-missing errors from finders', async () => {
      const single = client.builder.single as unknown as ReturnType<typeof vi.fn>;
      single.mockRejectedValueOnce(new Error('conn reset'));

      await expect(repo.findById('pocket-1')).rejects.toThrow('conn reset');
    });

    it('should rethrow generic rejections from list and total', async () => {
      const eq = client.builder.eq as unknown as ReturnType<typeof vi.fn>;

      eq.mockImplementationOnce(() => {
        throw new Error('list fail');
      });
      await expect(repo.findByAccountId('acc-1')).rejects.toThrow('list fail');

      eq.mockImplementationOnce(() => {
        throw new Error('total fail');
      });
      await expect(repo.getTotalAmountByAccountId('acc-1')).rejects.toThrow('total fail');
    });

    it('should rethrow generic save/update/delete/total rejections', async () => {
      const single = client.builder.single as unknown as ReturnType<typeof vi.fn>;

      single.mockRejectedValueOnce(new Error('save fail'));
      await expect(repo.save(buildPocket())).rejects.toThrow('save fail');

      single.mockRejectedValueOnce(new Error('update fail'));
      await expect(repo.update(buildPocket())).rejects.toThrow('update fail');
    });

    it('should map missing-table rejections per method', async () => {
      const eq = client.builder.eq as unknown as ReturnType<typeof vi.fn>;
      const missing = { code: '42P01', message: 'missing' };

      eq.mockImplementationOnce(() => {
        throw missing;
      });
      await expect(repo.findByAccountId('acc-1')).rejects.toMatchObject({ code: 'DB_TABLE_MISSING' });
    });

    it('should fall back on missing-table list/total rejections', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eq = client.builder.eq as unknown as ReturnType<typeof vi.fn>;
      const missing = { code: '42P01', message: 'missing' };
      try {
        eq.mockImplementationOnce(() => {
          throw missing;
        });
        await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(0);
      } finally {
        warn.mockRestore();
      }
    });

    it('should fall back on missing-table save rejection', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const single = client.builder.single as unknown as ReturnType<typeof vi.fn>;
      try {
        single.mockRejectedValueOnce({ code: '42P01', message: 'missing' });
        const saved = await repo.save(buildPocket());
        expect(saved.id).toBe('pocket-1');
      } finally {
        warn.mockRestore();
      }
    });

    it('should fall back on missing-table update rejection', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const single = client.builder.single as unknown as ReturnType<typeof vi.fn>;
      try {
        single.mockRejectedValueOnce({ code: '42P01', message: 'missing' });
        const updated = await repo.update(buildPocket());
        expect(updated.id).toBe('pocket-1');
      } finally {
        warn.mockRestore();
      }
    });

    it('should fall back on missing-table delete rejection', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eq = client.builder.eq as unknown as ReturnType<typeof vi.fn>;
      try {
        eq.mockImplementationOnce(() => {
          throw { code: '42P01', message: 'missing' };
        });
        await expect(repo.delete('pocket-1')).resolves.toBeUndefined();
      } finally {
        warn.mockRestore();
      }
    });

    it('should fall back on missing-table total rejection', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eq = client.builder.eq as unknown as ReturnType<typeof vi.fn>;
      try {
        eq.mockImplementationOnce(() => {
          throw { code: '42P01', message: 'missing' };
        });
        await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(0);
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe('missing-table error results', () => {
    const missing = { code: '42P01', message: 'missing table' };

    it('should fall back to memory on save', async () => {
      client.state.result = { data: null, error: missing };

      const result = await repo.save(buildPocket());

      expect(result.id).toBe('pocket-1');
      await expect(repo.findById('pocket-1')).resolves.not.toBeNull();
    });

    it('should fall back to memory on update', async () => {
      client.state.result = { data: null, error: missing };

      const result = await repo.update(buildPocket());

      expect(result.id).toBe('pocket-1');
    });

    it('should fall back to memory on delete', async () => {
      client.state.result = { data: null, error: missing };

      await expect(repo.delete('pocket-1')).resolves.toBeUndefined();
    });

    it('should return 0 on getTotal with missing table', async () => {
      client.state.result = { data: null, error: missing };

      await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(0);
    });
  });

  // NOTA: estos tests activan el fallback global del modulo y deben ir al final.
  describe('missing-table fallback', () => {
    it('should detect all missing-table shapes', () => {
      const isMissing = (e: unknown) =>
        (repo as unknown as { isMissingTableError(err: unknown): boolean }).isMissingTableError(e);

      expect(isMissing({ code: '42P01' })).toBe(true);
      expect(isMissing({ message: 'could not find the table pockets' })).toBe(true);
      expect(isMissing({ message: 'relation "pockets" does not exist' })).toBe(true);
      expect(isMissing({ message: 'timeout' })).toBe(false);
      expect(isMissing(null)).toBe(false);
    });

    it('should throw DB_TABLE_MISSING from the handler', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const handle = (repo as unknown as { handleMissingTable(err: unknown): never })
          .handleMissingTable.bind(repo);
        expect(() => handle({ message: 'x' })).toThrow(/aún no está creada/i);
        expect(() => handle(null)).toThrow(/aún no está creada/i);
      } finally {
        warn.mockRestore();
      }
    });
  });
});
