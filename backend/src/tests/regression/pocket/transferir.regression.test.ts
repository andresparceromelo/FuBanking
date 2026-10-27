/**
 * ============================================================================
 *  Regresión (API) — Transferir entre bolsillos · POST /api/v1/pockets/transfer
 * ----------------------------------------------------------------------------
 *  Cadena real: authMiddleware → transferPocketSchema →
 *  PocketController.transfer → TransferPocketBalance → errorHandler.
 *  Solo la persistencia va en memoria.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationType } from '../../../domain/entities/Notification';
import {
  AJENO, BASE, CUENTA, CUENTA_AJENA, EMERGENCIAS, ERR, INEXISTENTE, PUBLIC_POCKET_KEYS,
  SALDO_INICIAL, TITULAR, TOTAL_CUENTA, VIAJE,
  Scenario, blockAccount, setupScenario, snapshot, totalFunds, validationError,
} from './support/scenario';

describe('Regresión · Transferir entre bolsillos (POST /api/v1/pockets/transfer)', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const transfer = (body: object, auth: string = ctx.asTitular) =>
    request(ctx.app).post(`${BASE}/transfer`).set('Authorization', auth).send(body);

  describe('Camino feliz', () => {
    it('RG-TR-01 · responde 200 con ambos bolsillos actualizados', async () => {
      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 100_000 });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ success: true, message: 'Transferencia entre bolsillos realizada' });
      expect(res.body.data).to.have.all.keys('fromPocket', 'toPocket');
      expect(res.body.data.fromPocket)
        .to.have.all.keys(...PUBLIC_POCKET_KEYS)
        .and.to.include({ id: VIAJE, amount: 100_000 });
      expect(res.body.data.toPocket)
        .to.have.all.keys(...PUBLIC_POCKET_KEYS)
        .and.to.include({ id: EMERGENCIAS, amount: 150_000 });
    });

    it('RG-TR-02 · persiste ambos bolsillos y no toca el saldo de la cuenta', async () => {
      // Act
      await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 100_000 });

      // Assert
      expect(await snapshot(ctx, CUENTA)).to.deep.equal({
        balance: SALDO_INICIAL,
        pockets: [
          { id: VIAJE, name: 'Viaje', amount: 100_000 },
          { id: EMERGENCIAS, name: 'Emergencias', amount: 150_000 },
        ],
      });
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA);
    });

    it('RG-TR-03 · notifica el movimiento con origen y destino', async () => {
      // Act
      await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 100_000 });

      // Assert
      const notifications = ctx.deps.notificationRepository.all();
      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0])
        .to.include({ userId: TITULAR, title: 'Movimiento entre bolsillos', type: NotificationType.BOLSILLO })
        .and.to.have.property('message').that.includes('"Viaje"').and.includes('"Emergencias"');
    });

    it('RG-TR-04 · permite transferir todo el saldo del bolsillo origen (límite)', async () => {
      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 200_000 });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data.fromPocket).to.have.property('amount', 0);
      expect(res.body.data.toPocket).to.have.property('amount', 250_000);
    });

    it('RG-TR-05 · transferencias de ida y vuelta conservan el total de la cuenta', async () => {
      // Act
      await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 100_000 });
      await transfer({ fromPocketId: EMERGENCIAS, toPocketId: VIAJE, amount: 30_000 });

      // Assert
      expect((await snapshot(ctx, CUENTA)).pockets).to.deep.equal([
        { id: VIAJE, name: 'Viaje', amount: 130_000 },
        { id: EMERGENCIAS, name: 'Emergencias', amount: 120_000 },
      ]);
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA);
    });
  });

  describe('Validación de entrada (400 VALIDATION_ERROR)', () => {
    it('RG-TR-06 · rechaza un monto de cero', async () => {
      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 0 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(
        validationError({ amount: ['El monto de transferencia debe ser mayor que cero'] }),
      );
    });

    it('RG-TR-07 · rechaza ids de bolsillo que no son UUID', async () => {
      // Act
      const res = await transfer({ fromPocketId: 'p1', toPocketId: 'p2', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(
        validationError({
          fromPocketId: ['fromPocketId debe ser un UUID válido'],
          toPocketId: ['toPocketId debe ser un UUID válido'],
        }),
      );
    });
  });

  describe('Autenticación, autorización y reglas de negocio', () => {
    it('RG-TR-08 · responde 400 al transferir un bolsillo hacia sí mismo', async () => {
      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: VIAJE, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.INVALID_TRANSFER_TARGET);
    });

    it('RG-TR-09 · responde 404 cuando el bolsillo origen no existe', async () => {
      // Act
      const res = await transfer({ fromPocketId: INEXISTENTE, toPocketId: EMERGENCIAS, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.SOURCE_POCKET_NOT_FOUND);
    });

    it('RG-TR-10 · responde 404 cuando el bolsillo destino no existe', async () => {
      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: INEXISTENTE, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.TARGET_POCKET_NOT_FOUND);
    });

    it('RG-TR-11 · responde 400 entre bolsillos de cuentas distintas y no mueve dinero', async () => {
      // Arrange
      const before = { propia: await snapshot(ctx, CUENTA), ajena: await snapshot(ctx, CUENTA_AJENA) };

      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: AJENO, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.POCKETS_DIFFERENT_ACCOUNT);
      expect({ propia: await snapshot(ctx, CUENTA), ajena: await snapshot(ctx, CUENTA_AJENA) }).to.deep.equal(before);
    });

    it('RG-TR-12 · responde 403 si un tercero mueve dinero entre bolsillos ajenos', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1_000 }, ctx.asIntruso);

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it('RG-TR-13 · responde 400 en una cuenta bloqueada y no mueve dinero', async () => {
      // Arrange
      await blockAccount(ctx, CUENTA);
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.NOT_OPERATIONAL_TRANSFER);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it('RG-TR-14 · responde 400 si el origen no alcanza por 1 peso y no mueve dinero', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await transfer({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 200_001 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.INSUFFICIENT_POCKET_BALANCE);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
      expect(ctx.deps.notificationRepository.all()).to.be.empty;
    });

    it('RG-TR-15 · responde 401 sin token', async () => {
      // Act
      const res = await request(ctx.app)
        .post(`${BASE}/transfer`)
        .send({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.UNAUTHORIZED);
    });
  });
});
