import { IServicePaymentRepository } from '../../../domain/repositories/IServicePaymentRepository';
import { PaymentSummaryDto, GetUserPaymentsDto } from '../../dtos/payment/payment.dtos';

export class GetUserPayments {
  constructor(private readonly paymentRepository: IServicePaymentRepository) {}

  async execute(userId: string): Promise<PaymentSummaryDto[]> {
    const payments = await this.paymentRepository.findByUserId(userId);
    return payments.map((p) => p.toPublic());
  }
}
