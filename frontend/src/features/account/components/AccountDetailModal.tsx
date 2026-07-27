'use client';

import React from 'react';
import { X, CreditCard, Building2, Percent, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Account, AccountStatus, ACCOUNT_TYPE_LABELS, ACCOUNT_STATUS_LABELS } from '../types/account.types';

interface AccountDetailModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AccountDetailModal — Modal con el detalle completo de una cuenta.
 *
 * Muestra toda la información incluyendo los detalles específicos
 * del tipo de cuenta (tasa de interés, sobregiro, empresa, etc.).
 */
export function AccountDetailModal({ account, isOpen, onClose }: AccountDetailModalProps) {
  if (!isOpen || !account) return null;

  const statusIcon: Record<AccountStatus, React.ReactNode> = {
    [AccountStatus.ACTIVA]: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    [AccountStatus.BLOQUEADA]: <AlertCircle className="w-4 h-4 text-amber-400" />,
    [AccountStatus.CERRADA]: <XCircle className="w-4 h-4 text-red-400" />,
  };

  const formattedBalance = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(account.balance);

  const formattedDate = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
  }).format(new Date(account.createdAt));

  const details = account.details;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-white font-semibold">{ACCOUNT_TYPE_LABELS[account.accountType]}</h2>
              <p className="text-white/40 text-xs font-mono">{account.accountNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Saldo */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Saldo disponible</p>
          <p className="text-4xl font-bold text-white">{formattedBalance}</p>
        </div>

        {/* Info general */}
        <div className="space-y-3 mb-4">
          <InfoRow label="Estado">
            <span className="flex items-center gap-1.5">
              {statusIcon[account.status]}
              <span className="text-white/80 text-sm">{ACCOUNT_STATUS_LABELS[account.status]}</span>
            </span>
          </InfoRow>
          <InfoRow label="Número de cuenta">
            <span className="text-white/80 text-sm font-mono">{account.accountNumber}</span>
          </InfoRow>
          <InfoRow label="Fecha de apertura">
            <span className="text-white/80 text-sm">{formattedDate}</span>
          </InfoRow>
        </div>

        {/* Detalles específicos del tipo */}
        {details && (
          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-widest">Detalles del producto</p>

            {details.interestRate !== null && details.interestRate !== undefined && (
              <InfoRow label="Tasa de interés">
                <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                  <Percent className="w-3.5 h-3.5" />
                  {(details.interestRate * 100).toFixed(2)}% E.A.
                </span>
              </InfoRow>
            )}

            {details.managementFee !== null && details.managementFee !== undefined && (
              <InfoRow label="Cuota de manejo">
                <span className="text-white/80 text-sm">
                  {details.managementFee === 0
                    ? 'Sin cuota de manejo'
                    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(details.managementFee)
                  }
                </span>
              </InfoRow>
            )}

            {details.overdraftLimit !== null && details.overdraftLimit !== undefined && (
              <InfoRow label="Cupo de sobregiro">
                <span className="text-white/80 text-sm">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(details.overdraftLimit)}
                </span>
              </InfoRow>
            )}

            {details.allowsCheckbook !== null && details.allowsCheckbook !== undefined && (
              <InfoRow label="Chequera">
                <span className="text-white/80 text-sm">{details.allowsCheckbook ? 'Sí incluye' : 'No incluye'}</span>
              </InfoRow>
            )}

            {details.companyName && (
              <InfoRow label="Empresa asociada">
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Building2 className="w-3.5 h-3.5 text-white/40" />
                  {details.companyName}
                </span>
              </InfoRow>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40 text-sm">{label}</span>
      {children}
    </div>
  );
}
