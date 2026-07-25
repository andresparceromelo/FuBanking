import { apiClient } from '@/shared/services/api.client';
import { Account, CreateAccountPayload } from '../types/account.types';

/**
 * AccountService — capa de servicios del frontend.
 *
 * Responsabilidad única: comunicarse con la API REST del backend.
 * Los hooks consumen este servicio y manejan el estado.
 */
class AccountService {
  /**
   * Obtiene todas las cuentas del usuario autenticado.
   * GET /accounts/me
   */
  async getMyAccounts(): Promise<Account[]> {
    const response = await apiClient.get<Account[]>('/accounts/me');
    return response.data;
  }

  /**
   * Obtiene el detalle de una cuenta específica.
   * GET /accounts/:id
   */
  async getAccountDetails(id: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  }

  /**
   * Crea una nueva cuenta bancaria.
   * POST /accounts
   */
  async createAccount(payload: CreateAccountPayload): Promise<Account> {
    const response = await apiClient.post<Account>('/accounts', payload);
    return response.data;
  }
}

export const accountService = new AccountService();
