# Informe de Ejecución: Pruebas con Stagehand e Inteligencia Artificial

**Módulo**: Créditos y Préstamos (`FuBanking`)  
**Fecha de Ejecución**: 24/10/2026, 1:00:51 p. m.  
**Estrategia LLM**: Model Routing en Google AI Studio (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`)  
**Modo de Visualización**: Navegador interactivo (`headless: false`)

---

## Resultados por Escenario

| # | Escenario | Capacidades | Estado | Duración |
|---|---|---|---|---|
| 1 | Simulador de Créditos | `act` + `extract` | ✅ APROBADO | 12.69s |
| 2 | Requisitos Normativos | `observe` | ✅ APROBADO | 8.93s |
| 3 | Auditoría y Aprobación Admin | `act` + `observe` + `extract` | ✅ APROBADO | 15.03s |

---

## Evidencias Visuales Generadas

* `01-simulador-inicio.png`: Estado inicial de la pantalla de simulación.
* `01-simulador-calculado.png`: Simulación ejecutada por la IA tras ingresar monto y cuotas.
* `02-requisitos-vista.png`: Detección visual de requisitos de elegibilidad.
* `02-requisitos-observados.png`: Registro de elementos observados en el DOM.
* `03-admin-bandeja-inicial.png`: Vista de consola de auditoría de solicitudes.
* `03-admin-filtrado-pendientes.png`: Aplicación del filtro 'Pendientes' por acción natural.
* `03-admin-actualizado.png`: Refresco de la bandeja tras auditoría.

---

## Estrategia de Model Routing Aplicada

```txt
[Model Routing] Act (clicks, digitación)  --> gemini-3.5-flash-lite (Latencia mínima)
[Model Routing] Observe (visión semántica) --> gemini-3.5-flash      (Razonamiento DOM)
[Model Routing] Extract (esquemas Zod)     --> gemini-3.8-flash      (Extracción estructurada estricta)
```
