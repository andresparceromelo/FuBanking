/**
 * ============================================================================
 *  Regresión (API) — Depositar dinero · POST /api/v1/accounts/:id/deposit
 * ----------------------------------------------------------------------------
 *  Sexta funcionalidad (módulo Cuentas). Cadena real: authMiddleware →
 *  AccountController.deposit → DepositMoney → errorHandler. Solo la
 *  persistencia va en memoria, compartida con Bolsillos para probar que un
 *  depósito amplía el saldo disponible que se aparta en bolsillos.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationType } from '../../../domain/entities/Notification';
import {
  ACCOUNTS, BASE, CUENTA, CUENTA_AJENA, CUENTA_SIN_BOLSILLOS, EMERGENCIAS, ERR, INEXISTENTE,
  ISO_RE, PUBLIC_ACCOUNT_KEYS, SALDO_INICIAL, TITULAR, TOTAL_CUENTA, VIAJE,
  Scenario, blockAccount, setupScenario, snapshot, totalFunds,
} from '../pocket/support/scenario';

describe('Regresión · Depositar dinero (POST /api/v1/accounts/:id/deposit)', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const deposit = (accountId: string, body: object, auth: string = ctx.asTitular) =>
    request(ctx.app).post(`${ACCOUNTS}/${accountId}/deposit`).set('Authorization', auth).send(body);

  describe('Camino feliz', () => {
    it('RG-DE-01 · responde 200 con la cuenta pública y el saldo actualizado', async () => {
      // Act
      const res = await deposit(CUENTA, { amount: 100_000 });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ success: true, message: 'Depósito realizado exitosamente' });
      expect(res.body.data)
        .to.have.all.keys(...PUBLIC_ACCOUNT_KEYS)
        .and.to.include({ id: CUENTA, userId: TITULAR, balance: SALDO_INICIAL + 100_000, status: 'ACTIVA' });
      expect(res.body.data.createdAt).to.match(ISO_RE);
    });

    it('RG-DE-02 · persiste el nuevo saldo sin tocar los bolsillos', async () => {
      // Act
      await deposit(CUENTA, { amount: 100_000 });

      // Assert
      expect(await snapshot(ctx, CUENTA)).to.deep.equal({
        balance: SALDO_INICIAL + 100_000,
        pockets: [
          { id: VIAJE, name: 'Viaje', amount: 200_000 },
          { id: EMERGENCIAS, name: 'Emergencias', amount: 50_000 },
        ],
      });
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA + 100_000);
    });

    it('RG-DE-03 · notifica al titular con los últimos 4 dígitos de la cuenta', async () => {
      // Act
      await deposit(CUENTA, { amount: 100_000 });

      // Assert
      const notifications = ctx.deps.notificationRepository.all();
      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0])
        .to.include({ userId: TITULAR, title: 'Depósito realizado', type: NotificationType.SISTEMA, read: false })
        .and.to.have.property('message').that.includes('****1101');
    });

    it('RG-DE-04 · depósitos sucesivos se acumulan', async () => {
      // Act
      await deposit(CUENTA, { amount: 10_000 });
      await deposit(CUENTA, { amount: 10_000 });
      const res = await deposit(CUENTA, { amount: 10_000 });

      // Assert
      expect(res.body.data).to.have.property('balance', SALDO_INICIAL + 30_000);
      expect(ctx.deps.notificationRepository.all()).to.have.lengthOf(3);
    });

    it('RG-DE-05 · acepta el monto como texto numérico', async () => {
      // Act
      const res = await deposit(CUENTA, { amount: '50000' });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('balance', SALDO_INICIAL + 50_000);
    });

    it('RG-DE-06 · acepta montos con decimales', async () => {
      // Act
      const res = await deposit(CUENTA, { amount: 1_500.5 });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('balance', SALDO_INICIAL + 1_500.5);
    });
  });

  describe('Validación del monto (400 INVALID_AMOUNT)', () => {
    for (const [id, caso, body] of [
      ['RG-DE-07', 'un monto de cero', { amount: 0 }],
      ['RG-DE-08', 'un monto negativo', { amount: -5_000 }],
      ['RG-DE-09', 'un monto no numérico', { amount: 'abc' }],
      ['RG-DE-10', 'una petición sin monto', {}],
    ] as const) {
      it(`${id} · rechaza ${caso} sin mover el saldo ni notificar`, async () => {
        // Arrange
        const before = await snapshot(ctx, CUENTA);

        // Act
        const res = await deposit(CUENTA, body);

        // Assert
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal(ERR.DEPOSIT_INVALID_AMOUNT);
        expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
        expect(ctx.deps.notificationRepository.all()).to.be.empty;
      });
    }
  });

  describe('Autenticación, autorización y reglas de negocio', () => {
    it('RG-DE-11 · responde 401 sin token', async () => {
      // Act
      const res = await request(ctx.app).post(`${ACCOUNTS}/${CUENTA}/deposit`).send({ amount: 1_000 });

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.UNAUTHORIZED);
    });

    it('RG-DE-12 · responde 403 al depositar en una cuenta ajena y no la modifica', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA_AJENA);

      // Act
      const res = await deposit(CUENTA_AJENA, { amount: 1_000 });

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
      expect(await snapshot(ctx, CUENTA_AJENA)).to.deep.equal(before);
    });

    it('RG-DE-13 · responde 404 cuando la cuenta no existe', async () => {
      // Act
      const res = await deposit(INEXISTENTE, { amount: 1_000 });

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.DEPOSIT_ACCOUNT_NOT_FOUND);
    });

    it('RG-DE-14 · responde 400 en una cuenta bloqueada y no la modifica', async () => {
      // Arrange
      await blockAccount(ctx, CUENTA);
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await deposit(CUENTA, { amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.DEPOSIT_ACCOUNT_INACTIVE);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });
  });

  describe('Integración con Bolsillos', () => {
    it('RG-DE-15 · un depósito habilita apartar un bolsillo que antes no cabía', async () => {
      // Arrange — cuenta sin bolsillos con saldo 300.000; se quieren apartar 400.000.
      const createPocket = () =>
        request(ctx.app)
          .post(BASE)
          .set('Authorization', ctx.asTitular)
          .send({ accountId: CUENTA_SIN_BOLSILLOS, name: 'Meta grande', amount: 400_000 });
      const antes = await createPocket();

      // Act
      await deposit(CUENTA_SIN_BOLSILLOS, { amount: 100_000 });
      const despues = await createPocket();

      // Assert
      expect(antes.status).to.equal(400);
      expect(antes.body).to.deep.equal(ERR.INSUFFICIENT_CREATE);
      expect(despues.status).to.equal(201);
      expect(await snapshot(ctx, CUENTA_SIN_BOLSILLOS)).to.have.property('balance', 0);
      expect(await totalFunds(ctx, CUENTA_SIN_BOLSILLOS)).to.equal(400_000);
    });
  });

  describe('Defectos corregidos', () => {
    it('RG-DE-D08 · [D-08, corregido] rechaza un monto booleano en vez de depositar $1', async () => {
      // Act
      const res = await deposit(CUENTA, { amount: true });

      // Assert — corregido con parseStrictAmount (SEC-04); antes Number(true) = 1 depositaba $1.
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.DEPOSIT_INVALID_AMOUNT);
    });
  });
});
