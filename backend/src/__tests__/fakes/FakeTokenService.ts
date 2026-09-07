import { ITokenService, TokenPayload, TokenOptions } from '../../application/interfaces/ITokenService';
import { AuthError } from '../../shared/errors/AuthError';
export class FakeTokenService implements ITokenService {
  private static readonly PREFIX = 'fake.';
  generate(payload: TokenPayload, _options?: TokenOptions): string {
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
