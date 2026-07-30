import { randomUUID } from 'node:crypto';
import { AppError } from '../../../shared/errors/AppError';
import { LoanApplication, LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { LoanResponseDto } from './ApproveLoan';

export class RejectLoan {
  constructor(
    private readonly loanRepository: ILoanApplicationRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(loanId: string): Promise<LoanResponseDto> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new AppError('Préstamo no encontrado', 404, 'LOAN_NOT_FOUND');
    }

    loan.reject();
    await this.loanRepository.updateStatus(loanId, LoanApplicationStatus.REJECTED);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: loan.userId,
        title: 'Crédito rechazado',
        message: `Tu solicitud de crédito de $${loan.amount.toLocaleString('es-CO')} ha sido rechazada.`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return this.toDto(loan);
  }

  private toDto(loan: LoanApplication): LoanResponseDto {
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
}
