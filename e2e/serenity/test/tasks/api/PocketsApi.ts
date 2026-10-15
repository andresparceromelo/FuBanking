import { Interaction, q, Question, Task } from '@serenity-js/core';
import { DeleteRequest, GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

import { ApiSuccess, PocketDto } from '../../support/apiTypes';
import { clientNotes, forgetPocket, PocketId, rememberPocket, renamePocketInNotes } from '../../support/ClientNotes';

/** Ejecuta `update` sobre las notas solo si la última respuesta fue `status`. */
const UpdateNotesIfStatus = (status: number, description: string, update: Parameters<typeof Interaction.where>[1]) =>
  Interaction.where(description, async actor => {
    if (await actor.answer(LastResponse.status()) === status) {
      await update(actor);
    }
  });

/** Endpoints `/pockets` del backend, expresados como tareas del dominio. */
export const PocketsApi = {
  create: (name: string, amount: number) =>
    Task.where(`#actor crea por API el bolsillo "${ name }" con ${ amount }`,
      Send.a(PostRequest.to('pockets').with(
        Question.fromObject({ accountId: clientNotes().get('accountId'), name, amount }),
      )),
      UpdateNotesIfStatus(201, `#actor anota el id del bolsillo "${ name }"`, async actor => {
        const body = await actor.answer(LastResponse.body<ApiSuccess<PocketDto>>());
        rememberPocket(actor, name, body.data.id);
      }),
    ),

  listOwn: () =>
    Task.where('#actor consulta por API los bolsillos de su cuenta',
      Send.a(GetRequest.to(q`pockets/account/${ clientNotes().get('accountId') }`)),
    ),

  listOfAccount: (accountId: string) =>
    Task.where(`#actor consulta por API los bolsillos de la cuenta ${ accountId }`,
      Send.a(GetRequest.to(`pockets/account/${ accountId }`)),
    ),

  rename: (from: string, to: string) =>
    Task.where(`#actor renombra por API el bolsillo "${ from }" a "${ to }"`,
      Send.a(PatchRequest.to(q`pockets/${ PocketId.of(from) }`).with({ name: to })),
      UpdateNotesIfStatus(200, '#actor actualiza el nombre en sus notas', actor => renamePocketInNotes(actor, from, to)),
    ),

  adjust: (name: string, amount: number) =>
    Task.where(`#actor ajusta por API el monto del bolsillo "${ name }" a ${ amount }`,
      Send.a(PatchRequest.to(q`pockets/${ PocketId.of(name) }`).with({ amount })),
    ),

  remove: (name: string) =>
    Task.where(`#actor elimina por API el bolsillo "${ name }"`,
      Send.a(DeleteRequest.to(q`pockets/${ PocketId.of(name) }`)),
      UpdateNotesIfStatus(200, `#actor borra "${ name }" de sus notas`, actor => forgetPocket(actor, name)),
    ),

  removeById: (pocketId: string) =>
    Task.where(`#actor elimina por API el bolsillo ${ pocketId }`,
      Send.a(DeleteRequest.to(`pockets/${ pocketId }`)),
    ),

  transfer: (amount: number, from: string, to: string) =>
    Task.where(`#actor transfiere por API ${ amount } del bolsillo "${ from }" al bolsillo "${ to }"`,
      Send.a(PostRequest.to('pockets/transfer').with(
        Question.fromObject({ fromPocketId: PocketId.of(from), toPocketId: PocketId.of(to), amount }),
      )),
    ),
};
