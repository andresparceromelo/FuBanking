import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/shared/services/api.client';
import { pocketService } from '@/features/pockets/services/pocket.service';

vi.mock('@/shared/services/api.client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

describe('pocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should GET by account and return data', async () => {
    const pockets = [{ id: 'p1' }];
    get.mockResolvedValue({ data: pockets });

    const result = await pocketService.getByAccount('acc-1');

    expect(get).toHaveBeenCalledWith('/pockets/account/acc-1');
    expect(result).toEqual(pockets);
  });

  it('should POST create and return data', async () => {
    const pocket = { id: 'p1', name: 'Viaje' };
    post.mockResolvedValue({ data: pocket });
    const payload = { accountId: 'acc-1', name: 'Viaje', amount: 50000 };

    const result = await pocketService.create(payload);

    expect(post).toHaveBeenCalledWith('/pockets', payload);
    expect(result).toEqual(pocket);
  });

  it('should PATCH update and DELETE remove', async () => {
    const pocket = { id: 'p1', name: 'Nuevo' };
    patch.mockResolvedValue({ data: pocket });
    del.mockResolvedValue({ data: pocket });

    await expect(pocketService.update('p1', { name: 'Nuevo' })).resolves.toEqual(pocket);
    expect(patch).toHaveBeenCalledWith('/pockets/p1', { name: 'Nuevo' });

    await expect(pocketService.remove('p1')).resolves.toEqual(pocket);
    expect(del).toHaveBeenCalledWith('/pockets/p1');
  });

  it('should POST transfer and return data', async () => {
    const result = { fromPocket: { id: 'p1' }, toPocket: { id: 'p2' } };
    post.mockResolvedValue({ data: result });
    const payload = { fromPocketId: 'p1', toPocketId: 'p2', amount: 1000 };

    await expect(pocketService.transfer(payload)).resolves.toEqual(result);
    expect(post).toHaveBeenCalledWith('/pockets/transfer', payload);
  });

  it('should propagate errors', async () => {
    get.mockRejectedValue({ code: 'NOT_FOUND', message: 'No' });

    await expect(pocketService.getByAccount('acc-1')).rejects.toEqual({
      code: 'NOT_FOUND',
      message: 'No',
    });
  });
});
