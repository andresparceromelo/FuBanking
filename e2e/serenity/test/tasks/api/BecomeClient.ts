import { Ensure, equals } from '@serenity-js/assertions';
import { Interaction, Task } from '@serenity-js/core';
import { CallAnApi, LastResponse, PostRequest, Send } from '@serenity-js/rest';

import { AccountDto, ApiSuccess, SessionDto } from '../../support/apiTypes';
import { clientNotes } from '../../support/ClientNotes';
import { Credentials } from '../../support/Credentials';
import { uniqueClient } from '../../support/testData';
import { DepositMoney } from './DepositMoney';

const RegisterAsClient = {
  named: (firstName: string) => {
    const data = uniqueClient(firstName);
    return Task.where(`#actor se registra en FuBanking como ${ data.email }`,
      // Se llama a la API directamente (sin Send) para que la contraseña y el
      // token no queden adjuntos al reporte como cuerpo de la petición.
      Interaction.where('#actor envía su registro a POST auth/register', async actor => {
        const api = CallAnApi.as(actor);
        const response = await api.request({ method: 'POST', url: 'auth/register', data });
        if (response.status !== 201) {
          throw new Error(`El registro falló con HTTP ${ response.status }: ${ JSON.stringify(response.data) }`);
        }

        const { token } = (response.data as ApiSuccess<SessionDto>).data;
        Credentials.keep(actor, { password: data.password, token });
        // Desde aquí, cada petición del actor viaja con su token.
        api.modifyConfig(config => {
          config.headers.common.Authorization = `Bearer ${ token }`;
        });
      }),
      clientNotes().set('email', data.email),
    );
  },
};

const OpenSavingsAccount = () =>
  Task.where('#actor abre una cuenta de ahorros',
    Send.a(PostRequest.to('accounts').with({ type: 'AHORROS' })),
    Ensure.that(LastResponse.status(), equals(201)),
    clientNotes().set('accountId', LastResponse.body<ApiSuccess<AccountDto>>().data.id),
  );

/**
 * Prepara un cliente nuevo por API: se registra (sin 2FA), abre una cuenta de
 * ahorros y, si se pide saldo, lo deposita. Así cada escenario parte de datos
 * propios y conocidos.
 */
export const BecomeClient = {
  withSavingsBalance: (firstName: string, balance: number) =>
    Task.where(`#actor es cliente con una cuenta de ahorros con saldo de ${ balance }`,
      RegisterAsClient.named(firstName),
      OpenSavingsAccount(),
      ...(balance > 0
        ? [DepositMoney.intoOwnAccount(balance), Ensure.that(LastResponse.status(), equals(200))]
        : []),
    ),
};
