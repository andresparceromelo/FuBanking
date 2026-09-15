/**
 * Payload contenido en el JWT.
 */
export interface TokenPayload {
  userId: string;
  email: string;
  type?: 'reset' | 'auth' | '2fa';
  /** Indica si el usuario eligió "Recuérdame" en el login. Se propaga a través del temporaryToken 2FA. */
  rememberMe?: boolean;
}

/**
 * Opciones de generación del token.
 */
export interface TokenOptions {
  expiresIn?: string;
}

/**
 * Interfaz del servicio de tokens — capa de Aplicación.
 *
 * Los casos de uso usan esta interfaz para emitir y verificar JWTs
 * sin acoplarse directamente a jsonwebtoken.
 */
export interface ITokenService {
  /**
   * Genera un JWT con el payload dado.
   */
  generate(payload: TokenPayload, options?: TokenOptions): string;

  /**
   * Verifica y decodifica un JWT.
   * Lanza un error si el token es inválido o ha expirado.
   */
  verify(token: string): TokenPayload;
}
