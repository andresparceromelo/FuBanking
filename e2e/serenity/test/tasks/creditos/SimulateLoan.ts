import { Task } from '@serenity-js/core';
import { Clear, Click, Enter } from '@serenity-js/web';
import { LoansPage } from '../../ui/LoansPage';

export const SimulateLoan = {
  withParameters: (amount: string, installments: string, annualRate: string) =>
    Task.where(
      `#actor simula préstamo por $${amount} a ${installments} cuotas con tasa ${annualRate}%`,
      Clear.theValueOf(LoansPage.amountInput()),
      Enter.theValue(amount).into(LoansPage.amountInput()),
      Clear.theValueOf(LoansPage.installmentsInput()),
      Enter.theValue(installments).into(LoansPage.installmentsInput()),
      Clear.theValueOf(LoansPage.annualRateInput()),
      Enter.theValue(annualRate).into(LoansPage.annualRateInput()),
      Click.on(LoansPage.simulateButton()),
    ),
};
