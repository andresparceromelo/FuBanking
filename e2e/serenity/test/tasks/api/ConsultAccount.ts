import { q, Task } from '@serenity-js/core';
import { GetRequest, Send } from '@serenity-js/rest';

import { clientNotes } from '../../support/ClientNotes';

export const ConsultAccount = {
  own: () =>
    Task.where('#actor consulta su cuenta por API',
      Send.a(GetRequest.to(q`accounts/${ clientNotes().get('accountId') }`)),
    ),
};
