/**
 * FuBanking — Medición de tiempos de respuesta del backend
 *
 * Ejecutar: cd backend && npx tsx measure-response-times.ts
 * Requiere: backend corriendo en http://localhost:3001
 */

const BASE = 'http://localhost:3001/api/v1';
const REPETITIONS = 20;

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json() as any;
  return json.data.token;
}

async function createLoan(userToken: string, offset: number): Promise<string | null> {
  const res = await fetch(`${BASE}/loans`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 1000000 + offset * 50000,
      installments: 6,
      annualRate: 15,
      monthlyIncome: 5000000,
    }),
  });
  const json = await res.json() as any;
  return json.success ? json.data.id : null;
}

async function measure(label: string, fn: () => Promise<void>) {
  const times: number[] = [];

  for (let i = 0; i < 3; i++) await fn();

  for (let i = 0; i < REPETITIONS; i++) {
    const start = performance.now();
    await fn();
    times.push(Math.round((performance.now() - start) * 100) / 100);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return {
    label, avg: Math.round(avg * 100) / 100,
    min: times[0], max: times[times.length - 1],
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    times,
  };
}

async function main() {
  console.log('=== FuBanking - Medición de Tiempos de Respuesta ===\n');

  const userToken = await login('testperf99@example.com', 'Test1234');
  const adminToken = await login('admintest@example.com', 'Admin1234');
  const authH = { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' };
  const adminH = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  const results: any[] = [];
  let counter = 0;

  // ─── F01: Simulación (cálculo puro, sin DB) ────────────────────────────
  console.log('F01: Simulación...');
  results.push(await measure('POST /loans/simulate', async () => {
    await fetch(`${BASE}/loans/simulate`, {
      method: 'POST', headers: authH,
      body: JSON.stringify({ amount: 5000000, installments: 12, annualRate: 18 }),
    });
  }));

  // ─── F02: Solicitud de Préstamo (valida reglas + DB write + notif) ────
  console.log('F02: Solicitud...');
  // Para esta medición, necesitamos que no haya PENDING.
  // Estrategia: crear → approve rápido antes de cada medición.
  results.push(await measure('POST /loans/', async () => {
    // Crear préstamo (necesita que no haya PENDING previo)
    const id = await createLoan(userToken, counter++);
    if (id) {
      // Aprobarlo para que no quede PENDING y se pueda crear otro
      await fetch(`${BASE}/loans/admin/${id}/approve`, {
        method: 'PATCH', headers: adminH,
      });
    }
  }));

  // ─── F03: Consulta de Solicitudes ──────────────────────────────────────
  console.log('F03: Consulta (Usuario)...');
  results.push(await measure('GET /loans/me', async () => {
    await fetch(`${BASE}/loans/me`, { headers: authH });
  }));

  console.log('F03: Consulta (Admin)...');
  results.push(await measure('GET /loans/admin', async () => {
    await fetch(`${BASE}/loans/admin`, { headers: adminH });
  }));

  // ─── F04: Aprobación (valida admin + PENDING + transacción + crea cuenta + notif) ──
  console.log('F04: Aprobación...');
  results.push(await measure('PATCH /loans/admin/:id/approve', async () => {
    // Crear + aprobar en la misma medición
    const id = await createLoan(userToken, counter++);
    if (id) {
      await fetch(`${BASE}/loans/admin/${id}/approve`, {
        method: 'PATCH', headers: adminH,
      });
    }
  }));

  // ─── F05: Rechazo (valida admin + PENDING + DB update + notif) ──────────
  console.log('F05: Rechazo...');
  results.push(await measure('PATCH /loans/admin/:id/reject', async () => {
    // Crear + rechazar en la misma medición
    const id = await createLoan(userToken, counter++);
    if (id) {
      await fetch(`${BASE}/loans/admin/${id}/reject`, {
        method: 'PATCH', headers: adminH,
      });
    }
  }));

  // ─── Resultados ────────────────────────────────────────────────────────
  console.log('\n=== RESULTADOS ===\n');
  console.log(
    'Endpoint'.padEnd(42) +
    'Promedio'.padStart(10) +
    'Min'.padStart(10) +
    'Max'.padStart(10) +
    'P50'.padStart(10) +
    'P95'.padStart(10)
  );
  console.log('-'.repeat(92));

  for (const r of results) {
    console.log(
      r.label.padEnd(42) +
      `${r.avg}ms`.padStart(10) +
      `${r.min}ms`.padStart(10) +
      `${r.max}ms`.padStart(10) +
      `${r.p50}ms`.padStart(10) +
      `${r.p95}ms`.padStart(10)
    );
  }

  console.log('\n=== DETALLE ===\n');
  for (const r of results) {
    console.log(`${r.label}: ${r.times.join(', ')}ms`);
  }
}

main().catch(console.error);
