import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { AppError } from '../../../shared/errors/AppError';
import { Account } from '../../../domain/entities/Account';
import { Transaction, TransactionType, TransactionStatus } from '../../../domain/entities/Transaction';

export interface DepositMoneyDto {
  userId: string;
  accountId: string;
  amount: number;
  description?: string;
}

export class DepositMoney {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository?: ITransactionRepository,
  ) {}

  async execute(dto: DepositMoneyDto): Promise<Account> {
    if (!dto.amount || dto.amount <= 0) {
      throw new AppError('El monto a depositar debe ser mayor a cero', 400, 'INVALID_AMOUNT');
    }

    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('La cuenta no existe', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    if (!account.isOperational()) {
      throw new AppError('La cuenta no está activa', 400, 'ACCOUNT_INACTIVE');
    }

    const newBalance = account.balance + dto.amount;
    const updatedAccount = await this.accountRepository.updateBalance(account.id, newBalance);

    return updatedAccount;
  }
}
