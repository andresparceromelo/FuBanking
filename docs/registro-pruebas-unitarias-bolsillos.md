# Registro de pruebas unitarias — Módulo Bolsillos (Backend)

Documento generado automáticamente por `npm run test:unit`. El **resultado obtenido**
de cada caso proviene de la ejecución real de la unidad bajo prueba.

La suite **no usa mocks, dobles ni stubs**. Las unidades sin dependencias se
instancian directamente; los casos de uso reciben los repositorios Supabase reales.

- **Fecha de ejecución:** 2026-08-31
- **Versión probada:** main-04800eb
- **Entorno:** Backend (Node + tsx). Parte A en memoria; Parte B contra Supabase real.
- **Usuario de la Parte B:** tomashmetaute@gmail.com
- **Cómo reproducir:** `npm run test:unit` desde `backend/`

## Resumen

| Grupo | Casos | Aprobados | Fallidos |
| --- | ---: | ---: | ---: |
| Entidad Pocket · construcción | 7 | 6 | 1 |
| Entidad Pocket · mutadores | 6 | 6 | 0 |
| Entidad Account | 4 | 4 | 0 |
| Schemas de validación | 15 | 12 | 3 |
| Crear bolsillo | 9 | 8 | 1 |
| Actualizar bolsillo | 10 | 10 | 0 |
| Eliminar bolsillo | 4 | 4 | 0 |
| Transferir entre bolsillos | 9 | 9 | 0 |
| Consultar bolsillos | 5 | 5 | 0 |
| **Total** | **69** | **64** | **5** |

De los 5 fallidos, 5 corresponden a defectos ya identificados del código de producción, que por alcance no se corrigen en esta entrega. Se cuentan como fallidos: un defecto documentado no es un caso aprobado.

## Índice de casos

| ID | Grupo | Unidad | Estado | Defecto |
| --- | --- | --- | --- | --- |
| PU-01 | Entidad Pocket · construcción | `Pocket.create` | ✅ Aprobado | — |
| PU-02 | Entidad Pocket · construcción | `Pocket.create` | ✅ Aprobado | — |
| PU-03 | Entidad Pocket · construcción | `Pocket.assertValidAmount` | ✅ Aprobado | — |
| PU-04 | Entidad Pocket · construcción | `Pocket.assertValidAmount` | ✅ Aprobado | — |
| PU-05 | Entidad Pocket · construcción | `Pocket.assertValidAmount` | ✅ Aprobado | — |
| PU-06 | Entidad Pocket · construcción | `Pocket (constructor)` | ❌ Fallido | D-01 |
| PU-07 | Entidad Pocket · construcción | `Pocket.toPublic` | ✅ Aprobado | — |
| PU-08 | Entidad Pocket · mutadores | `Pocket.updateAmount` | ✅ Aprobado | — |
| PU-09 | Entidad Pocket · mutadores | `Pocket.updateAmount` | ✅ Aprobado | — |
| PU-10 | Entidad Pocket · mutadores | `Pocket.updateAmount` | ✅ Aprobado | — |
| PU-11 | Entidad Pocket · mutadores | `Pocket.updateName` | ✅ Aprobado | — |
| PU-12 | Entidad Pocket · mutadores | `Pocket.updateName` | ✅ Aprobado | — |
| PU-13 | Entidad Pocket · mutadores | `Pocket.updateAmount` | ✅ Aprobado | — |
| AU-01 | Entidad Account | `Account.isOperational` | ✅ Aprobado | — |
| AU-02 | Entidad Account | `Account.isOperational` | ✅ Aprobado | — |
| AU-03 | Entidad Account | `Account.assertBelongsTo` | ✅ Aprobado | — |
| AU-04 | Entidad Account | `Account.assertBelongsTo` | ✅ Aprobado | — |
| VU-01 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-02 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-03 | Schemas de validación | `createPocketSchema` | ❌ Fallido | D-02 |
| VU-04 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-05 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-06 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-07 | Schemas de validación | `createPocketSchema` | ❌ Fallido | D-03 |
| VU-08 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-09 | Schemas de validación | `createPocketSchema` | ✅ Aprobado | — |
| VU-10 | Schemas de validación | `updatePocketSchema` | ✅ Aprobado | — |
| VU-11 | Schemas de validación | `updatePocketSchema` | ❌ Fallido | D-04 |
| VU-12 | Schemas de validación | `updatePocketSchema` | ✅ Aprobado | — |
| VU-13 | Schemas de validación | `transferPocketSchema` | ✅ Aprobado | — |
| VU-14 | Schemas de validación | `transferPocketSchema` | ✅ Aprobado | — |
| VU-15 | Schemas de validación | `transferPocketSchema` | ✅ Aprobado | — |
| CU-CR-01 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-02 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-03 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-04 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-05 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-06 | Crear bolsillo | `CreatePocket.execute + SupabasePocketRepository` | ✅ Aprobado | — |
| CU-CR-07 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-08 | Crear bolsillo | `CreatePocket.execute` | ✅ Aprobado | — |
| CU-CR-09 | Crear bolsillo | `CreatePocket.execute` | ❌ Fallido | D-05 |
| CU-AC-01 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-02 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-03 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-04 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-05 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-06 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-07 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-08 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-09 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-AC-10 | Actualizar bolsillo | `UpdatePocket.execute` | ✅ Aprobado | — |
| CU-EL-01 | Eliminar bolsillo | `DeletePocket.execute` | ✅ Aprobado | — |
| CU-EL-02 | Eliminar bolsillo | `DeletePocket.execute` | ✅ Aprobado | — |
| CU-EL-03 | Eliminar bolsillo | `DeletePocket.execute` | ✅ Aprobado | — |
| CU-EL-04 | Eliminar bolsillo | `DeletePocket.execute` | ✅ Aprobado | — |
| CU-TR-01 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-02 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-03 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-04 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-05 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-06 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-07 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-08 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-TR-09 | Transferir entre bolsillos | `TransferPocketBalance.execute` | ✅ Aprobado | — |
| CU-CO-01 | Consultar bolsillos | `GetAccountPockets.execute` | ✅ Aprobado | — |
| CU-CO-02 | Consultar bolsillos | `GetAccountPockets.execute` | ✅ Aprobado | — |
| CU-CO-03 | Consultar bolsillos | `GetAccountPockets.execute` | ✅ Aprobado | — |
| CU-CO-04 | Consultar bolsillos | `GetAccountPockets.execute` | ✅ Aprobado | — |
| CU-CO-05 | Consultar bolsillos | `Invariante de saldo` | ✅ Aprobado | — |

## Entidad Pocket · construcción

### PU-01 — El factory recorta los espacios sobrantes del nombre

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.create` |
| **Entrada** | name = "  Vacaciones  " |
| **Resultado esperado** | El bolsillo queda con name = "Vacaciones", sin espacios en los extremos |
| **Resultado obtenido** | name = "Vacaciones" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-02 — Valor límite inferior del monto: se acepta el cero

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.create` |
| **Entrada** | amount = 0 |
| **Resultado esperado** | El bolsillo se construye con amount = 0, sin lanzar |
| **Resultado obtenido** | amount = 0 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-03 — Un monto negativo se rechaza al construir

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.assertValidAmount` |
| **Entrada** | amount = -1 |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) |
| **Resultado obtenido** | Lanzó INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo debe ser un número mayor o igual a cero" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-04 — NaN se rechaza al construir

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.assertValidAmount` |
| **Entrada** | amount = NaN |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) |
| **Resultado obtenido** | Lanzó INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo debe ser un número mayor o igual a cero" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-05 — Una cadena numérica se rechaza: la comprobación es de tipo, no de valor

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.assertValidAmount` |
| **Entrada** | amount = "100" |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) porque typeof !== "number" |
| **Resultado obtenido** | Lanzó INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo debe ser un número mayor o igual a cero" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1 ms |

### PU-06 — Un nombre vacío debe rechazarse al construir, igual que al modificar

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket (constructor)` |
| **Entrada** | name = "" |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_NAME (HTTP 400), la misma regla que aplica updateName("") |
| **Resultado obtenido** | FALLO: PU-06: un nombre vacío debe rechazarse al construir — no lanzó ninguna excepción; devolvió {"_id":"p1","_accountId":"a1","_name":"","_amount":100,"_createdAt":"2026-09-01T03:09:21.838Z","_updatedAt":"2026-09-01T03:09:21.838Z"} |
| **Estado** | ❌ **Fallido** |
| **Defecto asociado** | D-01 |
| **Duración** | 1 ms |

### PU-07 — La representación pública expone seis campos y ningún dato interno

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.toPublic` |
| **Entrada** | Bolsillo válido recién construido |
| **Resultado esperado** | toPublic() devuelve exactamente id, accountId, name, amount, createdAt y updatedAt, con las fechas como cadena ISO |
| **Resultado obtenido** | claves = id,accountId,name,amount,createdAt,updatedAt · createdAt = 2026-09-01T03:09:21.839Z |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

## Entidad Pocket · mutadores

### PU-08 — Valor límite inferior al mutar: se acepta el cero

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.updateAmount` |
| **Entrada** | Bolsillo de $300.000, updateAmount(0) |
| **Resultado esperado** | El monto queda en 0, sin lanzar |
| **Resultado obtenido** | amount = 0 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-09 — Un monto negativo se rechaza al mutar

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.updateAmount` |
| **Entrada** | updateAmount(-1) |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) |
| **Resultado obtenido** | Lanzó INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo debe ser un número mayor o igual a cero" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-10 — NaN se rechaza al mutar

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.updateAmount` |
| **Entrada** | updateAmount(NaN) |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) |
| **Resultado obtenido** | Lanzó INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo debe ser un número mayor o igual a cero" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-11 — El mutador también recorta los espacios sobrantes

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.updateName` |
| **Entrada** | updateName("  Bici  ") |
| **Resultado esperado** | El nombre queda en "Bici" |
| **Resultado obtenido** | name = "Bici" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### PU-12 — Un nombre de solo espacios se rechaza al mutar

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.updateName` |
| **Entrada** | updateName("   ") |
| **Resultado esperado** | Lanza AppError INVALID_POCKET_NAME (HTTP 400) |
| **Resultado obtenido** | Lanzó INVALID_POCKET_NAME · HTTP 400 · "El nombre del bolsillo no puede estar vacío" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1 ms |

### PU-13 — Mutar refresca la marca de tiempo de modificación

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Pocket.updateAmount` |
| **Entrada** | Bolsillo recién creado, updateAmount(20) |
| **Resultado esperado** | updatedAt queda igual o posterior al valor previo a la mutación |
| **Resultado obtenido** | updatedAt 1788232161840 → 1788232161840 (delta 0 ms) |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

## Entidad Account

### AU-01 — Una cuenta ACTIVA sí puede operar

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Account.isOperational` |
| **Entrada** | status = ACTIVA |
| **Resultado esperado** | isOperational() devuelve true |
| **Resultado obtenido** | isOperational() = true |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### AU-02 — Solo ACTIVA opera: BLOQUEADA y CERRADA quedan fuera

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Account.isOperational` |
| **Entrada** | status = BLOQUEADA y status = CERRADA |
| **Resultado esperado** | isOperational() devuelve false en ambos casos |
| **Resultado obtenido** | BLOQUEADA = false · CERRADA = false |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### AU-03 — El dueño de la cuenta pasa la comprobación de propiedad

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Account.assertBelongsTo` |
| **Entrada** | Cuenta de "u1", se comprueba contra "u1" |
| **Resultado esperado** | assertBelongsTo no lanza ninguna excepción |
| **Resultado obtenido** | assertBelongsTo("u1") no lanzó excepción |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### AU-04 — Un usuario ajeno es rechazado en la capa de dominio

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Account.assertBelongsTo` |
| **Entrada** | Cuenta de "u1", se comprueba contra "u2" |
| **Resultado esperado** | Lanza AppError FORBIDDEN (HTTP 403) |
| **Resultado obtenido** | Lanzó FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

## Schemas de validación

### VU-01 — Una carga válida se acepta y conserva los tres campos

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | { accountId: UUID, name: "Vacaciones", amount: 300000 } |
| **Resultado esperado** | Acepta y devuelve amount = 300000 sin alterarlo |
| **Resultado obtenido** | Aceptó y parseó a {"accountId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","name":"Vacaciones","amount":300000} |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1 ms |

### VU-02 — Una cadena numérica se coacciona a número

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | amount = "300000" |
| **Resultado esperado** | Acepta y coacciona a amount = 300000 (número), por z.coerce.number() |
| **Resultado obtenido** | Aceptó y parseó a {"accountId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","name":"V","amount":300000} |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-03 — Un booleano no es un monto y debe rechazarse

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | amount = true |
| **Resultado esperado** | Rechaza: un booleano no representa una cantidad de dinero |
| **Resultado obtenido** | FALLO: VU-03: un booleano debe rechazarse como monto — el schema aceptó datos que debía rechazar; los parseó a {"accountId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","name":"V","amount":1} |
| **Estado** | ❌ **Fallido** |
| **Defecto asociado** | D-02 |
| **Duración** | 0 ms |

### VU-04 — Un monto negativo se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | amount = -1 |
| **Resultado esperado** | Rechaza con "El monto del bolsillo no puede ser negativo" |
| **Resultado obtenido** | Rechazó con amount: El monto del bolsillo no puede ser negativo |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1 ms |

### VU-05 — Un accountId que no es UUID se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | accountId = "abc" |
| **Resultado esperado** | Rechaza con "accountId debe ser un UUID válido" |
| **Resultado obtenido** | Rechazó con accountId: accountId debe ser un UUID válido |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-06 — Un nombre vacío se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | name = "" |
| **Resultado esperado** | Rechaza con "El nombre del bolsillo es obligatorio" |
| **Resultado obtenido** | Rechazó con name: El nombre del bolsillo es obligatorio |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-07 — Un nombre de solo espacios está vacío en la práctica y debe rechazarse

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | name = "   " |
| **Resultado esperado** | Rechaza: tres espacios no son un nombre |
| **Resultado obtenido** | FALLO: VU-07: un nombre de solo espacios debe rechazarse — el schema aceptó datos que debía rechazar; los parseó a {"accountId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","name":"   ","amount":1} |
| **Estado** | ❌ **Fallido** |
| **Defecto asociado** | D-03 |
| **Duración** | 0 ms |

### VU-08 — Valor límite superior del nombre: 150 caracteres se aceptan

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | name con 150 caracteres |
| **Resultado esperado** | Acepta, porque el máximo declarado es 150 |
| **Resultado obtenido** | Aceptó un nombre de 150 caracteres |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-09 — Valor límite superior del nombre: 151 caracteres se rechazan

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `createPocketSchema` |
| **Entrada** | name con 151 caracteres |
| **Resultado esperado** | Rechaza con "El nombre del bolsillo no puede superar 150 caracteres" |
| **Resultado obtenido** | Rechazó con name: El nombre del bolsillo no puede superar 150 caracteres |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-10 — Un cuerpo sin ningún campo se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `updatePocketSchema` |
| **Entrada** | {} |
| **Resultado esperado** | Rechaza con "Debes enviar al menos un campo para actualizar" |
| **Resultado obtenido** | Rechazó con (raíz): Debes enviar al menos un campo para actualizar |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1 ms |

### VU-11 — Una cadena numérica se coacciona igual que al crear (VU-02)

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `updatePocketSchema` |
| **Entrada** | amount = "500" |
| **Resultado esperado** | Acepta y coacciona a amount = 500, con el mismo criterio que createPocketSchema |
| **Resultado obtenido** | FALLO: VU-11: una cadena numérica debe coaccionarse igual que al crear — el schema rechazó datos que debía aceptar: amount: Invalid input: expected number, received string |
| **Estado** | ❌ **Fallido** |
| **Defecto asociado** | D-04 |
| **Duración** | 0 ms |

### VU-12 — Ajustar un bolsillo a cero es un cambio válido

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `updatePocketSchema` |
| **Entrada** | amount = 0 |
| **Resultado esperado** | Acepta con amount = 0 |
| **Resultado obtenido** | Aceptó y parseó a {"amount":0} |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-13 — Valor límite inferior: transferir cero se rechaza, a diferencia de ajustar

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `transferPocketSchema` |
| **Entrada** | amount = 0 |
| **Resultado esperado** | Rechaza con "El monto de transferencia debe ser mayor que cero" (condición gt(0)) |
| **Resultado obtenido** | Rechazó con amount: El monto de transferencia debe ser mayor que cero |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1 ms |

### VU-14 — Se admiten fracciones de peso

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `transferPocketSchema` |
| **Entrada** | amount = 0.01 |
| **Resultado esperado** | Acepta con amount = 0.01 |
| **Resultado obtenido** | Aceptó y parseó a {"fromPocketId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","toPocketId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","amount":0.01} |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### VU-15 — Un fromPocketId que no es UUID se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `transferPocketSchema` |
| **Entrada** | fromPocketId = "abc" |
| **Resultado esperado** | Rechaza con "fromPocketId debe ser un UUID válido" |
| **Resultado obtenido** | Rechazó con fromPocketId: fromPocketId debe ser un UUID válido |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

## Crear bolsillo

### CU-CR-01 — Un monto negativo corta el flujo antes de consultar la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | amount = -1 sobre la cuenta principal |
| **Resultado esperado** | Rechaza con INVALID_POCKET_AMOUNT (HTTP 400). Rama inalcanzable por HTTP |
| **Resultado obtenido** | Rechazó con INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo no puede ser negativo" · saldo intacto en $1.000.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 398 ms |

### CU-CR-02 — Una cuenta inexistente se rechaza tras consultar el repositorio

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | accountId = UUID válido pero inexistente |
| **Resultado esperado** | Rechaza con ACCOUNT_NOT_FOUND (HTTP 404) |
| **Resultado obtenido** | Rechazó con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 183 ms |

### CU-CR-03 — Un usuario que no es el dueño no puede crear bolsillos en la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | userId ajeno sobre la cuenta principal |
| **Resultado esperado** | Rechaza con FORBIDDEN (HTTP 403), por assertBelongsTo |
| **Resultado obtenido** | Rechazó con FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" · saldo intacto en $1.000.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 569 ms |

### CU-CR-04 — Valor límite: un peso por encima del disponible se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | amount = 1.000.001 con disponible 1.000.000 y reservado 0 |
| **Resultado esperado** | Rechaza con INSUFFICIENT_AVAILABLE_BALANCE (HTTP 400) |
| **Resultado obtenido** | Rechazó con INSUFFICIENT_AVAILABLE_BALANCE · HTTP 400 · "No tienes saldo disponible suficiente para crear este bolsillo" · se pidió $1.000.001 contra un disponible de $1.000.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 762 ms |

### CU-CR-05 — Camino principal: el bolsillo se crea y el monto se reserva

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | name = "Vacaciones", amount = 300.000, disponible 1.000.000 |
| **Resultado esperado** | Devuelve el bolsillo con amount 300.000 y deja el disponible en 700.000 y lo reservado en 300.000 |
| **Resultado obtenido** | Bolsillo "Vacaciones" por $300.000 · disponible $700.000 · reservado $300.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1307 ms |

### CU-CR-06 — El bolsillo creado queda realmente persistido y es recuperable por id

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute + SupabasePocketRepository` |
| **Entrada** | findById sobre el id devuelto en CU-CR-05 |
| **Resultado esperado** | El repositorio devuelve el bolsillo con los mismos nombre y monto |
| **Resultado obtenido** | Recuperado de la base: "Vacaciones" por $300.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 197 ms |

### CU-CR-07 — Se pueden acumular varios bolsillos en la misma cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | name = "Estudio", amount = 200.000, disponible 700.000 |
| **Resultado esperado** | Se crea el segundo bolsillo y el disponible baja a 500.000 |
| **Resultado obtenido** | Segundo bolsillo por $200.000 · disponible $500.000 · reservado $500.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1328 ms |

### CU-CR-08 — Una cuenta no operativa no admite bolsillos nuevos

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | Cuenta puesta en estado BLOQUEADA antes de la llamada |
| **Resultado esperado** | Rechaza con ACCOUNT_NOT_OPERATIONAL (HTTP 400) |
| **Resultado obtenido** | Rechazó con ACCOUNT_NOT_OPERATIONAL · HTTP 400 · "La cuenta no está disponible para generar bolsillos" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 560 ms |

### CU-CR-09 — Un bolsillo que cabe en el saldo disponible debe crearse aunque la cuenta ya tenga reservas

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `CreatePocket.execute` |
| **Entrada** | amount = 400.000 con disponible 500.000 y reservado 500.000 |
| **Resultado esperado** | Se crea el bolsillo, dejando el disponible en 100.000 y lo reservado en 900.000, porque 400.000 ≤ 500.000 disponibles |
| **Resultado obtenido** | FALLO: No tienes saldo disponible suficiente para crear este bolsillo |
| **Estado** | ❌ **Fallido** |
| **Defecto asociado** | D-05 |
| **Duración** | 752 ms |

## Actualizar bolsillo

### CU-AC-01 — Un nombre de solo espacios se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | name = "   " |
| **Resultado esperado** | Rechaza con INVALID_POCKET_NAME (HTTP 400) |
| **Resultado obtenido** | Rechazó con INVALID_POCKET_NAME · HTTP 400 · "El nombre del bolsillo no puede estar vacío" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### CU-AC-02 — Un monto negativo se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | amount = -100 |
| **Resultado esperado** | Rechaza con INVALID_POCKET_AMOUNT (HTTP 400). Rama inalcanzable por HTTP |
| **Resultado obtenido** | Rechazó con INVALID_POCKET_AMOUNT · HTTP 400 · "El monto del bolsillo no puede ser negativo" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### CU-AC-03 — Una actualización sin ningún campo se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | Ni name ni amount |
| **Resultado esperado** | Rechaza con NO_CHANGES_PROVIDED (HTTP 400). Rama inalcanzable por HTTP |
| **Resultado obtenido** | Rechazó con NO_CHANGES_PROVIDED · HTTP 400 · "No se proporcionaron cambios para el bolsillo" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 371 ms |

### CU-AC-04 — Un bolsillo inexistente se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | pocketId = UUID válido pero inexistente |
| **Resultado esperado** | Rechaza con POCKET_NOT_FOUND (HTTP 404) |
| **Resultado obtenido** | Rechazó con POCKET_NOT_FOUND · HTTP 404 · "Bolsillo no encontrado" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 185 ms |

### CU-AC-05 — Un usuario ajeno no puede modificar el bolsillo

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | userId ajeno sobre un bolsillo existente |
| **Resultado esperado** | Rechaza con FORBIDDEN (HTTP 403) |
| **Resultado obtenido** | Rechazó con FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" · monto intacto en $300.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 770 ms |

### CU-AC-06 — Aumentar el monto reserva más saldo de la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | amount = 600.000 sobre un bolsillo de 300.000, disponible 500.000 |
| **Resultado esperado** | El bolsillo queda en 600.000 y el disponible baja a 200.000 |
| **Resultado obtenido** | Monto $300.000 → $600.000 · disponible $200.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1328 ms |

### CU-AC-07 — Valor límite: se puede reservar exactamente el total de fondos de la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | amount = 800.000 con disponible 200.000 y reservado 800.000 |
| **Resultado esperado** | Acepta y deja el disponible en 0, porque la condición usa > estricto |
| **Resultado obtenido** | disponible $0 · reservado $1.000.000 · total $1.000.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1515 ms |

### CU-AC-08 — Valor límite: un peso por encima del total de fondos se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | amount = 800.001 con disponible 0 y reservado 1.000.000 |
| **Resultado esperado** | Rechaza con INSUFFICIENT_AVAILABLE_BALANCE (HTTP 400) |
| **Resultado obtenido** | Rechazó con INSUFFICIENT_AVAILABLE_BALANCE · HTTP 400 · "No tienes saldo disponible suficiente para ajustar este bolsillo" · el bolsillo sigue en $800.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 766 ms |

### CU-AC-09 — Disminuir el monto libera saldo y lo devuelve al disponible

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | amount = 300.000 sobre un bolsillo de 800.000, disponible 0 |
| **Resultado esperado** | El bolsillo queda en 300.000 y el disponible vuelve a 500.000 |
| **Resultado obtenido** | Monto $800.000 → $300.000 · disponible $0 → $500.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1310 ms |

### CU-AC-10 — Cambiar solo el nombre no toca el saldo de la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `UpdatePocket.execute` |
| **Entrada** | name = "Vacaciones 2026", sin amount |
| **Resultado esperado** | Cambia el nombre, conserva el monto y deja el disponible en 500.000 |
| **Resultado obtenido** | name = "Vacaciones 2026" · monto $300.000 · disponible intacto en $500.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1135 ms |

## Eliminar bolsillo

### CU-EL-01 — Un bolsillo inexistente se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `DeletePocket.execute` |
| **Entrada** | pocketId = UUID válido pero inexistente |
| **Resultado esperado** | Rechaza con POCKET_NOT_FOUND (HTTP 404) |
| **Resultado obtenido** | Rechazó con POCKET_NOT_FOUND · HTTP 404 · "Bolsillo no encontrado" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 184 ms |

### CU-EL-02 — Un usuario ajeno no puede eliminar el bolsillo

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `DeletePocket.execute` |
| **Entrada** | userId ajeno sobre un bolsillo existente |
| **Resultado esperado** | Rechaza con FORBIDDEN (HTTP 403) y el bolsillo sigue existiendo |
| **Resultado obtenido** | Rechazó con FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" · el bolsillo sigue en la base |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 564 ms |

### CU-EL-03 — Eliminar un bolsillo devuelve su monto al saldo disponible

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `DeletePocket.execute` |
| **Entrada** | Bolsillo de 200.000, disponible 500.000 |
| **Resultado esperado** | Devuelve el bolsillo borrado, el disponible sube a 700.000 y lo reservado baja a 300.000 |
| **Resultado obtenido** | Eliminado "Estudio" por $200.000 · disponible $500.000 → $700.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1549 ms |

### CU-EL-04 — Eliminar dos veces no vuelve a acreditar el monto

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `DeletePocket.execute` |
| **Entrada** | Mismo pocketId ya eliminado en CU-EL-03 |
| **Resultado esperado** | Rechaza con POCKET_NOT_FOUND (HTTP 404) y el disponible sigue en 700.000 |
| **Resultado obtenido** | Rechazó con POCKET_NOT_FOUND · HTTP 404 · "Bolsillo no encontrado" · disponible sin cambios en $700.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 560 ms |

## Transferir entre bolsillos

### CU-TR-01 — Transferir cero se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | amount = 0 |
| **Resultado esperado** | Rechaza con INVALID_TRANSFER_AMOUNT (HTTP 400). Rama inalcanzable por HTTP |
| **Resultado obtenido** | Rechazó con INVALID_TRANSFER_AMOUNT · HTTP 400 · "El monto de transferencia debe ser mayor que cero" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### CU-TR-02 — Origen y destino no pueden ser el mismo bolsillo

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | fromPocketId = toPocketId |
| **Resultado esperado** | Rechaza con INVALID_TRANSFER_TARGET (HTTP 400) |
| **Resultado obtenido** | Rechazó con INVALID_TRANSFER_TARGET · HTTP 400 · "Los bolsillos de origen y destino deben ser diferentes" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 0 ms |

### CU-TR-03 — Un bolsillo de origen inexistente se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | fromPocketId = UUID inexistente |
| **Resultado esperado** | Rechaza con SOURCE_POCKET_NOT_FOUND (HTTP 404) |
| **Resultado obtenido** | Rechazó con SOURCE_POCKET_NOT_FOUND · HTTP 404 · "Bolsillo de origen no encontrado" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 201 ms |

### CU-TR-04 — Un bolsillo de destino inexistente se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | toPocketId = UUID inexistente |
| **Resultado esperado** | Rechaza con TARGET_POCKET_NOT_FOUND (HTTP 404) |
| **Resultado obtenido** | Rechazó con TARGET_POCKET_NOT_FOUND · HTTP 404 · "Bolsillo de destino no encontrado" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 367 ms |

### CU-TR-05 — No se puede transferir entre bolsillos de cuentas distintas

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | Origen en la cuenta principal, destino en la cuenta secundaria |
| **Resultado esperado** | Rechaza con POCKETS_DIFFERENT_ACCOUNT (HTTP 400) |
| **Resultado obtenido** | Rechazó con POCKETS_DIFFERENT_ACCOUNT · HTTP 400 · "Los bolsillos deben pertenecer a la misma cuenta" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 382 ms |

### CU-TR-06 — Un usuario ajeno no puede mover dinero entre bolsillos de la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | userId ajeno sobre dos bolsillos válidos de la misma cuenta |
| **Resultado esperado** | Rechaza con FORBIDDEN (HTTP 403) |
| **Resultado obtenido** | Rechazó con FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" · origen intacto en $300.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 943 ms |

### CU-TR-07 — Valor límite: un peso más de lo que tiene el origen se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | amount = 300.001 sobre un origen de 300.000 |
| **Resultado esperado** | Rechaza con INSUFFICIENT_POCKET_BALANCE (HTTP 400) |
| **Resultado obtenido** | Rechazó con INSUFFICIENT_POCKET_BALANCE · HTTP 400 · "Saldo insuficiente en el bolsillo de origen" · se pidió $300.001 de un bolsillo con $300.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 750 ms |

### CU-TR-08 — Camino principal: mueve dinero entre reservas sin tocar el disponible

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | amount = 100.000, origen 300.000, destino 200.000 |
| **Resultado esperado** | El origen queda en 200.000, el destino en 300.000 y el disponible de la cuenta no cambia |
| **Resultado obtenido** | origen $300.000 → $200.000 · destino $200.000 → $300.000 · disponible intacto en $500.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1534 ms |

### CU-TR-09 — Valor límite: transferir el saldo completo del origen se acepta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `TransferPocketBalance.execute` |
| **Entrada** | amount = 200.000 sobre un origen de 200.000 |
| **Resultado esperado** | El origen queda en 0 y el destino en 500.000, porque la condición usa < estricto |
| **Resultado obtenido** | origen $0 · destino $500.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 1121 ms |

## Consultar bolsillos

### CU-CO-01 — Una cuenta inexistente se rechaza

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `GetAccountPockets.execute` |
| **Entrada** | accountId = UUID válido pero inexistente |
| **Resultado esperado** | Rechaza con ACCOUNT_NOT_FOUND (HTTP 404) |
| **Resultado obtenido** | Rechazó con ACCOUNT_NOT_FOUND · HTTP 404 · "Cuenta no encontrada" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 199 ms |

### CU-CO-02 — Un usuario ajeno no puede listar los bolsillos de la cuenta

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `GetAccountPockets.execute` |
| **Entrada** | userId ajeno sobre la cuenta principal |
| **Resultado esperado** | Rechaza con FORBIDDEN (HTTP 403), sin devolver ningún bolsillo |
| **Resultado obtenido** | Rechazó con FORBIDDEN · HTTP 403 · "No tienes permiso para acceder a esta cuenta" |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 182 ms |

### CU-CO-03 — Devuelve los bolsillos de la cuenta en su representación pública

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `GetAccountPockets.execute` |
| **Entrada** | Cuenta principal con dos bolsillos |
| **Resultado esperado** | Arreglo de 2 elementos, cada uno con exactamente id, accountId, name, amount, createdAt y updatedAt |
| **Resultado obtenido** | 2 bolsillos: Estudio=$500.000, Vacaciones 2026=$0 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 384 ms |

### CU-CO-04 — Una cuenta sin bolsillos devuelve un arreglo vacío, no un error

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `GetAccountPockets.execute` |
| **Entrada** | Cuenta sin depósito ni bolsillos |
| **Resultado esperado** | Devuelve [] con longitud 0 |
| **Resultado obtenido** | Arreglo vacío (longitud 0) |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 363 ms |

### CU-CO-05 — Tras crear, actualizar, eliminar y transferir, lo reservado más lo disponible sigue siendo lo depositado

| Campo | Contenido |
| --- | --- |
| **Unidad bajo prueba** | `Invariante de saldo` |
| **Entrada** | Cuenta principal al final de la corrida |
| **Resultado esperado** | disponible + reservado = 1.000.000, el depósito inicial |
| **Resultado obtenido** | disponible $500.000 + reservado $500.000 = $1.000.000 |
| **Estado** | ✅ **Aprobado** |
| **Duración** | 462 ms |

## Casos fallidos

### ❌ PU-06 — Entidad Pocket · construcción · defecto D-01

**Unidad:** `Pocket (constructor)`

**Entrada:** name = ""

**Esperado:** Lanza AppError INVALID_POCKET_NAME (HTTP 400), la misma regla que aplica updateName("")

**Obtenido:** FALLO: PU-06: un nombre vacío debe rechazarse al construir — no lanzó ninguna excepción; devolvió {"_id":"p1","_accountId":"a1","_name":"","_amount":100,"_createdAt":"2026-09-01T03:09:21.838Z","_updatedAt":"2026-09-01T03:09:21.838Z"}

### ❌ VU-03 — Schemas de validación · defecto D-02

**Unidad:** `createPocketSchema`

**Entrada:** amount = true

**Esperado:** Rechaza: un booleano no representa una cantidad de dinero

**Obtenido:** FALLO: VU-03: un booleano debe rechazarse como monto — el schema aceptó datos que debía rechazar; los parseó a {"accountId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","name":"V","amount":1}

### ❌ VU-07 — Schemas de validación · defecto D-03

**Unidad:** `createPocketSchema`

**Entrada:** name = "   "

**Esperado:** Rechaza: tres espacios no son un nombre

**Obtenido:** FALLO: VU-07: un nombre de solo espacios debe rechazarse — el schema aceptó datos que debía rechazar; los parseó a {"accountId":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","name":"   ","amount":1}

### ❌ VU-11 — Schemas de validación · defecto D-04

**Unidad:** `updatePocketSchema`

**Entrada:** amount = "500"

**Esperado:** Acepta y coacciona a amount = 500, con el mismo criterio que createPocketSchema

**Obtenido:** FALLO: VU-11: una cadena numérica debe coaccionarse igual que al crear — el schema rechazó datos que debía aceptar: amount: Invalid input: expected number, received string

### ❌ CU-CR-09 — Crear bolsillo · defecto D-05

**Unidad:** `CreatePocket.execute`

**Entrada:** amount = 400.000 con disponible 500.000 y reservado 500.000

**Esperado:** Se crea el bolsillo, dejando el disponible en 100.000 y lo reservado en 900.000, porque 400.000 ≤ 500.000 disponibles

**Obtenido:** FALLO: No tienes saldo disponible suficiente para crear este bolsillo


## Limpieza de la base de datos

La suite borra al terminar todo lo que creó, dejando la base como estaba.

| Tabla | Filas borradas |
| --- | ---: |
| `pockets` | 3 |
| `notifications` | 11 |
| `account_details` | 3 |
| `accounts` | 3 |

---

_Generado por `npm run test:unit`._
