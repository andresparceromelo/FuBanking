import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isPresent } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';

import { ApiQuestions } from '../../test/questions/ApiQuestions';
import { ScreenQuestions } from '../../test/questions/ScreenQuestions';
import { noteOf } from '../../test/support/ClientNotes';
import { PocketsApi } from '../../test/tasks/api/PocketsApi';
import { PocketsScreen } from '../../test/tasks/web/PocketsScreen';
import { PocketsPage } from '../../test/ui/PocketsPage';

// ─── Datos previos (por API) ─────────────────────────────────────────────────

Given('{pronoun} tiene el bolsillo {string} con {int}', async (actor: Actor, name: string, amount: number) => {
  await actor.attemptsTo(
    PocketsApi.create(name, amount),
    Ensure.that(LastResponse.status(), equals(201)),
  );
});

Given('{pronoun} tiene los bolsillos:', async (actor: Actor, table: DataTable) => {
  for (const { nombre, monto } of table.hashes()) {
    await actor.attemptsTo(
      PocketsApi.create(nombre, Number(monto)),
      Ensure.that(LastResponse.status(), equals(201)),
    );
  }
});

// ─── Acciones por API ────────────────────────────────────────────────────────

When('{pronoun} crea por API el bolsillo {string} con {int}', async (actor: Actor, name: string, amount: number) => {
  await actor.attemptsTo(PocketsApi.create(name, amount));
});

When('{pronoun} consulta por API los bolsillos de su cuenta', async (actor: Actor) => {
  await actor.attemptsTo(PocketsApi.listOwn());
});

When('{actor} consulta por API los bolsillos de la cuenta de {word}', async (actor: Actor, owner: string) => {
  const accountId = await noteOf(owner, 'accountId', actor.name);
  await actor.attemptsTo(PocketsApi.listOfAccount(accountId));
});

When('{pronoun} renombra por API el bolsillo {string} a {string}', async (actor: Actor, from: string, to: string) => {
  await actor.attemptsTo(PocketsApi.rename(from, to));
});

When('{pronoun} ajusta por API el monto del bolsillo {string} a {int}', async (actor: Actor, name: string, amount: number) => {
  await actor.attemptsTo(PocketsApi.adjust(name, amount));
});

When('{pronoun} elimina por API el bolsillo {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(PocketsApi.remove(name));
});

When('{actor} elimina por API el bolsillo {string} de {word}', async (actor: Actor, name: string, owner: string) => {
  const pockets = await noteOf(owner, 'pockets', actor.name);
  await actor.attemptsTo(PocketsApi.removeById(pockets[name]));
});

When('{pronoun} transfiere por API {int} del bolsillo {string} al bolsillo {string}', async (actor: Actor, amount: number, from: string, to: string) => {
  await actor.attemptsTo(PocketsApi.transfer(amount, from, to));
});

// ─── Verificaciones por API ──────────────────────────────────────────────────

Then('la respuesta contiene {int} bolsillo(s)', async (count: number) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(ApiQuestions.pocketCount(), equals(count)),
  );
});

Then('su cuenta no tiene bolsillos', async () => {
  await actorInTheSpotlight().attemptsTo(
    PocketsApi.listOwn(),
    Ensure.that(ApiQuestions.pocketCount(), equals(0)),
  );
});

Then('su bolsillo {string} tiene {int}', async (name: string, amount: number) => {
  await actorInTheSpotlight().attemptsTo(
    PocketsApi.listOwn(),
    Ensure.that(ApiQuestions.pocketAmount(name), equals(amount)),
  );
});

// ─── Acciones en pantalla ────────────────────────────────────────────────────

When('{pronoun} abre la pantalla de bolsillos', async (actor: Actor) => {
  await actor.attemptsTo(PocketsScreen.open());
});

When('{pronoun} crea el bolsillo {string} con {int}', async (actor: Actor, name: string, amount: number) => {
  await actor.attemptsTo(PocketsScreen.createPocket(name, amount));
});

When('{pronoun} renombra el bolsillo {string} a {string}', async (actor: Actor, from: string, to: string) => {
  await actor.attemptsTo(PocketsScreen.renamePocket(from, to));
});

When('{pronoun} elimina el bolsillo {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(PocketsScreen.removePocket(name));
});

When('{pronoun} transfiere {int} del bolsillo {string} al bolsillo {string}', async (actor: Actor, amount: number, from: string, to: string) => {
  await actor.attemptsTo(PocketsScreen.transfer(amount, from, to));
});

// ─── Verificaciones en pantalla ──────────────────────────────────────────────

Then('{pronoun} ve el bolsillo {string} con {int}', async (actor: Actor, name: string, amount: number) => {
  await actor.attemptsTo(
    Ensure.eventually(ScreenQuestions.pocketAmount(name), equals(amount)),
  );
});

Then('{pronoun} ve los bolsillos:', async (actor: Actor, table: DataTable) => {
  await actor.attemptsTo(
    Ensure.eventually(ScreenQuestions.pocketNames(), equals(table.raw().flat().sort((a, b) => a.localeCompare(b)))),
  );
});

Then('{pronoun} ve que su cuenta no tiene bolsillos', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.eventually(PocketsPage.emptyState(), isPresent()),
  );
});
