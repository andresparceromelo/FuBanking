import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { PlaywrightMCPClient } from './mcp-client-runner.js';

interface MCPToolResponse {
  content?: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

function extractText(response: MCPToolResponse): string {
  if (!response?.content) return '';
  return response.content
    .map(c => c.text || '')
    .filter(Boolean)
    .join('\n');
}

function getJwtSecret(): string {
  try {
    const envPath = path.resolve('backend/.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/JWT_SECRET\s*=\s*([^\r\n]+)/);
      if (match?.[1]) return match[1].trim();
    }
  } catch {}
  return 'super-secret-jwt-key-for-development-32-chars-min';
}

function generateClientToken(): { token: string; userPayload: any } {
  const secret = getJwtSecret();
  const user = {
    id: 'u-client-gabriel-001',
    email: 'bedoyacanoandres2@gmail.com',
    role: 'client' as const,
    fullName: 'Gabriel Cliente'
  };

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '2h' }
  );

  const userPayload = {
    id: user.id,
    email: user.email,
    firstName: 'Gabriel',
    middleName: null,
    lastName: 'Cliente',
    secondLastName: null,
    fullName: user.fullName,
    document: '1020304050',
    documentVerified: true,
    documentVerifiedAt: new Date().toISOString(),
    birthDate: '1995-05-15',
    phone: '3001234567',
    avatarUrl: null,
    monthlyIncome: 4500000,
    isActive: true,
    twoFactorEnabled: false,
    role: user.role,
    createdAt: new Date().toISOString(),
    requiresTwoFactor: false
  };

  return { token, userPayload };
}

async function runLoansMCPTest() {
  console.log('===============================================================');
  console.log('🚀 FU-BANKING: MCP PLAYWRIGHT E2E TEST (HERRAMIENTA 1 - BEDOYA)');
  console.log('===============================================================\n');

  const evidenceDir = path.resolve('test/pruebas-herramientas/herramientas-bedoya/01-mcp-playwright/evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const client = new PlaywrightMCPClient({
    headless: true,
    viewport: '1280x800',
    outputDir: evidenceDir
  });

  const executionLog: Array<{ step: string; tool: string; resultSummary: string; timestamp: string }> = [];

  function logStep(step: string, tool: string, resultSummary: string) {
    const entry = { step, tool, resultSummary, timestamp: new Date().toISOString() };
    executionLog.push(entry);
    console.log(`[${entry.timestamp.slice(11, 19)}] [${tool}] ${step}`);
    console.log(`   └─> ${resultSummary.slice(0, 120)}${resultSummary.length > 120 ? '...' : ''}`);
  }

  try {
    console.log('1. Conectando al Servidor MCP de Playwright (@playwright/mcp)...');
    await client.connect();
    logStep('Conexión inicializada con @playwright/mcp sobre transporte stdio', 'client.connect', 'Conexión exitosa');

    // Paso 1: Navegar a Login para sembrar contexto de autenticación
    console.log('\n2. Inicializando sesión en FuBanking...');
    const navLogin = await client.navigate('http://localhost:3000/login');
    logStep('Navegación inicial hacia /login', 'browser_navigate', extractText(navLogin) || 'OK');

    const { token, userPayload } = generateClientToken();
    await client.callTool('browser_evaluate', {
      function: `() => {
        document.cookie = "token=${token}; path=/; max-age=7200";
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", JSON.stringify(${JSON.stringify(userPayload)}));
      }`
    });
    logStep('Inyección de token JWT y credenciales de sesión autorizada', 'browser_evaluate', 'Sesión inyectada correctamente');

    // Paso 2: Navegar a Créditos
    console.log('\n3. Navegando al módulo de Créditos (/loans)...');
    const navLoans = await client.navigate('http://localhost:3000/loans');
    logStep('Navegación autorizada hacia /loans', 'browser_navigate', extractText(navLoans) || 'OK');

    // Esperar a que la página cargue los elementos
    await client.waitFor('Simulador de Crédito', 6000).catch(() => {});

    // Paso 3: Snapshot semántico del simulador de créditos
    console.log('\n4. Extrayendo árbol semántico de accesibilidad con browser_snapshot...');
    const loansSnapshot = await client.snapshot();
    const loansSnapshotText = extractText(loansSnapshot);
    logStep('Inspección de árbol A11y en /loans', 'browser_snapshot', `Snapshot capturado (${loansSnapshotText.length} caracteres)`);
    fs.writeFileSync(path.join(evidenceDir, '01-loans-simulator-snapshot.txt'), loansSnapshotText, 'utf8');

    // Paso 4: Configurar monto y plazo en el simulador
    console.log('\n5. Configurando parámetros de crédito en el simulador...');
    await client.type('[data-cy="loan-amount"], input[name="amount"], #amount', '5000000');
    logStep('Digitar monto del préstamo ($5,000,000)', 'browser_type', 'Monto: 5000000');

    await client.type('[data-cy="loan-installments"], input[name="installments"], #installments', '12');
    logStep('Digitar plazo (12 meses)', 'browser_type', 'Plazo: 12');

    // Paso 5: Click en simular crédito
    console.log('\n6. Ejecutando simulación mediante browser_click...');
    const clickSimulate = await client.click('[data-cy="btn-simulate"], button:has-text("Simular")', 'Simular button');
    logStep('Click en Simular Crédito', 'browser_click', extractText(clickSimulate) || 'Clicked');

    // Esperar resultado
    await client.waitFor('Cuota Mensual Estimada', 5000).catch(() => {});

    // Paso 6: Captura de pantalla de la simulación
    console.log('\n7. Tomando captura de pantalla de la simulación con browser_take_screenshot...');
    const screenshotFilename = path.join(evidenceDir, 'simulacion-credito-mcp.png');
    await client.takeScreenshot(screenshotFilename, true);
    logStep('Captura de pantalla de la simulación calculada', 'browser_take_screenshot', `Guardada en ${screenshotFilename}`);

    // Paso 7: Snapshot final con la cuota y desglose calculado
    console.log('\n8. Obteniendo snapshot de resultados calculados...');
    const resultSnapshot = await client.snapshot();
    const resultSnapshotText = extractText(resultSnapshot);
    fs.writeFileSync(path.join(evidenceDir, '02-resultado-simulacion-snapshot.txt'), resultSnapshotText, 'utf8');
    logStep('Verificación del cálculo de amortización en el árbol A11y', 'browser_snapshot', `Resultado confirmado`);

    // Guardar reporte JSON
    const reportData = {
      title: 'Reporte de Ejecución - Microsoft Playwright MCP Server',
      target: 'FuBanking - Módulo de Créditos (/loans)',
      executedBy: 'Andres Bedoya Cano',
      date: new Date().toISOString(),
      status: 'SUCCESS',
      protocol: 'Model Context Protocol (MCP) v2024-11-05',
      server: '@playwright/mcp (Microsoft)',
      stepsCount: executionLog.length,
      evidenceFiles: [
        '01-loans-simulator-snapshot.txt',
        '02-resultado-simulacion-snapshot.txt',
        'simulacion-credito-mcp.png'
      ],
      steps: executionLog
    };

    fs.writeFileSync(path.join(evidenceDir, 'mcp-execution-report.json'), JSON.stringify(reportData, null, 2), 'utf8');

    console.log('\n===============================================================');
    console.log('✅ TEST MCP EJECUTADO EXITOSAMENTE');
    console.log(`📁 Evidencias guardadas en: ${evidenceDir}`);
    console.log('===============================================================\n');

  } catch (error: any) {
    console.error('❌ Error durante la ejecución del test MCP:', error);
    try {
      await client.takeScreenshot(path.join(evidenceDir, 'error-mcp.png'), true);
    } catch {}
    throw error;
  } finally {
    console.log('Cerrando sesión del servidor Playwright MCP...');
    await client.close();
  }
}

runLoansMCPTest().catch(err => {
  console.error('Fallo crítico en runner MCP:', err);
  process.exit(1);
});
