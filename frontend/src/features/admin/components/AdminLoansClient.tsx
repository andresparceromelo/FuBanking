'use client';

import React, { useEffect, useState } from 'react';
import { useAdminLoans } from '../hooks/useAdminLoans';
import { LoanCard } from './LoanCard';
import { Landmark, RefreshCw, AlertCircle } from 'lucide-react';

export function AdminLoansClient() {
  const { loans, isLoading, error, fetchLoans, approveLoan, rejectLoan } = useAdminLoans();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    void fetchLoans();
  }, [fetchLoans]);

  const filteredLoans = filter === 'ALL' ? loans : loans.filter(loan => loan.status === filter);

  const handleApprove = async (id: string) => {
    await approveLoan(id);
  };

  const handleReject = async (id: string) => {
    await rejectLoan(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Landmark size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestionar Creditos</h1>
            <p className="text-sm text-muted-foreground">Administra las solicitudes de credito</p>
          </div>
        </div>
        <button
          onClick={() => void fetchLoans()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {status === 'ALL' ? 'Todos' : status === 'PENDING' ? 'Pendientes' : status === 'APPROVED' ? 'Aprobados' : 'Rechazados'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {isLoading && loans.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Landmark size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay prestamos {filter === 'ALL' ? '' : filter.toLowerCase()}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.map((loan, index) => (
            <LoanCard
              key={loan.id ?? index}
              loan={loan}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
