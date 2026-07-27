'use client';

import { useState, useCallback } from 'react';
import { loanService } from '../services/loan.service';
import { CreateLoanPayload, LoanApplicationResponse, LoanSimulationPayload, LoanSimulationResponse } from '../types/loan.types';

export function useLoans() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateLoan = useCallback(async (payload: LoanSimulationPayload): Promise<LoanSimulationResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      return await loanService.simulateLoan(payload);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'No fue posible simular el préstamo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLoan = useCallback(async (payload: CreateLoanPayload): Promise<LoanApplicationResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      return await loanService.createLoan(payload);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? 'No fue posible crear la solicitud');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { simulateLoan, createLoan, isLoading, error };
}
