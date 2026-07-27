import { apiClient } from '@/shared/services/api.client';
import { CreatePaymentPayload, PaymentResponse } from '../types/payment.types';

class PaymentService {
  async createPayment(data: CreatePaymentPayload): Promise<PaymentResponse> {
    const response = await apiClient.post<PaymentResponse>('/payments', data);
    return response.data;
  }

  async getMyPayments(): Promise<PaymentResponse[]> {
    const response = await apiClient.get<PaymentResponse[]>('/payments/me');
    return response.data;
  }
}

export const paymentService = new PaymentService();
