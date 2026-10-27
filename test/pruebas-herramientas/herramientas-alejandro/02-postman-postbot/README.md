# Postman + Postbot — API de Bolsillos y Depositar

**Postbot** es el asistente de IA de Postman: escribe pruebas (`pm.test`), las corrige cuando fallan,
documenta requests y visualiza respuestas a partir de instrucciones en lenguaje natural. **Newman** ejecuta la
misma colección desde la terminal o el pipeline.

## Archivos

| Archivo | Contenido |
|---|---|
| `FuBanking-Bolsillos.postman_collection.json` | 31 requests en 7 carpetas (preparación + 6 funcionalidades). Cada request trae **objetivo** y **resultado esperado** en su descripción. |
| `FuBanking-local.postman_environment.json` | `baseUrl = http://localhost:3001/api/v1` |
| `run-newman.mjs` | Corre la colección con Newman y deja `evidence/newman-report.html` (htmlextra), `.json` y `junit.xml`. |

## Cobertura

| Carpeta | Casos | Tipos de prueba |
|---|---|---|
| 00 Preparación | 2 clientes (Ana y Bruno), cuentas, saldo y un bolsillo ajeno | — |
| 01 Crear bolsillo | CB-01 … CB-07 | Exitoso, validación, valor frontera (saldo + 1), regresión DEF-001, sin token (401) |
| 02 Consultar | CO-01, CO-02 | Esquema JSON, pertenencia, IDOR (403) |
| 03 Editar | ED-01 … ED-03 | Renombrar, ajustar contra la cuenta, frontera |
| 04 Transferir | TR-01 … TR-03 | Exitoso, frontera, origen = destino |
| 05 Eliminar | EL-01, EL-02 | Bolsillo ajeno (403), devolución del saldo |
| 06 Depositar | DE-01 … DE-07 | Exitoso, 0, negativo, tipos inválidos (`"abc"`, `true`, `null`), cuenta ajena (403) |

Además de mirar la respuesta, cada caso que cambia dinero consulta el **estado real** con `pm.sendRequest`
(saldo de la cuenta y bolsillos). Un script global verifica en todos los requests que la respuesta llega
en menos de 5 s y trae el sobre `success`.

## Uso de Postbot (IA)

1. Importar la colección y el entorno en Postman y elegir el entorno **FuBanking local**.
2. Correr **00 Preparación** para que existan los clientes y las variables.
3. Pedirle a Postbot, y guardar captura de cada respuesta en `evidence/postbot/`:
   - En **CO-01**: *"Add tests to this request"* → comparar lo que propone con las aserciones existentes.
   - En **TR-01**: *"Write a test that checks the pockets balances after the transfer"*.
   - En **DE-04**: *"Fix test"* tras cambiar a propósito el código esperado → ver cómo explica y corrige el fallo.
   - En la colección: *"Generate documentation"*.
   - En **CO-01**: *"Visualize response as a table"*.
4. Exportar la colección (Collection v2.1) encima de `FuBanking-Bolsillos.postman_collection.json`.

> Postbot vive en la app de Postman y necesita la cuenta del usuario; Newman no (corre en local y en CI).

## Ejecución

```bash
npm run test:postman:bolsillos
```

## Resultado (2026-10-26, backend local + Supabase real)

| Métrica | Valor |
|---|---|
| Casos (requests de la colección) | 31 |
| Peticiones HTTP (casos + consultas de oráculo con `pm.sendRequest`) | 49 |
| Aserciones | **136 / 136 correctas** |
| Tiempo total | 34 s · respuesta media 656 ms (máx. 2,6 s) |

La primera corrida dio 134/136. Las 2 fallas eran **de la prueba**, no del producto: la cuenta devuelve
`accountType`, no `type`. Se corrigió la aserción y la segunda corrida quedó en 136/136.

Evidencias: `evidence/newman-report.html` (htmlextra), `evidence/newman-report.json`, `evidence/newman-junit.xml`.
Las capturas de Postbot van en `evidence/postbot/` (las toma el usuario en la app de Postman).
