/** Contrato de respuesta del backend (`sendSuccess` / `sendError`). */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string[]> };
}

export interface PocketDto {
  id: string;
  accountId: string;
  name: string;
  amount: number;
}

export interface AccountDto {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: string;
}

export interface SessionDto {
  token: string;
}
