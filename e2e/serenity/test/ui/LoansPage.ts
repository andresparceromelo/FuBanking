import { By, PageElement } from '@serenity-js/web';

export const LoansPage = {
  headerTitle: () =>
    PageElement.located(By.css('h1')).describedAs('título de la página de créditos'),

  amountInput: () =>
    PageElement.located(By.css('#loan-amount')).describedAs('campo de monto del préstamo'),

  installmentsInput: () =>
    PageElement.located(By.css('#loan-installments')).describedAs('campo de número de cuotas'),

  annualRateInput: () =>
    PageElement.located(By.css('#loan-annual-rate')).describedAs('campo de tasa anual'),

  simulateButton: () =>
    PageElement.located(By.css('#btn-simulate')).describedAs('botón Simular'),

  applyButton: () =>
    PageElement.located(By.css('#btn-apply')).describedAs('botón Solicitar'),

  simulationResultCard: () =>
    PageElement.located(By.id('result-box')).describedAs('tarjeta de resultado del préstamo'),

  simulationMessage: () =>
    PageElement.located(By.css('#feedback-msg, p.text-sm.text-muted-foreground')).describedAs('mensaje de simulación'),

  requirementsCard: () =>
    PageElement.located(By.css('#requirements-panel, .req-grid, .rounded-2xl.border.p-4')).describedAs('panel de requisitos para solicitar'),

  summaryCard: () =>
    PageElement.located(By.css('#summary-header, h2:has-text("Resumen")')).describedAs('tarjeta de resumen del crédito'),
};
