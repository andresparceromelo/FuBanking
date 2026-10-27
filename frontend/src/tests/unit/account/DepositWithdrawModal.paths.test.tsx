/**
 * CAJA BLANCA — Depositar dinero (`handleSubmit` de `DepositWithdrawModal`, modo `deposit`).
 *
 * Un caso por cada camino básico (McCabe) del grafo de flujo del manejador.
 * El manejador vive dentro del componente (no hay un archivo de handlers como en
 * `features/pockets/`), así que se ejercita renderizando el modal real con el
 * servicio HTTP y el API de toasts sustituidos por dobles (jsdom, sin red).
 *
 * Correspondencia nodo ↔ sentencia de `DepositWithdrawModal.tsx`:
 *   1  → proceso   e.preventDefault(); setError(null); numericAmount = parseFloat(amount)
 *   2  → decisión  Number.isNaN(numericAmount) || numericAmount <= 0
 *   3  → proceso   setError('Por favor ingresa un monto válido mayor a cero.') + return
 *   4  → decisión  !isDeposit && numericAmount > account.balance
 *   5  → proceso   setError('Saldo insuficiente…') + return                 (solo Retiro)
 *   6  → proceso   setIsLoading(true)
 *   7  → decisión  isDeposit
 *   8  → proceso   await accountService.deposit(account.id, numericAmount, description)
 *   9  → proceso   await accountService.withdraw(...)                       (solo Retiro)
 *   10 → decisión  ¿el servicio lanzó error?
 *   11 → proceso   toast.success + limpiar campos + onSuccess() + onClose()
 *   12 → proceso   catch: mensaje (message del error o texto de respaldo) + setError + toast.error
 *   13 → proceso   finally: setIsLoading(false)
 *
 * V(G) = decisiones (2, 4, 7 y la excepción del nodo 10) + 1 = 5 caminos.
 * En modo `deposit` los nodos 4→5 y 7→9 son inalcanzables (pertenecen a Retiro).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DepositWithdrawModal } from '@/features/account/components/DepositWithdrawModal';
import { AccountStatus, AccountType, type Account } from '@/features/account/types/account.types';

const { toast, accountServiceMock } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  accountServiceMock: { deposit: vi.fn(), withdraw: vi.fn() },
}));

vi.mock('@/shared/components/feedback/ToastProvider', () => ({ useToast: () => toast }));
vi.mock('@/features/account/services/account.service', () => ({ accountService: accountServiceMock }));

const CUENTA: Account = {
  id: 'acc-1',
  userId: 'user-1',
  accountNumber: 'BA0000001234',
  accountType: AccountType.AHORROS,
  balance: 1_000_000,
  status: AccountStatus.ACTIVA,
  details: null,
  createdAt: '2025-01-01T00:00:00Z',
};

const MSG_MONTO = 'Por favor ingresa un monto válido mayor a cero.';
const MSG_RESPALDO = 'Error al procesar la transaccion';

function abrirModal() {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const view = render(
    <DepositWithdrawModal account={CUENTA} type="deposit" isOpen onClose={onClose} onSuccess={onSuccess} />,
  );
  return { ...view, onClose, onSuccess };
}

const campoMonto = () => screen.getByLabelText(/Monto a ingresar/) as HTMLInputElement;
const campoDescripcion = () => screen.getByLabelText(/Descripción/) as HTMLInputElement;
const botonAbonar = () => screen.getByTestId('dw-submit') as HTMLButtonElement;

/** `fireEvent.submit` evita la validación nativa `required`, que en un navegador real frena el monto vacío (TC-150). */
function enviar(container: HTMLElement, monto: string, descripcion = '') {
  fireEvent.change(campoMonto(), { target: { value: monto } });
  if (descripcion) fireEvent.change(campoDescripcion(), { target: { value: descripcion } });
  fireEvent.submit(container.querySelector('form')!);
}

describe('Caja blanca · DepositWithdrawModal.handleSubmit (depósito)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Camino 1: 1 → 2 → 3 → Fin ─────────────────────────────────────────────
  it.each([
    ['FE-DE-C1  · monto 0 (segunda cláusula: <= 0, valor límite)', '0'],
    ['FE-DE-C1b · monto -50000 (segunda cláusula: <= 0)', '-50000'],
    ['FE-DE-C1c · monto vacío → NaN (primera cláusula: isNaN)', ''],
  ])('%s → mensaje de monto inválido, sin llamar al servicio', async (_caso, monto) => {
    const { container, onClose, onSuccess } = abrirModal();

    enviar(container, monto);

    expect(await screen.findByTestId('dw-error')).toHaveTextContent(MSG_MONTO);
    expect(accountServiceMock.deposit).not.toHaveBeenCalled(); // nodo 8 no recorrido
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(botonAbonar()).toBeEnabled(); // nodos 6 y 13 no recorridos: nunca se activó la carga
    expect(botonAbonar()).toHaveTextContent('Abonar Saldo');
  });

  // ── Camino 2 (no ejecutable en depósito): 1 → 2 → 4 → 5 → Fin ─────────────
  it('FE-DE-C2  · NO EJECUTABLE en modo depósito: un monto mayor al saldo no se rechaza (la decisión 4 es siempre FALSA)', async () => {
    accountServiceMock.deposit.mockResolvedValue({ ...CUENTA, balance: 6_000_000 });
    const { container } = abrirModal();

    enviar(container, '5000000'); // 5.000.000 > saldo 1.000.000

    await waitFor(() => expect(accountServiceMock.deposit).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('dw-error')).not.toBeInTheDocument(); // nodo 5 inalcanzable
    expect(accountServiceMock.deposit).toHaveBeenCalledWith('acc-1', 5_000_000, '');
  });

  // ── Camino 3: 1 → 2 → 4 → 6 → 7 → 8 → 10 → 12 → 13 → Fin ──────────────────
  it('FE-DE-C3  · el servicio rechaza con message → se muestra en el banner y en un toast de error', async () => {
    accountServiceMock.deposit.mockRejectedValue({ message: 'La cuenta no está activa' });
    const { container, onClose, onSuccess } = abrirModal();

    enviar(container, '150000', 'Ahorro mensual');

    expect(await screen.findByTestId('dw-error')).toHaveTextContent('La cuenta no está activa');
    expect(toast.error).toHaveBeenCalledWith('No pudimos completar la operacion', 'La cuenta no está activa');
    expect(toast.success).not.toHaveBeenCalled(); // nodo 11 no recorrido
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(campoMonto().value).toBe('150000'); // el formulario conserva lo escrito
    expect(botonAbonar()).toBeEnabled(); // nodo 13: finally apagó la carga
    expect(botonAbonar()).toHaveTextContent('Abonar Saldo');
  });

  it('FE-DE-C3b · el servicio rechaza sin message (no es un objeto) → texto de respaldo', async () => {
    accountServiceMock.deposit.mockRejectedValue('fallo de red');
    const { container } = abrirModal();

    enviar(container, '150000');

    expect(await screen.findByTestId('dw-error')).toHaveTextContent(MSG_RESPALDO);
    expect(toast.error).toHaveBeenCalledWith('No pudimos completar la operacion', MSG_RESPALDO);
  });

  // ── Camino 4: 1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → Fin ──────────────────
  it('FE-DE-C4  · depósito correcto: carga activa mientras espera, toast de éxito, campos limpios, onSuccess y onClose', async () => {
    let resolver!: (c: Account) => void;
    accountServiceMock.deposit.mockReturnValue(new Promise<Account>((r) => (resolver = r)));
    const { container, onClose, onSuccess } = abrirModal();

    enviar(container, '150000', 'Ahorro mensual');

    // Nodo 6: mientras el servicio responde, el botón queda bloqueado y rotulado.
    await waitFor(() => expect(botonAbonar()).toBeDisabled());
    expect(botonAbonar()).toHaveTextContent('Procesando...');
    expect(accountServiceMock.deposit).toHaveBeenCalledWith('acc-1', 150_000, 'Ahorro mensual'); // nodo 8

    resolver({ ...CUENTA, balance: 1_150_000 });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith('Deposito realizado', 'Cuenta ****1234 actualizada correctamente.');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(campoMonto().value).toBe('');
    expect(campoDescripcion().value).toBe('');
    expect(screen.queryByTestId('dw-error')).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled(); // nodo 12 no recorrido
    expect(botonAbonar()).toBeEnabled(); // nodo 13
    expect(botonAbonar()).toHaveTextContent('Abonar Saldo');
  });

  it('FE-DE-C4b · camino 4 con la descripción vacía: se envía una cadena vacía (no undefined)', async () => {
    accountServiceMock.deposit.mockResolvedValue({ ...CUENTA, balance: 1_050_000 });
    const { container, onClose } = abrirModal();

    enviar(container, '50000');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(accountServiceMock.deposit).toHaveBeenCalledWith('acc-1', 50_000, '');
  });

  // ── Camino 5 (no ejecutable en depósito): ... → 7 → 9 → ... ────────────────
  it('FE-DE-C5  · NO EJECUTABLE en modo depósito: el servicio de retiro nunca se invoca', async () => {
    accountServiceMock.deposit.mockResolvedValue({ ...CUENTA, balance: 1_100_000 });
    const { container, onClose } = abrirModal();

    enviar(container, '100000');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(accountServiceMock.withdraw).not.toHaveBeenCalled(); // nodo 9 inalcanzable
  });
});
