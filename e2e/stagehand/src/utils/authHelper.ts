/**
 * Helpers de autenticación para pruebas Stagehand.
 *
 * loginViaUI          → hace login real mediante la interfaz de usuario
 * loginViaUIWith2FA   → login con 2FA: captura el código del backend y lo ingresa
 * injectAuthTokens    → inyecta token JWT directamente en cookies/localStorage (bypass UI)
 * get2FACode          → consulta el endpoint test-helper para obtener el último código 2FA
 * getPasswordResetLink→ consulta el endpoint test-helper para obtener el último enlace de reset
 */

import { readFileSync } from 'node:fs';
import { join }         from 'node:path';
import jwt              from 'jsonwebtoken';

// ─── JWT helper ───────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  try {
    const envPath = join(process.cwd(), 'backend/.env');
    const content = readFileSync(envPath, 'utf8');
    const match   = content.match(/JWT_SECRET\s*=\s*([^\r\n]+)/);
    if (match?.[1]) return match[1].trim();
  } catch { /* ignorar */ }
  return 'super-secret-jwt-key-for-development-32-chars-min';
}

export function generateToken(user: { id: string; email: string; role: 'client' | 'admin' }): string {
  const secret = getJwtSecret();
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret, { expiresIn: '2h' });
}

// ─── Usuarios de prueba ───────────────────────────────────────────────────────

export const TEST_USERS = {
  client: {
    id:       'u-client-gabriel-001',
    email:    'bedoyacanoandres2@gmail.com',
    role:     'client' as const,
    fullName: 'Gabriel Cliente',
  },
  // Usuario con 2FA habilitado (mail: katalonfa@gmail.com)
  client2FA: {
    id:       'u-client-2fa-001',
    email:    'katalonfa@gmail.com',
    role:     'client' as const,
    fullName: 'Katalon 2FA',
  },
  // Usuario para pruebas de contraseña
  resetUser: {
    id:       'u-client-reset-001',
    email:    'pruebaskatalon2@gmail.com',
    role:     'client' as const,
    fullName: 'Katalon Reset',
  },
  // Usuario principal pruebas (sin 2FA)
  katalon: {
    id:       'u-client-katalon-001',
    email:    'pruebaskatalon@gmail.com',
    role:     'client' as const,
    fullName: 'Katalon Test',
  },
  admin: {
    id:       'u-admin-andresito-001',
    email:    'bedoyacanoandres@gmail.com',
    role:     'admin' as const,
    fullName: 'Andresito Administrador',
  },
};

// ─── Inyección directa de token (bypass UI) ───────────────────────────────────

export async function authenticateBrowserContext(
  page: any,
  user: { id: string; email: string; role: 'client' | 'admin'; fullName?: string } = TEST_USERS.client
) {
  const token = generateToken(user);

  const userPayload = {
    id:                 user.id,
    email:              user.email,
    firstName:          user.role === 'admin' ? 'Andresito' : 'Gabriel',
    middleName:         null,
    lastName:           user.role === 'admin' ? 'Administrador' : 'Cliente',
    secondLastName:     null,
    fullName:           user.fullName,
    document:           user.role === 'admin' ? '9988776655' : '1020304050',
    documentVerified:   true,
    documentVerifiedAt: new Date().toISOString(),
    birthDate:          '1995-05-15',
    phone:              '3001234567',
    avatarUrl:          null,
    monthlyIncome:      4500000,
    isActive:           true,
    twoFactorEnabled:   false,
    role:               user.role,
    createdAt:          new Date().toISOString(),
    requiresTwoFactor:  false,
  };

  // Cookie
  const ctx = page.context?.() ?? page?.browser?.context ?? null;
  if (ctx && typeof ctx.addCookies === 'function') {
    await ctx.addCookies([{
      name:     'token',
      value:    token,
      domain:   'localhost',
      path:     '/',
      httpOnly: false,
      secure:   false,
      sameSite: 'Lax' as const,
    }]);
  }

  // localStorage vía init script
  await page.addInitScript(
    ({ t, u }: { t: string; u: any }) => {
      try {
        window.localStorage.setItem('token', t);
        window.localStorage.setItem('user',  JSON.stringify(u));
      } catch { /* ignorar */ }
    },
    { t: token, u: userPayload }
  );

  return token;
}

// ─── Login real por UI (para pruebas de login) ────────────────────────────────

export async function loginViaUI(
  page: any,
  email:    string,
  password: string,
  baseUrl:  string,
  stagehand?: any,
): Promise<void> {
  // Limpiar sesión previa
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch { /* ignorar */ }
  });

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('form[data-hydrated]', { timeout: 8000 });
  } catch {
    await page.waitForSelector('form', { timeout: 5000 });
  }
  await page.waitForTimeout(600);

  // Rellenar email vía native setter (compatible con React controlado)
  await page.evaluate((em: string) => {
    const el = document.getElementById('email') as HTMLInputElement | null;
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, em);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, email);

  await page.evaluate((pw: string) => {
    const el = document.getElementById('password') as HTMLInputElement | null;
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, pw);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, password);

  if (stagehand) {
    await stagehand.act('Click the Continuar submit button');
  } else {
    try {
      if (typeof page.click === 'function') {
        await page.click('button[type="submit"]');
      } else {
        await page.evaluate(() => {
          const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (btn) btn.click();
        });
      }
    } catch {
      await page.evaluate(() => {
        const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (btn) btn.click();
      });
    }
  }
  await page.waitForTimeout(3000);
}

// ─── Backend test-helpers ─────────────────────────────────────────────────────

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

/** Obtiene el último código 2FA generado para un email (endpoint test-helper). */
export async function get2FACode(email: string): Promise<string | null> {
  try {
    const res  = await fetch(`${API_URL}/auth/test-helper/latest-2fa?email=${encodeURIComponent(email)}`);
    const body = await res.json() as any;
    return body?.data?.code ?? null;
  } catch {
    return null;
  }
}

/** Obtiene el último enlace de restablecimiento de contraseña generado. */
export async function getPasswordResetLink(email: string): Promise<string | null> {
  try {
    const res  = await fetch(`${API_URL}/auth/test-helper/latest-reset-link?email=${encodeURIComponent(email)}`);
    const body = await res.json() as any;
    return body?.data?.resetLink ?? null;
  } catch {
    return null;
  }
}

/** Llena los 6 inputs OTP en la página a partir de un código de 6 dígitos activando el estado de React. */
export async function fillOTPInputs(page: any, code: string): Promise<void> {
  await page.evaluate((otp: string) => {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[autocomplete="one-time-code"]')
    );
    if (inputs.length < 6) return;
    for (let i = 0; i < 6; i++) {
      const input = inputs[i];
      const prev = input.value;
      input.value = otp[i] ?? '0';
      const tracker = (input as any)._valueTracker;
      if (tracker) {
        tracker.setValue(prev);
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, code);
}

/** Obtiene la URL actual del navegador de forma segura como string (compatible con objetos URL y Promesas de Stagehand v4) */
export async function getUrlString(page: any): Promise<string> {
  try {
    const raw = typeof page.url === 'function' ? page.url() : page.url;
    const resolved = (raw && typeof raw.then === 'function') ? await raw : raw;
    return typeof resolved === 'string' ? resolved : (resolved?.href ?? String(resolved ?? ''));
  } catch {
    return '';
  }
}
