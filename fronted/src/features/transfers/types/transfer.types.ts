/**
 * Tipos del modulo de Transferencias — Frontend.
 */

export type TransactionStatus = 'PENDIENTE' | 'COMPLETADA' | 'FALLIDA' | 'CANCELADA';
export type TransactionType   = 'TRANSFERENCIA';

/** Resultado devuelto al buscar un destinatario */
export interface RecipientInfo {
  name: string;
  accountNumber: string;      // Numero enmascarado ****XXXX
  accountNumberFull: string;  // Numero completo para enviar al backend
}

/** Payload que el usuario construye en el formulario */
export interface TransferFormData {
  senderAccountId: string;
  recipient: RecipientInfo;
  amount: number;
  description: string;
}

/** Comprobante devuelto por el backend */
export interface TransferReceipt {
  id: string;
  referenceNumber: string;
  senderAccount: string;
  receiverAccount: string;
  receiverName: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: string;
}

/** Pasos del flujo de transferencia */
export type TransferStep = 'search' | 'form' | 'confirm' | 'receipt';

/** Item del historial de transacciones de una cuenta especifica */
export interface TransferHistoryItem {
  id: string;
  referenceNumber: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: string;
  direction: 'INCOMING' | 'OUTGOING';
  relatedAccount: string;
  relatedName: string;
}
