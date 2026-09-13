/**
 * CAJA BLANCA — Consultar bolsillos (`loadPockets`).
 *
 * Correspondencia nodo ↔ sentencia de `pocket.handlers.ts`:
 *   1 → proceso   setLoading(true)
 *   2 → proceso   pocketService.getByAccount(...)
 *   3 → decisión  ¿lanzó error?
 *   5 → proceso   catch: backendMessage(...)
 *   6 → proceso   toast.error("No fue posible cargar los bolsillos")
 *   4 → proceso   setPockets(data)
 *   7 → proceso   finally: setLoading(false)
 */

import { backendMessage, loadPockets } from '../../features/pockets/handlers/pocket.handlers';
import { pocketService } from '../../features/pockets/services/pocket.service';
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

const FUNCIONALIDAD = 'Consultar bolsillos';
const HANDLER = 'loadPockets';

function contexto() {
  const toast = registradorToast();
  const pockets = registradorLista([]);
  const loading = registradorValor<boolean>();

  return {
    toast,
    pockets,
    loading,
    deps: {
      service: pocketService,
      toast: toast.api,
      setLoading: loading.set,
      setPockets: pockets.set,
    },
  };
}

export async function ejecutarCaminosConsultar(e: Escenario): Promise<void> {

  await camino(
    {
      id: 'FE-CO-C1',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1',
      secuencia: '1 → 2 → 3 → 5 → 6 → 7 → Fin',
      condiciones: ['N3 (¿pocketService.getByAccount lanzó error?) = VERDADERO'],
      entradas: [
        'accountId = UUID válido pero inexistente, para que el backend responda 404 ACCOUNT_NOT_FOUND',
      ],
      esperado:
        'El catch (nodo 5) toma el mensaje del backend, el nodo 6 lo muestra en un toast de error, la lista de bolsillos no se toca (nodo 4 no recorrido) y el finally (nodo 7) apaga el indicador de carga.',
    },
    async () => {
      const ctx = contexto();
      await loadPockets(ctx.deps, UUID_INEXISTENTE);

      verificarIgual(ctx.toast.emitidos.length, 1, 'C1: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'error', 'C1: el toast debe ser de error');
      verificarIgual(
        ctx.toast.emitidos[0]!.titulo,
        'No fue posible cargar los bolsillos',
        'C1: título del toast',
      );
      verificar(
        (ctx.toast.emitidos[0]!.descripcion ?? '').length > 0,
        'C1: la descripción debe traer el mensaje del backend',
      );
      verificarIgual(ctx.pockets.llamadas, 0, 'C1: el nodo 4 no debe recorrerse');
      verificarIgual(ctx.loading.historial.join(','), 'true,false', 'C1: la carga debe encenderse y apagarse');

      return (
        `${ctx.toast.resumen()} · setPockets no invocado · setLoading: ${ctx.loading.historial.join(' → ')}`
      );
    },
  );


  await camino(
    {
      id: 'FE-CO-C2',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 2',
      secuencia: '1 → 2 → 3 → 4 → 7 → Fin',
      condiciones: ['N3 (¿lanzó error?) = FALSO'],
      entradas: [
        'Cuenta real con un bolsillo creado para el caso, "Listable" por $10.000',
        'accountId = cuenta real',
      ],
      esperado:
        'El nodo 4 reemplaza la lista con los datos recibidos, no se emite ningún toast y el finally (nodo 7) apaga el indicador de carga.',
    },
    async () => {
      const real = await crearBolsilloReal(e.accountId, 'Listable', 10_000);
      const ctx = contexto();

      try {
        await loadPockets(ctx.deps, e.accountId);

        verificarIgual(ctx.toast.emitidos.length, 0, 'C2: no debe emitirse ningún toast');
        verificarIgual(ctx.pockets.llamadas, 1, 'C2: el nodo 4 debe reemplazar la lista una vez');
        verificar(
          ctx.pockets.valor.some((p) => p.id === real.id),
          'C2: la lista debe contener el bolsillo creado',
        );
        verificarIgual(
          ctx.loading.historial.join(','),
          'true,false',
          'C2: la carga debe encenderse y apagarse',
        );

        return (
          `sin toasts · setPockets con ${ctx.pockets.valor.length} bolsillo(s), incluido "${real.name}" · ` +
          `setLoading: ${ctx.loading.historial.join(' → ')}`
        );
      } finally {
        await borrarBolsilloReal(real.id);
      }
    },
  );


  await camino(
    {
      id: 'FE-CO-C1b',
      funcionalidad: FUNCIONALIDAD,
      handler: 'backendMessage',
      camino: 'Camino 1 (mensaje de respaldo, no tabulado)',
      secuencia: '1 → 2 → 3 → 5 → 6 → 7 → Fin',
      condiciones: [
        'N3 (¿lanzó error?) = VERDADERO',
        'El error no trae `message` ni `error.message`: se usa el texto de respaldo del nodo 5',
      ],
      entradas: [
        'A través del servicio real esta rama es INALCANZABLE: el interceptor de `apiClient` siempre rechaza con un objeto que trae `message`, sea el del backend o "No se pudo conectar al servidor.".',
        'Se ejercita entonces la función pura `backendMessage({}, "No fue posible cargar los bolsillos.")`, que es la sentencia exacta del nodo 5.',
      ],
      esperado:
        'El nodo 5 recurre al mensaje de respaldo "No fue posible cargar los bolsillos." cuando el error no aporta ninguno.',
    },
    () => {
      const respaldo = 'No fue posible cargar los bolsillos.';

      verificarIgual(backendMessage({}, respaldo), respaldo, 'C1b: un error vacío debe usar el respaldo');
      verificarIgual(
        backendMessage(undefined, respaldo),
        respaldo,
        'C1b: un error indefinido debe usar el respaldo',
      );
      verificarIgual(
        backendMessage({ message: 'del backend' }, respaldo),
        'del backend',
        'C1b: si el error trae message, se prefiere ese',
      );
      verificarIgual(
        backendMessage({ error: { message: 'anidado' } }, respaldo),
        'anidado',
        'C1b: si el message viene anidado, también se prefiere',
      );

      return (
        `backendMessage({}) → "${respaldo}" · backendMessage({message}) → "del backend" · ` +
        'backendMessage({error:{message}}) → "anidado"'
      );
    },
  );
}
