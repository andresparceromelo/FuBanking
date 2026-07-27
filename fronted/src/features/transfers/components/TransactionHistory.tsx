'use client';

import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { useTransferHistory } from '../hooks/useTransferHistory';

interface TransactionHistoryProps {
  accountId: string;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const formatTime = (dateString: string) => {
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(dateString));
};

export function TransactionHistory({ accountId }: TransactionHistoryProps) {
  const { history, isLoading, error } = useTransferHistory(accountId);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-white/50 text-sm">
        Cargando movimientos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center gap-3 text-white/50">
        <History size={32} className="text-white/20" />
        <p className="text-sm">No hay movimientos recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((tx) => {
        const isIncoming = tx.direction === 'INCOMING';

        return (
          <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isIncoming ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'
              }`}>
                {isIncoming ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              </div>
              
              <div>
                <p className="text-sm font-semibold text-white">
                  {isIncoming ? 'Recibido de' : 'Enviado a'} {tx.relatedName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-white/40">{formatTime(tx.createdAt)}</p>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <p className="text-xs text-white/40">{tx.relatedAccount}</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className={`font-semibold ${isIncoming ? 'text-emerald-400' : 'text-white'}`}>
                {isIncoming ? '+' : '-'} {formatCOP(tx.amount)}
              </p>
              {tx.description && (
                <p className="text-xs text-white/40 truncate max-w-[120px] ml-auto">
                  {tx.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
