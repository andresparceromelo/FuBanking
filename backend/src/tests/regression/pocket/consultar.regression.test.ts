/**
 * ============================================================================
 *  Regresión (API) — Consultar bolsillos · GET /api/v1/pockets/account/:id
 * ----------------------------------------------------------------------------
 *  Cadena real: authMiddleware → PocketController.listByAccount →
 *  GetAccountPockets → errorHandler. Solo la persistencia va en memoria.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  AJENO, BASE, CUENTA, CUENTA_AJENA, CUENTA_SIN_BOLSILLOS, EMERGENCIAS, ERR, INEXISTENTE,
  ISO_RE, PUBLIC_POCKET_KEYS, VIAJE,
  Scenario, blockAccount, setupScenario, snapshot,
} from './support/scenario';

describe('Regresión · Consultar bolsillos (GET /api/v1/pockets/account/:accountId)', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const list = (accountId: string, auth: string = ctx.asTitular) =>
    request(ctx.app).get(`${BASE}/account/${accountId}`).set('Authorization', auth);

  describe('Camino feliz', () => {
    it('RG-CO-01 · responde 200 con los bolsillos de la cuenta en su forma pública', async () => {
      // Act
      const res = await list(CUENTA);

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ success: true, message: 'Bolsillos obtenidos' });
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
      for (const item of res.body.data) {
        expect(item).to.have.all.keys(...PUBLIC_POCKET_KEYS);
        expect(item.createdAt).to.match(ISO_RE);
        expect(item.updatedAt).to.match(ISO_RE);
      }
    });

    it('RG-CO-02 · devuelve nombre y monto persistidos de cada bolsillo', async () => {
      // Act
      const res = await list(CUENTA);

      // Assert
      const resumen = res.body.data.map((p: { id: string; name: string; amount: number }) => ({
        id: p.id,
        name: p.name,
        amount: p.amount,
      }));
      expect(resumen).to.have.deep.members([
        { id: VIAJE, name: 'Viaje', amount: 200_000 },
        { id: EMERGENCIAS, name: 'Emergencias', amount: 50_000 },
      ]);
    });

    it('RG-CO-03 · no mezcla bolsillos de otras cuentas', async () => {
      // Act
      const res = await list(CUENTA);

      // Assert
      const ids = res.body.data.map((p: { id: string }) => p.id);
      expect(ids).to.not.include(AJENO);
      expect(res.body.data.every((p: { accountId: string }) => p.accountId === CUENTA)).to.be.true;
    });

    it('RG-CO-04 · devuelve una lista vacía para una cuenta sin bolsillos', async () => {
      // Act
      const res = await list(CUENTA_SIN_BOLSILLOS);

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').that.is.empty;
    });

    it('RG-CO-05 · refleja un bolsillo recién creado (lectura después de escritura)', async () => {
      // Arrange
      const created = await request(ctx.app)
        .post(BASE)
        .set('Authorization', ctx.asTitular)
        .send({ accountId: CUENTA_SIN_BOLSILLOS, name: 'Nuevo', amount: 10_000 });

      // Act
      const res = await list(CUENTA_SIN_BOLSILLOS);

      // Assert
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.deep.equal(created.body.data);
    });

    it('RG-CO-06 · permite consultar una cuenta bloqueada (solo lectura)', async () => {
      // Arrange
      await blockAccount(ctx, CUENTA);

      // Act
      const res = await list(CUENTA);

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(2);
    });

    it('RG-CO-07 · es de solo lectura: no altera saldo, bolsillos ni notificaciones', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      await list(CUENTA);
      await list(CUENTA);

      // Assert
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
      expect(ctx.deps.notificationRepository.all()).to.be.empty;
    });
  });

  describe('Autenticación, autorización y errores', () => {
    it('RG-CO-08 · responde 401 sin token', async () => {
      // Act
      const res = await request(ctx.app).get(`${BASE}/account/${CUENTA}`);

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.UNAUTHORIZED);
    });

    it('RG-CO-09 · responde 403 al consultar una cuenta ajena', async () => {
      // Act
      const res = await list(CUENTA_AJENA);

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
    });

    it('RG-CO-10 · responde 404 cuando la cuenta no existe', async () => {
      // Act
      const res = await list(INEXISTENTE);

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.ACCOUNT_NOT_FOUND);
    });

    it('RG-CO-11 · responde 404 con un id de cuenta mal formado (la ruta no valida formato)', async () => {
      // Act
      const res = await list('no-es-uuid');

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.ACCOUNT_NOT_FOUND);
    });
  });
});
