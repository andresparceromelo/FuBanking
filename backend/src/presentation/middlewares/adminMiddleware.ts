import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { sendError } from '../../shared/utils/response';

const tokenService = new JwtTokenService();
const userRepository = new SupabaseUserRepository(supabaseClient);

/**
 * Middleware de autorización admin.
 *
 * Primero verifica el JWT (como authMiddleware),
 * luego busca el usuario en la BD y verifica que sea admin.
 * Si no es admin, retorna 403.
 */
export async function adminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}
