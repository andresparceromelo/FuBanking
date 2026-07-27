import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { GetAccountPocketsDto, PocketSummaryDto } from '../../dtos/pocket/pocket.dtos';
import { AppError } from '../../../shared/errors/AppError';

export class GetAccountPockets {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly pocketRepository: IPocketRepository,
  ) {}

  async execute(dto: GetAccountPocketsDto): Promise<PocketSummaryDto[]> {
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    const pockets = await this.pocketRepository.findByAccountId(dto.accountId);
    return pockets.map((pocket) => pocket.toPublic());
  }
}
