import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';
import { LoansPage } from '../../ui/LoansPage';

export const SubmitLoanApplication = {
  now: () =>
    Task.where(
      `#actor intenta enviar la solicitud de crédito`,
      Click.on(LoansPage.applyButton()),
    ),
};
