# Pruebas E2E de Bolsillos y Depósito (Serenity/JS)

Pruebas de aceptación de caja negra sobre FuBanking **en ejecución**, con el
patrón Screenplay. Cubren las 6 funcionalidades del módulo: los 5 casos de
Bolsillos (crear, consultar, editar, eliminar, transferir) y Depositar en la
cuenta. Siguen la misma estructura del proyecto de referencia
[serenityjs-e2e-testing](https://github.com/mauricioramirezv/serenityjs-e2e-testing).

Stack: Serenity/JS 3.48 + Cucumber 13 + Playwright 1.63 + TypeScript.

## Arquitectura

| Componente | Responsabilidad | Ubicación |
|---|---|---|
| Actor y abilities | `CallAnApi`, `TakeNotes` y `BrowseTheWebWithPlaywright` | `features/support/serenity.config.ts` |
| Features | Comportamiento en Gherkin, una carpeta por capacidad | `features/{creditos,bolsillos,deposito,recorrido}/` |
| Step definitions | Conectan Gherkin con Screenplay, sin selectores | `features/step-definitions/` |
| Tasks | Objetivos de negocio (API y pantalla) | `test/tasks/{creditos,api,web}/` |
| Questions | Lo que el actor consulta para verificar | `test/questions/` |
| Lean Page Objects | Selectores (`id` y `data-testid`) | `test/ui/` |
| Soporte | URLs, datos únicos, notas y credenciales | `test/support/` |

### Cómo se preparan los datos

Cada escenario **crea su propio cliente** por API: se registra (sin 2FA), abre
una cuenta de ahorros y deposita el saldo inicial. Así ningún escenario depende
de otro ni de datos sembrados a mano.

- Los usuarios quedan en Supabase con correo `e2e.<id>@fubanking.test` y
  documento `E2E…`, para poder identificarlos y limpiarlos.
- La contraseña y el token **no** aparecen en el reporte: viven fuera del
  Notepad (`test/support/Credentials.ts`) y la contraseña se escribe enmascarada.
- Los escenarios con dos clientes (Ana/Bruno, Carlos/Diana) prueban que nadie
  pueda operar sobre la cuenta o los bolsillos de otro (HTTP 403).

## Requisitos

- Node.js 22 o superior (las dependencias piden `^22.22.2 || ^24.15.0`; con
  24.14 npm avisa con `EBADENGINE` pero funciona).
- Backend y frontend levantados con su `.env`:

```bash
npm --prefix backend run dev     # http://localhost:3001
npm --prefix frontend run dev    # http://localhost:3000
```

## Instalación

```bash
cd e2e
npm install
npx playwright install chromium
```

## Ejecutar

| Comando | Qué corre |
|---|---|
| `npm test` | Todos los escenarios (API + web) |
| `npm run test:api` | Solo `@api`, sin abrir navegador |
| `npm run test:web` | Solo `@web` (Playwright) |
| `npm run test:smoke` | Conjunto rápido `@smoke` |
| `npm run test:creditos` / `test:bolsillos` / `test:deposito` | Una capacidad específica |
| `npm test -- --tags @seguridad` | Escenarios de autorización y type juggling |
| `npm test -- --name "Mover dinero"` | Un escenario por nombre |
| `npm run typecheck` | Solo valida TypeScript |

Variables opcionales:

| Variable | Por defecto | Uso |
|---|---|---|
| `E2E_API_URL` | `http://localhost:3001/api/v1/` | Otro backend |
| `E2E_WEB_URL` | `http://localhost:3000` | Otro frontend |
| `HEADLESS=false` | `true` | Ver el navegador |
| `E2E_PHOTOS=all` | solo fallos | Captura en cada interacción (evidencia) |

En PowerShell: `$env:HEADLESS = "false"; npm run test:web`.

## Reporte

Cada ejecución genera `reports/serenity-js/index.html` (requisitos → escenarios
→ pasos, con peticiones HTTP y capturas de los fallos). Para servirlo:

```bash
npm run test:report    # http://localhost:8080
```

## Selectores agregados al frontend

Para tener Lean Page Objects estables se agregaron atributos sin efecto
funcional:

- `PocketsClient.tsx`: `id` en los campos (`pocket-name`, `pocket-amount`,
  `transfer-amount`, `edit-pocket-name`, `edit-pocket-amount`), lo que además
  asocia cada `label` con su campo; `data-testid` en botones y tarjetas.
- `AccountCard.tsx`, `DepositWithdrawModal.tsx` (`id="dw-amount"` + `htmlFor`)
  y `ToastProvider.tsx` (`data-testid="toast-title"`).

## Notas

- Si la tabla `pockets` no existe en Supabase, el backend guarda los bolsillos
  en memoria: viven mientras el proceso esté arriba. Las pruebas no se ven
  afectadas porque cada escenario crea los suyos.
- El inicio de sesión **no** marca "Recordarme", como un usuario por defecto.
  Así los escenarios web vigilan el defecto E2E-01: el token quedaba en
  `sessionStorage` y `api.client.ts` solo lo leía de `localStorage`, por lo que
  no cargaban cuentas ni bolsillos. Está corregido en `dev` (`getAuthToken`).
- Documento técnico completo: `docs/pruebas-e2e-bolsillos.md`.

---

# Pruebas E2E — Patrón Screenplay (Vitest)

## Estructura

```
e2e/
├── screenplay/
│   ├── actors/          # Actores que interactúan con el sistema
│   ├── abilities/       # Habilidades (capacidades) de los actores
│   ├── tasks/           # Tareas de alto nivel (acciones del negocio)
│   ├── questions/       # Preguntas que el actor puede hacer al sistema
│   └── interactions/    # Interacciones de bajo nivel con la UI/API
├── tests/
│   └── login/           # Escenarios E2E del módulo de login
├── fixtures/            # Datos de prueba y helpers compartidos
├── setup.ts             # Configuración global de vitest para E2E
└── vitest.config.e2e.ts # Configuración aislada de vitest para E2E
```

## Patrón Screenplay

El patrón Screenplay modela las pruebas centradas en **actores** que usan
**habilidades** para realizar **tareas** y verificar resultados con **preguntas**.

### Componentes

| Concepto     | Rol                                                        |
| ------------ | ---------------------------------------------------------- |
| **Actor**    | Representa un usuario que interactúa con el sistema        |
| **Ability**  | Capacidad que se le otorga al actor (navegar, llamar APIs) |
| **Task**     | Acción de negocio de alto nivel (hacer login, registrarse) |
| **Question** | Consulta sobre el estado actual (¿qué muestra la página?)  |

### Ejecución

```bash
# Desde la raíz del proyecto
npm run test:e2e:vitest
```
