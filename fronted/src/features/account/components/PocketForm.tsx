'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';

interface PocketFormPayload {
  name: string;
  amount: number;
}

interface PocketFormProps {
  initialName?: string;
  initialAmount?: number;
  onSubmit: (payload: PocketFormPayload) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
  error?: string | null;
  onCancel?: () => void;
}

export function PocketForm({
  initialName = '',
  initialAmount = 0,
  onSubmit,
  isLoading,
  submitLabel,
  error,
  onCancel,
}: PocketFormProps) {
  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState(initialAmount.toString());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    await onSubmit({
      name: name.trim(),
      amount: Number.isNaN(parsedAmount) ? 0 : parsedAmount,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="pocket-name">Nombre del bolsillo</Label>
        <Input
          id="pocket-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Vacaciones"
          required
        />
      </div>
      <div>
        <Label htmlFor="pocket-amount">Monto</Label>
        <Input
          id="pocket-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          placeholder="500000"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</p>
      )}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/10 text-white/70 hover:bg-white/5 px-4 py-3 transition"
          >
            Cancelar
          </button>
        )}
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
