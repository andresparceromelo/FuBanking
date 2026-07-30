import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { LoanApplication } from '../../../domain/entities/LoanApplication';

export class GetAllLoans {
  constructor(
    private readonly loanRepository: ILoanApplicationRepository,
  ) {}

  async execute(): Promise<LoanApplication[]> {
    return this.loanRepository.findAll();
  }
}
