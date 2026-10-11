/**
 * ============================================================================
 *  Regresión (API) — Crear bolsillo · POST /api/v1/pockets
 * ----------------------------------------------------------------------------
 *  Cadena real: authMiddleware → createPocketSchema → PocketController.create
 *  → CreatePocket → errorHandler. Solo la persistencia va en memoria.
 *  Aserciones fluidas con Chai BDD. Los defectos conocidos van con it.fails
 *  y su ID: la suite queda en verde y avisa en cuanto alguien los corrija.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationType } from '../../../domain/entities/Notification';
import {
  BASE, CUENTA, CUENTA_AJENA, CUENTA_SIN_BOLSILLOS, ERR, INEXISTENTE, ISO_RE,
  PUBLIC_POCKET_KEYS, SALDO_INICIAL, TITULAR, TOTAL_CUENTA, UUID_RE,
  Scenario, blockAccount, setupScenario, snapshot, totalFunds, validationError,
} from './support/scenario';

describe('Regresión · Crear bolsillo (POST /api/v1/pockets)', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const create = (body: object, auth: string = ctx.asTitular) =>
    request(ctx.app).post(BASE).set('Authorization', auth).send(body);

  describe('Camino feliz', () => {
    it('RG-CR-01 · responde 201 con el contrato público del bolsillo', async () => {
      // Arrange
      const body = { accountId: CUENTA, name: 'Carro', amount: 120_000 };

      // Act
      const res = await create(body);

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body).to.include({ success: true, message: 'Bolsillo creado' });
      expect(res.body.data)
        .to.have.all.keys(...PUBLIC_POCKET_KEYS)
        .and.to.include({ accountId: CUENTA, name: 'Carro', amount: 120_000 });
      expect(res.body.data.id).to.be.a('string').that.matches(UUID_RE);
      expect(res.body.data.createdAt).to.be.a('string').that.matches(ISO_RE);
    });

    it('RG-CR-02 · persiste el bolsillo y descuenta el monto del saldo disponible', async () => {
      // Arrange
      const body = { accountId: CUENTA, name: 'Carro', amount: 120_000 };

      // Act
      const res = await create(body);

      // Assert
      const stored = await ctx.deps.pocketRepository.findById(res.body.data.id);
      expect(stored).to.not.be.null;
      expect(stored).to.include({ accountId: CUENTA, name: 'Carro', amount: 120_000 });
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL - 120_000);
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA);
    });

    it('RG-CR-03 · notifica al titular con el nombre del bolsillo', async () => {
      // Act
      await create({ accountId: CUENTA, name: 'Carro', amount: 120_000 });

      // Assert
      const notifications = ctx.deps.notificationRepository.all();
      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0])
        .to.include({ userId: TITULAR, title: 'Bolsillo creado', type: NotificationType.BOLSILLO, read: false })
        .and.to.have.property('message').that.includes('"Carro"');
    });

    it('RG-CR-04 · recorta los espacios del nombre', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: '   Casa   ', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('name', 'Casa');
    });

    it('RG-CR-05 · acepta el monto como texto numérico y lo convierte a número', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'Texto', amount: '150000' });

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('amount').that.is.a('number').and.equals(150_000);
    });

    it('RG-CR-06 · permite un bolsillo con monto cero sin tocar el saldo', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'Meta futura', amount: 0 });

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('amount', 0);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL);
    });

    it('RG-CR-07 · permite apartar exactamente todo el saldo disponible (límite)', async () => {
      // Arrange — cuenta sin bolsillos con saldo 300.000.
      const body = { accountId: CUENTA_SIN_BOLSILLOS, name: 'Todo', amount: 300_000 };

      // Act
      const res = await create(body);

      // Assert
      expect(res.status).to.equal(201);
      expect(await snapshot(ctx, CUENTA_SIN_BOLSILLOS)).to.have.property('balance', 0);
    });

    it('RG-CR-08 · acepta un nombre de 150 caracteres (límite del validador)', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'N'.repeat(150), amount: 1_000 });

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body.data.name).to.have.lengthOf(150);
    });
  });

  describe('Validación de entrada (400 VALIDATION_ERROR)', () => {
    it('RG-CR-09 · rechaza un accountId que no es UUID', async () => {
      // Act
      const res = await create({ accountId: 'cuenta-1', name: 'X', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(validationError({ accountId: ['accountId debe ser un UUID válido'] }));
    });

    it('RG-CR-10 · rechaza un monto negativo', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'X', amount: -1 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(validationError({ amount: ['El monto del bolsillo no puede ser negativo'] }));
    });

    it('RG-CR-11 · rechaza un nombre vacío', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: '', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(validationError({ name: ['El nombre del bolsillo es obligatorio'] }));
    });

    it('RG-CR-12 · rechaza un nombre de 151 caracteres', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'N'.repeat(151), amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(
        validationError({ name: ['El nombre del bolsillo no puede superar 150 caracteres'] }),
      );
    });
  });

  describe('Autenticación y autorización', () => {
    it('RG-CR-13 · responde 401 sin token', async () => {
      // Act
      const res = await request(ctx.app).post(BASE).send({ accountId: CUENTA, name: 'X', amount: 1 });

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.UNAUTHORIZED);
    });

    it('RG-CR-14 · responde 401 con un token inválido', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'X', amount: 1 }, 'Bearer no.es.jwt');

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.TOKEN_INVALID);
    });

    it('RG-CR-15 · responde 403 al crear en una cuenta ajena y no la modifica', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA_AJENA);

      // Act
      const res = await create({ accountId: CUENTA_AJENA, name: 'Robo', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
      expect(await snapshot(ctx, CUENTA_AJENA)).to.deep.equal(before);
    });
  });

  describe('Reglas de negocio', () => {
    it('RG-CR-16 · responde 404 cuando la cuenta no existe', async () => {
      // Act
      const res = await create({ accountId: INEXISTENTE, name: 'X', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.ACCOUNT_NOT_FOUND);
    });

    it('RG-CR-17 · responde 400 en una cuenta bloqueada y no la modifica', async () => {
      // Arrange
      await blockAccount(ctx, CUENTA);
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await create({ accountId: CUENTA, name: 'X', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.NOT_OPERATIONAL_CREATE);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it('RG-CR-18 · responde 400 si el monto supera el saldo disponible por 1 peso', async () => {
      // Arrange — cuenta sin bolsillos con saldo 300.000.
      const before = await snapshot(ctx, CUENTA_SIN_BOLSILLOS);

      // Act
      const res = await create({ accountId: CUENTA_SIN_BOLSILLOS, name: 'X', amount: 300_001 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.INSUFFICIENT_CREATE);
      expect(await snapshot(ctx, CUENTA_SIN_BOLSILLOS)).to.deep.equal(before);
      expect(ctx.deps.notificationRepository.all()).to.be.empty;
    });
  });

  describe('Defectos conocidos (it.fails) y corregidos', () => {
    it('RG-CR-D02 · [D-02, corregido] rechaza un monto booleano en vez de convertirlo en $1', async () => {
      // Act
      const res = await create({ accountId: CUENTA, name: 'Bool', amount: true });

      // Assert — corregido con el monto estricto (SEC-03); antes respondía 201 con un bolsillo de $1.
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    });

    it('RG-CR-D03 · [D-01/D-03, corregido] rechaza un nombre de solo espacios', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await create({ accountId: CUENTA, name: '     ', amount: 1_000 });

      // Assert — corregido en CreatePocket; antes respondía 201 y persistía un bolsillo con nombre vacío.
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'INVALID_POCKET_NAME');
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it.fails('RG-CR-D05 · [D-05] permite crear un bolsillo que cabe en el saldo disponible', async () => {
      // Arrange — disponible 1.000.000 con 250.000 ya apartados; se piden 800.000.
      const body = { accountId: CUENTA, name: 'Cabe', amount: 800_000 };

      // Act
      const res = await create(body);

      // Assert — hoy responde 400: lo apartado se cuenta dos veces.
      expect(res.status).to.equal(201);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL - 800_000);
    });
  });
});
