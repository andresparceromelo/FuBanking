import { Duration, Task, Wait } from '@serenity-js/core';
import { isVisible, Navigate } from '@serenity-js/web';
import { LoansPage } from '../../ui/LoansPage';

export const NavigateToLoans = {
  at: (baseUrl: string) =>
    Task.where(
      `#actor navega a la sección de préstamos y créditos`,
      Navigate.to(`${baseUrl}/loans`),
      Wait.upTo(Duration.ofSeconds(10)).until(LoansPage.headerTitle(), isVisible()),
    ),
};
