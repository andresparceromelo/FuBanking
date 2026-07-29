import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { AppError } from '../../../shared/errors/AppError';

export interface DeletePocketDto {
  userId: string;
  pocketId: string;
}

export interface DeletePocketResponseDto {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export class DeletePocket {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly pocketRepository: IPocketRepository,
  ) {}

  async execute(dto: DeletePocketDto): Promise<DeletePocketResponseDto> {
    const pocket = await this.pocketRepository.findById(dto.pocketId);
    if (!pocket) {
      throw new AppError('Bolsillo no encontrado', 404, 'POCKET_NOT_FOUND');
    }

    const account = await this.accountRepository.findById(pocket.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    if (!account.isOperational()) {
      throw new AppError('La cuenta no está disponible para eliminar bolsillos', 400, 'ACCOUNT_NOT_OPERATIONAL');
    }

    const pocketAmount = pocket.amount;
    await this.pocketRepository.delete(dto.pocketId);
    await this.accountRepository.updateBalance(account.id, account.balance + pocketAmount);

    return {
      id: pocket.id,
      accountId: pocket.accountId,
      name: pocket.name,
      amount: pocketAmount,
      createdAt: pocket.createdAt.toISOString(),
      updatedAt: pocket.updatedAt.toISOString(),
    };
  }
}
