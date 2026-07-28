'use client';

import React from 'react';
import { CheckCircle2, X, Download } from 'lucide-react';
import { TransferReceipt } from '../services/transfer.service';

interface TransferReceiptModalProps {
  receipt: TransferReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransferReceiptModal({ receipt, isOpen, onClose }: TransferReceiptModalProps) {
  if (!isOpen || !receipt) return null;

  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(receipt.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Comprobante de Operación
          </span>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Icon & Amount */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground">¡Transferencia Exitosa!</h3>
          <p className="text-3xl font-extrabold text-primary">{formattedAmount}</p>
        </div>

        {/* Details Card */}
        <div className="bg-background border border-border/60 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Número de Referencia:</span>
            <span className="font-mono font-semibold text-foreground">{receipt.referenceNumber}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Cuenta Origen:</span>
            <span className="font-mono text-foreground">{receipt.senderAccount}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Destinatario:</span>
            <span className="font-semibold text-foreground">{receipt.receiverName}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Cuenta Destino:</span>
            <span className="font-mono text-foreground">{receipt.receiverAccount}</span>
          </div>

          {receipt.description && (
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Concepto:</span>
              <span className="text-foreground italic">{receipt.description}</span>
            </div>
          )}

          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Fecha y Hora:</span>
            <span className="text-foreground">{new Date(receipt.createdAt).toLocaleString('es-CO')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
}
