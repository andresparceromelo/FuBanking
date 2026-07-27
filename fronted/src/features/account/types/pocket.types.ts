export interface Pocket {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePocketPayload {
  accountId: string;
  name: string;
  amount: number;
}

export interface UpdatePocketPayload {
  name?: string;
  amount?: number;
}

export interface TransferPocketPayload {
  fromPocketId: string;
  toPocketId: string;
  amount: number;
}
