import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseVirtualCardRepository } from '../../../infrastructure/repositories/SupabaseVirtualCardRepository';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import { AppError } from '../../../shared/errors/AppError';
import { buildVirtualCard } from './in-memory-repos';

function cardRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'card-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    card_holder_name: 'TEST USER',
    card_number: '4532000000001234',
    last_four: '1234',
    expiration_date: '09/30',
    cvv: '123',
    status: CardStatus.ACTIVA,
    created_at: new Date('2026-08-01T00:00:00.000Z').toISOString(),
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
    single: vi.fn(),
    then: (resolve: (v: unknown) => void) => resolve(state.result),
  } as never;
  for (const k of ['from', 'insert', 'select', 'eq', 'order', 'update'] as const) {
    (builder[k] as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  }
  (builder.single as ReturnType<typeof vi.fn>).mockImplementation(async () => state.result);
  return { builder, state };
}

describe('SupabaseVirtualCardRepository', () => {
  let client: ReturnType<typeof mockClient>;
  let repo: SupabaseVirtualCardRepository;

  beforeEach(() => {
    client = mockClient();
    repo = new SupabaseVirtualCardRepository(client.builder as never);
  });

  describe('save', () => {
    it('should insert and map the row back', async () => {
      client.state.result = { data: cardRow(), error: null };

      const result = await repo.save(buildVirtualCard('user-1', 'acc-1'));

      expect(client.builder.from).toHaveBeenCalledWith('virtual_cards');
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe(CardStatus.ACTIVA);
    });

    it('should throw DB_ERROR on failure or empty data', async () => {
      client.state.result = { data: null, error: { message: 'dup' } };
      await expect(repo.save(buildVirtualCard('user-1', 'acc-1'))).rejects.toBeInstanceOf(AppError);

      client.state.result = { data: null, error: null };
      await expect(repo.save(buildVirtualCard('user-1', 'acc-1'))).rejects.toMatchObject({ code: 'DB_ERROR' });
    });
  });

  describe('findById', () => {
    it('should return the mapped card', async () => {
      client.state.result = { data: cardRow(), error: null };

      const result = await repo.findById('card-1');

      expect(result?.cardNumber).toBe('4532000000001234');
      expect(client.builder.eq).toHaveBeenCalledWith('id', 'card-1');
    });

    it('should return null on error or missing data', async () => {
      client.state.result = { data: null, error: { message: 'x' } };
      await expect(repo.findById('card-1')).resolves.toBeNull();

      client.state.result = { data: null, error: null };
      await expect(repo.findById('card-1')).resolves.toBeNull();
    });
  });

  describe('findByUserId / findByAccountId', () => {
    it('should return mapped lists', async () => {
      client.state.result = { data: [cardRow(), cardRow({ id: 'card-2' })], error: null };

      const byUser = await repo.findByUserId('user-1');
      expect(byUser).toHaveLength(2);
      expect(client.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');

      const byAccount = await repo.findByAccountId('acc-1');
      expect(byAccount).toHaveLength(2);
      expect(client.builder.eq).toHaveBeenCalledWith('account_id', 'acc-1');
    });

    it('should return [] on error', async () => {
      client.state.result = { data: null, error: { message: 'x' } };

      await expect(repo.findByUserId('user-1')).resolves.toEqual([]);
      await expect(repo.findByAccountId('acc-1')).resolves.toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update and return the mapped card', async () => {
      client.state.result = { data: cardRow({ status: CardStatus.BLOQUEADA }), error: null };

      const result = await repo.updateStatus('card-1', CardStatus.BLOQUEADA);

      expect(client.builder.update).toHaveBeenCalledWith({ status: CardStatus.BLOQUEADA });
      expect(result.status).toBe(CardStatus.BLOQUEADA);
    });

    it('should fall back to findById when the update returns nothing', async () => {
      const single = client.builder.single as unknown as ReturnType<typeof vi.fn>;
      single
        .mockResolvedValueOnce({ data: null, error: { message: 'x' } })
        .mockResolvedValueOnce({ data: cardRow(), error: null });

      const result = await repo.updateStatus('card-1', CardStatus.BLOQUEADA);

      expect(result.id).toBe('card-1');
    });

    it('should throw CARD_NOT_FOUND when fallback finds nothing', async () => {
      client.state.result = { data: null, error: { message: 'x' } };

      await expect(repo.updateStatus('card-1', 'X')).rejects.toMatchObject({ code: 'CARD_NOT_FOUND' });
    });
  });
});
