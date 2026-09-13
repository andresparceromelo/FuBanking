/**
 * Pruebas unitarias de los schemas de validación del módulo Bolsillos.
 *
 * Unidad aislada: un schema Zod es una función pura de datos a resultado, sin
 * dependencias que sustituir.
 */

import {
  createPocketSchema,
  updatePocketSchema,
  transferPocketSchema,
} from '../../presentation/validators/pocket.validators';
import { caso, verificar, verificarIgual } from './support/runner';

const GRUPO = 'Schemas de validación';
const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

type Schema = { safeParse: (data: unknown) => any };

/** Comprueba que el schema ACEPTE los datos y devuelve el dato ya parseado. */
function aceptar(schema: Schema, datos: unknown, mensaje: string): { texto: string; data: any } {
  const r = schema.safeParse(datos);
  if (!r.success) {
    const detalle = r.error.issues
      .map((i: any) => `${i.path.join('.') || '(raíz)'}: ${i.message}`)
      .join(' | ');
    throw new Error(`${mensaje} — el schema rechazó datos que debía aceptar: ${detalle}`);
  }
  return { texto: `Aceptó y parseó a ${JSON.stringify(r.data)}`, data: r.data };
}

/** Comprueba que el schema RECHACE los datos y devuelve los mensajes emitidos. */
function rechazar(schema: Schema, datos: unknown, mensaje: string): string {
  const r = schema.safeParse(datos);
  if (r.success) {
    throw new Error(
      `${mensaje} — el schema aceptó datos que debía rechazar; los parseó a ${JSON.stringify(r.data)}`,
    );
  }
  const detalle = r.error.issues
    .map((i: any) => `${i.path.join('.') || '(raíz)'}: ${i.message}`)
    .join(' | ');
  return `Rechazó con ${detalle}`;
}

export async function ejecutarPocketValidators(): Promise<void> {

  await caso(
    {
      id: 'VU-01',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Una carga válida se acepta y conserva los tres campos',
      entrada: '{ accountId: UUID, name: "Vacaciones", amount: 300000 }',
      esperado: 'Acepta y devuelve amount = 300000 sin alterarlo',
    },
    () => {
      const { texto, data } = aceptar(
        createPocketSchema,
        { accountId: UUID, name: 'Vacaciones', amount: 300000 },
        'VU-01: una carga válida debe aceptarse',
      );
      verificarIgual(data.amount, 300000, 'VU-01: el monto no debe alterarse');
      verificarIgual(data.name, 'Vacaciones', 'VU-01: el nombre no debe alterarse');
      return texto;
    },
  );

  await caso(
    {
      id: 'VU-02',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Una cadena numérica se coacciona a número',
      entrada: 'amount = "300000"',
      esperado: 'Acepta y coacciona a amount = 300000 (número), por z.coerce.number()',
    },
    () => {
      const { texto, data } = aceptar(
        createPocketSchema,
        { accountId: UUID, name: 'V', amount: '300000' },
        'VU-02: una cadena numérica debe coaccionarse',
      );
      verificarIgual(data.amount, 300000, 'VU-02: debe quedar como número 300000');
      verificarIgual(typeof data.amount, 'number', 'VU-02: el tipo resultante debe ser number');
      return texto;
    },
  );

  await caso(
    {
      id: 'VU-03',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Un booleano no es un monto y debe rechazarse',
      entrada: 'amount = true',
      esperado: 'Rechaza: un booleano no representa una cantidad de dinero',
      defecto: 'D-02',
    },
    () =>
      rechazar(
        createPocketSchema,
        { accountId: UUID, name: 'V', amount: true },
        'VU-03: un booleano debe rechazarse como monto',
      ),
  );

  await caso(
    {
      id: 'VU-04',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Un monto negativo se rechaza',
      entrada: 'amount = -1',
      esperado: 'Rechaza con "El monto del bolsillo no puede ser negativo"',
    },
    () =>
      rechazar(
        createPocketSchema,
        { accountId: UUID, name: 'V', amount: -1 },
        'VU-04: un monto negativo debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'VU-05',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Un accountId que no es UUID se rechaza',
      entrada: 'accountId = "abc"',
      esperado: 'Rechaza con "accountId debe ser un UUID válido"',
    },
    () =>
      rechazar(
        createPocketSchema,
        { accountId: 'abc', name: 'V', amount: 1 },
        'VU-05: un accountId malformado debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'VU-06',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Un nombre vacío se rechaza',
      entrada: 'name = ""',
      esperado: 'Rechaza con "El nombre del bolsillo es obligatorio"',
    },
    () =>
      rechazar(
        createPocketSchema,
        { accountId: UUID, name: '', amount: 1 },
        'VU-06: un nombre vacío debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'VU-07',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Un nombre de solo espacios está vacío en la práctica y debe rechazarse',
      entrada: 'name = "   "',
      esperado: 'Rechaza: tres espacios no son un nombre',
      defecto: 'D-03',
    },
    () =>
      rechazar(
        createPocketSchema,
        { accountId: UUID, name: '   ', amount: 1 },
        'VU-07: un nombre de solo espacios debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'VU-08',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Valor límite superior del nombre: 150 caracteres se aceptan',
      entrada: 'name con 150 caracteres',
      esperado: 'Acepta, porque el máximo declarado es 150',
    },
    () => {
      const nombre = 'A'.repeat(150);
      const { data } = aceptar(
        createPocketSchema,
        { accountId: UUID, name: nombre, amount: 1 },
        'VU-08: 150 caracteres deben aceptarse',
      );
      verificarIgual(data.name.length, 150, 'VU-08: el nombre debe conservar sus 150 caracteres');
      return `Aceptó un nombre de ${data.name.length} caracteres`;
    },
  );

  await caso(
    {
      id: 'VU-09',
      grupo: GRUPO,
      unidad: 'createPocketSchema',
      descripcion: 'Valor límite superior del nombre: 151 caracteres se rechazan',
      entrada: 'name con 151 caracteres',
      esperado: 'Rechaza con "El nombre del bolsillo no puede superar 150 caracteres"',
    },
    () =>
      rechazar(
        createPocketSchema,
        { accountId: UUID, name: 'A'.repeat(151), amount: 1 },
        'VU-09: 151 caracteres deben rechazarse',
      ),
  );


  await caso(
    {
      id: 'VU-10',
      grupo: GRUPO,
      unidad: 'updatePocketSchema',
      descripcion: 'Un cuerpo sin ningún campo se rechaza',
      entrada: '{}',
      esperado: 'Rechaza con "Debes enviar al menos un campo para actualizar"',
    },
    () => rechazar(updatePocketSchema, {}, 'VU-10: un cuerpo vacío debe rechazarse'),
  );

  await caso(
    {
      id: 'VU-11',
      grupo: GRUPO,
      unidad: 'updatePocketSchema',
      descripcion: 'Una cadena numérica se coacciona igual que al crear (VU-02)',
      entrada: 'amount = "500"',
      esperado: 'Acepta y coacciona a amount = 500, con el mismo criterio que createPocketSchema',
      defecto: 'D-04',
    },
    () => {
      const { texto, data } = aceptar(
        updatePocketSchema,
        { amount: '500' },
        'VU-11: una cadena numérica debe coaccionarse igual que al crear',
      );
      verificarIgual(data.amount, 500, 'VU-11: debe quedar como número 500');
      return texto;
    },
  );

  await caso(
    {
      id: 'VU-12',
      grupo: GRUPO,
      unidad: 'updatePocketSchema',
      descripcion: 'Ajustar un bolsillo a cero es un cambio válido',
      entrada: 'amount = 0',
      esperado: 'Acepta con amount = 0',
    },
    () => {
      const { texto, data } = aceptar(
        updatePocketSchema,
        { amount: 0 },
        'VU-12: el cero debe aceptarse al ajustar',
      );
      verificarIgual(data.amount, 0, 'VU-12: el monto debe ser 0');
      return texto;
    },
  );


  await caso(
    {
      id: 'VU-13',
      grupo: GRUPO,
      unidad: 'transferPocketSchema',
      descripcion: 'Valor límite inferior: transferir cero se rechaza, a diferencia de ajustar',
      entrada: 'amount = 0',
      esperado: 'Rechaza con "El monto de transferencia debe ser mayor que cero" (condición gt(0))',
    },
    () =>
      rechazar(
        transferPocketSchema,
        { fromPocketId: UUID, toPocketId: UUID, amount: 0 },
        'VU-13: transferir cero debe rechazarse',
      ),
  );

  await caso(
    {
      id: 'VU-14',
      grupo: GRUPO,
      unidad: 'transferPocketSchema',
      descripcion: 'Se admiten fracciones de peso',
      entrada: 'amount = 0.01',
      esperado: 'Acepta con amount = 0.01',
    },
    () => {
      const { texto, data } = aceptar(
        transferPocketSchema,
        { fromPocketId: UUID, toPocketId: UUID, amount: 0.01 },
        'VU-14: una fracción positiva debe aceptarse',
      );
      verificarIgual(data.amount, 0.01, 'VU-14: el monto debe ser 0.01');
      return texto;
    },
  );

  await caso(
    {
      id: 'VU-15',
      grupo: GRUPO,
      unidad: 'transferPocketSchema',
      descripcion: 'Un fromPocketId que no es UUID se rechaza',
      entrada: 'fromPocketId = "abc"',
      esperado: 'Rechaza con "fromPocketId debe ser un UUID válido"',
    },
    () => {
      const texto = rechazar(
        transferPocketSchema,
        { fromPocketId: 'abc', toPocketId: UUID, amount: 100 },
        'VU-15: un fromPocketId malformado debe rechazarse',
      );
      verificar(texto.includes('fromPocketId'), 'VU-15: el error debe señalar el campo fromPocketId');
      return texto;
    },
  );
}
