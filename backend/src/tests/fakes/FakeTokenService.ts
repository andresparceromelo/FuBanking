import { ITokenService, TokenPayload, TokenOptions } from '../../application/interfaces/ITokenService';
import { AuthError } from '../../shared/errors/AuthError';

/**
 * Implementación falsa del servicio de tokens para pruebas.
 *
 * Codifica el payload en base64 (sin firma real) para que los tests
 * puedan inspeccionar su contenido directamente.
 *
 * Expone `lastOptions` para verificar las opciones (expiresIn) usadas
 * en la última llamada a `generate()`, lo que permite testear la lógica
 * de rememberMe end-to-end.
 */
export class FakeTokenService implements ITokenService {
  private static readonly PREFIX = 'fake.';

  /** Opciones usadas en el último generate() — útil para assertions en tests. */
  public lastOptions: TokenOptions | undefined;

  generate(payload: TokenPayload, options?: TokenOptions): string {
    this.lastOptions = options;
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${FakeTokenService.PREFIX}${encoded}`;
  }

  verify(token: string): TokenPayload {
    if (!token.startsWith(FakeTokenService.PREFIX)) {
      throw new AuthError('Token inválido', 'TOKEN_INVALID');
    }
    try {
      const encoded = token.slice(FakeTokenService.PREFIX.length);
      const json = Buffer.from(encoded, 'base64').toString('utf-8');
      return JSON.parse(json) as TokenPayload;
    } catch {
      throw new AuthError('Token inválido', 'TOKEN_INVALID');
    }
  }

  static makeInvalidToken(): string {
    return 'invalid.token.for.testing';
  }
}
