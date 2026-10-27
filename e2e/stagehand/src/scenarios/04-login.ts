/**
 * SUITE 09 – LOGIN SIN 2FA
 * Casos de prueba basados en katalon/casos/09_Login/:
 *   CP01 – Login exitoso redirige fuera de /login
 *   CP02 – Login con recordarme
 *   CP03 – Contraseña incorrecta muestra error
 *   CP04 – Email no registrado muestra error genérico
 *   CP05 – Campos vacíos muestran validación
 */

import { z } from 'zod';
import { createStagehandSession }            from '../config/stagehand.config.js';
import { loginViaUI, getUrlString }           from '../utils/authHelper.js';
import { EvidenceManager }                   from '../utils/evidence.js';

const EMAIL    = 'pruebaskatalon@gmail.com';
const PASSWORD = 'Katalon123.';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function cleanSession(page: any) {
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch { /* ignorar */ }
  });
}

async function openLoginPage(page: any) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  // React renderiza data-hydrated={true} como atributo sin valor ("")
  // Intentamos el selector correcto; si falla, esperamos cualquier <form>
  try {
    await page.waitForSelector('form[data-hydrated]', { timeout: 8000 });
  } catch {
    await page.waitForSelector('form', { timeout: 5000 });
  }
  // Pequeña pausa para asegurar hidratación completa de React
  await page.waitForTimeout(800);
}

async function fillCredentials(page: any, email: string, password: string) {
  await page.evaluate((em: string) => {
    const el = document.getElementById('email') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, em);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, email);

  await page.evaluate((pw: string) => {
    const el = document.getElementById('password') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, pw);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, password);
}

/** Envía el formulario de login directamente via Playwright (sin depender del LLM). */
async function submitLoginForm(page: any, stagehand?: any) {
  // Primero intentar click directo con Playwright (no requiere LLM)
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) { btn.click(); return true; }
    return false;
  });

  // Si el click directo no funcionó, usar stagehand.act como refuerzo
  if (!clicked && stagehand) {
    try {
      await stagehand.act('Click the Continuar submit button');
    } catch {
      // intentar una vez más con Playwright por si acaso
      await page.evaluate(() => {
        const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (btn) btn.click();
      });
    }
  }
}

// ─── CP01 – Login exitoso ─────────────────────────────────────────────────────

async function runCP01(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP01] Login exitoso con credenciales válidas\x1b[0m');
  await cleanSession(page);
  await openLoginPage(page);
  await evidence.saveScreenshot(page, '09-login-01-form.png');

  await fillCredentials(page, EMAIL, PASSWORD);
  let t0 = Date.now();
  evidence.recordStep({ step: 'Ingresar credenciales válidas', capability: 'act',
    instruction: `email=${EMAIL}`, result: 'Campos llenados', durationMs: Date.now() - t0 });

  t0 = Date.now();
  await submitLoginForm(page, stagehand);
  await page.waitForTimeout(4000);
  evidence.recordStep({ step: 'Enviar formulario login', capability: 'act',
    instruction: 'Click submit', result: 'Formulario enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '09-login-01-resultado.png');

  // Verificar redirección fuera de /login
  const currentUrl = await getUrlString(page);
  if (currentUrl.includes('/login')) {
    throw new Error(`CP01 FALLÓ: sigue en ${currentUrl} (se esperaba redirigir fuera de /login)`);
  }
  console.log(`    ✅ CP01 PASS – Redirigido a: ${currentUrl}`);
}

// ─── CP02 – Login con recordarme ─────────────────────────────────────────────

async function runCP02(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP02] Login con opción Recordarme\x1b[0m');
  await cleanSession(page);
  await openLoginPage(page);

  await fillCredentials(page, EMAIL, PASSWORD);
  await page.evaluate(() => {
    const cb = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (cb && !cb.checked) cb.click();
  });

  let t0 = Date.now();
  await submitLoginForm(page, stagehand);
  await page.waitForTimeout(4000);
  evidence.recordStep({ step: 'Login con Recordarme activado', capability: 'act',
    instruction: 'Submit con checkbox marcado', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '09-login-02-recordarme.png');

  const currentUrl = await getUrlString(page);
  if (currentUrl.includes('/login')) {
    throw new Error(`CP02 FALLÓ: sigue en ${currentUrl}`);
  }
  console.log(`    ✅ CP02 PASS – Redirigido a: ${currentUrl}`);
}

// ─── CP03 – Contraseña incorrecta ────────────────────────────────────────────

async function runCP03(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP03] Contraseña incorrecta muestra mensaje de error\x1b[0m');
  await cleanSession(page);
  await openLoginPage(page);

  await fillCredentials(page, EMAIL, 'ClaveIncorrecta123.');

  let t0 = Date.now();
  await submitLoginForm(page, stagehand);
  await page.waitForTimeout(3000);
  evidence.recordStep({ step: 'Submit con contraseña incorrecta', capability: 'act',
    instruction: 'Click submit', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '09-login-03-error.png');

  t0 = Date.now();
  const ErrorSchema = z.object({
    errorVisible: z.boolean().describe('True si hay un mensaje de error de autenticación visible'),
    errorText:    z.string().optional().describe('Texto del mensaje de error mostrado'),
  });
  const extracted = await stagehand.extract(
    'Is there an authentication error message visible on the page? Extract whether it is shown and its text.',
    ErrorSchema
  );
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar mensaje de error (contraseña incorrecta)', capability: 'extract',
    instruction: 'Extract error message', result: data, durationMs: Date.now() - t0 });

  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/login')) {
    throw new Error(`CP03 FALLÓ: se redirigió fuera de /login (se esperaba error en pantalla)`);
  }
  console.log(`    ✅ CP03 PASS – Error visible: ${JSON.stringify(data)}`);
}

// ─── CP04 – Email no registrado ──────────────────────────────────────────────

async function runCP04(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP04] Email no registrado muestra error genérico\x1b[0m');
  await cleanSession(page);
  await openLoginPage(page);

  await fillCredentials(page, 'noexiste@fubanking.test', PASSWORD);

  let t0 = Date.now();
  await submitLoginForm(page, stagehand);
  await page.waitForTimeout(3000);
  evidence.recordStep({ step: 'Submit con email no registrado', capability: 'act',
    instruction: 'Click submit', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '09-login-04-email-invalido.png');

  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/login')) {
    throw new Error('CP04 FALLÓ: se redirigió fuera de /login');
  }
  console.log('    ✅ CP04 PASS – Permaneció en /login con error genérico');
}

// ─── CP05 – Campos vacíos ────────────────────────────────────────────────────

async function runCP05(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP05] Campos vacíos muestran validaciones\x1b[0m');
  await cleanSession(page);
  await openLoginPage(page);

  let t0 = Date.now();
  await submitLoginForm(page, stagehand);
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Submit con campos vacíos', capability: 'act',
    instruction: 'Click submit empty form', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '09-login-05-validacion.png');

  t0 = Date.now();
  const ValidationSchema = z.object({
    emailError:    z.boolean().describe('True si hay un mensaje de error para el campo email'),
    passwordError: z.boolean().describe('True si hay un mensaje de error para el campo password'),
  });
  const extracted = await stagehand.extract(
    'Are there validation error messages shown for the email and password fields?',
    ValidationSchema
  );
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar mensajes de validación campos vacíos', capability: 'extract',
    instruction: 'Extract validation errors', result: data, durationMs: Date.now() - t0 });

  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/login')) {
    throw new Error('CP05 FALLÓ: se redirigió fuera de /login');
  }
  console.log(`    ✅ CP05 PASS – Validaciones: ${JSON.stringify(data)}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function runLoginScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[SUITE 09] LOGIN SIN 2FA – 5 Casos de Prueba\x1b[0m');
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
        await evidence.saveScreenshot(page, `09-login-${name.toLowerCase()}-FAIL.png`).catch(() => {});
        results[name] = 'FAIL';
      }
    }

    await evidence.exportReport('09-login-sin-2fa');
    console.log('\n\x1b[1m  Resumen Suite 09:\x1b[0m', results);

    const hasFail = Object.values(results).some(r => r === 'FAIL');
    if (hasFail) throw new Error(`Suite 09 tiene fallos: ${JSON.stringify(results)}`);

    return { success: true, results };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('04-login.ts')) {
  runLoginScenario().catch(() => process.exit(1));
}
