'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowRight, ArrowLeft, RotateCcw, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Pocket } from '../types/pocket.types';
import { PocketForm } from './PocketForm';

interface PocketSectionProps {
  accountId: string;
  accountBalance: number;
  pockets: Pocket[];
  isLoading: boolean;
  error: string | null;
  onCreatePocket: (payload: { accountId: string; name: string; amount: number }) => Promise<void>;
  onUpdatePocket: (pocketId: string, payload: { name?: string; amount?: number }) => Promise<void>;
  onTransferPocket: (payload: { fromPocketId: string; toPocketId: string; amount: number }) => Promise<void>;
  onRefresh: () => void;
}

export function PocketSection({
  accountId,
  accountBalance,
  pockets,
  isLoading,
  error,
  onCreatePocket,
  onUpdatePocket,
  onTransferPocket,
  onRefresh,
}: PocketSectionProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPocket, setEditingPocket] = useState<Pocket | null>(null);
  const [transferPayload, setTransferPayload] = useState({ fromPocketId: '', toPocketId: '', amount: 0 });
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reservedBalance = pockets.reduce((sum, pocket) => sum + pocket.amount, 0);
  const availableBalance = Math.max(accountBalance - reservedBalance, 0);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Mis bolsillos</h3>
          <p className="text-sm text-white/50">Agrupa el dinero que quieres reservar dentro de esta cuenta.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo bolsillo
          </Button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition"
          >
            <RotateCcw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pockets.map((pocket) => (
          <div key={pocket.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/50 uppercase tracking-[0.2em] mb-2">{pocket.name}</p>
                <p className="text-3xl font-semibold text-white">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pocket.amount)}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPocket(pocket)}
                className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:bg-white/10 transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/50">Total reservado en bolsillos</p>
            <p className="text-3xl font-semibold text-white">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(reservedBalance)}</p>
          </div>
          <div className="text-right text-sm text-white/50">
            <p>Saldo en la cuenta: <span className="text-white">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(accountBalance)}</span></p>
            <p>Disponible para nuevos bolsillos: <span className="text-white">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(availableBalance)}</span></p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs text-white/50 uppercase tracking-[0.2em] mb-2">Transferir desde</p>
            <select
              value={transferPayload.fromPocketId}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, fromPocketId: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
            >
              <option value="">Seleccionar</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs text-white/50 uppercase tracking-[0.2em] mb-2">Transferir a</p>
            <select
              value={transferPayload.toPocketId}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, toPocketId: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
            >
              <option value="">Seleccionar</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs text-white/50 uppercase tracking-[0.2em] mb-2">Monto</p>
            <input
              type="number"
              value={transferPayload.amount}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
              placeholder="200000"
              min={0}
            />
            <button
              type="button"
              onClick={async () => {
                setLocalError(null);
                if (!transferPayload.fromPocketId || !transferPayload.toPocketId) {
                  setLocalError('Debes seleccionar ambos bolsillos para transferir.');
                  return;
                }
                if (transferPayload.fromPocketId === transferPayload.toPocketId) {
                  setLocalError('El bolsillo de origen y destino deben ser distintos.');
                  return;
                }
                if (transferPayload.amount <= 0) {
                  setLocalError('Ingresa un monto mayor a cero.');
                  return;
                }
                const sourcePocket = pockets.find((p) => p.id === transferPayload.fromPocketId);
                if (!sourcePocket) {
                  setLocalError('El bolsillo de origen no existe.');
                  return;
                }
                if (transferPayload.amount > sourcePocket.amount) {
                  setLocalError('No hay saldo suficiente en el bolsillo origen.');
                  return;
                }
                await onTransferPocket(transferPayload);
                setTransferPayload({ fromPocketId: '', toPocketId: '', amount: 0 });
                showSuccess('Transferencia entre bolsillos registrada con éxito.');
              }}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Transferir
            </button>
            {localError && (
              <p className="mt-3 text-sm text-destructive">{localError}</p>
            )}
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/50">Crear un nuevo bolsillo</p>
              <p className="text-xs text-white/40">El monto reservado sale del balance disponible de la cuenta.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:bg-white/10 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <PocketForm
            submitLabel="Crear bolsillo"
            isLoading={isLoading}
            error={error ?? localError}
            onSubmit={async (payload) => {
              setLocalError(null);
              if (payload.amount <= 0) {
                setLocalError('El monto debe ser mayor a cero.');
                return;
              }
              if (payload.amount > availableBalance) {
                setLocalError('No hay saldo suficiente en la cuenta para crear este bolsillo.');
                return;
              }
              await onCreatePocket({ accountId, ...payload });
              setIsCreateOpen(false);
              showSuccess('Bolsillo creado correctamente y saldo reservado con profesionalismo.');
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </div>
      )}

      {editingPocket && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/50">Editar bolsillo</p>
              <p className="text-xs text-white/40">Ajusta nombre o monto reservado.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingPocket(null)}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <PocketForm
            initialName={editingPocket.name}
            initialAmount={editingPocket.amount}
            submitLabel="Guardar cambios"
            isLoading={isLoading}
            error={error}
            onSubmit={async (payload) => {
              await onUpdatePocket(editingPocket.id, payload);
              setEditingPocket(null);
              showSuccess('Actualización de bolsillo realizada con éxito.');
            }}
            onCancel={() => setEditingPocket(null)}
          />
        </div>
      )}
    </div>
  );
}
