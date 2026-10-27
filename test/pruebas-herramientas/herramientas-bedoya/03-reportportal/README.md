# ReportPortal — Dashboard Unificado con Reportes Separados (Cypress + Playwright)

Este módulo implementa **ReportPortal** mediante **Docker Compose**, configurado en el puerto **`8088`** (evitando colisión con Jenkins en `8080`), junto con **dos integraciones de reporte independientes** para Cypress y Playwright.

---

## 1. Arquitectura de Despliegue con Docker Compose

El archivo `docker-compose.yml` orquesta los servicios oficiales de ReportPortal:
- **`gateway` (Traefik):** Reverse proxy expuesto en el puerto host **`8088`** (`http://localhost:8088`).
- **`service-ui`:** Interfaz web visual interactiva.
- **`service-api`:** Motor REST para la ingesta asíncrona de resultados de pruebas.
- **`postgres`:** Base de datos relacional para almacenamiento de métricas y ejecuciones.
- **`rabbitmq`:** Message broker para procesamiento de eventos y logs en tiempo real.
- **`minio`:** Almacenamiento de objetos para capturas de pantalla, traces y videos adjuntos.

### Credenciales por Defecto de ReportPortal:
- **URL UI:** `http://localhost:8088`
- **Administrador:** `superadmin`
- **Contraseña:** `erebus`
- **Proyecto por defecto:** `superadmin_personal`

---

## 2. Puesta en Marcha de ReportPortal

Asegúrate de que Docker Desktop esté encendido y ejecuta:

```bash
# Levantar los contenedores en segundo plano
docker compose -f test/pruebas-herramientas/herramientas-bedoya/03-reportportal/docker-compose.yml up -d

# Detener los contenedores cuando termines
docker compose -f test/pruebas-herramientas/herramientas-bedoya/03-reportportal/docker-compose.yml down
```

Una vez levantado, abre `http://localhost:8088` en tu navegador, inicia sesión con `superadmin` / `erebus`, ve a tu **Perfil > API Keys**, genera tu token y cópialo en `test/pruebas-herramientas/herramientas-bedoya/03-reportportal/reportportal.env`:

```env
RP_API_KEY=tu_token_generado_aqui
```

---

## 3. Reportes Separados e Independientes

A diferencia de una ingesta mezclada, cada tecnología cuenta con su propio adaptador y genera su propio **Launch independiente** en ReportPortal:

### 🅰️ Reporte Independiente 1: Cypress
- **Agente:** `@reportportal/agent-js-cypress`
- **Launch en ReportPortal:** `FuBanking - Cypress Creditos Suite`
- **Configuración:** `03-reportportal/cypress-agent/cypress-rp.config.ts`
- **Ejecución:**
  ```bash
  npm run test:rp:cypress
  ```

### 🅱️ Reporte Independiente 2: Playwright
- **Agente:** `@reportportal/agent-js-playwright`
- **Launch en ReportPortal:** `FuBanking - Playwright Creditos Suite`
- **Configuración:** `03-reportportal/playwright-agent/playwright.rp.config.ts`
- **Suite de pruebas:** `03-reportportal/playwright-agent/tests/loans-rp.spec.ts`
- **Ejecución:**
  ```bash
  npm run test:rp:playwright
  ```

---

## 4. Visualización en la Interfaz de ReportPortal

Al ingresar a `http://localhost:8088` (Proyecto `superadmin_personal` > **Launches**), verás los dos lanzamientos claramente diferenciados:
1. `FuBanking - Cypress Creditos Suite` con tags `[framework: cypress] [module: creditos]`.
2. `FuBanking - Playwright Creditos Suite` con tags `[framework: playwright] [module: creditos]`.

Cada launch muestra sus estadísticas de passed/failed, logs por paso, capturas de pantalla de evidencia y categorización automática de defectos.
