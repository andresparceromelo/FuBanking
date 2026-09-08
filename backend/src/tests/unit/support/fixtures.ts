/**
 * Montaje y desmontaje del escenario de la Parte B.
 *
 * No hay dobles: se usan los repositorios Supabase reales y los casos de uso de
 * cuentas para crear el estado inicial. Todo lo que se crea queda registrado
 * para poder borrarlo al final y dejar la base como estaba.
 */

import supabase from '../../../infrastructure/database/supabase.client';
import { SupabaseAccountRepository } from '../../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabasePocketRepository } from '../../../infrastructure/repositories/SupabasePocketRepository';
import { SupabaseNotificationRepository } from '../../../infrastructure/repositories/SupabaseNotificationRepository';
import { CreateAccount } from '../../../application/use-cases/account/CreateAccount';
import { DepositMoney } from '../../../application/use-cases/account/DepositMoney';
import { CreatePocket } from '../../../application/use-cases/pocket/CreatePocket';
import { UpdatePocket } from '../../../application/use-cases/pocket/UpdatePocket';
import { DeletePocket } from '../../../application/use-cases/pocket/DeletePocket';
import { TransferPocketBalance } from '../../../application/use-cases/pocket/TransferPocketBalance';
import { GetAccountPockets } from '../../../application/use-cases/pocket/GetAccountPockets';

/** UUID con formato válido que no corresponde a ningún registro. */
export const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

/**
 * UUID de un usuario que no es el dueño de las cuentas de prueba.
 * No necesita existir: `assertBelongsTo` compara contra el dueño de la cuenta y
 * lanza antes de consultar nada del usuario.
 */
export const UUID_AJENO = '11111111-1111-4111-8111-111111111111';

export interface Escenario {
  userId: string;
  correoUsuario: string;
  /** Cuenta principal — $1.000.000 de fondos totales. */
  acc1: string;
  /** Cuenta secundaria — $200.000 de fondos totales. */
  acc2: string;
  /** Cuenta sin depósito ni bolsillos. */
  acc3: string;
  /** Bolsillo auxiliar de `acc2`, para el caso de cuentas distintas. */
  bolsilloOtraCuenta: string;
  /** Instante en que arrancó el montaje, para acotar la limpieza. */
  inicio: Date;
  /** Ids de bolsillos creados durante la corrida, para la limpieza. */
  bolsillosCreados: string[];
}

// ── Repositorios y casos de uso reales ──────────────────────────────────────

export const accRepo = new SupabaseAccountRepository(supabase);
export const pocRepo = new SupabasePocketRepository(supabase);
export const notRepo = new SupabaseNotificationRepository(supabase);

export const crear = new CreatePocket(accRepo, pocRepo, notRepo);
export const actualizar = new UpdatePocket(accRepo, pocRepo, notRepo);
export const eliminar = new DeletePocket(accRepo, pocRepo, notRepo);
export const transferir = new TransferPocketBalance(accRepo, pocRepo, notRepo);
export const consultar = new GetAccountPockets(accRepo, pocRepo);

const crearCuenta = new CreateAccount(accRepo);
/** Se construye sin repositorio de transacciones ni de notificaciones: el
 *  depósito es solo andamiaje del escenario, no la unidad bajo prueba. */
const depositar = new DepositMoney(accRepo);

// ── Montaje ─────────────────────────────────────────────────────────────────

/** Busca un usuario ya existente en la base para colgar de él las cuentas. */
async function buscarUsuario(): Promise<{ id: string; email: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`No se pudo consultar la tabla users: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(
      'La tabla users está vacía. La Parte B necesita un usuario existente al que asociar las cuentas de prueba.',
    );
  }

  return { id: data[0]!.id as string, email: data[0]!.email as string };
}

/**
 * Comprueba que la tabla `pockets` sea realmente accesible antes de montar nada.
 *
 * `SupabasePocketRepository` tiene un respaldo en memoria que se activa solo si
 * la tabla no está disponible: a partir de ese momento `save` y `findById`
 * siguen respondiendo con éxito, pero contra un `Map` del proceso en vez de
 * contra la base. Sin esta comprobación la Parte B correría contra ese respaldo
 * y reportaría verde sin haber tocado Supabase, que es precisamente lo que esta
 * suite existe para evitar.
 */
async function exigirTablaBolsillos(): Promise<void> {
  const { error } = await supabase.from('pockets').select('id').limit(1);
  if (error) {
    throw new Error(
      `La tabla 'pockets' no está disponible en Supabase (${error.code}: ${error.message}). ` +
        'Si la Parte B se ejecutara igual, SupabasePocketRepository activaría su respaldo en memoria ' +
        'y los bolsillos no se persistirían, invalidando la corrida. Crear la tabla o recargar la ' +
        'caché de esquema de PostgREST y volver a ejecutar.',
    );
  }
}

export async function montarEscenario(): Promise<Escenario> {
  const inicio = new Date();
  await exigirTablaBolsillos();
  const usuario = await buscarUsuario();

  const cuenta1 = await crearCuenta.execute({ userId: usuario.id, type: 'AHORROS' as any });
  const cuenta2 = await crearCuenta.execute({ userId: usuario.id, type: 'AHORROS' as any });
  const cuenta3 = await crearCuenta.execute({ userId: usuario.id, type: 'AHORROS' as any });

  await depositar.execute({ userId: usuario.id, accountId: cuenta1.id, amount: 1_000_000 });
  await depositar.execute({ userId: usuario.id, accountId: cuenta2.id, amount: 200_000 });
  // cuenta3 se deja en $0 y sin bolsillos a propósito.

  const auxiliar = await crear.execute({
    userId: usuario.id,
    accountId: cuenta2.id,
    name: 'Otra cuenta',
    amount: 50_000,
  });

  return {
    userId: usuario.id,
    correoUsuario: usuario.email,
    acc1: cuenta1.id,
    acc2: cuenta2.id,
    acc3: cuenta3.id,
    bolsilloOtraCuenta: auxiliar.id,
    inicio,
    bolsillosCreados: [auxiliar.id],
  };
}

/**
 * Cambia el estado de una cuenta directamente en la tabla.
 * Necesario porque ni los casos de uso ni la API exponen forma de bloquear una
 * cuenta, y la rama ACCOUNT_NOT_OPERATIONAL no se puede alcanzar de otro modo.
 */
export async function cambiarEstadoCuenta(accountId: string, estado: string): Promise<void> {
  const { error } = await supabase.from('accounts').update({ status: estado }).eq('id', accountId);
  if (error) throw new Error(`No se pudo cambiar el estado de la cuenta: ${error.message}`);
}

// ── Desmontaje ──────────────────────────────────────────────────────────────

export interface ResultadoLimpieza {
  bolsillos: number;
  notificaciones: number;
  detalles: number;
  cuentas: number;
  errores: string[];
}

/**
 * Borra todo lo que creó la corrida y deja la base como estaba.
 * Solo toca filas de las tres cuentas de prueba y las notificaciones de tipo
 * BOLSILLO emitidas después del inicio del montaje.
 */
export async function desmontarEscenario(escenario: Escenario): Promise<ResultadoLimpieza> {
  const cuentas = [escenario.acc1, escenario.acc2, escenario.acc3];
  const resultado: ResultadoLimpieza = {
    bolsillos: 0,
    notificaciones: 0,
    detalles: 0,
    cuentas: 0,
    errores: [],
  };

  // 1. Bolsillos de las cuentas de prueba.
  const borradoBolsillos = await supabase
    .from('pockets')
    .delete()
    .in('account_id', cuentas)
    .select('id');
  if (borradoBolsillos.error) resultado.errores.push(`pockets: ${borradoBolsillos.error.message}`);
  else resultado.bolsillos = borradoBolsillos.data?.length ?? 0;

  // 2. Notificaciones de bolsillos emitidas durante la corrida.
  const borradoNotis = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', escenario.userId)
    .eq('type', 'BOLSILLO')
    .gte('created_at', escenario.inicio.toISOString())
    .select('id');
  if (borradoNotis.error) resultado.errores.push(`notifications: ${borradoNotis.error.message}`);
  else resultado.notificaciones = borradoNotis.data?.length ?? 0;

  // 3. Detalles de cuenta (dependen de accounts por clave foránea).
  const borradoDetalles = await supabase
    .from('account_details')
    .delete()
    .in('account_id', cuentas)
    .select('id');
  if (borradoDetalles.error) resultado.errores.push(`account_details: ${borradoDetalles.error.message}`);
  else resultado.detalles = borradoDetalles.data?.length ?? 0;

  // 4. Las cuentas de prueba.
  const borradoCuentas = await supabase.from('accounts').delete().in('id', cuentas).select('id');
  if (borradoCuentas.error) resultado.errores.push(`accounts: ${borradoCuentas.error.message}`);
  else resultado.cuentas = borradoCuentas.data?.length ?? 0;

  return resultado;
}
