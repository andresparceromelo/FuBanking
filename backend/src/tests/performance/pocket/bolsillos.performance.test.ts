/**
 * ============================================================================
 *  Performance — Bolsillos (5 funcionalidades) + Depositar dinero
 * ----------------------------------------------------------------------------
 *  Tiempos de respuesta con PRESUPUESTO EXPLÍCITO, mismo criterio que la
 *  performance de Créditos del equipo (presupuesto + mediana), ampliado con p95.
 *
 *  Qué se mide: peticiones HTTP reales (puerto efímero, keep-alive) contra la
 *  app de la regresión: JWT real, validadores, controladores y casos de uso
 *  reales; solo la persistencia va en memoria. Por eso se mide el costo del
 *  CÓDIGO de la aplicación, sin latencia de red ni de Supabase.
 *
 *  Cómo se decide que aprueba:
 *    1. Todas las respuestas tienen el código HTTP esperado (rápido pero
 *       incorrecto NO aprueba).
 *    2. La mediana (p50) y el p95 están dentro del presupuesto.
 *
 *  Los presupuestos son educativos y holgados a propósito (más de 10× lo
 *  observado en una máquina de desarrollo) para no dar falsos positivos en un
 *  runner de CI con cobertura activa; aun así detectan un retraso real de
 *  cientos de milisegundos en una operación.
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { Pocket } from '../../../domain/entities/Pocket';
import {
  ACCOUNTS, BASE, CUENTA, CUENTA_SIN_BOLSILLOS, EMERGENCIAS, VIAJE,
  Scenario, setupScenario,
} from '../../regression/pocket/support/scenario';
import { Budget, RunningServer, Stats, formatReport, listen, measure } from './support/harness';

/** Presupuesto para una operación de una sola petición (ms). */
const ONE_REQUEST: Budget = { p50: 100, p95: 300 };
/** Listar 1.000 bolsillos serializa ~150 KB de JSON: presupuesto mayor. */
const LARGE_LIST: Budget = { p50: 150, p95: 400 };
/** Recorrido de 5 peticiones encadenadas. */
const JOURNEY: Budget = { p50: 250, p95: 600 };

const report: Stats[] = [];

// Con el timeout por defecto (5 s) una operación lenta fallaría por timeout y
// no por presupuesto. Se amplía para que falle la aserción de p50/p95, con su
// mensaje; el tope de la medición lo pone `measure` (15 s por operación).
vi.setConfig({ testTimeout: 120_000 });

describe('Performance · Bolsillos y Depósito (HTTP real sobre la app en memoria)', () => {
  let ctx: Scenario;
  let server: RunningServer;

  beforeEach(async () => {
    ctx = setupScenario();
    server = await listen(ctx.app);
  });

  afterEach(async () => {
    await server.close();
  });

  afterAll(() => {
    console.log(formatReport(report));
  });

  const call = (method: string, path: string, body?: object) =>
    fetch(`${server.baseUrl}${path}`, {
      method,
      headers: { Authorization: ctx.asTitular, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  /** Verifica el contrato de performance de una medición y la registra en el reporte. */
  function assertWithinBudget(stats: Stats): void {
    report.push(stats);
    expect(stats.unexpected, `${stats.label}: respuestas con código inesperado`).to.equal(0);
    expect(stats.p50, `${stats.label}: p50 (ms)`).to.be.at.most(stats.budget.p50);
    expect(stats.p95, `${stats.label}: p95 (ms)`).to.be.at.most(stats.budget.p95);
  }

  describe('Una petición por operación (30 repeticiones, 5 de calentamiento)', () => {
    it('PF-01 · Crear bolsillo — POST /pockets', async () => {
      // Act
      const stats = await measure({
        label: 'PF-01 Crear bolsillo (POST /pockets)',
        budget: ONE_REQUEST,
        expectedStatus: 201,
        run: (_, i) => call('POST', BASE, { accountId: CUENTA, name: `Meta ${i}`, amount: 1 }),
      });

      // Assert
      assertWithinBudget(stats);
    });

    it('PF-02 · Consultar bolsillos — GET /pockets/account/:id', async () => {
      // Act
      const stats = await measure({
        label: 'PF-02 Consultar bolsillos (GET)',
        budget: ONE_REQUEST,
        expectedStatus: 200,
        run: () => call('GET', `${BASE}/account/${CUENTA}`),
      });

      // Assert
      assertWithinBudget(stats);
    });

    it('PF-03 · Actualizar bolsillo — PATCH /pockets/:id', async () => {
      // Act
      const stats = await measure({
        label: 'PF-03 Actualizar bolsillo (PATCH)',
        budget: ONE_REQUEST,
        expectedStatus: 200,
        run: (_, i) => call('PATCH', `${BASE}/${VIAJE}`, { name: `Viaje ${i}`, amount: 200_000 + (i % 2) }),
      });

      // Assert
      assertWithinBudget(stats);
    });

    it('PF-04 · Eliminar bolsillo — DELETE /pockets/:id', async () => {
      // Act — el bolsillo a borrar se siembra FUERA del tiempo medido.
      const stats = await measure({
        label: 'PF-04 Eliminar bolsillo (DELETE)',
        budget: ONE_REQUEST,
        expectedStatus: 200,
        prepare: async () => {
          const id = randomUUID();
          const now = new Date();
          ctx.deps.pocketRepository.seed(
            new Pocket({ id, accountId: CUENTA, name: 'Temporal', amount: 1, createdAt: now, updatedAt: now }),
          );
          return id;
        },
        run: (id) => call('DELETE', `${BASE}/${id}`),
      });

      // Assert
      assertWithinBudget(stats);
    });

    it('PF-05 · Transferir entre bolsillos — POST /pockets/transfer', async () => {
      // Act
      const stats = await measure({
        label: 'PF-05 Transferir entre bolsillos (POST)',
        budget: ONE_REQUEST,
        expectedStatus: 200,
        run: () => call('POST', `${BASE}/transfer`, { fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1 }),
      });

      // Assert
      assertWithinBudget(stats);
    });

    it('PF-06 · Depositar dinero — POST /accounts/:id/deposit', async () => {
      // Act
      const stats = await measure({
        label: 'PF-06 Depositar dinero (POST)',
        budget: ONE_REQUEST,
        expectedStatus: 200,
        run: () => call('POST', `${ACCOUNTS}/${CUENTA}/deposit`, { amount: 1_000 }),
      });

      // Assert
      assertWithinBudget(stats);
    });
  });

  describe('Escalabilidad y recorrido completo', () => {
    it('PF-07 · Consultar una cuenta con 1.000 bolsillos escala dentro del presupuesto', async () => {
      // Arrange — 1.000 bolsillos sembrados directamente en la cuenta sin bolsillos.
      const now = new Date();
      for (let i = 0; i < 1_000; i++) {
        ctx.deps.pocketRepository.seed(
          new Pocket({ id: randomUUID(), accountId: CUENTA_SIN_BOLSILLOS, name: `Bolsillo ${i}`, amount: 1, createdAt: now, updatedAt: now }),
        );
      }
      const probe = await call('GET', `${BASE}/account/${CUENTA_SIN_BOLSILLOS}`);
      expect((await probe.json()).data).to.be.an('array').with.lengthOf(1_000);

      // Act
      const stats = await measure({
        label: 'PF-07 Consultar con 1.000 bolsillos (GET)',
        budget: LARGE_LIST,
        expectedStatus: 200,
        repetitions: 20,
        run: () => call('GET', `${BASE}/account/${CUENTA_SIN_BOLSILLOS}`),
      });

      // Assert
      assertWithinBudget(stats);
    });

    it('PF-08 · Recorrido completo (crear → consultar → actualizar → transferir → eliminar)', async () => {
      // Act — 5 peticiones encadenadas por repetición, medidas como una sola unidad.
      const stats = await measure({
        label: 'PF-08 Recorrido de 5 peticiones',
        budget: JOURNEY,
        expectedStatus: [201, 200, 200, 200, 200],
        repetitions: 15,
        run: async (_, i) => {
          const created = await call('POST', BASE, { accountId: CUENTA_SIN_BOLSILLOS, name: `Ruta ${i}`, amount: 10 });
          const id = (await created.clone().json()).data.id as string;
          const listed = await call('GET', `${BASE}/account/${CUENTA_SIN_BOLSILLOS}`);
          const updated = await call('PATCH', `${BASE}/${id}`, { name: `Ruta ${i} editada` });
          const moved = await call('POST', `${BASE}/transfer`, { fromPocketId: VIAJE, toPocketId: EMERGENCIAS, amount: 1 });
          const removed = await call('DELETE', `${BASE}/${id}`);
          return [created, listed, updated, moved, removed];
        },
      });

      // Assert
      assertWithinBudget(stats);
    });
  });
});
