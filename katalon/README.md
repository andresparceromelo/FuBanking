# Pruebas con Katalon Recorder — Bolsillos y Depositar

Casos de prueba de caja negra para **Katalon Recorder**, en el mismo formato
del ejemplo del profesor (`Suite_4_ejemplos.zip`): un HTML Selenese por caso y
una suite por funcionalidad. Cubren las 6 funcionalidades del módulo:

| # | Funcionalidad | Escenarios | Casos | Suite |
|---|---|---|---|---|
| 1 | HU-23 Crear bolsillo | ESC031–ESC033 | TC-101 a TC-111 | `suites/Suite_01_Crear_bolsillo.html` |
| 2 | HU-24 Consultar bolsillos | ESC034–ESC035 | TC-112 a TC-118 | `suites/Suite_02_Consultar_bolsillos.html` |
| 3 | HU-24 Editar bolsillo | ESC036–ESC037 | TC-119 a TC-127 | `suites/Suite_03_Editar_bolsillo.html` |
| 4 | HU-25 Eliminar bolsillo | ESC038–ESC039 | TC-128 a TC-133 | `suites/Suite_04_Eliminar_bolsillo.html` |
| 5 | HU-26 Transferir (agregar / retirar) | ESC040–ESC041 | TC-134 a TC-141 | `suites/Suite_05_Transferir.html` |
| 6 | Funcionalidad extra: Depositar | ESC042–ESC044 | TC-142 a TC-152 | `suites/Suite_06_Depositar.html` |

Cada caso sigue los pasos de su TC en `Casos y Escenarios FuBank.xlsx` (hoja
"Casos de Prueba Detallado"); los `echo | Paso N: ...` del script marcan dónde
empieza cada paso del Excel.

## Estructura

```txt
katalon/
  usuarios-estaticos.json        # usuarios fijos (como "tomsmith" en el ejemplo)
  casos/<NN_funcionalidad>/      # un HTML por caso: TC101_..., TC102_..., ...
  suites/                        # un HTML por funcionalidad con todos sus casos
  scripts/seed-usuarios.mjs      # crea / repone los usuarios estáticos
  scripts/generar-casos.mjs      # genera casos/ y suites/ (no editar los HTML a mano)
```

## Usuarios estáticos

El profesor usa un usuario fijo escrito en el script. Aquí hay dos, en
`usuarios-estaticos.json`:

| Rol | Correo | Para qué |
|---|---|---|
| principal | `katalon.bolsillos@fubanking.test` | Todos los casos; cuenta de ahorros con saldo mínimo $1.000.000 |
| intruso | `katalon.intruso@fubanking.test` | Cuenta sin bolsillos (TC-115) y "otro usuario" en los casos de cuenta ajena (TC-116, TC-132) |

Son usuarios de prueba (dominio `.test`, sin 2FA) del entorno local. El script
de preparación es idempotente: si ya existen, solo repone el saldo.

## Cómo ejecutar

1. Levantar el sistema:

   ```bash
   npm --prefix backend run dev
   ```

   ```bash
   npm --prefix frontend run dev
   ```

2. Preparar los usuarios (la primera vez, y cuando quieras reponer saldo):

   ```bash
   npm run katalon:seed
   ```

   Con `node katalon/scripts/seed-usuarios.mjs --limpiar` además se borran los
   bolsillos que hayan quedado.

3. En Chrome, abrir una pestaña en `http://localhost:3000` y abrir Katalon
   Recorder.
4. En Katalon Recorder: **Open** (abrir test suite) → elegir un archivo de
   `suites/` (o un caso suelto de `casos/`). Se pueden abrir las 6 suites.
5. Seleccionar la suite y pulsar **Play Suite** (o **Play All** para las 6). El
   resultado de cada comando queda en la pestaña **Log**.

## Cómo están construidos los casos

- **Inicio de sesión:** cada caso empieza en `/`, lee qué usuario tiene sesión
  y, solo si no es el que necesita, borra la sesión (`runScript`, equivalente
  al `open /logout` del ejemplo) e inicia sesión por el formulario. Así una
  suite completa inicia sesión una sola vez.
- **Precondición de estado limpio:** los casos de Bolsillos borran por API los
  bolsillos que dejaron corridas anteriores (`storeEval` con la sesión del
  usuario). Así cada caso es independiente del orden de ejecución.
- **Saldos relativos:** como el usuario es fijo, su saldo cambia entre
  corridas. Los casos leen el saldo de la tarjeta en `/accounts` antes y después
  (`storeText` + `storeEval`) y comparan la diferencia con `assertEval`.
- **Casos de API y seguridad** (TC-116, 117, 118, 127, 131, 132, 133): hacen
  la petición HTTP desde la página con `storeEval` y verifican
  `"<status> <código>"`, por ejemplo `403 FORBIDDEN`. El resultado queda en el
  log con `echo`.
- **Selectores:** `id` y `data-testid` agregados al frontend para las pruebas
  E2E (ver `e2e/README.md`), y XPath por texto visible para toasts y tarjetas.

## Resultado esperado

Los 52 casos pasan contra `dev` (backend y frontend locales) en Katalon
Recorder 7 sobre Chrome 154: **Passed 52, Failed 0** (2026-10-10).

TC-110 (nombre de solo espacios) detectó el defecto **DEF-001** (D-01/D-03 en
la documentación de pruebas): el frontend solo validaba `!name` y el backend
aceptaba `'   '`, así que el bolsillo se creaba. Tras corregirlo
(`CreatePocket` rechaza con `INVALID_POCKET_NAME` y `handleCreate` avisa
"Falta información"), TC-110 pasa.

| Evidencia | Qué muestra |
|---|---|
| `evidencias/TC110_falla_DEF-001_antes_del_arreglo.png` | TC-110 en rojo: `assertElementNotPresent` encuentra el toast "Bolsillo creado" (`[error] true`) |
| `evidencias/TC110_aprobado_despues_del_arreglo_52_de_52.png` | TC-110 en verde ("Test case passed") y el total de la corrida: Passed 52, Failed 0 |

## Notas

- **Cada `type` va seguido de un `runScript`.** Katalon Recorder 7 tiene un
  fallo conocido con React: el texto se ve en el campo, pero React no recibe el
  `onChange`, así que el formulario se envía vacío (en el login, la sesión
  nunca se abre). El `runScript` vuelve a poner el mismo valor con el setter
  nativo, desincroniza el `_valueTracker` de React y dispara `input`. Se inserta
  como `<script>` para correr en el contexto de la página. Si tu versión de
  Katalon ya escribe bien, no cambia nada. Ver
  [foro de Katalon](https://forum.katalon.com/t/newest-katalon-7-1-0-does-not-work-with-react-form-hooks/169892).
- **Error "Encountered a script tag while rendering React component" en el
  login:** no lo causaba Katalon, era un defecto del frontend, ya corregido en
  `ThemeProvider.tsx`. El tema arrancaba en el navegador con el valor guardado o
  el del sistema, mientras el servidor siempre renderiza `dark`; con el
  navegador en modo claro la hidratación fallaba y React regeneraba la página.
- Los casos esperan a que la página de login termine de montarse
  (`waitForEval` sobre `fubank-theme`) antes de escribir el correo: el
  formulario reinicia sus campos al montarse y lo escrito antes se pierde.
- El backend limita el login a **10 intentos por minuto** por correo. Los casos
  solo inician sesión cuando cambian de usuario, pero si se reproducen muchos
  casos sueltos muy rápido puede aparecer el límite. En ese caso, esperar un
  minuto.
- TC-150 (monto vacío) depende de la validación nativa del navegador (`required`):
  el formulario no se envía y el campo queda con `validity.valueMissing`.
- Si cambias un caso, edita `scripts/generar-casos.mjs` y regenera:

  ```bash
  npm run katalon:generar
  ```
