import { writeFile } from 'node:fs/promises';
import { join }       from 'node:path';

// ── Escenarios originales (créditos) ────────────────────────────────────────
import { runLoansSimulatorScenario }      from './scenarios/01-loans-simulator.js';
import { runLoansRequirementsScenario }   from './scenarios/02-loans-requirements.js';
import { runAdminApprovalScenario }       from './scenarios/03-admin-approval.js';

// ── Escenarios nuevos (funcionalidades solicitadas) ──────────────────────────
import { runLoginScenario }               from './scenarios/04-login.js';
import { runLogin2FAScenario }            from './scenarios/05-login-2fa.js';
import { runRegistroScenario }            from './scenarios/06-registro.js';
import { runEditarPerfilScenario }        from './scenarios/07-editar-perfil.js';
import { runRestablecerContrasenaScenario } from './scenarios/08-restablecer-contrasena.js';
import { runRetiroScenario }              from './scenarios/09-retiro.js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ScenarioResult {
  name:       string;
  status:     'PASSED' | 'FAILED';
  error?:     string;
  durationMs: number;
}

// ─── Definición de la suite completa ─────────────────────────────────────────

const SUITES: Array<{ label: string; fn: () => Promise<any> }> = [
  // Créditos (existentes)
  { label: 'Escenario 1 (act+extract): Simulador de Créditos',        fn: runLoansSimulatorScenario },
  { label: 'Escenario 2 (observe): Requisitos de Elegibilidad',       fn: runLoansRequirementsScenario },
  { label: 'Escenario 3 (act+observe+extract): Auditoría Admin',      fn: runAdminApprovalScenario },
  // Funcionalidades nuevas
  { label: 'Suite 09 – Inicio de Sesión sin 2FA (5 CPs)',             fn: runLoginScenario },
  { label: 'Suite 10 – Inicio de Sesión con 2FA (5 CPs)',             fn: runLogin2FAScenario },
  { label: 'Suite 08 – Registro de Usuarios (4 CPs)',                 fn: runRegistroScenario },
  { label: 'Suite 12 – Editar Perfil (5 CPs)',                        fn: runEditarPerfilScenario },
  { label: 'Suite 11 – Restablecer Contraseña (8 CPs)',               fn: runRestablecerContrasenaScenario },
  { label: 'Suite 13 – Retiros de Dinero (4 CPs)',                    fn: runRetiroScenario },
];

// ─── Función principal ────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m\x1b[35m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m     FUBANKING – SUITE COMPLETA E2E CON STAGEHAND + GEMINI (Flash)      \x1b[0m');
  console.log('\x1b[1m\x1b[35m        6 Funcionalidades · 31 Casos de Prueba · act/observe/extract     \x1b[0m');
  console.log('\x1b[1m\x1b[35m========================================================================\x1b[0m\n');

  const overallResults: ScenarioResult[] = [];
  const globalStart = Date.now();

  for (const suite of SUITES) {
    const tStart = Date.now();
    try {
      await suite.fn();
      overallResults.push({ name: suite.label, status: 'PASSED', durationMs: Date.now() - tStart });
    } catch (err: any) {
      overallResults.push({ name: suite.label, status: 'FAILED', error: err.message, durationMs: Date.now() - tStart });
    }
  }

  const totalDuration = Date.now() - globalStart;

  // ── Resumen en consola ────────────────────────────────────────────────────
  console.log('\n\x1b[1m\x1b[34m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[34m                   RESUMEN GLOBAL DE EJECUCIÓN STAGEHAND                   \x1b[0m');
  console.log('\x1b[1m\x1b[34m========================================================================\x1b[0m');

  let passed = 0; let failed = 0;
  for (const res of overallResults) {
    const badge = res.status === 'PASSED' ? '\x1b[32m[PASSED]\x1b[0m' : '\x1b[31m[FAILED]\x1b[0m';
    console.log(`${badge} ${res.name} (\x1b[33m${res.durationMs}ms\x1b[0m)`);
    if (res.error) console.log(`         \x1b[31mError: ${res.error}\x1b[0m`);
    res.status === 'PASSED' ? passed++ : failed++;
  }

  console.log(`\nPASS: \x1b[32m${passed}\x1b[0m  FAIL: \x1b[31m${failed}\x1b[0m  Tiempo Total: \x1b[33m${(totalDuration / 1000).toFixed(2)}s\x1b[0m`);

  // ── Generar reporte Markdown ──────────────────────────────────────────────
  const rows = overallResults.map((r, i) =>
    `| ${i + 1} | ${r.name} | ${r.status === 'PASSED' ? '✅ APROBADO' : '❌ FALLIDO'} | ${(r.durationMs / 1000).toFixed(2)}s |`
  ).join('\n');

  const markdownReport = `# Informe de Ejecución – Pruebas E2E con Stagehand + Gemini

**Proyecto**: FuBanking  
**Fecha de Ejecución**: ${new Date().toLocaleString('es-CO')}  
**Modelo LLM**: ${process.env.FAST_MODEL ?? 'gemini-flash-lite-latest'} (Google Gemini) · Modo: \`LLM_PROVIDER=gemini\`  
**Modo de Visualización**: Headless (\`HEADLESS=true\`) / Interactivo (\`HEADLESS=false\`)

---

## Resumen

| Métrica | Valor |
|---|---|
| Total Suites | ${overallResults.length} |
| Aprobadas | ${passed} |
| Fallidas | ${failed} |
| Tiempo Total | ${(totalDuration / 1000).toFixed(2)}s |

---

## Resultados por Suite

| # | Suite | Estado | Duración |
|---|---|---|---|
${rows}

---

## Funcionalidades Cubiertas

| Suite | Funcionalidad | CPs |
|---|---|---|
| 09 | Inicio de Sesión sin 2FA | 5 |
| 10 | Inicio de Sesión con 2FA | 5 |
| 08 | Registro de Usuarios | 4 |
| 12 | Editar Perfil | 5 |
| 11 | Restablecer Contraseña | 8 |
| 13 | Retiros de Dinero | 4 |
| Créditos | Simulador + Requisitos + Admin | 3 |

---

## Estrategia de Automatización

\`\`\`txt
LLM Backend     : Google Gemini (gemini-flash-lite-latest) via model-routing
Stagehand act   : Interacciones por lenguaje natural (click, type, submit)
Stagehand observe: Descubrimiento semántico de elementos en el DOM
Stagehand extract: Extracción estructurada con esquemas Zod para validaciones

Código 2FA      : Capturado del endpoint /api/v1/auth/test-helper/latest-2fa
Enlace Reset    : Capturado del endpoint /api/v1/auth/test-helper/latest-reset-link
\`\`\`
`;

  const cwd = process.cwd();
  const evidenceDir = cwd.endsWith('stagehand')
    ? join(cwd, 'evidence')
    : join(cwd, 'e2e/stagehand/evidence');

  const reportFile = join(evidenceDir, 'EVIDENCIA_STAGEHAND.md');
  await writeFile(reportFile, markdownReport, 'utf8');
  console.log(`\n📄 Reporte generado: \x1b[36m${reportFile}\x1b[0m\n`);

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Error fatal al ejecutar suite de Stagehand:', err);
  process.exit(1);
});
