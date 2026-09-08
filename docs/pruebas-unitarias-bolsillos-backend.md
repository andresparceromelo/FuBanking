# Pruebas unitarias manuales — Módulo Bolsillos (Backend)

Protocolo de **pruebas unitarias manuales**, ejecutadas a mano en el REPL de `tsx`.
No se usan mocks, dobles, ni frameworks de prueba: cada caso se escribe en la consola y el
ejecutor anota lo que devolvió.

## 1. Identificación

| Campo | Valor |
| --- | --- |
| **Módulo bajo prueba** | Bolsillos (crear, actualizar, eliminar, transferir, consultar) |
| **Tipo de prueba** | Unitaria, manual, sin mocks ni dobles |
| **Vehículo de ejecución** | REPL de `tsx` (`npx tsx` desde `backend/`) |
| **Total de casos** | 69 — 32 en la Parte A, 37 en la Parte B |
| **Fecha de ejecución** | _(llenar)_ |
| **Versión probada** | _(llenar: `git rev-parse --abbrev-ref HEAD` y `git rev-parse --short HEAD`)_ |
| **Responsable** | _(llenar)_ |

## 2. Alcance y aislamiento

Las unidades del módulo se parten en dos grupos según sus dependencias, y el protocolo los
trata por separado porque el grado de aislamiento no es el mismo.

### Parte A — unidades sin dependencias (32 casos)

Aislamiento total. Son clases y schemas que no colaboran con nada: se instancian y se
llaman directamente. Aquí "sin mocks" es literal, porque no hay nada que sustituir.

| Unidad | Archivo | Casos |
| --- | --- | ---: |
| Entidad `Pocket` | `src/domain/entities/Pocket.ts` | 13 |
| Entidad `Account` (lo que usa Bolsillos) | `src/domain/entities/Account.ts` | 4 |
| Schemas de validación | `src/presentation/validators/pocket.validators.ts` | 15 |

### Parte B — casos de uso con repositorios reales (37 casos)

Los cinco casos de uso reciben `IAccountRepository` e `IPocketRepository` por constructor:
no se pueden instanciar sin pasarles algo. Por decisión de alcance se les inyectan los
**repositorios Supabase reales**, no dobles.

| Unidad | Archivo | Casos |
| --- | --- | ---: |
| `CreatePocket.execute` | `src/application/use-cases/pocket/CreatePocket.ts` | 9 |
| `UpdatePocket.execute` | `src/application/use-cases/pocket/UpdatePocket.ts` | 10 |
| `DeletePocket.execute` | `src/application/use-cases/pocket/DeletePocket.ts` | 4 |
| `TransferPocketBalance.execute` | `src/application/use-cases/pocket/TransferPocketBalance.ts` | 9 |
| `GetAccountPockets.execute` | `src/application/use-cases/pocket/GetAccountPockets.ts` | 5 |

> **Sobre el aislamiento de la Parte B.** Con repositorios reales, el caso de uso queda
> aislado de Express, del enrutador, del middleware de autenticación y de los validadores
> Zod — se invoca el método directamente — pero **no** de la base de datos. Un fallo en un
> caso de la Parte B puede originarse en el caso de uso o en el repositorio, y hay que
> distinguirlo al registrar el resultado. La Parte A no tiene esa ambigüedad.

**Lo que este protocolo gana respecto de probar por HTTP.** Al invocar el método
directamente, los schemas Zod no intervienen. Tres ramas de error que por HTTP eran
inalcanzables aquí sí se ejecutan y se pueden verificar:

| Rama | Caso que la cubre |
| --- | --- |
| `CreatePocket → INVALID_POCKET_AMOUNT` | CU-CR-01 |
| `UpdatePocket → NO_CHANGES_PROVIDED` | CU-AC-03 |
| `TransferPocketBalance → INVALID_TRANSFER_AMOUNT` | CU-TR-01 |

**Fuera de alcance:** controladores, rutas, middleware, y el resto de módulos del backend.
Las pruebas de integración van en una ronda posterior.

## 3. Arranque del REPL

Desde una terminal **interactiva** (el REPL solo se abre si hay TTY):

```bash
cd backend
```

```bash
npx tsx
```

Al primer `require` que cargue la configuración se imprime una línea como
`◇ injected env (10) from .env` — es normal, es `dotenv` cargando `backend/.env`.

> Si el proceso se cierra solo al arrancar, es que `backend/.env` está incompleto:
> `src/shared/config/env.ts` valida las variables y llama a `process.exit(1)` si falta
> alguna. Revisar contra `.env.example`.

### 3.1 Bloque de arranque

Pegar tal cual en el REPL. La Parte A solo necesita las dos primeras líneas; el resto hace
falta a partir de la Parte B.

```js
var { Pocket } = require('./src/domain/entities/Pocket')
var { Account, AccountType, AccountStatus } = require('./src/domain/entities/Account')
var V = require('./src/presentation/validators/pocket.validators')

var supabase = require('./src/infrastructure/database/supabase.client').default
var { SupabaseAccountRepository } = require('./src/infrastructure/repositories/SupabaseAccountRepository')
var { SupabasePocketRepository } = require('./src/infrastructure/repositories/SupabasePocketRepository')
var { SupabaseNotificationRepository } = require('./src/infrastructure/repositories/SupabaseNotificationRepository')
var { SupabaseUserRepository } = require('./src/infrastructure/repositories/SupabaseUserRepository')

var accRepo = new SupabaseAccountRepository(supabase)
var pocRepo = new SupabasePocketRepository(supabase)
var notRepo = new SupabaseNotificationRepository(supabase)
var usrRepo = new SupabaseUserRepository(supabase)

var { CreatePocket } = require('./src/application/use-cases/pocket/CreatePocket')
var { UpdatePocket } = require('./src/application/use-cases/pocket/UpdatePocket')
var { DeletePocket } = require('./src/application/use-cases/pocket/DeletePocket')
var { TransferPocketBalance } = require('./src/application/use-cases/pocket/TransferPocketBalance')
var { GetAccountPockets } = require('./src/application/use-cases/pocket/GetAccountPockets')
var { CreateAccount } = require('./src/application/use-cases/account/CreateAccount')
var { DepositMoney } = require('./src/application/use-cases/account/DepositMoney')

var crear = new CreatePocket(accRepo, pocRepo, notRepo)
var actualizar = new UpdatePocket(accRepo, pocRepo, notRepo)
var eliminar = new DeletePocket(accRepo, pocRepo, notRepo)
var transferir = new TransferPocketBalance(accRepo, pocRepo, notRepo)
var consultar = new GetAccountPockets(accRepo, pocRepo)
var crearCuenta = new CreateAccount(accRepo)
var depositar = new DepositMoney(accRepo)
```

Comprobación de que quedó bien montado:

```js
[crear, actualizar, eliminar, transferir, consultar].every(u => typeof u.execute === 'function')
```

Debe imprimir `true`.

### 3.2 Ayudantes

Dos funciones que se pegan una vez y hacen legible el resto del protocolo.

```js
var ver = (p) => p.then(r => console.log('OK   ', JSON.stringify(r && r.toPublic ? r.toPublic() : r, null, 1))).catch(e => console.log('ERROR', e.code, '| HTTP', e.statusCode, '|', e.message))
var lanza = (fn) => { try { var r = fn(); console.log('SIN ERROR ->', JSON.stringify(r)); } catch (e) { console.log('ERROR', e.code, '| HTTP', e.statusCode, '|', e.message); } }
var val = (schema, datos) => { var r = schema.safeParse(datos); console.log(r.success ? 'ACEPTA ' + JSON.stringify(r.data) : 'RECHAZA ' + r.error.issues.map(i => (i.path.join('.') || '(raiz)') + ': ' + i.message).join(' ; ')); }
```

- `ver(...)` — para los casos de uso, que son asíncronos. Imprime `OK` con el resultado o
  `ERROR` con el código, el HTTP y el mensaje. Evita tener que usar `await`.
- `lanza(...)` — para los métodos síncronos de las entidades. Imprime el error si lo hay, o
  el valor devuelto si no lanzó.
- `val(...)` — para los schemas. Imprime `ACEPTA` con el dato ya parseado o `RECHAZA` con
  los mensajes por campo.

## 4. Convenciones

### 4.1 Por qué todo va con `var`

El protocolo declara **todas** las variables con `var`, nunca con `const` ni `let`. Los
casos se escriben uno tras otro en la misma sesión del REPL y varios reutilizan el mismo
nombre; `const` haría fallar el segundo con `Identifier has already been declared`, y
habría que reiniciar la sesión. `var` admite redeclaración.

### 4.2 Cómo registrar cada caso

Cada tabla trae una columna **Resultado obtenido** en blanco. Copiar ahí lo que imprimió el
REPL y marcar el estado:

- **A** — Aprobado: lo obtenido coincide con lo esperado.
- **F** — Fallido: difiere (anotar la diferencia exacta).
- **B** — Bloqueado: no se pudo ejecutar (anotar por qué).

### 4.3 Variables de la Parte B

| Variable | Descripción | Valor obtenido |
| --- | --- | --- |
| `USER_ID` | Id del usuario dueño de las cuentas de prueba | |
| `ACC1` | Cuenta principal — fondos totales $1.000.000 | |
| `ACC2` | Cuenta secundaria — fondos totales $200.000 | |
| `ACC3` | Cuenta sin depósito ni bolsillos | |
| `VAC` | Bolsillo "Vacaciones" en `ACC1` | |
| `EST` | Bolsillo "Estudio" en `ACC1` | |
| `OTRA` | Bolsillo "Otra cuenta" en `ACC2` | |
| `FAKE` | UUID válido pero inexistente: `00000000-0000-4000-8000-000000000000` | (fijo) |
| `AJENO` | UUID de un usuario que no es el dueño: `11111111-1111-4111-8111-111111111111` | (fijo) |

---

# PARTE A — Unidades sin dependencias

No requiere base de datos, ni red, ni preparación. Basta con las tres primeras líneas del
bloque de arranque y los ayudantes.

## 5. Entidad `Pocket` — construcción

Regla declarada en la entidad: `assertValidAmount` exige que el monto sea un `number`, no
`NaN`, y mayor o igual a cero. `Pocket.create` además recorta el nombre.

Preparar nada; cada caso es autónomo.

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| PU-01 | `lanza(() => Pocket.create({id:'p',accountId:'a',name:'  Vacaciones  ',amount:100}).name)` | `SIN ERROR -> "Vacaciones"` — el factory recorta los espacios | | |
| PU-02 | `lanza(() => Pocket.create({id:'p',accountId:'a',name:'x',amount:0}).amount)` | `SIN ERROR -> 0` — valor límite inferior, se acepta | | |
| PU-03 | `lanza(() => Pocket.create({id:'p',accountId:'a',name:'x',amount:-1}))` | `ERROR INVALID_POCKET_AMOUNT \| HTTP 400 \| El monto del bolsillo debe ser un número mayor o igual a cero` | | |
| PU-04 | `lanza(() => Pocket.create({id:'p',accountId:'a',name:'x',amount:NaN}))` | `ERROR INVALID_POCKET_AMOUNT` — `Number.isNaN` lo rechaza | | |
| PU-05 | `lanza(() => Pocket.create({id:'p',accountId:'a',name:'x',amount:'100'}))` | `ERROR INVALID_POCKET_AMOUNT` — la comprobación es `typeof !== 'number'`, así que una cadena numérica también se rechaza | | |
| PU-06 | `lanza(() => Pocket.create({id:'p',accountId:'a',name:'',amount:1}).name)` | **Esperado por la regla:** `ERROR INVALID_POCKET_NAME`. **El código no valida el nombre al construir**, así que devolverá `SIN ERROR -> ""`. Registrar **Fallido** — es el defecto **D-01**. | | |
| PU-07 | `lanza(() => Object.keys(Pocket.create({id:'p',accountId:'a',name:'x',amount:1}).toPublic()).join(','))` | `SIN ERROR -> "id,accountId,name,amount,createdAt,updatedAt"` — exactamente seis campos, ninguno interno | | |

Comprobación adicional del formato de fechas en `toPublic`:

```js
var pTmp = Pocket.create({id:'p',accountId:'a',name:'x',amount:1})
typeof pTmp.toPublic().createdAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(pTmp.toPublic().createdAt)
```

Debe imprimir `true`: las fechas salen como cadena ISO, no como `Date`.

## 6. Entidad `Pocket` — mutadores

Preparar una instancia antes de esta sección:

```js
var p = Pocket.create({id:'p1',accountId:'a1',name:'Vacaciones',amount:300000})
```

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| PU-08 | `lanza(() => { p.updateAmount(0); return p.amount })` | `SIN ERROR -> 0` — el cero es válido también al mutar | | |
| PU-09 | `lanza(() => p.updateAmount(-1))` | `ERROR INVALID_POCKET_AMOUNT \| HTTP 400` | | |
| PU-10 | `lanza(() => p.updateAmount(NaN))` | `ERROR INVALID_POCKET_AMOUNT \| HTTP 400` | | |
| PU-11 | `lanza(() => { p.updateName('  Bici  '); return p.name })` | `SIN ERROR -> "Bici"` — recorta al mutar | | |
| PU-12 | `lanza(() => p.updateName('   '))` | `ERROR INVALID_POCKET_NAME \| HTTP 400 \| El nombre del bolsillo no puede estar vacío` — aquí sí valida, a diferencia de PU-06 | | |
| PU-13 | `var q = Pocket.create({id:'q',accountId:'a',name:'X',amount:10}); var t0 = q.updatedAt.getTime(); q.updateAmount(20); q.updatedAt.getTime() >= t0` | `true` — mutar refresca `updatedAt` | | |

## 7. Entidad `Account` — reglas que usa Bolsillos

Los cuatro casos de uso del módulo consultan `isOperational()` y `assertBelongsTo()`. Se
prueban aquí de forma aislada, sin necesidad de una cuenta persistida.

Preparar una fábrica local:

```js
var cuenta = (status, userId) => new Account({id:'a1',userId:userId||'u1',accountNumber:'BA1',accountType:AccountType.AHORROS,balance:1000,status:status,details:null,createdAt:new Date()})
```

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| AU-01 | `cuenta(AccountStatus.ACTIVA).isOperational()` | `true` | | |
| AU-02 | `[cuenta(AccountStatus.BLOQUEADA).isOperational(), cuenta(AccountStatus.CERRADA).isOperational()]` | `[ false, false ]` — solo ACTIVA opera | | |
| AU-03 | `lanza(() => { cuenta(AccountStatus.ACTIVA,'u1').assertBelongsTo('u1'); return 'sin excepcion' })` | `SIN ERROR -> "sin excepcion"` — el dueño pasa | | |
| AU-04 | `lanza(() => cuenta(AccountStatus.ACTIVA,'u1').assertBelongsTo('u2'))` | `ERROR FORBIDDEN \| HTTP 403 \| No tienes permiso para acceder a esta cuenta` | | |

## 8. Schemas de validación

Se ejercitan con el ayudante `val`. Preparar un UUID de ejemplo:

```js
var U = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
```

### 8.1 `createPocketSchema`

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| VU-01 | `val(V.createPocketSchema, {accountId:U,name:'Vacaciones',amount:300000})` | `ACEPTA {"accountId":"3f25…","name":"Vacaciones","amount":300000}` | | |
| VU-02 | `val(V.createPocketSchema, {accountId:U,name:'V',amount:'300000'})` | `ACEPTA` con `"amount":300000` — `z.coerce.number()` convierte la cadena | | |
| VU-03 | `val(V.createPocketSchema, {accountId:U,name:'V',amount:true})` | **Esperado por la regla:** `RECHAZA`, un booleano no es un monto. **El código lo coacciona a `1`**, así que imprimirá `ACEPTA` con `"amount":1`. Registrar **Fallido** — defecto **D-02**. | | |
| VU-04 | `val(V.createPocketSchema, {accountId:U,name:'V',amount:-1})` | `RECHAZA amount: El monto del bolsillo no puede ser negativo` | | |
| VU-05 | `val(V.createPocketSchema, {accountId:'abc',name:'V',amount:1})` | `RECHAZA accountId: accountId debe ser un UUID válido` | | |
| VU-06 | `val(V.createPocketSchema, {accountId:U,name:'',amount:1})` | `RECHAZA name: El nombre del bolsillo es obligatorio` | | |
| VU-07 | `val(V.createPocketSchema, {accountId:U,name:'   ',amount:1})` | **Esperado por la regla:** `RECHAZA`, un nombre de solo espacios está vacío. **El schema valida longitud pero no contenido**, así que imprimirá `ACEPTA` con `"name":"   "`. Registrar **Fallido** — defecto **D-03**. | | |
| VU-08 | `val(V.createPocketSchema, {accountId:U,name:'A'.repeat(150),amount:1})` | `ACEPTA` — 150 es el límite superior y se admite | | |
| VU-09 | `val(V.createPocketSchema, {accountId:U,name:'A'.repeat(151),amount:1})` | `RECHAZA name: El nombre del bolsillo no puede superar 150 caracteres` | | |

### 8.2 `updatePocketSchema`

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| VU-10 | `val(V.updatePocketSchema, {})` | `RECHAZA (raiz): Debes enviar al menos un campo para actualizar` | | |
| VU-11 | `val(V.updatePocketSchema, {amount:'500'})` | **Esperado:** `ACEPTA` con `500`, por coherencia con VU-02. **El schema usa `z.number()` sin `coerce`**, así que imprimirá `RECHAZA amount: Invalid input: expected number, received string`. Registrar **Fallido** — defecto **D-04**, la misma entrada se trata distinto al crear y al actualizar. | | |
| VU-12 | `val(V.updatePocketSchema, {amount:0})` | `ACEPTA {"amount":0}` — el cero es un ajuste válido | | |

### 8.3 `transferPocketSchema`

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| VU-13 | `val(V.transferPocketSchema, {fromPocketId:U,toPocketId:U,amount:0})` | `RECHAZA amount: El monto de transferencia debe ser mayor que cero` — la condición es `gt(0)`, así que el cero queda fuera. Contrasta con VU-12: al ajustar un bolsillo el cero sí vale, al transferir no | | |
| VU-14 | `val(V.transferPocketSchema, {fromPocketId:U,toPocketId:U,amount:0.01})` | `ACEPTA` con `"amount":0.01` — se admiten fracciones de peso | | |
| VU-15 | `val(V.transferPocketSchema, {fromPocketId:'abc',toPocketId:U,amount:100})` | `RECHAZA fromPocketId: fromPocketId debe ser un UUID válido` | | |

---

# PARTE B — Casos de uso con repositorios reales

> **Advertencia.** Desde aquí se escribe en la base de datos real: se crean cuentas,
> bolsillos y notificaciones que quedan persistidos. Ejecutar contra un proyecto de
> Supabase de desarrollo, nunca contra producción. La sección 14 indica cómo limpiar.

## 9. Preparación

### B-SETUP-01 · Obtener el `USER_ID`

Usar un usuario que ya exista en la base. Buscarlo por correo:

```js
ver(usrRepo.findByEmail('tu-correo@ejemplo.com'))
```

Copiar el `id` que imprima en **`USER_ID`** y fijarlo en el REPL:

```js
var USER_ID = '...'
var FAKE = '00000000-0000-4000-8000-000000000000'
var AJENO = '11111111-1111-4111-8111-111111111111'
```

> `AJENO` no necesita existir: `assertBelongsTo` compara el `userId` del DTO contra el
> dueño de la cuenta y lanza antes de consultar nada más. Por eso no hace falta registrar
> un segundo usuario para los casos de autorización.

### B-SETUP-02 · Crear las tres cuentas

```js
ver(crearCuenta.execute({ userId: USER_ID, type: 'AHORROS' }))
```

Ejecutar tres veces y copiar los `id` en **`ACC1`**, **`ACC2`** y **`ACC3`**. Cada una debe
salir con `balance: 0` y `status: "ACTIVA"`. Fijarlas:

```js
var ACC1 = '...'
var ACC2 = '...'
var ACC3 = '...'
```

### B-SETUP-03 · Depositar los fondos

```js
ver(depositar.execute({ userId: USER_ID, accountId: ACC1, amount: 1000000 }))
ver(depositar.execute({ userId: USER_ID, accountId: ACC2, amount: 200000 }))
```

`ACC3` se deja en $0 y sin bolsillos: es la cuenta vacía del caso CU-CO-04.

> `DepositMoney` se construyó con un solo argumento, así que no registra transacción ni
> notificación. Es deliberado: menos efectos colaterales que limpiar después.

### B-SETUP-04 · Crear el bolsillo auxiliar de `ACC2`

```js
ver(crear.execute({ userId: USER_ID, accountId: ACC2, name: 'Otra cuenta', amount: 50000 }))
```

Copiar el `id` en **`OTRA`**. Sirve para el caso CU-TR-05 (bolsillos de cuentas distintas).

Estado tras la preparación:

| Cuenta | Disponible | Reservado | Total |
| --- | ---: | ---: | ---: |
| `ACC1` | $1.000.000 | $0 | $1.000.000 |
| `ACC2` | $150.000 | $50.000 | $200.000 |
| `ACC3` | $0 | $0 | $0 |

### B-SETUP-05 · (Opcional) Cuenta bloqueada

La API y los casos de uso no exponen forma de bloquear una cuenta, así que el estado se
cambia a mano: Supabase → **Table editor** → tabla `accounts` → fila `ACC3` → columna
`status` de `ACTIVA` a `BLOQUEADA`.

Solo hace falta si se quiere ejecutar CU-CR-08. Si se omite, ese caso se registra como
**Bloqueado**. Recordar devolver `ACC3` a `ACTIVA` antes de CU-CO-04.

## 10. `CreatePocket.execute` — 9 casos

Estado inicial: `ACC1` disponible $1.000.000, reservado $0, sin bolsillos.

Los casos CU-CR-01 a CU-CR-04 no modifican nada; a partir de CU-CR-05 el estado avanza.

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| CU-CR-01 | `ver(crear.execute({userId:USER_ID, accountId:ACC1, name:'Negativo', amount:-1}))` | `ERROR INVALID_POCKET_AMOUNT \| HTTP 400 \| El monto del bolsillo no puede ser negativo`. Corta en la primera línea, sin consultar la cuenta. **Rama inalcanzable por HTTP.** | | |
| CU-CR-02 | `ver(crear.execute({userId:USER_ID, accountId:FAKE, name:'Fantasma', amount:50000}))` | `ERROR ACCOUNT_NOT_FOUND \| HTTP 404 \| Cuenta no encontrada` | | |
| CU-CR-03 | `ver(crear.execute({userId:AJENO, accountId:ACC1, name:'Ajena', amount:10000}))` | `ERROR FORBIDDEN \| HTTP 403 \| No tienes permiso para acceder a esta cuenta` | | |
| CU-CR-04 | `ver(crear.execute({userId:USER_ID, accountId:ACC1, name:'Excede', amount:1000001}))` | `ERROR INSUFFICIENT_AVAILABLE_BALANCE \| HTTP 400`. Valor límite: con reservado $0, el máximo aceptable es el disponible, y se pide uno más | | |
| CU-CR-05 | `ver(crear.execute({userId:USER_ID, accountId:ACC1, name:'Vacaciones', amount:300000}))` | `OK` con `"name":"Vacaciones"`, `"amount":300000`. Copiar el `id` en **`VAC`** | | |
| CU-CR-06 | `ver(accRepo.findById(ACC1))` | `OK` con `"balance":700000` — el monto se descontó del disponible | | |
| CU-CR-07 | `ver(crear.execute({userId:USER_ID, accountId:ACC1, name:'Estudio', amount:200000}))` | `OK` con `"amount":200000`. Copiar el `id` en **`EST`**. El disponible queda en $500.000 | | |
| CU-CR-08 | `ver(crear.execute({userId:USER_ID, accountId:ACC3, name:'Bloqueada', amount:1000}))` | Requiere B-SETUP-05. `ERROR ACCOUNT_NOT_OPERATIONAL \| HTTP 400 \| La cuenta no está disponible para generar bolsillos`. Sin ese paso, marcar **Bloqueado** | | |

### CU-CR-09 · Bolsillo que cabe en el disponible pero es rechazado — defecto D-05

**Precondición:** `ACC1` disponible $500.000, reservado $500.000, total $1.000.000.
El monto pedido ($400.000) cabe holgadamente en el disponible, así que la regla de negocio
exige que se cree.

```js
ver(crear.execute({ userId: USER_ID, accountId: ACC1, name: 'Emergencia', amount: 400000 }))
```

**Esperado por la regla:** `OK`, dejando el disponible en $100.000 y lo reservado en
$900.000.

**Lo que hará el código:** `ERROR INSUFFICIENT_AVAILABLE_BALANCE`, porque compara
`currentReserved + amount > account.balance` → `500.000 + 400.000 = 900.000 > 500.000`.
Como `account.balance` ya es el saldo disponible, lo reservado se cuenta dos veces.

**Registrar como Fallido.** Es el defecto **D-05** y no se corrige en esta entrega.

| Resultado obtenido | Estado |
| --- | --- |
| | |

## 11. `UpdatePocket.execute` — 10 casos

Estado inicial: `ACC1` disponible $500.000, reservado $500.000 (`VAC` $300.000,
`EST` $200.000).

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| CU-AC-01 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, name:'   '}))` | `ERROR INVALID_POCKET_NAME \| HTTP 400 \| El nombre del bolsillo no puede estar vacío` | | |
| CU-AC-02 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, amount:-100}))` | `ERROR INVALID_POCKET_AMOUNT \| HTTP 400 \| El monto del bolsillo no puede ser negativo`. **Rama inalcanzable por HTTP** | | |
| CU-AC-03 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC}))` | `ERROR NO_CHANGES_PROVIDED \| HTTP 400 \| No se proporcionaron cambios para el bolsillo`. **Rama inalcanzable por HTTP.** Nótese que esta comprobación va al final: primero busca el bolsillo y valida la cuenta | | |
| CU-AC-04 | `ver(actualizar.execute({userId:USER_ID, pocketId:FAKE, amount:1000}))` | `ERROR POCKET_NOT_FOUND \| HTTP 404 \| Bolsillo no encontrado` | | |
| CU-AC-05 | `ver(actualizar.execute({userId:AJENO, pocketId:VAC, amount:1000}))` | `ERROR FORBIDDEN \| HTTP 403` | | |
| CU-AC-06 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, amount:600000}))` | `OK` con `"amount":600000`. El disponible baja a $200.000 y lo reservado sube a $800.000 | | |
| CU-AC-07 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, amount:800000}))` | `OK` con `"amount":800000`. Valor límite: lo reservado iguala el total, el disponible queda en $0. La condición usa `>` estricto, así que se acepta | | |
| CU-AC-08 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, amount:800001}))` | `ERROR INSUFFICIENT_AVAILABLE_BALANCE \| HTTP 400 \| No tienes saldo disponible suficiente para ajustar este bolsillo`. Un peso por encima del total | | |
| CU-AC-09 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, amount:300000}))` | `OK` con `"amount":300000`. Bajar el monto libera saldo: el disponible vuelve a $500.000 | | |
| CU-AC-10 | `ver(actualizar.execute({userId:USER_ID, pocketId:VAC, name:'Vacaciones 2026'}))` | `OK` con `"name":"Vacaciones 2026"` y `"amount":300000` sin cambios. Sin `amount` no se toca el saldo | | |

Comprobación del saldo tras CU-AC-10:

```js
ver(accRepo.findById(ACC1))
```

Debe imprimir `"balance":500000`.

## 12. `DeletePocket.execute` — 4 casos

Estado inicial: `ACC1` disponible $500.000, reservado $500.000.

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| CU-EL-01 | `ver(eliminar.execute({userId:USER_ID, pocketId:FAKE}))` | `ERROR POCKET_NOT_FOUND \| HTTP 404 \| Bolsillo no encontrado` | | |
| CU-EL-02 | `ver(eliminar.execute({userId:AJENO, pocketId:EST}))` | `ERROR FORBIDDEN \| HTTP 403`. El bolsillo sigue existiendo | | |
| CU-EL-03 | `ver(eliminar.execute({userId:USER_ID, pocketId:EST}))` | `OK` devolviendo el bolsillo borrado (`"name":"Estudio"`, `"amount":200000`). El disponible sube a $700.000 y lo reservado baja a $300.000 | | |
| CU-EL-04 | `ver(eliminar.execute({userId:USER_ID, pocketId:EST}))` | `ERROR POCKET_NOT_FOUND \| HTTP 404`. El disponible sigue en $700.000: **no** debe volver a acreditarse el monto | | |

Comprobar el saldo antes de seguir:

```js
ver(accRepo.findById(ACC1))
```

Debe imprimir `"balance":700000`.

### Restauración antes de la sección 13

Transferir necesita dos bolsillos en `ACC1`. Recrear el que se borró:

```js
ver(crear.execute({ userId: USER_ID, accountId: ACC1, name: 'Estudio', amount: 200000 }))
```

Copiar el nuevo `id` en **`EST`**. Estado resultante: disponible $500.000, reservado
$500.000 (`VAC` $300.000, `EST` $200.000).

## 13. `TransferPocketBalance.execute` — 9 casos

Una transferencia entre bolsillos **no altera el saldo disponible de la cuenta**: solo
mueve dinero entre dos reservas. El disponible debe seguir en $500.000 al terminar.

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| CU-TR-01 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:EST, amount:0}))` | `ERROR INVALID_TRANSFER_AMOUNT \| HTTP 400 \| El monto de transferencia debe ser mayor que cero`. **Rama inalcanzable por HTTP** | | |
| CU-TR-02 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:VAC, amount:10000}))` | `ERROR INVALID_TRANSFER_TARGET \| HTTP 400 \| Los bolsillos de origen y destino deben ser diferentes` | | |
| CU-TR-03 | `ver(transferir.execute({userId:USER_ID, fromPocketId:FAKE, toPocketId:EST, amount:10000}))` | `ERROR SOURCE_POCKET_NOT_FOUND \| HTTP 404 \| Bolsillo de origen no encontrado` | | |
| CU-TR-04 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:FAKE, amount:10000}))` | `ERROR TARGET_POCKET_NOT_FOUND \| HTTP 404 \| Bolsillo de destino no encontrado` | | |
| CU-TR-05 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:OTRA, amount:10000}))` | `ERROR POCKETS_DIFFERENT_ACCOUNT \| HTTP 400 \| Los bolsillos deben pertenecer a la misma cuenta` | | |
| CU-TR-06 | `ver(transferir.execute({userId:AJENO, fromPocketId:VAC, toPocketId:EST, amount:10000}))` | `ERROR FORBIDDEN \| HTTP 403`. Los dos bolsillos existen y son de la misma cuenta, pero el usuario no es el dueño | | |
| CU-TR-07 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:EST, amount:300001}))` | `ERROR INSUFFICIENT_POCKET_BALANCE \| HTTP 400 \| Saldo insuficiente en el bolsillo de origen`. Valor límite: un peso más de lo que tiene el origen | | |
| CU-TR-08 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:EST, amount:100000}))` | `OK` con `fromPocket.amount = 200000` y `toPocket.amount = 300000` | | |
| CU-TR-09 | `ver(transferir.execute({userId:USER_ID, fromPocketId:VAC, toPocketId:EST, amount:200000}))` | `OK` con `fromPocket.amount = 0` y `toPocket.amount = 500000`. Valor límite: se transfiere el total del origen; la condición es `<` estricto, así que se acepta | | |

Comprobar que el disponible no se movió:

```js
ver(accRepo.findById(ACC1))
```

Debe seguir imprimiendo `"balance":500000`.

## 14. `GetAccountPockets.execute` — 5 casos

Estado inicial: `ACC1` disponible $500.000, `VAC` $0, `EST` $500.000.

| ID | Expresión a escribir en el REPL | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| CU-CO-01 | `ver(consultar.execute({userId:USER_ID, accountId:FAKE}))` | `ERROR ACCOUNT_NOT_FOUND \| HTTP 404 \| Cuenta no encontrada` | | |
| CU-CO-02 | `ver(consultar.execute({userId:AJENO, accountId:ACC1}))` | `ERROR FORBIDDEN \| HTTP 403`. No debe devolverse ningún bolsillo | | |
| CU-CO-03 | `ver(consultar.execute({userId:USER_ID, accountId:ACC1}))` | `OK` con un arreglo de 2 elementos: `"Vacaciones 2026"` con `amount` 0 y `"Estudio"` con `amount` 500000. Cada uno con exactamente los seis campos de `toPublic()` | | |
| CU-CO-04 | `ver(consultar.execute({userId:USER_ID, accountId:ACC3}))` | `OK` con `[]`. Una cuenta sin bolsillos devuelve arreglo vacío, no un 404. Requiere `ACC3` en estado `ACTIVA` | | |
| CU-CO-05 | (ver abajo) | La suma da exactamente $1.000.000 | | |

**CU-CO-05 — invariante de saldo.** Tras crear, actualizar, eliminar y transferir, lo
reservado más lo disponible debe seguir siendo lo depositado:

```js
Promise.all([accRepo.findById(ACC1), pocRepo.getTotalAmountByAccountId(ACC1)]).then(([a, r]) => console.log('disponible', a.balance, '+ reservado', r, '=', a.balance + r))
```

Esperado: `disponible 500000 + reservado 500000 = 1000000`.

## 15. Limpieza posterior

Los datos de la Parte B quedan en la base real. Desde el **Table editor** de Supabase, en
este orden:

1. `pockets` — borrar las filas cuyo `account_id` sea `ACC1`, `ACC2` o `ACC3`.
2. `notifications` — borrar las notificaciones de tipo `BOLSILLO` generadas durante la corrida.
3. `account_details` y luego `accounts` — borrar las tres cuentas.

El usuario no se toca: se reutilizó uno existente.

## 16. Resumen de ejecución

| Parte | Grupo | Casos | Aprobados | Fallidos | Bloqueados |
| --- | --- | ---: | ---: | ---: | ---: |
| A | Entidad `Pocket` | 13 | | | |
| A | Entidad `Account` | 4 | | | |
| A | Schemas de validación | 15 | | | |
| B | `CreatePocket` | 9 | | | |
| B | `UpdatePocket` | 10 | | | |
| B | `DeletePocket` | 4 | | | |
| B | `TransferPocketBalance` | 9 | | | |
| B | `GetAccountPockets` | 5 | | | |
| | **Total** | **69** | | | |

## 17. Hallazgos

Detectados al diseñar los casos y comprobados ejecutando las unidades puras. Ninguno se
corrigió: el alcance acordado es corregir las pruebas, no el código de producción.

### D-01 · `Pocket` no valida el nombre al construir

- **Severidad:** Media · **Caso:** PU-06 · **Archivo:** `src/domain/entities/Pocket.ts`
- El constructor llama a `assertValidAmount` pero no valida el nombre, así que
  `Pocket.create({ name: '' })` produce un bolsillo sin nombre. En cambio `updateName('')`
  sí lanza `INVALID_POCKET_NAME`. La misma entidad aplica dos reglas distintas al mismo
  campo según se cree o se modifique.

### D-02 · Un booleano se convierte en un monto de $1

- **Severidad:** Media · **Caso:** VU-03 · **Archivo:** `src/presentation/validators/pocket.validators.ts`
- `amount: z.coerce.number()` convierte `true` en `1`, así que un cliente que mande un
  booleano crea un bolsillo de un peso en lugar de recibir un error de validación.

### D-03 · Un nombre de solo espacios pasa la validación de creación

- **Severidad:** Baja · **Caso:** VU-07
- `createPocketSchema` valida longitud con `min(1)` pero no recorta, así que `"   "` pasa.
  Combinado con **D-01**, un bolsillo puede terminar persistido con nombre vacío.

### D-04 · `amount` se trata distinto al crear y al actualizar

- **Severidad:** Baja · **Caso:** VU-11
- `createPocketSchema` usa `z.coerce.number()` y acepta `"500"`; `updatePocketSchema` usa
  `z.number()` y lo rechaza. La misma entrada da resultados opuestos según la operación.

### D-05 · El saldo reservado se cuenta dos veces al crear un bolsillo

- **Severidad:** Alta · **Caso:** CU-CR-09 · **Archivo:** `src/application/use-cases/pocket/CreatePocket.ts`
- La decisión es `currentReserved + dto.amount > account.balance`, pero `account.balance`
  ya es el saldo **disponible**: lo reservado se descontó al crear los bolsillos anteriores.
  La comparación suma lo reservado a un valor que ya lo excluye, así que se rechazan
  bolsillos que sí caben. En cuanto lo reservado supera lo disponible no se puede crear
  ningún bolsillo nuevo, ni siquiera de $1.
- `UpdatePocket` resuelve el mismo problema correctamente, comparando contra
  `account.balance + totalReserved`. Las dos operaciones aplican reglas distintas al mismo
  invariante.

### D-06 · No hay forma de bloquear una cuenta desde el código de aplicación

- **Severidad:** Baja (limitación de testabilidad) · **Caso:** CU-CR-08
- `Account` expone `block()` y `close()`, y los cuatro casos de uso comprueban
  `isOperational()`, pero ningún caso de uso ni ruta cambia el estado de una cuenta. La
  rama `ACCOUNT_NOT_OPERATIONAL` solo se puede ejercitar a nivel de caso de uso editando la
  columna `status` a mano. A nivel de entidad sí queda cubierta, en AU-02.

### D-07 · El repositorio de bolsillos tiene un modo de respaldo en memoria

- **Severidad:** Media · **Archivo:** `src/infrastructure/repositories/SupabasePocketRepository.ts`
- Si la tabla `pockets` no existe, el repositorio activa un `fallbackStore` en memoria a
  nivel de módulo y sigue operando. Con esa bandera activa los datos no se persisten y se
  pierden al reiniciar el proceso.
- **Implicación para la Parte B:** si en la consola aparece
  `"Supabase pockets table is not available. Using in-memory fallback for pockets."`, los
  resultados de la Parte B quedan invalidados. Comprobar además, al terminar, que las filas
  existen en la tabla `pockets`.

## 18. Trazabilidad — unidad ↔ caso

| Unidad | Comportamiento | Casos |
| --- | --- | --- |
| `Pocket.create` | recorta el nombre | PU-01 |
| `Pocket.create` | acepta monto 0 | PU-02 |
| `Pocket.assertValidAmount` | rechaza negativo, `NaN` y no-número | PU-03, PU-04, PU-05, PU-09, PU-10 |
| `Pocket` (constructor) | no valida el nombre | PU-06 |
| `Pocket.toPublic` | seis campos, fechas ISO | PU-07 |
| `Pocket.updateAmount` | acepta 0, refresca `updatedAt` | PU-08, PU-13 |
| `Pocket.updateName` | recorta y rechaza vacío | PU-11, PU-12 |
| `Account.isOperational` | solo ACTIVA opera | AU-01, AU-02 |
| `Account.assertBelongsTo` | dueño pasa, ajeno lanza `FORBIDDEN` | AU-03, AU-04 |
| `createPocketSchema` | coacción, límites y rechazo | VU-01 … VU-09 |
| `updatePocketSchema` | exige un campo, no coacciona | VU-10, VU-11, VU-12 |
| `transferPocketSchema` | `gt(0)` y UUID | sección 8.3 |
| `CreatePocket` | monto negativo | CU-CR-01 |
| `CreatePocket` | cuenta inexistente / ajena / no operativa | CU-CR-02, CU-CR-03, CU-CR-08 |
| `CreatePocket` | saldo insuficiente y camino principal | CU-CR-04, CU-CR-05, CU-CR-07, CU-CR-09 |
| `UpdatePocket` | validaciones previas | CU-AC-01, CU-AC-02, CU-AC-03 |
| `UpdatePocket` | bolsillo inexistente / ajeno | CU-AC-04, CU-AC-05 |
| `UpdatePocket` | recálculo de reserva y límites | CU-AC-06 … CU-AC-09 |
| `UpdatePocket` | cambio solo de nombre | CU-AC-10 |
| `DeletePocket` | inexistente / ajeno / borrado / doble borrado | CU-EL-01 … CU-EL-04 |
| `TransferPocketBalance` | validaciones previas | CU-TR-01, CU-TR-02 |
| `TransferPocketBalance` | bolsillos inexistentes o de otra cuenta | CU-TR-03, CU-TR-04, CU-TR-05 |
| `TransferPocketBalance` | autorización y saldo | CU-TR-06, CU-TR-07 |
| `TransferPocketBalance` | camino principal y límite | CU-TR-08, CU-TR-09 |
| `GetAccountPockets` | inexistente / ajena / con y sin bolsillos | CU-CO-01 … CU-CO-04 |
| Integridad de datos | invariante de saldo | CU-CO-05 |
