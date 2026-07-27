'use client';

import { useEffect, useState } from 'react';
import { PaymentResponse } from '../types/payment.types';
import { usePayments } from '../hooks/usePayments';

interface PaymentListProps {
  onLoaded?: (payments: PaymentResponse[]) => void;
}

export function PaymentList({ onLoaded }: PaymentListProps) {
  const { getMyPayments, isLoading, error } = usePayments();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  useEffect(() => {
    async function load() {
      const result = await getMyPayments();
      setPayments(result);
      onLoaded?.(result);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {isLoading && <p className="text-white/60">Cargando pagos…</p>}
      {payments.length === 0 && !isLoading ? (
        <p className="text-white/60">No hay pagos registrados.</p>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex justify-between items-center text-sm text-white/70 mb-2">
                <span>{payment.serviceType}</span>
                <span>{payment.status}</span>
              </div>
              <p className="text-white text-sm">Referencia: {payment.providerReference}</p>
              <p className="text-white text-sm">Monto: ${payment.amount}</p>
              <p className="text-white/60 text-xs mt-2">{new Date(payment.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
