# Pruebas manuales — Módulo Bolsillos (Backend)

Protocolo de pruebas **manuales** ejecutadas a mano contra la **API HTTP real** del backend
de FuBank. No se usan mocks, dobles ni repositorios en memoria: cada caso golpea los
endpoints reales, que persisten en Supabase.

## 1. Identificación

| Campo | Valor |
| --- | --- |
| **Módulo bajo prueba** | Bolsillos (crear, actualizar, eliminar, transferir, consultar) |
| **Componentes ejercitados** | `PocketController` → `pocket.validators` → casos de uso `pocket/*` → `SupabasePocketRepository` / `SupabaseAccountRepository` |
| **Técnica** | Caja blanca (caminos y decisiones del código) ejecutada de forma manual sobre la interfaz HTTP |
| **Tipo de prueba** | Manual, no automatizada, sin dobles de prueba |
| **Nivel** | Integración de componente (la unidad se ejercita a través de su endpoint real) |
| **Total de casos** | 54 (13 crear · 14 actualizar · 8 eliminar · 13 transferir · 6 consultar) |
| **Fecha de ejecución** | _(llenar)_ |
| **Versión probada** | _(llenar: salida de `git rev-parse --abbrev-ref HEAD` y `git rev-parse --short HEAD`)_ |
| **Responsable** | _(llenar)_ |

> **Nota sobre el nivel de prueba.** Al ejecutarse contra la API real, cada caso recorre
> controlador → validador Zod → caso de uso → repositorio Supabase. En rigor son pruebas
> de **integración de componente**, aunque el diseño de los casos sea de caja blanca:
> cada caso se derivó de una decisión concreta del código del caso de uso.

## 2. Alcance

Se cubren las cinco operaciones del módulo:

| Operación | Endpoint | Caso de uso |
| --- | --- | --- |
| Crear | `POST /api/v1/pockets` | `CreatePocket.execute` |
| Actualizar | `PATCH /api/v1/pockets/:pocketId` | `UpdatePocket.execute` |
| Eliminar | `DELETE /api/v1/pockets/:pocketId` | `DeletePocket.execute` |
| Transferir | `POST /api/v1/pockets/transfer` | `TransferPocketBalance.execute` |
| Consultar | `GET /api/v1/pockets/account/:accountId` | `GetAccountPockets.execute` |

**Fuera de alcance:** módulos de autenticación, cuentas, préstamos, pagos, tarjetas,
transferencias entre cuentas y notificaciones. Los endpoints de autenticación y cuentas se
usan únicamente para montar las precondiciones.

## 3. Entorno de ejecución

| Elemento | Valor |
| --- | --- |
| **URL base** | `http://localhost:3001/api/v1` |
| **Base de datos** | Supabase real, la configurada en `backend/.env` |
| **Autenticación** | JWT en el header `Authorization: Bearer <token>` |
| **Herramienta sugerida** | Postman, Insomnia, Thunder Client o `curl` desde Git Bash |
| **Formato de petición** | `Content-Type: application/json` |

Antes de empezar, levantar el backend y comprobar que responde:

```bash
cd backend && npm run dev
```

```bash
curl -s http://localhost:3001/health
```

Debe devolver `{"status":"ok", ...}`. Si no responde, ningún caso de este documento es
ejecutable.

> **Advertencia.** Estas pruebas **escriben en la base de datos real**: crean usuarios,
> cuentas, bolsillos y notificaciones que quedan persistidos. Ejecutarlas contra un
> proyecto de Supabase de desarrollo, nunca contra producción. La sección 11 indica cómo
> limpiar los datos generados.

## 4. Convenciones

### 4.1 Formato de respuesta

Éxito:

```json
{ "success": true, "message": "<mensaje>", "data": <objeto o arreglo> }
```

Error:

```json
{ "success": false, "error": { "code": "<CODIGO>", "message": "<mensaje>" } }
```

Los errores de validación de Zod agregan además `error.fields` con el detalle por campo.

### 4.2 Variables

Cada caso referencia valores capturados durante la preparación. Anotarlos aquí a medida
que se obtienen:

| Variable | Descripción | Valor obtenido |
| --- | --- | --- |
| `TOKEN_A` | JWT del usuario A (dueño de las cuentas bajo prueba) | |
| `TOKEN_B` | JWT del usuario B (usuario ajeno, para los casos 403) | |
| `ACC_A1` | Cuenta principal de A — fondos totales $1.000.000 | |
| `ACC_A2` | Cuenta secundaria de A — fondos totales $200.000 | |
| `ACC_A3` | Cuenta de A que se bloqueará — fondos totales $100.000 | |
| `ACC_A4` | Cuenta de A sin depósito ni bolsillos | |
| `ACC_B` | Cuenta del usuario B — fondos totales $100.000 | |
| `POC_VAC` | Bolsillo "Vacaciones" en `ACC_A1` | |
| `POC_EST` | Bolsillo "Estudio" en `ACC_A1` | |
| `POC_CERO` | Bolsillo "Cero" en `ACC_A1`, monto $0 | |
| `POC_OTRA` | Bolsillo "Otra cuenta" en `ACC_A2` | |
| `POC_TMP` | Bolsillo "Temporal" en `ACC_A2` | |
| `POC_BLQ1` | Bolsillo "Bloq origen" en `ACC_A3` | |
| `POC_BLQ2` | Bolsillo "Bloq destino" en `ACC_A3` | |
| `POC_AJE1` | Bolsillo "Ajeno 1" en `ACC_B` | |
| `POC_AJE2` | Bolsillo "Ajeno 2" en `ACC_B` | |
| `UUID_FAKE` | UUID válido pero inexistente: `00000000-0000-4000-8000-000000000000` | (fijo) |

### 4.3 Vocabulario de saldos

Sobre una cuenta se manejan tres cifras. La invariante del módulo es que su relación se
mantenga en todo momento:

- **Disponible** — `accounts.balance` en la base de datos. Es lo que queda libre.
- **Reservado** — suma de los `amount` de los bolsillos de la cuenta.
- **Total** — `disponible + reservado`. Debe ser constante e igual a lo depositado.

Cada caso declara el estado esperado antes y después, en esos términos.

### 4.4 Cómo registrar el resultado

Cada caso termina con una tabla de dos columnas. Se escribe el **resultado obtenido** con
el código HTTP y el cuerpo relevante de la respuesta, y se marca el estado:

- **Aprobado** — lo obtenido coincide con lo esperado.
- **Fallido** — lo obtenido difiere de lo esperado (registrar la diferencia exacta).
- **Bloqueado** — no se pudo ejecutar (anotar por qué).

---

## 5. Preparación del entorno

Estos pasos no son casos de prueba: montan el estado que los casos necesitan. Si alguno
falla, la suite completa queda **Bloqueada**.

### SETUP-01 · Registrar el usuario A

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "Ana",
  "lastName": "Quintero",
  "birthDate": "1998-05-20",
  "email": "qa.bolsillos.a@fubank.com",
  "document": "9000000001",
  "password": "Segura123",
  "confirmPassword": "Segura123"
}
```

Esperado: `201` · `"Usuario registrado exitosamente"`. Copiar `data.token` en **`TOKEN_A`**.

> Si devuelve `EMAIL_ALREADY_EXISTS`, el usuario ya existe de una corrida anterior: iniciar
> sesión con `POST /api/v1/auth/login` usando el mismo correo y contraseña, y tomar el
> token de ahí. Si la respuesta trae `requiresTwoFactor: true`, desactivar el 2FA de ese
> usuario antes de continuar.

### SETUP-02 · Registrar el usuario B

Misma petición cambiando `firstName` a `"Bruno"`, `lastName` a `"Salgado"`,
`email` a `"qa.bolsillos.b@fubank.com"` y `document` a `"9000000002"`.

Esperado: `201`. Copiar `data.token` en **`TOKEN_B`**.

### SETUP-03 · Crear las cuatro cuentas del usuario A

Repetir cuatro veces, con `TOKEN_A`:

```http
POST /api/v1/accounts
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "type": "AHORROS" }
```

Esperado: `201` en cada una, con `data.balance = 0` y `data.status = "ACTIVA"`.
Copiar los `data.id` en **`ACC_A1`**, **`ACC_A2`**, **`ACC_A3`** y **`ACC_A4`**.

### SETUP-04 · Crear la cuenta del usuario B

Misma petición con `TOKEN_B`. Copiar el `data.id` en **`ACC_B`**.

### SETUP-05 · Depositar los fondos

| Cuenta | Token | Monto |
| --- | --- | --- |
| `ACC_A1` | `TOKEN_A` | 1000000 |
| `ACC_A2` | `TOKEN_A` | 200000 |
| `ACC_A3` | `TOKEN_A` | 100000 |
| `ACC_B` | `TOKEN_B` | 100000 |

`ACC_A4` se deja en $0 y sin bolsillos: es la cuenta vacía del caso BE-CO-05.

```http
POST /api/v1/accounts/{{ACC_A1}}/deposit
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 1000000, "description": "Fondeo de pruebas" }
```

Esperado: `200` · `"Depósito realizado exitosamente"` con el `balance` actualizado.

### SETUP-06 · Crear los bolsillos auxiliares

Todos con `POST /api/v1/pockets`. Verificar que cada uno devuelva `201`.

| # | Cuenta | Token | `name` | `amount` | Guardar en |
| --- | --- | --- | --- | ---: | --- |
| 1 | `ACC_A2` | `TOKEN_A` | `Otra cuenta` | 50000 | `POC_OTRA` |
| 2 | `ACC_A2` | `TOKEN_A` | `Temporal` | 30000 | `POC_TMP` |
| 3 | `ACC_A3` | `TOKEN_A` | `Bloq origen` | 20000 | `POC_BLQ1` |
| 4 | `ACC_A3` | `TOKEN_A` | `Bloq destino` | 20000 | `POC_BLQ2` |
| 5 | `ACC_B` | `TOKEN_B` | `Ajeno 1` | 30000 | `POC_AJE1` |
| 6 | `ACC_B` | `TOKEN_B` | `Ajeno 2` | 20000 | `POC_AJE2` |

Estado resultante:

| Cuenta | Disponible | Reservado | Total |
| --- | ---: | ---: | ---: |
| `ACC_A1` | $1.000.000 | $0 | $1.000.000 |
| `ACC_A2` | $120.000 | $80.000 | $200.000 |
| `ACC_A3` | $60.000 | $40.000 | $100.000 |
| `ACC_A4` | $0 | $0 | $0 |
| `ACC_B` | $50.000 | $50.000 | $100.000 |

### SETUP-07 · Bloquear la cuenta `ACC_A3`

**La API no expone ningún endpoint para bloquear una cuenta.** Este paso se hace a mano
desde el panel de Supabase, y por eso debe ejecutarse *después* de SETUP-06:

1. Abrir el proyecto de Supabase → **Table editor** → tabla `accounts`.
2. Localizar la fila cuyo `id` es `ACC_A3`.
3. Cambiar la columna `status` de `ACTIVA` a `BLOQUEADA` y guardar.

Verificar con `GET /api/v1/accounts/{{ACC_A3}}` (con `TOKEN_A`) que `data.status` sea
`"BLOQUEADA"`.

> Esta dependencia manual es en sí un hallazgo: los caminos `ACCOUNT_NOT_OPERATIONAL` del
> módulo no son alcanzables usando solo la API pública. Queda registrado como **H-04** en
> la sección 13.

---

## 6. Crear bolsillo — `POST /api/v1/pockets`

Decisiones del código bajo prueba (`CreatePocket.execute`):

| # | Decisión | Error si se cumple |
| --- | --- | --- |
| D1 | `dto.amount < 0` | `INVALID_POCKET_AMOUNT` (400) |
| D2 | `!account` | `ACCOUNT_NOT_FOUND` (404) |
| D3 | `account.assertBelongsTo(userId)` falla | `FORBIDDEN` (403) |
| D4 | `!account.isOperational()` | `ACCOUNT_NOT_OPERATIONAL` (400) |
| D5 | `currentReserved + amount > account.balance` | `INSUFFICIENT_AVAILABLE_BALANCE` (400) |
| D6 | `notificationRepository` presente | (registra notificación) |

Los casos BE-CR-01 a BE-CR-08 no modifican el estado; BE-CR-09 en adelante sí.

### BE-CR-01 · Crear sin autenticación

**Objetivo:** verificar que `authMiddleware` corta la petición antes de llegar al caso de uso.
**Precondición:** `ACC_A1` con disponible $1.000.000, reservado $0.

```http
POST /api/v1/pockets
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Sin token", "amount": 50000 }
```

**Esperado:** `401` · `UNAUTHORIZED` · `"Se requiere autenticación"`.
**Estado posterior:** sin cambios; no se crea ningún bolsillo.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-02 · `accountId` que no es UUID

**Objetivo:** comprobar que el validador Zod rechaza el identificador antes del caso de uso.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "no-es-uuid", "name": "Formato malo", "amount": 50000 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.accountId` contiene
`"accountId debe ser un UUID válido"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-03 · Monto negativo

**Objetivo:** determinar qué capa rechaza un monto negativo.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Monto negativo", "amount": -1 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.amount` contiene
`"El monto del bolsillo no puede ser negativo"`.

> **Importante.** El error **no** es `INVALID_POCKET_AMOUNT`. El schema Zod
> (`amount: z.coerce.number().min(0)`) rechaza el valor antes de que el caso de uso
> evalúe la decisión D1, de modo que esa rama es **inalcanzable por HTTP**. Ver hallazgo
> **H-02**.

**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-04 · Nombre vacío

**Objetivo:** verificar la validación de longitud mínima del nombre.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "", "amount": 50000 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.name` contiene
`"El nombre del bolsillo es obligatorio"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-05 · Nombre de 151 caracteres

**Objetivo:** valor límite superior de la longitud del nombre (máximo permitido: 150).
**Datos:** `name` = la letra `A` repetida 151 veces.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "AAA…(151 caracteres)", "amount": 50000 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.name` contiene
`"El nombre del bolsillo no puede superar 150 caracteres"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-06 · Cuenta inexistente (decisión D2)

**Objetivo:** recorrer la rama `!account`.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{UUID_FAKE}}", "name": "Fantasma", "amount": 50000 }
```

**Esperado:** `404` · `ACCOUNT_NOT_FOUND` · `"Cuenta no encontrada"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-07 · Cuenta de otro usuario (decisión D3)

**Objetivo:** recorrer `assertBelongsTo`, la barrera de autorización a nivel de dominio.
**Precondición:** `ACC_B` pertenece al usuario B; se usa el token de A.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_B}}", "name": "Cuenta ajena", "amount": 10000 }
```

**Esperado:** `403` · `FORBIDDEN` · `"No tienes permiso para acceder a esta cuenta"`.
**Estado posterior:** `ACC_B` sin cambios (disponible $50.000, reservado $50.000).

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-08 · Cuenta bloqueada (decisión D4)

**Objetivo:** recorrer la rama `!account.isOperational()`.
**Precondición:** SETUP-07 ejecutado — `ACC_A3` en estado `BLOQUEADA`.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A3}}", "name": "En cuenta bloqueada", "amount": 10000 }
```

**Esperado:** `400` · `ACCOUNT_NOT_OPERATIONAL` ·
`"La cuenta no está disponible para generar bolsillos"`.
**Estado posterior:** `ACC_A3` sin cambios (disponible $60.000, reservado $40.000).

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-09 · Monto que excede el disponible por $1 (decisión D5, valor límite)

**Objetivo:** valor límite superior del saldo. Con reservado $0, el monto máximo aceptable
es exactamente el disponible; se prueba con uno más.
**Precondición:** `ACC_A1` disponible $1.000.000, reservado $0.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Excede por uno", "amount": 1000001 }
```

**Esperado:** `400` · `INSUFFICIENT_AVAILABLE_BALANCE` ·
`"No tienes saldo disponible suficiente para crear este bolsillo"`.
**Estado posterior:** `ACC_A1` sin cambios (disponible $1.000.000, reservado $0).

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-10 · Crear bolsillo con saldo suficiente (camino principal)

**Objetivo:** recorrer el camino completo hasta la creación y la notificación.
**Precondición:** `ACC_A1` disponible $1.000.000, reservado $0, sin bolsillos.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Vacaciones", "amount": 300000 }
```

**Esperado:** `201` · `"Bolsillo creado"` · `data.name = "Vacaciones"` ·
`data.amount = 300000` · `data.accountId = ACC_A1` · `data.id` es un UUID.
Guardar `data.id` en **`POC_VAC`**.

**Verificaciones adicionales:**

1. `GET /api/v1/accounts/{{ACC_A1}}` → `data.balance` debe ser `700000`.
2. `GET /api/v1/notifications` (con `TOKEN_A`) → debe existir una notificación con título
   `"Bolsillo creado"` y tipo `BOLSILLO`.

**Estado posterior:** `ACC_A1` disponible $700.000, reservado $300.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-11 · Crear un segundo bolsillo

**Objetivo:** confirmar que se pueden acumular bolsillos en la misma cuenta.
**Precondición:** `ACC_A1` disponible $700.000, reservado $300.000.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Estudio", "amount": 200000 }
```

**Esperado:** `201` · `"Bolsillo creado"` · `data.amount = 200000`.
Guardar `data.id` en **`POC_EST`**.
Comprobar que `GET /api/v1/accounts/{{ACC_A1}}` devuelve `balance = 500000`.

**Estado posterior:** `ACC_A1` disponible $500.000, reservado $500.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-12 · Crear bolsillo con monto $0 (valor límite inferior)

**Objetivo:** el mínimo aceptado por el schema es 0; verificar que no se rechaza ni altera
el saldo.
**Precondición:** `ACC_A1` disponible $500.000, reservado $500.000.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Cero", "amount": 0 }
```

**Esperado:** `201` · `"Bolsillo creado"` · `data.amount = 0`.
Guardar `data.id` en **`POC_CERO`**. El disponible debe seguir en `500000`.

**Estado posterior:** `ACC_A1` disponible $500.000, reservado $500.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CR-13 · Bolsillo que cabe en el disponible pero es rechazado (defecto conocido)

**Objetivo:** verificar la decisión D5 cuando la cuenta ya tiene reservas previas.
**Precondición:** `ACC_A1` disponible $500.000, reservado $500.000, total $1.000.000.

El monto solicitado ($400.000) **cabe holgadamente** en el disponible ($500.000), así que
la regla de negocio exige que el bolsillo se cree.

```http
POST /api/v1/pockets
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "accountId": "{{ACC_A1}}", "name": "Emergencia", "amount": 400000 }
```

**Esperado (regla de negocio):** `201` · `"Bolsillo creado"`, dejando `ACC_A1` con
disponible $100.000 y reservado $900.000.

**Esperado según el código actual:** `400` · `INSUFFICIENT_AVAILABLE_BALANCE`, porque la
comparación es `currentReserved + amount > account.balance` → `500.000 + 400.000 = 900.000
> 500.000`. Como `account.balance` ya es el saldo **disponible** (lo reservado se descontó
al crear los bolsillos anteriores), el monto reservado se cuenta dos veces.

**Este caso debe registrarse como Fallido.** Es el defecto **H-01** de la sección 13. No se
corrige el código en esta entrega.

**Estado posterior:** `ACC_A1` sin cambios (disponible $500.000, reservado $500.000).

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

---

## 7. Actualizar bolsillo — `PATCH /api/v1/pockets/:pocketId`

Decisiones del código bajo prueba (`UpdatePocket.execute`):

| # | Decisión | Error si se cumple |
| --- | --- | --- |
| D1 | `name !== undefined && !name.trim()` | `INVALID_POCKET_NAME` (400) |
| D2 | `amount !== undefined && amount < 0` | `INVALID_POCKET_AMOUNT` (400) |
| D3 | `!pocket` | `POCKET_NOT_FOUND` (404) |
| D4 | `!account` | `ACCOUNT_NOT_FOUND` (404) |
| D5 | `assertBelongsTo` falla | `FORBIDDEN` (403) |
| D6 | `!account.isOperational()` | `ACCOUNT_NOT_OPERATIONAL` (400) |
| D7 | `newReservedTotal > balance + totalReserved` | `INSUFFICIENT_AVAILABLE_BALANCE` (400) |
| D8 | `amount` y `name` ambos `undefined` | `NO_CHANGES_PROVIDED` (400) |

**Estado inicial de la sección:** `ACC_A1` disponible $500.000, reservado $500.000
(`POC_VAC` = $300.000, `POC_EST` = $200.000, `POC_CERO` = $0).

### BE-AC-01 · Actualizar sin autenticación

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Content-Type: application/json

{ "amount": 400000 }
```

**Esperado:** `401` · `UNAUTHORIZED` · `"Se requiere autenticación"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-02 · Cuerpo vacío

**Objetivo:** determinar qué capa rechaza una actualización sin campos.

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{}
```

**Esperado:** `400` · `VALIDATION_ERROR` · mensaje
`"Debes enviar al menos un campo para actualizar"`.

> El error **no** es `NO_CHANGES_PROVIDED`: el `refine` del schema corta antes, dejando esa
> rama del caso de uso inalcanzable por HTTP. Ver hallazgo **H-02**.

**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-03 · Monto negativo

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": -100 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.amount` contiene
`"El monto del bolsillo no puede ser negativo"`. La rama D2 queda inalcanzable (**H-02**).
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-04 · Nombre compuesto solo por espacios (decisión D1)

**Objetivo:** este es el único caso en que el validador Zod deja pasar el valor y la
decisión D1 del caso de uso sí se ejecuta: `"   "` tiene longitud 3, pero `.trim()` lo
vacía.

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "name": "   " }
```

**Esperado:** `400` · `INVALID_POCKET_NAME` · `"El nombre del bolsillo no puede estar vacío"`.
**Estado posterior:** sin cambios; `POC_VAC` conserva el nombre "Vacaciones".

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-05 · Bolsillo inexistente (decisión D3)

```http
PATCH /api/v1/pockets/{{UUID_FAKE}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 1000 }
```

**Esperado:** `404` · `POCKET_NOT_FOUND` · `"Bolsillo no encontrado"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-06 · `pocketId` malformado en la ruta

**Objetivo:** el parámetro de ruta no pasa por Zod; se comprueba cómo reacciona el
repositorio ante un identificador que no es UUID.

```http
PATCH /api/v1/pockets/abc123
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 1000 }
```

**Esperado:** `404` · `POCKET_NOT_FOUND`. El repositorio traduce el error de Supabase a
`null` (`if (error || !data) return null`), de modo que el caso de uso lo ve como
inexistente.

> Si la respuesta es `500 INTERNAL_ERROR`, registrar como hallazgo nuevo: el identificador
> malformado estaría escapando del manejo de errores del repositorio.

**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-07 · Bolsillo de otro usuario (decisión D5)

```http
PATCH /api/v1/pockets/{{POC_AJE1}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 1000 }
```

**Esperado:** `403` · `FORBIDDEN` · `"No tienes permiso para acceder a esta cuenta"`.
**Estado posterior:** `POC_AJE1` conserva su monto de $30.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-08 · Bolsillo en cuenta bloqueada (decisión D6)

```http
PATCH /api/v1/pockets/{{POC_BLQ1}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 25000 }
```

**Esperado:** `400` · `ACCOUNT_NOT_OPERATIONAL` ·
`"La cuenta no está disponible para modificar bolsillos"`.
**Estado posterior:** `ACC_A3` sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-09 · Aumentar el monto dentro del disponible

**Objetivo:** camino principal con recálculo de reserva al alza.
**Precondición:** `ACC_A1` disponible $500.000, reservado $500.000, `POC_VAC` = $300.000.

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 600000 }
```

**Esperado:** `200` · `"Bolsillo actualizado"` · `data.amount = 600000`.
`GET /api/v1/accounts/{{ACC_A1}}` debe devolver `balance = 200000`
(500.000 − 300.000 de incremento).

**Estado posterior:** disponible $200.000, reservado $800.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-10 · Reservar exactamente el total de la cuenta (valor límite)

**Objetivo:** límite superior de la decisión D7. El total reservado queda igual al total de
fondos, dejando el disponible en $0; la condición usa `>` estricto, así que debe aceptarse.
**Precondición:** disponible $200.000, reservado $800.000, `POC_VAC` = $600.000.

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 800000 }
```

**Esperado:** `200` · `data.amount = 800000` · `balance` de la cuenta = `0`.

**Estado posterior:** disponible $0, reservado $1.000.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-11 · Exceder el total por $1 (valor límite, decisión D7)

**Precondición:** disponible $0, reservado $1.000.000, `POC_VAC` = $800.000.

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 800001 }
```

**Esperado:** `400` · `INSUFFICIENT_AVAILABLE_BALANCE` ·
`"No tienes saldo disponible suficiente para ajustar este bolsillo"`.
**Estado posterior:** sin cambios; `POC_VAC` sigue en $800.000 y el disponible en $0.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-12 · Disminuir el monto y liberar saldo

**Objetivo:** verificar que el delta negativo devuelve dinero al disponible.
**Precondición:** disponible $0, reservado $1.000.000, `POC_VAC` = $800.000.

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "amount": 300000 }
```

**Esperado:** `200` · `data.amount = 300000` · `balance` de la cuenta = `500000`.

**Estado posterior:** disponible $500.000, reservado $500.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-13 · Cambiar únicamente el nombre

**Objetivo:** verificar que sin `amount` no se toca el saldo (la rama de recálculo se salta).

```http
PATCH /api/v1/pockets/{{POC_VAC}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "name": "Vacaciones 2026" }
```

**Esperado:** `200` · `data.name = "Vacaciones 2026"` · `data.amount = 300000` sin cambios.
`GET /api/v1/accounts/{{ACC_A1}}` debe seguir devolviendo `balance = 500000`.

**Estado posterior:** disponible $500.000, reservado $500.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-AC-14 · Cambiar nombre y monto en la misma petición

**Objetivo:** recorrer las dos ramas de modificación en una sola llamada.
**Precondición:** `POC_EST` = $200.000, disponible $500.000, reservado $500.000.

```http
PATCH /api/v1/pockets/{{POC_EST}}
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "name": "Estudio Posgrado", "amount": 250000 }
```

**Esperado:** `200` · `data.name = "Estudio Posgrado"` · `data.amount = 250000` ·
`balance` de la cuenta = `450000`.

**Estado posterior:** disponible $450.000, reservado $550.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

---

## 8. Eliminar bolsillo — `DELETE /api/v1/pockets/:pocketId`

Decisiones del código bajo prueba (`DeletePocket.execute`):

| # | Decisión | Error si se cumple |
| --- | --- | --- |
| D1 | `!pocket` | `POCKET_NOT_FOUND` (404) |
| D2 | `!account` | `ACCOUNT_NOT_FOUND` (404) |
| D3 | `assertBelongsTo` falla | `FORBIDDEN` (403) |
| D4 | `!account.isOperational()` | `ACCOUNT_NOT_OPERATIONAL` (400) |

**Estado inicial de la sección:** `ACC_A1` disponible $450.000, reservado $550.000
(`POC_VAC` = $300.000, `POC_EST` = $250.000, `POC_CERO` = $0).
`ACC_A2` disponible $120.000, reservado $80.000 (`POC_OTRA` = $50.000, `POC_TMP` = $30.000).

### BE-EL-01 · Eliminar sin autenticación

```http
DELETE /api/v1/pockets/{{POC_TMP}}
```

**Esperado:** `401` · `UNAUTHORIZED` · `"Se requiere autenticación"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-02 · Bolsillo inexistente (decisión D1)

```http
DELETE /api/v1/pockets/{{UUID_FAKE}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `404` · `POCKET_NOT_FOUND` · `"Bolsillo no encontrado"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-03 · `pocketId` malformado

```http
DELETE /api/v1/pockets/abc123
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `404` · `POCKET_NOT_FOUND`, por la misma razón que BE-AC-06.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-04 · Bolsillo de otro usuario (decisión D3)

```http
DELETE /api/v1/pockets/{{POC_AJE1}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `403` · `FORBIDDEN` · `"No tienes permiso para acceder a esta cuenta"`.
**Estado posterior:** `POC_AJE1` sigue existiendo. Confirmarlo con
`GET /api/v1/pockets/account/{{ACC_B}}` usando `TOKEN_B`.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-05 · Bolsillo en cuenta bloqueada (decisión D4)

```http
DELETE /api/v1/pockets/{{POC_BLQ1}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `400` · `ACCOUNT_NOT_OPERATIONAL` ·
`"La cuenta no está disponible para eliminar bolsillos"`.
**Estado posterior:** `ACC_A3` sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-06 · Eliminar un bolsillo y recuperar su saldo (camino principal)

**Precondición:** `ACC_A2` disponible $120.000, reservado $80.000, `POC_TMP` = $30.000.

```http
DELETE /api/v1/pockets/{{POC_TMP}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `200` · `"Bolsillo eliminado"` · el cuerpo devuelve el bolsillo borrado
(`data.id = POC_TMP`, `data.name = "Temporal"`, `data.amount = 30000`).

**Verificaciones adicionales:**

1. `GET /api/v1/accounts/{{ACC_A2}}` → `data.balance = 150000`.
2. `GET /api/v1/pockets/account/{{ACC_A2}}` → el arreglo ya no contiene `POC_TMP`.

**Estado posterior:** `ACC_A2` disponible $150.000, reservado $50.000, total $200.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-07 · Eliminar dos veces el mismo bolsillo

**Objetivo:** verificar que la segunda eliminación no vuelve a acreditar dinero.
**Precondición:** BE-EL-06 ejecutado; `ACC_A2` disponible $150.000.

```http
DELETE /api/v1/pockets/{{POC_TMP}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `404` · `POCKET_NOT_FOUND`.
**Estado posterior:** `ACC_A2` sigue en disponible $150.000 — **no** debe subir a $180.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-EL-08 · Eliminar un bolsillo de monto $0

**Objetivo:** valor límite inferior en la devolución de saldo.
**Precondición:** `ACC_A1` disponible $450.000, `POC_CERO` = $0.

```http
DELETE /api/v1/pockets/{{POC_CERO}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `200` · `"Bolsillo eliminado"` · `data.amount = 0`.
`GET /api/v1/accounts/{{ACC_A1}}` debe seguir devolviendo `balance = 450000`.

**Estado posterior:** `ACC_A1` disponible $450.000, reservado $550.000
(`POC_VAC` = $300.000, `POC_EST` = $250.000).

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

---

## 9. Transferir entre bolsillos — `POST /api/v1/pockets/transfer`

Decisiones del código bajo prueba (`TransferPocketBalance.execute`):

| # | Decisión | Error si se cumple |
| --- | --- | --- |
| D1 | `amount <= 0` | `INVALID_TRANSFER_AMOUNT` (400) |
| D2 | `fromPocketId === toPocketId` | `INVALID_TRANSFER_TARGET` (400) |
| D3 | `!fromPocket` | `SOURCE_POCKET_NOT_FOUND` (404) |
| D4 | `!toPocket` | `TARGET_POCKET_NOT_FOUND` (404) |
| D5 | `fromPocket.accountId !== toPocket.accountId` | `POCKETS_DIFFERENT_ACCOUNT` (400) |
| D6 | `!account` | `ACCOUNT_NOT_FOUND` (404) |
| D7 | `assertBelongsTo` falla | `FORBIDDEN` (403) |
| D8 | `!account.isOperational()` | `ACCOUNT_NOT_OPERATIONAL` (400) |
| D9 | `fromPocket.amount < amount` | `INSUFFICIENT_POCKET_BALANCE` (400) |

**Estado inicial de la sección:** `ACC_A1` disponible $450.000, reservado $550.000
(`POC_VAC` = $300.000, `POC_EST` = $250.000).

> La transferencia entre bolsillos **no altera el saldo disponible de la cuenta**: solo
> mueve dinero entre dos reservas. El disponible debe seguir en $450.000 al terminar la
> sección.

### BE-TR-01 · Transferir sin autenticación

```http
POST /api/v1/pockets/transfer
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_EST}}", "amount": 10000 }
```

**Esperado:** `401` · `UNAUTHORIZED` · `"Se requiere autenticación"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-02 · Monto $0

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_EST}}", "amount": 0 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.amount` contiene
`"El monto de transferencia debe ser mayor que cero"`.

> El error **no** es `INVALID_TRANSFER_AMOUNT`: el schema (`z.number().gt(0)`) corta antes,
> dejando la rama D1 inalcanzable por HTTP (**H-02**).

**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-03 · Monto negativo

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_EST}}", "amount": -5000 }
```

**Esperado:** `400` · `VALIDATION_ERROR` con el mismo mensaje que BE-TR-02.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-04 · `fromPocketId` que no es UUID

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "abc123", "toPocketId": "{{POC_EST}}", "amount": 10000 }
```

**Esperado:** `400` · `VALIDATION_ERROR` · `error.fields.fromPocketId` contiene
`"fromPocketId debe ser un UUID válido"`.

> A diferencia de `PATCH`/`DELETE`, aquí los identificadores viajan en el cuerpo y **sí**
> pasan por Zod. La inconsistencia queda registrada como **H-03**.

**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-05 · Origen y destino iguales (decisión D2)

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_VAC}}", "amount": 10000 }
```

**Esperado:** `400` · `INVALID_TRANSFER_TARGET` ·
`"Los bolsillos de origen y destino deben ser diferentes"`.
**Estado posterior:** `POC_VAC` sigue en $300.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-06 · Bolsillo de origen inexistente (decisión D3)

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{UUID_FAKE}}", "toPocketId": "{{POC_EST}}", "amount": 10000 }
```

**Esperado:** `404` · `SOURCE_POCKET_NOT_FOUND` · `"Bolsillo de origen no encontrado"`.
**Estado posterior:** sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-07 · Bolsillo de destino inexistente (decisión D4)

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{UUID_FAKE}}", "amount": 10000 }
```

**Esperado:** `404` · `TARGET_POCKET_NOT_FOUND` · `"Bolsillo de destino no encontrado"`.
**Estado posterior:** `POC_VAC` sigue en $300.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-08 · Bolsillos de cuentas distintas (decisión D5)

**Objetivo:** ambos bolsillos son del mismo usuario, pero de cuentas diferentes.

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_OTRA}}", "amount": 10000 }
```

**Esperado:** `400` · `POCKETS_DIFFERENT_ACCOUNT` ·
`"Los bolsillos deben pertenecer a la misma cuenta"`.
**Estado posterior:** `POC_VAC` en $300.000 y `POC_OTRA` en $50.000, sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-09 · Bolsillos de otro usuario (decisión D7)

**Objetivo:** ambos bolsillos existen y son de la misma cuenta, pero esa cuenta es del
usuario B.

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_AJE1}}", "toPocketId": "{{POC_AJE2}}", "amount": 10000 }
```

**Esperado:** `403` · `FORBIDDEN` · `"No tienes permiso para acceder a esta cuenta"`.
**Estado posterior:** `POC_AJE1` en $30.000 y `POC_AJE2` en $20.000, sin cambios.
Verificar con `GET /api/v1/pockets/account/{{ACC_B}}` usando `TOKEN_B`.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-10 · Cuenta bloqueada (decisión D8)

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_BLQ1}}", "toPocketId": "{{POC_BLQ2}}", "amount": 5000 }
```

**Esperado:** `400` · `ACCOUNT_NOT_OPERATIONAL` ·
`"La cuenta no está disponible para transferir entre bolsillos"`.
**Estado posterior:** `ACC_A3` sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-11 · Monto superior al del bolsillo origen (decisión D9, valor límite)

**Precondición:** `POC_VAC` = $300.000.

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_EST}}", "amount": 300001 }
```

**Esperado:** `400` · `INSUFFICIENT_POCKET_BALANCE` ·
`"Saldo insuficiente en el bolsillo de origen"`.
**Estado posterior:** `POC_VAC` = $300.000 y `POC_EST` = $250.000, sin cambios.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-12 · Transferencia válida (camino principal)

**Precondición:** `POC_VAC` = $300.000, `POC_EST` = $250.000, disponible $450.000.

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_EST}}", "amount": 100000 }
```

**Esperado:** `200` · `"Transferencia entre bolsillos realizada"` ·
`data.fromPocket.amount = 200000` · `data.toPocket.amount = 350000`.

**Verificaciones adicionales:**

1. `GET /api/v1/accounts/{{ACC_A1}}` → `balance` debe seguir en `450000` (la transferencia
   no toca el disponible).
2. `GET /api/v1/notifications` con `TOKEN_A` → debe existir una notificación
   `"Movimiento entre bolsillos"`.

**Estado posterior:** `POC_VAC` = $200.000, `POC_EST` = $350.000, disponible $450.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-TR-13 · Transferir el saldo completo del origen (valor límite)

**Objetivo:** límite exacto de la decisión D9 — la condición es `<` estricto, así que
transferir el total debe aceptarse y dejar el origen en $0.
**Precondición:** `POC_VAC` = $200.000, `POC_EST` = $350.000.

```http
POST /api/v1/pockets/transfer
Authorization: Bearer {{TOKEN_A}}
Content-Type: application/json

{ "fromPocketId": "{{POC_VAC}}", "toPocketId": "{{POC_EST}}", "amount": 200000 }
```

**Esperado:** `200` · `data.fromPocket.amount = 0` · `data.toPocket.amount = 550000`.

**Estado posterior:** `POC_VAC` = $0, `POC_EST` = $550.000, disponible $450.000,
reservado $550.000, total $1.000.000.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

---

## 10. Consultar bolsillos — `GET /api/v1/pockets/account/:accountId`

Decisiones del código bajo prueba (`GetAccountPockets.execute`):

| # | Decisión | Error si se cumple |
| --- | --- | --- |
| D1 | `!account` | `ACCOUNT_NOT_FOUND` (404) |
| D2 | `assertBelongsTo` falla | `FORBIDDEN` (403) |

### BE-CO-01 · Consultar sin autenticación

```http
GET /api/v1/pockets/account/{{ACC_A1}}
```

**Esperado:** `401` · `UNAUTHORIZED` · `"Se requiere autenticación"`.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CO-02 · Cuenta inexistente (decisión D1)

```http
GET /api/v1/pockets/account/{{UUID_FAKE}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `404` · `ACCOUNT_NOT_FOUND` · `"Cuenta no encontrada"`.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CO-03 · Cuenta de otro usuario (decisión D2)

**Objetivo:** verificar que no hay fuga de información entre usuarios.

```http
GET /api/v1/pockets/account/{{ACC_B}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `403` · `FORBIDDEN` · `"No tienes permiso para acceder a esta cuenta"`.
El cuerpo **no** debe contener ningún bolsillo del usuario B.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CO-04 · Cuenta con bolsillos (camino principal)

**Precondición:** `ACC_A1` con `POC_VAC` = $0 y `POC_EST` = $550.000.

```http
GET /api/v1/pockets/account/{{ACC_A1}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `200` · `"Bolsillos obtenidos"` · `data` es un arreglo de **2** elementos:

| `name` | `amount` |
| --- | ---: |
| `Vacaciones 2026` | 0 |
| `Estudio Posgrado` | 550000 |

Cada elemento debe traer `id`, `accountId`, `name`, `amount`, `createdAt`, `updatedAt` — y
**ningún** campo adicional.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CO-05 · Cuenta sin bolsillos

**Objetivo:** el arreglo vacío es una respuesta válida, no un 404.
**Precondición:** `ACC_A4` sin depósito ni bolsillos.

```http
GET /api/v1/pockets/account/{{ACC_A4}}
Authorization: Bearer {{TOKEN_A}}
```

**Esperado:** `200` · `"Bolsillos obtenidos"` · `data` es un arreglo vacío `[]`.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

### BE-CO-06 · Invariante de saldo tras toda la secuencia

**Objetivo:** comprobar la integridad de los datos después de crear, actualizar, eliminar y
transferir: la suma de los bolsillos más el saldo disponible debe seguir siendo exactamente
lo depositado.

**Pasos:**

1. `GET /api/v1/accounts/{{ACC_A1}}` con `TOKEN_A` → anotar `data.balance`.
2. `GET /api/v1/pockets/account/{{ACC_A1}}` con `TOKEN_A` → sumar los `amount`.
3. Calcular `balance + suma`.

**Esperado:** `balance = 450000`, suma de bolsillos `= 550000`, total `= 1000000`, igual al
depósito de SETUP-05. Repetir para `ACC_A2`: `150000 + 50000 = 200000`.

| Resultado obtenido | Estado |
| --- | --- |
| | ☐ Aprobado ☐ Fallido ☐ Bloqueado |

---

## 11. Limpieza posterior

Los datos quedan en la base real. Para dejarla como estaba, desde el **Table editor** de
Supabase, y en este orden:

1. Tabla `pockets` — borrar las filas cuyo `account_id` sea `ACC_A1`, `ACC_A2`, `ACC_A3`
   o `ACC_B`.
2. Tabla `notifications` — borrar las filas de los dos usuarios de prueba.
3. Tabla `transactions` — borrar los depósitos de SETUP-05.
4. Tabla `account_details` y luego `accounts` — borrar las cinco cuentas creadas.
5. Tabla `users` — borrar `qa.bolsillos.a@fubank.com` y `qa.bolsillos.b@fubank.com`.

Alternativa: dejar los usuarios de prueba y reutilizarlos en la siguiente corrida,
borrando solo bolsillos y cuentas.

---

## 12. Resumen de ejecución

Llenar al terminar la corrida.

| Funcionalidad | Casos | Aprobados | Fallidos | Bloqueados |
| --- | ---: | ---: | ---: | ---: |
| Crear bolsillo | 13 | | | |
| Actualizar bolsillo | 14 | | | |
| Eliminar bolsillo | 8 | | | |
| Transferir entre bolsillos | 13 | | | |
| Consultar bolsillos | 6 | | | |
| **Total** | **54** | | | |

---

## 13. Hallazgos conocidos

Detectados al diseñar los casos a partir del código. Ninguno se corrigió en esta entrega:
el alcance acordado era corregir las pruebas, no el código de producción.

### H-01 · El saldo reservado se cuenta dos veces al crear un bolsillo

- **Severidad:** Alta — impide usar el producto con normalidad.
- **Caso que lo evidencia:** BE-CR-13.
- **Ubicación:** `backend/src/application/use-cases/pocket/CreatePocket.ts`.
- **Descripción:** la decisión es `currentReserved + dto.amount > account.balance`, pero
  `account.balance` ya es el saldo **disponible**: lo reservado se descontó al crear los
  bolsillos anteriores. La comparación suma el reservado a un valor que ya lo excluye, así
  que se rechazan bolsillos que sí caben. En cuanto lo reservado supera lo disponible, no
  se puede crear ningún bolsillo nuevo, ni siquiera de $1.
- **Comparación:** `UpdatePocket` resuelve el mismo problema correctamente comparando
  contra `account.balance + totalReserved`, es decir, contra el total de fondos. Las dos
  operaciones aplican reglas distintas al mismo invariante.

### H-02 · Cuatro ramas de error del dominio son inalcanzables por HTTP

- **Severidad:** Media — código muerto y validación duplicada.
- **Casos que lo evidencian:** BE-CR-03, BE-AC-02, BE-AC-03, BE-TR-02.
- **Descripción:** los schemas Zod validan las mismas condiciones que los casos de uso, y
  siempre disparan primero. Estas ramas nunca se ejecutan a través de la API:

| Rama del caso de uso | Bloqueada por |
| --- | --- |
| `CreatePocket` → `INVALID_POCKET_AMOUNT` | `createPocketSchema.amount.min(0)` |
| `UpdatePocket` → `INVALID_POCKET_AMOUNT` | `updatePocketSchema.amount.min(0)` |
| `UpdatePocket` → `NO_CHANGES_PROVIDED` | `updatePocketSchema.refine(...)` |
| `TransferPocketBalance` → `INVALID_TRANSFER_AMOUNT` | `transferPocketSchema.amount.gt(0)` |

  La consecuencia práctica es que el cliente recibe `VALIDATION_ERROR` donde el diseño del
  dominio anunciaba un código específico. La única excepción es
  `UpdatePocket → INVALID_POCKET_NAME`, alcanzable con un nombre de solo espacios
  (BE-AC-04), porque Zod valida longitud pero no contenido.

### H-03 · Validación de identificadores inconsistente entre endpoints

- **Severidad:** Baja.
- **Casos que lo evidencian:** BE-AC-06, BE-EL-03, BE-TR-04.
- **Descripción:** `POST /pockets` y `POST /pockets/transfer` validan los UUID con Zod y
  responden `400 VALIDATION_ERROR` ante un identificador malformado. `PATCH /pockets/:id`,
  `DELETE /pockets/:id` y `GET /pockets/account/:id` toman el identificador de la ruta, no
  lo validan, y responden `404` porque el repositorio convierte el error de Supabase en
  `null`. La misma clase de entrada inválida produce dos códigos distintos.

### H-04 · No hay forma de bloquear una cuenta desde la API

- **Severidad:** Baja (limitación de testabilidad).
- **Casos afectados:** BE-CR-08, BE-AC-08, BE-EL-05, BE-TR-10.
- **Descripción:** la entidad `Account` expone `block()` y `close()`, y los cuatro casos de
  uso del módulo comprueban `isOperational()`, pero ninguna ruta permite cambiar el estado
  de una cuenta. Los caminos `ACCOUNT_NOT_OPERATIONAL` solo se pueden probar editando la
  columna `status` a mano en Supabase (SETUP-07).

### H-05 · El repositorio de bolsillos tiene un modo de respaldo en memoria

- **Severidad:** Media — puede falsear los resultados de una corrida.
- **Ubicación:** `backend/src/infrastructure/repositories/SupabasePocketRepository.ts`.
- **Descripción:** si la tabla `pockets` no existe, el repositorio activa un
  `fallbackStore` en memoria a nivel de módulo y sigue operando. Con esa bandera activa,
  los datos no se persisten y se pierden al reiniciar el servidor, mientras la API sigue
  respondiendo `201` y `200`.
- **Implicación para esta suite:** antes de dar por válida una corrida, revisar la consola
  del backend. Si aparece
  `"Supabase pockets table is not available. Using in-memory fallback for pockets."`,
  **toda la corrida queda invalidada**: se estaría probando contra memoria, justo lo que
  estas pruebas buscan evitar. Verificar además, al terminar, que las filas existen en la
  tabla `pockets` de Supabase.

---

## 14. Trazabilidad — decisión del código ↔ caso de prueba

| Caso de uso | Decisión | Caso(s) | Alcanzable por HTTP |
| --- | --- | --- | --- |
| `CreatePocket` | `amount < 0` | BE-CR-03 | No (Zod) |
| `CreatePocket` | `!account` | BE-CR-06 | Sí |
| `CreatePocket` | `assertBelongsTo` | BE-CR-07 | Sí |
| `CreatePocket` | `!isOperational()` | BE-CR-08 | Solo con SETUP-07 |
| `CreatePocket` | `reserved + amount > balance` (V) | BE-CR-09, BE-CR-13 | Sí |
| `CreatePocket` | `reserved + amount > balance` (F) | BE-CR-10, BE-CR-11, BE-CR-12 | Sí |
| `UpdatePocket` | `!name.trim()` | BE-AC-04 | Sí |
| `UpdatePocket` | `amount < 0` | BE-AC-03 | No (Zod) |
| `UpdatePocket` | `!pocket` | BE-AC-05, BE-AC-06 | Sí |
| `UpdatePocket` | `assertBelongsTo` | BE-AC-07 | Sí |
| `UpdatePocket` | `!isOperational()` | BE-AC-08 | Solo con SETUP-07 |
| `UpdatePocket` | límite de reserva (V) | BE-AC-11 | Sí |
| `UpdatePocket` | límite de reserva (F) | BE-AC-09, BE-AC-10, BE-AC-12 | Sí |
| `UpdatePocket` | solo `name` | BE-AC-13 | Sí |
| `UpdatePocket` | `name` + `amount` | BE-AC-14 | Sí |
| `UpdatePocket` | `NO_CHANGES_PROVIDED` | BE-AC-02 | No (Zod) |
| `DeletePocket` | `!pocket` | BE-EL-02, BE-EL-03, BE-EL-07 | Sí |
| `DeletePocket` | `assertBelongsTo` | BE-EL-04 | Sí |
| `DeletePocket` | `!isOperational()` | BE-EL-05 | Solo con SETUP-07 |
| `DeletePocket` | camino principal | BE-EL-06, BE-EL-08 | Sí |
| `TransferPocketBalance` | `amount <= 0` | BE-TR-02, BE-TR-03 | No (Zod) |
| `TransferPocketBalance` | `from === to` | BE-TR-05 | Sí |
| `TransferPocketBalance` | `!fromPocket` | BE-TR-06 | Sí |
| `TransferPocketBalance` | `!toPocket` | BE-TR-07 | Sí |
| `TransferPocketBalance` | cuentas distintas | BE-TR-08 | Sí |
| `TransferPocketBalance` | `assertBelongsTo` | BE-TR-09 | Sí |
| `TransferPocketBalance` | `!isOperational()` | BE-TR-10 | Solo con SETUP-07 |
| `TransferPocketBalance` | `fromPocket.amount < amount` | BE-TR-11 | Sí |
| `TransferPocketBalance` | camino principal | BE-TR-12, BE-TR-13 | Sí |
| `GetAccountPockets` | `!account` | BE-CO-02 | Sí |
| `GetAccountPockets` | `assertBelongsTo` | BE-CO-03 | Sí |
| `GetAccountPockets` | camino principal | BE-CO-04, BE-CO-05 | Sí |
| `authMiddleware` | sin token | BE-CR-01, BE-AC-01, BE-EL-01, BE-TR-01, BE-CO-01 | Sí |
| Integridad de datos | invariante de saldo | BE-CO-06 | Sí |
