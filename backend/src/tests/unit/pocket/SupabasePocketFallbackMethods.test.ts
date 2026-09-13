import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabasePocketRepository } from '../../../infrastructure/repositories/SupabasePocketRepository';
import { Pocket } from '../../../domain/entities/Pocket';

/**
 * Catch missing-table de findByAccountId.
 * Archivo dedicado: el flag fallbackEnabled es global al modulo y este test
 * debe observarlo apagado (un archivo = registro fresco en vitest).
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
  for (const k of Object.keys(builder)) builder[k].mockReturnValue(builder);
  (builder as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
    resolve(state.result);
  builder.single.mockImplementation(async () => state.result);
  return { builder, state };
}

describe('SupabasePocketRepository — fallback findByAccountId', () => {
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

  it('should map missing-table rejection', async () => {
    const eq = client.builder.eq as unknown as ReturnType<typeof vi.fn>;

    eq.mockImplementationOnce(() => {
      throw { code: '42P01', message: 'missing' };
    });

    await expect(repo.findByAccountId('acc-1')).rejects.toMatchObject({ code: 'DB_TABLE_MISSING' });
  });
});
