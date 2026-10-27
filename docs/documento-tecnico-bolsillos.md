# Documento Técnico — Validación, Verificación y Refactorización del Módulo *Bolsillos*

**Proyecto:** FuBanking (banco digital)
**Módulo:** Bolsillos (*Pockets*)
**Asignatura:** Validación y Verificación de Software
**Alcance:** pruebas unitarias (AAA + FIRST + 5 dobles), análisis estático con SonarQube, evaluación manual de métricas, refactorización y Quality Gate estricto.
**Rama de trabajo:** `tests/bolsillos-unitarias-aaa`

---

## 1. Contexto y objetivo

FuBanking es un banco digital cuyo backend está construido con **arquitectura limpia** (Clean Architecture) en cuatro capas: **dominio**, **aplicación**, **infraestructura** y **presentación**. El objetivo de esta fase fue **verificar** la corrección de la lógica de negocio del módulo Bolsillos mediante pruebas unitarias automatizadas y **validar** la calidad interna del código mediante análisis estático, cerrando el ciclo con una **refactorización** medida y una reejecución del análisis.

Un **bolsillo** permite al usuario *apartar* dinero dentro de una cuenta (para metas de ahorro) sin sacarlo de ella. El monto apartado se descuenta del **saldo disponible** de la cuenta. El módulo expone cinco casos de uso:

| Caso de uso | Clase | Responsabilidad |
|---|---|---|
| Crear bolsillo | `CreatePocket` | Aparta un monto validando saldo disponible |
| Consultar bolsillos | `GetAccountPockets` | Lista los bolsillos de una cuenta |
| Actualizar bolsillo | `UpdatePocket` | Cambia nombre y/o monto, ajustando el saldo |
| Eliminar bolsillo | `DeletePocket` | Elimina y devuelve el monto al saldo |
| Transferir entre bolsillos | `TransferPocketBalance` | Mueve saldo entre dos bolsillos |

### 1.1 Arquitectura relevante para las pruebas

La clave que habilita las pruebas unitarias aisladas es el **Principio de Inversión de Dependencias (SOLID-D)**: los casos de uso no dependen de Supabase, sino de **interfaces de repositorio** (`IPocketRepository`, `IAccountRepository`, `INotificationRepository`). Esto permite **inyectar dobles de prueba** en lugar de la base de datos real.

```
CreatePocket(execute)
   ├── IAccountRepository   (findById, updateBalance, …)
   ├── IPocketRepository    (findById, save, getTotalAmountByAccountId, …)
   └── INotificationRepository? (save)   ← opcional
```

La entidad de dominio `Pocket` es **pura** (sin dependencias externas): encapsula sus invariantes (monto ≥ 0, nombre no vacío) y por tanto se prueba de forma totalmente aislada.

---

## 2. Estrategia de pruebas unitarias

### 2.1 Nivel unitario y aislamiento

Cada caso de uso se instancia inyectándole **dobles** de sus repositorios; así la prueba ejercita **solo la lógica del caso de uso**, sin red ni base de datos. La entidad `Pocket` se prueba directamente. Framework: **Vitest 4** con `@vitest/coverage-v8`.

Ubicación de la suite: `backend/src/tests/unit/pocket/` (7 archivos).

### 2.2 Patrón AAA (Arrange – Act – Assert)

Toda prueba se estructura y **rotula** en tres bloques. Ejemplo real (camino de error de `CreatePocket`):

```ts
it('lanza INSUFFICIENT_AVAILABLE_BALANCE cuando no hay saldo disponible', async () => {
  // Arrange — saldo 100.000, ya hay 100.000 reservados en otro bolsillo.
  accountRepo = new FakeAccountRepository([makeAccount({ balance: 100_000 })]);
  pocketRepo  = new FakePocketRepository([makePocket({ id: 'p0', amount: 100_000 })]);
  const sut = new CreatePocket(accountRepo, pocketRepo, notifRepo);
  const dto = { userId: 'user-1', accountId: 'acc-1', name: 'X', amount: 50_000 };

  // Act
  const run = sut.execute(dto);

  // Assert
  await expect(run).rejects.toMatchObject({
    code: 'INSUFFICIENT_AVAILABLE_BALANCE', statusCode: 400,
  });
});
```

### 2.3 Principios FIRST

| Principio | Cómo se cumple |
|---|---|
| **Fast** | Solo memoria (dobles), sin BD ni red → milisegundos. |
| **Independent** | Cada prueba arma sus propios dobles en `beforeEach`/local; no comparten estado. |
| **Repeatable** | Fechas y datos fijos → mismo resultado en cualquier máquina. |
| **Self-validating** | Terminan en `expect(...)`: pasan o fallan sin inspección manual. |
| **Timely** | Escritas junto al código de producción del módulo. |

### 2.4 Los 5 tipos de dobles de prueba (Test Doubles, G. Meszaros)

Definidos y documentados en `backend/src/tests/unit/pocket/test-doubles.ts`. La distinción entre los cinco es conceptual y se implementó de forma explícita:

**1. Dummy** — objeto que se pasa solo para cumplir la firma; **nunca** debe usarse. Se implementó lanzando excepción si alguien lo invoca, para *probar* que el camino no lo toca:

```ts
export class DummyNotificationRepository implements INotificationRepository {
  async save(): Promise<Notification> {
    throw new Error('DUMMY: save() no debería invocarse en este camino de prueba');
  }
  // …
}
```
*Uso:* en el camino de monto negativo de `CreatePocket` (falla antes de notificar → si el dummy se invocara, la prueba fallaría).

**2. Fake** — implementación funcional pero simplificada (repositorio en memoria con `Map`). Es el caballo de batalla de los caminos felices:

```ts
export class FakePocketRepository implements IPocketRepository {
  private readonly pockets = new Map<string, Pocket>();
  async save(p: Pocket)   { this.pockets.set(p.id, p); return p; }
  async findById(id)      { return this.pockets.get(id) ?? null; }
  async getTotalAmountByAccountId(accId) {
    return [...this.pockets.values()].filter(p => p.accountId === accId)
             .reduce((t, p) => t + p.amount, 0);
  }
  // …
}
```

**3. Stub** — devuelve respuestas **enlatadas** fijas; ignora los argumentos y no tiene estado:

```ts
export class StubAccountRepository implements IAccountRepository {
  constructor(private readonly canned: Account | null) {}
  async findById(): Promise<Account | null> { return this.canned; } // ignora el id
  // …
}
```
*Uso:* en `UpdatePocket` y `GetAccountPockets`, para alimentar el camino sin lógica de repositorio.

**4. Spy** — como un fake, pero además **registra** cómo fue llamado, para inspeccionarlo después:

```ts
export class SpyNotificationRepository implements INotificationRepository {
  public readonly savedNotifications: Notification[] = [];
  public saveCallCount = 0;
  async save(n: Notification) { this.saveCallCount++; this.savedNotifications.push(n); return n; }
  // …
}
```
*Uso:* verificar que `CreatePocket`/`DeletePocket` emiten exactamente una notificación con el título correcto.

**5. Mock** — objeto pre-programado con **expectativas verificables** (`vi.fn()`). Se *programa* la respuesta y se *verifica* la interacción:

```ts
// Arrange
const mockAccountRepo = makeMockAccountRepository(); // { findById: vi.fn(), updateBalance: vi.fn(), … }
mockAccountRepo.findById.mockResolvedValue(makeAccount({ balance: 500_000 }));
// … Act …
// Assert (verificación de comportamiento)
expect(mockAccountRepo.updateBalance).toHaveBeenCalledWith('acc-1', 380_000);
```

> **Diferencia spy vs mock:** el *spy* registra y se inspecciona *a posteriori* (verificación de estado sobre las llamadas); el *mock* se programa *a priori* con expectativas y **falla la prueba** si la interacción no ocurre como se esperaba (verificación de comportamiento).

**Mapa de dobles por archivo:**

| Archivo de prueba | Dobles que demuestra |
|---|---|
| `CreatePocket.test.ts` | Dummy, Fake, Spy, Mock |
| `UpdatePocket.test.ts` | Fake, Stub |
| `DeletePocket.test.ts` | Fake, Spy |
| `TransferPocketBalance.test.ts` | Fake |
| `GetAccountPockets.test.ts` | Fake, Stub |
| `Pocket.entity.test.ts` | *(unidad pura, sin dobles)* |

### 2.5 Diseño de casos y resultados

Se combinó **camino feliz** con **caminos de error** (cada validación de dominio), buscando cubrir todas las ramas. Distribución de las **58 pruebas**:

| Unidad | Pruebas | Ramas principales |
|---|:--:|---|
| `CreatePocket` | 11 | monto negativo, cuenta inexistente/ajena/no operativa, saldo insuficiente, feliz, con/sin notificación |
| `UpdatePocket` | 14 | nombre vacío, monto negativo, bolsillo/cuenta inexistente, FORBIDDEN, no operativa, saldo insuficiente, sin cambios, monto/nombre iguales |
| `DeletePocket` | 8 | bolsillo/cuenta inexistente, FORBIDDEN, no operativa, restitución de saldo, con/sin notificación |
| `TransferPocketBalance` | 11 | monto ≤ 0, mismo bolsillo, origen/destino inexistente, distinta cuenta, cuenta inexistente/ajena/no operativa, saldo insuficiente, feliz |
| `GetAccountPockets` | 4 | cuenta inexistente, FORBIDDEN, lista con datos, lista vacía |
| `Pocket` (entidad) | 10 | monto negativo/NaN/no-numérico, monto 0, `create()` recorta nombre, `updateName`/`updateAmount`, `toPublic` |

**Cobertura del módulo (medida con v8):**

```
Statements 100%  ·  Branches 100%  ·  Functions 100%  ·  Lines 100%
```

Verificación: `npx vitest run src/tests/unit/pocket` → **58/58 verde** (92/92 incluyendo las pruebas de `PocketController` y `SupabasePocketRepository` que aporta el equipo en la misma carpeta).

---

## 3. Análisis estático con SonarQube

### 3.1 Infraestructura

- **SonarQube Community Build** *self-hosted* (Docker) en la máquina de un integrante, expuesto vía túnel para la revisión.
- `projectKey = FuBank`, `sonar.host.url = http://localhost:9000` (sin `sonar.organization`, propio de instalaciones locales).
- **Cobertura importada** desde tres reportes LCOV que Sonar fusiona por archivo:
  - `backend/coverage/lcov.info` (Vitest, backend),
  - `backend/coverage-bolsillos/lcov.info` (c8, ronda manual),
  - `frontend/coverage/lcov.info` (Vitest, frontend).
- El `include` de cobertura de Vitest se amplió para medir la **entidad Pocket y los 5 casos de uso** (`src/domain/entities/Pocket.ts`, `src/application/use-cases/pocket/*.ts`).

### 3.2 Resultados de la 1.ª ejecución (línea base)

Proyecto completo (todos los módulos): **15.050 líneas de código**.

| Indicador | Valor | Rating |
|---|---|:--:|
| Quality Gate | Passed (gate "Sonar way", evalúa *New Code*) | — |
| Bugs | 6 | Reliability **C** |
| Vulnerabilidades | 0 | Security **A** |
| Code Smells | 156 | Maintainability **A** |
| Deuda técnica | 903 min (~15 h); *ratio* 0.2% | — |
| Cobertura | 96.2% (línea 96.4% · rama 95.8%) | — |
| Duplicación | 2.5% (469 líneas) | — |
| Security Hotspots | 14 (revisados 0%) | Review **E** |

> **Nota metodológica — MQR vs *legacy*:** SonarQube opera en *Multi-Quality Rule mode*. Conviven dos familias de rating: la nueva (`software_quality_*`) que muestra la UI y la clásica (`reliability_rating`, etc.). Los 6 "bugs" clásicos y los 32 "issues de reliability" MQR describen el mismo problema desde dos modelos.

> **New Code vs Overall (Clean as You Code):** la pestaña *Overall* acumula el estado de todo el proyecto (cambia poco al tocar un módulo pequeño); la pestaña *New Code* mide solo lo modificado en la ventana reciente. Es la vista relevante para el Quality Gate.

### 3.3 Estado del módulo Bolsillos en Sonar (por archivo, 1.ª corrida)

| Archivo | Cobertura | Ciclomática | Cognitiva | ncloc | Smells |
|---|:--:|:--:|:--:|:--:|:--:|
| `CreatePocket.ts` | 96.3% | 7 | 5 | 52 | 1 |
| `GetAccountPockets.ts` | 92.1% | 4 | 1 | 19 | 0 |
| `UpdatePocket.ts` | 92.0% (rama 88.2%) | **17** | **16** | 65 | 2 |
| `DeletePocket.ts` | 89.8% | 6 | 4 | 62 | 1 |
| `TransferPocketBalance.ts` | 91.3% (rama 85.2%) | 11 | 9 | 63 | 1 |
| `Pocket.ts` (entidad) | 97.8% | 16 | 2 | 95 | 0 |

Diagnóstico: **`UpdatePocket` es el punto crítico** (complejidad cognitiva 16, sobre el umbral 15 de Sonar → smell `S3776` CRITICAL). Las coberturas por debajo del 100% se deben a que la línea base venía de la ronda manual (c8); las pruebas Vitest la elevan a 100%.

---

## 4. Evaluación manual de métricas

Calculada estáticamente sobre el código (fuente: `docs/Metricas-Bolsillos.xlsx` + `Metricas-Bolsillos-Detalle.docx`). Convención adoptada: **V(G) = Decisiones + 1** a nivel de **predicado** (cada `if`/`catch` cuenta 1, no cada cláusula).

| Caso de uso (backend) | V(G) | Cognitiva | SLOC | CBO | DIT |
|---|:--:|:--:|:--:|:--:|:--:|
| `CreatePocket` | 6 | 5 | 52 | 6 | 1 |
| `GetAccountPockets` | 2 | 1 | 19 | 3 | 1 |
| `UpdatePocket` | 11 | 16 | 65 | 6 | 1 |
| `DeletePocket` | 5 | 4 | 62 | 6 | 1 |
| `TransferPocketBalance` | 10 | 9 | 63 | 6 | 1 |

- **SLOC** módulo backend: 373 (combinado BE+FE: 544).
- **Acoplamiento (CBO):** 6 en la mayoría (dependen de 3 interfaces de repositorio + entidades).
- **Herencia (DIT):** 1 (sin jerarquías de clases).
- **Cohesión:** alta y cualitativa — cada caso de uso tiene una sola razón de cambio (SRP), con un único método público `execute`.
- **Defectos documentados (E = 5):** D-01…D-05 (4 en Crear, 1 en Actualizar), hallados por las pruebas y registrados como hallazgos.

---

## 5. Comparación: métricas manuales vs SonarQube

### 5.1 Complejidad y tamaño

| Caso de uso | V(G) manual | Ciclo. Sonar | Cognit. manual | Cognit. Sonar | SLOC | ncloc |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `CreatePocket` | 6 | 7 | 5 | **5** | 52 | **52** |
| `GetAccountPockets` | 2 | 4 | 1 | **1** | 19 | **19** |
| `UpdatePocket` | 11 | 17 | 16 | **16** | 65 | **65** |
| `DeletePocket` | 5 | 6 | 4 | **4** | 62 | **62** |
| `TransferPocketBalance` | 10 | 11 | 9 | **9** | 63 | **63** |

### 5.2 Interpretación

- **Complejidad cognitiva y LoC: coincidencia exacta** manual = Sonar. Ambos aplican la misma definición de cognitiva (SonarSource) y el mismo conteo de líneas efectivas; la coincidencia **valida el cálculo manual**.
- **Complejidad ciclomática: Sonar reporta un valor mayor** (+1 a +6). No es un error, son **dos convenciones**:
  - *Manual:* `V(G) = Decisiones + 1` a nivel de **predicado**.
  - *Sonar:* suma **+1 por cada operador lógico** (`&&`, `||`) además de cada estructura de control (nivel **cláusula**).
  - La mayor brecha (`UpdatePocket`, 11 vs 17) corresponde al método con más condiciones compuestas.
- **Coincidencia de diagnóstico:** las tres métricas apuntan a lo mismo — `UpdatePocket` es el candidato a refactorización, señalado por igual por el análisis manual y por Sonar. También coinciden en **0 vulnerabilidades** (Security A) y en que las coberturas más bajas del módulo son `DeletePocket` (89.8%) y la **rama** de `TransferPocketBalance` (85.2%).

---

## 6. Refactorización

Se aplicaron **dos refactorizaciones**, ambas verificadas con las 58 pruebas (comportamiento idéntico) y con la cobertura en 100%.

| Commit | Refactorización |
|---|---|
| `6775c44` | Reducción de complejidad de `UpdatePocket` (Extract Method) |
| `a1e74cc` | Uso de `node:crypto` en los casos de uso |

### 6.1 `UpdatePocket` — smell `S3776` (CRITICAL)

**Problema:** `execute` concentraba validación de entrada, carga y autorización, ajuste de saldo y notificación en un solo método → complejidad cognitiva 16 (> 15).

**Técnica:** *Extract Method*. Se descompuso en cuatro métodos privados de responsabilidad única y se **adelantó** la validación de "sin cambios" (falla rápido, antes de tocar la base de datos):

```ts
async execute(dto: UpdatePocketDto): Promise<UpdatePocketResponseDto> {
  this.validateInput(dto);
  const { pocket, account } = await this.loadAuthorized(dto);

  if (dto.amount !== undefined && dto.amount !== pocket.amount) {
    await this.adjustAmount(pocket, account, dto.amount);
  }
  if (dto.name !== undefined && dto.name !== pocket.name) {
    pocket.updateName(dto.name);
  }

  const updated = await this.pocketRepository.update(pocket);
  await this.notify(dto.userId, updated.name);
  return updated.toPublic();
}
// + validateInput() + loadAuthorized() + adjustAmount() + notify()
```

**Resultado (máximo por función):**

| Métrica | Antes | Después |
|---|:--:|:--:|
| Complejidad cognitiva | 16 (crítica) | **6** |
| Complejidad ciclomática | 17 | **7** |
| Nº de funciones | 1 | 5 |
| Smell `S3776` | Presente | **Eliminado** |

### 6.2 `node:crypto` — smell `S7772` (MINOR)

SonarQube recomienda el prefijo `node:` para módulos internos. Corrección en los cuatro casos de uso que generan UUID:

```diff
- import { randomUUID } from 'crypto';
+ import { randomUUID } from 'node:crypto';
```
Archivos: `CreatePocket.ts`, `UpdatePocket.ts`, `DeletePocket.ts`, `TransferPocketBalance.ts`.

### 6.3 Evidencia — smells eliminados

| Regla | Descripción | Archivos | Severidad | Estado |
|---|---|---|:--:|:--:|
| `S3776` | Complejidad cognitiva 16 > 15 | `UpdatePocket.ts` | CRITICAL | ✅ Eliminado |
| `S7772` | Preferir `node:crypto` sobre `crypto` | Create · Update · Delete · Transfer | MINOR | ✅ Eliminado |

**Estado final del módulo:** 0 bugs · 0 vulnerabilidades · **0 code smells** · complejidad dentro de límites · **100% de cobertura**.

---

## 7. Quality Gate estricto

Se definió el gate **"Quality Gate Gabriel"** con umbrales estrictos. Aplicado en modo **Clean as You Code** (sobre *New Code*), la 2.ª corrida lo cumple:

| Condición | Umbral | New Code (2.ª corrida) |
|---|---|:--:|
| Cobertura | ≥ 90% | **100%** ✅ |
| Duplicación | ≤ 2% | **0.0%** ✅ |
| Issues nuevos | 0 | **0** ✅ |
| Deuda técnica (nueva) | ≤ 90 min | **0** ✅ |
| Ratings (Sec./Rel./Maint.) | A | **A** ✅ |
| Security Hotspots (nuevos) | revisados | **A** ✅ |

**Observaciones de ingeniería:**

1. La rúbrica pide *deuda técnica ≤ 90 **minutos***; la condición configurada usa *Technical Debt **Ratio** > 90%* (métrica distinta, casi nunca falla: el ratio real es 0.2%). Sobre *Overall* la deuda absoluta es 903 min; el umbral de 90 min solo es realista sobre **New Code** (donde es 0).
2. Las condiciones globales evalúan **todo el proyecto**. El gate no pasa en *Overall* por **6 bugs de accesibilidad en el frontend** (regla `S1082`) y **14 Security Hotspots** repartidos en otros módulos — **ninguno en Bolsillos**. Elevar el *Overall* a verde es trabajo de equipo; **el módulo Bolsillos ya cumple**.

---

## 8. Flujo de trabajo (Git y CI)

1. **Sincronización:** *fast-forward* de `main` a `upstream/main` (`e40d582`) antes de trabajar, para partir del estado del equipo.
2. **Rama por módulo:** `tests/bolsillos-unitarias-aaa`. Commits:
   - `6102a28` — 58 pruebas (AAA + FIRST + 5 dobles) + cobertura de Bolsillos en `vitest.config`.
   - `6775c44` — refactor de complejidad de `UpdatePocket`.
   - `a1e74cc` — `node:crypto`.
   - `32ee939`, `757a24d` — documentación (plan, informe, evidencia).
3. **Pull Request** hacia el repositorio del equipo y **merge**.
4. **2.ª corrida de SonarQube** con el código integrado → confirma cobertura y smells del módulo.

---

## 9. Conclusiones

- Se cubrió el módulo Bolsillos con **58 pruebas unitarias** que aplican **AAA**, **FIRST** y los **5 dobles de prueba**, alcanzando **100% de cobertura** (líneas y ramas) **sin errores**.
- El **análisis estático** confirmó el diagnóstico manual: `UpdatePocket` era el punto de mayor complejidad. La **comparación** manual vs Sonar mostró coincidencia exacta en cognitiva y LoC, y una diferencia *explicable* en ciclomática (conteo por cláusula vs por predicado).
- La **refactorización** (Extract Method + `node:crypto`) redujo la complejidad cognitiva máxima de **16 a 6** y dejó el módulo en **0 code smells**, sin alterar el comportamiento (pruebas verdes).
- El **Quality Gate estricto** se cumple sobre *New Code* (cobertura 100%, duplicación 0%, 0 issues, ratings A). El único frente abierto para el *Overall* corresponde a **otros módulos**, no a Bolsillos.

### Trabajo pendiente / recomendaciones

- Ajustar la condición del gate de *Technical Debt Ratio* a **Technical Debt (minutos)** o mantenerla explícitamente sobre *New Code*.
- (Equipo) Corregir los 6 bugs `S1082` del frontend y revisar los 14 Security Hotspots para llevar el *Overall* a verde.
- Añadir, si se desea rigor formal, una métrica de **cohesión** (p. ej. LCOM) a la hoja de métricas manuales, hoy documentada de forma cualitativa.
