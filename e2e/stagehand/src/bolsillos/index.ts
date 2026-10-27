import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { MODEL_NAME } from './claude.config.js';
import { EVIDENCE_DIR, ScenarioResult } from './report.js';
import { runScenario, scenarios } from './scenarios.js';

/**
 * Suite Stagehand de Bolsillos (5 funcionalidades) y Depositar.
 *   npm run test:stagehand:bolsillos              → los 6 escenarios (desde la raíz)
 *   npm run test:stagehand:bolsillos -- B03 D06   → solo los indicados (por id parcial)
 *
 * El resumen Markdown se arma con TODOS los reportes de evidence/bolsillos, así
 * que repetir unos escenarios no borra el resultado de los demás.
 */
const filters = process.argv.slice(2).map(arg => arg.toUpperCase());
const selected = filters.length
  ? scenarios.filter(scenario => filters.some(filter => scenario.id.includes(filter)))
  : scenarios;

const capabilitiesOf = (result: ScenarioResult) =>
  [...new Set(result.steps.map(step => `\`${step.capability}\``))].join(' + ');

const tokensOf = (result: ScenarioResult) =>
  result.steps.reduce((sum, step) => sum + (step.inputTokens ?? 0) + (step.outputTokens ?? 0), 0);

async function allReports(): Promise<ScenarioResult[]> {
  const files = (await readdir(EVIDENCE_DIR)).filter(file => /^SH-.*-report\.json$/.test(file)).sort();
  return Promise.all(files.map(async file => JSON.parse(await readFile(join(EVIDENCE_DIR, file), 'utf8')) as ScenarioResult));
}

function markdown(results: ScenarioResult[]): string {
  const passed = results.filter(result => result.status === 'APROBADO').length;
  const totalMs = results.reduce((sum, result) => sum + result.durationMs, 0);
  const rows = results.map(result =>
    `| ${result.id} | ${result.functionality} | \`${result.model}\` | ${capabilitiesOf(result)} | ${result.checks.filter(c => c.passed).length}/${result.checks.length} | ${result.status === 'APROBADO' ? '✅ APROBADO' : '❌ FALLIDO'} | ${(result.durationMs / 1000).toFixed(1)} s | ${tokensOf(result).toLocaleString('es-CO')} |`);

  const details = results.map(result => [
    `### ${result.id} — ${result.functionality}`,
    '',
    `- **Objetivo:** ${result.objective}`,
    `- **Resultado esperado:** ${result.expected}`,
    `- **Resultado obtenido:** ${result.obtained}`,
    `- **Estado:** ${result.status}`,
    `- **Evidencias:** ${result.screenshots.map(file => `\`${file}\``).join(', ')} y \`${result.id}-report.json\``,
    '',
    '| Validación | Esperado | Obtenido | ✓ |',
    '|---|---|---|---|',
    ...result.checks.map(check => `| ${check.description} | \`${JSON.stringify(check.expected)}\` | \`${JSON.stringify(check.obtained)}\` | ${check.passed ? '✅' : '❌'} |`),
    '',
  ].join('\n'));

  return [
    '# Evidencia Stagehand — Bolsillos y Depositar',
    '',
    `**Fecha de ejecución:** ${new Date().toLocaleString('es-CO')}  `,
    `**Resultado:** ${passed}/${results.length} escenarios aprobados en ${(totalMs / 1000).toFixed(1)} s  `,
    '**Oráculo:** cada acción de la IA se comprueba contra la API real del backend (saldo y bolsillos).',
    '',
    '| Id | Funcionalidad | Modelo | Capacidades | Validaciones | Estado | Duración | Tokens |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Detalle por escenario',
    '',
    ...details,
  ].join('\n');
}

async function main() {
  console.log('\n\x1b[1m\x1b[35m=== FuBanking · Stagehand + Claude · Bolsillos y Depositar ===\x1b[0m');
  console.log(`Modelo: ${MODEL_NAME} · escenarios: ${selected.map(s => s.id).join(', ')}`);

  const results: ScenarioResult[] = [];
  for (const scenario of selected) {
    results.push(await runScenario(scenario));
  }

  await mkdir(EVIDENCE_DIR, { recursive: true });
  const reportFile = join(EVIDENCE_DIR, 'EVIDENCIA_STAGEHAND_BOLSILLOS.md');
  await writeFile(reportFile, markdown(await allReports()), 'utf8');

  console.log('\n\x1b[1mResumen\x1b[0m');
  for (const result of results) {
    const badge = result.status === 'APROBADO' ? '\x1b[32m[APROBADO]\x1b[0m' : '\x1b[31m[FALLIDO]\x1b[0m';
    console.log(`${badge} ${result.id} ${result.functionality} — ${result.obtained}`);
  }
  console.log(`\nEvidencias en ${EVIDENCE_DIR}`);

  if (results.some(result => result.status === 'FALLIDO')) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error fatal en la suite de Stagehand:', error);
  process.exit(1);
});
