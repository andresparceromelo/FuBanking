import { z } from 'zod';
import { createStagehandSession } from '../config/stagehand.config.js';
import { authenticateBrowserContext, TEST_USERS } from '../utils/authHelper.js';
import { EvidenceManager } from '../utils/evidence.js';

export async function runAdminApprovalScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[ESCENARIO 3] STAGEHAND: ACT, OBSERVE & EXTRACT - GESTIÓN ADMINISTRATIVA\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================================\x1b[0m');

  const { stagehand, browser, page, baseUrl } = await createStagehandSession();

  try {
    // 1. Inyectar autenticación para el Administrador Andresito
    await authenticateBrowserContext(page, TEST_USERS.admin);

    // 2. Navegar al panel de administración de créditos
    await page.goto(`${baseUrl}/admin/loans`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await evidence.saveScreenshot(page, '03-admin-bandeja-inicial.png');

    // 3. CAPACIDAD OBSERVE: Descubrir los filtros y solicitudes disponibles
    let t0 = Date.now();
    const observedFilters = await stagehand.observe(
      'Find the status filter buttons such as Pendientes, Aprobados, Todos and refresh actions'
    );

    evidence.recordStep({
      step: 'Observación de filtros de auditoría vía IA',
      capability: 'observe',
      instruction: 'Find the status filter buttons such as Pendientes, Aprobados, Todos and refresh actions',
      result: observedFilters,
      durationMs: Date.now() - t0,
    });

    // 4. CAPACIDAD ACT: Filtrar por solicitudes pendientes en lenguaje natural
    t0 = Date.now();
    await stagehand.act('Click the Pendientes button');
    await page.waitForTimeout(1000);
    evidence.recordStep({
      step: 'Filtrar por solicitudes pendientes',
      capability: 'act',
      instruction: 'Click the Pendientes button',
      result: 'Filtro aplicado',
      durationMs: Date.now() - t0,
    });

    await evidence.saveScreenshot(page, '03-admin-filtrado-pendientes.png');

    // 5. CAPACIDAD EXTRACT: Extraer las solicitudes presentadas en pantalla
    t0 = Date.now();
    const AdminLoansListSchema = z.object({
      title: z.string().describe('El título de la sección de administración'),
      statusFilter: z.string().optional().describe('El estado del filtro activo'),
    });

    const extractionResult = await stagehand.extract(
      'Extract the main heading title of the page and the currently selected filter',
      AdminLoansListSchema
    );

    const extractedList = (extractionResult as any)?.data ?? extractionResult;

    evidence.recordStep({
      step: 'Extracción de información de auditoría con Zod',
      capability: 'extract',
      instruction: 'Extract the main heading title of the page and the currently selected filter',
      result: extractedList,
      durationMs: Date.now() - t0,
    });

    console.log('\n\x1b[36m📊 Datos Extraídos del Panel Administrativo:\x1b[0m');
    console.log(JSON.stringify(extractedList, null, 2));

    // 6. CAPACIDAD ACT: Refrescar la bandeja de auditoría
    t0 = Date.now();
    await stagehand.act('Click the Actualizar button');
    await page.waitForTimeout(1000);
    evidence.recordStep({
      step: 'Refrescar bandeja administrativa',
      capability: 'act',
      instruction: 'Click the Actualizar button',
      result: 'Bandeja actualizada',
      durationMs: Date.now() - t0,
    });

    await evidence.saveScreenshot(page, '03-admin-actualizado.png');

    const reportPath = await evidence.exportReport('03-admin-approval');
    console.log(`\x1b[32m✓ Escenario 3 completado con éxito. Reporte: ${reportPath}\x1b[0m\n`);
    return { success: true, data: extractedList };
  } catch (error: any) {
    console.error('\x1b[31m✗ Fallo en Escenario 3:\x1b[0m', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecución directa si se llama con tsx
if (process.argv[1]?.endsWith('03-admin-approval.ts')) {
  runAdminApprovalScenario().catch(() => process.exit(1));
}
