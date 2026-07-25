import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { sendError } from '../../shared/utils/response';
import { AuthError } from '../../shared/errors/AuthError';

const tokenService = new JwtTokenService();

/**
 * Middleware de autenticación JWT.
 *
 * Extrae el token del header Authorization: Bearer <token>,
 * lo verifica y agrega el payload al objeto req.user.
 *
 * Si el token es inválido o falta, retorna 401 inmediatamente.
 * El siguiente handler puede confiar en que req.user siempre está definido.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Se requiere autenticación', 'UNAUTHORIZED', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    sendError(res, 'Token no proporcionado', 'UNAUTHORIZED', 401);
    return;
  }

  try {
    const payload = tokenService.verify(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    sendError(res, 'Error de autenticación', 'UNAUTHORIZED', 401);
  }
}
