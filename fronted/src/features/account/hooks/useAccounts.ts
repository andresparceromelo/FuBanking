'use client';

import { useState, useEffect, useCallback } from 'react';
import { Account } from '../types/account.types';
import { accountService } from '../services/account.service';

/**
 * Hook para obtener y gestionar el estado de las cuentas del usuario.
 *
 * Encapsula el ciclo de vida de la petición: carga, datos y error.
 * Los componentes solo consumen el estado sin conocer la lógica de fetching.
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await accountService.getMyAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al cargar las cuentas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, isLoading, error, refetch: fetchAccounts };
}
