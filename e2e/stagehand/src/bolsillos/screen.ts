import { z } from 'zod';

import { ClaudeSession, WEB_URL } from './claude.config.js';

/**
 * Esperas deterministas (sin IA) para no darle a la IA una pantalla a medio
 * cargar. Las acciones y lecturas de negocio sí las hace Stagehand.
 */
export async function openPockets({ page }: ClaudeSession) {
  await page.goto(`${WEB_URL}/pockets`, { waitUntil: 'networkidle' });
  // La cuenta se carga de forma asíncrona; sin ella el formulario no deja crear.
  await page.waitForFunction(() => (document.querySelector('#account-select') as HTMLSelectElement | null)?.value !== '', undefined, { timeout: 30_000 });
}

export async function openAccounts({ page }: ClaudeSession) {
  await page.goto(`${WEB_URL}/accounts`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="deposit-button"]', { timeout: 30_000 });
}

export const waitForPocketCards = ({ page }: ClaudeSession, count: number) =>
  page.waitForFunction((n: number) => document.querySelectorAll('[data-testid="pocket-card"]').length === n, count, { timeout: 15_000 });

/** ¿Apareció el toast con este título? Los toasts duran 4 s: se mira sin IA. */
export async function sawToast({ page }: ClaudeSession, title: string): Promise<boolean> {
  try {
    await page.waitForFunction(
      (t: string) => [...document.querySelectorAll('[data-testid="toast-title"]')].some(el => el.textContent?.trim() === t),
      title,
      { timeout: 15_000 },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * El toast sale antes de que la lista se recargue: se espera a que la tarjeta
 * muestre el monto nuevo antes de pedirle a la IA que lea la pantalla. Si no
 * cambia en 15 s se sigue igual y el `extract` deja la falla en evidencia.
 */
export async function waitForPocketAmount({ page }: ClaudeSession, name: string, amount: number) {
  await page.waitForFunction(
    ({ n, a }: { n: string; a: number }) => [...document.querySelectorAll('[data-testid="pocket-card"]')].some(card =>
      card.querySelector('[data-testid="pocket-card-name"]')?.textContent?.trim() === n
      && Number((card.querySelector('[data-testid="pocket-card-amount"]')?.textContent ?? '').replaceAll(/[^\d-]/g, '')) === a),
    { n: name, a: amount },
    { timeout: 15_000 },
  ).catch(() => undefined);
}

/** Igual que `waitForPocketAmount`, para el saldo de la tarjeta de cuenta. */
export async function waitForAccountBalance({ page }: ClaudeSession, balance: number) {
  await page.waitForFunction(
    (b: number) => Number((document.querySelector('[data-testid="account-balance"]')?.textContent ?? '').replaceAll(/[^\d-]/g, '')) === b,
    balance,
    { timeout: 15_000 },
  ).catch(() => undefined);
}

/** Esquema para `extract` de la lista "Bolsillos actuales". */
export const PocketsOnScreen = z.object({
  pockets: z.array(z.object({
    name: z.string().describe('Nombre del bolsillo exactamente como aparece en su tarjeta'),
    amount: z.number().describe('Saldo del bolsillo como número entero en pesos, sin "$" ni separadores de miles'),
  })),
});

export const byName = (pockets: Array<{ name: string; amount: number }>) =>
  pockets.map(({ name, amount }) => ({ name, amount })).sort((a, b) => a.name.localeCompare(b.name));
