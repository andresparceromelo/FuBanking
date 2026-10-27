/**
 * ============================================================================
 *  Seguridad — Autorización (Bolsillos + Depósito)
 * ----------------------------------------------------------------------------
 *  Regla SEC-AUTHZ: un usuario autenticado solo opera sobre SUS recursos; la
 *  identidad sale del token, nunca del body ni de la URL.
 *
 *  Amenazas:
 *   - OWASP API1:2023 BOLA / IDOR: usar ids de recursos ajenos.
 *   - OWASP API3:2023 Mass assignment: colar campos que el cliente no debe
 *     controlar (userId, id, accountId, createdAt).
 *   - OWASP API6:2023 Abuso de flujo de negocio: mover dinero entre cuentas.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACCOUNTS, AJENO, BASE, CUENTA, CUENTA_AJENA, EMERGENCIAS, ERR, TITULAR, UUID_RE, VIAJE,
  Scenario, setupScenario, snapshot,
} from '../../regression/pocket/support/scenario';
import { OPERATIONS, send } from './support/attacks';

describe('SEC-AUTHZ · Un usuario solo opera sobre sus propios recursos', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const state = async () => ({ titular: await snapshot(ctx, CUENTA), ajena: await snapshot(ctx, CUENTA_AJENA) });

  describe('IDOR / BOLA: el intruso usa los ids de recursos del titular', () => {
    it.each(OPERATIONS)('$name → 403 FORBIDDEN y ninguna de las dos cuentas cambia', async (op) => {
      // Arrange
      const before = await state();

      // Act
      const res = await send(ctx.app, op, ctx.asIntruso);

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
      expect(await state()).to.deep.equal(before);
      expect(ctx.deps.notificationRepository.all()).to.be.empty;
    });
  });

  describe('Abuso de flujo: mover dinero entre cuentas de distintos dueños', () => {
    const CASES: Array<[string, () => string, string, string]> = [
      ['el intruso saca dinero del bolsillo del titular hacia el suyo', () => ctx.asIntruso, VIAJE, AJENO],
      ['el intruso mete dinero suyo en un bolsillo del titular', () => ctx.asIntruso, AJENO, VIAJE],
      ['el titular empuja dinero hacia el bolsillo del intruso', () => ctx.asTitular, VIAJE, AJENO],
    ];

    it.each(CASES)('%s → 400 y no se mueve dinero', async (_label, auth, from, to) => {
      // Arrange
      const before = await state();

      // Act
      const res = await request(ctx.app)
        .post(`${BASE}/transfer`)
        .set('Authorization', auth())
        .send({ fromPocketId: from, toPocketId: to, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.POCKETS_DIFFERENT_ACCOUNT);
      expect(await state()).to.deep.equal(before);
    });
  });

  describe('Mass assignment: campos que el cliente no controla se ignoran', () => {
    it('crear: id, userId y createdAt del body se ignoran; el bolsillo es nuevo y del titular', async () => {
      // Act
      const res = await request(ctx.app)
        .post(BASE)
        .set('Authorization', ctx.asTitular)
        .send({
          accountId: CUENTA,
          name: 'Colado',
          amount: 1_000,
          id: AJENO,
          userId: 'otro-usuario',
          createdAt: '2000-01-01T00:00:00.000Z',
        });

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body.data).to.not.have.property('userId');
      expect(res.body.data.id).to.match(UUID_RE).and.not.equal(AJENO);
      expect(res.body.data).to.include({ accountId: CUENTA, name: 'Colado' });
      expect(res.body.data.createdAt).to.not.equal('2000-01-01T00:00:00.000Z');
      expect(await ctx.deps.pocketRepository.findById(AJENO)).to.include({ accountId: CUENTA_AJENA, name: 'Ajeno', amount: 30_000 });
    });

    it('actualizar: accountId e id del body no mueven el bolsillo a otra cuenta', async () => {
      // Arrange
      const ajenaAntes = await snapshot(ctx, CUENTA_AJENA);

      // Act
      const res = await request(ctx.app)
        .patch(`${BASE}/${VIAJE}`)
        .set('Authorization', ctx.asTitular)
        .send({ name: 'Movido', accountId: CUENTA_AJENA, id: AJENO });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.include({ id: VIAJE, accountId: CUENTA, name: 'Movido' });
      expect(await snapshot(ctx, CUENTA_AJENA)).to.deep.equal(ajenaAntes);
    });

    it.each([
      ['crear un bolsillo', 'post', BASE, { accountId: CUENTA, name: 'X', amount: 1_000, userId: TITULAR }],
      ['depositar', 'post', `${ACCOUNTS}/${CUENTA}/deposit`, { amount: 1_000, userId: TITULAR }],
      ['actualizar', 'patch', `${BASE}/${VIAJE}`, { name: 'X', userId: TITULAR }],
    ] as const)('declarar userId del titular en el body no autoriza al intruso a %s', async (_label, method, path, body) => {
      // Arrange
      const before = await state();

      // Act
      const res = await request(ctx.app)[method](path).set('Authorization', ctx.asIntruso).send(body);

      // Assert
      expect(res.status).to.equal(403);
      expect(await state()).to.deep.equal(before);
    });

    it('transferir: el monto se descuenta del bolsillo de origen, no de uno indicado en el body', async () => {
      // Act
      const res = await request(ctx.app)
        .post(`${BASE}/transfer`)
        .set('Authorization', ctx.asTitular)
        .send({ fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1_000, accountId: CUENTA_AJENA, fromAccountId: CUENTA_AJENA });

      // Assert
      expect(res.status).to.equal(200);
      expect((await snapshot(ctx, CUENTA)).pockets.map((p) => p.amount)).to.deep.equal([199_000, 51_000]);
      expect((await snapshot(ctx, CUENTA_AJENA)).pockets[0]).to.include({ amount: 30_000 });
    });
  });
});
