import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, includes } from '@serenity-js/assertions';
import { Actor } from '@serenity-js/core';
import { isVisible, Text } from '@serenity-js/web';

import { appBaseUrl } from '../../test/support/appServer';
import { LoansPage } from '../../test/ui/LoansPage';
import { AdminLoansPage } from '../../test/ui/AdminLoansPage';
import { OpenFuBanking } from '../../test/tasks/creditos/OpenFuBanking';
import { NavigateToLoans } from '../../test/tasks/creditos/NavigateToLoans';
import { NavigateToAdminLoans } from '../../test/tasks/creditos/NavigateToAdminLoans';
import { SimulateLoan } from '../../test/tasks/creditos/SimulateLoan';
import { SubmitLoanApplication } from '../../test/tasks/creditos/SubmitLoanApplication';
import { ApproveLoanApplication } from '../../test/tasks/creditos/ApproveLoanApplication';
import { LoanQuestions } from '../../test/questions/LoanQuestions';

Given('que {actor} abre la plataforma FuBanking', async (actor: Actor) => {
  await actor.attemptsTo(OpenFuBanking.at(appBaseUrl()));
});

Given('{pronoun} ingresa al simulador de créditos', async (actor: Actor) => {
  await actor.attemptsTo(NavigateToLoans.at(appBaseUrl()));
});

When(
  '{pronoun} simula un préstamo con monto {string}, cuotas {string} y tasa {string}',
  async (actor: Actor, amount: string, installments: string, annualRate: string) => {
    await actor.attemptsTo(SimulateLoan.withParameters(amount, installments, annualRate));
  },
);

When('{pronoun} intenta enviar la solicitud de crédito', async (actor: Actor) => {
  await actor.attemptsTo(SubmitLoanApplication.now());
});

Then('{pronoun} observa el resultado de la simulación', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.that(LoanQuestions.simulationResult(), includes('Resultado del préstamo')),
  );
});

Then('{pronoun} confirma que la simulación está lista', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.that(LoanQuestions.simulationMessage(), includes('Simulación lista')),
  );
});

Then('{pronoun} observa un mensaje de validación en pantalla', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.that(LoanQuestions.simulationMessage(), includes('válidos')),
  );
});

Then('{pronoun} observa los requisitos para solicitar crédito en pantalla', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(LoansPage.requirementsCard(), isVisible()));
});

Then('{pronoun} visualiza el botón de solicitar crédito disponible', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(LoansPage.applyButton(), isVisible()));
});

Then('{pronoun} observa el panel de resumen del préstamo', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(LoansPage.summaryCard(), isVisible()));
});

Given('{pronoun} ingresa al panel de administración de créditos', async (actor: Actor) => {
  await actor.attemptsTo(NavigateToAdminLoans.at(appBaseUrl()));
});

When('{pronoun} aprueba la solicitud de crédito pendiente', async (actor: Actor) => {
  await actor.attemptsTo(ApproveLoanApplication.now());
});

Then('{pronoun} observa el estado {string} en la solicitud', async (actor: Actor, expectedStatus: string) => {
  await actor.attemptsTo(
    Ensure.that(Text.of(AdminLoansPage.statusBadge()), includes(expectedStatus)),
  );
});

Then('{pronoun} confirma que la solicitud fue enviada', async (actor: Actor) => {
  await actor.attemptsTo(
    Ensure.that(LoanQuestions.simulationMessage(), includes('enviada')),
  );
});
