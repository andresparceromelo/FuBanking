'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, AtSign, Landmark, Search, Send, UserCheck } from 'lucide-react';
import { useAccounts } from '@/features/account/hooks/useAccounts';
import { useTransfers } from '../hooks/useTransfers';
import { TransferReceipt, TransferRecipient } from '../services/transfer.service';
import { TransferReceiptModal } from './TransferReceiptModal';
import { useToast } from '@/shared/components/feedback/ToastProvider';

type SearchMode = 'account' | 'email';

export function TransferForm() {
  const toast = useToast();
  const { accounts, isLoading: isAccountsLoading, refetch } = useAccounts();
  const { createTransfer, searchRecipient, isLoading, error, setError } = useTransfers();

  const [senderAccountId, setSenderAccountId] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('account');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiverInfo, setReceiverInfo] = useState<TransferRecipient | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const activeSenderAccountId = senderAccountId || accounts[0]?.id || '';

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === activeSenderAccountId),
    [accounts, activeSenderAccountId],
  );

  const formattedBalance = selectedAccount
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(selectedAccount.balance)
    : '$0';

  const handleSearchReceiver = async () => {
    const query = recipientQuery.trim();
    if (!query) return;

    setReceiverInfo(null);
    setReceiverAccountNumber('');

    const recipient = await searchRecipient(query, searchMode);
    if (!recipient) return;

    setReceiverInfo(recipient);
    setReceiverAccountNumber(recipient.accountNumberFull);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!activeSenderAccountId) {
      setError('Selecciona una cuenta de origen.');
      return;
    }

    if (!receiverAccountNumber) {
      setError('Verifica el destinatario antes de enviar.');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Ingresa un monto valido mayor a cero.');
      return;
    }

    if (selectedAccount && numericAmount > selectedAccount.balance) {
      setError('Saldo insuficiente en la cuenta seleccionada.');
      return;
    }

    const result = await createTransfer({
      senderAccountId: activeSenderAccountId,
      receiverAccountNumber,
      amount: numericAmount,
      description: description.trim() || undefined,
    });

    if (!result) {
      toast.error('No pudimos completar la transferencia', 'Revisa los datos o intenta nuevamente.');
      return;
    }

    setReceipt(result);
    setIsReceiptOpen(true);
    toast.success('Transferencia realizada', `Enviamos ${formatCurrency(result.amount)} a ${result.receiverName}.`);
    setAmount('');
    setDescription('');
    setRecipientQuery('');
    setReceiverAccountNumber('');
    setReceiverInfo(null);
    refetch();
  };

  if (isAccountsLoading) {
    return <div className="h-[560px] rounded-2xl bg-card animate-pulse" />;
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Send size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Enviar dinero</h2>
              <p className="text-sm text-muted-foreground">Transferencias instantaneas entre cuentas FuBanking.</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
              Cuenta de origen
            </label>
            <select
              value={activeSenderAccountId}
              onChange={(event) => setSenderAccountId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountType} - ****{account.accountNumber.slice(-4)} - {account.balance.toLocaleString('es-CO')} COP
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
              Buscar destinatario
            </label>
            <div className="mb-2 grid grid-cols-2 rounded-xl border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => {
                  setSearchMode('account');
                  setRecipientQuery('');
                  setReceiverInfo(null);
                  setReceiverAccountNumber('');
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  searchMode === 'account' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Landmark size={14} />
                Cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('email');
                  setRecipientQuery('');
                  setReceiverInfo(null);
                  setReceiverAccountNumber('');
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  searchMode === 'email' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <AtSign size={14} />
                Correo
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type={searchMode === 'email' ? 'email' : 'text'}
                placeholder={searchMode === 'email' ? 'correo@ejemplo.com' : 'Numero de cuenta'}
                value={recipientQuery}
                onChange={(event) => {
                  setRecipientQuery(event.target.value);
                  setReceiverInfo(null);
                  setReceiverAccountNumber('');
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleSearchReceiver}
                disabled={isLoading || !recipientQuery.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-border disabled:opacity-50"
                title="Verificar destinatario"
              >
                <Search size={16} />
              </button>
            </div>

            {receiverInfo && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
                <UserCheck size={16} />
                <span>
                  {receiverInfo.name} - {receiverInfo.accountNumber}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
              Monto
            </label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
              Concepto
            </label>
            <input
              type="text"
              maxLength={255}
              placeholder="Pago, ahorro, regalo..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || accounts.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : 'Transferir ahora'}
            <ArrowRight size={17} />
          </button>
        </form>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Disponible</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{formattedBalance}</p>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Origen</p>
              <p>{selectedAccount ? `****${selectedAccount.accountNumber.slice(-4)}` : 'Sin cuenta seleccionada'}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Destino</p>
              <p>{receiverInfo ? `${receiverInfo.name} (${receiverInfo.accountNumber})` : 'Verifica un destinatario'}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Seguridad</p>
              <p>Validamos titular, cuenta activa y saldo antes de completar la operacion.</p>
            </div>
          </div>
        </aside>
      </div>

      <TransferReceiptModal receipt={receipt} isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} />
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}
