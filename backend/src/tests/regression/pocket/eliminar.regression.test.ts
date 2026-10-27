/**
 * ============================================================================
 *  Regresión (API) — Eliminar bolsillo · DELETE /api/v1/pockets/:pocketId
 * ----------------------------------------------------------------------------
 *  Cadena real: authMiddleware → PocketController.remove → DeletePocket →
 *  errorHandler. Solo la persistencia va en memoria.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationType } from '../../../domain/entities/Notification';
import {
  AJENO, BASE, CUENTA, CUENTA_AJENA, EMERGENCIAS, ERR, INEXISTENTE, SALDO_INICIAL, TITULAR,
  TOTAL_CUENTA, VIAJE,
  Scenario, blockAccount, setupScenario, snapshot, totalFunds,
} from './support/scenario';

describe('Regresión · Eliminar bolsillo (DELETE /api/v1/pockets/:pocketId)', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const remove = (pocketId: string, auth: string = ctx.asTitular) =>
    request(ctx.app).delete(`${BASE}/${pocketId}`).set('Authorization', auth);

  describe('Camino feliz', () => {
    it('RG-EL-01 · responde 200 con la foto pública del bolsillo eliminado', async () => {
      // Act
      const res = await remove(VIAJE);

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ success: true, message: 'Bolsillo eliminado' });
      expect(res.body.data).to.deep.equal({
        id: VIAJE,
        accountId: CUENTA,
        name: 'Viaje',
        amount: 200_000,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    it('RG-EL-02 · borra el bolsillo y devuelve su monto al saldo disponible', async () => {
      // Act
      await remove(VIAJE);

      // Assert
      expect(await ctx.deps.pocketRepository.findById(VIAJE)).to.be.null;
      expect(await snapshot(ctx, CUENTA)).to.deep.equal({
        balance: SALDO_INICIAL + 200_000,
        pockets: [{ id: EMERGENCIAS, name: 'Emergencias', amount: 50_000 }],
      });
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA);
    });

    it('RG-EL-03 · notifica al titular con el nombre del bolsillo', async () => {
      // Act
      await remove(VIAJE);

      // Assert
      const notifications = ctx.deps.notificationRepository.all();
      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0])
        .to.include({ userId: TITULAR, title: 'Bolsillo eliminado', type: NotificationType.BOLSILLO })
        .and.to.have.property('message').that.includes('"Viaje"');
    });

    it('RG-EL-04 · eliminar un bolsillo en cero no mueve el saldo', async () => {
      // Arrange
      const created = await request(ctx.app)
        .post(BASE)
        .set('Authorization', ctx.asTitular)
        .send({ accountId: CUENTA, name: 'Vacío', amount: 0 });

      // Act
      const res = await remove(created.body.data.id);

      // Assert
      expect(res.status).to.equal(200);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL);
    });

    it('RG-EL-05 · el bolsillo eliminado desaparece de la consulta', async () => {
      // Act
      await remove(VIAJE);
      const res = await request(ctx.app).get(`${BASE}/account/${CUENTA}`).set('Authorization', ctx.asTitular);

      // Assert
      expect(res.body.data.map((p: { id: string }) => p.id)).to.deep.equal([EMERGENCIAS]);
    });

    it('RG-EL-06 · un segundo DELETE responde 404 y no devuelve el dinero dos veces', async () => {
      // Arrange
      await remove(VIAJE);

      // Act
      const res = await remove(VIAJE);

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.POCKET_NOT_FOUND);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL + 200_000);
    });
  });

  describe('Autenticación, autorización y reglas de negocio', () => {
    it('RG-EL-07 · responde 404 cuando el bolsillo no existe', async () => {
      // Act
      const res = await remove(INEXISTENTE);

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.POCKET_NOT_FOUND);
    });

    it('RG-EL-08 · responde 403 sobre un bolsillo ajeno y no lo elimina', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA_AJENA);

      // Act
      const res = await remove(AJENO);

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
      expect(await snapshot(ctx, CUENTA_AJENA)).to.deep.equal(before);
    });

    it('RG-EL-09 · responde 400 en una cuenta bloqueada y no elimina nada', async () => {
      // Arrange
      await blockAccount(ctx, CUENTA);
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await remove(VIAJE);

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.NOT_OPERATIONAL_DELETE);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it('RG-EL-10 · responde 401 sin token', async () => {
      // Act
      const res = await request(ctx.app).delete(`${BASE}/${VIAJE}`);

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.UNAUTHORIZED);
      expect(await ctx.deps.pocketRepository.findById(VIAJE)).to.not.be.null;
    });
  });
});
