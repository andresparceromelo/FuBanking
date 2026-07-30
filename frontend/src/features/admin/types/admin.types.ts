export interface AdminLoanApplication {
  id: string;
  userId: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  documentVerified: boolean;
  ageVerified: boolean;
  incomeVerified: boolean;
  creditHistoryVerified: boolean;
  eligibility: {
    isEligible: boolean;
    reasons: string[];
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
