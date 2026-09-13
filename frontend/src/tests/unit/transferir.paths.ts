/**
 * CAJA BLANCA — Transferir entre bolsillos (`handleTransfer`).
 *
 * Correspondencia nodo ↔ sentencia de `pocket.handlers.ts`:
 *   1  → decisión  !fromPocketId || !toPocketId || !transferAmount
 *   3  → proceso   toast.warning("Falta información") + return
 *   2  → proceso   setLoading(true)
 *   4  → proceso   pocketService.transfer(...)
 *   5  → decisión  ¿lanzó error?
 *   7  → proceso   catch: backendMessage(...)
 *   9  → proceso   toast.error("No fue posible transferir el saldo")
 *   6  → proceso   toast.success("Transferencia realizada")
 *   8  → proceso   await loadPockets()
 *   10 → proceso   finally: setLoading(false)
 */

import { handleTransfer } from '../../features/pockets/handlers/pocket.handlers';
import { pocketService } from '../../features/pockets/services/pocket.service';
import {
  Escenario,
  UUID_INEXISTENTE,
  borrarBolsilloReal,
  crearBolsilloReal,
  registradorToast,
  registradorValor,
} from './support/entorno';
import { camino, verificar, verificarIgual } from './support/runner';

const FUNCIONALIDAD = 'Transferir entre bolsillos';
const HANDLER = 'handleTransfer';

function contexto() {
  const toast = registradorToast();
  const loading = registradorValor<boolean>();
  /** Cuenta cuántas veces el handler pidió recargar la lista (nodo 8). */
  const recargas = { veces: 0 };

  return {
    toast,
    loading,
    recargas,
    deps: {
      service: pocketService,
      toast: toast.api,
      setLoading: loading.set,
      loadPockets: async () => {
        recargas.veces += 1;
      },
    },
  };
}

export async function ejecutarCaminosTransferir(e: Escenario): Promise<void> {

  await camino(
    {
      id: 'FE-TR-C1',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1',
      secuencia: '1 → 3 → Fin',
      condiciones: [
        'N1 (!fromPocketId || !toPocketId || !transferAmount) = VERDADERO — no se eligió bolsillo destino',
      ],
      entradas: ['input = { fromPocketId: "origen", toPocketId: "", transferAmount: "1000" }'],
      esperado:
        'Se emite el toast de advertencia "Falta información" y la función retorna en el nodo 3: no se llama al servicio ni se recarga la lista.',
    },
    async () => {
      const ctx = contexto();
      await handleTransfer(ctx.deps, {
        fromPocketId: 'origen',
        toPocketId: '',
        transferAmount: '1000',
      });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C1: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'warning', 'C1: el toast debe ser de advertencia');
      verificarIgual(ctx.toast.emitidos[0]!.titulo, 'Falta información', 'C1: título del toast');
      verificarIgual(ctx.loading.historial.length, 0, 'C1: no debe tocarse el indicador de carga');
      verificarIgual(ctx.recargas.veces, 0, 'C1: no debe recargarse la lista');

      return `${ctx.toast.resumen()} · loadPockets no invocado · setLoading no invocado`;
    },
  );


  await camino(
    {
      id: 'FE-TR-C1b',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1 (tercera cláusula de la condición)',
      secuencia: '1 → 3 → Fin',
      condiciones: ['N1 = VERDADERO — por !transferAmount, con ambos bolsillos elegidos'],
      entradas: ['input = { fromPocketId: "origen", toPocketId: "destino", transferAmount: "" }'],
      esperado:
        'La tercera cláusula de la condición compuesta también corta el flujo en el nodo 3 con el mismo toast de advertencia.',
    },
    async () => {
      const ctx = contexto();
      await handleTransfer(ctx.deps, {
        fromPocketId: 'origen',
        toPocketId: 'destino',
        transferAmount: '',
      });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C1b: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'warning', 'C1b: el toast debe ser de advertencia');
      verificarIgual(ctx.recargas.veces, 0, 'C1b: no debe recargarse la lista');

      return `${ctx.toast.resumen()} · cortó por la tercera cláusula, con ambos bolsillos elegidos`;
    },
  );


  await camino(
    {
      id: 'FE-TR-C2',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 2',
      secuencia: '1 → 2 → 4 → 5 → 7 → 9 → 10 → Fin',
      condiciones: ['N1 = FALSO', 'N5 (¿pocketService.transfer lanzó error?) = VERDADERO'],
      entradas: [
        'Ambos ids son UUID válidos pero inexistentes, para que el backend responda 404 SOURCE_POCKET_NOT_FOUND',
        'input = { transferAmount: "1000" }',
      ],
      esperado:
        'El catch (nodo 7) toma el mensaje del backend, el nodo 9 lo muestra en un toast de error, NO se recarga la lista (nodo 8 no recorrido) y el finally (nodo 10) apaga el indicador de carga.',
    },
    async () => {
      const ctx = contexto();
      await handleTransfer(ctx.deps, {
        fromPocketId: UUID_INEXISTENTE,
        toPocketId: '11111111-1111-4111-8111-111111111111',
        transferAmount: '1000',
      });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C2: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'error', 'C2: el toast debe ser de error');
      verificarIgual(
        ctx.toast.emitidos[0]!.titulo,
        'No fue posible transferir el saldo',
        'C2: título del toast',
      );
      verificar(
        (ctx.toast.emitidos[0]!.descripcion ?? '').length > 0,
        'C2: la descripción debe traer el mensaje del backend',
      );
      verificarIgual(ctx.recargas.veces, 0, 'C2: el nodo 8 no debe recorrerse');
      verificarIgual(ctx.loading.historial.join(','), 'true,false', 'C2: la carga debe encenderse y apagarse');

      return (
        `${ctx.toast.resumen()} · loadPockets no invocado · setLoading: ${ctx.loading.historial.join(' → ')}`
      );
    },
  );


  await camino(
    {
      id: 'FE-TR-C3',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 3',
      secuencia: '1 → 2 → 4 → 5 → 6 → 8 → 10 → Fin',
      condiciones: ['N1 = FALSO', 'N5 (¿lanzó error?) = FALSO'],
      entradas: [
        'Dos bolsillos reales en la misma cuenta: "Origen FE" con $50.000 y "Destino FE" con $0',
        'input = { transferAmount: "20000" }',
      ],
      esperado:
        'El monto se envía convertido a número; el nodo 6 muestra el toast "Transferencia realizada" con los nombres origen → destino y el nodo 8 recarga la lista llamando a loadPockets(). El finally (nodo 10) apaga el indicador de carga.',
    },
    async () => {
      const origen = await crearBolsilloReal(e.accountId, 'Origen FE', 50_000);
      const destino = await crearBolsilloReal(e.accountId, 'Destino FE', 0);
      const ctx = contexto();

      try {
        await handleTransfer(ctx.deps, {
          fromPocketId: origen.id,
          toPocketId: destino.id,
          transferAmount: '20000',
        });

        verificarIgual(ctx.toast.emitidos.length, 1, 'C3: debe emitirse exactamente un toast');
        verificarIgual(ctx.toast.emitidos[0]!.tipo, 'success', 'C3: el toast debe ser de éxito');
        verificarIgual(
          ctx.toast.emitidos[0]!.titulo,
          'Transferencia realizada',
          'C3: título del toast',
        );
        verificarIgual(
          ctx.toast.emitidos[0]!.descripcion,
          'Origen FE → Destino FE',
          'C3: la descripción debe traer origen → destino',
        );
        verificarIgual(ctx.recargas.veces, 1, 'C3: el nodo 8 debe recargar la lista una vez');
        verificarIgual(
          ctx.loading.historial.join(','),
          'true,false',
          'C3: la carga debe encenderse y apagarse',
        );

        return (
          `${ctx.toast.resumen()} · loadPockets invocado ${ctx.recargas.veces} vez · ` +
          `setLoading: ${ctx.loading.historial.join(' → ')}`
        );
      } finally {
        await borrarBolsilloReal(origen.id);
        await borrarBolsilloReal(destino.id);
      }
    },
  );
}
