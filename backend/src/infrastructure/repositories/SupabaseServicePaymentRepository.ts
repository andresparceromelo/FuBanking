import { SupabaseClient } from '@supabase/supabase-js';
import { IServicePaymentRepository } from '../../domain/repositories/IServicePaymentRepository';
import { ServicePayment, ServicePaymentProps, ServiceType, PaymentStatus } from '../../domain/entities/ServicePayment';
import { AppError } from '../../shared/errors/AppError';

interface PaymentRow {
  id: string;
  user_id: string;
  account_id: string;
  service_type: string;
  provider_reference: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at?: string | null;
}

export class SupabaseServicePaymentRepository implements IServicePaymentRepository {
  private readonly TABLE = 'service_payments';

  constructor(private readonly client: SupabaseClient) {}

  private mapRowToPayment(row: PaymentRow): ServicePayment {
    const props: ServicePaymentProps = {
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      serviceType: row.service_type as ServiceType,
      providerReference: row.provider_reference,
      amount: Number(row.amount),
      status: row.status as PaymentStatus,
      createdAt: new Date(row.created_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : null,
    };
    return new ServicePayment(props);
  }

  async save(payment: ServicePayment): Promise<ServicePayment> {
    const row = {
      id: payment.id,
      user_id: payment.userId,
      account_id: payment.accountId,
      service_type: payment.serviceType,
      provider_reference: payment.providerReference,
      amount: payment.amount,
      status: payment.status,
      created_at: payment.createdAt.toISOString(),
      processed_at: payment.processedAt ? payment.processedAt.toISOString() : null,
    };

    const { data, error } = await this.client.from(this.TABLE).insert(row).select().single();
    if (error || !data) {
      throw new AppError(`Error al guardar pago de servicio: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
    }

    return this.mapRowToPayment(data as PaymentRow);
  }

  async update(payment: ServicePayment): Promise<ServicePayment> {
    const row = {
      status: payment.status,
      processed_at: payment.processedAt ? payment.processedAt.toISOString() : null,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .update(row)
      .eq('id', payment.id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Error al actualizar pago: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
    }

    return this.mapRowToPayment(data as PaymentRow);
  }

  async findById(id: string): Promise<ServicePayment | null> {
    const { data, error } = await this.client.from(this.TABLE).select().eq('id', id).single();
    if (error || !data) return null;
    return this.mapRowToPayment(data as PaymentRow);
  }

  async findByUserId(userId: string): Promise<ServicePayment[]> {
    const { data, error } = await this.client.from(this.TABLE).select().eq('user_id', userId).order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as PaymentRow[]).map((r) => this.mapRowToPayment(r));
  }
}
