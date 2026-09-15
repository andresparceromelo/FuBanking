import { randomUUID } from 'crypto';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { CardStatus, PublicVirtualCard } from '../../../domain/entities/VirtualCard';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { AppError } from '../../../shared/errors/AppError';

export interface DeleteVirtualCardDto {
  userId: string;
  cardId: string;
}

export class DeleteVirtualCard {
  constructor(
    private readonly cardRepository: IVirtualCardRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: DeleteVirtualCardDto): Promise<PublicVirtualCard> {
    const card = await this.cardRepository.findById(dto.cardId);
    if (!card) {
      throw new AppError('La tarjeta no existe', 404, 'CARD_NOT_FOUND');
    }

    if (card.userId !== dto.userId) {
      throw new AppError('No tienes permiso para eliminar esta tarjeta', 403, 'FORBIDDEN');
    }

    const deletedCard = await this.cardRepository.updateStatus(card.id, CardStatus.CANCELADA);
    await this.cardRepository.delete(card.id);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Tarjeta eliminada',
        message: `Eliminaste tu tarjeta terminada en ${card.lastFour}`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return deletedCard.toPublic();
  }
}
