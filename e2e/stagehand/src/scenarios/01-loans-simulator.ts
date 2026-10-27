import { z } from 'zod';
import { createStagehandSession } from '../config/stagehand.config.js';
import { authenticateBrowserContext, TEST_USERS } from '../utils/authHelper.js';
import { EvidenceManager } from '../utils/evidence.js';

export async function runLoansSimulatorScenario() {
  const evidence = new EvidenceManager();
  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m[ESCENARIO 1] STAGEHAND: ACT & EXTRACT - SIMULADOR DE CRÉDITOS\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================================\x1b[0m');

  const { stagehand, browser, page, baseUrl } = await createStagehandSession();

  try {
    // 1. Inyectar autenticación para el cliente Gabriel
    await authenticateBrowserContext(page, TEST_USERS.client);

    // 2. Navegar a la página de créditos
    await page.goto(`${baseUrl}/loans`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await evidence.saveScreenshot(page, '01-simulador-inicio.png');

    // 3. CAPACIDAD ACT: Modificar el monto mediante instrucción en lenguaje natural
    let t0 = Date.now();
    await stagehand.act('Type 5000000 into the Monto input field');
    evidence.recordStep({
      step: 'Establecer monto en 5000000 vía lenguaje natural',
      capability: 'act',
      instruction: 'Type 5000000 into the Monto input field',
      result: 'Valor ingresado',
      durationMs: Date.now() - t0,
    });

    // 4. CAPACIDAD ACT: Modificar las cuotas mediante instrucción en lenguaje natural
    t0 = Date.now();
    await stagehand.act('Type 12 into the Cuotas input field');
    evidence.recordStep({
      step: 'Establecer 12 cuotas vía lenguaje natural',
      capability: 'act',
      instruction: 'Type 12 into the Cuotas input field',
      result: 'Valor ingresado',
      durationMs: Date.now() - t0,
    });

    // 5. CAPACIDAD ACT: Ejecutar la simulación haciendo clic en el botón
    t0 = Date.now();
    await stagehand.act('Click the Simular button');
    await page.waitForTimeout(1500);
    evidence.recordStep({
      step: 'Hacer clic en el botón Simular',
      capability: 'act',
      instruction: 'Click the Simular button',
      result: 'Simulación ejecutada',
      durationMs: Date.now() - t0,
    });

    await evidence.saveScreenshot(page, '01-simulador-calculado.png');

    // 6. CAPACIDAD EXTRACT: Extraer los resultados financieros estructurados con esquema Zod
    t0 = Date.now();
    const LoanSimulationSchema = z.object({
      monthlyPayment: z.string().describe('El valor formateado de la cuota mensual'),
      totalToPay: z.string().describe('El valor total a pagar al finalizar el crédito'),
      totalInterest: z.string().describe('El total de intereses generado'),
    });

    const extractionResult = await stagehand.extract(
      'Extract the monthly payment, total to pay, and total interest from the loan results card',
      LoanSimulationSchema
    );

    const extractedData = (extractionResult as any)?.data ?? extractionResult;

    evidence.recordStep({
      step: 'Extracción de resultados financieros con Zod',
      capability: 'extract',
      instruction: 'Extract the monthly payment, total to pay, and total interest from the loan results card',
      result: extractedData,
      durationMs: Date.now() - t0,
    });

    console.log('\n\x1b[36m📊 Datos Financieros Extraídos por IA:\x1b[0m');
    console.log(JSON.stringify(extractedData, null, 2));

    // Validaciones semánticas
    if (!extractedData) {
      throw new Error('La extracción de datos con Stagehand retornó vacío');
    }

    const reportPath = await evidence.exportReport('01-loans-simulator');
    console.log(`\x1b[32m✓ Escenario 1 completado con éxito. Reporte: ${reportPath}\x1b[0m\n`);
    return { success: true, data: extractedData };
  } catch (error: any) {
    console.error('\x1b[31m✗ Fallo en Escenario 1:\x1b[0m', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecución directa si se llama con tsx
if (process.argv[1]?.endsWith('01-loans-simulator.ts')) {
  runLoansSimulatorScenario().catch((err) => {
    console.error('ERROR DETALLADO:', err);
    process.exit(1);
  });
}
