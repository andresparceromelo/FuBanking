/**
 * ============================================================================
 *  Escenario base de la regresión de Bolsillos (nivel API)
 * ----------------------------------------------------------------------------
 *  TITULAR ── CUENTA (saldo disponible 1.000.000, ACTIVA)
 *          │    ├── VIAJE        200.000
 *          │    └── EMERGENCIAS   50.000
 *          └── CUENTA_SIN_BOLSILLOS (saldo 300.000)
 *  INTRUSO ── CUENTA_AJENA (saldo 500.000)
 *               └── AJENO         30.000
 *
 *  Regla de dinero del módulo: `balance` es el saldo DISPONIBLE (ya excluye
 *  lo apartado), así que balance + Σ bolsillos es el total de la cuenta y
 *  ninguna operación sobre bolsillos lo debe alterar.
 * ============================================================================
 */

import { Account, AccountStatus, AccountType } from '../../../../domain/entities/Account';
import { Pocket } from '../../../../domain/entities/Pocket';
import { createPocketTestApp, PocketTestApp } from '../../../helpers/createPocketTestApp';

export const TITULAR = 'user-titular';
export const INTRUSO = 'user-intruso';

export const CUENTA = '11111111-1111-4111-8111-111111111111';
export const CUENTA_SIN_BOLSILLOS = '22222222-2222-4222-8222-222222222222';
export const CUENTA_AJENA = '33333333-3333-4333-8333-333333333333';
export const INEXISTENTE = '99999999-9999-4999-8999-999999999999';

export const VIAJE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const EMERGENCIAS = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const AJENO = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

export const SALDO_INICIAL = 1_000_000;
export const TOTAL_CUENTA = SALDO_INICIAL + 200_000 + 50_000;

export const BASE = '/api/v1/pockets';
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const PUBLIC_POCKET_KEYS = ['id', 'accountId', 'name', 'amount', 'createdAt', 'updatedAt'];
export const PUBLIC_ACCOUNT_KEYS = ['id', 'userId', 'accountNumber', 'accountType', 'balance', 'status', 'details', 'createdAt'];
export const ACCOUNTS = '/api/v1/accounts';

function account(id: string, userId: string, balance: number): Account {
  return new Account({
    id,
    userId,
    accountNumber: `BA${id.slice(0, 8)}01`,
    accountType: AccountType.AHORROS,
    balance,
    status: AccountStatus.ACTIVA,
    details: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  });
}

function pocket(id: string, accountId: string, name: string, amount: number, day: string): Pocket {
  const date = new Date(`2025-01-${day}T00:00:00Z`);
  return new Pocket({ id, accountId, name, amount, createdAt: date, updatedAt: date });
}

export interface Scenario extends PocketTestApp {
  asTitular: string;
  asIntruso: string;
}

export function setupScenario(): Scenario {
  const ctx = createPocketTestApp();
  ctx.deps.accountRepository.seed(
    account(CUENTA, TITULAR, SALDO_INICIAL),
    account(CUENTA_SIN_BOLSILLOS, TITULAR, 300_000),
    account(CUENTA_AJENA, INTRUSO, 500_000),
  );
  ctx.deps.pocketRepository.seed(
    pocket(VIAJE, CUENTA, 'Viaje', 200_000, '01'),
    pocket(EMERGENCIAS, CUENTA, 'Emergencias', 50_000, '02'),
    pocket(AJENO, CUENTA_AJENA, 'Ajeno', 30_000, '03'),
  );
  return { ...ctx, asTitular: ctx.bearerFor(TITULAR), asIntruso: ctx.bearerFor(INTRUSO) };
}

export async function blockAccount(ctx: Scenario, accountId: string): Promise<void> {
  await ctx.deps.accountRepository.updateStatus(accountId, AccountStatus.BLOQUEADA);
}

/** Foto del estado persistido de una cuenta: saldo y bolsillos (id, nombre, monto). */
export async function snapshot(ctx: Scenario, accountId: string) {
  const acc = await ctx.deps.accountRepository.findById(accountId);
  const pockets = await ctx.deps.pocketRepository.findByAccountId(accountId);
  return {
    balance: acc?.balance,
    pockets: pockets
      .map((p) => ({ id: p.id, name: p.name, amount: p.amount }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/** Saldo disponible + total apartado en bolsillos. */
export async function totalFunds(ctx: Scenario, accountId: string): Promise<number> {
  const acc = await ctx.deps.accountRepository.findById(accountId);
  const reserved = await ctx.deps.pocketRepository.getTotalAmountByAccountId(accountId);
  return (acc?.balance ?? Number.NaN) + reserved;
}

// ── Contrato de errores que consume el frontend (código + mensaje exactos) ──

function errorBody(code: string, message: string) {
  return { success: false, error: { code, message } };
}

export function validationError(fields: Record<string, string[]>) {
  return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', fields } };
}

export const ERR = {
  UNAUTHORIZED: errorBody('UNAUTHORIZED', 'Se requiere autenticación'),
  TOKEN_INVALID: errorBody('TOKEN_INVALID', 'Token inválido'),
  FORBIDDEN: errorBody('FORBIDDEN', 'No tienes permiso para acceder a esta cuenta'),
  ACCOUNT_NOT_FOUND: errorBody('ACCOUNT_NOT_FOUND', 'Cuenta no encontrada'),
  POCKET_NOT_FOUND: errorBody('POCKET_NOT_FOUND', 'Bolsillo no encontrado'),
  NOT_OPERATIONAL_CREATE: errorBody('ACCOUNT_NOT_OPERATIONAL', 'La cuenta no está disponible para generar bolsillos'),
  NOT_OPERATIONAL_UPDATE: errorBody('ACCOUNT_NOT_OPERATIONAL', 'La cuenta no está disponible para modificar bolsillos'),
  NOT_OPERATIONAL_DELETE: errorBody('ACCOUNT_NOT_OPERATIONAL', 'La cuenta no está disponible para eliminar bolsillos'),
  NOT_OPERATIONAL_TRANSFER: errorBody('ACCOUNT_NOT_OPERATIONAL', 'La cuenta no está disponible para transferir entre bolsillos'),
  INSUFFICIENT_CREATE: errorBody('INSUFFICIENT_AVAILABLE_BALANCE', 'No tienes saldo disponible suficiente para crear este bolsillo'),
  INSUFFICIENT_UPDATE: errorBody('INSUFFICIENT_AVAILABLE_BALANCE', 'No tienes saldo disponible suficiente para ajustar este bolsillo'),
  INVALID_POCKET_NAME: errorBody('INVALID_POCKET_NAME', 'El nombre del bolsillo no puede estar vacío'),
  INVALID_TRANSFER_TARGET: errorBody('INVALID_TRANSFER_TARGET', 'Los bolsillos de origen y destino deben ser diferentes'),
  SOURCE_POCKET_NOT_FOUND: errorBody('SOURCE_POCKET_NOT_FOUND', 'Bolsillo de origen no encontrado'),
  TARGET_POCKET_NOT_FOUND: errorBody('TARGET_POCKET_NOT_FOUND', 'Bolsillo de destino no encontrado'),
  POCKETS_DIFFERENT_ACCOUNT: errorBody('POCKETS_DIFFERENT_ACCOUNT', 'Los bolsillos deben pertenecer a la misma cuenta'),
  INSUFFICIENT_POCKET_BALANCE: errorBody('INSUFFICIENT_POCKET_BALANCE', 'Saldo insuficiente en el bolsillo de origen'),
  // Funcionalidad 6 — depósito (módulo Cuentas usa códigos y mensajes propios)
  DEPOSIT_INVALID_AMOUNT: errorBody('INVALID_AMOUNT', 'El monto a depositar debe ser mayor a cero'),
  DEPOSIT_ACCOUNT_NOT_FOUND: errorBody('ACCOUNT_NOT_FOUND', 'La cuenta no existe'),
  DEPOSIT_ACCOUNT_INACTIVE: errorBody('ACCOUNT_INACTIVE', 'La cuenta no está activa'),
};
