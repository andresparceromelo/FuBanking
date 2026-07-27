'use client';

import React from 'react';
import { Account, AccountStatus, ACCOUNT_TYPE_LABELS, ACCOUNT_STATUS_LABELS } from '../types/account.types';

interface AccountCardProps {
  account: Account;
  onClick?: (account: Account) => void;
}

/**
 * AccountCard — Tarjeta visual de una cuenta bancaria, estilo Nubank.
 *
 * Muestra: tipo de cuenta, número enmascarado, saldo y estado.
 * Al hacer click, abre el modal de detalle.
 */
export function AccountCard({ account, onClick }: AccountCardProps) {
  const maskedNumber = `****${account.accountNumber.slice(-4)}`;

  const statusColors: Record<AccountStatus, string> = {
    [AccountStatus.ACTIVA]: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    [AccountStatus.BLOQUEADA]: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    [AccountStatus.CERRADA]: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const cardGradients: Record<string, string> = {
    AHORROS: 'from-violet-600/30 via-purple-600/20 to-indigo-700/30',
    CORRIENTE: 'from-cyan-600/30 via-teal-600/20 to-sky-700/30',
    NOMINA: 'from-rose-600/30 via-pink-600/20 to-fuchsia-700/30',
  };

  const gradient = cardGradients[account.accountType] ?? cardGradients.AHORROS;

  const formattedBalance = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(account.balance);

  return (
    <button
      onClick={() => onClick?.(account)}
      className={`
        w-full text-left rounded-2xl p-6 
        bg-gradient-to-br ${gradient}
        border border-white/10 backdrop-blur-sm
        hover:scale-[1.02] hover:border-white/20
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary/50
        cursor-pointer shadow-lg hover:shadow-xl
      `}
    >
      {/* Header: tipo + estado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">
            {ACCOUNT_TYPE_LABELS[account.accountType]}
          </p>
          <p className="text-white/70 text-sm font-mono">{maskedNumber}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[account.status]}`}>
          {ACCOUNT_STATUS_LABELS[account.status]}
        </span>
      </div>

      {/* Saldo */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Saldo disponible</p>
        <p className="text-3xl font-bold text-white tracking-tight">{formattedBalance}</p>
      </div>

      {/* Footer decorativo */}
      <div className="mt-4 flex items-center justify-end">
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20" />
          <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 -ml-2" />
        </div>
      </div>
    </button>
  );
}
