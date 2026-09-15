# Plan de Pruebas — Módulo de Créditos FuBanking

**Proyecto:** FuBanking (Node.js/Express + Next.js + Supabase)
**Alcance:** HU-27 a HU-32 (simulación, solicitud, historial, aprobación, rechazo)
**Framework:** Vitest 4 + Testing Library + jsdom
**Análisis estático:** SonarQube local, proyecto `FuBank`

## 1. Patrón AAA

Todos los specs siguen Arrange → Act → Assert, etiquetado con comentarios
`// Arrange`, `// Act`, `// Assert`. Referencia por capa:

| Capa | Archivo ejemplo |
|---|---|
| Caso de uso | `backend/src/tests/unit/loan/ApproveLoan.test.ts` |
| Controlador | `backend/src/tests/unit/loan/LoanController.test.ts` |
| Servicio FE | `frontend/src/tests/unit/services/loan.service.test.ts` |
| Hook | `frontend/src/tests/unit/hooks/useLoans.test.ts` |
| Componente | `frontend/src/tests/unit/components/LoanCard.test.tsx` |

Ejemplo (ApproveLoan, happy path):

```ts
// Arrange
const user = createTestUser();
await userRepo.save(user);
const loan = buildPendingLoan(user.id);
await loanRepo.save(loan);
// Act
const result = await useCase.execute(loan.id);
// Assert
expect(result.status).toBe(LoanApplicationStatus.APPROVED);
```

## 2. Los 5 tipos de dobles (mocks)

| Tipo | Dónde (archivo:línea aprox.) |
|---|---|
| Dummy | `ApproveLoan.test.ts` (`undefined` como notification repo); `confirmDelete(..., null)` en handlers |
| Fake | `backend/src/tests/unit/loan/in-memory-repos.ts` (repos Map en memoria) |
| Stub | `CardController.test.ts` (`vi.fn().mockResolvedValue(dto)`) |
| Spy | `ApproveLoan.test.ts` (`vi.spyOn(Math, 'random')` para forzar colisión de cuenta) |
| Mock | `useLoans.test.ts` (`vi.mock('@/features/loans/services/loan.service')`); `adminMiddleware.test.ts` (mock Jwt + Supabase) |

## 3. Principios FIRST

- **Fast:** dobles en memoria, sin red (ms por test).
- **Independent:** `beforeEach` reinstancia repos; sin estado compartido.
- **Repeatable:** `Math.random` fixeado con spies; fechas deterministas.
- **Self-validating:** todo `expect`/`rejects`, sin revisión manual.
- **Timely:** tests junto al código en `src/tests/unit/`.

Excepción documentada: `SupabasePocketRepository` usa `vi.resetModules()` por su flag
global de fallback; los guards de `handleCreate` en `LoansClient` son inalcanzables
por UI (botón deshabilitado) y se aserta el estado en su lugar.

## 4. Trazabilidad HU → TC → spec

| HU | TCs | Specs backend | Specs frontend |
|---|---|---|---|
| HU-27 | TC001–TC010, TC029–TC039 | SimulateLoan, validators, controller | loan.service, useLoans, LoansClient |
| HU-28 | TC011–TC015, TC040–TC043 | CreateLoanApplication, entity, controller | loan.service, useLoans, LoansClient |
| HU-29/30 | TC016–TC019, TC044–TC063 | GetUserLoans, GetAllLoans, repo, controller | loan.service, LoansClient, AdminLoansClient |
| HU-31 | TC020–TC024 | ApproveLoan, entity, Account, controller | admin.service, useAdminLoans, LoanCard, AdminLoansClient |
| HU-32 | TC025–TC028 | RejectLoan, entity, repo, controller | admin.service, useAdminLoans, LoanCard, AdminLoansClient |

## 5. Comandos

```bash
cd backend && npm run test             # suite backend
cd backend && npm run test:coverage    # + lcov → backend/coverage/lcov.info
cd frontend && npm run test            # suite frontend
cd frontend && npm run test:coverage   # + lcov → frontend/coverage/lcov.info
```

## 6. Umbrales

- Vitest backend: statements 85, branches 80, functions 85, lines 85.
- Quality Gate estricto (código nuevo): cobertura ≥ 90 %, duplicación ≤ 2 %,
  deuda ≤ 90 min, 0 bugs y 0 vulnerabilidades, rating A.
