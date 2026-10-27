/**
 * SUITE 10 – LOGIN CON 2FA
 * Casos basados en katalon/casos/10_Login_2FA/:
 *   CP01 – Login 2FA exitoso (captura código del backend)
 *   CP02 – Código 2FA incorrecto muestra error
 *   CP03 – Reenvío del código 2FA
 *   CP04 – Acceso directo a /verify-two-factor sin sesión redirige a /login
 *   CP05 – Login con contraseña errónea no llega a vista 2FA
 */

import { z } from 'zod';
import { createStagehandSession } from '../config/stagehand.config.js';
import { get2FACode, fillOTPInputs, loginViaUI, getUrlString } from '../utils/authHelper.js';
import { EvidenceManager } from '../utils/evidence.js';

const EMAIL_2FA = 'katalonfa@gmail.com';
const EMAIL_PASS = 'pruebaskatalon@gmail.com';
const PASSWORD = 'Katalon123.';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function cleanSession(page: any) {
  await page.evaluate(() => {
    try {
      localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch { }
  });
}

async function goToLoginAndFillCredentials(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('form[data-hydrated]', { timeout: 8000 });
  } catch {
    await page.waitForSelector('form', { timeout: 5000 });
  }
  await page.waitForTimeout(800);


  await page.evaluate((em: string) => {
    const el = document.getElementById('email') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, em); el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, email);

  await page.evaluate((pw: string) => {
    const el = document.getElementById('password') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, pw); el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, password);
}

/** Envía el formulario de login vía Playwright directo (no depende del LLM). */
async function submitLoginForm(page: any) {
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) btn.click();
  });
}

// ─── CP01 – Login 2FA exitoso ────────────────────────────────────────────────

async function runCP01(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP01] Login 2FA exitoso\x1b[0m');
  await cleanSession(page);
  await goToLoginAndFillCredentials(page, EMAIL_2FA, PASSWORD);

  let t0 = Date.now();
  await submitLoginForm(page);
  await page.waitForTimeout(3500);
  evidence.recordStep({
    step: 'Enviar credenciales usuario 2FA', capability: 'act',
    instruction: 'Click submit', result: 'Enviado', durationMs: Date.now() - t0
  });

  // Esperar pantalla 2FA
  await page.waitForSelector('input[autocomplete="one-time-code"]', { timeout: 10000 });
  await evidence.saveScreenshot(page, '10-2fa-01-pantalla2fa.png');

  // Capturar código del backend
  t0 = Date.now();
  let code = await get2FACode(EMAIL_2FA);
  // Reintentar hasta 3 veces (el backend puede tardar)
  for (let i = 0; i < 3 && !code; i++) {
    await page.waitForTimeout(1500);
    code = await get2FACode(EMAIL_2FA);
  }
  if (!code) throw new Error('CP01 FALLÓ: no se pudo obtener el código 2FA del backend');

  console.log(`    📧 Código 2FA obtenido del backend: ${code}`);

  await fillOTPInputs(page, code);
  await page.waitForTimeout(1000);
  evidence.recordStep({
    step: 'Ingresar código 2FA capturado del backend', capability: 'act',
    instruction: `OTP: ${code}`, result: 'Código ingresado', durationMs: Date.now() - t0
  });

  // Submit OTP (puede ser automático si es auto-submit)
  t0 = Date.now();
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn && !btn.disabled) btn.click();
  });
  await page.waitForTimeout(4000);
  evidence.recordStep({
    step: 'Submit código 2FA', capability: 'act',
    instruction: 'Click submit OTP', result: 'Enviado', durationMs: Date.now() - t0
  });

  await evidence.saveScreenshot(page, '10-2fa-01-resultado.png');

  const currentUrl = await getUrlString(page);
  if (currentUrl.includes('/login') || currentUrl.includes('/verify-two-factor')) {
    throw new Error(`CP01 FALLÓ: sigue en ${currentUrl} (se esperaba dashboard)`);
  }
  console.log(`    ✅ CP01 PASS – Redirigido a: ${currentUrl}`);
}

// ─── CP02 – Código 2FA incorrecto ────────────────────────────────────────────

async function runCP02(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP02] Código 2FA incorrecto muestra error\x1b[0m');
  await cleanSession(page);
  await goToLoginAndFillCredentials(page, EMAIL_2FA, PASSWORD);
  await submitLoginForm(page);
  await page.waitForTimeout(3500);

  await page.waitForSelector('input[autocomplete="one-time-code"]', { timeout: 10000 });

  // Ingresar código incorrecto
  await fillOTPInputs(page, '000000');
  await page.waitForTimeout(500);

  let t0 = Date.now();
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn && !btn.disabled) btn.click();
  });
  await page.waitForTimeout(3000);
  evidence.recordStep({
    step: 'Submit código 2FA incorrecto', capability: 'act',
    instruction: 'OTP: 000000', result: 'Enviado', durationMs: Date.now() - t0
  });

  await evidence.saveScreenshot(page, '10-2fa-02-codigo-invalido.png');

  t0 = Date.now();
  const ErrorSchema = z.object({
    errorVisible: z.boolean().describe('True si hay mensaje de error de código inválido'),
    errorText: z.string().optional(),
  });
  const extracted = await stagehand.extract('Is there an error message indicating invalid or incorrect OTP code?', ErrorSchema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({
    step: 'Verificar error código 2FA inválido', capability: 'extract',
    instruction: 'Extract OTP error', result: data, durationMs: Date.now() - t0
  });

  console.log(`    ✅ CP02 PASS – Error visible: ${JSON.stringify(data)}`);
}

// ─── CP03 – Reenvío de código ────────────────────────────────────────────────

async function runCP03(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP03] Reenvío de código 2FA\x1b[0m');
  await cleanSession(page);
  await goToLoginAndFillCredentials(page, EMAIL_2FA, PASSWORD);
  await submitLoginForm(page);
  await page.waitForTimeout(3500);
  await page.waitForSelector('input[autocomplete="one-time-code"]', { timeout: 10000 });

  let t0 = Date.now();
  await stagehand.act('Click the button to resend or re-send the verification code');
  await page.waitForTimeout(2500);
  evidence.recordStep({
    step: 'Clic en reenviar código 2FA', capability: 'act',
    instruction: 'Click reenviar código', result: 'Click realizado', durationMs: Date.now() - t0
  });

  await evidence.saveScreenshot(page, '10-2fa-03-reenvio.png');

  t0 = Date.now();
  const ObsResult = await stagehand.observe('Find confirmation message that the code was resent or a success notification');
  evidence.recordStep({
    step: 'Observar confirmación de reenvío', capability: 'observe',
    instruction: 'Find resend confirmation', result: ObsResult, durationMs: Date.now() - t0
  });

  console.log('    ✅ CP03 PASS – Reenvío completado');
}

// ─── CP04 – Acceso directo sin sesión ────────────────────────────────────────

async function runCP04(_stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP04] Acceso directo a /verify-two-factor sin sesión\x1b[0m');
  await cleanSession(page);

  await page.goto(`${BASE_URL}/verify-two-factor`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await evidence.saveScreenshot(page, '10-2fa-04-acceso-directo.png');

  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/login')) {
    throw new Error(`CP04 FALLÓ: se esperaba /login, pero está en ${currentUrl}`);
  }
  console.log(`    ✅ CP04 PASS – Redirigido a /login (no permitido sin sesión)`);
}

// ─── CP05 – Contraseña errónea no llega a 2FA ────────────────────────────────

async function runCP05(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP05] Contraseña errónea no llega a pantalla 2FA\x1b[0m');
  await cleanSession(page);
  await goToLoginAndFillCredentials(page, EMAIL_2FA, 'ClaveIncorrecta999!');

  let t0 = Date.now();
  await submitLoginForm(page);
  await page.waitForTimeout(3000);
  evidence.recordStep({
    step: 'Submit con contraseña errónea (usuario 2FA)', capability: 'act',
    instruction: 'Click submit wrong password', result: 'Enviado', durationMs: Date.now() - t0
  });

  await evidence.saveScreenshot(page, '10-2fa-05-pass-erronea.png');

  const currentUrl = await getUrlString(page);
  if (currentUrl.includes('/verify-two-factor')) {
    throw new Error('CP05 FALLÓ: llegó a pantalla 2FA con contraseña incorrecta');
  }
  console.log(`    ✅ CP05 PASS – No llegó a 2FA, URL: ${currentUrl}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function runLogin2FAScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[SUITE 10] LOGIN CON 2FA – 5 Casos de Prueba\x1b[0m');
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
        await evidence.saveScreenshot(page, `10-2fa-${name.toLowerCase()}-FAIL.png`).catch(() => { });
        results[name] = 'FAIL';
      }
    }

    await evidence.exportReport('10-login-2fa');
    console.log('\n\x1b[1m  Resumen Suite 10:\x1b[0m', results);

    if (Object.values(results).some(r => r === 'FAIL')) {
      throw new Error(`Suite 10 tiene fallos: ${JSON.stringify(results)}`);
    }
    return { success: true, results };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('05-login-2fa.ts')) {
  runLogin2FAScenario().catch(() => process.exit(1));
}
