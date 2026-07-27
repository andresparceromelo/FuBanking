'use client';

import { useState } from 'react';
import { paymentService } from '../services/payment.service';
import { CreatePaymentPayload, PaymentResponse } from '../types/payment.types';

export function usePayments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (
    payload: CreatePaymentPayload,
    onSuccess?: (payment: PaymentResponse) => void,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const payment = await paymentService.createPayment(payload);
      onSuccess?.(payment);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al crear el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const getMyPayments = async (): Promise<PaymentResponse[]> => {
    try {
      setIsLoading(true);
      setError(null);
      const payments = await paymentService.getMyPayments();
      return payments;
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al obtener los pagos');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { createPayment, getMyPayments, isLoading, error };
}
