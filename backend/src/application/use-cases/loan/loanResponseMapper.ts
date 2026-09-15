import { LoanApplication, LoanApplicationStatus } from '../../../domain/entities/LoanApplication';

export interface LoanResponseDto {
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
  eligibility: { isEligible: boolean; reasons: string[] };
  status: LoanApplicationStatus;
  createdAt: string;
}

/**
 * Serializa un LoanApplication al DTO de respuesta compartido por
 * ApproveLoan y RejectLoan (antes duplicado en ambos).
 */
export function toLoanResponseDto(loan: LoanApplication): LoanResponseDto {
  return {
    id: loan.id,
    userId: loan.userId,
    amount: loan.amount,
    installments: loan.installments,
    annualRate: loan.annualRate,
    monthlyIncome: loan.monthlyIncome,
    monthlyPayment: loan.monthlyPayment,
    totalToPay: loan.totalToPay,
    totalInterest: loan.totalInterest,
    documentVerified: loan.documentVerified,
    ageVerified: loan.ageVerified,
    incomeVerified: loan.incomeVerified,
    creditHistoryVerified: loan.creditHistoryVerified,
    eligibility: loan.eligibility,
    status: loan.status,
    createdAt: loan.createdAt.toISOString(),
  };
}
