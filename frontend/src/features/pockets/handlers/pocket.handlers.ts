/**
 * Handlers del módulo Bolsillos, extraídos de `PocketsClient` para poder
 * probarlos de forma unitaria.
 *
 * Cada función recibe sus dependencias (servicio, toast y setters de estado)
 * como parámetros en lugar de capturarlas del closure del componente, de modo
 * que las pruebas de caja blanca pueden recorrer cada camino del diagrama
 * `Frontend.drawio` inyectando dobles. El comportamiento es idéntico al que
 * tenía el componente: mismo orden de sentencias y mismos textos de toast.
 */

import type {
  CreatePocketPayload,
  PocketItem,
  PocketTransferResponse,
  TransferPocketPayload,
  UpdatePocketPayload,
} from '../services/pocket.service';

// ── Contratos de las dependencias ───────────────────────────────────────────

/** Subconjunto del servicio de bolsillos que consumen los handlers. */
export interface PocketApi {
  getByAccount(accountId: string): Promise<PocketItem[]>;
  create(payload: CreatePocketPayload): Promise<PocketItem>;
  update(pocketId: string, payload: UpdatePocketPayload): Promise<PocketItem>;
  remove(pocketId: string): Promise<PocketItem>;
  transfer(payload: TransferPocketPayload): Promise<PocketTransferResponse>;
}

/** Subconjunto de la API de toasts que consumen los handlers. */
export interface PocketToast {
  success: (title: string, description?: string) => unknown;
  error: (title: string, description?: string) => unknown;
  warning: (title: string, description?: string) => unknown;
}

/** Mismo contrato que el setter de `useState` de React. */
export type SetPockets = (
  value: PocketItem[] | ((prev: PocketItem[]) => PocketItem[]),
) => void;

export type SetBoolean = (value: boolean) => void;
export type SetText = (value: string) => void;

/**
 * Normaliza el mensaje de error del backend.
 * Replica la cadena `error?.message || error?.error?.message || <fallback>`
 * que usaban todos los handlers del componente.
 */
export function backendMessage(error: any, fallback: string): string {
  return error?.message || error?.error?.message || fallback;
}

// ── Consultar — loadPockets ─────────────────────────────────────────────────

export interface LoadPocketsDeps {
  service: Pick<PocketApi, 'getByAccount'>;
  toast: Pick<PocketToast, 'error'>;
  setLoading: SetBoolean;
  setPockets: SetPockets;
}

export async function loadPockets(deps: LoadPocketsDeps, accountId: string): Promise<void> {
  deps.setLoading(true);
  try {
    const data = await deps.service.getByAccount(accountId);
    deps.setPockets(data);
  } catch (error: any) {
    const mensaje = backendMessage(error, 'No fue posible cargar los bolsillos.');
    deps.toast.error('No fue posible cargar los bolsillos', mensaje);
  } finally {
    deps.setLoading(false);
  }
}

// ── Crear — handleCreate ────────────────────────────────────────────────────

export interface CreateDeps {
  service: Pick<PocketApi, 'create'>;
  toast: PocketToast;
  setLoading: SetBoolean;
  setPockets: SetPockets;
  setName: SetText;
  setAmount: SetText;
}

export interface CreateInput {
  accountId: string;
  name: string;
  amount: string;
}

export async function handleCreate(deps: CreateDeps, input: CreateInput): Promise<void> {
  if (!input.accountId || !input.name) {
    deps.toast.warning('Falta información', 'Selecciona una cuenta y escribe el nombre del bolsillo.');
    return;
  }

  deps.setLoading(true);
  try {
    const created = await deps.service.create({
      accountId: input.accountId,
      name: input.name,
      amount: Number(input.amount || 0),
    });
    deps.setPockets((prev) => [created, ...prev]);
    deps.setName('');
    deps.setAmount('');
    deps.toast.success('Bolsillo creado', 'Tu ahorro quedó organizado correctamente.');
  } catch (error: any) {
    const mensaje = backendMessage(error, 'No fue posible crear el bolsillo.');
    deps.toast.error('No fue posible crear el bolsillo', mensaje);
  } finally {
    deps.setLoading(false);
  }
}

// ── Transferir — handleTransfer ─────────────────────────────────────────────

export interface TransferDeps {
  service: Pick<PocketApi, 'transfer'>;
  toast: PocketToast;
  setLoading: SetBoolean;
  loadPockets: () => Promise<void>;
}

export interface TransferInput {
  fromPocketId: string;
  toPocketId: string;
  transferAmount: string;
}

export async function handleTransfer(deps: TransferDeps, input: TransferInput): Promise<void> {
  if (!input.fromPocketId || !input.toPocketId || !input.transferAmount) {
    deps.toast.warning('Falta información', 'Selecciona los bolsillos y un monto para transferir.');
    return;
  }

  deps.setLoading(true);
  try {
    const result = await deps.service.transfer({
      fromPocketId: input.fromPocketId,
      toPocketId: input.toPocketId,
      amount: Number(input.transferAmount),
    });
    deps.toast.success('Transferencia realizada', `${result.fromPocket.name} → ${result.toPocket.name}`);
    await deps.loadPockets();
  } catch (error: any) {
    const mensaje = backendMessage(error, 'No fue posible transferir el saldo.');
    deps.toast.error('No fue posible transferir el saldo', mensaje);
  } finally {
    deps.setLoading(false);
  }
}

// ── Actualizar — handleSaveEdit ─────────────────────────────────────────────

export interface SaveEditDeps {
  service: Pick<PocketApi, 'update'>;
  toast: PocketToast;
  setLoading: SetBoolean;
  setPockets: SetPockets;
  setEditingPocketId: (value: string | null) => void;
}

export interface SaveEditInput {
  pocketId: string;
  editingName: string;
  editingAmount: string;
}

export async function handleSaveEdit(deps: SaveEditDeps, input: SaveEditInput): Promise<void> {
  if (!input.editingName.trim()) {
    deps.toast.warning('Nombre inválido', 'El nombre del bolsillo no puede quedar vacío.');
    return;
  }

  deps.setLoading(true);
  try {
    const updated = await deps.service.update(input.pocketId, {
      name: input.editingName.trim(),
      amount: Number(input.editingAmount || 0),
    });
    deps.setPockets((prev) => prev.map((pocket) => (pocket.id === input.pocketId ? updated : pocket)));
    deps.setEditingPocketId(null);
    deps.toast.success('Bolsillo actualizado', 'Los cambios quedaron guardados.');
  } catch (error: any) {
    const mensaje = backendMessage(error, 'No fue posible actualizar el bolsillo.');
    deps.toast.error('No fue posible actualizar el bolsillo', mensaje);
  } finally {
    deps.setLoading(false);
  }
}

// ── Eliminar — confirmDelete ────────────────────────────────────────────────

export interface ConfirmDeleteDeps {
  service: Pick<PocketApi, 'remove'>;
  toast: PocketToast;
  setLoading: SetBoolean;
  setPockets: SetPockets;
  setPendingDeletePocket: (value: PocketItem | null) => void;
}

export async function confirmDelete(
  deps: ConfirmDeleteDeps,
  pendingDeletePocket: PocketItem | null,
): Promise<void> {
  if (!pendingDeletePocket) return;

  deps.setLoading(true);
  try {
    await deps.service.remove(pendingDeletePocket.id);
    deps.setPockets((prev) => prev.filter((pocket) => pocket.id !== pendingDeletePocket.id));
    deps.toast.success('Bolsillo eliminado', 'El saldo volvió a la cuenta correctamente.');
  } catch (error: any) {
    const mensaje = backendMessage(error, 'No fue posible eliminar el bolsillo.');
    deps.toast.error('No fue posible eliminar el bolsillo', mensaje);
  } finally {
    deps.setLoading(false);
    deps.setPendingDeletePocket(null);
  }
}
