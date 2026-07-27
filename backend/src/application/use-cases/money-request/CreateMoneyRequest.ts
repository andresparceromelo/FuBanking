import { randomUUID } from 'node:crypto';
import { IMoneyRequestRepository } from '../../../domain/repositories/IMoneyRequestRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { MoneyRequest, MoneyRequestStatus } from '../../../domain/entities/MoneyRequest';
import { AppError } from '../../../shared/errors/AppError';

export interface CreateMoneyRequestDto {
  requesterUserId: string;
  requestedUserEmail: string;
  amount: number;
  description?: string;
}

export class CreateMoneyRequest {
  constructor(
    private readonly moneyRequestRepository: IMoneyRequestRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateMoneyRequestDto): Promise<MoneyRequest> {
    const requestedUser = await this.userRepository.findByEmail(dto.requestedUserEmail.trim());
    if (!requestedUser) {
      throw new AppError('El destinatario especificado no existe', 404, 'USER_NOT_FOUND');
    }

    const request = new MoneyRequest({
      id: randomUUID(),
      requesterUserId: dto.requesterUserId,
      requestedUserId: requestedUser.id,
      amount: dto.amount,
      description: dto.description ?? null,
      status: MoneyRequestStatus.PENDIENTE,
      createdAt: new Date(),
    });

    return await this.moneyRequestRepository.save(request);
  }
}
