import { By, PageElement, PageElements } from '@serenity-js/web';

import { byTestId } from './selectors';

/** Pantalla /accounts. Cada cliente de prueba tiene una sola cuenta. */
export const AccountsPage = {
  card: () => PageElements.located(byTestId('account-card')).first().describedAs('tarjeta de la cuenta'),
  balance: () => PageElement.located(byTestId('account-balance')).of(AccountsPage.card()).describedAs('saldo de la cuenta'),
  depositButton: () => PageElement.located(byTestId('deposit-button')).of(AccountsPage.card()).describedAs('botón Abonar'),
};

/** Modal de abono (`DepositWithdrawModal.tsx`). */
export const DepositModal = {
  amount: () => PageElement.located(By.id('dw-amount')).describedAs('campo monto a ingresar'),
  description: () => PageElement.located(By.id('dw-description')).describedAs('campo descripción'),
  submit: () => PageElement.located(byTestId('dw-submit')).describedAs('botón Abonar Saldo'),
  error: () => PageElement.located(byTestId('dw-error')).describedAs('mensaje de error del formulario'),
};
