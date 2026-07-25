import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';
import { sendError } from '../../shared/utils/response';

/**
 * Middleware centralizado de manejo de errores.
 *
 * Debe ser el ÚLTIMO middleware registrado en la app de Express.
 * Captura todos los errores lanzados en controllers, use cases y middlewares.
 *
 * Mapea los tipos de error conocidos a respuestas HTTP estructuradas.
 * Errores no operacionales (bugs) se loguean y retornan 500 genérico.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Error de validación de Zod
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const field = issue.path.join('.') || 'general';
      if (!fields[field]) fields[field] = [];
      fields[field].push(issue.message);
    });
    sendError(res, 'Error de validación', 'VALIDATION_ERROR', 400, fields);
    return;
  }

  // Error operacional de la aplicación (AppError y subclases)
  if (error instanceof AppError && error.isOperational) {
    sendError(res, error.message, error.code, error.statusCode);
    return;
  }

  // Error inesperado (bug, error de programación)
  console.error('💥 Unexpected error:', error);
  sendError(res, 'Ha ocurrido un error interno', 'INTERNAL_ERROR', 500);
}
