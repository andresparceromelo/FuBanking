import { createHash } from 'crypto';
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
        `Error al guardar token de reset: ${error?.message ?? 'Desconocido'}`,
        500,
        'DB_ERROR',
      );
    }

    return this.mapRow(data as ResetTokenRow);
  }

  async invalidateAllByUserId(userId: string): Promise<void> {
    const { error } = await this.client
      .from(this.TABLE)
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false);

    if (error) {
      throw new AppError(
        `Error al invalidar tokens previos: ${error.message}`,
        500,
        'DB_ERROR',
      );
    }
  }

  async findByTokenHash(tokenHash: string): Promise<ResetTokenRecord | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !data) return null;
    return this.mapRow(data as ResetTokenRow);
  }

  async markAsUsed(tokenHash: string): Promise<void> {
    const { error } = await this.client
      .from(this.TABLE)
      .update({ used: true })
      .eq('token_hash', tokenHash);

    if (error) {
      throw new AppError(
        `Error al marcar token como usado: ${error.message}`,
        500,
        'DB_ERROR',
      );
    }
  }
}
