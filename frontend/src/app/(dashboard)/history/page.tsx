'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { useAccounts } from '@/features/account/hooks/useAccounts';
import { Transaction, TransactionHistoryTable } from '@/features/transfer/components/TransactionHistoryTable';
import { useTransfers } from '@/features/transfer/hooks/useTransfers';
import { useToast } from '@/shared/components/feedback/ToastProvider';

export default function HistoryPage() {
  const toast = useToast();
  const { accounts, isLoading: isAccountsLoading } = useAccounts();
  const { getAccountHistory, isLoading, error } = useTransfers();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const lastToastErrorRef = useRef<string | null>(null);
  const activeAccountId = selectedAccountId || accounts[0]?.id || '';

  const fetchHistory = useCallback(async () => {
    if (!activeAccountId) return;
    const data = await getAccountHistory(activeAccountId);
    setTransactions(data);
  }, [activeAccountId, getAccountHistory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchHistory();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchHistory]);

  useEffect(() => {
    if (!error || lastToastErrorRef.current === error) return;

    lastToastErrorRef.current = error;
    toast.error('No pudimos cargar el historial', error);
  }, [error, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial de movimientos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta las operaciones realizadas en tus cuentas.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <History size={18} />
          </div>
          <select
            value={activeAccountId}
            onChange={(event) => setSelectedAccountId(event.target.value)}
            disabled={isAccountsLoading}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary sm:min-w-[280px]"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountType} (****{account.accountNumber.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading || !activeAccountId}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {transactions.length} movimiento{transactions.length !== 1 ? 's' : ''}
          </h2>
          <span className="text-xs text-muted-foreground">Ordenado por fecha mas reciente</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <TransactionHistoryTable transactions={transactions} />
        )}
      </div>
    </div>
  );
}
