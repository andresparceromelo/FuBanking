export enum ServiceType {
  ENERGIA = 'ENERGIA',
  AGUA = 'AGUA',
  INTERNET = 'INTERNET',
  CELULAR = 'CELULAR',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface CreatePaymentPayload {
  accountId: string;
  serviceType: ServiceType;
  providerReference: string;
  amount: number;
}

export interface PaymentResponse {
  id: string;
  userId: string;
  accountId: string;
  serviceType: ServiceType;
  providerReference: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  processedAt?: string | null;
}
