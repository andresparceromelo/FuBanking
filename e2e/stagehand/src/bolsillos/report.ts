import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import type { z } from 'zod';

import { ClaudeSession, MODEL_NAME } from './claude.config.js';

export const EVIDENCE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../evidence/bolsillos');

type Capability = 'act' | 'observe' | 'extract';

interface AiStep {
  capability: Capability;
  instruction: string;
  output: unknown;
  inputTokens?: number;
  outputTokens?: number;
  durationMs: number;
}

interface Check {
  description: string;
  expected: unknown;
  obtained: unknown;
  passed: boolean;
}

export interface ScenarioResult {
  id: string;
  functionality: string;
  objective: string;
  expected: string;
  obtained: string;
  status: 'APROBADO' | 'FALLIDO';
  model: string;
  durationMs: number;
  steps: AiStep[];
  checks: Check[];
  screenshots: string[];
  error?: string;
}

const usageOf = (result: unknown) => (result as { metadata?: { usage?: { inputTokens?: number; outputTokens?: number } } })?.metadata?.usage;

/**
 * Registra un escenario de Stagehand con lo que pide el informe: objetivo,
 * resultado esperado, resultado obtenido y evidencias. Cada llamada a la IA
 * (act / observe / extract) queda con su instrucción, salida y tokens; cada
 * validación, con el valor esperado y el obtenido.
 */
export class Scenario {
  private readonly steps: AiStep[] = [];
  private readonly checks: Check[] = [];
  private readonly screenshots: string[] = [];
  private readonly startedAt = Date.now();

  constructor(
    private readonly session: ClaudeSession,
    readonly id: string,
    readonly functionality: string,
    readonly objective: string,
    readonly expected: string,
  ) {
    console.log(`\n\x1b[1m\x1b[35m[${id}] ${functionality}\x1b[0m — ${objective}`);
  }

  private async track<T>(capability: Capability, instruction: string, run: () => Promise<T>, output: (result: T) => unknown): Promise<T> {
    const t0 = Date.now();
    const result = await run();
    const usage = usageOf(result);
    const step = {
      capability,
      instruction,
      output: output(result),
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      durationMs: Date.now() - t0,
    };
    this.steps.push(step);
    console.log(`  \x1b[32m✓ ${capability.toUpperCase()}\x1b[0m ${instruction} \x1b[33m(${step.durationMs} ms)\x1b[0m`);
    return result;
  }

  /** `act`: la IA ejecuta una acción descrita en lenguaje natural (o una acción ya observada). */
  async act(instruction: string | Awaited<ReturnType<ClaudeSession['stagehand']['observe']>>['data'][number]) {
    const label = typeof instruction === 'string' ? instruction : `(acción observada) ${instruction.description}`;
    const result = await this.track('act', label,
      () => typeof instruction === 'string'
        ? this.session.stagehand.act(instruction)
        : this.session.stagehand.act(instruction),
      r => r.data.message);
    if (!result.data.success) {
      throw new Error(`act no pudo completar "${label}": ${result.data.message}`);
    }
    return result;
  }

  /** `observe`: la IA descubre en el DOM los elementos que cumplen la descripción. */
  async observe(instruction: string) {
    const result = await this.track('observe', instruction,
      () => this.session.stagehand.observe(instruction),
      r => r.data.map(action => action.description));
    return result.data;
  }

  /** `extract`: la IA lee la pantalla y devuelve datos con el esquema Zod indicado. */
  async extract<S extends z.ZodType>(instruction: string, schema: S): Promise<z.infer<S>> {
    const result = await this.track('extract', instruction,
      () => this.session.stagehand.extract(instruction, schema),
      r => r.data);
    return result.data as z.infer<S>;
  }

  /** Validación determinista: falla el escenario si lo obtenido no es lo esperado. */
  verify(description: string, expected: unknown, obtained: unknown) {
    const passed = isDeepStrictEqual(expected, obtained);
    this.checks.push({ description, expected, obtained, passed });
    const mark = passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${mark} ${description}: esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(obtained)}`);
    if (!passed) {
      throw new Error(`${description}: esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(obtained)}`);
    }
  }

  async screenshot(name: string) {
    await mkdir(EVIDENCE_DIR, { recursive: true });
    const file = `${this.id}-${name}.png`;
    await writeFile(join(EVIDENCE_DIR, file), await this.session.page.screenshot({ fullPage: true }));
    this.screenshots.push(file);
  }

  async finish(error?: unknown): Promise<ScenarioResult> {
    if (error) {
      await this.screenshot('fallo').catch(() => undefined);
    }
    const passedChecks = this.checks.filter(check => check.passed).length;
    const result: ScenarioResult = {
      id: this.id,
      functionality: this.functionality,
      objective: this.objective,
      expected: this.expected,
      obtained: error
        ? `Falló: ${(error as Error).message}`
        : `${passedChecks}/${this.checks.length} validaciones correctas`,
      status: error ? 'FALLIDO' : 'APROBADO',
      model: MODEL_NAME,
      durationMs: Date.now() - this.startedAt,
      steps: this.steps,
      checks: this.checks,
      screenshots: this.screenshots,
      error: error ? (error as Error).message : undefined,
    };
    await mkdir(EVIDENCE_DIR, { recursive: true });
    await writeFile(join(EVIDENCE_DIR, `${this.id}-report.json`), JSON.stringify(result, null, 2), 'utf8');
    return result;
  }
}
