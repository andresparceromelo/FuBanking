"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/immutability, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { PiggyBank, Plus, ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { pocketService, PocketItem } from '@/features/pockets/services/pocket.service';
import * as pocketHandlers from '@/features/pockets/handlers/pocket.handlers';
import { accountService } from '@/features/account/services/account.service';
import { Account } from '@/features/account/types/account.types';
import { useToast } from '@/shared/components/feedback/ToastProvider';

export function PocketsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [fromPocketId, setFromPocketId] = useState('');
  const [toPocketId, setToPocketId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingAmount, setEditingAmount] = useState('');
  const [pockets, setPockets] = useState<PocketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingDeletePocket, setPendingDeletePocket] = useState<PocketItem | null>(null);
  const toast = useToast();

  useEffect(() => {
    void loadAccounts();
  }, []);

  useEffect(() => {
    if (!accountId) return;
    void loadPockets();
  }, [accountId]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getMyAccounts();
      setAccounts(data);
      if (data[0]) {
        setAccountId(data[0].id);
      }
    } catch (error: any) {
      toast.error('No fue posible cargar tus cuentas', error?.message || 'Intenta nuevamente.');
    }
  };

  const loadPockets = async () => {
    await pocketHandlers.loadPockets(
      { service: pocketService, toast, setLoading, setPockets },
      accountId,
    );
  };

  const handleCreate = async () => {
    await pocketHandlers.handleCreate(
      { service: pocketService, toast, setLoading, setPockets, setName, setAmount },
      { accountId, name, amount },
    );
  };

  const handleTransfer = async () => {
    await pocketHandlers.handleTransfer(
      { service: pocketService, toast, setLoading, loadPockets },
      { fromPocketId, toPocketId, transferAmount },
    );
  };

  const handleEditStart = (pocket: PocketItem) => {
    setEditingPocketId(pocket.id);
    setEditingName(pocket.name);
    setEditingAmount(pocket.amount.toString());
  };

  const handleSaveEdit = async (pocketId: string) => {
    await pocketHandlers.handleSaveEdit(
      { service: pocketService, toast, setLoading, setPockets, setEditingPocketId },
      { pocketId, editingName, editingAmount },
    );
  };

  const handleDelete = async (pocketId: string) => {
    const pocket = pockets.find((item) => item.id === pocketId);
    if (!pocket) return;

    setPendingDeletePocket(pocket);
  };

  const confirmDelete = async () => {
    await pocketHandlers.confirmDelete(
      { service: pocketService, toast, setLoading, setPockets, setPendingDeletePocket },
      pendingDeletePocket,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bolsillos de Ahorro</h1>
        <p className="text-muted-foreground text-sm mt-1">Organiza tu dinero en espacios personalizados de ahorro.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo bolsillo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="account-select" className="text-sm font-medium text-foreground">Cuenta</label>
              <select
                id="account-select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-border bg-input/50 px-4 py-2 text-sm"
              >
                {accounts.length === 0 ? (
                  <option value="">No tienes cuentas creadas</option>
                ) : (
                  accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} · {account.accountType}
                    </option>
                  ))
                )}
              </select>
            </div>
            <Input label="Nombre del bolsillo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vacaciones" />
            <Input label="Monto inicial" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            <Button onClick={handleCreate} isLoading={loading}>
              <span className="flex items-center gap-2"><Plus size={16} /> Crear bolsillo</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transferir entre bolsillos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="from-pocket-select" className="text-sm font-medium text-foreground">Bolsillo origen</label>
              <select
                id="from-pocket-select"
                value={fromPocketId}
                onChange={(e) => setFromPocketId(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-border bg-input/50 px-4 py-2 text-sm"
              >
                <option value="">Selecciona un bolsillo</option>
                {pockets.map((pocket) => (
                  <option key={pocket.id} value={pocket.id}>
                    {pocket.name} · $ {pocket.amount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="to-pocket-select" className="text-sm font-medium text-foreground">Bolsillo destino</label>
              <select
                id="to-pocket-select"
                value={toPocketId}
                onChange={(e) => setToPocketId(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-border bg-input/50 px-4 py-2 text-sm"
              >
                <option value="">Selecciona un bolsillo</option>
                {pockets.map((pocket) => (
                  <option key={pocket.id} value={pocket.id}>
                    {pocket.name} · $ {pocket.amount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Monto" type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="100" />
            <Button variant="outline" onClick={handleTransfer} isLoading={loading}>
              <span className="flex items-center gap-2"><ArrowRightLeft size={16} /> Transferir</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bolsillos actuales</CardTitle>
        </CardHeader>
        <CardContent>
          {pockets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                <PiggyBank size={28} />
              </div>
              <p className="text-muted-foreground">No hay bolsillos para esta cuenta aún.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pockets.map((pocket) => {
                const isEditing = editingPocketId === pocket.id;
                return (
                  <div key={pocket.id} className="rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{pocket.name}</h3>
                      <span className="text-sm text-primary">$ {pocket.amount.toLocaleString()}</span>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input label="Nombre" value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="Nombre" />
                        <Input label="Monto" type="number" value={editingAmount} onChange={(e) => setEditingAmount(e.target.value)} placeholder="0" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void handleSaveEdit(pocket.id)}>Guardar</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingPocketId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditStart(pocket)}>
                          <span className="flex items-center gap-2"><Pencil size={14} />Editar</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void handleDelete(pocket.id)}>
                          <span className="flex items-center gap-2"><Trash2 size={14} />Eliminar</span>
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{pocket.id}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingDeletePocket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-[#111827] p-6 shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Eliminar bolsillo</h3>
                <p className="text-sm text-muted-foreground">Esta acción devolverá el saldo a tu cuenta.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-white/5 p-4">
              <p className="text-sm text-muted-foreground">¿Deseas eliminar</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{pendingDeletePocket.name}?</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setPendingDeletePocket(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => void confirmDelete()} isLoading={loading}>
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
