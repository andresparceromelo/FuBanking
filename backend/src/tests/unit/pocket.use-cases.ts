/**
 * Pruebas unitarias de los cinco casos de uso del módulo Bolsillos.
 *
 * Sin mocks: cada caso de uso se construye con los repositorios Supabase
 * reales y se invoca su método `execute` directamente. Al no pasar por el
 * controlador, los schemas Zod no intervienen, de modo que aquí sí se alcanzan
 * las ramas de validación del dominio que por HTTP quedaban tapadas.
 *
 * Los casos se ejecutan en orden y comparten estado: cada uno declara la
 * precondición que espera y deja documentado el estado que produce.
 */

import {
  Escenario,
  UUID_AJENO,
  UUID_INEXISTENTE,
  accRepo,
  actualizar,
  cambiarEstadoCuenta,
  consultar,
  crear,
  eliminar,
  pocRepo,
  transferir,
} from './support/fixtures';
import { caso, esperarCodigo, pesos, verificar, verificarIgual } from './support/runner';

/** Ids de los bolsillos que van creando los casos. */
let VAC = '';
let EST = '';

/** Lee el saldo disponible de una cuenta. */
async function disponible(accountId: string): Promise<number> {
  const cuenta = await accRepo.findById(accountId);
  if (!cuenta) throw new Error(`La cuenta ${accountId} no existe`);
  return cuenta.balance;
}

/** Lee el total reservado en bolsillos de una cuenta. */
async function reservado(accountId: string): Promise<number> {
  return pocRepo.getTotalAmountByAccountId(accountId);
}

export async function ejecutarCasosDeUso(e: Escenario): Promise<void> {
  await crearBolsillo(e);
  await actualizarBolsillo(e);
  await eliminarBolsillo(e);
  await transferirEntreBolsillos(e);
  await consultarBolsillos(e);
}

// ── Crear ───────────────────────────────────────────────────────────────────

async function crearBolsillo(e: Escenario): Promise<void> {
  const GRUPO = 'Crear bolsillo';
  const UNIDAD = 'CreatePocket.execute';

  await caso(
    {
      id: 'CU-CR-01',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un monto negativo corta el flujo antes de consultar la cuenta',
      entrada: 'amount = -1 sobre la cuenta principal',
      esperado: 'Rechaza con INVALID_POCKET_AMOUNT (HTTP 400). Rama inalcanzable por HTTP',
    },
    async () => {
      const antes = await disponible(e.acc1);
      const detalle = await esperarCodigo(
        crear.execute({ userId: e.userId, accountId: e.acc1, name: 'Negativo', amount: -1 }),
        'INVALID_POCKET_AMOUNT',
        'CU-CR-01: un monto negativo debe rechazarse',
      );
      verificarIgual(await disponible(e.acc1), antes, 'CU-CR-01: el saldo no debe alterarse');
      return `${detalle} · saldo intacto en ${pesos(antes)}`;
    },
  );

  await caso(
    {
      id: 'CU-CR-02',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Una cuenta inexistente se rechaza tras consultar el repositorio',
      entrada: 'accountId = UUID válido pero inexistente',
      esperado: 'Rechaza con ACCOUNT_NOT_FOUND (HTTP 404)',
    },
    () =>
      esperarCodigo(
        crear.execute({
          userId: e.userId,
          accountId: UUID_INEXISTENTE,
          name: 'Fantasma',
          amount: 50_000,
        }),
        'ACCOUNT_NOT_FOUND',
        'CU-CR-02: una cuenta inexistente debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-CR-03',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un usuario que no es el dueño no puede crear bolsillos en la cuenta',
      entrada: 'userId ajeno sobre la cuenta principal',
      esperado: 'Rechaza con FORBIDDEN (HTTP 403), por assertBelongsTo',
    },
    async () => {
      const antes = await disponible(e.acc1);
      const detalle = await esperarCodigo(
        crear.execute({ userId: UUID_AJENO, accountId: e.acc1, name: 'Ajena', amount: 10_000 }),
        'FORBIDDEN',
        'CU-CR-03: un usuario ajeno debe rechazarse',
      );
      verificarIgual(await disponible(e.acc1), antes, 'CU-CR-03: el saldo no debe alterarse');
      return `${detalle} · saldo intacto en ${pesos(antes)}`;
    },
  );

  await caso(
    {
      id: 'CU-CR-04',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Valor límite: un peso por encima del disponible se rechaza',
      entrada: 'amount = 1.000.001 con disponible 1.000.000 y reservado 0',
      esperado: 'Rechaza con INSUFFICIENT_AVAILABLE_BALANCE (HTTP 400)',
    },
    async () => {
      const antes = await disponible(e.acc1);
      const detalle = await esperarCodigo(
        crear.execute({
          userId: e.userId,
          accountId: e.acc1,
          name: 'Excede por uno',
          amount: antes + 1,
        }),
        'INSUFFICIENT_AVAILABLE_BALANCE',
        'CU-CR-04: superar el disponible debe rechazarse',
      );
      verificarIgual(await disponible(e.acc1), antes, 'CU-CR-04: el saldo no debe alterarse');
      return `${detalle} · se pidió ${pesos(antes + 1)} contra un disponible de ${pesos(antes)}`;
    },
  );

  await caso(
    {
      id: 'CU-CR-05',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Camino principal: el bolsillo se crea y el monto se reserva',
      entrada: 'name = "Vacaciones", amount = 300.000, disponible 1.000.000',
      esperado:
        'Devuelve el bolsillo con amount 300.000 y deja el disponible en 700.000 y lo reservado en 300.000',
    },
    async () => {
      const bolsillo = await crear.execute({
        userId: e.userId,
        accountId: e.acc1,
        name: 'Vacaciones',
        amount: 300_000,
      });
      VAC = bolsillo.id;
      e.bolsillosCreados.push(VAC);

      verificarIgual(bolsillo.name, 'Vacaciones', 'CU-CR-05: el nombre debe conservarse');
      verificarIgual(bolsillo.amount, 300_000, 'CU-CR-05: el monto debe ser 300.000');
      verificarIgual(bolsillo.accountId, e.acc1, 'CU-CR-05: debe quedar en la cuenta indicada');

      const disp = await disponible(e.acc1);
      const res = await reservado(e.acc1);
      verificarIgual(disp, 700_000, 'CU-CR-05: el disponible debe bajar a 700.000');
      verificarIgual(res, 300_000, 'CU-CR-05: lo reservado debe subir a 300.000');

      return `Bolsillo "${bolsillo.name}" por ${pesos(bolsillo.amount)} · disponible ${pesos(disp)} · reservado ${pesos(res)}`;
    },
  );

  await caso(
    {
      id: 'CU-CR-06',
      grupo: GRUPO,
      unidad: 'CreatePocket.execute + SupabasePocketRepository',
      descripcion: 'El bolsillo creado queda realmente persistido y es recuperable por id',
      entrada: 'findById sobre el id devuelto en CU-CR-05',
      esperado: 'El repositorio devuelve el bolsillo con los mismos nombre y monto',
    },
    async () => {
      const persistido = await pocRepo.findById(VAC);
      verificar(persistido !== null, 'CU-CR-06: el bolsillo debe estar persistido');
      verificarIgual(persistido!.name, 'Vacaciones', 'CU-CR-06: el nombre persistido no coincide');
      verificarIgual(persistido!.amount, 300_000, 'CU-CR-06: el monto persistido no coincide');
      return `Recuperado de la base: "${persistido!.name}" por ${pesos(persistido!.amount)}`;
    },
  );

  await caso(
    {
      id: 'CU-CR-07',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Se pueden acumular varios bolsillos en la misma cuenta',
      entrada: 'name = "Estudio", amount = 200.000, disponible 700.000',
      esperado: 'Se crea el segundo bolsillo y el disponible baja a 500.000',
    },
    async () => {
      const bolsillo = await crear.execute({
        userId: e.userId,
        accountId: e.acc1,
        name: 'Estudio',
        amount: 200_000,
      });
      EST = bolsillo.id;
      e.bolsillosCreados.push(EST);

      verificarIgual(bolsillo.amount, 200_000, 'CU-CR-07: el monto debe ser 200.000');
      const disp = await disponible(e.acc1);
      const res = await reservado(e.acc1);
      verificarIgual(disp, 500_000, 'CU-CR-07: el disponible debe bajar a 500.000');
      verificarIgual(res, 500_000, 'CU-CR-07: lo reservado debe subir a 500.000');

      return `Segundo bolsillo por ${pesos(bolsillo.amount)} · disponible ${pesos(disp)} · reservado ${pesos(res)}`;
    },
  );

  await caso(
    {
      id: 'CU-CR-08',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Una cuenta no operativa no admite bolsillos nuevos',
      entrada: 'Cuenta puesta en estado BLOQUEADA antes de la llamada',
      esperado: 'Rechaza con ACCOUNT_NOT_OPERATIONAL (HTTP 400)',
    },
    async () => {
      await cambiarEstadoCuenta(e.acc3, 'BLOQUEADA');
      try {
        return await esperarCodigo(
          crear.execute({ userId: e.userId, accountId: e.acc3, name: 'Bloqueada', amount: 1_000 }),
          'ACCOUNT_NOT_OPERATIONAL',
          'CU-CR-08: una cuenta bloqueada debe rechazarse',
        );
      } finally {
        // Se devuelve a ACTIVA pase lo que pase: CU-CO-04 la necesita operativa.
        await cambiarEstadoCuenta(e.acc3, 'ACTIVA');
      }
    },
  );

  await caso(
    {
      id: 'CU-CR-09',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion:
        'Un bolsillo que cabe en el saldo disponible debe crearse aunque la cuenta ya tenga reservas',
      entrada: 'amount = 400.000 con disponible 500.000 y reservado 500.000',
      esperado:
        'Se crea el bolsillo, dejando el disponible en 100.000 y lo reservado en 900.000, porque 400.000 ≤ 500.000 disponibles',
      defecto: 'D-05',
    },
    async () => {
      const dispAntes = await disponible(e.acc1);
      const resAntes = await reservado(e.acc1);

      const bolsillo = await crear.execute({
        userId: e.userId,
        accountId: e.acc1,
        name: 'Emergencia',
        amount: 400_000,
      });

      // Si llegamos aquí el defecto D-05 está corregido. Se deshace la creación
      // para que los grupos siguientes encuentren el estado que declaran.
      e.bolsillosCreados.push(bolsillo.id);
      await eliminar.execute({ userId: e.userId, pocketId: bolsillo.id });

      return (
        `Se creó el bolsillo por ${pesos(bolsillo.amount)} partiendo de un disponible de ${pesos(dispAntes)} ` +
        `y un reservado de ${pesos(resAntes)}. Se eliminó a continuación para restaurar el estado.`
      );
    },
  );
}

// ── Actualizar ──────────────────────────────────────────────────────────────

async function actualizarBolsillo(e: Escenario): Promise<void> {
  const GRUPO = 'Actualizar bolsillo';
  const UNIDAD = 'UpdatePocket.execute';

  await caso(
    {
      id: 'CU-AC-01',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un nombre de solo espacios se rechaza',
      entrada: 'name = "   "',
      esperado: 'Rechaza con INVALID_POCKET_NAME (HTTP 400)',
    },
    () =>
      esperarCodigo(
        actualizar.execute({ userId: e.userId, pocketId: VAC, name: '   ' }),
        'INVALID_POCKET_NAME',
        'CU-AC-01: un nombre de solo espacios debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-AC-02',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un monto negativo se rechaza',
      entrada: 'amount = -100',
      esperado: 'Rechaza con INVALID_POCKET_AMOUNT (HTTP 400). Rama inalcanzable por HTTP',
    },
    () =>
      esperarCodigo(
        actualizar.execute({ userId: e.userId, pocketId: VAC, amount: -100 }),
        'INVALID_POCKET_AMOUNT',
        'CU-AC-02: un monto negativo debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-AC-03',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Una actualización sin ningún campo se rechaza',
      entrada: 'Ni name ni amount',
      esperado: 'Rechaza con NO_CHANGES_PROVIDED (HTTP 400). Rama inalcanzable por HTTP',
    },
    () =>
      esperarCodigo(
        actualizar.execute({ userId: e.userId, pocketId: VAC }),
        'NO_CHANGES_PROVIDED',
        'CU-AC-03: una actualización vacía debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-AC-04',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un bolsillo inexistente se rechaza',
      entrada: 'pocketId = UUID válido pero inexistente',
      esperado: 'Rechaza con POCKET_NOT_FOUND (HTTP 404)',
    },
    () =>
      esperarCodigo(
        actualizar.execute({ userId: e.userId, pocketId: UUID_INEXISTENTE, amount: 1_000 }),
        'POCKET_NOT_FOUND',
        'CU-AC-04: un bolsillo inexistente debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-AC-05',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un usuario ajeno no puede modificar el bolsillo',
      entrada: 'userId ajeno sobre un bolsillo existente',
      esperado: 'Rechaza con FORBIDDEN (HTTP 403)',
    },
    async () => {
      const antes = (await pocRepo.findById(VAC))!.amount;
      const detalle = await esperarCodigo(
        actualizar.execute({ userId: UUID_AJENO, pocketId: VAC, amount: 1_000 }),
        'FORBIDDEN',
        'CU-AC-05: un usuario ajeno debe rechazarse',
      );
      verificarIgual((await pocRepo.findById(VAC))!.amount, antes, 'CU-AC-05: el monto no debe cambiar');
      return `${detalle} · monto intacto en ${pesos(antes)}`;
    },
  );

  await caso(
    {
      id: 'CU-AC-06',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Aumentar el monto reserva más saldo de la cuenta',
      entrada: 'amount = 600.000 sobre un bolsillo de 300.000, disponible 500.000',
      esperado: 'El bolsillo queda en 600.000 y el disponible baja a 200.000',
    },
    async () => {
      const actualizado = await actualizar.execute({
        userId: e.userId,
        pocketId: VAC,
        amount: 600_000,
      });
      verificarIgual(actualizado.amount, 600_000, 'CU-AC-06: el monto debe ser 600.000');
      const disp = await disponible(e.acc1);
      verificarIgual(disp, 200_000, 'CU-AC-06: el disponible debe bajar a 200.000');
      return `Monto ${pesos(300_000)} → ${pesos(actualizado.amount)} · disponible ${pesos(disp)}`;
    },
  );

  await caso(
    {
      id: 'CU-AC-07',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Valor límite: se puede reservar exactamente el total de fondos de la cuenta',
      entrada: 'amount = 800.000 con disponible 200.000 y reservado 800.000',
      esperado: 'Acepta y deja el disponible en 0, porque la condición usa > estricto',
    },
    async () => {
      const actualizado = await actualizar.execute({
        userId: e.userId,
        pocketId: VAC,
        amount: 800_000,
      });
      verificarIgual(actualizado.amount, 800_000, 'CU-AC-07: el monto debe ser 800.000');
      const disp = await disponible(e.acc1);
      const res = await reservado(e.acc1);
      verificarIgual(disp, 0, 'CU-AC-07: el disponible debe quedar en 0');
      verificarIgual(res, 1_000_000, 'CU-AC-07: lo reservado debe igualar el total');
      return `disponible ${pesos(disp)} · reservado ${pesos(res)} · total ${pesos(disp + res)}`;
    },
  );

  await caso(
    {
      id: 'CU-AC-08',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Valor límite: un peso por encima del total de fondos se rechaza',
      entrada: 'amount = 800.001 con disponible 0 y reservado 1.000.000',
      esperado: 'Rechaza con INSUFFICIENT_AVAILABLE_BALANCE (HTTP 400)',
    },
    async () => {
      const detalle = await esperarCodigo(
        actualizar.execute({ userId: e.userId, pocketId: VAC, amount: 800_001 }),
        'INSUFFICIENT_AVAILABLE_BALANCE',
        'CU-AC-08: superar el total debe rechazarse',
      );
      verificarIgual((await pocRepo.findById(VAC))!.amount, 800_000, 'CU-AC-08: el monto no debe cambiar');
      return `${detalle} · el bolsillo sigue en ${pesos(800_000)}`;
    },
  );

  await caso(
    {
      id: 'CU-AC-09',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Disminuir el monto libera saldo y lo devuelve al disponible',
      entrada: 'amount = 300.000 sobre un bolsillo de 800.000, disponible 0',
      esperado: 'El bolsillo queda en 300.000 y el disponible vuelve a 500.000',
    },
    async () => {
      const actualizado = await actualizar.execute({
        userId: e.userId,
        pocketId: VAC,
        amount: 300_000,
      });
      verificarIgual(actualizado.amount, 300_000, 'CU-AC-09: el monto debe ser 300.000');
      const disp = await disponible(e.acc1);
      verificarIgual(disp, 500_000, 'CU-AC-09: el disponible debe volver a 500.000');
      return `Monto ${pesos(800_000)} → ${pesos(actualizado.amount)} · disponible ${pesos(0)} → ${pesos(disp)}`;
    },
  );

  await caso(
    {
      id: 'CU-AC-10',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Cambiar solo el nombre no toca el saldo de la cuenta',
      entrada: 'name = "Vacaciones 2026", sin amount',
      esperado: 'Cambia el nombre, conserva el monto y deja el disponible en 500.000',
    },
    async () => {
      const dispAntes = await disponible(e.acc1);
      const actualizado = await actualizar.execute({
        userId: e.userId,
        pocketId: VAC,
        name: 'Vacaciones 2026',
      });
      verificarIgual(actualizado.name, 'Vacaciones 2026', 'CU-AC-10: el nombre debe cambiar');
      verificarIgual(actualizado.amount, 300_000, 'CU-AC-10: el monto no debe cambiar');
      const dispDespues = await disponible(e.acc1);
      verificarIgual(dispDespues, dispAntes, 'CU-AC-10: el disponible no debe cambiar');
      return `name = "${actualizado.name}" · monto ${pesos(actualizado.amount)} · disponible intacto en ${pesos(dispDespues)}`;
    },
  );
}

// ── Eliminar ────────────────────────────────────────────────────────────────

async function eliminarBolsillo(e: Escenario): Promise<void> {
  const GRUPO = 'Eliminar bolsillo';
  const UNIDAD = 'DeletePocket.execute';

  await caso(
    {
      id: 'CU-EL-01',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un bolsillo inexistente se rechaza',
      entrada: 'pocketId = UUID válido pero inexistente',
      esperado: 'Rechaza con POCKET_NOT_FOUND (HTTP 404)',
    },
    () =>
      esperarCodigo(
        eliminar.execute({ userId: e.userId, pocketId: UUID_INEXISTENTE }),
        'POCKET_NOT_FOUND',
        'CU-EL-01: un bolsillo inexistente debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-EL-02',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un usuario ajeno no puede eliminar el bolsillo',
      entrada: 'userId ajeno sobre un bolsillo existente',
      esperado: 'Rechaza con FORBIDDEN (HTTP 403) y el bolsillo sigue existiendo',
    },
    async () => {
      const detalle = await esperarCodigo(
        eliminar.execute({ userId: UUID_AJENO, pocketId: EST }),
        'FORBIDDEN',
        'CU-EL-02: un usuario ajeno debe rechazarse',
      );
      verificar((await pocRepo.findById(EST)) !== null, 'CU-EL-02: el bolsillo debe seguir existiendo');
      return `${detalle} · el bolsillo sigue en la base`;
    },
  );

  await caso(
    {
      id: 'CU-EL-03',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Eliminar un bolsillo devuelve su monto al saldo disponible',
      entrada: 'Bolsillo de 200.000, disponible 500.000',
      esperado:
        'Devuelve el bolsillo borrado, el disponible sube a 700.000 y lo reservado baja a 300.000',
    },
    async () => {
      const borrado = await eliminar.execute({ userId: e.userId, pocketId: EST });
      verificarIgual(borrado.id, EST, 'CU-EL-03: debe devolver el bolsillo eliminado');
      verificarIgual(borrado.amount, 200_000, 'CU-EL-03: el monto devuelto debe ser 200.000');

      const disp = await disponible(e.acc1);
      const res = await reservado(e.acc1);
      verificarIgual(disp, 700_000, 'CU-EL-03: el disponible debe subir a 700.000');
      verificarIgual(res, 300_000, 'CU-EL-03: lo reservado debe bajar a 300.000');
      verificar((await pocRepo.findById(EST)) === null, 'CU-EL-03: el bolsillo no debe seguir en la base');

      return `Eliminado "${borrado.name}" por ${pesos(borrado.amount)} · disponible ${pesos(500_000)} → ${pesos(disp)}`;
    },
  );

  await caso(
    {
      id: 'CU-EL-04',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Eliminar dos veces no vuelve a acreditar el monto',
      entrada: 'Mismo pocketId ya eliminado en CU-EL-03',
      esperado: 'Rechaza con POCKET_NOT_FOUND (HTTP 404) y el disponible sigue en 700.000',
    },
    async () => {
      const antes = await disponible(e.acc1);
      const detalle = await esperarCodigo(
        eliminar.execute({ userId: e.userId, pocketId: EST }),
        'POCKET_NOT_FOUND',
        'CU-EL-04: el segundo borrado debe rechazarse',
      );
      const despues = await disponible(e.acc1);
      verificarIgual(despues, antes, 'CU-EL-04: el saldo no debe volver a acreditarse');
      return `${detalle} · disponible sin cambios en ${pesos(despues)}`;
    },
  );

  // Restauración: transferir necesita dos bolsillos en la cuenta principal.
  const recreado = await crear.execute({
    userId: e.userId,
    accountId: e.acc1,
    name: 'Estudio',
    amount: 200_000,
  });
  EST = recreado.id;
  e.bolsillosCreados.push(EST);
}

// ── Transferir ──────────────────────────────────────────────────────────────

async function transferirEntreBolsillos(e: Escenario): Promise<void> {
  const GRUPO = 'Transferir entre bolsillos';
  const UNIDAD = 'TransferPocketBalance.execute';

  await caso(
    {
      id: 'CU-TR-01',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Transferir cero se rechaza',
      entrada: 'amount = 0',
      esperado: 'Rechaza con INVALID_TRANSFER_AMOUNT (HTTP 400). Rama inalcanzable por HTTP',
    },
    () =>
      esperarCodigo(
        transferir.execute({ userId: e.userId, fromPocketId: VAC, toPocketId: EST, amount: 0 }),
        'INVALID_TRANSFER_AMOUNT',
        'CU-TR-01: transferir cero debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-TR-02',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Origen y destino no pueden ser el mismo bolsillo',
      entrada: 'fromPocketId = toPocketId',
      esperado: 'Rechaza con INVALID_TRANSFER_TARGET (HTTP 400)',
    },
    () =>
      esperarCodigo(
        transferir.execute({ userId: e.userId, fromPocketId: VAC, toPocketId: VAC, amount: 10_000 }),
        'INVALID_TRANSFER_TARGET',
        'CU-TR-02: origen y destino iguales deben rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-TR-03',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un bolsillo de origen inexistente se rechaza',
      entrada: 'fromPocketId = UUID inexistente',
      esperado: 'Rechaza con SOURCE_POCKET_NOT_FOUND (HTTP 404)',
    },
    () =>
      esperarCodigo(
        transferir.execute({
          userId: e.userId,
          fromPocketId: UUID_INEXISTENTE,
          toPocketId: EST,
          amount: 10_000,
        }),
        'SOURCE_POCKET_NOT_FOUND',
        'CU-TR-03: un origen inexistente debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-TR-04',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un bolsillo de destino inexistente se rechaza',
      entrada: 'toPocketId = UUID inexistente',
      esperado: 'Rechaza con TARGET_POCKET_NOT_FOUND (HTTP 404)',
    },
    () =>
      esperarCodigo(
        transferir.execute({
          userId: e.userId,
          fromPocketId: VAC,
          toPocketId: UUID_INEXISTENTE,
          amount: 10_000,
        }),
        'TARGET_POCKET_NOT_FOUND',
        'CU-TR-04: un destino inexistente debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-TR-05',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'No se puede transferir entre bolsillos de cuentas distintas',
      entrada: 'Origen en la cuenta principal, destino en la cuenta secundaria',
      esperado: 'Rechaza con POCKETS_DIFFERENT_ACCOUNT (HTTP 400)',
    },
    () =>
      esperarCodigo(
        transferir.execute({
          userId: e.userId,
          fromPocketId: VAC,
          toPocketId: e.bolsilloOtraCuenta,
          amount: 10_000,
        }),
        'POCKETS_DIFFERENT_ACCOUNT',
        'CU-TR-05: bolsillos de cuentas distintas deben rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-TR-06',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un usuario ajeno no puede mover dinero entre bolsillos de la cuenta',
      entrada: 'userId ajeno sobre dos bolsillos válidos de la misma cuenta',
      esperado: 'Rechaza con FORBIDDEN (HTTP 403)',
    },
    async () => {
      const origenAntes = (await pocRepo.findById(VAC))!.amount;
      const detalle = await esperarCodigo(
        transferir.execute({
          userId: UUID_AJENO,
          fromPocketId: VAC,
          toPocketId: EST,
          amount: 10_000,
        }),
        'FORBIDDEN',
        'CU-TR-06: un usuario ajeno debe rechazarse',
      );
      verificarIgual(
        (await pocRepo.findById(VAC))!.amount,
        origenAntes,
        'CU-TR-06: el bolsillo de origen no debe cambiar',
      );
      return `${detalle} · origen intacto en ${pesos(origenAntes)}`;
    },
  );

  await caso(
    {
      id: 'CU-TR-07',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Valor límite: un peso más de lo que tiene el origen se rechaza',
      entrada: 'amount = 300.001 sobre un origen de 300.000',
      esperado: 'Rechaza con INSUFFICIENT_POCKET_BALANCE (HTTP 400)',
    },
    async () => {
      const origen = (await pocRepo.findById(VAC))!.amount;
      const detalle = await esperarCodigo(
        transferir.execute({
          userId: e.userId,
          fromPocketId: VAC,
          toPocketId: EST,
          amount: origen + 1,
        }),
        'INSUFFICIENT_POCKET_BALANCE',
        'CU-TR-07: exceder el saldo del origen debe rechazarse',
      );
      return `${detalle} · se pidió ${pesos(origen + 1)} de un bolsillo con ${pesos(origen)}`;
    },
  );

  await caso(
    {
      id: 'CU-TR-08',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Camino principal: mueve dinero entre reservas sin tocar el disponible',
      entrada: 'amount = 100.000, origen 300.000, destino 200.000',
      esperado:
        'El origen queda en 200.000, el destino en 300.000 y el disponible de la cuenta no cambia',
    },
    async () => {
      const dispAntes = await disponible(e.acc1);
      const resultado = await transferir.execute({
        userId: e.userId,
        fromPocketId: VAC,
        toPocketId: EST,
        amount: 100_000,
      });

      verificarIgual(resultado.fromPocket.amount, 200_000, 'CU-TR-08: el origen debe quedar en 200.000');
      verificarIgual(resultado.toPocket.amount, 300_000, 'CU-TR-08: el destino debe quedar en 300.000');

      const dispDespues = await disponible(e.acc1);
      verificarIgual(dispDespues, dispAntes, 'CU-TR-08: el disponible no debe cambiar');

      return (
        `origen ${pesos(300_000)} → ${pesos(resultado.fromPocket.amount)} · ` +
        `destino ${pesos(200_000)} → ${pesos(resultado.toPocket.amount)} · ` +
        `disponible intacto en ${pesos(dispDespues)}`
      );
    },
  );

  await caso(
    {
      id: 'CU-TR-09',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Valor límite: transferir el saldo completo del origen se acepta',
      entrada: 'amount = 200.000 sobre un origen de 200.000',
      esperado: 'El origen queda en 0 y el destino en 500.000, porque la condición usa < estricto',
    },
    async () => {
      const resultado = await transferir.execute({
        userId: e.userId,
        fromPocketId: VAC,
        toPocketId: EST,
        amount: 200_000,
      });
      verificarIgual(resultado.fromPocket.amount, 0, 'CU-TR-09: el origen debe quedar en 0');
      verificarIgual(resultado.toPocket.amount, 500_000, 'CU-TR-09: el destino debe quedar en 500.000');
      return `origen ${pesos(resultado.fromPocket.amount)} · destino ${pesos(resultado.toPocket.amount)}`;
    },
  );
}

// ── Consultar ───────────────────────────────────────────────────────────────

async function consultarBolsillos(e: Escenario): Promise<void> {
  const GRUPO = 'Consultar bolsillos';
  const UNIDAD = 'GetAccountPockets.execute';

  await caso(
    {
      id: 'CU-CO-01',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Una cuenta inexistente se rechaza',
      entrada: 'accountId = UUID válido pero inexistente',
      esperado: 'Rechaza con ACCOUNT_NOT_FOUND (HTTP 404)',
    },
    () =>
      esperarCodigo(
        consultar.execute({ userId: e.userId, accountId: UUID_INEXISTENTE }),
        'ACCOUNT_NOT_FOUND',
        'CU-CO-01: una cuenta inexistente debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-CO-02',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Un usuario ajeno no puede listar los bolsillos de la cuenta',
      entrada: 'userId ajeno sobre la cuenta principal',
      esperado: 'Rechaza con FORBIDDEN (HTTP 403), sin devolver ningún bolsillo',
    },
    () =>
      esperarCodigo(
        consultar.execute({ userId: UUID_AJENO, accountId: e.acc1 }),
        'FORBIDDEN',
        'CU-CO-02: un usuario ajeno debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'CU-CO-03',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Devuelve los bolsillos de la cuenta en su representación pública',
      entrada: 'Cuenta principal con dos bolsillos',
      esperado:
        'Arreglo de 2 elementos, cada uno con exactamente id, accountId, name, amount, createdAt y updatedAt',
    },
    async () => {
      const lista = await consultar.execute({ userId: e.userId, accountId: e.acc1 });
      verificarIgual(lista.length, 2, 'CU-CO-03: deben devolverse 2 bolsillos');

      const claves = Object.keys(lista[0]!).sort().join(',');
      verificarIgual(
        claves,
        'accountId,amount,createdAt,id,name,updatedAt',
        'CU-CO-03: la forma de cada elemento no coincide con toPublic()',
      );

      const total = lista.reduce((suma, p) => suma + p.amount, 0);
      verificarIgual(total, 500_000, 'CU-CO-03: la suma de los bolsillos debe ser 500.000');

      const nombres = lista.map((p) => `${p.name}=${pesos(p.amount)}`).join(', ');
      return `${lista.length} bolsillos: ${nombres}`;
    },
  );

  await caso(
    {
      id: 'CU-CO-04',
      grupo: GRUPO,
      unidad: UNIDAD,
      descripcion: 'Una cuenta sin bolsillos devuelve un arreglo vacío, no un error',
      entrada: 'Cuenta sin depósito ni bolsillos',
      esperado: 'Devuelve [] con longitud 0',
    },
    async () => {
      const lista = await consultar.execute({ userId: e.userId, accountId: e.acc3 });
      verificarIgual(lista.length, 0, 'CU-CO-04: la lista debe estar vacía');
      return `Arreglo vacío (longitud ${lista.length})`;
    },
  );

  await caso(
    {
      id: 'CU-CO-05',
      grupo: GRUPO,
      unidad: 'Invariante de saldo',
      descripcion:
        'Tras crear, actualizar, eliminar y transferir, lo reservado más lo disponible sigue siendo lo depositado',
      entrada: 'Cuenta principal al final de la corrida',
      esperado: 'disponible + reservado = 1.000.000, el depósito inicial',
    },
    async () => {
      const disp = await disponible(e.acc1);
      const res = await reservado(e.acc1);
      verificarIgual(disp + res, 1_000_000, 'CU-CO-05: la invariante de saldo se rompió');
      return `disponible ${pesos(disp)} + reservado ${pesos(res)} = ${pesos(disp + res)}`;
    },
  );
}
