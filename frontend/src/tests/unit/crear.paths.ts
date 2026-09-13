/**
 * CAJA BLANCA — Crear bolsillo (`handleCreate`).
 *
 * Un caso por cada fila de la tabla de caminos de la hoja "Crear" de
 * `Frontend.drawio`.
 *
 * Correspondencia nodo ↔ sentencia de `pocket.handlers.ts`:
 *   1 → decisión  !input.accountId || !input.name
 *   3 → proceso   toast.warning("Falta información") + return
 *   2 → proceso   setLoading(true)
 *   4 → decisión  ¿pocketService.create lanzó error?
 *   6 → proceso   catch: backendMessage(...)
 *   8 → proceso   toast.error("No fue posible crear el bolsillo")
 *   5 → proceso   setPockets(prepend) + setName('') + setAmount('')
 *   7 → proceso   toast.success("Bolsillo creado")
 *   9 → proceso   finally: setLoading(false)
 */

import { handleCreate } from '../../features/pockets/handlers/pocket.handlers';
import { pocketService } from '../../features/pockets/services/pocket.service';
import {
  Escenario,
  UUID_INEXISTENTE,
  borrarBolsilloReal,
  registradorLista,
  registradorToast,
  registradorValor,
} from './support/entorno';
import { camino, verificar, verificarIgual } from './support/runner';

const FUNCIONALIDAD = 'Crear bolsillo';
const HANDLER = 'handleCreate';

/** Arma las dependencias del handler con el servicio REAL y registradores. */
function contexto(listaInicial: any[] = []) {
  const toast = registradorToast();
  const pockets = registradorLista(listaInicial);
  const loading = registradorValor<boolean>();
  const name = registradorValor<string>();
  const amount = registradorValor<string>();

  return {
    toast,
    pockets,
    loading,
    name,
    amount,
    deps: {
      service: pocketService,
      toast: toast.api,
      setLoading: loading.set,
      setPockets: pockets.set,
      setName: name.set,
      setAmount: amount.set,
    },
  };
}

export async function ejecutarCaminosCrear(e: Escenario): Promise<void> {

  await camino(
    {
      id: 'FE-CR-C1',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1',
      secuencia: '1 → 3 → Fin',
      condiciones: ['N1 (!accountId || !name) = VERDADERO — no hay cuenta seleccionada'],
      entradas: ['input = { accountId: "", name: "Vacaciones", amount: "100000" }'],
      esperado:
        'Se emite el toast de advertencia "Falta información" y la función retorna en el nodo 3: no se llama al servicio ni se activa el indicador de carga.',
    },
    async () => {
      const ctx = contexto();
      await handleCreate(ctx.deps, { accountId: '', name: 'Vacaciones', amount: '100000' });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C1: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'warning', 'C1: el toast debe ser de advertencia');
      verificarIgual(ctx.toast.emitidos[0]!.titulo, 'Falta información', 'C1: título del toast');
      verificarIgual(ctx.loading.historial.length, 0, 'C1: no debe tocarse el indicador de carga');
      verificarIgual(ctx.pockets.llamadas, 0, 'C1: no debe modificarse la lista');

      return `${ctx.toast.resumen()} · setLoading no invocado · setPockets no invocado`;
    },
  );


  await camino(
    {
      id: 'FE-CR-C1b',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 1 (segunda cláusula de la condición)',
      secuencia: '1 → 3 → Fin',
      condiciones: ['N1 (!accountId || !name) = VERDADERO — por !name, con accountId presente'],
      entradas: ['input = { accountId: cuenta real, name: "", amount: "100000" }'],
      esperado:
        'La segunda cláusula de la condición compuesta también corta el flujo en el nodo 3 con el mismo toast de advertencia.',
    },
    async () => {
      const ctx = contexto();
      await handleCreate(ctx.deps, { accountId: e.accountId, name: '', amount: '100000' });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C1b: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'warning', 'C1b: el toast debe ser de advertencia');
      verificarIgual(ctx.loading.historial.length, 0, 'C1b: no debe tocarse el indicador de carga');

      return `${ctx.toast.resumen()} · cortó por la segunda cláusula, con accountId presente`;
    },
  );


  await camino(
    {
      id: 'FE-CR-C2',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 2',
      secuencia: '1 → 2 → 4 → 6 → 8 → 9 → Fin',
      condiciones: ['N1 = FALSO', 'N4 (¿pocketService.create lanzó error?) = VERDADERO'],
      entradas: [
        'accountId = UUID válido pero inexistente, para que el backend responda 404 ACCOUNT_NOT_FOUND',
        'input = { accountId: UUID inexistente, name: "Fallará", amount: "1000" }',
      ],
      esperado:
        'El catch (nodo 6) toma el mensaje del backend, el nodo 8 lo muestra en un toast de error, el finally (nodo 9) apaga el indicador de carga y la lista de bolsillos no cambia.',
    },
    async () => {
      const ctx = contexto();
      await handleCreate(ctx.deps, {
        accountId: UUID_INEXISTENTE,
        name: 'Fallará',
        amount: '1000',
      });

      verificarIgual(ctx.toast.emitidos.length, 1, 'C2: debe emitirse exactamente un toast');
      verificarIgual(ctx.toast.emitidos[0]!.tipo, 'error', 'C2: el toast debe ser de error');
      verificarIgual(
        ctx.toast.emitidos[0]!.titulo,
        'No fue posible crear el bolsillo',
        'C2: título del toast',
      );
      verificar(
        (ctx.toast.emitidos[0]!.descripcion ?? '').length > 0,
        'C2: la descripción debe traer el mensaje del backend',
      );
      verificarIgual(ctx.pockets.llamadas, 0, 'C2: la lista no debe cambiar');
      verificarIgual(ctx.loading.historial.join(','), 'true,false', 'C2: la carga debe encenderse y apagarse');

      return `${ctx.toast.resumen()} · setLoading: ${ctx.loading.historial.join(' → ')} · lista sin cambios`;
    },
  );


  await camino(
    {
      id: 'FE-CR-C3',
      funcionalidad: FUNCIONALIDAD,
      handler: HANDLER,
      camino: 'Camino 3',
      secuencia: '1 → 2 → 4 → 5 → 7 → 9 → Fin',
      condiciones: ['N1 = FALSO', 'N4 (¿lanzó error?) = FALSO'],
      entradas: [
        'Cuenta real con saldo suficiente',
        'input = { accountId: cuenta real, name: "Vacaciones FE", amount: "150000" }',
        'Lista inicial con un bolsillo previo, para comprobar que el nuevo se antepone',
      ],
      esperado:
        'El nodo 5 antepone el bolsillo creado a la lista y limpia los campos del formulario, el nodo 7 muestra el toast "Bolsillo creado" y el finally (nodo 9) apaga el indicador de carga.',
    },
    async () => {
      const previo: any = {
        id: 'previo',
        accountId: e.accountId,
        name: 'Previo',
        amount: 0,
        createdAt: '',
        updatedAt: '',
      };
      const ctx = contexto([previo]);

      await handleCreate(ctx.deps, {
        accountId: e.accountId,
        name: 'Vacaciones FE',
        amount: '150000',
      });

      const creado = ctx.pockets.valor[0];
      try {
        verificarIgual(ctx.toast.emitidos.length, 1, 'C3: debe emitirse exactamente un toast');
        verificarIgual(ctx.toast.emitidos[0]!.tipo, 'success', 'C3: el toast debe ser de éxito');
        verificarIgual(ctx.toast.emitidos[0]!.titulo, 'Bolsillo creado', 'C3: título del toast');
        verificarIgual(ctx.pockets.valor.length, 2, 'C3: la lista debe tener dos elementos');
        verificarIgual(creado?.name, 'Vacaciones FE', 'C3: el nuevo bolsillo debe ir primero');
        verificarIgual(creado?.amount, 150000, 'C3: el monto debe llegar convertido a número');
        verificarIgual(ctx.pockets.valor[1]!.id, 'previo', 'C3: el anterior debe quedar detrás');
        verificarIgual(ctx.name.ultimo, '', 'C3: debe limpiarse el campo nombre');
        verificarIgual(ctx.amount.ultimo, '', 'C3: debe limpiarse el campo monto');
        verificarIgual(
          ctx.loading.historial.join(','),
          'true,false',
          'C3: la carga debe encenderse y apagarse',
        );
      } finally {
        if (creado?.id && creado.id !== 'previo') await borrarBolsilloReal(creado.id);
      }

      return (
        `${ctx.toast.resumen()} · lista: [${ctx.pockets.valor.map((p) => p.name).join(', ')}] · ` +
        `campos limpiados · setLoading: ${ctx.loading.historial.join(' → ')}`
      );
    },
  );
}
