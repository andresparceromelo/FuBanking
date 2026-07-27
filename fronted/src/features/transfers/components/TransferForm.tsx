'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, DollarSign, Wallet } from 'lucide-react';
import { RecipientInfo } from '../types/transfer.types';
import { useAccounts } from '../../account/hooks/useAccounts';
import { AccountStatus, ACCOUNT_TYPE_LABELS } from '../../account/types/account.types';

interface TransferFormProps {
  recipient: RecipientInfo;
  onConfirm: (senderAccountId: string, amount: number, description: string) => void;
  onBack: () => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function TransferForm({ recipient, onConfirm, onBack }: TransferFormProps) {
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  const [senderAccountId, setSenderAccountId] = useState('');
  const [amountStr, setAmountStr]     = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-select first active account if not selected
  useEffect(() => {
    if (!senderAccountId && accounts.length > 0) {
      const activeAccount = accounts.find(a => a.status === AccountStatus.ACTIVA);
      if (activeAccount) setSenderAccountId(activeAccount.id);
    }
  }, [accounts, senderAccountId]);

  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));

  const handleContinue = () => {
    setValidationError(null);
    if (!senderAccountId) {
      setValidationError('Selecciona una cuenta de origen');
      return;
    }
    if (!amountStr || isNaN(amount) || amount <= 0) {
      setValidationError('Ingresa un monto valido mayor a cero');
      return;
    }
    if (amount < 1000) {
      setValidationError('El monto minimo de transferencia es $1.000');
      return;
    }

    const selectedAccount = accounts.find(a => a.id === senderAccountId);
    if (selectedAccount && selectedAccount.balance < amount) {
      setValidationError('Saldo insuficiente en la cuenta seleccionada');
      return;
    }

    onConfirm(senderAccountId, amount, description.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition">
          <ArrowLeft size={16} className="text-white/60" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-white">Detalles del envio</h2>
          <p className="text-sm text-white/50 mt-0.5">Ingresa el monto a transferir</p>
        </div>
      </div>

      {/* Destinatario */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <User size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">Enviar a</p>
          <p className="text-white font-semibold">{recipient.name}</p>
          <p className="text-white/50 text-sm font-mono">{recipient.accountNumber}</p>
        </div>
      </div>

      {/* Cuenta Origen */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">Desde</label>
        <div className="relative">
          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <select
            value={senderAccountId}
            onChange={(e) => { setSenderAccountId(e.target.value); setValidationError(null); }}
            disabled={isLoadingAccounts || accounts.length === 0}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-medium appearance-none focus:outline-none focus:border-primary/50 transition disabled:opacity-50"
          >
            <option value="" disabled className="bg-[#1a1a2e]">
              {isLoadingAccounts ? 'Cargando cuentas...' : 'Selecciona una cuenta'}
            </option>
            {accounts
              .filter(a => a.status === AccountStatus.ACTIVA)
              .map(a => (
                <option key={a.id} value={a.id} className="bg-[#1a1a2e]">
                  {ACCOUNT_TYPE_LABELS[a.accountType]} - {a.accountNumber} ({formatCOP(a.balance)})
                </option>
              ))
            }
          </select>
        </div>
      </div>

      {/* Monto */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">Monto a enviar</label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="number"
            min="1000"
            step="1000"
            placeholder="50000"
            value={amountStr}
            onChange={(e) => { setAmountStr(e.target.value); setValidationError(null); }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white text-lg font-semibold placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition"
          />
        </div>
        {amount > 0 && (
          <p className="text-sm text-white/40 pl-1">{formatCOP(amount)}</p>
        )}
      </div>

      {/* Descripcion */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">Descripcion <span className="text-white/30">(opcional)</span></label>
        <input
          type="text"
          placeholder="Ej: Pago prestamo, cuota apartamento..."
          maxLength={255}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition"
        />
      </div>

      {validationError && (
        <p className="text-sm text-red-400">{validationError}</p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!amountStr}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-semibold disabled:opacity-40 transition hover:opacity-90 active:scale-[0.98]"
      >
        Revisar transferencia
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
