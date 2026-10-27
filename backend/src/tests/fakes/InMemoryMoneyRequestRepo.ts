import { IMoneyRequestRepository } from '../../domain/repositories/IMoneyRequestRepository';
import { MoneyRequest } from '../../domain/entities/MoneyRequest';

export class InMemoryMoneyRequestRepo implements IMoneyRequestRepository {
  private readonly store = new Map<string, MoneyRequest>();

  async save(request: MoneyRequest): Promise<MoneyRequest> {
    this.store.set(request.id, request);
    return request;
  }

  async findById(id: string): Promise<MoneyRequest | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<MoneyRequest[]> {
    return Array.from(this.store.values()).filter(
      (r) => r.requesterUserId === userId || r.requestedUserId === userId,
    );
  }

  async updateStatus(id: string, status: string): Promise<MoneyRequest> {
    const req = this.store.get(id);
    if (!req) throw new Error('Money request not found');
    this.store.set(id, req);
    return req;
  }
}
