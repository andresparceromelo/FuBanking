import { equals, isPresent, not } from '@serenity-js/assertions';
import { Duration, Interaction, Task, Wait } from '@serenity-js/core';
import { Click, Enter, Navigate, Select, Value } from '@serenity-js/web';

import { forgetPocket, PocketId, renamePocketInNotes } from '../../support/ClientNotes';
import { PocketsPage } from '../../ui/PocketsPage';

// isPresent y no isVisible: la lista queda bajo los formularios, fuera del
// viewport, e isVisible exige que el elemento esté a la vista. Click hace scroll.
const WaitForPocket = (name: string) =>
  Wait.upTo(Duration.ofSeconds(15)).until(PocketsPage.pocketCard(name), isPresent());

/** Acciones sobre la pantalla /pockets. */
export const PocketsScreen = {
  open: () =>
    Task.where('#actor abre la pantalla de bolsillos',
      Navigate.to('/pockets'),
      // La cuenta se carga de forma asíncrona; sin ella el formulario no deja crear.
      Wait.upTo(Duration.ofSeconds(30)).until(Value.of(PocketsPage.accountSelect()), not(equals(''))),
    ),

  createPocket: (name: string, amount: number) =>
    Task.where(`#actor crea el bolsillo "${ name }" con ${ amount } desde la pantalla`,
      Enter.theValue(name).into(PocketsPage.newPocketName()),
      Enter.theValue(String(amount)).into(PocketsPage.newPocketAmount()),
      Click.on(PocketsPage.createButton()),
    ),

  renamePocket: (from: string, to: string) =>
    Task.where(`#actor renombra el bolsillo "${ from }" a "${ to }" desde la pantalla`,
      WaitForPocket(from),
      Click.on(PocketsPage.editButtonOf(from)),
      Enter.theValue(to).into(PocketsPage.editName()),
      Click.on(PocketsPage.saveButton()),
      Interaction.where('#actor actualiza el nombre en sus notas', actor => renamePocketInNotes(actor, from, to)),
    ),

  removePocket: (name: string) =>
    Task.where(`#actor elimina el bolsillo "${ name }" desde la pantalla`,
      WaitForPocket(name),
      Click.on(PocketsPage.deleteButtonOf(name)),
      Click.on(PocketsPage.confirmDeleteButton()),
      Interaction.where(`#actor borra "${ name }" de sus notas`, actor => forgetPocket(actor, name)),
    ),

  transfer: (amount: number, from: string, to: string) =>
    Task.where(`#actor transfiere ${ amount } del bolsillo "${ from }" al bolsillo "${ to }" desde la pantalla`,
      Select.value(PocketId.of(from)).from(PocketsPage.fromPocketSelect()),
      Select.value(PocketId.of(to)).from(PocketsPage.toPocketSelect()),
      Enter.theValue(String(amount)).into(PocketsPage.transferAmount()),
      Click.on(PocketsPage.transferButton()),
    ),
};
