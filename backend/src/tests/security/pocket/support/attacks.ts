/**
 * ============================================================================
 *  Soporte de las pruebas de seguridad — Bolsillos + Depósito
 * ----------------------------------------------------------------------------
 *  - OPERATIONS: las 6 funcionalidades como tabla, para aplicar cada regla de
 *    seguridad a todas por igual (mismo estilo que los `parametrize` del
 *    ejemplo `security-testing` del curso).
 *  - forged: credenciales falsificadas o inválidas fabricadas a mano.
 *  - twoFactorTemporaryToken / passwordResetToken: tokens emitidos por el
 *    CÓDIGO REAL de autenticación (GenerateTwoFactorCode y
 *    RequestPasswordReset), no fabricados: así la prueba demuestra lo que un
 *    atacante obtendría del sistema.
 * ============================================================================
 */

import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Application } from 'express';
import { GenerateTwoFactorCode } from '../../../../application/use-cases/auth/GenerateTwoFactorCode';
import { RequestPasswordReset } from '../../../../application/use-cases/auth/RequestPasswordReset';
import { JwtTokenService } from '../../../../infrastructure/services/JwtTokenService';
import { User } from '../../../../domain/entities/User';
import { Email } from '../../../../domain/value-objects/Email';
import { Document } from '../../../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../../../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../../../fakes/InMemoryVerificationCodeRepository';
import { InMemoryResetTokenRepository } from '../../../fakes/InMemoryResetTokenRepository';
import { FakeEmailService } from '../../../fakes/FakeEmailService';
import { FakePasswordService } from '../../../fakes/FakePasswordService';
import {
  ACCOUNTS, BASE, CUENTA, EMERGENCIAS, INTRUSO, TITULAR, VIAJE,
} from '../../../regression/pocket/support/scenario';

export const TITULAR_EMAIL = 'titular@fubank.test';

// ── Las 6 funcionalidades como tabla ──────────────────────────────────────────

export interface Operation {
  name: string;
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  body?: object;
  /** Código de éxito cuando la petición es legítima. */
  okStatus: number;
}

export const OPERATIONS: Operation[] = [
  { name: 'Crear bolsillo', method: 'post', path: BASE, body: { accountId: CUENTA, name: 'Ataque', amount: 1_000 }, okStatus: 201 },
  { name: 'Consultar bolsillos', method: 'get', path: `${BASE}/account/${CUENTA}`, okStatus: 200 },
  { name: 'Actualizar bolsillo', method: 'patch', path: `${BASE}/${VIAJE}`, body: { amount: 1 }, okStatus: 200 },
  { name: 'Eliminar bolsillo', method: 'delete', path: `${BASE}/${VIAJE}`, okStatus: 200 },
  { name: 'Transferir entre bolsillos', method: 'post', path: `${BASE}/transfer`, body: { fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1_000 }, okStatus: 200 },
  { name: 'Depositar dinero', method: 'post', path: `${ACCOUNTS}/${CUENTA}/deposit`, body: { amount: 1_000 }, okStatus: 200 },
];

/** Ejecuta una operación con la cabecera Authorization dada (o sin ella). */
export function send(app: Application, op: Operation, authorization?: string) {
  let req = request(app)[op.method](op.path);
  if (authorization !== undefined) req = req.set('Authorization', authorization);
  return op.body ? req.send(op.body) : req;
}

// ── Credenciales falsificadas ─────────────────────────────────────────────────

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const nowSeconds = () => Math.floor(Date.now() / 1000);

export const forged = {
  /** Firmado con un secreto que no es el del servidor. */
  wrongSecret: () => jwt.sign({ userId: TITULAR, email: TITULAR_EMAIL }, 'secreto-de-un-atacante-con-16+'),
  /** Firmado con el secreto correcto pero ya vencido. */
  expired: () => new JwtTokenService().generate({ userId: TITULAR, email: TITULAR_EMAIL }, { expiresIn: '-1s' } as never),
  /** Algoritmo "none": sin firma (ataque clásico contra JWT). */
  algNone: () => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ userId: TITULAR, email: TITULAR_EMAIL, iat: nowSeconds() })}.`,
  /** Token legítimo del intruso con el userId cambiado al del titular. */
  tampered: () => {
    const [header, , signature] = new JwtTokenService()
      .generate({ userId: INTRUSO, email: 'intruso@fubank.test' })
      .split('.');
    return `${header}.${b64url({ userId: TITULAR, email: TITULAR_EMAIL, iat: nowSeconds() })}.${signature}`;
  },
};

// ── Tokens temporales emitidos por el código real ────────────────────────────

/**
 * Token temporal del primer paso del login con 2FA: se entrega tras validar la
 * contraseña y ANTES de validar el código OTP. Solo debe servir para
 * /auth/2fa/verify y /auth/2fa/resend.
 */
export async function twoFactorTemporaryToken(userId: string = TITULAR): Promise<string> {
  const useCase = new GenerateTwoFactorCode(
    new InMemoryVerificationCodeRepository(),
    new FakeEmailService(),
    new JwtTokenService(),
    new FakePasswordService(),
  );
  const { temporaryToken } = await useCase.execute(userId, TITULAR_EMAIL, false);
  return temporaryToken;
}

export function buildUser(role: 'user' | 'admin' = 'user', id: string = TITULAR): User {
  const now = new Date('2025-01-01T00:00:00Z');
  return new User({
    id,
    email: new Email(TITULAR_EMAIL),
    document: new Document('1234567890'),
    firstName: 'Titular',
    middleName: null,
    lastName: 'Prueba',
    secondLastName: null,
    birthDate: new Date('1995-01-01'),
    phone: null,
    avatarUrl: null,
    monthlyIncome: null,
    documentVerified: false,
    documentVerifiedAt: null,
    passwordHash: 'hashed_Segura123!',
    isActive: true,
    twoFactorEnabled: true,
    role,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Token de recuperación de contraseña: viaja en el enlace del correo y solo
 * debe servir para /auth/reset-password y /auth/verify-reset-token.
 */
export async function passwordResetToken(): Promise<string> {
  const users = new InMemoryUserRepository();
  users.seed(buildUser());
  const email = new FakeEmailService();
  await new RequestPasswordReset(users, new JwtTokenService(), email, new InMemoryResetTokenRepository())
    .execute({ email: TITULAR_EMAIL });
  return email.sentResetEmails[0]!.resetLink.split('token=')[1]!;
}
