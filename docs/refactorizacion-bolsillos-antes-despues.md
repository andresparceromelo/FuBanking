# Refactorización del módulo Bolsillos y Depositar — Antes y después

**Proyecto:** FuBanking · **Módulo:** Bolsillos (crear, consultar, editar, eliminar, transferir) + Depositar dinero
**Responsable:** Alejandro · **Periodo:** 2026-09-14 a 2026-10-26
**Alcance:** backend (Express + Supabase) y frontend (Next.js) del módulo, más los arreglos de calidad de todo
el proyecto que salieron del análisis de SonarQube.

Este documento reúne en un solo lugar **todas las refactorizaciones hechas a partir de los hallazgos de las
pruebas**. Para cada una muestra qué prueba encontró el problema, el código antes y después, y cómo se
verificó que el comportamiento quedó correcto y sin regresiones.

---

## 1. Resumen

| ID | Hallazgo | Detectado por | Capa | Commit | Resultado |
|---|---|---|---|---|---|
| R-01 | Complejidad cognitiva 16 > 15 en `UpdatePocket` (S3776, CRÍTICO) | SonarQube, 1.ª corrida | Backend | `6775c44` | Complejidad cognitiva 16 → 6; ciclomática 17 → 7 |
| R-02 | `crypto` en vez de `node:crypto` (S7772) en 4 casos de uso | SonarQube | Backend | `a1e74cc` | 3 smells menores → 0 |
| R-03 | 32 problemas de confiabilidad y 14 *security hotspots* | SonarQube (modo MQR) | Front + back | `b9a0191` | Reliability 32 → 0; hotspots revisados y corregidos |
| R-04 | Nodemailer podía enviar correo por SMTP en claro (S5332) | SonarQube | Backend | `2897a57` | Conexión cifrada obligatoria (`secure: true`) |
| R-05 | El token temporal de 2FA y el de *reset* servían como token de acceso (SEC-01/02) | Pruebas de seguridad | Backend | `cabb874` | Lista blanca de tokens de acceso; 2FA ya no se puede saltar |
| R-06 | *Type juggling* de montos: `true` → 1, `null` → 0, `[1500]` → 1500 (SEC-03/04, D-02, D-08) | Pruebas de seguridad y de regresión | Backend | `cabb874` | Montos estrictos: solo número JSON o texto decimal |
| R-07 | Bolsillo con nombre de solo espacios (DEF-001 = D-01/D-03) | Regresión (RG-CR-D03) y Katalon (TC-110) | Back + front | `b366dbf` | 400 `INVALID_POCKET_NAME` antes de tocar el saldo |
| R-08 | *Hydration mismatch* del tema que borraba lo escrito en el login | Katalon Recorder (E2E) | Frontend | `8ff70c1` | El primer render coincide con el SSR |
| R-09 | Sin "Recordarme", el token iba a `sessionStorage` y la API no lo enviaba (E2E-01) | Serenity/JS (E2E) | Frontend | `365171d` (equipo) | `getAuthToken` lee `localStorage`, `sessionStorage` y la cookie |
| R-10 | 6 violaciones WCAG 2.1 AA graves o críticas en Bolsillos y Cuentas (A11Y-01…06) | Cypress + axe-core (`accesibilidad.feature`) | Frontend | esta entrega | Escenarios de accesibilidad 0/3 → 4/4 |
| R-11 | El backend no compila en Docker: `ws` sin tipos (`TS7016`) | Build de la imagen (preparando Keploy y el despliegue) | Backend | esta entrega | `tsc` sin errores; la etapa de build de Jenkins no se cae |

---

## 2. Detalle de cada refactorización

### R-01 · `UpdatePocket`: de un método de 60 líneas a cuatro responsabilidades

**Hallazgo.** SonarQube marcó `execute()` con complejidad cognitiva 16 (umbral 15, severidad CRÍTICA). Validación,
autorización, ajuste de saldo y notificación estaban mezclados en un solo bloque.

**Antes** (`backend/src/application/use-cases/pocket/UpdatePocket.ts`, extracto):

```ts
async execute(dto: UpdatePocketDto): Promise<UpdatePocketResponseDto> {
  if (dto.name !== undefined && !dto.name.trim()) { throw new AppError(/* … */); }
  if (dto.amount !== undefined && dto.amount < 0) { throw new AppError(/* … */); }
  const pocket = await this.pocketRepository.findById(dto.pocketId);
  // … cuenta, propiedad, operatividad …
  if (dto.amount !== undefined && dto.amount !== pocket.amount) {
    const totalReserved = await this.pocketRepository.getTotalAmountByAccountId(account.id);
    // … 10 líneas de cálculo de saldo …
  }
  if (dto.name !== undefined && dto.name !== pocket.name) { pocket.updateName(dto.name); }
  if (dto.amount === undefined && dto.name === undefined) { throw new AppError(/* NO_CHANGES */); }
  const updated = await this.pocketRepository.update(pocket);
  if (this.notificationRepository) { /* … notificación … */ }
  return updated.toPublic();
}
```

**Después:**

```ts
async execute(dto: UpdatePocketDto): Promise<UpdatePocketResponseDto> {
  this.validateInput(dto);                                   // falla rápido, sin tocar la BD
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
```

**Mejora.** "Sin cambios" (`NO_CHANGES_PROVIDED`) se valida antes de consultar la base de datos; antes se
validaba al final, después de dos lecturas. Cada método privado tiene un único motivo para cambiar.

| Métrica (función más compleja) | Antes | Después |
|---|---|---|
| Complejidad cognitiva | 16 | 6 |
| Complejidad ciclomática | 17 | 7 |
| Smells de Sonar en el archivo | 1 crítico | 0 |

**Verificación.** Las 58 pruebas unitarias (AAA + 5 dobles) siguieron en verde y la cobertura del módulo se
mantuvo en 100 % (líneas y ramas).

### R-02 · `node:crypto` en los casos de uso

**Hallazgo.** Regla S7772: los módulos nativos de Node deben importarse con el prefijo `node:`.

```diff
- import { randomUUID } from 'crypto';
+ import { randomUUID } from 'node:crypto';
```

Aplicado en `CreatePocket`, `UpdatePocket`, `DeletePocket` y `TransferPocketBalance`.

### R-03 · Confiabilidad y seguridad del proyecto (Sonar)

**Hallazgo.** La primera corrida de SonarQube dejó Reliability en **C** (32 problemas) y 14 *security hotspots* sin
revisar, lo que impedía pasar el Quality Gate del equipo.

| Regla | Antes | Después | Archivos (ejemplos) |
|---|---|---|---|
| S6853 · `label` sin control asociado | `<label>Monto</label>` suelto | `htmlFor` + `id` | `CreateAccountModal`, `DepositWithdrawModal`, `TransferForm` |
| S6848/S1082 · `div` clicable sin teclado | `onClick` en un `div` | `role="dialog"` / `role="button"`, `tabIndex`, `onKeyDown` | `AccountDetailModal`, `AccountCard`, `VirtualCard` |
| S7773 · globales numéricos | `parseInt`, `isNaN` | `Number.parseInt`, `Number.isNaN` | `history/page.tsx`, `requests/page.tsx` |
| S2245 · aleatorio inseguro | `Math.random()` para número de cuenta, CVV, referencias | `node:crypto.randomInt` y `crypto.randomUUID()`; helper `secureRandom.ts` (Web Crypto) | `CreateAccount`, `VirtualCard`, `Transaction`, `ToastProvider` |
| S5852 · regex con riesgo de ReDoS | Cuantificadores sin límite en el email | Cuantificadores acotados | `Email.ts` |

**Mejora.** Reliability **C → A** (32 → 0) y los 14 hotspots revisados. Es la base para que el pipeline pase el
Quality Gate ("0 issues nuevos, cero smells, coverage 92", commit `d62e391` en `main`).

### R-04 · Conexión cifrada obligatoria en Nodemailer

```diff
  nodemailer.createTransport({
    service: 'gmail',
+   secure: true, // fuerza conexión cifrada (SMTPS/465); evita SMTP en claro (S5332)
    auth: { user: env.GMAIL_USSER, pass: env.GMAIL_PASS },
  });
```

### R-05 · Bypass de 2FA (SEC-01/SEC-02)

**Hallazgo.** Las pruebas de seguridad (`backend/src/tests/security/pocket/autenticacion.security.test.ts`)
demostraron que el token **temporal** que se emite antes de ingresar el código 2FA, y el de **recuperación de
contraseña**, eran aceptados por `authMiddleware` como si fueran de acceso: se podía operar bolsillos sin
completar el segundo factor.

**Antes:** `authMiddleware` solo verificaba la firma del JWT.

**Después:** lista blanca de tokens de acceso (`presentation/middlewares/accessToken.ts`):

```ts
export function isAccessToken(payload: TokenPayload): boolean {
  return payload.type === undefined || payload.type === 'auth';
}
```

```ts
// authMiddleware y adminMiddleware
if (!isAccessToken(payload)) {
  sendError(res, 'Token inválido', 'TOKEN_INVALID', 401);
  return;
}
```

`GenerateTwoFactorCode` ahora firma el temporal con `type: '2fa'`. Cualquier tipo nuevo de token queda
rechazado por defecto.

### R-06 · Montos estrictos (SEC-03/SEC-04, D-02, D-08)

**Hallazgo.** Al crear un bolsillo (`z.coerce.number()`) y al depositar (`Number(amount)`), `true` valía 1,
`null` valía 0 y `[1500]` valía 1500: se creaban bolsillos de $1 y depósitos de $1 con un booleano.

**Después** (`presentation/validators/amount.validators.ts`):

```ts
export function parseStrictAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && DECIMAL_TEXT.test(raw.trim())) return Number(raw.trim());
  return Number.NaN; // booleanos, null, listas, objetos, "0x10", "1e3"…
}
```

```diff
// AccountController.deposit
- amount: Number(amount),
+ amount: parseStrictAmount(amount), // NaN → DepositMoney responde INVALID_AMOUNT
```

**Verificación.** Pruebas de regresión RG-CR-D02 y RG-DE-D08 pasaron de `it.fails` a pruebas normales. Los
escenarios `@seguridad` de Gherkin (Serenity y Cypress) y los casos DE-04…DE-06 de Postman envían `true`,
`null`, `"abc"` y `[1000]` y exigen 400 `INVALID_AMOUNT` sin cambio de saldo.

### R-07 · Nombres de bolsillo de solo espacios (DEF-001)

**Hallazgo.** Katalon (TC-110) y la regresión (RG-CR-D03): `"   "` pasaba el validador y se creaba un bolsillo
con nombre vacío. **El dinero ya se había descontado** cuando la entidad fallaba.

```diff
// backend · CreatePocket.execute(), antes de tocar la cuenta
+ if (!dto.name?.trim()) {
+   throw new AppError('El nombre del bolsillo no puede estar vacío', 400, 'INVALID_POCKET_NAME');
+ }
```

```diff
// frontend · pocket.handlers.ts → handleCreate
- if (!input.accountId || !input.name) {
+ if (!input.accountId || !input.name.trim()) {     // toast "Falta información"
…
-   name: input.name,
+   name: input.name.trim(),
```

**Verificación.** TC-110 en Katalon pasó de fallar a aprobar (corrida 52/52, `katalon/evidencias/`). RG-CR-D03
dejó de ser `it.fails`. CB-04 de Postman cubre el caso.

### R-08 · *Hydration mismatch* del tema (frontend)

**Hallazgo.** Al grabar Katalon con el navegador en modo claro, React regeneraba la página de login y se perdía
lo ya escrito. `ThemeProvider` leía `localStorage`/`matchMedia` en el inicializador de `useState`, así que el
primer render del cliente no coincidía con el HTML del servidor (siempre `dark`).

```diff
- const [theme, setTheme] = useState<Theme>(() =>
-   globalThis.window === undefined ? 'dark' : resolveInitialTheme()
- );
+ const [theme, setTheme] = useState<Theme>('dark');        // igual que el SSR
+ const [resolved, setResolved] = useState(false);          // no tocar DOM/localStorage hasta resolver
```

**Mejora.** El script `fubank-theme-init` del layout aplica el tema antes de hidratar y el efecto aplica el
tema real después de montar: no hay parpadeo ni se pierde lo escrito.

### R-09 · Token sin "Recordarme" (E2E-01, corrección del equipo)

**Hallazgo.** La suite Serenity/JS inicia sesión sin marcar "Recordarme", como lo hace un usuario por defecto.
Así detectó que el token quedaba en `sessionStorage` mientras `api.client.ts` solo leía `localStorage`: todas
las llamadas salían sin `Authorization`. El equipo lo corrigió con `getAuthToken()` (`localStorage` →
`sessionStorage` → cookie), y las suites E2E lo vigilan en cada corrida.

### R-10 · Accesibilidad de Bolsillos, Cuentas y sus modales (A11Y-01…06)

**Hallazgo.** La nueva `accesibilidad.feature` de Cypress pasa axe-core (WCAG 2.1 A/AA) y falla con impacto
*serious* o *critical*. La primera corrida falló en los 3 escenarios
(`docs/evidencia-cypress-bolsillos/01-corrida-antes-a11y.txt` y capturas en `antes/`). Al corregir los
primeros aparecieron otros que quedaban tapados.

| ID | Violación axe | Dónde | Antes | Después |
|---|---|---|---|---|
| A11Y-01 | `color-contrast` | Diálogo "Eliminar bolsillo" | Fondo fijo `bg-[#111827]` con texto del tema: en tema claro, **título oscuro sobre fondo oscuro** (captura `antes/a11y-2-dialogo-eliminar.png`) | `bg-card` (sigue el tema) |
| A11Y-01 | `color-contrast` | Textos secundarios (`--muted-foreground`) | `#71717a` sobre `#f5f5f5` = **4,43:1** (< 4,5:1) | `#63636b` = 5,5:1 |
| A11Y-02 | `button-name` (crítico) | Botón ✕ del modal de abono | Solo un ícono, sin nombre | `aria-label="Cerrar"` y `type="button"` |
| A11Y-03 | `label-content-name-mismatch` | Tarjeta de cuenta (`role="button"`) | `aria-label` fijo que ocultaba el texto visible | Nombre calculado del contenido + texto `sr-only` |
| A11Y-04 | `color-contrast` | `/accounts`: título, subtítulo, "Mis cuentas", botón Mostrar/Ocultar | `text-white`, `text-white/40`, `bg-white/5` fijos: **invisibles en tema claro** (1,05:1) | Tokens `text-foreground`, `text-muted-foreground`, `bg-muted/40` |
| A11Y-05 | `color-contrast` | Botones "Sí, eliminar" y "Abonar Saldo" | Blanco sobre `#ef4444` (3,8:1) y sobre `emerald-600` (3,8:1) | `--destructive: #dc2626` (4,8:1) y `emerald-700` (5,5:1) |
| A11Y-06 | `button-name` (crítico) | `Button` mientras carga | `isLoading` reemplazaba el texto por el *spinner* | El texto sigue como `sr-only`; el *spinner* es `aria-hidden` |

Además, los dos modales ahora se anuncian como diálogo: `role="dialog"`, `aria-modal="true"` y
`aria-labelledby` apuntando a su título.

```diff
// shared/components/ui/Button.tsx
- {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
- {!isLoading && children}
+ {isLoading && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
+ {isLoading ? <span className="sr-only">{children}</span> : children}
```

**Verificación.** `accesibilidad.feature` pasó de 0/3 a **4/4**: se agregó el escenario de la pantalla de
cuentas completa, que destapó A11Y-04. La suite completa de Cypress quedó en **40/40** y las 461 pruebas
unitarias del frontend siguen en verde (`docs/evidencia-cypress-bolsillos/02-corrida-final.txt` y
`despues/`).

### R-11 · El backend volvió a compilar (`@types/ws`)

**Hallazgo.** Al construir la imagen del backend para Keploy, `npm run build` falló:
`TS7016: Could not find a declaration file for module 'ws'` en `supabase.client.ts`. La dependencia `ws`
entró a `dev` el 10-oct sin sus tipos. `vitest` no lo notaba porque no hace *type-check*, pero `tsc`, y por
lo tanto el `Dockerfile` y la etapa *Backend: install + test + build* de Jenkins, sí.

```diff
// backend/package.json → devDependencies
+ "@types/ws": "^8.x"
```

**Verificación.** `npx tsc -p backend --noEmit` sin errores y la imagen Docker se construye.

---

## 3. Comparación global: versión anterior vs. versión final

| Indicador | Versión anterior | Versión final |
|---|---|---|
| Complejidad cognitiva máx. (Bolsillos) | 16 (`UpdatePocket`) | 6 |
| Code smells del módulo | 4 (1 crítico + 3 menores) | 0 |
| Reliability del proyecto (Sonar) | C · 32 problemas | A · 0 |
| Security hotspots sin revisar | 14 | 0 |
| Vulnerabilidades de autenticación | 2 (SEC-01, SEC-02) | 0 |
| Montos aceptados por *type juggling* | `true`, `null`, `[n]` | Ninguno |
| Defectos funcionales del módulo abiertos | D-01/D-03, D-02, D-08 + E2E-01 + tema | Ver §4 |
| Cobertura del módulo (unitarias) | 89,8 %–97,8 % por archivo | 100 % |

### Verificación después de la refactorización

Todas las suites se volvieron a correr sobre la versión final (Stagehand se excluye de este análisis, como pide
la rúbrica):

| Suite | Comando | Resultado (2026-10-26) | Evidencia |
|---|---|---|---|
| Backend completo (Vitest, sin performance) | `npx vitest run --exclude "src/tests/performance/**"` | **902 aprobadas + 12 `it.fails`** (111 archivos) | consola |
| Regresión + unitarias de Bolsillos y Depositar | `npm --prefix backend run test:regression:bolsillos` | **207 + 2 `it.fails`** (D-04, D-05) | `docs/evidencia-final-bolsillos/vitest-regresion.json` |
| Seguridad de Bolsillos | `npm --prefix backend run test:security:bolsillos` | **149 + 10 `it.fails`** (SEC-05…08) | `docs/evidencia-final-bolsillos/vitest-seguridad.json` |
| Frontend completo (Vitest) | `npm --prefix frontend test` | **461 / 461** (65 archivos) | consola |
| Cypress + Gherkin (API, UI, seguridad, accesibilidad) | `npm run test:cypress:bolsillos` | **40 / 40** | `docs/evidencia-cypress-bolsillos/02-corrida-final.txt`, `despues/cucumber-report.html` |
| Serenity/JS Screenplay + Gherkin | `npx cucumber-js --tags "@bolsillos or @deposito"` | **36 / 36** | `docs/evidencia-final-bolsillos/serenity-corrida.txt` |
| Postman + Newman | `npm run test:postman:bolsillos` | **136 / 136 aserciones** (31 casos) | `herramientas-alejandro/02-postman-postbot/evidence/` |
| Performance de Bolsillos | `npm --prefix backend run test:performance:bolsillos` | **9 / 9** | `docs/evidencia-final-bolsillos/vitest-performance.json` |
| Keploy (regresión de API sin Supabase) | `npm run test:keploy:bolsillos` | **50 / 50** casos con 95 mocks | `herramientas-alejandro/03-keploy/evidence/` |
| Build de producción del backend | `npx tsc -p backend` / `docker build` | Sin errores (antes: `TS7016`) | imagen `fubank-keploy` construida |

Los `it.fails` son defectos **abiertos y documentados** (§4): la prueba afirma el comportamiento correcto y
Vitest confirma que hoy todavía falla. Si alguien los corrige, la prueba lo avisa.

---

## 4. Defectos abiertos y recomendaciones

| ID | Descripción | Riesgo | Recomendación |
|---|---|---|---|
| D-04 | `amount` como texto numérico se acepta al crear y se rechaza al actualizar | Medio: contrato inconsistente | Usar `strictAmount` también en `updatePocketSchema` |
| D-05 | Al crear un bolsillo, lo ya apartado se cuenta dos veces en la validación de disponible | Medio: rechaza bolsillos válidos | Calcular el disponible solo con `account.balance` |
| D-07 | La tabla `pockets` no existe en Supabase: el repositorio usa un `Map` en memoria | **Alto**: los bolsillos se pierden al reiniciar el backend | Crear la tabla (migración) y quitar el *fallback* silencioso |
| SEC-05…08 | Sin rango máximo de montos, JSON malformado y cuerpos > 10 KB → 500, sin *rate limiting* | Medio | Límite de monto, manejador de errores de `express.json` y `express-rate-limit` |
