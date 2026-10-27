import { execSync } from 'child_process';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('test/pruebas-herramientas/herramientas-bedoya/03-reportportal/reportportal.env') });

const host = 'localhost';
const port = 8088;

function checkReportPortalHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/health`, { timeout: 3000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('===============================================================');
  console.log('📊 REPORTPORTAL: REPORTE INDEPENDIENTE PLAYWRIGHT (HERRAMIENTA 3)');
  console.log('===============================================================\n');

  const isAlive = await checkReportPortalHealth();
  if (!isAlive) {
    console.log('⚠️  ReportPortal no parece estar respondiendo en http://localhost:8088 aún.');
    console.log('👉 Para levantar ReportPortal con Docker Compose:');
    console.log('   docker compose -f test/pruebas-herramientas/herramientas-bedoya/03-reportportal/docker-compose.yml up -d\n');
    console.log('ℹ️  Ejecutando suite Playwright con el reporter de ReportPortal configurado...\n');
  } else {
    console.log('✅ Servidor ReportPortal detectado activo en http://localhost:8088');
    console.log('🚀 Publicando Launch en ReportPortal: "FuBanking - Playwright Creditos Suite"\n');
  }

  const configPath = 'test/pruebas-herramientas/herramientas-bedoya/03-reportportal/playwright-agent/playwright.rp.config.ts';
  const command = `npx playwright test --config=${configPath}`;

  try {
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ Reporte de Playwright completado.');
    console.log('📊 Revisa tus resultados en: http://localhost:8088 (Proyecto: superadmin_personal)');
  } catch (error) {
    console.error('❌ Error al ejecutar Playwright con ReportPortal:', error.message);
    process.exit(1);
  }
}

main();
