# FuBanking — Mapa para agentes

Banca web: **backend** Express 5 + TypeScript + Supabase (`:3001/api/v1`, `/health`) + **frontend** Next.js 16 + React 19 (`:3000`).

```txt
FuBanking/
  backend/src/{app.ts,server.ts,presentation,application,domain,infrastructure,shared,tests/}
  frontend/src/{app/(auth)+(dashboard),features/<mod>/,shared/}
  mcp-server/src/index.ts      # MCP solo-lectura (ver docs/mcp.md)
  e2e/                         # Serenity/JS + Cucumber + Playwright (Bolsillos y Depósito, ver e2e/README.md)
  katalon/                     # Katalon Recorder (Selenese HTML) para Bolsillos y Depósito, ver katalon/README.md
  frontend/middleware.ts  Jenkinsfile  ci/  scripts/  docs/
  package.json  sonar-project.properties
```

No existe `fronted/` (typo histórico) ni `k8s/` (GitOps vive en repo externo `FuBanking-gitops`).

## Comandos

```bash
npm run test:backend            # cd backend && vitest run
npm run test:frontend           # cd frontend && vitest run
npm run test:coverage           # ambos con cobertura
sh scripts/regression.sh [backend|frontend|loans]   # regresión (CI/Linux; en Windows: scripts/regression.ps1 [-Module loans])
npm run sonar                   # requiere lcov + SONAR_TOKEN (ver docs/ops/sonar.md)
npm run test:e2e                # E2E Serenity/JS; requiere backend :3001 y frontend :3000 arriba
npm run katalon:seed            # usuarios estáticos para Katalon Recorder (backend :3001 arriba)
```

Detalle por lado: `backend/AGENTS.md`, `frontend/AGENTS.md`.

## Dónde poner qué

| Quiero... | Va en... |
|---|---|
| Nuevo endpoint | `backend/src/presentation/routes/` + controller + `application/use-cases/` + repo Supabase |
| Nueva pantalla | `frontend/src/app/(dashboard)/` + `features/<mod>/` |
| Cambio reusable UI/API front | `frontend/src/shared/` |
| Script operativo | `scripts/` (documentado en `scripts/README.md`) |
| Doc permanente | `docs/` (índice en `docs/README.md`) |

## Ramas y CI/CD

* `dev` = integración diaria (Jenkins construye cada push; imágenes `:dev-<build>`; puede romperse).
* `main` = siempre desplegable; solo recibe merges desde `dev` (PR + CI verde). Su build publica `:BUILD_NUMBER` + `:latest`.
* Ramas de trabajo: cortas desde `dev`, se borran tras el merge. El `Jenkinsfile` resuelve el tag solo (`Resolve image tag`); `dev` jamás pisa `:latest`.
* ArgoCD lee `newTag` de `FuBanking-gitops` (`overlays/dev`); Jenkins lo actualiza al final del pipeline.

## Límites globales

1. No recrear `fronted/`, no commitear `.env`, `coverage/`, `dist/`, `.next/`, `node_modules/`.
2. Tests canónicos con **vitest** (`src/tests/`); `jest`/`c8`/`run-unit.ts` son legacy en retirada.
3. Frontend usa **`features/pockets/`** (plural, coincide con ruta `/pockets`); `features/pocket/` está eliminado.
4. No inventar `resultingBalance` en front si el back no lo devuelve (ver `docs/estado-fase-actual.md`).
5. `NEXT_PUBLIC_*` es lo único que puede bajar al browser; `service_role` jamás sale del backend.

## Links

`backend/AGENTS.md` · `frontend/AGENTS.md` · `docs/README.md` · `docs/api/endpoints.md` · `docs/ops/sonar.md` · `docs/mcp.md` · `Jenkinsfile`
