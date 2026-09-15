import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../../shared/errors/RateLimitError';

/**
 * Entrada del store de rate limiting en memoria.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Opciones de configuración del rate limiter.
 */
export interface RateLimiterOptions {
  /** Número máximo de solicitudes permitidas en la ventana. */
  maxRequests: number;
  /** Duración de la ventana de tiempo en milisegundos. */
  windowMs: number;
  /**
   * Función que extrae la clave de identificación del cliente desde el request.
   * Por defecto usa req.ip.
   */
  keyExtractor?: (req: Request) => string;
}

/**
 * Crea un middleware de rate limiting reutilizable con almacenamiento en memoria.
 *
 * Uso:
 * ```ts
 * const limiter = createRateLimiter({ maxRequests: 3, windowMs: 600_000 });
 * router.post('/endpoint', limiter, controller.handler);
 * ```
 *
 * Características:
 * - Responde con HTTP 429 y código 'RATE_LIMIT_EXCEEDED' al superar el límite.
 * - Incluye el tiempo restante en el error para que el cliente sepa cuándo reintentar.
 * - Limpia entradas vencidas automáticamente para evitar memory leaks.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs, keyExtractor } = options;
  const store = new Map<string, RateLimitEntry>();

  const getKey = (req: Request): string => {
    if (keyExtractor) {
      return keyExtractor(req);
    }
    return req.ip ?? 'unknown';
  };

  const purgeExpired = (): void => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  };

  return function rateLimitMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    purgeExpired();

    const key = getKey(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      // Primera solicitud en la ventana o ventana expirada.
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count < maxRequests) {
      entry.count += 1;
      next();
      return;
    }

    // Límite excedido.
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    next(new RateLimitError(retryAfterSeconds));
  };
}
