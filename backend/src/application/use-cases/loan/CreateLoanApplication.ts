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

    // Verificar que no tenga un préstamo pendiente
    const existingLoans = await this.loanRepository.findByUserId(dto.userId);
    const hasPending = existingLoans.some(
      (loan) => loan.status === LoanApplicationStatus.PENDING
    );
    if (hasPending) {
      throw new AppError(
        'Ya tienes una solicitud de préstamo pendiente. Espera a que sea aprobada o rechazada antes de solicitar otra.',
        400,
        'LOAN_ALREADY_PENDING',
      );
    }

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
      // Notificar al usuario
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Solicitud de crédito enviada',
        message: `Solicitaste un crédito de $${dto.amount.toLocaleString('es-CO')} en ${dto.installments} cuotas. Pendiente de revisión.`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));

      // Notificar a todos los admins
      const admins = await this.userRepository.findByRole('admin');
      for (const admin of admins) {
        await this.notificationRepository.save(new Notification({
          id: randomUUID(),
          userId: admin.id,
          title: 'Nueva solicitud de crédito',
          message: `${user.fullName} solicitó un crédito de $${dto.amount.toLocaleString('es-CO')} en ${dto.installments} cuotas.`,
          type: NotificationType.SISTEMA,
          read: false,
          createdAt: new Date(),
        }));
      }
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
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
