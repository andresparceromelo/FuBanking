/**
 * CAJA BLANCA — Actualizar bolsillo (`handleSaveEdit`).
 *
 * Correspondencia nodo ↔ sentencia de `pocket.handlers.ts`:
 *   1  → decisión  !input.editingName.trim()
 *   3  → proceso   toast.warning("Nombre inválido") + return
 *   2  → proceso   setLoading(true)
 *   4  → proceso   pocketService.update(...)
 *   5  → decisión  ¿lanzó error?
 *   7  → proceso   catch: backendMessage(...)
 *   9  → proceso   toast.error("No fue posible actualizar el bolsillo")
 *   6  → proceso   setPockets(reemplazo) + setEditingPocketId(null)
 *   8  → proceso   toast.success("Bolsillo actualizado")
 *   10 → proceso   finally: setLoading(false)
 */

import { handleSaveEdit } from '../../features/pockets/handlers/pocket.handlers';
import { pocketService } from '../../features/pockets/services/pocket.service';
import type { PocketItem } from '../../features/pockets/services/pocket.service';
import {
  Escenario,
  UUID_INEXISTENTE,
  borrarBolsilloReal,
  crearBolsilloReal,
  registradorLista,
  registradorToast,
  registradorValor,
} from './support/entorno';
import { camino, verificar, verificarIgual } from './support/runner';

const FUNCIONALIDAD = 'Actualizar bolsillo';
const HANDLER = 'handleSaveEdit';

function contexto(listaInicial: PocketItem[] = []) {
  const toast = registradorToast();
  const pockets = registradorLista(listaInicial);
  const loading = registradorValor<boolean>();
  const editando = registradorValor<string | null>();

  return {
    toast,
    pockets,
    loading,
    editando,
    deps: {
      service: pocketService,
      toast: toast.api,
      setLoading: loading.set,
      setPockets: pockets.set,
      setEditingPocketId: editando.set,
    },
  };
}

export async function ejecutarCaminosActualizar(e: Escenario): Promise<void> {
  // ── Camino 1 — 1 → 3 → Fin ────────────────────────────────────────────────

  await camino(
    {
      id: 'FE-AC-C1',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1',
      secuencia: '1 → 3 → Fin',
      condiciones: ['N1 (!editingName.trim()) = VERDADERO'],
      entradas: ['input = { pocketId: cualquiera, editingName: "   ", editingAmount: "1000" }'],
      esperado:
        'Se emite el toast de advertencia "Nombre inválido" y la función retorna en el nodo 3: no se llama al servicio ni se sale del modo edición.',
    },
    async () => {
      const ctx = contexto();
      await handleSaveEdit(ctx.deps, {
        pocketId: UUID_INEXISTENTE,
        editingName: '   ',
        editingAmount: '1000',
      });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C1: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'warning', 'C1: el toast debe ser de advertencia');
      verificarIgual(ctx.toast.emitidos[0]!.titulo, 'Nombre inválido', 'C1: título del toast');
      verificarIgual(ctx.loading.historial.length, 0, 'C1: no debe tocarse el indicador de carga');
      verificarIgual(ctx.editando.historial.length, 0, 'C1: no debe salirse del modo edición');

      return `${ctx.toast.resumen()} · sigue en modo edición · setLoading no invocado`;
    },
  );

  // ── Camino 2 — el servicio falla ──────────────────────────────────────────

  await camino(
    {
      id: 'FE-AC-C2',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 2',
      secuencia: '1 → 2 → 4 → 5 → 7 → 9 → 10 → Fin',
      condiciones: ['N1 = FALSO', 'N5 (¿pocketService.update lanzó error?) = VERDADERO'],
      entradas: [
        'pocketId = UUID válido pero inexistente, para que el backend responda 404 POCKET_NOT_FOUND',
        'input = { editingName: "Nuevo nombre", editingAmount: "5000" }',
      ],
      esperado:
        'El catch (nodo 7) toma el mensaje del backend, el nodo 9 lo muestra en un toast de error, el finally (nodo 10) apaga el indicador de carga y se permanece en modo edición con el bolsillo sin cambios.',
    },
    async () => {
      const original: any = {
        id: UUID_INEXISTENTE,
        accountId: e.accountId,
        name: 'Original',
        amount: 1000,
        createdAt: '',
        updatedAt: '',
      };
      const ctx = contexto([original]);

      await handleSaveEdit(ctx.deps, {
        pocketId: UUID_INEXISTENTE,
        editingName: 'Nuevo nombre',
        editingAmount: '5000',
      });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C2: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'error', 'C2: el toast debe ser de error');
      verificarIgual(
        ctx.toast.emitidos[0]!.titulo,
        'No fue posible actualizar el bolsillo',
        'C2: título del toast',
      );
      verificar(
        (ctx.toast.emitidos[0]!.descripcion ?? '').length > 0,
        'C2: la descripción debe traer el mensaje del backend',
      );
      verificarIgual(ctx.pockets.llamadas, 0, 'C2: la lista no debe modificarse');
      verificarIgual(ctx.editando.historial.length, 0, 'C2: debe permanecerse en modo edición');
      verificarIgual(ctx.loading.historial.join(','), 'true,false', 'C2: la carga debe encenderse y apagarse');

      return `${ctx.toast.resumen()} · sigue editando · setLoading: ${ctx.loading.historial.join(' → ')}`;
    },
  );

  // ── Camino 3 — el servicio responde bien ──────────────────────────────────

  await camino(
    {
      id: 'FE-AC-C3',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 3',
      secuencia: '1 → 2 → 4 → 5 → 6 → 8 → 10 → Fin',
      condiciones: ['N1 = FALSO', 'N5 (¿lanzó error?) = FALSO'],
      entradas: [
        'Bolsillo real creado para el caso, con nombre "Editable" y monto $10.000',
        'input = { editingName: "  Editado  ", editingAmount: "20000" }',
      ],
      esperado:
        'El nombre se envía recortado con trim() y el monto convertido a número; el nodo 6 reemplaza el bolsillo en la lista y sale del modo edición, el nodo 8 muestra "Bolsillo actualizado" y el finally (nodo 10) apaga el indicador de carga.',
    },
    async () => {
      const real = await crearBolsilloReal(e.accountId, 'Editable', 10_000);
      const otro: any = {
        id: 'otro',
        accountId: e.accountId,
        name: 'Intacto',
        amount: 0,
        createdAt: '',
        updatedAt: '',
      };
      const ctx = contexto([real, otro]);

      try {
        await handleSaveEdit(ctx.deps, {
          pocketId: real.id,
          editingName: '  Editado  ',
          editingAmount: '20000',
        });

        verificarIgual(ctx.toast.emitidos.length, 1, 'C3: debe emitirse exactamente un toast');
        verificarIgual(ctx.toast.emitidos[0]!.tipo, 'success', 'C3: el toast debe ser de éxito');
        verificarIgual(ctx.toast.emitidos[0]!.titulo, 'Bolsillo actualizado', 'C3: título del toast');

        const actualizado = ctx.pockets.valor.find((p) => p.id === real.id);
        verificarIgual(actualizado?.name, 'Editado', 'C3: el nombre debe llegar recortado con trim()');
        verificarIgual(actualizado?.amount, 20_000, 'C3: el monto debe llegar convertido a número');
        verificarIgual(ctx.pockets.valor.length, 2, 'C3: la lista debe conservar su longitud');
        verificarIgual(
          ctx.pockets.valor.find((p) => p.id === 'otro')?.name,
          'Intacto',
          'C3: los demás bolsillos no deben tocarse',
        );
        verificarIgual(ctx.editando.ultimo, null, 'C3: debe salirse del modo edición');
        verificarIgual(
          ctx.loading.historial.join(','),
          'true,false',
          'C3: la carga debe encenderse y apagarse',
        );

        return (
          `${ctx.toast.resumen()} · bolsillo → "${actualizado?.name}" por ${actualizado?.amount} · ` +
          `setEditingPocketId(null) · setLoading: ${ctx.loading.historial.join(' → ')}`
        );
      } finally {
        await borrarBolsilloReal(real.id);
      }
    },
  );
}
