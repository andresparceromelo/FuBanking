'use client';

import { ArrowLeft, User, AlertTriangle } from 'lucide-react';
import { RecipientInfo } from '../types/transfer.types';

interface TransferConfirmationProps {
  recipient: RecipientInfo;
  amount: number;
  description: string;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function TransferConfirmation({
  recipient, amount, description, isLoading, error, onConfirm, onBack,
}: TransferConfirmationProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} disabled={isLoading} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition">
          <ArrowLeft size={16} className="text-white/60" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-white">Confirmar transferencia</h2>
          <p className="text-sm text-white/50 mt-0.5">Revisa los detalles antes de enviar</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest">Enviar a</p>
            <p className="text-white font-semibold">{recipient.name}</p>
            <p className="text-white/50 text-sm font-mono">{recipient.accountNumber}</p>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Monto</p>
          <p className="text-3xl font-bold text-white">{formatCOP(amount)}</p>
        </div>

        {description && (
          <div className="p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Descripcion</p>
            <p className="text-white/80 text-sm">{description}</p>
          </div>
        )}
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 p-3 rounded-2xl border border-amber-500/20 bg-amber-500/10">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300 text-xs leading-relaxed">
          Al confirmar, el dinero se transferira de inmediato y no podra revertirse. Verifica que los datos sean correctos.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="py-3 rounded-2xl border border-white/10 text-white/70 font-semibold hover:bg-white/5 transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="py-3 rounded-2xl bg-primary text-white font-semibold disabled:opacity-50 hover:opacity-90 transition active:scale-[0.98]"
        >
          {isLoading ? 'Procesando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
