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

  async findLatestByUserId(userId: string): Promise<VerificationCode | null> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return this.mapRowToEntity(data as VerificationCodeRow);
      }
    } catch {
      // Fallback below
    }

    const list = fallbackCodes.get(userId) || [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].used) return list[i];
    }
    return null;
  }

  async save(code: VerificationCode): Promise<VerificationCode> {
    const row = {
      id: code.id,
      user_id: code.userId,
      code_hash: code.codeHash,
      expires_at: code.expiresAt.toISOString(),
      attempts: code.attempts,
      used: code.used,
    };

    try {
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
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const list = fallbackCodes.get(code.userId) || [];
    list.push(code);
    fallbackCodes.set(code.userId, list);
    return code;
  }

  async update(code: VerificationCode): Promise<void> {
    try {
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
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const list = fallbackCodes.get(code.userId) || [];
    const idx = list.findIndex(c => c.id === code.id);
    if (idx !== -1) {
      list[idx] = code;
    }
  }

  async invalidateAllByUserId(userId: string): Promise<void> {
    try {
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
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const list = fallbackCodes.get(userId) || [];
    list.forEach(c => {
      (c as any)._used = true;
    });
  }
}

const fallbackCodes = new Map<string, VerificationCode[]>();
