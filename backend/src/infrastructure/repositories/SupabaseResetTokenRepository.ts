import { createHash } from 'node:crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { IResetTokenRepository, ResetTokenRecord } from '../../domain/repositories/IResetTokenRepository';
import { AppError } from '../../shared/errors/AppError';

/**
 * Tipo que representa una fila de la tabla `reset_tokens` en Supabase.
 */
interface ResetTokenRow {
  id: string;
  token_hash: string;
  user_id: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

/**
 * Calcula el hash SHA-256 de un token JWT.
 * Nunca se almacena el token plano — solo su huella digital.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Implementación del repositorio de tokens de reset usando Supabase.
 *
 * Implementa IResetTokenRepository de la capa de dominio.
 * Almacena hashes SHA-256 en lugar de los tokens planos (Security Hotspot resuelto).
 */
const inMemoryResetTokens = new Map<string, ResetTokenRecord>();

export class SupabaseResetTokenRepository implements IResetTokenRepository {
  private readonly TABLE = 'reset_tokens';

  constructor(private readonly client: SupabaseClient) {}

  private mapRow(row: ResetTokenRow): ResetTokenRecord {
    return {
      id: row.id,
      tokenHash: row.token_hash,
      userId: row.user_id,
      used: row.used,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };
  }

  async save(record: Omit<ResetTokenRecord, 'id' | 'createdAt'>): Promise<ResetTokenRecord> {
    const memoryRecord: ResetTokenRecord = {
      id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tokenHash: record.tokenHash,
      userId: record.userId,
      used: record.used,
      expiresAt: record.expiresAt,
      createdAt: new Date(),
    };

    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .insert({
          token_hash: record.tokenHash,
          user_id: record.userId,
          used: record.used,
          expires_at: record.expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new AppError(
          `Error al guardar token de reseteo: ${error?.message ?? 'Desconocido'}`,
          500,
          'DB_ERROR',
        );
      }

      const saved = this.mapRow(data as ResetTokenRow);
      inMemoryResetTokens.set(saved.tokenHash, saved);
      return saved;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Supabase offline, fallback a memoria
    }

    inMemoryResetTokens.set(record.tokenHash, memoryRecord);
    return memoryRecord;
  }

  async invalidateAllByUserId(userId: string): Promise<void> {
    for (const record of inMemoryResetTokens.values()) {
      if (record.userId === userId && !record.used) {
        record.used = true;
      }
    }

    try {
      await this.client
        .from(this.TABLE)
        .update({ used: true })
        .eq('user_id', userId)
        .eq('used', false);
    } catch {
      // Supabase offline
    }
  }

  async findByTokenHash(tokenHash: string): Promise<ResetTokenRecord | null> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*')
        .eq('token_hash', tokenHash)
        .single();

      if (!error && data) {
        const rowRecord = this.mapRow(data as ResetTokenRow);
        inMemoryResetTokens.set(rowRecord.tokenHash, rowRecord);
        return rowRecord;
      }
    } catch {
      // Supabase offline
    }

    const memRecord = inMemoryResetTokens.get(tokenHash);
    if (memRecord) {
      return memRecord;
    }

    return null;
  }

  async markAsUsed(tokenHash: string): Promise<void> {
    const memRecord = inMemoryResetTokens.get(tokenHash);
    if (memRecord) {
      memRecord.used = true;
    }

    try {
      await this.client
        .from(this.TABLE)
        .update({ used: true })
        .eq('token_hash', tokenHash);
    } catch {
      // Supabase offline
    }
  }
}
