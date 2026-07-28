'use client';

import React, { useState } from 'react';
import { Plus, Wallet, Eye, EyeOff } from 'lucide-react';
import { Account } from '../types/account.types';
import { AccountCard } from './AccountCard';
import { AccountDetailModal } from './AccountDetailModal';
import { CreateAccountModal } from './CreateAccountModal';
import { DepositWithdrawModal } from './DepositWithdrawModal';
import { useAccounts } from '../hooks/useAccounts';

/**
 * AccountList — Vista principal del módulo de cuentas.
 *
 * Orquesta:
 * - Listado de tarjetas de cuenta.
 * - Modal de detalle (al hacer click en una tarjeta).
 * - Modal de creación (al hacer click en "Nueva cuenta").
 * - Estado vacío cuando el usuario no tiene cuentas aún.
 */
export function AccountList() {
  const { accounts, isLoading, error, refetch } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Deposit / Withdraw modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'deposit' | 'withdraw';
    account: Account | null;
  }>({
    isOpen: false,
    type: 'deposit',
    account: null,
  });

  const handleCardClick = (account: Account) => {
    setSelectedAccount(account);
    setIsDetailOpen(true);
  };

  const handleOpenActionModal = (account: Account, type: 'deposit' | 'withdraw') => {
    setActionModal({
      isOpen: true,
      type,
      account,
    });
  };

  const handleCreateSuccess = (newAccount: Account) => {
    refetch();
    // Opcional: abrir el detalle de la cuenta recién creada
    setSelectedAccount(newAccount);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header de la sección */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Mis cuentas</h2>
            <p className="text-white/40 text-xs">
              {accounts.length === 0
                ? 'No tienes cuentas aún'
                : `${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Mostrar/Ocultar Saldo */}
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white text-xs font-semibold transition-all"
            title={showBalance ? 'Ocultar saldos' : 'Mostrar saldos'}
          >
            {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline">{showBalance ? 'Ocultar' : 'Mostrar'}</span>
          </button>

          {/* Botón Nueva Cuenta */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nueva cuenta
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Estado vacío */}
      {accounts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Wallet className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-white/60 font-medium mb-2">Aún no tienes cuentas</h3>
          <p className="text-white/30 text-sm mb-6 max-w-xs">
            Crea tu primera cuenta bancaria y empieza a administrar tu dinero.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear mi primera cuenta
          </button>
        </div>
      )}

      {/* Grid de tarjetas */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              showBalance={showBalance}
              onClick={handleCardClick}
              onDeposit={(acc) => handleOpenActionModal(acc, 'deposit')}
              onWithdraw={(acc) => handleOpenActionModal(acc, 'withdraw')}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <AccountDetailModal
        account={selectedAccount}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <DepositWithdrawModal
        account={actionModal.account}
        type={actionModal.type}
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        onSuccess={() => refetch()}
      />
    </>
  );
}
