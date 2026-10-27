# Pruebas de Rendimiento (Performance) — Enfoque Híbrido

Estrategia de rendimiento estructurada en dos niveles:

## Nivel 1: Rendimiento en Pipeline / Evaluación (100% Vitest, sin herramientas externas)
Equivalente estricto a `performance-testing/` del repositorio del profesor.
- **Sin backend vivo**: corre en memoria con repositorios fake y app Express en memoria.
- **Sin herramientas externas**: no requiere k6, Locust ni JMeter.
- **Criterio**: Presupuestos explícitos en ms (`< 500ms`, `< 150ms`, `< 20ms`), cálculo de mediana (p50) y percentil 95 (p95), además de regresión numérica funcional (`toBeCloseTo`).

```bash
npm run test:performance         # desde la raíz o backend/
```

| Archivo | Módulo | Qué cubre |
|---|---|---|
| `loan.performance.test.ts` | **Créditos** | 1) Fórmula francesa pura (mediana de 5 < 500ms)<br>2) Latencia de endpoints `/simulate` y `/me`<br>3) Ráfaga concurrente de 20 peticiones simultáneas (p95 < 500ms) |
| `auth.performance.test.ts` | **Autenticación** | Firma y verificación de 1.000 JWTs bajo presupuesto (<150ms) |
| `pocket.performance.test.ts` | **Bolsillos** | 100 transferencias en memoria con validaciones de saldo (<20ms) |
| `pocket/bolsillos.performance.test.ts` | **Bolsillos** | Tiempos de respuesta HTTP y p95 en las 5 operaciones |
| `card.performance.test.ts` | **Tarjetas** | 1.000 generaciones criptográficas de números, CVVs y expiración (<20ms) |

---

## Nivel 2: Carga y Estrés de Grado Producción (Grafana k6 - Opcional / Industria)
Para pruebas de estrés concurrentes con usuarios virtuales reales contra un backend desplegado.

```bash
# Requiere backend corriendo en :3001 + variable FUBANKING_JWT
k6 run scripts/performance/loans-load.js

# O desde la raíz:
npm run test:load:k6
```

- **Ubicación**: `scripts/performance/loans-load.js`
- **Configuración**: 20 Virtual Users (VUs) durante 30s.
- **SLO**: `http_req_duration p(95) < 500ms`, tasa de error < 1%.
