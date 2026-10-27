import { TokenPayload } from '../../application/interfaces/ITokenService';

/**
 * Un token de ACCESO es el que se emite al completar el login (sin `type` o
 * con `type: 'auth'`). Los tokens de propósito único —el temporal de 2FA
 * (`'2fa'`) y el de recuperación de contraseña (`'reset'`)— solo valen para su
 * propio flujo y nunca autorizan a operar.
 *
 * Es una lista blanca: cualquier tipo nuevo queda rechazado por defecto.
 */
export function isAccessToken(payload: TokenPayload): boolean {
  return payload.type === undefined || payload.type === 'auth';
}
