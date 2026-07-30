import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import { AppError } from '../../../shared/errors/AppError';

export interface RevealVirtualCardDetailsDto {
  userId: string;
  cardId: string;
}

export interface RevealedVirtualCardDetails {
  cardNumber: string;
  cvv: string;
}

export class RevealVirtualCardDetails {
  constructor(private readonly cardRepository: IVirtualCardRepository) {}

  async execute(dto: RevealVirtualCardDetailsDto): Promise<RevealedVirtualCardDetails> {
    const card = await this.cardRepository.findById(dto.cardId);
    if (!card) {
      throw new AppError('La tarjeta no existe', 404, 'CARD_NOT_FOUND');
    }

    if (card.userId !== dto.userId) {
      throw new AppError('No tienes permiso para ver esta tarjeta', 403, 'FORBIDDEN');
    }

    if (card.status === CardStatus.CANCELADA) {
      throw new AppError('No se pueden revelar datos de una tarjeta cancelada', 400, 'CARD_CANCELLED');
    }

    return {
      cardNumber: card.cardNumber,
      cvv: card.cvv,
    };
  }
}
