import { Answerable, Question } from '@serenity-js/core';
import { PageElement, Text } from '@serenity-js/web';

import { AccountsPage, DepositModal } from '../ui/AccountsPage';
import { Notifications } from '../ui/Notifications';
import { PocketsPage } from '../ui/PocketsPage';

/** "$ 150.000" (es-CO) o "$ 150,000" (en-US) → 150000. */
const amountShownIn = (element: Answerable<PageElement>, description: string) =>
  Question.about(description, async actor => {
    const text = await actor.answer(Text.of(element));
    return Number(text.replaceAll(/[^\d-]/g, ''));
  });

/** Lo que el actor ve en pantalla. */
export const ScreenQuestions = {
  notifications: () => Text.ofAll(Notifications.titles()),

  /** Ordenados alfabéticamente: el orden en pantalla depende del backend. */
  pocketNames: () =>
    Question.about('los nombres de los bolsillos en pantalla', async actor =>
      [...await actor.answer(Text.ofAll(PocketsPage.pocketNames()))].sort((a, b) => a.localeCompare(b))),

  pocketAmount: (name: string) => amountShownIn(PocketsPage.amountOf(name), `el saldo en pantalla del bolsillo "${ name }"`),

  accountBalance: () => amountShownIn(AccountsPage.balance(), 'el saldo de la cuenta en pantalla'),

  depositFormError: () => Text.of(DepositModal.error()),
};
