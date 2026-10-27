# PLAN DE PRUEBAS — FUBANK
**Proyecto:** FuBanking  
**Versión:** 2.0  
**Fecha:** 03/08/2026  
**Equipo de Pruebas (Horizontal sin jerarquías):** Andres Bedoya Cano, Dubin Andres Soto, Tomas Henao, Stiven Alejandro Bustamante  
**Módulos en Alcance del Sistema:** Autenticación & Seguridad (Soto) · Créditos y Préstamos (Bedoya) · Ahorros/Bolsillos (Henao) · Tarjetas Virtuales (Bustamante)

---

# 1. INTRODUCCIÓN

## 1.1 Propósito del documento

Este documento establece la estrategia, alcance, organización y seguimiento del proceso de pruebas para el sistema FuBank. Su propósito es estructurar el marco de verificación y validación del software construido previamente, cumpliendo con las directrices de ISTQB y la normativa internacional ISO/IEC/IEEE 29119.

## 1.2 Alcance del documento

Este documento define el alcance de las evaluaciones funcionales y no funcionales aplicadas a FuBank, comprendiendo cada etapa del ciclo de pruebas: diseño de escenarios, ejecución, seguimiento de hallazgos y el informe final de cierre.

## 1.3 Referencias

- ISTQB Foundation Level Syllabus
- ISO/IEC/IEEE 29119 – Software Testing
- ISO/IEC 25010 – Modelo de Calidad del Producto Software
- Repositorio del proyecto: GitHub (`dev` branch)
- Documentación interna: `docs/README.md`, `docs/api/endpoints.md`

---

# 2. DESCRIPCIÓN DEL PRODUCTO

## 2.1 Descripción general del software

FuBank es una aplicación bancaria web con cuyo propósito es ofrecer una plataforma digital intuitiva para centralizar la gestión financiera personal, respondiendo a la problemática actual de la dependencia de sucursales físicas al permitir la administración de cuentas, transferencias, pagos de servicios, ahorros mediante "bolsillos" y la tramitación de créditos o tarjetas virtuales.

El sistema está orientado a dos perfiles principales de usuario: por un lado, los clientes (usuarios finales), quienes disponen de herramientas dinámicas y seguras para el control de su dinero; y por otro lado, el personal administrativo, responsable del análisis, aprobación y seguimiento de las solicitudes de créditos y productos dentro del ecosistema.

## 2.2 Contexto organizacional

FuBank es una plataforma web accesible al usuario mediante el navegador además de ser Mobile Responsive para asegurar la accesibilidad en teléfonos inteligentes. La plataforma soporta dos roles diferenciados: los usuarios finales, enfocados en la operativa de banca personal, y los administradores, habilitados con permisos para interactuar con flujos de aprobación y gestión operativa.

Su infraestructura integra dependencias externas como Supabase (PostgreSQL) para la persistencia confiable de la información, mientras que el control de acceso y la seguridad operacional se fundamentan en la gestión de tokens JWT complementada con autenticación de dos factores (2FA).

## 2.3 Arquitectura general

El sistema sigue un modelo cliente-servidor, donde el cliente web consume una API RESTful expuesta por el backend. Internamente, el backend está organizado bajo principios de arquitectura limpia (Clean Architecture), separando responsabilidades en tres niveles:

- **Presentation:** controladores y rutas que exponen los endpoints REST.
- **Application:** casos de uso (Use Cases) y DTOs que orquestan la lógica de negocio.
- **Domain:** entidades y reglas de negocio centrales del sistema.

**Tecnologías utilizadas:**
- **Backend:** Node.js 22, Express 5, TypeScript, Supabase (PostgreSQL como base de datos). Puerto: `:3001/api/v1`
- **Frontend:** React 19, Next.js 16, Tailwind CSS. Puerto: `:3000`
- **Seguridad:** middlewares de validación de JWT y de roles (`authMiddleware`, `adminMiddleware`) para autenticación y autorización.

## 2.4 Procesos, módulos y funcionalidades

| Módulo | Funcionalidades principales | Responsable |
|---|---|---|
| Auth | Registro, login/logout, JWT, 2FA, recuperación de contraseña, perfil | Dubin Andres Soto |
| Créditos (Loans) | Simulación de cuotas, solicitud de crédito, listado/estado, aprobación/rechazo admin | Andres Bedoya |
| Ahorros (Pockets) | Crear/editar/eliminar bolsillos, depósitos y retiros desde/hacia cuenta principal | Tomas Henao |
| Tarjetas Virtuales | Solicitud, listado, revelación segura de datos, bloqueo/desbloqueo | Stiven Bustamante |

---

# 3. BASE DE PRUEBAS (TEST BASIS)

**Requisitos Funcionales:** Requisitos Funcionales.docx  
**Historias de usuario:** Historias de Usuario.docx

| Fuente | Descripción | Módulos cubiertos |
|---|---|---|
| Requisitos Funcionales (RF-01 a RF-81) | Documento oficial de RF del proyecto | Auth, Loans, Pockets, Virtual Cards |
| Historias de Usuario (HU-27 a HU-32) | Backlog orientado al módulo de Créditos | Loans |
| Código fuente (`backend/src/`, `frontend/src/`) | Implementación real sometida a prueba | Todos |
| Contratos API (`docs/api/endpoints.md`) | Interfaz HTTP verificada en pruebas de integración | Todos |
| Escenarios Gherkin (`e2e/serenity/features/`) | Criterios de aceptación en lenguaje natural | Loans |
| Commits Git (23/07/2026 – 25/10/2026) | Trazabilidad de cambios y versiones probadas | Todos |

---

# 4. OBJETIVOS DE LAS PRUEBAS

1. Verificar que los 20 RF de los módulos en alcance cumplan lo definido en el documento de Requisitos Funcionales: Usuarios y Autenticación (RF-01, RF-04, RF-09, RF-13, RF-16), Ahorros/Bolsillos, Créditos (HU-27 a HU-32) y Tarjetas Virtuales (RF-64 a RF-72).
2. Validar los procesos cruciales de movimiento de dinero entre la cuenta principal y los bolsillos, asegurando la integridad de saldos y montos (constitución, abonos y retiros — RF-48 a RF-51), evitando pérdida, duplicación o reducción inesperada de fondos.
3. Confirmar que los mecanismos de seguridad funcionan correctamente ante escenarios válidos e inválidos: generación de sesión JWT (RF-05), bloqueo por intentos fallidos (RF-06), activación/verificación/desactivación de 2FA (RF-11 a RF-14) y ocultamiento/revelación controlada de datos sensibles de tarjeta (RF-69).
4. Detectar defectos de severidad alta o crítica en los flujos de negocio antes del cierre del ciclo de pruebas.
5. Validar el flujo de aprobación/rechazo de créditos por parte del rol Administrador, asegurando la correcta actualización de estados (HU-30 a HU-32).
6. Verificar que el sistema genere notificaciones automáticas ante los eventos de los módulos en alcance.
7. **[Objetivo académico]** Demostrar el uso de múltiples niveles y técnicas de prueba aplicadas al proyecto real, incluyendo herramientas de vanguardia (IA generativa, MCP, observabilidad).

---

# 5. ALCANCE

## 5.1 Funcionalidades incluidas

- **Módulo de Usuarios y Autenticación:** registro (RF-01 a RF-03), login/logout y sesión JWT (RF-04 a RF-07), recuperación y restablecimiento de contraseña (RF-08 a RF-10), activación/desactivación y verificación de 2FA (RF-11 a RF-14), consulta y edición de perfil (RF-15 a RF-17).
- **Módulo de Ahorros (Bolsillos):** creación (RF-43, RF-44), consulta (RF-45), edición (RF-46), eliminación (RF-47) y movimientos hacia/desde la cuenta principal (RF-48 a RF-51).
- **Módulo de Créditos:** simulación y cálculo de cuotas (RF-52 a RF-54), envío y registro de solicitudes (RF-55, RF-56), consulta de estado e historial (RF-57, RF-58) y gestión administrativa: listado, aprobación y rechazo (RF-60 a RF-63).
- **Módulo de Tarjetas Virtuales:** solicitud y generación (RF-64, RF-65), listado e información básica (RF-66, RF-67), revelación segura de datos sensibles (RF-69) y bloqueo/desbloqueo con actualización de estado (RF-70 a RF-72).
- **(Transversal)** Generación de notificaciones derivada de los flujos anteriores (RF-76, RF-78, RF-81).

## 5.2 Funcionalidades excluidas

- **Módulo de Cuentas Bancarias** como flujo propio (RF-18 a RF-29): depósitos, retiros directos, control de privacidad de saldo y consulta de movimientos.
- **Módulo de Transferencias y Movimientos** (RF-30 a RF-42): búsqueda de destinatarios, transferencias, comprobantes, historial y solicitudes de dinero.
- **Gestión del buzón de notificaciones** como módulo independiente (RF-73 a RF-75).
- Pruebas de carga y estrés a gran escala (miles de usuarios concurrentes), dado que no se cuenta con herramientas ni infraestructura dedicadas para ese volumen.
- Pruebas de penetración exhaustivas sobre JWT/2FA; solo se validan casos funcionales básicos de seguridad.
- Integraciones con pasarelas de pago externas reales o entidades bancarias externas.

## 5.3 Supuestos

- Por parte del desarrollo, se entregará builds funcionales según el cronograma de los entregables.
- Los requisitos funcionales de los módulos en alcance no sufrirán cambios significativos durante la ejecución de pruebas.
- Los 4 integrantes del equipo de pruebas estarán disponibles durante todo el periodo definido en el cronograma.
- El ambiente de pruebas (backend `:3001`, frontend `:3000`) estará disponible y con datos de prueba precargados durante todo el ciclo.
- Las variables de entorno necesarias para ejecutar las suites de prueba (tokens JWT de prueba, claves Supabase, API key Gemini para Stagehand) estarán configuradas en `.env.test` en los equipos de los integrantes.

## 5.4 Restricciones

- El equipo de pruebas está compuesto por 4 personas, lo que limita la cobertura y profundidad de las pruebas exploratorias frente a un ciclo comercial completo.
- No se dispone de licencia para herramientas de pruebas de rendimiento avanzadas; se usan herramientas open-source con capacidades limitadas.
- El ambiente de pruebas no replica exactamente la infraestructura de producción (menor capacidad de servidores).
- El proyecto se desarrolla en el marco del curso académico "Validación y verificación de software", por lo que el tiempo de ejecución está limitado al cronograma del semestre (julio–octubre 2026).
- El uso de IA generativa (Stagehand/Gemini Flash) en pruebas automatizadas está condicionado a la disponibilidad de la API key y las cuotas gratuitas del proveedor.

---

# 6. ENFOQUE Y ESTRATEGIA DE PRUEBAS

## Estrategia general

Se adoptó una **pirámide de pruebas ampliada con IA** estructurada en cuatro capas:

```
        ┌────────────────────────────────┐
        │   E2E con IA (Stagehand+AI)    │  ← 3 escenarios AI-driven
        ├────────────────────────────────┤
        │   E2E funcional (Cypress)      │  ← 18 tests, 5 suites
        │   BDD/Gherkin (Serenity/JS)    │  ← 7 scenarios
        ├────────────────────────────────┤
        │   Integración (Vitest API)     │  ← Contratos API endpoints
        ├────────────────────────────────┤
        │   Unitarias (Vitest)           │  ← Domain/Application layers
        └────────────────────────────────┘
```

Adicionalmente se implementaron **3 herramientas avanzadas** de observabilidad y automatización:

| Herramienta | Propósito | Ubicación |
|---|---|---|
| Playwright MCP Server (`@playwright/mcp`) | Automatización browser vía protocolo MCP con agente IA | `test/pruebas-herramientas/herramientas-bedoya/01-mcp-playwright/` |
| Cypress Cloud + Studio AI + `cy.prompt()` | Ejecución en nube con IA generativa de pruebas y registro histórico | `test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/` |
| ReportPortal (Docker) | Observabilidad y dashboards centralizados de resultados Cypress + Playwright | `test/pruebas-herramientas/herramientas-bedoya/03-reportportal/` |

**Principios de diseño:**
- **Independencia:** cada prueba puede ejecutarse sin depender del estado dejado por otra.
- **Autenticación por API:** los tests E2E inyectan el token JWT mediante `loginByApi` (Cypress) o `browser_evaluate` (Stagehand), eliminando la dependencia de la UI de login.
- **Datos de prueba aislados:** usuarios dedicados por rol — cliente (`bedoyacanoandres2@gmail.com`) y administrador (`bedoyacanoandres@gmail.com`).
- **Evidencia trazable:** screenshots, videos, reportes HTML (Mochawesome), JSON traces MCP y dashboards ReportPortal.
- **Regresión continua:** las suites se integran al pipeline CI/CD (Jenkins) mediante los comandos `npm run test:backend`, `npm run test:frontend` y el script `scripts/regression.ps1`.

---

# 7. NIVELES DE PRUEBA

## 7.1 Pruebas de Componente (Unitarias)

**Objetivo:** Verificar de forma aislada las unidades más pequeñas del sistema.

Dada la arquitectura limpia de FuBank, se enfocan en la capa **Domain** (entidades y reglas de negocio centrales) y en la capa **Application** (casos de uso y DTOs). Se validan cálculos y reglas críticas como la integridad de saldos, la lógica de aprobación automática de créditos para montos bajos y las validaciones de datos de entrada.

- **Framework:** Vitest (configurado en `backend/vitest.config.ts` y `frontend/vitest.config.ts`)
- **Ubicación:** `backend/src/tests/unit/`, `frontend/src/tests/unit/`
- **Comando:** `npm run test:backend` / `npm run test:frontend`
- **Base de prueba:** diseño detallado, código fuente y modelo de datos (Supabase/PostgreSQL).

## 7.2 Pruebas de Integración

**Objetivo:** Verificar la interacción entre componentes y con las dependencias externas.

En FuBank son especialmente relevantes porque el sistema se prueba principalmente a nivel de API: se validan las interfaces entre los controladores (Presentation), los casos de uso (Application) y la persistencia en Supabase, así como el correcto funcionamiento de los middlewares de seguridad (`authMiddleware`, `adminMiddleware`). También se verifica que los flujos entre módulos se comuniquen correctamente.

- **Framework:** Vitest con requests HTTP sobre el servidor levantado
- **Módulo de Créditos — endpoints verificados:**
  - `POST /api/v1/loans/simulate` — cálculo de cuotas
  - `POST /api/v1/loans` — creación de solicitud
  - `GET /api/v1/loans` — listado (cliente y admin)
  - `PATCH /api/v1/loans/:id/approve` — aprobación
  - `PATCH /api/v1/loans/:id/reject` — rechazo
- **Ubicación:** `backend/src/tests/integration/`
- **Base de prueba:** diseño de arquitectura, contratos de la API RESTful, flujos de datos entre módulos.

## 7.3 Pruebas de Sistema

**Objetivo:** Evaluar el comportamiento del sistema completo e integrado frente a los requisitos definidos.

Se ejecutan sobre el sistema desplegado localmente (backend `:3001` + frontend `:3000`), cubriendo los flujos de negocio de extremo a extremo de todos los módulos incluidos en el alcance. Incluye requisitos funcionales y no funcionales acotados (seguridad básica de JWT/2FA, ocultamiento de datos sensibles, bloqueo por intentos fallidos), probando escenarios válidos e inválidos.

**Herramientas empleadas:**

| Suite | Herramienta | Escenarios | Resultado |
|---|---|---|---|
| Cypress E2E — Créditos (funcional) | Cypress 15.21.1 | 18 tests, 5 suites | 18/18 ✅ |
| Cypress E2E — Créditos (accesibilidad) | Cypress + axe-core | 3 tests | 3/3 ✅ |
| Cypress E2E — Créditos (seguridad) | Cypress | 4 tests | 4/4 ✅ |
| BDD/Gherkin — Créditos | Serenity/JS + Screenplay | 7 scenarios | 7/7 ✅ |
| Pruebas asistidas por IA | Stagehand + Gemini Flash 2.0 | 3 escenarios | 3/3 ✅ |

- **Base de prueba:** especificación de RF, historias de usuario, objetivos de prueba del documento.

## 7.4 Pruebas de Aceptación

**Objetivo:** Validar que el sistema cumple las necesidades del negocio y de los usuarios finales, determinando si está listo para su cierre/entrega.

Se centran en confirmar que los flujos clave operan según lo esperado desde la perspectiva de cada rol:
- El **usuario final (cliente)** puede simular un crédito, enviarlo y consultar su estado.
- El **administrador** puede listar solicitudes, aprobarlas o rechazarlas con la correcta actualización de estados.

Los criterios de aceptación están formalizados como escenarios **Gherkin** (Given/When/Then) en `e2e/serenity/features/creditos/`, validados mediante Serenity/JS con el patrón Screenplay.

- **Base de prueba:** requisitos del negocio, historias de usuario (HU-27 a HU-32), criterios de aceptación BDD.
- **Evidencia:** reportes HTML de Serenity (`e2e/serenity/target/site/serenity/`).

---

# 8. TIPOS DE PRUEBA

## 8.1 Pruebas funcionales

Verifican que el sistema hace lo que el RF especifica. Se realizan en todos los niveles (unitario, integración, sistema):

| Tipo | Herramienta | Módulo | RF cubiertos |
|---|---|---|---|
| CRUD de entidades | Vitest (backend) | Auth, Loans, Pockets, Cards | RF-01/RF-55/RF-43/RF-64 |
| Flujos E2E de negocio | Cypress | Loans | RF-52 a RF-63 |
| Criterios de aceptación BDD | Serenity/JS + Gherkin | Loans | HU-27 a HU-32 |
| Flujos guiados por IA | Stagehand + Gemini Flash | Loans | RF-52, RF-55, RF-60 |

**Caso representativo — Ciclo de vida de un crédito (Cypress):**
```
simulate → create → list (client) → approve (admin) → verify status
```

## 8.2 Pruebas no funcionales

### Seguridad
- Acceso sin token JWT → `401 Unauthorized` (verificado en `loans-security.cy.ts`)
- Acceso de cliente a endpoint admin → `403 Forbidden`
- Inyección en campos numéricos (montos negativos, strings en campos numéricos) → rechazo con `400 Bad Request`
- 2FA: activación/verificación/desactivación (RF-11 a RF-14)

### Accesibilidad (a11y)
- Análisis con **axe-core** integrado en Cypress (`loans-a11y.cy.ts`)
- Verificación de contraste de color, atributos ARIA y navegación por teclado en la UI del simulador de créditos
- Herramienta: `cypress-axe` + `@axe-core/playwright`

### Rendimiento básico
- Tiempo de respuesta de endpoints críticos medido en pruebas de integración (Vitest)
- `POST /loans/simulate` < 500ms en ambiente local
- Se excluyen pruebas de carga masiva (ver §5.2)

## 8.3 Pruebas estáticas

- **Linting:** ESLint configurado en backend y frontend — se ejecuta como parte del pipeline CI (Jenkins)
- **Type checking:** TypeScript strict mode — errores de tipo como defectos en pre-commit
- **Análisis de código:** SonarQube (`npm run sonar`) con perfil configurado en `sonar-project.properties`; métricas: cobertura > 70%, code smells, duplicaciones, vulnerabilidades conocidas
- **Revisión de contratos API:** verificación manual de `docs/api/endpoints.md` contra implementación real

## 8.4 Pruebas de regresión

Después de cada corrección o modificación, se re-ejecutan todas las suites para asegurar que los flujos existentes no se rompan:

- **Comando unificado:** `scripts/regression.ps1 -Module loans` (Windows) / `scripts/regression.sh loans` (Linux/CI)
- **Scope:** suite Cypress (18 tests) + suite Serenity/JS (7 scenarios) + tests unitarios e integración (Vitest)
- **Integración CI:** Jenkins ejecuta regresión automáticamente en cada push a `dev`
- **Criterio de paso:** 0 tests fallidos; cualquier fallo bloquea el merge a `main`

---

# 9. TÉCNICAS DE DISEÑO DE PRUEBAS

| Técnica | Descripción | Aplicada en |
|---|---|---|
| **Partición de equivalencia** | Divide entradas en clases válidas/inválidas. Ej: montos de crédito (rango válido 500K–50M, inválido: negativo, 0, > 50M, texto) | Vitest unitarios, Cypress E2E |
| **Análisis de valores límite** | Prueba en bordes de rangos. Ej: monto = 500.000 (mínimo válido), 499.999 (inválido), 50.000.000 (máximo) | Vitest integración |
| **Tabla de decisión** | Combina condiciones para determinar acciones. Ej: (monto, plazo, tasa) → cuota mensual calculada | Pruebas de simulación de crédito |
| **Transición de estados** | Traza el ciclo de vida de una entidad a través de sus estados. Ej: solicitud → `pending` → `approved`/`rejected` | Cypress `loans-lifecycle.cy.ts` |
| **Casos de uso / BDD** | Escenarios Given/When/Then derivados de HU. Ej: "Dado que soy cliente, Cuando simulo un crédito de 1M a 12 meses, Entonces veo la cuota mensual calculada" | Serenity/JS + Gherkin |
| **Pruebas exploratorias guiadas por IA** | El agente Stagehand interpreta instrucciones en lenguaje natural e interactúa con la UI sin XPath/selectores rígidos | Stagehand + Gemini Flash 2.0 |
| **Pruebas basadas en sesión (SBTM)** | El agente Playwright MCP realiza sesiones de exploración guiadas por instrucciones y genera trazas JSON como evidencia | Playwright MCP Server |

---

# 10. ENTORNO DE PRUEBAS

| Componente | Detalle |
|---|---|
| **Backend** | Node.js 22, Express 5, TypeScript — `localhost:3001/api/v1` |
| **Frontend** | Next.js 16, React 19 — `localhost:3000` |
| **Base de datos** | Supabase (PostgreSQL) — instancia de prueba en cloud |
| **Navegador (E2E)** | Chromium (Cypress), Chromium (Playwright/MCP) |
| **Sistema operativo** | Windows 11 (desarrollo local), Linux Ubuntu (Jenkins CI) |
| **CI/CD** | Jenkins (`Jenkinsfile` en raíz) — ejecuta en cada push a `dev` |
| **Docker** | Docker Desktop (Windows) — usado para ReportPortal (`03-reportportal/docker-compose.yml`, puerto `:8088`) |
| **Observabilidad** | ReportPortal `:8088` — dashboards de resultados Cypress + Playwright |
| **Nube de pruebas** | Cypress Cloud — proyecto `ypgf2b`, historial de ejecuciones y Test Replay |

**Comando de arranque del entorno:**
```bash
# Backend
npm --prefix backend run dev   # :3001

# Frontend
npm --prefix frontend run dev  # :3000

# ReportPortal (si se requiere observabilidad)
cd test/pruebas-herramientas/herramientas-bedoya/03-reportportal
docker compose up -d
```

---

# 11. DATOS DE PRUEBA

## Usuarios de prueba

| Rol | Email | Uso |
|---|---|---|
| Cliente | `bedoyacanoandres2@gmail.com` | Simular crédito, crear solicitud, consultar estado |
| Administrador | `bedoyacanoandres@gmail.com` | Listar solicitudes, aprobar, rechazar |

> Los tokens JWT para estos usuarios se inyectan programáticamente en cada suite E2E mediante el comando `loginByApi` (Cypress) o `browser_evaluate` (Stagehand), evitando el flujo de login por UI en cada test.

## Datos de solicitudes de crédito

| Campo | Valor de prueba | Descripción |
|---|---|---|
| `amount` | 1.000.000 COP | Monto dentro del rango válido |
| `term_months` | 12 | Plazo estándar |
| `annual_rate` | 12 | Tasa EA en porcentaje |
| `purpose` | "Compra de computador" | Propósito del crédito |
| `amount` (límite bajo) | 500.000 COP | Valor mínimo permitido |
| `amount` (inválido) | -1, 0, "abc" | Valores de partición inválida |

## Datos para Katalon Recorder (pruebas Selenese)

Los scripts Katalon ubicados en `katalon/` usan usuarios estáticos precargados mediante:
```bash
npm run katalon:seed   # requiere backend :3001
```

---

# 12. CRITERIOS

## 12.1 Criterios de entrada

Las pruebas se inician cuando se cumplan **todas** las siguientes condiciones:

- [ ] El backend está desplegado y respondiendo en `:3001/health` con `200 OK`
- [ ] El frontend está disponible en `:3000`
- [ ] Los usuarios de prueba (`bedoyacanoandres@gmail.com` y `bedoyacanoandres2@gmail.com`) existen en Supabase con contraseñas conocidas
- [ ] Las variables de entorno de prueba están configuradas (`.env.test`)
- [ ] La suite de pruebas anteriores no registra bloqueos por deudas técnicas críticas

## 12.2 Criterios de salida

Las pruebas se dan por completadas cuando se cumplan **todas** las siguientes condiciones:

- [ ] **Cobertura de casos:** 100% de los escenarios de prueba diseñados han sido ejecutados al menos una vez
- [ ] **Tasa de éxito:** 0 tests fallidos en la suite de regresión (18 Cypress + 7 Serenity/JS + Vitest backend/frontend)
- [ ] **Defectos críticos:** no quedan defectos abiertos de severidad Alta o Crítica sin resolución o mitigación aceptada
- [ ] **Análisis estático:** SonarQube no reporta vulnerabilidades nuevas de nivel Critical/Blocker
- [ ] **Evidencias:** screenshots, reportes HTML y trazas JSON están disponibles para todos los escenarios ejecutados
- [ ] **Informe de cierre:** §19 de este documento está completado con las métricas finales

## 12.3 Criterios de aceptación

Un módulo se considera **aceptado** cuando:

- Todos sus RF asociados tienen al menos un caso de prueba ejecutado con resultado PASS
- Los escenarios BDD/Gherkin correspondientes pasan en Serenity/JS
- No existen defectos abiertos de severidad Alta o Crítica para ese módulo
- Los dashboards de ReportPortal muestran tendencia de estabilización (sin nuevas regresiones en los últimos 3 commits)

---

# 13. GESTIÓN DE DEFECTOS

## 13.1 Flujo de defectos

```
Detección → Reporte informal (canal de equipo) → Clasificación → Corrección (dev) → Re-test → Cierre
```

Dado que el proyecto es académico y el equipo es pequeño (4 personas), la gestión de defectos se realizó de forma informal a través de canales de comunicación directa (WhatsApp/Discord del equipo) y mediante **Issues en GitHub** para defectos técnicos relevantes.

**Estados de un defecto:**

| Estado | Descripción |
|---|---|
| **Nuevo** | Detectado y reportado, pendiente de clasificación |
| **En análisis** | El equipo confirma si es defecto real o comportamiento esperado |
| **En corrección** | Asignado al responsable del módulo para fix |
| **Pendiente re-test** | Fix implementado, esperando re-ejecución de pruebas |
| **Cerrado** | Re-test exitoso, defecto resuelto |
| **Diferido** | Confirmado como defecto pero fuera del alcance del sprint actual |

## 13.2 Clasificación de defectos

| Severidad | Criterio | Ejemplo |
|---|---|---|
| **Crítica** | El sistema falla completamente o hay pérdida de datos | Login no funciona, base de datos inaccesible |
| **Alta** | Funcionalidad principal rota, sin workaround | No se puede crear una solicitud de crédito |
| **Media** | Funcionalidad parcialmente afectada, existe workaround | El cálculo de cuotas muestra decimales incorrectos |
| **Baja** | Defecto cosmético o de usabilidad menor | Texto de error con typo, botón mal alineado |

| Prioridad | Criterio |
|---|---|
| **P1** | Bloquea la ejecución del ciclo de pruebas — debe resolverse inmediatamente |
| **P2** | Debe resolverse en el sprint actual |
| **P3** | Puede diferirse al siguiente sprint |

## 13.3 Herramienta de gestión

- **GitHub Issues** (repositorio del proyecto): para defectos con evidencia reproducible (código, logs, screenshots)
- **ReportPortal** (`localhost:8088`): seguimiento automático de fallos detectados por Cypress y Playwright con historial de ejecuciones y tendencias

---

# 14. IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | Ambiente de pruebas inestable (Supabase caídas, cambios de esquema) | Media | Alto | Datos de prueba idempotentes; seed script (`katalon:seed`); tokens de larga duración |
| R-02 | Cambios en endpoints de API sin actualizar contratos (`docs/api/endpoints.md`) | Alta | Alto | Verificación de contratos en CI (integración Vitest); alertas de SonarQube |
| R-03 | Fallo de la API key de Gemini (Stagehand) en pruebas IA | Media | Medio | Model routing configurado; degradación a mock si cuota agotada |
| R-04 | Conflictos de puertos (Jenkins `:8080` vs ReportPortal `:8088`) | Baja | Medio | ReportPortal configurado en `:8088` explícitamente |
| R-05 | Tests frágiles por selectores CSS cambiantes en Next.js | Media | Medio | Cypress usa `data-testid`; Stagehand usa IA semántica sin selectores rígidos |
| R-06 | Disponibilidad del equipo limitada (proyecto académico) | Alta | Medio | 4 integrantes, un módulo por persona; regresión automatizada reduce esfuerzo manual |
| R-07 | Cobertura insuficiente en módulos no-Loans | Media | Bajo | Alcance definido explícitamente en §5; pruebas de otros módulos en rama personal de cada integrante |
| R-08 | Resultados de IA no deterministas (Stagehand) | Alta | Bajo | Escenarios con instrucciones claras; reintentos configurados; evidencia capturada en fallo |
| R-09 | Docker no disponible para ReportPortal | Baja | Bajo | Herramienta opcional; reportes Mochawesome/HTML como alternativa |
| R-10 | Tokens JWT expirados durante la ejecución | Media | Alto | Tokens de larga duración generados al inicio de cada sesión de pruebas |

---

# 15. ORGANIZACIÓN Y RESPONSABILIDADES

El equipo de pruebas opera bajo un modelo horizontal y colaborativo, donde cada integrante lidera el aseguramiento de calidad de su módulo correspondiente con la misma jerarquía y corresponsabilidad técnica:

| Integrante | Módulo Asignado | Rol en el Proyecto | Responsabilidades Específicas |
|---|---|---|---|
| Andres Bedoya Cano | Créditos y Préstamos | Ingeniero de Calidad QA | Simulador, aprobación admin, suites Cypress E2E, BDD y herramientas |
| Dubin Andres Soto | Autenticación & Usuarios | Ingeniero de Calidad QA | Pruebas de registro, login, tokens JWT, seguridad y 2FA |
| Tomas Henao | Ahorros (Bolsillos) | Ingeniero de Calidad QA | Pruebas de bolsillos de ahorro, abonos, retiros e integridad de saldos |
| Stiven Alejandro Bustamante | Tarjetas Virtuales | Ingeniero de Calidad QA | Pruebas de emisión de tarjetas, datos sensibles y bloqueo/desbloqueo |

**Herramientas de colaboración:** GitHub (control de versiones y gestión de issues), canales del equipo (comunicación ágil)

---

# 16. CRONOGRAMA

| Semana | Período (aprox.) | Actividad | Responsable |
|---|---|---|---|
| S1-S2 | 23 jul – 05 ago 2026 | Configuración del entorno, setup del proyecto, primer commit | Todo el equipo |
| S3-S4 | 06 ago – 19 ago 2026 | Pruebas unitarias e integración (Vitest) — módulos Auth y Loans | Bedoya, Soto |
| S5-S6 | 20 ago – 02 sep 2026 | Pruebas de sistema manuales; análisis de RF por módulo | Todo el equipo |
| S7-S8 | 03 sep – 16 sep 2026 | Diseño de casos de prueba E2E; setup Cypress; primeras suites | Bedoya |
| S9-S10 | 17 sep – 30 sep 2026 | Implementación BDD/Gherkin con Serenity/JS; Katalon Recorder | Bedoya |
| S11 | 01 oct – 07 oct 2026 | Implementación Stagehand + IA (model routing Gemini Flash) | Bedoya |
| S12-S13 | 08 oct – 21 oct 2026 | Herramientas avanzadas: Playwright MCP, Cypress Cloud + AI, ReportPortal | Bedoya |
| S14 | 22 oct – 26 oct 2026 | Cierre: regresión final, revisión del plan de pruebas, commit final | Todo el equipo |

---

# 17. MÉTRICAS Y SEGUIMIENTO

## Métricas de cobertura

| Suite | Herramienta | Tests / Escenarios | Estado final |
|---|---|---|---|
| Unitarias backend | Vitest | — | ✅ Passing |
| Unitarias frontend | Vitest | — | ✅ Passing |
| Integración API | Vitest | 5 endpoints | ✅ Passing |
| E2E funcional (Loans) | Cypress 15.21.1 | 18 tests (5 suites) | ✅ 18/18 |
| E2E accesibilidad | Cypress + axe-core | 3 tests | ✅ 3/3 |
| E2E seguridad | Cypress | 4 tests | ✅ 4/4 |
| BDD/Gherkin (Loans) | Serenity/JS + Cucumber | 7 scenarios | ✅ 7/7 |
| AI-Driven (Loans) | Stagehand + Gemini Flash 2.0 | 3 escenarios | ✅ 3/3 |
| MCP Playwright | @playwright/mcp | 1 sesión de exploración | ✅ Completada |
| Cypress Cloud | Cypress Cloud + cy.prompt() | 4 tests | ✅ 4/4 (sync) |
| ReportPortal | Agentes Cypress + Playwright | Recibe ambas suites | ✅ Operativo |

**Total de checks automatizados activos:** 39 tests + 7 BDD scenarios + 3 AI escenarios = **49 verificaciones automatizadas**

## Métricas de calidad (SonarQube)

- **Cobertura de código:** objetivo ≥ 70% (verificado con `npm run test:coverage` + `npm run sonar`)
- **Code smells:** 0 críticos nuevos por sprint
- **Vulnerabilidades:** 0 de nivel Critical/Blocker al cierre

## Seguimiento de defectos

| Severidad | Encontrados | Resueltos | Abiertos |
|---|---|---|---|
| Crítica | 0 | 0 | 0 |
| Alta | 1 | 1 | 0 |
| Media | 3 | 3 | 0 |
| Baja | 2 | 1 | 1 (diferido) |

> **Nota:** El defecto abierto de severidad Baja corresponde a un ajuste cosmético de la UI del simulador de créditos, diferido para una iteración posterior sin impacto en la funcionalidad.

---

# 18. ENTREGABLES DE PRUEBA

| Entregable | Descripción | Ubicación |
|---|---|---|
| Plan de Pruebas (este documento) | Estrategia, alcance, criterios, métricas y organización | Repositorio GitHub (`docs/`) |
| Suite Cypress E2E | 5 archivos `.cy.ts` + reportes Mochawesome HTML | `cypress/e2e/`, `cypress/reports/` |
| Suite Serenity/JS | `.feature` Gherkin + implementación Screenplay | `e2e/serenity/features/`, `e2e/serenity/src/` |
| Suite Stagehand + IA | 3 escenarios TypeScript + evidencias PNG | `e2e/stagehand/src/scenarios/`, `e2e/stagehand/evidence/` |
| Herramienta MCP Playwright | Runner TypeScript + trace JSON + screenshot | `test/pruebas-herramientas/herramientas-bedoya/01-mcp-playwright/` |
| Herramienta Cypress Cloud + AI | Specs + `cy.prompt()` + historial en Cypress Cloud `ypgf2b` | `test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/` |
| Herramienta ReportPortal | Docker Compose + agentes + dashboards `:8088` | `test/pruebas-herramientas/herramientas-bedoya/03-reportportal/` |
| Sustentación de herramientas | Documento técnico de justificación y uso | `test/pruebas-herramientas/herramientas-bedoya/SUSTENTACION.md` |
| Reporte Serenity HTML | Sitio HTML con resultados BDD navegables | `e2e/serenity/target/site/serenity/` |
| Katalon Recorder suites | Scripts Selenese HTML para Créditos, Bolsillos, Depósito | `katalon/` |
| Informe final de pruebas | §19 de este documento | Este documento |

---

# 19. INFORME FINAL DE PRUEBAS

## Resumen ejecutivo

El ciclo de pruebas del proyecto FuBank fue completado satisfactoriamente dentro del marco del curso "Validación y Verificación de Software" (semestre 2026-2). Se implementó una estrategia de pruebas de múltiples niveles que abarca desde pruebas unitarias hasta pruebas E2E asistidas por IA, con tres herramientas avanzadas de automatización y observabilidad.

## Resultados finales

| Indicador | Valor |
|---|---|
| Total de verificaciones automatizadas | 49 (tests + escenarios BDD + escenarios IA) |
| Tasa de éxito en regresión final | 100% (0 fallos) |
| Defectos críticos/altos pendientes al cierre | 0 |
| Módulo con mayor cobertura | Créditos/Loans (18 Cypress + 7 BDD + 3 IA) |
| Commit final | `df760a8` — rama `dev` (25/10/2026) |
| Tiempo promedio de ejecución (regresión completa) | ~63 segundos (Cypress ≈15s + Serenity ≈12s + Stagehand ≈36s) |

## Hallazgos destacados

1. **El módulo de Créditos** es el más cubierto: flujos de simulación, creación, listado, aprobación y rechazo fueron verificados en tres capas independientes (API, E2E funcional, BDD).
2. **Stagehand con Gemini Flash 2.0** demostró ser viable para pruebas exploratorias sin selectores rígidos, con model routing que adapta el modelo según la complejidad del escenario.
3. **ReportPortal** centraliza resultados de Cypress y Playwright en dashboards separados, habilitando observabilidad de calidad independiente de la herramienta.
4. **Playwright MCP Server** demuestra una nueva modalidad de automatización donde el agente IA controla el browser via protocolo MCP, abriendo posibilidades de pruebas conversacionales.
5. **Cypress Cloud** con Test Replay permite reproducir ejecuciones fallidas frame a frame, lo que reduce significativamente el tiempo de diagnóstico.

## Conclusión

El sistema FuBank, en su módulo de Créditos, cumple con todos los criterios de aceptación definidos. Los demás módulos (Auth, Pockets, Virtual Cards) cuentan con cobertura en niveles unitario e integración. Se recomienda extender la cobertura E2E a los módulos restantes en iteraciones futuras.

---

# 20. GESTIÓN DEL DOCUMENTO

## 20.1 Historial de versiones

| Versión | Fecha | Descripción | Autor |
|---|---|---|---|
| 1.0 | 03/08/2026 | Versión inicial — estructura base e introducción | Equipo FuBanking |
| 2.0 | 26/10/2026 | Versión completa — secciones 8 a 20 completadas con evidencia real de testing | Equipo de Testing FuBanking |

## 20.2 Control de cambios

| Sección modificada | Versión 2.0 — Cambio realizado |
|---|---|
| §6 Estrategia | Actualizada con pirámide de pruebas + 3 herramientas avanzadas |
| §8 Tipos de prueba | Completada: funcional, no funcional (seguridad + a11y + rendimiento), estática, regresión |
| §9 Técnicas de diseño | Completada con 7 técnicas aplicadas al proyecto |
| §10 Entorno | Completado con puertos, CI/CD, Docker, Cypress Cloud |
| §11 Datos de prueba | Completado con usuarios reales y datasets de Créditos |
| §12 Criterios | Completado: entrada, salida, aceptación con checkboxes verificables |
| §13 Gestión de defectos | Completado: flujo, clasificación, herramientas (GitHub Issues + ReportPortal) |
| §14 Riesgos | Completado con 10 riesgos identificados y mitigaciones |
| §15 Organización | Completado con roles y módulos por integrante |
| §16 Cronograma | Completado con 14 semanas de actividades (jul–oct 2026) |
| §17 Métricas | Completado con 49 verificaciones y tabla de defectos |
| §18 Entregables | Completado con ubicaciones reales en el repositorio |
| §19 Informe final | Completado con resultados, hallazgos y conclusión |

## 20.3 Firmas de aprobación formal del equipo

| Rol / Función | Nombre Completo | Firma | Fecha |
|---|---|---|---|
| Ingeniero de Calidad (Créditos) | Andres Bedoya Cano | ___________________ | 26/10/2026 |
| Ingeniero de Calidad (Auth) | Dubin Andres Soto | ___________________ | 26/10/2026 |
| Ingeniero de Calidad (Bolsillos) | Tomas Henao | ___________________ | 26/10/2026 |
| Ingeniero de Calidad (Tarjetas) | Stiven Alejandro Bustamante | ___________________ | 26/10/2026 |
| Docente Evaluador | Profesor Asignatura | ___________________ | ___________ |
