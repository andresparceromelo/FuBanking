import { apiClient } from '@/shared/services/api.client';
import type {
  LoanSimulation,
  LoanApplication,
  SimulateLoanPayload,
  CreateLoanPayload,
} from '../types/loan.types';

export type {
  LoanSimulation,
  LoanApplication,
  SimulateLoanPayload,
  CreateLoanPayload,
};

class LoanService {
  async simulate(payload: SimulateLoanPayload): Promise<LoanSimulation> {
    const response = await apiClient.post<LoanSimulation>('/loans/simulate', payload);
    return response.data;
  }

  async simulateLoan(payload: SimulateLoanPayload): Promise<LoanSimulation> {
    return this.simulate(payload);
  }

  async create(payload: CreateLoanPayload): Promise<LoanApplication> {
    const response = await apiClient.post<LoanApplication>('/loans', payload);
    return response.data;
  }

  async createLoan(payload: CreateLoanPayload): Promise<LoanApplication> {
    return this.create(payload);
  }

  async getMyLoans(): Promise<LoanApplication[]> {
    const response = await apiClient.get<LoanApplication[]>('/loans/me');
    return response.data;
  }
}

export const loanService = new LoanService();
