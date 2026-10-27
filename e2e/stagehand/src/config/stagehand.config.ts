import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config();

import { Stagehand, localBrowser } from '@browserbasehq/stagehand';
import { createGeminiRouterClient }  from './modelRouter.js';
import { createOllamaClient }        from './ollamaClient.js';

export interface StagehandContext {
  stagehand: Stagehand;
  browser:   any;
  page:      any;
  baseUrl:   string;
}

/**
 * Crea una sesión de Stagehand (compatible con Stagehand v4.3+).
 *
 * Selección de LLM (por orden de prioridad):
 *   1. Si LLM_PROVIDER=ollama  → Ollama local (qwen3.5:4b por defecto)
 *   2. Si GEMINI_API_KEY existe → Google Gemini con model-routing
 *   3. Fallback explícito → lanza error indicando la variable faltante
 *
 * API Stagehand v4.3:
 *   - localBrowser.launch({ headless, viewport }) → browserHandle
 *   - Stagehand.create({ browser: browserHandle, model: clienteLLM })
 *   - stagehand.browser.context.activePage() → Page de Playwright
 */
export async function createStagehandSession(): Promise<StagehandContext> {
  const isHeadless = process.env.HEADLESS === 'true';
  const baseUrl    = process.env.BASE_URL ?? 'http://localhost:3000';
  const provider   = (process.env.LLM_PROVIDER ?? '').toLowerCase();

  console.log(`\n\x1b[35m=== Iniciando Sesión de Stagehand v4.3 (Headless: ${isHeadless}) ===\x1b[0m`);
  console.log(`URL Base FuBanking: \x1b[34m${baseUrl}\x1b[0m`);

  // ── Selección del cliente LLM ────────────────────────────────────────────
  let modelClient: any;

  if (provider === 'ollama') {
    console.log('\x1b[33m[LLM]\x1b[0m Usando Ollama local');
    modelClient = createOllamaClient();
  } else if (process.env.GEMINI_API_KEY) {
    console.log('\x1b[33m[LLM]\x1b[0m Usando Google Gemini (model routing)');
    modelClient = createGeminiRouterClient();
  } else {
    throw new Error(
      'No se ha configurado ningún LLM. ' +
      'Establece LLM_PROVIDER=ollama o define GEMINI_API_KEY en e2e/stagehand/.env'
    );
  }

  // ── Inicializar navegador (Stagehand v4.3 API) ───────────────────────────
  // localBrowser.launch() devuelve un BrowserHandle con: context, close()
  const browser = await localBrowser.launch({
    headless: isHeadless,
    viewport: { width: 1280, height: 720 },
  });

  // ── Crear instancia de Stagehand ─────────────────────────────────────────
  // Stagehand.create({ browser: BrowserHandle, model: clienteLLM })
  const stagehand = await Stagehand.create({
    browser,
    model:      modelClient,
  } as any);

  // ── Obtener la página activa del contexto ─────────────────────────────────
  // En v4.3: stagehand.browser.context.activePage() → Page
  // stagehand.browser.context.pages() no existe; usamos activePage
  const page = await stagehand.browser.context.activePage();

  return { stagehand, browser, page, baseUrl };
}
