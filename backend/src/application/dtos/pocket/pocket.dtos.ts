export interface CreatePocketDto {
  userId: string;
  accountId: string;
  name: string;
  amount: number;
}

export interface CreatePocketResponseDto {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetAccountPocketsDto {
  userId: string;
  accountId: string;
}

export interface PocketSummaryDto {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePocketDto {
  userId: string;
  pocketId: string;
  name?: string;
  amount?: number;
}

export interface UpdatePocketResponseDto {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransferPocketBalanceDto {
  userId: string;
  fromPocketId: string;
  toPocketId: string;
  amount: number;
}

export interface TransferPocketBalanceResponseDto {
  fromPocket: PocketSummaryDto;
  toPocket: PocketSummaryDto;
}
