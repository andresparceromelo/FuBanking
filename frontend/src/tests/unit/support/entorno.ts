/**
 * Montaje del entorno de las pruebas del frontend.
 *
 * El servicio bajo el handler es el REAL: `pocketService` sobre `apiClient`
 * (axios), apuntando al backend que esté corriendo. No se sustituye por nada.
 *
 * Lo único que no puede ser real son el API de toasts y los setters de estado
 * de React: fuera de un runtime de React con DOM no existe implementación
 * alguna de esas dependencias, y el comportamiento observable de un handler es
 * precisamente la secuencia de llamadas que les hace. Por eso aquí se les pasan
 * REGISTRADORES: funciones que solo anotan lo ocurrido para poder afirmarlo
 * después. No simulan lógica ni devuelven datos inventados.
 */

import { apiClient } from '@/shared/services/api.client';
import type { PocketItem } from '../../../features/pockets/services/pocket.service';

/** UUID con formato válido que no corresponde a ningún registro. */
export const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

/** Credenciales del usuario sintético que la suite usa para autenticarse. */
const USUARIO_PRUEBA = {
  firstName: 'Quiara',
  lastName: 'Frontend',
  birthDate: '1998-05-20',
  email: 'qa.frontend.bolsillos@fubank.com',
  document: '9100000001',
  password: 'Segura123',
  confirmPassword: 'Segura123',
};

/** Fondos que debe tener la cuenta de trabajo. */
const FONDOS = 1_000_000;

export interface Escenario {
  /** Cuenta con saldo sobre la que se ejercitan los caminos. */
  accountId: string;
  /** Correo del usuario autenticado. */
  correo: string;
}


/**
 * Obtiene un token real del backend y lo fija en la instancia de axios.
 *
 * En el navegador el token lo adjunta el interceptor leyéndolo de
 * `localStorage`; en Node no existe `window`, así que se fija directamente
 * sobre el cliente real. No se simula `localStorage` ni se sustituye axios.
 */
async function autenticar(): Promise<void> {
  let token: string | undefined;

  try {
    const r: any = await apiClient.post('/auth/login', {
      email: USUARIO_PRUEBA.email,
      password: USUARIO_PRUEBA.password,
    });
    if (r?.data?.requiresTwoFactor) {
      throw new Error(
        'El usuario de pruebas tiene 2FA activo. Desactivarlo para que la suite pueda autenticarse sin intervención.',
      );
    }
    token = r?.data?.token;
  } catch (error: any) {
    if (error?.code !== 'INVALID_CREDENTIALS') throw error;
    const r: any = await apiClient.post('/auth/register', USUARIO_PRUEBA);
    token = r?.data?.token;
  }

  if (!token) throw new Error('El backend no devolvió un token de acceso.');
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}


/**
 * Deja lista una cuenta con saldo suficiente.
 * Reutiliza una cuenta previa si la hay, para no acumular cuentas en cada corrida.
 */
async function prepararCuenta(): Promise<string> {
  const propias: any = await apiClient.get('/accounts/me');
  const cuentas: any[] = propias?.data ?? [];

  const utilizable = cuentas.find((c) => c.status === 'ACTIVA' && Number(c.balance) >= FONDOS);
  if (utilizable) return utilizable.id;

  const activa = cuentas.find((c) => c.status === 'ACTIVA');
  const cuentaId = activa
    ? activa.id
    : ((await apiClient.post('/accounts', { type: 'AHORROS' })) as any)?.data?.id;

  if (!cuentaId) throw new Error('No se pudo obtener ni crear una cuenta de trabajo.');

  const saldoActual = activa ? Number(activa.balance) : 0;
  const faltante = FONDOS - saldoActual;
  if (faltante > 0) {
    await apiClient.post(`/accounts/${cuentaId}/deposit`, {
      amount: faltante,
      description: 'Fondeo de pruebas del frontend',
    });
  }

  return cuentaId;
}

export async function montarEscenario(): Promise<Escenario> {
  await autenticar();
  const accountId = await prepararCuenta();
  return { accountId, correo: USUARIO_PRUEBA.email };
}

/** Crea un bolsillo real a través de la API, para usarlo como dato de partida. */
export async function crearBolsilloReal(
  accountId: string,
  name: string,
  amount: number,
): Promise<PocketItem> {
  const r: any = await apiClient.post('/pockets', { accountId, name, amount });
  return r.data as PocketItem;
}

/** Borra un bolsillo real a través de la API. Ignora que ya no exista. */
export async function borrarBolsilloReal(pocketId: string): Promise<void> {
  try {
    await apiClient.delete(`/pockets/${pocketId}`);
  } catch {
    /* ya no estaba */
  }
}

/** Lista los bolsillos reales de una cuenta. */
export async function listarBolsillosReales(accountId: string): Promise<PocketItem[]> {
  const r: any = await apiClient.get(`/pockets/account/${accountId}`);
  return (r.data ?? []) as PocketItem[];
}


export interface ToastEmitido {
  tipo: 'success' | 'error' | 'warning';
  titulo: string;
  descripcion?: string;
}

export interface RegistradorToast {
  emitidos: ToastEmitido[];
  api: {
    success: (titulo: string, descripcion?: string) => unknown;
    error: (titulo: string, descripcion?: string) => unknown;
    warning: (titulo: string, descripcion?: string) => unknown;
  };
  /** Descripción compacta de lo emitido, para el resultado obtenido. */
  resumen(): string;
}

export function registradorToast(): RegistradorToast {
  const emitidos: ToastEmitido[] = [];
  const anotar = (tipo: ToastEmitido['tipo']) => (titulo: string, descripcion?: string) => {
    emitidos.push({ tipo, titulo, descripcion });
    return undefined;
  };

  return {
    emitidos,
    api: { success: anotar('success'), error: anotar('error'), warning: anotar('warning') },
    resumen() {
      if (emitidos.length === 0) return 'sin toasts';
      return emitidos.map((t) => `${t.tipo}("${t.titulo}"${t.descripcion ? ` · "${t.descripcion}"` : ''})`).join(' | ');
    },
  };
}

export interface RegistradorLista {
  /** Valor actual, tras aplicar todas las actualizaciones recibidas. */
  valor: PocketItem[];
  /** Cuántas veces se llamó al setter. */
  llamadas: number;
  set: (value: PocketItem[] | ((prev: PocketItem[]) => PocketItem[])) => void;
}

/** Reproduce el contrato del setter de `useState`, incluida la forma funcional. */
export function registradorLista(inicial: PocketItem[] = []): RegistradorLista {
  const reg: RegistradorLista = {
    valor: inicial,
    llamadas: 0,
    set(value) {
      reg.llamadas += 1;
      reg.valor = typeof value === 'function' ? (value as (p: PocketItem[]) => PocketItem[])(reg.valor) : value;
    },
  };
  return reg;
}

export interface RegistradorValor<T> {
  /** Historial de todos los valores recibidos, en orden. */
  historial: T[];
  /** Último valor recibido, o `undefined` si nunca se llamó. */
  readonly ultimo: T | undefined;
  set: (value: T) => void;
}

export function registradorValor<T>(): RegistradorValor<T> {
  const historial: T[] = [];
  return {
    historial,
    get ultimo() {
      return historial.at(-1);
    },
    set(value: T) {
      historial.push(value);
    },
  };
}
