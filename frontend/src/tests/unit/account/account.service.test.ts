import { expect as assert } from '@assertive-ts/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/shared/services/api.client';
import { accountService } from '@/features/account/services/account.service';

vi.mock('@/shared/services/api.client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

describe('accountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('withdraw - should POST /accounts/:id/withdraw and return updated account', async () => {
    const accountId = 'acc123';
    const amount = 50;
    const description = 'Retiro cajero';
    
    const mockResponse = { id: accountId, balance: 50 };
    post.mockResolvedValue({ data: mockResponse });

    const result = await accountService.withdraw(accountId, amount, description);

    expect(post).toHaveBeenCalledWith(`/accounts/${accountId}/withdraw`, { amount, description });
    assert(result).toBeEqual(mockResponse);
  });
  
  it('deposit - should POST /accounts/:id/deposit and return updated account', async () => {
    const accountId = 'acc123';
    const amount = 100;
    
    const mockResponse = { id: accountId, balance: 100 };
    post.mockResolvedValue({ data: mockResponse });

    const result = await accountService.deposit(accountId, amount);

    expect(post).toHaveBeenCalledWith(`/accounts/${accountId}/deposit`, { amount, description: undefined });
    assert(result).toBeEqual(mockResponse);
  });
  
  it('getMyAccounts - should GET /accounts/me and return accounts array', async () => {
    const mockResponse = [{ id: 'acc123', balance: 100 }];
    get.mockResolvedValue({ data: mockResponse });

    const result = await accountService.getMyAccounts();

    expect(get).toHaveBeenCalledWith('/accounts/me');
    assert(result).toBeEqual(mockResponse);
  });
  
  it('getAccountDetails - should GET /accounts/:id and return account details', async () => {
    const accountId = 'acc123';
    const mockResponse = { id: accountId, balance: 100 };
    get.mockResolvedValue({ data: mockResponse });

    const result = await accountService.getAccountDetails(accountId);

    expect(get).toHaveBeenCalledWith(`/accounts/${accountId}`);
    assert(result).toBeEqual(mockResponse);
  });
  
  it('createAccount - should POST /accounts and return new account', async () => {
    const payload = { accountType: 'AHORROS' as const };
    const mockResponse = { id: 'acc123', accountType: 'AHORROS' };
    post.mockResolvedValue({ data: mockResponse });

    const result = await accountService.createAccount(payload);

    expect(post).toHaveBeenCalledWith('/accounts', payload);
    assert(result).toBeEqual(mockResponse);
  });
  
  it('deleteAccount - should DELETE /accounts/:id and return closed account', async () => {
    const accountId = 'acc123';
    const mockResponse = { id: accountId, status: 'CERRADA' };
    del.mockResolvedValue({ data: mockResponse });

    const result = await accountService.deleteAccount(accountId);

    expect(del).toHaveBeenCalledWith(`/accounts/${accountId}`);
    assert(result).toBeEqual(mockResponse);
  });
});
