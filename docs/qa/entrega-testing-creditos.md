# Entrega testing — módulo créditos (+ base común)

Patrón del ejemplo del profesor (`RegressionTesting`): AAA obligatorio, FIRST, tablas de bordes, presupuesto explícito en performance, asserts negativos en seguridad.

## 1. Regresión

| Qué | Dónde | Resultado |
|---|---|---|
| Selectiva backend loans | `npm run test:loans` → `unit/loan/**` + `regression/` + `security/` + `performance/` | 15 archivos, 119 tests |
| Selectiva por tipo | `npm run test:regression` / `test:security` / `test:performance` (carpetas espejo del ejemplo del profesor, cada una con README) | — |
| Selectiva frontend loans | `npm run test:loans` → `src/tests/unit/loans/` (usuario) + `src/tests/unit/admin/` (aprobación, espejo de `features/`) | 9 archivos, 69 tests |
| Atajo | `sh scripts/regression.sh loans` / `.\scripts\regression.ps1 -Module loans` / `npm run test:regression:loans` | OK |
| Contrato HTTP nuevo | `src/tests/regression/loan.regression.test.ts` (5 tests: simulate 200, create 201, duplicado 400 `LOAN_ALREADY_PENDING`, flujo admin approve/reject) vía `tests/helpers/createLoanTestApp.ts` (repos en memoria, JWT reales con env dummy) | 5/5 |
| `loanResponseMapper` | `src/tests/unit/loan/loanResponseMapper.test.ts` (único use-case sin spec directo) | 2/2 |

## 2. Performance

| Qué | Dónde | SLO |
|---|---|---|
| Tiempos F01–F05 loans | `scripts/performance/measure-response-times.ts` (3 warm-up + 20 reps, avg/min/max/p50/p95; **exit 1 si p95 > SLO**) | simulate 500ms, lecturas 1000ms, escrituras 2000ms |
| Recursos | `scripts/performance/measure-resources.ts` (solo Windows) | informativo |
| Cálculo y latencia en memoria (Nivel 1: Sin k6) | `src/tests/performance/loan.performance.test.ts` (cálculo amortización + latencia HTTP + ráfaga 20 concurrentes en memoria con p95 < 500ms; corre en cada CI) | <500ms |
| Carga concurrente real (Nivel 2: Grafana k6) | `scripts/performance/loans-load.js` — k6, 20 VUs/30s, `p(95)<500`, `failed<1%` sobre `simulate` + `me`. Requiere back vivo + `FUBANKING_JWT`. Jenkins: stage `Performance: k6` con SKIP si falta k6 o JWT | p95<500 |
| Limpieza | eliminados `backend-measure-*.ts` (duplicados) y `test-performance.ts` (roto, rutas inexistentes) | — |

## 3. Seguridad

| Qué | Dónde |
|---|---|
| Rate-limit loans | `loan.routes.ts`: `simulateLimiter` 30/min, `createLoanLimiter` 10/min (clave usuario, fallback IP) → 429 `RATE_LIMIT_EXCEEDED` + `Retry-After` |
| Rate-limit base común | `auth.routes.ts`: `loginRateLimiter` 10/min por email+IP (anti fuerza-bruta) |
| Tests HTTP | `src/tests/security/loan.security.test.ts` (13 tests): 401 sin token (POST+GET), 401 token inválido, 403 no-admin en `/admin/*`, fuzz 400 (`amount/installments/annualRate`, id no-uuid), aislamiento `/me` por usuario, 429 contra la config real de producción | 13/13 |
| Existente reutilizado | helmet+CORS+10kb, `authMiddleware`/`adminMiddleware` (fábrica `createAdminMiddleware(repo?)` para fakes), zod, `npm audit --audit-level=high` en Jenkins (stage `Security: npm audit`) |

## 4. Cómo reproducir

```bash
# Nivel 1: Pruebas canónicas de crédito (sin herramientas externas)
npm run test:regression:loans
npm --prefix backend run test:performance

# Nivel 2: Carga de producción con k6 (opcional, requiere back vivo + FUBANKING_JWT)
npm run test:load:k6
```
