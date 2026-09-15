# Análisis SonarQube (proyecto `FuBank`)

Cómo re-escanear el proyecto y actualizar las métricas en tu SonarQube local.
La configuración vive en [`sonar-project.properties`](../sonar-project.properties)
(projectKey `FuBank`, `sonar.host.url=http://localhost:9000`).

## Requisitos
- **Java 17+** en el PATH (el scanner lo necesita). Verifica con `java -version`.
- Dependencias del scanner instaladas en la raíz: `npm install` (una sola vez).
- SonarQube corriendo y accesible desde donde ejecutes el scanner.

## Paso 1 — Regenerar cobertura (¡importante!)

El `sonar-project.properties` fusiona 3 reportes LCOV. Si escaneas sin ellos,
Sonar reporta **0% de cobertura** en esos archivos y baja la métrica. Regénéralos
antes de escanear:

```bash
# Backend (Vitest + módulo Bolsillos con c8)
cd backend && npm run test:coverage && npm run test:coverage:bolsillos

# Frontend (Vitest)
cd ../frontend && npm run test:coverage
```

Esto crea/actualiza:
- `backend/coverage/lcov.info`
- `backend/coverage-bolsillos/lcov.info`
- `frontend/coverage/lcov.info`

## Paso 2 — Lanzar el análisis

El token **no** se guarda en el repo: se pasa por variable de entorno
`SONAR_TOKEN` (el scanner la lee automáticamente).

**Linux / macOS / WSL** (donde `localhost:9000` alcanza a SonarQube):

```bash
cd ..                # raíz del repo
export SONAR_TOKEN=tu_token_aqui
npm run sonar
```

**Windows PowerShell:**

```powershell
cd ..
$env:SONAR_TOKEN = "tu_token_aqui"
npm run sonar
```

### Si SonarQube no está en `localhost:9000`
Si el servidor corre dentro de WSL/contenedor o lo expones por un túnel
(p. ej. ngrok), sobreescribe la URL sin tocar el archivo de config:

```bash
export SONAR_TOKEN=tu_token_aqui
export SONAR_HOST_URL=https://tu-tunel.ngrok-free.dev
npm run sonar
```

> Lo más simple es ejecutar el scanner **en el mismo entorno donde corre
> SonarQube** (normalmente WSL), donde `localhost:9000` funciona directo.

## Paso 3 — Verificar
Al terminar, abre el dashboard de `FuBank`. Tras el refactor de reliability y
security deberían quedar en **A**. La cobertura debe mantenerse (~96%) si
regeneraste los LCOV en el Paso 1.
