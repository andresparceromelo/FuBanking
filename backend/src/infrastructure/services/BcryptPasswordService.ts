import bcrypt from 'bcrypt';
import { IPasswordService } from '../../application/interfaces/IPasswordService';

/**
 * Implementación del servicio de contraseñas usando bcrypt.
 *
 * Implementa IPasswordService de la capa de aplicación.
 * El salt rounds de 12 es el estándar actual de la industria:
 * - 10: mínimo aceptable para producción
 * - 12: buen balance seguridad/rendimiento
 * - 14+: para datos muy sensibles (más lento)
 */
export class BcryptPasswordService implements IPasswordService {
  private readonly SALT_ROUNDS = 12;

  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
