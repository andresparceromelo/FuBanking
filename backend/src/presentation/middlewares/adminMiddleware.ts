import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { sendError } from '../../shared/utils/response';
import { isAccessToken } from './accessToken';

const tokenService = new JwtTokenService();
const defaultUserRepository = new SupabaseUserRepository(supabaseClient);

/**
 * Middleware de autorización admin.
 *
 * Primero verifica el JWT (como authMiddleware),
 * luego busca el usuario en la BD y verifica que sea admin.
 * Si no es admin, retorna 403.
 */
/**
 * Fábrica del middleware de autorización admin.
 *
 * El repositorio es inyectable para permitir tests HTTP con fakes
 * en memoria; en producción se usa el valor por defecto (Supabase).
 */
export function createAdminMiddleware(
  userRepository: IUserRepository = defaultUserRepository,
) {
  return async function adminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
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
    if (!isAccessToken(payload)) {
      sendError(res, 'Token inválido', 'TOKEN_INVALID', 401);
      return;
    }
    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    const user = await userRepository.findById(payload.userId);

    if (!user) {
      sendError(res, 'Usuario no encontrado', 'USER_NOT_FOUND', 404);
      return;
    }

    if (!user.isAdmin()) {
      sendError(res, 'No tienes permisos de administrador', 'FORBIDDEN', 403);
      return;
    }

    next();
  } catch {
    sendError(res, 'Error de autenticación', 'UNAUTHORIZED', 401);
  }
  };
}

/**
 * Instancia por defecto (producción, Supabase).
 * Uso: router.get('/admin', authMiddleware, adminMiddleware, ...).
 */
export const adminMiddleware = createAdminMiddleware();
