/**
 * Registro de un token de restablecimiento de contraseña.
 *
 * Se almacena el hash SHA-256 del token JWT, nunca el token plano.
 * Esto elimina el riesgo de exposición del token si la BD es comprometida.
 */
export interface ResetTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Interfaz del repositorio de tokens de restablecimiento — capa de Dominio.
 *
 * Permite:
 *  - Guardar un nuevo token de reset.
 *  - Invalidar todos los tokens previos de un usuario.
 *  - Buscar un token por su hash (para verificar estado).
 *  - Marcar un token como usado.
 */
export interface IResetTokenRepository {
  /**
   * Persiste un nuevo token de reset.
   */
  save(record: Omit<ResetTokenRecord, 'id' | 'createdAt'>): Promise<ResetTokenRecord>;

  /**
   * Invalida (marca como usados) todos los tokens activos del usuario.
   * Se llama antes de emitir un nuevo token de reset.
   */
  invalidateAllByUserId(userId: string): Promise<void>;

  /**
   * Busca un token por su hash SHA-256.
   * Retorna null si no existe.
   */
  findByTokenHash(tokenHash: string): Promise<ResetTokenRecord | null>;

  /**
   * Marca un token como usado (consumido).
   */
  markAsUsed(tokenHash: string): Promise<void>;
}
