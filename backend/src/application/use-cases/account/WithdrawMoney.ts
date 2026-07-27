import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { AppError } from '../../../shared/errors/AppError';
import { Account } from '../../../domain/entities/Account';

export interface WithdrawMoneyDto {
  userId: string;
  accountId: string;
  amount: number;
  description?: string;
}

export class WithdrawMoney {
  constructor(private readonly accountRepository: IAccountRepository) {}

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

    return updatedAccount;
  }
}
