import { randomUUID } from 'crypto';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Pocket } from '../../../domain/entities/Pocket';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { CreatePocketDto, CreatePocketResponseDto } from '../../dtos/pocket/pocket.dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreatePocket {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly pocketRepository: IPocketRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: CreatePocketDto): Promise<CreatePocketResponseDto> {
    if (dto.amount < 0) {
      throw new AppError('El monto del bolsillo no puede ser negativo', 400, 'INVALID_POCKET_AMOUNT');
    }

    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    if (!account.isOperational()) {
      throw new AppError('La cuenta no está disponible para generar bolsillos', 400, 'ACCOUNT_NOT_OPERATIONAL');
    }

    const currentReserved = await this.pocketRepository.getTotalAmountByAccountId(account.id);
    if (currentReserved + dto.amount > account.balance) {
      throw new AppError('No tienes saldo disponible suficiente para crear este bolsillo', 400, 'INSUFFICIENT_AVAILABLE_BALANCE');
    }

    await this.accountRepository.updateBalance(account.id, account.balance - dto.amount);

    const pocket = Pocket.create({
      id: randomUUID(),
      accountId: dto.accountId,
      name: dto.name,
      amount: dto.amount,
    });

    const saved = await this.pocketRepository.save(pocket);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Bolsillo creado',
        message: `Creaste el bolsillo "${dto.name}" con $${dto.amount.toLocaleString('es-CO')}`,
        type: NotificationType.BOLSILLO,
        read: false,
        createdAt: new Date(),
      }));
    }

    return saved.toPublic();
  }
}
