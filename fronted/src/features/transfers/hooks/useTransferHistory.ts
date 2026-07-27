'use client';

import { useState, useCallback, useEffect } from 'react';
import { transferService } from '../services/transfer.service';
import { TransferHistoryItem } from '../types/transfer.types';

export function useTransferHistory(accountId: string) {
  const [history, setHistory]     = useState<TransferHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!accountId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await transferService.getAccountHistory(accountId);
      setHistory(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Error al cargar el historial de transacciones');
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
