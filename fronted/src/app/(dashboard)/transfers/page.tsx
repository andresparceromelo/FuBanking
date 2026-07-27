'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { RecipientSearch } from '@/features/transfers/components/RecipientSearch';
import { TransferForm } from '@/features/transfers/components/TransferForm';
import { TransferConfirmation } from '@/features/transfers/components/TransferConfirmation';
import { TransferReceipt } from '@/features/transfers/components/TransferReceipt';
import {
  RecipientInfo,
  TransferReceipt as ReceiptType,
  TransferStep,
} from '@/features/transfers/types/transfer.types';
import { useTransfer } from '@/features/transfers/hooks/useTransfer';

/**
 * Pagina de Transferencias — orquesta el flujo de 4 pasos:
 * 1. Buscar destinatario
 * 2. Ingresar monto y descripcion
 * 3. Confirmar
 * 4. Ver comprobante
 */
export default function TransfersPage() {
  const [step, setStep]           = useState<TransferStep>('search');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [senderAccountId, setSenderAccountId] = useState('');
  const [amount, setAmount]       = useState(0);
  const [description, setDescription] = useState('');
  const [receipt, setReceipt]     = useState<ReceiptType | null>(null);

  const { isLoading, error, clearError, createTransfer } = useTransfer();

  const handleRecipientFound = (r: RecipientInfo) => {
    setRecipient(r);
    setStep('form');
  };

  const handleFormConfirm = (senderId: string, amt: number, desc: string) => {
    setSenderAccountId(senderId);
    setAmount(amt);
    setDescription(desc);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!recipient || !senderAccountId) return;
    const result = await createTransfer({
      senderAccountId,
      receiverAccountNumber: recipient.accountNumberFull,
      amount,
      description: description || null,
    });
    if (result) {
      setReceipt(result);
      setStep('receipt');
    }
  };

  const handleReset = () => {
    setStep('search');
    setRecipient(null);
    setAmount(0);
    setDescription('');
    setReceipt(null);
    clearError();
  };

  const STEP_LABELS: Record<TransferStep, string> = {
    search:  'Buscar',
    form:    'Monto',
    confirm: 'Confirmar',
    receipt: 'Comprobante',
  };

  const STEP_ORDER: TransferStep[] = ['search', 'form', 'confirm', 'receipt'];
  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Send size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Transferencias</h1>
          <p className="text-sm text-white/50">Envia dinero a otros usuarios</p>
        </div>
      </div>

      {/* Indicador de pasos */}
      {step !== 'receipt' && (
        <div className="flex items-center gap-2">
          {STEP_ORDER.filter((s) => s !== 'receipt').map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${
                i <= currentIndex ? 'text-primary' : 'text-white/30'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentIndex
                    ? 'bg-primary text-white'
                    : i === currentIndex
                    ? 'bg-primary/20 text-primary border border-primary'
                    : 'bg-white/5 text-white/30'
                }`}>
                  {i + 1}
                </div>
                <span className="hidden sm:block">{STEP_LABELS[s]}</span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-px ${i < currentIndex ? 'bg-primary/50' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contenedor de pasos */}
      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-sm max-w-lg">
        {step === 'search' && (
          <RecipientSearch onRecipientFound={handleRecipientFound} />
        )}

        {step === 'form' && recipient && (
          <TransferForm
            recipient={recipient}
            onConfirm={handleFormConfirm}
            onBack={() => setStep('search')}
          />
        )}

        {step === 'confirm' && recipient && (
          <TransferConfirmation
            recipient={recipient}
            amount={amount}
            description={description}
            isLoading={isLoading}
            error={error}
            onConfirm={handleConfirm}
            onBack={() => { clearError(); setStep('form'); }}
          />
        )}

        {step === 'receipt' && receipt && (
          <TransferReceipt
            receipt={receipt}
            onNewTransfer={handleReset}
          />
        )}
      </div>
    </div>
  );
}
