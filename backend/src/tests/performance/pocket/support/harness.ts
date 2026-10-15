/**
 * ============================================================================
 *  Arnés de medición de performance (módulo Bolsillos + Depósito)
 * ----------------------------------------------------------------------------
 *  - `listen`   levanta la app Express de prueba en un puerto efímero para
 *               medir sobre HTTP real (sockets, parseo JSON, JWT real).
 *  - `measure`  ejecuta una operación N veces (tras un calentamiento), mide
 *               cada repetición con performance.now() y verifica que el
 *               código HTTP sea el esperado: una operación rápida pero
 *               incorrecta NO cuenta como aprobada.
 *  - `percentile` usa rango más cercano (nearest-rank), sin interpolar.
 * ============================================================================
 */

import type { Application } from 'express';
import type { AddressInfo } from 'node:net';

export interface RunningServer {
  baseUrl: string;
  close(): Promise<void>;
}

export async function listen(app: Application): Promise<RunningServer> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections(); // fetch mantiene conexiones keep-alive abiertas
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

/** Percentil por rango más cercano sobre una lista YA ordenada ascendente. */
export function percentile(sortedAscending: number[], p: number): number {
  if (sortedAscending.length === 0) return Number.NaN;
  const rank = Math.ceil((p / 100) * sortedAscending.length);
  return sortedAscending[Math.min(sortedAscending.length - 1, Math.max(0, rank - 1))]!;
}

const round = (n: number): number => Math.round(n * 100) / 100;

export interface Budget {
  /** Mediana máxima aceptada (ms). */
  p50: number;
  /** Percentil 95 máximo aceptado (ms). */
  p95: number;
}

export interface Stats {
  label: string;
  samples: number;
  /** Respuestas con un código HTTP distinto al esperado (incluye calentamiento). */
  unexpected: number;
  min: number;
  mean: number;
  p50: number;
  p95: number;
  max: number;
  budget: Budget;
}

export interface Measurement<T> {
  label: string;
  budget: Budget;
  /** Código(s) HTTP esperado(s): uno por respuesta que devuelve `run`. */
  expectedStatus: number | number[];
  /** Repeticiones medidas (por defecto 30). */
  repetitions?: number;
  /** Repeticiones de calentamiento, no medidas (por defecto 5). */
  warmup?: number;
  /**
   * Tope de tiempo de la medición (por defecto 15 s). Si una operación está
   * muy por encima del presupuesto no tiene sentido seguir midiendo: se corta
   * (con al menos 3 muestras) y la aserción de presupuesto falla con un
   * mensaje claro en vez de agotar el timeout de la prueba.
   */
  maxDurationMs?: number;
  /** Prepara el estado de la repetición; NO entra en el tiempo medido. */
  prepare?: (iteration: number) => Promise<T>;
  /** Operación medida: devuelve la(s) respuesta(s) HTTP. */
  run: (context: T, iteration: number) => Promise<Response | Response[]>;
}

export async function measure<T = undefined>(spec: Measurement<T>): Promise<Stats> {
  const warmup = spec.warmup ?? 5;
  const repetitions = spec.repetitions ?? 30;
  const expected = Array.isArray(spec.expectedStatus) ? spec.expectedStatus : [spec.expectedStatus];
  const maxDurationMs = spec.maxDurationMs ?? 15_000;
  const startedAt = performance.now();
  const durations: number[] = [];
  let unexpected = 0;

  for (let i = 0; i < warmup + repetitions; i++) {
    if (durations.length >= 3 && performance.now() - startedAt > maxDurationMs) break;
    const context = (spec.prepare ? await spec.prepare(i) : undefined) as T;
    const start = performance.now();
    const raw = await spec.run(context, i);
    const responses = Array.isArray(raw) ? raw : [raw];
    for (const response of responses) await response.arrayBuffer(); // respuesta completa recibida
    const elapsed = performance.now() - start;

    responses.forEach((response, index) => {
      if (response.status !== expected[index]) unexpected++;
    });
    if (i >= warmup) durations.push(elapsed);
  }

  const sorted = [...durations].sort((a, b) => a - b);
  return {
    label: spec.label,
    samples: sorted.length,
    unexpected,
    min: round(sorted[0]!),
    mean: round(sorted.reduce((sum, d) => sum + d, 0) / sorted.length),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    max: round(sorted[sorted.length - 1]!),
    budget: spec.budget,
  };
}

/** Línea de reporte alineada, legible en el log de Jenkins. */
export function formatReport(rows: Stats[]): string {
  const pad = (value: string | number, width: number) => String(value).padStart(width);
  const header =
    'Operación'.padEnd(46) +
    ['n', 'min', 'media', 'p50', 'p95', 'máx', 'p50≤', 'p95≤', 'estado'].map((h, i) => pad(h, i === 0 ? 4 : i === 8 ? 8 : 7)).join('');
  const lines = rows.map((r) => {
    const ok = r.unexpected === 0 && r.p50 <= r.budget.p50 && r.p95 <= r.budget.p95;
    return (
      r.label.padEnd(46) +
      [r.samples, r.min, r.mean, r.p50, r.p95, r.max, r.budget.p50, r.budget.p95].map((v, i) => pad(v, i === 0 ? 4 : 7)).join('') +
      pad(ok ? 'OK' : 'FUERA', 8)
    );
  });
  return ['', 'Tiempos de respuesta (ms) — HTTP real sobre la app en memoria', header, ...lines, ''].join('\n');
}
