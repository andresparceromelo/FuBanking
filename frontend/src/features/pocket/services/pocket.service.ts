import { apiClient } from '@/shared/services/api.client';
import { CreatePocketPayload, Pocket, TransferPocketPayload, UpdatePocketPayload } from '../types/pocket.types';

class PocketService {
  async createPocket(payload: CreatePocketPayload): Promise<Pocket> {
    const response = await apiClient.post<Pocket>('/pockets', payload);
    return response.data;
  }

  async getAccountPockets(accountId: string): Promise<Pocket[]> {
    const response = await apiClient.get<Pocket[]>(`/pockets/account/${accountId}`);
    return response.data;
  }

  async updatePocket(pocketId: string, payload: UpdatePocketPayload): Promise<Pocket> {
    const response = await apiClient.patch<Pocket>(`/pockets/${pocketId}`, payload);
    return response.data;
  }

  async transferPocket(payload: TransferPocketPayload): Promise<{ fromPocket: Pocket; toPocket: Pocket }> {
    const response = await apiClient.post<{ fromPocket: Pocket; toPocket: Pocket }>('/pockets/transfer', payload);
    return response.data;
  }
}

export const pocketService = new PocketService();

