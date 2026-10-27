import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';

import { AccountsPage, DepositModal } from '../../ui/AccountsPage';

/** Acciones sobre la pantalla /accounts. */
export const AccountsScreen = {
  open: () =>
    Task.where('#actor abre la pantalla de cuentas',
      Navigate.to('/accounts'),
      Wait.upTo(Duration.ofSeconds(30)).until(AccountsPage.depositButton(), isVisible()),
    ),

  deposit: (amount: number) =>
    Task.where(`#actor abona ${ amount } a su cuenta desde la pantalla`,
      Click.on(AccountsPage.depositButton()),
      Enter.theValue(String(amount)).into(DepositModal.amount()),
      Click.on(DepositModal.submit()),
    ),
};
