/**
 * Error base de la aplicación.
 * Todos los errores personalizados heredan de esta clase.
 *
 * El middleware centralizado de errores lo detecta y formatea
 * la respuesta HTTP correctamente.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Errores operacionales son esperados y manejables

    // Necesario para que instanceof funcione correctamente con clases que extienden Error
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
