import { apiClient } from '@/shared/services/api.client';
import { CreateMoneyRequestPayload, MoneyRequest } from '../types/money-request.types';

class MoneyRequestService {
  async createRequest(payload: CreateMoneyRequestPayload): Promise<MoneyRequest> {
    const response = await apiClient.post<MoneyRequest>('/money-requests', payload);
    return response.data;
  }

  async getMyRequests(): Promise<MoneyRequest[]> {
    const response = await apiClient.get<MoneyRequest[]>('/money-requests/me');
    return response.data;
  }

  async respond(requestId: string, accept: boolean): Promise<MoneyRequest> {
    const response = await apiClient.patch<MoneyRequest>(`/money-requests/${requestId}/respond`, { accept });
    return response.data;
  }
}

export const moneyRequestService = new MoneyRequestService();

