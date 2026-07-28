'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { TransactionHistoryItem } from '../services/transfer.service';

export type Transaction = TransactionHistoryItem;

interface TransactionHistoryTableProps {
  transactions: Transaction[];
}

const TYPE_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Deposito',
  RETIRO: 'Retiro',
};

const STATUS_CLASSES: Record<string, string> = {
  COMPLETADA: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  PENDIENTE: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  FALLIDA: 'bg-red-500/15 text-red-600 dark:text-red-400',
  CANCELADA: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
};

export function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium text-foreground">Sin movimientos aun</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Tus transacciones apareceran aqui una vez realices operaciones en tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isOutgoing = tx.direction === 'OUTGOING';
        const date = new Date(tx.createdAt);
        const formattedAmount = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(tx.amount);

        return (
          <div
            key={tx.id}
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:bg-muted sm:grid-cols-[40px_minmax(0,1fr)_116px_92px_130px] sm:items-center"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isOutgoing
                  ? 'bg-rose-500/15 text-rose-500'
                  : 'bg-emerald-500/15 text-emerald-500'
              }`}
            >
              {isOutgoing ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {tx.description || TYPE_LABELS[tx.type] || tx.type}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {tx.relatedName} - {tx.relatedAccount} - Ref: <span className="font-mono">{tx.referenceNumber}</span>
              </p>
            </div>

            <div className="col-start-2 text-xs text-muted-foreground sm:col-start-auto sm:text-right">
              <p>{date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p>{date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div className="col-start-2 sm:col-start-auto">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASSES[tx.status] || STATUS_CLASSES.PENDIENTE}`}>
                {tx.status}
              </span>
            </div>

            <div className="col-start-2 text-left sm:col-start-auto sm:text-right">
              <p className={`text-base font-bold ${isOutgoing ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isOutgoing ? '-' : '+'}
                {formattedAmount}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
