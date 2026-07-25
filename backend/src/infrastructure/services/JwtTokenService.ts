import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload, TokenOptions } from '../../application/interfaces/ITokenService';
import { AuthError } from '../../shared/errors/AuthError';
import { env } from '../../shared/config/env';

/**
 * Implementación del servicio de tokens usando jsonwebtoken.
 *
 * Implementa ITokenService de la capa de aplicación.
 */
export class JwtTokenService implements ITokenService {
  generate(payload: TokenPayload, options?: TokenOptions): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: (options?.expiresIn ?? env.JWT_EXPIRES_IN) as jwt.SignOptions['expiresIn'],
    });
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('El token ha expirado', 'TOKEN_EXPIRED');
      }
      throw new AuthError('Token inválido', 'TOKEN_INVALID');
    }
  }
}
