'use client';

import React, { useEffect, useState } from 'react';
import { HandCoins, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useMoneyRequests } from '@/features/money-request/hooks/useMoneyRequests';
import { useAuth } from '@/shared/hooks/useAuth';
import { useToast } from '@/shared/components/feedback/ToastProvider';
import { cn } from '@/shared/utils/cn';

export default function RequestsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { requests, isLoading, fetchRequests, createRequest, respond } = useMoneyRequests();

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!email || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Datos inválidos', 'Ingresa un correo y monto válidos.');
      return;
    }

    const result = await createRequest({ requestedUserEmail: email, amount: amountNum, description });
    if (result) {
      toast.success('Solicitud enviada', `Cobro enviado a ${email}.`);
      setEmail('');
      setAmount('');
      setDescription('');
    }
  };

  const handleRespond = async (id: string, accept: boolean) => {
    const result = await respond(id, accept);
    if (result) {
      toast.success(accept ? 'Cobro aceptado' : 'Cobro rechazado', 'Se ha actualizado el estado de la solicitud.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobros y Solicitudes</h1>
        <p className="text-muted-foreground text-sm mt-1">Pide dinero a tus amigos o paga los cobros que te han enviado.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Enviar Solicitud */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HandCoins size={20} />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Solicitar dinero</h2>
                <p className="text-xs text-muted-foreground">Envía un cobro por correo</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Correo del destinatario</label>
                <input
                  type="email"
                  placeholder="amigo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Monto a cobrar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Concepto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Mitad de la pizza"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-transform active:scale-[0.98]"
              >
                <Send size={16} />
                Enviar cobro
              </button>
            </form>
          </div>
        </aside>

        {/* Historial de Solicitudes */}
        <section>
          {requests.length === 0 ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <HandCoins className="mb-4 text-muted-foreground opacity-50" size={48} />
              <h3 className="text-lg font-bold text-foreground">No tienes cobros activos</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Aquí aparecerán las solicitudes de dinero que envíes o que otros te envíen a ti.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground px-1">Actividad de Cobros</h3>
              <div className="space-y-3">
                {requests.map((req) => {
                  const isReceived = req.requestedUserId === user?.id;
                  const isPending = req.status === 'PENDIENTE';
                  
                  return (
                    <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full shrink-0",
                          isReceived ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {isReceived ? <HandCoins size={20} /> : <Send size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {isReceived ? 'Te han solicitado dinero' : 'Cobro enviado'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.description || 'Sin concepto'} • {formatDate(req.createdAt)}
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            {req.status === 'ACEPTADA' && <CheckCircle2 size={12} className="text-green-500" />}
                            {req.status === 'RECHAZADA' && <XCircle size={12} className="text-red-500" />}
                            {req.status === 'PENDIENTE' && <Clock size={12} className="text-yellow-500" />}
                            <span className={cn(
                              "text-[10px] font-bold tracking-wider uppercase",
                              req.status === 'ACEPTADA' && "text-green-600 dark:text-green-400",
                              req.status === 'RECHAZADA' && "text-red-600 dark:text-red-400",
                              req.status === 'PENDIENTE' && "text-yellow-600 dark:text-yellow-400",
                            )}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        <span className={cn(
                          "text-xl font-black drop-shadow-sm",
                          isReceived ? "text-foreground" : "text-primary"
                        )}>
                          {formatCurrency(req.amount)}
                        </span>
                        
                        {isReceived && isPending && (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleRespond(req.id, false)}
                              disabled={isLoading}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleRespond(req.id, true)}
                              disabled={isLoading}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              Aceptar y Pagar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
