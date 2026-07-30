import { randomUUID } from 'crypto';
import { IMoneyRequestRepository } from '../../../domain/repositories/IMoneyRequestRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { MoneyRequest } from '../../../domain/entities/MoneyRequest';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';

export interface RespondMoneyRequestDto {
  userId: string;
  requestId: string;
  accept: boolean;
}

export class RespondMoneyRequest {
  constructor(
    private readonly moneyRequestRepository: IMoneyRequestRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: RespondMoneyRequestDto): Promise<MoneyRequest> {
    const request = await this.moneyRequestRepository.findById(dto.requestId);
    if (!request) {
      throw new AppError('La solicitud no existe', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.requestedUserId !== dto.userId) {
      throw new AppError('No tienes permiso para responder a esta solicitud', 403, 'FORBIDDEN');
    }

    request.respond(dto.accept);
    const updated = await this.moneyRequestRepository.updateStatus(request.id, request.status);

    if (this.notificationRepository) {
      const responder = await this.userRepository.findById(dto.userId);
      const responderName = responder ? `${responder.firstName} ${responder.lastName}` : 'Alguien';
      const action = dto.accept ? 'aceptó' : 'rechazó';

      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: request.requesterUserId,
        title: `Solicitud ${dto.accept ? 'aceptada' : 'rechazada'}`,
        message: `${responderName} ${action} tu solicitud de $${request.amount.toLocaleString('es-CO')}`,
        type: NotificationType.SOLICITUD_DINERO,
        read: false,
        createdAt: new Date(),
      }));
    }

    return updated;
  }
}
