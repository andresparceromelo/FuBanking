'use client';

import { useState, useCallback } from 'react';
import { transferService } from '../services/transfer.service';
import { RecipientInfo, TransferReceipt } from '../types/transfer.types';

/**
 * useTransfer — hook del modulo de transferencias.
 *
 * Centraliza todo el estado y las llamadas al servicio.
 * Los componentes solo consumen este hook.
 */
export function useTransfer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const clearError = () => setError(null);

  const searchByAccountNumber = useCallback(
    async (accountNumber: string): Promise<RecipientInfo | null> => {
      try {
        setIsLoading(true);
        setError(null);
        return await transferService.searchByAccountNumber(accountNumber);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message ?? 'No se encontro la cuenta');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const searchByEmail = useCallback(
    async (email: string): Promise<RecipientInfo | null> => {
      try {
        setIsLoading(true);
        setError(null);
        return await transferService.searchByEmail(email);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message ?? 'No se encontro el usuario');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const createTransfer = useCallback(
    async (payload: {
      senderAccountId: string;
      receiverAccountNumber: string;
      amount: number;
      description?: string | null;
    }): Promise<TransferReceipt | null> => {
      try {
        setIsLoading(true);
        setError(null);
        return await transferService.createTransfer(payload);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message ?? 'Error al procesar la transferencia');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    clearError,
    searchByAccountNumber,
    searchByEmail,
    createTransfer,
  };
}
