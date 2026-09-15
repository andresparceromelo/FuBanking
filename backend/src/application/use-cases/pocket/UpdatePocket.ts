import { randomUUID } from 'crypto';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Account } from '../../../domain/entities/Account';
import { Pocket } from '../../../domain/entities/Pocket';
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
    this.validateInput(dto);

    const { pocket, account } = await this.loadAuthorized(dto);

    if (dto.amount !== undefined && dto.amount !== pocket.amount) {
      await this.adjustAmount(pocket, account, dto.amount);
    }
    if (dto.name !== undefined && dto.name !== pocket.name) {
      pocket.updateName(dto.name);
    }

    const updated = await this.pocketRepository.update(pocket);
    await this.notify(dto.userId, updated.name);
    return updated.toPublic();
  }

  /** Valida el DTO antes de tocar la base de datos (falla rápido). */
  private validateInput(dto: UpdatePocketDto): void {
    if (dto.name === undefined && dto.amount === undefined) {
      throw new AppError('No se proporcionaron cambios para el bolsillo', 400, 'NO_CHANGES_PROVIDED');
    }
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new AppError('El nombre del bolsillo no puede estar vacío', 400, 'INVALID_POCKET_NAME');
    }
    if (dto.amount !== undefined && dto.amount < 0) {
      throw new AppError('El monto del bolsillo no puede ser negativo', 400, 'INVALID_POCKET_AMOUNT');
    }
  }

  /** Carga el bolsillo y su cuenta, verificando propiedad y operatividad. */
  private async loadAuthorized(dto: UpdatePocketDto): Promise<{ pocket: Pocket; account: Account }> {
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

    return { pocket, account };
  }

  /** Ajusta el monto del bolsillo y refleja la diferencia en el saldo de la cuenta. */
  private async adjustAmount(pocket: Pocket, account: Account, newAmount: number): Promise<void> {
    const totalReserved = await this.pocketRepository.getTotalAmountByAccountId(account.id);
    const reservedWithoutCurrent = totalReserved - pocket.amount;

    if (reservedWithoutCurrent + newAmount > account.balance + totalReserved) {
      throw new AppError('No tienes saldo disponible suficiente para ajustar este bolsillo', 400, 'INSUFFICIENT_AVAILABLE_BALANCE');
    }

    const balanceDelta = newAmount - pocket.amount;
    await this.accountRepository.updateBalance(account.id, account.balance - balanceDelta);
    pocket.updateAmount(newAmount);
  }

  /** Notifica al usuario si hay repositorio de notificaciones inyectado. */
  private async notify(userId: string, pocketName: string): Promise<void> {
    if (!this.notificationRepository) {
      return;
    }
    await this.notificationRepository.save(new Notification({
      id: randomUUID(),
      userId,
      title: 'Bolsillo actualizado',
      message: `Actualizaste el bolsillo "${pocketName}"`,
      type: NotificationType.BOLSILLO,
      read: false,
      createdAt: new Date(),
    }));
  }
}
