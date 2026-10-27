import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { localBrowser, Stagehand } from '@browserbasehq/stagehand';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../../.env') });
dotenv.config();

/**
 * Bolsillos y Depositar usan Claude (Anthropic) en vez del Model Routing con
 * Gemini de Créditos. Un solo modelo para act, observe y extract: el costo de
 * cada llamada queda en el reporte (tokens y tiempo de inferencia).
 */
export const MODEL_NAME = (process.env.STAGEHAND_MODEL ?? 'anthropic/claude-sonnet-5-5') as `anthropic/${string}` | `google/${string}`;
export const WEB_URL = process.env.BASE_URL ?? 'http://localhost:3000';
export const API_URL = (process.env.API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

/** Claude por defecto; con STAGEHAND_MODEL=google/... se usa Gemini (capa gratuita de Google AI Studio). */
const KEY_BY_PROVIDER = { anthropic: 'ANTHROPIC_API_KEY', google: 'GEMINI_API_KEY' } as const;

export async function createClaudeSession() {
  const keyName = KEY_BY_PROVIDER[MODEL_NAME.split('/')[0] as keyof typeof KEY_BY_PROVIDER];
  const apiKey = keyName && process.env[keyName];
  if (!apiKey) {
    throw new Error(`Falta ${keyName ?? 'la API key del proveedor'} para ${MODEL_NAME}: cópiala en e2e/stagehand/.env (ver .env.example)`);
  }

  const browser = await localBrowser.launch({
    headless: process.env.HEADLESS === 'true',
    viewport: { width: 1280, height: 800 },
  });
  const stagehand = await Stagehand.create({
    browser,
    model: { modelName: MODEL_NAME, apiKey },
    domSettleTimeoutMs: 2500,
  });
  const context = stagehand.browser.context;
  const page = (await context.pages())[0] ?? (await context.newPage());

  return { stagehand, browser, context, page };
}

export type ClaudeSession = Awaited<ReturnType<typeof createClaudeSession>>;
