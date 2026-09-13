import { LoanApplicationStatus } from '../../../domain/entities/LoanApplication';

export interface SimulateLoanDto {
  amount: number;
  installments: number;
  annualRate: number;
}

export interface SimulateLoanResponseDto {
  amount: number;
  installments: number;
  annualRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
}

export interface CreateLoanApplicationDto {
  userId: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome: number;
}

export interface CreateLoanApplicationResponseDto {
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
  status: LoanApplicationStatus;
  createdAt: string;
}
