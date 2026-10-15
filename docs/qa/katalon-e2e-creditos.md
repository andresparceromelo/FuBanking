# Automatización de Pruebas E2E con Katalon Recorder 7.1.0 — Módulo de Créditos (Cliente y Administrador)

**Rúbrica de Evaluación — Criterio 5 (20 Puntos):**  
> *"Automatización de recorridos funcionales con datos, localizadores, esperas y verificaciones. Nivel Alto: Presenta pruebas reproducibles, con localizadores adecuados, sincronización, casos positivos y negativos y evidencias de resultados. (20 puntos)"*

---

## 1. Justificación y Alineación con el Formato del Profesor

Las pruebas de Katalon se implementaron siguiendo de forma exacta el formato entregado por el profesor en `Suite_4_ejemplos_basicos.html` (Selenese HTML con tablas `<table>`, elementos `<thead>` y filas `<tr><td>command</td><td>target</td><td>value</td></tr>`), complementado con la suite exportada en formato JSON de Katalon Recorder 7.x.

### Actores y Credenciales Oficiales de Prueba (RBAC)

Para garantizar la ejecución desatendida y reproducible de los recorridos funcionales protegidos tras middleware de autenticación y control de acceso basado en roles:

| Actor | Rol en FuBanking | Email | Contraseña | Propósito en la Suite |
|---|---|---|---|---|
| **Gabriel** | Cliente Solicitante | `bedoyacanoandres2@gmail.com` | `Miabuela585*` | Simulación, validación de fronteras, reglas de negocio y solicitud de crédito. |
| **Andresito** | Administrador de Créditos | `bedoyacanoandres@gmail.com` | `FuBanking123*` | Auditoría de solicitudes, filtros por estado, aprobación y rechazo en mesa de control. |

### Estructura de la Suite en `katalon/`

```txt
katalon/
  Suite_Creditos_FuBanking.html                    # Suite maestra en formato HTML oficial del profesor (TC00 a TC12)
  FuBanking_Creditos_KatalonRecorder_Suite.json       # Versión JSON para importación directa en Katalon Recorder 7.x
  README.md                                        # Guía paso a paso de ejecución y detalles de cobertura
  │
  ├── TC00_Iniciar_Sesion.html                     # Caso 0: Login explícito del cliente Gabriel y validación de perfil
  ├── TC01_Simulacion_Exitosa_Estandar.html        # Caso 1: Simulación estándar ($5,000, 12 meses, 18% EA)
  ├── TC02_Simulacion_Valores_Frontera_Limites.html# Caso 2: Análisis de Valores Límite (BVA - $100 y $25M)
  ├── TC03_Validacion_Monto_Cuotas_En_Cero.html    # Caso 3: Validación defensiva ante ceros y vacíos
  ├── TC04_Validacion_Tasa_Interes_Extrema.html    # Caso 4: Robustez ante tasa 0% EA sin división por cero
  ├── TC05_Verificar_Requisitos_Perfil_Elegibilidad.html # Caso 5: Checklist de 4 requisitos y habilitación de solicitud
  ├── TC06_Solicitar_Credito_Usuario.html          # Caso 6: Gabriel simula y envía solicitud formal
  │
  ├── TC07_Admin_Iniciar_Sesion_Y_Acceso.html      # Caso 7: Login de administrador Andresito y acceso a /admin/loans
  ├── TC08_Admin_Filtros_Y_Actualizacion.html      # Caso 8: Filtros por estado (Todos, Pendientes, Aprobados, Rechazados)
  ├── TC09_Admin_Inspeccion_Detalle_Solicitud.html # Caso 9: Auditoría de riesgo, ingreso mensual y checklist crediticio
  ├── TC10_Admin_Aprobar_Credito_Usuario.html      # Caso 10: Golden Path - Administrador aprueba crédito
  ├── TC11_Admin_Rechazar_Credito_Alternativo.html # Caso 11: Flujo alternativo - Administrador rechaza solicitud
  │
  └── TC12_Ciclo_Completo_End_To_End.html          # Caso 12: Ciclo E2E Integral (Gabriel solicita -> Admin aprueba)
```

---

## 2. Matriz de Cobertura de Pruebas (13 Casos: Positivos, Negativos, Frontera y Auditoría)

| Caso de Prueba | Actor | Tipo de Flujo | Objetivo | Localizadores Utilizados | Sincronización y Verificación |
|---|:---:|:---:|---|---|---|
| **`TC00_Iniciar_Sesion`** | Gabriel | **Auth** | Iniciar sesión del cliente en `/login` y verificar redirección a `/profile`. | `id=email`, `id=password`, `css=button[type="submit"]` | `waitForElementPresent` (10s), `assertLocation` con `glob:*/profile` |
| **`TC01_Simulacion_Exitosa_Estandar`** | Gabriel | **Positivo** | Simular cuota con `$5,000`, 12 cuotas y 18% EA. | `id=loan-amount`, `id=loan-installments`, `id=btn-simulate`, `id=result-box` | `waitForElementPresent` (10s), `assertVisible` en cuota, `assertText` con `glob:*Simulación lista.*` |
| **`TC02_Simulacion_Valores_Frontera_Limites`** | Gabriel | **BVA / Frontera** | Probar límites mínimo ($100 a 3 meses) y máximo ($25M a 36 meses). | `id=loan-amount`, `id=loan-installments`, `id=btn-simulate` | `waitForElementPresent` (10s), `assertElementPresent` y verificación de cuota recalculada |
| **`TC03_Validacion_Monto_Cuotas_En_Cero`** | Gabriel | **Negativo / Defensivo** | Ingresar monto `0` y cuotas `0` para forzar validación preventiva. | `id=loan-amount`, `id=loan-installments`, `id=btn-simulate` | `waitForElementPresent` del mensaje defensivo, `assertElementPresent` de alerta |
| **`TC04_Validacion_Tasa_Interes_Extrema`** | Gabriel | **Robustez** | Simular préstamo con tasa 0% EA comprobando amortización lineal. | `id=loan-annual-rate`, `id=btn-simulate`, `id=result-box` | `waitForElementPresent` (10s), verificación de ausencia de fallo por división por cero |
| **`TC05_Verificar_Requisitos_Perfil_Elegibilidad`** | Gabriel | **Reglas de Negocio** | Comprobar los 4 badges de requisitos previos (documento, edad, ingreso, historial). | `xpath=//*[contains(.,'Requisitos para solicitar')]`, `id=btn-apply` | `assertElementPresent` en badges de requisitos y `assertVisible` en botón `#btn-apply` |
| **`TC06_Solicitar_Credito_Usuario`** | Gabriel | **Transaccional** | Gabriel simula crédito y dispara la solicitud con `#btn-apply`. | `id=btn-apply`, `xpath=//*[contains(.,'Solicitud')]` | `waitForElementPresent` (10s), confirmación de procesamiento de solicitud |
| **`TC07_Admin_Iniciar_Sesion_Y_Acceso`** | Andresito | **RBAC Admin** | Iniciar sesión con rol administrador y acceder a `/admin/loans`. | `id=email`, `id=password`, `xpath=//h1[contains(.,'Créditos')]` | `waitForElementPresent` (10s), `assertLocation` con `glob:*/admin/loans` |
| **`TC08_Admin_Filtros_Y_Actualizacion`** | Andresito | **Auditoría / UI** | Alternar filtros (`#filter-pending`, `#filter-approved`, `#filter-rejected`, `#filter-all`) y refrescar (`#btn-refresh-loans`). | `id=filter-pending`, `id=filter-approved`, `id=btn-refresh-loans` | `waitForElementPresent` (5s), `click` y validación de recarga de lista |
| **`TC09_Admin_Inspeccion_Detalle_Solicitud`** | Andresito | **Análisis de Riesgo** | Inspeccionar tarjetas de créditos, montos solicitados, cuotas e ingresos declarados. | `css=[data-testid="loan-card"]`, `xpath=//*[contains(.,'Estado')]` | `assertElementPresent` en tarjetas de crédito e indicadores de riesgo |
| **`TC10_Admin_Aprobar_Credito_Usuario`** | Andresito | **Golden Path** | Aprobar la solicitud de crédito del usuario mediante `#btn-approve`. | `id=btn-approve`, `css=[data-testid="btn-approve"]` | `waitForElementPresent` (10s), `click`, verificación de confirmación y cambio a Aprobado |
| **`TC11_Admin_Rechazar_Credito_Alternativo`** | Andresito | **Flujo Alternativo** | Rechazar una solicitud alternativa mediante `#btn-reject`. | `id=btn-reject`, `css=[data-testid="btn-reject"]` | `waitForElementPresent` (10s), `click`, verificación de cambio de estado a Rechazado |
| **`TC12_Ciclo_Completo_End_To_End`** | Gabriel y Andresito | **E2E Integral** | **Recorrido Completo:** Gabriel simula y solicita -> Logout -> Andresito entra y aprueba -> Logout -> Gabriel confirma aprobación. | Todos los selectores combinados de Gabriel y Andresito | Ejecución secuencial orquestada y sincronizada de extremo a extremo sin intervención humana |

---

## 3. Estrategias de Robustez Técnica e Idempotencia

1. **Precondición e Idempotencia de Sesión (Estándar Oficial del Docente)**:
   Al igual que en `Suite_4_ejemplos_basicos.html` del docente (`open | .../logout`), cada caso inicia limpiando cualquier estado residual de cookies/sesiones anteriores, garantizando que el formulario de login esté completamente disponible y no sufra redirecciones inesperadas.
2. **Sincronización React Hook Form en Tiempo Real**:
   Se sincronizaron los formularios para que las acciones de automatización headless o vía extensiones disparen los eventos de actualización del DOM antes del envío, eliminando falsos positivos de campos requeridos.
3. **Sincronización Explícita**: Para evitar fallos por condiciones de carrera o demoras de renderizado, se intercalan comandos `waitForElementPresent` con tiempos de espera seguros (`10000`–`15000` ms) antes de interactuar.
4. **Localizadores Canónicos**: Se utilizan IDs estables (`#loan-amount`, `#loan-installments`, `#loan-annual-rate`, `#btn-simulate`, `#btn-apply`, `#result-box`, `#btn-refresh-loans`, `#filter-pending`, `#btn-approve`, `#btn-reject`) diseñados específicamente para automatización profesional.
5. **Aislamiento Multiusuario**: Al terminar cada caso o sección, se invoca `open | http://localhost:3000/logout`, permitiendo alternar entre el rol de cliente (**Gabriel**) y administrador (**Andresito**) sin colisiones de sesión.

---

## 4. Instrucciones de Ejecución en Katalon Recorder 7.1.0

1. Iniciar los servidores locales de FuBanking:
   ```bash
   # Terminal 1: Backend (:3001)
   npm run dev:backend
   # Terminal 2: Frontend (:3000)
   npm run dev:frontend
   ```
2. Abrir la extensión **Katalon Recorder 7.1.0** en el navegador Chromium / Chrome.
3. **Cargar y Ejecutar la Suite Completa:**
   - Pulsar el icono de carpeta (**Open Suite**) y seleccionar `katalon/Suite_Creditos_FuBanking.html` (o `katalon/FuBanking_Creditos_KatalonRecorder_Suite.json`).
   - Se listarán los 13 casos de prueba (`TC00` a `TC12`).
   - Pulsar el botón verde **"Play Suite"** para ejecutar todos los escenarios de forma automatizada y desatendida.
4. **Cargar y Ejecutar un Caso Individual:**
   - Pulsar **Open Test Case** y seleccionar el caso deseado (ej. `TC10_Admin_Aprobar_Credito_Usuario.html` o `TC12_Ciclo_Completo_End_To_End.html`).
   - Pulsar **Play Test Case**.
