import { randomUUID } from 'node:crypto';
import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { VirtualCard, CardStatus, PublicVirtualCard } from '../../../domain/entities/VirtualCard';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';

export interface CreateVirtualCardDto {
  userId: string;
  accountId: string;
}

export class CreateVirtualCard {
  constructor(
    private readonly cardRepository: IVirtualCardRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: CreateVirtualCardDto): Promise<PublicVirtualCard> {
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('La cuenta especificada no existe', 404, 'ACCOUNT_NOT_FOUND');
    }
    account.assertBelongsTo(dto.userId);

    const user = await this.userRepository.findById(dto.userId);
    const cardHolderName = user ? `${user.firstName} ${user.lastName}`.toUpperCase() : 'TITULAR FUBANK';

    const { cardNumber, lastFour, expirationDate, cvv } = VirtualCard.generateNumber();

    const card = new VirtualCard({
      id: randomUUID(),
      userId: dto.userId,
      accountId: dto.accountId,
      cardHolderName,
      cardNumber,
      lastFour,
      expirationDate,
      cvv,
      status: CardStatus.ACTIVA,
      createdAt: new Date(),
    });

    const savedCard = await this.cardRepository.save(card);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Tarjeta virtual creada',
        message: `Creaste una tarjeta virtual terminada en ${lastFour}`,
        type: NotificationType.SISTEMA,
        read: false,
        createdAt: new Date(),
      }));
    }

    return savedCard.toPublic();
  }
}
