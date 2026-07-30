'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History, RefreshCw, Filter, X } from 'lucide-react';
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

  const [filterType, setFilterType] = useState('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      let matchesType = true;
      if (filterType !== 'ALL') {
        matchesType = tx.type === filterType;
      }
      
      let matchesDate = true;
      const txDate = new Date(tx.createdAt).getTime();
      if (filterDateFrom) {
        matchesDate = matchesDate && txDate >= new Date(filterDateFrom).getTime();
      }
      if (filterDateTo) {
        matchesDate = matchesDate && txDate <= new Date(filterDateTo).getTime() + 86400000; // Add 1 day to include the selected day fully
      }
      
      return matchesType && matchesDate;
    });
  }, [transactions, filterType, filterDateFrom, filterDateTo]);

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

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {showFilters ? <X size={14} /> : <Filter size={14} />}
            {showFilters ? 'Ocultar' : 'Filtrar'}
          </button>
          
          <button
            onClick={fetchHistory}
            disabled={isLoading || !activeAccountId}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Tipo de Movimiento</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Todos</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="DEPOSITO">Depósito</option>
              <option value="RETIRO">Retiro</option>
            </select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Desde</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          {(filterType !== 'ALL' || filterDateFrom || filterDateTo) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('ALL');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="h-[38px] px-4 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive text-sm font-semibold transition-colors"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {filteredTransactions.length} movimiento{filteredTransactions.length !== 1 ? 's' : ''}
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
          <TransactionHistoryTable transactions={filteredTransactions} />
        )}
      </div>
    </div>
  );
}
