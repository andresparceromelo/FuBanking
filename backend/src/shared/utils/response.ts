import { Response } from 'express';

/**
 * Envía una respuesta exitosa estandarizada.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operación exitosa',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Envía una respuesta de error estandarizada.
 */
export function sendError(
  res: Response,
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500,
  fields?: Record<string, string[]>
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(fields && { fields }),
    },
  });
}
