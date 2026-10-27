import { Actor, Cast } from './cast';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const apiUrl = () => String(Cypress.expose('apiUrl')).replace(/\/$/, '');

/**
 * Petición al backend real como `actor`. No falla ante 4xx: los escenarios
 * negativos verifican el código y el cuerpo con los pasos `Then`.
 * Supabase a veces tarda: 30 s de margen como en la suite de Serenity.
 */
export function request(actor: Actor, method: Method, path: string, body?: Cypress.RequestBody, log = true) {
  return cy.request({
    method,
    url: `${apiUrl()}/${path}`,
    body,
    headers: actor.token ? { Authorization: `Bearer ${actor.token}` } : {},
    failOnStatusCode: false,
    timeout: 30_000,
    log,
  });
}

/** Igual que `request`, pero la respuesta queda como "la respuesta" del escenario. */
export function send(actor: Actor, method: Method, path: string, body?: Cypress.RequestBody) {
  return request(actor, method, path, body).then(response => {
    Cast.rememberResponse(response);
    return response;
  });
}

/**
 * Datos de registro únicos por corrida. El prefijo `e2e.` y el dominio `.test`
 * hacen que `npm run test:e2e:clean` también limpie estos clientes.
 */
function uniqueClient(firstName: string) {
  const stamp = `${Date.now().toString(36)}${Cypress._.random(36 ** 4 - 1).toString(36)}`;
  const password = `Cy${Cypress._.random(1e9, 9e9)}aA1`;
  return {
    firstName,
    lastName: 'Cypress',
    birthDate: '1995-05-10',
    email: `e2e.cy.${stamp}@fubanking.test`,
    document: `CY${stamp}`.toUpperCase().slice(0, 20),
    monthlyIncome: 3_500_000,
    password,
    confirmPassword: password,
  };
}

/**
 * Prepara un cliente nuevo: se registra (sin 2FA), abre una cuenta de ahorros
 * y, si se pide saldo, lo deposita. Cada escenario parte de datos propios.
 */
export function becomeClient(actor: Actor, balance: number) {
  const data = uniqueClient(actor.name);

  // log: false para que la contraseña no aparezca en el Command Log.
  request(actor, 'POST', 'auth/register', data, false).then(response => {
    expect(response.status, `registro de ${actor.name}`).to.eq(201);
    actor.email = data.email;
    actor.password = data.password;
    actor.token = response.body.data.token;
  });

  cy.then(() => request(actor, 'POST', 'accounts', { type: 'AHORROS' })).then(response => {
    expect(response.status, `apertura de la cuenta de ${actor.name}`).to.eq(201);
    actor.accountId = response.body.data.id;
  });

  if (balance > 0) {
    cy.then(() => request(actor, 'POST', `accounts/${actor.accountId}/deposit`, { amount: balance })).then(response => {
      expect(response.status, `depósito inicial de ${actor.name}`).to.eq(200);
    });
  }
}

/** Saldo real de la cuenta en el backend (no toca "la respuesta" del escenario). */
export function accountBalanceOf(actor: Actor) {
  return cy.then(() => request(actor, 'GET', `accounts/${actor.accountId}`)).then(response => {
    expect(response.status, `consulta de la cuenta de ${actor.name}`).to.eq(200);
    return response.body.data.balance as number;
  });
}

/** Bolsillos reales de la cuenta del actor (no toca "la respuesta" del escenario). */
export function pocketsOf(actor: Actor) {
  return cy.then(() => request(actor, 'GET', `pockets/account/${actor.accountId}`)).then(response => {
    expect(response.status, `consulta de los bolsillos de ${actor.name}`).to.eq(200);
    return response.body.data as Array<{ id: string; name: string; amount: number }>;
  });
}
