import { randomUUID } from 'node:crypto';
import { AppError } from '../../../shared/errors/AppError';
import { LoanApplication, LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { Account, AccountType } from '../../../domain/entities/Account';
import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';

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

export class ApproveLoan {
  constructor(
    private readonly loanRepository: ILoanApplicationRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(loanId: string): Promise<LoanResponseDto> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new AppError('Préstamo no encontrado', 404, 'LOAN_NOT_FOUND');
    }

    loan.approve();
    await this.loanRepository.updateStatus(loanId, LoanApplicationStatus.APPROVED);

    const accountNumber = await this.generateUniqueAccountNumber();

    const account = Account.create({
      id: randomUUID(),
      userId: loan.userId,
      accountNumber,
      accountType: AccountType.CREDITO,
      details: {
        loanId: loan.id,
        installments: loan.installments,
      },
    });

    await this.accountRepository.save(account, account.details);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: loan.userId,
        title: 'Crédito aprobado',
        message: `Tu crédito de $${loan.amount.toLocaleString('es-CO')} ha sido aprobado. Se creó una cuenta CREDITO con número ${accountNumber}.`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return this.toDto(loan);
  }

  private async generateUniqueAccountNumber(): Promise<string> {
    let accountNumber: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      const digits = Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000);
      accountNumber = `BA${digits}`;
      const existing = await this.accountRepository.findByAccountNumber(accountNumber);
      if (!existing) return accountNumber;
      attempts++;
    } while (attempts < maxAttempts);

    throw new AppError('No se pudo generar un número de cuenta único', 500, 'ACCOUNT_NUMBER_GENERATION_FAILED');
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
