'use client';

import { useCallback, useState } from 'react';
import { loanService } from '../services/loan.service';
import { CreateLoanPayload, LoanApplication, LoanSimulationPayload, LoanSimulationResponse } from '../types/loan.types';

function getMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}

export function useLoans() {
  const [simulation, setSimulation] = useState<LoanSimulationResponse | null>(null);
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateLoan = useCallback(async (payload: LoanSimulationPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loanService.simulateLoan(payload);
      setSimulation(result);
      return result;
    } catch (err) {
      setError(getMessage(err, 'No fue posible simular el credito.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLoan = useCallback(async (payload: CreateLoanPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loanService.createLoan(payload);
      setApplication(result);
      return result;
    } catch (err) {
      setError(getMessage(err, 'No fue posible crear la solicitud.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { simulation, application, isLoading, error, setError, simulateLoan, createLoan };
}

