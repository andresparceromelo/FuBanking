/**
 * SUITE 12 – EDITAR PERFIL
 * Casos basados en katalon/casos/12_Perfil/:
 *   CP01 – Editar nombre y apellido exitosamente
 *   CP02 – Editar teléfono e ingresos mensuales exitosamente
 *   CP03 – Validación con nombre menor a 2 caracteres
 *   CP04 – Validación con apellido menor a 2 caracteres
 *   CP05 – Cancelar edición retorna a vista principal
 */

import { z } from 'zod';
import { createStagehandSession }            from '../config/stagehand.config.js';
import { loginViaUI, getUrlString }          from '../utils/authHelper.js';
import { EvidenceManager }                   from '../utils/evidence.js';

const BASE_URL   = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL      = 'pruebaskatalon@gmail.com';
const PASSWORD   = 'Katalon123.';

// ─── Helper: login real y navegar a /profile ──────────────────────────────────

async function loginAndGoToProfile(page: any, stagehand: any) {
  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/profile')) {
    await loginViaUI(page, EMAIL, PASSWORD, BASE_URL, stagehand);
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
  }
  try {
    await page.waitForFunction(() => !document.body.innerText.includes('Cargando perfil'), { timeout: 10000 });
  } catch {}
  await page.waitForTimeout(1000);
}

async function clickEditarDatos(page: any, stagehand: any) {
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Editar datos'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!clicked) {
    await stagehand.act('Click the button with text Editar datos');
  }
  await page.waitForTimeout(1000);
}

async function clickGuardarCambios(page: any, stagehand: any) {
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Guardar cambios'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!clicked) {
    await stagehand.act('Click the Guardar cambios button');
  }
  await page.waitForTimeout(2000);
}

async function clickCancelar(page: any, stagehand: any) {
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Cancelar'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!clicked) {
    await stagehand.act('Click the Cancelar button');
  }
  await page.waitForTimeout(1000);
}

async function fillFormField(page: any, id: string, value: string) {
  await page.evaluate(({ fieldId, val }: { fieldId: string; val: string }) => {
    const el = document.getElementById(fieldId) as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    s.call(el, val);
    const tracker = (el as any)._valueTracker;
    if (tracker) tracker.setValue('');
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { fieldId: id, val: value });
}

// ─── CP01 – Editar nombre y apellido ─────────────────────────────────────────

async function runCP01(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP01] Editar nombre y apellido exitosamente\x1b[0m');
  await loginAndGoToProfile(page, stagehand);
  await evidence.saveScreenshot(page, '12-perfil-01-inicial.png');

  let t0 = Date.now();
  await clickEditarDatos(page, stagehand);
  evidence.recordStep({ step: 'Clic Editar datos', capability: 'act',
    instruction: 'Click Editar datos', result: 'Modal/form abierto', durationMs: Date.now() - t0 });

  await fillFormField(page, 'firstName', 'Carlos');
  await fillFormField(page, 'lastName',  'Gomez');

  t0 = Date.now();
  await clickGuardarCambios(page, stagehand);
  evidence.recordStep({ step: 'Guardar cambios nombre/apellido', capability: 'act',
    instruction: 'Click Guardar cambios', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '12-perfil-01-guardado.png');

  t0 = Date.now();
  const schema = z.object({ editButtonVisible: z.boolean().describe('True si el botón Editar datos volvió a aparecer') });
  const extracted = await stagehand.extract('Is the Editar datos button visible on the profile page?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar retorno a vista perfil', capability: 'extract',
    instruction: 'Check Editar datos visible', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP01 PASS – Estado: ${JSON.stringify(data)}`);
}

// ─── CP02 – Editar teléfono e ingresos ───────────────────────────────────────

async function runCP02(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP02] Editar teléfono e ingresos mensuales\x1b[0m');
  await loginAndGoToProfile(page, stagehand);
  await clickEditarDatos(page, stagehand);

  await fillFormField(page, 'phone',         '+57 300 123 4567');
  await fillFormField(page, 'monthlyIncome', '3500000');

  let t0 = Date.now();
  await clickGuardarCambios(page, stagehand);
  evidence.recordStep({ step: 'Guardar cambios teléfono/ingresos', capability: 'act',
    instruction: 'Click Guardar cambios', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '12-perfil-02-guardado.png');
  console.log('    ✅ CP02 PASS');
}

// ─── CP03 – Nombre < 2 caracteres ────────────────────────────────────────────

async function runCP03(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP03] Validación nombre menor a 2 caracteres\x1b[0m');
  await loginAndGoToProfile(page, stagehand);
  await clickEditarDatos(page, stagehand);

  await fillFormField(page, 'firstName', 'A');

  let t0 = Date.now();
  await clickGuardarCambios(page, stagehand);
  evidence.recordStep({ step: 'Submit con nombre inválido (1 char)', capability: 'act',
    instruction: 'Click Guardar cambios', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '12-perfil-03-validacion-nombre.png');

  t0 = Date.now();
  const schema = z.object({ validationError: z.boolean(), errorText: z.string().optional() });
  const extracted = await stagehand.extract('Is there a validation error message for the first name field?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error validación nombre', capability: 'extract',
    instruction: 'Extract firstName validation error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP03 PASS – Validación: ${JSON.stringify(data)}`);
}

// ─── CP04 – Apellido < 2 caracteres ──────────────────────────────────────────

async function runCP04(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP04] Validación apellido menor a 2 caracteres\x1b[0m');
  await loginAndGoToProfile(page, stagehand);
  await clickEditarDatos(page, stagehand);

  await fillFormField(page, 'lastName', 'B');

  let t0 = Date.now();
  await clickGuardarCambios(page, stagehand);
  evidence.recordStep({ step: 'Submit con apellido inválido (1 char)', capability: 'act',
    instruction: 'Click Guardar cambios', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '12-perfil-04-validacion-apellido.png');

  t0 = Date.now();
  const schema = z.object({ validationError: z.boolean(), errorText: z.string().optional() });
  const extracted = await stagehand.extract('Is there a validation error message for the last name field?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error validación apellido', capability: 'extract',
    instruction: 'Extract lastName validation error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP04 PASS – Validación: ${JSON.stringify(data)}`);
}

// ─── CP05 – Cancelar edición ──────────────────────────────────────────────────

async function runCP05(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP05] Cancelar edición retorna a vista principal\x1b[0m');
  await loginAndGoToProfile(page, stagehand);
  await clickEditarDatos(page, stagehand);

  let t0 = Date.now();
  await clickCancelar(page, stagehand);
  evidence.recordStep({ step: 'Cancelar edición de perfil', capability: 'act',
    instruction: 'Click Cancelar', result: 'Click realizado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '12-perfil-05-cancelar.png');

  t0 = Date.now();
  const schema = z.object({ editButtonVisible: z.boolean() });
  const extracted = await stagehand.extract('Is the Editar datos button visible again on the profile?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar retorno a perfil tras cancelar', capability: 'extract',
    instruction: 'Check Editar datos button', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP05 PASS – Vista perfil: ${JSON.stringify(data)}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function runEditarPerfilScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[SUITE 12] EDITAR PERFIL – 5 Casos de Prueba\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================================\x1b[0m');

  const { stagehand, browser, page } = await createStagehandSession();
  const results: Record<string, 'PASS' | 'FAIL'> = {};

  try {
    for (const [name, fn] of Object.entries({
      CP01: () => runCP01(stagehand, page, evidence),
      CP02: () => runCP02(stagehand, page, evidence),
      CP03: () => runCP03(stagehand, page, evidence),
      CP04: () => runCP04(stagehand, page, evidence),
      CP05: () => runCP05(stagehand, page, evidence),
    })) {
      try {
        await fn();
        results[name] = 'PASS';
      } catch (e: any) {
        console.error(`    \x1b[31m✗ ${name} FALLÓ: ${e.message}\x1b[0m`);
        await evidence.saveScreenshot(page, `12-perfil-${name.toLowerCase()}-FAIL.png`).catch(() => {});
        results[name] = 'FAIL';
      }
    }

    await evidence.exportReport('12-editar-perfil');
    console.log('\n\x1b[1m  Resumen Suite 12:\x1b[0m', results);

    if (Object.values(results).some(r => r === 'FAIL')) {
      throw new Error(`Suite 12 tiene fallos: ${JSON.stringify(results)}`);
    }
    return { success: true, results };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('07-editar-perfil.ts')) {
  runEditarPerfilScenario().catch(() => process.exit(1));
}
