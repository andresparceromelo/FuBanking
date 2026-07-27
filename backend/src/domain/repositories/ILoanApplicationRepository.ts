import { LoanApplication } from '../entities/LoanApplication';

export interface ILoanApplicationRepository {
  save(loan: LoanApplication): Promise<LoanApplication>;
  findByUserId(userId: string): Promise<LoanApplication[]>;
}
