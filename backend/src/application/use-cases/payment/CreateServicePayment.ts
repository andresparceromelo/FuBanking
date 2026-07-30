import { randomUUID } from 'crypto';
import { IServicePaymentRepository } from '../../../domain/repositories/IServicePaymentRepository';
import { ServicePayment } from '../../../domain/entities/ServicePayment';
import { CreateServicePaymentDto, CreateServicePaymentResponseDto } from '../../dtos/payment/payment.dtos';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';
import { IPaymentGateway } from '../../../infrastructure/services/MockPaymentGateway';

export class CreateServicePayment {
  constructor(
    private readonly paymentRepository: IServicePaymentRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly notificationRepository?: INotificationRepository,
  ) {}

  async execute(dto: CreateServicePaymentDto): Promise<CreateServicePaymentResponseDto> {
    // 1. Verificar que la cuenta exista y pertenezca al usuario
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    if (account.userId !== dto.userId) throw new AppError('No autorizado', 403, 'FORBIDDEN');

    // 2. Verificar que haya saldo suficiente
    if (account.balance < dto.amount) throw new AppError('Saldo insuficiente', 400, 'INSUFFICIENT_FUNDS');

    // 3. Crear entidad de pago
    const payment = ServicePayment.create({
      id: randomUUID(),
      userId: dto.userId,
      accountId: dto.accountId,
      serviceType: dto.serviceType,
      providerReference: dto.providerReference,
      amount: dto.amount,
    });

    // 4. Marcar como pending y persistir
    payment.markPending();
    let saved = await this.paymentRepository.save(payment);

    // 5. Procesar con la pasarela de pagos
    const result = await this.paymentGateway.process(saved);

    if (result.success) {
      // 6. Descontar monto de la cuenta
      const newBalance = account.balance - dto.amount;
      await this.accountRepository.updateBalance(account.id, newBalance);

      // 7. Marcar pago como success y actualizar
      saved.markSuccess();
      saved = await this.paymentRepository.update(saved);

      if (this.notificationRepository) {
        await this.notificationRepository.save(new Notification({
          id: randomUUID(),
          userId: dto.userId,
          title: 'Pago de servicio',
          message: `Pagaste ${dto.serviceType} por $${dto.amount.toLocaleString('es-CO')}`,
          type: NotificationType.PAGO,
          read: false,
          createdAt: new Date(),
        }));
      }

      return saved.toPublic();
    }

    // En caso de fallo de la pasarela, marcar failed y actualizar registro
    saved.markFailed();
    saved = await this.paymentRepository.update(saved);
    throw new AppError(`Pago rechazado: ${result.error ?? 'Unknown'}`, 400, 'PAYMENT_FAILED');
  }
}
