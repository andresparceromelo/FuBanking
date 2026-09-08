/**
 * Pruebas unitarias de la entidad `Pocket`.
 *
 * Unidad completamente aislada: la entidad no colabora con nada, así que no hay
 * ninguna dependencia que sustituir. Se instancia y se llama directamente.
 */

import { Pocket } from '../../domain/entities/Pocket';
import { caso, esperarCodigoSync, verificar, verificarIgual } from './support/runner';

const GRUPO_C = 'Entidad Pocket · construcción';
const GRUPO_M = 'Entidad Pocket · mutadores';

/** Props válidas por defecto, sobreescribibles por caso. */
function props(sobrescribir: Partial<{ id: string; accountId: string; name: string; amount: number }> = {}) {
  return {
    id: 'p1',
    accountId: 'a1',
    name: 'Vacaciones',
    amount: 100,
    ...sobrescribir,
  } as any;
}

export async function ejecutarPocketEntity(): Promise<void> {
  // ── Construcción ──────────────────────────────────────────────────────────

  await caso(
    {
      id: 'PU-01',
      grupo: GRUPO_C,
      unidad: 'Pocket.create',
      descripcion: 'El factory recorta los espacios sobrantes del nombre',
      entrada: 'name = "  Vacaciones  "',
      esperado: 'El bolsillo queda con name = "Vacaciones", sin espacios en los extremos',
    },
    () => {
      const p = Pocket.create(props({ name: '  Vacaciones  ' }));
      verificarIgual(p.name, 'Vacaciones', 'PU-01: el nombre debe quedar recortado');
      return `name = ${JSON.stringify(p.name)}`;
    },
  );

  await caso(
    {
      id: 'PU-02',
      grupo: GRUPO_C,
      unidad: 'Pocket.create',
      descripcion: 'Valor límite inferior del monto: se acepta el cero',
      entrada: 'amount = 0',
      esperado: 'El bolsillo se construye con amount = 0, sin lanzar',
    },
    () => {
      const p = Pocket.create(props({ amount: 0 }));
      verificarIgual(p.amount, 0, 'PU-02: el monto debe ser 0');
      return `amount = ${p.amount}`;
    },
  );

  await caso(
    {
      id: 'PU-03',
      grupo: GRUPO_C,
      unidad: 'Pocket.assertValidAmount',
      descripcion: 'Un monto negativo se rechaza al construir',
      entrada: 'amount = -1',
      esperado: 'Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400)',
    },
    () =>
      esperarCodigoSync(
        () => Pocket.create(props({ amount: -1 })),
        'INVALID_POCKET_AMOUNT',
        'PU-03: un monto negativo debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'PU-04',
      grupo: GRUPO_C,
      unidad: 'Pocket.assertValidAmount',
      descripcion: 'NaN se rechaza al construir',
      entrada: 'amount = NaN',
      esperado: 'Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400)',
    },
    () =>
      esperarCodigoSync(
        () => Pocket.create(props({ amount: NaN })),
        'INVALID_POCKET_AMOUNT',
        'PU-04: NaN debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'PU-05',
      grupo: GRUPO_C,
      unidad: 'Pocket.assertValidAmount',
      descripcion: 'Una cadena numérica se rechaza: la comprobación es de tipo, no de valor',
      entrada: 'amount = "100"',
      esperado: 'Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400) porque typeof !== "number"',
    },
    () =>
      esperarCodigoSync(
        () => Pocket.create(props({ amount: '100' as any })),
        'INVALID_POCKET_AMOUNT',
        'PU-05: una cadena numérica debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'PU-06',
      grupo: GRUPO_C,
      unidad: 'Pocket (constructor)',
      descripcion: 'Un nombre vacío debe rechazarse al construir, igual que al modificar',
      entrada: 'name = ""',
      esperado:
        'Lanza AppError INVALID_POCKET_NAME (HTTP 400), la misma regla que aplica updateName("")',
      defecto: 'D-01',
    },
    () =>
      esperarCodigoSync(
        () => Pocket.create(props({ name: '' })),
        'INVALID_POCKET_NAME',
        'PU-06: un nombre vacío debe rechazarse al construir',
      ),
  );

  await caso(
    {
      id: 'PU-07',
      grupo: GRUPO_C,
      unidad: 'Pocket.toPublic',
      descripcion: 'La representación pública expone seis campos y ningún dato interno',
      entrada: 'Bolsillo válido recién construido',
      esperado:
        'toPublic() devuelve exactamente id, accountId, name, amount, createdAt y updatedAt, con las fechas como cadena ISO',
    },
    () => {
      const pub = Pocket.create(props()).toPublic();
      const claves = Object.keys(pub).join(',');
      verificarIgual(
        claves,
        'id,accountId,name,amount,createdAt,updatedAt',
        'PU-07: las claves de toPublic() no coinciden',
      );
      verificar(typeof pub.createdAt === 'string', 'PU-07: createdAt debe ser una cadena');
      verificar(
        /^\d{4}-\d{2}-\d{2}T/.test(pub.createdAt),
        'PU-07: createdAt debe tener formato ISO',
      );
      return `claves = ${claves} · createdAt = ${pub.createdAt}`;
    },
  );

  // ── Mutadores ─────────────────────────────────────────────────────────────

  await caso(
    {
      id: 'PU-08',
      grupo: GRUPO_M,
      unidad: 'Pocket.updateAmount',
      descripcion: 'Valor límite inferior al mutar: se acepta el cero',
      entrada: 'Bolsillo de $300.000, updateAmount(0)',
      esperado: 'El monto queda en 0, sin lanzar',
    },
    () => {
      const p = Pocket.create(props({ amount: 300000 }));
      p.updateAmount(0);
      verificarIgual(p.amount, 0, 'PU-08: el monto debe quedar en 0');
      return `amount = ${p.amount}`;
    },
  );

  await caso(
    {
      id: 'PU-09',
      grupo: GRUPO_M,
      unidad: 'Pocket.updateAmount',
      descripcion: 'Un monto negativo se rechaza al mutar',
      entrada: 'updateAmount(-1)',
      esperado: 'Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400)',
    },
    () => {
      const p = Pocket.create(props({ amount: 300000 }));
      return esperarCodigoSync(
        () => p.updateAmount(-1),
        'INVALID_POCKET_AMOUNT',
        'PU-09: un monto negativo debe rechazarse',
      );
    },
  );

  await caso(
    {
      id: 'PU-10',
      grupo: GRUPO_M,
      unidad: 'Pocket.updateAmount',
      descripcion: 'NaN se rechaza al mutar',
      entrada: 'updateAmount(NaN)',
      esperado: 'Lanza AppError INVALID_POCKET_AMOUNT (HTTP 400)',
    },
    () => {
      const p = Pocket.create(props({ amount: 300000 }));
      return esperarCodigoSync(
        () => p.updateAmount(NaN),
        'INVALID_POCKET_AMOUNT',
        'PU-10: NaN debe rechazarse',
      );
    },
  );

  await caso(
    {
      id: 'PU-11',
      grupo: GRUPO_M,
      unidad: 'Pocket.updateName',
      descripcion: 'El mutador también recorta los espacios sobrantes',
      entrada: 'updateName("  Bici  ")',
      esperado: 'El nombre queda en "Bici"',
    },
    () => {
      const p = Pocket.create(props());
      p.updateName('  Bici  ');
      verificarIgual(p.name, 'Bici', 'PU-11: el nombre debe quedar recortado');
      return `name = ${JSON.stringify(p.name)}`;
    },
  );

  await caso(
    {
      id: 'PU-12',
      grupo: GRUPO_M,
      unidad: 'Pocket.updateName',
      descripcion: 'Un nombre de solo espacios se rechaza al mutar',
      entrada: 'updateName("   ")',
      esperado: 'Lanza AppError INVALID_POCKET_NAME (HTTP 400)',
    },
    () => {
      const p = Pocket.create(props());
      return esperarCodigoSync(
        () => p.updateName('   '),
        'INVALID_POCKET_NAME',
        'PU-12: un nombre de solo espacios debe rechazarse',
      );
    },
  );

  await caso(
    {
      id: 'PU-13',
      grupo: GRUPO_M,
      unidad: 'Pocket.updateAmount',
      descripcion: 'Mutar refresca la marca de tiempo de modificación',
      entrada: 'Bolsillo recién creado, updateAmount(20)',
      esperado: 'updatedAt queda igual o posterior al valor previo a la mutación',
    },
    () => {
      const p = Pocket.create(props({ amount: 10 }));
      const antes = p.updatedAt.getTime();
      p.updateAmount(20);
      const despues = p.updatedAt.getTime();
      verificar(despues >= antes, 'PU-13: updatedAt debe refrescarse al mutar');
      return `updatedAt ${antes} → ${despues} (delta ${despues - antes} ms)`;
    },
  );
}
