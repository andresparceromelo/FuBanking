import { SupabaseClient } from '@supabase/supabase-js';
import { IVerificationCodeRepository } from '../../domain/repositories/IVerificationCodeRepository';
import { VerificationCode, VerificationCodeProps } from '../../domain/entities/VerificationCode';
import { AppError } from '../../shared/errors/AppError';

/**
 * Tipo que representa una fila de la tabla `verification_codes` en Supabase.
 */
interface VerificationCodeRow {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  used: boolean;
  created_at: string;
}

/**
 * Implementación del repositorio de códigos de verificación usando Supabase.
 *
 * Implementa IVerificationCodeRepository de la capa de dominio.
 * Es la única clase que conoce la estructura de la tabla `verification_codes`.
 */
export class SupabaseVerificationCodeRepository implements IVerificationCodeRepository {
  private readonly TABLE = 'verification_codes';

  constructor(private readonly client: SupabaseClient) {}

  // ── Mapeo BD → Dominio ────────────────────────────────────────────────

  private mapRowToEntity(row: VerificationCodeRow): VerificationCode {
    const props: VerificationCodeProps = {
      id: row.id,
      userId: row.user_id,
      codeHash: row.code_hash,
      expiresAt: new Date(row.expires_at),
      attempts: row.attempts,
      used: row.used,
      createdAt: new Date(row.created_at),
    };
    return new VerificationCode(props);
  }

  // ── Consultas ─────────────────────────────────────────────────────────

  async findLatestByUserId(userId: string): Promise<VerificationCode | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data as VerificationCodeRow);
  }

  // ── Mutaciones ────────────────────────────────────────────────────────

  async save(code: VerificationCode): Promise<VerificationCode> {
    const row = {
      id: code.id,
      user_id: code.userId,
      code_hash: code.codeHash,
      expires_at: code.expiresAt.toISOString(),
      attempts: code.attempts,
      used: code.used,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(
        `Error al guardar el código de verificación: ${error?.message ?? 'Desconocido'}`,
        500,
        'DB_ERROR',
      );
    }

    return this.mapRowToEntity(data as VerificationCodeRow);
  }

  async update(code: VerificationCode): Promise<void> {
    const { error } = await this.client
      .from(this.TABLE)
      .update({
        attempts: code.attempts,
        used: code.used,
      })
      .eq('id', code.id);

    if (error) {
      throw new AppError(
        `Error al actualizar el código de verificación: ${error.message}`,
        500,
        'DB_ERROR',
      );
    }
  }

  async invalidateAllByUserId(userId: string): Promise<void> {
    // Marca todos los códigos no usados del usuario como usados
    const { error } = await this.client
      .from(this.TABLE)
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false);

    if (error) {
      throw new AppError(
        `Error al invalidar códigos anteriores: ${error.message}`,
        500,
        'DB_ERROR',
      );
    }
  }
}
