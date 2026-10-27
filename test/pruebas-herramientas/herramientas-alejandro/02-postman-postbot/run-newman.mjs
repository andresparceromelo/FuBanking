// Ejecuta la colección de Postman con Newman (la CLI oficial de Postman) y deja
// las evidencias en ./evidence: reporte HTML (htmlextra), JSON y JUnit.
//   npm run test:postman:bolsillos
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import newman from 'newman';

const here = dirname(fileURLToPath(import.meta.url));
const evidence = join(here, 'evidence');
mkdirSync(evidence, { recursive: true });

newman.run({
  collection: join(here, 'FuBanking-Bolsillos.postman_collection.json'),
  environment: join(here, 'FuBanking-local.postman_environment.json'),
  envVar: process.env.API_URL ? [{ key: 'baseUrl', value: process.env.API_URL }] : [],
  timeoutRequest: 30_000,
  reporters: ['cli', 'htmlextra', 'json', 'junit'],
  reporter: {
    htmlextra: {
      export: join(evidence, 'newman-report.html'),
      title: 'FuBanking — Bolsillos y Depositar (Postman + Newman)',
      browserTitle: 'Newman · Bolsillos',
      showEnvironmentData: false,
      skipSensitiveData: true,
    },
    json: { export: join(evidence, 'newman-report.json') },
    junit: { export: join(evidence, 'newman-junit.xml') },
  },
}, (error, summary) => {
  if (error) {
    console.error('Newman no pudo ejecutar la colección:', error.message);
    process.exit(1);
  }
  // El reporte JSON guarda cuerpos y encabezados: se redactan los JWT y las
  // contraseñas de los clientes de prueba antes de dejarlo como evidencia versionable.
  const secrets = summary.collection.variables.all()
    .filter(variable => /password|token/i.test(variable.key) && variable.value)
    .map(variable => String(variable.value));
  const jsonReport = join(evidence, 'newman-report.json');
  let report = readFileSync(jsonReport, 'utf8')
    .replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, '<JWT-REDACTADO>')
    // Cuerpos de registro ya resueltos (JSON escapado dentro del reporte).
    .replaceAll(/(\\"(?:password|confirmPassword)\\":\s*\\")[^\\]+/g, '$1<REDACTADO>');
  for (const secret of secrets) {
    report = report.replaceAll(secret, '<REDACTADO>');
  }
  writeFileSync(jsonReport, report);

  const { assertions, requests } = summary.run.stats;
  console.log(`\nRequests: ${requests.total} · aserciones: ${assertions.total - assertions.failed}/${assertions.total} correctas`);
  console.log(`Evidencias en ${evidence}`);
  process.exit(summary.run.failures.length > 0 ? 1 : 0);
});
