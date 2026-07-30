import { randomUUID } from 'crypto';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { TransferPocketBalanceDto, TransferPocketBalanceResponseDto } from '../../dtos/pocket/pocket.dtos';
import { AppError } from '../../../shared/errors/AppError';

export class TransferPocketBalance {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly pocketRepository: IPocketRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: TransferPocketBalanceDto): Promise<TransferPocketBalanceResponseDto> {
    if (dto.amount <= 0) {
      throw new AppError('El monto de transferencia debe ser mayor que cero', 400, 'INVALID_TRANSFER_AMOUNT');
    }

    if (dto.fromPocketId === dto.toPocketId) {
      throw new AppError('Los bolsillos de origen y destino deben ser diferentes', 400, 'INVALID_TRANSFER_TARGET');
    }

    const fromPocket = await this.pocketRepository.findById(dto.fromPocketId);
    if (!fromPocket) {
      throw new AppError('Bolsillo de origen no encontrado', 404, 'SOURCE_POCKET_NOT_FOUND');
    }

    const toPocket = await this.pocketRepository.findById(dto.toPocketId);
    if (!toPocket) {
      throw new AppError('Bolsillo de destino no encontrado', 404, 'TARGET_POCKET_NOT_FOUND');
    }

    if (fromPocket.accountId !== toPocket.accountId) {
      throw new AppError('Los bolsillos deben pertenecer a la misma cuenta', 400, 'POCKETS_DIFFERENT_ACCOUNT');
    }

    const account = await this.accountRepository.findById(fromPocket.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    if (!account.isOperational()) {
      throw new AppError('La cuenta no está disponible para transferir entre bolsillos', 400, 'ACCOUNT_NOT_OPERATIONAL');
    }

    if (fromPocket.amount < dto.amount) {
      throw new AppError('Saldo insuficiente en el bolsillo de origen', 400, 'INSUFFICIENT_POCKET_BALANCE');
    }

    fromPocket.updateAmount(fromPocket.amount - dto.amount);
    toPocket.updateAmount(toPocket.amount + dto.amount);

    const updatedFrom = await this.pocketRepository.update(fromPocket);
    const updatedTo = await this.pocketRepository.update(toPocket);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Movimiento entre bolsillos',
        message: `Moviste $${dto.amount.toLocaleString('es-CO')} de "${fromPocket.name}" a "${toPocket.name}"`,
        type: NotificationType.BOLSILLO,
        read: false,
        createdAt: new Date(),
      }));
    }

    return {
      fromPocket: updatedFrom.toPublic(),
      toPocket: updatedTo.toPublic(),
    };
  }
}
