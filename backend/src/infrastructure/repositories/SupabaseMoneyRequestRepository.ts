import { SupabaseClient } from '@supabase/supabase-js';
import { IMoneyRequestRepository } from '../../domain/repositories/IMoneyRequestRepository';
import { MoneyRequest, MoneyRequestProps, MoneyRequestStatus } from '../../domain/entities/MoneyRequest';

interface MoneyRequestRow {
  id: string;
  requester_user_id: string;
  requested_user_id: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
}

export class SupabaseMoneyRequestRepository implements IMoneyRequestRepository {
  private readonly TABLE = 'money_requests';

  constructor(private readonly client: SupabaseClient) {}

  private mapRowToRequest(row: MoneyRequestRow): MoneyRequest {
    const props: MoneyRequestProps = {
      id: row.id,
      requesterUserId: row.requester_user_id,
      requestedUserId: row.requested_user_id,
      amount: Number(row.amount),
      description: row.description,
      status: row.status as MoneyRequestStatus,
      createdAt: new Date(row.created_at),
    };
    return new MoneyRequest(props);
  }

  async save(request: MoneyRequest): Promise<MoneyRequest> {
    const row = {
      id: request.id,
      requester_user_id: request.requesterUserId,
      requested_user_id: request.requestedUserId,
      amount: request.amount,
      description: request.description,
      status: request.status,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      console.warn('Advertencia DB money_requests:', error?.message);
      return request;
    }

    return this.mapRowToRequest(data as MoneyRequestRow);
  }

  async findById(id: string): Promise<MoneyRequest | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToRequest(data as MoneyRequestRow);
  }

  async findByUserId(userId: string): Promise<MoneyRequest[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .or(`requester_user_id.eq.${userId},requested_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as MoneyRequestRow[]).map(row => this.mapRowToRequest(row));
  }

  async updateStatus(id: string, status: string): Promise<MoneyRequest> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      const req = await this.findById(id);
      if (!req) throw new Error('Solicitud no encontrada');
      return req;
    }

    return this.mapRowToRequest(data as MoneyRequestRow);
  }
}
