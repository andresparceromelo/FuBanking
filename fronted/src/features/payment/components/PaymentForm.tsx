'use client';

import { useState } from 'react';
import { ServiceType } from '../types/payment.types';
import { usePayments } from '../hooks/usePayments';

const serviceTypes = [
  { value: ServiceType.ENERGIA, label: 'Energía' },
  { value: ServiceType.AGUA, label: 'Agua' },
  { value: ServiceType.INTERNET, label: 'Internet' },
  { value: ServiceType.CELULAR, label: 'Celular' },
];

interface PaymentFormProps {
  accountId: string;
  onSuccess?: () => void;
}

export function PaymentForm({ accountId, onSuccess }: PaymentFormProps) {
  const { createPayment, isLoading, error } = usePayments();
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.ENERGIA);
  const [providerReference, setProviderReference] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await createPayment(
      {
        accountId,
        serviceType,
        providerReference,
        amount: Number(amount),
      },
      () => {
        setProviderReference('');
        setAmount('');
        onSuccess?.();
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-white/60 mb-2">Servicio</label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value as ServiceType)}
          className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
        >
          {serviceTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Referencia del servicio</label>
        <input
          type="text"
          value={providerReference}
          onChange={(e) => setProviderReference(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Monto</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full bg-primary px-4 py-2 text-white disabled:opacity-50"
      >
        {isLoading ? 'Procesando...' : 'Pagar servicio'}
      </button>
    </form>
  );
}
