import { randomBytes, randomInt } from 'node:crypto';

import { API_URL, ClaudeSession, WEB_URL } from './claude.config.js';

/**
 * Cliente de la API real de FuBanking. Sirve para dos cosas:
 * 1. preparar los datos de cada escenario (cliente, cuenta, saldo, bolsillos);
 * 2. ser el ORÁCULO: lo que la IA hizo en pantalla se verifica en el backend.
 */
export interface Client {
  firstName: string;
  email: string;
  token: string;
  user: unknown;
  accountId: string;
}

export interface Pocket {
  id: string;
  name: string;
  amount: number;
}

async function call<T>(method: string, path: string, token?: string, body?: unknown): Promise<{ status: number; data: T }> {
  const response = await fetch(`${API_URL}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as { data: T };
  return { status: response.status, data: json.data };
}

async function expectStatus<T>(expected: number, what: string, request: Promise<{ status: number; data: T }>): Promise<T> {
  const { status, data } = await request;
  if (status !== expected) {
    throw new Error(`${what}: se esperaba HTTP ${expected} y llegó ${status}`);
  }
  return data;
}

/**
 * Registra un cliente nuevo (prefijo `e2e.` y dominio `.test`, que limpia
 * `npm run test:e2e:clean`), le abre una cuenta de ahorros y deposita el saldo.
 */
export async function newClient(firstName: string, balance: number): Promise<Client> {
  const stamp = `${Date.now().toString(36)}${randomInt(36 ** 4).toString(36)}`;
  const password = `Sh${randomBytes(6).toString('hex')}A1`;
  const registration = {
    firstName,
    lastName: 'Stagehand',
    birthDate: '1995-05-10',
    email: `e2e.sh.${stamp}@fubanking.test`,
    document: `SH${stamp}`.toUpperCase().slice(0, 20),
    monthlyIncome: 3_500_000,
    password,
    confirmPassword: password,
  };

  const session = await expectStatus<{ token: string; user: unknown }>(201, `registro de ${firstName}`,
    call('POST', 'auth/register', undefined, registration));
  const account = await expectStatus<{ id: string }>(201, `cuenta de ${firstName}`,
    call('POST', 'accounts', session.token, { type: 'AHORROS' }));

  const client = { firstName, email: registration.email, token: session.token, user: session.user, accountId: account.id };
  if (balance > 0) {
    await deposit(client, balance);
  }
  return client;
}

export const deposit = (client: Client, amount: number) =>
  expectStatus(200, 'depósito', call('POST', `accounts/${client.accountId}/deposit`, client.token, { amount }));

export const createPocket = async (client: Client, name: string, amount: number) =>
  (await expectStatus<Pocket>(201, `bolsillo "${name}"`,
    call('POST', 'pockets', client.token, { accountId: client.accountId, name, amount }))).id;

export const pocketsOf = (client: Client) =>
  expectStatus<Pocket[]>(200, 'consulta de bolsillos', call('GET', `pockets/account/${client.accountId}`, client.token));

export const balanceOf = async (client: Client) =>
  (await expectStatus<{ balance: number }>(200, 'consulta de la cuenta',
    call('GET', `accounts/${client.accountId}`, client.token))).balance;

/**
 * Deja la sesión abierta en el navegador con el token REAL que devolvió el
 * backend (cookie para el middleware de Next + localStorage para la API),
 * igual que `useAuth.login` con "Recordarme". Así la IA se concentra en la
 * funcionalidad y no gasta llamadas en el login.
 */
export async function signInBrowser({ context }: ClaudeSession, client: Client) {
  await context.addCookies([{
    name: 'token',
    value: client.token,
    domain: new URL(WEB_URL).hostname,
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);
  await context.addInitScript(
    ({ token, user }: { token: string; user: unknown }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token: client.token, user: client.user },
  );
}
