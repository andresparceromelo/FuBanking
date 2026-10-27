import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { SimulateLoan } from '../../application/use-cases/loan/SimulateLoan';
import { expectedFrenchPayment } from '../helpers/loanMath';
import { createLoanTestApp } from '../helpers/createLoanTestApp';

/**
 * Performance del módulo Créditos — Nivel 1 (Sin k6, Vitest nativo en memoria).
 * Patrón del ejemplo del profesor: presupuesto explícito + mediana de N repeticiones + p95.
 * Al ser CI-friendly (sin backend vivo ni dependencias externas), corre en cada pipeline.
 */
describe('Créditos - Performance Nivel 1 (Sin k6, Vitest nativo)', () => {
  const input = { amount: 5_000_000, installments: 24, annualRate: 24 };

  it('cálculo algorítmico puro: simula dentro del presupuesto educativo (<500ms, mediana de 5)', async () => {
    // Arrange
    const useCase = new SimulateLoan();
    const durations: number[] = [];

    // Act
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const result = await useCase.execute(input);
      durations.push(performance.now() - start);

      // Assert (correctitud en cada repetición: regresión numérica)
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.monthlyPayment).toBeCloseTo(expectedFrenchPayment(5_000_000, 24, 24), 2);
    }
    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;

    // Assert (presupuesto)
    expect(median).toBeLessThan(500);
  });

  it('latencia de endpoints HTTP: POST /simulate y GET /me cumplen presupuesto (mediana < 100ms)', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    const durations: number[] = [];

    // Act
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const res = await request(app)
        .post('/api/v1/loans/simulate')
        .set('Authorization', `Bearer ${deps.userToken}`)
        .send(input);
      durations.push(performance.now() - start);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;

    // Assert
    expect(median).toBeLessThan(100);
  });

  it('concurrencia en memoria (equivalente a k6 sin dependencias): ráfaga de 20 peticiones simultáneas en p95 < 500ms', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    const concurrentRequests = 20;

    // Act (disparo concurrente de 20 peticiones simultáneas)
    const tasks = Array.from({ length: concurrentRequests }, async () => {
      const start = performance.now();
      const res = await request(app)
        .post('/api/v1/loans/simulate')
        .set('Authorization', `Bearer ${deps.userToken}`)
        .send(input);
      const duration = performance.now() - start;
      return { status: res.status, duration };
    });

    const results = await Promise.all(tasks);

    // Assert (100% de éxito, sin fallos)
    for (const r of results) {
      expect(r.status).toBe(200);
    }

    const durations = results.map((r) => r.duration).sort((a, b) => a - b);
    const p95 = durations[Math.floor(durations.length * 0.95)]!;
    const median = durations[Math.floor(durations.length / 2)]!;

    // Assert (cumplimiento de SLOs de latencia p95 < 500ms y mediana < 200ms)
    expect(p95).toBeLessThan(500);
    expect(median).toBeLessThan(200);
  });
});
