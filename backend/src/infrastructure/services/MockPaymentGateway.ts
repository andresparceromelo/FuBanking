import { ServicePayment } from '../../domain/entities/ServicePayment';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface IPaymentGateway {
  process(payment: ServicePayment): Promise<PaymentResult>;
}

/**
 * Mock de pasarela de pagos para entornos de desarrollo y tests.
 * - Si el `providerReference` contiene la palabra "fail" devuelve error.
 * - Si el `amount` es 0 devuelve error.
 * - En otro caso, devuelve success.
 */
export class MockPaymentGateway implements IPaymentGateway {
  async process(payment: ServicePayment): Promise<PaymentResult> {
    if (!payment.providerReference || payment.amount <= 0) {
      return { success: false, error: 'Invalid payment data' };
    }

    if (String(payment.providerReference).toLowerCase().includes('fail')) {
      return { success: false, error: 'Provider rejected payment' };
    }

    return { success: true, transactionId: `MOCK_TX_${payment.id}` };
  }
}
