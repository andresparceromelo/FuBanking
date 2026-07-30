import { apiClient } from '@/shared/services/api.client';
import { RevealedVirtualCardDetails, VirtualCard } from '../types/card.types';

class CardService {
  async getMyCards(): Promise<VirtualCard[]> {
    const response = await apiClient.get<VirtualCard[]>('/cards/me');
    return response.data;
  }

  async createCard(accountId: string): Promise<VirtualCard> {
    const response = await apiClient.post<VirtualCard>('/cards', { accountId });
    return response.data;
  }

  async toggleLock(cardId: string): Promise<VirtualCard> {
    const response = await apiClient.patch<VirtualCard>(`/cards/${cardId}/toggle-lock`);
    return response.data;
  }

  async revealDetails(cardId: string): Promise<RevealedVirtualCardDetails> {
    const response = await apiClient.get<RevealedVirtualCardDetails>(`/cards/${cardId}/reveal`);
    return response.data;
  }
}

export const cardService = new CardService();

