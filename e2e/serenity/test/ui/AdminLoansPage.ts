import { By, PageElement } from '@serenity-js/web';

export const AdminLoansPage = {
  headerTitle: () =>
    PageElement.located(By.css('h1')).describedAs('título de gestión de créditos'),

  refreshButton: () =>
    PageElement.located(By.id('btn-refresh-loans')).describedAs('botón Actualizar'),

  filterPending: () =>
    PageElement.located(By.id('filter-pending')).describedAs('filtro Pendientes'),

  filterApproved: () =>
    PageElement.located(By.id('filter-approved')).describedAs('filtro Aprobados'),

  loanCard: () =>
    PageElement.located(By.css('[data-testid="loan-card"], #loan-card')).describedAs('tarjeta de solicitud'),

  approveButton: () =>
    PageElement.located(By.css('#btn-approve, [data-testid="btn-approve"]')).describedAs('botón Aprobar'),

  rejectButton: () =>
    PageElement.located(By.css('#btn-reject, [data-testid="btn-reject"]')).describedAs('botón Rechazar'),

  statusBadge: () =>
    PageElement.located(By.css('#loan-status-badge, .status-badge')).describedAs('badge de estado de crédito'),

  feedbackMessage: () =>
    PageElement.located(By.id('admin-msg')).describedAs('mensaje administrativo'),
};
