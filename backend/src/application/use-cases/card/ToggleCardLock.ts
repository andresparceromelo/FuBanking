import { randomUUID } from 'crypto';
import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { PublicVirtualCard, CardStatus } from '../../../domain/entities/VirtualCard';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';

export interface ToggleCardLockDto {
  userId: string;
  cardId: string;
}

export class ToggleCardLock {
  constructor(
    private readonly cardRepository: IVirtualCardRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: ToggleCardLockDto): Promise<PublicVirtualCard> {
    const card = await this.cardRepository.findById(dto.cardId);
    if (!card) {
      throw new AppError('La tarjeta no existe', 404, 'CARD_NOT_FOUND');
    }

    if (card.userId !== dto.userId) {
      throw new AppError('No tienes permiso para modificar esta tarjeta', 403, 'FORBIDDEN');
    }

    card.toggleLock();
    const updatedCard = await this.cardRepository.updateStatus(card.id, card.status);

    if (this.notificationRepository) {
      const action = card.status === CardStatus.BLOQUEADA ? 'Bloqueaste' : 'Desbloqueaste';
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: `Tarjeta ${card.status === CardStatus.BLOQUEADA ? 'bloqueada' : 'desbloqueada'}`,
        message: `${action} tu tarjeta terminada en ${card.lastFour}`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return updatedCard.toPublic();
  }
}
