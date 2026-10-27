/**
 * ============================================================================
 *  Seguridad — Validación de entrada y neutralización (Bolsillos + Depósito)
 * ----------------------------------------------------------------------------
 *  Equivalente, en la API de FuBanking, al ejemplo `security-testing` del
 *  curso: una POLÍTICA de entrada convertida en tabla de pruebas
 *  (como `validar_password_segura`) y la neutralización de contenido
 *  peligroso (como `sanitizar_entrada`).
 *
 *  Reglas:
 *   SEC-IN-01  Un monto es un número JSON o un texto decimal ("1500",
 *              "1500.50"). Booleanos, null, listas, objetos, texto vacío,
 *              hexadecimal o notación científica se rechazan. Nada se
 *              convierte "a la fuerza" (type juggling).
 *   SEC-IN-02  Un monto no puede salir del rango entero seguro de
 *              JavaScript (Number.MAX_SAFE_INTEGER): ahí se pierde precisión.
 *   SEC-IN-03  Identificadores maliciosos en la URL no rompen nada (404 / 400,
 *              nunca 500) y no tocan datos.
 *   SEC-IN-04  Texto con HTML, SQL, NoSQL o plantillas en el nombre se guarda
 *              y devuelve LITERAL como JSON (no se ejecuta ni se interpreta).
 *              El escape para HTML es responsabilidad de la capa que lo
 *              pinta (ver frontend/src/tests/unit/security).
 *   SEC-IN-05  Claves __proto__ / constructor no contaminan objetos del servidor.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACCOUNTS, BASE, CUENTA, ERR, SALDO_INICIAL, VIAJE,
  Scenario, setupScenario, snapshot,
} from '../../regression/pocket/support/scenario';

/** Montos válidos: deben aceptarse (control positivo de la política). */
const VALID_AMOUNTS: Array<[string, unknown, number]> = [
  ['número entero', 1_500, 1_500],
  ['número decimal', 1_500.5, 1_500.5],
  ['texto decimal', '1500', 1_500],
  ['texto con decimales', '1500.50', 1_500.5],
];

/**
 * Montos que la política rechaza.
 * [descripción, valor, hallazgo abierto al CREAR, hallazgo abierto al DEPOSITAR]
 * Un hallazgo abierto marca la prueba con it.fails: el sistema acepta ese
 * valor (lo convierte a la fuerza) y la regla de seguridad no se cumple.
 * SEC-03 y SEC-04 se corrigieron con parseStrictAmount / strictAmount
 * (presentation/validators/amount.validators.ts): ya no queda ninguno abierto.
 */
const INVALID_AMOUNTS: Array<[string, unknown, string | null, string | null]> = [
  ['booleano true', true, null, null],
  ['booleano false', false, null, null],
  ['null', null, null, null],
  ['lista vacía', [], null, null],
  ['lista con un número', [1_500], null, null],
  ['objeto', { value: 1_500 }, null, null],
  ['texto vacío', '', null, null],
  ['texto de espacios', '   ', null, null],
  ['texto no numérico', 'abc', null, null],
  ['hexadecimal', '0x10', null, null],
  ['notación científica', '1e3', null, null],
  ['negativo', -1, null, null],
];

/** it normal si la regla se cumple; it.fails (con el ID) si hay un hallazgo abierto. */
const rule = (finding: string | null, title: string) =>
  [finding ? it.fails : it, finding ? `[${finding}] ${title}` : title] as const;

describe('SEC-IN · Política de entrada', () => {
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  const createPocket = (amount: unknown, name = 'Prueba') =>
    request(ctx.app).post(BASE).set('Authorization', ctx.asTitular).send({ accountId: CUENTA, name, amount });
  const deposit = (amount: unknown) =>
    request(ctx.app).post(`${ACCOUNTS}/${CUENTA}/deposit`).set('Authorization', ctx.asTitular).send({ amount });

  describe('SEC-IN-01 · Montos estrictos al crear un bolsillo', () => {
    it.each(VALID_AMOUNTS)('acepta %s', async (_label, amount, expected) => {
      // Act
      const res = await createPocket(amount);

      // Assert
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('amount', expected);
    });

    for (const [label, amount, finding] of INVALID_AMOUNTS) {
      const [test, title] = rule(finding, `rechaza ${label} con 400 y no crea nada`);
      test(title, async () => {
        // Arrange
        const before = await snapshot(ctx, CUENTA);

        // Act
        const res = await createPocket(amount);

        // Assert
        expect(res.status).to.equal(400);
        expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
        expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
      });
    }
  });

  describe('SEC-IN-01 · Montos estrictos al depositar', () => {
    it.each(VALID_AMOUNTS)('acepta %s', async (_label, amount, expected) => {
      // Act
      const res = await deposit(amount);

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('balance', SALDO_INICIAL + expected);
    });

    for (const [label, amount, , finding] of INVALID_AMOUNTS) {
      const [test, title] = rule(finding, `rechaza ${label} con 400 y no mueve el saldo`);
      test(title, async () => {
        // Arrange
        const before = await snapshot(ctx, CUENTA);

        // Act
        const res = await deposit(amount);

        // Assert
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal(ERR.DEPOSIT_INVALID_AMOUNT);
        expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
      });
    }
  });

  describe('SEC-IN-02 · Montos dentro del rango entero seguro', () => {
    // Hallazgo SEC-05 abierto (fuera del alcance del refactor): hoy se aceptan.
    it.fails.each([
      ['MAX_SAFE_INTEGER + 2', Number.MAX_SAFE_INTEGER + 2],
      ['1e300', 1e300],
    ])('[SEC-05] un depósito de %s se rechaza (pérdida de precisión)', async (_label, amount) => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      const res = await deposit(amount);

      // Assert
      expect(res.status).to.equal(400);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });
  });

  describe('SEC-IN-03 · Identificadores maliciosos en la URL', () => {
    const IDS: Array<[string, string]> = [
      ['path traversal', '..%2F..%2Faccounts'],
      ['inyección SQL', encodeURIComponent("' OR '1'='1")],
      ['comando SQL apilado', encodeURIComponent('1; DROP TABLE pockets;--')],
      ['byte nulo', '%00'],
      ['id de 2.000 caracteres', 'a'.repeat(2_000)],
    ];

    it.each(IDS)('%s en PATCH y DELETE → 404 sin tocar datos', async (_label, id) => {
      // Arrange
      const before = await snapshot(ctx, CUENTA);

      // Act
      const patched = await request(ctx.app).patch(`${BASE}/${id}`).set('Authorization', ctx.asTitular).send({ name: 'X' });
      const removed = await request(ctx.app).delete(`${BASE}/${id}`).set('Authorization', ctx.asTitular);

      // Assert
      expect(patched.status).to.equal(404);
      expect(removed.status).to.equal(404);
      expect(removed.body).to.deep.equal(ERR.POCKET_NOT_FOUND);
      expect(await snapshot(ctx, CUENTA)).to.deep.equal(before);
    });

    it.each(IDS)('%s como cuenta en consultar y depositar → 404', async (_label, id) => {
      // Act
      const listed = await request(ctx.app).get(`${BASE}/account/${id}`).set('Authorization', ctx.asTitular);
      const deposited = await request(ctx.app).post(`${ACCOUNTS}/${id}/deposit`).set('Authorization', ctx.asTitular).send({ amount: 1_000 });

      // Assert
      expect(listed.status).to.equal(404);
      expect(deposited.status).to.equal(404);
    });

    it('ids no-UUID en la transferencia → 400 VALIDATION_ERROR', async () => {
      // Act
      const res = await request(ctx.app)
        .post(`${BASE}/transfer`)
        .set('Authorization', ctx.asTitular)
        .send({ fromPocketId: "' OR '1'='1", toPocketId: '../../etc/passwd', amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    });
  });

  describe('SEC-IN-04 · Contenido peligroso en el nombre se trata como dato literal', () => {
    const PAYLOADS: Array<[string, string]> = [
      ['etiqueta script', "<script>alert('x')</script>"],
      ['atributo con evento', '<img src="x" onerror="alert(1)">'],
      ['inyección SQL', "Viaje'); DROP TABLE pockets;--"],
      ['operador NoSQL como texto', '{"$gt": ""}'],
      ['plantilla de servidor', '{{7*7}} ${7*7}'],
    ];

    it.each(PAYLOADS)('%s: se guarda y se devuelve idéntico, como JSON', async (_label, payload) => {
      // Act
      const created = await request(ctx.app)
        .post(BASE)
        .set('Authorization', ctx.asTitular)
        .send({ accountId: CUENTA, name: payload, amount: 1_000 });
      const listed = await request(ctx.app).get(`${BASE}/account/${CUENTA}`).set('Authorization', ctx.asTitular);

      // Assert
      expect(created.status).to.equal(201);
      expect(created.headers['content-type']).to.match(/^application\/json/);
      expect(created.body.data).to.have.property('name', payload);
      expect(listed.body.data.map((p: { name: string }) => p.name)).to.include(payload);
    });

    it('un objeto en lugar de texto en el nombre → 400 (no se interpreta como consulta)', async () => {
      // Act
      const res = await request(ctx.app)
        .post(BASE)
        .set('Authorization', ctx.asTitular)
        .send({ accountId: CUENTA, name: { $gt: '' }, amount: 1_000 });

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    });

    it('al actualizar con contenido peligroso también se conserva literal', async () => {
      // Act
      const res = await request(ctx.app)
        .patch(`${BASE}/${VIAJE}`)
        .set('Authorization', ctx.asTitular)
        .send({ name: '<svg onload=alert(1)>' });

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('name', '<svg onload=alert(1)>');
    });
  });

  describe('SEC-IN-05 · Prototype pollution', () => {
    it('__proto__ y constructor en el body no contaminan Object.prototype', async () => {
      // Act
      const res = await request(ctx.app)
        .post(BASE)
        .set('Authorization', ctx.asTitular)
        .set('Content-Type', 'application/json')
        .send('{"accountId":"' + CUENTA + '","name":"Proto","amount":1000,'
          + '"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted2":"yes"}}}');

      // Assert
      expect(res.status).to.equal(201);
      expect(({} as Record<string, unknown>).polluted).to.be.undefined;
      expect(({} as Record<string, unknown>).polluted2).to.be.undefined;
      expect(res.body.data).to.not.have.any.keys('polluted', 'polluted2', '__proto__', 'constructor');
    });
  });
});
