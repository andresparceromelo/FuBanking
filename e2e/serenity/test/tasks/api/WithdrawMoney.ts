import { q, Task } from '@serenity-js/core';
import { PostRequest, Send } from '@serenity-js/rest';
import { clientNotes } from '../../support/ClientNotes';

export const WithdrawMoney = {
  /**
   * Intenta retirar de una cuenta específica mediante su ID.
   * Útil para pruebas con cuentas inexistentes o llamadas sin autenticación previa.
   */
  fromAccount: (accountId: string, amount: unknown) =>
    Task.where(`#actor intenta retirar ${ JSON.stringify(amount) } de la cuenta ${ accountId }`,
      Send.a(PostRequest.to(`accounts/${ accountId }/withdraw`).with({ amount })),
    ),

  /**
   * Retira de la cuenta propia del actor (almacenada previamente en sus notas).
   */
  fromOwnAccount: (amount: unknown) =>
    Task.where(`#actor intenta retirar ${ JSON.stringify(amount) } de su cuenta`,
      Send.a(PostRequest.to(q`accounts/${ clientNotes().get('accountId') }/withdraw`).with({ amount })),
    ),
};
