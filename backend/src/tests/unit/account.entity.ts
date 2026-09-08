/**
 * Pruebas unitarias de la entidad `Account`, acotadas a las dos reglas que
 * consultan los casos de uso del módulo Bolsillos.
 *
 * Unidad aislada: la entidad se construye en memoria a partir de sus props, sin
 * repositorio ni base de datos de por medio.
 */

import { Account, AccountStatus, AccountType } from '../../domain/entities/Account';
import { caso, esperarCodigoSync, verificar, verificarIgual } from './support/runner';

const GRUPO = 'Entidad Account';

/** Construye una cuenta en memoria con el estado y el dueño indicados. */
function cuenta(status: AccountStatus, userId = 'u1'): Account {
  return new Account({
    id: 'a1',
    userId,
    accountNumber: 'BA1000000000',
    accountType: AccountType.AHORROS,
    balance: 1000,
    status,
    details: null,
    createdAt: new Date(),
  });
}

export async function ejecutarAccountEntity(): Promise<void> {
  await caso(
    {
      id: 'AU-01',
      grupo: GRUPO,
      unidad: 'Account.isOperational',
      descripcion: 'Una cuenta ACTIVA sí puede operar',
      entrada: 'status = ACTIVA',
      esperado: 'isOperational() devuelve true',
    },
    () => {
      const resultado = cuenta(AccountStatus.ACTIVA).isOperational();
      verificarIgual(resultado, true, 'AU-01: una cuenta ACTIVA debe ser operativa');
      return `isOperational() = ${resultado}`;
    },
  );

  await caso(
    {
      id: 'AU-02',
      grupo: GRUPO,
      unidad: 'Account.isOperational',
      descripcion: 'Solo ACTIVA opera: BLOQUEADA y CERRADA quedan fuera',
      entrada: 'status = BLOQUEADA y status = CERRADA',
      esperado: 'isOperational() devuelve false en ambos casos',
    },
    () => {
      const bloqueada = cuenta(AccountStatus.BLOQUEADA).isOperational();
      const cerrada = cuenta(AccountStatus.CERRADA).isOperational();
      verificarIgual(bloqueada, false, 'AU-02: una cuenta BLOQUEADA no debe ser operativa');
      verificarIgual(cerrada, false, 'AU-02: una cuenta CERRADA no debe ser operativa');
      return `BLOQUEADA = ${bloqueada} · CERRADA = ${cerrada}`;
    },
  );

  await caso(
    {
      id: 'AU-03',
      grupo: GRUPO,
      unidad: 'Account.assertBelongsTo',
      descripcion: 'El dueño de la cuenta pasa la comprobación de propiedad',
      entrada: 'Cuenta de "u1", se comprueba contra "u1"',
      esperado: 'assertBelongsTo no lanza ninguna excepción',
    },
    () => {
      cuenta(AccountStatus.ACTIVA, 'u1').assertBelongsTo('u1');
      verificar(true, 'AU-03: no debe lanzar');
      return 'assertBelongsTo("u1") no lanzó excepción';
    },
  );

  await caso(
    {
      id: 'AU-04',
      grupo: GRUPO,
      unidad: 'Account.assertBelongsTo',
      descripcion: 'Un usuario ajeno es rechazado en la capa de dominio',
      entrada: 'Cuenta de "u1", se comprueba contra "u2"',
      esperado: 'Lanza AppError FORBIDDEN (HTTP 403)',
    },
    () =>
      esperarCodigoSync(
        () => cuenta(AccountStatus.ACTIVA, 'u1').assertBelongsTo('u2'),
        'FORBIDDEN',
        'AU-04: un usuario ajeno debe ser rechazado',
      ),
  );
}
