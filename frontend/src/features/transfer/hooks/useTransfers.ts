'use client';

import { useCallback, useState } from 'react';
import {
  transferService,
  TransactionHistoryItem,
  TransferPayload,
  TransferReceipt,
  TransferRecipient,
} from '../services/transfer.service';

type SearchMode = 'account' | 'email';

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message || fallback);
  }

  return fallback;
}

export function useTransfers() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransfer = useCallback(async (payload: TransferPayload): Promise<TransferReceipt | null> => {
    setIsLoading(true);
    setError(null);

    try {
      return await transferService.createTransfer(payload);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo procesar la transferencia.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchRecipient = useCallback(async (query: string, mode: SearchMode): Promise<TransferRecipient | null> => {
    setIsLoading(true);
    setError(null);

    try {
      return await transferService.searchRecipient(query, mode);
    } catch (err) {
      setError(getErrorMessage(err, 'No encontramos un destinatario con esos datos.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccountHistory = useCallback(async (accountId: string): Promise<TransactionHistoryItem[]> => {
    setIsLoading(true);
    setError(null);

    try {
      return await transferService.getAccountHistory(accountId);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar el historial de movimientos.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    setError,
    createTransfer,
    searchRecipient,
    getAccountHistory,
  };
}
