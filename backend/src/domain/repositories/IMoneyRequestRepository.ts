import { MoneyRequest } from '../entities/MoneyRequest';

export interface IMoneyRequestRepository {
  save(request: MoneyRequest): Promise<MoneyRequest>;
  findById(id: string): Promise<MoneyRequest | null>;
  findByUserId(userId: string): Promise<MoneyRequest[]>; // Solicitudes enviadas y recibidas
  updateStatus(id: string, status: string): Promise<MoneyRequest>;
}
