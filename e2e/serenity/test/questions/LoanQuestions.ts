import { Text } from '@serenity-js/web';
import { LoansPage } from '../ui/LoansPage';

export const LoanQuestions = {
  simulationResult: () => Text.of(LoansPage.simulationResultCard()),
  simulationMessage: () => Text.of(LoansPage.simulationMessage()),
  requirementsCard: () => LoansPage.requirementsCard(),
  applyButton: () => LoansPage.applyButton(),
  summaryCard: () => LoansPage.summaryCard(),
};
