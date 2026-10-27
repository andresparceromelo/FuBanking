import { Question } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';

import { AccountDto, ApiFailure, ApiSuccess, PocketDto, SessionDto } from '../support/apiTypes';

const pocketsInLastResponse = () => LastResponse.body<ApiSuccess<PocketDto[]>>();

/** Lo que el actor lee de la última respuesta de la API. */
export const ApiQuestions = {
  errorCode: () => LastResponse.body<ApiFailure>().error.code.describedAs('el código de error'),

  accountBalance: () => LastResponse.body<ApiSuccess<AccountDto>>().data.balance.describedAs('el saldo de la cuenta'),

  sessionToken: () =>
    Question.about('el token de sesión en la respuesta', async actor => {
      const body = await actor.answer(LastResponse.body<ApiSuccess<SessionDto>>());
      if (!body?.data?.token) {
        throw new Error('La respuesta no contiene un token de sesión');
      }
      return body.data.token;
    }),

  pocketCount: () =>
    Question.about('la cantidad de bolsillos en la respuesta', async actor =>
      (await actor.answer(pocketsInLastResponse())).data.length),

  pocketAmount: (name: string) =>
    Question.about(`el saldo del bolsillo "${ name }" en la respuesta`, async actor => {
      const pocket = (await actor.answer(pocketsInLastResponse())).data.find(item => item.name === name);
      if (!pocket) {
        throw new Error(`La respuesta no incluye el bolsillo "${ name }"`);
      }
      return pocket.amount;
    }),
};
