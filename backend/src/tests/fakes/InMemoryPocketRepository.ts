import { IPocketRepository } from '../../domain/repositories/IPocketRepository';
import { Pocket, PocketProps } from '../../domain/entities/Pocket';

/**
 * Repositorio de bolsillos en memoria con semántica de COPIA, como una BD:
 * guarda filas planas y reconstruye la entidad en cada lectura. Así, un cambio
 * hecho sobre una entidad que nunca se persiste con update() NO queda
 * guardado, y la regresión lo detecta.
 */
function toRow(pocket: Pocket): PocketProps {
  return {
    id: pocket.id,
    accountId: pocket.accountId,
    name: pocket.name,
    amount: pocket.amount,
    createdAt: new Date(pocket.createdAt),
    updatedAt: new Date(pocket.updatedAt),
  };
}

function toEntity(row: PocketProps): Pocket {
  return new Pocket({ ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) });
}

export class InMemoryPocketRepository implements IPocketRepository {
  private readonly rows = new Map<string, PocketProps>();

  seed(...pockets: Pocket[]): void {
    pockets.forEach((p) => this.rows.set(p.id, toRow(p)));
  }

  all(): Pocket[] {
    return Array.from(this.rows.values()).map(toEntity);
  }

  async findById(id: string): Promise<Pocket | null> {
    const row = this.rows.get(id);
    return row ? toEntity(row) : null;
  }

  /** Igual que Supabase: ordenados por fecha de creación descendente. */
  async findByAccountId(accountId: string): Promise<Pocket[]> {
    return Array.from(this.rows.values())
      .filter((row) => row.accountId === accountId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toEntity);
  }

  async save(pocket: Pocket): Promise<Pocket> {
    this.rows.set(pocket.id, toRow(pocket));
    return toEntity(toRow(pocket));
  }

  async update(pocket: Pocket): Promise<Pocket> {
    if (!this.rows.has(pocket.id)) {
      throw new Error(`InMemoryPocketRepository: bolsillo ${pocket.id} no encontrado`);
    }
    this.rows.set(pocket.id, toRow(pocket));
    return toEntity(toRow(pocket));
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }

  async getTotalAmountByAccountId(accountId: string): Promise<number> {
    return Array.from(this.rows.values())
      .filter((row) => row.accountId === accountId)
      .reduce((total, row) => total + row.amount, 0);
  }
}
