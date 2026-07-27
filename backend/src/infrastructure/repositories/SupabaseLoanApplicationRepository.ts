import { SupabaseClient } from '@supabase/supabase-js';
import { ILoanApplicationRepository } from '../../domain/repositories/ILoanApplicationRepository';
import { LoanApplication, LoanApplicationProps, LoanApplicationStatus } from '../../domain/entities/LoanApplication';
import { AppError } from '../../shared/errors/AppError';

interface LoanApplicationRow {
  id: string;
  user_id: string;
  amount: number;
  installments: number;
  annual_rate: number;
  monthly_income: number;
  monthly_payment: number;
  total_to_pay: number;
  total_interest: number;
  document_verified: boolean;
  age_verified: boolean;
  income_verified: boolean;
  credit_history_verified: boolean;
  eligibility: any;
  status: string;
  created_at: string;
}

export class SupabaseLoanApplicationRepository implements ILoanApplicationRepository {
  private readonly TABLE = 'loan_applications';

  constructor(private readonly client: SupabaseClient) {}

  private mapRowToLoan(row: LoanApplicationRow): LoanApplication {
    const props: LoanApplicationProps = {
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      installments: Number(row.installments),
      annualRate: Number(row.annual_rate),
      monthlyIncome: Number(row.monthly_income),
      monthlyPayment: Number(row.monthly_payment),
      totalToPay: Number(row.total_to_pay),
      totalInterest: Number(row.total_interest),
      documentVerified: row.document_verified,
      ageVerified: row.age_verified,
      incomeVerified: row.income_verified,
      creditHistoryVerified: row.credit_history_verified,
      eligibility: typeof row.eligibility === 'string' ? JSON.parse(row.eligibility) : (row.eligibility || { isEligible: true, reasons: [] }),
      status: row.status as LoanApplicationStatus,
      createdAt: new Date(row.created_at),
    };
    return new LoanApplication(props);
  }

  async save(loan: LoanApplication): Promise<LoanApplication> {
    const row = {
      id: loan.id,
      user_id: loan.userId,
      amount: loan.amount,
      installments: loan.installments,
      annual_rate: loan.annualRate,
      monthly_income: loan.monthlyIncome,
      monthly_payment: loan.monthlyPayment,
      total_to_pay: loan.totalToPay,
      total_interest: loan.totalInterest,
      document_verified: loan.documentVerified,
      age_verified: loan.ageVerified,
      income_verified: loan.incomeVerified,
      credit_history_verified: loan.creditHistoryVerified,
      eligibility: JSON.stringify(loan.eligibility),
      status: loan.status,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      // Si la tabla aún no existe en Supabase o da error, retornamos el loan recién instanciado
      console.warn('Advertencia DB préstamos:', error?.message);
      return loan;
    }

    return this.mapRowToLoan(data as LoanApplicationRow);
  }

  async findByUserId(userId: string): Promise<LoanApplication[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as LoanApplicationRow[]).map(row => this.mapRowToLoan(row));
  }
}
