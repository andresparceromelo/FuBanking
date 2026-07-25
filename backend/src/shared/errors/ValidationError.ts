import { AppError } from './AppError';

/**
 * Error de validación de datos de entrada (HTTP 400).
 * Se lanza cuando el body de una petición no pasa el schema de Zod.
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}
