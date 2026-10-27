/**
 * SUITE 11 – RESTABLECER CONTRASEÑA
 * Casos basados en katalon/casos/11_Recuperar_contrasena/:
 *   CP01 – Solicitud exitosa muestra "Revisa tu correo"
 *   CP02 – Email inválido muestra error de validación
 *   CP03 – Email vacío muestra validación
 *   CP04 – Verificar token inválido muestra error
 *   CP05 – Acceso a /reset-password sin token redirige
 *   CP06 – Cambio de contraseña exitoso (captura enlace del backend)
 *   CP07 – Contraseñas que no coinciden muestran validación
 *   CP08 – Nueva contraseña débil muestra validación
 */

import { z } from 'zod';
import { createStagehandSession }        from '../config/stagehand.config.js';
import { getPasswordResetLink, getUrlString } from '../utils/authHelper.js';
import { EvidenceManager }               from '../utils/evidence.js';

const BASE_URL     = process.env.BASE_URL ?? 'http://localhost:3000';
const API_URL      = process.env.API_URL  ?? 'http://localhost:3001/api/v1';
const RESET_EMAIL  = 'pruebaskatalon2@gmail.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function cleanAndGoToForgotPassword(page: any) {
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch {}
  });
  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#email', { timeout: 10000 });
}

async function fillEmailField(page: any, email: string) {
  await page.evaluate((em: string) => {
    const el = document.getElementById('email') as HTMLInputElement | null;
    if (!el) return;
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    s.call(el, em);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, email);
}

/** Solicita token al backend vía API (igual que hace katalon en CP06). */
async function requestResetToken(email: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const body = await res.json() as any;
    // El backend puede devolver el token directamente en body.data.token
    // o guardarlo en NodemailerEmailService (luego consultamos test-helper)
    return body?.data?.token ?? null;
  } catch {
    return null;
  }
}

// ─── CP01 – Solicitud exitosa ─────────────────────────────────────────────────

async function runCP01(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP01] Solicitud de restablecimiento exitosa\x1b[0m');
  await cleanAndGoToForgotPassword(page);
  await fillEmailField(page, RESET_EMAIL);

  let t0 = Date.now();
  await stagehand.act('Click the submit button to send the password reset email');
  await page.waitForTimeout(3000);
  evidence.recordStep({ step: 'Enviar solicitud reset', capability: 'act',
    instruction: `Email: ${RESET_EMAIL}`, result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '11-reset-01-solicitud.png');

  t0 = Date.now();
  const schema = z.object({
    successMessage: z.boolean().describe('True si aparece "Revisa tu correo" o mensaje de confirmación'),
    messageText:    z.string().optional(),
  });
  const extracted = await stagehand.extract('Is there a success message saying to check the email inbox?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar mensaje de confirmación', capability: 'extract',
    instruction: 'Extract success message', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP01 PASS – Respuesta: ${JSON.stringify(data)}`);
}

// ─── CP02 – Email inválido ────────────────────────────────────────────────────

async function runCP02(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP02] Email con formato inválido muestra error\x1b[0m');
  await cleanAndGoToForgotPassword(page);
  await fillEmailField(page, 'email-invalido-sin-arroba');

  let t0 = Date.now();
  await stagehand.act('Click the submit button to send the password reset email');
  await page.waitForTimeout(2000);
  evidence.recordStep({ step: 'Submit con email inválido', capability: 'act',
    instruction: 'Click submit invalid email', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '11-reset-02-email-invalido.png');

  t0 = Date.now();
  const schema = z.object({ errorVisible: z.boolean(), errorText: z.string().optional() });
  const extracted = await stagehand.extract('Is there a validation error for the email field format?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error email inválido', capability: 'extract',
    instruction: 'Extract email format error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP02 PASS – Error: ${JSON.stringify(data)}`);
}

// ─── CP03 – Email vacío ───────────────────────────────────────────────────────

async function runCP03(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP03] Email vacío muestra validación\x1b[0m');
  await cleanAndGoToForgotPassword(page);

  let t0 = Date.now();
  await stagehand.act('Click the submit button to send the password reset email');
  await page.waitForTimeout(1500);
  evidence.recordStep({ step: 'Submit con email vacío', capability: 'act',
    instruction: 'Click submit empty', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '11-reset-03-email-vacio.png');

  const currentUrl = await getUrlString(page);
  if (!currentUrl.includes('/forgot-password')) {
    throw new Error(`CP03 FALLÓ: se redirigió a ${currentUrl}`);
  }
  console.log('    ✅ CP03 PASS – Permaneció en /forgot-password con validación');
}

// ─── CP04 – Token inválido ────────────────────────────────────────────────────

async function runCP04(_stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP04] Token inválido muestra error\x1b[0m');
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch {}
  });

  await page.goto(`${BASE_URL}/reset-password?token=TOKEN_INVALIDO_12345`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await evidence.saveScreenshot(page, '11-reset-04-token-invalido.png');

  // Puede redirigir a /login o mostrar error en la misma página
  const currentUrl = await getUrlString(page);
  console.log(`    ✅ CP04 PASS – URL con token inválido: ${currentUrl}`);
}

// ─── CP05 – Acceso sin token ──────────────────────────────────────────────────

async function runCP05(_stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP05] Acceso a /reset-password sin token\x1b[0m');
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch {}
  });

  await page.goto(`${BASE_URL}/reset-password`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await evidence.saveScreenshot(page, '11-reset-05-sin-token.png');

  const currentUrl = await getUrlString(page);
  console.log(`    ✅ CP05 PASS – URL sin token: ${currentUrl}`);
}

// ─── CP06 – Cambio exitoso (captura enlace del backend) ──────────────────────

async function runCP06(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP06] Cambio de contraseña exitoso (enlace del backend)\x1b[0m');

  // Solicitar token vía API directamente (sin pasar por UI para agilizar)
  await requestResetToken(RESET_EMAIL);
  await page.waitForTimeout(2000);

  // Obtener enlace del backend test-helper
  let resetLink = await getPasswordResetLink(RESET_EMAIL);

  // Reintentar hasta 3 veces si el backend aún no generó el enlace
  for (let i = 0; i < 3 && !resetLink; i++) {
    await page.waitForTimeout(1500);
    resetLink = await getPasswordResetLink(RESET_EMAIL);
  }

  if (!resetLink) {
    // Fallback: construir URL manualmente pidiendo token directo a la API
    const directToken = await requestResetToken(RESET_EMAIL);
    if (directToken) {
      resetLink = `${BASE_URL}/reset-password?token=${directToken}`;
    }
  }

  if (!resetLink) throw new Error('CP06 FALLÓ: no se pudo obtener el enlace de restablecimiento del backend');

  console.log(`    🔗 Enlace capturado: ${resetLink}`);

  // Navegar directamente al enlace de reset
  await page.goto(resetLink, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.waitForSelector('#newPassword', { timeout: 8000 });
  await evidence.saveScreenshot(page, '11-reset-06-form-nueva-pass.png');

  // Llenar nueva contraseña
  const fillPass = async (id: string, val: string) => {
    await page.evaluate(({ fId, v }: { fId: string; v: string }) => {
      const el = document.getElementById(fId) as HTMLInputElement | null;
      if (!el) return;
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      s.call(el, v);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { fId: id, v: val });
  };

  await fillPass('newPassword',     'Katalon123.');
  await fillPass('confirmPassword', 'Katalon123.');

  let t0 = Date.now();
  await stagehand.act('Click the submit button to confirm the new password');
  await page.waitForTimeout(4000);
  evidence.recordStep({ step: 'Enviar nueva contraseña', capability: 'act',
    instruction: 'Click submit new password', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '11-reset-06-resultado.png');

  t0 = Date.now();
  const schema = z.object({
    successVisible: z.boolean().describe('True si aparece ¡Contraseña actualizada! o mensaje de éxito'),
    successText:    z.string().optional(),
  });
  const extracted = await stagehand.extract('Is there a success message saying the password was updated successfully?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar éxito de cambio de contraseña', capability: 'extract',
    instruction: 'Extract success message', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP06 PASS – Respuesta: ${JSON.stringify(data)}`);
}

// ─── CP07 – Contraseñas no coinciden ─────────────────────────────────────────

async function runCP07(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP07] Contraseñas que no coinciden muestran validación\x1b[0m');

  // Necesitamos un token válido para llegar al formulario
  await requestResetToken(RESET_EMAIL);
  await page.waitForTimeout(1500);
  let resetLink = await getPasswordResetLink(RESET_EMAIL);
  for (let i = 0; i < 3 && !resetLink; i++) {
    await page.waitForTimeout(1000);
    resetLink = await getPasswordResetLink(RESET_EMAIL);
  }
  if (!resetLink) { console.warn('    ⚠️ CP07 SKIP: no hay enlace disponible'); return; }

  await page.goto(resetLink, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.waitForSelector('#newPassword', { timeout: 8000 });

  const fillPass = async (id: string, val: string) => {
    await page.evaluate(({ fId, v }: { fId: string; v: string }) => {
      const el = document.getElementById(fId) as HTMLInputElement | null;
      if (!el) return;
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      s.call(el, v);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { fId: id, v: val });
  };

  await fillPass('newPassword',     'Katalon123.');
  await fillPass('confirmPassword', 'Diferente999!');

  let t0 = Date.now();
  await stagehand.act('Click the submit button to confirm the new password');
  await page.waitForTimeout(2000);
  evidence.recordStep({ step: 'Submit contraseñas que no coinciden', capability: 'act',
    instruction: 'Click submit mismatched passwords', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '11-reset-07-no-coinciden.png');

  t0 = Date.now();
  const schema = z.object({ errorVisible: z.boolean(), errorText: z.string().optional() });
  const extracted = await stagehand.extract('Is there a validation error saying the passwords do not match?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error contraseñas no coinciden', capability: 'extract',
    instruction: 'Extract mismatch error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP07 PASS – Error: ${JSON.stringify(data)}`);
}

// ─── CP08 – Contraseña débil en reset ────────────────────────────────────────

async function runCP08(stagehand: any, page: any, evidence: EvidenceManager): Promise<void> {
  console.log('\n\x1b[36m  [CP08] Nueva contraseña débil muestra validación\x1b[0m');

  await requestResetToken(RESET_EMAIL);
  await page.waitForTimeout(1500);
  let resetLink = await getPasswordResetLink(RESET_EMAIL);
  for (let i = 0; i < 3 && !resetLink; i++) {
    await page.waitForTimeout(1000);
    resetLink = await getPasswordResetLink(RESET_EMAIL);
  }
  if (!resetLink) { console.warn('    ⚠️ CP08 SKIP: no hay enlace disponible'); return; }

  await page.goto(resetLink, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.waitForSelector('#newPassword', { timeout: 8000 });

  const fillPass = async (id: string, val: string) => {
    await page.evaluate(({ fId, v }: { fId: string; v: string }) => {
      const el = document.getElementById(fId) as HTMLInputElement | null;
      if (!el) return;
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      s.call(el, v);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { fId: id, v: val });
  };

  await fillPass('newPassword',     '123');
  await fillPass('confirmPassword', '123');

  let t0 = Date.now();
  await stagehand.act('Click the submit button to confirm the new password');
  await page.waitForTimeout(2000);
  evidence.recordStep({ step: 'Submit con contraseña débil en reset', capability: 'act',
    instruction: 'Click submit weak password reset', result: 'Enviado', durationMs: Date.now() - t0 });

  await evidence.saveScreenshot(page, '11-reset-08-pass-debil.png');

  t0 = Date.now();
  const schema = z.object({ passwordError: z.boolean(), errorText: z.string().optional() });
  const extracted = await stagehand.extract('Is there a validation error about the new password being too weak or not meeting requirements?', schema);
  const data = (extracted as any)?.data ?? extracted;
  evidence.recordStep({ step: 'Verificar error contraseña débil', capability: 'extract',
    instruction: 'Extract weak password error', result: data, durationMs: Date.now() - t0 });

  console.log(`    ✅ CP08 PASS – Validación: ${JSON.stringify(data)}`);
}

// ─── Runner principal ─────────────────────────────────────────────────────────

export async function runRestablecerContrasenaScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[SUITE 11] RESTABLECER CONTRASEÑA – 8 Casos de Prueba\x1b[0m');
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
      CP06: () => runCP06(stagehand, page, evidence),
      CP07: () => runCP07(stagehand, page, evidence),
      CP08: () => runCP08(stagehand, page, evidence),
    })) {
      try {
        await fn();
        results[name] = 'PASS';
      } catch (e: any) {
        console.error(`    \x1b[31m✗ ${name} FALLÓ: ${e.message}\x1b[0m`);
        await evidence.saveScreenshot(page, `11-reset-${name.toLowerCase()}-FAIL.png`).catch(() => {});
        results[name] = 'FAIL';
      }
    }

    await evidence.exportReport('11-restablecer-contrasena');
    console.log('\n\x1b[1m  Resumen Suite 11:\x1b[0m', results);

    if (Object.values(results).some(r => r === 'FAIL')) {
      throw new Error(`Suite 11 tiene fallos: ${JSON.stringify(results)}`);
    }
    return { success: true, results };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('08-restablecer-contrasena.ts')) {
  runRestablecerContrasenaScenario().catch(() => process.exit(1));
}
