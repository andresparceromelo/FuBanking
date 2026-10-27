import { Task, Wait } from '@serenity-js/core';
import { isVisible, Navigate } from '@serenity-js/web';
import { AdminLoansPage } from '../../ui/AdminLoansPage';

export class NavigateToAdminLoans {
  static at(baseUrl: string) {
    return Task.where(
      `#actor navega a la sección de administración de créditos`,
      Navigate.to(`${baseUrl}/admin/loans`),
      Wait.until(AdminLoansPage.headerTitle(), isVisible()),
    );
  }
}
