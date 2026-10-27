export interface LoanSimulationPayload {
  amount: number;
  installments: number;
  annualRate: number;
}

export type SimulateLoanPayload = LoanSimulationPayload;

export interface LoanSimulation {
  amount?: number;
  installments?: number;
  annualRate?: number;
  monthlyRate?: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
}

export type LoanSimulationResponse = LoanSimulation;

export interface CreateLoanPayload extends LoanSimulationPayload {
  monthlyIncome: number;
}

export interface LoanEligibility {
  isEligible: boolean;
  reasons: string[];
}

export interface LoanApplication {
  id: string;
  userId?: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome?: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  eligibility: LoanEligibility;
  status: string;
  createdAt: string;
}

export interface MyLoanItem {
  id: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  status: string;
  createdAt: string;
}
