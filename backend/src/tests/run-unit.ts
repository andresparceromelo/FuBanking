/**
 * Ejecutor de las pruebas unitarias del módulo Bolsillos.
 *
 *   npm run test:unit
 *
 * Parte A — unidades sin dependencias (entidades y schemas). No tocan nada
 * externo: no hay red, ni base de datos, ni dobles.
 *
 * Parte B — los cinco casos de uso, construidos con los repositorios Supabase
 * reales. Monta su propio escenario, lo ejercita y lo borra al terminar.
 *
 * No aborta en el primer fallo: ejecuta todos los casos, registra el resultado
 * de cada uno y deja los entregables:
 *
 *   - `docs/registro-pruebas-unitarias-bolsillos.md`   → documento de la corrida
 *   - `docs/registro-pruebas-unitarias-bolsillos.json` → datos crudos
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ejecutarAccountEntity } from './unit/account.entity';
import { ejecutarPocketEntity } from './unit/pocket.entity';
import { ejecutarPocketValidators } from './unit/pocket.validators';
import { ejecutarCasosDeUso } from './unit/pocket.use-cases';
import {
  Escenario,
  ResultadoLimpieza,
  desmontarEscenario,
  montarEscenario,
} from './unit/support/fixtures';
import { generarHtml, generarMarkdown } from './unit/support/reporte';
import { obtenerResultados, resumir } from './unit/support/runner';

const DIRECTORIO_DOCS = join(__dirname, '..', '..', '..', 'docs');
const ARCHIVO_MD = join(DIRECTORIO_DOCS, 'registro-pruebas-unitarias-bolsillos.md');
const ARCHIVO_HTML = join(DIRECTORIO_DOCS, 'registro-pruebas-unitarias-bolsillos.html');
const ARCHIVO_JSON = join(DIRECTORIO_DOCS, 'registro-pruebas-unitarias-bolsillos.json');

/** Fecha local en formato YYYY-MM-DD, sin desfase por UTC. */
function fechaLocal(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/** Identifica la versión probada a partir del commit actual. */
function versionDelSistema(): string {
  try {
    const rama = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return `${rama}-${commit}`;
  } catch {
    return 'desconocida';
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('PARTE A — unidades sin dependencias');
  await ejecutarPocketEntity();
  await ejecutarAccountEntity();
  await ejecutarPocketValidators();

  console.log('PARTE B — casos de uso con repositorios Supabase reales');
  let escenario: Escenario | null = null;
  let limpieza: ResultadoLimpieza | null = null;
  let notaParteB: string | null = null;

  try {
    escenario = await montarEscenario();
    console.log(`  escenario montado sobre el usuario ${escenario.correoUsuario}`);
    await ejecutarCasosDeUso(escenario);
  } catch (error: any) {
    const motivo = String(error?.message ?? error).replace(/\.\s*$/, '');
    notaParteB =
      `La Parte B no pudo completarse. ${motivo}. ` +
      'Los casos que alcanzaron a ejecutarse están registrados; los demás no aparecen en este documento.';
    console.error(`  ERROR en la Parte B: ${error?.message ?? error}`);
  } finally {
    if (escenario) {
      limpieza = await desmontarEscenario(escenario);
      console.log(
        `  limpieza: ${limpieza.bolsillos} bolsillos, ${limpieza.notificaciones} notificaciones, ` +
          `${limpieza.detalles} detalles, ${limpieza.cuentas} cuentas`,
      );
      if (limpieza.errores.length > 0) {
        console.error(`  ERRORES de limpieza: ${limpieza.errores.join(' | ')}`);
      }
    }
  }

  // ── Reporte ───────────────────────────────────────────────────────────────
  const casos = obtenerResultados();
  const resumen = resumir(casos);
  const meta = {
    fecha: fechaLocal(),
    version: versionDelSistema(),
    entorno: 'Backend (Node + tsx). Parte A en memoria; Parte B contra Supabase real.',
    usuario: escenario ? escenario.correoUsuario : 'no se montó el escenario',
    limpieza,
    notaParteB,
  };

  mkdirSync(DIRECTORIO_DOCS, { recursive: true });
  writeFileSync(ARCHIVO_MD, generarMarkdown(casos, meta), 'utf8');
  writeFileSync(ARCHIVO_HTML, generarHtml(casos, meta), 'utf8');
  writeFileSync(
    ARCHIVO_JSON,
    JSON.stringify({ ...meta, resumen, casos }, null, 2),
    'utf8',
  );

  // ── Salida por consola ────────────────────────────────────────────────────
  console.log('');
  let grupoActual = '';
  for (const c of casos) {
    if (c.grupo !== grupoActual) {
      grupoActual = c.grupo;
      console.log('');
      console.log(`── ${grupoActual} ${'─'.repeat(Math.max(0, 50 - grupoActual.length))}`);
    }
    const marca = c.estado === 'Aprobado' ? 'OK   ' : 'FALLA';
    console.log(`${marca} ${c.id.padEnd(10)} ${c.descripcion}`);
    if (c.estado === 'Fallido') {
      console.log(`      ↳ ${c.obtenido}${c.defecto ? `  [defecto ${c.defecto}]` : ''}`);
    }
  }

  console.log('');
  console.log(`Versión probada: ${meta.version}`);
  for (const [nombre, d] of Object.entries(resumen.porGrupo)) {
    console.log(
      `${nombre.padEnd(34)} ${d.aprobados}/${d.total} aprobados` +
        (d.fallidos ? `, ${d.fallidos} fallidos` : ''),
    );
  }
  console.log('');
  console.log(`TOTAL: ${resumen.aprobados}/${resumen.total} aprobados, ${resumen.fallidos} fallidos`);
  console.log(`Documento: ${ARCHIVO_MD}`);
  console.log(`Informe:   ${ARCHIVO_HTML}`);
  console.log(`Datos:     ${ARCHIVO_JSON}`);
}

main().catch((error) => {
  console.error('Error inesperado al ejecutar la suite:', error);
  process.exit(1);
});
