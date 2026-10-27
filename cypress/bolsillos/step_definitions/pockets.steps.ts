import { DataTable, Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

import { pocketsOf, send } from '../support/api';
import { Actor, Cast } from '../support/cast';
import { amountIn, PocketsScreen } from '../support/screens';

/** POST /pockets; si responde 201, el actor anota el id del bolsillo. */
const createPocket = (actor: Actor, name: string, amount: number) =>
  cy.then(() => send(actor, 'POST', 'pockets', { accountId: actor.accountId, name, amount })).then(response => {
    if (response.status === 201) {
      actor.pockets[name] = response.body.data.id;
    }
    return response;
  });

const renameInNotes = (actor: Actor, from: string, to: string) => {
  actor.pockets[to] = Cast.pocketId(actor, from);
  delete actor.pockets[from];
};

// ─── Datos previos (por API) ─────────────────────────────────────────────────

Given('{pronoun} tiene el bolsillo {string} con {int}', (actor: Actor, name: string, amount: number) => {
  createPocket(actor, name, amount).its('status').should('eq', 201);
});

Given('{pronoun} tiene los bolsillos:', (actor: Actor, table: DataTable) => {
  for (const { nombre, monto } of table.hashes()) {
    createPocket(actor, nombre, Number(monto)).its('status').should('eq', 201);
  }
});

// ─── Acciones por API ────────────────────────────────────────────────────────

When('{pronoun} crea por API el bolsillo {string} con {int}', (actor: Actor, name: string, amount: number) => {
  createPocket(actor, name, amount);
});

When('{pronoun} consulta por API los bolsillos de su cuenta', (actor: Actor) => {
  cy.then(() => send(actor, 'GET', `pockets/account/${actor.accountId}`));
});

When('{actor} consulta por API los bolsillos de la cuenta de {word}', (actor: Actor, owner: string) => {
  cy.then(() => send(actor, 'GET', `pockets/account/${Cast.noteOf(owner, 'accountId')}`));
});

When('{pronoun} renombra por API el bolsillo {string} a {string}', (actor: Actor, from: string, to: string) => {
  cy.then(() => send(actor, 'PATCH', `pockets/${Cast.pocketId(actor, from)}`, { name: to })).then(response => {
    if (response.status === 200) {
      renameInNotes(actor, from, to);
    }
  });
});

When('{pronoun} ajusta por API el monto del bolsillo {string} a {int}', (actor: Actor, name: string, amount: number) => {
  cy.then(() => send(actor, 'PATCH', `pockets/${Cast.pocketId(actor, name)}`, { amount }));
});

When('{pronoun} elimina por API el bolsillo {string}', (actor: Actor, name: string) => {
  cy.then(() => send(actor, 'DELETE', `pockets/${Cast.pocketId(actor, name)}`)).then(response => {
    if (response.status === 200) {
      delete actor.pockets[name];
    }
  });
});

When('{actor} elimina por API el bolsillo {string} de {word}', (actor: Actor, name: string, owner: string) => {
  cy.then(() => send(actor, 'DELETE', `pockets/${Cast.noteOf(owner, 'pockets')[name]}`));
});

When('{pronoun} transfiere por API {int} del bolsillo {string} al bolsillo {string}', (actor: Actor, amount: number, from: string, to: string) => {
  cy.then(() => send(actor, 'POST', 'pockets/transfer', {
    fromPocketId: Cast.pocketId(actor, from),
    toPocketId: Cast.pocketId(actor, to),
    amount,
  }));
});

// ─── Verificaciones por API ──────────────────────────────────────────────────

Then('la respuesta contiene {int} bolsillo(s)', (count: number) => {
  cy.then(() => {
    expect(Cast.lastResponse().body.data, 'bolsillos en la respuesta').to.have.length(count);
  });
});

Then('su cuenta no tiene bolsillos', () => {
  pocketsOf(Cast.inSpotlight()).should('have.length', 0);
});

Then('su bolsillo {string} tiene {int}', (name: string, amount: number) => {
  pocketsOf(Cast.inSpotlight()).then(pockets => {
    const pocket = pockets.find(item => item.name === name);
    expect(pocket, `bolsillo "${name}" en la respuesta`).to.exist;
    expect(pocket!.amount, `saldo del bolsillo "${name}"`).to.eq(amount);
  });
});

// ─── Acciones en pantalla ────────────────────────────────────────────────────

When('{pronoun} abre la pantalla de bolsillos', () => {
  PocketsScreen.open();
});

When('{pronoun} crea el bolsillo {string} con {int}', (_actor: Actor, name: string, amount: number) => {
  PocketsScreen.createPocket(name, amount);
});

When('{pronoun} renombra el bolsillo {string} a {string}', (actor: Actor, from: string, to: string) => {
  PocketsScreen.renamePocket(from, to);
  cy.then(() => renameInNotes(actor, from, to));
});

When('{pronoun} elimina el bolsillo {string}', (actor: Actor, name: string) => {
  PocketsScreen.removePocket(name);
  cy.then(() => {
    delete actor.pockets[name];
  });
});

When('{pronoun} transfiere {int} del bolsillo {string} al bolsillo {string}', (actor: Actor, amount: number, from: string, to: string) => {
  cy.then(() => PocketsScreen.transfer(amount, Cast.pocketId(actor, from), Cast.pocketId(actor, to)));
});

// ─── Verificaciones en pantalla ──────────────────────────────────────────────

Then('{pronoun} ve el bolsillo {string} con {int}', (_actor: Actor, name: string, amount: number) => {
  // Reintenta hasta que la lista se recargue con el saldo nuevo.
  PocketsScreen.card(name).find('[data-testid="pocket-card-amount"]').should($amount => {
    expect(amountIn($amount.text()), `saldo en pantalla de "${name}"`).to.eq(amount);
  });
});

Then('{pronoun} ve los bolsillos:', (_actor: Actor, table: DataTable) => {
  const expected = table.raw().flat().sort((a, b) => a.localeCompare(b));
  PocketsScreen.pocketNames().should($names => {
    const shown = [...$names].map(el => el.textContent?.trim() ?? '').sort((a, b) => a.localeCompare(b));
    expect(shown, 'bolsillos en pantalla').to.deep.eq(expected);
  });
});

Then('{pronoun} ve que su cuenta no tiene bolsillos', () => {
  PocketsScreen.emptyState().should('exist');
});
