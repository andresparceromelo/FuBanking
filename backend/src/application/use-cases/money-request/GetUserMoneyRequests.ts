import { IMoneyRequestRepository } from '../../../domain/repositories/IMoneyRequestRepository';
import { MoneyRequest } from '../../../domain/entities/MoneyRequest';

export class GetUserMoneyRequests {
  constructor(private readonly moneyRequestRepository: IMoneyRequestRepository) {}

  async execute(userId: string): Promise<MoneyRequest[]> {
    return await this.moneyRequestRepository.findByUserId(userId);
  }
}
