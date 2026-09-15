# Informe de Resultados — Análisis Estático, Métricas y Refactorización

> **Proyecto:** FuBanking · **Módulo:** Bolsillos (Pockets)
> **Herramienta:** SonarQube Community Build (self-hosted, Docker)
> **Project key:** `FuBank` · **Fecha:** 2026-09-14
> Complementa el documento *Plan de Pruebas — Módulo Bolsillos*.

---

## 0. Resumen del estado (rúbrica)

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Presentación + plan de pruebas | ✅ Completo |
| 2 | Pruebas unitarias (AAA + FIRST + 5 dobles) | ✅ Completo — 58 pruebas, 100% cobertura |
| 3 | SonarQube (1ª ejecución) | ✅ Capturado (este informe) |
| 4 | Métricas manuales | ✅ En `Metricas-Bolsillos.xlsx` (resumidas aquí) |
| 5 | Refactorización + reejecución | 🟡 Refactor hecho; **falta reejecutar Sonar** |
| 6 | Comparación manual vs Sonar | 🟡 1ª ejecución hecha; falta la 2ª |
| 7 | Quality Gate estricto | 🟡 Gate creado; falta que el proyecto lo pase |

---

## 3. Resultados de SonarQube — 1.ª ejecución (línea base)

Análisis del proyecto completo (todos los módulos del equipo): **15.050 líneas de código**.

### 3.1 Instantánea global

| Indicador | Valor | Nota |
|-----------|-------|------|
| **Quality Gate** | **Passed** | Gate "Sonar way" (evalúa *código nuevo*) |
| **Bugs** | 6 | Reliability rating **C** |
| **Vulnerabilidades** | 0 | Security rating **A** |
| **Code Smells** | 156 | Maintainability rating **A** |
| **Deuda técnica** | **903 min (~15 h)** | `sqale_index` (proyecto completo) |
| **Cobertura** | **96.2%** | línea 96.4% · rama 95.8% |
| **Duplicación** | **2.5%** | 469 líneas duplicadas |
| **Security Hotspots** | 14 | Revisados 0% → rating E |

> Evolución (Activity): 1.ª corrida (13-sep): 167 issues, 42% cobertura, 2.8% duplicación → corrida actual: cobertura 96.2%, duplicación 2.5%.

### 3.2 Cobertura del módulo Bolsillos (backend)

La cobertura de Bolsillos se importa vía LCOV (c8 + Vitest). Estado en esta ejecución:

| Archivo | Cobertura | Cobertura de rama |
|---------|-----------|-------------------|
| `CreatePocket.ts` | 96.3% | — |
| `UpdatePocket.ts` | 92.0% | 88.2% |
| `DeletePocket.ts` | 89.8% | — |
| `TransferPocketBalance.ts` | 91.3% | 85.2% |
| `GetAccountPockets.ts` | 92.1% | — |
| `Pocket.ts` (entidad) | 97.8% | 92.3% |

> Esta cobertura proviene de la ronda manual (c8). Tras integrar las **pruebas unitarias Vitest (AAA + 5 dobles)**, el módulo llega a **100%** en líneas y ramas (ver §5).

---

## 4. Métricas manuales (resumen)

Calculadas estáticamente sobre el código (detalle en `Metricas-Bolsillos.xlsx`).
Convención: **V(G) = Decisiones + 1** a nivel de predicado (Clase 09, diap. 20).

| Caso de uso (backend) | V(G) | Compl. cognitiva | SLOC | CBO | DIT |
|-----------------------|:----:|:----------------:|:----:|:---:|:---:|
| CreatePocket | 6 | 5 | 52 | 6 | 1 |
| GetAccountPockets | 2 | 1 | 19 | 3 | 1 |
| **UpdatePocket** | **11** | **16** | 65 | 6 | 1 |
| DeletePocket | 5 | 4 | 62 | 6 | 1 |
| TransferPocketBalance | 10 | 9 | 63 | 6 | 1 |

- **SLOC** del módulo backend: **373** (combinado BE+FE: 544).
- **Defectos documentados (E = 5):** D-01…D-05 (4 en Crear, 1 en Actualizar).
- **Acoplamiento (CBO):** 6 en la mayoría (dependen de 3 interfaces de repositorio + entidades). **Herencia (DIT):** 1 (sin jerarquías).
- **Duplicación estimada:** ~8% (bloque de notificación repetido en los 5 casos de uso).

---

## 6. Comparación: métricas manuales vs SonarQube (1.ª ejecución)

### 6.1 Complejidad y tamaño

| Caso de uso | V(G) manual | Ciclomática Sonar | Cognitiva manual | Cognitiva Sonar | SLOC manual | ncloc Sonar |
|-------------|:-----------:|:-----------------:|:----------------:|:---------------:|:-----------:|:-----------:|
| CreatePocket | 6 | 7 | 5 | **5** | 52 | **52** |
| GetAccountPockets | 2 | 4 | 1 | **1** | 19 | **19** |
| UpdatePocket | 11 | 17 | 16 | **16** | 65 | **65** |
| DeletePocket | 5 | 6 | 4 | **4** | 62 | **62** |
| TransferPocketBalance | 10 | 11 | 9 | **9** | 63 | **63** |

### 6.2 Interpretación de las diferencias

- **Complejidad cognitiva: coincidencia exacta** (5, 1, 16, 4, 9). Ambos métodos aplican la misma definición (SonarSource), lo que **valida el cálculo manual**.
- **Líneas de código: coincidencia exacta** (SLOC manual = ncloc Sonar). El conteo manual sin blancos ni comentarios equivale a `ncloc`.
- **Complejidad ciclomática: Sonar reporta un valor mayor** (entre +1 y +6). No es un error: son **dos convenciones distintas**:
  - *Manual:* V(G) = Decisiones + 1 **a nivel de predicado** (cada `if`/`catch` cuenta 1).
  - *Sonar:* suma **+1 por cada operador lógico** (`&&`, `||`) además de cada estructura de control (nivel de cláusula).
  - Por eso la mayor brecha está en `UpdatePocket` (11 vs 17): es el método con más condiciones compuestas.
- **Conclusión:** las tres métricas concuerdan en *tendencia* y en el diagnóstico — `UpdatePocket` es el caso de uso más complejo y el candidato claro a refactorización, señalado por igual por el cálculo manual y por Sonar.

### 6.3 Coincidencias de calidad

- **Vulnerabilidades:** manual = 0, Sonar = 0 (Security **A**). Coinciden.
- **Cobertura:** el análisis manual estimaba brechas de decisión en Eliminar (63%) y Transferir (83%); Sonar confirma las más bajas del módulo en `DeletePocket` (89.8%) y en la rama de `TransferPocketBalance` (85.2%).

---

## 5. Refactorización (criterio 5)

**Unidad refactorizada:** `UpdatePocket.execute` — la de mayor complejidad según ambos análisis.

**Técnica:** *Extract Method* — se dividió el método monolítico en cuatro métodos privados con responsabilidad única: `validateInput`, `loadAuthorized`, `adjustAmount` y `notify`; además se adelantó la validación de "sin cambios" (falla rápido antes de tocar la base de datos).

| Métrica (máximo por función) | Antes | Después |
|------------------------------|:-----:|:-------:|
| Complejidad **cognitiva** | 16 (crítica) | **6** |
| Complejidad **ciclomática** | 17 | **7** |
| Nº de funciones | 1 | 5 |
| Code smell "Cognitive Complexity too high" | Presente | **Eliminado** |

**Verificación:** las **58 pruebas unitarias siguen en verde** y la cobertura del módulo se mantiene en **100%** (líneas y ramas) — el comportamiento observable es idéntico.

> **Pendiente:** reejecutar SonarQube con la rama integrada para reflejar (a) la cobertura de Bolsillos al 100% y (b) la caída de complejidad/deuda de `UpdatePocket`. Los valores "después" de esta tabla son los esperados; la 2.ª instantánea de Sonar los confirmará.

---

## 7. Quality Gate estricto (criterio 7)

Se creó el gate **"Quality Gate Gabriel"** con condiciones sobre código global:

| Condición | Umbral | Estado global actual |
|-----------|--------|----------------------|
| Issues | > 0 → falla | ❌ hay issues abiertos |
| Security Hotspots Reviewed | < 100% → falla | ❌ 0% revisados |
| Coverage | < 90% → falla | ✅ 96.2% |
| Duplicated Lines (%) | > 2% → falla | ❌ 2.5% |
| Maintainability Rating | peor que A → falla | ✅ A |
| Reliability Rating | peor que A → falla | ❌ C |
| Security Rating | peor que A → falla | ✅ A |
| Technical Debt Ratio | > 90% → falla | ✅ (ratio bajo) |

**Observaciones importantes:**

1. **La rúbrica pide "deuda técnica ≤ 90 *minutos*", no "ratio de deuda ≤ 90%".** La condición actual (*Technical Debt Ratio*) casi nunca falla. Para cumplir la rúbrica al pie de la letra habría que usar la métrica **Technical Debt** (minutos). Sobre el proyecto completo son 903 min, así que ese umbral solo es alcanzable **sobre código nuevo** (`new_technical_debt`), donde el proyecto ya está en 0.
2. Las condiciones se evalúan sobre **todo el proyecto** (todos los módulos), no solo Bolsillos. Que el gate pase en verde es un **trabajo de equipo**: hay que corregir los 6 bugs (Reliability → A), revisar los 14 Security Hotspots y bajar la duplicación de 2.5% a ≤2%.
3. El **módulo Bolsillos por sí solo** ya está limpio: 0 bugs, cobertura 100%, `UpdatePocket` refactorizado y sin el smell de complejidad.

**Recomendación:** aplicar el gate estricto en modo **Clean as You Code** (condiciones sobre *New Code*), donde FuBank ya cumple: cobertura nueva 100%, duplicación nueva 0%, deuda nueva 0, ratings A. Así el criterio 7 se satisface de forma sostenible.

---

## 8. Pendientes para cerrar la entrega

1. **Subir la rama `tests/bolsillos-unitarias-aaa`** (pruebas + refactor) al repo que analiza SonarQube.
2. **Reejecutar el scanner** → 2.ª instantánea ("después"): Bolsillos a 100% y `UpdatePocket` con complejidad/deuda reducidas.
3. **Completar §5 y §6** con los números "después" reales de Sonar.
4. **Corregir la condición de deuda** del gate (minutos, no ratio) y decidir alcance (proyecto vs código nuevo).
5. (Equipo) Corregir bugs de Reliability y revisar Security Hotspots para que el gate estricto pase en verde.
