'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Account, AccountStatus, ACCOUNT_TYPE_LABELS, ACCOUNT_STATUS_LABELS } from '../types/account.types';

interface AccountCardProps {
  account: Account;
  showBalance?: boolean;
  onClick?: (account: Account) => void;
  onDeposit?: (account: Account) => void;
  onWithdraw?: (account: Account) => void;
}

/**
 * AccountCard — Tarjeta visual de una cuenta bancaria, estilo Nubank.
 */
export function AccountCard({ account, showBalance = true, onClick, onDeposit, onWithdraw }: AccountCardProps) {
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

  const formattedBalance = showBalance
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(account.balance)
    : '$ ••••••••';

  return (
    <div
      className={`
        w-full text-left rounded-2xl p-6 
        bg-gradient-to-br ${gradient}
        border border-white/10 backdrop-blur-sm
        hover:border-white/20 transition-all duration-300 ease-out
        shadow-lg relative overflow-hidden group
      `}
    >
      {/* Clickable Area for Details */}
      <div 
        onClick={() => onClick?.(account)}
        className="cursor-pointer space-y-4"
      >
        {/* Header: tipo + estado */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1 font-semibold">
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
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1 font-medium">Saldo disponible</p>
          <p className="text-3xl font-bold text-white tracking-tight">{formattedBalance}</p>
        </div>
      </div>

      {/* Acciones rápidas (Abonar / Retirar) */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeposit?.(account);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
          >
            <ArrowDownLeft size={14} />
            Abonar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWithdraw?.(account);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
          >
            <ArrowUpRight size={14} />
            Retirar
          </button>
        </div>

        {/* Marca decorativa */}
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20" />
          <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 -ml-2" />
        </div>
      </div>
    </div>
  );
}

