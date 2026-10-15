# Sustentación de Testing — FuBanking (Banca Web Académica)

Este documento centraliza la evidencia, trazabilidad y check-lists de las pruebas automatizadas desarrolladas para el proyecto **FuBanking**, siguiendo estrictamente los lineamientos del profesor y replicando la estructura de pruebas de regresión, API testing, seguridad y performance mostrada en el proyecto de ejemplo.

El equipo se divide en 4 módulos principales, y todas las pruebas correspondientes se han ejecutado y superado exitosamente.

---

## 1. Trazabilidad Específica: Módulo de CRÉDITOS (`loans`)
*(A cargo de Andrés Bedoya Cano)*

El módulo de créditos es la referencia del proyecto y posee una cobertura exhaustiva en 4 niveles, aislados y con el patrón **AAA (Arrange, Act, Assert)**.

### a. Regresión Funcional & Pruebas de Dominio (`unit/`)
Se garantizó la integridad del dominio asegurando que la lógica de negocio se ejecuta sin depender de la red o base de datos.
- **Entidad `LoanApplication`**: Validaciones estrictas de creación, transiciones de estado válidas (`PENDING` → `APPROVED` / `REJECTED`) y aserciones sobre cálculos de montos.
- **Casos de Uso**: Ejecución exitosa de `CreateLoanApplication`, `SimulateLoan`, `ApproveLoan`, `RejectLoan`, `GetUserLoans` y `GetAllLoans` utilizando los 5 tipos de dobles de prueba (Fakes y Mocks construidos con `vi.fn()`).

### b. API Testing (Contrato HTTP en memoria, `regression/`)
Se comprobó la integración HTTP montando la app Express con repositorios en memoria (`supertest`), creando fábricas frescas por cada bloque `it`.
- `POST /api/v1/loans/simulate`: Retorna 200 con cuota mensual calculada y amortización francesa.
- `POST /api/v1/loans/`: Creación de crédito en estado 201 (`PENDING`).
- `POST /api/v1/loans/` (duplicado): El sistema rechaza la solicitud (400 `LOAN_ALREADY_PENDING`) ya que un usuario solo puede tener un crédito pendiente a la vez.
- `PATCH /api/v1/loans/admin/:id/approve` y `reject`: Retorna 200 y el crédito transiciona su estado correctamente.

### c. Performance Testing (`performance/`) — Enfoque Híbrido
- **Nivel 1 (Evaluación académica y CI / Sin herramientas externas)**:
  - `loan.performance.test.ts` implementado 100% en Vitest. Contiene:
    1. Test CPU-bound de amortización francesa: bucle de 5 repeticiones con `performance.now()`, validando **mediana < 500ms** y regresión numérica (`toBeCloseTo`).
    2. Test de latencia de endpoints HTTP (`POST /simulate` y `GET /me`) en memoria: **mediana < 100ms**.
    3. Test de concurrencia nativo sin k6: ráfaga de 20 peticiones simultáneas vía `Promise.all` + `supertest`, comprobando **100% éxito (status 200)** y **p95 < 500ms**.
- **Nivel 2 (Grado Producción / Carga Concurrente con Grafana k6)**:
  - Para pruebas de carga distribuidas de grado industrial, se mantiene `scripts/performance/loans-load.js` (20 Virtual Users durante 30s con SLO p95 < 500ms) ejecutable con `npm run test:load:k6` o Docker.

### d. Security Testing (`security/`)
Aseguramiento de rutas, autorizaciones e input de usuario.
- **Aislamiento (`GET /me`)**: Un usuario jamás puede visualizar las solicitudes de préstamo de otro usuario (403/Empty).
- **Protección de rutas (401/403)**: Un token inexistente falla con 401. Un usuario regular no puede acceder a las rutas `/admin` (403 Forbidden).
- **Fuzzing (400)**: Inyección de payloads anómalos (montos negativos, cuotas en 0, tasas negativas) para comprobar la robustez de los DTOs y validadores.
- **Rate-Limiting (429)**: Se excede intencionalmente la cuota de peticiones (`POST /simulate` > 30/min, `POST /loans` > 10/min) para validar que la memoria active el bloqueo y retorne la cabecera `Retry-After`.

---

## 2. Check-Lists por Módulo

### 1. Módulo: CRÉDITOS (`loans`)
- [x] Regresión Funcional y Unitaria (AAA explícito).
- [x] API Testing (Aislamiento HTTP sin teardowns dependientes).
- [x] Performance (Mediana educativa menor al presupuesto).
- [x] Security (Aislamiento, Fuzzing, Rate Limiting, Role-Based Access Control).

### 2. Módulo: AUTENTICACIÓN (`auth`)
- [x] Regresión Funcional: Casos de uso `RegisterUser`, `LoginUser` verificados.
- [x] API Testing: `POST /register` crea usuario 201, `POST /login` retorna Token 200.
- [x] Performance (`auth.performance.test.ts`): Criptografía de JWT ejecutada de manera óptima por debajo del presupuesto CPU.
- [x] Security: 401 en credenciales inválidas, 400 en payload malformado.

### 3. Módulo: BOLSILLOS (`pockets`)
- [x] Regresión Funcional: Lógica de negocio de `TransferPocketBalance` validada con dobles.
- [x] API Testing: `POST /` (201), `GET /account/:accountId` (200), `PATCH /:id` (200), `DELETE /:id` (200).
- [x] Performance (`pocket.performance.test.ts`): Validación algorítmica de saldos en memoria para 100 transferencias en un presupuesto estricto (<20ms).
- [x] Security: 403 al acceder/transferir a bolsillos ajenos o entre cuentas distintas, 400 contra montos en negativo.

### 4. Módulo: TARJETAS VIRTUALES (`cards`)
- [x] Regresión Funcional: Lógica en memoria para `CreateVirtualCard`, `ToggleCardLock` y validación de entidades.
- [x] API Testing: `POST /` (201), `GET /me` (200), `GET /:id/reveal` (200).
- [x] Performance (`card.performance.test.ts`): Generación de números aleatorios, algoritmo de fechas y CVVs de forma rápida y sub-milisegundo.
- [x] Security: Aislamiento severo, imposibilidad de revelar detalles CVV o cambiar estados (lock/unlock) de la tarjeta de otro usuario.

---

## 3. Comandos de Reproducción (Ejecución del Plan)

Toda la evidencia se encuentra commiteada. Para ejecutar y validar los diferentes conjuntos de pruebas bajo el proyecto:

```bash
# 1. API Testing (Contratos supertest de endpoints para los 4 módulos)
npm --prefix backend run test:api

# 2. Regresión HTTP (Aislamiento HTTP de no-regresión)
npm --prefix backend run test:regression

# 3. Seguridad HTTP (Aislamiento, RBAC, 400, Rate limits)
npm --prefix backend run test:security

# 4. Performance Nivel 1 (Presupuesto algorítmico y concurrencia sin k6, 100% Vitest)
npm run test:performance

# 5. Performance Nivel 2 (Carga de producción con Grafana k6 - opcional)
npm run test:load:k6

# 6. Suite completa de créditos (Trazabilidad total)
npm --prefix backend run test:loans

# 7. Ejecutar la suite absoluta del frontend unificada por módulos
npm run test:frontend

# 8. Ejecutar la suite absoluta del backend (Asegurar que no hay regresiones cruzadas)
npm run test:backend
```

El modelo de pruebas en el frontend ha sido unificado bajo la misma estructura del backend (por módulos/features: `auth/`, `pockets/`, `cards/`, `loans/`, `profile/`), facilitando la revisión y demostrando un sistema resiliente, asilado y profesional, alineado a las rúbricas establecidas.
