import { apiClient } from '@/shared/services/api.client';

export interface SimulateLoanPayload {
  amount: number;
  installments: number;
  annualRate: number;
}

export interface CreateLoanPayload {
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome: number;
  documentVerified: boolean;
  ageVerified: boolean;
  incomeVerified: boolean;
  creditHistoryVerified: boolean;
}

export interface LoanSimulation {
  amount: number;
  installments: number;
  annualRate: number;
  monthlyRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
}

export interface LoanApplication {
  id: string;
  userId: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  eligibility: {
    isEligible: boolean;
    reasons: string[];
  };
  status: string;
  createdAt: string;
}

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
}

export const loanService = new LoanService();
