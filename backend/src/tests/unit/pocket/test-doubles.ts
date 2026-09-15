/**
 * ============================================================================
 *  LOS 5 TIPOS DE DOBLES DE PRUEBA (Test Doubles) — módulo Bolsillos
 * ----------------------------------------------------------------------------
 *  Clasificación de Gerard Meszaros (xUnit Test Patterns), la que la industria
 *  llama coloquialmente "los 5 tipos de mocks":
 *
 *   1. DUMMY  → objeto que se pasa solo para cumplir la firma; NUNCA se usa.
 *               Aquí lanza si alguien lo invoca, para PROBAR que no se toca.
 *   2. FAKE   → implementación funcional pero simplificada (en memoria).
 *               Se comporta como el repositorio real, sin base de datos.
 *   3. STUB   → devuelve respuestas "enlatadas" fijas, ignora los argumentos.
 *               No tiene lógica ni estado; solo alimenta el camino de prueba.
 *   4. SPY    → como un fake/stub, pero además REGISTRA cómo fue llamado
 *               (cuántas veces, con qué argumentos) para inspeccionarlo luego.
 *   5. MOCK   → objeto pre-programado con EXPECTATIVAS que se verifican
 *               (verificación de comportamiento). Se arma con `vi.fn()` en
 *               cada prueba; ver helper `makeMockAccountRepository` abajo.
 *
 *  Los cuatro primeros son clases reutilizables; el MOCK se construye con
 *  `vi.fn()` dentro de cada test para poder programar y verificar llamadas.
 * ============================================================================
 */

import { vi } from 'vitest';
import {
  Account,
  AccountProps,
  AccountStatus,
  AccountType,
} from '../../../domain/entities/Account';
import { Pocket, PocketProps } from '../../../domain/entities/Pocket';
import { Notification } from '../../../domain/entities/Notification';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../../../domain/repositories/IPocketRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';

// ── Builders de datos de prueba (Object Mother) ─────────────────────────────

/** Construye una cuenta de prueba; por defecto ACTIVA con saldo 1.000.000. */
export function makeAccount(overrides: Partial<AccountProps> = {}): Account {
  return new Account({
    id: overrides.id ?? 'acc-1',
    userId: overrides.userId ?? 'user-1',
    accountNumber: overrides.accountNumber ?? 'BA0000000001',
    accountType: overrides.accountType ?? AccountType.AHORROS,
    balance: overrides.balance ?? 1_000_000,
    status: overrides.status ?? AccountStatus.ACTIVA,
    details: overrides.details ?? null,
    createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00Z'),
  });
}

/** Construye un bolsillo de prueba; por defecto "Ahorros viaje" con 100.000. */
export function makePocket(overrides: Partial<PocketProps> = {}): Pocket {
  return new Pocket({
    id: overrides.id ?? 'pocket-1',
    accountId: overrides.accountId ?? 'acc-1',
    name: overrides.name ?? 'Ahorros viaje',
    amount: overrides.amount ?? 100_000,
    createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01T00:00:00Z'),
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  2. FAKE — implementaciones en memoria, funcionales y simplificadas
// ────────────────────────────────────────────────────────────────────────────

export class FakeAccountRepository implements IAccountRepository {
  private readonly accounts = new Map<string, Account>();

  constructor(seed: Account[] = []) {
    seed.forEach((a) => this.accounts.set(a.id, a));
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) ?? null;
  }

  async findByAccountNumber(number: string): Promise<Account | null> {
    return (
      Array.from(this.accounts.values()).find((a) => a.accountNumber === number) ?? null
    );
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter((a) => a.userId === userId);
  }

  async save(account: Account): Promise<Account> {
    this.accounts.set(account.id, account);
    return account;
  }

  /** Persiste el nuevo saldo reconstruyendo la entidad (Account no tiene setter). */
  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    const current = this.accounts.get(accountId);
    if (!current) throw new Error(`Cuenta ${accountId} no existe en el fake`);
    const updated = new Account({
      id: current.id,
      userId: current.userId,
      accountNumber: current.accountNumber,
      accountType: current.accountType,
      balance: newBalance,
      status: current.status,
      details: current.details,
      createdAt: current.createdAt,
    });
    this.accounts.set(accountId, updated);
    return updated;
  }
}

export class FakePocketRepository implements IPocketRepository {
  private readonly pockets = new Map<string, Pocket>();

  constructor(seed: Pocket[] = []) {
    seed.forEach((p) => this.pockets.set(p.id, p));
  }

  async findById(id: string): Promise<Pocket | null> {
    return this.pockets.get(id) ?? null;
  }

  async findByAccountId(accountId: string): Promise<Pocket[]> {
    return Array.from(this.pockets.values()).filter((p) => p.accountId === accountId);
  }

  async save(pocket: Pocket): Promise<Pocket> {
    this.pockets.set(pocket.id, pocket);
    return pocket;
  }

  async update(pocket: Pocket): Promise<Pocket> {
    this.pockets.set(pocket.id, pocket);
    return pocket;
  }

  async delete(id: string): Promise<void> {
    this.pockets.delete(id);
  }

  async getTotalAmountByAccountId(accountId: string): Promise<number> {
    return Array.from(this.pockets.values())
      .filter((p) => p.accountId === accountId)
      .reduce((total, p) => total + p.amount, 0);
  }
}

export class FakeNotificationRepository implements INotificationRepository {
  private readonly items = new Map<string, Notification>();

  async save(notification: Notification): Promise<Notification> {
    this.items.set(notification.id, notification);
    return notification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.items.values()).filter((n) => n.userId === userId);
  }

  async markAsRead(id: string): Promise<Notification> {
    const n = this.items.get(id);
    if (!n) throw new Error(`Notificación ${id} no existe en el fake`);
    n.markAsRead();
    return n;
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  1. DUMMY — se pasa para llenar el parámetro; si se usa, la prueba FALLA
// ────────────────────────────────────────────────────────────────────────────

export class DummyNotificationRepository implements INotificationRepository {
  async save(): Promise<Notification> {
    throw new Error('DUMMY: save() no debería invocarse en este camino de prueba');
  }
  async findByUserId(): Promise<Notification[]> {
    throw new Error('DUMMY: findByUserId() no debería invocarse');
  }
  async markAsRead(): Promise<Notification> {
    throw new Error('DUMMY: markAsRead() no debería invocarse');
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  3. STUB — respuestas enlatadas fijas; ignora los argumentos, no tiene estado
// ────────────────────────────────────────────────────────────────────────────

export class StubAccountRepository implements IAccountRepository {
  /** @param canned cuenta fija que se devuelve siempre (o null para "no existe"). */
  constructor(private readonly canned: Account | null) {}

  async findById(): Promise<Account | null> {
    return this.canned; // respuesta enlatada, no mira el id
  }
  async findByAccountNumber(): Promise<Account | null> {
    return this.canned;
  }
  async findByUserId(): Promise<Account[]> {
    return this.canned ? [this.canned] : [];
  }
  async save(account: Account): Promise<Account> {
    return account;
  }
  async updateBalance(): Promise<Account> {
    if (!this.canned) throw new Error('STUB sin cuenta enlatada');
    return this.canned; // respuesta enlatada
  }
}

export class StubPocketRepository implements IPocketRepository {
  constructor(
    private readonly cannedList: Pocket[] = [],
    private readonly cannedTotal = 0,
  ) {}

  async findById(): Promise<Pocket | null> {
    return this.cannedList[0] ?? null;
  }
  async findByAccountId(): Promise<Pocket[]> {
    return this.cannedList; // lista enlatada
  }
  async save(pocket: Pocket): Promise<Pocket> {
    return pocket;
  }
  async update(pocket: Pocket): Promise<Pocket> {
    return pocket;
  }
  async delete(): Promise<void> {
    /* no-op */
  }
  async getTotalAmountByAccountId(): Promise<number> {
    return this.cannedTotal; // total enlatado
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  4. SPY — registra las llamadas para inspeccionarlas después
// ────────────────────────────────────────────────────────────────────────────

export class SpyNotificationRepository implements INotificationRepository {
  /** Registro de todo lo que se intentó guardar. */
  public readonly savedNotifications: Notification[] = [];
  public saveCallCount = 0;

  async save(notification: Notification): Promise<Notification> {
    this.saveCallCount += 1;
    this.savedNotifications.push(notification);
    return notification;
  }
  async findByUserId(): Promise<Notification[]> {
    return this.savedNotifications;
  }
  async markAsRead(): Promise<Notification> {
    throw new Error('SPY: markAsRead() no forma parte de este experimento');
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  5. MOCK — objeto con expectativas verificables, armado con vi.fn()
// ────────────────────────────────────────────────────────────────────────────

/**
 * Fabrica un IAccountRepository 100% mockeado con `vi.fn()`.
 * Cada método es una función espía de Vitest que se puede:
 *  - PROGRAMAR:  mock.findById.mockResolvedValue(account)
 *  - VERIFICAR:  expect(mock.updateBalance).toHaveBeenCalledWith(id, saldo)
 */
export function makeMockAccountRepository(): {
  [K in keyof IAccountRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    findById: vi.fn(),
    findByAccountNumber: vi.fn(),
    findByUserId: vi.fn(),
    save: vi.fn(),
    updateBalance: vi.fn(),
  };
}

/** Igual que el anterior, pero para el repositorio de bolsillos. */
export function makeMockPocketRepository(): {
  [K in keyof IPocketRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    findById: vi.fn(),
    findByAccountId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getTotalAmountByAccountId: vi.fn(),
  };
}
