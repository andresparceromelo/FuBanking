import { VerificationCode } from '../entities/VerificationCode';

/**
 * Interfaz del repositorio de códigos de verificación — capa de Dominio.
 *
 * Define el contrato que cualquier implementación de persistencia debe cumplir.
 * El dominio y la aplicación dependen ÚNICAMENTE de esta interfaz (Principio D de SOLID).
 */
export interface IVerificationCodeRepository {
  /**
   * Persiste un nuevo código de verificación en la base de datos.
   */
  save(code: VerificationCode): Promise<VerificationCode>;

  /**
   * Busca el código de verificación más reciente (no usado) para un usuario.
   * Retorna null si no existe ninguno activo.
   */
  findLatestByUserId(userId: string): Promise<VerificationCode | null>;

  /**
   * Persiste el estado actualizado del código (intentos, used).
   */
  update(code: VerificationCode): Promise<void>;

  /**
   * Invalida todos los códigos anteriores de un usuario
   * (útil al generar uno nuevo para que el anterior quede inútil).
   */
  invalidateAllByUserId(userId: string): Promise<void>;
}
