import { equals } from '@serenity-js/assertions';
import { By, PageElement, PageElements, Text } from '@serenity-js/web';

import { byTestId } from './selectors';

const pocketCard = (name: string) =>
  PageElements.located(byTestId('pocket-card'))
    .where(Text.of(PageElement.located(byTestId('pocket-card-name'))), equals(name))
    .first()
    .describedAs(`tarjeta del bolsillo "${ name }"`);

/** Pantalla /pockets (`frontend/src/features/pockets/components/PocketsClient.tsx`). */
export const PocketsPage = {
  accountSelect: () => PageElement.located(By.id('account-select')).describedAs('selector de cuenta'),

  newPocketName: () => PageElement.located(By.id('pocket-name')).describedAs('campo nombre del bolsillo'),
  newPocketAmount: () => PageElement.located(By.id('pocket-amount')).describedAs('campo monto inicial'),
  createButton: () => PageElement.located(byTestId('create-pocket-button')).describedAs('botón Crear bolsillo'),

  fromPocketSelect: () => PageElement.located(By.id('from-pocket-select')).describedAs('selector bolsillo origen'),
  toPocketSelect: () => PageElement.located(By.id('to-pocket-select')).describedAs('selector bolsillo destino'),
  transferAmount: () => PageElement.located(By.id('transfer-amount')).describedAs('campo monto a transferir'),
  transferButton: () => PageElement.located(byTestId('transfer-pockets-button')).describedAs('botón Transferir'),

  emptyState: () => PageElement.located(byTestId('pockets-empty')).describedAs('mensaje de cuenta sin bolsillos'),
  pocketNames: () => PageElements.located(byTestId('pocket-card-name')).describedAs('nombres de los bolsillos'),
  pocketCard,
  amountOf: (name: string) =>
    PageElement.located(byTestId('pocket-card-amount')).of(pocketCard(name)).describedAs(`saldo del bolsillo "${ name }"`),
  editButtonOf: (name: string) =>
    PageElement.located(byTestId('edit-pocket-button')).of(pocketCard(name)).describedAs(`botón Editar de "${ name }"`),
  deleteButtonOf: (name: string) =>
    PageElement.located(byTestId('delete-pocket-button')).of(pocketCard(name)).describedAs(`botón Eliminar de "${ name }"`),

  editName: () => PageElement.located(By.id('edit-pocket-name')).describedAs('campo nuevo nombre'),
  saveButton: () => PageElement.located(byTestId('save-pocket-button')).describedAs('botón Guardar'),
  confirmDeleteButton: () => PageElement.located(byTestId('confirm-delete-pocket-button')).describedAs('botón Sí, eliminar'),
};
