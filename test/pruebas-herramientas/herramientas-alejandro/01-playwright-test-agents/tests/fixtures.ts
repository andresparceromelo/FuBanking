import { randomBytes, randomInt } from 'node:crypto';

import { APIRequestContext, expect, test as base } from '@playwright/test';

const API_URL = (process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

export interface Client {
  email: string;
  token: string;
  accountId: string;
  /** Llamadas autenticadas a la API real: sirven de oráculo en las aserciones. */
  api: {
    balance(): Promise<number>;
    pockets(): Promise<Array<{ id: string; name: string; amount: number }>>;
    createPocket(name: string, amount: number): Promise<string>;
  };
}

async function newClient(request: APIRequestContext, balance: number): Promise<Client & { user: unknown }> {
  const stamp = `${Date.now().toString(36)}${randomInt(36 ** 4).toString(36)}`;
  const password = `Pw${randomBytes(6).toString('hex')}A1`;
  const register = await request.post(`${API_URL}/auth/register`, {
    data: {
      firstName: 'Ana',
      lastName: 'Agentes',
      birthDate: '1995-05-10',
      email: `e2e.pw.${stamp}@fubanking.test`,
      document: `PW${stamp}`.toUpperCase().slice(0, 20),
      monthlyIncome: 3_500_000,
      password,
      confirmPassword: password,
    },
  });
  expect(register.status(), 'registro del cliente de prueba').toBe(201);
  const { token, user } = (await register.json()).data;
  const headers = { Authorization: `Bearer ${token}` };

  const account = await request.post(`${API_URL}/accounts`, { headers, data: { type: 'AHORROS' } });
  expect(account.status(), 'apertura de la cuenta de ahorros').toBe(201);
  const accountId: string = (await account.json()).data.id;

  if (balance > 0) {
    const deposit = await request.post(`${API_URL}/accounts/${accountId}/deposit`, { headers, data: { amount: balance } });
    expect(deposit.status(), 'depósito inicial').toBe(200);
  }

  return {
    email: user.email,
    token,
    user,
    accountId,
    api: {
      balance: async () => (await (await request.get(`${API_URL}/accounts/${accountId}`, { headers })).json()).data.balance,
      pockets: async () => (await (await request.get(`${API_URL}/pockets/account/${accountId}`, { headers })).json()).data,
      createPocket: async (name, amount) => {
        const response = await request.post(`${API_URL}/pockets`, { headers, data: { accountId, name, amount } });
        expect(response.status(), `bolsillo "${name}"`).toBe(201);
        return (await response.json()).data.id;
      },
    },
  };
}

/**
 * Fixtures del seed y de los tests generados. Cada test arranca con una
 * clienta NUEVA (cuenta de ahorros con 500.000) y la sesión ya abierta con su
 * token real (cookie + localStorage, como "Recordarme"), en la pantalla de
 * Bolsillos. Así planner y generator parten siempre del mismo estado limpio.
 */
export const test = base.extend<{ initialBalance: number; client: Client }>({
  initialBalance: [500_000, { option: true }],

  client: async ({ request, initialBalance }, use) => {
    await use(await newClient(request, initialBalance));
  },

  page: async ({ page, client }, use) => {
    const { token, user } = client as Client & { user: unknown };
    await page.context().addCookies([{ name: 'token', value: token, url: test.info().project.use.baseURL ?? 'http://localhost:3000' }]);
    await page.addInitScript(({ t, u }) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    }, { t: token, u: user });

    await page.goto('/pockets', { waitUntil: 'networkidle' });
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await use(page);
  },
});

export { expect };
