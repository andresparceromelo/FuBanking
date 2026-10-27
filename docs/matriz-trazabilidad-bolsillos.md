# Matriz de trazabilidad — Bolsillos y Depositar

**Responsable:** Stiven Alejandro Bustamante · **Fecha de ejecución:** 2026-10-26  
**Libro completo:** [`_archive/matriz-trazabilidad-bolsillos.xlsx`](_archive/matriz-trazabilidad-bolsillos.xlsx) (hojas *Leyenda*, *Matriz de Trazabilidad*, *Cobertura por Requisito* y *Defectos*). La matriz de todo el equipo está en [`matriz-trazabilidad-equipo.md`](matriz-trazabilidad-equipo.md).

Cada fila relaciona **requisito → funcionalidad → escenario → caso de prueba → herramienta → resultado esperado → resultado obtenido → estado → evidencia → defecto**. Las filas salen de los reportes reales de ejecución (Cypress, Serenity/JS, Newman, Keploy, Stagehand, Vitest) y de los casos TC-101…152 del Excel; la cobertura del libro se calcula con `COUNTIFS`.

## Cobertura por requisito

| Requisito | Funcionalidad | Cypress + Gherkin | Keploy | Manual + Katalon | Playwright Test Agents | Postman + Newman | Serenity/JS Screenplay + Gherkin | Stagehand | Vitest · performance | Vitest · regresión + unitarias | Vitest · seguridad | Total | Aprobados | % | Defectos |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HU-23 | Crear bolsillo | 7 | 8 | 11 | 2 | 7 | 7 | 1 | 0 | 2 | 0 | 45 | 45 | 100 % | 1 |
| HU-24 | Consultar bolsillos | 6 | 6 | 7 | 2 | 2 | 4 | 1 | 0 | 1 | 0 | 29 | 29 | 100 % | 1 |
| HU-24 | Editar bolsillo | 5 | 3 | 9 | 2 | 3 | 5 | 1 | 0 | 2 | 0 | 30 | 30 | 100 % | 0 |
| HU-25 | Eliminar bolsillo | 4 | 2 | 6 | 2 | 2 | 3 | 1 | 0 | 2 | 0 | 22 | 22 | 100 % | 0 |
| HU-26 | Transferir entre bolsillos | 5 | 3 | 8 | 2 | 3 | 5 | 1 | 0 | 2 | 0 | 29 | 29 | 100 % | 0 |
| EXTRA | Depositar dinero | 13 | 9 | 11 | 2 | 7 | 12 | 1 | 0 | 2 | 0 | 57 | 57 | 100 % | 0 |
| — | Transversal (entidades, validadores, seguridad) | 0 | 19 | 0 | 0 | 0 | 0 | 0 | 2 | 9 | 5 | 35 | 35 | 100 % | 0 |
| | **Total** | **40** | **50** | **52** | **12** | **24** | **36** | **6** | **2** | **20** | **5** | **247** | **247** | **100 %** | **2** |

Las filas de Vitest son por archivo de prueba (cada una agrupa varias pruebas); el resto son casos o escenarios individuales.

## Defectos y su trazabilidad

| ID | Descripción | Requisito | Detectado por | Estado | Corrección |
|---|---|---|---|---|---|
| DEF-001 (D-01/D-03) | Bolsillo con nombre de solo espacios (el saldo ya se había descontado) | HU-23 | TC-110 (Katalon), RG-CR-D03 | Corregido | R-07 · `b366dbf` |
| DEF-002 | Consulta con varios bolsillos marcada Fallido en la matriz original | HU-24 | TC-113 | No reproducido | Re-prueba 2026-08-24 y Gherkin aprobados |
| D-02 / SEC-03 | Crear bolsillo con `true` como monto | HU-23 | RG-CR-D02, seguridad | Corregido | R-06 · `cabb874` |
| D-08 / SEC-04 | Depositar `true` deposita $1 | EXTRA | RG-DE-D08, @seguridad | Corregido | R-06 · `cabb874` |
| SEC-01 / SEC-02 | Token de 2FA temporal y de reset aceptados como acceso | Transversal | Suite de seguridad | Corregido | R-05 · `cabb874` |
| E2E-01 | Sin "Recordarme" la API no enviaba el token | Transversal | Serenity @web | Corregido (equipo) | R-09 · `365171d` |
| UI-01 | Hydration mismatch del tema borraba lo escrito en el login | Transversal | Katalon | Corregido | R-08 · `8ff70c1` |
| A11Y-01…06 | Contraste, botones sin nombre, nombre accesible y textos invisibles en tema claro | HU-23…26, EXTRA | Cypress `accesibilidad.feature` (axe) | Corregido | R-10 · esta entrega |
| BUILD-01 | El backend no compilaba (`ws` sin tipos): rompía Docker y Jenkins | Transversal | Build de la imagen | Corregido | R-11 · esta entrega |
| D-04 | `amount` como texto: se acepta al crear y se rechaza al actualizar | HU-24 | RG-AC-D04 | Abierto | `it.fails`; recomendado `strictAmount` |
| D-05 | Al crear un bolsillo lo apartado se cuenta dos veces | HU-23 | RG-CR-D05 | Abierto | `it.fails` |
| D-07 | Tabla `pockets` ausente: bolsillos en un `Map` en memoria | HU-23…26 | Revisión de código; confirmado por Keploy | Abierto | Migración recomendada |
| SEC-05…08 | Sin tope de monto, JSON malformado y cuerpos grandes → 500, sin rate limiting | Transversal | Seguridad (endurecimiento) | Abierto | `it.fails` |

Detalle del antes y después de cada corrección: [`refactorizacion-bolsillos-antes-despues.md`](refactorizacion-bolsillos-antes-despues.md).
