/**
 * CAJA BLANCA — Eliminar bolsillo (`confirmDelete`).
 *
 * Correspondencia nodo ↔ sentencia de `pocket.handlers.ts`:
 *   1  → decisión  !pendingDeletePocket
 *   3  → proceso   return sin efectos
 *   2  → proceso   setLoading(true)
 *   4  → proceso   pocketService.remove(...)
 *   5  → decisión  ¿lanzó error?
 *   7  → proceso   catch: backendMessage(...)
 *   9  → proceso   toast.error("No fue posible eliminar el bolsillo")
 *   6  → proceso   setPockets(filtrado) + toast.success
 *   8  → proceso   toast.success("Bolsillo eliminado")
 *   10 → proceso   finally: setLoading(false) + setPendingDeletePocket(null)
 */

import { confirmDelete } from '../../features/pockets/handlers/pocket.handlers';
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

const FUNCIONALIDAD = 'Eliminar bolsillo';
const HANDLER = 'confirmDelete';

function contexto(listaInicial: PocketItem[] = []) {
  const toast = registradorToast();
  const pockets = registradorLista(listaInicial);
  const loading = registradorValor<boolean>();
  const pendiente = registradorValor<PocketItem | null>();

  return {
    toast,
    pockets,
    loading,
    pendiente,
    deps: {
      service: pocketService,
      toast: toast.api,
      setLoading: loading.set,
      setPockets: pockets.set,
      setPendingDeletePocket: pendiente.set,
    },
  };
}

export async function ejecutarCaminosEliminar(e: Escenario): Promise<void> {

  await camino(
    {
      id: 'FE-EL-C1',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1',
      secuencia: '1 → 3 → Fin',
      condiciones: ['N1 (!pendingDeletePocket) = VERDADERO'],
      entradas: ['pendingDeletePocket = null (el modal se confirmó sin bolsillo seleccionado)'],
      esperado:
        'La función retorna de inmediato en el nodo 3: no se llama al servicio, no se emite ningún toast y la lista no cambia.',
    },
    async () => {
      const ctx = contexto();
      await confirmDelete(ctx.deps, null);

      verificarIgual(ctx.toast.emitidos.length, 0, 'C1: no debe emitirse ningún toast');
      verificarIgual(ctx.loading.historial.length, 0, 'C1: no debe tocarse el indicador de carga');
      verificarIgual(ctx.pockets.llamadas, 0, 'C1: no debe modificarse la lista');
      verificarIgual(ctx.pendiente.historial.length, 0, 'C1: no debe tocarse el bolsillo pendiente');

      return 'sin toasts · setLoading no invocado · lista sin cambios · retorno inmediato';
    },
  );


  await camino(
    {
      id: 'FE-EL-C2',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 2',
      secuencia: '1 → 2 → 4 → 5 → 7 → 9 → 10 → Fin',
      condiciones: ['N1 = FALSO', 'N5 (¿pocketService.remove lanzó error?) = VERDADERO'],
      entradas: [
        'pendingDeletePocket con un id válido pero inexistente, para que el backend responda 404 POCKET_NOT_FOUND',
      ],
      esperado:
        'El catch (nodo 7) toma el mensaje del backend, el nodo 9 lo muestra en un toast de error, el bolsillo permanece en la lista y el finally (nodo 10) apaga el indicador de carga y cierra el modal.',
    },
    async () => {
      const fantasma: any = {
        id: UUID_INEXISTENTE,
        accountId: e.accountId,
        name: 'Fantasma',
        amount: 1000,
        createdAt: '',
        updatedAt: '',
      };
      const ctx = contexto([fantasma]);

      await confirmDelete(ctx.deps, fantasma);

      verificarIgual(ctx.toast.emitidos.length, 1, 'C2: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'error', 'C2: el toast debe ser de error');
      verificarIgual(
        ctx.toast.emitidos[0]!.titulo,
        'No fue posible eliminar el bolsillo',
        'C2: título del toast',
      );
      verificar(
        (ctx.toast.emitidos[0]!.descripcion ?? '').length > 0,
        'C2: la descripción debe traer el mensaje del backend',
      );
      verificarIgual(ctx.pockets.llamadas, 0, 'C2: el bolsillo debe permanecer en la lista');
      verificarIgual(ctx.loading.historial.join(','), 'true,false', 'C2: la carga debe encenderse y apagarse');
      verificarIgual(ctx.pendiente.ultimo, null, 'C2: el finally debe cerrar el modal');

      return (
        `${ctx.toast.resumen()} · bolsillo sigue en la lista · ` +
        `setLoading: ${ctx.loading.historial.join(' → ')} · modal cerrado`
      );
    },
  );


  await camino(
    {
      id: 'FE-EL-C3',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 3',
      secuencia: '1 → 2 → 4 → 5 → 6 → 8 → 10 → Fin',
      condiciones: ['N1 = FALSO', 'N5 (¿lanzó error?) = FALSO'],
      entradas: [
        'Bolsillo real creado para el caso, con nombre "Borrable"',
        'La lista contiene además otro bolsillo, "Laptop", que debe sobrevivir',
      ],
      esperado:
        'El nodo 6 quita el bolsillo de la lista dejando solo "Laptop", el nodo 8 muestra "Bolsillo eliminado" y el finally (nodo 10) apaga el indicador de carga y cierra el modal.',
    },
    async () => {
      const real = await crearBolsilloReal(e.accountId, 'Borrable', 10_000);
      const laptop: any = {
        id: 'laptop',
        accountId: e.accountId,
        name: 'Laptop',
        amount: 0,
        createdAt: '',
        updatedAt: '',
      };
      const ctx = contexto([real, laptop]);

      try {
        await confirmDelete(ctx.deps, real);

        verificarIgual(ctx.toast.emitidos.length, 1, 'C3: debe emitirse exactamente un toast');
        verificarIgual(ctx.toast.emitidos[0]!.tipo, 'success', 'C3: el toast debe ser de éxito');
        verificarIgual(ctx.toast.emitidos[0]!.titulo, 'Bolsillo eliminado', 'C3: título del toast');
        verificarIgual(ctx.pockets.valor.length, 1, 'C3: debe quedar un solo bolsillo');
        verificarIgual(ctx.pockets.valor[0]!.name, 'Laptop', 'C3: el sobreviviente debe ser "Laptop"');
        verificarIgual(
          ctx.loading.historial.join(','),
          'true,false',
          'C3: la carga debe encenderse y apagarse',
        );
        verificarIgual(ctx.pendiente.ultimo, null, 'C3: el finally debe cerrar el modal');

        return (
          `${ctx.toast.resumen()} · lista: [${ctx.pockets.valor.map((p) => p.name).join(', ')}] · ` +
          `setLoading: ${ctx.loading.historial.join(' → ')} · modal cerrado`
        );
      } finally {
        await borrarBolsilloReal(real.id);
      }
    },
  );
}
