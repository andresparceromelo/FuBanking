import { By } from '@serenity-js/web';

export const byTestId = (testId: string) => By.css(`[data-testid="${ testId }"]`);
