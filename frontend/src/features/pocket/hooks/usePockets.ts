'use client';

import { useCallback, useState } from 'react';
import { pocketService } from '../services/pocket.service';
import { CreatePocketPayload, Pocket, TransferPocketPayload, UpdatePocketPayload } from '../types/pocket.types';

function getMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}

export function usePockets() {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPockets = useCallback(async (accountId: string) => {
    if (!accountId) return [];
    setIsLoading(true);
    setError(null);
    try {
      const data = await pocketService.getAccountPockets(accountId);
      setPockets(data);
      return data;
    } catch (err) {
      setError(getMessage(err, 'No se pudieron cargar los bolsillos.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPocket = useCallback(async (payload: CreatePocketPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const pocket = await pocketService.createPocket(payload);
      setPockets((current) => [pocket, ...current]);
      return pocket;
    } catch (err) {
      setError(getMessage(err, 'No se pudo crear el bolsillo.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePocket = useCallback(async (pocketId: string, payload: UpdatePocketPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const pocket = await pocketService.updatePocket(pocketId, payload);
      setPockets((current) => current.map((item) => (item.id === pocket.id ? pocket : item)));
      return pocket;
    } catch (err) {
      setError(getMessage(err, 'No se pudo actualizar el bolsillo.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const transferPocket = useCallback(async (payload: TransferPocketPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await pocketService.transferPocket(payload);
      setPockets((current) =>
        current.map((item) => {
          if (item.id === result.fromPocket.id) return result.fromPocket;
          if (item.id === result.toPocket.id) return result.toPocket;
          return item;
        }),
      );
      return result;
    } catch (err) {
      setError(getMessage(err, 'No se pudo mover dinero entre bolsillos.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { pockets, isLoading, error, setError, fetchPockets, createPocket, updatePocket, transferPocket };
}

