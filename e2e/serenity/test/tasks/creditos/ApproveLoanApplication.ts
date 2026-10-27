import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';
import { AdminLoansPage } from '../../ui/AdminLoansPage';

export class ApproveLoanApplication {
  static now() {
    return Task.where(
      `#actor aprueba la solicitud de crédito`,
      Click.on(AdminLoansPage.approveButton()),
    );
  }
}
