/**
 * Reescribe las rutas de los reportes LCOV para que sean relativas a la RAÍZ
 * del monorepo (backend/src/...) y con barras normales (/). Así SonarCloud, que
 * corre desde la raíz, encuentra los archivos y mapea la cobertura.
 *
 * Procesa los dos reportes que puede haber en el backend:
 *   - coverage-bolsillos/lcov.info  (c8, módulo Bolsillos)
 *   - coverage/lcov.info            (Vitest, resto de módulos)
 *
 * Es idempotente: si una ruta ya empieza por "backend/", la deja igual.
 *
 *   node scripts/normalize-lcov.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REPORTES = ['coverage-bolsillos/lcov.info', 'coverage/lcov.info'];

/** Deja cualquier ruta como backend/src/... relativa a la raíz del repo. */
function normalizar(ruta) {
  const s = ruta.replace(/\\/g, '/');
  const i = s.indexOf('/backend/');
  if (i !== -1) return s.slice(i + 1); // absoluta -> backend/...
  if (s.startsWith('backend/')) return s; // ya normalizada
  const j = s.indexOf('src/');
  if (j !== -1) return `backend/${s.slice(j)}`; // relativa a backend
  return s;
}

let algo = false;
for (const archivo of REPORTES) {
  if (!existsSync(archivo)) continue;
  algo = true;
  let n = 0;
  const contenido = readFileSync(archivo, 'utf8').replace(/^SF:(.*)$/gm, (_m, r) => {
    n += 1;
    return `SF:${normalizar(r)}`;
  });
  writeFileSync(archivo, contenido, 'utf8');
  console.log(`LCOV normalizado: ${archivo} (${n} rutas -> backend/src/...)`);
}

if (!algo) {
  console.error('No se encontró ningún LCOV. Genera cobertura primero (test:coverage / test:coverage:bolsillos).');
  process.exit(1);
}
