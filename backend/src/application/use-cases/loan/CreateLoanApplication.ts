import { randomUUID } from 'node:crypto';
import { AppError } from '../../../shared/errors/AppError';
import { LoanApplication, LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { CreateLoanApplicationDto, CreateLoanApplicationResponseDto } from '../../dtos/loan/loan.dtos';

export class CreateLoanApplication {
  constructor(
    private readonly loanRepository: ILoanApplicationRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: CreateLoanApplicationDto): Promise<CreateLoanApplicationResponseDto> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');

    const loan = LoanApplication.create({
      id: randomUUID(),
      userId: dto.userId,
      amount: dto.amount,
      installments: dto.installments,
      annualRate: dto.annualRate,
      monthlyIncome: dto.monthlyIncome,
      documentVerified: dto.documentVerified,
      ageVerified: dto.ageVerified,
      incomeVerified: dto.incomeVerified,
      creditHistoryVerified: dto.creditHistoryVerified,
    });

    const saved = await this.loanRepository.save(loan);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Solicitud de crédito',
        message: `Solicitaste un crédito de $${dto.amount.toLocaleString('es-CO')} en ${dto.installments} cuotas`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return {
      id: saved.id,
      userId: saved.userId,
      amount: saved.amount,
      installments: saved.installments,
      annualRate: saved.annualRate,
      monthlyIncome: saved.monthlyIncome,
      monthlyPayment: saved.monthlyPayment,
      totalToPay: saved.totalToPay,
      totalInterest: saved.totalInterest,
      eligibility: saved.eligibility,
      status: LoanApplicationStatus.PENDING,
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
