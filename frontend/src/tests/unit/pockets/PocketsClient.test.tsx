import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PocketsClient } from '@/features/pockets/components/PocketsClient';
import { pocketService } from '@/features/pockets/services/pocket.service';
import { accountService } from '@/features/account/services/account.service';

const { mockToastError, mockToastSuccess, mockToastWarning } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastWarning: vi.fn(),
}));

vi.mock('@/features/pockets/services/pocket.service', () => ({
  pocketService: {
    getByAccount: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    transfer: vi.fn(),
  },
}));

vi.mock('@/features/account/services/account.service', () => ({
  accountService: { getMyAccounts: vi.fn() },
}));

vi.mock('@/shared/components/feedback/ToastProvider', () => ({
  useToast: () => ({
    error: mockToastError,
    success: mockToastSuccess,
    warning: mockToastWarning,
  }),
}));

const getByAccount = pocketService.getByAccount as unknown as ReturnType<typeof vi.fn>;
const create = pocketService.create as unknown as ReturnType<typeof vi.fn>;
const update = pocketService.update as unknown as ReturnType<typeof vi.fn>;
const remove = pocketService.remove as unknown as ReturnType<typeof vi.fn>;
const transfer = pocketService.transfer as unknown as ReturnType<typeof vi.fn>;
const getMyAccounts = accountService.getMyAccounts as unknown as ReturnType<typeof vi.fn>;

function account(id = 'acc-1') {
  return { id, accountNumber: '1234567890', accountType: 'AHORROS' } as never;
}

function pocket(id: string, name = 'Viaje', amount = 50000) {
  return { id, accountId: 'acc-1', name, amount, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
}

describe('PocketsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyAccounts.mockResolvedValue([account()]);
    getByAccount.mockResolvedValue([]);
  });

  it('should load accounts, select the first and load its pockets', async () => {
    getByAccount.mockResolvedValue([pocket('p1')]);
    render(<PocketsClient />);

    expect(screen.getByText('Bolsillos de Ahorro')).toBeInTheDocument();

    await waitFor(() => expect(getMyAccounts).toHaveBeenCalled());
    await waitFor(() => expect(getByAccount).toHaveBeenCalledWith('acc-1'));
    await waitFor(() => expect(screen.getByText('Viaje')).toBeInTheDocument());
  });

  it('should show no-accounts option when the list is empty', async () => {
    getMyAccounts.mockResolvedValue([]);
    render(<PocketsClient />);

    await waitFor(() => expect(getMyAccounts).toHaveBeenCalled());
    expect(screen.getByText('No tienes cuentas creadas')).toBeInTheDocument();
  });

  it('should toast when accounts fail to load', async () => {
    getMyAccounts.mockRejectedValueOnce({ message: 'caído' });
    render(<PocketsClient />);

    await waitFor(() => expect(getMyAccounts).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('No fue posible cargar tus cuentas', 'caído'),
    );
    expect(screen.getByText('No tienes cuentas creadas')).toBeInTheDocument();
  });

  it('should fall back when accounts fail without message', async () => {
    getMyAccounts.mockRejectedValueOnce(null);
    render(<PocketsClient />);

    await waitFor(() => expect(getMyAccounts).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'No fue posible cargar tus cuentas',
        'Intenta nuevamente.',
      ),
    );
  });

  it('should create a pocket from the form', async () => {
    create.mockResolvedValue(pocket('p9', 'Nuevo', 70000));
    render(<PocketsClient />);

    await waitFor(() => expect(getMyAccounts).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText('No hay bolsillos para esta cuenta aún.')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText('Vacaciones'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '70000' } });
    fireEvent.click(screen.getByText('Crear bolsillo'));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ accountId: 'acc-1', name: 'Nuevo', amount: 70000 }));
    await waitFor(() => expect(screen.getByText('Nuevo')).toBeInTheDocument());
    expect(mockToastSuccess).toHaveBeenCalledWith('Bolsillo creado', expect.any(String));
  });

  it('should transfer between pockets', async () => {
    getByAccount.mockResolvedValue([pocket('p1', 'A', 100000), pocket('p2', 'B', 50000)]);
    transfer.mockResolvedValue({ fromPocket: pocket('p1'), toPocket: pocket('p2') });
    render(<PocketsClient />);

    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Bolsillo origen'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Bolsillo destino'), { target: { value: 'p2' } });
    fireEvent.change(screen.getByPlaceholderText('100'), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Transferir'));

    await waitFor(() =>
      expect(transfer).toHaveBeenCalledWith({ fromPocketId: 'p1', toPocketId: 'p2', amount: 5000 }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Transferencia realizada', expect.any(String));
  });

  it('should edit and save a pocket name', async () => {
    getByAccount.mockResolvedValue([pocket('p1', 'Viejo')]);
    update.mockResolvedValue(pocket('p1', 'Renombrado'));
    render(<PocketsClient />);

    await waitFor(() => expect(screen.getByText('Viejo')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Editar'));
    fireEvent.change(screen.getByDisplayValue('Viejo'), { target: { value: 'Renombrado' } });
    fireEvent.change(screen.getByDisplayValue('50000'), { target: { value: '60000' } });
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'Renombrado' })),
    );
    await waitFor(() => expect(screen.getByText('Renombrado')).toBeInTheDocument());
  });

  it('should cancel editing without saving', async () => {
    getByAccount.mockResolvedValue([pocket('p1', 'Viejo')]);
    render(<PocketsClient />);

    await waitFor(() => expect(screen.getByText('Viejo')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Cancelar'));

    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText('Viejo')).toBeInTheDocument();
  });

  it('should delete through the confirmation modal', async () => {
    getByAccount.mockResolvedValue([pocket('p1', 'Borrable')]);
    remove.mockResolvedValue(pocket('p1'));
    render(<PocketsClient />);

    await waitFor(() => expect(screen.getByText('Borrable')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Eliminar'));
    expect(screen.getByText('Eliminar bolsillo')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sí, eliminar'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(screen.queryByText('Borrable')).not.toBeInTheDocument());
  });

  it('should close the modal on Cancelar', async () => {
    getByAccount.mockResolvedValue([pocket('p1', 'Borrable')]);
    render(<PocketsClient />);

    await waitFor(() => expect(screen.getByText('Borrable')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Eliminar'));
    fireEvent.click(screen.getByText('Cancelar'));

    expect(remove).not.toHaveBeenCalled();
    expect(screen.queryByText('¿Deseas eliminar')).not.toBeInTheDocument();
  });

  it('should reload pockets when the account changes', async () => {
    getMyAccounts.mockResolvedValue([account('acc-1'), account('acc-2')]);
    render(<PocketsClient />);

    await waitFor(() => expect(getByAccount).toHaveBeenCalledWith('acc-1'));

    fireEvent.change(screen.getByLabelText('Cuenta'), { target: { value: 'acc-2' } });

    await waitFor(() => expect(getByAccount).toHaveBeenCalledWith('acc-2'));
  });

  it('should keep the empty state without pockets', async () => {
    render(<PocketsClient />);

    await waitFor(() => expect(getByAccount).toHaveBeenCalled());
    expect(screen.getByText('No hay bolsillos para esta cuenta aún.')).toBeInTheDocument();
  });
});
