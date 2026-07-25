/**
 * Interfaz del servicio de contraseñas — capa de Aplicación.
 *
 * Los casos de uso usan esta interfaz para hashear y comparar contraseñas
 * sin acoplarse a bcrypt u otra librería concreta.
 */
export interface IPasswordService {
  /**
   * Genera un hash seguro de la contraseña en texto plano.
   */
  hash(plainPassword: string): Promise<string>;

  /**
   * Compara una contraseña en texto plano con su hash almacenado.
   * Retorna true si coinciden.
   */
  compare(plainPassword: string, hash: string): Promise<boolean>;
}
