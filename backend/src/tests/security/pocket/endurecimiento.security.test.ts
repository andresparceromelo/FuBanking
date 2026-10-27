/**
 * ============================================================================
 *  Seguridad — Endurecimiento de la aplicación (Bolsillos + Depósito)
 * ----------------------------------------------------------------------------
 *  Reglas sobre la app REAL de producción (`createApp()` de src/app.ts), que es
 *  la que monta helmet, CORS, el límite de 10 KB del body y el errorHandler.
 *  Ninguna de estas peticiones llega a Supabase: se resuelven antes (cabeceras,
 *  CORS, parseo del body, 401) o con rutas inexistentes.
 *
 *   SEC-HD-01  Cabeceras de seguridad (helmet) en respuestas normales y de error.
 *   SEC-HD-02  CORS solo para el origen del frontend (CLIENT_URL).
 *   SEC-HD-03  Un body malformado o excesivo es error del cliente (4xx), no 500.
 *   SEC-HD-04  Los errores no exponen detalles internos (stack, rutas, tipos).
 *   SEC-HD-05  Las operaciones tienen límite de frecuencia (rate limiting).
 *
 *  Amenazas: OWASP API8:2023 Security Misconfiguration y API4:2023
 *  Unrestricted Resource Consumption.
 * ============================================================================
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import createApp from '../../../app';
import { env } from '../../../shared/config/env';
import { Scenario, setupScenario } from '../../regression/pocket/support/scenario';
import { OPERATIONS, send } from './support/attacks';

const POCKETS = '/api/v1/pockets';

describe('SEC-HD · Endurecimiento de la aplicación real', () => {
  const app = createApp();

  beforeEach(() => {
    // El errorHandler registra con console.error los errores no controlados;
    // se silencia para que el log de la suite sea legible.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('SEC-HD-01 · Cabeceras de seguridad', () => {
    it.each([
      ['respuesta normal (GET /health)', () => request(app).get('/health')],
      ['error 401 de Bolsillos', () => request(app).get(`${POCKETS}/account/cualquiera`)],
      ['error 401 del depósito', () => request(app).post('/api/v1/accounts/cualquiera/deposit').send({ amount: 1 })],
    ])('%s incluye las cabeceras de helmet y oculta la tecnología', async (_label, call) => {
      // Act
      const res = await call();

      // Assert
      expect(res.headers).to.include({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'cross-origin-opener-policy': 'same-origin',
      });
      expect(res.headers).to.have.property('content-security-policy').that.includes("default-src 'self'");
      expect(res.headers).to.have.property('strict-transport-security');
      expect(res.headers).to.not.have.property('x-powered-by');
    });
  });

  describe('SEC-HD-02 · CORS', () => {
    it('permite el origen del frontend con los métodos que usa Bolsillos', async () => {
      // Act
      const res = await request(app)
        .options(POCKETS)
        .set('Origin', env.CLIENT_URL)
        .set('Access-Control-Request-Method', 'PATCH');

      // Assert
      expect(res.headers).to.have.property('access-control-allow-origin', env.CLIENT_URL);
      expect(res.headers['access-control-allow-methods']).to.include('PATCH').and.include('DELETE');
    });

    it('no autoriza un origen desconocido', async () => {
      // Act
      const res = await request(app)
        .options(POCKETS)
        .set('Origin', 'https://atacante.example')
        .set('Access-Control-Request-Method', 'POST');

      // Assert
      expect(res.headers['access-control-allow-origin']).to.not.equal('https://atacante.example');
    });
  });

  describe('SEC-HD-03 · Cuerpos malformados o excesivos', () => {
    it.fails('[SEC-06] JSON malformado → 400 (error del cliente), no 500', async () => {
      // Act
      const res = await request(app).post(POCKETS).set('Content-Type', 'application/json').send('{"amount": ');

      // Assert
      expect(res.status).to.equal(400);
    });

    it.fails('[SEC-07] body de más de 10 KB → 413 Payload Too Large, no 500', async () => {
      // Act
      const res = await request(app)
        .post(POCKETS)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ name: 'x'.repeat(11 * 1024), amount: 1 }));

      // Assert
      expect(res.status).to.equal(413);
    });
  });

  describe('SEC-HD-04 · Los errores no exponen detalles internos', () => {
    it.each([
      ['JSON malformado', () => request(app).post(POCKETS).set('Content-Type', 'application/json').send('{"amount": ')],
      ['body excesivo', () => request(app).post(POCKETS).set('Content-Type', 'application/json').send(JSON.stringify({ name: 'x'.repeat(11 * 1024) }))],
      ['ruta inexistente', () => request(app).get('/api/v1/pockets-no-existe')],
      ['token inválido', () => request(app).get(`${POCKETS}/account/x`).set('Authorization', 'Bearer x.y.z')],
    ])('%s: respuesta JSON genérica, sin stack ni rutas del servidor', async (_label, call) => {
      // Act
      const res = await call();
      const raw = JSON.stringify(res.body);

      // Assert
      expect(res.headers['content-type']).to.match(/^application\/json/);
      expect(res.body).to.have.property('success', false);
      expect(raw).to.not.match(/stack|SyntaxError|node_modules|\.ts:\d+|at [A-Za-z]+ \(/);
    });
  });
});

describe('SEC-HD-05 · Límite de frecuencia por usuario (rate limiting)', () => {
  // La app de prueba replica el cableado real de pocket.routes y account.routes
  // (sin limitador). Créditos y login sí tienen uno (createRateLimiter).
  let ctx: Scenario;

  beforeEach(() => {
    ctx = setupScenario();
  });

  it.fails.each(OPERATIONS)('[SEC-08] $name: una ráfaga de 100 peticiones recibe 429', async (op) => {
    // Act
    const statuses: number[] = [];
    for (let i = 0; i < 100; i++) {
      statuses.push((await send(ctx.app, op, ctx.asTitular)).status);
    }

    // Assert
    expect(statuses).to.include(429);
  });
});
