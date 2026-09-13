import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabasePocketRepository } from '../../../infrastructure/repositories/SupabasePocketRepository';
import { Pocket } from '../../../domain/entities/Pocket';

/**
 * Rutas missing-table por metodo.
 *
 * El flag fallbackEnabled es global al modulo: CADA test de este archivo
 * observa el flag apagado porque es el unico que lo enciende en su archivo.
 * (Un archivo = un registro de modulos fresco en vitest.)
 */
function mockClient() {
  const state: { result: { data: unknown; error: unknown } } = {
    result: { data: null, error: null },
  };
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
  };
  for (const k of Object.keys(builder)) {
    builder[k].mockReturnValue(builder);
  }
  (builder as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
    resolve(state.result);
  builder.single.mockImplementation(async () => state.result);
  return { builder, state };
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

const MISSING = { code: '42P01', message: 'missing table' };

describe('SupabasePocketRepository — fallback por metodo', () => {
  let client: ReturnType<typeof mockClient>;
  let repo: SupabasePocketRepository;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    client = mockClient();
    repo = new SupabasePocketRepository(client.builder as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('findById: rejection missing-table', async () => {
    const single = client.builder.single as unknown as ReturnType<typeof vi.fn>;
    single.mockRejectedValueOnce(MISSING);

    await expect(repo.findById('pocket-1')).rejects.toMatchObject({ code: 'DB_TABLE_MISSING' });
  });

  it('fallback lifecycle: early returns serve from memory', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await expect(repo.findById('pocket-1')).resolves.toBeNull();
      await expect(repo.findByAccountId('acc-1')).resolves.toEqual([]);
      await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(0);

      const saved = await repo.save(buildPocket());
      expect(saved.id).toBe('pocket-1');
      await expect(repo.findById('pocket-1')).resolves.not.toBeNull();
      await expect(repo.findByAccountId('acc-1')).resolves.toHaveLength(1);
      await expect(repo.getTotalAmountByAccountId('acc-1')).resolves.toBe(50000);

      const updated = await repo.update(buildPocket());
      expect(updated.id).toBe('pocket-1');

      await expect(repo.delete('pocket-1')).resolves.toBeUndefined();
      await expect(repo.findById('pocket-1')).resolves.toBeNull();
    } finally {
      warn.mockRestore();
    }
  });
});
