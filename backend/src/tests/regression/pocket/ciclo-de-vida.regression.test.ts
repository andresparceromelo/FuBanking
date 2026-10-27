/**
 * ============================================================================
 *  Regresión (API) — Ciclo de vida completo de los bolsillos
 * ----------------------------------------------------------------------------
 *  Encadena las 5 funcionalidades (crear → consultar → actualizar →
 *  transferir → eliminar) sobre la misma cuenta y verifica en cada paso la
 *  invariante de dinero: saldo disponible + Σ bolsillos = total de la cuenta.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  AJENO, BASE, CUENTA_AJENA, CUENTA_SIN_BOLSILLOS,
  Scenario, setupScenario, snapshot, totalFunds,
} from './support/scenario';

describe('Regresión · Ciclo de vida de los bolsillos', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const api = (auth: string) => ({
    create: (body: object) => request(ctx.app).post(BASE).set('Authorization', auth).send(body),
    list: (accountId: string) => request(ctx.app).get(`${BASE}/account/${accountId}`).set('Authorization', auth),
    update: (id: string, body: object) => request(ctx.app).patch(`${BASE}/${id}`).set('Authorization', auth).send(body),
    transfer: (body: object) => request(ctx.app).post(`${BASE}/transfer`).set('Authorization', auth).send(body),
    remove: (id: string) => request(ctx.app).delete(`${BASE}/${id}`).set('Authorization', auth),
  });

  it('RG-FL-01 · crear → consultar → actualizar → transferir → eliminar conserva el total', async () => {
    // Arrange — cuenta sin bolsillos con saldo 300.000.
    const titular = api(ctx.asTitular);
    const TOTAL = 300_000;

    // Act + Assert (paso a paso)
    const a = await titular.create({ accountId: CUENTA_SIN_BOLSILLOS, name: 'Meta A', amount: 100_000 });
    expect(a.status).to.equal(201);
    const b = await titular.create({ accountId: CUENTA_SIN_BOLSILLOS, name: 'Meta B', amount: 50_000 });
    expect(b.status).to.equal(201);
    expect(await snapshot(ctx, CUENTA_SIN_BOLSILLOS)).to.have.property('balance', 150_000);
    expect(await totalFunds(ctx, CUENTA_SIN_BOLSILLOS)).to.equal(TOTAL);

    const listed = await titular.list(CUENTA_SIN_BOLSILLOS);
    expect(listed.body.data).to.have.deep.members([a.body.data, b.body.data]);

    const updated = await titular.update(a.body.data.id, { name: 'Meta A+', amount: 120_000 });
    expect(updated.body.data).to.include({ name: 'Meta A+', amount: 120_000 });
    expect(await snapshot(ctx, CUENTA_SIN_BOLSILLOS)).to.have.property('balance', 130_000);
    expect(await totalFunds(ctx, CUENTA_SIN_BOLSILLOS)).to.equal(TOTAL);

    const moved = await titular.transfer({ fromPocketId: a.body.data.id, toPocketId: b.body.data.id, amount: 20_000 });
    expect(moved.body.data.fromPocket).to.have.property('amount', 100_000);
    expect(moved.body.data.toPocket).to.have.property('amount', 70_000);
    expect(await totalFunds(ctx, CUENTA_SIN_BOLSILLOS)).to.equal(TOTAL);

    const removed = await titular.remove(a.body.data.id);
    expect(removed.body.data).to.include({ name: 'Meta A+', amount: 100_000 });
    expect(await snapshot(ctx, CUENTA_SIN_BOLSILLOS)).to.deep.equal({
      balance: 230_000,
      pockets: [{ id: b.body.data.id, name: 'Meta B', amount: 70_000 }],
    });
    expect(await totalFunds(ctx, CUENTA_SIN_BOLSILLOS)).to.equal(TOTAL);

    const final = await titular.list(CUENTA_SIN_BOLSILLOS);
    expect(final.body.data.map((p: { name: string }) => p.name)).to.deep.equal(['Meta B']);
    expect(ctx.deps.notificationRepository.all().map((n) => n.title)).to.deep.equal([
      'Bolsillo creado',
      'Bolsillo creado',
      'Bolsillo actualizado',
      'Movimiento entre bolsillos',
      'Bolsillo eliminado',
    ]);
  });

  it('RG-FL-02 · las operaciones de un usuario no afectan los bolsillos de otro', async () => {
    // Arrange
    const titular = api(ctx.asTitular);
    const intruso = api(ctx.asIntruso);
    const ajenaAntes = await snapshot(ctx, CUENTA_AJENA);

    // Act — el titular opera sobre lo suyo; el intruso intenta tocarlo.
    const mio = await titular.create({ accountId: CUENTA_SIN_BOLSILLOS, name: 'Mío', amount: 10_000 });
    const intentos = await Promise.all([
      intruso.update(mio.body.data.id, { amount: 0 }),
      intruso.remove(mio.body.data.id),
      intruso.list(CUENTA_SIN_BOLSILLOS),
      titular.update(AJENO, { name: 'Tomado' }),
    ]);

    // Assert
    expect(intentos.map((r) => r.status)).to.deep.equal([403, 403, 403, 403]);
    expect(await ctx.deps.pocketRepository.findById(mio.body.data.id)).to.include({ name: 'Mío', amount: 10_000 });
    expect(await snapshot(ctx, CUENTA_AJENA)).to.deep.equal(ajenaAntes);
  });
});
