/**
 * ============================================================================
 *  Regresión (API) — Actualizar bolsillo · PATCH /api/v1/pockets/:pocketId
 * ----------------------------------------------------------------------------
 *  Cadena real: authMiddleware → updatePocketSchema → PocketController.update
 *  → UpdatePocket → errorHandler. Solo la persistencia va en memoria.
 *  UpdatePocket es el caso de uso refactorizado (validateInput /
 *  loadAuthorized / adjustAmount / notify): esta suite es la red de seguridad
 *  que demuestra que el refactor no cambió el comportamiento observable.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationType } from '../../../domain/entities/Notification';
import {
  AJENO, BASE, CUENTA, CUENTA_AJENA, ERR, INEXISTENTE, PUBLIC_POCKET_KEYS, SALDO_INICIAL,
  TITULAR, TOTAL_CUENTA, VIAJE,
  Scenario, blockAccount, setupScenario, snapshot, totalFunds, validationError,
} from './support/scenario';

describe('Regresión · Actualizar bolsillo (PATCH /api/v1/pockets/:pocketId)', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const update = (pocketId: string, body: object, auth: string = ctx.asTitular) =>
    request(ctx.app).patch(`${BASE}/${pocketId}`).set('Authorization', auth).send(body);

  describe('Camino feliz', () => {
    it('RG-AC-01 · renombra y responde 200 con el contrato público, sin tocar el saldo', async () => {
      // Act
      const res = await update(VIAJE, { name: 'Vacaciones' });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ success: true, message: 'Bolsillo actualizado' });
      expect(res.body.data)
        .to.have.all.keys(...PUBLIC_POCKET_KEYS)
        .and.to.include({ id: VIAJE, accountId: CUENTA, name: 'Vacaciones', amount: 200_000 });
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL);
    });

    it('RG-AC-02 · persiste el cambio, conserva createdAt y renueva updatedAt', async () => {
      // Act
      const res = await update(VIAJE, { name: 'Vacaciones' });

      // Assert
      const stored = await ctx.deps.pocketRepository.findById(VIAJE);
      expect(stored).to.have.property('name', 'Vacaciones');
      expect(res.body.data.createdAt).to.equal('2025-01-01T00:00:00.000Z');
      expect(res.body.data.updatedAt).to.not.equal(res.body.data.createdAt);
    });

    it('RG-AC-03 · al aumentar el monto descuenta la diferencia del saldo', async () => {
      // Act
      const res = await update(VIAJE, { amount: 300_000 });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('amount', 300_000);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL - 100_000);
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA);
    });

    it('RG-AC-04 · al reducir el monto devuelve la diferencia al saldo', async () => {
      // Act
      const res = await update(VIAJE, { amount: 40_000 });

      // Assert
      expect(res.body.data).to.have.property('amount', 40_000);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL + 160_000);
      expect(await totalFunds(ctx, CUENTA)).to.equal(TOTAL_CUENTA);
    });

    it('RG-AC-05 · actualiza nombre y monto en la misma petición', async () => {
      // Act
      const res = await update(VIAJE, { name: 'Mixto', amount: 250_000 });

      // Assert
      expect(res.body.data).to.include({ name: 'Mixto', amount: 250_000 });
      expect(await ctx.deps.pocketRepository.findById(VIAJE)).to.include({ name: 'Mixto', amount: 250_000 });
    });

    it('RG-AC-06 · con el mismo monto no mueve el saldo', async () => {
      // Act
      const res = await update(VIAJE, { amount: 200_000 });

      // Assert
      expect(res.status).to.equal(200);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', SALDO_INICIAL);
    });

    it('RG-AC-07 · permite subir el monto hasta disponible + monto actual (límite)', async () => {
      // Arrange — disponible 1.000.000 + 200.000 del propio bolsillo.
      const limite = SALDO_INICIAL + 200_000;

      // Act
      const res = await update(VIAJE, { amount: limite });

      // Assert
      expect(res.status).to.equal(200);
      expect(await snapshot(ctx, CUENTA)).to.have.property('balance', 0);
    });

    it('RG-AC-08 · recorta los espacios del nombre', async () => {
      // Act
      const res = await update(VIAJE, { name: '   Playa   ' });

      // Assert
      expect(res.body.data).to.have.property('name', 'Playa');
    });

    it('RG-AC-09 · notifica al titular con el nombre final del bolsillo', async () => {
      // Act
      await update(VIAJE, { name: 'Vacaciones' });

      // Assert
      const notifications = ctx.deps.notificationRepository.all();
      expect(notifications).to.have.lengthOf(1);
      expect(notifications[0])
        .to.include({ userId: TITULAR, title: 'Bolsillo actualizado', type: NotificationType.BOLSILLO })
        .and.to.have.property('message').that.includes('"Vacaciones"');
    });
  });

  describe('Validación de entrada', () => {
    it('RG-AC-10 · rechaza un cuerpo vacío', async () => {
      // Act
      const res = await update(VIAJE, {});

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(
        validationError({ general: ['Debes enviar al menos un campo para actualizar'] }),
      );
    });

    it('RG-AC-11 · rechaza un monto negativo', async () => {
      // Act
      const res = await update(VIAJE, { amount: -1 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(validationError({ amount: ['El monto del bolsillo no puede ser negativo'] }));
    });

    it('RG-AC-12 · rechaza un nombre vacío', async () => {
      // Act
      const res = await update(VIAJE, { name: '' });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(validationError({ name: ['El nombre del bolsillo no puede estar vacío'] }));
    });

    it('RG-AC-13 · rechaza un nombre de solo espacios (lo ataja el caso de uso)', async () => {
      // Act
      const res = await update(VIAJE, { name: '    ' });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.INVALID_POCKET_NAME);
    });
  });

  describe('Autenticación, autorización y reglas de negocio', () => {
    it('RG-AC-14 · responde 400 si el monto supera el límite por 1 peso y no modifica nada', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await update(VIAJE, { name: 'No aplica', amount: SALDO_INICIAL + 200_001 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.INSUFFICIENT_UPDATE);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it('RG-AC-15 · responde 404 cuando el bolsillo no existe', async () => {
      // Act
      const res = await update(INEXISTENTE, { name: 'X' });

      // Assert
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal(ERR.POCKET_NOT_FOUND);
    });

    it('RG-AC-16 · responde 403 sobre un bolsillo ajeno y no lo modifica', async () => {
      // Arrange
      const before = await snapshot(ctx, CUENTA_AJENA);

      // Act
      const res = await update(AJENO, { name: 'Mío', amount: 0 });

      // Assert
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal(ERR.FORBIDDEN);
      expect(await snapshot(ctx, CUENTA_AJENA)).to.deep.equal(before);
    });

    it('RG-AC-17 · responde 400 en una cuenta bloqueada y no la modifica', async () => {
      // Arrange
      await blockAccount(ctx, CUENTA);
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await update(VIAJE, { amount: 10_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal(ERR.NOT_OPERATIONAL_UPDATE);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it('RG-AC-18 · responde 401 sin token', async () => {
      // Act
      const res = await request(ctx.app).patch(`${BASE}/${VIAJE}`).send({ name: 'X' });

      // Assert
      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal(ERR.UNAUTHORIZED);
    });
  });

  describe('Defectos conocidos (it.fails)', () => {
    it.fails('RG-AC-D04 · [D-04] acepta el monto como texto numérico, igual que al crear', async () => {
      // Act
      const res = await update(VIAJE, { amount: '300000' });

      // Assert — hoy responde 400 VALIDATION_ERROR (el schema no usa coerce).
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('amount', 300_000);
    });
  });
});
