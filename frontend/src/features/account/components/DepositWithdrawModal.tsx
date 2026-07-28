'use client';

import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { Account } from '../types/account.types';
import { accountService } from '../services/account.service';
import { useToast } from '@/shared/components/feedback/ToastProvider';

interface DepositWithdrawModalProps {
  account: Account | null;
  type: 'deposit' | 'withdraw';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepositWithdrawModal({ account, type, isOpen, onClose, onSuccess }: DepositWithdrawModalProps) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const isDeposit = type === 'deposit';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a cero.');
      return;
    }

    if (!isDeposit && numericAmount > account.balance) {
      setError('Saldo insuficiente en la cuenta para realizar este retiro.');
      return;
    }

    try {
      setIsLoading(true);
      if (isDeposit) {
        await accountService.deposit(account.id, numericAmount, description);
      } else {
        await accountService.withdraw(account.id, numericAmount, description);
      }
      toast.success(
        isDeposit ? 'Deposito realizado' : 'Retiro realizado',
        `Cuenta ****${account.accountNumber.slice(-4)} actualizada correctamente.`,
      );
      setAmount('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Error al procesar la transaccion';
      setError(message);
      toast.error('No pudimos completar la operacion', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isDeposit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {isDeposit ? 'Agregar Dinero (Depósito)' : 'Retirar Dinero'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Cuenta N° ****{account.accountNumber.slice(-4)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Monto a {isDeposit ? 'ingresar' : 'retirar'} (COP)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Descripción / Concepto (opcional)
            </label>
            <input
              type="text"
              placeholder={isDeposit ? 'Abono en efectivo' : 'Retiro en cajero'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-1/2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-md ${
                isDeposit 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' 
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
              } disabled:opacity-50`}
            >
              {isLoading ? 'Procesando...' : isDeposit ? 'Abonar Saldo' : 'Confirmar Retiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
