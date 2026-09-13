/**
 * FuBanking — Medición de CPU y Memoria del backend (v2)
 *
 * Usa PowerShell para medir el proceso Node.js real.
 * Ejecutar: cd backend && npx tsx measure-resources.ts
 * Requiere: backend corriendo en http://localhost:3001
 */

import { execSync } from 'node:child_process';
import * as os from 'node:os';

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

function getProcessInfo(): { cpuTime: number; memMB: number } | null {
  try {
    const result = execSync(
      `powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object @{N='CPU';E={$_.CPU}}, @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,2)}} | ConvertTo-Json"`,
      { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const parsed = JSON.parse(result.trim());
    const procs = Array.isArray(parsed) ? parsed : [parsed];
    // Tomar el proceso con más memoria (probablemente el backend)
    let best = null;
    for (const p of procs) {
      if (p.MemMB && (!best || p.MemMB > best.MemMB)) {
        best = p;
      }
    }
    if (best) {
      return { cpuTime: best.CPU || 0, memMB: best.MemMB || 0 };
    }
  } catch {
    // Ignorar
  }
  return null;
}

interface Measurement {
  label: string;
  cpuAvg: number;
  cpuMin: number;
  cpuMax: number;
  memAvg: number;
  memMin: number;
  memMax: number;
}

async function measure(
  label: string,
  fn: () => Promise<void>,
): Promise<Measurement> {
  const cpuDeltas: number[] = [];
  const memReadings: number[] = [];

  // 3 warm-up
  for (let i = 0; i < 3; i++) await fn();

  // Obtener CPU antes de la serie
  const cpuBefore = getProcessInfo();
  const cpuStart = cpuBefore?.cpuTime || 0;

  for (let i = 0; i < REPETITIONS; i++) {
    await fn();

    const info = getProcessInfo();
    if (info) {
      // CPU delta desde el inicio de la serie
      const delta = info.cpuTime - cpuStart;
      cpuDeltas.push(Math.round(delta * 100) / 100);
      memReadings.push(info.memMB);
    }
  }

  // CPU promedio por request = delta total / REPETITIONS
  const cpuTotalDelta = cpuDeltas.length > 0 ? cpuDeltas[cpuDeltas.length - 1] : 0;
  const cpuPerRequest = cpuTotalDelta / REPETITIONS;
  const cpuDeltasPerReq: number[] = [];
  for (let i = 1; i < cpuDeltas.length; i++) {
    cpuDeltasPerReq.push(Math.round((cpuDeltas[i] - cpuDeltas[i - 1]) * 100) / 100);
  }

  cpuDeltasPerReq.sort((a, b) => a - b);
  memReadings.sort((a, b) => a - b);

  const cpuAvg = cpuDeltasPerReq.length > 0
    ? cpuDeltasPerReq.reduce((a, b) => a + b, 0) / cpuDeltasPerReq.length
    : 0;

  return {
    label,
    cpuAvg: Math.round(cpuAvg * 100) / 100,
    cpuMin: cpuDeltasPerReq[0] || 0,
    cpuMax: cpuDeltasPerReq[cpuDeltasPerReq.length - 1] || 0,
    memAvg: memReadings.length > 0
      ? Math.round(memReadings.reduce((a, b) => a + b, 0) / memReadings.length * 100) / 100
      : 0,
    memMin: memReadings[0] || 0,
    memMax: memReadings[memReadings.length - 1] || 0,
  };
}

async function main() {
  console.log('=== FuBanking - Medición de CPU y Memoria (v2) ===\n');

  const sysMem = {
    total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100,
    used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024 * 100) / 100,
  };
  console.log(`Sistema: ${os.cpus()[0]?.model} (${os.cpus().length} cores)`);
  console.log(`RAM: ${sysMem.total} GB total, ${sysMem.used} GB en uso (${Math.round(sysMem.used / sysMem.total * 100)}%)\n`);

  const userToken = await login('testperf99@example.com', 'Test1234');
  const adminToken = await login('admintest@example.com', 'Admin1234');
  const authH = { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' };
  const adminH = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  const results: Measurement[] = [];
  let counter = 0;

  console.log('F01: Simulación...');
  results.push(await measure('POST /loans/simulate', async () => {
    await fetch(`${BASE}/loans/simulate`, {
      method: 'POST', headers: authH,
      body: JSON.stringify({ amount: 5000000, installments: 12, annualRate: 18 }),
    });
  }));

  console.log('F02: Solicitud...');
  results.push(await measure('POST /loans/', async () => {
    const id = await createLoan(userToken, counter++);
    if (id) await fetch(`${BASE}/loans/admin/${id}/approve`, { method: 'PATCH', headers: adminH });
  }));

  console.log('F03: Consulta (Usuario)...');
  results.push(await measure('GET /loans/me', async () => {
    await fetch(`${BASE}/loans/me`, { headers: authH });
  }));

  console.log('F03: Consulta (Admin)...');
  results.push(await measure('GET /loans/admin', async () => {
    await fetch(`${BASE}/loans/admin`, { headers: adminH });
  }));

  console.log('F04: Aprobación...');
  results.push(await measure('PATCH /loans/admin/:id/approve', async () => {
    const id = await createLoan(userToken, counter++);
    if (id) await fetch(`${BASE}/loans/admin/${id}/approve`, { method: 'PATCH', headers: adminH });
  }));

  console.log('F05: Rechazo...');
  results.push(await measure('PATCH /loans/admin/:id/reject', async () => {
    const id = await createLoan(userToken, counter++);
    if (id) await fetch(`${BASE}/loans/admin/${id}/reject`, { method: 'PATCH', headers: adminH });
  }));

  console.log('\n=== RESULTADOS ===\n');
  console.log('CPU Time por request (segundos):');
  console.log('Endpoint'.padEnd(42) + 'Promedio'.padStart(10) + 'Min'.padStart(10) + 'Max'.padStart(10));
  console.log('-'.repeat(72));
  for (const r of results) {
    console.log(
      r.label.padEnd(42) +
      `${r.cpuAvg}s`.padStart(10) +
      `${r.cpuMin}s`.padStart(10) +
      `${r.cpuMax}s`.padStart(10)
    );
  }

  console.log('\nMemoria Backend (RSS):');
  console.log('Endpoint'.padEnd(42) + 'Promedio'.padStart(10) + 'Min'.padStart(10) + 'Max'.padStart(10));
  console.log('-'.repeat(72));
  for (const r of results) {
    console.log(
      r.label.padEnd(42) +
      `${r.memAvg}MB`.padStart(10) +
      `${r.memMin}MB`.padStart(10) +
      `${r.memMax}MB`.padStart(10)
    );
  }
}

main().catch(console.error);
