import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { LoanApplication } from '../../../domain/entities/LoanApplication';

export class GetUserLoans {
  constructor(
    private readonly loanRepository: ILoanApplicationRepository,
  ) {}

  async execute(userId: string): Promise<LoanApplication[]> {
    return this.loanRepository.findByUserId(userId);
  }
}
