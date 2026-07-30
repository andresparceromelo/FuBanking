import { randomUUID } from 'crypto';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { AppError } from '../../../shared/errors/AppError';
import { Account } from '../../../domain/entities/Account';
import { Notification, NotificationType } from '../../../domain/entities/Notification';

export interface WithdrawMoneyDto {
  userId: string;
  accountId: string;
  amount: number;
  description?: string;
}

export class WithdrawMoney {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: WithdrawMoneyDto): Promise<Account> {
    if (!dto.amount || dto.amount <= 0) {
      throw new AppError('El monto a retirar debe ser mayor a cero', 400, 'INVALID_AMOUNT');
    }

    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('La cuenta no existe', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    if (!account.isOperational()) {
      throw new AppError('La cuenta no está activa', 400, 'ACCOUNT_INACTIVE');
    }

    if (account.balance < dto.amount) {
      throw new AppError('Saldo insuficiente para realizar el retiro', 400, 'INSUFFICIENT_FUNDS');
    }

    const newBalance = account.balance - dto.amount;
    const updatedAccount = await this.accountRepository.updateBalance(account.id, newBalance);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Retiro realizado',
        message: `Retiro de $${dto.amount.toLocaleString('es-CO')} de tu cuenta ****${account.accountNumber.slice(-4)}`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return updatedAccount;
  }
}
