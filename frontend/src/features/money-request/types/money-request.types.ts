export type MoneyRequestStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';

export interface MoneyRequest {
  id: string;
  requesterUserId: string;
  requestedUserId: string;
  amount: number;
  description: string | null;
  status: MoneyRequestStatus;
  createdAt: string;
}

export interface CreateMoneyRequestPayload {
  requestedUserEmail: string;
  amount: number;
  description?: string;
}

