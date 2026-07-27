import { Transaction } from '../entities/Transaction';

/**
 * Interfaz del repositorio de transacciones — capa de Dominio.
 *
 * Define el contrato que cualquier implementación de persistencia debe cumplir.
 * El dominio y la capa de aplicación dependen ÚNICAMENTE de esta interfaz.
 *
 * Principio de Inversión de Dependencias (SOLID - D).
 */
export interface ITransactionRepository {
  /**
   * Ejecuta la transferencia de forma atómica mediante RPC.
   * Devuelve la transacción creada con el comprobante.
   */
  executeTransfer(
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    description: string | null,
    referenceNumber: string,
  ): Promise<Transaction>;

  /**
   * Busca una transacción por su ID.
   * Retorna null si no existe.
   */
  findById(id: string): Promise<Transaction | null>;

  /**
   * Obtiene el historial de transacciones de una cuenta (origen o destino).
   */
  findByAccountId(accountId: string): Promise<Transaction[]>;
}
