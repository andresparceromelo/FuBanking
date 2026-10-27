import { Actor } from './cast';

const byTestId = (testId: string) => `[data-testid="${testId}"]`;
const escapeRegExp = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** "$ 150.000" (es-CO) o "$ 150,000" (en-US) → 150000. */
export const amountIn = (text: string) => Number(text.replaceAll(/[^\d-]/g, ''));

/** Formulario de `/login` (`LoginForm.tsx`). */
export const LoginScreen = {
  /**
   * Inicia sesión con las credenciales del actor. No marca "Recordarme", que es
   * lo que hace un usuario por defecto (vigila el defecto E2E-01).
   */
  signIn(actor: Actor) {
    cy.visit('/login');
    // Antes de hidratar, un clic envía el formulario de forma nativa.
    cy.get('form[data-hydrated="true"]').should('exist');
    cy.then(() => {
      cy.get('#email').type(actor.email!);
      cy.get('#password').type(actor.password!, { log: false });
    });
    cy.get('form button[type="submit"]').click();
    cy.location('pathname', { timeout: 30_000 }).should('eq', '/profile');
  },
};

/** Pantalla `/pockets` (`PocketsClient.tsx`). */
export const PocketsScreen = {
  open() {
    cy.visit('/pockets');
    // La cuenta se carga de forma asíncrona; sin ella el formulario no deja crear.
    cy.get('#account-select', { timeout: 30_000 }).should('not.have.value', '');
  },

  card(name: string) {
    return cy
      .contains(byTestId('pocket-card-name'), new RegExp(`^${escapeRegExp(name)}$`), { timeout: 15_000 })
      .parents(byTestId('pocket-card'));
  },

  createPocket(name: string, amount: number) {
    // type('') no está permitido en Cypress: un nombre vacío es dejar el campo sin tocar.
    if (name) {
      cy.get('#pocket-name').type(name);
    }
    cy.get('#pocket-amount').type(String(amount));
    cy.get(byTestId('create-pocket-button')).click();
  },

  renamePocket(from: string, to: string) {
    PocketsScreen.card(from).find(byTestId('edit-pocket-button')).click();
    cy.get('#edit-pocket-name').clear().type(to);
    cy.get(byTestId('save-pocket-button')).click();
  },

  removePocket(name: string) {
    PocketsScreen.card(name).find(byTestId('delete-pocket-button')).click();
    cy.get(byTestId('confirm-delete-pocket-button')).click();
  },

  transfer(amount: number, fromPocketId: string, toPocketId: string) {
    cy.get('#from-pocket-select').select(fromPocketId);
    cy.get('#to-pocket-select').select(toPocketId);
    cy.get('#transfer-amount').type(String(amount));
    cy.get(byTestId('transfer-pockets-button')).click();
  },

  amountOf(name: string) {
    return PocketsScreen.card(name).find(byTestId('pocket-card-amount')).invoke('text').then(amountIn);
  },

  pocketNames() {
    return cy.get(byTestId('pocket-card-name'));
  },

  emptyState() {
    return cy.get(byTestId('pockets-empty'), { timeout: 15_000 });
  },
};

/** Pantalla `/accounts` y modal de abono (`DepositWithdrawModal.tsx`). Cada cliente de prueba tiene una sola cuenta. */
export const AccountsScreen = {
  open() {
    cy.visit('/accounts');
    cy.get(byTestId('deposit-button'), { timeout: 30_000 }).first().should('be.visible');
  },

  deposit(amount: number) {
    cy.get(byTestId('account-card')).first().find(byTestId('deposit-button')).click();
    cy.get('#dw-amount').type(String(amount));
    cy.get(byTestId('dw-submit')).click();
  },

  balance() {
    return cy.get(byTestId('account-card')).first().find(byTestId('account-balance'));
  },

  formError() {
    return cy.get(byTestId('dw-error'));
  },
};

/** Toasts de `ToastProvider` (se cierran solos a los 4 s). */
export const Notifications = {
  titles() {
    return cy.get(byTestId('toast-title'), { timeout: 15_000 });
  },
};
