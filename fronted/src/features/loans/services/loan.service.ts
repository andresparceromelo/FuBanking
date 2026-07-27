import { apiClient } from '@/shared/services/api.client';
import { CreateLoanPayload, LoanApplicationResponse, LoanSimulationPayload, LoanSimulationResponse } from '../types/loan.types';

class LoanService {
  async simulateLoan(data: LoanSimulationPayload): Promise<LoanSimulationResponse> {
    const response = await apiClient.post<LoanSimulationResponse>('/loans/simulate', data);
    return response.data;
  }

  async createLoan(data: CreateLoanPayload): Promise<LoanApplicationResponse> {
    const response = await apiClient.post<LoanApplicationResponse>('/loans', data);
    return response.data;
  }
}

export const loanService = new LoanService();
