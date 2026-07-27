import { IMoneyRequestRepository } from '../../../domain/repositories/IMoneyRequestRepository';
import { MoneyRequest } from '../../../domain/entities/MoneyRequest';
import { AppError } from '../../../shared/errors/AppError';

export interface RespondMoneyRequestDto {
  userId: string;
  requestId: string;
  accept: boolean;
}

export class RespondMoneyRequest {
  constructor(private readonly moneyRequestRepository: IMoneyRequestRepository) {}

  async execute(dto: RespondMoneyRequestDto): Promise<MoneyRequest> {
    const request = await this.moneyRequestRepository.findById(dto.requestId);
    if (!request) {
      throw new AppError('La solicitud no existe', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.requestedUserId !== dto.userId) {
      throw new AppError('No tienes permiso para responder a esta solicitud', 403, 'FORBIDDEN');
    }

    request.respond(dto.accept);
    return await this.moneyRequestRepository.updateStatus(request.id, request.status);
  }
}
