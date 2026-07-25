import { Account, AccountDetails } from '../entities/Account';

/**
 * Interfaz del repositorio de cuentas — capa de Dominio.
 *
 * Define el contrato que cualquier implementación de persistencia debe cumplir.
 * El dominio y la capa de aplicación dependen ÚNICAMENTE de esta interfaz,
 * nunca de la implementación concreta (Supabase, Postgres directo, mock, etc.).
 *
 * Principio de Inversión de Dependencias (SOLID - D).
 */
export interface IAccountRepository {
  /**
   * Busca una cuenta por su ID único.
   * Incluye los detalles específicos del tipo de cuenta.
   * Retorna null si no existe.
   */
  findById(id: string): Promise<Account | null>;

  /**
   * Busca una cuenta por su número de cuenta.
   * Retorna null si no existe.
   */
  findByAccountNumber(number: string): Promise<Account | null>;

  /**
   * Busca todas las cuentas de un usuario.
   * Incluye los detalles de cada cuenta.
   */
  findByUserId(userId: string): Promise<Account[]>;

  /**
   * Persiste una nueva cuenta en la base de datos.
   * Si se proporcionan details, también los guarda en account_details.
   * Retorna la cuenta creada con todos sus campos.
   */
  save(account: Account, details?: AccountDetails | null): Promise<Account>;
}
