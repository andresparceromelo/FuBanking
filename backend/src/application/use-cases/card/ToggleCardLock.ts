import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { PublicVirtualCard, CardStatus } from '../../../domain/entities/VirtualCard';
import { AppError } from '../../../shared/errors/AppError';

export interface ToggleCardLockDto {
  userId: string;
  cardId: string;
}

export class ToggleCardLock {
  constructor(private readonly cardRepository: IVirtualCardRepository) {}

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
    return updatedCard.toPublic();
  }
}
