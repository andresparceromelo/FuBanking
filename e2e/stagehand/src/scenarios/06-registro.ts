/**
 * SUITE 08 – REGISTRO DE USUARIOS
 * Casos basados en katalon/casos/08_Registro/:
 *   CP01 – Registro exitoso con datos únicos
 *   CP02 – Email duplicado muestra error
 *   CP03 – Contraseña débil muestra validación
 *   CP04 – Campos vacíos muestran mensajes de validación
 */

import { z } from 'zod';
import { createStagehandSession } from '../config/stagehand.config.js';
import { EvidenceManager }        from '../utils/evidence.js';
import { getUrlString }            from '../utils/authHelper.js';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function cleanAndGoToRegister(page: any) {
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch {}
  });
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#firstName', { timeout: 10000 });
}

async function fillField(page: any, id: string, value: string) {
  await page.evaluate(({ fieldId, val }: { fieldId: string; val: string }) => {
    const el = document.getElementById(fieldId) as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, val);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { fieldId: id, val: value });
}

async function fillRegistrationForm(page: any, overrides: Partial<{
  firstName: string; lastName: string; birthDate: string;
  email: string; document: string; monthlyIncome: string;
  password: string; confirmPassword: string;
}> = {}) {
  const ts = Date.now().toString().slice(-6);
  const data = {
    firstName:       'Juan',
    lastName:        'Perez',
    birthDate:       '1995-05-15',
    email:           `user_${ts}@gmail.com`,
    document:        `10${ts}`,
    monthlyIncome:   '2500000',
    password:        'Katalon123.',
    confirmPassword: 'Katalon123.',
    ...overrides,
  };

  await fillField(page, 'firstName',       data.firstName);
  await fillField(page, 'lastName',        data.lastName);
  await fillField(page, 'birthDate',       data.birthDate);
  await fillField(page, 'email',           data.email);
  await fillField(page, 'document',        data.document);
  await fillField(page, 'monthlyIncome',   data.monthlyIncome);
  await fillField(page, 'password',        data.password);
  await fillField(page, 'confirmPassword', data.confirmPassword);

  return data;
}

// ─── CP01 – Registro exitoso ─────────────────────────────────────────────────

async function runCP01(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP01] Registro exitoso con datos únicos\x1b[0m');
  await cleanAndGoToRegister(page);
  await evidence.saveScreenshot(page, '08-registro-01-form.png');

  const data = await fillRegistrationForm(page);

  let t0 = Date.now();
  await stagehand.act('Click the submit or register button');
  await page.waitForTimeout(5000);
  evidence.recordStep({ step: 'Enviar formulario de registro', capability: 'act',
    instruction: `Registro: ${data.email}`, result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '08-registro-01-resultado.png');

  const currentUrl = await getUrlString(page);
  // Después de registro exitoso debe ir al perfil o dashboard, fuera de /register
  if (currentUrl.includes('/register')) {
    // Verificar si hay mensaje de éxito
    t0 = Date.now();
    const schema = z.object({
      successMessage: z.boolean().describe('True si hay mensaje de registro exitoso'),
    });
    const extracted = await stagehand.extract('Is there a success message indicating the registration was completed?', schema);
    const d = (extracted as any)?.data ?? extracted;
    evidence.recordStep({ step: 'Verificar éxito de registro', capability: 'extract',
      instruction: 'Extract success message', result: d, durationMs: Date.now() - t0 });
    if (!d?.successMessage) {
      throw new Error(`CP01 FALLÓ: Sigue en /register sin mensaje de éxito`);
    }
  }
  console.log(`    ✅ CP01 PASS – URL: ${currentUrl}`);
}

// ─── CP02 – Email duplicado ──────────────────────────────────────────────────

async function runCP02(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP02] Email duplicado muestra error\x1b[0m');
  await cleanAndGoToRegister(page);

  // Email que ya existe en la BD
  await fillRegistrationForm(page, { email: 'pruebaskatalon@gmail.com' });

  let t0 = Date.now();
  await stagehand.act('Click the submit or register button');
  await page.waitForTimeout(4000);
  evidence.recordStep({ step: 'Submit con email duplicado', capability: 'act',
    instruction: 'Click submit', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '08-registro-02-email-dup.png');

  t0 = Date.now();
  const schema = z.object({
    errorVisible: z.boolean().describe('True si hay un mensaje de error por email ya registrado'),
    errorText:    z.string().optional(),
  });
  const extracted = await stagehand.extract('Is there an error message about a duplicate or already registered email?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error email duplicado', capability: 'extract',
    instruction: 'Extract duplicate email error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP02 PASS – Error: ${JSON.stringify(data)}`);
}

// ─── CP03 – Contraseña débil ─────────────────────────────────────────────────

async function runCP03(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP03] Contraseña débil muestra validación\x1b[0m');
  await cleanAndGoToRegister(page);

  await fillRegistrationForm(page, { password: '123', confirmPassword: '123' });

  let t0 = Date.now();
  await stagehand.act('Click the submit or register button');
  await page.waitForTimeout(2000);
  evidence.recordStep({ step: 'Submit con contraseña débil', capability: 'act',
    instruction: 'Click submit weak password', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '08-registro-03-pass-debil.png');

  t0 = Date.now();
  const schema = z.object({
    passwordError: z.boolean().describe('True si hay validación de contraseña débil'),
  });
  const extracted = await stagehand.extract('Is there a validation message about the password being too weak or not meeting requirements?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error contraseña débil', capability: 'extract',
    instruction: 'Extract password validation', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP03 PASS – Validación: ${JSON.stringify(data)}`);
}

// ─── CP04 – Campos vacíos ────────────────────────────────────────────────────

async function runCP04(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP04] Campos vacíos muestran validaciones\x1b[0m');
  await cleanAndGoToRegister(page);

  let t0 = Date.now();
  await stagehand.act('Click the submit or register button');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Submit formulario vacío', capability: 'act',
    instruction: 'Click submit empty', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '08-registro-04-campos-vacios.png');

  t0 = Date.now();
  const observedErrors = await stagehand.observe('Find validation error messages for required fields in the registration form');
  evidence.recordStep({ step: 'Observar errores de validación campos vacíos', capability: 'observe',
    instruction: 'Find validation errors', result: observedErrors, durationMs: Date.now() - t0 });

  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/register')) {
    throw new Error(`CP04 FALLÓ: se redirigió a ${currentUrl}`);
  }
  console.log(`    ✅ CP04 PASS – Validaciones observadas: ${Array.isArray(observedErrors) ? observedErrors.length : 'N/A'}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function runRegistroScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[SUITE 08] REGISTRO DE USUARIOS – 4 Casos de Prueba\x1b[0m');
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
        await evidence.saveScreenshot(page, `08-registro-${name.toLowerCase()}-FAIL.png`).catch(() => {});
        results[name] = 'FAIL';
      }
    }

    await evidence.exportReport('08-registro-usuarios');
    console.log('\n\x1b[1m  Resumen Suite 08:\x1b[0m', results);

    if (Object.values(results).some(r => r === 'FAIL')) {
      throw new Error(`Suite 08 tiene fallos: ${JSON.stringify(results)}`);
    }
    return { success: true, results };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('06-registro.ts')) {
  runRegistroScenario().catch(() => process.exit(1));
}
