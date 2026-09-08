# Pruebas unitarias de caja blanca — Módulo Bolsillos (Backend)

Casos derivados de las **tablas de camino** del diagrama `Backend.drawio`.
Cada caso corresponde a una fila de la tabla de una de las cinco hojas del diagrama:
se declara la secuencia de nodos, las condiciones que hay que forzar en cada decisión,
las entradas concretas que lo consiguen, el resultado esperado y el resultado obtenido
al ejecutar el caso de uso real contra repositorios en memoria.

- **Fecha de ejecución:** 2026-08-25
- **Versión probada:** main-04800eb
- **Entorno:** Backend (Node + tsx), repositorios en memoria, sin Supabase
- **Técnica:** prueba de caminos básicos (McCabe) sobre los casos de uso de la capa de aplicación
- **Cómo reproducir:** `npm run test:paths` desde `backend/`

## Resumen

| Funcionalidad | Caminos probados | Aprobados | Fallidos | No ejecutables |
| --- | ---: | ---: | ---: | ---: |
| Crear bolsillo | 7 | 6 | 1 | 0 |
| Actualizar bolsillo | 11 | 11 | 0 | 0 |
| Eliminar bolsillo | 5 | 5 | 0 | 0 |
| Transferir entre bolsillos | 10 | 10 | 0 | 0 |
| Consultar bolsillos | 3 | 3 | 0 | 0 |
| **Total** | **36** | **35** | **1** | **0** |

## Índice de casos

| ID | Funcionalidad | Camino | Secuencia | Estado |
| --- | --- | --- | --- | --- |
| BE-CR-C1 | Crear bolsillo | Camino 1 | `1 → 3 → Fin` | ✅ Aprobado |
| BE-CR-C2 | Crear bolsillo | Camino 2 | `1 → 2 → 4 → 6 → Fin` | ✅ Aprobado |
| BE-CR-C3 | Crear bolsillo | Camino 3 | `1 → 2 → 4 → 5 → 7 → 9 → Fin` | ✅ Aprobado |
| BE-CR-C4 | Crear bolsillo | Camino 4 | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 12 → Fin` | ✅ Aprobado |
| BE-CR-C5 | Crear bolsillo | Camino 5 | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 15 → Fin` | ✅ Aprobado |
| BE-CR-C6 | Crear bolsillo | Camino 6 | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 11 → 13 → 14 → 15 → Fin` | ✅ Aprobado |
| BE-CR-C5b | Crear bolsillo | Camino 5 (variante con reserva previa) | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 15 → Fin` | ❌ Fallido |
| BE-AC-C1 | Actualizar bolsillo | Camino 1 | `1 → 3 → Fin` | ✅ Aprobado |
| BE-AC-C2 | Actualizar bolsillo | Camino 2 | `1 → 2 → 5 → Fin` | ✅ Aprobado |
| BE-AC-C3 | Actualizar bolsillo | Camino 3 | `1 → 2 → 4 → 6 → 7 → 9 → Fin` | ✅ Aprobado |
| BE-AC-C4 | Actualizar bolsillo | Camino 4 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 12 → Fin` | ✅ Aprobado |
| BE-AC-C5 | Actualizar bolsillo | Camino 5 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 15 → Fin` | ✅ Aprobado |
| BE-AC-C6 | Actualizar bolsillo | Camino 6 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 17 → 19 → Fin` | ✅ Aprobado |
| BE-AC-C7 | Actualizar bolsillo | Camino 7 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 17 → 18 → 26 → 25 → Fin` | ✅ Aprobado |
| BE-AC-C8 | Actualizar bolsillo | Camino 8 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 21 → 26 → Fin` | ✅ Aprobado |
| BE-AC-C9 | Actualizar bolsillo | Camino 9 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 20 → 23 → Fin` | ✅ Aprobado |
| BE-AC-C10 | Actualizar bolsillo | Camino 10 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 20 → 22 → 24 → 26 → 25 → Fin` | ✅ Aprobado |
| BE-AC-C11 | Actualizar bolsillo | Camino 11 | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 20 → 22 → 24 → 25 → Fin` | ✅ Aprobado |
| BE-EL-C1 | Eliminar bolsillo | Camino 1 | `1 → 2 → 4 → Fin` | ✅ Aprobado |
| BE-EL-C2 | Eliminar bolsillo | Camino 2 | `1 → 2 → 3 → 5 → 7 → Fin` | ✅ Aprobado |
| BE-EL-C3 | Eliminar bolsillo | Camino 3 | `1 → 2 → 3 → 5 → 6 → 8 → 10 → Fin` | ✅ Aprobado |
| BE-EL-C4 | Eliminar bolsillo | Camino 4 | `1 → 2 → 3 → 5 → 6 → 8 → 9 → 11 → 12 → 13 → 14 → 15 → Fin` | ✅ Aprobado |
| BE-EL-C5 | Eliminar bolsillo | Camino 5 | `1 → 2 → 3 → 5 → 6 → 8 → 9 → 11 → 12 → 13 → 14 → 16 → Fin` | ✅ Aprobado |
| BE-TR-C1 | Transferir entre bolsillos | Camino 1 | `1 → 3 → Fin` | ✅ Aprobado |
| BE-TR-C2 | Transferir entre bolsillos | Camino 2 | `1 → 2 → 5 → Fin` | ✅ Aprobado |
| BE-TR-C3 | Transferir entre bolsillos | Camino 3 | `1 → 2 → 4 → 6 → 8 → Fin` | ✅ Aprobado |
| BE-TR-C4 | Transferir entre bolsillos | Camino 4 | `1 → 2 → 4 → 6 → 7 → 9 → 11 → Fin` | ✅ Aprobado |
| BE-TR-C5 | Transferir entre bolsillos | Camino 5 | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 13 → Fin` | ✅ Aprobado |
| BE-TR-C6 | Transferir entre bolsillos | Camino 6 | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 16 → Fin` | ✅ Aprobado |
| BE-TR-C7 | Transferir entre bolsillos | Camino 7 | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 19 → Fin` | ✅ Aprobado |
| BE-TR-C8 | Transferir entre bolsillos | Camino 8 | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 18 → 21 → Fin` | ✅ Aprobado |
| BE-TR-C9 | Transferir entre bolsillos | Camino 9 | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 18 → 20 → 22 → 23 → 24 → 25 → 26 → Fin` | ✅ Aprobado |
| BE-TR-C11 | Transferir entre bolsillos | Camino 11 | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 18 → 20 → 22 → 23 → 24 → 25 → 27 → Fin` | ✅ Aprobado |
| BE-CO-C1 | Consultar bolsillos | Camino 1 | `1 → 2 → 4 → Fin` | ✅ Aprobado |
| BE-CO-C2 | Consultar bolsillos | Camino 2 | `1 → 2 → 3 → 5 → 6 → Fin` | ✅ Aprobado |
| BE-CO-C2b | Consultar bolsillos | Camino 2 (rechazo en el nodo 3, no tabulado) | `1 → 2 → 3 → Fin (salida por excepción)` | ✅ Aprobado |

## Crear bolsillo

Caso de uso bajo prueba: `CreatePocket.execute`

### BE-CR-C1 — Camino 1

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 3 → Fin` |
| **Condiciones forzadas** | • N1 (dto.amount < 0) = VERDADERO |
| **Entradas** | • Cuenta de ahorros ACTIVA del propietario, saldo = $1.000, sin bolsillos<br>• dto = { userId: propietario, accountId: cuenta.id, name: "Monto negativo", amount: -1 } |
| **Resultado esperado** | Se lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) en el nodo 3. No se consulta la cuenta ni se altera el saldo. |
| **Resultado obtenido** | Rechazado con INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo no puede ser negativo" · saldo intacto en $1.000 · bolsillos creados: 0 |
| **Estado** | ✅ **Aprobado** |

### BE-CR-C2 — Camino 2

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → Fin` |
| **Condiciones forzadas** | • N1 (dto.amount < 0) = FALSO<br>• N4 (!account) = VERDADERO |
| **Entradas** | • Repositorio de cuentas vacío<br>• dto = { userId: propietario, accountId: UUID aleatorio inexistente, name: "Fantasma", amount: 100 } |
| **Resultado esperado** | Se ejecuta findById (nodo 2), devuelve null y se lanza AppError ACCOUNT_NOT_FOUND (HTTP 404) en el nodo 6. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" · accountId consultado: 2fe76d3b-ba0e-41c8-97f6-744e122443e3 · bolsillos creados: 0 |
| **Estado** | ✅ **Aprobado** |

### BE-CR-C3 — Camino 3

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 5 → 7 → 9 → Fin` |
| **Condiciones forzadas** | • N1 (dto.amount < 0) = FALSO<br>• N4 (!account) = FALSO<br>• N5 (assertBelongsTo) no lanza: el usuario es el propietario<br>• N7 (!account.isOperational()) = VERDADERO |
| **Entradas** | • Cuenta de ahorros del propietario en estado BLOQUEADA, saldo = $1.000<br>• dto = { userId: propietario, accountId: cuenta.id, name: "Cuenta bloqueada", amount: 100 } |
| **Resultado esperado** | assertBelongsTo pasa (nodo 5) y, al no estar la cuenta ACTIVA, se lanza AppError ACCOUNT_NOT_OPERATIONAL (HTTP 400) en el nodo 9. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_OPERATIONAL · HTTP 400 · "La cuenta no está disponible para generar bolsillos" · estado de la cuenta: BLOQUEADA · saldo intacto en $1.000 |
| **Estado** | ✅ **Aprobado** |

### BE-CR-C4 — Camino 4

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 12 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N4 = FALSO<br>• N7 = FALSO (cuenta ACTIVA)<br>• N10 (currentReserved + dto.amount > account.balance) = VERDADERO |
| **Entradas** | • Cuenta de ahorros ACTIVA del propietario, saldo = $1.000, sin bolsillos (currentReserved = $0)<br>• dto = { userId: propietario, accountId: cuenta.id, name: "Excede saldo", amount: 1001 }<br>• Valor límite: monto = saldo + 1 |
| **Resultado esperado** | currentReserved (0) + 1001 > 1000, por lo que se lanza AppError INSUFFICIENT_AVAILABLE_BALANCE (HTTP 400) en el nodo 12 sin tocar el saldo. |
| **Resultado obtenido** | Rechazado con INSUFFICIENT_AVAILABLE_BALANCE · HTTP 400 · "No tienes saldo disponible suficiente para crear este bolsillo" · reservado previo $0 + monto $1.001 > saldo $1.000 · saldo intacto en $1.000 |
| **Estado** | ✅ **Aprobado** |

### BE-CR-C5 — Camino 5

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 15 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N4 = FALSO<br>• N7 = FALSO<br>• N10 = FALSO (hay saldo disponible suficiente)<br>• N14 (notificationRepository presente) = VERDADERO |
| **Entradas** | • Cuenta de ahorros ACTIVA del propietario, saldo = $1.000, sin bolsillos<br>• CreatePocket construido CON repositorio de notificaciones<br>• dto = { userId: propietario, accountId: cuenta.id, name: "Vacaciones", amount: 300 } |
| **Resultado esperado** | Se descuenta el monto del saldo (nodo 11), se guarda el bolsillo (nodo 13), se registra la notificación "Bolsillo creado" (nodo 16) y se retorna saved.toPublic() (nodo 15). Saldo final = $700. |
| **Resultado obtenido** | Bolsillo "Vacaciones" creado por $300 · saldo $1.000 → $700 · notificación registrada: "Bolsillo creado" (BOLSILLO) · respuesta toPublic() con id 2c17c921-04e9-4ed2-873e-f578142cb226 |
| **Estado** | ✅ **Aprobado** |

### BE-CR-C6 — Camino 6

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 11 → 13 → 14 → 15 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N4 = FALSO<br>• N7 = FALSO<br>• N10 = FALSO<br>• N14 (notificationRepository presente) = FALSO |
| **Entradas** | • Cuenta de ahorros ACTIVA del propietario, saldo = $1.000, sin bolsillos<br>• CreatePocket construido SIN repositorio de notificaciones (parámetro opcional omitido)<br>• dto = { userId: propietario, accountId: cuenta.id, name: "Sin notificación", amount: 300 } |
| **Resultado esperado** | El bolsillo se crea y el saldo baja a $700 igual que en el camino 5, pero se salta el nodo 16: no se registra ninguna notificación. |
| **Resultado obtenido** | Bolsillo "Sin notificación" creado por $300 · saldo $1.000 → $700 · notificaciones registradas: 0 (nodo 16 no recorrido) |
| **Estado** | ✅ **Aprobado** |

### BE-CR-C5b — Camino 5 (variante con reserva previa)

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 5 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 15 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N4 = FALSO<br>• N7 = FALSO<br>• N10 = FALSO — el monto solicitado cabe en el saldo disponible<br>• N14 = VERDADERO |
| **Entradas** | • Cuenta de ahorros ACTIVA del propietario, saldo inicial = $1.000<br>• Bolsillo previo "Reserva grande" de $800 (tras crearlo el saldo disponible queda en $200)<br>• dto = { userId: propietario, accountId: cuenta.id, name: "Segundo bolsillo", amount: 150 } |
| **Resultado esperado** | El monto $150 cabe en el saldo disponible de $200, por lo que N10 debe ser FALSO y el bolsillo debe crearse dejando el saldo disponible en $50. |
| **Resultado obtenido** | FALLO: El flujo tomó el camino 4 (nodo 12) en lugar del camino 5: INSUFFICIENT_AVAILABLE_BALANCE — "No tienes saldo disponible suficiente para crear este bolsillo". Saldo disponible $200, ya reservado $800, monto solicitado $150. Defecto: la decisión del nodo 10 compara "currentReserved + amount > account.balance", pero account.balance ya es el saldo DISPONIBLE (el reservado se descontó en el nodo 11 de creaciones anteriores), de modo que el monto reservado se cuenta dos veces y se rechazan bolsillos que sí caben. |
| **Estado** | ❌ **Fallido** |

## Actualizar bolsillo

Caso de uso bajo prueba: `UpdatePocket.execute`

### BE-AC-C1 — Camino 1

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 3 → Fin` |
| **Condiciones forzadas** | • N1 (name definido y sin contenido tras trim) = VERDADERO |
| **Entradas** | • No hace falta estado previo: la validación precede a toda consulta<br>• dto = { userId: propietario, pocketId: UUID cualquiera, name: "   " } |
| **Resultado esperado** | Se lanza AppError INVALID_POCKET_NAME (HTTP 400) en el nodo 3, sin consultar el repositorio de bolsillos. |
| **Resultado obtenido** | Rechazado con INVALID_POCKET_NAME · HTTP 400 · "El nombre del bolsillo no puede estar vacío" · entrada name = "   " (3 espacios, longitud tras trim = 0) |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C2 — Camino 2

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 5 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO (name no se envía)<br>• N2 (amount definido y < 0) = VERDADERO |
| **Entradas** | • dto = { userId: propietario, pocketId: UUID cualquiera, amount: -1 } |
| **Resultado esperado** | Se lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) en el nodo 5. |
| **Resultado obtenido** | Rechazado con INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo no puede ser negativo" · entrada amount = -1 (valor límite inmediatamente inferior a 0) |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C3 — Camino 3

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 = FALSO<br>• N7 (!pocket) = VERDADERO |
| **Entradas** | • Repositorio de bolsillos vacío<br>• dto = { userId: propietario, pocketId: UUID aleatorio inexistente, amount: 100 } |
| **Resultado esperado** | findById (nodos 4-6) devuelve null y se lanza AppError POCKET_NOT_FOUND (HTTP 404) en el nodo 9. |
| **Resultado obtenido** | Rechazado con POCKET_NOT_FOUND · HTTP 404 · "Bolsillo no encontrado" · pocketId consultado: 5b214277-92df-4e77-9f13-5835ff20a2e9 |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C4 — Camino 4

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 12 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 = FALSO<br>• N7 = FALSO<br>• N10 (!account) = VERDADERO |
| **Entradas** | • Bolsillo "Huérfano" de $100 sembrado directamente en el repositorio, apuntando a un accountId que no existe<br>• dto = { userId: propietario, pocketId: bolsillo.id, amount: 200 } |
| **Resultado esperado** | El bolsillo se encuentra (nodo 7 falso) pero su cuenta no (nodo 10 verdadero): se lanza AppError ACCOUNT_NOT_FOUND (HTTP 404) en el nodo 12. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" · accountId del bolsillo: b510e0a2-5106-472e-aa73-631ed232920d · monto del bolsillo intacto en $100 |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C5 — Camino 5

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 15 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 = FALSO<br>• N7 = FALSO<br>• N10 = FALSO<br>• N11 (assertBelongsTo) no lanza: el usuario es el propietario<br>• N13 (!account.isOperational()) = VERDADERO |
| **Entradas** | • Cuenta de ahorros del propietario con un bolsillo "Vacaciones" de $300; la cuenta se bloquea después de crearlo<br>• dto = { userId: propietario, pocketId: bolsillo.id, amount: 400 } |
| **Resultado esperado** | Se lanza AppError ACCOUNT_NOT_OPERATIONAL (HTTP 400) en el nodo 15 y el bolsillo conserva su monto original. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_OPERATIONAL · HTTP 400 · "La cuenta no está disponible para modificar bolsillos" · estado de la cuenta: BLOQUEADA · monto del bolsillo intacto en $300 |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C6 — Camino 6

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 17 → 19 → Fin` |
| **Condiciones forzadas** | • N13 = FALSO (cuenta ACTIVA)<br>• N14 (amount definido y distinto del actual) = VERDADERO<br>• N17 (newReservedTotal > account.balance + totalReserved) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA con saldo inicial $1.000 y bolsillo "Vacaciones" de $300 (saldo disponible $700, reservado $300)<br>• dto = { userId: propietario, pocketId: bolsillo.id, amount: 1001 }<br>• Valor límite: 1001 > 700 + 300 = 1000 |
| **Resultado esperado** | Se lanza AppError INSUFFICIENT_AVAILABLE_BALANCE (HTTP 400) en el nodo 19 sin tocar el saldo ni el bolsillo. |
| **Resultado obtenido** | Rechazado con INSUFFICIENT_AVAILABLE_BALANCE · HTTP 400 · "No tienes saldo disponible suficiente para ajustar este bolsillo" · saldo disponible intacto en $700 · monto del bolsillo intacto en $300 |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C7 — Camino 7

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 17 → 18 → 26 → 25 → Fin` |
| **Condiciones forzadas** | • N14 (amount definido y distinto) = VERDADERO<br>• N17 (saldo insuficiente) = FALSO<br>• N24 (notificationRepository presente) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA con saldo inicial $1.000 y bolsillo "Vacaciones" de $300 (saldo disponible $700)<br>• dto = { userId: propietario, pocketId: bolsillo.id, amount: 500 } |
| **Resultado esperado** | El nodo 18 ajusta el saldo por la diferencia (delta = 500 − 300 = 200) dejándolo en $500, el bolsillo pasa a $500, se registra la notificación "Bolsillo actualizado" (nodo 26) y se retorna updated.toPublic() (nodo 25). |
| **Resultado obtenido** | Monto $300 → $500 · saldo disponible $700 → $500 · notificación: "Bolsillo actualizado" — "Actualizaste el bolsillo "Vacaciones"" |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C8 — Camino 8

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 21 → 26 → Fin` |
| **Condiciones forzadas** | • N14 (amount definido y distinto) = FALSO — no se envía amount<br>• N16 (name definido y distinto del actual) = VERDADERO<br>• N24 = VERDADERO |
| **Entradas** | • Cuenta ACTIVA con saldo inicial $1.000 y bolsillo "Vacaciones" de $300 (saldo disponible $700)<br>• dto = { userId: propietario, pocketId: bolsillo.id, name: "Viaje a la costa" } |
| **Resultado esperado** | El nodo 21 renombra el bolsillo, el monto y el saldo quedan igual ($300 y $700) y se registra la notificación. |
| **Resultado obtenido** | Nombre "Vacaciones" → "Viaje a la costa" · monto sin cambios $300 · saldo sin cambios $700 · notificación registrada |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C9 — Camino 9

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 20 → 23 → Fin` |
| **Condiciones forzadas** | • N14 = FALSO (no se envía amount)<br>• N16 = FALSO (no se envía name)<br>• N20 (amount y name ambos undefined) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA con saldo inicial $1.000 y bolsillo "Vacaciones" de $300<br>• dto = { userId: propietario, pocketId: bolsillo.id } — sin name ni amount |
| **Resultado esperado** | Se lanza AppError NO_CHANGES_PROVIDED (HTTP 400) en el nodo 23; el bolsillo no se guarda ni se notifica. |
| **Resultado obtenido** | Rechazado con NO_CHANGES_PROVIDED · HTTP 400 · "No se proporcionaron cambios para el bolsillo" · dto sin name ni amount · notificaciones de actualización registradas: 0 |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C10 — Camino 10

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 20 → 22 → 24 → 26 → 25 → Fin` |
| **Condiciones forzadas** | • N14 = FALSO (no se envía amount)<br>• N16 = FALSO (el name enviado es IGUAL al actual)<br>• N20 = FALSO (name sí está definido)<br>• N24 (notificationRepository presente) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA con saldo inicial $1.000 y bolsillo "Vacaciones" de $300<br>• dto = { userId: propietario, pocketId: bolsillo.id, name: "Vacaciones" } — mismo nombre que ya tiene |
| **Resultado esperado** | No hay cambio real: se salta el nodo 21, se persiste el bolsillo tal cual (nodo 22), se registra la notificación (nodo 26) y se retorna updated.toPublic() (nodo 25) con nombre "Vacaciones" y monto $300. |
| **Resultado obtenido** | Operación aceptada sin cambio real — nombre "Vacaciones", monto $300, saldo $700 · notificación registrada: "Bolsillo actualizado" |
| **Estado** | ✅ **Aprobado** |

### BE-AC-C11 — Camino 11

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 8 → 10 → 11 → 13 → 14 → 16 → 20 → 22 → 24 → 25 → Fin` |
| **Condiciones forzadas** | • N14 = FALSO<br>• N16 = FALSO<br>• N20 = FALSO<br>• N24 (notificationRepository presente) = FALSO |
| **Entradas** | • Cuenta ACTIVA con saldo inicial $1.000 y bolsillo "Vacaciones" de $300<br>• UpdatePocket construido SIN repositorio de notificaciones<br>• dto = { userId: propietario, pocketId: bolsillo.id, name: "Vacaciones" } |
| **Resultado esperado** | Igual que el camino 10 pero saltando el nodo 26: la operación se acepta y no se registra ninguna notificación. |
| **Resultado obtenido** | Operación aceptada — nombre "Vacaciones", monto $300 · notificaciones de actualización registradas: 0 (nodo 26 no recorrido) |
| **Estado** | ✅ **Aprobado** |

## Eliminar bolsillo

Caso de uso bajo prueba: `DeletePocket.execute`

### BE-EL-C1 — Camino 1

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → Fin` |
| **Condiciones forzadas** | • N2 (!pocket) = VERDADERO |
| **Entradas** | • Repositorio de bolsillos vacío<br>• dto = { userId: propietario, pocketId: UUID aleatorio inexistente } |
| **Resultado esperado** | findById (nodo 1) devuelve null y se lanza AppError POCKET_NOT_FOUND (HTTP 404) en el nodo 4. |
| **Resultado obtenido** | Rechazado con POCKET_NOT_FOUND · HTTP 404 · "Bolsillo no encontrado" · pocketId consultado: 3116de5c-ffe8-4ff7-ae53-1adf086ec127 |
| **Estado** | ✅ **Aprobado** |

### BE-EL-C2 — Camino 2

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 3 → 5 → 7 → Fin` |
| **Condiciones forzadas** | • N2 (!pocket) = FALSO<br>• N5 (!account) = VERDADERO |
| **Entradas** | • Bolsillo "Huérfano" de $100 sembrado en el repositorio, apuntando a un accountId que no existe<br>• dto = { userId: propietario, pocketId: bolsillo.id } |
| **Resultado esperado** | Se lanza AppError ACCOUNT_NOT_FOUND (HTTP 404) en el nodo 7 y el bolsillo NO se elimina. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" · accountId del bolsillo: 848f20ca-c0f8-4958-9a9e-5838c64cb556 · el bolsillo sigue registrado (nodo 11 no recorrido) |
| **Estado** | ✅ **Aprobado** |

### BE-EL-C3 — Camino 3

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 3 → 5 → 6 → 8 → 10 → Fin` |
| **Condiciones forzadas** | • N2 = FALSO<br>• N5 = FALSO<br>• N6 (assertBelongsTo) no lanza: el usuario es el propietario<br>• N8 (!account.isOperational()) = VERDADERO |
| **Entradas** | • Cuenta del propietario con un bolsillo "Vacaciones" de $300; la cuenta se bloquea después de crearlo<br>• dto = { userId: propietario, pocketId: bolsillo.id } |
| **Resultado esperado** | Se lanza AppError ACCOUNT_NOT_OPERATIONAL (HTTP 400) en el nodo 10; el bolsillo sigue existiendo y el saldo no cambia. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_OPERATIONAL · HTTP 400 · "La cuenta no está disponible para eliminar bolsillos" · estado de la cuenta: BLOQUEADA · bolsillo aún registrado · saldo intacto en $700 |
| **Estado** | ✅ **Aprobado** |

### BE-EL-C4 — Camino 4

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 3 → 5 → 6 → 8 → 9 → 11 → 12 → 13 → 14 → 15 → Fin` |
| **Condiciones forzadas** | • N2 = FALSO<br>• N5 = FALSO<br>• N8 = FALSO<br>• N14 (notificationRepository presente) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA del propietario con saldo inicial $1.000 y bolsillo "Vacaciones" de $300 (saldo disponible $700)<br>• DeletePocket construido CON repositorio de notificaciones<br>• dto = { userId: propietario, pocketId: bolsillo.id } |
| **Resultado esperado** | El bolsillo se elimina (nodo 11), el monto reservado vuelve al saldo dejándolo en $1.000 (nodos 12-13), se registra la notificación "Bolsillo eliminado" (nodo 15) y se retorna el bolsillo eliminado. |
| **Resultado obtenido** | Bolsillo "Vacaciones" ($300) eliminado · saldo $700 → $1.000 · notificación: "Bolsillo eliminado" — "Eliminaste el bolsillo "Vacaciones"" |
| **Estado** | ✅ **Aprobado** |

### BE-EL-C5 — Camino 5

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 3 → 5 → 6 → 8 → 9 → 11 → 12 → 13 → 14 → 16 → Fin` |
| **Condiciones forzadas** | • N2 = FALSO<br>• N5 = FALSO<br>• N8 = FALSO<br>• N14 (notificationRepository presente) = FALSO |
| **Entradas** | • Cuenta ACTIVA del propietario con saldo inicial $1.000 y bolsillo "Vacaciones" de $300<br>• DeletePocket construido SIN repositorio de notificaciones<br>• dto = { userId: propietario, pocketId: bolsillo.id } |
| **Resultado esperado** | El bolsillo se elimina y el saldo vuelve a $1.000 igual que en el camino 4, pero se salta el nodo 15: no se registra notificación de eliminación. |
| **Resultado obtenido** | Bolsillo "Vacaciones" ($300) eliminado · saldo $700 → $1.000 · notificaciones de eliminación registradas: 0 (nodo 15 no recorrido) |
| **Estado** | ✅ **Aprobado** |

## Transferir entre bolsillos

Caso de uso bajo prueba: `TransferPocketBalance.execute`

### BE-TR-C1 — Camino 1

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 3 → Fin` |
| **Condiciones forzadas** | • N1 (dto.amount <= 0) = VERDADERO |
| **Entradas** | • No hace falta estado previo: la validación precede a toda consulta<br>• dto = { userId: propietario, fromPocketId: UUID, toPocketId: UUID distinto, amount: 0 }<br>• Valor límite: amount = 0 (el mínimo válido es 1) |
| **Resultado esperado** | Se lanza AppError INVALID_TRANSFER_AMOUNT (HTTP 400) en el nodo 3. |
| **Resultado obtenido** | Rechazado con INVALID_TRANSFER_AMOUNT · HTTP 400 · "El monto de transferencia debe ser mayor que cero" · entrada amount = 0 (valor límite) |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C2 — Camino 2

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 5 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 (fromPocketId === toPocketId) = VERDADERO |
| **Entradas** | • dto = { userId: propietario, fromPocketId: X, toPocketId: X, amount: 100 } — mismo identificador en origen y destino |
| **Resultado esperado** | Se lanza AppError INVALID_TRANSFER_TARGET (HTTP 400) en el nodo 5. |
| **Resultado obtenido** | Rechazado con INVALID_TRANSFER_TARGET · HTTP 400 · "Los bolsillos de origen y destino deben ser diferentes" · fromPocketId = toPocketId = ad4e50f7-400d-463c-b475-c9d06f18b99e |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C3 — Camino 3

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 8 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 = FALSO<br>• N6 (!fromPocket) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA del propietario con un bolsillo destino "Destino" de $100<br>• dto = { userId: propietario, fromPocketId: UUID inexistente, toPocketId: destino.id, amount: 50 } |
| **Resultado esperado** | Se lanza AppError SOURCE_POCKET_NOT_FOUND (HTTP 404) en el nodo 8. |
| **Resultado obtenido** | Rechazado con SOURCE_POCKET_NOT_FOUND · HTTP 404 · "Bolsillo de origen no encontrado" · fromPocketId consultado: 7a54fb27-e88a-4340-9952-a7c52e270518 · destino intacto en $100 |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C4 — Camino 4

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 11 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 = FALSO<br>• N6 = FALSO<br>• N9 (!toPocket) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA del propietario con un bolsillo origen "Origen" de $300<br>• dto = { userId: propietario, fromPocketId: origen.id, toPocketId: UUID inexistente, amount: 50 } |
| **Resultado esperado** | Se lanza AppError TARGET_POCKET_NOT_FOUND (HTTP 404) en el nodo 11. |
| **Resultado obtenido** | Rechazado con TARGET_POCKET_NOT_FOUND · HTTP 404 · "Bolsillo de destino no encontrado" · toPocketId consultado: 5db2372e-4f3a-4a8c-8d98-0d70a744ff5f · origen intacto en $300 |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C5 — Camino 5

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 13 → Fin` |
| **Condiciones forzadas** | • N1 = FALSO<br>• N2 = FALSO<br>• N6 = FALSO<br>• N9 = FALSO<br>• N10 (fromPocket.accountId !== toPocket.accountId) = VERDADERO |
| **Entradas** | • Dos cuentas ACTIVAS del mismo propietario: cuenta A con bolsillo "Origen" de $300 y cuenta B con bolsillo "Destino" de $100<br>• dto = { userId: propietario, fromPocketId: origen.id (cuenta A), toPocketId: destino.id (cuenta B), amount: 50 } |
| **Resultado esperado** | Se lanza AppError POCKETS_DIFFERENT_ACCOUNT (HTTP 400) en el nodo 13; ningún bolsillo se modifica. |
| **Resultado obtenido** | Rechazado con POCKETS_DIFFERENT_ACCOUNT · HTTP 400 · "Los bolsillos deben pertenecer a la misma cuenta" · cuenta del origen: dd96c9c8-5a1d-4cf1-a130-c6e47c83ecac · cuenta del destino: 275cdfb8-a420-4901-aab5-b1600aca3697 · montos intactos ($300 / $100) |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C6 — Camino 6

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 16 → Fin` |
| **Condiciones forzadas** | • N10 = FALSO (misma cuenta)<br>• N14 (!account) = VERDADERO |
| **Entradas** | • Dos bolsillos sembrados con el MISMO accountId, pero esa cuenta no existe en el repositorio de cuentas<br>• dto = { userId: propietario, fromPocketId: origen.id, toPocketId: destino.id, amount: 50 } |
| **Resultado esperado** | Se lanza AppError ACCOUNT_NOT_FOUND (HTTP 404) en el nodo 16. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" · accountId compartido por ambos bolsillos: 4b0ac7f2-026d-4a84-999f-144edd3e8246 · montos intactos ($300 / $100) |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C7 — Camino 7

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 19 → Fin` |
| **Condiciones forzadas** | • N14 = FALSO<br>• N15 (assertBelongsTo) no lanza: el usuario es el propietario<br>• N17 (!account.isOperational()) = VERDADERO |
| **Entradas** | • Cuenta del propietario en estado BLOQUEADA con bolsillos "Origen" $300 y "Destino" $100<br>• dto = { userId: propietario, fromPocketId: origen.id, toPocketId: destino.id, amount: 50 } |
| **Resultado esperado** | Se lanza AppError ACCOUNT_NOT_OPERATIONAL (HTTP 400) en el nodo 19. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_OPERATIONAL · HTTP 400 · "La cuenta no está disponible para transferir entre bolsillos" · estado de la cuenta: BLOQUEADA · montos intactos ($300 / $100) |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C8 — Camino 8

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 18 → 21 → Fin` |
| **Condiciones forzadas** | • N17 = FALSO (cuenta ACTIVA)<br>• N18 (fromPocket.amount < dto.amount) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA del propietario con bolsillos "Origen" $300 y "Destino" $100<br>• dto = { userId: propietario, fromPocketId: origen.id, toPocketId: destino.id, amount: 301 }<br>• Valor límite: monto = saldo del bolsillo origen + 1 |
| **Resultado esperado** | Se lanza AppError INSUFFICIENT_POCKET_BALANCE (HTTP 400) en el nodo 21; ningún bolsillo se modifica. |
| **Resultado obtenido** | Rechazado con INSUFFICIENT_POCKET_BALANCE · HTTP 400 · "Saldo insuficiente en el bolsillo de origen" · saldo del origen $300 < monto solicitado $301 · montos intactos ($300 / $100) |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C9 — Camino 9

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 18 → 20 → 22 → 23 → 24 → 25 → 26 → Fin` |
| **Condiciones forzadas** | • Todas las decisiones de error en FALSO<br>• N18 (saldo insuficiente en el origen) = FALSO<br>• N25 (notificationRepository presente) = VERDADERO |
| **Entradas** | • Cuenta ACTIVA del propietario con bolsillos "Origen" $300 y "Destino" $100<br>• TransferPocketBalance construido CON repositorio de notificaciones<br>• dto = { userId: propietario, fromPocketId: origen.id, toPocketId: destino.id, amount: 120 } |
| **Resultado esperado** | El origen baja a $180 (nodo 20), el destino sube a $220 (nodo 22), ambos se persisten (nodos 23-24), se registra la notificación "Movimiento entre bolsillos" (nodo 26) y se retornan los dos bolsillos actualizados. El saldo de la cuenta no cambia. |
| **Resultado obtenido** | Origen $300 → $180 · destino $100 → $220 · saldo de la cuenta sin cambios $1.000 · notificación: "Moviste $120 de "Origen" a "Destino"" |
| **Estado** | ✅ **Aprobado** |

### BE-TR-C11 — Camino 11

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 17 → 18 → 20 → 22 → 23 → 24 → 25 → 27 → Fin` |
| **Condiciones forzadas** | • Todas las decisiones de error en FALSO<br>• N18 (saldo insuficiente en el origen) = FALSO<br>• N25 (notificationRepository presente) = FALSO |
| **Entradas** | • Cuenta ACTIVA del propietario con bolsillos "Origen" $300 y "Destino" $100<br>• TransferPocketBalance construido SIN repositorio de notificaciones (parámetro opcional omitido)<br>• dto = { userId: propietario, fromPocketId: origen.id, toPocketId: destino.id, amount: 120 } |
| **Resultado esperado** | La transferencia se realiza igual que en el camino 9 —origen $180, destino $220, saldo de la cuenta sin cambios— pero se salta el nodo 26: no se registra notificación y se retorna directamente por el nodo 27. |
| **Resultado obtenido** | Origen $300 → $180 · destino $100 → $220 · saldo de la cuenta sin cambios $1.000 · notificaciones registradas: 0 (nodo 26 no recorrido) |
| **Estado** | ✅ **Aprobado** |

## Consultar bolsillos

Caso de uso bajo prueba: `GetAccountPockets.execute`

### BE-CO-C1 — Camino 1

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 4 → Fin` |
| **Condiciones forzadas** | • N2 (!account) = VERDADERO |
| **Entradas** | • Repositorio de cuentas vacío<br>• dto = { userId: propietario, accountId: UUID aleatorio inexistente } |
| **Resultado esperado** | findById (nodo 1) devuelve null y se lanza AppError ACCOUNT_NOT_FOUND (HTTP 404) en el nodo 4, sin consultar bolsillos. |
| **Resultado obtenido** | Rechazado con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" · accountId consultado: 43d3b8a6-172b-4dc9-b4b9-de48addcbc59 |
| **Estado** | ✅ **Aprobado** |

### BE-CO-C2 — Camino 2

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 3 → 5 → 6 → Fin` |
| **Condiciones forzadas** | • N2 (!account) = FALSO<br>• N3 (assertBelongsTo) no lanza: el usuario es el propietario |
| **Entradas** | • Cuenta ACTIVA del propietario con saldo $1.000 y dos bolsillos: "Vacaciones" $300 y "Laptop" $200<br>• dto = { userId: propietario, accountId: cuenta.id } |
| **Resultado esperado** | Se retorna la lista con los dos bolsillos convertidos con toPublic() (nodo 6), conservando nombre, monto y accountId. |
| **Resultado obtenido** | Lista de 2 bolsillos retornada: "Vacaciones" ($300), "Laptop" ($200) |
| **Estado** | ✅ **Aprobado** |

### BE-CO-C2b — Camino 2 (rechazo en el nodo 3, no tabulado)

| Campo | Contenido |
| --- | --- |
| **Secuencia de nodos** | `1 → 2 → 3 → Fin (salida por excepción)` |
| **Condiciones forzadas** | • N2 (!account) = FALSO<br>• N3 (assertBelongsTo) LANZA: el usuario no es el propietario |
| **Entradas** | • Cuenta ACTIVA del propietario "user-bolsillos" con un bolsillo "Privado" de $200<br>• dto = { userId: "user-intruso", accountId: cuenta.id } |
| **Resultado esperado** | Se lanza AppError FORBIDDEN (HTTP 403) desde el nodo 3 y no se alcanzan los nodos 5 ni 6, por lo que no se expone ningún bolsillo. |
| **Resultado obtenido** | Rechazado con FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" · no se expuso ningún bolsillo al usuario "user-intruso" (nodos 5 y 6 no recorridos) |
| **Estado** | ✅ **Aprobado** |

## Hallazgos

### ❌ BE-CR-C5b — Crear bolsillo · Camino 5 (variante con reserva previa)

**Esperado:** El monto $150 cabe en el saldo disponible de $200, por lo que N10 debe ser FALSO y el bolsillo debe crearse dejando el saldo disponible en $50.

**Obtenido:** FALLO: El flujo tomó el camino 4 (nodo 12) en lugar del camino 5: INSUFFICIENT_AVAILABLE_BALANCE — "No tienes saldo disponible suficiente para crear este bolsillo". Saldo disponible $200, ya reservado $800, monto solicitado $150. Defecto: la decisión del nodo 10 compara "currentReserved + amount > account.balance", pero account.balance ya es el saldo DISPONIBLE (el reservado se descontó en el nodo 11 de creaciones anteriores), de modo que el monto reservado se cuenta dos veces y se rechazan bolsillos que sí caben.


---

_Documento generado automáticamente por `npm run test:paths`; el resultado obtenido de cada camino proviene de la ejecución real del caso de uso, no de una transcripción manual._
