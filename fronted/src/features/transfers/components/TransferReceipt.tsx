'use client';

import { CheckCircle2, Copy, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { TransferReceipt as ReceiptType } from '../types/transfer.types';

interface TransferReceiptProps {
  receipt: ReceiptType;
  onNewTransfer: () => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const STATUS_LABELS: Record<string, string> = {
  COMPLETADA: 'Completada',
  PENDIENTE:  'Pendiente',
  FALLIDA:    'Fallida',
  CANCELADA:  'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETADA: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  PENDIENTE:  'text-amber-400 bg-amber-500/10 border-amber-500/30',
  FALLIDA:    'text-red-400 bg-red-500/10 border-red-500/30',
  CANCELADA:  'text-white/50 bg-white/5 border-white/10',
};

export function TransferReceipt({ receipt, onNewTransfer }: TransferReceiptProps) {
  const [copied, setCopied] = useState(false);

  const copyReference = async () => {
    await navigator.clipboard.writeText(receipt.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(receipt.createdAt));

  return (
    <div className="space-y-6">
      {/* Icono de exito */}
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Transferencia exitosa</h2>
          <p className="text-white/50 text-sm mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Monto */}
      <div className="text-center py-4 border-y border-white/10">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Monto enviado</p>
        <p className="text-4xl font-bold text-white">{formatCOP(receipt.amount)}</p>
      </div>

      {/* Detalles */}
      <div className="space-y-3">
        {[
          ['Para', receipt.receiverName],
          ['Cuenta destino', receipt.receiverAccount],
          ['Cuenta origen', receipt.senderAccount],
          ['Descripcion', receipt.description ?? '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-sm text-white/40">{label}</span>
            <span className="text-sm text-white/80 text-right max-w-[60%] truncate">{value}</span>
          </div>
        ))}

        {/* Estado */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/40">Estado</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[receipt.status] ?? STATUS_COLORS['PENDIENTE']}`}>
            {STATUS_LABELS[receipt.status] ?? receipt.status}
          </span>
        </div>

        {/* Referencia */}
        <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/10">
          <div>
            <p className="text-xs text-white/40">Numero de referencia</p>
            <p className="text-white font-mono font-semibold">{receipt.referenceNumber}</p>
          </div>
          <button
            type="button"
            onClick={copyReference}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            <Copy size={14} className={copied ? 'text-emerald-400' : 'text-white/40'} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewTransfer}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-semibold hover:opacity-90 transition active:scale-[0.98]"
      >
        Hacer otra transferencia
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
