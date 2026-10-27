# Plan de pruebas E2E - Bolsillos y Depositar (FuBanking)

## Application Overview

Plan de 12 escenarios (6 funcionalidades x 2: camino feliz y camino de error/validacion) para la web de FuBanking (Next.js en http://localhost:3000, backend real en http://localhost:3001/api/v1): Crear, Consultar, Editar, Eliminar y Transferir bolsillos (pantalla /pockets) y Depositar dinero (pantalla /accounts).

NOTA DE PROCESO (leer primero): la exploracion en vivo con el navegador NO fue posible. `planner_setup_page` fallo en dos intentos porque falta el Chromium que pide el servidor MCP (requerido `chromium-1248`; instalado `chromium-1243`). Arreglo: `npx playwright install chromium` y volver a correr el planner. Las etiquetas, toasts, ids, data-testid y reglas de negocio de este plan se tomaron del CODIGO FUENTE (frontend/src/features/pockets/components/PocketsClient.tsx, features/pockets/handlers/pocket.handlers.ts, features/account/components/{AccountCard,AccountList,DepositWithdrawModal}.tsx, shared/components/feedback/ToastProvider.tsx, backend/src/application/use-cases/{pocket,account}/*) y se contrastaron con los selectores de la suite Serenity/JS (e2e/serenity/test/ui/*.ts), que ya corre contra la UI real. Antes de generar los tests, el generator debe confirmar en vivo cada texto marcado como [verificar] y los formatos de monto.

ESTADO INICIAL COMUN (fixture tests/fixtures.ts, aplica a TODOS los escenarios): clienta nueva (Ana Agentes) con UNA cuenta de ahorros ACTIVA con saldo 500.000 COP y SIN bolsillos, sesion real inyectada (cookie `token` + localStorage `token`/`user`), navegador con locale es-CO, ya posicionado en /pockets con `#account-select` cargado. Cada test es independiente (cliente nuevo).

ORACULO EN BACKEND (fixture `client.api`): tras cada accion de UI que cambie datos, verificar el estado real con `await client.api.balance()` (saldo disponible de la cuenta, numero) y `await client.api.pockets()` (arreglo `{id,name,amount}` de la cuenta). No basta con mirar la pantalla: el saldo y los montos de bolsillo del backend son la fuente de verdad. Para precondiciones con bolsillos usar `await client.api.createPocket(nombre, monto)` y despues `await page.reload()` (la pagina ya cargo antes de que existieran) y esperar `#account-select` con valor no vacio.

REGLA DE NEGOCIO CLAVE: el saldo de la cuenta es el saldo DISPONIBLE. Crear un bolsillo de X descuenta X del saldo; editar su monto ajusta el saldo por la diferencia; eliminarlo devuelve su monto al saldo; transferir entre bolsillos NO cambia el saldo de la cuenta; depositar suma al saldo. Con saldo 500.000: bolsillo de 100.000 -> saldo 400.000.

HECHOS DE UI QUE EL GENERATOR DEBE CONOCER
1. Toasts: contenedor `aria-live=polite`; titulo en `data-testid="toast-title"`; la descripcion es un <p> sin testid (usar getByText). Duracion fija de 4000 ms y maximo 4 toasts apilados: asertar el toast justo despues de la accion con `expect(page.getByTestId('toast-title').filter({hasText:'...'})).toBeVisible()`. Boton de cierre con aria-label "Cerrar notificacion" (sin tilde).
2. Titulos exactos de toast (con y sin tilde tal cual): "Bolsillo creado", "Falta informacion" (en codigo lleva tilde: "Falta información"), "No fue posible crear el bolsillo", "Bolsillo actualizado", "Nombre inválido", "No fue posible actualizar el bolsillo", "Bolsillo eliminado", "No fue posible eliminar el bolsillo", "Transferencia realizada", "No fue posible transferir el saldo", "No fue posible cargar los bolsillos", y en Depositar "Deposito realizado" (SIN tilde en el codigo).
3. Formato de montos: en /pockets las tarjetas muestran `$ ` + `toLocaleString()` del navegador (con locale es-CO: "$ 100.000", espacio normal) en `data-testid="pocket-card-amount"`; las opciones de los selects son "<nombre> · $ <monto>" (ej. "Vacaciones · $ 100.000"). En /accounts el saldo (`data-testid="account-balance"`) usa Intl.NumberFormat('es-CO', COP, 0 decimales): "$ 500.000" con ESPACIO NO ROTO (U+00A0) tras el $. Asertar con regex tolerante: /\$\s*500\.000/ (\s cubre U+00A0) o extraer digitos con replace(/[^\d-]/g,''). Usar montos de 5 digitos o mas: con es-CO un monto de 4 digitos puede mostrarse sin separador ("1000").
4. Localizadores recomendados: /pockets -> `#account-select`, `#pocket-name` (label "Nombre del bolsillo"), `#pocket-amount` ("Monto inicial"), `data-testid=create-pocket-button` (texto "Crear bolsillo"), `#from-pocket-select` ("Bolsillo origen"), `#to-pocket-select` ("Bolsillo destino"), `#transfer-amount` (label "Monto"), `data-testid=transfer-pockets-button` ("Transferir"), `data-testid=pockets-empty`, tarjetas `data-testid=pocket-card` con `pocket-card-name`, `pocket-card-amount`, `edit-pocket-button` ("Editar"), `delete-pocket-button` ("Eliminar"); edicion inline `#edit-pocket-name` (label "Nombre"), `#edit-pocket-amount` (label "Monto"), `data-testid=save-pocket-button` ("Guardar") y boton "Cancelar"; dialogo `role=dialog` con titulo h3 "Eliminar bolsillo" y `data-testid=confirm-delete-pocket-button` ("Sí, eliminar"). /accounts -> `data-testid=account-card`, `account-balance`, `deposit-button` ("Abonar"), modal `role=dialog` "Agregar Dinero (Depósito)", `#dw-amount` (label "Monto a ingresar (COP)"), `#dw-description`, `data-testid=dw-submit` ("Abonar Saldo"), `data-testid=dw-error`.
5. Ambiguedad de etiquetas: "Monto" aparece en el formulario de transferir y (en edicion) en la tarjeta; "Nombre" es prefijo de "Nombre del bolsillo". Usar los ids de arriba o getByLabel(..., {exact:true}). El boton "Abonar" es prefijo de "Abonar Saldo" y "Eliminar" lo es de "Sí, eliminar": usar getByRole('button',{name:'Abonar',exact:true}) y {name:'Eliminar',exact:true}.
6. El orden de las tarjetas no es estable (recien creado va primero en pantalla; tras recargar depende del backend). Localizar tarjetas por nombre (`pocket-card` filtrada por hasText) y no asertar posiciones. Los <option> de los selects tienen value = id del bolsillo (se puede obtener de `client.api.pockets()`); se puede seleccionar por label.
7. Tras una transferencia exitosa el formulario NO se limpia (selects y monto conservan sus valores); tras crear si se limpian nombre y monto; tras un error ningun campo se limpia.
8. Los errores de validacion del backend (zod) llegan a la UI con descripcion generica "Error de validación" (no el detalle del campo).
9. Entrada vacia en un <input type=number required> la bloquea el navegador (sin mensaje propio de la app); para probar la validacion propia del deposito usar 0 o un negativo, nunca vacio.
10. Hallazgo de codigo a confirmar (NO es un escenario del plan): CreatePocket compara `reservado + monto > saldo` contra un saldo que ya viene descontado, por lo que un 2o/3er bolsillo puede rechazarse con "No tienes saldo disponible suficiente para crear este bolsillo" aunque haya fondos (ej. reservado 300.000, saldo 200.000, nuevo 100.000 -> rechazado). Por eso las precondiciones de este plan crean como maximo dos bolsillos (100.000 y 50.000), que SI se aceptan. Tambien: si la tabla `pockets` no existe en Supabase el repositorio degrada a un Map en memoria; el oraculo `client.api.pockets()` funciona igual.

## Test Scenarios

### 1. 1. Crear bolsillo

**Seed:** `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts`

#### 1.1. CRE-01 Crear un bolsillo con nombre y monto validos descuenta el saldo de la cuenta

**File:** `tests/crear-bolsillo.spec.ts`

**Steps:**
  1. Estado inicial (fixture): clienta nueva en /pockets, saldo 500.000, sin bolsillos. Verificar el punto de partida con el oraculo.
    - expect: El heading 'Bolsillos de Ahorro' es visible, igual que las tarjetas 'Nuevo bolsillo', 'Transferir entre bolsillos' y 'Bolsillos actuales'.
    - expect: `data-testid=pockets-empty` es visible con el texto 'No hay bolsillos para esta cuenta aún.' y no hay ninguna `pocket-card`.
    - expect: `await client.api.balance()` = 500000 y `await client.api.pockets()` = [].
  2. Escribir 'Vacaciones' en el campo 'Nombre del bolsillo' (#pocket-name, placeholder 'Vacaciones') y '100000' en 'Monto inicial' (#pocket-amount, placeholder '0').
    - expect: Ambos campos muestran los valores escritos; el boton 'Crear bolsillo' esta habilitado.
  3. Hacer clic en el boton 'Crear bolsillo' (data-testid=create-pocket-button).
    - expect: Aparece un toast de exito con titulo 'Bolsillo creado' y descripcion 'Tu ahorro quedó organizado correctamente.' (desaparece a los ~4 s; asertarlo de inmediato).
    - expect: Los campos 'Nombre del bolsillo' y 'Monto inicial' quedan vacios.
  4. Observar la lista 'Bolsillos actuales'.
    - expect: `pockets-empty` ya no existe; hay exactamente 1 `pocket-card` con nombre 'Vacaciones' y monto '$ 100.000'.
    - expect: Las listas 'Bolsillo origen' y 'Bolsillo destino' incluyen la opcion 'Vacaciones · $ 100.000'.
  5. Verificar en backend con el oraculo y, opcionalmente, en /accounts.
    - expect: `await client.api.pockets()` devuelve exactamente un bolsillo {name:'Vacaciones', amount:100000}.
    - expect: `await client.api.balance()` = 400000 (500000 - 100000).
    - expect: Opcional: en /accounts el saldo de la tarjeta coincide con /\$\s*400\.000/.

#### 1.2. CRE-02 Crear bolsillo sin nombre o con monto superior al saldo es rechazado y no cambia el saldo

**File:** `tests/crear-bolsillo.spec.ts`

**Steps:**
  1. Estado inicial (fixture): saldo 500.000, sin bolsillos, en /pockets. Dejar 'Nombre del bolsillo' vacio y escribir '50000' en 'Monto inicial'.
    - expect: El campo nombre esta vacio y el monto muestra 50000.
  2. Hacer clic en 'Crear bolsillo'.
    - expect: Aparece un toast de advertencia con titulo 'Falta información' y descripcion 'Selecciona una cuenta y escribe el nombre del bolsillo.'.
    - expect: No se crea ninguna tarjeta: `pockets-empty` sigue visible.
  3. Variante de espacios: escribir '   ' (solo espacios) en 'Nombre del bolsillo' y volver a hacer clic en 'Crear bolsillo'.
    - expect: Se muestra de nuevo el toast 'Falta información' (el nombre se recorta con trim y cuenta como vacio); sigue sin haber tarjetas.
  4. Escribir 'Casa propia' en 'Nombre del bolsillo' y '600000' en 'Monto inicial' (mayor que el saldo de 500.000) y hacer clic en 'Crear bolsillo'.
    - expect: Aparece un toast de error con titulo 'No fue posible crear el bolsillo' y descripcion 'No tienes saldo disponible suficiente para crear este bolsillo'.
    - expect: Los campos conservan 'Casa propia' y '600000' (no se limpian en caso de error); no aparece ninguna tarjeta.
  5. Verificar en backend con el oraculo.
    - expect: `await client.api.pockets()` = [] (no se creo nada).
    - expect: `await client.api.balance()` = 500000 (saldo intacto).

### 2. 2. Consultar bolsillos

**Seed:** `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts`

#### 2.1. CON-01 La lista 'Bolsillos actuales' muestra los bolsillos existentes con sus montos

**File:** `tests/consultar-bolsillos.spec.ts`

**Steps:**
  1. Estado inicial: fixture (saldo 500.000, sin bolsillos). Precondicion por API: `const id1 = await client.api.createPocket('Vacaciones', 100000)` y luego `const id2 = await client.api.createPocket('Emergencias', 50000)` (en ese orden). Recargar con `page.reload()` y esperar a que `#account-select` tenga valor.
    - expect: `await client.api.pockets()` contiene Vacaciones=100000 y Emergencias=50000 y `await client.api.balance()` = 350000.
  2. Leer la tarjeta 'Bolsillos actuales'.
    - expect: Hay exactamente 2 `pocket-card`; `pockets-empty` no esta en el DOM.
    - expect: Una tarjeta tiene nombre 'Vacaciones' y monto '$ 100.000'; la otra 'Emergencias' y '$ 50.000' (no asertar el orden).
    - expect: Cada tarjeta muestra los botones 'Editar' y 'Eliminar' y, en texto pequeño, el id del bolsillo (igual al devuelto por `client.api.pockets()`).
  3. Abrir/inspeccionar los selects 'Bolsillo origen' y 'Bolsillo destino'.
    - expect: Cada select tiene 3 opciones: 'Selecciona un bolsillo', 'Vacaciones · $ 100.000' y 'Emergencias · $ 50.000'.
  4. Inspeccionar el selector 'Cuenta' (#account-select).
    - expect: Tiene una sola opcion con formato '<numero de cuenta> · AHORROS' (tipo en bruto, sin traducir) y es la seleccionada.
  5. Navegar a /accounts y leer el saldo de la tarjeta de cuenta.
    - expect: La tarjeta 'Cuenta de Ahorros' muestra 'Saldo disponible' con valor que coincide con /\$\s*350\.000/ (500.000 menos 150.000 reservados), consistente con `client.api.balance()` = 350000.

#### 2.2. CON-02 Cuenta sin bolsillos muestra estado vacio y una falla de la API al cargar muestra un error

**File:** `tests/consultar-bolsillos.spec.ts`

**Steps:**
  1. Estado inicial (fixture, sin precondiciones): saldo 500.000 y sin bolsillos, en /pockets.
    - expect: `pockets-empty` es visible con el texto 'No hay bolsillos para esta cuenta aún.'; no hay `pocket-card`.
    - expect: Los selects 'Bolsillo origen' y 'Bolsillo destino' solo tienen la opcion 'Selecciona un bolsillo'.
    - expect: No aparece ningun toast de error al cargar; `await client.api.pockets()` = [].
  2. Inyeccion de fallo (el backend real no se puede romper a demanda): antes de recargar, registrar `await page.route('**/pockets/account/**', route => route.fulfill({status:500, contentType:'application/json', body: JSON.stringify({success:false, message:'Ha ocurrido un error interno', error:{code:'INTERNAL_ERROR', message:'Ha ocurrido un error interno'}})}))` y ejecutar `page.reload()`.
    - expect: Aparece un toast de error con titulo 'No fue posible cargar los bolsillos' y descripcion 'Ha ocurrido un error interno'.
    - expect: La seccion 'Bolsillos actuales' sigue mostrando el estado vacio (`pockets-empty`) y la pagina no se rompe (los formularios 'Nuevo bolsillo' y 'Transferir entre bolsillos' siguen visibles).
  3. Quitar la ruta interceptada (`page.unroute`) y recargar de nuevo.
    - expect: La carga vuelve a funcionar: sin toast de error y estado vacio normal.
    - expect: Backend sin cambios: `await client.api.balance()` = 500000 y `await client.api.pockets()` = [].

### 3. 3. Editar bolsillo

**Seed:** `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts`

#### 3.1. EDI-01 Editar nombre y monto de un bolsillo actualiza la tarjeta y ajusta el saldo

**File:** `tests/editar-bolsillo.spec.ts`

**Steps:**
  1. Estado inicial: fixture + precondicion por API `await client.api.createPocket('Vacaciones', 100000)`; recargar /pockets.
    - expect: Hay 1 tarjeta 'Vacaciones' con '$ 100.000'. `await client.api.balance()` = 400000.
  2. En la tarjeta 'Vacaciones' hacer clic en el boton 'Editar'.
    - expect: La tarjeta pasa a modo edicion: aparecen los campos 'Nombre' (#edit-pocket-name, valor 'Vacaciones') y 'Monto' (#edit-pocket-amount, valor '100000') y los botones 'Guardar' y 'Cancelar'.
    - expect: Los botones 'Editar' y 'Eliminar' de esa tarjeta ya no se muestran.
  3. Reemplazar el nombre por 'Viaje a Cartagena' y el monto por '150000' y hacer clic en 'Guardar' (data-testid=save-pocket-button).
    - expect: Toast de exito con titulo 'Bolsillo actualizado' y descripcion 'Los cambios quedaron guardados.'.
    - expect: El modo edicion se cierra y vuelven los botones 'Editar'/'Eliminar'.
  4. Leer la tarjeta actualizada.
    - expect: La tarjeta muestra el nombre 'Viaje a Cartagena' y el monto '$ 150.000'; ya no existe una tarjeta con el nombre 'Vacaciones'; sigue habiendo una sola tarjeta.
  5. Verificar en backend con el oraculo.
    - expect: `await client.api.pockets()` = [{name:'Viaje a Cartagena', amount:150000}] (mismo id que antes).
    - expect: `await client.api.balance()` = 350000 (el aumento de 50.000 en el bolsillo se descuenta de la cuenta: 400000 - 50000).

#### 3.2. EDI-02 Editar con nombre vacio o con un monto mayor al disponible es rechazado sin modificar nada

**File:** `tests/editar-bolsillo.spec.ts`

**Steps:**
  1. Estado inicial: fixture + precondicion por API `await client.api.createPocket('Vacaciones', 100000)`; recargar /pockets y hacer clic en 'Editar' de la tarjeta 'Vacaciones'.
    - expect: El formulario de edicion esta abierto con 'Vacaciones' y '100000'. `await client.api.balance()` = 400000.
  2. Borrar por completo el campo 'Nombre' (#edit-pocket-name) y hacer clic en 'Guardar'.
    - expect: Toast de advertencia con titulo 'Nombre inválido' y descripcion 'El nombre del bolsillo no puede quedar vacío.'.
    - expect: El modo edicion permanece abierto (siguen visibles 'Guardar' y 'Cancelar').
  3. Escribir de nuevo 'Vacaciones' en 'Nombre', poner '700000' en 'Monto' (mayor que el disponible: saldo 400.000 + 100.000 del propio bolsillo = 500.000) y hacer clic en 'Guardar'.
    - expect: Toast de error con titulo 'No fue posible actualizar el bolsillo' y descripcion 'No tienes saldo disponible suficiente para ajustar este bolsillo'.
    - expect: El modo edicion permanece abierto.
  4. Hacer clic en 'Cancelar'.
    - expect: El modo edicion se cierra y la tarjeta sigue mostrando 'Vacaciones' y '$ 100.000' (los valores escritos se descartan).
  5. Verificar en backend con el oraculo.
    - expect: `await client.api.pockets()` = [{name:'Vacaciones', amount:100000}] sin cambios.
    - expect: `await client.api.balance()` = 400000 sin cambios.

### 4. 4. Eliminar bolsillo

**Seed:** `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts`

#### 4.1. ELI-01 Eliminar un bolsillo confirmando el dialogo devuelve su saldo a la cuenta

**File:** `tests/eliminar-bolsillo.spec.ts`

**Steps:**
  1. Estado inicial: fixture + precondicion por API `await client.api.createPocket('Vacaciones', 100000)`; recargar /pockets.
    - expect: Hay 1 tarjeta 'Vacaciones' con '$ 100.000'. `await client.api.balance()` = 400000.
  2. En la tarjeta 'Vacaciones' hacer clic en el boton 'Eliminar' (nombre exacto 'Eliminar').
    - expect: Se abre un dialogo modal (role=dialog) con el titulo 'Eliminar bolsillo', el texto 'Esta acción devolverá el saldo a tu cuenta.', '¿Deseas eliminar' y el nombre 'Vacaciones?'.
    - expect: El dialogo tiene los botones 'Cancelar' y 'Sí, eliminar' (data-testid=confirm-delete-pocket-button).
    - expect: Aun no se elimino nada: `await client.api.pockets()` sigue teniendo 1 bolsillo.
  3. Hacer clic en 'Sí, eliminar'.
    - expect: Toast de exito con titulo 'Bolsillo eliminado' y descripcion 'El saldo volvió a la cuenta correctamente.'.
    - expect: El dialogo se cierra, la tarjeta 'Vacaciones' desaparece y se muestra `pockets-empty` ('No hay bolsillos para esta cuenta aún.').
  4. Verificar en backend con el oraculo y en /accounts.
    - expect: `await client.api.pockets()` = [].
    - expect: `await client.api.balance()` = 500000 (se devolvieron los 100.000).
    - expect: En /accounts el saldo coincide con /\$\s*500\.000/.

#### 4.2. ELI-02 Cancelar la confirmacion no elimina y eliminar un bolsillo ya borrado muestra un error

**File:** `tests/eliminar-bolsillo.spec.ts`

**Steps:**
  1. Estado inicial: fixture + precondicion por API `const id = await client.api.createPocket('Vacaciones', 100000)`; recargar /pockets. Hacer clic en 'Eliminar' de la tarjeta 'Vacaciones' y esperar el dialogo 'Eliminar bolsillo'.
    - expect: El dialogo es visible con el nombre 'Vacaciones?'.
  2. Hacer clic en 'Cancelar' del dialogo.
    - expect: El dialogo se cierra; la tarjeta 'Vacaciones' sigue visible con '$ 100.000'; no aparece ningun toast 'Bolsillo eliminado'.
    - expect: Oraculo: `await client.api.pockets()` sigue teniendo 1 bolsillo y `await client.api.balance()` = 400000.
  3. Simular un borrado concurrente (pantalla desactualizada): con el fixture `request` y `client.token` ejecutar DELETE `${E2E_API_URL ?? 'http://localhost:3001/api/v1'}/pockets/${id}` con cabecera `Authorization: Bearer <client.token>` (espera status 200). Sin recargar la pagina, hacer clic de nuevo en 'Eliminar' de la tarjeta 'Vacaciones' (sigue en pantalla) y luego en 'Sí, eliminar'.
    - expect: Toast de error con titulo 'No fue posible eliminar el bolsillo' y descripcion 'Bolsillo no encontrado'.
    - expect: El dialogo se cierra (siempre se cierra al terminar la peticion).
    - expect: No aparece el toast 'Bolsillo eliminado'.
  4. Verificar en backend con el oraculo.
    - expect: `await client.api.pockets()` = [] (lo borro la llamada directa).
    - expect: `await client.api.balance()` = 500000: el saldo se devolvio una sola vez, no se duplico por el segundo intento.

### 5. 5. Transferir entre bolsillos

**Seed:** `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts`

#### 5.1. TRA-01 Transferir un monto entre dos bolsillos mueve el saldo sin tocar la cuenta

**File:** `tests/transferir-entre-bolsillos.spec.ts`

**Steps:**
  1. Estado inicial: fixture + precondicion por API `await client.api.createPocket('Vacaciones', 100000)` y `await client.api.createPocket('Emergencias', 50000)`; recargar /pockets.
    - expect: Dos tarjetas: 'Vacaciones' '$ 100.000' y 'Emergencias' '$ 50.000'. `await client.api.balance()` = 350000.
  2. En 'Transferir entre bolsillos' elegir en 'Bolsillo origen' la opcion 'Vacaciones · $ 100.000', en 'Bolsillo destino' la opcion 'Emergencias · $ 50.000' y escribir '30000' en 'Monto' (#transfer-amount).
    - expect: Los selects muestran las opciones elegidas y el campo Monto muestra 30000.
  3. Hacer clic en el boton 'Transferir' (data-testid=transfer-pockets-button).
    - expect: Toast de exito con titulo 'Transferencia realizada' y descripcion 'Vacaciones → Emergencias' (nombres de origen y destino separados por una flecha).
    - expect: La lista se recarga: la tarjeta 'Vacaciones' muestra '$ 70.000' y 'Emergencias' muestra '$ 80.000'.
    - expect: Las opciones de los selects se actualizan a 'Vacaciones · $ 70.000' y 'Emergencias · $ 80.000'.
    - expect: El formulario no se limpia (los selects y el monto conservan sus valores); no asertar lo contrario.
  4. Verificar en backend con el oraculo.
    - expect: `await client.api.pockets()` = Vacaciones 70000 y Emergencias 80000 (suma constante de 150000).
    - expect: `await client.api.balance()` = 350000: la transferencia entre bolsillos no modifica el saldo de la cuenta.

#### 5.2. TRA-02 Transferir sin datos, mas de lo disponible o al mismo bolsillo es rechazado

**File:** `tests/transferir-entre-bolsillos.spec.ts`

**Steps:**
  1. Estado inicial: fixture + precondicion por API `await client.api.createPocket('Vacaciones', 100000)` y `await client.api.createPocket('Emergencias', 50000)`; recargar /pockets. Sin tocar ningun campo, hacer clic en 'Transferir'.
    - expect: Toast de advertencia con titulo 'Falta información' y descripcion 'Selecciona los bolsillos y un monto para transferir.'.
    - expect: Los montos de las tarjetas no cambian (Vacaciones '$ 100.000', Emergencias '$ 50.000').
  2. Elegir 'Emergencias · $ 50.000' como origen, 'Vacaciones · $ 100.000' como destino, escribir '80000' en 'Monto' (mayor que los 50.000 del origen) y hacer clic en 'Transferir'.
    - expect: Toast de error con titulo 'No fue posible transferir el saldo' y descripcion 'Saldo insuficiente en el bolsillo de origen'.
    - expect: Las tarjetas siguen mostrando '$ 100.000' (Vacaciones) y '$ 50.000' (Emergencias).
  3. Elegir 'Vacaciones' como origen Y como destino, escribir '10000' en 'Monto' y hacer clic en 'Transferir'.
    - expect: Toast de error con titulo 'No fue posible transferir el saldo' y descripcion 'Los bolsillos de origen y destino deben ser diferentes'.
  4. Verificar en backend con el oraculo.
    - expect: `await client.api.pockets()` = Vacaciones 100000 y Emergencias 50000 sin cambios.
    - expect: `await client.api.balance()` = 350000 sin cambios.

### 6. 6. Depositar dinero

**Seed:** `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts`

#### 6.1. DEP-01 Abonar un monto valido desde /accounts incrementa el saldo de la cuenta

**File:** `tests/depositar.spec.ts`

**Steps:**
  1. Estado inicial (fixture): saldo 500.000, sin bolsillos. Navegar a /accounts (`page.goto('/accounts')`).
    - expect: El heading 'Cuenta Digital' y la seccion 'Mis cuentas' con '1 cuenta' son visibles.
    - expect: Hay una sola `account-card`: 'Cuenta de Ahorros', numero enmascarado '****NNNN' (NNNN = ultimos 4 digitos, anotarlos), estado 'Activa', etiqueta 'Saldo disponible' y `account-balance` que coincide con /\$\s*500\.000/ (espacio no roto tras el $).
    - expect: `await client.api.balance()` = 500000.
  2. Hacer clic en el boton 'Abonar' (data-testid=deposit-button, nombre exacto 'Abonar') de la tarjeta.
    - expect: Se abre un modal (role=dialog) con titulo 'Agregar Dinero (Depósito)' y subtitulo 'Cuenta N° ****NNNN'.
    - expect: Contiene el campo 'Monto a ingresar (COP)' (#dw-amount, placeholder '0.00'), el campo opcional 'Descripción / Concepto (opcional)' (#dw-description, placeholder 'Abono en efectivo') y los botones 'Cancelar' y 'Abonar Saldo'.
  3. Escribir '150000' en 'Monto a ingresar (COP)' y 'Abono de prueba' en la descripcion; hacer clic en 'Abonar Saldo' (data-testid=dw-submit).
    - expect: Durante la peticion el boton puede mostrar 'Procesando...'.
    - expect: Aparece un toast de exito con titulo 'Deposito realizado' (sin tilde) y descripcion 'Cuenta ****NNNN actualizada correctamente.' con los mismos 4 digitos de la tarjeta.
    - expect: El modal se cierra.
  4. Esperar a que la lista de cuentas se refresque (aparece brevemente un esqueleto de carga) y leer el saldo de la tarjeta.
    - expect: `account-balance` coincide con /\$\s*650\.000/.
  5. Verificar en backend con el oraculo.
    - expect: `await client.api.balance()` = 650000 (500000 + 150000).

#### 6.2. DEP-02 Abonar con monto 0 (o negativo) muestra un error en linea y no cambia el saldo

**File:** `tests/depositar.spec.ts`

**Steps:**
  1. Estado inicial (fixture): saldo 500.000. Navegar a /accounts, hacer clic en 'Abonar' y esperar el modal 'Agregar Dinero (Depósito)'.
    - expect: El modal esta abierto y no hay mensaje de error (`dw-error` no existe).
  2. Escribir '0' en 'Monto a ingresar (COP)' y hacer clic en 'Abonar Saldo'.
    - expect: Dentro del modal aparece el error en linea (data-testid=dw-error) con el texto 'Por favor ingresa un monto válido mayor a cero.' (la app lo muestra sin pasar por el navegador porque '0' no esta vacio).
    - expect: El modal permanece abierto con el 0 escrito; NO aparece el toast 'Deposito realizado'.
  3. Reemplazar el monto por '-5000' y hacer clic en 'Abonar Saldo'.
    - expect: Se muestra el mismo error en linea 'Por favor ingresa un monto válido mayor a cero.'; el modal sigue abierto.
  4. Hacer clic en 'Cancelar' y revisar el saldo.
    - expect: El modal se cierra; `account-balance` sigue coincidiendo con /\$\s*500\.000/ y no hay toast de exito.
  5. Verificar en backend con el oraculo.
    - expect: `await client.api.balance()` = 500000 sin cambios (no se envio ningun deposito).
