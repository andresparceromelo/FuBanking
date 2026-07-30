export interface LoanSimulationPayload {
  amount: number;
  installments: number;
  annualRate: number;
}

export interface LoanSimulationResponse {
  amount: number;
  installments: number;
  annualRate: number;
  monthlyRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
}

export interface CreateLoanPayload extends LoanSimulationPayload {
  monthlyIncome: number;
  documentVerified: boolean;
  ageVerified: boolean;
  incomeVerified: boolean;
  creditHistoryVerified: boolean;
}

export interface LoanApplication {
  id: string;
  userId: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyPayment?: number;
  status?: string;
  createdAt?: string;
}
