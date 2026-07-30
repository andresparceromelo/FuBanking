import { LoanApplication } from '../entities/LoanApplication';

export interface ILoanApplicationRepository {
  save(loan: LoanApplication): Promise<LoanApplication>;
  findById(id: string): Promise<LoanApplication | null>;
  findByUserId(userId: string): Promise<LoanApplication[]>;
  findAll(): Promise<LoanApplication[]>;
  updateStatus(id: string, status: string): Promise<LoanApplication>;
}
