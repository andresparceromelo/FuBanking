export interface LoanSimulationPayload {
  amount: number;
  installments: number;
  annualRate: number;
}

export interface LoanSimulationResponse {
  amount: number;
  installments: number;
  annualRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
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

export interface LoanApplicationResponse {
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
