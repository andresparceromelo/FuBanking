import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { PublicVirtualCard } from '../../../domain/entities/VirtualCard';

export class GetUserCards {
  constructor(private readonly cardRepository: IVirtualCardRepository) {}

  async execute(userId: string): Promise<PublicVirtualCard[]> {
    const cards = await this.cardRepository.findByUserId(userId);
    return cards.map(card => card.toPublic());
  }
}
