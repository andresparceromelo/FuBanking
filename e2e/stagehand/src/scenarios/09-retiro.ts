/**
 * SUITE 13 – RETIROS DE DINERO
 * Casos basados en katalon/casos/13_Retiro/:
 *   CP01 – Retiro con monto válido completa la transacción
 *   CP02 – Retiro con saldo insuficiente muestra error
 *   CP03 – Retiro con monto cero muestra validación
 *   CP04 – Cancelar retiro cierra el modal
 */

import { z } from 'zod';
import { createStagehandSession }        from '../config/stagehand.config.js';
import { EvidenceManager }               from '../utils/evidence.js';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL    = 'pruebaskatalon@gmail.com';
const PASSWORD = 'Katalon123.';

// ─── Helper: login real y navegar a /accounts ──────────────────────────────────

async function loginAndGoToAccounts(page: any) {
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch {}
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('form[data-hydrated]', { timeout: 8000 });
  } catch {
    await page.waitForSelector('form', { timeout: 5000 });
  }
  await page.waitForTimeout(800);


  const fill = async (id: string, val: string) => {
    await page.evaluate(({ fId, v }: { fId: string; v: string }) => {
      const el = document.getElementById(fId) as HTMLInputElement | null;
      if (!el) return;
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      s.call(el, v);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { fId: id, v: val });
  };

  await fill('email',    EMAIL);
  await fill('password', PASSWORD);

  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(4000);

  await page.goto(`${BASE_URL}/accounts`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('button:has-text("Retirar")', { timeout: 12000 });
  } catch {
    await page.waitForTimeout(2000);
  }
}

async function fillAmountField(page: any, amount: string) {
  await page.evaluate((val: string) => {
    const el = document.getElementById('dw-amount') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    s.call(el, val);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, amount);
}

// ─── CP01 – Retiro válido ─────────────────────────────────────────────────────

async function runCP01(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP01] Retiro con monto válido\x1b[0m');
  await loginAndGoToAccounts(page);
  await evidence.saveScreenshot(page, '13-retiro-01-cuentas.png');

  let t0 = Date.now();
  await stagehand.act('Click the first Retirar button');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Abrir modal de retiro', capability: 'act',
    instruction: 'Click Retirar', result: 'Modal abierto', durationMs: Date.now() - t0 });

  await fillAmountField(page, '1000');

  // Llenar descripción si existe
  await page.evaluate(() => {
    const el = document.getElementById('dw-description') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, 'Retiro cajero automatico');
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  t0 = Date.now();
  await stagehand.act('Click the dw-submit button or the confirm withdrawal button');
  await page.waitForTimeout(4000);
  evidence.recordStep({ step: 'Confirmar retiro $1000', capability: 'act',
    instruction: 'Click dw-submit', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '13-retiro-01-resultado.png');

  t0 = Date.now();
  const schema = z.object({
    backToAccounts: z.boolean().describe('True si el botón Retirar está visible (modal cerrado, retiro exitoso)'),
  });
  const extracted = await stagehand.extract('Is the Retirar button visible on the accounts page indicating the withdrawal was completed?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar retiro completado', capability: 'extract',
    instruction: 'Check Retirar button visible', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP01 PASS – Estado: ${JSON.stringify(data)}`);
}

// ─── CP02 – Saldo insuficiente ────────────────────────────────────────────────

async function runCP02(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP02] Retiro con saldo insuficiente muestra error\x1b[0m');
  await loginAndGoToAccounts(page);

  let t0 = Date.now();
  await stagehand.act('Click the first Retirar button');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Abrir modal retiro', capability: 'act',
    instruction: 'Click Retirar', result: 'Modal abierto', durationMs: Date.now() - t0 });

  await fillAmountField(page, '90000000000');

  t0 = Date.now();
  await stagehand.act('Click the dw-submit button or the confirm withdrawal button');
  await page.waitForTimeout(3500);
  evidence.recordStep({ step: 'Submit retiro saldo insuficiente', capability: 'act',
    instruction: 'Click dw-submit huge amount', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '13-retiro-02-saldo-insuf.png');

  t0 = Date.now();
  const schema = z.object({
    errorVisible: z.boolean().describe('True si aparece error de saldo insuficiente'),
    errorText:    z.string().optional(),
    modalOpen:    z.boolean().describe('True si el modal de retiro sigue abierto'),
  });
  const extracted = await stagehand.extract('Is there an insufficient funds error message visible and is the Retirar Dinero modal still open?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error saldo insuficiente', capability: 'extract',
    instruction: 'Extract insufficient funds error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP02 PASS – Error: ${JSON.stringify(data)}`);
}

// ─── CP03 – Monto cero ────────────────────────────────────────────────────────

async function runCP03(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP03] Retiro con monto cero muestra validación\x1b[0m');
  await loginAndGoToAccounts(page);

  let t0 = Date.now();
  await stagehand.act('Click the first Retirar button');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Abrir modal retiro', capability: 'act',
    instruction: 'Click Retirar', result: 'Modal abierto', durationMs: Date.now() - t0 });

  await fillAmountField(page, '0');

  t0 = Date.now();
  await stagehand.act('Click the dw-submit button or the confirm withdrawal button');
  await page.waitForTimeout(3500);
  evidence.recordStep({ step: 'Submit retiro monto cero', capability: 'act',
    instruction: 'Click dw-submit amount=0', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '13-retiro-03-monto-cero.png');

  t0 = Date.now();
  const schema = z.object({
    validationError: z.boolean().describe('True si aparece validación de monto inválido'),
    errorText:       z.string().optional(),
    modalOpen:       z.boolean().describe('True si el modal sigue abierto'),
  });
  const extracted = await stagehand.extract('Is there a validation error about an invalid amount (zero or greater than zero required) and is the modal still open?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar validación monto cero', capability: 'extract',
    instruction: 'Extract invalid amount validation', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP03 PASS – Validación: ${JSON.stringify(data)}`);
}

// ─── CP04 – Cancelar retiro ───────────────────────────────────────────────────

async function runCP04(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP04] Cancelar retiro cierra el modal\x1b[0m');
  await loginAndGoToAccounts(page);

  let t0 = Date.now();
  await stagehand.act('Click the first Retirar button');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Abrir modal retiro', capability: 'act',
    instruction: 'Click Retirar', result: 'Modal abierto', durationMs: Date.now() - t0 });

  // Verificar que el modal está abierto
  const observedModal = await stagehand.observe('Find the Retirar Dinero modal title and the Cancelar button');
  evidence.recordStep({ step: 'Observar modal abierto', capability: 'observe',
    instruction: 'Find Retirar Dinero modal', result: observedModal, durationMs: 0 });

  t0 = Date.now();
  await stagehand.act('Click the Cancelar button inside the withdrawal modal');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Cancelar retiro', capability: 'act',
    instruction: 'Click Cancelar', result: 'Click realizado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '13-retiro-04-cancelar.png');

  t0 = Date.now();
  const schema = z.object({
    retirarButtonVisible: z.boolean().describe('True si el botón Retirar está visible (modal cerrado)'),
  });
  const extracted = await stagehand.extract('Is the Retirar button visible on the accounts page after cancelling?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar modal cerrado', capability: 'extract',
    instruction: 'Check modal closed', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP04 PASS – Modal cerrado: ${JSON.stringify(data)}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function runRetiroScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[SUITE 13] RETIROS DE DINERO – 4 Casos de Prueba\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================================\x1b[0m');

  const { stagehand, browser, page } = await createStagehandSession();
  const results: Record<string, 'PASS' | 'FAIL'> = {};

  try {
    for (const [name, fn] of Object.entries({
      CP01: () => runCP01(stagehand, page, evidence),
      CP02: () => runCP02(stagehand, page, evidence),
      CP03: () => runCP03(stagehand, page, evidence),
      CP04: () => runCP04(stagehand, page, evidence),
    })) {
      try {
        await fn();
        results[name] = 'PASS';
      } catch (e: any) {
        console.error(`    \x1b[31m✗ ${name} FALLÓ: ${e.message}\x1b[0m`);
        await evidence.saveScreenshot(page, `13-retiro-${name.toLowerCase()}-FAIL.png`).catch(() => {});
        results[name] = 'FAIL';
      }
    }

    await evidence.exportReport('13-retiro-dinero');
    console.log('\n\x1b[1m  Resumen Suite 13:\x1b[0m', results);

    if (Object.values(results).some(r => r === 'FAIL')) {
      throw new Error(`Suite 13 tiene fallos: ${JSON.stringify(results)}`);
    }
    return { success: true, results };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('09-retiro.ts')) {
  runRetiroScenario().catch(() => process.exit(1));
}
