import { ServiceType, PaymentStatus } from '../../../domain/entities/ServicePayment';

export interface CreateServicePaymentDto {
  userId: string;
  accountId: string;
  serviceType: ServiceType;
  providerReference: string;
  amount: number;
}

export interface CreateServicePaymentResponseDto {
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

export interface GetUserPaymentsDto {
  userId: string;
}

export interface PaymentSummaryDto {
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
