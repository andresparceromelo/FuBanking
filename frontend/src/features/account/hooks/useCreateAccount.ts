'use client';

import { useState } from 'react';
import { CreateAccountPayload, Account } from '../types/account.types';
import { accountService } from '../services/account.service';

/**
 * Hook para manejar la creación de una cuenta bancaria.
 *
 * Expone isLoading y error para que el formulario pueda
 * reflejar el estado de la operación en la UI.
 */
export function useCreateAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async (
    payload: CreateAccountPayload,
    onSuccess?: (account: Account) => void,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const newAccount = await accountService.createAccount(payload);
      onSuccess?.(newAccount);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return { createAccount, isLoading, error };
}
