import { AppError } from './AppError';

/**
 * Error de límite de tasa excedido (HTTP 429 Too Many Requests).
 *
 * Se lanza cuando un cliente supera el número máximo de solicitudes
 * permitidas en una ventana de tiempo determinada.
 */
export class RateLimitError extends AppError {
  /** Segundos hasta que el cliente puede reintentar. */
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message?: string) {
    super(
      message ??
        `Demasiadas solicitudes. Por favor espera ${retryAfterSeconds} segundo${retryAfterSeconds === 1 ? '' : 's'} antes de reintentar.`,
      429,
      'RATE_LIMIT_EXCEEDED',
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
