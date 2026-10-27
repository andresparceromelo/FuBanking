import { IServicePaymentRepository } from '../../domain/repositories/IServicePaymentRepository';
import { ServicePayment } from '../../domain/entities/ServicePayment';

export class InMemoryServicePaymentRepo implements IServicePaymentRepository {
  private readonly store = new Map<string, ServicePayment>();

  async save(payment: ServicePayment): Promise<ServicePayment> {
    this.store.set(payment.id, payment);
    return payment;
  }

  async findById(id: string): Promise<ServicePayment | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<ServicePayment[]> {
    return Array.from(this.store.values()).filter((p) => p.userId === userId);
  }

  async update(payment: ServicePayment): Promise<ServicePayment> {
    this.store.set(payment.id, payment);
    return payment;
  }
}
