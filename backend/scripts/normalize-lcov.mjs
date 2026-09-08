/**
 * Reescribe las rutas del reporte LCOV para que sean relativas a la RAÍZ del
 * monorepo (backend/src/...) y con barras normales (/). Así SonarCloud, que
 * corre desde la raíz, encuentra los archivos y mapea la cobertura.
 *
 *   node scripts/normalize-lcov.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const RUTA = 'coverage/lcov.info';

if (!existsSync(RUTA)) {
  console.error(`No existe ${RUTA}. Corre primero: npm run test:coverage`);
  process.exit(1);
}

let contenido = readFileSync(RUTA, 'utf8');
let n = 0;

contenido = contenido.replace(/^SF:(.*)$/gm, (_m, ruta) => {
  const conBarras = ruta.replace(/\\/g, '/');
  const conPrefijo = conBarras.startsWith('backend/') ? conBarras : `backend/${conBarras}`;
  n += 1;
  return `SF:${conPrefijo}`;
});

writeFileSync(RUTA, contenido, 'utf8');
console.log(`LCOV normalizado: ${n} rutas -> backend/src/... (relativas a la raíz)`);
