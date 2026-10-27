/**
 * ============================================================================
 *  Seguridad — Autenticación (Bolsillos + Depósito)
 * ----------------------------------------------------------------------------
 *  Regla SEC-AUTH: solo un token de ACCESO válido permite operar.
 *  Se aplica, como tabla, a las 6 funcionalidades (crear, consultar,
 *  actualizar, eliminar, transferir y depositar).
 *
 *  Amenazas (OWASP API2:2023 Broken Authentication): credenciales ausentes,
 *  malformadas, falsificadas, vencidas o reutilizadas fuera de su propósito.
 *  Cadena real: authMiddleware + JwtTokenService; persistencia en memoria.
 * ============================================================================
 */

import express, { Request, Response } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createAdminMiddleware } from '../../../presentation/middlewares/adminMiddleware';
import { JwtTokenService } from '../../../infrastructure/services/JwtTokenService';
import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { CUENTA, Scenario, setupScenario, snapshot } from '../../regression/pocket/support/scenario';
import {
  OPERATIONS, TITULAR_EMAIL, buildUser, forged, passwordResetToken, send, twoFactorTemporaryToken,
} from './support/attacks';

/** [descripción, cabecera Authorization, código de error esperado] */
const INVALID_CREDENTIALS: Array<[string, () => string | undefined, string]> = [
  ['sin cabecera Authorization', () => undefined, 'UNAUTHORIZED'],
  ['esquema Basic en vez de Bearer', () => 'Basic dGl0dWxhcjpjbGF2ZQ==', 'UNAUTHORIZED'],
  ['Bearer sin token', () => 'Bearer ', 'UNAUTHORIZED'],
  ['token malformado', () => 'Bearer no.es.un-jwt', 'TOKEN_INVALID'],
  ['token firmado con otro secreto', () => `Bearer ${forged.wrongSecret()}`, 'TOKEN_INVALID'],
  ['token vencido', () => `Bearer ${forged.expired()}`, 'TOKEN_EXPIRED'],
  ['token con algoritmo "none" (sin firma)', () => `Bearer ${forged.algNone()}`, 'TOKEN_INVALID'],
  ['token alterado para suplantar al titular', () => `Bearer ${forged.tampered()}`, 'TOKEN_INVALID'],
];

describe('SEC-AUTH · Solo un token de acceso válido permite operar', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  async function expectRejectedWithoutSideEffects(op: (typeof OPERATIONS)[number], authorization: string | undefined, code: string) {
    // Arrange
    const before = await snapshot(ctx, CUENTA);

    // Act
    const res = await send(ctx.app, op, authorization);

    // Assert
    expect(res.status, `${op.name}: código HTTP`).to.equal(401);
    expect(res.body).to.have.property('success', false);
    expect(res.body).to.have.nested.property('error.code', code);
    expect(await snapshot(ctx, CUENTA), `${op.name}: estado de la cuenta`).to.deep.equal(before);
    expect(ctx.deps.notificationRepository.all()).to.be.empty;
  }

  describe.each(OPERATIONS)('$name', (op) => {
    it.each(INVALID_CREDENTIALS)('rechaza %s con 401 y sin efectos', async (_label, authorization, code) => {
      await expectRejectedWithoutSideEffects(op, authorization(), code);
    });

    it('control positivo: el token de acceso legítimo sí opera', async () => {
      // Act
      const res = await send(ctx.app, op, ctx.asTitular);

      // Assert
      expect(res.status).to.equal(op.okStatus);
    });

    // SEC-01 y SEC-02 corregidos: authMiddleware solo acepta tokens de acceso (isAccessToken).
    it('[SEC-01] rechaza el token temporal de 2FA (emitido antes de validar el código OTP)', async () => {
      await expectRejectedWithoutSideEffects(op, `Bearer ${await twoFactorTemporaryToken()}`, 'TOKEN_INVALID');
    });

    it('[SEC-02] rechaza el token de recuperación de contraseña (enlace del correo)', async () => {
      await expectRejectedWithoutSideEffects(op, `Bearer ${await passwordResetToken()}`, 'TOKEN_INVALID');
    });
  });
});

describe('SEC-AUTH · adminMiddleware aplica la misma regla', () => {
  /** Mini-app con el adminMiddleware real y un usuario administrador. */
  function adminApp() {
    const users = new InMemoryUserRepository();
    users.seed(buildUser('admin'));
    const app = express();
    app.get('/admin', createAdminMiddleware(users), (_req: Request, res: Response) => {
      res.json({ success: true });
    });
    return app;
  }

  it('control positivo: el token de acceso de un administrador entra', async () => {
    // Arrange
    const token = new JwtTokenService().generate({ userId: buildUser('admin').id, email: TITULAR_EMAIL });

    // Act
    const res = await request(adminApp()).get('/admin').set('Authorization', `Bearer ${token}`);

    // Assert
    expect(res.status).to.equal(200);
  });

  it('[SEC-01] rechaza el token temporal de 2FA de un administrador', async () => {
    // Act
    const res = await request(adminApp()).get('/admin').set('Authorization', `Bearer ${await twoFactorTemporaryToken()}`);

    // Assert
    expect(res.status).to.equal(401);
    expect(res.body).to.have.nested.property('error.code', 'TOKEN_INVALID');
  });

  it('[SEC-02] rechaza el token de recuperación de contraseña de un administrador', async () => {
    // Act
    const res = await request(adminApp()).get('/admin').set('Authorization', `Bearer ${await passwordResetToken()}`);

    // Assert
    expect(res.status).to.equal(401);
    expect(res.body).to.have.nested.property('error.code', 'TOKEN_INVALID');
  });
});
