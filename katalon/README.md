# Pruebas con Katalon Recorder 7.1.0 — FuBanking

Este directorio contiene las suites de pruebas de caja negra y recorridos E2E automatizados para **Katalon Recorder**, estructurados en tablas HTML Selenese estándar (`<table><tr><td>command</td><td>target</td><td>value</td></tr>`) según el formato oficial de la clase (`Suite_4_ejemplos.zip`).

---

# Módulo 1: Créditos (Cliente Gabriel y Administrador Andresito)

Esta suite implementa el **Criterio 5 (20 puntos)** de la rúbrica de aseguramiento de calidad con nivel **Senior QA**, cubriendo no solo las pruebas funcionales del usuario solicitante, sino también pruebas de frontera, pruebas defensivas y el **flujo final de auditoría y aprobación de crédito por parte del Administrador**, integrando un ciclo completo End-to-End.

## 1. Actores y Credenciales Oficiales

La suite opera con dos actores con roles diferenciados según el principio de Control de Acceso Basado en Roles (RBAC):

| Actor | Rol en FuBanking | Email | Contraseña |
|---|---|---|---|
| **Gabriel** | Cliente Solicitante | `bedoyacanoandres2@gmail.com` | `Miabuela585*` |
| **Andresito (Admin)** | Administrador de Créditos | `bedoyacanoandres@gmail.com` | `FuBanking123*` |

---

## 2. Catálogo Completo de Casos de Prueba de Créditos (13 Casos)

```txt
katalon/
├── suites/
│   ├── Suite_01_Crear_bolsillo.html
│   ├── Suite_02_Consultar_bolsillos.html
│   ├── Suite_03_Editar_bolsillo.html
│   ├── Suite_04_Eliminar_bolsillo.html
│   ├── Suite_05_Transferir.html
│   ├── Suite_06_Depositar.html
│   ├── Suite_07_Creditos.html                          # Suite Master Créditos (TC00 a TC12)
│   ├── Suite_07_Creditos.json
│   ├── Suite_08_Registro.html                          # Suite Registro (CP01 a CP04)
│   ├── Suite_08_Registro.json
│   ├── Suite_09_Login.html                             # Suite Login (CP01 a CP05)
│   ├── Suite_09_Login.json
│   ├── Suite_10_Login_2FA.html                         # Suite 2FA (CP01 a CP05)
│   ├── Suite_10_Login_2FA.json
│   ├── Suite_11_Recuperar_contrasena.html              # Suite Contraseña (CP01 a CP08)
│   ├── Suite_11_Recuperar_contrasena.json
│   ├── Suite_12_Perfil.html                            # Suite Perfil (CP01 a CP05)
│   ├── Suite_12_Perfil.json
│   ├── Suite_13_Retiro.html                            # Suite Retiro (CP01 a CP04)
│   └── Suite_13_Retiro.json
│
├── casos/
│   ├── 01_Crear_bolsillo/ ...
│   ├── 02_Consultar_bolsillos/ ...
│   ├── 03_Editar_bolsillo/ ...
│   ├── 04_Eliminar_bolsillo/ ...
│   ├── 05_Transferir/ ...
│   ├── 06_Depositar/ ...
│   ├── 07_Creditos/ (TC00 a TC12)
│   ├── 08_Registro/ (CP01 a CP04)
│   ├── 09_Login/ (CP01 a CP05)
│   ├── 10_Login_2FA/ (CP01 a CP05)
│   ├── 11_Recuperar_contrasena/ (CP01 a CP08)
│   ├── 12_Perfil/ (CP01 a CP05)
│   └── 13_Retiro/ (CP01 a CP04)
```

---

## 3. Matriz de Cobertura y Verificaciones QA (Créditos)

| Caso | Actor | Tipo | Objetivo y Verificaciones Clave |
|---|:---:|:---:|---|
| **TC00** | Gabriel | Auth | Login, redirección a perfil y limpieza preventiva. |
| **TC01** | Gabriel | Positivo | Cálculo de cuota mensual, total a pagar e intereses en `#result-box`. |
| **TC02** | Gabriel | BVA | Recálculo dinámico con $100 (3 meses) y $25,000,000 (36 meses). |
| **TC03** | Gabriel | Negativo | Rechazo de montos/cuotas en cero con banner de validación. |
| **TC04** | Gabriel | Robustez | Simulación con 0% EA; cálculo consistente de cuota base. |
| **TC05** | Gabriel | Negocio | Indicadores de cumplimiento de requisitos y habilitación de `#btn-apply`. |
| **TC06** | Gabriel | Funcional | Envío de solicitud y confirmación en pantalla. |
| **TC07** | Admin | RBAC | Autenticación con rol admin y verificación de encabezado `/admin/loans`. |
| **TC08** | Admin | UI/UX | Navegación entre pestañas de estado `#filter-*` y botón `#btn-refresh-loans`. |
| **TC09** | Admin | Auditoría | Inspección de monto, ingresos del usuario y checklist de riesgo crediticio. |
| **TC10** | Admin | Golden | Aprobación de solicitud con `#btn-approve` y confirmación en "Aprobados". |
| **TC11** | Admin | Exclusión | Rechazo de solicitud con `#btn-reject` y confirmación en "Rechazados". |
| **TC12** | Mixto | Integral E2E | **Flujo Dorado Completo:** Gabriel solicita -> Admin aprueba -> Gabriel confirma estado "Aprobado". |

---

## 4. Instrucciones de Ejecución de Créditos en Katalon Recorder 7.1.0

### Pre-requisitos
Asegurarse de tener FuBanking activo localmente:
```bash
npm run dev:backend    # Puerto :3001
npm run dev:frontend   # Puerto :3000
```

### Ejecutar la Suite Completa de Créditos
1. Abre tu navegador y activa **Katalon Recorder (7.1.0)**.
2. Pulsa en **Open Suite** y selecciona `katalon/Suite_Creditos_FuBanking.html` (o `katalon/FuBanking_Creditos_KatalonRecorder_Suite.json`).
3. Haz clic en el botón verde **"Play Suite"** para ver correr automáticamente los 13 casos de prueba en secuencia.
4. Cada caso ejecuta el ciclo completo: limpieza de sesión previa (`/logout`), autenticación del actor correspondiente, interacción con los selectores canónicos y logout de limpieza.

### Ejecutar el Flujo Final E2E Directo
* Si deseas demostrar exclusivamente el ciclo colaborativo completo en una sola prueba, abre [`TC12_Ciclo_Completo_End_To_End.html`](TC12_Ciclo_Completo_End_To_End.html) y presiona **Play Test Case**.

---

# Módulo 2: Bolsillos y Depositar

Casos de prueba de caja negra para **Katalon Recorder**, cubriendo las 6 funcionalidades del módulo:

| # | Funcionalidad | Escenarios | Casos | Suite |
|---|---|---|---|---|
| 1 | HU-23 Crear bolsillo | ESC031–ESC033 | TC-101 a TC-111 | `suites/Suite_01_Crear_bolsillo.html` |
| 2 | HU-24 Consultar bolsillos | ESC034–ESC035 | TC-112 a TC-118 | `suites/Suite_02_Consultar_bolsillos.html` |
| 3 | HU-24 Editar bolsillo | ESC036–ESC037 | TC-119 a TC-127 | `suites/Suite_03_Editar_bolsillo.html` |
| 4 | HU-25 Eliminar bolsillo | ESC038–ESC039 | TC-128 a TC-133 | `suites/Suite_04_Eliminar_bolsillo.html` |
| 5 | HU-26 Transferir (agregar / retirar) | ESC040–ESC041 | TC-134 a TC-141 | `suites/Suite_05_Transferir.html` |
| 6 | Funcionalidad extra: Depositar | ESC042–ESC044 | TC-142 a TC-152 | `suites/Suite_06_Depositar.html` |

Cada caso sigue los pasos de su TC en `Casos y Escenarios FuBank.xlsx` (hoja "Casos de Prueba Detallado"); los `echo | Paso N: ...` del script marcan dónde empieza cada paso del Excel.

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

El profesor usa un usuario fijo escrito en el script. Aquí hay dos, en `usuarios-estaticos.json`:

| Rol | Correo | Para qué |
|---|---|---|
| principal | `katalon.bolsillos@fubanking.test` | Todos los casos; cuenta de ahorros con saldo mínimo $1.000.000 |
| intruso | `katalon.intruso@fubanking.test` | Cuenta sin bolsillos (TC-115) y "otro usuario" en los casos de cuenta ajena (TC-116, TC-132) |

Son usuarios de prueba (dominio `.test`, sin 2FA) del entorno local. El script de preparación es idempotente: si ya existen, solo repone el saldo.

## Cómo ejecutar

1. Levantar el sistema:
   ```bash
   npm --prefix backend run dev
   npm --prefix frontend run dev
   ```

2. Preparar los usuarios (la primera vez, y cuando quieras reponer saldo):
   ```bash
   npm run katalon:seed
   ```
   Con `node katalon/scripts/seed-usuarios.mjs --limpiar` además se borran los bolsillos que hayan quedado.

3. En Chrome, abrir una pestaña en `http://localhost:3000` y abrir Katalon Recorder.
4. En Katalon Recorder: **Open** (abrir test suite) → elegir un archivo de `suites/` (o un caso suelto de `casos/`). Se pueden abrir las 6 suites.
5. Seleccionar la suite y pulsar **Play Suite** (o **Play All** para las 6). El resultado de cada comando queda en la pestaña **Log**.

## Cómo están construidos los casos

- **Inicio de sesión:** cada caso empieza en `/`, lee qué usuario tiene sesión y, solo si no es el que necesita, borra la sesión (`runScript`, equivalente al `open /logout` del ejemplo) e inicia sesión por el formulario. Así una suite completa inicia sesión una sola vez.
- **Precondición de estado limpio:** los casos de Bolsillos borran por API los bolsillos que dejaron corridas anteriores (`storeEval` con la sesión del usuario). Así cada caso es independiente del orden de ejecución.
- **Saldos relativos:** como el usuario es fijo, su saldo cambia entre corridas. Los casos leen el saldo de la tarjeta en `/accounts` antes y después (`storeText` + `storeEval`) y comparan la diferencia con `assertEval`.
- **Casos de API y seguridad** (TC-116, 117, 118, 127, 131, 132, 133): hacen la petición HTTP desde la página con `storeEval` y verifican `"<status> <código>"`, por ejemplo `403 FORBIDDEN`. El resultado queda en el log con `echo`.
- **Selectores:** `id` y `data-testid` agregados al frontend para las pruebas E2E (ver `e2e/README.md`), y XPath por texto visible para toasts y tarjetas.

## Resultado esperado

Los 52 casos pasan contra `dev` (backend y frontend locales) en Katalon Recorder 7 sobre Chrome 154: **Passed 52, Failed 0** (2026-10-10).

TC-110 (nombre de solo espacios) detectó el defecto **DEF-001** (D-01/D-03 en la documentación de pruebas): el frontend solo validaba `!name` y el backend aceptaba `'   '`, así que el bolsillo se creaba. Tras corregirlo (`CreatePocket` rechaza con `INVALID_POCKET_NAME` y `handleCreate` avisa "Falta información"), TC-110 pasa.

| Evidencia | Qué muestra |
|---|---|
| `evidencias/TC110_falla_DEF-001_antes_del_arreglo.png` | TC-110 en rojo: `assertElementNotPresent` encuentra el toast "Bolsillo creado" (`[error] true`) |
| `evidencias/TC110_aprobado_despues_del_arreglo_52_de_52.png` | TC-110 en verde ("Test case passed") y el total de la corrida: Passed 52, Failed 0 |

## Notas

- **Cada `type` va seguido de un `runScript`.** Katalon Recorder 7 tiene un fallo conocido con React: el texto se ve en el campo, pero React no recibe el `onChange`, así que el formulario se envía vacío (en el login, la sesión nunca se abre). El `runScript` vuelve a poner el mismo valor con el setter nativo, desincroniza el `_valueTracker` de React y dispara `input`. Se inserta como `<script>` para correr en el contexto de la página.
- **Error "Encountered a script tag while rendering React component" en el login:** no lo causaba Katalon, era un defecto del frontend, ya corregido en `ThemeProvider.tsx`.
- Los casos esperan a que la página de login termine de montarse (`waitForEval` sobre `fubank-theme`) antes de escribir el correo.
- El backend limita el login a **10 intentos por minuto** por correo.
- TC-150 (monto vacío) depende de la validación nativa del navegador (`required`).
- Si cambias un caso, edita `scripts/generar-casos.mjs` y regenera con `npm run katalon:generar`.

---

# Módulo 3: Autenticación, Gestión de Cuenta y Transacciones

Este módulo agrupa las suites de pruebas automatizadas para el ciclo de vida del usuario: registro, inicio de sesión tradicional y con doble factor (2FA), recuperación y cambio de contraseña, gestión de perfil y retiros.

## 1. Suites de Pruebas (Suites 08 a 13)

| # | Módulo / Funcionalidad | Casos | Suite HTML | Suite JSON |
|---|---|---|---|---|
| **08** | Registro de Nuevos Usuarios | CP01 a CP04 (4 casos) | `suites/Suite_08_Registro.html` | `suites/Suite_08_Registro.json` |
| **09** | Inicio de Sesión (Login) | CP01 a CP05 (5 casos) | `suites/Suite_09_Login.html` | `suites/Suite_09_Login.json` |
| **10** | Autenticación de Dos Factores (2FA) | CP01 a CP05 (5 casos) | `suites/Suite_10_Login_2FA.html` | `suites/Suite_10_Login_2FA.json` |
| **11** | Recuperación y Cambio de Contraseña | CP01 a CP08 (8 casos) | `suites/Suite_11_Recuperar_contrasena.html` | `suites/Suite_11_Recuperar_contrasena.json` |
| **12** | Gestión de Perfil de Usuario | CP01 a CP05 (5 casos) | `suites/Suite_12_Perfil.html` | `suites/Suite_12_Perfil.json` |
| **13** | Retiro de Fondos | CP01 a CP04 (4 casos) | `suites/Suite_13_Retiro.html` | `suites/Suite_13_Retiro.json` |

---

## 2. Catálogo Detallado de Casos de Prueba

### Suite 08: Registro de Nuevos Usuarios (`casos/08_Registro/`)
| Caso | Tipo | Objetivo y Verificaciones |
|---|:---:|---|
| **CP01_Registro_Exitoso** | Positivo | Registro integral con datos válidos y correo único dinámico generado con timestamp (`user_<timestamp>@gmail.com`). Valida redirección tras registro. |
| **CP02_Registro_Email_Duplicado** | Negativo | Validación de regla de unicidad cuando se intenta registrar un correo ya existente (`Pruebaskatalon@gmail.com`). |
| **CP03_Registro_Password_Debil** | Negativo | Verificación de validación de robustez de contraseña ante contraseñas que no cumplen las políticas. |
| **CP04_Registro_Campos_Vacios** | Validación | Bloqueo y advertencias ante intento de envío del formulario de registro en blanco. |

### Suite 09: Inicio de Sesión (`casos/09_Login/`)
| Caso | Tipo | Objetivo y Verificaciones |
|---|:---:|---|
| **CP01_Login_Exitoso** | Positivo | Autenticación exitosa con credenciales válidas (`Pruebaskatalon@gmail.com`) y redirección fuera de `/login`. |
| **CP02_Login_Recordarme** | Positivo | Autenticación marcando el checkbox "Recordarme" para persistencia extendida. |
| **CP03_Password_Incorrecta** | Negativo | Verificación de mensaje de error al ingresar una contraseña errónea. |
| **CP04_Email_No_Registrado** | Negativo | Verificación de rechazo y mensaje ante correo no registrado (`noexiste@fubanking.test`). |
| **CP05_Campos_Vacios** | Validación | Bloqueo de envío cuando los campos de correo y contraseña están vacíos. |

### Suite 10: Autenticación de Dos Factores (`casos/10_Login_2FA/`)
| Caso | Tipo | Objetivo y Verificaciones |
|---|:---:|---|
| **CP01_Login_2FA_Exitoso** | Positivo | Flujo completo de login en cuenta con 2FA activo (`katalonfa@gmail.com`), digitación de OTP y acceso exitoso. |
| **CP02_Login_2FA_Codigo_Incorrecto** | Negativo | Validación de rechazo ante código OTP erróneo. |
| **CP03_Login_2FA_Reenviar_Codigo** | Funcional | Verificación de la funcionalidad de reenvío de nuevo código de verificación. |
| **CP04_Acceso_Directo_2FA_Sin_Sesion** | Seguridad | Control de acceso perimetral: deniega ingreso directo por URL a `/2fa` sin autenticación previa. |
| **CP05_Login_2FA_Contrasena_Erronea** | Negativo | Validación previa que no permite avanzar hacia el desafío 2FA si la contraseña es errónea. |

### Suite 11: Recuperación de Contraseña (`casos/11_Recuperar_contrasena/`)
| Caso | Tipo | Objetivo y Verificaciones |
|---|:---:|---|
| **CP01_Solicitud_Restablecer_Exitosa** | Positivo | Envío exitoso de solicitud de recuperación para correo registrado (`pruebaskatalon2@gmail.com`). |
| **CP02_Solicitud_Email_Invalido** | Negativo | Validación de formato inválido en el campo de correo de recuperación. |
| **CP03_Solicitud_Email_Vacio** | Validación | Rechazo de solicitud con campo de email en blanco. |
| **CP04_Verificar_Token_Invalido** | Seguridad | Verificación ante manipulación de token en la URL de restablecimiento. |
| **CP05_Acceso_Reset_Sin_Token** | Seguridad | Bloqueo de acceso a la pantalla `/reset-password` cuando no se provee parámetro token. |
| **CP06_Cambio_Contrasena_Exitoso** | Positivo | Cambio efectivo de contraseña consumiendo token válido por API y confirmando en UI. |
| **CP07_Restablecer_Contrasenas_No_Coinciden** | Negativo | Validación cuando la confirmación no es idéntica a la nueva contraseña. |
| **CP08_Restablecer_Contrasena_Debil** | Negativo | Validación y deshabilitación del botón ante contraseña que no cumple los requisitos mínimos. |

### Suite 12: Gestión de Perfil (`casos/12_Perfil/`)
| Caso | Tipo | Objetivo y Verificaciones |
|---|:---:|---|
| **CP01_Editar_Nombre_Exitoso** | Positivo | Actualización y persistencia del nombre del usuario en su perfil. |
| **CP02_Editar_Telefono_Ingresos** | Positivo | Modificación exitosa de los campos de teléfono e ingresos declarados. |
| **CP03_Validacion_Nombre_Invalido** | Negativo | Validación ante nombre con formato o longitud no admitidos. |
| **CP04_Validacion_Apellido_Invalido** | Negativo | Validación ante apellido inválido. |
| **CP05_Cancelar_Edicion** | UX/UI | Verificación de que cancelar el modal de edición conserva intactos los datos anteriores. |

### Suite 13: Retiro de Fondos (`casos/13_Retiro/`)
| Caso | Tipo | Objetivo y Verificaciones |
|---|:---:|---|
| **CP01_Retiro_Monto_Valido** | Transaccional | Retiro exitoso descontando el monto del saldo disponible de la cuenta. |
| **CP02_Retiro_Saldo_Insuficiente** | Negocio | Validación de rechazo cuando el monto ingresado supera el saldo de la cuenta. |
| **CP03_Retiro_Monto_Invalido** | Negativo | Rechazo ante montos en cero, negativos o formatos numéricos no válidos. |
| **CP04_Cancelar_Retiro** | UX/UI | Verificación de cancelación de la transacción sin afectar el saldo de la cuenta. |

---

## 3. Cuentas y Credenciales Oficiales de Prueba

| Cuenta de Prueba | Contraseña / Clave | Módulos Donde Aplica |
|---|---|---|
| `Pruebaskatalon@gmail.com` | `Katalon123.` | Suite 08 (Email duplicado), Suite 09 (Login), Suite 12 (Perfil), Suite 13 (Retiro) |
| `katalonfa@gmail.com` | `Katalon123.` | Suite 10 (Login 2FA) |
| `pruebaskatalon2@gmail.com` | Token vía API | Suite 11 (Recuperación y Restablecimiento de Contraseña) |
| `user_<timestamp>@gmail.com` | `Katalon123.` | Suite 08 (Registro Exitoso dinámico) |

---

## 4. Instrucciones de Ejecución de Suites 08 a 13

1. Levantar FuBanking:
   ```bash
   npm --prefix backend run dev
   npm --prefix frontend run dev
   ```
2. Abrir **Katalon Recorder** en el navegador (Chrome / Edge).
3. Hacer clic en **Open Suite** y navegar a `katalon/suites/`.
4. Puedes seleccionar cualquiera de los formatos disponibles:
   - Formato estándar Selenese HTML (`Suite_08_Registro.html` hasta `Suite_13_Retiro.html`)
   - Formato nativo JSON (`Suite_08_Registro.json` hasta `Suite_13_Retiro.json`)
5. Hacer clic en **Play Suite** para ejecutar todos los casos del módulo de forma secuencial y ordenada.

