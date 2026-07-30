'use client';

import React from 'react';
import { AdminLoanApplication } from '../types/admin.types';
import { formatCurrency } from '@/shared/utils/format';
import { CheckCircle, XCircle, Clock, User, FileText, TrendingUp } from 'lucide-react';

interface LoanCardProps {
  loan: AdminLoanApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading: boolean;
}

export function LoanCard({ loan, onApprove, onReject, isLoading }: LoanCardProps) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
    APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobado' },
    REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rechazado' },
  };

  const status = statusConfig[loan.status] ?? { color: 'bg-gray-100 text-gray-800', icon: Clock, label: loan.status ?? 'Desconocido' };
  const StatusIcon = status.icon;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Usuario: {(loan.userId ?? 'N/A').slice(0, 8)}...
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(loan.createdAt).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
          <StatusIcon size={14} />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Monto</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(loan.amount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Cuotas</p>
            <p className="text-sm font-semibold text-foreground">{loan.installments} meses</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-muted-foreground">Cuota mensual</p>
          <p className="font-medium">{formatCurrency(loan.monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total a pagar</p>
          <p className="font-medium">{formatCurrency(loan.totalToPay)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <span>Tasa: {loan.annualRate}% EA</span>
        <span>|</span>
        <span>Ingreso: {formatCurrency(loan.monthlyIncome)}/mes</span>
      </div>

      {loan.status === 'PENDING' && (
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            onClick={() => onApprove(loan.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle size={16} />
            Aprobar
          </button>
          <button
            onClick={() => onReject(loan.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle size={16} />
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
