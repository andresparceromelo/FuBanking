import { apiClient } from '@/shared/services/api.client';

export interface CreatePocketPayload {
  accountId: string;
  name: string;
  amount: number;
}

export interface UpdatePocketPayload {
  name?: string;
  amount?: number;
}

export interface TransferPocketPayload {
  fromPocketId: string;
  toPocketId: string;
  amount: number;
}

export interface PocketItem {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PocketTransferResponse {
  fromPocket: PocketItem;
  toPocket: PocketItem;
}

class PocketService {
  async getByAccount(accountId: string): Promise<PocketItem[]> {
    const response = await apiClient.get<PocketItem[]>(`/pockets/account/${accountId}`);
    return response.data;
  }

  async create(payload: CreatePocketPayload): Promise<PocketItem> {
    const response = await apiClient.post<PocketItem>('/pockets', payload);
    return response.data;
  }

  async update(pocketId: string, payload: UpdatePocketPayload): Promise<PocketItem> {
    const response = await apiClient.patch<PocketItem>(`/pockets/${pocketId}`, payload);
    return response.data;
  }

  async remove(pocketId: string): Promise<PocketItem> {
    const response = await apiClient.delete<PocketItem>(`/pockets/${pocketId}`);
    return response.data;
  }

  async transfer(payload: TransferPocketPayload): Promise<PocketTransferResponse> {
    const response = await apiClient.post<PocketTransferResponse>('/pockets/transfer', payload);
    return response.data;
  }
}

export const pocketService = new PocketService();
