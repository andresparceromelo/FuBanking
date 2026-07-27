import { ServicePayment } from '../entities/ServicePayment';

export interface IServicePaymentRepository {
  save(payment: ServicePayment): Promise<ServicePayment>;
  findById(id: string): Promise<ServicePayment | null>;
  findByUserId(userId: string): Promise<ServicePayment[]>;
  update(payment: ServicePayment): Promise<ServicePayment>;
}
