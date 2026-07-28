import { apiClient } from '@/shared/services/api.client';

type SearchMode = 'account' | 'email';

export interface TransferPayload {
  senderAccountId: string;
  receiverAccountNumber: string;
  amount: number;
  description?: string;
}

export interface TransferReceipt {
  id: string;
  referenceNumber: string;
  senderAccount: string;
  receiverAccount: string;
  receiverName: string;
  amount: number;
  type: string;
  status: string;
  description?: string | null;
  createdAt: string;
}

export interface TransferRecipient {
  name: string;
  accountNumber: string;
  accountNumberFull: string;
}

export interface TransactionHistoryItem {
  id: string;
  referenceNumber: string;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  createdAt: string;
  direction: 'INCOMING' | 'OUTGOING';
  relatedAccount: string;
  relatedName: string;
}

class TransferService {
  async createTransfer(payload: TransferPayload): Promise<TransferReceipt> {
    const response = await apiClient.post<TransferReceipt>('/transfers', payload);
    return response.data;
  }

  async searchRecipient(query: string, mode: SearchMode): Promise<TransferRecipient> {
    const endpoint =
      mode === 'email'
        ? `/transfers/search/email?email=${encodeURIComponent(query)}`
        : `/accounts/search?accountNumber=${encodeURIComponent(query)}`;

    const response = await apiClient.get<TransferRecipient>(endpoint);
    return response.data;
  }

  async searchAccountByNumber(accountNumber: string): Promise<TransferRecipient> {
    return this.searchRecipient(accountNumber, 'account');
  }

  async getAccountHistory(accountId: string): Promise<TransactionHistoryItem[]> {
    const response = await apiClient.get<TransactionHistoryItem[]>(`/transfers/account/${accountId}`);
    return response.data;
  }
}

export const transferService = new TransferService();
