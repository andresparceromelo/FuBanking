# Evidencia Stagehand — Bolsillos y Depositar

**Fecha de ejecución:** 26/10/2026, 9:50:26 p. m.  
**Resultado:** 6/6 escenarios aprobados en 199.8 s  
**Oráculo:** cada acción de la IA se comprueba contra la API real del backend (saldo y bolsillos).

| Id | Funcionalidad | Modelo | Capacidades | Validaciones | Estado | Duración | Tokens |
|---|---|---|---|---|---|---|---|
| SH-B01 | Crear bolsillo | `google/gemini-3.5-flash` | `observe` + `act` + `extract` | 5/5 | ✅ APROBADO | 53.8 s | 7.811 |
| SH-B02 | Consultar bolsillos | `google/gemini-3.5-flash` | `extract` + `observe` | 4/4 | ✅ APROBADO | 21.6 s | 4.915 |
| SH-B03 | Editar bolsillo | `google/gemini-3.5-flash` | `act` + `extract` | 4/4 | ✅ APROBADO | 65.9 s | 12.372 |
| SH-B04 | Eliminar bolsillo | `google/gemini-3.5-flash-lite` | `act` + `observe` + `extract` | 6/6 | ✅ APROBADO | 14.3 s | 5.190 |
| SH-B05 | Transferir entre bolsillos | `google/gemini-3.5-flash-lite` | `act` + `extract` | 4/4 | ✅ APROBADO | 20.1 s | 10.825 |
| SH-D06 | Depositar dinero | `google/gemini-3.5-flash-lite` | `observe` + `act` + `extract` | 6/6 | ✅ APROBADO | 24.2 s | 11.312 |

## Detalle por escenario

### SH-B01 — Crear bolsillo

- **Objetivo:** La IA crea un bolsillo desde la pantalla siguiendo instrucciones en lenguaje natural.
- **Resultado esperado:** Toast "Bolsillo creado", tarjeta "Vacaciones" con 100.000 y saldo de la cuenta en 400.000 (de 500.000).
- **Resultado obtenido:** 5/5 validaciones correctas
- **Estado:** APROBADO
- **Evidencias:** `SH-B01-inicio.png`, `SH-B01-resultado.png` y `SH-B01-report.json`

| Validación | Esperado | Obtenido | ✓ |
|---|---|---|---|
| observe encuentra el botón "Crear bolsillo" | `true` | `true` | ✅ |
| notificación "Bolsillo creado" | `true` | `true` | ✅ |
| bolsillos en pantalla (extract) | `[{"name":"Vacaciones","amount":100000}]` | `[{"name":"Vacaciones","amount":100000}]` | ✅ |
| bolsillos en el backend (API) | `[{"name":"Vacaciones","amount":100000}]` | `[{"name":"Vacaciones","amount":100000}]` | ✅ |
| saldo de la cuenta en el backend (API) | `400000` | `400000` | ✅ |

### SH-B02 — Consultar bolsillos

- **Objetivo:** La IA lee los bolsillos de la cuenta y descubre las acciones disponibles en cada tarjeta.
- **Resultado esperado:** Extrae "Mercado" 50.000 y "Vacaciones" 100.000, igual que la API, y encuentra Editar y Eliminar.
- **Resultado obtenido:** 4/4 validaciones correctas
- **Estado:** APROBADO
- **Evidencias:** `SH-B02-lista.png` y `SH-B02-report.json`

| Validación | Esperado | Obtenido | ✓ |
|---|---|---|---|
| bolsillos en pantalla (extract) | `[{"name":"Mercado","amount":50000},{"name":"Vacaciones","amount":100000}]` | `[{"name":"Mercado","amount":50000},{"name":"Vacaciones","amount":100000}]` | ✅ |
| la pantalla coincide con el backend (API) | `[{"name":"Mercado","amount":50000},{"name":"Vacaciones","amount":100000}]` | `[{"name":"Mercado","amount":50000},{"name":"Vacaciones","amount":100000}]` | ✅ |
| observe encuentra botones Editar | `true` | `true` | ✅ |
| observe encuentra botones Eliminar | `true` | `true` | ✅ |

### SH-B03 — Editar bolsillo

- **Objetivo:** La IA renombra un bolsillo y aumenta su monto desde el formulario de edición.
- **Resultado esperado:** Toast "Bolsillo actualizado", bolsillo "Viaje a Cartagena" con 150.000 y saldo de la cuenta en 350.000.
- **Resultado obtenido:** 4/4 validaciones correctas
- **Estado:** APROBADO
- **Evidencias:** `SH-B03-edicion.png`, `SH-B03-resultado.png` y `SH-B03-report.json`

| Validación | Esperado | Obtenido | ✓ |
|---|---|---|---|
| notificación "Bolsillo actualizado" | `true` | `true` | ✅ |
| bolsillos en pantalla (extract) | `[{"name":"Viaje a Cartagena","amount":150000}]` | `[{"name":"Viaje a Cartagena","amount":150000}]` | ✅ |
| bolsillos en el backend (API) | `[{"name":"Viaje a Cartagena","amount":150000}]` | `[{"name":"Viaje a Cartagena","amount":150000}]` | ✅ |
| la diferencia sale de la cuenta (API) | `350000` | `350000` | ✅ |

### SH-B04 — Eliminar bolsillo

- **Objetivo:** La IA elimina un bolsillo pasando por el diálogo de confirmación.
- **Resultado esperado:** Toast "Bolsillo eliminado", mensaje de lista vacía y el saldo vuelve a 500.000.
- **Resultado obtenido:** 6/6 validaciones correctas
- **Estado:** APROBADO
- **Evidencias:** `SH-B04-confirmacion.png`, `SH-B04-resultado.png` y `SH-B04-report.json`

| Validación | Esperado | Obtenido | ✓ |
|---|---|---|---|
| observe encuentra la confirmación "Sí, eliminar" | `true` | `true` | ✅ |
| notificación "Bolsillo eliminado" | `true` | `true` | ✅ |
| no quedan tarjetas en pantalla (extract) | `0` | `0` | ✅ |
| mensaje de lista vacía (extract) | `true` | `true` | ✅ |
| el backend no tiene bolsillos (API) | `[]` | `[]` | ✅ |
| el saldo vuelve a la cuenta (API) | `500000` | `500000` | ✅ |

### SH-B05 — Transferir entre bolsillos

- **Objetivo:** La IA mueve dinero de un bolsillo a otro con el formulario de transferencia.
- **Resultado esperado:** Toast "Transferencia realizada", Vacaciones 70.000, Mercado 80.000 y la cuenta sigue en 350.000.
- **Resultado obtenido:** 4/4 validaciones correctas
- **Estado:** APROBADO
- **Evidencias:** `SH-B05-formulario.png`, `SH-B05-resultado.png` y `SH-B05-report.json`

| Validación | Esperado | Obtenido | ✓ |
|---|---|---|---|
| notificación "Transferencia realizada" | `true` | `true` | ✅ |
| bolsillos en pantalla (extract) | `[{"name":"Mercado","amount":80000},{"name":"Vacaciones","amount":70000}]` | `[{"name":"Mercado","amount":80000},{"name":"Vacaciones","amount":70000}]` | ✅ |
| bolsillos en el backend (API) | `[{"name":"Mercado","amount":80000},{"name":"Vacaciones","amount":70000}]` | `[{"name":"Mercado","amount":80000},{"name":"Vacaciones","amount":70000}]` | ✅ |
| la transferencia no toca la cuenta (API) | `350000` | `350000` | ✅ |

### SH-D06 — Depositar dinero

- **Objetivo:** La IA abona saldo a la cuenta; antes comprueba que el formulario rechaza un monto en cero.
- **Resultado esperado:** Con 0: error "Por favor ingresa un monto válido mayor a cero." y saldo 0. Con 150.000: toast "Deposito realizado" y saldo 150.000.
- **Resultado obtenido:** 6/6 validaciones correctas
- **Estado:** APROBADO
- **Evidencias:** `SH-D06-inicio.png`, `SH-D06-error-monto-cero.png`, `SH-D06-resultado.png` y `SH-D06-report.json`

| Validación | Esperado | Obtenido | ✓ |
|---|---|---|---|
| observe encuentra el botón "Abonar" | `true` | `true` | ✅ |
| mensaje de error (extract) | `"Por favor ingresa un monto válido mayor a cero."` | `"Por favor ingresa un monto válido mayor a cero."` | ✅ |
| el saldo no cambia (API) | `0` | `0` | ✅ |
| notificación "Deposito realizado" | `true` | `true` | ✅ |
| saldo en pantalla (extract) | `150000` | `150000` | ✅ |
| saldo en el backend (API) | `150000` | `150000` | ✅ |
