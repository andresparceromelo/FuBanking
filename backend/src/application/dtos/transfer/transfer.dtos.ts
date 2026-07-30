import { TransactionType, TransactionStatus } from '../../../domain/entities/Transaction';

/**
 * DTOs del módulo de Transferencias.
 *
 * El frontend SOLO envía: receiverAccountNumber, amount, description.
 * El backend determina el resto (senderAccount, referenceNumber, status).
 */

// -- Crear Transferencia --

export interface CreateTransferDto {
  /** ID del usuario autenticado */
  userId: string;
  /** ID de la cuenta de origen */
  senderAccountId: string;
  /** Numero de cuenta destino */
  receiverAccountNumber: string;
  /** Monto a transferir (debe ser > 0) */
  amount: number;
  /** Descripcion opcional */
  description?: string | null;
}

export interface TransferReceiptDto {
  id: string;
  referenceNumber: string;
  senderAccount: string;       // Número enmascarado ****XXXX
  receiverAccount: string;     // Número enmascarado ****XXXX
  receiverName: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: string;
}

// -- Obtener Comprobante --

export interface GetTransferDto {
  transactionId: string;
  userId: string;
}

// -- Buscar Destinatario --

export interface SearchRecipientResponseDto {
  name: string;
  accountNumber: string;       // Número enmascarado ****XXXX
  accountNumberFull: string;   // Número completo (solo para uso interno del flujo)
}

// -- Historial de Transacciones --

export interface GetTransferHistoryDto {
  accountId: string;
  userId: string;
}

export interface TransferHistoryItemDto {
  id: string;
  referenceNumber: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: string;
  direction: 'INCOMING' | 'OUTGOING'; // Si recibió o envió el dinero
  relatedAccount: string;             // La cuenta contraparte (enmascarada)
  relatedName: string;                // El nombre de la contraparte
  resultingBalance?: number;
}
