'use client';

import { useCallback, useState } from 'react';
import { adminService } from '../services/admin.service';
import { AdminLoanApplication } from '../types/admin.types';

function getMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}

export function useAdminLoans() {
  const [loans, setLoans] = useState<AdminLoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.getAllLoans();
      setLoans(result);
      return result;
    } catch (err) {
      setError(getMessage(err, 'No fue posible obtener los prestamos.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveLoan = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.approveLoan(id);
      setLoans(prev => prev.map(loan => loan.id === id ? result : loan));
      return result;
    } catch (err) {
      setError(getMessage(err, 'No fue posible aprobar el prestamo.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectLoan = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.rejectLoan(id);
      setLoans(prev => prev.map(loan => loan.id === id ? result : loan));
      return result;
    } catch (err) {
      setError(getMessage(err, 'No fue posible rechazar el prestamo.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loans, isLoading, error, setError, fetchLoans, approveLoan, rejectLoan };
}
