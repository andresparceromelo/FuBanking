import { randomUUID } from 'crypto';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { UpdatePocketDto, UpdatePocketResponseDto } from '../../dtos/pocket/pocket.dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdatePocket {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly pocketRepository: IPocketRepository,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: UpdatePocketDto): Promise<UpdatePocketResponseDto> {
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new AppError('El nombre del bolsillo no puede estar vacío', 400, 'INVALID_POCKET_NAME');
    }

    if (dto.amount !== undefined && dto.amount < 0) {
      throw new AppError('El monto del bolsillo no puede ser negativo', 400, 'INVALID_POCKET_AMOUNT');
    }

    const pocket = await this.pocketRepository.findById(dto.pocketId);
    if (!pocket) {
      throw new AppError('Bolsillo no encontrado', 404, 'POCKET_NOT_FOUND');
    }

    const account = await this.accountRepository.findById(pocket.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    if (!account.isOperational()) {
      throw new AppError('La cuenta no está disponible para modificar bolsillos', 400, 'ACCOUNT_NOT_OPERATIONAL');
    }

    if (dto.amount !== undefined && dto.amount !== pocket.amount) {
      const totalReserved = await this.pocketRepository.getTotalAmountByAccountId(account.id);
      const reservedWithoutCurrent = totalReserved - pocket.amount;
      const newReservedTotal = reservedWithoutCurrent + dto.amount;
      if (newReservedTotal > account.balance + totalReserved) {
        throw new AppError('No tienes saldo disponible suficiente para ajustar este bolsillo', 400, 'INSUFFICIENT_AVAILABLE_BALANCE');
      }

      const balanceDelta = dto.amount - pocket.amount;
      const newAccountBalance = account.balance - balanceDelta;
      await this.accountRepository.updateBalance(account.id, newAccountBalance);
      pocket.updateAmount(dto.amount);
    }

    if (dto.name !== undefined && dto.name !== pocket.name) {
      pocket.updateName(dto.name);
    }

    if (dto.amount === undefined && dto.name === undefined) {
      throw new AppError('No se proporcionaron cambios para el bolsillo', 400, 'NO_CHANGES_PROVIDED');
    }

    const updated = await this.pocketRepository.update(pocket);

    if (this.notificationRepository) {
      await this.notificationRepository.save(new Notification({
        id: randomUUID(),
        userId: dto.userId,
        title: 'Bolsillo actualizado',
        message: `Actualizaste el bolsillo "${updated.name}"`,
        type: NotificationType.BOLSILLO,
        read: false,
        createdAt: new Date(),
      }));
    }

    return updated.toPublic();
  }
}
