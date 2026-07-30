'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CreditCard, Plus } from 'lucide-react';
import { useAccounts } from '@/features/account/hooks/useAccounts';
import { useCards } from '@/features/cards/hooks/useCards';
import { useToast } from '@/shared/components/feedback/ToastProvider';
import { VirtualCard } from '@/features/cards/components/VirtualCard';

export default function CardsPage() {
  const toast = useToast();
  const { accounts } = useAccounts();
  const { cards, isLoading, error, setError, fetchCards, createCard, toggleLock } = useCards();
  const [accountId, setAccountId] = useState('');
  const activeAccountId = accountId || accounts[0]?.id || '';
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId),
    [accounts, activeAccountId],
  );

  const loadCards = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCards();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCards]);

  const handleCreate = async () => {
    setError(null);
    if (!activeAccountId) {
      setError('Selecciona una cuenta para crear la tarjeta.');
      return;
    }

    const card = await createCard(activeAccountId);
    if (!card) {
      toast.error('No pudimos crear la tarjeta', 'Intenta nuevamente.');
      return;
    }

    toast.success('Tarjeta creada', `Terminada en ${card.lastFour}.`);
  };

  const handleToggle = async (cardId: string) => {
    const card = await toggleLock(cardId);
    if (!card) {
      toast.error('No pudimos actualizar la tarjeta', 'Intenta nuevamente.');
      return;
    }

    toast.success(
      card.status === 'BLOQUEADA' ? 'Tarjeta bloqueada' : 'Tarjeta desbloqueada',
      `La tarjeta terminada en ${card.lastFour} quedo ${card.status.toLowerCase()}.`,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tarjeta virtual</h1>
        <p className="text-muted-foreground text-sm mt-1">Crea y administra tarjetas virtuales asociadas a tus cuentas.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Nueva tarjeta</h2>
              <p className="text-xs text-muted-foreground">CVV oculto por seguridad</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <select
            value={activeAccountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountType} - ****{account.accountNumber.slice(-4)}
              </option>
            ))}
          </select>

          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            {selectedAccount ? `Se creara para la cuenta ****${selectedAccount.accountNumber.slice(-4)}.` : 'Crea una cuenta primero para emitir tarjetas.'}
          </p>

          <button
            type="button"
            onClick={handleCreate}
            disabled={isLoading || !activeAccountId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Plus size={16} />
            Crear tarjeta
          </button>
        </aside>

        <section className="grid gap-4 md:grid-cols-2">
          {cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center md:col-span-2">
              <CreditCard className="mx-auto mb-3 text-muted-foreground" size={34} />
              <p className="font-semibold text-foreground">Aun no tienes tarjetas</p>
              <p className="mt-1 text-sm text-muted-foreground">Crea tu primera tarjeta virtual para compras digitales.</p>
            </div>
          ) : (
            cards.map((card) => (
              <VirtualCard 
                key={card.id}
                card={card}
                onToggleLock={handleToggle}
                isLoading={isLoading}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
