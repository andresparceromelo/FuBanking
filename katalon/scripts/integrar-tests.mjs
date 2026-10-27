import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.resolve(__dirname, '..');
const repoRoot = path.resolve(basePath, '..');
const testsBasePath = path.join(repoRoot, 'katalon_tests');

const modules = [
  {
    src: 'registro',
    destFolder: '08_Registro',
    suiteName: 'Suite_08_Registro',
    suiteTitle: 'Suite 8 - Registro de Nuevos Usuarios',
    suiteId: 'fubanking-registro-suite',
    suiteDescription: 'Pruebas de registro: positivo, duplicados, contraseña débil y campos vacíos'
  },
  {
    src: 'login',
    destFolder: '09_Login',
    suiteName: 'Suite_09_Login',
    suiteTitle: 'Suite 9 - Inicio de Sesión',
    suiteId: 'fubanking-login-suite',
    suiteDescription: 'Pruebas de autenticación: login exitoso, recordarme, credenciales inválidas y validaciones'
  },
  {
    src: 'login_2fa',
    destFolder: '10_Login_2FA',
    suiteName: 'Suite_10_Login_2FA',
    suiteTitle: 'Suite 10 - Autenticación de Dos Factores (2FA)',
    suiteId: 'fubanking-login-2fa-suite',
    suiteDescription: 'Pruebas de verificación en 2 pasos: OTP exitoso, código inválido, reenvío y seguridad'
  },
  {
    src: 'contrasena',
    destFolder: '11_Recuperar_contrasena',
    suiteName: 'Suite_11_Recuperar_contrasena',
    suiteTitle: 'Suite 11 - Recuperación y Cambio de Contraseña',
    suiteId: 'fubanking-recuperar-contrasena-suite',
    suiteDescription: 'Pruebas de restablecimiento: solicitud, tokens, cambio exitoso y validaciones'
  },
  {
    src: 'perfil',
    destFolder: '12_Perfil',
    suiteName: 'Suite_12_Perfil',
    suiteTitle: 'Suite 12 - Gestión de Perfil de Usuario',
    suiteId: 'fubanking-perfil-suite',
    suiteDescription: 'Pruebas de perfil: edición de nombre, teléfono e ingresos, validaciones y cancelación'
  },
  {
    src: 'retiro',
    destFolder: '13_Retiro',
    suiteName: 'Suite_13_Retiro',
    suiteTitle: 'Suite 13 - Retiro de Fondos',
    suiteId: 'fubanking-retiro-suite',
    suiteDescription: 'Pruebas transaccionales de retiro: monto válido, saldo insuficiente, montos inválidos y cancelación'
  }
];

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseCommandsFromTable(tableHtml) {
  const commands = [];
  const tbodyMatch = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return commands;
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowRegex.exec(tbodyMatch[1])) !== null) {
    const tdRegex = /<td>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cell;
    while ((cell = tdRegex.exec(row[1])) !== null) {
      cells.push(decodeHtmlEntities(cell[1].trim()));
    }
    if (cells.length >= 1 && cells[0]) {
      commands.push({
        command: cells[0] || '',
        target: cells[1] || '',
        value: cells[2] || ''
      });
    }
  }
  return commands;
}

console.log(`Processing suites for ${basePath}...`);

for (const mod of modules) {
  const srcDir = fs.existsSync(testsBasePath) ? path.join(testsBasePath, mod.src) : null;
  const destDir = path.join(basePath, 'casos', mod.destFolder);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // If source exists, sync files into destDir
  if (srcDir && fs.existsSync(srcDir)) {
    for (const f of fs.readdirSync(srcDir)) {
      if (f.endsWith('.html')) {
        fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      }
    }
  }

  const files = fs.readdirSync(destDir).sort();
  const tables = [];
  const jsonTests = [];

  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const filePath = path.join(destDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract table
    const tableMatch = content.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      tables.push(tableMatch[0]);

      // Extract test case name
      const nameMatch = content.match(/<td[^>]*>([A-Za-z0-9_]+)<\/td>/i);
      const testName = nameMatch ? nameMatch[1] : path.basename(file, '.html');
      const cmds = parseCommandsFromTable(tableMatch[0]);

      jsonTests.push({
        id: testName.toLowerCase().replace(/_/g, '-'),
        name: testName,
        commands: cmds
      });
    }
  }

  // Generate HTML Suite
  const suiteHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${mod.suiteTitle}</title>
</head>
<body>
${tables.join('\n\n')}
</body>
</html>\n`;

  const suiteHtmlPath = path.join(basePath, 'suites', `${mod.suiteName}.html`);
  fs.writeFileSync(suiteHtmlPath, suiteHtml, 'utf8');

  // Generate JSON Suite
  const suiteJson = {
    id: mod.suiteId,
    version: '3.0',
    name: mod.suiteName,
    url: 'http://localhost:3000',
    tests: jsonTests
  };

  const suiteJsonPath = path.join(basePath, 'suites', `${mod.suiteName}.json`);
  fs.writeFileSync(suiteJsonPath, JSON.stringify(suiteJson, null, 2) + '\n', 'utf8');

  console.log(`Processed ${mod.destFolder}: ${files.length} cases -> ${mod.suiteName}.html & .json`);
}

console.log('Migration completed successfully!');
