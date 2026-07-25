/**
 * Payload contenido en el JWT.
 */
export interface TokenPayload {
  userId: string;
  email: string;
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
