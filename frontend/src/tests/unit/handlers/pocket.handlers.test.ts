import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  backendMessage,
  loadPockets,
  handleCreate,
  handleTransfer,
  handleSaveEdit,
  confirmDelete,
  type PocketApi,
  type PocketToast,
} from '@/features/pockets/handlers/pocket.handlers';
import type { PocketItem } from '@/features/pockets/services/pocket.service';

function pocket(id: string, name = 'Viaje'): PocketItem {
  return { id, accountId: 'acc-1', name, amount: 50000, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
}

function toast(): PocketToast & { success: any; error: any; warning: any } {
  return { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
}

function setters() {
  return {
    setLoading: vi.fn(),
    setPockets: vi.fn(),
    setName: vi.fn(),
    setAmount: vi.fn(),
    setEditingPocketId: vi.fn(),
    setPendingDeletePocket: vi.fn(),
    loadPockets: vi.fn().mockResolvedValue(undefined),
  };
}

describe('backendMessage', () => {
  it('should prefer message, then nested error, then fallback', () => {
    expect(backendMessage({ message: 'm' }, 'f')).toBe('m');
    expect(backendMessage({ error: { message: 'n' } }, 'f')).toBe('n');
    expect(backendMessage(null, 'f')).toBe('f');
    expect(backendMessage({}, 'f')).toBe('f');
  });
});

describe('loadPockets', () => {
  it('should load and clear loading', async () => {
    const service = { getByAccount: vi.fn().mockResolvedValue([pocket('p1')]) };
    const t = toast();
    const s = setters();

    await loadPockets({ service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets }, 'acc-1');

    expect(service.getByAccount).toHaveBeenCalledWith('acc-1');
    expect(s.setPockets).toHaveBeenCalledWith([pocket('p1')]);
    expect(s.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(s.setLoading).toHaveBeenLastCalledWith(false);
  });

  it('should toast the server message on failure', async () => {
    const service = { getByAccount: vi.fn().mockRejectedValue({ message: 'caído' }) };
    const t = toast();
    const s = setters();

    await loadPockets({ service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets }, 'acc-1');

    expect(t.error).toHaveBeenCalledWith('No fue posible cargar los bolsillos', 'caído');
    expect(s.setPockets).not.toHaveBeenCalled();
    expect(s.setLoading).toHaveBeenLastCalledWith(false);
  });
});

describe('handleCreate', () => {
  it('should warn without account or name', async () => {
    const service: Pick<PocketApi, 'create'> = { create: vi.fn() };
    const t = toast();
    const s = setters();
    const deps = { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setName: s.setName, setAmount: s.setAmount };

    await handleCreate(deps, { accountId: '', name: '', amount: '0' });

    expect(t.warning).toHaveBeenCalledWith('Falta información', expect.any(String));
    expect(service.create).not.toHaveBeenCalled();
  });

  it('should create, prepend, reset and toast', async () => {
    const created = pocket('p9', 'Nuevo');
    const service: Pick<PocketApi, 'create'> = { create: vi.fn().mockResolvedValue(created) };
    const t = toast();
    const s = setters();
    const deps = { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setName: s.setName, setAmount: s.setAmount };

    await handleCreate(deps, { accountId: 'acc-1', name: 'Nuevo', amount: '70000' });

    expect(service.create).toHaveBeenCalledWith({ accountId: 'acc-1', name: 'Nuevo', amount: 70000 });
    expect(s.setPockets).toHaveBeenCalledWith(expect.any(Function));
    const updater = s.setPockets.mock.calls[0][0] as (prev: PocketItem[]) => PocketItem[];
    expect(updater([pocket('p1')])[0]).toEqual(created);
    expect(s.setName).toHaveBeenCalledWith('');
    expect(s.setAmount).toHaveBeenCalledWith('');
    expect(t.success).toHaveBeenCalledWith('Bolsillo creado', expect.any(String));
    expect(s.setLoading).toHaveBeenLastCalledWith(false);
  });

  it('should default empty amount to zero', async () => {
    const created = pocket('p9', 'Nuevo');
    const service: Pick<PocketApi, 'create'> = { create: vi.fn().mockResolvedValue(created) };
    const t = toast();
    const s = setters();
    const deps = { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setName: s.setName, setAmount: s.setAmount };

    await handleCreate(deps, { accountId: 'acc-1', name: 'Nuevo', amount: '' });

    expect(service.create).toHaveBeenCalledWith({ accountId: 'acc-1', name: 'Nuevo', amount: 0 });
  });

  it('should toast nested error messages', async () => {
    const service: Pick<PocketApi, 'create'> = {
      create: vi.fn().mockRejectedValue({ error: { message: 'anidado' } }),
    };
    const t = toast();
    const s = setters();
    const deps = { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setName: s.setName, setAmount: s.setAmount };

    await handleCreate(deps, { accountId: 'acc-1', name: 'X', amount: '1' });

    expect(t.error).toHaveBeenCalledWith('No fue posible crear el bolsillo', 'anidado');
  });
});

describe('handleTransfer', () => {
  it('should warn without pockets or amount', async () => {
    const service: Pick<PocketApi, 'transfer'> = { transfer: vi.fn() };
    const t = toast();
    const s = setters();

    await handleTransfer(
      { service, toast: t, setLoading: s.setLoading, loadPockets: s.loadPockets },
      { fromPocketId: '', toPocketId: '', transferAmount: '' },
    );

    expect(t.warning).toHaveBeenCalledWith('Falta información', expect.any(String));
    expect(service.transfer).not.toHaveBeenCalled();
  });

  it('should transfer, toast and reload', async () => {
    const result = { fromPocket: pocket('p1', 'A'), toPocket: pocket('p2', 'B') };
    const service: Pick<PocketApi, 'transfer'> = { transfer: vi.fn().mockResolvedValue(result) };
    const t = toast();
    const s = setters();

    await handleTransfer(
      { service, toast: t, setLoading: s.setLoading, loadPockets: s.loadPockets },
      { fromPocketId: 'p1', toPocketId: 'p2', transferAmount: '1000' },
    );

    expect(service.transfer).toHaveBeenCalledWith({ fromPocketId: 'p1', toPocketId: 'p2', amount: 1000 });
    expect(t.success).toHaveBeenCalledWith('Transferencia realizada', 'A → B');
    expect(s.loadPockets).toHaveBeenCalled();
  });

  it('should toast on transfer failure', async () => {
    const service: Pick<PocketApi, 'transfer'> = { transfer: vi.fn().mockRejectedValue(null) };
    const t = toast();
    const s = setters();

    await handleTransfer(
      { service, toast: t, setLoading: s.setLoading, loadPockets: s.loadPockets },
      { fromPocketId: 'p1', toPocketId: 'p2', transferAmount: '1000' },
    );

    expect(t.error).toHaveBeenCalledWith(
      'No fue posible transferir el saldo',
      'No fue posible transferir el saldo.',
    );
    expect(s.loadPockets).not.toHaveBeenCalled();
  });
});

describe('handleSaveEdit', () => {
  it('should warn on empty name', async () => {
    const service: Pick<PocketApi, 'update'> = { update: vi.fn() };
    const t = toast();
    const s = setters();

    await handleSaveEdit(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setEditingPocketId: s.setEditingPocketId },
      { pocketId: 'p1', editingName: '   ', editingAmount: '1' },
    );

    expect(t.warning).toHaveBeenCalledWith('Nombre inválido', expect.any(String));
    expect(service.update).not.toHaveBeenCalled();
  });

  it('should update, map state and close editing', async () => {
    const updated = pocket('p1', 'Renombrado');
    const service: Pick<PocketApi, 'update'> = { update: vi.fn().mockResolvedValue(updated) };
    const t = toast();
    const s = setters();

    await handleSaveEdit(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setEditingPocketId: s.setEditingPocketId },
      { pocketId: 'p1', editingName: '  Renombrado  ', editingAmount: '90000' },
    );

    expect(service.update).toHaveBeenCalledWith('p1', { name: 'Renombrado', amount: 90000 });
    const updater = s.setPockets.mock.calls[0][0] as (prev: PocketItem[]) => PocketItem[];
    expect(updater([pocket('p1', 'Viejo'), pocket('p2')]).map((p) => p.name)).toEqual([
      'Renombrado',
      'Viaje',
    ]);
    expect(s.setEditingPocketId).toHaveBeenCalledWith(null);
    expect(t.success).toHaveBeenCalledWith('Bolsillo actualizado', expect.any(String));
  });

  it('should default empty edit amount to zero', async () => {
    const updated = pocket('p1', 'Ok');
    const service: Pick<PocketApi, 'update'> = { update: vi.fn().mockResolvedValue(updated) };
    const t = toast();
    const s = setters();

    await handleSaveEdit(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setEditingPocketId: s.setEditingPocketId },
      { pocketId: 'p1', editingName: 'Ok', editingAmount: '' },
    );

    expect(service.update).toHaveBeenCalledWith('p1', { name: 'Ok', amount: 0 });
  });

  it('should toast on update failure', async () => {
    const service: Pick<PocketApi, 'update'> = { update: vi.fn().mockRejectedValue({ message: 'x' }) };
    const t = toast();
    const s = setters();

    await handleSaveEdit(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setEditingPocketId: s.setEditingPocketId },
      { pocketId: 'p1', editingName: 'Ok', editingAmount: '1' },
    );

    expect(t.error).toHaveBeenCalledWith('No fue posible actualizar el bolsillo', 'x');
  });
});

describe('confirmDelete', () => {
  it('should return silently without a pending pocket', async () => {
    const service: Pick<PocketApi, 'remove'> = { remove: vi.fn() };
    const t = toast();
    const s = setters();

    await confirmDelete(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setPendingDeletePocket: s.setPendingDeletePocket },
      null,
    );

    expect(service.remove).not.toHaveBeenCalled();
    expect(s.setLoading).not.toHaveBeenCalled();
  });

  it('should remove, filter state and clear pending', async () => {
    const service: Pick<PocketApi, 'remove'> = { remove: vi.fn().mockResolvedValue(pocket('p1')) };
    const t = toast();
    const s = setters();

    await confirmDelete(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setPendingDeletePocket: s.setPendingDeletePocket },
      pocket('p1'),
    );

    expect(service.remove).toHaveBeenCalledWith('p1');
    const updater = s.setPockets.mock.calls[0][0] as (prev: PocketItem[]) => PocketItem[];
    expect(updater([pocket('p1'), pocket('p2')])).toEqual([pocket('p2')]);
    expect(t.success).toHaveBeenCalledWith('Bolsillo eliminado', expect.any(String));
    expect(s.setPendingDeletePocket).toHaveBeenCalledWith(null);
    expect(s.setLoading).toHaveBeenLastCalledWith(false);
  });

  it('should toast and clear pending on failure', async () => {
    const service: Pick<PocketApi, 'remove'> = { remove: vi.fn().mockRejectedValue({ message: 'x' }) };
    const t = toast();
    const s = setters();

    await confirmDelete(
      { service, toast: t, setLoading: s.setLoading, setPockets: s.setPockets, setPendingDeletePocket: s.setPendingDeletePocket },
      pocket('p1'),
    );

    expect(t.error).toHaveBeenCalledWith('No fue posible eliminar el bolsillo', 'x');
    expect(s.setPendingDeletePocket).toHaveBeenCalledWith(null);
  });
});
