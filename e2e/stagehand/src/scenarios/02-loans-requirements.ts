import { createStagehandSession } from '../config/stagehand.config.js';
import { authenticateBrowserContext, TEST_USERS } from '../utils/authHelper.js';
import { EvidenceManager } from '../utils/evidence.js';

export async function runLoansRequirementsScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[ESCENARIO 2] STAGEHAND: OBSERVE - DESCUBRIMIENTO DE REQUISITOS\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================================\x1b[0m');

  const { stagehand, browser, page, baseUrl } = await createStagehandSession();

  try {
    // 1. Inyectar autenticación para el cliente Gabriel
    await authenticateBrowserContext(page, TEST_USERS.client);

    // 2. Navegar a la página de créditos
    await page.goto(`${baseUrl}/loans`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await evidence.saveScreenshot(page, '02-requisitos-vista.png');

    // 3. CAPACIDAD OBSERVE: Descubrir los requisitos de elegibilidad y botones disponibles
    let t0 = Date.now();
    const observedRequirements = await stagehand.observe(
      'Find the requirements check items and action buttons on this loans page'
    );

    evidence.recordStep({
      step: 'Observación y descubrimiento de requisitos normativos vía IA',
      capability: 'observe',
      instruction: 'Find the requirements check items and action buttons on this loans page',
      result: observedRequirements,
      durationMs: Date.now() - t0,
    });

    console.log('\n\x1b[36m🔍 Elementos y Acciones Observadas por IA:\x1b[0m');
    console.log(JSON.stringify(observedRequirements, null, 2));

    // 4. CAPACIDAD OBSERVE: Descubrir los campos interactivos de cálculo
    t0 = Date.now();
    const observedFormInputs = await stagehand.observe(
      'Find the numeric loan input fields and calculate buttons on this page'
    );

    evidence.recordStep({
      step: 'Observación de campos de entrada del simulador',
      capability: 'observe',
      instruction: 'Find the numeric loan input fields and calculate buttons on this page',
      result: observedFormInputs,
      durationMs: Date.now() - t0,
    });

    await evidence.saveScreenshot(page, '02-requisitos-observados.png');

    const reportPath = await evidence.exportReport('02-loans-requirements');
    console.log(`\x1b[32m✓ Escenario 2 completado con éxito. Reporte: ${reportPath}\x1b[0m\n`);
    return { success: true, observed: { observedRequirements, observedFormInputs } };
  } catch (error: any) {
    console.error('\x1b[31m✗ Fallo en Escenario 2:\x1b[0m', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecución directa si se llama con tsx
if (process.argv[1]?.endsWith('02-loans-requirements.ts')) {
  runLoansRequirementsScenario().catch(() => process.exit(1));
}
