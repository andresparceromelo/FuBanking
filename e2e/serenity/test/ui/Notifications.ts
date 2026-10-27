import { PageElements } from '@serenity-js/web';

import { byTestId } from './selectors';

/** Toasts de `ToastProvider` (se cierran solos a los 4 s). */
export const Notifications = {
  titles: () => PageElements.located(byTestId('toast-title')).describedAs('notificaciones'),
};
