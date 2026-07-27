'use client';

import { useState, useEffect, useCallback } from 'react';
import { pocketService } from '../services/pocket.service';
import { CreatePocketPayload, Pocket, TransferPocketPayload, UpdatePocketPayload } from '../types/pocket.types';

export function usePockets(accountId: string) {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPockets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pocketService.getAccountPockets(accountId);
      setPockets(data);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al cargar los bolsillos');
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    fetchPockets();
  }, [accountId, fetchPockets]);

  const createPocket = async (
    payload: CreatePocketPayload,
    onSuccess?: (pocket: Pocket) => void,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const pocket = await pocketService.createPocket(payload);
      setPockets((prev) => [pocket, ...prev]);
      onSuccess?.(pocket);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al crear el bolsillo');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePocket = async (
    pocketId: string,
    payload: UpdatePocketPayload,
    onSuccess?: (pocket: Pocket) => void,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await pocketService.updatePocket(pocketId, payload);
      setPockets((prev) => prev.map((p) => (p.id === pocketId ? updated : p)));
      onSuccess?.(updated);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al actualizar el bolsillo');
    } finally {
      setIsLoading(false);
    }
  };

  const transferPocket = async (
    payload: TransferPocketPayload,
    onSuccess?: (result: { fromPocket: Pocket; toPocket: Pocket }) => void,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await pocketService.transferPocket(payload);
      setPockets((prev) => prev.map((p) => {
        if (p.id === result.fromPocket.id) return result.fromPocket;
        if (p.id === result.toPocket.id) return result.toPocket;
        return p;
      }));
      onSuccess?.(result);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al transferir entre bolsillos');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pockets,
    isLoading,
    error,
    refetch: fetchPockets,
    createPocket,
    updatePocket,
    transferPocket,
  };
}
