import { apiClient } from '@/shared/services/api.client';
import { RecipientInfo, TransferReceipt, TransferHistoryItem } from '../types/transfer.types';

/**
 * TransferService — servicios del modulo de transferencias.
 * Responsabilidad unica: comunicarse con la API REST del backend.
 */
class TransferService {
  /**
   * Busca un destinatario por numero de cuenta.
   * GET /accounts/search?accountNumber=...
   */
  async searchByAccountNumber(accountNumber: string): Promise<RecipientInfo> {
    const response = await apiClient.get<RecipientInfo>(
      `/accounts/search?accountNumber=${encodeURIComponent(accountNumber)}`,
    );
    return response.data;
  }

  /**
   * Busca un destinatario por correo electronico.
   * GET /users/search?email=...
   */
  async searchByEmail(email: string): Promise<RecipientInfo> {
    const response = await apiClient.get<RecipientInfo>(
      `/users/search?email=${encodeURIComponent(email)}`,
    );
    return response.data;
  }

  /**
   * Crea una transferencia.
   * POST /transfers
   */
  async createTransfer(payload: {
    senderAccountId: string;
    receiverAccountNumber: string;
    amount: number;
    description?: string | null;
  }): Promise<TransferReceipt> {
    const response = await apiClient.post<TransferReceipt>('/transfers', payload);
    return response.data;
  }

  /**
   * Obtiene el comprobante de una transferencia.
   * GET /transfers/:id
   */
  async getTransfer(id: string): Promise<TransferReceipt> {
    const response = await apiClient.get<TransferReceipt>(`/transfers/${id}`);
    return response.data;
  }
  /**
   * Obtiene el historial de transacciones de una cuenta especifica.
   * GET /transfers/account/:accountId
   */
  async getAccountHistory(accountId: string): Promise<TransferHistoryItem[]> {
    const response = await apiClient.get<TransferHistoryItem[]>(`/transfers/account/${accountId}`);
    return response.data;
  }
}

export const transferService = new TransferService();
