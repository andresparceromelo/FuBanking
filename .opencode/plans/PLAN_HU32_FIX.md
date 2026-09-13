# Plan de Corrección HU-32: Rechazo de Solicitud (Admin)

## Resumen Ejecutivo
**Objetivo:** Corregir los 9 diagramas de HU-32 (Rechazo de Solicitud) para que tengan estructura lógica impecable y consistencia entre FE, BE e INT.

## Estado Actual: 🔴 CRÍTICO - 9 diagramas con errores críticos

---

## Plan de Corrección por Fases

---

### FASE 1: Corrección de Lógica de Negocio (Backend) - PRIORIDAD CRÍTICA

#### 1.1 BE Flow - HU-32_BE_flow.md
**Archivo:** `diagramas_output/HU-32_BE_flow.md`
**Problema:** Lógica genérica con SideEff, no modela rechazo específico

**Correcciones requeridas:**
- [ ] Remover `SideEff` genérico
- [ ] Agregar validaciones específicas: Rol admin (403), Estado PENDING (409), Motivo obligatorio (422)
- [ ] Modelar transición: PENDING → REJECTED
- [ ] Modelar: Guardar motivo rechazo
- [ ] Modelar: AsyncNotif con motivo
- [ ] Remover: Crear Cuenta (no aplica a rechazo)
- [ ] Modelar respuestas: 200 OK, 400, 403, 409, 422, 500

#### 1.2 BE Graph - HU-32_BE_graph.md  
**Archivo:** `diagramas_output/HU-32_BE_graph.md`
**Problema:** Nodo n7 referenciado pero no existe (n6 → n7)

**Correcciones:**
- [ ] Agregar nodo n7 faltante
- [ ] Agregar nodos de decisión: Validar rol admin, Validar estado PENDING, Validar motivo
- [ ] Modelar transiciones correctas con códigos de error: 403, 409, 422
- [ ] Agregar nodo de transición a REJECTED
- [ ] Agregar nodo de notificación async
- [ ] Eliminar nodos de "Crear Cuenta" (no aplica a rechazo)

#### 1.3 BE Paths - HU-32_BE_paths.md
**Archivo:** `diagramas_output/HU-32_BE_paths.md`
**Problema:** Paths genéricos, no específicos de rechazo

**Nuevos Paths requeridos:**
- [ ] P1: Happy Path - Rechazo exitoso (200 OK)
- [ ] P2: Error 403 - No admin
- [ ] P3: Error 409 - Estado ≠ PENDING
- [ ] P4: Error 422 - Motivo vacío
- [ ] P5: Error 409 - Intento modificar APPROVED
- [ ] P6: Error 409 - Intento modificar REJECTED
- [ ] P6: Error 400 - Payload inválido
- [ ] P7: Error 422 - Reglas negocio fallan

---

### FASE 2: Corrección de Frontend (FE)

#### 2.1 FE Graph - HU-32_FE_graph.md
**Archivo:** `diagramas_output/HU-32_FE_graph.md`
**Problema:** Nodo n6 referenciado pero no existe (solo n1-n5)

**Correcciones:**
- [ ] Agregar nodo n6 faltante
- [ ] Agregar nodo de decisión "Confirmar rechazar?"
- [ ] Agregar nodo "Ingresar motivo obligatorio"
- [ ] Corregir edges para que apunten a nodos existentes

#### 2.2 FE Paths - HU-32_FE_paths.md
**Archivo:** `diagramas_output/HU-32_FE_paths.md`

**Problema:** Nodos inconsistentes con Flow (usan ValForm/ValReq vs ListaPendientes/Detalle/IngresarMotivo/Confirmar)

**Nuevos Paths requeridos:**
- P1: ListaPendientes → Detalle → IngresarMotivo → Confirmar → CallAPI → RespAPI → RenderOK
- P2: ... → RenderErr (403 - No admin)
- P3: ... → RenderErr (409 - Estado ≠ PENDING)
- P4: ... → RenderErr (422 - Motivo vacío)
- P5: ... → RenderErr (404 - No encontrado)
- P5: Error validación formulario

---

### FASE 3: Corrección Integración (INT)

#### 3.1 INT Flow - HU-32_INT_flow.md
**Archivo:** `diagramas_output/HU-32_INT_flow.md`
**Problema:** Crea "Cuenta" (aprobación), no modela rechazo

**Correcciones:**
- [ ] Eliminar "Crear Cuenta" de side effects
- [ ] Modelar: FE → BE(Validar + Rechazar) → AsyncNotif(motivo) → Resp → FE → Render
- [ ] No transacción distribuida (no hay cuenta que crear)
- [ ] Solo notificación async con motivo

#### 3.2 INT Graph - HU-32_INT_graph.md
**Archivo:** `diagramas_output/HU-32_INT_graph.md`
**Problema:** n4 referenciado pero no existe (n3 → n4)

**Correcciones:**
- [ ] Eliminar nodos de "Crear Cuenta" y "Transaccionalidad distribuida"
- [ ] Agregar nodo de decisión "¿Respuesta?" con ramas 200/4xx/5xx
- [ ] Modelar: FE → BE(Validar+Rechazar) → AsyncNotif → Resp → FE → Render
- [ ] Agregar nodo decisión respuesta con ramas 200/4xx/5xx

#### 3.3 INT Paths - HU-32_INT_paths.md
**Archivo:** `diagramas_output/HU-32_INT_paths.md`

**Nuevos Paths INT requeridos:**
- P1: FE → BE(Validar+Rechazar) → AsyncNotif → Resp(200) → FE → RenderOK
- P2: ... → Error(403/409/422) → RenderErr
- P5: Error HTTP 4xx/5xx

---

### FASE 4: Regeneración y Exportación

#### 4.1 Actualizar generador (generate_diagrams.py)
- [ ] Agregar caso `is_rechazo` en `gen_flow()` para FE, BE, INT
- [ ] Agregar caso `is_rechazo` en `gen_graph()` para FE, BE, INT
- [ ] Agregar caso `is_rechazo` en `gen_paths()` para FE, BE, INT
- [ ] Agregar mapeo de nodos específicos para rechazo

#### 4.2 Regenerar todos los diagramas
- [ ] Ejecutar `python generate_diagrams.py`
- [ ] Ejecutar `python export_diagrams.py`

#### 4.3 Verificar exports
- [ ] Verificar 9 archivos .png generados
- [ ] Verificar 9 archivos .svg generados
- [ ] Validar que no hay errores de Mermaid

---

## Checklist de Verificación Final

### Validación de Consistencia
- [ ] FE Flow nodos coinciden con FE Graph nodos
- [ ] FE Graph nodos coinciden con FE Paths nodos
- [ ] BE Flow nodos coinciden con BE Graph nodos
- [ ] BE Graph nodos coinciden con BE Paths nodos
- [ ] INT Flow nodos coinciden con INT Graph nodos
- [ ] INT Graph nodos coinciden con INT Paths nodos
- [ ] FE/BE/INT Flow/Graph/Paths cubren todos los TCs (TC025-TC028)
- [ ] No referencias a nodos inexistentes
- [ ] No lógica de "Crear Cuenta" en rechazo
- [ ] No SideEff genérico en BE
- [ ] No transacción distribuida en INT

### Validación de TCs (TC025-TC028)
- [ ] TC025: Rechazo Exitoso - Cubierto en FE/BE/INT
- [ ] TC026: Rechazo Exitoso (detalle) - Cubierto
- [ ] TC027: Modificar APPROVED - Cubierto (409)
- [ ] TC028: Modificar REJECTED - Cubierto (409)

---

## Orden de Ejecución Recomendado

```
1. BACKEND (BE) - Base de toda la lógica
   1.1 generate_diagrams.py: gen_flow BE rechazo
   1.2 generate_diagrams.py: gen_graph BE rechazo
   1.3 generate_diagrams.py: gen_paths BE rechazo
   
2. FRONTEND (FE) - Depende de BE
   2.1 FE graph (fix n6)
   2.2 FE paths (align con flow)
   
3. INTEGRACIÓN (INT) - Depende de FE y BE
   3.1 INT flow (sin Cuenta, solo notif)
   3.2 INT graph (fix n4)
   3.2 INT paths

4. REGENERACIÓN
   4.1 python generate_diagrams.py
   4.2 python export_diagrams.py

5. VALIDACIÓN FINAL
   - Verificar 9 archivos .png/.svg
   - Validar que no hay errores de Mermaid
   - Verificar consistencia cross-capa
```

---

## Notas de Recuperación (si crashea)

**Si crashea durante ejecución:**
1. Verificar `diagramas_output/HU-32_*.md` existen
2. Verificar `generate_diagrams.py` compila
3. Continuar desde última fase completada
4. Los archivos .md son la fuente de verdad
4. Los .png/.svg se regeneran con `export_diagrams.py`

**Archivos clave a proteger:**
- `generate_diagrams.py` (generador)
- `diagramas_output/HU-32_*.md` (fuente de verdad)
- `PLAN_HU32_FIX.md` (este plan)

---

**Estado:** Plan listo para ejecución
**Próximo paso:** Usuario confirma → Iniciar Fase 1 (BE)