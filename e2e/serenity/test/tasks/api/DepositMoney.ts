import { q, Task } from '@serenity-js/core';
import { PostRequest, Send } from '@serenity-js/rest';

import { clientNotes } from '../../support/ClientNotes';

/**
 * POST /accounts/:id/deposit. El monto es `unknown` a propósito: los escenarios
 * de seguridad envían `true`, `null` o texto para comprobar que el backend no
 * hace type juggling.
 */
export const DepositMoney = {
  intoOwnAccount: (amount: unknown, description?: string) =>
    Task.where(`#actor deposita ${ JSON.stringify(amount) } en su cuenta`,
      Send.a(PostRequest.to(q`accounts/${ clientNotes().get('accountId') }/deposit`).with({ amount, description })),
    ),

  intoAccount: (accountId: string, amount: unknown) =>
    Task.where(`#actor deposita ${ JSON.stringify(amount) } en la cuenta ${ accountId }`,
      Send.a(PostRequest.to(`accounts/${ accountId }/deposit`).with({ amount })),
    ),
};
