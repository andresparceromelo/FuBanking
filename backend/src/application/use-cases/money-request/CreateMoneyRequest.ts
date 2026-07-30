import { randomUUID } from 'node:crypto';
import { IMoneyRequestRepository } from '../../../domain/repositories/IMoneyRequestRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { MoneyRequest, MoneyRequestStatus } from '../../../domain/entities/MoneyRequest';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
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
    private readonly notificationRepository?: INotificationRepository,
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

    const saved = await this.moneyRequestRepository.save(request);

    if (this.notificationRepository) {
      const requester = await this.userRepository.findById(dto.requesterUserId);
      const requesterName = requester ? `${requester.firstName} ${requester.lastName}` : 'Alguien';

      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: requestedUser.id,
        title: 'Solicitud de dinero',
        message: `${requesterName} te solicita $${dto.amount.toLocaleString('es-CO')}`,
        type: NotificationType.SOLICITUD_DINERO,
        read: false,
        createdAt: new Date(),
      }));
    }

    return saved;
  }
}
